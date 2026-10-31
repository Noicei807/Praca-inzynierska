import Fastify from 'fastify';
import { 
  saveBookToDb, 
  getLocalBooksFromDb, 
  updateBookQuantityInDb, 
  deleteBookFromDb, 
  findUserByEmailInDb, 
  registerUserInDb,
  checkBookAvailabilityInDb,
  createRentalInDb,
  decrementBookQuantityInDb,
  getUserRentalsFromDb,
  getPendingRentalsFromDb,
  approveRentalInDb
} from './db/index.js';
import { 
  dodajKsiazkeSchema, 
  pobierzKsiazkiQuerySchema, 
  wypozyczenieSchema,
  type NowaKsiazka,
  sukcesOdpowiedzSchema, 
  bladOdpowiedzSchema,
  idParamSchema, 
  edytujKsiazkeSchema,
  logowanieSchema, 
  rejestracjaSchema
} from '../shared/index.js';
import { 
  serializerCompiler, 
  validatorCompiler, 
  type ZodTypeProvider 
} from 'fastify-type-provider-zod';
import cors from '@fastify/cors';
import 'dotenv/config';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Rozszerzenie typów Fastify, aby TS widział obiekt request.user
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: number;
      rola: string;
      email?: string;
    };
  }
}
const fastify = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

fastify.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});

fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

// --- 1. CZYSTE FUNKCJE POMOCNICZE (Pure Functions) ---

const buildGoogleApiUrl = (query: string, apiKey: string = '') => {
  const klucz = apiKey ? `&key=${apiKey}` : '';
  return `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=40${klucz}`;
};

const extractBooks = (googleData: { items?: any[] }) => googleData.items ?? [];
const extractYear = (book: any): number | null => book?.volumeInfo?.publishedDate ? parseInt(String(book.volumeInfo.publishedDate).substring(0, 4), 10) : null;
const extractTitle = (book: any): string => String(book?.volumeInfo?.title || '').toLowerCase();
const extractFirstAuthor = (book: any): string => String(book?.volumeInfo?.authors?.[0] || '').toLowerCase();

const sprawdzCzyUzytkownikIstnieje = (uzytkownik: any) => {
  if (!uzytkownik) throw new Error('Niepoprawne dane logowania');
  return uzytkownik;
};

const sprawdzCzyZalogowany = (decoded: any) => {
  if (!decoded || !decoded.id) throw new Error('Odmowa dostępu. Zaloguj się.');
  return decoded;
};

const generujToken = (uzytkownik: any) => {
  const sekret = process.env.JWT_SECRET || 'tymczasowy-sekret-na-start-zmien-mnie';
  const token = jwt.sign({ id: uzytkownik.id, rola: uzytkownik.rola }, sekret, { expiresIn: '24h' });
  return { token, rola: uzytkownik.rola };
};

const sformatujOdpowiedz = (wiadomosc: string) => () => ({ wiadomosc });

const wyciagnijTokenZNaglowka = (request: any) => {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error('Brak tokenu autoryzacji');
  return authHeader.split(' ')[1];
};

const weryfikujToken = (token: string) => {
  const sekret = process.env.JWT_SECRET || 'tymczasowy-sekret-na-start-zmien-mnie';
  try {
    return jwt.verify(token, sekret) as any;
  } catch (error) {
    throw new Error('Nieważny lub wygasły token');
  }
};

const sprawdzRoleAdmina = (decoded: any) => {
  if (decoded.rola !== 'admin') throw new Error('Odmowa dostępu. Wymagane uprawnienia administratora.');
  return decoded;
};

// --- 2. FUNKCJE WYŻSZEGO RZĘDU (Currying) ---

const filterByYearRange = (minYear: number | null, maxYear: number | null) => (books: any[]) =>
  books.filter((book) => {
    const year = book.rok_wydania || extractYear(book);
    if (minYear && (!year || year < minYear)) return false;
    if (maxYear && (!year || year > maxYear)) return false;
    return true;
  });

const filterByLanguages = (languages: string[]) => (books: any[]) =>
  (!languages || languages.length === 0 || languages[0] === '') ? books : books.filter((book) => languages.includes(book?.volumeInfo?.language || book.jezyk));

const filterByCompleteness = (reqCover: boolean, reqAuthor: boolean, reqPublisher: boolean) => (books: any[]) =>
  books.filter((book) => {
    const info = book?.volumeInfo;
    const hasCover = info ? !!info?.imageLinks?.thumbnail : !!book.okladka_url;
    const hasAuthor = info ? (!!info?.authors && info.authors.length > 0) : !!book.autor;
    const hasPublisher = info ? !!info?.publisher : !!book.wydawnictwo;
    
    if (reqCover && !hasCover) return false;
    if (reqAuthor && !hasAuthor) return false;
    if (reqPublisher && !hasPublisher) return false;
    return true;
  });

const sortBooks = (sortType: string) => (books: any[]) => {
  const copy = [...books];
  switch (sortType) {
    case 'tytul-az': return copy.sort((a, b) => (a.tytul || extractTitle(a)).localeCompare(b.tytul || extractTitle(b), 'pl'));
    case 'tytul-za': return copy.sort((a, b) => (b.tytul || extractTitle(b)).localeCompare(a.tytul || extractTitle(a), 'pl'));
    case 'autor-az': return copy.sort((a, b) => (a.autor || extractFirstAuthor(a)).localeCompare(b.autor || extractFirstAuthor(b), 'pl'));
    case 'autor-za': return copy.sort((a, b) => (b.autor || extractFirstAuthor(b)).localeCompare(a.autor || extractFirstAuthor(a), 'pl'));
    case 'rok-rosnaco': return copy.sort((a, b) => (a.rok_wydania || extractYear(a) || 0) - (b.rok_wydania || extractYear(b) || 0));
    case 'rok-malejaco': return copy.sort((a, b) => (b.rok_wydania || extractYear(b) || 0) - (a.rok_wydania || extractYear(a) || 0));
    default: return copy;
  }
};

const paginateBooks = (page: number, limit: number) => (books: any[]) => {
  const totalItems = books.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * limit;

  return { items: books.slice(startIndex, startIndex + limit), currentPage, totalPages, totalItems };
};

const filterByLocalCategory = (kategoria: string) => (books: any[]) => {
  if (!kategoria) return books;
  const kat = kategoria.toLowerCase();
  
  return books.filter(k => {
    if (!k.kategoria) return false;
    const dbKat = k.kategoria.toLowerCase();
    const isFantastyka = kat === 'fantastyka' && (dbKat.includes('fiction') || dbKat.includes('fantasy'));
    const isKryminal = kat === 'kryminał' && (dbKat.includes('crime') || dbKat.includes('thriller') || dbKat.includes('mystery'));
    const isInformatyka = kat === 'informatyka' && (dbKat.includes('computer') || dbKat.includes('tech'));
    const isBiografie = kat === 'biografie' && dbKat.includes('biography');
    const isHistoria = kat === 'historia' && dbKat.includes('history');
    const isNauka = kat === 'nauka' && dbKat.includes('science');
    const isPsychologia = kat === 'psychologia' && dbKat.includes('psychology');
    const isRomans = kat === 'romans' && dbKat.includes('romance');
    
    return isFantastyka || isKryminal || isInformatyka || isBiografie || isHistoria || isNauka || isPsychologia || isRomans || dbKat.includes(kat);
  });
};

const porownajHaslo = (hasloSurowe: string) => async (uzytkownikZBazy: any) => {
  const czyZgodne = await bcrypt.compare(hasloSurowe, uzytkownikZBazy.haslo);
  if (!czyZgodne) throw new Error('Niepoprawne dane logowania');
  return uzytkownikZBazy;
};

const obsluzBladMiddleware = (reply: any) => (error: any) => {
  const statusCode = error.message.includes('Odmowa dostępu') ? 403 : 401;
  reply.status(statusCode).send({ error: error.message });
  return Promise.reject(error);
};

const obsluzBladAutoryzacji = (reply: any) => (error: any) => {
  const kodBledu = error.message === 'Niepoprawne dane logowania' ? 401 : 400;
  return reply.status(kodBledu).send({ error: error.message });
};

// --- 3. FUNKCJE EFEKTÓW UBOCZNYCH (Side-Effects) ---

const fetchGoogleData = async (url: string) => {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(`Odmowa z Google API: ${data.error?.message || response.statusText}`);
  return data;
};

const handleError = (reply: any) => (error: any) => {
  console.error('KRYTYCZNY BŁĄD W POTOKU:', error.message);
  return reply.status(500).send({ error: 'Błąd serwera', szczegoly: error.message });
};

const zahaszujHaslo = async (dane: any) => {
  const hash = await bcrypt.hash(dane.haslo, 10);
  return { ...dane, hasloHash: hash };
};

const autoryzacjaAdmina = (request: any, reply: any, done: Function) => {
  Promise.resolve(request)
    .then(wyciagnijTokenZNaglowka)
    .then(weryfikujToken)
    .then(sprawdzRoleAdmina)
    .then((decoded) => {
      request.user = decoded; 
      done(); 
    })
    .catch(obsluzBladMiddleware(reply));
};

const autoryzacjaUzytkownika = (request: any, reply: any, done: Function) => {
  Promise.resolve(request)
    .then(wyciagnijTokenZNaglowka)
    .then(weryfikujToken)
    .then(sprawdzCzyZalogowany)
    .then((decoded) => {
      request.user = decoded; 
      done(); 
    })
    .catch(obsluzBladMiddleware(reply));
};

const pobierzDateZaDwaMiesiace = () => {
  const data = new Date();
  data.setMonth(data.getMonth() + 2);
  return data;
};

const weryfikujDostepnoscKsiazkiDb = async (ksiazkaId: number) => {
  const ilosc = await checkBookAvailabilityInDb(ksiazkaId); 
  if (ilosc <= 0) throw new Error('Brak wolnych egzemplarzy');
  return ksiazkaId;
};

const zlecWypozyczenie = (uzytkownikId: number) => (ksiazkaId: number) => 
  createRentalInDb(uzytkownikId, ksiazkaId).then(() => ksiazkaId);

const zmniejszDostepnoscKsiazki = (ksiazkaId: number) => 
  decrementBookQuantityInDb(ksiazkaId).then(() => ksiazkaId); 

const zatwierdzIZmienDateDb = (wypozyczenieId: number) => 
  approveRentalInDb(wypozyczenieId, pobierzDateZaDwaMiesiace());


// --- 4. ENDPOINTY (Potoki funkcyjne) ---

fastify.post('/api/auth/rejestracja', { schema: { body: rejestracjaSchema } }, (request, reply) => {
  return Promise.resolve(request.body as any)
    .then(zahaszujHaslo)
    .then((d) => registerUserInDb(d.imie, d.nazwisko, d.email, d.hasloHash))
    .then(sformatujOdpowiedz('Konto zostało pomyślnie utworzone'))
    .then(wynik => reply.send(wynik))
    .catch(obsluzBladAutoryzacji(reply));
});

fastify.post('/api/auth/logowanie', { schema: { body: logowanieSchema } }, (request, reply) => {
  const dane = request.body as any;
  return Promise.resolve(dane.email)
    .then(findUserByEmailInDb)
    .then(sprawdzCzyUzytkownikIstnieje)
    .then(porownajHaslo(dane.haslo))
    .then(generujToken)
    .then(wynik => reply.send(wynik))
    .catch(obsluzBladAutoryzacji(reply));
});

fastify.get('/api/ksiazki', { schema: { querystring: pobierzKsiazkiQuerySchema } }, (request, reply) => {
  const params = request.query;
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY || '';
  return Promise.resolve(buildGoogleApiUrl(params.kategoria, apiKey))
    .then(fetchGoogleData)
    .then(extractBooks)
    .then(filterByYearRange(params.rokOd, params.rokDo))
    .then(filterByLanguages(params.jezyki))
    .then(filterByCompleteness(params.tylkoOkladka, params.tylkoAutor, params.tylkoWydawnictwo))
    .then(sortBooks(params.sortowanie))
    .then(paginateBooks(params.strona, params.limit))
    .then(result => reply.send(result))
    .catch(handleError(reply));
});

fastify.post('/api/ksiazki', {
  schema: { body: dodajKsiazkeSchema, response: { 200: sukcesOdpowiedzSchema, 500: bladOdpowiedzSchema } },
  preHandler: autoryzacjaAdmina
}, (request, reply) =>
  Promise.resolve(request.body as NowaKsiazka)
    .then(saveBookToDb)
    .then(dbResult => {
      if (!dbResult.sukces) return { error: 'Błąd zapisu', szczegoly: dbResult.error }; 
      return { wiadomosc: 'Książka dodana pomyślnie!' };
    })
);

fastify.get('/api/ksiazki/lokalne', { schema: { querystring: pobierzKsiazkiQuerySchema } }, (request, reply) => {
  const params = request.query as any;
  const standardoweKategorie = ['fantastyka', 'kryminał', 'informatyka', 'biografie', 'historia', 'nauka', 'psychologia', 'romans'];
  const czyWyszukiwanie = !standardoweKategorie.includes(params.kategoria);
  
  const fraza = czyWyszukiwanie ? params.kategoria : '';
  const wybranaKategoria = czyWyszukiwanie ? null : params.kategoria;
  
  const sprawdzanyRokOd = params.rokOd ? parseInt(params.rokOd) : null;
  const sprawdzanyRokDo = params.rokDo ? parseInt(params.rokDo) : null;
  const sprawdzaneJezyki = typeof params.jezyki === 'string' ? params.jezyki.split(',') : params.jezyki;
  const czyOkladka = params.tylkoOkladka === 'true' || params.tylkoOkladka === true;
  const czyAutor = params.tylkoAutor === 'true' || params.tylkoAutor === true;
  const czyWydawnictwo = params.tylkoWydawnictwo === 'true' || params.tylkoWydawnictwo === true;

  return Promise.resolve(fraza)
    .then(getLocalBooksFromDb)
    .then(filterByLocalCategory(wybranaKategoria))
    .then(filterByCompleteness(czyOkladka, czyAutor, czyWydawnictwo))
    .then(filterByYearRange(sprawdzanyRokOd, sprawdzanyRokDo))
    .then(filterByLanguages(sprawdzaneJezyki))
    .then(sortBooks(params.sortowanie))
    .then(paginateBooks(params.strona, params.limit)) 
    .then(result => reply.send(result))
    .catch(handleError(reply));
});

fastify.put('/api/ksiazki/lokalne/:id', {
  schema: { params: idParamSchema, body: edytujKsiazkeSchema },
  preHandler: autoryzacjaAdmina 
}, (request, reply) => {
  return Promise.resolve()
    .then(() => updateBookQuantityInDb(request.params.id, request.body.ilosc))
    .then(dbResult => {
      if (!dbResult.sukces) return reply.status(500).send({ error: 'Błąd bazy', szczegoly: dbResult.error });
      return reply.send({ wiadomosc: 'Ilość zaktualizowana pomyślnie' });
    });
});

fastify.delete('/api/ksiazki/lokalne/:id', {
  schema: { params: idParamSchema },
  preHandler: autoryzacjaAdmina 
}, (request, reply) => {
  return Promise.resolve()
    .then(() => deleteBookFromDb(request.params.id))
    .then(dbResult => {
      if (!dbResult.sukces) return reply.status(500).send({ error: 'Błąd bazy', szczegoly: dbResult.error });
      return reply.send({ wiadomosc: 'Książka usunięta pomyślnie' });
    });
});

// --- NOWE ENDPOINTY: WYPOŻYCZENIA ---

fastify.post('/api/wypozyczenia', {
  schema: { body: wypozyczenieSchema },
  preHandler: autoryzacjaUzytkownika
}, (request, reply) => {
  const payload = request.body as any;
  return Promise.resolve(payload.ksiazka_id)
    .then(weryfikujDostepnoscKsiazkiDb)
    .then(zlecWypozyczenie(request.user!.id)) // <-- Dodany wykrzyknik
    .then(zmniejszDostepnoscKsiazki)
    .then(sformatujOdpowiedz('Książka oczekuje na zatwierdzenie przez admina'))
    .then(wynik => reply.send(wynik))
    .catch(obsluzBladAutoryzacji(reply));
});

fastify.get('/api/wypozyczenia/moje', { preHandler: autoryzacjaUzytkownika }, (request, reply) => {
  return Promise.resolve(request.user!.id) // <-- Dodany wykrzyknik
    .then(getUserRentalsFromDb) 
    .then(wynik => reply.send(wynik))
    .catch(handleError(reply));
});

fastify.get('/api/wypozyczenia/oczekujace', { preHandler: autoryzacjaAdmina }, (request, reply) => {
  return Promise.resolve()
    .then(getPendingRentalsFromDb)
    .then(wynik => reply.send(wynik))
    .catch(handleError(reply));
});

fastify.put('/api/wypozyczenia/zatwierdz/:id', {
  schema: { params: idParamSchema },
  preHandler: autoryzacjaAdmina
}, (request, reply) => {
  const params = request.params as any;
  return Promise.resolve(params.id)
    .then(zatwierdzIZmienDateDb)
    .then(sformatujOdpowiedz('Wypożyczenie zostało zatwierdzone. Czas na oddanie: 2 miesiące.'))
    .then(wynik => reply.send(wynik))
    .catch(handleError(reply));
});

// --- 5. URUCHOMIENIE SERWERA ---
fastify.listen({ port: 3001 }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log('Serwer nasłuchuje na porcie 3001...');
});