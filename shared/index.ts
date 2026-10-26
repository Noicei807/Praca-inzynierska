import { z } from 'zod';

// Współdzielony kontrakt API dla dodawania książki (POST)
export const dodajKsiazkeSchema = z.object({
  tytul: z.string().min(1, "Tytuł nie może być pusty"),
  autor: z.string().min(1, "Autor nie może być pusty"),
  google_books_id: z.string().optional(),
  ilosc: z.number({ message: "Podaj poprawną ilość egzemplarzy" })
    .int("Ilość musi być liczbą całkowitą")
    .min(1, "Ilość musi wynosić co najmniej 1")
});

export type NowaKsiazka = z.infer<typeof dodajKsiazkeSchema>;

// Współdzielony kontrakt API dla filtrowania, wyszukiwania i paginacji (GET)
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

export type PobierzKsiazkiQuery = z.infer<typeof pobierzKsiazkiQuerySchema>;