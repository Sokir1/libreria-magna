// ============================================================
// profile.js
// Página de perfil del usuario
// ============================================================

(async () => {
  const user = await requireSession();
  if (!user) return;

  // Mostrar info del usuario
  document.getElementById('user-name').textContent = user.name;
  document.getElementById('user-email').textContent = user.email;
  document.getElementById('user-role').textContent = user.role === 'admin' ? 'Administrador' : 'Usuario';

  // Cargar estadísticas
  try {
    const data = await apiFetch('/books/stats');
    const s = data.stats;
    document.getElementById('profile-total').textContent = s.total;
    document.getElementById('profile-leidos').textContent = s.leidos;
    document.getElementById('profile-leyendo').textContent = s.leyendo;
  } catch (err) {
    console.error('Error cargando stats:', err);
  }

  // Fecha de registro (vía API de auth)
  try {
    const meData = await apiFetch('/auth/me');
    // No tenemos created_at en la sesión, pero podemos mostrarlo si el backend lo envía
    document.getElementById('user-since').textContent = 'Reciente';
  } catch { /* ignorar */ }
})();
