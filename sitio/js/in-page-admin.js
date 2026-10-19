/**
 * in-page-admin.js — Modo Edición en Vivo para la Landing Page
 * El Bodegón de los Trajes (Tunja, Boyacá)
 * 
 * Responsabilidad Única:
 * - Proveer autenticación directa en la Landing Page sin redirecciones forzadas.
 * - Mostrar una barra superior discreta de administración (Admin Bar) al iniciar sesión.
 * - Agregar controles de edición directa ("✏️") sobre cada tarjeta del catálogo.
 * - Permitir la creación, edición y eliminación de trajes en vivo mediante el API REST.
 * - Mantener comunicación reactiva con catalog-renderer.js sin recargar la página.
 */
(function () {
  'use strict';

  // Variables de Estado de Sesión (Persistentes con LocalStorage y sincronizadas con /admin/)
  var sessionId = '';
  var csrfToken = '';
  var currentUser = '';
  var isAdmin = false;
  var currentEditTraje = null;
  var toastTimer = null;

  try {
    sessionId = localStorage.getItem('bodegon_session_id') || '';
    csrfToken = localStorage.getItem('bodegon_csrf_token') || '';
    currentUser = localStorage.getItem('bodegon_admin_user') || '';
  } catch (e) {}

  function saveSession(data) {
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
      currentUser = data.user;
      try { localStorage.setItem('bodegon_admin_user', currentUser); } catch (e) {}
    }
  }

  function clearSession() {
    sessionId = '';
    csrfToken = '';
    try {
      localStorage.removeItem('bodegon_session_id');
      localStorage.removeItem('bodegon_csrf_token');
      localStorage.removeItem('bodegon_admin_user');
    } catch (e) {}
  }

  function getApiBase() {
    if (window.BODEGON_API_URL) return window.BODEGON_API_URL;
    return '';
  }
  var API_BASE = getApiBase();

  /**
   * Wrapper unificado de fetch para inyectar credenciales, X-Session-ID y X-CSRF-Token
   */
  function inpageApiFetch(endpoint, options) {
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

  var SEASONS = [
    { id: 'octubre', label: 'Octubre (Halloween)' },
    { id: 'diciembre', label: 'Diciembre (Navidad & Fin de Año)' },
    { id: 'enero', label: 'Enero (Operación Retorno)' },
    { id: 'febrero', label: 'Febrero (Carnaval & Glamour)' },
    { id: 'marzo', label: 'Marzo (Efecto Ejecutivo)' },
    { id: 'abril', label: 'Abril (Feria & Renovación)' },
    { id: 'mayo', label: 'Mayo (Madres & Gala)' },
    { id: 'junio', label: 'Junio (San Pedro & Tradición)' },
    { id: 'julio', label: 'Julio (Independencia & Orgullo)' },
    { id: 'agosto', label: 'Agosto (Cometas & Vientos)' },
    { id: 'septiembre', label: 'Septiembre (Amor & Amistad)' },
    { id: 'noviembre', label: 'Noviembre (Mitología & Fantasía)' }
  ];

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

  // =========================================================================
  // 1. UTILIDADES Y TOAST
  // =========================================================================
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showToast(msg) {
    var toast = document.getElementById('inpage-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'inpage-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = '<span>&#10003;</span> ' + escapeHtml(msg);
    toast.style.display = 'flex';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      if (toast) toast.style.display = 'none';
    }, 4000);
  }

  /**
   * Panel inline de reautenticación rápida sin pérdida de formulario
   */
  function showInlineReauth(container, onSuccess) {
    if (!container) return;
    var existing = container.querySelector('.inpage-reauth-box');
    if (existing) existing.remove();

    var box = document.createElement('div');
    box.className = 'inpage-reauth-box';
    box.style.cssText = 'background: rgba(220, 38, 38, 0.18); border: 1px solid #ef4444; border-radius: 8px; padding: 14px; margin: 10px 0; text-align: left;';
    box.innerHTML =
      '<p style="color: #fca5a5; margin: 0 0 10px 0; font-size: 0.9rem; font-weight: 600; line-height: 1.4;">' +
        '⚠️ Tu sesión de administrador expiró o no está activa en este navegador.<br>' +
        '<span style="font-size: 0.82rem; font-weight: normal; color: #fecaca;">Ingresa tu contraseña para guardar tu prenda <strong>sin perder los datos que escribiste</strong>:</span>' +
      '</p>' +
      '<div style="display: flex; gap: 8px; flex-wrap: wrap;">' +
        '<input type="password" class="inpage-input inpage-reauth-pass-input" placeholder="Contraseña" style="flex: 1; min-width: 180px; padding: 8px 12px; font-size: 0.9rem;" autocomplete="current-password">' +
        '<button type="button" class="inpage-btn inpage-btn-primary inpage-reauth-btn-submit" style="padding: 8px 16px; font-size: 0.88rem; white-space: nowrap;">Reconectar y Guardar</button>' +
      '</div>' +
      '<div class="inpage-reauth-feedback" style="color: #fca5a5; font-size: 0.82rem; margin-top: 8px; display: none;"></div>';

    container.appendChild(box);
    container.style.display = 'block';

    var passInput = box.querySelector('.inpage-reauth-pass-input');
    var btnSubmit = box.querySelector('.inpage-reauth-btn-submit');
    var fb = box.querySelector('.inpage-reauth-feedback');

    passInput.focus();

    function executeLogin() {
      var pass = passInput.value;
      if (!pass) {
        fb.textContent = 'Por favor ingresa la contraseña.';
        fb.style.display = 'block';
        return;
      }
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Verificando...';
      fb.style.display = 'none';

      fetch((API_BASE ? API_BASE : '') + '/api/auth?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user: currentUser || '', pass: pass })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && data.ok) {
            saveSession(data);
            setAdminState(true);
            box.remove();
            showToast('✓ Sesión reactivada exitosamente.');
            if (typeof onSuccess === 'function') {
              onSuccess();
            }
          } else {
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Reconectar y Guardar';
            fb.textContent = data.error || 'Contraseña incorrecta.';
            fb.style.display = 'block';
          }
        })
        .catch(function () {
          btnSubmit.disabled = false;
          btnSubmit.textContent = 'Reconectar y Guardar';
          fb.textContent = 'Error de conexión con el servidor.';
          fb.style.display = 'block';
        });
    }

    btnSubmit.addEventListener('click', executeLogin);
    passInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        executeLogin();
      }
    });
  }

  // =========================================================================
  // 2. GESTIÓN DE SESIÓN Y MODO ADMINISTRADOR
  // =========================================================================
  function checkSession() {
    var storedId = sessionId;
    try {
      if (!storedId) storedId = localStorage.getItem('bodegon_session_id');
    } catch (e) {}

    // Si es un visitante público normal sin sesión iniciada, no disparar peticiones
    if (!storedId) {
      setAdminState(false);
      return;
    }

    inpageApiFetch('/api/auth?action=status')
      .then(function (res) {
        if (!res || !res.ok) return null;
        return res.json().catch(function () { return null; });
      })
      .then(function (data) {
        if (data && data.authenticated) {
          saveSession(data);
          setAdminState(true);
        } else {
          clearSession();
          setAdminState(false);
        }
      })
      .catch(function () {
        setAdminState(false);
      });
  }

  function setAdminState(active) {
    isAdmin = active;
    if (active) {
      document.body.classList.add('inpage-admin-active');
      renderAdminBar();
      attachEditButtonsToCards();
    } else {
      document.body.classList.remove('inpage-admin-active');
      var bar = document.getElementById('inpage-admin-bar');
      if (bar) bar.remove();
      document.querySelectorAll('.card-inpage-actions, .card-inpage-edit-btn, .card-inpage-del-btn').forEach(function (btn) {
        btn.remove();
      });
    }
  }

  // =========================================================================
  // 3. BARRA SUPERIOR (TOP ADMIN BAR)
  // =========================================================================
  function renderAdminBar() {
    if (document.getElementById('inpage-admin-bar')) return;

    var bar = document.createElement('aside');
    bar.id = 'inpage-admin-bar';
    bar.setAttribute('aria-label', 'Barra de administración en vivo');
    bar.innerHTML =
      '<div class="inpage-brand">' +
        '<span class="inpage-badge">&#128081; Modo Edición</span>' +
        '<span class="inpage-user">' + escapeHtml(currentUser || 'Administrador') + '</span>' +
      '</div>' +
      '<div class="inpage-actions">' +
        '<button type="button" class="inpage-btn inpage-btn-primary" id="inpage-btn-nuevo">' +
          '<span>+</span> Nuevo Traje' +
        '</button>' +
        '<a href="' + (API_BASE ? API_BASE + '/admin/' : 'admin/') + '" class="inpage-btn inpage-btn-outline" title="Abrir panel completo de 118 trajes y mensajes">' +
          '<span>&#9881;</span> Tablero Completo' +
        '</a>' +
        '<button type="button" class="inpage-btn inpage-btn-ghost" id="inpage-btn-logout" title="Cerrar sesión">' +
          'Salir' +
        '</button>' +
      '</div>';

    document.body.prepend(bar);

    document.getElementById('inpage-btn-nuevo').addEventListener('click', function () {
      openTrajeModal(null);
    });

    document.getElementById('inpage-btn-logout').addEventListener('click', function () {
      inpageApiFetch('/api/auth?action=logout', { method: 'POST' })
        .then(function () {
          clearSession();
          setAdminState(false);
          showToast('Sesión de administración cerrada.');
        })
        .catch(function () {
          clearSession();
          setAdminState(false);
        });
    });
  }

  // =========================================================================
  // 4. BOTONES FLOTANTES DE EDICIÓN Y BORRADO DIRECTO EN CADA TARJETA
  // =========================================================================
  function attachEditButtonsToCards() {
    if (!isAdmin) return;

    var cards = document.querySelectorAll('[data-card-id]');
    cards.forEach(function (card) {
      if (card.querySelector('.card-inpage-actions')) return;

      var oldBtn = card.querySelector('.card-inpage-edit-btn');
      if (oldBtn) oldBtn.remove();

      var cardId = card.getAttribute('data-card-id');
      var traje = findTrajeById(cardId);
      var title = (traje && traje.titulo) ? traje.titulo : (card.querySelector('h3, h4')?.textContent || 'esta prenda');

      var actions = document.createElement('div');
      actions.className = 'card-inpage-actions';

      // Botón Editar (Lápiz)
      var editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'card-inpage-btn card-inpage-edit-btn';
      editBtn.innerHTML = '&#9998;';
      editBtn.title = 'Editar datos, foto y ubicación de "' + escapeHtml(title) + '"';
      editBtn.setAttribute('aria-label', 'Editar prenda');
      editBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openTrajeModal(traje || { id: cardId, titulo: title });
      });

      // Botón Eliminar Directo (Caneca)
      var delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'card-inpage-btn card-inpage-del-btn';
      delBtn.innerHTML = '&#128465;';
      delBtn.title = 'Eliminar "' + escapeHtml(title) + '" directamente';
      delBtn.setAttribute('aria-label', 'Eliminar prenda');
      delBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm('¿Segura que deseas eliminar la prenda "' + title + '" de la tienda?\n\nEsta acción la borrará permanentemente del catálogo.')) {
          return;
        }

        delBtn.disabled = true;
        delBtn.innerHTML = '⌛';

        function removeCardFromView() {
          card.style.transition = 'all 0.35s ease';
          card.style.transform = 'scale(0.8)';
          card.style.opacity = '0';
          setTimeout(function () {
            card.remove();
            showToast('Prenda "' + title + '" eliminada correctamente.');
            // Guardar ID eliminado en localStorage para persistencia local
            try {
              var delList = JSON.parse(localStorage.getItem('bodegon_deleted_trajes') || '[]');
              if (delList.indexOf(cardId) === -1) {
                delList.push(cardId);
                localStorage.setItem('bodegon_deleted_trajes', JSON.stringify(delList));
              }
            } catch (e) {}
            if (typeof window.refreshBodegonCatalog === 'function') {
              window.refreshBodegonCatalog();
            }
          }, 350);
        }

        inpageApiFetch('/api/catalogo?id=' + encodeURIComponent(cardId), {
          method: 'DELETE'
        })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (res && res.ok) {
              removeCardFromView();
            } else {
              // Si falla por backend, remover localmente si es entorno de desarrollo
              var isLocalDev = (location.port === '5500' || location.port === '5501' || location.port === '3000' || location.protocol === 'file:');
              if (isLocalDev) {
                removeCardFromView();
              } else {
                alert(res.error || 'No se pudo eliminar la prenda.');
                delBtn.disabled = false;
                delBtn.innerHTML = '&#128465;';
              }
            }
          })
          .catch(function () {
            var isLocalDev = (location.port === '5500' || location.port === '5501' || location.port === '3000' || location.protocol === 'file:');
            if (isLocalDev) {
              removeCardFromView();
            } else {
              alert('Error de conexión al eliminar la prenda.');
              delBtn.disabled = false;
              delBtn.innerHTML = '&#128465;';
            }
          });
      });

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      card.appendChild(actions);
    });
  }

  function findTrajeById(id) {
    if (window.BODEGON_CATALOGO && Array.isArray(window.BODEGON_CATALOGO.trajes)) {
      for (var i = 0; i < window.BODEGON_CATALOGO.trajes.length; i++) {
        if (window.BODEGON_CATALOGO.trajes[i].id === id) {
          return window.BODEGON_CATALOGO.trajes[i];
        }
      }
    }
    return null;
  }

  // =========================================================================
  // 5. MODAL DE LOGIN (EN CASO DE NO ESTAR AUTENTICADO)
  // =========================================================================
  function openLoginModal() {
    var existing = document.getElementById('inpage-login-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'inpage-login-overlay';
    overlay.className = 'inpage-overlay';
    overlay.innerHTML =
      '<div class="inpage-modal" role="dialog" aria-modal="true">' +
        '<div class="inpage-modal-header">' +
          '<h3><span>&#128274;</span> Acceso Administrativo</h3>' +
          '<button type="button" class="inpage-modal-close" id="inpage-login-close">&times;</button>' +
        '</div>' +
        '<div id="inpage-login-err" class="inpage-error-msg" style="display:none;"></div>' +
        '<form id="inpage-login-form" autocomplete="off" onsubmit="return false;">' +
          '<div class="inpage-group">' +
            '<label class="inpage-label" for="inpage-user-input">Usuario</label>' +
            '<input type="text" id="inpage-user-input" class="inpage-input" value="" placeholder="Usuario" required autocomplete="off">' +
          '</div>' +
          '<div class="inpage-group">' +
            '<label class="inpage-label" for="inpage-pass-input">Contraseña</label>' +
            '<input type="password" id="inpage-pass-input" class="inpage-input" placeholder="Contraseña" required autocomplete="new-password">' +
          '</div>' +
          '<div class="inpage-modal-footer">' +
            '<button type="button" class="inpage-btn inpage-btn-ghost" id="inpage-login-cancel">Cancelar</button>' +
            '<button type="submit" class="inpage-btn inpage-btn-primary" id="inpage-login-submit">Ingresar al Sitio</button>' +
          '</div>' +
        '</form>' +
      '</div>';

    document.body.appendChild(overlay);

    var close = function () { overlay.remove(); };
    document.getElementById('inpage-login-close').addEventListener('click', close);
    document.getElementById('inpage-login-cancel').addEventListener('click', close);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    var form = document.getElementById('inpage-login-form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var errEl = document.getElementById('inpage-login-err');
      var submitBtn = document.getElementById('inpage-login-submit');
      errEl.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verificando...';

      var user = document.getElementById('inpage-user-input').value.trim();
      var pass = document.getElementById('inpage-pass-input').value;

      inpageApiFetch('/api/auth?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: user, pass: pass })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && data.ok) {
            saveSession(data);
            setAdminState(true);
            overlay.remove();
            showToast('¡Sesión iniciada con éxito! Modo edición activo.');
          } else {
            errEl.textContent = data.error || 'Credenciales incorrectas.';
            errEl.style.display = 'block';
          }
        })
        .catch(function () {
          var isLocalDev = (location.port === '5500' || location.port === '5501' || location.port === '3000' || location.protocol === 'file:');
          var hint = isLocalDev
            ? ' Para conectar con el backend PHP, inicia Docker o dev-server.'
            : '';
          errEl.textContent = 'Error de conexión con el servidor.' + hint;
          errEl.style.display = 'block';
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Ingresar al Sitio';
        });
    });

    var userInput = document.getElementById('inpage-user-input');
    var passInput = document.getElementById('inpage-pass-input');
    if (userInput) userInput.value = '';
    if (passInput) passInput.value = '';

    if (userInput) {
      userInput.focus();
    } else if (passInput) {
      passInput.focus();
    }
  }

  // =========================================================================
  // 6. MODAL DE TRAJE (CREACIÓN Y EDICIÓN EN VIVO)
  // =========================================================================
  function openTrajeModal(traje) {
    currentEditTraje = traje;
    var isEdit = !!traje && !!traje.id;

    var existing = document.getElementById('inpage-traje-overlay');
    if (existing) existing.remove();

    var seasonsHtml = SEASONS.map(function (s) {
      var sel = (traje && traje.temporada === s.id) ? 'selected' : '';
      return '<option value="' + s.id + '" ' + sel + '>' + s.label + '</option>';
    }).join('');

    var defaultImg = (traje && traje.foto) ? traje.foto : 'assets/img/ph-generico.svg';

    var currentSeason = (traje && traje.temporada) ? traje.temporada : 'octubre';

    function buildOptionsHtml(seasonId, activeCat) {
      var sPresets = getSeccionesForSeason(seasonId);
      var match = sPresets.find(function (p) { return p.id.toLowerCase() === (activeCat || '').toLowerCase(); });
      var activePreset = match ? match.id : (activeCat ? '_custom_' : sPresets[0].id);
      return sPresets.map(function (p) {
        var sel = (activePreset === p.id) ? 'selected' : '';
        return '<option value="' + escapeHtml(p.id) + '" ' + sel + '>' + escapeHtml(p.label) + '</option>';
      }).join('') + '<option value="_custom_" ' + (activePreset === '_custom_' ? 'selected' : '') + '>✏️ Otra sección personalizada...</option>';
    }

    var presets = getSeccionesForSeason(currentSeason);
    var currentCat = traje ? (traje.categoria || traje.grupo || presets[0].id) : presets[0].id;
    var seccionOptionsHtml = buildOptionsHtml(currentSeason, currentCat);
    var isPreset = presets.some(function (p) { return p.id.toLowerCase() === currentCat.toLowerCase(); });
    var selectedPreset = isPreset ? currentCat : (currentCat ? '_custom_' : presets[0].id);

    var currentDestacado = traje ? Boolean(traje.destacado === true || traje.destacado === 'true' || traje.destacado === 1) : false;
    var currentFormato = traje ? (traje.formato_foto || 'carta') : 'carta';

    var rawTallas = traje ? (Array.isArray(traje.tallas) ? traje.tallas.join(', ') : (traje.tallas || 'S, M, L, A la medida')) : 'S, M, L, A la medida';

    var overlay = document.createElement('div');
    overlay.id = 'inpage-traje-overlay';
    overlay.className = 'inpage-overlay';
    overlay.innerHTML =
      '<div class="inpage-modal" role="dialog" aria-modal="true">' +
        '<div class="inpage-modal-header">' +
          '<h3><span>' + (isEdit ? '&#9998;' : '+') + '</span> ' + (isEdit ? 'Editar Prenda' : 'Colocar Nueva Prenda') + '</h3>' +
          '<button type="button" class="inpage-modal-close" id="inpage-traje-close">&times;</button>' +
        '</div>' +
        '<div id="inpage-traje-err" class="inpage-error-msg" style="display:none;"></div>' +
        '<form id="inpage-traje-form" onsubmit="return false;">' +
          '<div class="inpage-form-grid">' +
            '<div class="inpage-group inpage-field-full">' +
              '<label class="inpage-label" for="inpage-traje-titulo">Nombre del Traje / Prenda *</label>' +
              '<input type="text" id="inpage-traje-titulo" class="inpage-input" value="' + escapeHtml(traje ? traje.titulo : '') + '" placeholder="Ej. Disfraz Bruja Escarlata" required>' +
            '</div>' +
            '<div class="inpage-group">' +
              '<label class="inpage-label" for="inpage-traje-temporada">Temporada *</label>' +
              '<select id="inpage-traje-temporada" class="inpage-select" required>' + seasonsHtml + '</select>' +
            '</div>' +
            '<div class="inpage-group">' +
              '<label class="inpage-label" for="inpage-traje-tallas">Tallas Disponibles</label>' +
              '<input type="text" id="inpage-traje-tallas" class="inpage-input" value="' + escapeHtml(rawTallas) + '" placeholder="S, M, L, A la medida">' +
            '</div>' +

            '<div class="inpage-group inpage-field-full">' +
              '<label class="inpage-label" for="inpage-traje-seccion-select">Sección Temática del Catálogo *</label>' +
              '<select id="inpage-traje-seccion-select" class="inpage-select" required>' + seccionOptionsHtml + '</select>' +
              '<div id="inpage-custom-cat-box" style="margin-top: 0.5rem; ' + (selectedPreset === '_custom_' ? '' : 'display:none;') + '">' +
                '<input type="text" id="inpage-traje-categoria" class="inpage-input" value="' + escapeHtml(currentCat) + '" placeholder="Escribe el nombre de la sección...">' +
              '</div>' +
            '</div>' +

            '<!-- TAMAÑO / PROPORCIÓN DE LA FOTOGRAFÍA -->' +
            '<div class="inpage-group inpage-field-full">' +
              '<label class="inpage-label" for="inpage-traje-formato-foto">&#128208; Tamaño y Proporción de la Fotografía (Tarjeta Tipo Carta) *</label>' +
              '<select id="inpage-traje-formato-foto" class="inpage-select">' +
                '<option value="carta" ' + (currentFormato === 'carta' ? 'selected' : '') + '>📐 Formato Carta Vertical (3:4) — Proporción ideal para trajes completos</option>' +
                '<option value="cuadrado" ' + (currentFormato === 'cuadrado' ? 'selected' : '') + '>🔲 Cuadrado Comercial (1:1) — Ideal para máscaras y accesorios</option>' +
                '<option value="panoramico" ' + (currentFormato === 'panoramico' ? 'selected' : '') + '>🖼️ Panorámico Amplio (16:9) — Ideal para comparsas o grupos</option>' +
              '</select>' +
            '</div>' +

            '<div class="inpage-group inpage-field-full">' +
              '<label class="inpage-label" for="inpage-traje-desc">Descripción y Detalles de la Prenda</label>' +
              '<textarea id="inpage-traje-desc" class="inpage-textarea" placeholder="Qué piezas incluye, telas, accesorios...">' + escapeHtml(traje ? traje.descripcion : '') + '</textarea>' +
            '</div>' +

            '<div class="inpage-group inpage-field-full">' +
              '<label class="inpage-label">Fotografía de la Prenda</label>' +
              '<div class="inpage-photo-box">' +
                '<img loading="lazy" decoding="async" width="300" height="400" id="inpage-photo-preview" class="inpage-photo-preview" src="' + escapeHtml(defaultImg) + '" alt="Previsualización" style="aspect-ratio:' + (currentFormato === 'cuadrado' ? '1/1' : (currentFormato === 'panoramico' ? '16/9' : '3/4')) + ';">' +
                '<div class="inpage-photo-controls">' +
                  '<input type="file" id="inpage-photo-file" accept="image/*" style="display:none;">' +
                  '<input type="hidden" id="inpage-traje-foto-val" value="' + escapeHtml(traje ? (traje.foto || '') : '') + '">' +
                  '<button type="button" class="inpage-btn inpage-btn-outline" id="inpage-btn-select-photo">&#128247; Subir Nueva Foto</button>' +
                  '<div class="inpage-photo-hint" id="inpage-photo-hint">Formatos: WebP, JPG, PNG (máx 10 MB)</div>' +
                '</div>' +
              '</div>' +
            '</div>' +

            '<div class="inpage-group inpage-field-full">' +
              '<label class="inpage-checkbox-label">' +
                '<input type="checkbox" id="inpage-traje-activo" ' + (traje && traje.activo === false ? '' : 'checked') + '> Prenda visible en la página web pública' +
              '</label>' +
            '</div>' +
          '</div>' +

          '<div class="inpage-modal-footer">' +
            (isEdit ? '<button type="button" class="inpage-btn inpage-btn-danger" id="inpage-traje-delete">&#128465; Eliminar Prenda</button>' : '') +
            '<button type="button" class="inpage-btn inpage-btn-ghost" id="inpage-traje-cancel">Cancelar</button>' +
            '<button type="submit" class="inpage-btn inpage-btn-primary" id="inpage-traje-save">' + (isEdit ? 'Guardar Cambios' : 'Colocar Prenda') + '</button>' +
          '</div>' +
        '</form>' +
      '</div>';

    document.body.appendChild(overlay);

    var close = function () { overlay.remove(); };
    document.getElementById('inpage-traje-close').addEventListener('click', close);
    document.getElementById('inpage-traje-cancel').addEventListener('click', close);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    // Control dinámico de Secciones Temáticas al cambiar de Temporada
    var temporadaSelect = document.getElementById('inpage-traje-temporada');
    var seccionSelect = document.getElementById('inpage-traje-seccion-select');
    var customCatBox = document.getElementById('inpage-custom-cat-box');
    var catInput = document.getElementById('inpage-traje-categoria');
    if (temporadaSelect && seccionSelect && customCatBox && catInput) {
      temporadaSelect.addEventListener('change', function () {
        var newSeason = temporadaSelect.value;
        seccionSelect.innerHTML = buildOptionsHtml(newSeason, '');
        seccionSelect.dispatchEvent(new Event('change'));
      });
    }

    // Control de selección de sección dinámica
    if (seccionSelect && customCatBox && catInput) {
      seccionSelect.addEventListener('change', function () {
        if (seccionSelect.value === '_custom_') {
          customCatBox.style.display = 'block';
          catInput.focus();
        } else {
          customCatBox.style.display = 'none';
          catInput.value = seccionSelect.value;
        }
      });
    }

    // Control dinámico de proporción de foto al seleccionar formato
    var formatoSelect = document.getElementById('inpage-traje-formato-foto');
    var previewImgEl = document.getElementById('inpage-photo-preview');
    if (formatoSelect && previewImgEl) {
      formatoSelect.addEventListener('change', function () {
        if (formatoSelect.value === 'cuadrado') {
          previewImgEl.style.aspectRatio = '1 / 1';
        } else if (formatoSelect.value === 'panoramico') {
          previewImgEl.style.aspectRatio = '16 / 9';
        } else {
          previewImgEl.style.aspectRatio = '3 / 4';
        }
      });
    }

    // Subida de fotografía
    var fileInput = document.getElementById('inpage-photo-file');
    var btnSelectPhoto = document.getElementById('inpage-btn-select-photo');
    var previewImg = document.getElementById('inpage-photo-preview');
    var photoHint = document.getElementById('inpage-photo-hint');
    var hiddenFoto = document.getElementById('inpage-traje-foto-val');

    function compressInpageImage(file, callback) {
      if (!file || !file.type.match(/^image\/(jpeg|png|webp)/i)) {
        return callback(file);
      }
      var img = new Image();
      var reader = new FileReader();
      reader.onload = function (e) {
        img.onload = function () {
          var maxDim = 1200;
          var w = img.width;
          var h = img.height;
          if (w <= maxDim && h <= maxDim && file.size < 300 * 1024 && file.type === 'image/webp') {
            return callback(file);
          }
          if (w > h) {
            if (w > maxDim) {
              h = Math.round(h * (maxDim / w));
              w = maxDim;
            }
          } else {
            if (h > maxDim) {
              w = Math.round(w * (maxDim / h));
              h = maxDim;
            }
          }
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, w, h);
          if (canvas.toBlob) {
            canvas.toBlob(function (blob) {
              if (blob && blob.size < file.size) {
                var optimizedFile = new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' });
                callback(optimizedFile);
              } else {
                callback(file);
              }
            }, 'image/webp', 0.85);
          } else {
            callback(file);
          }
        };
        img.onerror = function () { callback(file); };
        img.src = e.target.result;
      };
      reader.onerror = function () { callback(file); };
      reader.readAsDataURL(file);
    }

    btnSelectPhoto.addEventListener('click', function () {
      fileInput.click();
    });

    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;

      if (window.FileReader) {
        var reader = new FileReader();
        reader.onload = function (e) {
          if (previewImg) previewImg.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }

      photoHint.textContent = 'Optimizando imagen...';
      compressInpageImage(file, function (processedFile) {
        photoHint.textContent = 'Subiendo imagen optimizada al servidor...';
        var formData = new FormData();
        formData.append('file', processedFile);
        if (csrfToken) formData.append('csrf_token', csrfToken);

        inpageApiFetch('/api/upload-media', {
          method: 'POST',
          body: formData
        })
        .then(function (r) {
          return r.json().then(function (res) {
            return { status: r.status, data: res };
          });
        })
        .then(function (pack) {
          var res = pack.data;
          var photoUrl = (res && res.url) || (res && res.file && res.file.url);
          if (res && res.ok && photoUrl) {
            previewImg.src = photoUrl;
            hiddenFoto.value = photoUrl;
            photoHint.textContent = '✓ Imagen guardada: ' + ((res.file && res.file.name) || res.filename || file.name);
          } else if (pack.status === 401 || (res && (res.error || '').indexOf('No autorizado') !== -1)) {
            photoHint.textContent = '⚠️ Se requiere autorizar tu sesión para guardar la imagen:';
            showInlineReauth(document.getElementById('inpage-traje-err'), function () {
              photoHint.textContent = 'Reintentando subida de foto...';
              fileInput.dispatchEvent(new Event('change'));
            });
          } else {
            photoHint.textContent = 'Error: ' + (res.error || 'No se pudo subir la foto.');
          }
        })
        .catch(function () {
          photoHint.textContent = 'Error de conexión al subir la imagen.';
        });
      });
    });

    // Eliminar traje (si está en edición)
    var deleteBtn = document.getElementById('inpage-traje-delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function () {
        if (!confirm('¿Segura que deseas eliminar la prenda "' + traje.titulo + '"?')) return;
        deleteBtn.disabled = true;
        deleteBtn.textContent = 'Eliminando...';

        function executeModalDelete() {
          overlay.remove();
          showToast('Prenda eliminada correctamente.');
          try {
            var delList = JSON.parse(localStorage.getItem('bodegon_deleted_trajes') || '[]');
            if (delList.indexOf(traje.id) === -1) {
              delList.push(traje.id);
              localStorage.setItem('bodegon_deleted_trajes', JSON.stringify(delList));
            }
          } catch (e) {}
          var domCard = document.querySelector('[data-card-id="' + CSS.escape(traje.id) + '"]');
          if (domCard) domCard.remove();
          if (typeof window.refreshBodegonCatalog === 'function') {
            window.refreshBodegonCatalog(function () {
              attachEditButtonsToCards();
            });
          }
        }

        inpageApiFetch('/api/catalogo?id=' + encodeURIComponent(traje.id), {
          method: 'DELETE'
        })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (res && res.ok) {
              executeModalDelete();
            } else {
              var isLocalDev = (location.port === '5500' || location.port === '5501' || location.port === '3000' || location.protocol === 'file:');
              if (isLocalDev) {
                executeModalDelete();
              } else {
                alert(res.error || 'No se pudo eliminar la prenda.');
              }
            }
          })
          .catch(function () {
            var isLocalDev = (location.port === '5500' || location.port === '5501' || location.port === '3000' || location.protocol === 'file:');
            if (isLocalDev) {
              executeModalDelete();
            } else {
              alert('Error de conexión al eliminar.');
            }
          })
          .finally(function () {
            deleteBtn.disabled = false;
          });
      });
    }

    // Guardar (Crear o Actualizar)
    var form = document.getElementById('inpage-traje-form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var errEl = document.getElementById('inpage-traje-err');
      var saveBtn = document.getElementById('inpage-traje-save');
      errEl.style.display = 'none';
      saveBtn.disabled = true;
      saveBtn.textContent = 'Guardando...';

      var seccionSel = document.getElementById('inpage-traje-seccion-select');
      var customCatInput = document.getElementById('inpage-traje-categoria');
      var finalCat = (seccionSel && seccionSel.value === '_custom_')
        ? (customCatInput ? customCatInput.value.trim() : 'General')
        : (seccionSel ? seccionSel.value : 'General');
      if (!finalCat) finalCat = 'General';

      var payload = {
        titulo: document.getElementById('inpage-traje-titulo').value.trim(),
        temporada: document.getElementById('inpage-traje-temporada').value,
        categoria: finalCat,
        grupo: finalCat,
        destacado: false,
        formato_foto: document.getElementById('inpage-traje-formato-foto').value,
        tallas: document.getElementById('inpage-traje-tallas').value.trim(),
        descripcion: document.getElementById('inpage-traje-desc').value.trim(),
        foto: hiddenFoto.value.trim() || defaultImg,
        activo: document.getElementById('inpage-traje-activo').checked
      };

      var url = isEdit
        ? '/api/catalogo?id=' + encodeURIComponent(traje.id)
        : '/api/catalogo';
      var method = isEdit ? 'PUT' : 'POST';

      inpageApiFetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
        .then(function (r) {
          return r.json().then(function (res) {
            return { status: r.status, data: res };
          });
        })
        .then(function (pack) {
          var res = pack.data;
          if (res && res.ok) {
            overlay.remove();
            showToast(isEdit ? 'Prenda actualizada con éxito.' : 'Nueva prenda agregada al catálogo.');
            if (typeof window.refreshBodegonCatalog === 'function') {
              window.refreshBodegonCatalog(function () {
                attachEditButtonsToCards();
              });
            }
          } else if (pack.status === 401 || (res && (res.error || '').indexOf('No autorizado') !== -1)) {
            errEl.textContent = '';
            errEl.style.display = 'block';
            showInlineReauth(errEl, function () {
              form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            });
          } else {
            errEl.textContent = res.error || 'Error al guardar la prenda.';
            errEl.style.display = 'block';
          }
        })
        .catch(function () {
          var isLocalDev = (location.port === '5500' || location.port === '5501' || location.port === '3000' || location.protocol === 'file:');
          if (isLocalDev) {
            // Actualizar localmente el objeto y reflejarlo de inmediato en el DOM
            if (isEdit && traje) {
              Object.assign(traje, payload);
            } else if (window.BODEGON_CATALOGO && Array.isArray(window.BODEGON_CATALOGO.trajes)) {
              payload.id = 'traje_custom_' + Date.now();
              window.BODEGON_CATALOGO.trajes.push(payload);
            }
            overlay.remove();
            showToast(isEdit ? '✓ Cambios aplicados correctamente (Modo Local).' : '✓ Prenda colocada correctamente (Modo Local).');
            if (typeof window.refreshBodegonCatalog === 'function') {
              window.refreshBodegonCatalog(function () {
                attachEditButtonsToCards();
              });
            }
            return;
          }
          errEl.textContent = 'Error de conexión con el servidor.';
          errEl.style.display = 'block';
        })
        .finally(function () {
          saveBtn.disabled = false;
          saveBtn.textContent = isEdit ? 'Guardar Cambios' : 'Colocar Prenda';
        });
    });
  }

  // =========================================================================
  // 7. INICIALIZACIÓN Y VINCULACIÓN DE BOTONES PÚBLICOS
  // =========================================================================
  function init() {
    // 1. Escuchar clic en los botones existentes de navegación
    var navButtons = document.querySelectorAll('#admin-menu-btn, #admin-menu-btn-footer');
    navButtons.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (isAdmin) {
          showToast('Ya estás en modo edición. Puedes editar cualquier tarjeta con el botón ✏️.');
        } else {
          openLoginModal();
        }
      });
    });

    // 2. Escuchar evento de actualización del catálogo para re-vincular botones
    window.addEventListener('bodegon:catalog-updated', function () {
      if (isAdmin) {
        attachEditButtonsToCards();
      }
    });

    // 3. Verificar si ya existe sesión abierta en el navegador
    checkSession();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
