import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import 'dotenv/config';

const setupDatabase = async () => {
  // Pobieramy cały link z .env, który właśnie mi wysłałeś
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

    await pool.query('DROP TABLE IF EXISTS wypozyczenia, ksiazki, uzytkownicy;');
    await pool.query(sql);
    
    console.log('✅ Sukces! Baza danych została pomyślnie zaktualizowana.');
  } catch (error) {
    console.error('❌ Błąd podczas aktualizacji bazy:', error);
  } finally {
    process.exit();
  }
};

setupDatabase();