// ============================================================
// books.js
// CRUD de libros: listar, crear, editar, eliminar, buscar, filtrar
// Funciona en: dashboard.html, items.html, create-item.html, edit-item.html
// ============================================================

// ---------- DASHBOARD (dashboard.html) ----------
const statsContainer = document.getElementById('stats-container');
if (statsContainer) {
  (async () => {
    const user = await requireSession();
    if (!user) return;

    try {
      // Cargar estadísticas
      const statsData = await apiFetch('/books/stats');
      const s = statsData.stats;
      document.getElementById('stat-total').textContent = s.total;
      document.getElementById('stat-leidos').textContent = s.leidos;
      document.getElementById('stat-leyendo').textContent = s.leyendo;
      document.getElementById('stat-rating').textContent = s.promedio_rating > 0 ? `⭐ ${s.promedio_rating}` : '-';

      // Cargar libros completos
      const booksData = await apiFetch('/books');
      const books = booksData.books;

      if (books.length === 0) return;

      const noMsg = document.getElementById('no-books-msg');
      if (noMsg) noMsg.style.display = 'none';

      // ---------- MEJORA 1: Gráficos Chart.js ----------
      renderCharts(s, books);

      // ---------- MEJORA 2: Libro del día ----------
      renderBookOfDay(books);

      // Últimos libros
      const recentContainer = document.getElementById('recent-books');
      recentContainer.innerHTML = books.slice(0, 6).map(book => `
        <div class="col-md-4 col-sm-6">
          <div class="card book-card h-100">
            ${portadaHTML(book.cover_url, book.title)}
            <div class="card-body">
              <h6 class="card-title mb-1">${escapeHTML(book.title)}</h6>
              <p class="text-suave small mb-1">${escapeHTML(book.author)}</p>
              ${badgeDeEstado(book.status)}
              <div class="mt-1">${estrellasHTML(book.rating)}</div>
            </div>
          </div>
        </div>
      `).join('');
    } catch (err) {
      showAlert(err.message, 'danger');
    }
  })();
}

// ---------- MEJORA 1: Gráficos con Chart.js ----------
function renderCharts(stats, books) {
  const statusCanvas = document.getElementById('chart-status');
  const ratingCanvas = document.getElementById('chart-rating');

  if (!statusCanvas || !ratingCanvas) return;

  // Verificar que Chart.js esté cargado
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js no cargado');
    return;
  }

  // Gráfico de torta - Estado de lectura
  new Chart(statusCanvas, {
    type: 'doughnut',
    data: {
      labels: ['Por leer', 'Leyendo', 'Leídos', 'Abandonados'],
      datasets: [{
        data: [
          stats.por_leer || 0,
          stats.leyendo || 0,
          stats.leidos || 0,
          (stats.total - stats.por_leer - stats.leyendo - stats.leidos) || 0
        ],
        backgroundColor: ['#1565C0', '#F57F17', '#2E7D32', '#C62828'],
        borderColor: '#FFF8F0',
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#2D1810', font: { family: 'Cormorant Garamond, serif', size: 14 } }
        }
      }
    }
  });

  // Gráfico de barras - Calificaciones
  const ratings = {1:0, 2:0, 3:0, 4:0, 5:0};
  books.forEach(b => { if (b.rating > 0 && b.rating <= 5) ratings[b.rating]++; });

  new Chart(ratingCanvas, {
    type: 'bar',
    data: {
      labels: ['★1', '★2', '★3', '★4', '★5'],
      datasets: [{
        label: 'Libros',
        data: [ratings[1], ratings[2], ratings[3], ratings[4], ratings[5]],
        backgroundColor: ['#C62828', '#F57F17', '#FBC02D', '#388E3C', '#1565C0'],
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, color: '#7A6252' },
          grid: { color: 'rgba(0,0,0,0.05)' }
        },
        x: {
          ticks: { color: '#2D1810', font: { family: 'Cormorant Garamond, serif', size: 13 } }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// ---------- MEJORA 2: Libro del día (recomendación aleatoria) ----------
function renderBookOfDay(books) {
  const section = document.getElementById('book-of-day-section');
  const content = document.getElementById('book-of-day-content');
  if (!section || !content) return;

  // Si hay menos de 3 libros, no mostrar
  if (books.length < 1) return;
  section.style.display = 'block';

  // Estadística: que libro tiene mejor rating o seleccionar aleatorio
  const mejorValorado = [...books].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
  const randomBook = books[Math.floor(Math.random() * books.length)];

  // Usar el día como seed para que sea consistente
  const today = new Date().toDateString();
  let seed = 0;
  for (let i = 0; i < today.length; i++) seed += today.charCodeAt(i);
  const bookOfDay = books[seed % books.length] || randomBook;

  const colorEstrella = bookOfDay.rating >= 4 ? '#2E7D32' :
                         bookOfDay.rating >= 2 ? '#F57F17' : '#C62828';

  content.innerHTML = `
    <div class="row align-items-center">
      <div class="col-md-3">
        <div style="font-size:5rem; opacity:0.8;">📖</div>
      </div>
      <div class="col-md-9 text-start">
        <h4 class="mb-1" style="font-family:'Cormorant Garamond',serif; font-weight:700;">
          "${escapeHTML(bookOfDay.title)}"
        </h4>
        <p class="mb-2" style="font-size:1.1rem; color:var(--color-texto-suave);">
          ${escapeHTML(bookOfDay.author)}
        </p>
        <div class="mb-2">
          ${badgeDeEstado(bookOfDay.status)}
          <span class="ms-2">${estrellasHTML(bookOfDay.rating)}</span>
        </div>
        <p class="small mb-0">
          <strong>Género:</strong> ${escapeHTML(bookOfDay.genre || 'General')}
          ${bookOfDay.notes ? `&nbsp;|&nbsp; <em>"${escapeHTML(bookOfDay.notes.substring(0,100))}"</em>` : ''}
        </p>
      </div>
    </div>
  `;
}

// ---------- LISTADO DE LIBROS (items.html) ----------
const booksContainer = document.getElementById('books-container');
if (booksContainer && !statsContainer) {
  let todosLosLibros = [];
  let filtroActual = 'todos';
  let usuarioActual = null;

  (async () => {
    usuarioActual = await requireSession();
    if (!usuarioActual) return;

    // Mostrar toggle admin si corresponde
    if (usuarioActual.role === 'admin') {
      document.getElementById('admin-toggle').style.display = 'block';
      document.getElementById('check-todos').addEventListener('change', cargarLibros);
    }

    // Establecer fondo inicial (Todos = Creacion de Adan)
    const firstBtn = document.querySelector('.filtros .btn[data-filter="todos"]');
    if (firstBtn && firstBtn.dataset.bg) {
      document.body.style.setProperty('--page-bg', `url('${firstBtn.dataset.bg}')`);
    }

    await cargarLibros();
  })();

  async function cargarLibros() {
    const loadingMsg = document.getElementById('loading-msg');

    try {
      const all = usuarioActual.role === 'admin' && document.getElementById('check-todos')?.checked;
      const data = await apiFetch('/books' + (all ? '?all=true' : ''));
      todosLosLibros = data.books;
      renderLibros();
    } catch (err) {
      showAlert(err.message, 'danger');
    } finally {
      if (loadingMsg) loadingMsg.remove();
    }
  }

  function renderLibros(libros = null) {
    const list = libros || (filtroActual === 'todos'
      ? todosLosLibros
      : todosLosLibros.filter(b => b.status === filtroActual));

    if (list.length === 0) {
      booksContainer.innerHTML = `
        <div class="col-12 text-center py-5 text-suave">
          <p style="font-size:3rem;">📭</p>
          <p>No hay libros${filtroActual !== 'todos' ? ' con este filtro' : ''}.</p>
          <a href="create-item.html" class="btn btn-primary">Agregar libro</a>
        </div>`;
      return;
    }

    booksContainer.innerHTML = list.map(book => `
      <div class="col-md-4 col-sm-6">
        <div class="card book-card h-100">
          ${portadaHTML(book.cover_url, book.title)}
          <div class="book-actions">
            <a href="edit-item.html?id=${book.id}" class="btn btn-sm btn-warning">✏️</a>
            <button class="btn btn-sm btn-danger" onclick="eliminarLibro(${book.id})">🗑️</button>
          </div>
          <div class="card-body">
            <h6 class="card-title mb-1">${escapeHTML(book.title)}</h6>
            <p class="text-suave small mb-1">${escapeHTML(book.author)}</p>
            <p class="text-suave small mb-1">${escapeHTML(book.genre)}</p>
            ${badgeDeEstado(book.status)}
            <div class="mt-1">${estrellasHTML(book.rating)}</div>
            ${book.notes ? `<p class="text-suave small mt-2 mb-0" style="font-style:italic;">"${escapeHTML(book.notes.substring(0, 80))}${book.notes.length > 80 ? '...' : ''}"</p>` : ''}
            ${book.owner_name ? `<p class="text-suave small mt-1 mb-0">👤 ${escapeHTML(book.owner_name)}</p>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  // Filtros
  document.querySelectorAll('.filtros .btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filtros .btn').forEach(b => {
        b.classList.remove('btn-primary', 'active');
        b.classList.add('btn-outline-primary');
      });
      btn.classList.remove('btn-outline-primary');
      btn.classList.add('btn-primary', 'active');
      filtroActual = btn.dataset.filter;
      
      // Cambiar fondo segun el filtro
      const bgUrl = btn.dataset.bg;
      if (bgUrl) {
        document.body.style.setProperty('--page-bg', `url('${bgUrl}')`);
      }
      
      renderLibros();
    });
  });

  // Búsqueda
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    let debounce;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(async () => {
        const q = searchInput.value.trim();
        if (!q) return renderLibros();
        try {
          const data = await apiFetch(`/books/search?q=${encodeURIComponent(q)}`);
          renderLibros(data.books);
        } catch (err) {
          showAlert(err.message, 'danger');
        }
      }, 300);
    });
  }
}

// Eliminar libro
async function eliminarLibro(id) {
  if (!confirm('¿Eliminar este libro? Esta acción no se puede deshacer.')) return;
  try {
    await apiFetch(`/books/${id}`, { method: 'DELETE' });
    showAlert('Libro eliminado', 'success');
    // Recargar
    if (typeof cargarLibros === 'function') cargarLibros();
    else location.reload();
  } catch (err) {
    showAlert(err.message, 'danger');
  }
}

// ---------- MEJORA 3: Exportar biblioteca a PDF ----------
async function exportBooksPDF() {
  try {
    showAlert('Generando PDF...', 'info');
    const data = await apiFetch('/books');
    const books = data.books;

    if (!books || books.length === 0) {
      return showAlert('No hay libros para exportar', 'warning');
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(139, 69, 19);
    doc.text('Librería Magna', 105, 20, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Catálogo de Biblioteca Personal', 105, 28, { align: 'center' });
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}`, 105, 34, { align: 'center' });

    doc.setDrawColor(139, 69, 19);
    doc.setLineWidth(0.5);
    doc.line(14, 38, 196, 38);

    // Estadísticas
    const total = books.length;
    const leidos = books.filter(b => b.status === 'leido').length;
    const leyendo = books.filter(b => b.status === 'leyendo').length;
    const porLeer = books.filter(b => b.status === 'por_leer').length;

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Total: ${total} libros  |  Leídos: ${leidos}  |  Leyendo: ${leyendo}  |  Por leer: ${porLeer}`, 105, 44, { align: 'center' });

    // Tabla de libros
    const rows = books.map((b, i) => [
      (i + 1).toString(),
      b.title || '',
      b.author || '',
      b.genre || 'General',
      b.status === 'leido' ? 'Leído' : b.status === 'leyendo' ? 'Leyendo' : b.status === 'por_leer' ? 'Por leer' : 'Abandonado',
      b.rating > 0 ? '★'.repeat(b.rating) : '-'
    ]);

    doc.autoTable({
      startY: 50,
      head: [['#', 'Título', 'Autor', 'Género', 'Estado', 'Rating']],
      body: rows,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [139, 69, 19],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 235, 220],
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        5: { cellWidth: 15, halign: 'center' },
      },
    });

    // Footer
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Librería Magna — Tu biblioteca digital personal', 105, finalY, { align: 'center' });

    // Descargar
    doc.save(`Libreria-Magna-Catalogo-${new Date().toISOString().split('T')[0]}.pdf`);
    showAlert(`PDF generado: ${books.length} libros exportados`, 'success');
  } catch (err) {
    showAlert('Error al exportar PDF: ' + err.message, 'danger');
  }
}

// ---------- CREAR LIBRO (create-item.html) ----------
const bookForm = document.getElementById('book-form');
if (bookForm) {
  requireSession();

  bookForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value.trim();
    const author = document.getElementById('author').value.trim();
    const genre = document.getElementById('genre').value;
    const status = document.getElementById('status').value;
    const rating = parseInt(document.getElementById('rating').value);
    const cover_url = document.getElementById('cover_url').value.trim();
    const notes = document.getElementById('notes').value.trim();

    if (!title || !author) {
      return showAlert('Título y autor son obligatorios', 'warning');
    }

    try {
      const data = await apiFetch('/books', {
        method: 'POST',
        body: JSON.stringify({ title, author, genre, status, rating, cover_url, notes }),
      });

      showAlert(data.message, 'success');
      setTimeout(() => window.location.href = 'items.html', 800);
    } catch (err) {
      showAlert(err.message, 'danger');
    }
  });
}

// ---------- EDITAR LIBRO (edit-item.html) ----------
const editForm = document.getElementById('edit-book-form');
if (editForm) {
  (async () => {
    await requireSession();

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return window.location.href = 'items.html';

    try {
      const data = await apiFetch(`/books/${id}`);
      const book = data.book;

      document.getElementById('book-id').value = book.id;
      document.getElementById('title').value = book.title;
      document.getElementById('author').value = book.author;
      document.getElementById('genre').value = book.genre;
      document.getElementById('status').value = book.status;
      document.getElementById('rating').value = book.rating || 0;
      document.getElementById('cover_url').value = book.cover_url || '';
      document.getElementById('notes').value = book.notes || '';
    } catch (err) {
      showAlert('No se pudo cargar el libro', 'danger');
      setTimeout(() => window.location.href = 'items.html', 2000);
    }
  })();

  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('book-id').value;
    const title = document.getElementById('title').value.trim();
    const author = document.getElementById('author').value.trim();
    const genre = document.getElementById('genre').value;
    const status = document.getElementById('status').value;
    const rating = parseInt(document.getElementById('rating').value);
    const cover_url = document.getElementById('cover_url').value.trim();
    const notes = document.getElementById('notes').value.trim();

    if (!title || !author) {
      return showAlert('Título y autor son obligatorios', 'warning');
    }

    try {
      const data = await apiFetch(`/books/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ title, author, genre, status, rating, cover_url, notes }),
      });

      showAlert(data.message, 'success');
      setTimeout(() => window.location.href = 'items.html', 800);
    } catch (err) {
      showAlert(err.message, 'danger');
    }
  });
}
