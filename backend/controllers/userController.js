// ============================================================
// controllers/userController.js
// Gestión de usuarios (solo admin)
// ============================================================
const authService = require('../services/authService');

// GET /api/users
async function getUsers(req, res, next) {
  try {
    const users = await authService.getAllUsers();
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

// PUT /api/users/:id/role
async function updateRole(req, res, next) {
  try {
    const { role } = req.body;
    if (!['user', 'admin', 'visitante'].includes(role)) {
      return res.status(400).json({ error: 'Rol invalido. Use "user", "admin" o "visitante"' });
    }
    const updated = await authService.updateUserRole(req.params.id, role);
    if (!updated) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ message: 'Rol actualizado', user: updated });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/users/:id
async function deleteUser(req, res, next) {
  try {
    if (parseInt(req.params.id) === req.session.user.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }
    await authService.deleteUser(req.params.id);
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getUsers, updateRole, deleteUser };
