/* Panel de administrador para El Bodegón de los Trajes.
   - Acceso: botón flotante + contraseña.
   - Edita textos, cambia fotos, publica contenido nuevo y borra contenido.
   - Guarda todo en el archivo externo admin-content.json (se descarga y se
     reemplaza en la misma carpeta del sitio). */
(function () {
  'use strict';

  var DEFAULT_PASSWORD = 'ANAISABEL2026';
  var DEFAULT_USERNAME = 'Ana Avila';
  var SESSION_KEY = 'bodegon_admin_session';
  var AUTOSAVE_KEY = 'bodegon_autosave';
  var BACKUP_KEY_PREFIX = 'bodegon_backup_';
  var BACKUP_SLOTS = 5;
  var BACKUP_LOG_KEY = 'bodegon_backup_log';
  var PENDING_SYNC_KEY = 'bodegon_pending_sync';
  var CLOUD_SYNC_API = '/api/save-content';
  var CLOUD_SYNC_FALLBACK = 'https://el-bodegon-delos-trajes-20265-s5qo.vercel.app/api/save-content';
  var cloudSyncTimer = null;
  var CLOUD_SYNC_DELAY = 2500;
  var cloudSyncRetries = 0;
  var MAX_RETRIES = 3;
  var cloudSyncing = false;

  function getCloudUrl() {
    var isLocal = window.location.protocol === 'file:' ||
                  window.location.hostname === 'localhost' ||
                  window.location.hostname === '127.0.0.1' ||
                  window.location.hostname === '';
    return isLocal ? CLOUD_SYNC_FALLBACK : CLOUD_SYNC_API;
  }

  var content = {
    version: 2,
    usernameHash: null,
    passwordHash: null,
    texts: [],
    images: [],
    addCards: [],
    addTexts: [],
    addTitles: [],
    addPhotos: [],
    deleteCards: [],
    deleteTexts: [],
    seasonCovers: {},
    photoSettings: {},
    editorStyles: {}
  };

  var authed = false;
  var editMode = false;
  var loginAttempts = 0;
  var lockUntil = 0;
  var LOCK_MS = 4 * 60 * 1000;
  var CONTACT_PHONE = '3107706615';

  /* ---------- utilidades ---------- */

  /* Comprime una imagen subida para que ocupe poco espacio:
     - Limita la dimensión mayor (ancho o alto) a MAX_IMG_DIM px.
     - Ajusta la calidad en pasos hasta que la imagen quede por debajo de
       MAX_IMG_BYTES, para que las fotos no ocupen tanto espacio.
     Cuanto más pequeña/quede la imagen, mejor (se liberan fácilmente 10-30x). */
  var MAX_IMG_DIM = 1200;
  var MAX_IMG_BYTES = 220 * 1024; /* ~220 KB por foto */

  function compressImage(dataUrl, maxWidth, quality) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        var target = maxWidth || MAX_IMG_DIM;
        var w = img.width;
        var h = img.height;
        /* límite por la dimensión mayor (no solo ancho) */
        var maxDim = Math.max(w, h);
        if (maxDim > target) {
          var ratio = target / maxDim;
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        var q = (typeof quality === 'number') ? quality : 0.6;
        tryCompress(w, h, q, 0);
      };
      img.onerror = function () { resolve(dataUrl); };
      img.src = dataUrl;

      function tryCompress(cw, ch, cq, attempt) {
        try {
          var canvas = document.createElement('canvas');
          canvas.width = cw;
          canvas.height = ch;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, cw, ch);
          var out = canvas.toDataURL('image/jpeg', cq);
          var bytes = out.length * 3 / 4; /* aprox. bytes de base64 */
          if (bytes <= MAX_IMG_BYTES || attempt >= 3 || (cw <= 400 && ch <= 400)) {
            resolve(out);
          } else {
            /* seguir reduciendo: bajar calidad y, si hace falta, dimensiones */
            var nextQ = cq * 0.7;
            var nextScale = 0.8;
            var nw = Math.max(240, Math.round(cw * (attempt >= 2 ? nextScale : 1)));
            var nh = Math.max(240, Math.round(ch * (attempt >= 2 ? nextScale : 1)));
            tryCompress(nw, nh, nextQ, attempt + 1);
          }
        } catch (e) {
          resolve(dataUrl);
        }
      }
    });
  }

  function hash(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) {
      h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    }
    return 'h' + h.toString(16);
  }

  function uid() {
    return 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function cssPath(el) {
    if (!el) return '';
    if (el.id) return '#' + CSS.escape(el.id);
    if (el === document.body) return 'body';
    var parts = [];
    var node = el;
    while (node && node.nodeType === 1) {
      if (node.id) {
        parts.unshift('#' + CSS.escape(node.id));
        break;
      }
      var tag = node.tagName.toLowerCase();
      var parent = node.parentElement;
      if (parent) {
        var idx = Array.prototype.indexOf.call(parent.children, node) + 1;
        parts.unshift(tag + ':nth-child(' + idx + ')');
      } else {
        parts.unshift(tag);
      }
      node = parent;
    }
    return parts.join(' > ');
  }

  function q(path) {
    try { return document.querySelector(path); } catch (e) { return null; }
  }

  function qa(path) {
    try { return document.querySelectorAll(path); } catch (e) { return []; }
  }

  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'admin-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('is-show'); }, 20);
    setTimeout(function () {
      t.classList.remove('is-show');
      setTimeout(function () { t.remove(); }, 400);
    }, 2600);
  }

  /* ---------- edición de texto ---------- */

  var TEXT_SEL = [
    '#inicio .hero-box h2',
    '#inicio .hero-box p',
    '.section-head h2',
    '.section-head p',
    '.section-head span',
    '.season-title',
    '.season-subtitle',
    '.season-milestone',
    '.season-blank-title',
    '.season-catalog h4',
    '.season-catalog-tag',
    '.catalog-group-title',
    '.catalog-note p',
    '.season-item-body h4',
    '.season-item-body p',
    '.essence-heading',
    '.essence-lead',
    '.essence-detail',
    '.essence-cat',
    '.subsection-body h4',
    '.subsection-body p',
    '.subsection-list li',
    '.contact-card h3',
    '.contact-intro',
    '.contact-detail p',
    'footer p',
    '.halloween-landing-title',
    '.halloween-landing-sub',
    '.season-tab .tab-label',
    '.dropdown-grid a',
    '.season-quick-nav a'
  ].join(',');

  function isEditableText(el) {
    if (!el || el.closest('.admin-ui')) return false;
    if (el.closest('.season-tab-clone')) return false;
    return !!el.closest(TEXT_SEL);
  }

  function editElement(el) {
    if (el.dataset && el.dataset.adminTarget) {
      el = q(el.dataset.adminTarget);
    }
    if (!el) return;
    if (el.tagName === 'IMG') { editImage(el); return; }
    editText(el);
  }

  function findEntry(list, id) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function editText(el) {
    var addedHost = el.closest('[data-admin-id]');
    var entry = addedHost ? findEntry(content.addCards.concat(content.addTexts, content.addTitles), addedHost.dataset.adminId) : null;
    var isEditableHtml = /^[Hh][1-6]$/.test(el.tagName) || el.tagName === 'P' || el.tagName === 'SPAN' || el.tagName === 'LI' || el.tagName === 'A';
    var initial = isEditableHtml ? el.innerHTML : el.textContent;
    var useHtml = isEditableHtml;

    var box = openModal(
      '<h3>Editar texto</h3>' +
      '<label class="admin-field">Contenido</label>' +
      '<textarea class="admin-textarea" rows="6" data-role="value"></textarea>' +
      (useHtml ? '<p class="admin-hint">Puedes usar etiquetas HTML (ej. &lt;strong&gt;texto&lt;/strong&gt;).</p>' : '') +
      '<div class="admin-modal-actions">' +
      '<button type="button" class="admin-btn admin-btn-danger" data-role="del">Quitar</button>' +
      '<button type="button" class="admin-btn admin-btn-primary" data-role="ok">Guardar</button>' +
      '<button type="button" class="admin-btn" data-role="cancel">Cancelar</button>' +
      '</div>'
    );
    box.querySelector('[data-role="value"]').value = initial;

    box.querySelector('[data-role="del"]').addEventListener('click', function () {
      closeModal(box);
      deleteEl(el);
      autoSave();
      toast('Elemento quitado.');
    });
    box.querySelector('[data-role="ok"]').addEventListener('click', function () {
      var val = box.querySelector('[data-role="value"]').value;
      if (useHtml) el.innerHTML = val; else el.textContent = val;
      var monthTab = el.closest('.season-tab');
      if (monthTab && !monthTab.classList.contains('season-tab-clone') && monthTab.dataset.month) {
        var cloneLabel = document.querySelector('.season-tabs[aria-hidden] .season-tab[data-month="' + monthTab.dataset.month + '"] .tab-label');
        if (cloneLabel) { if (useHtml) cloneLabel.innerHTML = val; else cloneLabel.textContent = val; }
      }
      if (entry && entry._type === 'card') {
        if (el.matches('h3')) entry.title = stripHtml(val);
        else entry.desc = stripHtml(val);
      } else if (entry && (entry._type === 'text' || entry._type === 'title')) {
        entry.html = val;
      } else {
        saveTextPatch(el, useHtml ? val : esc(val));
      }
      closeModal(box);
      autoSave();
      toast('Texto actualizado.');
    });
    box.querySelector('[data-role="cancel"]').addEventListener('click', function () { closeModal(box); });
  }

  function stripHtml(s) {
    return String(s).replace(/<[^>]*>/g, '').trim();
  }

  function saveTextPatch(el, val) {
    var path = cssPath(el);
    for (var i = 0; i < content.texts.length; i++) {
      if (content.texts[i].sel === path) { content.texts[i].html = val; return; }
    }
    content.texts.push({ sel: path, html: val });
  }

  /* ---------- edición de imágenes ---------- */

  function editImage(img, autoOpen) {
    var addedHost = img.closest('[data-admin-id]');
    var entry = addedHost ? findEntry(content.addCards.concat(content.addPhotos), addedHost.dataset.adminId) : null;

    var box = openModal(
      '<h3>Cambiar foto</h3>' +
      '<label class="admin-field">Subir imagen</label>' +
      '<input type="file" class="admin-file" data-role="file" accept="image/*">' +
      '<label class="admin-field">O pegar URL de imagen</label>' +
      '<input type="text" class="admin-input" data-role="url" placeholder="https://...">' +
      '<div class="admin-preview" data-role="preview"><img src="" alt=""></div>' +
      '<div class="admin-modal-actions">' +
      '<button type="button" class="admin-btn admin-btn-primary" data-role="ok">Aplicar</button>' +
      '<button type="button" class="admin-btn" data-role="cancel">Cancelar</button>' +
      '</div>'
    );
    var fileInp = box.querySelector('[data-role="file"]');
    var urlInp = box.querySelector('[data-role="url"]');
    var preview = box.querySelector('[data-role="preview"] img');
    var pendingData = null;

    fileInp.addEventListener('change', function () {
      var f = fileInp.files[0];
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        pendingData = rd.result;
        preview.src = pendingData;
      };
      rd.readAsDataURL(f);
    });
    urlInp.addEventListener('input', function () {
      if (urlInp.value.trim()) preview.src = urlInp.value.trim();
    });
    if (autoOpen) fileInp.click();

    box.querySelector('[data-role="ok"]').addEventListener('click', function () {
      var src = pendingData || urlInp.value.trim();
      if (!src) { toast('Elige una imagen o pega una URL.'); return; }
      function applyImage(finalSrc) {
        img.src = finalSrc;
        if (entry) {
          if (entry._type === 'photo') entry.src = finalSrc;
          else entry.img = finalSrc;
        } else {
          var path = cssPath(img);
          for (var i = 0; i < content.images.length; i++) {
            if (content.images[i].sel === path) { content.images[i].src = finalSrc; closeModal(box); autoSave(); toast('Foto actualizada.'); return; }
          }
          content.images.push({ sel: path, src: finalSrc });
        }
        closeModal(box);
        autoSave();
        toast('Foto actualizada.');
      }
      if (src.indexOf('data:') === 0) {
        compressImage(src, 1000, 0.55).then(applyImage);
      } else {
        applyImage(src);
      }
    });
    box.querySelector('[data-role="cancel"]').addEventListener('click', function () { closeModal(box); });
  }

  /* ---------- publicar contenido nuevo ---------- */

  function seasonPhotoButton(panel) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'admin-ui admin-seasbtn';
    btn.innerHTML = '&#128247; <span>Cambiar fotos de esta temporada</span>';
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
      changeSeasonPhotos(panel);
    });
    return btn;
  }

  function changeSeasonPhotos(panel) {
    var imgs = panel.querySelectorAll('img');
    if (!imgs.length) { toast('No hay fotos en esta temporada.'); return; }
    var list = '';
    Array.prototype.forEach.call(imgs, function (img, i) {
      list +=
        '<div class="admin-photorow">' +
        '<img src="' + esc(img.currentSrc || img.src) + '" alt="">' +
        '<button type="button" class="admin-btn" data-idx="' + i + '">Cambiar</button>' +
        '</div>';
    });
    var box = openModal(
      '<h3>Fotos de la temporada</h3>' +
      '<p class="admin-hint">Toca "Cambiar" y elige la foto nueva desde tu dispositivo.</p>' +
      list +
      '<div class="admin-modal-actions">' +
      '<button type="button" class="admin-btn admin-btn-primary" data-role="close">Cerrar</button>' +
      '</div>'
    );
    Array.prototype.forEach.call(box.querySelectorAll('[data-idx]'), function (b) {
      b.addEventListener('click', function () {
        var img = imgs[parseInt(b.dataset.idx, 10)];
        closeModal(box);
        editImage(img, true);
      });
    });
    box.querySelector('[data-role="close"]').addEventListener('click', function () { closeModal(box); });
  }

  function addCardButton(host) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'admin-ui admin-addbtn';
    btn.innerHTML = '+ <span>Agregar tarjeta</span>';
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
      publishCard(host);
    });
    return btn;
  }

  function addTextButton(host) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'admin-ui admin-addbtn admin-addbtn-text';
    btn.innerHTML = '+ <span>Agregar párrafo</span>';
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
      publishText(host);
    });
    return btn;
  }

  function delButton() {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'admin-ui admin-delbtn';
    b.title = 'Quitar este elemento';
    b.innerHTML = '&#10005;';
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
      if (window.confirm('¿Quitar este elemento?')) {
        deleteEl(b.closest('.admin-delbtn-host') || b.parentElement);
        autoSave();
        toast('Elemento quitado.');
      }
    });
    return b;
  }

  function ensureDelButtons() {
    if (!editMode) return;
    qa('.card-ghost').forEach(function (card) {
      if (card.querySelector('.admin-delbtn')) return;
      card.classList.add('admin-delbtn-host');
      card.appendChild(delButton());
    });
    qa('.admin-added-text').forEach(function (p) {
      if (p.querySelector('.admin-delbtn')) return;
      p.classList.add('admin-delbtn-host');
      p.appendChild(delButton());
    });
  }

  /* botón directo sobre cada foto para cambiarla con un solo clic */
  function photoChangeButton(img) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'admin-ui admin-photobtn';
    b.title = 'Cambiar foto';
    b.innerHTML = '&#128247;';
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
      editImage(img, true);
    });
    return b;
  }

  function ensurePhotoButtons() {
    if (!editMode) return;
    Array.prototype.forEach.call(document.querySelectorAll('img'), function (img) {
      if (img.closest('.admin-ui')) return;
      var parent = img.parentElement;
      if (!parent || parent === document.body) return;
      if (parent.querySelector('.admin-photobtn')) return;
      if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
      parent.appendChild(photoChangeButton(img));
    });
  }

  function wireSeasonPhotoButtons() {
    qa('.admin-season-photo-btn').forEach(function (btn) {
      if (btn.dataset.adminWired) return;
      btn.dataset.adminWired = '1';
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        var month = btn.dataset.seasonPhoto;
        var landing;
        if (month === 'hero') {
          landing = document.getElementById('inicio');
        } else if (month === 'enero-hero') {
          landing = document.getElementById('enero-hero-photo');
        } else {
          landing = document.querySelector('.halloween-landing[data-landing="' + month + '"]') ||
                    document.getElementById('halloween-landing');
        }
        if (!landing) { toast('No se encontró la portada.'); return; }
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.addEventListener('change', function () {
          var f = input.files[0];
          if (!f) return;
          var rd = new FileReader();
          rd.onload = function () {
            compressImage(rd.result, 1000, 0.55).then(function (compressed) {
              if (month === 'enero-hero') {
                var img = landing.querySelector('img');
                if (img) {
                  img.src = compressed;
                  img.style.width = '100%';
                  img.style.height = '100%';
                  img.style.objectFit = 'cover';
                }
                content.seasonCovers[month] = compressed;
                autoSave();
                toast('Foto de enero actualizada.');
              } else {
                landing.classList.add('has-cover-photo');
                landing.style.backgroundImage = 'url(' + compressed + ')';
                landing.style.backgroundSize = 'cover';
                landing.style.backgroundPosition = 'center';
                content.seasonCovers[month] = compressed;
                autoSave();
                toast('Portada de ' + month + ' actualizada.');
              }
            });
          };
          rd.readAsDataURL(f);
        });
        input.click();
      });
    });
  }

  function wirePhotoControls() {
    var controls = document.getElementById('admin-photo-controls');
    if (!controls || controls.dataset.adminWired) return;
    controls.dataset.adminWired = '1';
    var photo = document.getElementById('enero-hero-photo');
    if (!photo) return;

    if (!content.photoSettings) content.photoSettings = {};
    var s = content.photoSettings.enero || {};
    if (s.width) photo.style.width = s.width + 'px';
    if (s.height) photo.style.height = s.height + 'px';
    if (s.posX) photo.style.transform = 'translateX(' + s.posX + 'px)';
    if (s.posY) photo.style.marginTop = s.posY + 'px';

    qa('.admin-range', controls).forEach(function (range) {
      var key = range.dataset.control;
      var valSpan = range.parentElement.querySelector('.admin-range-val');
      if (s[key] !== undefined) {
        range.value = s[key];
        if (valSpan) valSpan.textContent = s[key];
      }
      range.addEventListener('input', function () {
        var val = parseInt(range.value, 10);
        if (valSpan) valSpan.textContent = val;
        if (!content.photoSettings.enero) content.photoSettings.enero = {};
        content.photoSettings.enero[key] = val;
        if (key === 'width') photo.style.width = val + 'px';
        if (key === 'height') photo.style.height = val + 'px';
        if (key === 'posX') photo.style.transform = 'translateX(' + val + 'px)';
        if (key === 'posY') photo.style.marginTop = val + 'px';
        syncSliders();
        autoSave();
      });
    });

    function syncSliders() {
      var ps = content.photoSettings.enero || {};
      qa('.admin-range', controls).forEach(function (range) {
        var key = range.dataset.control;
        var valSpan = range.parentElement.querySelector('.admin-range-val');
        if (ps[key] !== undefined) {
          range.value = ps[key];
          if (valSpan) valSpan.textContent = ps[key];
        }
      });
    }

    function getSettings() {
      if (!content.photoSettings) content.photoSettings = {};
      if (!content.photoSettings.enero) content.photoSettings.enero = {};
      return content.photoSettings.enero;
    }

    /* RUEDA DEL MOUSE: tamano sin limite */
    photo.addEventListener('wheel', function (e) {
      if (!editMode) return;
      e.preventDefault();
      var st = getSettings();
      var curW = parseInt(photo.style.width, 10) || 380;
      var curH = parseInt(photo.style.height, 10) || 380;
      var delta = e.deltaY > 0 ? -20 : 20;
      var newW = Math.max(100, curW + delta);
      var newH = Math.max(100, curH + delta);
      photo.style.width = newW + 'px';
      photo.style.height = newH + 'px';
      st.width = newW;
      st.height = newH;
      syncSliders();
      autoSave();
    }, { passive: false });

    /* TRIPLE CLIC: ciclar presets */
    var clickCount = 0;
    var clickTimer = null;
    photo.addEventListener('click', function (e) {
      if (!editMode) return;
      if (e.target.closest('.photo-change-btn') || e.target.closest('.admin-photo-controls')) return;
      clickCount++;
      if (clickTimer) clearTimeout(clickTimer);
      clickTimer = setTimeout(function () { clickCount = 0; }, 400);
      if (clickCount >= 3) {
        clickCount = 0;
        var st = getSettings();
        var curW = parseInt(photo.style.width, 10) || 380;
        var presets = [
          { w: 200, h: 200 },
          { w: 300, h: 300 },
          { w: 400, h: 400 },
          { w: 500, h: 500 },
          { w: 600, h: 400 }
        ];
        var idx = presets.findIndex(function (p) { return p.w === curW; });
        var next = presets[(idx + 1) % presets.length];
        photo.style.width = next.w + 'px';
        photo.style.height = next.h + 'px';
        st.width = next.w;
        st.height = next.h;
        syncSliders();
        autoSave();
        toast('Tamaño: ' + next.w + 'x' + next.h);
      }
    });

    /* ARRASTRAR: mover sin limite */
    var isDragging = false;
    var startX, startY, origX, origY;
    photo.addEventListener('mousedown', function (e) {
      if (!editMode) return;
      if (e.target.closest('.photo-change-btn') || e.target.closest('.admin-photo-controls')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      origX = parseInt(content.photoSettings.enero.posX, 10) || 0;
      origY = parseInt(content.photoSettings.enero.posY, 10) || 0;
      photo.style.cursor = 'grabbing';
      photo.style.transition = 'none';
      e.preventDefault();
    });

    document.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      var st = getSettings();
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      var newX = origX + dx;
      var newY = origY + dy;
      photo.style.transform = 'translateX(' + newX + 'px)';
      photo.style.marginTop = newY + 'px';
      st.posX = newX;
      st.posY = newY;
      syncSliders();
    });

    document.addEventListener('mouseup', function () {
      if (isDragging) {
        isDragging = false;
        photo.style.cursor = '';
        photo.style.transition = '';
        autoSave();
      }
    });

    /* SHIFT + RUEDA: mover horizontal */
    photo.addEventListener('wheel', function (e) {
      if (!editMode || !e.shiftKey) return;
      e.preventDefault();
      var st = getSettings();
      var curX = parseInt(photo.style.transform.replace(/[^-\d]/g, ''), 10) || 0;
      var delta = e.deltaY > 0 ? -15 : 15;
      var newX = curX + delta;
      photo.style.transform = 'translateX(' + newX + 'px)';
      st.posX = newX;
      syncSliders();
      autoSave();
    }, { passive: false });

    /* CTRL + RUEDA: mover vertical */
    photo.addEventListener('wheel', function (e) {
      if (!editMode || !e.ctrlKey) return;
      e.preventDefault();
      var st = getSettings();
      var curY = parseInt(photo.style.marginTop, 10) || 0;
      var delta = e.deltaY > 0 ? -15 : 15;
      var newY = curY + delta;
      photo.style.marginTop = newY + 'px';
      st.posY = newY;
      syncSliders();
      autoSave();
    }, { passive: false });
  }

  /* ---------- EDITOR VISUAL COMPLETO ---------- */

  var editorActive = false;
  var selectedEl = null;
  var producedSelectedEl = null;
  var dragState = { active: false, startX: 0, startY: 0, origLeft: 0, origTop: 0 };

  /* ---------- GUÍAS Y SNAPPING DE ALINEACIÓN ---------- */
  var SNAP_GUIDES_STORAGE = 'bodegon_admin_guides';
  var guideBound = false;

  function guidesEnabled() {
    try { return localStorage.getItem(SNAP_GUIDES_STORAGE) !== '0'; } catch (e) { return true; }
  }

  function setGuidesEnabled(on) {
    try { localStorage.setItem(SNAP_GUIDES_STORAGE, on ? '1' : '0'); } catch (e) {}
    var tb = document.querySelector('.admin-toolbar [data-guide="guides"]');
    if (tb) tb.classList.toggle('is-on', on);
    if (!on) clearGuides();
  }

  function ensureGuideLayer() {
    if (document.querySelector('.admin-guide-layer')) return;
    var layer = document.createElement('div');
    layer.className = 'admin-guide-layer';
    layer.innerHTML = '<div class="admin-guide-v" data-guide="v"></div><div class="admin-guide-h" data-guide="h"></div>';
    document.body.appendChild(layer);
  }

  /* Dibuja una línea de guía vertical (x) u horizontal (y) en px absolutos de la página */
  function drawGuide(axis, n) {
    ensureGuideLayer();
    var line = document.querySelector('.admin-guide-layer [data-guide="' + axis + '"]');
    if (axis === 'v') { line.style.left = n + 'px'; line.style.top = '0'; line.style.display = 'block'; }
    else { line.style.top = n + 'px'; line.style.left = '0'; line.style.display = 'block'; }
  }

  function clearGuides() {
    var gv = document.querySelector('.admin-guide-layer [data-guide="v"]');
    var gh = document.querySelector('.admin-guide-layer [data-guide="h"]');
    if (gv) gv.style.display = 'none';
    if (gh) gh.style.display = 'none';
  }

  /* Ajusta left/top para alinear con el centro o los bordes del contenedor padre */
  function snapToGuides(el, left, top) {
    if (!guidesEnabled()) return null;
    var parent = el.parentElement;
    if (!parent) return null;
    var pr = parent.getBoundingClientRect();
    var er = el.getBoundingClientRect();
    var pw = pr.width, ph = pr.height;
    var ew = er.width, eh = er.height;
    if (!pw || !ph || !ew || !eh) return null;

    var elCx = left + ew / 2;
    var elCy = top + eh / 2;
    var parentCx = pw / 2;
    var parentCy = ph / 2;

    var out = { left: left, top: top, changed: false };
    var TH = 7;

    /* Ejes verticales (posición X) */
    var centersV = [
      { v: parentCx, axis: 'v', at: parentCx }
    ];
    /* Alinear centro del elemento con centro del padre */
    if (Math.abs(elCx - parentCx) <= TH) { out.left = Math.round(parentCx - ew / 2); out.changed = true; drawGuide('v', pr.left + parentCx + window.scrollX); }

    /* Alinear borde izquierdo del elemento con borde izquierdo del padre */
    if (Math.abs(left - 0) <= TH) { out.left = 0; out.changed = true; drawGuide('v', pr.left + window.scrollX); }
    /* Alinear borde derecho con borde derecho del padre */
    if (Math.abs((left + ew) - pw) <= TH) { out.left = pw - ew; out.changed = true; drawGuide('v', pr.left + pw + window.scrollX); }

    /* Ejes horizontales (posición Y) */
    if (Math.abs(elCy - parentCy) <= TH) { out.top = Math.round(parentCy - eh / 2); out.changed = true; drawGuide('h', pr.top + parentCy + window.scrollY); }
    if (Math.abs(top - 0) <= TH) { out.top = 0; out.changed = true; drawGuide('h', pr.top + window.scrollY); }
    if (Math.abs((top + eh) - ph) <= TH) { out.top = ph - eh; out.changed = true; drawGuide('h', pr.top + ph + window.scrollY); }

    if (!out.changed) clearGuides();
    return { left: out.left, top: out.top };
  }

  function wireVisualEditor() {
    if (document.body.dataset.visualEditorWired) return;
    document.body.dataset.visualEditorWired = '1';

    /* Panel de propiedades */
    var panel = document.createElement('div');
    panel.className = 'admin-ui editor-panel';
    panel.id = 'editor-panel';
    panel.innerHTML =
      '<div class="editor-panel-header">' +
        '<span class="editor-panel-title">Editor Visual</span>' +
        '<button type="button" class="editor-panel-close" data-action="close">&times;</button>' +
      '</div>' +
      '<div class="editor-panel-body">' +
        '<div class="editor-prop-group">' +
          '<label>Elemento</label>' +
          '<span class="editor-el-tag" id="editor-el-tag">Ninguno</span>' +
        '</div>' +
        '<div class="editor-section-title">Posicion</div>' +
        '<div class="editor-pos-grid">' +
          '<button type="button" class="editor-pos-btn" data-pos="left-top" title="Arriba izquierda">&#8598;</button>' +
          '<button type="button" class="editor-pos-btn" data-pos="center-top" title="Centro arriba">&#8593;</button>' +
          '<button type="button" class="editor-pos-btn" data-pos="right-top" title="Arriba derecha">&#8599;</button>' +
          '<button type="button" class="editor-pos-btn" data-pos="left-center" title="Izquierda centro">&#8592;</button>' +
          '<button type="button" class="editor-pos-btn editor-pos-center" data-pos="center-center" title="Centro">&#9679;</button>' +
          '<button type="button" class="editor-pos-btn" data-pos="right-center" title="Derecha centro">&#8594;</button>' +
          '<button type="button" class="editor-pos-btn" data-pos="left-bottom" title="Abajo izquierda">&#8601;</button>' +
          '<button type="button" class="editor-pos-btn" data-pos="center-bottom" title="Centro abajo">&#8595;</button>' +
          '<button type="button" class="editor-pos-btn" data-pos="right-bottom" title="Abajo derecha">&#8603;</button>' +
        '</div>' +
        '<div class="editor-section-title">Tamano</div>' +
        '<div class="editor-prop-row">' +
          '<label>Ancho</label>' +
          '<input type="number" class="editor-input" data-prop="width" min="20" max="2000"> px' +
        '</div>' +
        '<div class="editor-prop-row">' +
          '<label>Alto</label>' +
          '<input type="number" class="editor-input" data-prop="height" min="20" max="2000"> px' +
        '</div>' +
        '<div class="editor-section-title">Desplazamiento</div>' +
        '<div class="editor-prop-row">' +
          '<label>X</label>' +
          '<input type="number" class="editor-input" data-prop="left"> px' +
        '</div>' +
        '<div class="editor-prop-row">' +
          '<label>Y</label>' +
          '<input type="number" class="editor-input" data-prop="top"> px' +
        '</div>' +
        '<div class="editor-section-title">Apariencia</div>' +
        '<div class="editor-prop-row">' +
          '<label>Fondo</label>' +
          '<input type="color" class="editor-color" data-prop="backgroundColor">' +
        '</div>' +
        '<div class="editor-prop-row">' +
          '<label>Color texto</label>' +
          '<input type="color" class="editor-color" data-prop="color">' +
        '</div>' +
        '<div class="editor-prop-row">' +
          '<label>Borde</label>' +
          '<input type="number" class="editor-input" data-prop="borderWidth" min="0" max="20"> px' +
        '</div>' +
        '<div class="editor-prop-row">' +
          '<label>Radio</label>' +
          '<input type="number" class="editor-input" data-prop="borderRadius" min="0" max="100"> px' +
        '</div>' +
        '<div class="editor-prop-row">' +
          '<label>Opacidad</label>' +
          '<input type="range" class="editor-range" data-prop="opacity" min="0" max="1" step="0.05">' +
          '<span class="editor-range-val" id="editor-opacity-val">1</span>' +
        '</div>' +
        '<div class="editor-section-title">Texto</div>' +
        '<div class="editor-prop-row">' +
          '<label>Tamano</label>' +
          '<input type="number" class="editor-input" data-prop="fontSize" min="8" max="100"> px' +
        '</div>' +
        '<div class="editor-prop-row">' +
          '<label>Fuente</label>' +
          '<select class="editor-select" data-prop="fontFamily">' +
            '<option value="">Default</option>' +
            '<option value="Quicksand, sans-serif">Quicksand</option>' +
            '<option value="Cinzel Decorative, cursive">Cinzel Decorative</option>' +
            '<option value="Arial, sans-serif">Arial</option>' +
            '<option value="Georgia, serif">Georgia</option>' +
            '<option value="Times New Roman, serif">Times New Roman</option>' +
            '<option value="Verdana, sans-serif">Verdana</option>' +
          '</select>' +
        '</div>' +
        '<div class="editor-prop-row">' +
          '<label>Peso</label>' +
          '<select class="editor-select" data-prop="fontWeight">' +
            '<option value="">Default</option>' +
            '<option value="300">Light (300)</option>' +
            '<option value="400">Regular (400)</option>' +
            '<option value="500">Medium (500)</option>' +
            '<option value="600">SemiBold (600)</option>' +
            '<option value="700">Bold (700)</option>' +
            '<option value="800">ExtraBold (800)</option>' +
          '</select>' +
        '</div>' +
        '<div class="editor-actions">' +
          '<button type="button" class="editor-btn editor-btn-save" data-action="save">Guardar</button>' +
          '<button type="button" class="editor-btn editor-btn-drag" data-action="drag">Mover</button>' +
          '<button type="button" class="editor-btn editor-btn-reset" data-action="reset">Restablecer</button>' +
          '<button type="button" class="editor-btn editor-btn-delete" data-action="delete">Eliminar</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(panel);

    /* Handle de seleccion */
    var handle = document.createElement('div');
    handle.className = 'editor-handle';
    handle.id = 'editor-handle';
    document.body.appendChild(handle);

    /* Boton flotante de editor */
    var editBtn = document.getElementById('edit-float-btn');
    if (editBtn) {
      editBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        editorActive = !editorActive;
        editBtn.classList.toggle('is-active', editorActive);
        if (!editorActive) deselectElement();
        toast(editorActive ? 'Editor activado. Haz clic en cualquier elemento.' : 'Editor desactivado.');
      });
    }

    /* Click en panel cerrar */
    panel.querySelector('[data-action="close"]').addEventListener('click', function () {
      deselectElement();
      editorActive = false;
      if (editBtn) editBtn.classList.remove('is-active');
    });

    /* Inputs del panel */
    qa('.editor-input, .editor-color, .editor-range, .editor-select', panel).forEach(function (input) {
      input.addEventListener('input', function () {
        if (!selectedEl) return;
        var prop = input.dataset.prop;
        var val = input.value;
        if (input.type === 'range') {
          var valSpan = input.parentElement.querySelector('.editor-range-val');
          if (valSpan) valSpan.textContent = val;
        }
        if (input.tagName === 'SELECT') {
          selectedEl.style[prop] = val;
        } else if (prop === 'width' || prop === 'height' || prop === 'left' || prop === 'top' ||
            prop === 'borderWidth' || prop === 'borderRadius' || prop === 'fontSize') {
          selectedEl.style[prop] = val + 'px';
        } else {
          selectedEl.style[prop] = val;
        }
        updateHandle();
        autoSave();
      });
    });

    /* Boton guardar */
    panel.querySelector('[data-action="save"]').addEventListener('click', function () {
      autoSave();
      toast('Cambios guardados.');
    });

    /* Boton mover */
    panel.querySelector('[data-action="drag"]').addEventListener('click', function () {
      if (!selectedEl) return;
      toggleDragMode();
    });

    /* Boton restablecer */
    panel.querySelector('[data-action="reset"]').addEventListener('click', function () {
      if (!selectedEl) return;
      if (selectedEl.dataset.origStyles) {
        selectedEl.style.cssText = selectedEl.dataset.origStyles;
        delete selectedEl.dataset.origStyles;
        syncPanel();
        updateHandle();
        autoSave();
        toast('Estilos restablecidos.');
      }
    });

    /* Boton eliminar */
    panel.querySelector('[data-action="delete"]').addEventListener('click', function () {
      if (!selectedEl) return;
      if (window.confirm('¿Eliminar este elemento?')) {
        var el = selectedEl;
        deselectElement();
        el.remove();
        autoSave();
        toast('Elemento eliminado.');
      }
    });

    /* Posicion grid */
    qa('.editor-pos-btn', panel).forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!selectedEl) return;
        var pos = btn.dataset.pos;
        var parent = selectedEl.parentElement;
        if (!parent) return;
        var pComputed = window.getComputedStyle(parent);
        if (pComputed.position === 'static') parent.style.position = 'relative';
        var computed = window.getComputedStyle(selectedEl);
        if (computed.position === 'static') selectedEl.style.position = 'absolute';
        var pH = parent.offsetHeight;
        var pW = parent.offsetWidth;
        var eH = selectedEl.offsetHeight;
        var eW = selectedEl.offsetWidth;
        var coords = {
          'left-top': { left: '0px', top: '0px' },
          'center-top': { left: Math.round((pW - eW) / 2) + 'px', top: '0px' },
          'right-top': { left: (pW - eW) + 'px', top: '0px' },
          'left-center': { left: '0px', top: Math.round((pH - eH) / 2) + 'px' },
          'center-center': { left: Math.round((pW - eW) / 2) + 'px', top: Math.round((pH - eH) / 2) + 'px' },
          'right-center': { left: (pW - eW) + 'px', top: Math.round((pH - eH) / 2) + 'px' },
          'left-bottom': { left: '0px', top: (pH - eH) + 'px' },
          'center-bottom': { left: Math.round((pW - eW) / 2) + 'px', top: (pH - eH) + 'px' },
          'right-bottom': { left: (pW - eW) + 'px', top: (pH - eH) + 'px' }
        };
        var c = coords[pos];
        if (c) {
          selectedEl.style.left = c.left;
          selectedEl.style.top = c.top;
        }
        syncPanel();
        updateHandle();
        autoSave();
        toast('Posicion aplicada.');
      });
    });

    /* Click en la pagina para seleccionar */
    document.addEventListener('click', function (e) {
      if (!editMode || !editorActive) return;
      if (e.target.closest('.admin-toolbar') || e.target.closest('.admin-fab') ||
          e.target.closest('.admin-addbtn') || e.target.closest('.admin-delbtn') ||
          e.target.closest('.admin-seasbtn') || e.target.closest('.admin-photobtn') ||
          e.target.closest('.photo-change-btn') || e.target.closest('.admin-photo-controls') ||
          e.target.closest('.admin-login-panel') || e.target.closest('.toast-container') ||
          e.target.closest('.editor-panel') || e.target.closest('.editor-handle') ||
          e.target.closest('button[data-add-section]') || e.target.closest('button[data-delete-section]')) return;
      e.preventDefault();
      e.stopPropagation();
      selectElement(e.target);
    });

    /* ESC para deseleccionar */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && editorActive) {
        deselectElement();
      }
    });

    /* Drag con handle */
    handle.addEventListener('mousedown', function (e) {
      if (!selectedEl) return;
      e.preventDefault();
      dragState.active = true;
      dragState.startX = e.clientX;
      dragState.startY = e.clientY;
      dragState.origLeft = parseInt(selectedEl.style.left, 10) || 0;
      dragState.origTop = parseInt(selectedEl.style.top, 10) || 0;
      var computed = window.getComputedStyle(selectedEl);
      if (computed.position === 'static') selectedEl.style.position = 'relative';
      handle.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', function (e) {
      if (!dragState.active || !selectedEl) return;
      var dx = e.clientX - dragState.startX;
      var dy = e.clientY - dragState.startY;
      var curLeft = dragState.origLeft + dx;
      var curTop = dragState.origTop + dy;
      producedSelectedEl = selectedEl;
      var snapped = snapToGuides(selectedEl, curLeft, curTop);
      if (snapped) {
        curLeft = snapped.left;
        curTop = snapped.top;
      }
      selectedEl.style.left = curLeft + 'px';
      selectedEl.style.top = curTop + 'px';
      updateHandle();
      syncPanel();
    });

    document.addEventListener('mouseup', function () {
      if (dragState.active) {
        dragState.active = false;
        handle.style.cursor = '';
        clearGuides();
        producedSelectedEl = null;
        autoSave();
      }
    });

    /* RUEDA: resize elementos seleccionados */
    document.addEventListener('wheel', function (e) {
      if (!editMode || !editorActive || !selectedEl) return;
      if (e.target.closest('.editor-panel')) return;
      e.preventDefault();
      var curW = selectedEl.offsetWidth;
      var curH = selectedEl.offsetHeight;
      var factor = e.deltaY > 0 ? 0.95 : 1.05;
      selectedEl.style.width = Math.max(30, Math.round(curW * factor)) + 'px';
      selectedEl.style.height = Math.max(30, Math.round(curH * factor)) + 'px';
      syncPanel();
      updateHandle();
      autoSave();
    }, { passive: false });
  }

  function selectElement(el) {
    if (selectedEl) deselectElement();
    selectedEl = el;
    if (!el.dataset.origStyles) el.dataset.origStyles = el.style.cssText;
    if (!el.dataset.editorId) {
      el.dataset.editorId = 'e' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    }
    el.classList.add('editor-selected');
    var handle = document.getElementById('editor-handle');
    if (handle) handle.style.display = 'block';
    updateHandle();
    syncPanel();
    document.getElementById('editor-panel').classList.add('is-open');
  }

  function deselectElement() {
    if (selectedEl) {
      selectedEl.classList.remove('editor-selected');
      selectedEl = null;
    }
    var handle = document.getElementById('editor-handle');
    if (handle) handle.style.display = 'none';
    var panel = document.getElementById('editor-panel');
    if (panel) panel.classList.remove('is-open');
  }

  function updateHandle() {
    if (!selectedEl) return;
    var handle = document.getElementById('editor-handle');
    if (!handle) return;
    var rect = selectedEl.getBoundingClientRect();
    handle.style.left = rect.left + window.scrollX - 4 + 'px';
    handle.style.top = rect.top + window.scrollY - 4 + 'px';
    handle.style.width = rect.width + 8 + 'px';
    handle.style.height = rect.height + 8 + 'px';
  }

  function syncPanel() {
    if (!selectedEl) return;
    var s = window.getComputedStyle(selectedEl);
    var tag = selectedEl.tagName.toLowerCase();
    if (selectedEl.id) tag += '#' + selectedEl.id;
    if (selectedEl.className) tag += '.' + String(selectedEl.className).split(' ')[0];
    var elTag = document.getElementById('editor-el-tag');
    if (elTag) elTag.textContent = tag;
    var panel = document.getElementById('editor-panel');
    qa('.editor-input', panel).forEach(function (inp) {
      var prop = inp.dataset.prop;
      var raw = selectedEl.style[prop] || '';
      var num = parseInt(raw, 10);
      if (!isNaN(num)) inp.value = num;
    });
    qa('.editor-color', panel).forEach(function (inp) {
      var prop = inp.dataset.prop;
      var raw = selectedEl.style[prop] || '';
      if (raw && raw.charAt(0) === '#') inp.value = raw;
    });
    var opRange = panel.querySelector('[data-prop="opacity"]');
    if (opRange) {
      opRange.value = selectedEl.style.opacity || '1';
      var opVal = panel.querySelector('#editor-opacity-val');
      if (opVal) opVal.textContent = opRange.value;
    }
  }

  function toggleDragMode() {
    var handle = document.getElementById('editor-handle');
    if (handle) {
      handle.style.display = handle.style.display === 'none' ? 'block' : 'none';
    }
  }

  function publishCard(host) {
    var grid = host.classList.contains('grid-haunted') ? host : null;
    var section = grid ? host.closest('.season-catalog') : host;

    var box = openModal(
      '<h3>Publicar tarjeta nueva</h3>' +
      '<label class="admin-field">Foto</label>' +
      '<input type="file" class="admin-file" data-role="file" accept="image/*">' +
      '<label class="admin-field">O URL de la foto</label>' +
      '<input type="text" class="admin-input" data-role="url" placeholder="https://...">' +
      '<label class="admin-field">Título</label>' +
      '<input type="text" class="admin-input" data-role="title" placeholder="Nombre del traje">' +
      '<label class="admin-field">Descripción</label>' +
      '<textarea class="admin-textarea" rows="3" data-role="desc" placeholder="Describe el traje..."></textarea>' +
      '<div class="admin-modal-actions">' +
      '<button type="button" class="admin-btn admin-btn-primary" data-role="ok">Publicar</button>' +
      '<button type="button" class="admin-btn" data-role="cancel">Cancelar</button>' +
      '</div>'
    );
    var pending = null;
    box.querySelector('[data-role="file"]').addEventListener('change', function () {
      var f = box.querySelector('[data-role="file"]').files[0];
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () { pending = rd.result; };
      rd.readAsDataURL(f);
    });

    box.querySelector('[data-role="ok"]').addEventListener('click', function () {
      var src = pending || box.querySelector('[data-role="url"]').value.trim();
      var title = box.querySelector('[data-role="title"]').value.trim();
      var desc = box.querySelector('[data-role="desc"]').value.trim();
      if (!src || !title) { toast('La foto y el título son obligatorios.'); return; }

      function saveCard(imgSrc) {
        var entry = { id: uid(), _type: 'card', container: cssPath(grid || section), img: imgSrc, title: title, desc: desc };
        content.addCards.push(entry);
        insertCard(entry);
        closeModal(box);
        autoSave();
        toast('Tarjeta publicada.');
      }

      if (src.indexOf('data:') === 0) {
        compressImage(src, 1000, 0.55).then(saveCard);
      } else {
        saveCard(src);
      }
    });
    box.querySelector('[data-role="cancel"]').addEventListener('click', function () { closeModal(box); });
  }

  function insertCard(entry) {
    var host = q(entry.container) || (entry.container && document.body);
    if (!host) return;
    var grid = host.classList.contains('grid-haunted') ? host : host.querySelector('.grid-haunted');
    if (!grid) {
      var sec = host;
      grid = document.createElement('div');
      grid.className = 'grid-haunted';
      sec.appendChild(grid);
      var blank = sec.querySelector('.season-blank-title');
      if (blank) blank.style.display = 'none';
      var secTag = sec.querySelector('.season-catalog-tag');
      if (secTag) {
        sec.insertBefore(grid, secTag.nextSibling ? secTag.nextSibling : null);
      }
    }
    var card = document.createElement('div');
    card.className = 'card-ghost admin-added';
    card.dataset.adminId = entry.id;
    card.innerHTML =
      '<div class="img-ghost"><img src="' + esc(entry.img) + '" alt="' + esc(entry.title) + '"></div>' +
      '<div class="card-body-haunted"><h3>' + esc(entry.title) + '</h3><p>' + esc(entry.desc) + '</p></div>';
    grid.appendChild(card);
    wireCard(card, entry);
    if (editMode) ensureDelButtons();
    if (editMode) ensurePhotoButtons();
  }

  function publishText(host) {
    var box = openModal(
      '<h3>Publicar párrafo nuevo</h3>' +
      '<label class="admin-field">Contenido</label>' +
      '<textarea class="admin-textarea" rows="4" data-role="value" placeholder="Escribe el texto..."></textarea>' +
      '<div class="admin-modal-actions">' +
      '<button type="button" class="admin-btn admin-btn-primary" data-role="ok">Publicar</button>' +
      '<button type="button" class="admin-btn" data-role="cancel">Cancelar</button>' +
      '</div>'
    );
    box.querySelector('[data-role="ok"]').addEventListener('click', function () {
      var val = box.querySelector('[data-role="value"]').value.trim();
      if (!val) { toast('Escribe algo para publicar.'); return; }
      var entry = { id: uid(), _type: 'text', container: cssPath(host), html: val };
      content.addTexts.push(entry);
      insertText(entry);
      closeModal(box);
      autoSave();
      toast('Párrafo publicado.');
    });
    box.querySelector('[data-role="cancel"]').addEventListener('click', function () { closeModal(box); });
  }

  function insertText(entry) {
    var host = q(entry.container);
    if (!host) return;
    var p = document.createElement('p');
    p.className = 'season-subtitle admin-added-text';
    p.dataset.adminId = entry.id;
    p.innerHTML = entry.html;
    host.appendChild(p);
    wireText(p, entry);
    if (editMode) ensureDelButtons();
  }
  /* ---------- borrar contenido ---------- */

  function deleteEl(el) {
    var addedHost = el.closest('[data-admin-id]');
    if (addedHost) {
      var id = addedHost.dataset.adminId;
      content.addCards = content.addCards.filter(function (c) { return c.id !== id; });
      content.addTexts = content.addTexts.filter(function (t) { return t.id !== id; });
      content.addTitles = content.addTitles.filter(function (t) { return t.id !== id; });
      content.addPhotos = content.addPhotos.filter(function (p) { return p.id !== id; });
      addedHost.remove();
      return;
    }
    if (el.tagName === 'IMG') {
      var imgPath = cssPath(el);
      if (content.images.indexOf && content.images.length) {
        var found = content.images.some(function (im) { return im.sel === imgPath; });
        if (!found) {
          content.images.push({ sel: imgPath, src: '' });
        }
      } else {
        content.images.push({ sel: imgPath, src: '' });
      }
      el.remove();
      return;
    }
    var path = cssPath(el);
    var key = el.matches('.card-ghost, .card-ghost *') ? 'deleteCards' : 'deleteTexts';
    if (key === 'deleteCards') {
      var card = el.closest('.card-ghost');
      if (card) {
        var cpath = cssPath(card);
        if (content.deleteCards.indexOf(cpath) === -1) content.deleteCards.push(cpath);
        card.style.display = 'none';
      }
    } else {
      if (content.deleteTexts.indexOf(path) === -1) content.deleteTexts.push(path);
      el.style.display = 'none';
    }
  }

  /* ---------- modales ---------- */

  function openModal(html) {
    closeModal();
    var overlay = document.createElement('div');
    overlay.className = 'admin-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:1100;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(10,5,18,0.75);';
    overlay.innerHTML = '<div class="admin-modal-box">' + html + '</div>';
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });
    document.body.appendChild(overlay);
    return overlay;
  }

  function closeModal() {
    var m = document.querySelector('.admin-modal');
    if (m) m.remove();
  }

  /* ---------- aplicar contenido guardado ---------- */

  function applyContent() {
    content.texts.forEach(function (p) {
      var el = q(p.sel);
      if (el) {
        if (/^[Hh][1-6]$/.test(el.tagName) || el.tagName === 'P' || el.tagName === 'SPAN' || el.tagName === 'LI' || el.tagName === 'A') el.innerHTML = p.html;
        else el.textContent = p.html;
      }
    });
    content.images.forEach(function (im) {
      var el = q(im.sel);
      if (el) {
        if (im.src) el.src = im.src;
        else el.remove();
      }
    });
    content.deleteCards.forEach(function (p) {
      var el = q(p);
      if (el) el.style.display = 'none';
    });
    content.deleteTexts.forEach(function (p) {
      var el = q(p);
      if (el) el.style.display = 'none';
    });
    content.addCards.forEach(function (entry) {
      insertCard(entry);
    });
    content.addTexts.forEach(function (entry) {
      insertText(entry);
    });
    content.addTitles.forEach(function (entry) {
      insertTitle(entry);
    });
    content.addPhotos.forEach(function (entry) {
      insertPhoto(entry);
    });
    applyEditorStyles();
  }

  function applyEditorStyles() {
    var es = content.editorStyles || {};
    Object.keys(es).forEach(function (key) {
      var el = document.querySelector('[data-editor-id="' + key + '"]');
      if (el && es[key]) {
        el.style.cssText = es[key];
      }
    });
  }

  function applySeasonCovers() {
    Object.keys(content.seasonCovers).forEach(function (month) {
      var src = content.seasonCovers[month];
      if (!src) return;
      var landing;
      if (month === 'hero') {
        landing = document.getElementById('inicio');
      } else {
        landing = document.querySelector('.halloween-landing[data-landing="' + month + '"]') ||
                  document.getElementById('halloween-landing');
      }
      if (!landing) return;
      landing.classList.add('has-cover-photo');
      landing.style.backgroundImage = 'url(' + src + ')';
      landing.style.backgroundSize = 'cover';
      landing.style.backgroundPosition = 'center';
    });
  }

  /* ---------- wire de elementos dinámicos ---------- */

  function wireCard(card, entry) {
    var img = card.querySelector('img');
    if (img) {
      img.addEventListener('click', function (e) {
        if (!editMode) return;
        e.stopPropagation();
        e.preventDefault();
        editImage(img);
      });
    }
    var h3 = card.querySelector('h3');
    var p = card.querySelector('p');
    [h3, p].forEach(function (t) {
      if (t) t.addEventListener('click', function (e) {
        if (!editMode) return;
        e.stopPropagation();
        e.preventDefault();
        editText(t);
      });
    });
  }

  function wireText(p) {
    p.addEventListener('click', function (e) {
      if (!editMode) return;
      e.stopPropagation();
      e.preventDefault();
      editText(p);
    });
  }

  /* ---------- panel de administración ---------- */

  function buildFab() {
    var fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'admin-ui admin-fab';
    fab.title = 'Iniciar sesión como administrador';
    fab.innerHTML = '&#128274;';
    fab.addEventListener('click', function () {
      if (!authed) { openLogin(); return; }
      if (window.confirm('¿Cerrar sesión de administrador?')) {
        authed = false;
        try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
        disableEditMode();
        updateFabState();
        toast('Sesión cerrada.');
      }
    });
    document.body.appendChild(fab);
  }

  function updateFabState() {
    var fab = document.querySelector('.admin-fab');
    if (!fab) return;
    if (authed) {
      fab.classList.add('is-logged-in');
      fab.title = 'Sesión activa — clic para cerrar sesión';
      fab.innerHTML = '&#128100;';
    } else {
      fab.classList.remove('is-logged-in');
      fab.title = 'Iniciar sesión como administrador';
      fab.innerHTML = '&#128274;';
    }
  }

  function openLogin() {
    var box = openModal(
      '<h3>Acceso de administrador</h3>' +
      '<label class="admin-field">Usuario</label>' +
      '<input type="text" class="admin-input" data-role="user" autocomplete="username">' +
      '<label class="admin-field">Contraseña</label>' +
      '<input type="password" class="admin-input" data-role="pass" autocomplete="current-password">' +
      '<p class="admin-hint" data-role="hint"></p>' +
      '<div class="admin-modal-actions">' +
      '<button type="button" class="admin-btn admin-btn-primary" data-role="ok">Entrar</button>' +
      '<button type="button" class="admin-btn" data-role="cancel">Cancelar</button>' +
      '</div>'
    );
    var userInp = box.querySelector('[data-role="user"]');
    var inp = box.querySelector('[data-role="pass"]');
    var okBtn = box.querySelector('[data-role="ok"]');
    var hint = box.querySelector('[data-role="hint"]');
    var timer = null;

    function fmt(s) {
      var m = Math.floor(s / 60);
      var sec = s % 60;
      return m + ':' + (sec < 10 ? '0' : '') + sec;
    }

    function setLocked(remaining) {
      userInp.disabled = true;
      inp.disabled = true;
      okBtn.disabled = true;
      hint.innerHTML = 'Máximo de intentos alcanzado. Si olvidaste la contraseña, comunícate al <a href="https://wa.me/573107706615" target="_blank" rel="noopener"><strong>' + CONTACT_PHONE + '</strong></a>. Podrás intentar de nuevo en ' + fmt(remaining) + '.';
    }

    function unlock() {
      loginAttempts = 0;
      lockUntil = 0;
      userInp.disabled = false;
      inp.disabled = false;
      okBtn.disabled = false;
      hint.textContent = 'Puedes intentar de nuevo.';
    }

    function tick() {
      if (!box.isConnected) { clearInterval(timer); return; }
      var left = Math.max(0, Math.round((lockUntil - Date.now()) / 1000));
      if (left <= 0) {
        unlock();
        clearInterval(timer);
        return;
      }
      setLocked(left);
    }

    function lockNow() {
      lockUntil = Date.now() + LOCK_MS;
      setLocked(LOCK_MS / 1000);
      clearInterval(timer);
      timer = setInterval(tick, 1000);
    }

    box.querySelector('[data-role="cancel"]').addEventListener('click', function () {
      clearInterval(timer);
      closeModal(box);
    });

    if (Date.now() < lockUntil) {
      setLocked(Math.max(0, Math.round((lockUntil - Date.now()) / 1000)));
      timer = setInterval(tick, 1000);
      return;
    }

    function tryLogin() {
      if (loginAttempts >= 5) return;
      var expectedU = content.usernameHash || hash(DEFAULT_USERNAME);
      var expectedP = content.passwordHash || hash(DEFAULT_PASSWORD);
      if (hash(userInp.value) === expectedU && hash(inp.value) === expectedP) {
        authed = true;
        loginAttempts = 0;
        lockUntil = 0;
        try { localStorage.setItem(SESSION_KEY, '1'); } catch (e) {}
        clearInterval(timer);
        closeModal();
        enableEditMode();
        updateFabState();
        toast('Bienvenido, administrador.');
      } else {
        loginAttempts++;
        var left = 5 - loginAttempts;
        if (left <= 0) {
          lockNow();
        } else {
          hint.textContent = 'Error, intenta de nuevo. Te quedan ' + left + ' intento' + (left === 1 ? '' : 's') + '.';
        }
      }
    }
    box.querySelector('[data-role="ok"]').addEventListener('click', tryLogin);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') tryLogin(); });
    setTimeout(function () { userInp.focus(); }, 60);
  }

  function enableEditMode() {
    editMode = true;
    document.body.classList.add('admin-edit-mode');
    ensureToolbar();
    ensureLogoutFab();
    ensureSaveFab();
    ensureAddButtons();
    ensureDelButtons();
    ensurePhotoButtons();
    wireStatic();
    wireSeasonPhotoButtons();
    wirePhotoControls();
    wireVisualEditor();
    ensureGridOverlay();
    if (gridEnabled()) document.getElementById('admin-grid-overlay').classList.add('is-visible');
  }

  function disableEditMode() {
    editMode = false;
    document.body.classList.remove('admin-edit-mode');
    var tb = document.querySelector('.admin-toolbar');
    if (tb) tb.remove();
    var lo = document.querySelector('.admin-logout-fab');
    if (lo) lo.remove();
    var sf = document.querySelector('.admin-save-fab');
    if (sf) sf.remove();
    qa('.admin-addbtn').forEach(function (b) { b.remove(); });
    qa('.admin-delbtn').forEach(function (b) { b.remove(); });
    qa('.admin-seasbtn').forEach(function (b) { b.remove(); });
    qa('.admin-photobtn').forEach(function (b) { b.remove(); });
    var grid = document.getElementById('admin-grid-overlay');
    if (grid) grid.classList.remove('is-visible');
    var help = document.querySelector('.admin-help-panel');
    if (help) help.remove();
    clearGuides();
  }

  function ensureToolbar() {
    if (document.querySelector('.admin-toolbar')) return;
    var tb = document.createElement('div');
    tb.className = 'admin-ui admin-toolbar';
    tb.innerHTML =
      '<span class="admin-toolbar-title">Modo administrador</span>' +
      '<button type="button" class="admin-btn admin-btn-guide" data-guide="guides" title="Mostrar/ocultar guías de alineación al mover">Guías</button>' +
      '<button type="button" class="admin-btn admin-btn-guide" data-guide="grid" title="Mostrar/ocultar la rejilla de alineación">&#9638; Rejilla</button>' +
      '<button type="button" class="admin-btn admin-btn-help" data-guide="help" title="Abrir la guía de uso">Ayuda ?</button>' +
      '<button type="button" class="admin-btn admin-btn-primary" data-role="save">Guardar</button>' +
      '<button type="button" class="admin-btn admin-btn-sync" data-role="sync">Sincronizar ahora</button>' +
      '<button type="button" class="admin-btn admin-btn-backup" data-role="backup" title="Ver y restaurar copias de seguridad automáticas">Respaldos</button>' +
      '<button type="button" class="admin-btn admin-btn-export" data-role="export">Descargar cambios</button>' +
      '<button type="button" class="admin-btn" data-role="verify">Verificar</button>' +
      '<button type="button" class="admin-btn" data-role="password">Cambiar contraseña</button>';
    document.body.appendChild(tb);
    if (guidesEnabled()) tb.querySelector('[data-guide="guides"]').classList.add('is-on');

    var saveBtn = tb.querySelector('[data-role="save"]');
    var saveTimer = setInterval(function () {
      if (!tb.isConnected) { clearInterval(saveTimer); return; }
      var activePanel = document.querySelector('.season-panel.is-active');
      var isEnero = activePanel && activePanel.dataset && activePanel.dataset.panel === 'enero';
      saveBtn.style.display = isEnero ? '' : 'none';
    }, 800);

    saveBtn.addEventListener('click', function () {
      autoSave();
      toast('Guardado en el navegador.');
    });
    tb.querySelector('[data-role="sync"]').addEventListener('click', forceSyncNow);
    tb.querySelector('[data-role="backup"]').addEventListener('click', function () {
      backupNow('manual');
      openBackupPanel();
    });
    tb.querySelector('[data-role="export"]').addEventListener('click', function () {
      saveToDisk();
    });
    tb.querySelector('[data-role="verify"]').addEventListener('click', testCloudConnection);
    tb.querySelector('[data-role="password"]').addEventListener('click', changePassword);

    tb.querySelector('[data-guide="guides"]').addEventListener('click', function () {
      setGuidesEnabled(!guidesEnabled());
      toast((guidesEnabled() ? 'Guías de alineación activadas.' : 'Guías de alineación desactivadas.'));
    });
    tb.querySelector('[data-guide="grid"]').addEventListener('click', function () {
      toggleGrid();
    });
    tb.querySelector('[data-guide="help"]').addEventListener('click', function () {
      openHelpPanel();
    });
  }

  /* ---------- REJILLA DE ALINEACIÓN ---------- */
  var GRID_STORAGE = 'bodegon_admin_grid';

  function ensureGridOverlay() {
    if (document.querySelector('.admin-grid-overlay')) return;
    var grid = document.createElement('div');
    grid.className = 'admin-grid-overlay';
    grid.id = 'admin-grid-overlay';
    document.body.appendChild(grid);
  }

  function gridEnabled() {
    try { return localStorage.getItem(GRID_STORAGE) === '1'; } catch (e) { return false; }
  }

  function toggleGrid() {
    var on = !gridEnabled();
    try { localStorage.setItem(GRID_STORAGE, on ? '1' : '0'); } catch (e) {}
    ensureGridOverlay();
    document.getElementById('admin-grid-overlay').classList.toggle('is-visible', on);
    var btn = document.querySelector('.admin-toolbar [data-guide="grid"]');
    if (btn) btn.classList.toggle('is-on', on);
    toast(on ? 'Rejilla de alineación activada.' : 'Rejilla desactivada.');
  }

  /* ---------- PANEL DE AYUDA / TUTORIAL ---------- */
  function openHelpPanel() {
    if (document.querySelector('.admin-help-panel')) return;
    var panel = document.createElement('div');
    panel.className = 'admin-help-panel';
    panel.innerHTML =
      '<div class="admin-help-box">' +
        '<button type="button" class="admin-help-close" data-help="close" title="Cerrar">&times;</button>' +
        '<h3 class="admin-help-title">Guía del administrador</h3>' +
        '<p class="admin-help-intro">Estas herramientas te ayudan a posicionar y publicar contenido en toda la página. Solo se ven cuando inicias sesión.</p>' +
        '<div class="admin-help-section"><h4>1 · Posicionar contenido</h4>' +
          '<ul>' +
            '<li>Pulsa el botón <b>Editor Visual</b> (lápiz dorado) y haz clic en cualquier elemento de la página.</li>' +
            '<li>Se abre el panel lateral con posición, tamaño, color, opacidad y texto.</li>' +
            '<li>Arrastra desde el borde dorado punteado para <b>mover</b> el elemento.</li>' +
            '<li>Usa la <b>rueda del ratón</b> sobre el elemento seleccionado para <b>redimensionarlo</b>.</li>' +
            '<li>Tecla <b>Esc</b> para deseleccionar.</li>' +
          '</ul>' +
        '</div>' +
        '<div class="admin-help-section"><h4>2 · Guías y rejilla de alineación</h4>' +
          '<ul>' +
            '<li><b>Guías:</b> mientras arrastras, aparecen líneas doradas y el elemento se <b>adhiere</b> al centro y a los bordes de su caja.</li>' +
            '<li><b>Rejilla:</b> activa la cuadrícula para alinear elementos con precisión.</li>' +
            '<li>Ábrelas/ciérralas desde los botones del panel superior (Modo administrador).</li>' +
          '</ul>' +
        '</div>' +
        '<div class="admin-help-section"><h4>3 · Añadir contenido</h4>' +
          '<ul>' +
            '<li>Botón <b>+ Agregar párrafo</b>: inserta texto en una sección.</li>' +
            '<li>Botón <b>+ Agregar título</b>: inserta un encabezado.</li>' +
            '<li>Botón <b>+ Agregar foto</b>: sube una imagen o pega una URL.</li>' +
            '<li>Botón <b>+ Agregar tarjeta</b>: publica una tarjeta nueva con foto, título y descripción.</li>' +
            '<li>Cada elemento nuevo se marca con un borde punteado y se puede mover o editar tocándolo.</li>' +
          '</ul>' +
        '</div>' +
        '<div class="admin-help-section"><h4>4 · Fotos de portada y temporadas</h4>' +
          '<ul>' +
            '<li>Botón <b>Cambiar portada / fotos de temporada</b> sobre cada banner.</li>' +
            '<li>En Enero además hay controles de ancho, alto y posición de su foto.</li>' +
          '</ul>' +
        '</div>' +
        '<div class="admin-help-section"><h4>5 · Guardar</h4>' +
          '<ul>' +
            '<li>Todo se guarda solo en el navegador (indicador verde "Guardado").</li>' +
            '<li><b>Guardar</b> guarda en este navegador; <b>Sincronizar</b> sube a GitHub/cloud.</li>' +
            '<li><b>Descargar cambios</b> exporta el archivo de contenido para reemplazar admin-content.js.</li>' +
          '</ul>' +
        '</div>' +
        '<p class="admin-help-hint">Consejo: activa las Guías + la Rejilla a la vez y arrastra hasta que el elemento se pegue al centro para lograr un diseño centrado y ordenado.</p>' +
      '</div>';
    document.body.appendChild(panel);
    panel.querySelector('[data-help="close"]').addEventListener('click', function () { panel.remove(); });
    panel.addEventListener('click', function (e) { if (e.target === panel) panel.remove(); });
    var esc = function (e) { if (e.key === 'Escape') { panel.remove(); document.removeEventListener('keydown', esc); } };
    document.addEventListener('keydown', esc);
  }

  function ensureLogoutFab() {
    if (document.querySelector('.admin-logout-fab')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'admin-ui admin-logout-fab';
    b.title = 'Cerrar sesión';
    b.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>';
    b.addEventListener('click', function () {
      authed = false;
      try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
      disableEditMode();
      updateFabState();
      toast('Sesión cerrada.');
    });
    document.body.appendChild(b);
  }

  function ensureSaveFab() {
    if (document.querySelector('.admin-save-fab')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'admin-ui admin-save-fab';
    b.title = 'Guardar cambios';
    b.innerHTML = '&#128190;';
    b.addEventListener('click', function () {
      autoSave();
      toast('Guardado en el navegador.');
    });
    document.body.appendChild(b);
  }

  function ensureAddButtons() {
    qa('.grid-haunted').forEach(function (g) {
      if (!g.querySelector('.admin-addbtn')) g.appendChild(addCardButton(g));
    });
    qa('.season-catalog').forEach(function (s) {
      if (!s.querySelector('.admin-addbtn-text')) s.appendChild(addTextButton(s));
    });
    qa('.season-subsection').forEach(function (s) {
      if (!s.querySelector('.admin-addbtn-text')) s.appendChild(addTextButton(s));
    });
    qa('.hero-horror .hero-box').forEach(function (s) {
      if (!s.querySelector('.admin-addbtn-text')) s.appendChild(addTextButton(s));
    });
    qa('.season-panel').forEach(function (p) {
      if (!p.querySelector('.admin-seasbtn')) p.insertBefore(seasonPhotoButton(p), p.firstChild);
    });
    /* Botones adicionales de tipo de contenido */
    ensureAddTitleButtons();
    ensureAddPhotoButtons();
  }

  /* ---------- añadir título ---------- */
  function addTitleButton(host) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'admin-ui admin-addbtn admin-addbtn-title';
    btn.innerHTML = '+ <span>Agregar título</span>';
    btn.title = 'Insertar un encabezado';
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
      publishTitle(host);
    });
    return btn;
  }

  function publishTitle(host) {
    var box = openModal(
      '<h3>Publicar título nuevo</h3>' +
      '<label class="admin-field">Texto del título</label>' +
      '<input type="text" class="admin-input" data-role="value" placeholder="Escribe el título...">' +
      '<div class="admin-modal-actions">' +
      '<button type="button" class="admin-btn admin-btn-primary" data-role="ok">Publicar</button>' +
      '<button type="button" class="admin-btn" data-role="cancel">Cancelar</button>' +
      '</div>'
    );
    box.querySelector('[data-role="ok"]').addEventListener('click', function () {
      var val = box.querySelector('[data-role="value"]').value.trim();
      if (!val) { toast('Escribe el título.'); return; }
      var entry = { id: uid(), _type: 'title', container: cssPath(host), html: val };
      content.addTitles.push(entry);
      insertTitle(entry);
      closeModal(box);
      autoSave();
      toast('Título publicado.');
    });
    box.querySelector('[data-role="cancel"]').addEventListener('click', function () { closeModal(box); });
  }

  function insertTitle(entry) {
    var host = q(entry.container);
    if (!host) return;
    var h = document.createElement('h3');
    h.className = 'admin-added-title';
    h.dataset.adminId = entry.id;
    h.textContent = entry.html;
    host.appendChild(h);
    wireTitle(h);
    if (editMode) ensureDelButtons();
  }

  function ensureAddTitleButtons() {
    qa('.season-catalog, .season-subsection, .hero-horror .hero-box').forEach(function (s) {
      if (!s.querySelector('.admin-addbtn-title')) s.appendChild(addTitleButton(s));
    });
  }

  function wireTitle(h) {
    h.addEventListener('click', function (e) {
      if (!editMode) return;
      e.stopPropagation();
      e.preventDefault();
      editText(h);
    });
  }

  /* ---------- añadir foto ---------- */
  function addPhotoButton(host) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'admin-ui admin-addbtn admin-addbtn-photo';
    btn.innerHTML = '+ <span>Agregar foto</span>';
    btn.title = 'Insertar una fotografía';
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
      publishPhoto(host);
    });
    return btn;
  }

  function publishPhoto(host) {
    var box = openModal(
      '<h3>Publicar foto nueva</h3>' +
      '<label class="admin-field">URL de la imagen</label>' +
      '<input type="text" class="admin-input" data-role="value" placeholder="https://...">' +
      '<p class="admin-hint">Pega la dirección de la imagen o súbela con el botón.</p>' +
      '<div class="admin-modal-actions">' +
      '<button type="button" class="admin-btn admin-btn-primary" data-role="ok">Publicar</button>' +
      '<button type="button" class="admin-btn" data-role="cancel">Cancelar</button>' +
      '</div>'
    );
    var inp = box.querySelector('[data-role="value"]');
    var ok = function () {
      var val = inp.value.trim();
      if (!val) { toast('Pega o escribe una URL de imagen.'); return; }
      var entry = { id: uid(), _type: 'photo', container: cssPath(host), src: val };
      content.addPhotos.push(entry);
      insertPhoto(entry);
      closeModal(box);
      autoSave();
      toast('Foto publicada.');
    };
    box.querySelector('[data-role="ok"]').addEventListener('click', ok);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') ok(); });
    box.querySelector('[data-role="cancel"]').addEventListener('click', function () { closeModal(box); });
    setTimeout(function () { inp.focus(); }, 50);
  }

  function insertPhoto(entry) {
    var host = q(entry.container);
    if (!host) return;
    var img = document.createElement('img');
    img.className = 'admin-added-photo';
    img.dataset.adminId = entry.id;
    img.src = entry.src;
    img.alt = 'Foto publicada';
    host.appendChild(img);
    wirePhotoImages();
    if (editMode) ensureDelButtons();
  }

  function wirePhotoImages() {
    qa('.admin-added-photo').forEach(function (img) {
      if (img.dataset.adminWiredPhoto) return;
      img.dataset.adminWiredPhoto = '1';
      img.addEventListener('click', function (e) {
        if (!editMode) return;
        e.stopPropagation();
        e.preventDefault();
        editImage(img);
      });
    });
  }

  function ensureAddPhotoButtons() {
    qa('.season-catalog, .season-subsection, .hero-horror .hero-box, .season-panel .season-content').forEach(function (s) {
      if (!s.querySelector('.admin-addbtn-photo')) s.appendChild(addPhotoButton(s));
    });
  }


  function wireStatic() {
    qa('.card-ghost').forEach(function (card) {
      if (card.dataset.adminWired) return;
      card.dataset.adminWired = '1';
      var img = card.querySelector('img');
      var h3 = card.querySelector('h3');
      var p = card.querySelector('p');
      if (img) img.addEventListener('click', function (e) {
        if (!editMode) return;
        e.stopPropagation();
        e.preventDefault();
        editImage(img);
      });
      [h3, p].forEach(function (t) {
        if (!t) return;
        t.addEventListener('click', function (e) {
          if (!editMode) return;
          e.stopPropagation();
          e.preventDefault();
          editText(t);
        });
      });
    });

    qa(TEXT_SEL).forEach(function (el) {
      if (el.closest('.admin-ui')) return;
      if (el.closest('.season-tab-clone')) return;
      if (el.dataset.adminWired) return;
      if (el.matches('.card-ghost h3, .card-ghost p')) return;
      el.dataset.adminWired = '1';
      el.addEventListener('click', function (e) {
        if (!editMode) return;
        e.stopPropagation();
        e.preventDefault();
        editText(el);
      });
    });
  }

  /* ---------- guardar / cargar ---------- */

  /* ---------- auto-save en localStorage ---------- */

  function autoSave() {
    try {
      var data = serialize();
      localStorage.setItem(AUTOSAVE_KEY, data);
      /* Mantener siempre actualizado el pendiente de sincronización: si ya hay
         cambios sin subir y el usuario sigue editando, se combinan para no
         perder nunca las ediciones más recientes. */
      if (hasPendingSync()) savePendingSync(data);
      showSaveIndicator();
      scheduleCloudSync();
    } catch (e) {
      toast('⚠️ No se pudo guardar. El almacenamiento está lleno. Intenta con fotos más pequeñas.');
    }
  }

  /* ---------- backups rotativos (nada se pierde) ---------- */

  function backupNow(reason, dataToBackup) {
    try {
      var data = dataToBackup || serialize();
      var ts = new Date();
      var stamp = ts.getFullYear() + '-' +
        ('0' + (ts.getMonth() + 1)).slice(-2) + '-' +
        ('0' + ts.getDate()).slice(-2) + ' ' +
        ('0' + ts.getHours()).slice(-2) + ':' +
        ('0' + ts.getMinutes()).slice(-2) + ':' +
        ('0' + ts.getSeconds()).slice(-2);
      var entry = {
        id: ts.getTime(),
        created: stamp,
        reason: reason || 'manual',
        data: data
      };
      /* rotación: mover cada slot hacia atrás */
      try {
        var oldest = BACKUP_SLOTS - 1;
        var old = localStorage.getItem(BACKUP_KEY_PREFIX + oldest);
        if (old) localStorage.removeItem(BACKUP_KEY_PREFIX + oldest);
        for (var i = oldest - 1; i >= 0; i--) {
          var cur = localStorage.getItem(BACKUP_KEY_PREFIX + i);
          if (cur) localStorage.setItem(BACKUP_KEY_PREFIX + (i + 1), cur);
        }
      } catch (e) {}

      /* guardar respaldo en slots 1..N, mantener slot 0 como "último" para no perder lo más reciente */
      try {
        var penultimate = localStorage.getItem(BACKUP_KEY_PREFIX + '0');
        if (penultimate) localStorage.setItem(BACKUP_KEY_PREFIX + '1', penultimate);
        localStorage.setItem(BACKUP_KEY_PREFIX + '0', JSON.stringify(entry));
      } catch (e) {}

      /* registro de respaldos (fecha/contenido) */
      try {
        var log = [];
        try { log = JSON.parse(localStorage.getItem(BACKUP_LOG_KEY) || '[]'); } catch (e) { log = []; }
        log.unshift({ ts: stamp, reason: reason || 'manual', len: data.length });
        if (log.length > 20) log.length = 20;
        localStorage.setItem(BACKUP_LOG_KEY, JSON.stringify(log));
      } catch (e) {}

      return entry.id;
    } catch (e) { return null; }
  }

  function listBackups() {
    var out = [];
    for (var i = 0; i < BACKUP_SLOTS; i++) {
      try {
        var raw = localStorage.getItem(BACKUP_KEY_PREFIX + i);
        if (!raw) continue;
        var entry = JSON.parse(raw);
        out.push({ slot: i, id: entry.id, created: entry.created, reason: entry.reason, len: entry.data ? entry.data.length : 0 });
      } catch (e) {}
    }
    return out.sort(function (a, b) { return b.id - a.id; });
  }

  function restoreBackup(slot) {
    try {
      var raw = localStorage.getItem(BACKUP_KEY_PREFIX + slot);
      if (!raw) { toast('No existe ese respaldo.'); return false; }
      var entry = JSON.parse(raw);
      var obj = JSON.parse(entry.data);
      /* antes de restaurar, respaldar lo actual para no perder el estado presente */
      backupNow('antes-de-restaurar');
      applyData(obj);
      applySeasonCovers();
      localStorage.setItem(AUTOSAVE_KEY, entry.data);
      clearPendingSync();
      toast('Respaldo restaurado (' + entry.created + ', ' + entry.reason + '). Sincronizando...');
      scheduleCloudSync();
      return true;
    } catch (e) {
      toast('No se pudo restaurar el respaldo: ' + e.message);
      return false;
    }
  }

  function openBackupPanel() {
    var list = listBackups();
    if (!list.length) {
      toast('No hay respaldos guardados todavía.');
      return;
    }
    var rows = list.map(function (b) {
      return '<div class="admin-backup-row">' +
        '<span class="admin-backup-info">' +
        '<b>' + b.created + '</b> · ' + (b.reason || 'manual') +
        '</span>' +
        '<button type="button" class="admin-btn admin-btn-primary admin-backup-restore" data-slot="' + b.slot + '">Restaurar</button>' +
        '</div>';
    }).join('');
    var box = openModal(
      '<h3>Respaldos automáticos</h3>' +
      '<p class="admin-backup-hint">Copias de seguridad guardadas en este navegador. Restaura una si algo se perdió.</p>' +
      '<div class="admin-backup-list">' + rows + '</div>' +
      '<div class="admin-modal-actions">' +
      '<button type="button" class="admin-btn" data-role="now">Crear respaldo ahora</button>' +
      '<button type="button" class="admin-btn" data-role="close">Cerrar</button>' +
      '</div>'
    );
    box.querySelector('[data-role="now"]').addEventListener('click', function () {
      backupNow('manual');
      toast('Respaldo creado.');
      closeModal(box);
      openBackupPanel();
    });
    box.querySelector('[data-role="close"]').addEventListener('click', function () { closeModal(box); });
    box.querySelectorAll('.admin-backup-restore').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var slot = parseInt(btn.getAttribute('data-slot'), 10);
        if (restoreBackup(slot)) closeModal(box);
      });
    });
  }

  function showSaveIndicator() {
    var ind = document.querySelector('.admin-save-indicator');
    if (!ind) {
      ind = document.createElement('div');
      ind.className = 'admin-ui admin-save-indicator';
      ind.innerHTML = '<span class="admin-save-dot"></span> Guardado';
      document.body.appendChild(ind);
    }
    ind.classList.add('is-visible');
    clearTimeout(ind._timer);
    ind._timer = setTimeout(function () {
      ind.classList.remove('is-visible');
    }, 2000);
  }

  function scheduleCloudSync() {
    clearTimeout(cloudSyncTimer);
    cloudSyncTimer = setTimeout(syncToCloud, CLOUD_SYNC_DELAY);
  }

  function savePendingSync(data) {
    try {
      localStorage.setItem(PENDING_SYNC_KEY, data);
    } catch (e) {}
  }

  function clearPendingSync() {
    try {
      localStorage.removeItem(PENDING_SYNC_KEY);
    } catch (e) {}
  }

  function hasPendingSync() {
    try {
      return !!localStorage.getItem(PENDING_SYNC_KEY);
    } catch (e) { return false; }
  }

  /* Detecta si el fallo se debe a falta de conexión (red caída, sin internet,
     servidor inaccesible, timeout). Cualquier error no relacionado con el token. */
  function isOfflineError(err) {
    var m = String((err && err.message) || err || '');
    if (m.indexOf('GITHUB_TOKEN') !== -1 || m.indexOf('no está configurado') !== -1) return false;
    if (m.indexOf('Sin conexión') !== -1 || m.indexOf('offline') !== -1 ||
        m.indexOf('Failed to fetch') !== -1 || m.indexOf('NetworkError') !== -1 ||
        m.indexOf('network') !== -1 || m.indexOf('Network request failed') !== -1 ||
        m.indexOf('timed out') !== -1 || m.indexOf('timeout') !== -1 ||
        m.indexOf('TypeError') !== -1) return true;
    return true;
  }

  function syncToCloud(dataToSend) {
    if (cloudSyncing) return;
    cloudSyncing = true;

    /* Usar siempre lo más reciente y fresco para no perder ni enviar datos viejos:
       si hay un pendiente guardado, ese es el contenido más reciente. */
    var data;
    if (dataToSend) {
      data = dataToSend;
    } else if (hasPendingSync()) {
      data = localStorage.getItem(PENDING_SYNC_KEY);
    } else {
      data = serialize();
    }

    /* Copia de seguridad local justo antes de escribir en GitHub: si el
       guardado remoto falla o algo se corrompe, siempre queda la versión. */
    backupNow('antes-de-sincronizar', data);

    var syncBadge = document.querySelector('.admin-cloud-sync');
    if (!syncBadge) {
      syncBadge = document.createElement('div');
      syncBadge.className = 'admin-ui admin-cloud-sync';
      document.body.appendChild(syncBadge);
    }
    syncBadge.innerHTML = '<span class="admin-cloud-icon">☁</span> Sincronizando...';
    syncBadge.classList.add('is-visible');
    syncBadge.classList.remove('is-error', 'is-ok');

    var url = getCloudUrl();
    console.log('[cloud-sync] Enviando a:', url, '| online:', navigator.onLine);

    /* Timeout para que un fetch colgado no bloquee nunca el flujo de guardado. */
    var controller = null;
    if (window.AbortController) controller = new AbortController();
    var timeoutId = null;
    if (controller) {
      timeoutId = setTimeout(function () { controller.abort(); }, 15000);
    }

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: data,
        message: 'Admin update (' + new Date().toLocaleString() + ')'
      }),
      signal: controller ? controller.signal : undefined
    })
      .then(function (res) {
        if (timeoutId) clearTimeout(timeoutId);
        return res.json().then(function (j) { return { ok: res.ok, json: j }; });
      })
      .then(function (r) {
        cloudSyncing = false;
        if (timeoutId) clearTimeout(timeoutId);
        if (r.ok && r.json.ok) {
          clearPendingSync();
          syncBadge.innerHTML = '<span class="admin-cloud-icon">✓</span> Sincronizado con GitHub';
          syncBadge.classList.add('is-ok');
          cloudSyncRetries = 0;
          setTimeout(function () { syncBadge.classList.remove('is-visible', 'is-ok'); }, 3000);
        } else {
          throw new Error(r.json.error || 'Error del servidor');
        }
      })
      .catch(function (err) {
        cloudSyncing = false;
        if (timeoutId) clearTimeout(timeoutId);
        var errMsg = err.message || String(err);

        if (errMsg.indexOf('GITHUB_TOKEN') !== -1 || errMsg.indexOf('no está configurado') !== -1) {
          syncBadge.innerHTML = '<span class="admin-cloud-icon">⚠</span> Token de GitHub no configurado';
          syncBadge.classList.add('is-error');
          syncBadge.title = 'Ve a Vercel → Settings → Environment Variables y crea GITHUB_TOKEN';
          setTimeout(function () { syncBadge.classList.remove('is-visible', 'is-error'); }, 6000);
          return;
        }

        /* Guardado local garantizado: los cambios NUNCA se pierden aunque no
           haya conexión. Se subirán cuando la conexión vuelva. */
        savePendingSync(data);

        if (isOfflineError(err)) {
          showOfflineBadge();
          cloudSyncRetries = 0;
          /* Se reintentará automáticamente desde el intervalo periódico,
             el evento 'online' y al hacer clic en "Sincronizar ahora". */
        } else {
          cloudSyncRetries++;
          if (cloudSyncRetries < MAX_RETRIES) {
            syncBadge.innerHTML = '<span class="admin-cloud-icon">⟳</span> Reintentando... (' + cloudSyncRetries + '/' + MAX_RETRIES + ')';
            setTimeout(function () { syncToCloud(data); }, 3000);
          } else {
            showOfflineBadge();
            cloudSyncRetries = 0;
          }
        }
        console.warn('[cloud-sync]', errMsg);
      });
  }

  function showOfflineBadge() {
    var syncBadge = document.querySelector('.admin-cloud-sync');
    if (!syncBadge) {
      syncBadge = document.createElement('div');
      syncBadge.className = 'admin-ui admin-cloud-sync';
      document.body.appendChild(syncBadge);
    }
    syncBadge.innerHTML = '<span class="admin-cloud-icon">✓</span> Guardado en este dispositivo. Sin conexión: se subirá solo al reconectar.';
    syncBadge.classList.add('is-error');
    syncBadge.classList.remove('is-ok');
    setTimeout(function () { syncBadge.classList.remove('is-visible', 'is-error'); }, 8000);
  }

  function retryPendingSyncs() {
    if (!hasPendingSync()) return;
    var pending = localStorage.getItem(PENDING_SYNC_KEY);
    if (pending) {
      toast('Sincronizando cambios pendientes...');
      syncToCloud(pending);
    }
  }

  window.addEventListener('online', retryPendingSyncs);
  window.addEventListener('online', function () {
    if (hasPendingSync()) toast('Conexión restaurada. Sincronizando pendientes...');
  });

  /* Guardado automático periódico: si hay cambios sin sincronizar, se reintentan
     de forma continua aunque el navegador no haya lanzado el evento 'online' y
     aunque `navigator.onLine` sea poco fiable. El propio fetch (con timeout)
     detectará si realmente hay conexión y reintentará hasta completar. */
  setInterval(function () {
    if (cloudSyncing) return;
    if (!hasPendingSync()) return;
    if (navigator.onLine === false) return; /* si el navegador dice offline, esperar */
    var pending = localStorage.getItem(PENDING_SYNC_KEY);
    if (pending) syncToCloud(pending);
  }, 15000);

  /* Al cerrar la pestaña o pasar a segundo plano: no perder cambios pendientes */
  function flushBeforeUnload() {
    if (!hasPendingSync()) return;
    if (!navigator.onLine) return;
    var pending = localStorage.getItem(PENDING_SYNC_KEY);
    if (!pending || !navigator.sendBeacon) return;
    try {
      navigator.sendBeacon(getCloudUrl(), JSON.stringify({
        content: pending,
        message: 'Admin update (cierre de pestaña ' + new Date().toLocaleString() + ')'
      }));
    } catch (e) {}
  }
  window.addEventListener('beforeunload', flushBeforeUnload);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') flushBeforeUnload();
  });

  function forceSyncNow() {
    cloudSyncing = false;
    cloudSyncRetries = 0;
    clearTimeout(cloudSyncTimer);
    autoSave();
    toast('Sincronizando con GitHub...');
  }

  function testCloudConnection() {
    var syncBadge = document.querySelector('.admin-cloud-sync');
    if (!syncBadge) {
      syncBadge = document.createElement('div');
      syncBadge.className = 'admin-ui admin-cloud-sync';
      document.body.appendChild(syncBadge);
    }
    syncBadge.innerHTML = '<span class="admin-cloud-icon">⟳</span> Verificando conexión...';
    syncBadge.classList.add('is-visible');
    syncBadge.classList.remove('is-error', 'is-ok');

    var controller = null;
    if (window.AbortController) controller = new AbortController();
    var timeoutId = null;
    if (controller) timeoutId = setTimeout(function () { controller.abort(); }, 12000);

    fetch(getCloudUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true, message: 'Test connection' }),
      signal: controller ? controller.signal : undefined
    })
      .then(function (res) { if (timeoutId) clearTimeout(timeoutId); return res.json(); })
      .then(function (r) {
        if (timeoutId) clearTimeout(timeoutId);
        if (r.ok && r.test) {
          syncBadge.innerHTML = '<span class="admin-cloud-icon">✓</span> Conexión OK — GitHub sync activo';
          syncBadge.classList.add('is-ok');
        } else {
          throw new Error(r.error || 'Sin token');
        }
      })
      .catch(function (err) {
        if (timeoutId) clearTimeout(timeoutId);
        syncBadge.innerHTML = '<span class="admin-cloud-icon">✗</span> Sin conexión o error. Los cambios siguen guardados localmente.';
        syncBadge.classList.add('is-error');
      });
    setTimeout(function () { syncBadge.classList.remove('is-visible', 'is-ok', 'is-error'); }, 5000);
  }

  function loadAutoSave() {
    try {
      var raw = localStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return null;
      return parseWrapped(raw);
    } catch (e) { return null; }
  }

  function dedup(arr, key) {
    var seen = {};
    return arr.filter(function (item) {
      var k = typeof key === 'function' ? key(item) : item[key];
      if (seen[k]) return false;
      seen[k] = true;
      return true;
    });
  }

  function serialize() {
    var editorStyles = {};
    qa('[data-editor-id]').forEach(function (el) {
      editorStyles[el.dataset.editorId] = el.style.cssText;
    });
    var out = {
      version: 2,
      usernameHash: content.usernameHash || null,
      passwordHash: content.passwordHash || null,
      texts: dedup(content.texts, 'sel'),
      images: dedup(content.images, 'sel'),
      addCards: content.addCards.map(function (c) {
        return { id: c.id, container: c.container, img: c.img, title: c.title, desc: c.desc };
      }),
      addTexts: content.addTexts.map(function (t) {
        return { id: t.id, container: t.container, html: t.html };
      }),
      addTitles: content.addTitles.map(function (t) {
        return { id: t.id, container: t.container, html: t.html };
      }),
      addPhotos: content.addPhotos.map(function (p) {
        return { id: p.id, container: p.container, src: p.src };
      }),
      deleteCards: content.deleteCards,
      deleteTexts: content.deleteTexts,
      seasonCovers: content.seasonCovers || {},
      photoSettings: content.photoSettings || {},
      editorStyles: editorStyles
    };
    return JSON.stringify(out, null, 2);
  }

  function downloadJson() {
    var text = 'window.ADMIN_CONTENT = ' + serialize() + ';';
    var blob = new Blob([text], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'admin-content.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
    toast('Descargado: admin-content.json. Reemplaza el archivo en la carpeta del sitio.');
  }

  function saveToDisk() {
    if (window.showSaveFilePicker) {
      showSaveFilePicker({
        suggestedName: 'admin-content.json',
        types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
      }).then(function (handle) {
        return handle.createWritable().then(function (w) {
          return w.write('window.ADMIN_CONTENT = ' + serialize() + ';').then(function () { return w.close(); });
        });
      }).then(function () {
        toast('Guardado en admin-content.json.');
      }).catch(function (e) {
        if (e && e.name === 'AbortError') return;
        downloadJson();
      });
    } else {
      downloadJson();
    }
  }

  function loadFromFile(file) {
    if (!file) return;
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var text = rd.result;
        var obj = parseWrapped(text);
        applyData(obj);
        toast('Contenido cargado y aplicado.');
      } catch (e) {
        toast('No se pudo leer el JSON: ' + e.message);
      }
    };
    rd.readAsText(file);
  }

  function parseWrapped(text) {
    var t = String(text).trim();
    var json = t;
    var m = t.match(/^\s*window\.ADMIN_CONTENT\s*=\s*/);
    if (m) {
      json = t.slice(m[0].length).replace(/;\s*$/, '');
    }
    return JSON.parse(json);
  }

  function applyData(obj) {
    content.texts = obj.texts || [];
    content.images = obj.images || [];
    content.addCards = (obj.addCards || []).map(function (c) { c._type = 'card'; return c; });
    content.addTexts = (obj.addTexts || []).map(function (t) { t._type = 'text'; return t; });
    content.addTitles = (obj.addTitles || []).map(function (t) { t._type = 'title'; return t; });
    content.addPhotos = (obj.addPhotos || []).map(function (p) { p._type = 'photo'; return p; });
    content.deleteCards = obj.deleteCards || [];
    content.deleteTexts = obj.deleteTexts || [];
    if (obj.passwordHash) content.passwordHash = obj.passwordHash;
    if (obj.usernameHash) content.usernameHash = obj.usernameHash;
    content.seasonCovers = obj.seasonCovers || {};
    content.photoSettings = obj.photoSettings || {};
    content.editorStyles = obj.editorStyles || {};
    applyContent();
    applySeasonCovers();
  }

  function changePassword() {
    var box = openModal(
      '<h3>Cambiar acceso</h3>' +
      '<label class="admin-field">Contraseña actual</label>' +
      '<input type="password" class="admin-input" data-role="old">' +
      '<label class="admin-field">Nuevo usuario</label>' +
      '<input type="text" class="admin-input" data-role="user" placeholder="Ana Avila">' +
      '<label class="admin-field">Nueva contraseña</label>' +
      '<input type="password" class="admin-input" data-role="new">' +
      '<div class="admin-modal-actions">' +
      '<button type="button" class="admin-btn admin-btn-primary" data-role="ok">Guardar</button>' +
      '<button type="button" class="admin-btn" data-role="cancel">Cancelar</button>' +
      '</div>'
    );
    box.querySelector('[data-role="ok"]').addEventListener('click', function () {
      var expected = content.passwordHash || hash(DEFAULT_PASSWORD);
      if (hash(box.querySelector('[data-role="old"]').value) !== expected) {
        toast('Contraseña actual incorrecta.');
        return;
      }
      var nu = box.querySelector('[data-role="user"]').value.trim();
      var nw = box.querySelector('[data-role="new"]').value;
      if (!nu) { toast('Escribe un usuario.'); return; }
      if (nw.length < 5) { toast('La contraseña nueva debe tener al menos 5 caracteres.'); return; }
      content.usernameHash = hash(nu);
      content.passwordHash = hash(nw);
      closeModal();
      autoSave();
      toast('Acceso actualizado.');
    });
    box.querySelector('[data-role="cancel"]').addEventListener('click', function () { closeModal(box); });
  }

  function togglePanel() {
    if (editMode) disableEditMode();
    else enableEditMode();
  }

  /* ---------- recomprimir fotos viejas grandes ---------- */

  function isBigBase64(s) {
    /* marca imágenes que excedan el objetivo de peso para re-comprimir */
    return s && s.indexOf('data:image') === 0 && s.length > (MAX_IMG_BYTES * 4 / 3);
  }

  function reCompressOld() {
    var changed = false;
    var processed = 0;
    var total = 0;
    Object.keys(content.seasonCovers || {}).forEach(function (k) { if (isBigBase64(content.seasonCovers[k])) total++; });
    content.images.forEach(function (im) { if (isBigBase64(im.src)) total++; });
    content.addCards.forEach(function (c) { if (isBigBase64(c.img)) total++; });

    function finishOne() {
      processed++;
      if (processed >= total) {
        if (changed) toast('Fotos antiguas comprimidas para liberar espacio.');
      }
    }
    function runCompress(current, assign) {
      compressImage(current, null, null).then(function (c) {
        if (c !== current) { assign(c); autoSave(); changed = true; }
        finishOne();
      });
    }

    Object.keys(content.seasonCovers || {}).forEach(function (k) {
      var v = content.seasonCovers[k];
      if (isBigBase64(v)) {
        runCompress(v, function (c) { content.seasonCovers[k] = c; });
      }
    });
    content.images.forEach(function (im) {
      if (isBigBase64(im.src)) {
        runCompress(im.src, function (c) { im.src = c; });
      }
    });
    content.addCards.forEach(function (c) {
      if (isBigBase64(c.img)) {
        runCompress(c.img, function (cc) { c.img = cc; });
      }
    });
    if (total === 0 && changed) toast('Fotos antiguas comprimidas para liberar espacio.');
  }

  /* ---------- iniciar ---------- */

  var GITHUB_REPO = 'avilamateito818-sudo/EL-BODEGON-DELOS-TRAJES-20262';
  var GITHUB_CONTENT_PATH = 'sitio/data/admin-content.js';
  var GITHUB_API = 'https://api.github.com/repos/' + GITHUB_REPO + '/contents/' + GITHUB_CONTENT_PATH;

  function fetchFromGitHub(callback) {
    fetch(GITHUB_API)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.content) throw new Error('No content');
        var decoded = decodeURIComponent(escape(atob(data.content.replace(/\s/g, ''))));
        var obj = parseWrapped(decoded);
        if (obj && obj.version) callback(obj);
      })
      .catch(function () {
        var bust = '?t=' + Date.now();
        fetch('https://raw.githubusercontent.com/' + GITHUB_REPO + '/main/' + GITHUB_CONTENT_PATH + bust)
          .then(function (res) { return res.ok ? res.text() : ''; })
          .then(function (text) {
            if (!text) return;
            var obj = parseWrapped(text);
            if (obj && obj.version) callback(obj);
          })
          .catch(function () {});
      });
  }

  function init() {
    var base = null;
    if (window.ADMIN_CONTENT) {
      try {
        base = JSON.parse(JSON.stringify(window.ADMIN_CONTENT));
      } catch (e) {}
    }
    var saved = loadAutoSave();
    if (saved) {
      try {
        base = mergeData(base || {}, saved);
      } catch (e) {}
    }
    if (base) {
      try { applyData(base); } catch (e) {}
    }

    fetchFromGitHub(function (remoteData) {
      var remoteBase = null;
      if (base) {
        try { remoteBase = mergeData(base, remoteData); } catch (e) { remoteBase = remoteData; }
      } else {
        remoteBase = remoteData;
      }
      if (remoteBase) {
        try {
          applyData(remoteBase);
          applySeasonCovers();
        } catch (e) {}
      }
      try {
        var remoteSerial = JSON.stringify(remoteBase);
        var localRaw = localStorage.getItem(AUTOSAVE_KEY);
        if (localRaw && localRaw !== remoteSerial) {
          /* Hay contenido local que difiere del remoto: respáldalo ANTES de
             sobrescribir, así el trabajo del administrador nunca se pierde. */
          try {
            var localObj = parseWrapped(localRaw);
            if (localObj && localObj.version) {
              backupNow('autosave-local-diferente-al-cargar', localRaw);
            }
          } catch (e) {}
        }
        if (!localRaw || localRaw !== remoteSerial) {
          localStorage.setItem(AUTOSAVE_KEY, remoteSerial);
        }
      } catch (e) {}
    });

    buildFab();
    reCompressOld();

    setTimeout(applySeasonCovers, 150);

    try {
      if (localStorage.getItem(SESSION_KEY)) {
        authed = true;
        enableEditMode();
        updateFabState();
      }
    } catch (e) {}

    document.addEventListener('click', function (e) {
      var img = e.target.closest ? e.target.closest('img') : null;
      if (!img || !editMode) return;
      if (img.closest('.admin-ui')) return;
      e.stopPropagation();
      e.preventDefault();
      editImage(img);
    }, true);

    setTimeout(retryPendingSyncs, 1000);
  }

  function mergeData(base, override) {
    var result = JSON.parse(JSON.stringify(base));
    if (override.texts !== undefined) result.texts = override.texts;
    if (override.images !== undefined) result.images = override.images;
    if (override.addCards !== undefined) result.addCards = override.addCards;
    if (override.addTexts !== undefined) result.addTexts = override.addTexts;
    if (override.addTitles !== undefined) result.addTitles = override.addTitles;
    if (override.addPhotos !== undefined) result.addPhotos = override.addPhotos;
    if (override.deleteCards !== undefined) result.deleteCards = override.deleteCards;
    if (override.deleteTexts !== undefined) result.deleteTexts = override.deleteTexts;
    if (override.seasonCovers !== undefined) result.seasonCovers = override.seasonCovers;
    if (override.photoSettings !== undefined) result.photoSettings = override.photoSettings;
    if (override.editorStyles !== undefined) result.editorStyles = override.editorStyles;
    if (override.passwordHash) result.passwordHash = override.passwordHash;
    if (override.usernameHash) result.usernameHash = override.usernameHash;
    return result;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
