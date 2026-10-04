// ============================================================
// services/authService.js
// Lógica de negocio para autenticación de usuarios
// ============================================================
const pool = require('../config/db');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

async function findUserByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

async function findUserById(id) {
  const result = await pool.query('SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function createUser({ name, email, password, role = 'user' }) {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await pool.query(
    'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
    [name, email, hashedPassword, role]
  );
  return result.rows[0];
}

async function validatePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

async function getAllUsers() {
  const result = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
  return result.rows;
}

async function updateUserRole(userId, newRole) {
  const result = await pool.query(
    'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
    [newRole, userId]
  );
  return result.rows[0];
}

async function deleteUser(userId) {
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  validatePassword,
  getAllUsers,
  updateUserRole,
  deleteUser,
};
