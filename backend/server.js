// ============================================================
// server.js
// Punto de entrada: inicia el servidor HTTP en el puerto .env
// ============================================================
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n📚 Librería Magna Mejorada corriendo en http://localhost:${PORT}\n`);
});
