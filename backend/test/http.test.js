const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
process.env.SESSION_SECRET = 'testing-only-secret-with-more-than-32-characters';
const app = require('../app');
const pool = require('../config/db');
let server, base;
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { await new Promise(resolve => server.close(resolve)); await pool.end(); });
test('health responde sin base de datos', async () => {
  const res = await fetch(base + '/api/health');
  assert.equal(res.status, 200); assert.deepEqual(await res.json(), { status: 'ok' });
});
test('página y assets se sirven desde el mismo origen', async () => {
  for (const path of ['/', '/css/styles.css', '/js/main.js']) {
    const res = await fetch(base + path); assert.equal(res.status, 200);
  }
});
test('API privada rechaza visitantes', async () => {
  const res = await fetch(base + '/api/auth/me'); assert.equal(res.status, 401);
});
test('registro incompleto se valida sin consultar la base', async () => {
  const res = await fetch(base + '/api/auth/register', {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:'invalid'})
  }); assert.equal(res.status, 400);
});
test('no habilita origen arbitrario con credenciales', async () => {
  const res = await fetch(base + '/api/health', {headers:{Origin:'https://example.com'}});
  assert.equal(res.headers.get('access-control-allow-origin'), null);
});
