// ============================================================
// middleware/auth.js
// Middleware para proteger rutas que requieren autenticación
// ============================================================

// Requiere que haya sesión activa
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Debes iniciar sesión para acceder' });
  }
  next();
}

// Requiere rol de administrador
function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso solo para administradores' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
