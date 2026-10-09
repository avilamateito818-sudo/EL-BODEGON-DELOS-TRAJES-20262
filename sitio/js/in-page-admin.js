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

  var csrfToken = '';
  var currentUser = null;
  var isAdmin = false;
  var currentEditTraje = null;
  var toastTimer = null;

  // Detección automática del backend (soporte para Live Server 5500/5501 hacia Docker 8095)
  function getApiBase() {
    if (location.port === '5500' || location.port === '5501' || location.port === '3000' || location.protocol === 'file:') {
      return 'http://localhost:8095';
    }
    return '';
  }
  var API_BASE = getApiBase();

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

  // =========================================================================
  // 2. GESTIÓN DE SESIÓN Y MODO ADMINISTRADOR
  // =========================================================================
  function checkSession() {
    fetch(API_BASE + '/api/auth?action=status', { credentials: 'include' })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.authenticated) {
          csrfToken = data.csrf_token || '';
          currentUser = data.user || 'Ana Avila';
          setAdminState(true);
        } else {
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
      fetch(API_BASE + '/api/auth?action=logout', { method: 'POST', credentials: 'include' })
        .then(function () {
          setAdminState(false);
          showToast('Sesión de administración cerrada.');
        })
        .catch(function () {
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

        fetch(API_BASE + '/api/catalogo?id=' + encodeURIComponent(cardId), {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'X-CSRF-Token': csrfToken }
        })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (res && res.ok) {
              card.style.transition = 'all 0.35s ease';
              card.style.transform = 'scale(0.8)';
              card.style.opacity = '0';
              setTimeout(function () {
                card.remove();
                showToast('Prenda "' + title + '" eliminada correctamente.');
                if (typeof window.refreshBodegonCatalog === 'function') {
                  window.refreshBodegonCatalog();
                }
              }, 350);
            } else {
              alert(res.error || 'No se pudo eliminar la prenda.');
              delBtn.disabled = false;
              delBtn.innerHTML = '&#128465;';
            }
          })
          .catch(function () {
            alert('Error de conexión al eliminar la prenda.');
            delBtn.disabled = false;
            delBtn.innerHTML = '&#128465;';
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
        '<form id="inpage-login-form">' +
          '<div class="inpage-group">' +
            '<label class="inpage-label" for="inpage-user-input">Usuario</label>' +
            '<input type="text" id="inpage-user-input" class="inpage-input" value="anaisabel" required autocomplete="username">' +
          '</div>' +
          '<div class="inpage-group">' +
            '<label class="inpage-label" for="inpage-pass-input">Contraseña Maestra</label>' +
            '<input type="password" id="inpage-pass-input" class="inpage-input" placeholder="••••••••••••" required autocomplete="current-password">' +
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

      fetch(API_BASE + '/api/auth?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user: user, pass: pass })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && data.ok) {
            csrfToken = data.csrf_token || '';
            currentUser = data.user || 'Ana Avila';
            setAdminState(true);
            overlay.remove();
            showToast('¡Bienvenida doña Ana Avila! Modo edición activo.');
          } else {
            errEl.textContent = data.error || 'Credenciales incorrectas.';
            errEl.style.display = 'block';
          }
        })
        .catch(function () {
          var hint = (location.port === '5500' || location.port === '5501')
            ? ' Para conectar con el backend PHP, abre el sitio en http://localhost:8095/'
            : '';
          errEl.textContent = 'Error de conexión con el servidor.' + hint;
          errEl.style.display = 'block';
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Ingresar al Sitio';
        });
    });

    document.getElementById('inpage-pass-input').focus();
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

    var PRESET_SECCIONES = [
      { id: 'Terror', label: '🎃 Terror (Monstruos, Villanos, Sombras)' },
      { id: 'Cuentos y Fantasía', label: '👑 Princesas y Cuentos de Hadas (Blanca Nieves, Bella, Elsa, Mérida)' },
      { id: 'Superhéroes y Anime', label: '⚡ Superhéroes y Anime (Marvel, DC, Demon Slayer)' },
      { id: 'Gala y Elegancia', label: '✨ Gala y Elegancia (Vestidos de Prom, Esmoquin, Togas)' },
      { id: 'Oficios y Uniforme', label: '🩺 Oficios y Uniformes (Médicos, Policías, Profesiones)' },
      { id: 'Bailes Típicos y Tradición', label: '🎭 Folclor y Tradición (Boyacá, Danzas Típicas)' },
      { id: 'Carnaval y Comparsas', label: '🎉 Carnaval y Comparsas (Negros y Blancos)' },
      { id: 'Disfraces Navideños', label: '🎄 Navidad & Fin de Año (Santa, Duendes, Reyes Magos)' }
    ];

    var currentCat = traje ? (traje.categoria || traje.grupo || 'Terror') : 'Terror';
    var isPreset = PRESET_SECCIONES.some(function (p) { return p.id.toLowerCase() === currentCat.toLowerCase(); });
    var selectedPreset = isPreset
      ? PRESET_SECCIONES.find(function (p) { return p.id.toLowerCase() === currentCat.toLowerCase(); }).id
      : (currentCat ? '_custom_' : 'Terror');

    var seccionOptionsHtml = PRESET_SECCIONES.map(function (p) {
      var sel = (selectedPreset === p.id) ? 'selected' : '';
      return '<option value="' + escapeHtml(p.id) + '" ' + sel + '>' + escapeHtml(p.label) + '</option>';
    }).join('') + '<option value="_custom_" ' + (selectedPreset === '_custom_' ? 'selected' : '') + '>✏️ Otra sección personalizada...</option>';

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
        '<form id="inpage-traje-form">' +
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
                '<img id="inpage-photo-preview" class="inpage-photo-preview" src="' + escapeHtml(defaultImg) + '" alt="Previsualización" style="aspect-ratio:' + (currentFormato === 'cuadrado' ? '1/1' : (currentFormato === 'panoramico' ? '16/9' : '3/4')) + ';">' +
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

    // Control de selección de sección dinámica
    var seccionSelect = document.getElementById('inpage-traje-seccion-select');
    var customCatBox = document.getElementById('inpage-custom-cat-box');
    var catInput = document.getElementById('inpage-traje-categoria');
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

      photoHint.textContent = 'Subiendo imagen al servidor...';
      var formData = new FormData();
      formData.append('file', file);
      formData.append('csrf_token', csrfToken);

      fetch(API_BASE + '/api/upload-media', {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRF-Token': csrfToken },
        body: formData
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          var photoUrl = (res && res.url) || (res && res.file && res.file.url);
          if (res && res.ok && photoUrl) {
            previewImg.src = photoUrl;
            hiddenFoto.value = photoUrl;
            photoHint.textContent = '✓ Imagen guardada: ' + ((res.file && res.file.name) || res.filename || file.name);
          } else {
            photoHint.textContent = 'Error: ' + (res.error || 'No se pudo subir la foto.');
          }
        })
        .catch(function () {
          photoHint.textContent = 'Error de conexión al subir la imagen.';
        });
    });

    // Eliminar traje (si está en edición)
    var deleteBtn = document.getElementById('inpage-traje-delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function () {
        if (!confirm('¿Segura que deseas eliminar la prenda "' + traje.titulo + '"?')) return;
        deleteBtn.disabled = true;
        deleteBtn.textContent = 'Eliminando...';

        fetch(API_BASE + '/api/catalogo?id=' + encodeURIComponent(traje.id), {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'X-CSRF-Token': csrfToken }
        })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (res && res.ok) {
              overlay.remove();
              showToast('Prenda eliminada correctamente.');
              if (typeof window.refreshBodegonCatalog === 'function') {
                window.refreshBodegonCatalog(function () {
                  attachEditButtonsToCards();
                });
              }
            } else {
              alert(res.error || 'No se pudo eliminar la prenda.');
            }
          })
          .catch(function () {
            alert('Error de conexión al eliminar.');
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
        ? API_BASE + '/api/catalogo?id=' + encodeURIComponent(traje.id)
        : API_BASE + '/api/catalogo';
      var method = isEdit ? 'PUT' : 'POST';

      fetch(url, {
        method: method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res && res.ok) {
            overlay.remove();
            showToast(isEdit ? 'Prenda actualizada con éxito.' : 'Nueva prenda agregada al catálogo.');
            if (typeof window.refreshBodegonCatalog === 'function') {
              window.refreshBodegonCatalog(function () {
                attachEditButtonsToCards();
              });
            }
          } else {
            errEl.textContent = res.error || 'Error al guardar la prenda.';
            errEl.style.display = 'block';
          }
        })
        .catch(function () {
          errEl.textContent = 'Error de conexión con el servidor.';
          errEl.style.display = 'block';
        })
        .finally(function () {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Guardar Prenda';
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
