// ============================================================
// app.js
// Configuración de Express: middlewares, sesiones, Passport, rutas
// ============================================================
const express = require('express');
const session = require('express-session');
const path = require('path');
const passport = require('./config/passport');

const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// ---------- Middlewares globales ----------
// Frontend y API comparten origen; no se habilita CORS indiscriminado.
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error('Configure SESSION_SECRET con al menos 32 caracteres.');
}
app.disable('x-powered-by');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------- Sesiones ----------
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 horas
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
}));

// ---------- Passport (para Google OAuth) ----------
app.use(passport.initialize());
app.use(passport.session());

// ---------- Archivos estáticos del frontend ----------
app.use('/css', express.static(path.join(__dirname, '..', 'frontend', 'css')));
app.use('/js', express.static(path.join(__dirname, '..', 'frontend', 'js')));
app.use('/assets', express.static(path.join(__dirname, '..', 'frontend', 'assets')));

// ---------- Rutas API ----------
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/users', userRoutes);

// ---------- Rutas de páginas HTML ----------
const pagesDir = path.join(__dirname, '..', 'frontend', 'pages');
app.get('/', (req, res) => res.sendFile(path.join(pagesDir, 'index.html')));
app.get('/:page.html', (req, res) => {
  const page = req.params.page;
  if (/^[a-z\-]+$/.test(page)) {
    res.sendFile(path.join(pagesDir, `${page}.html`), (err) => {
      if (err) res.status(404).json({ error: 'Pagina no encontrada' });
    });
  } else {
    res.status(400).json({ error: 'Nombre de pagina invalido' });
  }
});

// ---------- Manejo de errores ----------
app.use((err, req, res, _next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({ error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : (err.message || 'Error interno del servidor') });
});

module.exports = app;
