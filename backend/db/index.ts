import mysql from 'mysql2/promise';
import 'dotenv/config';
import { type NowaKsiazka } from '../../shared/index.js';

const dbUrl = process.env.DB_URL || 'mysql://root:rootpassword@localhost:3306/wypozyczalnia';
const pool = mysql.createPool(dbUrl);

export const saveBookToDb = (ksiazka: NowaKsiazka) =>
  pool.execute(
    `INSERT INTO ksiazki (tytul, autor, google_books_id, ilosc) 
     VALUES (?, ?, ?, ?) 
     ON DUPLICATE KEY UPDATE 
       ilosc = ilosc + VALUES(ilosc),
       tytul = VALUES(tytul),
       autor = VALUES(autor)`,
    [ksiazka.tytul, ksiazka.autor, ksiazka.google_books_id || null, ksiazka.ilosc]
  );