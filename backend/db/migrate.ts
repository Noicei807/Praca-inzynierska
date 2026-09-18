import fs from 'fs/promises';
import path from 'path';
import { pool } from './index.js';

async function uruchomMigracje() {
  try {
    const sciezka = path.join(process.cwd(), 'db', 'schema.sql');
    const sql = await fs.readFile(sciezka, 'utf8');
    await pool.query(sql);
    
    console.log('Tabele zostaly utworzone.');
    process.exit(0);
  } catch (error) {
    console.error('Wystapil blad', error);
    process.exit(1);
  }
}

uruchomMigracje();