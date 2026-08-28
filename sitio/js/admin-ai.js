/* ==========================================================
   js/admin-ai.js
   Asistente del administrador — El Bodegón de los Trajes
   ==========================================================
   Propósito: ayudar al administrador a editar el sitio dando
   órdenes en lenguaje natural ("cambia el título de enero",
   "cambia la foto del hero", "edita el subtítulo de contacto").

   SEGURIDAD (requisito del cliente):
   - El asistente NO almacena ni accede a contraseñas, usuarios,
     hashes, claves, ni datos internos del administrador.
   - Solo actúa cuando la sesión de administrador ya está activa
     (clase body.admin-edit-mode). No verifica credenciales.
   - No hace fetch a ninguna API externa. Todo es local.
   - No edita nada por su cuenta: localiza el elemento editable y
     dispara la herramienta de edición NATIVA del panel (editText /
     editImage), que solo funciona con sesión de administrador.
   ========================================================== */

(function () {
  'use strict';

  var MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

  function isAdmin() {
    return document.body && document.body.classList.contains('admin-edit-mode');
  }

  /* Mapa de objetivos editables por sección */
  function targetsFor(section, action) {
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
  }

  /* Garantiza que la sección/panel esté visible antes de editar */
  function revealSection(section) {
    if (MONTHS.indexOf(section) !== -1) {
      var tab = document.querySelector('.season-tab[data-month="' + section + '"]');
      if (tab && !tab.classList.contains('is-active')) {
        tab.click();
      }
    } else if (section === 'hero') {
      var inicio = document.getElementById('inicio');
      if (inicio) inicio.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function focusFlash(el) {
    el.classList.add('admin-ai-focus');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(function () { el.classList.remove('admin-ai-focus'); }, 2600);
  }

  function triggerEdit(el) {
    focusFlash(el);
    setTimeout(function () {
      try { el.click(); } catch (e) {}
    }, 900);
  }

  /* --- Intérprete de comandos en español --- */
  function detectAction(text) {
    var t = text.toLowerCase();
    if (/\bfoto\b|\bimagen\b|\bportada\b/.test(t)) return 'foto';
    if (/\bt[ií]tulo\b|\btitular\b|\bencabezado\b/.test(t)) return 'titulo';
    if (/\bhito\b/.test(t)) return 'hito';
    if (/\bsubt[ií]tulo\b|\btexto\b|\bp[aá]rrafo\b|\blema\b|\bdescripci[oó]n\b|\bedita/.test(t)) return 'texto';
    return 'texto';
  }

  function detectSection(text) {
    var t = text.toLowerCase();
    if (/\bhero\b|\binicio\b|\bprincipal\b|\bportada del\b|\bbanner\b/.test(t)) return 'hero';
    if (/\bcabecera\b|\btemporadas\b|\bt[ií]tulo general\b/.test(t)) return 'cabecera';
    if (/\bcontacto\b|\bcont[aá]ctanos\b|\bll[aá]menos\b/.test(t)) return 'contacto';
    for (var i = 0; i < MONTHS.length; i++) {
      if (t.indexOf(MONTHS[i]) !== -1) return MONTHS[i];
    }
    return 'hero';
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
    '      <div class="admin-ai-sub">Dame una orden y abro la herramienta de edición</div>' +
    '    </div>' +
    '  </div>' +
    '  <div class="admin-ai-body" id="admin-ai-body"></div>' +
    '  <div class="admin-ai-foot">' +
    '    <input class="admin-ai-input" id="admin-ai-input" type="text" placeholder="Ej: cambia el título de enero" autocomplete="off" />' +
    '    <button class="admin-ai-go" id="admin-ai-go" type="button">Ir</button>' +
    '  </div>' +
    '  <div class="admin-ai-hint">Ejemplos: <b>foto del hero</b> · <b>título de octubre</b> · <b>texto de contacto</b>. ' +
    '    Te abriré la herramienta del panel para que escribas o subas el nuevo contenido.</div>' +
    '</div>';
  document.body.appendChild(root);

  var launch = root.querySelector('#admin-ai-launch');
  var panel = root.querySelector('#admin-ai-panel');
  var body = root.querySelector('#admin-ai-body');
  var input = root.querySelector('#admin-ai-input');
  var go = root.querySelector('#admin-ai-go');

  function log(text, who) {
    var m = document.createElement('div');
    m.className = 'admin-ai-msg ' + (who || 'bot');
    m.textContent = text;
    body.appendChild(m);
    body.scrollTop = body.scrollHeight;
  }

  function chips(list) {
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
  }

  function welcome() {
    log('¡Hola! Soy tu asistente de edición. Puedes escribir una orden y te llevo directo a la herramienta de cambio.');
    chips(['Cambiar la foto del hero', 'Cambiar el título de enero', 'Cambiar el texto de octubre', 'Cambiar el título de contacto']);
  }

  function runCommand(raw) {
    var text = (raw || '').trim();
    if (!text) return;
    log(text, 'user');
    input.value = '';

    if (!isAdmin()) {
      log('Aún no tienes la sesión de administrador activa. Inicia sesión con la llave 🔒 y vuelve a intentarlo.', 'bot');
      return;
    }

    var action = detectAction(text);
    var section = detectSection(text);

    if (action === 'foto' && MONTHS.indexOf(section) !== -1 && section !== 'enero' && section !== 'octubre') {
      log('La temporada de ' + section + ' aún no tiene una foto de portada configurada. Puedes editar su título o texto.', 'bot');
      return;
    }

    revealSection(section);
    var el = targetsFor(section, action);

    if (!el) {
      log('No encontré ese elemento para editar. Prueba otra orden (ej: "cambia el título de enero", "foto del hero").', 'bot');
      return;
    }

    var labels = { foto: 'la foto', titulo: 'el título', hito: 'el hito', texto: 'el texto' };
    log('Abriendo la herramienta para cambiar ' + labels[action] + ' de "' + (section === 'hero' ? 'Inicio' : section) + '"... Te muestro el elemento y abro el panel para editar.', 'bot');
    triggerEdit(el);
  }

  // mostrar solo cuando hay sesión admin (MutationObserver del body)
  function sync() {
    var on = isAdmin();
    launch.style.display = on ? '' : 'none';
    if (!on) panel.classList.remove('is-open');
  }
  sync();
  if (window.MutationObserver) {
    new MutationObserver(function () { sync(); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  launch.addEventListener('click', function () {
    var open = !panel.classList.contains('is-open');
    panel.classList.toggle('is-open', open);
    if (open && !root.dataset.started) { root.dataset.started = '1'; welcome(); }
  });
  go.addEventListener('click', function () { runCommand(input.value); });
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); runCommand(input.value); } });
})();
