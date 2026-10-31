import { z } from 'zod';

// --- KSIĄŻKI ---
export const dodajKsiazkeSchema = z.object({
  tytul: z.string().min(1, "Tytuł jest wymagany"),
  autor: z.string().min(1, "Autor jest wymagany"),
  google_books_id: z.string().optional(),
  ilosc: z.number().int().min(1, "Ilość musi wynosić przynajmniej 1"),
  
  wydawnictwo: z.string().nullable().optional(),
  rok_wydania: z.number().int().nullable().optional(),
  jezyk: z.string().nullable().optional(),
  kategoria: z.string().nullable().optional(),
  okladka_url: z.string().nullable().optional()
});

export type NowaKsiazka = z.infer<typeof dodajKsiazkeSchema>;

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

export const sukcesOdpowiedzSchema = z.object({
  wiadomosc: z.string()
});

export const bladOdpowiedzSchema = z.object({
  error: z.string(),
  szczegoly: z.any().optional()
});

// --- PANEL MODYFIKACJI ---
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive("ID musi być liczbą dodatnią")
});

export const edytujKsiazkeSchema = z.object({
  ilosc: z.number().int().min(0, "Ilość nie może być ujemna")
});

export const googleIdParamSchema = z.object({
  googleId: z.string().min(1, "Brak ID z Google Books")
});

// --- AUTORYZACJA
export const rejestracjaSchema = z.object({
  imie: z.string().min(2, "Imię musi mieć min. 2 znaki"),
  nazwisko: z.string().min(2, "Nazwisko musi mieć min. 2 znaki"),
  email: z.string().email("Niepoprawny format adresu e-mail"),
  haslo: z.string().min(6, "Hasło musi mieć min. 6 znaków")
});

export const logowanieSchema = z.object({
  email: z.string().email("Niepoprawny adres e-mail"),
  haslo: z.string().min(1, "Hasło jest wymagane")
});

export const wypozyczenieSchema = z.object({
  ksiazka_id: z.number().int().positive("Nieprawidłowe ID książki")
});