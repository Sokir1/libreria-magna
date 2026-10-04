// ============================================================
// services/bookService.js
// Lógica de negocio para el CRUD de libros
// ============================================================
const pool = require('../config/db');

// Listar libros (de un usuario o todos si es admin)
async function getBooks(userId = null) {
  if (userId) {
    const result = await pool.query(
      'SELECT * FROM books WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );
    return result.rows;
  }
  // Admin: todos los libros
  const result = await pool.query(
    `SELECT books.*, users.name as owner_name
     FROM books JOIN users ON books.user_id = users.id
     ORDER BY updated_at DESC`
  );
  return result.rows;
}

// Obtener un libro por ID
async function getBookById(id) {
  const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
  return result.rows[0] || null;
}

// Crear libro
async function createBook({ title, author, genre, status, rating, notes, cover_url, userId }) {
  const result = await pool.query(
    `INSERT INTO books (title, author, genre, status, rating, notes, cover_url, user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [title, author, genre || 'General', status || 'por_leer', rating || 0, notes || '', cover_url || '', userId]
  );
  return result.rows[0];
}

// Actualizar libro
async function updateBook(id, { title, author, genre, status, rating, notes, cover_url }) {
  const result = await pool.query(
    `UPDATE books SET title=$1, author=$2, genre=$3, status=$4, rating=$5, notes=$6, cover_url=$7, updated_at=CURRENT_TIMESTAMP
     WHERE id=$8 RETURNING *`,
    [title, author, genre, status, rating, notes, cover_url, id]
  );
  return result.rows[0];
}

// Eliminar libro
async function deleteBook(id) {
  await pool.query('DELETE FROM books WHERE id = $1', [id]);
}

// Estadísticas de un usuario
async function getStats(userId) {
  const total = await pool.query('SELECT COUNT(*) FROM books WHERE user_id = $1', [userId]);
  const leidos = await pool.query("SELECT COUNT(*) FROM books WHERE user_id = $1 AND status = 'leido'", [userId]);
  const leyendo = await pool.query("SELECT COUNT(*) FROM books WHERE user_id = $1 AND status = 'leyendo'", [userId]);
  const porLeer = await pool.query("SELECT COUNT(*) FROM books WHERE user_id = $1 AND status = 'por_leer'", [userId]);
  const avgRating = await pool.query("SELECT AVG(rating) FROM books WHERE user_id = $1 AND rating > 0", [userId]);

  return {
    total: parseInt(total.rows[0].count),
    leidos: parseInt(leidos.rows[0].count),
    leyendo: parseInt(leyendo.rows[0].count),
    por_leer: parseInt(porLeer.rows[0].count),
    promedio_rating: parseFloat(avgRating.rows[0].avg || 0).toFixed(1),
  };
}

// Buscar libros por título o autor
async function searchBooks(userId, query) {
  const result = await pool.query(
    `SELECT * FROM books WHERE user_id = $1 AND (LOWER(title) LIKE $2 OR LOWER(author) LIKE $2) ORDER BY updated_at DESC`,
    [userId, `%${query.toLowerCase()}%`]
  );
  return result.rows;
}

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getStats,
  searchBooks,
};
