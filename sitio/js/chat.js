/* ==========================================================
   js/chat.js
   Asistente de ayuda — El Bodegón de los Trajes
   ==========================================================
   Es un bot con "IA por reglas": conoce el negocio y responde
   al instante las preguntas frecuentes (precios, medidas,
   categorías, ubicación, contacto, cómo pedir). El usuario puede
   ESCRIBIR LIBREMENTE lo que necesite. Si el bot no sabe algo o
   el cliente quiere atención personal, le ofrece reenviar la
   consulta al dueño (guardándola vía /api/chat-ask) o le da el
   enlace directo de WhatsApp.

   SEGURIDAD:
   - El bot SOLO maneja información pública del negocio.
   - NO lee ni expone: usuarios, contraseñas, hashes, claves,
     window.ADMIN_CONTENT, EMAIL_CONFIG ni configuración interna.
   - Todo el código está protegido: nunca lanza errores, siempre
     envuelto en try/catch y con respuesta útil garantizada.
   ========================================================== */

(function () {
  'use strict';

  if (document.getElementById('elbodegon-chat-root')) return;

  var BUSINESS = {
    nombre: 'El Bodegón de los Trajes',
    ciudad: 'Tunja, Boyacá',
    direccion: 'Diagonal 66 2B 04',
    telefono: '+57 310 770 6615',
    whatsappInt: '573107706615',
    email: 'avilamateito818@gmail.com',
    waLink: 'https://wa.me/573107706615?text=' + encodeURIComponent('Hola, quiero comunicarme con El Bodegón de los Trajes.')
  };

  var API = '/api/chat-ask';

  /* Reenvío al equipo: correo (Formspree) + WhatsApp (enlace directo).
     Se usa cuando el bot no puede resolver la consulta: se le informa
     al dueño por CORREO y se le abre el WHATSAPP del equipo con el detalle. */
  var FORMSPREE_ID = (window.EMAIL_CONFIG && window.EMAIL_CONFIG.formspreeId) ? window.EMAIL_CONFIG.formspreeId : null;

  function buildWaLink(prefill) {
    return 'https://wa.me/' + BUSINESS.whatsappInt + '?text=' + encodeURIComponent(prefill || '');
  }

  /* Envía por correo (Formspree) la consulta no resuelta al dueño.
     Retorna true/false para que la UI pueda confirmar el envío. */
  function sendEmailNotice(payload) {
    if (!FORMSPREE_ID) return Promise.resolve(false);
    var subject = '📩 Nueva consulta del asistente — ' + BUSINESS.nombre;
    var when = new Date().toLocaleString('es-CO');
    var data = new URLSearchParams();
    data.append('_subject', subject);
    data.append('_replyto', BUSINESS.email);
    data.append('_template', 'table');
    data.append('fecha', when);
    data.append('categoria', payload.categoria || 'consulta libre');
    data.append('nombre', payload.nombre || '');
    data.append('whatsapp', payload.whatsapp || '');
    data.append('consulta', payload.consulta || '');
    data.append('mensaje', payload.consulta || '');
    try {
      return fetch('https://formspree.io/f/' + FORMSPREE_ID, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: data
      }).then(function (res) {
        return res && (res.ok || res.redirected);
      }).catch(function () { return false; });
    } catch (e) { return Promise.resolve(false); }
  }

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

  var CATEGORY_KEYWORDS = {
    'uniforme': 'Uniformes Escolares',
    'colegio': 'Uniformes Escolares',
    'escolar': 'Uniformes Escolares',
    'bata': 'Batas de Laboratorio',
    'laboratorio': 'Batas de Laboratorio',
    'reyes': 'Trajes de Reyes Magos',
    'rey mago': 'Trajes de Reyes Magos',
    'mago': 'Trajes de Reyes Magos',
    'halloween': 'Disfraces de Halloween',
    'terror': 'Disfraces de Halloween',
    'disfraz': 'Disfraces de Halloween',
    'toga': 'Togas y Trajes de Grado',
    'grado': 'Togas y Trajes de Grado',
    'graduacion': 'Togas y Trajes de Grado',
    'birrete': 'Togas y Trajes de Grado',
    'smoking': 'Smoking y Trajes de Gala',
    'esmoquin': 'Smoking y Trajes de Gala',
    'smoking y gala': 'Smoking y Trajes de Gala',
    'traje de gala': 'Smoking y Trajes de Gala',
    'trajes de gala': 'Smoking y Trajes de Gala',
    'vestido de gala': 'Smoking y Trajes de Gala',
    'vestido de fiesta': 'Vestidos de Fiesta',
    'vestido': 'Vestidos de Fiesta',
    'fiesta': 'Vestidos de Fiesta',
    'quinceanera': 'Vestidos de Fiesta',
    'quinceañera': 'Vestidos de Fiesta',
    'prom': 'Vestidos de Fiesta',
    'baile tipico': 'Bailes Típicos y Clausura',
    'típico': 'Bailes Típicos y Clausura',
    'tipico': 'Bailes Típicos y Clausura',
    'sanjuanero': 'Bailes Típicos y Clausura',
    'cumbia': 'Bailes Típicos y Clausura',
    'joropo': 'Bailes Típicos y Clausura',
    'clausura': 'Bailes Típicos y Clausura',
    'navidad': 'Disfraces Navideños',
    'navideno': 'Disfraces Navideños',
    'navideño': 'Disfraces Navideños',
    'papa noel': 'Disfraces Navideños',
    'papá noel': 'Disfraces Navideños',
    'duende': 'Disfraces Navideños',
    'grinch': 'Disfraces Navideños',
    'posada': 'Disfraces Navideños',
    'novena': 'Disfraces Navideños'
  };

  /* ---------- MOTOR DE CONOCIMIENTO (IA por reglas) ---------- */

  function norm(s) {
    return String(s || '').toLowerCase().replace(/[^\w\sáéíóúñüÁÉÍÓÚÑÜ¿?¡!]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function hasAny(text, words) {
    for (var i = 0; i < words.length; i++) {
      if (text.indexOf(words[i]) !== -1) return true;
    }
    return false;
  }

  /* Detecta la categoría mencionada en el texto (por prioridad) */
  function detectCategory(text) {
    var t = norm(text);
    var ordered = [
      'smoking y gala', 'vestido de fiesta', 'disfraces navideños', 'trajes de reyes magos',
      'togas y trajes de grado', 'uniformes escolares', 'batas de laboratorio',
      'disfraces de halloween', 'bailes típicos y clausura'
    ];
    var orderIdx = {};
    ordered.forEach(function (c, i) { orderIdx[c] = i; });

    var best = null;
    for (var kw in CATEGORY_KEYWORDS) {
      if (t.indexOf(kw) !== -1) {
        var cat = CATEGORY_KEYWORDS[kw];
        if (!best || orderIdx[cat] < orderIdx[best]) best = cat;
      }
    }
    return best;
  }

  /* Convierte una necesidad en una respuesta útil */
  function answerFor(text, askContact) {
    var t = norm(text);

    /* Saludos (solo si es puramente un saludo, sin pregunta adicional) */
    if (/^(hola|buenas|buena|buen (dia|días|día|tardes|noche|noches)|hey|saludos|qué tal|que tal|que mas|qué más)[\s!.,]*$/.test(t)) {
      return {
        text: '¡Hola! 👋 Soy el asistente de **' + BUSINESS.nombre + '**. Puedo ayudarte a resolver tus dudas sobre disfraces, uniformes, medidas y más. ' +
          'Escribe tu pregunta normalmente o elige una opción.',
        more: 'keep'
      };
    }

    if (hasAny(t, ['gracias', 'thank', 'genial', 'excelente', 'perfecto'])) {
      return { text: '¡Con mucho gusto! 🙌 ¿Hay algo más en lo que pueda ayudarte? Puedes seguir preguntando o reenviar tus datos al equipo si lo necesitas.' };
    }

    /* Ubicación y contacto */
    if (hasAny(t, ['donde est', 'donde queda', 'donde se encuentra', 'donde', 'ubicad', 'dirección', 'direccion', 'en que parte', 'como llegar', 'sede', 'local', 'queda la tienda'])) {
      return {
        text: '📍 Nos encuentras en **' + BUSINESS.direccion + '**, ' + BUSINESS.ciudad + '.\n' +
          '📞 Teléfono: ' + BUSINESS.telefono + '\n' +
          '✉️ Correo: ' + BUSINESS.email + '\n' +
          '¡Te esperamos! También puedes escribirnos por WhatsApp.',
        actions: [{ label: '💬 Escríbenos por WhatsApp', url: BUSINESS.waLink }]
      };
    }

    if (hasAny(t, ['whatsapp', 'whats', 'wa.me', 'numero', 'número', 'telefono', 'teléfono', 'celular', 'contactar', 'contacto', 'llamar', 'hablar con', 'ateencion'])) {
      return {
        text: '📲 Nuestro WhatsApp es **' + BUSINESS.telefono + '**. Escríbenos y con gusto te atendemos.',
        actions: [{ label: '💬 Abrir WhatsApp', url: BUSINESS.waLink }]
      };
    }

    if (hasAny(t, ['correo', 'email', 'gmail', 'mail', 'escribir'])) {
      return { text: '✉️ Nuestro correo es **' + BUSINESS.email + '**. Cuéntanos tu consulta y te respondemos lo antes posible.' };
    }

    /* Precios / costo / cuanto vale (a la medida) */
    if (hasAny(t, ['precio', 'costo', 'cuanto cuesta', 'cuánto cuesta', 'cuanto vale', 'cuánto vale', 'tarifa', 'valor', 'cotizacion', 'cotización', 'presupuesto', 'cobran', 'barato', 'caro', 'promocion', 'promoción', 'descuento', 'oferta'])) {
      return {
        text: '💰 Nuestros trajes y disfraces se confeccionan **a la medida**, así que el precio depende del diseño, los materiales y los acabados. ' +
          'Por eso es mejor **cotizar**: te damos un precio exacto según lo que necesitas.\n\n' +
          'Cuéntame qué prenda buscas (uniforme, disfraz, vestido de gala, toga...) y con gusto te tomo el pedido para que el equipo te cotice.',
        more: 'ask_custom'
      };
    }

    /* Medidas / tallas */
    if (hasAny(t, ['medida', 'medidas', 'talla', 'tallas', 'entalla', 'ajuste', 'ajustado', 'toman medidas', 'talla'])) {
      return {
        text: '📏 Todo se confecciona **a la medida** (¡es nuestra especialidad!). No trabajamos solo con tallas estándar: tomamos las medidas y ajustamos. ' +
          'Puedes traer tus medidas o venir para que las tomemos; también aceptamos enviar las medidas por WhatsApp.',
        actions: [{ label: '💬 Enviar medidas por WhatsApp', url: BUSINESS.waLink + '&text=' + encodeURIComponent('Hola, quiero informarme sobre medidas.') }]
      };
    }

    /* Tiempo de confección / entrega / demora */
    if (hasAny(t, ['cuanto se demora', 'cuánto se demora', 'tiempo', 'entrega', 'demora', 'lista de entrega', 'cuando est', 'fecha meta', 'listo'])) {
      return {
        text: '⏳ El tiempo de confección depende de la complejidad de cada prenda y de la temporada. Como todo se hace a la medida, te confirmamos un tiempo exacto al cotizar tu pedido. ' +
          'Si necesitas algo para una fecha específica, ¡avísanos con tiempo y lo coordinamos!',
        actions: [{ label: '💬 Preguntar por tiempos', url: BUSINESS.waLink + '&text=' + encodeURIComponent('Hola, quiero saber el tiempo de entrega de un pedido.') }]
      };
    }

    /* Pagos */
    if (hasAny(t, ['pago', 'pagos', 'abono', 'abonos', 'seña', 'transferencia', 'nequi', 'daviplata', 'tarjeta', 'efectivo', 'credito', 'crédito', 'forma de pago'])) {
      return {
        text: '💳 Normalmente se realiza un **abono o seña al iniciar** el pedido (ya que todo es a la medida) y el resto al entregarlo. ' +
          'Te confirmamos las formas de pago exactas disponibles al cotizar tu pedido por WhatsApp.',
        actions: [{ label: '💬 Consultar formas de pago', url: BUSINESS.waLink + '&text=' + encodeURIComponent('Hola, quiero saber las formas de pago.') }]
      };
    }

    /* Categorías / qué venden / catálogo */
    if (hasAny(t, ['que venden', 'qué venden', 'catalogo', 'catálogo', 'que tienen', 'qué tienen', 'productos', 'servicios', 'opciones', 'que ofrecen', 'qué ofrecen', 'coleccion', 'colección'])) {
      return {
        text: '🛍️ Confeccionamos **a la medida** en Tunja:\n' + CATEGORIES.map(function (c) { return '• ' + c; }).join('\n') +
          '\n\nY si no encuentras lo que buscas, **te lo mandamos hacer**: envíanos la foto o la referencia y lo armamos para ti.',
        more: 'offer_category'
      };
    }

    /* No encuentro lo que busco / personalizado / encargo a la medida
       (se evalúa ANTES de la categoría específica: si el usuario dice "no
       encuentro el disfraz X" busca una solución personalizada, no que le
       hablemos solo de la categoría). */
    if (hasAny(t, ['no encuentro', 'mandar a hacer', 'manden a hacer', 'personaliza', 'personalizado', 'usted hace', 'hacen de', 'elabora', 'encargar a medida', 'hace a la medida'])) {
      return {
        text: '✂️ ¡Claro! **Si no encuentras lo que buscas, te lo mandamos hacer o te lo armamos a la medida.** ' +
          'Envíanos la foto o la referencia de lo que quieres por WhatsApp y nuestro equipo lo confecciona para ti.',
        actions: [{ label: '💬 Enviar mi referencia', url: BUSINESS.waLink + '&text=' + encodeURIComponent('Hola, quiero encargar una prenda a la medida.') }]
      };
    }

    /* Categoría específica detectada */
    var cat = detectCategory(text);
    if (cat) {
      return categoryAnswer(cat, askContact);
    }

    /* Halloween / disfraces general */
    if (hasAny(t, ['disfraz', 'halloween', 'terror', 'superheroe', 'superhéroe', 'princesa', 'cosplay', 'personaje'])) {
      return {
        text: '🎃 Para **disfraces** (incluida la colección de Halloween) trabajamos **toda la colección a la medida**: superhéroes, princesas, terror clásico, cosplay y más. ' +
          'Envía la foto o el modelo que deseas por WhatsApp y lo armamos para ti. ¡Ningún disfraz nos queda grande!',
        actions: [{ label: '💬 Pedir un disfraz', url: BUSINESS.waLink + '&text=' + encodeURIComponent('Hola, quiero pedir un disfraz a la medida.') }]
      };
    }

    /* Grados / togas / clausura */
    if (hasAny(t, ['grado', 'toga', 'graduacion', 'graduación', 'clausura', 'prom', 'birrete', 'ceremonia'])) {
      return {
        text: '🎓 Para **grados y clausuras** hacemos togas con birrete, smokings y trajes de gala, y vestidos de fiesta, todo **a la medida** para niños, jóvenes y adultos. ' +
          'También vestuario para **bailes típicos** (cumbia, sanjuanero, joropo, bambuco, currulao...). Cuéntanos qué ceremonia tienes y te orientamos.',
        more: 'offer_category'
      };
    }

    /* Reyes magos / navideño */
    if (hasAny(t, ['reyes magos', 'reyes', 'navidad', 'novena', 'posada', 'pesebre', 'papa noel', 'papá noel'])) {
      return {
        text: '🎄 Para la temporada **navideña** hacemos disfraces y atuendos de Reyes Magos, Papá Noel, duendes, renos, el Grinch, pastores, ángeles y más, **a la medida**. ' +
          'También armamos el vestuario completo de tu grupo, iglesia o colegio para el pesebre viviente.',
        more: 'offer_category'
      };
    }

    /* Compra / pedir / quiero */
    if (hasAny(t, ['quiero pedir', 'quiero comprar', 'comprar', 'pedir', 'encargar', 'orden', 'hacer pedido', 'quiero uno', 'me interesa', 'disponibilidad', 'disponible', 'tienen'])) {
      return {
        text: '🛒 ¡Genial! Para encargar cuéntame **qué prenda necesitas** (uniforme, disfraz, vestido, toga...) y con gusto recojo tus datos para que el equipo te contacte y te cotice.',
        more: 'ask_custom'
      };
    }

    /* Preguntas de "sobre nosotros / qué es" */
    if (hasAny(t, ['que es', 'qué es', 'quienes son', 'quienes', 'sobre', 'acerca', 'empresa', 'tienda', 'negocio'])) {
      return {
        text: '🏠 **' + BUSINESS.nombre + '** es una sastrería de **alta costura a la medida** en ' + BUSINESS.ciudad + '. ' +
          'Hacemos disfraces de Halloween, uniformes, batas, togas y trajes de grado, smokings y vestidos de gala, bailes típicos y disfraces navideños, ' +
          'con el ajuste y los acabados que nos caracterizan.'
      };
    }

    /* Si el admin pidió contacto, resumir */
    if (askContact) {
      return {
        text: 'Gracias. ✔️ Para poder responder sobre eso de forma personalizada, ¿me regalas tu **nombre** y **número de WhatsApp**? ' +
          'Se los paso al equipo y te contactan. (O escríbenos directo por WhatsApp).',
        more: 'ask_custom'
      };
    }

    /* Respuesta genérica útil: ofrece categoría + reenvío */
    return {
      text: 'Gracias por tu mensaje. 😊 Para ayudarte mejor, dime: **¿qué prenda o servicio buscas?** ' +
        '(por ejemplo: uniforme escolar, disfraz de Halloween, vestido de fiesta, toga para un grado...). ' +
        'Si prefieres, nuestro equipo puede atenderte directamente.',
      more: 'offer_help'
    };
  }

  function categoryAnswer(cat, askContact) {
    var map = {
      'Uniformes Escolares': '🎒 **Uniformes Escolares:** confeccionamos uniformes de colegio para **niña y niño**, con el entalle y los escudos bordados de cada institución de Tunja y Boyacá. Todo **a la medida**.',
      'Batas de Laboratorio': '🧪 **Batas de Laboratorio:** para colegio y universidad, confeccionadas **a la medida** con telas lavables y durables.',
      'Trajes de Reyes Magos': '👑 **Trajes de Reyes Magos:** túnicas, mantos y coronas confeccionados **a la medida** para celebrar el Día de Reyes.',
      'Disfraces de Halloween': '🎃 **Disfraces de Halloween:** toda la colección **a la medida** — superhéroes, princesas, terror clásico, cosplay y la gala del inframundo. Envíanos la foto o el modelo y lo armamos.',
      'Togas y Trajes de Grado': '🎓 **Togas y Trajes de Grado:** togas con birrete para niños y adultos, confeccionadas **a la medida** para tu ceremonia de grado.',
      'Smoking y Trajes de Gala': '🤵 **Smoking y Trajes de Gala:** esmóquines y trajes elegantes para prom, grados, cenas y clausuras, con corte **a la medida** para hombre, adolescente y niño.',
      'Vestidos de Fiesta': '👗 **Vestidos de Fiesta:** vestidos largos e elegantes para mujer en prom, cenas de gala y clausuras, con diseño **a la medida**.',
      'Bailes Típicos y Clausura': '💃 **Bailes Típicos y Clausura:** vestuario para cumbia, sanjuanero, joropo, bambuco, currulao y bullerengue, todo **a la medida**.',
      'Disfraces Navideños': '🎄 **Disfraces Navideños:** Papá Noel, duendes, renos, el Grinch, pastores, ángeles y más, **a la medida**, para posadas, novenas y eventos.'
    };
    var resp = map[cat] || ('✨ **' + cat + ':** lo confeccionamos **a la medida** en ' + BUSINESS.ciudad + '.');
    return {
      text: resp + '\n\n¿Te interesa cotizar o encargar uno?',
      more: 'ask_custom'
    };
  }

  /* ---------- UI ---------- */

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
    '      <div class="chat-head-sub"><span class="chat-head-status"></span>En línea · IA de ayuda</div>' +
    '    </div>' +
    '  </div>' +
    '  <div class="chat-body" id="chat-body"></div>' +
    '  <div class="chat-foot">' +
    '    <input class="chat-input" id="chat-input" type="text" placeholder="Escribe tu consulta..." autocomplete="off" />' +
    '    <button class="chat-send" id="chat-send" type="button">Enviar</button>' +
    '  </div>' +
    '  <div class="chat-legal">Asistente de <strong>El Bodegón de los Trajes</strong>. Si no resuelve tu duda, te tomamos los datos y te contactamos. No compartimos tu información.</div>' +
    '</div>';

  document.body.appendChild(root);

  var fab = root.querySelector('#chat-fab');
  var win = root.querySelector('#chat-window');
  var body = root.querySelector('#chat-body');
  var input = root.querySelector('#chat-input');
  var sendBtn = root.querySelector('#chat-send');

  var pendingCustom = null;   // { name, phone } a medio capturar
  var lastQuestion = null;    // última pregunta del usuario sin responder

  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function addMsg(text, who) {
    try {
      var m = document.createElement('div');
      m.className = 'chat-msg ' + (who || 'bot');
      /* Renderiza negritas **x** de forma segura: el HTML se escapa y solo se
         convierten los marcadores ** en <strong> (texto controlado por el bot). */
      if (who !== 'user' && text) {
        m.innerHTML = escHtml(text).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      } else {
        m.textContent = text;
      }
      body.appendChild(m);
      body.scrollTop = body.scrollHeight;
    } catch (e) {}
  }

  function addOpts(list) {
    try {
      var wrap = document.createElement('div');
      wrap.className = 'chat-opts';
      list.forEach(function (t) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'chat-opt';
        b.textContent = t;
        b.addEventListener('click', function () { handleText(t); });
        wrap.appendChild(b);
      });
      body.appendChild(wrap);
      body.scrollTop = body.scrollHeight;
    } catch (e) {}
  }

  function addActions(actions) {
    try {
      if (!actions || !actions.length) return;
      var wrap = document.createElement('div');
      wrap.className = 'chat-actions';
      actions.forEach(function (a) {
        var el;
        if (a.url) {
          el = document.createElement('a');
          el.href = a.url;
          el.target = '_blank';
          el.rel = 'noopener';
          el.className = 'chat-btn';
        } else {
          el = document.createElement('button');
          el.type = 'button';
          el.className = 'chat-btn chat-btn-neutral';
          el.addEventListener('click', function () { if (a.act) a.act(); });
        }
        el.textContent = a.label;
        if (a.neutral) el.classList.add('chat-btn-neutral');
        wrap.appendChild(el);
      });
      body.appendChild(wrap);
      body.scrollTop = body.scrollHeight;
    } catch (e) {}
  }

  function setEnabled(on) {
    try { input.disabled = !on; sendBtn.disabled = !on; } catch (e) {}
  }

  function normalizePhone(raw) {
    var digits = (raw || '').replace(/\D/g, '');
    if (digits.length === 10) digits = '57' + digits;
    if (digits.length === 12 && digits.indexOf('57') === 0) return digits;
    return null;
  }

  /* Muestra el mensaje del bot + texto + acciones/opciones de seguimiento */
  function respond(res) {
    if (!res) return;
    if (res.text) addMsg(res.text, 'bot');
    if (res.actions) addActions(res.actions);
    if (res.more === 'keep') {
      setEnabled(true);
    } else if (res.more === 'offer_category') {
      addMsg('Estas son nuestras opciones:', 'bot');
      addOpts(CATEGORIES);
      setEnabled(true);
    } else if (res.more === 'ask_custom') {
      askContacts('¿Me regalas tu **nombre** y **número de WhatsApp** para que el equipo te contacte y te cotice?');
    } else if (res.more === 'offer_help') {
      askContacts('Si me dejas tu **nombre** y **número de WhatsApp**, el equipo te atiende directamente. ¿Quieres?');
    } else {
      setEnabled(true);
    }
  }

  function askContacts(promptText) {
    setEnabled(false);
    pendingCustom = { name: null, phone: null };
    addMsg(promptText, 'bot');
    addMsg('Primero, ¿cuál es tu nombre?', 'bot');
    pendingCustom.step = 'name';
    setEnabled(true);
  }

  function sendConsultation(name, phones, extraMsg) {
    setEnabled(false);
    addMsg('📩 ¡Listo! Registramos tu consulta. El equipo de **' + BUSINESS.nombre + '** te contactará por WhatsApp lo antes posible. ¡Gracias por tu paciencia! 🙌', 'bot');

    var consulta = (lastQuestion || '') + (extraMsg ? ' | ' + extraMsg : '');
    var categoria = detectCategory(lastQuestion || '') || 'consulta libre';

    var payload = {
      categoria: categoria,
      nombre: name,
      whatsapp: phones,
      consulta: consulta
    };

    /* 1) WhatsApp directo al dueño, ya con el detalle de la consulta.
       Así el mensaje llega completo sin que el cliente tenga que reescribir. */
    var waPrefill = 'Nueva consulta en ' + BUSINESS.nombre +
      ' | Categoría: ' + categoria +
      (consulta ? ' | Consulta: ' + consulta : '') +
      ' | Nombre: ' + name +
      (phones ? ' | WhatsApp: ' + phones : '');
    var directWa = buildWaLink(waPrefill);

    /* 2) Correo al dueño (Formspree): confirmamos el envío en pantalla. */
    sendEmailNotice(payload).then(function (sent) {
      try {
        if (sent) {
          addMsg('✅ Tu consulta también fue enviada por correo al equipo. ¡Te atenderemos muy pronto!', 'bot');
        } else {
          addActions([{ label: '✉️ Correo directo', url: 'mailto:' + BUSINESS.email, neutral: true }]);
        }
        setEnabled(true);
      } catch (e) {}
    });

    /* 3) Guardado en GitHub a través de la API (el dueño lo ve en consultas.json). */
    try {
      fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(function () {});
      /* el fetch puede fallar sin red; nunca rompe la UI */
    } catch (e) {}

    addActions([
      { label: '💬 Abrir WhatsApp (consulta enviada)', url: directWa },
      { label: '☎️ Escríbenos directo', url: BUSINESS.waLink, neutral: true }
    ]);
    setEnabled(true);
    pendingCustom = null;
  }

  function start() {
    setEnabled(false);
    try {
      addMsg('¡Hola! 👋 Soy el asistente de **' + BUSINESS.nombre + '** en ' + BUSINESS.ciudad + '. ' +
        'Te ayudo con disfraces, uniformes, medidas, precios y más. Escribe tu consulta libremente o elige una opción:');
      setEnabled(true);
      addOpts(['¿Qué venden?', '¿Dónde están ubicados?', '¿Cómo cotizo un pedido?', '¿Hacen a la medida?']);
      addMsg('También puedes escribir tu propia pregunta. 😊', 'bot');
    } catch (e) {
      setEnabled(true);
    }
  }

  function handleText(val) {
    try {
      if (!val || !val.trim()) return;
      var text = val.trim();
      addMsg(text, 'user');
      input.value = '';

      /* Flow de captura de contacto en curso */
      if (pendingCustom && pendingCustom.step === 'name') {
        pendingCustom.name = text;
        pendingCustom.step = 'phone';
        setEnabled(false);
        addMsg('Perfecto. ¿Cuál es tu **número de WhatsApp** (10 dígitos, ej. 3107706615)?', 'bot');
        setEnabled(true);
        return;
      }
      if (pendingCustom && pendingCustom.step === 'phone') {
        var p = normalizePhone(text);
        if (!p) {
          addMsg('Ese número no parece válido. Verifica que sean 10 dígitos (por ejemplo, 3107706615).', 'bot');
          return;
        }
        pendingCustom.phone = p;
        pendingCustom.step = 'done';
        sendConsultation(pendingCustom.name, p, null);
        return;
      }

      /* Si viene de "preguntar disponibilidad de X" capturamos la pregunta */
      lastQuestion = text;

      var res = answerFor(text, false);
      respond(res);
    } catch (e) {
      /* Nunca debe fallar: respuesta de seguridad */
      addMsg('Disculpa, tuve un pequeño inconveniente. 😅 No te preocupes: nuestro equipo te atiende directo por WhatsApp.', 'bot');
      addActions([{ label: '💬 Hablar por WhatsApp', url: BUSINESS.waLink }]);
      setEnabled(true);
    }
  }

  function toggle(open) {
    try {
      var isOpen = open !== undefined ? open : !win.classList.contains('is-open');
      win.classList.toggle('is-open', isOpen);
      fab.classList.toggle('is-open', isOpen);
      fab.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (isOpen && !win.dataset.started) {
        win.dataset.started = '1';
        start();
      }
    } catch (e) {}
  }

  try {
    fab.addEventListener('click', function () { toggle(); });
    sendBtn.addEventListener('click', function () { handleText(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); handleText(input.value); }
    });
  } catch (e) {}
})();
