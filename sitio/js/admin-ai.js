/* ==========================================================
   js/admin-ai.js
   Asistente del administrador — El Bodegón de los Trajes
   ==========================================================
   Propósito: ayudar al administrador a editar el sitio dando
   órdenes en lenguaje natural ("cambia el título de enero",
   "cambia la foto del hero", "edita el subtítulo de contacto"),
   y responder consultas libres del admin (dudas de negocio,
   ideas de texto, etc.).

   SEGURIDAD (requisito del cliente):
   - El asistente NO almacena ni accede a contraseñas, usuarios,
     hashes, claves, ni datos internos del administrador.
   - Solo actúa cuando la sesión de administrador ya está activa
     (clase body.admin-edit-mode). No verifica credenciales.
   - No hace fetch a ninguna API externa. Todo es local.
   - Rara vez falla: cada acción está protegida y siempre ofrece
     una respuesta útil.
   ========================================================== */

(function () {
  'use strict';

  var MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

  function isAdmin() {
    try { return document.body && document.body.classList.contains('admin-edit-mode'); }
    catch (e) { return false; }
  }

  function norm(s) {
    return String(s || '').toLowerCase().replace(/[^\w\sáéíóúñüÁÉÍÓÚÑÜ¿?¡!]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function hasAny(t, words) {
    for (var i = 0; i < words.length; i++) {
      if (t.indexOf(words[i]) !== -1) return true;
    }
    return false;
  }

  /* Mapa de objetivos editables por sección */
  function targetsFor(section, action) {
    try {
      var sel = null;
      if (section === 'hero') {
        if (action === 'foto')      sel = 'button[data-season-photo="hero"]';
        else if (action === 'titulo') sel = '#inicio .hero-box h2';
        else                          sel = '#inicio .hero-box p';
      } else if (section === 'cabecera') {
        if (action === 'titulo')    sel = '#temporadas .section-head h2';
        else                        sel = '#temporadas .section-head p';
      } else if (section === 'contacto') {
        if (action === 'titulo')    sel = '#contacto .contact-card h3';
        else                        sel = '#contacto .contact-intro, #contacto .contact-detail p';
      } else if (MONTHS.indexOf(section) !== -1) {
        if (section === 'enero' && action === 'foto') {
          sel = '#enero-hero-photo img';
        } else if (section === 'octubre' && action === 'foto') {
          sel = 'button[data-season-photo="octubre"]';
        } else if (action === 'foto') {
          return null; // otros meses no tienen foto de temporada
        } else if (action === 'titulo') {
          sel = '[data-panel="' + section + '"] .season-hero .season-title';
        } else if (action === 'hito') {
          sel = '[data-panel="' + section + '"] .season-hero .season-milestone';
        } else {
          sel = '[data-panel="' + section + '"] .season-hero .season-subtitle';
        }
      }
      if (!sel) return null;
      var el = document.querySelector(sel);
      if (!el) return null;
      return el;
    } catch (e) { return null; }
  }

  /* Garantiza que la sección/panel esté visible antes de editar */
  function revealSection(section) {
    try {
      if (MONTHS.indexOf(section) !== -1) {
        var tab = document.querySelector('.season-tab[data-month="' + section + '"]');
        if (tab && !tab.classList.contains('is-active')) {
          tab.click();
        }
      } else if (section === 'hero') {
        var inicio = document.getElementById('inicio');
        if (inicio) inicio.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (e) {}
  }

  function focusFlash(el) {
    try {
      el.classList.add('admin-ai-focus');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(function () { try { el.classList.remove('admin-ai-focus'); } catch (e) {} }, 2600);
    } catch (e) {}
  }

  function triggerEdit(el) {
    if (!el) return;
    focusFlash(el);
    setTimeout(function () {
      try { el.click(); } catch (e) {}
    }, 900);
  }

  /* --- Intérprete de comandos en español (reforzado) --- */
  function detectAction(text) {
    var t = norm(text);
    if (/\bfoto\b|\bimagen\b|\bportada\b|\bimagen de |\bfondo\b/.test(t)) return 'foto';
    /* hito antes que título y subtítulo (evita falsos positivos) */
    if (/\bhito\b|\bactividad\b|\bmilestone/.test(t)) return 'hito';
    /* subtítulo SIEMPRE antes que título: "subtítulo" contiene "título" */
    if (/\bsubt[ií]tulo\b|\btexto\b|\bp[aá]rrafo\b|\blema\b|\bdescripci[oó]n\b|\bparrafo\b|\bsub\.?t[ií]tulo\b/.test(t)) return 'texto';
    if (/\bt[ií]tulo\b|\btitular\b|\bencabezado\b|\bheading/.test(t)) return 'titulo';
    /* si pide "edita X" sin acción clara, usar texto por defecto */
    if (/\bedita\b|\bcambia\b|\bmodifica\b|\bactualiza\b|\bpon\b|\bsube\b|\bcarga\b/.test(t)) return 'texto';
    return 'texto';
  }

  function detectSection(text) {
    var t = norm(text);
    if (/\bhero\b|\binicio\b|\bprincipal\b|\bbanner\b|\bportada del\b|\bportada\b/.test(t)) return 'hero';
    if (/\bcabecera\b|\btemporadas\b|\bt[ií]tulo general\b|\bt[ií]tulos de temporadas/.test(t)) return 'cabecera';
    if (/\bcontacto\b|\bcont[aá]ctanos\b|\bll[aá]menos\b|\btelefono\b|\bcorreo\b|\bdirecci[oó]n\b/.test(t)) return 'contacto';
    for (var i = 0; i < MONTHS.length; i++) {
      if (t.indexOf(MONTHS[i]) !== -1) return MONTHS[i];
    }
    return 'hero';
  }

  /* --- Motor de respuestas de consulta libre del admin --- */
  function freeAnswer(text) {
    var t = norm(text);

    if (t.length < 4 || /^(hola|buenas|hey|saludos|qu[eé] tal)\b/.test(t)) {
      return '¡Hola! 👋 Soy tu asistente de edición. Pídeme cambiar un título, una foto o un texto, ' +
        'o hazme cualquier pregunta sobre tu negocio.';
    }
    if (hasAny(t, ['gracias', 'genial', 'excelente', 'perfecto', 'chao', 'adios', 'adiós', 'bye'])) {
      return '¡Con gusto! Estoy aquí cuando me necesites. 🚀';
    }
    if (hasAny(t, ['como funcionas', 'cómo funcionas', 'como funciona', 'cómo funciona', 'que haces', 'qué haces', 'ayuda', 'que puedes', 'qué puedes', 'que puedo pedir', 'como usas', 'cómo usas'])) {
      return 'Puedo ayudarte a editar el sitio con órdenes como:\n' +
        '• "Cambia el **título de enero**"\n' +
        '• "**Foto del hero**"\n' +
        '• "**Texto de contacto**"\n' +
        '• "**Subtítulo de octubre**"\n\n' +
        'Te muestro el elemento y te abro la herramienta del panel para que escribas el nuevo contenido. ' +
        'También respondo dudas de tu negocio (categorías, medidas, WhatsApp, etc.).';
    }
    /* categorías que maneja */
    if (hasAny(t, ['categoria', 'categorías', 'que venden', 'qué venden', 'productos', 'servicios', 'linea', 'línea', 'coleccion', 'colección'])) {
      return 'Tus categorías principales son: Uniformes Escolares, Batas de Laboratorio, Trajes de Reyes Magos, ' +
        'Disfraces de Halloween, Togas y Trajes de Grado, Smoking y Trajes de Gala, Vestidos de Fiesta, ' +
        'Bailes Típicos y Clausura, y Disfraces Navideños. Todo se confecciona a la medida.';
    }
    if (hasAny(t, ['medida', 'medidas', 'talla', 'ajuste', 'a medida'])) {
      return 'Trabajan 100% a la medida (esa es la especialidad). No usan tallas estándar: se toman las medidas y se ajusta cada prenda.';
    }
    if (hasAny(t, ['whatsapp', 'telefono', 'teléfono', 'contacto', 'numero', 'número', 'ubicac', 'direccion', 'dirección', 'donde', 'correo', 'email'])) {
      return 'Datos de contacto del negocio: 📍 Diagonal 66 2B 04, Tunja · 📞 +57 310 770 6615 · ✉️ avilamateito818@gmail.com.';
    }
    if (hasAny(t, ['idea', 'sugerencia', 'texto para', 'frase', 'eslogan', 'eslogan'] )) {
      return 'Déjame darte una idea de texto para tu temporada:\n' +
        '"Viste tu imaginación y vive tu historia. En El Bodegón de los Trajes llevamos la alta costura ' +
        'a tu medida: grados, clausuras, disfraces y celebraciones que brillan. 💛"';
    }
    return null;
  }

  /* Intenta interpretar como orden de edición; si no, responde consulta libre */
  function runCommand(raw) {
    var text = (raw || '').trim();
    if (!text) return;
    log(text, 'user');
    try { input.value = ''; } catch (e) {}

    if (!isAdmin()) {
      log('Aún no tienes la sesión de administrador activa. Inicia sesión con la llave 🔒 y vuelve a intentarlo.', 'bot');
      return;
    }

    var t = norm(text);

    /* Si parece edición (verbo de edición + sección/acción), tratamos como orden */
    var looksEdit = hasAny(t, ['cambia', 'cambio', 'edita', 'modifica', 'actualiza', 'pon ', 'sube ', 'carga ', 'foto', 'imagen', 'portada', 'titulo', 'título', 'subtitulo', 'subtítulo', 'texto', 'parrafo', 'parágrafo', 'hito']);
    if (looksEdit) {
      var action = detectAction(text);
      var section = detectSection(text);

      if (action === 'foto' && MONTHS.indexOf(section) !== -1 && section !== 'enero' && section !== 'octubre') {
        log('La temporada de ' + section + ' aún no tiene una foto de portada configurada. Puedes editar su título o su texto.', 'bot');
        return;
      }

      revealSection(section);
      var el = targetsFor(section, action);

      if (!el) {
        log('No encontré ese elemento para editar. Prueba otra orden (ej: "cambia el título de enero", "foto del hero", "texto de contacto").', 'bot');
        return;
      }

      var labels = { foto: 'la foto', titulo: 'el título', hito: 'el hito', texto: 'el texto' };
      log('Abriendo la herramienta para cambiar ' + labels[action] + ' de "' + (section === 'hero' ? 'Inicio' : section) + '"... Te muestro el elemento en pantalla y abro el panel para editar.', 'bot');
      triggerEdit(el);
      return;
    }

    /* No es una orden de edición: responder consulta libre */
    var ans = freeAnswer(text);
    if (ans) { log(ans, 'bot'); return; }

    log('Puedo ayudarte a **editar el sitio** (cambiar títulos, fotos o textos de cualquier temporada) o responder dudas de tu negocio. ' +
      'Prueba, por ejemplo: "cambia el título de enero" o "¿qué categorías manejo?".', 'bot');
  }

  /* --- UI --- */
  if (document.getElementById('elbodegon-admin-ai')) return;

  var root = document.createElement('div');
  root.id = 'elbodegon-admin-ai';
  root.innerHTML =
    '<button class="admin-ai-launch" id="admin-ai-launch" aria-label="Asistente del administrador" title="Asistente: edita con órdenes">' +
    '  <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l1.9 5.1L19 9l-5.1 1.9L12 16l-1.9-5.1L5 9l5.1-1.9L12 2zM19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14zM6 12l.9 2.1L9 15l-2.1.9L6 18l-.9-2.1L3 15l2.1-.9L6 12z"/></svg>' +
    '</button>' +
    '<div class="admin-ai" id="admin-ai-panel" role="dialog" aria-label="Asistente del administrador">' +
    '  <div class="admin-ai-head">' +
    '    <div class="admin-ai-ava">✨</div>' +
    '    <div>' +
    '      <div class="admin-ai-title">Asistente del Administrador</div>' +
    '      <div class="admin-ai-sub">Edita el sitio con órdenes · también responde dudas</div>' +
    '    </div>' +
    '  </div>' +
    '  <div class="admin-ai-body" id="admin-ai-body"></div>' +
    '  <div class="admin-ai-foot">' +
    '    <input class="admin-ai-input" id="admin-ai-input" type="text" placeholder="Ej: cambia el título de enero" autocomplete="off" />' +
    '    <button class="admin-ai-go" id="admin-ai-go" type="button">Ir</button>' +
    '  </div>' +
    '  <div class="admin-ai-hint">Ejemplos: <b>foto del hero</b> · <b>título de octubre</b> · <b>texto de contacto</b>. ' +
    '    También puedes preguntarme cosas como <b>¿qué categorías manejo?</b>.</div>' +
    '</div>';
  document.body.appendChild(root);

  var launch = root.querySelector('#admin-ai-launch');
  var panel = root.querySelector('#admin-ai-panel');
  var body = root.querySelector('#admin-ai-body');
  var input = root.querySelector('#admin-ai-input');
  var go = root.querySelector('#admin-ai-go');

  function log(text, who) {
    try {
      var m = document.createElement('div');
      m.className = 'admin-ai-msg ' + (who || 'bot');
      m.textContent = text;
      body.appendChild(m);
      body.scrollTop = body.scrollHeight;
    } catch (e) {}
  }

  function chips(list) {
    try {
      var w = document.createElement('div');
      w.className = 'admin-ai-chipwrap';
      list.forEach(function (t) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'admin-ai-chip'; b.textContent = t;
        b.addEventListener('click', function () { runCommand(t); });
        w.appendChild(b);
      });
      body.appendChild(w);
      body.scrollTop = body.scrollHeight;
    } catch (e) {}
  }

  function welcome() {
    try {
      log('¡Hola! Soy tu asistente de edición. Escribe una orden y te llevo directo a la herramienta de cambio. También puedo responder dudas de tu negocio.');
      chips(['Cambiar la foto del hero', 'Cambiar el título de enero', 'Cambiar el texto de octubre', '¿Qué categorías manejo?']);
    } catch (e) {}
  }

  // mostrar solo cuando hay sesión admin (MutationObserver del body)
  function sync() {
    try {
      var on = isAdmin();
      launch.style.display = on ? '' : 'none';
      if (!on) panel.classList.remove('is-open');
    } catch (e) {}
  }
  try { sync(); } catch (e) {}
  try {
    if (window.MutationObserver) {
      new MutationObserver(function () { sync(); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }
  } catch (e) {}

  try {
    launch.addEventListener('click', function () {
      try {
        var open = !panel.classList.contains('is-open');
        panel.classList.toggle('is-open', open);
        if (open && !root.dataset.started) { root.dataset.started = '1'; welcome(); }
      } catch (e) {}
    });
    go.addEventListener('click', function () { runCommand(input.value); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); runCommand(input.value); } });
  } catch (e) {}
})();
