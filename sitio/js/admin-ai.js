/* ==========================================================
   js/admin-ai.js
   Asistente del Administrador — El Bodegón de los Trajes
   ==========================================================
   ¿Qué hace?
   Asistente enfocado en EDICIÓN. Con órdenes en lenguaje
   natural el administrador puede:
   - Editar textos: títulos, párrafos, subtítulos, hitos.
   - Editar fotos y portadas (hero y temporadas).
   - Agregar contenido nuevo: párrafos, títulos, fotos y tarjetas.
   - Personalizar el ESTILO VISUAL con el Editor Visual del panel:
     color de texto, color de fondo, tipografía (letra), tamaño,
     peso (negrita), ancho/alto, borde, radio, opacidad y posición.
   - Gestionar el panel: guardar, sincronizar, verificar, descargar,
     respaldos y cambiar la contraseña.

   SEGURIDAD (requisito del cliente — NO sobreexponer información):
   - El asistente NUNCA revela contraseñas, usuarios, hashes, tokens,
     claves, Formspree ni configuración interna del panel. Si le piden
     eso, se niega y ofrece edición/gestión.
   - Con "cambia la contraseña" solo abre la herramienta nativa del
     panel (sin mostrar datos); el único [data-role] que usa para eso
     es el botón "Cambiar contraseña".
   - No hace fetch a ninguna API externa. Todo es local.
   - Usa la API mínima BodegonAdminApi (expuesta por admin.js), que
     solo opera sobre el Editor Visual.
   - Solo actúa cuando la sesión de administrador ya está activa
     (body.admin-edit-mode). No verifica credenciales.
   - Cada acción está protegida con try/catch para nunca romper la
     página.
   ========================================================== */

(function () {
  'use strict';

  var MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

  /* Colores en español → hex (para el color picker del panel) */
  var COLOR_WORDS = [
    ['rojo', '#e74c3c'], ['azul', '#2e86de'], ['verde', '#27ae60'],
    ['negro', '#000000'], ['blanco', '#ffffff'], ['amarillo', '#f1c40f'],
    ['naranja', '#e67e22'], ['morado', '#9b59b6'], ['purpura', '#8e44ad'],
    ['violeta', '#8e44ad'], ['rosa', '#fd79a8'], ['rosado', '#fd79a8'],
    ['gris', '#7f8c8d'], ['dorado', '#d4af37'], ['oro', '#d4af37'],
    ['plateado', '#c0c0c0'], ['cafe', '#8b4513'], ['marrón', '#6e2c00'],
    ['marron', '#6e2c00'], ['celeste', '#87ceeb'], ['turquesa', '#1abc9c'],
    ['esmeralda', '#2ecc71'], ['vino', '#722f37'], ['beige', '#f5f5dc'],
    ['crema', '#fffdd0'], ['coral', '#ff6b6b']
  ];

  /* Fuentes disponibles en el panel */
  var FONTS = [
    ['quicksand', 'Quicksand, sans-serif'],
    ['cinzel', 'Cinzel Decorative, cursive'],
    ['arial', 'Arial, sans-serif'],
    ['georgia', 'Georgia, serif'],
    ['times', 'Times New Roman, serif'],
    ['verdana', 'Verdana, sans-serif']
  ];

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

  /* ----------------------------------------------------------
     SECCIÓN
     ---------------------------------------------------------- */
  function detectSection(text) {
    var t = norm(text);
    if (hasAny(t, ['hero', 'inicio', 'principal', 'banner', 'la portada', 'primera pagina', 'la pagina principal'])) return 'hero';
    if (hasAny(t, ['cabecera', 'titulo general', 'encabezado de temporadas', 'temporadas'])) return 'cabecera';
    if (hasAny(t, ['contacto', 'contactanos', 'contáctanos', 'llamenos', 'llámenos'])) return 'contacto';
    for (var i = 0; i < MONTHS.length; i++) {
      if (t.indexOf(MONTHS[i]) !== -1) return MONTHS[i];
    }
    return 'hero';
  }

  function describeSection(section) {
    if (section === 'hero') return 'Inicio (hero)';
    if (section === 'cabecera') return 'cabecera de Temporadas';
    if (section === 'contacto') return 'Contacto';
    return section;
  }

  /* ----------------------------------------------------------
     LOCALIZAR sección / elementos
     ---------------------------------------------------------- */
  function panelNode(section) {
    if (section === 'hero') return document.getElementById('inicio');
    if (section === 'cabecera') return document.getElementById('temporadas');
    if (section === 'contacto') return document.getElementById('contacto');
    if (MONTHS.indexOf(section) !== -1) {
      return document.querySelector('.season-panel[data-panel="' + section + '"]') || null;
    }
    return null;
  }

  function revealSection(section) {
    try {
      if (MONTHS.indexOf(section) !== -1) {
        var tab = document.querySelector('.season-tab[data-month="' + section + '"]:not(.season-tab-clone)') ||
                  document.querySelector('.season-tab[data-month="' + section + '"]');
        if (tab && !tab.classList.contains('is-active')) tab.click();
      }
      var node = panelNode(section);
      if (node) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {}
  }

  function focusFlash(el) {
    try {
      el.classList.add('admin-ai-focus');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(function () { try { el.classList.remove('admin-ai-focus'); } catch (e) {} }, 2600);
    } catch (e) {}
  }

  function triggerClick(el) {
    if (!el) return;
    focusFlash(el);
    setTimeout(function () {
      try { el.click(); } catch (e) {}
    }, 700);
  }

  function firstMatch(query) {
    try { return document.querySelector(query); } catch (e) { return null; }
  }

  function resolveStyleElement(section, kind) {
    try {
      if (section === 'hero') {
        if (kind === 'seccion') return firstMatch('#inicio');
        if (kind === 'texto')  return firstMatch('#inicio .hero-box p');
        if (kind === 'hito')   return null;
        return firstMatch('#inicio .hero-box h2');
      }
      if (section === 'cabecera') {
        if (kind === 'seccion') return firstMatch('#temporadas .section-head');
        if (kind === 'texto')  return firstMatch('#temporadas .section-head p');
        return firstMatch('#temporadas .section-head h2');
      }
      if (section === 'contacto') {
        if (kind === 'seccion') return firstMatch('#contacto');
        if (kind === 'texto')  return firstMatch('#contacto .contact-intro') || firstMatch('#contacto .contact-card p');
        return firstMatch('#contacto .contact-card h3');
      }
      if (MONTHS.indexOf(section) !== -1) {
        var base = '.season-panel[data-panel="' + section + '"] .season-hero';
        if (kind === 'seccion') return firstMatch(base);
        if (kind === 'texto')  return firstMatch(base + ' .season-subtitle');
        if (kind === 'hito')   return firstMatch(base + ' .season-milestone');
        return firstMatch(base + ' .season-title');
      }
      return null;
    } catch (e) { return null; }
  }

  /* Elemento editable de texto (título / subtítulo / hito) */
  function textTarget(section, action) {
    try {
      var sel = null;
      if (section === 'hero') {
        if (action === 'titulo')      sel = '#inicio .hero-box h2';
        else if (action === 'texto')  sel = '#inicio .hero-box p';
        else return null;
      } else if (section === 'cabecera') {
        if (action === 'titulo')      sel = '#temporadas .section-head h2';
        else if (action === 'texto')  sel = '#temporadas .section-head p';
        else return null;
      } else if (section === 'contacto') {
        if (action === 'titulo')      sel = '#contacto .contact-card h3, #contacto .contact-head h3, #contacto .section-title';
        else if (action === 'texto')  sel = '#contacto .contact-intro, #contacto .contact-detail p, #contacto .contact-card p';
        else return null;
      } else if (MONTHS.indexOf(section) !== -1) {
        var hero = '.season-panel[data-panel="' + section + '"] .season-hero .';
        if (action === 'titulo')      sel = hero + 'season-title';
        else if (action === 'hito')   sel = hero + 'season-milestone';
        else if (action === 'texto')  sel = hero + 'season-subtitle';
        else return null;
      }
      if (!sel) return null;
      return document.querySelector(sel);
    } catch (e) { return null; }
  }

  /* ----------------------------------------------------------
     ACCIONES NATIVAS: foto / contenido nuevo / mantenimiento
     ---------------------------------------------------------- */
  function photoButton(section) {
    try {
      if (section === 'hero') {
        return firstMatch('.admin-season-photo-btn[data-season-photo="hero"]');
      }
      if (MONTHS.indexOf(section) !== -1) {
        return firstMatch('.admin-season-photo-btn[data-season-photo="' + section + '"]') ||
               firstMatch('.season-panel[data-panel="' + section + '"] .admin-season-photo-btn');
      }
      return null;
    } catch (e) { return null; }
  }

  function addContentButton(section, addType) {
    try {
      var node = panelNode(section);
      var cls = '.admin-addbtn';
      if (addType === 'parrafo')       cls = '.admin-addbtn.admin-addbtn-text';
      else if (addType === 'titulo')   cls = '.admin-addbtn.admin-addbtn-title';
      else if (addType === 'foto')     cls = '.admin-addbtn.admin-addbtn-photo';
      else cls = '.admin-addbtn:not(.admin-addbtn-text):not(.admin-addbtn-title):not(.admin-addbtn-photo)';

      if (node) {
        var els = node.querySelectorAll(cls);
        if (els && els.length) return els[0];
      }
      if (section === 'contacto' && node) {
        var card = node.querySelector('.contact-card, .contact-box, [class*="contact"]');
        if (card) {
          var c = card.querySelector(cls) || node.querySelector(cls);
          if (c) return c;
        }
      }
      if (MONTHS.indexOf(section) !== -1) {
        var m = firstMatch('.season-panel[data-panel="' + section + '"] ' + cls);
        if (m) return m;
      }
      if (section === 'hero') {
        return firstMatch('#inicio ' + cls) || firstMatch(cls);
      }
      return firstMatch(cls);
    } catch (e) { return null; }
  }

  function toolbarButton(role) {
    try {
      var tb = document.querySelector('.admin-toolbar');
      if (!tb) return null;
      return tb.querySelector('[data-role="' + role + '"]') || null;
    } catch (e) { return null; }
  }

  /* ----------------------------------------------------------
     PARSERS DE ESTILO (color / fuente / tamaño / peso / etc.)
     ---------------------------------------------------------- */
  function parseColorValue(t) {
    var m = String(t).match(/(#[0-9a-f]{6}|#[0-9a-f]{3})\b/i);
    if (m) return m[1].toLowerCase();
    for (var i = 0; i < COLOR_WORDS.length; i++) {
      var re = new RegExp('\\b' + COLOR_WORDS[i][0] + '\\b', 'i');
      if (re.test(t)) return COLOR_WORDS[i][1];
    }
    return null;
  }

  function parseFont(t) {
    for (var i = 0; i < FONTS.length; i++) {
      var re = new RegExp('\\b' + FONTS[i][0] + '\\b', 'i');
      if (re.test(t)) {
        return { display: FONTS[i][0].charAt(0).toUpperCase() + FONTS[i][0].slice(1), value: FONTS[i][1] };
      }
    }
    return null;
  }

  function parseWeight(t) {
    if (hasAny(t, ['extragrueso', 'extragruesa', 'extra bold', '800'])) return '800';
    if (hasAny(t, ['negrita', 'negritas', 'bold', 'grueso', 'gruesa', 'gordita', '700'])) return '700';
    if (hasAny(t, ['seminegrita', 'semi negrita', 'medium', 'mediana', '600'])) return '600';
    if (hasAny(t, ['light', 'delgado', 'delgada', 'fino', 'fina', '300'])) return '300';
    if (hasAny(t, ['regular', 'normal', '400'])) return '400';
    return null;
  }

  function parseNumber(t, which) {
    var m = t.match(new RegExp(which + '[^\\d]*\\b(\\d{1,4})\\b', 'i'));
    return m ? parseInt(m[1], 10) : null;
  }

  function parsePosition(t) {
    var up = /\barriba\b/.test(t);
    var down = /\babajo\b/.test(t);
    var left = /\bizquierda\b/.test(t);
    var right = /\bderecha\b/.test(t);
    var center = /\bcentro\b|\bcentrado\b|\bcentrada\b|\bmedio\b|\bcentra\b|\bcentrar\b/.test(t);
    if (up && left) return { key: 'left-top', label: 'arriba a la izquierda' };
    if (up && right) return { key: 'right-top', label: 'arriba a la derecha' };
    if (up) return { key: 'center-top', label: 'arriba centrado' };
    if (down && left) return { key: 'left-bottom', label: 'abajo a la izquierda' };
    if (down && right) return { key: 'right-bottom', label: 'abajo a la derecha' };
    if (down) return { key: 'center-bottom', label: 'abajo centrado' };
    if (left) return { key: 'left-center', label: 'a la izquierda centrado' };
    if (right) return { key: 'right-center', label: 'a la derecha centrado' };
    if (center) return { key: 'center-center', label: 'centrado' };
    return null;
  }

  /* ----------------------------------------------------------
     MOTOR DE ESTILO (Editor Visual vía BodegonAdminApi)
     ---------------------------------------------------------- */
  function styleElementKind(t) {
    if (hasAny(t, ['bloque', 'bloques', 'seccion', 'sección', 'contenedor', 'tarjeta', 'seccion entera', 'caja', 'hero completo'])) return 'seccion';
    if (hasAny(t, ['hito'])) return 'hito';
    if (hasAny(t, ['subtitulo', 'subtítulo', 'parrafo', 'párrafo', 'texto', 'lema', 'descripcion', 'descripción', 'sub'])) return 'texto';
    if (hasAny(t, ['titulo', 'título', 'titular', 'encabezado', 'heading'])) return 'titulo';
    return 'titulo';
  }

  function currentFontSize(el) {
    try { return parseFloat(window.getComputedStyle(el).fontSize) || 16; } catch (e) { return 16; }
  }

  function explicitElement(t) {
    return hasAny(t, ['titulo', 'título', 'titular', 'subtitulo', 'subtítulo', 'parrafo', 'párrafo', 'texto', 'hito',
      'lema', 'descripcion', 'descripción', 'encabezado', 'bloque', 'bloques', 'tarjeta', 'contenedor', 'caja', 'boton', 'botón']);
  }

  function applyStyleCommand(text) {
    var api = window.BodegonAdminApi;
    if (!api) {
      log('La herramienta de estilos aún no está disponible en esta versión del panel. Cierra sesión y vuelve a entrar para recargarla.', 'bot');
      return;
    }
    var t = norm(text);
    var section = detectSection(text);
    var isBg = /\bfondo\b|\bbackground\b/.test(t);
    var kind = styleElementKind(t);
    /* Si pide "fondo de color" sin nombrar un elemento, aplica a la sección */
    if (isBg && !explicitElement(t)) kind = 'seccion';
    var el = resolveStyleElement(section, kind);
    if (!el) {
      log('No encontré el elemento para aplicar el estilo en ' + describeSection(section) + '. Prueba, por ejemplo: "color del texto del título de marzo".', 'bot');
      return;
    }
    if (!api.select(el)) { log('No pude abrir el editor visual para ese elemento.', 'bot'); return; }
    revealSection(section);

    var done = [];
    var color = parseColorValue(t);
    var isBg = /\bfondo\b|\bbackground\b/.test(t);
    var isBorder = /\bborde\b|\bborder\b/.test(t);
    var isRadius = /\bradio\b|\bredondea\b|\bredondear\b|\bredondeado\b/.test(t);
    var n;

    if (color && isBg) {
      api.applyProp('backgroundColor', color);
      done.push('fondo ' + color);
    } else if (color && isBorder) {
      api.applyProp('borderColor', color);
      done.push('borde color ' + color);
    } else if (color && !isBg && !isBorder && !isRadius) {
      api.applyProp('color', color);
      done.push('color de texto ' + color);
    }

    if (isBorder) {
      n = parseNumber(t, 'borde');
      if (n === null) n = 2;
      api.applyProp('borderWidth', String(n));
      done.push('borde ' + n + 'px');
    }
    if (isRadius) {
      n = parseNumber(t, 'borde');
      if (n === null) n = 12;
      api.applyProp('borderRadius', String(n));
      done.push('esquinas redondeadas ' + n + 'px');
    }

    var font = parseFont(t);
    if (font) {
      api.applyProp('fontFamily', font.value);
      done.push('letra ' + font.display);
    }

    var weight = parseWeight(t);
    if (!weight && hasAny(t, ['negrita', 'negritas', 'bold', 'grueso', 'gruesa', 'gordita'])) weight = '700';
    if (weight) {
      api.applyProp('fontWeight', weight);
      done.push('peso de letra ' + weight);
    }

    if (hasAny(t, ['tamano', 'tamaño', 'grande', 'grandes', 'pequeno', 'pequeño', 'pequenos', 'pequeños', 'agranda', 'agrandar', 'agranda la letra'])) {
      var current = currentFontSize(el);
      n = parseNumber(t, 'tamano');
      if (n === null) n = parseNumber(t, 'letra');
      if (n === null) {
        n = /\bgrande\b|\bagranda\b|\bmas grande\b|\bmás grande\b/.test(t) ? current + 4 : current - 4;
      }
      n = Math.max(8, Math.min(100, n));
      api.applyProp('fontSize', String(n));
      done.push('tamaño de letra ' + n + 'px');
    }

    var wx = t.match(/\bancho\b[^\d]*\b(\d{1,4})\b/i);
    if (wx) {
      api.applyProp('width', String(Math.max(20, Math.min(2000, parseInt(wx[1], 10)))));
      done.push('ancho ' + wx[1] + 'px');
    }
    var hx = t.match(/\balto\b[^\d]*\b(\d{1,4})\b/i);
    if (hx) {
      api.applyProp('height', String(Math.max(20, Math.min(2000, parseInt(hx[1], 10)))));
      done.push('alto ' + hx[1] + 'px');
    }

    if (hasAny(t, ['opacidad', 'transparencia', 'opacity'])) {
      var om = t.match(/\bopacidad\b[^\d]*\b(\d{1,3})\b/i) || t.match(/\btransparencia\b[^\d]*\b(\d{1,3})\b/i);
      if (om) {
        var op = parseInt(om[1], 10);
        if (op > 1) op = op / 100;
        op = Math.max(0, Math.min(1, op));
        api.applyProp('opacity', String(op));
        done.push('opacidad ' + Math.round(op * 100) + '%');
      }
    }

    var pos = parsePosition(t);
    if (pos) {
      api.pos(pos.key);
      done.push('posición ' + pos.label);
    }

    if (hasAny(t, ['restablece', 'restablecer', 'quita el estilo', 'quita los estilos', 'sin estilos', 'quitar estilos'])) {
      var ok = api.resetSelected();
      done.push(ok ? 'estilos originales restaurados' : 'no había estilos guardados que restaurar');
    }

    if (!done.length) {
      log('Cuéntame qué cambio quieres sobre el **' + describeSection(section) + '** (' + (el.tagName || '').toLowerCase() + '): color (texto o fondo), letra (fuente, tamaño, negrita), borde, posición u opacidad. Ej: "pon el título de marzo en dorado".', 'bot');
      return;
    }
    log('Apliqué a **' + describeSection(section) + '**: ' + done.join(', ') + '. ✅\nEl **Editor Visual** quedó abierto para que afines los detalles y guardes.', 'bot');
  }

  /* ----------------------------------------------------------
     SEGURIDAD: nunca revelar datos internos
     ---------------------------------------------------------- */
  function isCredentialAsk(text) {
    var t = norm(text);
    var topic = /contraseña|contrasena|password|clave|usuario|user|hash|token|llave|apikey|api key|credencial|sesion|sesión|login|github|formspree/i;
    if (!topic.test(t)) return false;
    /* Guardar/cambiar contraseña está permitido (herramienta nativa) */
    if (/cambia|cambio|cambiar|actualiza|actualizar|renueva|renovar/.test(t) && /contraseña|contrasena|password|clave/.test(t)) {
      return false;
    }
    return true;
  }

  /* ----------------------------------------------------------
     RESPUESTAS LIBRES (sin datos internos)
     ---------------------------------------------------------- */
  function freeAnswer(text) {
    var t = norm(text);

    if (t.length < 4 || /^(hola|buenas|hey|saludos|que tal|qu[eé] tal)\b/.test(t)) {
      return '¡Hola! 👋 Soy tu asistente de **edición**. Cambio fotos, párrafos, títulos, colores, letra, tamaños y posiciones, agrego contenido y gestiono el panel. Dame una orden, por ejemplo: "cambia el color del título de enero".';
    }
    if (hasAny(t, ['gracias', 'genial', 'excelente', 'perfecto', 'chao', 'adios', 'adiós', 'bye'])) {
      return '¡Con gusto! Estoy aquí cuando me necesites. 🚀';
    }
    if (hasAny(t, ['como funcionas', 'cómo funcionas', 'como funciona', 'cómo funciona', 'que haces', 'qué haces', 'ayuda', 'que puedes', 'qué puedes', 'que puedo pedir', 'como usas', 'que comandos', 'que ordenes', 'qué órdenes'])) {
      return 'Puedo hacer casi todo el trabajo de edición con órdenes como:\n' +
        '• **Textos**: "cambia el título de enero", "edita el texto del hero", "cambia el hito de octubre"\n' +
        '• **Fotos**: "cambia la portada de noviembre", "cambia la foto del hero"\n' +
        '• **Colores**: "pon el título de marzo en dorado", "cambia el fondo del hero a verde"\n' +
        '• **Letra**: "cambia la letra del título a Cinzel", "haz el texto más grande", "ponlo en negrita"\n' +
        '• **Forma/posición**: "centra el título", "redondea la tarjeta", "opacidad 60"\n' +
        '• **Agregar**: "agrega un párrafo en contacto", "agrega una foto en octubre"\n' +
        '• **Gestión**: "guarda", "sincroniza", "respaldos", "cambia la contraseña"';
    }
    if (hasAny(t, ['categoria', 'categorías', 'que venden', 'qué venden', 'linea', 'línea', 'coleccion', 'colección'])) {
      return 'Trabajan todo a la medida: uniformes escolares, batas de laboratorio, reyes magos, disfraces de Halloween, togas y trajes de grado, smoking y trajes de gala, vestidos de fiesta, bailes típicos y clausura, y disfraces navideños.';
    }
    if (hasAny(t, ['medida', 'medidas', 'talla', 'ajuste', 'a medida'])) {
      return 'La especialidad es la confección **100% a la medida**: se toman las medidas y se ajusta cada prenda. No usan tallas estándar.';
    }
    if (hasAny(t, ['idea', 'sugerencia', 'texto para', 'frase', 'eslogan'])) {
      return 'Una idea de texto para una temporada:\n"Vive tu historia con un traje hecho para ti. En El Bodegón de los Trajes llevamos la alta costura a tu medida: grados, clausuras, disfraces y celebraciones que brillan. 💛"';
    }
    if (hasAny(t, ['reclamo', 'queja', 'problema', 'no funciona', 'error'])) {
      return 'Cuéntame qué falló y te ayudo. Se los tropezamos: guarda cada cambio con **Guardar** y súbelos con **Sincronizar**. Si algo de la web falla, recarga y vuelve a entrar.';
    }
    return null;
  }

  /* ----------------------------------------------------------
     EJECUCIÓN DE ÓRDENES
     ---------------------------------------------------------- */
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

    /* ---- 1) MANTENIMIENTO ---- */
    if (hasAny(t, ['guarda ', 'guardar', 'guardado', 'guardame', 'guárdame'])) {
      var sb = toolbarButton('save');
      if (sb) { triggerClick(sb); log('Guardando los cambios en el navegador… 💾 Revisa el aviso del panel.', 'bot'); }
      else log('El botón Guardar está disponible dentro de Enero o usando Sincronizar. Inicia sesión de administrador.', 'bot');
      return;
    }
    if (hasAny(t, ['sincroniza', 'sincronizacion', 'sincronización', 'sincronizar', 'sube a github', 'sube los cambios', 'publica los cambios'])) {
      var sc = toolbarButton('sync');
      if (sc) { triggerClick(sc); log('Sincronizando con GitHub… en un momento se subirán tus cambios. 🔄', 'bot'); }
      else log('No encontré el botón Sincronizar. Inicia sesión de administrador.', 'bot');
      return;
    }
    if (hasAny(t, ['verifica la conexion', 'verifica la conexión', 'verifica conexion', 'verifica conexión', 'probar conexion', 'probar conexión', 'hay conexion', 'hay conexión'])) {
      var vf = toolbarButton('verify');
      if (vf) { triggerClick(vf); log('Verificando la conexión con GitHub. Revisa el indicador en pantalla. ✅', 'bot'); }
      else log('No encontré el botón Verificar. Inicia sesión de administrador.', 'bot');
      return;
    }
    if (hasAny(t, ['descarga los cambios', 'descargar cambios', 'descarga cambios', 'exportar cambios', 'exporta'])) {
      var dl = toolbarButton('export');
      if (dl) { triggerClick(dl); log('Descargando admin-content.json… 📥 Reemplaza el archivo del sitio con ese descargo.', 'bot'); }
      else log('No encontré el botón para descargar. Inicia sesión de administrador.', 'bot');
      return;
    }
    if (hasAny(t, ['respaldo', 'respaldos', 'copia de seguridad', 'backup', 'copias'])) {
      var bk = toolbarButton('backup');
      if (bk) { triggerClick(bk); log('Abriendo los respaldos automáticos. Allí puedes ver y restaurar versiones. 🗂️', 'bot'); }
      else log('No encontré el botón de Respaldos. Inicia sesión de administrador.', 'bot');
      return;
    }
    if (hasAny(t, ['probar alerta', 'alerta de prueba', 'probar notificacion', 'probar notificación'])) {
      var nt = toolbarButton('notify');
      if (nt) { triggerClick(nt); log('Enviando una alerta de prueba al correo del administrador. 🔔', 'bot'); }
      else log('No encontré el botón de alerta. Inicia sesión de administrador.', 'bot');
      return;
    }

    /* ---- 2) SEGURIDAD: no sobreexponer información ---- */
    if (isCredentialAsk(text)) {
      log('Eso es **información interna** y no la revelo por seguridad. 🙈\nEn cambio sí puedo: editar textos y fotos, cambiar colores, letra, tamaños y posiciones, agregar contenido y gestionar el panel.', 'bot');
      return;
    }
    /* "Cambia la contraseña" → abrir la herramienta nativa (sin mostrar datos) */
    if (/cambia|cambio|cambiar|actualiza|actualizar|renueva|renovar/.test(t) && /contraseña|contrasena|password|clave/.test(t)) {
      var pw = toolbarButton('password');
      if (pw) { triggerClick(pw); log('Abriendo la herramienta de **cambiar contraseña**. Define la nueva en el panel; el sistema la guarda de forma segura. 🔒', 'bot'); }
      else log('Inicia sesión de administrador para poder cambiar la contraseña.', 'bot');
      return;
    }

    /* ---- 3) AGREGAR CONTENIDO ---- */
    var addType = null;
    if (hasAny(t, ['agrega una tarjeta', 'agregar tarjeta', 'agrega tarjeta', 'nueva tarjeta', 'publica una tarjeta', 'agregar una tarjeta'])) addType = 'tarjeta';
    else if (hasAny(t, ['agrega un parrafo', 'agregar parrafo', 'agrega un párrafo', 'agregar párrafo', 'nuevo parrafo', 'nuevo párrafo', 'agrega texto', 'agregar texto'])) addType = 'parrafo';
    else if (hasAny(t, ['agrega un titulo', 'agregar titulo', 'agrega un título', 'agregar título', 'nuevo titulo', 'nuevo título', 'nuevo encabezado'])) addType = 'titulo';
    else if (hasAny(t, ['agrega una foto', 'agregar foto', 'agrega foto', 'nueva foto', 'agregar una foto', 'subir foto nueva', 'agrega una imagen', 'agregar imagen'])) addType = 'foto';

    if (addType) {
      var sectionAdd = detectSection(text);
      revealSection(sectionAdd);
      var ab = addContentButton(sectionAdd, addType);
      if (!ab) {
        log('No encontré el botón "+ Agregar ' + addType + '" en ' + describeSection(sectionAdd) + '. Prueba otra sección.', 'bot');
        return;
      }
      var labelAdd = { parrafo: 'párrafo', titulo: 'título', foto: 'foto', tarjeta: 'tarjeta' }[addType];
      log('Abriendo el formulario para **agregar un ' + labelAdd + '** en ' + describeSection(sectionAdd) + '. Completa los campos y pulsa Publicar.', 'bot');
      triggerClick(ab);
      return;
    }

    /* ---- 4) FOTOS / PORTADAS (salvo que hable de COLOR del fondo) ---- */
    var isPhotoLike = /\bfoto\b|\bimagen\b|\bportada\b|\bfondo\b|\bfotos\b/.test(t);
    var hasColorData = parseColorValue(t) !== null || /\bcolor\b/.test(t);
    if (isPhotoLike && !hasColorData) {
      var sectionPhoto = detectSection(text);
      revealSection(sectionPhoto);
      var ph = photoButton(sectionPhoto);
      if (!ph) {
        log('No encontré el botón de portada para ' + describeSection(sectionPhoto) + '.', 'bot');
        return;
      }
      log('Abriendo la herramienta para **cambiar la foto/portada** de ' + describeSection(sectionPhoto) + '. Elige la imagen nueva y pulsa Aplicar.', 'bot');
      triggerClick(ph);
      return;
    }

    /* ---- 5) ESTILO VISUAL (colores, letra, tamaño, posición…) ---- */
    var isStyle = hasAny(t, ['color', 'fondo', 'fondo de color', 'color de fondo', 'letra', 'fuente', 'tipografia', 'tipografía', 'tamano', 'tamaño',
      'grande', 'grandes', 'pequeno', 'pequeño', 'pequenos', 'pequeños', 'agranda', 'negrita', 'negritas', 'bold', 'gordita',
      'grueso', 'gruesa', 'delgado', 'delgada', 'fino', 'fina', 'light', 'ancho', 'alto', 'mueve', 'mover', 'posicion', 'posición',
      'arriba', 'abajo', 'izquierda', 'derecha', 'centro', 'centrado', 'centrada', 'centra', 'centrar', 'opacidad', 'transparencia', 'opacity',
      'borde', 'border', 'radio', 'redondea', 'redondear', 'redondeado', 'esquinas', 'restablece', 'restablecer',
      'quita el estilo', 'quita los estilos', 'estilo visual']);
    if (isStyle) {
      applyStyleCommand(text);
      return;
    }

    /* ---- 6) EDICIÓN DE TEXTOS (título / subtítulo / hito) ---- */
    var lookEdit = hasAny(t, ['cambia', 'cambio', 'edita', 'modifica', 'actualiza', 'pon ', 'titulo', 'título', 'titular',
      'subtitulo', 'subtítulo', 'texto', 'parrafo', 'párrafo', 'hito', 'lema', 'descripcion', 'descripción', 'encabezado']);
    if (lookEdit) {
      var secEdit = detectSection(text);
      var action = 'texto';
      if (hasAny(t, ['titulo', 'título', 'titular', 'encabezado'])) action = 'titulo';
      else if (hasAny(t, ['hito'])) action = 'hito';
      revealSection(secEdit);
      var target = textTarget(secEdit, action);
      if (!target) {
        var what = action === 'titulo' ? 'el título' : (action === 'hito' ? 'el hito' : 'el texto');
        log('No encontré ' + what + ' de ' + describeSection(secEdit) + ' para editar. Prueba: "cambia el título de marzo", "edita el texto del hero" o "cambia el hito de octubre".', 'bot');
        return;
      }
      var labels = { titulo: 'el título', hito: 'el hito', texto: 'el texto' };
      log('Abriendo la herramienta para cambiar **' + (labels[action] || 'el texto') + '** de "' + describeSection(secEdit) + '"… Te muestro el elemento y abro el editor. ✏️', 'bot');
      triggerClick(target);
      return;
    }

    /* ---- 7) CONSULTA LIBRE ---- */
    var ans = freeAnswer(text);
    if (ans) { log(ans, 'bot'); return; }

    log('Puedo ayudarte a **editar** (textos, fotos, colores, letra, tamaños, posiciones), **agregar contenido** (párrafos, títulos, fotos, tarjetas) o **gestionar** (guardar, sincronizar, respaldos, cambiar contraseña).\nEjemplos: "cambia el color del título de enero", "agrega un párrafo en contacto", "sincroniza".', 'bot');
  }

  /* ----------------------------------------------------------
     UI
     ---------------------------------------------------------- */
  if (document.getElementById('elbodegon-admin-ai')) return;

  var root = document.createElement('div');
  root.id = 'elbodegon-admin-ai';
  root.innerHTML =
    '<button class="admin-ai-launch" id="admin-ai-launch" aria-label="Asistente del administrador" title="Asistente: edita fotos, textos, colores y letra">' +
    '  <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l1.9 5.1L19 9l-5.1 1.9L12 16l-1.9-5.1L5 9l5.1-1.9L12 2zM19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14zM6 12l.9 2.1L9 15l-2.1.9L6 18l-.9-2.1L3 15l2.1-.9L6 12z"/></svg>' +
    '</button>' +
    '<div class="admin-ai" id="admin-ai-panel" role="dialog" aria-label="Asistente del administrador">' +
    '  <div class="admin-ai-head">' +
    '    <div class="admin-ai-ava">✨</div>' +
    '    <div>' +
    '      <div class="admin-ai-title">Asistente del Administrador</div>' +
    '      <div class="admin-ai-sub">Edición: fotos, párrafos, colores, letra y más</div>' +
    '    </div>' +
    '  </div>' +
    '  <div class="admin-ai-body" id="admin-ai-body"></div>' +
    '  <div class="admin-ai-foot">' +
    '    <input class="admin-ai-input" id="admin-ai-input" type="text" placeholder="Ej: pon el título de enero en dorado" autocomplete="off" />' +
    '    <button class="admin-ai-go" id="admin-ai-go" type="button">Ir</button>' +
    '  </div>' +
    '  <div class="admin-ai-hint">Ejemplos: <b>foto del hero</b> · <b>color del título de marzo</b> · <b>letra más grande</b> · ' +
    '    <b>agrega un párrafo en contacto</b> · <b>centra el título</b> · <b>sincroniza</b></div>' +
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
      m.innerHTML = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
      body.appendChild(m);
      body.scrollTop = body.scrollHeight;
    } catch (e) {}
  }

  function chips(list) {
    try {
      var w = document.createElement('div');
      w.className = 'admin-ai-chipwrap';
      list.forEach(function (tc) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'admin-ai-chip'; b.textContent = tc;
        b.addEventListener('click', function () { runCommand(tc); });
        w.appendChild(b);
      });
      body.appendChild(w);
      body.scrollTop = body.scrollHeight;
    } catch (e) {}
  }

  function welcome() {
    try {
      log('¡Hola! Soy tu asistente de **edición**. Te ayudo a cambiar fotos, párrafos, títulos, colores, letra, tamaños y posiciones con órdenes simples.');
      chips([
        'Cambiar la foto del hero',
        'Cambiar el color del título de enero',
        'Poner el título del hero en dorado',
        'Letra del título más grande',
        'Agregar un párrafo en contacto',
        'Centrar el titular de marzo',
        'Guardar y sincronizar'
      ]);
    } catch (e) {}
  }

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