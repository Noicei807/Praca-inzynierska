import Fastify from 'fastify';
import { saveBookToDb } from './db/index.js';
import { 
  dodajKsiazkeSchema, 
  pobierzKsiazkiQuerySchema, 
  type NowaKsiazka,
  sukcesOdpowiedzSchema, 
  bladOdpowiedzSchema,
  idParamSchema, 
  edytujKsiazkeSchema 
} from '../shared/index.js';
import { getLocalBooksFromDb, updateBookQuantityInDb, deleteBookFromDb } from './db/index.js';
import { 
  serializerCompiler, 
  validatorCompiler, 
  type ZodTypeProvider 
} from 'fastify-type-provider-zod';
import cors from '@fastify/cors';
import 'dotenv/config';

const fastify = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

// Konfiguracja CORS - pozwalamy na wszystkie metody HTTP
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

const extractBooks = (googleData: { items?: any[] }) =>
  googleData.items ?? [];

const extractYear = (book: any): number | null => {
  const dateStr = book?.volumeInfo?.publishedDate;
  return dateStr ? parseInt(String(dateStr).substring(0, 4), 10) : null;
};

const extractTitle = (book: any): string =>
  String(book?.volumeInfo?.title || '').toLowerCase();

const extractFirstAuthor = (book: any): string =>
  String(book?.volumeInfo?.authors?.[0] || '').toLowerCase();


// --- 2. FUNKCJE WYŻSZEGO RZĘDU: FILTROWANIE, SORTOWANIE I PAGINACJA (Currying) ---

const filterByYearRange = (minYear: number | null, maxYear: number | null) => (books: any[]) =>
  books.filter((book) => {
    const year = extractYear(book);
    if (minYear && (!year || year < minYear)) return false;
    if (maxYear && (!year || year > maxYear)) return false;
    return true;
  });

const filterByLanguages = (languages: string[]) => (books: any[]) =>
  languages.length === 0
    ? books
    : books.filter((book) => languages.includes(book?.volumeInfo?.language));

const filterByCompleteness = (reqCover: boolean, reqAuthor: boolean, reqPublisher: boolean) => (books: any[]) =>
  books.filter((book) => {
    const info = book?.volumeInfo;
    if (reqCover && !info?.imageLinks?.thumbnail) return false;
    if (reqAuthor && (!info?.authors || info.authors.length === 0)) return false;
    if (reqPublisher && !info?.publisher) return false;
    return true;
  });

const sortBooks = (sortType: string) => (books: any[]) => {
  const copy = [...books];
  switch (sortType) {
    case 'tytul-az':
      return copy.sort((a, b) => extractTitle(a).localeCompare(extractTitle(b), 'pl'));
    case 'tytul-za':
      return copy.sort((a, b) => extractTitle(b).localeCompare(extractTitle(a), 'pl'));
    case 'autor-az':
      return copy.sort((a, b) => extractFirstAuthor(a).localeCompare(extractFirstAuthor(b), 'pl'));
    case 'autor-za':
      return copy.sort((a, b) => extractFirstAuthor(b).localeCompare(extractFirstAuthor(a), 'pl'));
    case 'rok-rosnaco':
      return copy.sort((a, b) => (extractYear(a) || 0) - (extractYear(b) || 0));
    case 'rok-malejaco':
      return copy.sort((a, b) => (extractYear(b) || 0) - (extractYear(a) || 0));
    default:
      return copy;
  }
};

const paginateBooks = (page: number, limit: number) => (books: any[]) => {
  const totalItems = books.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * limit;

  return {
    items: books.slice(startIndex, startIndex + limit),
    currentPage,
    totalPages,
    totalItems
  };
};


// --- 3. FUNKCJE EFEKTÓW UBOCZNYCH (Side-Effects) ---

const fetchGoogleData = async (url: string) => {
  console.log('-> Pobieram dane z URL:', url); 
  const response = await fetch(url);
  const data = await response.json();
  
  if (!response.ok || data.error) {
    throw new Error(`Odmowa z Google API: ${data.error?.message || response.statusText}`);
  }
  
  return data;
};

const handleError = (reply: any) => (error: any) => {
  console.error('KRYTYCZNY BŁĄD W POTOKU:', error.message);
  return reply.status(500).send({ 
    error: 'Błąd serwera przy przetwarzaniu żądania', 
    szczegoly: error.message 
  });
};


// --- 4. ENDPOINTY (Potoki funkcyjne z kontraktami Zod) ---

fastify.get('/api/ksiazki', {
  schema: { querystring: pobierzKsiazkiQuerySchema }
}, (request, reply) => {
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
  schema: { 
    body: dodajKsiazkeSchema,
    response: {
      200: sukcesOdpowiedzSchema,
      500: bladOdpowiedzSchema
    }
  }
}, (request, reply) =>
  Promise.resolve(request.body as NowaKsiazka)
    .then(saveBookToDb)
    .then(dbResult => {
      if (!dbResult.sukces) {
        request.log.error(dbResult.error);
        reply.status(500); 
        return { error: 'Błąd przy zapisie do bazy danych', szczegoly: dbResult.error }; 
      }
      return { wiadomosc: 'Książka dodana pomyślnie!' };
    })
);

// --- ENDPOINTY LOKALNEJ BAZY (Modyfikacja) ---

fastify.get('/api/ksiazki/lokalne', {
  schema: { querystring: pobierzKsiazkiQuerySchema } 
}, (request, reply) => {
  const params = request.query as any;
  
  const standardoweKategorie = ['fantastyka', 'kryminał', 'informatyka', 'biografie', 'historia', 'nauka', 'psychologia', 'romans'];
  const czyWyszukiwanie = !standardoweKategorie.includes(params.kategoria);

  const fraza = czyWyszukiwanie ? params.kategoria : '';
  const wybranaKategoria = czyWyszukiwanie ? null : params.kategoria;

  return Promise.resolve(fraza)
    .then(getLocalBooksFromDb)
    .then(ksiazki => {
      let wynik = ksiazki;

      // TŁUMACZ KATEGORII
      if (wybranaKategoria) {
        const kat = wybranaKategoria.toLowerCase();
        wynik = wynik.filter(k => {
          if (!k.kategoria) return false;
          const dbKat = k.kategoria.toLowerCase();
          
          if (kat === 'fantastyka' && (dbKat.includes('fiction') || dbKat.includes('fantasy'))) return true;
          if (kat === 'kryminał' && (dbKat.includes('crime') || dbKat.includes('thriller') || dbKat.includes('mystery'))) return true;
          if (kat === 'informatyka' && (dbKat.includes('computer') || dbKat.includes('tech'))) return true;
          if (kat === 'biografie' && dbKat.includes('biography')) return true;
          if (kat === 'historia' && dbKat.includes('history')) return true;
          if (kat === 'nauka' && dbKat.includes('science')) return true;
          if (kat === 'psychologia' && dbKat.includes('psychology')) return true;
          if (kat === 'romans' && dbKat.includes('romance')) return true;
          
          return dbKat.includes(kat);
        });
      }

      // NAPRAWA BOOLEANÓW
      if (params.tylkoOkladka === 'true' || params.tylkoOkladka === true) {
        wynik = wynik.filter(k => k.okladka_url !== null && k.okladka_url !== '');
      }
      if (params.tylkoAutor === 'true' || params.tylkoAutor === true) {
        wynik = wynik.filter(k => k.autor !== null && k.autor !== '');
      }
      if (params.tylkoWydawnictwo === 'true' || params.tylkoWydawnictwo === true) {
        wynik = wynik.filter(k => k.wydawnictwo !== null && k.wydawnictwo !== '');
      }

      const sprawdzanyRokOd = params.rokOd ? parseInt(params.rokOd) : null;
      const sprawdzanyRokDo = params.rokDo ? parseInt(params.rokDo) : null;
      const sprawdzaneJezyki = typeof params.jezyki === 'string' ? params.jezyki.split(',') : params.jezyki;

      if (sprawdzanyRokOd) wynik = wynik.filter(k => k.rok_wydania !== null && k.rok_wydania >= sprawdzanyRokOd);
      if (sprawdzanyRokDo) wynik = wynik.filter(k => k.rok_wydania !== null && k.rok_wydania <= sprawdzanyRokDo);
      if (sprawdzaneJezyki && sprawdzaneJezyki.length > 0 && sprawdzaneJezyki[0] !== '') {
        wynik = wynik.filter(k => k.jezyk !== null && sprawdzaneJezyki.includes(k.jezyk));
      }

      if (params.sortowanie === 'tytul-az') wynik.sort((a, b) => a.tytul.localeCompare(b.tytul, 'pl'));
      if (params.sortowanie === 'tytul-za') wynik.sort((a, b) => b.tytul.localeCompare(a.tytul, 'pl'));

      return wynik;
    })
    .then(paginateBooks(params.strona, params.limit)) 
    .then(result => reply.send(result))
    .catch(handleError(reply));
});

// Aktualizacja ilości
fastify.put('/api/ksiazki/lokalne/:id', {
  schema: { params: idParamSchema, body: edytujKsiazkeSchema }
}, (request, reply) => {
  return Promise.resolve()
    .then(() => updateBookQuantityInDb(request.params.id, request.body.ilosc))
    .then(dbResult => {
      if (!dbResult.sukces) return reply.status(500).send({ error: 'Błąd bazy', szczegoly: dbResult.error });
      return reply.send({ wiadomosc: 'Ilość zaktualizowana pomyślnie' });
    });
});

// Usuwanie książki
fastify.delete('/api/ksiazki/lokalne/:id', {
  schema: { params: idParamSchema }
}, (request, reply) => {
  return Promise.resolve()
    .then(() => deleteBookFromDb(request.params.id))
    .then(dbResult => {
      if (!dbResult.sukces) return reply.status(500).send({ error: 'Błąd bazy', szczegoly: dbResult.error });
      return reply.send({ wiadomosc: 'Książka usunięta pomyślnie' });
    });
});

// --- 5. URUCHOMIENIE SERWERA 

fastify.listen({ port: 3001 }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log('Serwer nasłuchuje na porcie 3001...');
});