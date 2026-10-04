// ============================================================
// controllers/bookController.js
// CRUD completo de libros. Cada usuario ve solo sus libros.
// El admin puede ver todos con ?all=true
// ============================================================
const bookService = require('../services/bookService');

// GET /api/books
async function getBooks(req, res, next) {
  try {
    const user = req.session.user;
    const wantAll = req.query.all === 'true' && user.role === 'admin';
    const books = await bookService.getBooks(wantAll ? null : user.id);
    res.json({ books });
  } catch (err) {
    next(err);
  }
}

// GET /api/books/search?q=texto
async function searchBooks(req, res, next) {
  try {
    const query = req.query.q || '';
    if (!query.trim()) return res.json({ books: [] });
    const books = await bookService.searchBooks(req.session.user.id, query);
    res.json({ books });
  } catch (err) {
    next(err);
  }
}

// GET /api/books/stats
async function getStats(req, res, next) {
  try {
    const stats = await bookService.getStats(req.session.user.id);
    res.json({ stats });
  } catch (err) {
    next(err);
  }
}

// GET /api/books/:id
async function getBookById(req, res, next) {
  try {
    const book = await bookService.getBookById(req.params.id);
    if (!book) return res.status(404).json({ error: 'Libro no encontrado' });

    const user = req.session.user;
    if (user.role !== 'admin' && book.user_id !== user.id) {
      return res.status(403).json({ error: 'No tienes acceso a este libro' });
    }
    res.json({ book });
  } catch (err) {
    next(err);
  }
}

// POST /api/books
async function createBook(req, res, next) {
  try {
    const { title, author, genre, status, rating, notes, cover_url } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'El título es obligatorio' });
    }
    if (!author || !author.trim()) {
      return res.status(400).json({ error: 'El autor es obligatorio' });
    }

    const book = await bookService.createBook({
      title: title.trim(),
      author: author.trim(),
      genre, status, rating, notes, cover_url,
      userId: req.session.user.id,
    });

    res.status(201).json({ message: 'Libro agregado', book });
  } catch (err) {
    next(err);
  }
}

// PUT /api/books/:id
async function updateBook(req, res, next) {
  try {
    const existing = await bookService.getBookById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Libro no encontrado' });

    const user = req.session.user;
    if (user.role !== 'admin' && existing.user_id !== user.id) {
      return res.status(403).json({ error: 'No tienes permiso para editar este libro' });
    }

    const { title, author, genre, status, rating, notes, cover_url } = req.body;
    const updated = await bookService.updateBook(req.params.id, {
      title: title?.trim() || existing.title,
      author: author?.trim() || existing.author,
      genre: genre || existing.genre,
      status: status || existing.status,
      rating: rating !== undefined ? rating : existing.rating,
      notes: notes !== undefined ? notes : existing.notes,
      cover_url: cover_url !== undefined ? cover_url : existing.cover_url,
    });

    res.json({ message: 'Libro actualizado', book: updated });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/books/:id
async function deleteBook(req, res, next) {
  try {
    const existing = await bookService.getBookById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Libro no encontrado' });

    const user = req.session.user;
    if (user.role !== 'admin' && existing.user_id !== user.id) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este libro' });
    }

    await bookService.deleteBook(req.params.id);
    res.json({ message: 'Libro eliminado' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getBooks, searchBooks, getStats, getBookById, createBook, updateBook, deleteBook };
