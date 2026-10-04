// ============================================================
// routes/userRoutes.js
// Rutas de gestión de usuarios (solo admin)
// ============================================================
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAdmin } = require('../middleware/auth');

router.get('/', requireAdmin, userController.getUsers);
router.put('/:id/role', requireAdmin, userController.updateRole);
router.delete('/:id', requireAdmin, userController.deleteUser);

module.exports = router;
