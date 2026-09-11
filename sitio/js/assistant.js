(function () {
  'use strict';

  var PHONE = '573107706615';
  var WA = 'https://wa.me/' + PHONE + '?text=';
  var EMAIL = 'elbodegondelostrajes@gmail.com';
  var API = '/api/chat-ask';

  var RULES = [
    {
      keys: ['precio', 'costar', 'cuesta', 'tarifa', 'valor', 'cuanto', 'costó', 'costo', 'presupuesto'],
      answer: [
        'Cada traje o disfraz se confecciona a la medida, así que el precio depende de la referencia, las telas y el diseño.',
        'Envíanos la referencia por WhatsApp y te cotizamos sin compromiso, o usa el formulario de contacto. 🪄'
      ].join('\n\n'),
      waText: 'Hola, quiero una cotización.'
    },
    {
      keys: ['dónde', 'donde', 'ubicación', 'ubicacion', 'dirección', 'direccion', 'llegar', 'tienda'],
      answer: 'Estamos en la Diagonal 66 2B 04, en Tunja, Boyacá. 📍\n\nEscríbenos si necesitas cómo llegar.',
      waText: 'Hola, ¿cómo llego a la tienda?'
    },
    {
      keys: ['horario', 'hora', 'abren', 'abierto', 'cierran', 'atención', 'atienden', 'abierto hasta'],
      answer: 'Por ahora la atención es vía WhatsApp o por el formulario; escríbenos y coordinamos el horario de tu visita. 🕗\n\n¡Te responderemos con la hora exacta en Tunja!',
      waText: 'Hola, ¿cuál es el horario de atención?'
    },
    {
      keys: ['whatapp', 'wassap', 'whatsapp', 'wasap', 'celular', 'telefono', 'teléfono', 'número', 'numero', 'contactar', 'llamar'],
      answer: 'Puedes escribirnos al WhatsApp +57 310 770 6615. 📞\n\nEl correo es ' + EMAIL + ' y también puedes usar el formulario de contacto.',
      waText: 'Hola, quiero comunicarme.'
    },
    {
      keys: ['correo', 'email', 'mail', 'gmail', 'contacto escrito'],
      answer: 'Nuestro correo es ' + EMAIL + '. 📧\n\nTambién puedes usar el formulario de contacto en esta página y te llegará directo al equipo.',
      waText: ''
    },
    {
      keys: ['medida', 'a la medida', 'personalizado', 'personalizada', 'diseño', 'diseño', 'sastre'],
      answer: 'Sí, todo se confecciona a la medida. 📏\n\nCuéntanos tu referencia, talla y estilo, y armamos el diseño para ti.',
      waText: 'Hola, quiero un diseño a la medida.'
    },
    {
      keys: ['uniforme', 'escolar', 'colegio', 'colegios'],
      answer: 'Hacemos uniformes escolares. 🎒\n\nMándanos la referencia (o foto del uniforme) por WhatsApp y te damos precio y tiempos.',
      waText: 'Hola, quiero cotizar uniformes escolares.'
    },
    {
      keys: ['bata', 'batas', 'medicina', 'salud', 'laboratorio'],
      answer: 'Confeccionamos batas (medicina, laboratorio y más). 👩‍⚕️\n\nEscríbenos la cantidad y el estilo que necesitas.',
      waText: 'Hola, quiero cotizar batas.'
    },
    {
      keys: ['disfraz', 'disfraces', 'halloween', 'fiesta', 'careta'],
      answer: 'Tenemos una colección exclusiva de disfraces, incluida la línea de Halloween. 🎃\n\nPuedes verla en la sección de temporadas y cotizar tu favorito por WhatsApp.',
      waText: 'Hola, quiero cotizar un disfraz.'
    },
    {
      keys: ['traje', 'tiempo', 'entrega', 'demora', 'cuando', 'listo', 'terminado'],
      answer: 'El tiempo de entrega depende del diseño y la tela. 📦\n\nMándanos la referencia y te confirmamos fechas exactas.',
      waText: 'Hola, quiero saber los tiempos de entrega.'
    },
    {
      keys: ['pago', 'formas de pago', 'efectivo', 'transferencia', 'nequi', 'paga', 'credito', 'crédito'],
      answer: 'Por lo general se coordina el pago directamente: efectivo, transferencia o Nequi. 💳\n\nEscríbenos por WhatsApp y te confirmamos las opciones.',
      waText: 'Hola, ¿qué formas de pago tienen?'
    },
    {
      keys: ['envio', 'envío', 'envian', 'enviamos', 'domicilio', 'a otra ciudad', 'fuera de tunja', 'paquete'],
      answer: 'Sí, podemos enviar a otras ciudades. 🚚\n\nIndícanos el destino y tamaño del pedido, y te cotizamos el envío.',
      waText: 'Hola, ¿hacen envíos?'
    },
    {
      keys: ['novia', 'quince', 'grado', 'graduación', 'graduacion', 'baille', 'baile', 'clausura', 'evento', 'gala'],
      answer: 'Hacemos trajes para novias, quinceañeras, grados, bailes y clausuras. ✨\n\nCuéntanos el evento y lo hacemos realidad.',
      waText: 'Hola, quiero cotizar un traje para un evento.'
    },
    {
      keys: ['quien', 'quiénes', 'somos', 'tienda', 'bodegón', 'bodegon', 'negocio', 'nosotros'],
      answer: 'Somos El Bodegón de los Trajes, en Tunja. 🧵\n\nDisfraces, uniformes y alta costura a la medida. La elegancia se encuentra con el horror.',
      waText: ''
    },
    {
      keys: ['tela', 'material', 'algodón', 'tela de', 'estampado'],
      answer: 'Trabajamos con variedad de telas según el diseño. 🧶\n\nCuéntanos la referencia y te recomendamos la mejor opción.',
      waText: 'Hola, quiero asesoría sobre telas.'
    },
    {
      keys: ['foto', 'fotos', 'catalogo', 'catálogo', 'ver', 'mostrar', 'galería', 'galeria'],
      answer: '¡Claro! Explora las temporadas más arriba en esta página para ver las colecciones. 🖼️\n\nSi buscas algo específico, consúltanos.',
      waText: ''
    },
    {
      keys: ['gracias', 'muchas gracias', 'perfecto', 'genial', 'excelente', 'ok', 'listo'],
      answer: '¡Con gusto! 😊 No dudes en escribirnos si necesitas algo más.',
      waText: ''
    },
    {
      keys: ['hola', 'buenas', 'buen dia', 'buenos dias', 'buenas tardes', 'buenas noches', 'hey', 'kiubo'],
      answer: '¡Hola! 👋 Soy el asistente de El Bodegón de los Trajes.\n\nPregúntame por precios, tiempos, envíos, uniformes, disfraces o lo que necesites.',
      waText: ''
    }
  ];

  function normalize(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function answer(text) {
    var n = normalize(text);
    var best = null;
    RULES.forEach(function (r) {
      r.keys.forEach(function (k) {
        if (n.indexOf(normalize(k)) !== -1) {
          best = r;
        }
      });
    });
    return best;
  }

  function buildWidget() {
    var container = document.createElement('div');
    container.innerHTML =
      '<button class="assistant-float" id="assistant-float" aria-label="Asistente de ayuda" title="Asistente de ayuda">' +
      '<svg class="assistant-open-icon" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>' +
      '<svg class="assistant-close-icon" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>' +
      '<div class="assistant-window" id="assistant-window" role="dialog" aria-label="Asistente de ayuda">' +
      '<div class="assistant-header">' +
      '<span class="assistant-avatar">🎩</span>' +
      '<div><h4>Asistente El Bodegón</h4><p>en línea • responde al instante</p></div>' +
      '<button class="assistant-close" id="assistant-close" aria-label="Cerrar asistente">×</button>' +
      '</div>' +
      '<div class="assistant-body">' +
      '<div class="assistant-messages" id="assistant-messages"></div>' +
      '<div class="assistant-quick" id="assistant-quick"></div>' +
      '<form class="assistant-input" id="assistant-form">' +
      '<input type="text" id="assistant-question" placeholder="Escribe tu pregunta…" autocomplete="off">' +
      '<button type="submit" aria-label="Enviar">' +
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
      '</button>' +
      '</form>' +
      '<p class="assistant-footer-note">Enviado a ' + EMAIL + '</p>' +
      '</div>' +
      '</div>';
    document.body.appendChild(container);
  }

  function run() {
    buildWidget();

    var floatBtn = document.getElementById('assistant-float');
    var win = document.getElementById('assistant-window');
    var closeBtn = document.getElementById('assistant-close');
    var messages = document.getElementById('assistant-messages');
    var quick = document.getElementById('assistant-quick');
    var form = document.getElementById('assistant-form');
    var input = document.getElementById('assistant-question');

    function addMsg(text, who) {
      var el = document.createElement('div');
      el.className = 'assistant-msg ' + who;
      el.innerHTML = text;
      messages.appendChild(el);
      messages.scrollTop = messages.scrollHeight;
      return el;
    }

    function typing(cb) {
      var bubble = document.createElement('div');
      bubble.className = 'assistant-msg bot';
      bubble.textContent = '…';
      messages.appendChild(bubble);
      messages.scrollTop = messages.scrollHeight;
      setTimeout(function () {
        bubble.remove();
        cb();
      }, 550);
    }

    function linkWa(text) {
      var msg = addMsg('<a class="assistant-link" href="' + WA + encodeURIComponent(text) + '" target="_blank" rel="noopener">Continuar por WhatsApp →</a>', 'bot');
      return msg;
    }

    function reply(q) {
      var r = answer(q);
      typing(function () {
        if (r) {
          addMsg(r.answer, 'bot');
          if (r.waText) linkWa(r.waText);
          saveConsulta(q, '', '');
        } else {
          startLead(q);
        }
      });
    }

    var leadState = null;

    function isSolicitud(text) {
      var n = normalize(text);
      var words = ['quiero', 'necesito', 'solicito', 'solicitud', 'cotiz', 'comprar', 'pedido', 'encargo', 'reserva', 'presupuesto', 'me gustaria', 'me interesa', 'deseo', 'queria', 'quería', 'enviar'];
      for (var i = 0; i < words.length; i++) {
        if (n.indexOf(words[i]) !== -1) return true;
      }
      return false;
    }

    function startLead(initialMsg) {
      leadState = { step: 'nombre', mensaje: (initialMsg || '').trim() };
      if (leadState.mensaje) {
        addMsg([
          'Entiendo: "' + leadState.mensaje + '"',
          'Te armo el mensaje como un formulario de contacto. ✍️',
          'Primero, ¿cuál es tu nombre?'
        ].join('\n'), 'bot');
      } else {
        addMsg([
          '¡Perfecto! Te armo el mensaje como un formulario de contacto. ✍️',
          'Primero, ¿cuál es tu nombre?'
        ].join('\n'), 'bot');
      }
    }

    function sendLead() {
      var nombre = (leadState.nombre || '').trim();
      var contacto = (leadState.contacto || '').trim();
      var msg = (leadState.mensaje || '').trim().replace(/[.\s]+$/, '');
      var waText = 'Hola, soy ' + nombre + '. ' + msg + '.' + (contacto ? ' Me pueden escribir a: ' + contacto : '');
      typing(function () {
        addMsg([
          '¡Listo! Tu solicitud quedó así:',
          '• Nombre: ' + (nombre || '—'),
          '• Contacto: ' + (contacto || '—'),
          '• Mensaje: ' + (msg || '—')
        ].join('\n'), 'bot');
        linkWa(waText);
        saveConsulta(msg, nombre, contacto);
        leadState = null;
      });
    }

    function saveConsulta(q, nombre, contacto) {
      try {
        navigator.sendBeacon(API, JSON.stringify({
          categoria: 'consulta libre',
          consulta: q,
          nombre: nombre || '',
          whatsapp: contacto || ''
        }));
      } catch (e) {}
      if (q) {
        try {
          fetch('https://formsubmit.co/ajax/' + EMAIL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
              nombre: nombre || 'Consulta del asistente',
              contacto: contacto || '',
              mensaje: 'Consulta del asistente: ' + q,
              _subject: 'Consulta desde el asistente del sitio',
              _template: 'table',
              _captcha: 'false'
            })
          });
        } catch (e) {}
      }
    }

    function ask(text) {
      input.value = '';
      if (!text) return;
      var safe = text.replace(/</g, '&lt;');
      if (leadState) {
        addMsg(safe, 'user');
        var val = text.trim();
        if (leadState.step === 'nombre') {
          leadState.nombre = val;
          leadState.step = 'contacto';
          typing(function () {
            addMsg('Gracias, ' + val + '. ¿Cuál es tu WhatsApp o correo para responderte?', 'bot');
          });
        } else if (leadState.step === 'contacto') {
          leadState.contacto = val;
          if (leadState.mensaje) {
            sendLead();
          } else {
            leadState.step = 'mensaje';
            typing(function () {
              addMsg('¿Qué nos cuentas? Escribe el mensaje que quieres enviar. ✍️', 'bot');
            });
          }
        } else if (leadState.step === 'mensaje') {
          leadState.mensaje = val;
          sendLead();
        }
        return;
      }
      addMsg(safe, 'user');
      if (isSolicitud(text)) {
        startLead(text);
      } else {
        reply(text);
      }
    }

    var QUICK = ['📨 Enviar solicitud', 'Precios 💰', '📍 Ubicación', '⏰ Horario', '📦 Envíos', '🎃 Disfraces', '🏫 Uniformes'];

    function renderQuick() {
      if (quick.dataset.done) return;
      quick.dataset.done = '1';
      QUICK.forEach(function (label) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.addEventListener('click', function () {
          if (label.indexOf('📨') === 0) {
            input.value = '';
            startLead('');
          } else {
            ask(label.replace(/^[^\p{L}\p{N}]+/u, ''));
          }
        });
        quick.appendChild(b);
      });
    }

    floatBtn.addEventListener('click', function () {
      var open = !win.classList.contains('is-open');
      win.classList.toggle('is-open', open);
      floatBtn.classList.toggle('is-open', open);
      if (open) {
        renderQuick();
        input.focus();
        addMsg('¡Hola! 👋 ¿En qué te ayudo? Pregúntame por precios, horarios, envíos, uniformes, disfraces…', 'bot');
      }
    });

    closeBtn.addEventListener('click', function () {
      win.classList.remove('is-open');
      floatBtn.classList.remove('is-open');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      ask(input.value.trim());
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();