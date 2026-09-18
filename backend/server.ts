import Fastify from 'fastify';
import { pool } from './db/index.js';
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import cors from '@fastify/cors'; //usuniecie bledu CORS (pojawil sie po polaczeniu frontendu z backendem)
import 'dotenv/config'; // wczytanie klucza .env

// Inicjalizacja fastify z obsluga kontraktow zod
const fastify = Fastify({ logger: true }).withTypeProvider();

//usuniecie bledu CORS - wpuszczenie na port 3000
fastify.register(cors, {
  origin: 'http://localhost:3000' 
});

fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

// Definicja kontraktu (jak musi wyglądać nowa ksiazka)
const dodajKsiazkeSchema = z.object({
  tytul: z.string().min(1, "Tytuł nie może być pusty"),
  autor: z.string().min(1, "Autor nie może być pusty"),
  google_books_id: z.string().optional()
});

const buildGoogleApiUrl = (category: string, apiKey: string = '') => 
  `https://www.googleapis.com/books/v1/volumes?q=${category}&maxResults=8&key=${apiKey}`;

const fetchGoogleData = (url: string) => 
  fetch(url).then(response => response.json());

const extractBooks = (googleData: { items?: any[] }) => {
  const items = googleData.items || [];
  // Wyświetlamy w konsoli strukturę volumeInfo książki
  if (items.length > 0) {
    console.log('Struktura volumeInfo pierwszego wyniku:', items[0].volumeInfo);
  }
  return items;
};

const handleError = (reply: any) => (error: any) => {
  console.error('Blad API:', error);
  return reply.status(500).send({ error: 'Błąd serwera przy pobieraniu książek' });
};

// Endpoint zwracający listę książek z Google API (metoda GET)
fastify.get('/api/ksiazki', (request: any, reply: any) => {
  const kategoria = request.query.kategoria || 'fantastyka';
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const url = `https://www.googleapis.com/books/v1/volumes?q=subject:${kategoria}&maxResults=8&key=${apiKey}`;
  return Promise.resolve(buildGoogleApiUrl(kategoria, apiKey))
    .then(fetchGoogleData)
    .then(extractBooks)
    .then(books => reply.send(books))
    .catch(handleError(reply));
});

// Endpoint przyjmujacy dane (metoda POST)
fastify.post('/api/ksiazki', {
  schema: { body: dodajKsiazkeSchema }
}, async (request, reply) => {
  const { tytul, autor, google_books_id } = request.body as z.infer<typeof dodajKsiazkeSchema>;
  await pool.query(
    'INSERT INTO ksiazki (tytul, autor, google_books_id) VALUES (?, ?, ?)',
    [tytul, autor, google_books_id || null]
  );

  return { wiadomosc: 'Książka dodana pomyślnie' };
});

// Uruchomienie serwera
fastify.listen({ port: 3001 }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});