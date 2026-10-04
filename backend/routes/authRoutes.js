// ============================================================
// routes/authRoutes.js
// Rutas de autenticación + Google OAuth
// ============================================================
const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');

// Registro y login tradicional
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authController.me);

// ---------- Google OAuth 2.0 ----------
// Verificar si Google está configurado
router.get('/google/status', (req, res) => {
  const configured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  res.json({ configured });
});

// Iniciar flujo de Google OAuth
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      error: 'Google Login no está configurado. Agrega GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET al archivo .env'
    });
  }
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  })(req, res, next);
});

// Callback de Google después de autenticar
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login.html?error=google' }),
  (req, res) => {
    // Autenticación exitosa: guardar en sesión
    req.session.user = {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    };
    res.redirect('/dashboard.html');
  }
);

module.exports = router;
