/* ==========================================================
   js/chat.js
   Bot de ayuda — El Bodegón de los Trajes
   ==========================================================
   SEGURIDAD:
   - El bot SOLO ofrece categorías públicas (lista cerrada dura).
   - NO lee ni expone: usuarios, contraseñas, hashes, claves de API,
     window.ADMIN_CONTENT, EMAIL_CONFIG ni configuración interna.
   - Envía al backend únicamente: { categoria, nombre, whatsapp }.
   - Si no hay backend disponible responde de forma neutral sin
     revelar detalles internos ni técnicos.
   ========================================================== */

(function () {
  'use strict';

  if (document.getElementById('elbodegon-chat-root')) return;

  var CATEGORIES = [
    'Uniformes Escolares',
    'Batas de Laboratorio',
    'Trajes de Reyes Magos',
    'Disfraces de Halloween',
    'Togas y Trajes de Grado',
    'Smoking y Trajes de Gala',
    'Vestidos de Fiesta',
    'Bailes Típicos y Clausura',
    'Disfraces Navideños'
  ];

  var API = '/api/chat-ask';

  var root = document.createElement('div');
  root.id = 'elbodegon-chat-root';

  root.innerHTML =
    '<button class="chat-fab" id="chat-fab" aria-label="Abrir asistente" title="Pregúntanos">' +
    '  <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 3C6.5 3 2 6.9 2 11.7c0 2.7 1.4 5.1 3.7 6.7-.2 1.3-.8 2.6-1.7 3.6.6 0 1.8-.1 2.7-.6 1.6.7 3.4 1 5.3 1 5.5 0 10-3.9 10-8.7S17.5 3 12 3z"/><circle cx="8" cy="11" r="1"/><circle cx="12" cy="11" r="1"/><circle cx="16" cy="11" r="1"/></svg>' +
    '</button>' +
    '<div class="chat-window" id="chat-window" role="dialog" aria-label="Asistente de El Bodegón">' +
    '  <div class="chat-head">' +
    '    <div class="chat-ava">B</div>' +
    '    <div>' +
    '      <div class="chat-head-title">Asistente El Bodegón</div>' +
    '      <div class="chat-head-sub"><span class="chat-head-status"></span>En línea</div>' +
    '    </div>' +
    '  </div>' +
    '  <div class="chat-body" id="chat-body"></div>' +
    '  <div class="chat-foot">' +
    '    <input class="chat-input" id="chat-input" type="text" placeholder="Escribe tu respuesta..." autocomplete="off" />' +
    '    <button class="chat-send" id="chat-send" type="button">Enviar</button>' +
    '  </div>' +
    '  <div class="chat-legal">Este asistente es de <strong>El Bodegón de los Trajes</strong>. Tu información solo se usa para responder tu consulta y no se comparte.</div>' +
    '</div>';

  document.body.appendChild(root);

  var fab = root.querySelector('#chat-fab');
  var win = root.querySelector('#chat-window');
  var body = root.querySelector('#chat-body');
  var input = root.querySelector('#chat-input');
  var sendBtn = root.querySelector('#chat-send');

  var state = null; // null | {name, phone, category}

  function addMsg(text, who) {
    var m = document.createElement('div');
    m.className = 'chat-msg ' + (who || 'bot');
    m.textContent = text;
    body.appendChild(m);
    body.scrollTop = body.scrollHeight;
  }

  function addOpts(cats) {
    var wrap = document.createElement('div');
    wrap.className = 'chat-opts';
    cats.forEach(function (cat) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chat-opt';
      b.textContent = cat;
      b.addEventListener('click', function () { handleText(cat); });
      wrap.appendChild(b);
    });
    body.appendChild(wrap);
    body.scrollTop = body.scrollHeight;
  }

  function setEnabled(on) {
    input.disabled = !on;
    sendBtn.disabled = !on;
    input.setAttribute('aria-disabled', on ? 'false' : 'true');
  }

  function normalizePhone(raw) {
    var digits = (raw || '').replace(/\D/g, '');
    if (digits.length === 10) digits = '57' + digits;
    if (digits.length === 12 && digits.indexOf('57') === 0) return digits;
    return null;
  }

  function start() {
    state = { name: null, phone: null, category: null };
    setEnabled(false);
    addMsg('¡Hola! 👋 Soy el asistente de El Bodegón de los Trajes. Puedo ayudarte a confirmar la disponibilidad de una prenda, uniforme o disfraz.');
    setEnabled(true);
    addMsg('Para empezar, ¿me indicas tu nombre?');
    state.next = 'name';
  }

  function askCategory() {
    addMsg('Gracias. ¿Sobre cuál de estos te gustaría confirmar disponibilidad? Elige una opción:');
    addOpts(CATEGORIES);
    setEnabled(false);
  }

  function askPhone() {
    setEnabled(true);
    addMsg('Perfecto. Por último, ¿cuál es tu número de WhatsApp (10 dígitos, ej. 3107706615)? Ahí te confirmaremos la respuesta.');
    state.next = 'phone';
  }

  function sendToOwner() {
    setEnabled(false);
    addMsg('📩 Listo. Le avisamos al dueño sobre tu consulta. En cuanto nos confirme, te escribiremos por WhatsApp. ¡Gracias por tu paciencia!');

    var payload = {
      categoria: state.category,
      nombre: state.name,
      whatsapp: state.phone
    };

    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (res.ok) {
        addMsg('✅ Tu consulta fue enviada correctamente al equipo.');
      } else {
        addMsg('No pudimos completar el envío automático ahora. Escríbenos por WhatsApp y con gusto te atenderemos. 🙌');
      }
    }).catch(function () {
      addMsg('No pudimos completar el envío automático ahora. Escríbenos por WhatsApp y con gusto te atenderemos. 🙌');
    });
  }

  function handleText(val) {
    if (!val || !val.trim()) return;
    var text = val.trim();
    addMsg(text, 'user');
    input.value = '';

    if (!state) { start(); return; }

    if (state.next === 'name') {
      state.name = text;
      state.next = 'category';
      askCategory();
      return;
    }

    if (state.next === 'category') {
      state.category = text;
      state.next = 'phone';
      askPhone();
      return;
    }

    if (state.next === 'phone') {
      var p = normalizePhone(text);
      if (!p) {
        addMsg('Ese número no parece válido. Comprueba que sean 10 dígitos (ej. 3107706615).');
        return;
      }
      state.phone = p;
      state.next = null;
      sendToOwner();
      return;
    }
  }

  function toggle(open) {
    var isOpen = open !== undefined ? open : !win.classList.contains('is-open');
    win.classList.toggle('is-open', isOpen);
    fab.classList.toggle('is-open', isOpen);
    fab.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if (isOpen && !win.dataset.started) {
      win.dataset.started = '1';
      start();
    }
  }

  fab.addEventListener('click', function () { toggle(); });
  sendBtn.addEventListener('click', function () { handleText(input.value); });
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); handleText(input.value); } });
})();
