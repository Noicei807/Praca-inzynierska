import Fastify from 'fastify';
import { saveBookToDb } from './db/index.js';
import { 
  dodajKsiazkeSchema, 
  pobierzKsiazkiQuerySchema, 
  type NowaKsiazka 
} from '../shared/index.js';
import { 
  serializerCompiler, 
  validatorCompiler, 
  type ZodTypeProvider 
} from 'fastify-type-provider-zod';
import cors from '@fastify/cors';
import 'dotenv/config';

const fastify = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

fastify.register(cors, {
  origin: 'http://localhost:3000'
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

const createSuccessMessage = () => ({
  wiadomosc: 'Książka dodana pomyślnie'
});

// --- 3. FUNKCJE EFEKTÓW UBOCZNYCH (Side-Effects) ---

const fetchGoogleData = (url: string) =>
  fetch(url).then(response => response.json());

const handleError = (reply: any) => (error: any) => {
  console.error('Blad API:', error);
  return reply.status(500).send({ error: 'Błąd serwera przy przetwarzaniu żądania' });
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
  schema: { body: dodajKsiazkeSchema }
}, (request, reply) =>
  Promise.resolve(request.body as NowaKsiazka)
    .then(saveBookToDb)
    .then(createSuccessMessage)
    .then(response => reply.send(response))
    .catch(handleError(reply))
);

fastify.listen({ port: 3001 }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});