/**
 * admin.js — Lógica de Interfaz del Panel de Administración (SPA)
 * El Bodegón de los Trajes (Tunja, Boyacá)
 * 
 * Módulos integrados:
 * 1. Autenticación y control de sesión segura (CSRF + X-Session-ID + Reauth Recovery)
 * 2. Catálogo de Trajes (CRUD completo)
 * 3. Temporada Activa y Hero Configurator
 * 4. Bandeja de Prospectos y Leads (WhatsApp Helper)
 * 5. Configuración General del Negocio
 */
(function () {
  'use strict';

  // Detección automática del backend (soporte para Live Server 5500/5501 hacia Docker 8095)
  function getApiBase() {
    if (location.port === '5500' || location.port === '5501' || location.port === '3000' || location.protocol === 'file:') {
      return 'http://localhost:8095';
    }
    return '';
  }
  var API_BASE = getApiBase();

  // Variables de Estado de Sesión (Persistentes con LocalStorage)
  var sessionId = '';
  var csrfToken = '';
  var currentAdminUser = 'Ana Avila';

  try {
    sessionId = localStorage.getItem('bodegon_session_id') || '';
    csrfToken = localStorage.getItem('bodegon_csrf_token') || '';
    currentAdminUser = localStorage.getItem('bodegon_admin_user') || 'Ana Avila';
  } catch (e) {}

  var SECCIONES_POR_TEMPORADA = {
    octubre: [
      { id: 'Terror', label: '🎃 Terror (Monstruos, Villanos, Sombras, Clásicos)' },
      { id: 'Princesas y Cuentos de Hadas', label: '👑 Princesas y Cuentos de Hadas (Blanca Nieves, Bella, Elsa, Mérida)' },
      { id: 'Superhéroes y Anime', label: '⚡ Superhéroes y Anime (Marvel, DC, Demon Slayer, Shonen)' },
      { id: 'Gala y Elegancia', label: '✨ Gala y Elegancia de Época' },
      { id: 'Oficios y Uniforme', label: '🩺 Oficios y Uniformes Divertidos (Médicos, Policías, Profesiones)' }
    ],
    noviembre: [
      { id: 'Alquiler de Togas y Trajes para Grados', label: '🎓 Togas y Birretes para Grados (Preescolar, Bachiller, Universidad)' },
      { id: 'Trajes Elegantes para Prom y Grados · Hombre, Mujer y Niños', label: '💃 Trajes Elegantes para Prom y Grados (Hombre, Mujer y Niños)' },
      { id: 'Alquiler de Bailes Típicos para Clausura', label: '🎭 Bailes Típicos y Danzas para Clausura Escolar' },
      { id: 'Mitología y Fantasía', label: '🏛️ Mitología, Dioses y Obras de Teatro' }
    ],
    diciembre: [
      { id: 'Disfraces Navideños', label: '🎅 Personajes Navideños (Papá Noel, Mamá Noel, Duendes, Elfos)' },
      { id: 'Pesebres en Vivo y Pastores', label: '🌟 Pesebres en Vivo (San José, María, Ángeles, Pastores)' },
      { id: 'Trajes Elegantes para Grados y Clausuras · Niños y Adultos', label: '🥂 Gala y Fin de Año (Esmoquin, Vestidos de Nochevieja)' },
      { id: 'Fantasía Invernal', label: '⛄ Fantasía Invernal (Reno, Muñeco de Nieve, Cascanueces)' }
    ],
    enero: [
      { id: 'Reyes Magos y Pajes', label: '👑 Reyes Magos y Pajes Reales (Melchor, Gaspar, Baltasar)' },
      { id: 'Batas Escolares y Médicas', label: '🥼 Batas de Laboratorio y Médicas a la Medida' },
      { id: 'Uniformes Escolares y Dotación', label: '🎒 Uniformes Escolares y Dotación Institucional' }
    ],
    febrero: [
      { id: 'Carnaval de Negros y Blancos', label: '🎉 Carnaval de Negros y Blancos & Comparsas con Plumas' },
      { id: 'San Valentín y Bodas', label: '❤️ San Valentín & Gala Romántica de Pareja' },
      { id: 'Danzas Típicas de Carnaval', label: '💃 Trajes Folclóricos de Danza y Comparsas' }
    ],
    marzo: [
      { id: 'Cuaresma y Semana Santa', label: '✝️ Túnicas, Nazarenos y Personajes Bíblicos de Cuaresma' },
      { id: 'Ejecutivos y Sastrería', label: '👔 Trajes Ejecutivos y Sastrería a la Medida' },
      { id: 'Día de la Mujer y Gala', label: '👗 Gala y Alta Costura para el Día de la Mujer' }
    ],
    abril: [
      { id: 'Prenda Nueva de Primavera', label: '🌱 Ropa y Conjuntos de Primavera y Feria' },
      { id: 'Día del Niño y Personajes', label: '🎈 Disfraces Infantiles del Día del Niño' },
      { id: 'Feria y Uniformes', label: '🩺 Batas y Uniformes Escolares de Renovación' }
    ],
    mayo: [
      { id: 'Para Regalar a Mamá', label: '💐 Vestidos y Conjuntos de Gala para el Día de la Madre' },
      { id: 'Primeras Comuniones', label: '🕊️ Trajes y Vestidos para Primera Comunión' },
      { id: 'Para Toda la Familia', label: '✨ Conjuntos Elegantes Familiares' }
    ],
    junio: [
      { id: 'Quinceañeras y Damas', label: '👑 Vestidos de Quinceañera y Damas de Honor' },
      { id: 'Bodas y Día del Padre', label: '💍 Novias, Esmoquin y Trajes para Caballeros' },
      { id: 'San Pedro y Folclor', label: '🎭 Trajes Típicos para Fiestas de San Pedro y San Juan' }
    ],
    julio: [
      { id: 'Fiestas Patrias y Desfiles', label: '🇨🇴 Trajes del 20 de Julio y Desfile Militar / Escolar' },
      { id: 'Folclor Andino y Boyacense', label: '🏔️ Danzas y Folclor de Boyacá y Colombia' },
      { id: 'Veraneo y Vacaciones', label: '☀️ Conjuntos y Trajes de Verano' }
    ],
    agosto: [
      { id: 'Aniversario de Tunja', label: '🪁 Trajes de Época y Conmemoración de Tunja' },
      { id: 'Ropa de Gala y Fiestas', label: '✨ Vestidos de Gala y Celebraciones' },
      { id: 'Comparsas de Viento', label: '🎉 Comparsas y Festivales de Verano' }
    ],
    septiembre: [
      { id: 'Amor y Amistad', label: '❤️ Cenas Románticas, Gala y Amor y Amistad' },
      { id: 'Día de la Raza y Colegio', label: '🌎 Trajes Típicos para el Día de la Raza' },
      { id: 'Aniversarios Especiales', label: '✨ Trajes Elegantes para Eventos Sociales' }
    ]
  };

  function getSeccionesForSeason(seasonId) {
    var sid = (seasonId || 'octubre').toLowerCase();
    return SECCIONES_POR_TEMPORADA[sid] || SECCIONES_POR_TEMPORADA['octubre'];
  }

  function buildOptionsHtmlAdmin(seasonId, activeCat) {
    var sPresets = getSeccionesForSeason(seasonId);
    var match = sPresets.find(function (p) { return p.id.toLowerCase() === (activeCat || '').toLowerCase(); });
    var activePreset = match ? match.id : (activeCat ? '_custom_' : sPresets[0].id);
    return sPresets.map(function (p) {
      var sel = (activePreset === p.id) ? 'selected' : '';
      return '<option value="' + escapeHtml(p.id) + '" ' + sel + '>' + escapeHtml(p.label) + '</option>';
    }).join('') + '<option value="_custom_" ' + (activePreset === '_custom_' ? 'selected' : '') + '>✏️ Otra sección personalizada...</option>';
  }

  var catalogData = null;
  var leadsData = [];

  // Elementos DOM principales
  var loginScreen = document.getElementById('login-screen');
  var adminPanel = document.getElementById('admin-panel');
  var loginForm = document.getElementById('login-form');
  var loginError = document.getElementById('login-error');
  var loginBtn = document.getElementById('login-btn');
  var logoutBtn = document.getElementById('logout-btn');
  var userDisplay = document.getElementById('user-display');

  // Elementos del Modal de Reautenticación (Auto-Recovery)
  var reauthModal = document.getElementById('reauth-modal');
  var reauthForm = document.getElementById('reauth-form');
  var reauthUsername = document.getElementById('reauth-username');
  var reauthPassword = document.getElementById('reauth-password');
  var reauthError = document.getElementById('reauth-error');
  var btnCloseReauthModal = document.getElementById('btn-close-reauth-modal');
  var btnCancelReauth = document.getElementById('btn-cancel-reauth');
  var btnSubmitReauth = document.getElementById('btn-submit-reauth');
  var pendingActionCallback = null;

  // Elementos de Catálogo
  var trajesContainer = document.getElementById('trajes-container');
  var catalogSearch = document.getElementById('catalog-search');
  var catalogSeasonFilter = document.getElementById('catalog-season-filter');
  var btnNuevoTraje = document.getElementById('btn-nuevo-traje');
  var countTrajes = document.getElementById('count-trajes');

  // Modal Traje
  var trajeModal = document.getElementById('traje-modal');
  var trajeForm = document.getElementById('traje-form');
  var trajeModalTitle = document.getElementById('traje-modal-title');
  var btnCloseTrajeModal = document.getElementById('btn-close-traje-modal');
  var btnCancelTraje = document.getElementById('btn-cancel-traje');
  var btnSaveTraje = document.getElementById('btn-save-traje');
  var photoFileInput = document.getElementById('photo-file-input');
  var btnSelectPhoto = document.getElementById('btn-select-photo');
  var photoPreviewImg = document.getElementById('photo-preview-img');
  var photoUploadStatus = document.getElementById('photo-upload-status');
  var trajeFotoHidden = document.getElementById('traje-foto');

  // Elementos de Temporada y Hero
  var seasonForm = document.getElementById('season-form');
  var activeSeasonSelect = document.getElementById('active-season-select');
  var heroForm = document.getElementById('hero-form');
  var heroTagInput = document.getElementById('hero-tag');
  var heroTituloInput = document.getElementById('hero-titulo');
  var heroSubtituloInput = document.getElementById('hero-subtitulo');

  // Elementos de Leads
  var leadsTableBody = document.getElementById('leads-table-body');
  var countLeads = document.getElementById('count-leads');

  // Elementos de Ajustes
  var settingsForm = document.getElementById('settings-form');

  // Notificaciones Toast
  var toastEl = document.getElementById('toast');
  var toastTimer = null;

  function showToast(msg, type) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.className = 'toast toast-' + (type || 'success');
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.hidden = true;
    }, 3500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // =========================================================================
  // 1. GESTIÓN DE SESIÓN Y AUTENTICACIÓN CENTRALIZADA
  // =========================================================================

  /**
   * Wrapper unificado de fetch para inyectar X-Session-ID, X-CSRF-Token y credenciales
   */
  function adminApiFetch(endpoint, options) {
    options = options || {};
    var headers = Object.assign({}, options.headers || {});

    if (csrfToken && !headers['X-CSRF-Token']) {
      headers['X-CSRF-Token'] = csrfToken;
    }
    if (sessionId && !headers['X-Session-ID']) {
      headers['X-Session-ID'] = sessionId;
      headers['Authorization'] = 'Bearer ' + sessionId;
    }
    options.headers = headers;
    options.credentials = 'include';

    var fullUrl = (endpoint.startsWith('http') ? '' : API_BASE) + endpoint;
    return fetch(fullUrl, options);
  }

  function saveSessionState(data) {
    if (!data) return;
    if (data.session_id) {
      sessionId = data.session_id;
      try { localStorage.setItem('bodegon_session_id', sessionId); } catch (e) {}
    }
    if (data.csrf_token) {
      csrfToken = data.csrf_token;
      try { localStorage.setItem('bodegon_csrf_token', csrfToken); } catch (e) {}
    }
    if (data.user) {
      currentAdminUser = data.user;
      try { localStorage.setItem('bodegon_admin_user', currentAdminUser); } catch (e) {}
      if (userDisplay) userDisplay.textContent = '👤 ' + data.user;
      if (reauthUsername) reauthUsername.value = data.user;
    }
  }

  function clearSessionState() {
    sessionId = '';
    csrfToken = '';
    try {
      localStorage.removeItem('bodegon_session_id');
      localStorage.removeItem('bodegon_csrf_token');
      localStorage.removeItem('bodegon_admin_user');
    } catch (e) {}
  }

  function showReauthModal(callback) {
    pendingActionCallback = callback || null;
    if (reauthUsername) {
      reauthUsername.value = currentAdminUser || 'Ana Avila';
    }
    if (reauthPassword) {
      reauthPassword.value = '';
    }
    if (reauthError) {
      reauthError.hidden = true;
      reauthError.textContent = '';
    }
    if (reauthModal) {
      reauthModal.hidden = false;
      setTimeout(function () {
        if (reauthPassword) reauthPassword.focus();
      }, 50);
    }
  }

  function closeReauthModal() {
    if (reauthModal) reauthModal.hidden = true;
    pendingActionCallback = null;
  }

  if (btnCloseReauthModal) btnCloseReauthModal.addEventListener('click', closeReauthModal);
  if (btnCancelReauth) btnCancelReauth.addEventListener('click', closeReauthModal);

  if (reauthForm) {
    reauthForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (reauthError) reauthError.hidden = true;
      if (btnSubmitReauth) {
        btnSubmitReauth.disabled = true;
        btnSubmitReauth.textContent = 'Verificando...';
      }

      var user = (reauthUsername && reauthUsername.value) ? reauthUsername.value.trim() : (currentAdminUser || 'Ana Avila');
      var pass = reauthPassword ? reauthPassword.value : '';

      adminApiFetch('/api/auth?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: user, pass: pass })
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data && data.ok) {
            saveSessionState(data);
            closeReauthModal();
            showToast('✅ Sesión reanudada con éxito', 'success');
            if (typeof pendingActionCallback === 'function') {
              var cb = pendingActionCallback;
              pendingActionCallback = null;
              cb();
            }
          } else {
            if (reauthError) {
              reauthError.textContent = data.error || 'Credenciales incorrectas.';
              reauthError.hidden = false;
            }
          }
        })
        .catch(function () {
          if (reauthError) {
            reauthError.textContent = 'Error de conexión con el servidor.';
            reauthError.hidden = false;
          }
        })
        .finally(function () {
          if (btnSubmitReauth) {
            btnSubmitReauth.disabled = false;
            btnSubmitReauth.textContent = 'Reanudar y Continuar';
          }
        });
    });
  }

  function checkAuth() {
    adminApiFetch('/api/auth?action=status')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.authenticated) {
          saveSessionState(data);
          showAdminPanel();
        } else {
          clearSessionState();
          showLoginScreen();
        }
      })
      .catch(function () {
        if (sessionId) {
          showAdminPanel();
        } else {
          showLoginScreen();
        }
      });
  }

  function showAdminPanel() {
    loginScreen.hidden = true;
    adminPanel.hidden = false;
    loadCatalog();
    loadLeads();
    loadSettings();
  }

  function showLoginScreen() {
    loginScreen.hidden = false;
    adminPanel.hidden = true;
  }

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    loginError.hidden = true;
    loginBtn.disabled = true;
    loginBtn.textContent = 'Comprobando...';

    var user = document.getElementById('username').value.trim();
    var pass = document.getElementById('password').value;

    adminApiFetch('/api/auth?action=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: user, pass: pass })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.ok) {
          saveSessionState(data);
          showToast('Bienvenida al panel de administración', 'success');
          showAdminPanel();
        } else {
          loginError.textContent = data.error || 'Credenciales no válidas.';
          loginError.hidden = false;
        }
      })
      .catch(function () {
        var isLocalDev = (location.port === '5500' || location.port === '5501' || location.port === '3000' || location.protocol === 'file:');
        if (isLocalDev && (pass === 'ANAISABEL2026' || pass === 'admin2026')) {
          var mockSession = {
            ok: true,
            user: user || 'Ana Avila',
            csrf_token: 'local-dev-token-' + Date.now(),
            session_id: 'local-session-' + Date.now()
          };
          saveSessionState(mockSession);
          showToast('Bienvenida al panel de administración (Modo Local)', 'success');
          showAdminPanel();
          return;
        }
        loginError.textContent = 'Error de conexión con el servidor.';
        loginError.hidden = false;
      })
      .finally(function () {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Iniciar Sesión';
      });
  });

  logoutBtn.addEventListener('click', function () {
    adminApiFetch('/api/auth?action=logout', {
      method: 'POST'
    }).finally(function () {
      clearSessionState();
      showToast('Sesión cerrada exitosamente', 'success');
      showLoginScreen();
    });
  });

  // =========================================================================
  // 2. NAVEGACIÓN POR PESTAÑAS
  // =========================================================================
  document.querySelectorAll('.nav-tab').forEach(function (tabBtn) {
    tabBtn.addEventListener('click', function () {
      document.querySelectorAll('.nav-tab').forEach(function (t) { t.classList.remove('is-active'); });
      document.querySelectorAll('.tab-pane').forEach(function (p) { p.classList.remove('is-active'); });

      tabBtn.classList.add('is-active');
      var targetId = 'tab-' + tabBtn.getAttribute('data-tab');
      var targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('is-active');
    });
  });

  // =========================================================================
  // 3. MÓDULO 1: CATÁLOGO DE TRAJES (CRUD)
  // =========================================================================
  function loadCatalog() {
    adminApiFetch('/api/catalogo')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data || !data.trajes) return;
        catalogData = data;
        countTrajes.textContent = data.trajes.length;
        renderCatalogGrid();
        populateSeasonAndHero(data);
      })
      .catch(function () {
        // Fallback local: cargar data/catalogo.json directamente
        fetch('../data/catalogo.json?v=' + Date.now())
          .then(function (res) { return res.json(); })
          .then(function (data) {
            if (!data || !data.trajes) return;
            catalogData = data;
            countTrajes.textContent = data.trajes.length;
            renderCatalogGrid();
            populateSeasonAndHero(data);
          })
          .catch(function (err) {
            trajesContainer.innerHTML = '<div class="error-msg">Error al cargar el catálogo: ' + escapeHtml(err.message) + '</div>';
          });
      });
  }

  function renderCatalogGrid() {
    if (!catalogData || !Array.isArray(catalogData.trajes)) return;

    var query = (catalogSearch.value || '').toLowerCase().trim();
    var seasonFilter = catalogSeasonFilter.value;

    var filtered = catalogData.trajes.filter(function (t) {
      if (seasonFilter !== 'all' && t.temporada !== seasonFilter) return false;
      if (query !== '') {
        var matchTitle = (t.titulo || '').toLowerCase().includes(query);
        var matchDesc = (t.descripcion || '').toLowerCase().includes(query);
        var matchGroup = (t.grupo || '').toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchGroup) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      trajesContainer.innerHTML = '<div class="text-center" style="grid-column: 1/-1; padding: 3rem; color: var(--text-muted);">' +
        'No se encontraron trajes con los filtros aplicados.</div>';
      return;
    }

    var html = '';
    filtered.forEach(function (t) {
      var photoSrc = t.foto || '../assets/img/ph-generico.svg';
      if (!photoSrc.startsWith('/') && !photoSrc.startsWith('http')) {
        photoSrc = '../' + photoSrc;
      }

      var statusBadge = t.activo !== false
        ? '<span class="badge-status active">Visible</span>'
        : '<span class="badge-status inactive">Oculto</span>';

      html += '<div class="traje-card" data-id="' + escapeHtml(t.id) + '">' +
        '<div class="traje-card-img">' +
          '<img loading="lazy" src="' + escapeHtml(photoSrc) + '" alt="' + escapeHtml(t.titulo) + '">' +
          '<span class="badge-season">' + escapeHtml(t.temporada) + '</span>' +
          statusBadge +
        '</div>' +
        '<div class="traje-card-body">' +
          '<span class="traje-card-group">' + escapeHtml(t.grupo || 'General') + '</span>' +
          '<h4 class="traje-card-title">' + escapeHtml(t.titulo) + '</h4>' +
          '<p class="traje-card-desc">' + escapeHtml(t.descripcion || 'Sin descripción detallada.') + '</p>' +
          '<div class="traje-card-actions">' +
            '<button type="button" class="btn btn-secondary btn-sm btn-edit-traje" data-id="' + escapeHtml(t.id) + '">✏️ Editar</button>' +
            '<button type="button" class="btn btn-danger btn-sm btn-delete-traje" data-id="' + escapeHtml(t.id) + '">🗑️ Eliminar</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    });

    trajesContainer.innerHTML = html;

    // Enlazar eventos de botones de tarjetas
    trajesContainer.querySelectorAll('.btn-edit-traje').forEach(function (b) {
      b.addEventListener('click', function () { openEditTrajeModal(b.getAttribute('data-id')); });
    });
    trajesContainer.querySelectorAll('.btn-delete-traje').forEach(function (b) {
      b.addEventListener('click', function () { confirmDeleteTraje(b.getAttribute('data-id')); });
    });
  }

  catalogSearch.addEventListener('input', renderCatalogGrid);
  catalogSeasonFilter.addEventListener('change', renderCatalogGrid);

  // Control dinámico de selección de sección
  var seccionSelectAdmin = document.getElementById('traje-seccion-select');
  var customGrupoInputAdmin = document.getElementById('traje-grupo');
  var modalTemporadaSelect = document.getElementById('traje-temporada');

  if (modalTemporadaSelect && seccionSelectAdmin) {
    modalTemporadaSelect.addEventListener('change', function () {
      var s = modalTemporadaSelect.value;
      seccionSelectAdmin.innerHTML = buildOptionsHtmlAdmin(s, '');
      seccionSelectAdmin.dispatchEvent(new Event('change'));
    });
  }

  if (seccionSelectAdmin && customGrupoInputAdmin) {
    seccionSelectAdmin.addEventListener('change', function () {
      if (seccionSelectAdmin.value === '_custom_') {
        customGrupoInputAdmin.style.display = 'block';
        customGrupoInputAdmin.focus();
      } else {
        customGrupoInputAdmin.style.display = 'none';
        customGrupoInputAdmin.value = seccionSelectAdmin.value;
      }
    });
  }

  // Modal: Abrir para nuevo traje
  btnNuevoTraje.addEventListener('click', function () {
    trajeForm.reset();
    document.getElementById('traje-id').value = '';
    trajeModalTitle.textContent = 'Nuevo Traje';
    photoPreviewImg.src = '../assets/img/ph-generico.svg';
    trajeFotoHidden.value = '';
    photoUploadStatus.textContent = 'Formatos: WebP, JPG, PNG (máx 10 MB)';

    var initSeason = modalTemporadaSelect ? modalTemporadaSelect.value : 'octubre';
    if (seccionSelectAdmin) {
      seccionSelectAdmin.innerHTML = buildOptionsHtmlAdmin(initSeason, '');
      seccionSelectAdmin.selectedIndex = 0;
    }
    if (customGrupoInputAdmin) {
      customGrupoInputAdmin.style.display = 'none';
      customGrupoInputAdmin.value = seccionSelectAdmin ? seccionSelectAdmin.value : '';
    }

    var destEl = document.getElementById('traje-destacado');
    if (destEl) destEl.checked = false;
    var fmtEl = document.getElementById('traje-formato-foto');
    if (fmtEl) fmtEl.value = 'carta';
    document.getElementById('traje-activo').checked = true;
    trajeModal.hidden = false;
  });

  // Modal: Abrir para editar traje
  function openEditTrajeModal(id) {
    if (!catalogData) return;
    var traje = catalogData.trajes.find(function (t) { return t.id === id; });
    if (!traje) return;

    trajeForm.reset();
    document.getElementById('traje-id').value = traje.id;
    trajeModalTitle.textContent = 'Editar Traje: ' + traje.titulo;
    document.getElementById('traje-titulo').value = traje.titulo || '';
    
    var editSeason = traje.temporada || 'octubre';
    if (modalTemporadaSelect) modalTemporadaSelect.value = editSeason;

    var curCat = traje.categoria || traje.grupo || '';
    if (seccionSelectAdmin) {
      seccionSelectAdmin.innerHTML = buildOptionsHtmlAdmin(editSeason, curCat);
      if (seccionSelectAdmin.value === '_custom_') {
        if (customGrupoInputAdmin) {
          customGrupoInputAdmin.style.display = 'block';
          customGrupoInputAdmin.value = curCat;
        }
      } else {
        if (customGrupoInputAdmin) {
          customGrupoInputAdmin.style.display = 'none';
          customGrupoInputAdmin.value = seccionSelectAdmin.value;
        }
      }
    }

    var editDestEl = document.getElementById('traje-destacado');
    if (editDestEl) editDestEl.checked = Boolean(traje.destacado === true || traje.destacado === 'true' || traje.destacado === 1);
    var editFmtEl = document.getElementById('traje-formato-foto');
    if (editFmtEl) editFmtEl.value = traje.formato_foto || 'carta';

    document.getElementById('traje-tallas').value = Array.isArray(traje.tallas) ? traje.tallas.join(', ') : '';
    document.getElementById('traje-descripcion').value = traje.descripcion || '';
    trajeFotoHidden.value = traje.foto || '';

    var photoSrc = traje.foto || '../assets/img/ph-generico.svg';
    if (!photoSrc.startsWith('/') && !photoSrc.startsWith('http')) {
      photoSrc = '../' + photoSrc;
    }
    photoPreviewImg.src = photoSrc;
    photoUploadStatus.textContent = 'Fotografía actual lista para usar.';
    document.getElementById('traje-activo').checked = (traje.activo !== false);

    var btnModalDelete = document.getElementById('btn-modal-delete-traje');
    if (btnModalDelete) {
      btnModalDelete.style.display = 'inline-block';
      btnModalDelete.onclick = function () {
        closeTrajeModal();
        confirmDeleteTraje(traje.id);
      };
    }

    trajeModal.hidden = false;
  }

  function closeTrajeModal() {
    trajeModal.hidden = true;
    var btnModalDelete = document.getElementById('btn-modal-delete-traje');
    if (btnModalDelete) btnModalDelete.style.display = 'none';
  }
  btnCloseTrajeModal.addEventListener('click', closeTrajeModal);
  btnCancelTraje.addEventListener('click', closeTrajeModal);

  // Subida de Fotografías con previsualización inmediata y auto-recuperación de sesión
  btnSelectPhoto.addEventListener('click', function () {
    photoFileInput.click();
  });

  photoFileInput.addEventListener('change', function () {
    if (!photoFileInput.files || !photoFileInput.files[0]) return;
    var file = photoFileInput.files[0];

    // Previsualización instantánea en el navegador para que nunca aparezca ícono roto
    try {
      var localBlobUrl = URL.createObjectURL(file);
      photoPreviewImg.src = localBlobUrl;
    } catch (e) {}

    performUploadPhoto(file);
  });

  function performUploadPhoto(file) {
    photoUploadStatus.textContent = 'Subiendo y optimizando a WebP...';
    btnSelectPhoto.disabled = true;

    var formData = new FormData();
    formData.append('file', file);

    adminApiFetch('/api/upload-media', {
      method: 'POST',
      body: formData
    })
      .then(function (res) {
        if (res.status === 401) {
          throw new Error('AUTH_401');
        }
        return res.json();
      })
      .then(function (data) {
        if (data && data.ok && data.url) {
          trajeFotoHidden.value = data.url;
          var displaySrc = (data.url.startsWith('/') || data.url.startsWith('http')) ? data.url : ('../' + data.url);
          photoPreviewImg.src = displaySrc;
          photoUploadStatus.textContent = '¡Imagen WebP lista!';
          showToast('Foto cargada y convertida a WebP', 'success');
        } else {
          photoUploadStatus.textContent = 'Error: ' + (data.error || 'Subida rechazada.');
          showToast(data.error || 'Error al subir la imagen', 'error');
        }
      })
      .catch(function (err) {
        if (err && err.message === 'AUTH_401') {
          photoUploadStatus.textContent = 'Sesión pausada. Confirma tu contraseña para continuar.';
          showToast('Sesión inactiva. Confirma tu contraseña para continuar.', 'error');
          showReauthModal(function () {
            performUploadPhoto(file); // Reintento automático sin perder datos
          });
          return;
        }
        photoUploadStatus.textContent = 'Error de red al subir foto.';
        showToast('Error de conexión', 'error');
      })
      .finally(function () {
        btnSelectPhoto.disabled = false;
      });
  }

  // Guardar Traje (Crear o Actualizar)
  trajeForm.addEventListener('submit', function (e) {
    e.preventDefault();
    executeSaveTraje();
  });

  function executeSaveTraje() {
    btnSaveTraje.disabled = true;
    btnSaveTraje.textContent = 'Guardando...';

    var id = document.getElementById('traje-id').value;
    var isEdit = (id !== '');

    var tallasStr = document.getElementById('traje-tallas').value;
    var tallas = tallasStr.split(',').map(function (s) { return s.trim(); }).filter(Boolean);

    var seccionAdmin = (seccionSelectAdmin && seccionSelectAdmin.value === '_custom_')
      ? (customGrupoInputAdmin ? customGrupoInputAdmin.value.trim() : 'General')
      : (seccionSelectAdmin ? seccionSelectAdmin.value : 'General');
    if (!seccionAdmin) seccionAdmin = 'General';

    var destChecked = document.getElementById('traje-destacado') ? document.getElementById('traje-destacado').checked : false;
    var fmtVal = document.getElementById('traje-formato-foto') ? document.getElementById('traje-formato-foto').value : 'carta';

    var payload = {
      id: id,
      titulo: document.getElementById('traje-titulo').value.trim(),
      temporada: document.getElementById('traje-temporada').value,
      categoria: seccionAdmin,
      grupo: seccionAdmin,
      destacado: destChecked,
      formato_foto: fmtVal,
      tallas: tallas.length ? tallas : ['S', 'M', 'L', 'A la medida'],
      descripcion: document.getElementById('traje-descripcion').value.trim(),
      foto: trajeFotoHidden.value,
      activo: document.getElementById('traje-activo').checked
    };

    var method = isEdit ? 'PUT' : 'POST';

    adminApiFetch('/api/catalogo', {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (res.status === 401) {
          throw new Error('AUTH_401');
        }
        return res.json();
      })
      .then(function (data) {
        if (data && data.ok) {
          showToast(isEdit ? 'Prenda actualizada con éxito' : 'Nueva prenda agregada al catálogo', 'success');
          closeTrajeModal();
          loadCatalog();
        } else {
          showToast(data.error || 'Error al guardar la prenda', 'error');
        }
      })
      .catch(function (err) {
        if (err && err.message === 'AUTH_401') {
          showToast('Sesión pausada. Confirma tu contraseña para guardar.', 'error');
          showReauthModal(function () {
            executeSaveTraje(); // Reintento automático
          });
          return;
        }
        showToast('Error de conexión con el servidor', 'error');
      })
      .finally(function () {
        btnSaveTraje.disabled = false;
        btnSaveTraje.textContent = 'Guardar Prenda';
      });
  }

  // Eliminar Traje
  function confirmDeleteTraje(id) {
    if (!catalogData) return;
    var traje = catalogData.trajes.find(function (t) { return t.id === id; });
    if (!traje) return;

    if (!confirm('¿Estás seguro de que deseas eliminar la prenda "' + traje.titulo + '"? Esta acción no se puede deshacer.')) {
      return;
    }

    adminApiFetch('/api/catalogo?id=' + encodeURIComponent(id), {
      method: 'DELETE'
    })
      .then(function (res) {
        if (res.status === 401) throw new Error('AUTH_401');
        return res.json();
      })
      .then(function (data) {
        if (data && data.ok) {
          showToast('Prenda eliminada del catálogo', 'success');
          loadCatalog();
        } else {
          showToast(data.error || 'Error al eliminar', 'error');
        }
      })
      .catch(function (err) {
        if (err && err.message === 'AUTH_401') {
          showReauthModal(function () { confirmDeleteTraje(id); });
          return;
        }
        showToast('Error al conectar con el servidor', 'error');
      });
  }

  // =========================================================================
  // 4. MÓDULO 2: TEMPORADA ACTIVA Y HERO
  // =========================================================================
  function populateSeasonAndHero(data) {
    if (data.temporada_activa) {
      activeSeasonSelect.value = data.temporada_activa;
    }
    if (data.hero_general) {
      heroTagInput.value = data.hero_general.tag || '';
      heroTituloInput.value = data.hero_general.titulo || '';
      heroSubtituloInput.value = data.hero_general.subtitulo || '';
    }
  }

  seasonForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var newSeason = activeSeasonSelect.value;

    adminApiFetch('/api/catalogo?action=set_season', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ temporada: newSeason })
    })
      .then(function (res) {
        if (res.status === 401) throw new Error('AUTH_401');
        return res.json();
      })
      .then(function (data) {
        if (data && data.ok) {
          showToast('Temporada activa actualizada a ' + newSeason, 'success');
          loadCatalog();
        } else {
          showToast(data.error || 'Error al guardar temporada', 'error');
        }
      })
      .catch(function (err) {
        if (err && err.message === 'AUTH_401') {
          showReauthModal(function () { seasonForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
          return;
        }
        showToast('Error al conectar con el servidor', 'error');
      });
  });

  heroForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var payload = {
      tag: heroTagInput.value.trim(),
      titulo: heroTituloInput.value.trim(),
      subtitulo: heroSubtituloInput.value.trim()
    };

    adminApiFetch('/api/catalogo?action=update_hero', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ hero: payload })
    })
      .then(function (res) {
        if (res.status === 401) throw new Error('AUTH_401');
        return res.json();
      })
      .then(function (data) {
        if (data && data.ok) {
          showToast('Textos del banner principal guardados', 'success');
          loadCatalog();
        } else {
          showToast(data.error || 'Error al guardar el banner', 'error');
        }
      })
      .catch(function (err) {
        if (err && err.message === 'AUTH_401') {
          showReauthModal(function () { heroForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
          return;
        }
        showToast('Error al conectar con el servidor', 'error');
      });
  });

  // =========================================================================
  // 5. MÓDULO 3: BANDEJA DE PROSPECTOS Y LEADS
  // =========================================================================
  function loadLeads() {
    adminApiFetch('/api/leads')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && Array.isArray(data.leads)) {
          leadsData = data.leads;
          countLeads.textContent = leadsData.length;
          renderLeadsTable();
        }
      })
      .catch(function () {
        leadsTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No se pudieron cargar los mensajes.</td></tr>';
      });
  }

  function renderLeadsTable() {
    if (!leadsData || leadsData.length === 0) {
      leadsTableBody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding: 2rem; color: var(--text-muted);">' +
        'No hay mensajes ni solicitudes registradas aún.</td></tr>';
      return;
    }

    var html = '';
    leadsData.forEach(function (lead) {
      var dateStr = lead.fecha ? new Date(lead.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';
      var contactStr = lead.whatsapp || lead.correo || 'Sin contacto';
      var waBtn = lead.wa_link
        ? '<a href="' + escapeHtml(lead.wa_link) + '" target="_blank" class="btn btn-whatsapp">💬 Responder WhatsApp</a>'
        : '<span class="text-muted">Sin teléfono</span>';

      html += '<tr>' +
        '<td>' + escapeHtml(dateStr) + '</td>' +
        '<td><strong>' + escapeHtml(lead.nombre || 'Anónimo') + '</strong></td>' +
        '<td>' + escapeHtml(contactStr) + '</td>' +
        '<td><span class="badge-lead">' + escapeHtml(lead.tipo || lead.categoria || 'Contacto') + '</span></td>' +
        '<td>' + escapeHtml(lead.mensaje || '-') + '</td>' +
        '<td>' + waBtn + '</td>' +
      '</tr>';
    });

    leadsTableBody.innerHTML = html;
  }

  // =========================================================================
  // 6. MÓDULO 4: AJUSTES GENERALES DEL NEGOCIO
  // =========================================================================
  function loadSettings() {
    adminApiFetch('/api/config')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.ok && data.config) {
          var c = data.config;
          var elWa = document.getElementById('cfg-whatsapp');
          var elPhone = document.getElementById('cfg-phone-display');
          var elEmail = document.getElementById('cfg-email');
          var elAddr = document.getElementById('cfg-address');
          var elWeek = document.getElementById('cfg-hours-week');
          var elSun = document.getElementById('cfg-hours-sun');

          if (elWa && c.whatsapp) elWa.value = c.whatsapp;
          if (elPhone && c.phone_display) elPhone.value = c.phone_display;
          if (elEmail && c.email) elEmail.value = c.email;
          if (elAddr && c.address) elAddr.value = c.address;
          if (elWeek && c.hours_week) elWeek.value = c.hours_week;
          if (elSun && c.hours_sun) elSun.value = c.hours_sun;
        }
      })
      .catch(function () {
        // En caso de fallo de red, mantiene los valores predeterminados
      });
  }

  settingsForm.addEventListener('submit', function (e) {
    e.preventDefault();

    var payload = {
      whatsapp: document.getElementById('cfg-whatsapp').value.trim(),
      phone_display: document.getElementById('cfg-phone-display').value.trim(),
      email: document.getElementById('cfg-email').value.trim(),
      address: document.getElementById('cfg-address').value.trim(),
      hours_week: document.getElementById('cfg-hours-week').value.trim(),
      hours_sun: document.getElementById('cfg-hours-sun').value.trim()
    };

    var btnSubmit = settingsForm.querySelector('button[type="submit"]');
    var originalText = btnSubmit ? btnSubmit.textContent : 'Guardar';
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Guardando ajustes...';
    }

    adminApiFetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.ok) {
          showToast('Configuración del negocio guardada exitosamente.', 'success');
          loadSettings();
        } else {
          showToast(data.error || 'Error al guardar la configuración', 'error');
        }
      })
      .catch(function (err) {
        if (err && err.message === 'AUTH_401') {
          showReauthModal(function () {
            settingsForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          });
          return;
        }
        showToast('Error de conexión al guardar los ajustes.', 'error');
      })
      .finally(function () {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = originalText;
        }
      });
  });

  // Inicialización al cargar la página
  checkAuth();
})();

