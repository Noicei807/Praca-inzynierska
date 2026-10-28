import { z } from 'zod';

// Współdzielony kontrakt API dla dodawania książki (metoda POST)
export const dodajKsiazkeSchema = z.object({
  tytul: z.string().min(1, "Tytuł jest wymagany"),
  autor: z.string().min(1, "Autor jest wymagany"),
  google_books_id: z.string().optional(),
  ilosc: z.number().int().min(1, "Ilość musi wynosić przynajmniej 1"),
  
  // Nowe, opcjonalne pola dla bazy
  wydawnictwo: z.string().nullable().optional(),
  rok_wydania: z.number().int().nullable().optional(),
  jezyk: z.string().nullable().optional(),
  kategoria: z.string().nullable().optional(),
  okladka_url: z.string().nullable().optional()
});

export type NowaKsiazka = z.infer<typeof dodajKsiazkeSchema>;

// Współdzielony kontrakt API dla filtrowania, wyszukiwania i paginacji (metoda GET)
export const pobierzKsiazkiQuerySchema = z.object({
  kategoria: z.string().default('fantastyka'),
  rokOd: z.string().optional().transform((v) => (v ? parseInt(v, 10) : null)),
  rokDo: z.string().optional().transform((v) => (v ? parseInt(v, 10) : null)),
  sortowanie: z.enum([
    'brak', 'tytul-az', 'tytul-za', 'autor-az', 'autor-za', 'rok-rosnaco', 'rok-malejaco'
  ]).default('brak'),
  jezyki: z.string().default('').transform((v) => v.split(',').filter(Boolean)),
  tylkoOkladka: z.string().optional().transform((v) => v === 'true'),
  tylkoAutor: z.string().optional().transform((v) => v === 'true'),
  tylkoWydawnictwo: z.string().optional().transform((v) => v === 'true'),
  strona: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(40).default(8)
});

// Współdzielone kontrakty odpowiedzi z serwera 
export const sukcesOdpowiedzSchema = z.object({
  wiadomosc: z.string()
});

export const bladOdpowiedzSchema = z.object({
  error: z.string(),
  szczegoly: z.any().optional()
});

export type PobierzKsiazkiQuery = z.infer<typeof pobierzKsiazkiQuerySchema>;

// --- Panel modyfikacji bazy---

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive("ID musi być liczbą dodatnią")
});

export const edytujKsiazkeSchema = z.object({
  ilosc: z.number().int().min(0, "Ilość nie może być ujemna")
});