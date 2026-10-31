import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const setupDatabase = async () => {
  // Pobieramy cały link z .env
  const dbUrl = process.env.DB_URL || 'mysql://root:rootpassword@localhost:3306/wypozyczalnia?multipleStatements=true';
  const pool = mysql.createPool(dbUrl);

  try {
    console.log('⏳ Aktualizuję bazę danych...');
    
    const possiblePaths = [
      path.join(process.cwd(), 'db', 'schema.sql'),
      path.join(process.cwd(), 'schema.sql'),
      path.join(process.cwd(), '..', 'schema.sql')
    ];
    
    const schemaPath = possiblePaths.find(p => fs.existsSync(p));
    
    if (!schemaPath) throw new Error("Nie znaleziono pliku schema.sql!");
    
    const sql = fs.readFileSync(schemaPath, 'utf8');

    // W pliku schema.sql mamy już DROP TABLE, więc wystarczy wykonać sam plik
    await pool.query(sql);
    console.log('✅ Sukces! Tabele w bazie zostały odświeżone.');

    // --- TWORZENIE KONTA ADMINA ---
    console.log('⏳ Dodaję konto administratora...');
    
    const adminEmail = 'admin@booktab.pl';
    const adminHasloJawn = 'admin123';
    
    // Hashujemy hasło przed zapisem (login.vue i server.ts tego wymagają)
    const hasloHash = await bcrypt.hash(adminHasloJawn, 10);

    // Wstawiamy admina. Używamy IGNORE, by skrypt nie wybuchł, jeśli admin już tam jest
    // UWAGA: Upewnij się, że w schema.sql kolumna nazywa się 'haslo' (tak jak ustaliliśmy),
    // a jeśli zostawiłeś starą nazwę, zmień w zapytaniu poniżej 'haslo' na 'haslo_hash'.
    await pool.query(
      `INSERT IGNORE INTO uzytkownicy (imie, nazwisko, email, haslo, rola) 
       VALUES (?, ?, ?, ?, ?)`,
      ['Admin', 'Główny', adminEmail, hasloHash, 'admin']
    );

    console.log(`Konto admina gotowe!`);
    console.log(`   E-mail: ${adminEmail}`);
    console.log(`   Hasło:  ${adminHasloJawn}`);
    
  } catch (error) {
    console.error(' Błąd podczas aktualizacji bazy:', error);
  } finally {
    process.exit();
  }
};

setupDatabase();