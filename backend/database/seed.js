// Crea un administrador local sin contraseñas predefinidas ni datos personales.
require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../config/db');
async function seed() {
  try {
    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 12) {
      throw new Error('Configure SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD (al menos 12 caracteres).');
    }
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,'admin')
       ON CONFLICT (email) DO NOTHING RETURNING id`,
      ['Administrador', email.trim().toLowerCase(), hash]
    );
    console.log(result.rowCount ? 'Administrador creado.' : 'La cuenta ya existe; no fue modificada.');
  } catch (error) {
    console.error(error.message); process.exitCode = 1;
  } finally { await pool.end(); }
}
seed();
