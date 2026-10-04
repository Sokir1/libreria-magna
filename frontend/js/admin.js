// ============================================================
// admin.js
// Panel de administracion: gestion de usuarios y estadisticas
// Soporta 3 roles: admin, user, visitante
// ============================================================

(async () => {
  const user = await requireSession();
  if (!user || user.role !== 'admin') {
    showAlert('Acceso solo para administradores', 'danger');
    setTimeout(() => window.location.href = 'dashboard.html', 2000);
    return;
  }

  try {
    // Cargar usuarios
    const usersData = await apiFetch('/users');
    const users = usersData.users;

    document.getElementById('admin-total-users').textContent = users.length;

    // Cargar todos los libros para estadisticas
    const booksData = await apiFetch('/books?all=true');
    const books = booksData.books;

    document.getElementById('admin-total-books').textContent = books.length;
    document.getElementById('admin-total-leidos').textContent = books.filter(b => b.status === 'leido').length;

    // Renderizar tabla de usuarios
    const tbody = document.getElementById('users-table');
    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-suave">No hay usuarios</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(u => {
      const roleLabel = { admin: 'Admin', user: 'Usuario', visitante: 'Visitante' }[u.role] || u.role;
      const roleBadge = { admin: 'bg-danger', user: 'bg-primary', visitante: 'bg-secondary' }[u.role] || 'bg-secondary';
      return `
      <tr>
        <td>${u.id}</td>
        <td>${escapeHTML(u.name)}</td>
        <td>${escapeHTML(u.email)}</td>
        <td><span class="badge ${roleBadge}">${roleLabel}</span></td>
        <td>${new Date(u.created_at).toLocaleDateString('es-CL')}</td>
        <td>
          ${u.id !== user.id ? `
            <select class="form-select form-select-sm d-inline-block w-auto me-1" onchange="cambiarRol(${u.id}, this.value)">
              <option value="user" ${u.role === 'user' ? 'selected' : ''}>Usuario</option>
              <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
              <option value="visitante" ${u.role === 'visitante' ? 'selected' : ''}>Visitante</option>
            </select>
            <button class="btn btn-sm btn-outline-danger" onclick="eliminarUsuario(${u.id})">Eliminar</button>
          ` : '<span class="text-suave small">Tu</span>'}
        </td>
      </tr>`;
    }).join('');

  } catch (err) {
    showAlert(err.message, 'danger');
  }
})();

async function cambiarRol(userId, newRole) {
  try {
    await apiFetch(`/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role: newRole }),
    });
    showAlert('Rol actualizado', 'success');
  } catch (err) {
    showAlert(err.message, 'danger');
    setTimeout(() => location.reload(), 1500);
  }
}

async function eliminarUsuario(userId) {
  if (!confirm('Eliminar este usuario? Todos sus libros se eliminaran.')) return;
  try {
    await apiFetch(`/users/${userId}`, { method: 'DELETE' });
    showAlert('Usuario eliminado', 'success');
    setTimeout(() => location.reload(), 800);
  } catch (err) {
    showAlert(err.message, 'danger');
  }
}
