// ============================================================
// config/passport.js
// Configuración de Passport.js para Google OAuth 2.0
// ============================================================
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./db');

// Solo configurar Google si hay credenciales en .env
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value.toLowerCase();
      const name = profile.displayName;

      // Buscar si el usuario ya existe
      let result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      let user = result.rows[0];

      if (!user) {
        // Crear usuario nuevo desde Google (sin contraseña)
        result = await pool.query(
          `INSERT INTO users (name, email, password, role, avatar_url)
           VALUES ($1, $2, $3, 'user', $4)
           RETURNING id, name, email, role, avatar_url`,
          [name, email, 'GOOGLE_AUTH_NO_PASSWORD', profile.photos?.[0]?.value || '']
        );
        user = result.rows[0];
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
}

// Serializar usuario para la sesión
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, avatar_url FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
