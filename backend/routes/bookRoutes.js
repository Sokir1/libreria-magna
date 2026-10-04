// ============================================================
// routes/bookRoutes.js
// Rutas CRUD de libros (protegidas por autenticación)
// ============================================================
const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, bookController.getBooks);
router.get('/search', requireAuth, bookController.searchBooks);
router.get('/stats', requireAuth, bookController.getStats);
router.get('/:id', requireAuth, bookController.getBookById);
router.post('/', requireAuth, bookController.createBook);
router.put('/:id', requireAuth, bookController.updateBook);
router.delete('/:id', requireAuth, bookController.deleteBook);

module.exports = router;
