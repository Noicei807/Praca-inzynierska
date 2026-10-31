import mysql from 'mysql2/promise';
import 'dotenv/config';
import { type NowaKsiazka } from '../../shared/index.js';

const dbUrl = process.env.DB_URL || 'mysql://root:rootpassword@localhost:3306/wypozyczalnia';
export const pool = mysql.createPool(dbUrl);

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

export const getLocalBooksFromDb = (szukanaFraza: string = '') => {
  const query = szukanaFraza 
    ? `SELECT * FROM ksiazki WHERE tytul LIKE ? OR autor LIKE ?` 
    : `SELECT * FROM ksiazki`;
  const params = szukanaFraza ? [`%${szukanaFraza}%`, `%${szukanaFraza}%`] : [];
  
  return pool.execute(query, params).then(([rows]) => rows as any[]);
};

export const updateBookQuantityInDb = (id: number, nowaIlosc: number) =>
  pool.execute(`UPDATE ksiazki SET ilosc = ? WHERE id = ?`, [nowaIlosc, id])
    .then(() => ({ sukces: true as const }))
    .catch((error) => ({ sukces: false as const, error }));

export const deleteBookFromDb = (id: number) =>
  pool.execute(`DELETE FROM ksiazki WHERE id = ?`, [id])
    .then(() => ({ sukces: true as const }))
    .catch((error) => ({ sukces: false as const, error }));

export const findUserByEmailInDb = (email: string) =>
  pool.execute(`SELECT * FROM uzytkownicy WHERE email = ?`, [email])
    .then(([rows]: any) => rows.length > 0 ? rows[0] : null);

export const registerUserInDb = (imie: string, nazwisko: string, email: string, hasloHash: string) =>
  pool.execute(
    `INSERT INTO uzytkownicy (imie, nazwisko, email, haslo) VALUES (?, ?, ?, ?)`,
    [imie, nazwisko, email, hasloHash]
  )
  .then(() => ({ sukces: true as const }))
  .catch((error: any) => {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('Konto z takim adresem e-mail już istnieje.');
    }
    throw error;
  });

// --- FUNKCJE DLA SYSTEMU WYPOŻYCZEŃ

const wyciagnijIloscZPierwszegoWiersza = (rows: mysql.RowDataPacket[]) => {
  const ksiazka = rows.length > 0 ? rows[0] : null;
  if (!ksiazka) throw new Error('Książka nie istnieje');  
  return ksiazka.ilosc as number;
};

export const checkBookAvailabilityInDb = (ksiazkaId: number) =>
  pool.query<mysql.RowDataPacket[]>('SELECT ilosc FROM ksiazki WHERE id = ?', [ksiazkaId])
    .then(([rows]) => wyciagnijIloscZPierwszegoWiersza(rows));

export const createRentalInDb = (uzytkownikId: number, ksiazkaId: number) =>
  pool.query<mysql.ResultSetHeader>(
    'INSERT INTO wypozyczenia (uzytkownik_id, ksiazka_id, status) VALUES (?, ?, ?)',
    [uzytkownikId, ksiazkaId, 'oczekujace']
  ).then(([result]) => result);

export const decrementBookQuantityInDb = (ksiazkaId: number) =>
  pool.query<mysql.ResultSetHeader>(
    'UPDATE ksiazki SET ilosc = ilosc - 1 WHERE id = ?',
    [ksiazkaId]
  ).then(([result]) => result);

export const getUserRentalsFromDb = (uzytkownikId: number) =>
  pool.query<mysql.RowDataPacket[]>(`
    SELECT 
      w.id as wypozyczenie_id, 
      w.data_wypozyczenia, 
      w.data_zwrotu, 
      w.status, 
      k.id as ksiazka_id, 
      k.tytul, 
      k.autor, 
      k.okladka_url 
    FROM wypozyczenia w
    JOIN ksiazki k ON w.ksiazka_id = k.id
    WHERE w.uzytkownik_id = ?
    ORDER BY w.data_wypozyczenia DESC
  `, [uzytkownikId]).then(([rows]) => rows);

export const getPendingRentalsFromDb = () =>
  pool.query<mysql.RowDataPacket[]>(`
    SELECT 
      w.id as wypozyczenie_id, 
      w.data_wypozyczenia,
      u.imie, 
      u.nazwisko, 
      u.email,
      k.tytul, 
      k.autor, 
      k.okladka_url
    FROM wypozyczenia w
    JOIN uzytkownicy u ON w.uzytkownik_id = u.id
    JOIN ksiazki k ON w.ksiazka_id = k.id
    WHERE w.status = 'oczekujace'
    ORDER BY w.data_wypozyczenia ASC
  `).then(([rows]) => rows);

export const approveRentalInDb = (wypozyczenieId: number, dataZwrotu: Date) =>
  pool.query<mysql.ResultSetHeader>(
    'UPDATE wypozyczenia SET status = ?, data_zwrotu = ? WHERE id = ?',
    ['wypozyczone', dataZwrotu, wypozyczenieId]
  ).then(([result]) => result);