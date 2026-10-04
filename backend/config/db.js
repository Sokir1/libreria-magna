// ============================================================
// config/db.js
// Conexión a PostgreSQL usando pg (node-postgres)
// ============================================================
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'libreria_pablito',
});

module.exports = pool;
