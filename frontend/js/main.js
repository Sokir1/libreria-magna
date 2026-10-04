// ============================================================
// main.js
// Funciones globales: navbar, fetch, alertas, modo oscuro
// ============================================================

// ---------- Utilidades ----------

function escapeHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

function showAlert(mensaje, tipo = 'info') {
  const existing = document.querySelector('.alert-fixed');
  if (existing) existing.remove();

  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${tipo} alert-fixed alert-dismissible fade show`;
  alertDiv.role = 'alert';
  alertDiv.innerHTML = `${escapeHTML(mensaje)}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
  document.body.appendChild(alertDiv);
  setTimeout(() => alertDiv.remove(), 4000);
}

async function apiFetch(endpoint, options = {}) {
  const res = await fetch(`/api${endpoint}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

async function requireSession() {
  try {
    const data = await apiFetch('/auth/me');
    return data.user;
  } catch {
    window.location.href = 'login.html';
    return null;
  }
}

async function logout() {
  try { await apiFetch('/auth/logout', { method: 'POST' }); } catch {}
  window.location.href = 'login.html';
}

function badgeDeEstado(status) {
  const mapa = { por_leer: 'badge-por-leer', leyendo: 'badge-leyendo', leido: 'badge-leido', abandonado: 'badge-abandonado' };
  const etiqueta = { por_leer: 'Por leer', leyendo: 'Leyendo', leido: 'Leido', abandonado: 'Abandonado' };
  return `<span class="badge ${mapa[status] || 'badge-por-leer'}">${escapeHTML(etiqueta[status] || status)}</span>`;
}

function estrellasHTML(rating) {
  if (!rating || rating === 0) return '<span class="text-suave">Sin calificar</span>';
  let html = '';
  for (let i = 1; i <= 5; i++) html += i <= rating ? '&#9733;' : '&#9734;';
  return `<span class="estrellas">${html}</span>`;
}

function portadaHTML(cover_url, title) {
  if (cover_url && cover_url.trim()) {
    return `<img src="${escapeHTML(cover_url)}" class="book-cover w-100" alt="${escapeHTML(title)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"><div class="book-cover w-100 align-items-center justify-content-center" style="background:#f0e6d6;height:200px;border-radius:var(--radio) var(--radio) 0 0;display:none;font-size:3rem;">&#128214;</div>`;
  }
  return `<div class="book-cover w-100 d-flex align-items-center justify-content-center" style="background:#f0e6d6;height:200px;border-radius:var(--radio) var(--radio) 0 0;"><span style="font-size:3rem;">&#128214;</span></div>`;
}

// ---------- MODO OSCURO ----------
function initDarkMode() {
  const saved = localStorage.getItem('darkMode');
  if (saved === 'false') {
    document.body.classList.add('hermes-mode');
  }
  // Default: dark/warm theme (no class needed)
}

function toggleDarkMode() {
  const isHermesMode = document.body.classList.contains('hermes-mode');
  if (isHermesMode) {
    // Switch to dark/warm
    document.body.classList.remove('hermes-mode');
    localStorage.setItem('darkMode', 'true');
  } else {
    // Switch to Hermes blue
    document.body.classList.add('hermes-mode');
    localStorage.setItem('darkMode', 'false');
  }
  renderNavbar();
}

// ---------- Navbar dinámico ----------
async function renderNavbar() {
  const navbarEl = document.getElementById('navbar');
  if (!navbarEl) return;

  let user = null;
  try { const data = await apiFetch('/auth/me'); user = data.user; } catch {}

  const isHermesMode = document.body.classList.contains('hermes-mode');
  const darkIcon = isHermesMode ? '&#9728;' : '&#9788;';  // sun when in Hermes mode, moon when in dark mode

  if (user) {
    navbarEl.innerHTML = `
      <nav class="navbar navbar-expand-lg">
        <div class="container">
          <a class="navbar-brand" href="index.html">Libreria Magna</a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navMenu">
            <ul class="navbar-nav me-auto">
              <li class="nav-item"><a class="nav-link" href="dashboard.html">Mi Biblioteca</a></li>
              <li class="nav-item"><a class="nav-link" href="items.html">Libros</a></li>
              <li class="nav-item"><a class="nav-link" href="create-item.html">Agregar Libro</a></li>
              ${user.role === 'admin' ? '<li class="nav-item"><a class="nav-link" href="admin.html">Admin</a></li>' : ''}
            </ul>
            <ul class="navbar-nav align-items-center">
              <li class="nav-item me-2">
                <button class="btn-dark-mode" id="btn-dark-mode" onclick="toggleDarkMode()" title="Modo oscuro">${darkIcon}</button>
              </li>
              <li class="nav-item"><a class="nav-link" href="profile.html">${escapeHTML(user.name)}</a></li>
              <li class="nav-item"><a class="nav-link" href="#" onclick="logout()">Cerrar sesion</a></li>
            </ul>
          </div>
        </div>
      </nav>`;
  } else {
    navbarEl.innerHTML = `
      <nav class="navbar navbar-expand-lg">
        <div class="container">
          <a class="navbar-brand" href="index.html">Libreria Magna</a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navMenu">
            <ul class="navbar-nav ms-auto align-items-center">
              <li class="nav-item me-2">
                <button class="btn-dark-mode" id="btn-dark-mode" onclick="toggleDarkMode()" title="Modo oscuro">${darkIcon}</button>
              </li>
              <li class="nav-item"><a class="nav-link" href="login.html">Iniciar sesion</a></li>
              <li class="nav-item"><a class="nav-link" href="register.html">Registrarse</a></li>
            </ul>
          </div>
        </div>
      </nav>`;
  }
}

// ---------- Footer ----------
function renderFooter() {
  const footerEl = document.getElementById('footer');
  if (!footerEl) return;
  footerEl.innerHTML = `
    <footer class="footer">
      <div class="container">
        <p class="mb-1"><strong>Libreria Magna</strong> — Tu biblioteca digital personal</p>
        <p class="mb-0 small">Proyecto Final | Desarrollo Web &copy; ${new Date().getFullYear()}</p>
      </div>
    </footer>`;
}

// ---------- Inicializar ----------
document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  renderNavbar();
  renderFooter();
});
