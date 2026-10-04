// ============================================================
// auth.js
// Lógica de login.html y register.html
// Manejo de login tradicional + Google OAuth
// ============================================================

// ---------- AVISOS DE GOOGLE ----------
// Si Google rechaza el login, el backend redirige a login.html?error=google
const paramsLogin = new URLSearchParams(window.location.search);
if (paramsLogin.get('error') === 'google') {
  document.addEventListener('DOMContentLoaded', () => {
    const errDiv = document.getElementById('google-error');
    if (errDiv) {
      errDiv.textContent = 'No se pudo iniciar sesion con Google. Intenta de nuevo o usa tu correo y contrasena.';
      errDiv.classList.remove('d-none');
    }
  });
}

// Verificar si Google está configurado y mostrar/ocultar botón
const btnGoogle = document.getElementById('btn-google');
if (btnGoogle) {
  btnGoogle.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      const r = await fetch('/api/auth/google/status');
      const data = await r.json();
      if (!data.configured) {
        const errDiv = document.getElementById('google-error');
        if (errDiv) {
          errDiv.textContent = 'Google Login no esta configurado. El administrador debe agregar las credenciales de Google en el archivo .env';
          errDiv.classList.remove('d-none');
          errDiv.classList.replace('alert-warning', 'alert-info');
        }
        return;
      }
      window.location.href = '/api/auth/google';
    } catch {
      window.location.href = '/api/auth/google';
    }
  });
}

// ---------- LOGIN ----------
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email');
    const password = document.getElementById('password');
    let valid = true;

    // Validaciones visuales con Bootstrap
    if (!email.value.trim()) {
      email.classList.add('is-invalid');
      valid = false;
    } else {
      email.classList.remove('is-invalid');
    }

    if (!password.value || password.value.length < 6) {
      password.classList.add('is-invalid');
      valid = false;
    } else {
      password.classList.remove('is-invalid');
    }

    if (!valid) return;

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.value.trim(),
          password: password.value
        }),
      });

      showAlert(data.message, 'success');
      setTimeout(() => window.location.href = 'dashboard.html', 800);
    } catch (err) {
      showAlert(err.message, 'danger');
    }
  });
}

// ---------- REGISTER ----------
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    let valid = true;

    // Validaciones visuales
    if (!name.value.trim()) { name.classList.add('is-invalid'); valid = false; } else { name.classList.remove('is-invalid'); }

    if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      email.classList.add('is-invalid'); valid = false;
    } else { email.classList.remove('is-invalid'); }

    if (!password.value || password.value.length < 6) {
      password.classList.add('is-invalid'); valid = false;
    } else { password.classList.remove('is-invalid'); }

    if (password.value !== confirmPassword.value) {
      confirmPassword.classList.add('is-invalid'); valid = false;
    } else { confirmPassword.classList.remove('is-invalid'); }

    if (!valid) return;

    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: name.value.trim(),
          email: email.value.trim(),
          password: password.value,
          confirmPassword: confirmPassword.value
        }),
      });

      showAlert(data.message, 'success');
      setTimeout(() => window.location.href = 'dashboard.html', 800);
    } catch (err) {
      showAlert(err.message, 'danger');
    }
  });
}
