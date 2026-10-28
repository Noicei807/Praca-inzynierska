import mysql from 'mysql2/promise';
import 'dotenv/config';
import { type NowaKsiazka } from '../../shared/index.js';

const dbUrl = process.env.DB_URL || 'mysql://root:rootpassword@localhost:3306/wypozyczalnia';
export const pool = mysql.createPool(dbUrl); // Dodany export dla migrate.ts

// Funkcyjne opakowanie zapytania do bazy
export const saveBookToDb = (ksiazka: NowaKsiazka) =>
  pool.execute<mysql.ResultSetHeader>(
    `INSERT INTO ksiazki (tytul, autor, google_books_id, ilosc, wydawnictwo, rok_wydania, jezyk, kategoria, okladka_url) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
     ON DUPLICATE KEY UPDATE 
       ilosc = ilosc + VALUES(ilosc),
       tytul = VALUES(tytul),
       autor = VALUES(autor),
       wydawnictwo = VALUES(wydawnictwo),
       rok_wydania = VALUES(rok_wydania),
       jezyk = VALUES(jezyk),
       kategoria = VALUES(kategoria),
       okladka_url = VALUES(okladka_url)`,
    [
      ksiazka.tytul, 
      ksiazka.autor, 
      ksiazka.google_books_id || null, 
      ksiazka.ilosc,
      ksiazka.wydawnictwo || null,
      ksiazka.rok_wydania || null,
      ksiazka.jezyk || null,
      ksiazka.kategoria || null,
      ksiazka.okladka_url || null
    ]
  )
  .then(([result]) => ({ sukces: true as const, id: result.insertId }))
  .catch((error) => ({ sukces: false as const, error }));

  // Pobieranie wszystkich książek z bazy (lub wyszukiwanie po tytule/autorze)
export const getLocalBooksFromDb = (szukanaFraza: string = '') => {
  const query = szukanaFraza 
    ? `SELECT * FROM ksiazki WHERE tytul LIKE ? OR autor LIKE ?` 
    : `SELECT * FROM ksiazki`;
  const params = szukanaFraza ? [`%${szukanaFraza}%`, `%${szukanaFraza}%`] : [];
  
  return pool.execute(query, params).then(([rows]) => rows as any[]);
};

// Zmiana ilości egzemplarzy
export const updateBookQuantityInDb = (id: number, nowaIlosc: number) =>
  pool.execute(`UPDATE ksiazki SET ilosc = ? WHERE id = ?`, [nowaIlosc, id])
    .then(() => ({ sukces: true as const }))
    .catch((error) => ({ sukces: false as const, error }));

// Usunięcie książki
export const deleteBookFromDb = (id: number) =>
  pool.execute(`DELETE FROM ksiazki WHERE id = ?`, [id])
    .then(() => ({ sukces: true as const }))
    .catch((error) => ({ sukces: false as const, error }));