// ============================================================
// controllers/authController.js
// Controlador de autenticación: registro, login, logout, sesión
// ============================================================
const authService = require('../services/authService');

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'El correo no tiene un formato válido' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ error: 'Las contraseñas no coinciden' });
    }

    const existing = await authService.findUserByEmail(email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'Ese correo ya está registrado' });
    }

    const user = await authService.createUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
    });

    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    res.status(201).json({ message: 'Usuario registrado exitosamente', user: req.session.user });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
    }

    const user = await authService.findUserByEmail(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    const valid = await authService.validatePassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    res.json({ message: 'Sesión iniciada', user: req.session.user });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/logout
function logout(req, res) {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Error al cerrar sesión' });
    res.clearCookie('connect.sid');
    res.json({ message: 'Sesión cerrada' });
  });
}

// GET /api/auth/me
function me(req, res) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'No hay sesión activa' });
  }
  res.json({ user: req.session.user });
}

module.exports = { register, login, logout, me };
