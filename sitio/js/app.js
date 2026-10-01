    // Header Effect (optimizado con rAF y listener pasivo para 60fps)
    let headerTicking = false;
    window.addEventListener('scroll', () => {
      if (!headerTicking) {
        window.requestAnimationFrame(() => {
          const header = document.getElementById('main-header');
          if (header) {
            if (window.scrollY > 60) header.classList.add('scrolled');
            else header.classList.remove('scrolled');
          }
          headerTicking = false;
        });
        headerTicking = true;
      }
    }, { passive: true });

    // Contacto por WhatsApp (el sitio no tiene formulario ni correo).

    // Season Tabs
    const seasonSection = document.getElementById('temporadas');

    const monthBtnLabels = {
      enero: 'Descubre la Magia de Reyes',
      febrero: 'Enamora con Estilo',
      marzo: 'Brilla en Carnaval',
      abril: 'Viste la Primavera',
      mayo: 'Elegancia Floral',
      junio: 'Rayos de Sol y Gala',
      julio: 'Frescura Tropical',
      agosto: 'Otoño Dorado',
      septiembre: 'Renuévate con Clase',
      octubre: 'Disfraces de Halloween y de Baile',
      noviembre: 'Graduación y Clausura te Espera',
      diciembre: 'La Navidad nos Viste'
    };
    const monthSubtitles = {
      enero: 'Reyes, uniformes y bautizos para arrancar el año con estilo.',
      febrero: 'Carnaval, San Valentín y bodas confeccionados a tu medida.',
      marzo: 'Disfraces coloridos y comparsas para el carnaval más vivo.',
      abril: 'Trajes frescos y elegantes para la primavera más radiante.',
      mayo: 'Flores, elegancia y tradición para un mayo inolvidable.',
      junio: 'Sol, brillo y celebración con la mejor costura.',
      julio: 'Frescura, baile y color para el verano colombiano.',
      agosto: 'Caen las hojas, sube el estilo con nuestra nueva colección.',
      septiembre: 'Renueva tu guardarropa con piezas únicas y modernas.',
      octubre: 'Disfraces terroríficos y trajes de baile para clausuras y eventos.',
      noviembre: 'Grados, clausuras y ceremonias. Cotiza tu traje hoy.',
      diciembre: 'La navidad se viste aquí. Brilla en cada celebración.'
    };
    // Muestra en cada píldora de la cinta su nombre de temporada + contenido
    document.querySelectorAll('.season-tab').forEach((tab) => {
      if (!tab.dataset || !tab.dataset.month) return;
      if (tab.querySelector('.tab-desc')) return;
      const sub = monthSubtitles[tab.dataset.month] || '';
      if (!sub) return;
      const desc = document.createElement('span');
      desc.className = 'tab-desc';
      desc.textContent = sub;
      tab.appendChild(desc);
    });
    document.querySelectorAll('.season-panel').forEach((panel) => {
      if (panel.querySelector('.halloween-landing')) return;
      const month = panel.dataset.panel;
      const monthName = month.charAt(0).toUpperCase() + month.slice(1);
      const btnLabel = monthBtnLabels[month] || 'Entrar al Callejón';
      const sub = monthSubtitles[month] || 'Viste tu imaginación, vive tu historia.';
      const landing = document.createElement('div');
      landing.className = 'halloween-landing';
      landing.setAttribute('data-landing', month);
      landing.innerHTML =
        '<span class="season-milestone">Temporada de ' + monthName + '</span>' +
        '<h3 class="halloween-landing-title">El Bodegón de los Trajes te trae la colección de <span>' + monthName + '</span> · Tunja</h3>' +
        '<p class="halloween-landing-sub">' + sub + '</p>' +
        '<button class="btn-haunted" type="button" data-enter="' + month + '">' + btnLabel + '</button>' +
        '<button class="admin-season-photo-btn admin-ui" type="button" data-season-photo="' + month + '" title="Cambiar foto de portada">Cambiar portada</button>';
      const content = document.createElement('div');
      content.className = 'halloween-content';
      content.setAttribute('data-content', month);
      while (panel.firstChild) content.appendChild(panel.firstChild);
      panel.appendChild(landing);
      panel.appendChild(content);
    });

    function getLanding(month) {
      return document.querySelector('.halloween-landing[data-landing="' + month + '"]') ||
             document.getElementById('halloween-landing');
    }

    function getContent(month) {
      return document.querySelector('.halloween-content[data-content="' + month + '"]') ||
             document.getElementById('halloween-content');
    }

    /* Primer bloque con contenido real de una temporada: el h1/hero y, si no
       hubiera, la primera seccion del catalogo. Sirve para desplazar la pagina
       hasta algo visible al abrir una temporada (la portada oculta el resto
       con display:none, asi que medir su caja daria siempre 0). */
    function firstContentBlock(month) {
      const content = getContent(month);
      if (!content) return null;
      return content.querySelector('.season-hero') ||
             content.querySelector('.season-sub-sections > *') ||
             content.firstElementChild || content;
    }

    function resetSeasonGates() {
      document.querySelectorAll('.halloween-landing').forEach((l) => l.classList.remove('is-visible'));
      document.querySelectorAll('.halloween-content').forEach((c) => c.classList.remove('is-visible'));
    }

    function showLanding(month) {
      if (document.body.classList.contains('admin-edit-mode')) {
        revealContent(month);
        return;
      }
      const landing = getLanding(month);
      const content = getContent(month);
      if (landing) landing.classList.add('is-visible');
      if (content) content.classList.remove('is-visible');
    }

    function revealContent(month) {
      const landing = getLanding(month);
      const content = getContent(month);
      if (landing) landing.classList.remove('is-visible');
      if (content) {
        content.classList.add('is-visible');
        content.querySelectorAll('.reveal:not(.is-revealed)').forEach((el) => el.classList.add('is-revealed'));
      }
    }

    function selectSeason(month) {
      if (!month) return;
      document.querySelectorAll('.season-tab').forEach((t) => {
        const isMatch = t.dataset.month === month;
        t.classList.toggle('is-active', isMatch);
        t.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      });
      document.querySelectorAll('.season-panel').forEach((p) => {
        p.classList.toggle('is-active', p.dataset.panel === month);
      });
      if (seasonSection) seasonSection.dataset.season = month;
      resetSeasonGates();
      showLanding(month);
      if (window.__centerMarqueeOn) window.__centerMarqueeOn(month);
      // Elegir temporada deja la cinta quieta en la portada de esa temporada
      document.querySelectorAll('.season-marquee').forEach((m) => {
        if (m.__lockTape) m.__lockTape(month);
      });
    }
    window.selectSeason = selectSeason;

    /* Abre una temporada: quita la portada, ensena el contenido y lleva la
       pagina hasta el primer bloque con texto. Se usa al tocar una pestaña, al
       elegir una temporada desde el menu y al pulsar "Entrar", para que las tres
       rutas se comporten igual. */
    function openSeason(month) {
      revealContent(month);
      const target = firstContentBlock(month);
      if (!target) return;
      if (mqMobile.matches && navMenu && navMenu.classList.contains('is-open')) closeMenu();
      setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    }

    document.querySelectorAll('.season-tab').forEach((tab) => {
      tab.addEventListener('click', (e) => {
        if (document.body.classList.contains('admin-edit-mode') && e.target.closest('.tab-desc')) return;
        const month = tab.dataset.month;
        selectSeason(month);
        /* Elegir una temporada desde la cinta la abre directamente: solo la
           carga inicial de la pagina muestra la portada y el boton "Entrar". */
        openSeason(month);
      });
    });

    // Estado inicial: enero
    resetSeasonGates();
    showLanding('enero');

    const MONTH_ORDER = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    // Flechas de la cinta transportadora
    const activeMonth = () => {
      if (seasonSection && seasonSection.dataset.season) {
        return seasonSection.dataset.season;
      }
      const activeTab = document.querySelector('.season-tab.is-active');
      return activeTab ? activeTab.dataset.month : 'enero';
    };

    const visibleMonths = () => {
      const activeTabs = Array.from(document.querySelectorAll('.season-tabs[role="tablist"] .season-tab'))
        .filter((t) => t.style.display !== 'none')
        .map((t) => t.dataset.month)
        .filter(Boolean);
      const unique = [...new Set(activeTabs)];
      return unique.length ? unique : MONTH_ORDER;
    };

    const moveSeason = (dir) => {
      const list = visibleMonths();
      if (!list.length) return;
      const cur = activeMonth();
      let idx = list.indexOf(cur);
      if (idx === -1) idx = 0;
      let next;
      if (dir === 'next') {
        next = list[(idx + 1) % list.length];
      } else {
        next = list[(idx - 1 + list.length) % list.length];
      }
      if (next) {
        selectSeason(next);
      }
    };

    document.querySelectorAll('.season-marquee-prev').forEach((b) => {
      b.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        moveSeason('prev');
      });
    });
    document.querySelectorAll('.season-marquee-next').forEach((b) => {
      b.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        moveSeason('next');
      });
    });

    // Drag/swipe en la cinta: arrastrar con ratón o dedo para desplazar
    (function initMarqueeDrag() {
      var marquees = document.querySelectorAll('.season-marquee');
      marquees.forEach(function (marquee) {
        var track = marquee.querySelector('.season-marquee-track');
        if (!track) return;

        var dragging = false, startX = 0, startY = 0, startTx = 0;
        var lastX = 0, lastTime = 0;
        var velocity = 0, momentumRaf = null, moved = false, holdTimer = null;
        var HOLD_MS = 2500;
        var IDLE_RESUME_MS = 8000;
        var locked = false, resumeAfterTap = false, idleTimer = null;

        function getTranslateX() {
          var cs = getComputedStyle(track);
          var m = cs.transform && cs.transform.match(/matrix\(.*?,.*?,.*?,.*?,\s*([^,]+)/);
          return m ? parseFloat(m[1]) : 0;
        }

        function parsePx(val) {
          if (typeof val === 'number') return val;
          var n = parseFloat(val);
          return isNaN(n) ? 0 : n;
        }

        function setTx(x) {
          track.style.transform = 'translateX(' + x + 'px)';
        }

        function pauseAnim() {
          /* Congela la posición actual: si solo se apaga la animación, el
             transform vuelve a "none" y la cinta salta de golpe al inicio. */
          var tx = getTranslateX();
          if (tx) setTx(tx);
          track.dataset._savedAnim = track.style.animation || '';
          track.style.animation = 'none';
        }

        function resumeAnimFrom(tx) {
          /* En modo admin la cinta queda pausada (para editar con doble clic);
             el arrastre deja el desplazamiento fijo en su sitio, sin reanudar. */
          if (document.body.classList.contains('admin-edit-mode')) return;
          if (locked) return;
          /* Libera el transform inline congelado: si se mantiene, el estilo
             inline gana a la animación y la cinta se queda quieta para siempre. */
          track.style.transform = '';
          track.style.animation = '';
          void track.offsetWidth;
          var halfW = track.scrollWidth / 2 || 1;
          /* La animación va de translateX(0) a translateX(-50%): para reanudar
             justo donde se pausó hace falta un retardo NEGATIVO
             (delay = tx/halfW * dur). Con el signo invertido la cinta
             quedaba esperando en el origen y saltaba de golpe. */
          var dur = parseFloat(getComputedStyle(track).animationDuration) || 22;
          var delay = (tx / halfW) * dur;
          track.style.animationDelay = delay + 's';
        }

        /* Mantiene la cinta quieta un momento: en pantallas táctiles las
           pestañas se desplazan y sería imposible volver a tocarlas. */
        function holdStill(ms) {
          if (document.body.classList.contains('admin-edit-mode')) return;
          /* Si la cinta esta fijada por una temporada elegida, el reanudar
             automatico no lo decide este temporizador sino el de inactividad. */
          if (locked) { clearTimeout(holdTimer); holdTimer = null; pauseAnim(); return; }
          clearTimeout(holdTimer);
          pauseAnim();
          holdTimer = setTimeout(function () {
            holdTimer = null;
            resumeAnimFrom(getTranslateX());
          }, ms);
        }

        /* Cuenta 8 s sin que se toque la cinta; si se cumplen, vuelve a rotar
           para que los meses sigan pasando y siempre haya uno a la vista. */
        function scheduleIdleResume() {
          clearTimeout(idleTimer);
          idleTimer = null;
          if (!locked) return;
          if (document.body.classList.contains('admin-edit-mode')) return;
          idleTimer = setTimeout(function () {
            idleTimer = null;
            unlockTape();
          }, IDLE_RESUME_MS);
        }

        /* Suelta el fiado: o bien porque pasaron los 8 s de inactividad, o bien
           porque el usuario volvio a tocar la cinta fuera de las pestanas. */
        function unlockTape() {
          clearTimeout(idleTimer);
          idleTimer = null;
          if (!locked) return;
          locked = false;
          clearTimeout(holdTimer);
          holdTimer = null;
          resumeAnimFrom(getTranslateX());
        }

        /* Si la temporada elegida quedo fuera de la vista (p. ej. se llego con
           las flechas) se centra; si ya se ve bien no se mueve nada, para que
           el click no de un salto. */
        function ensureTabVisible(month, smooth) {
          if (!month) return;
          var tabs = track.querySelectorAll('.season-tab[data-month="' + month + '"]');
          if (!tabs.length) return;
          var m = marquee.getBoundingClientRect();

          // Buscar la instancia de la pestaña más cercana al centro
          var best = null, bestDist = Infinity;
          for (var i = 0; i < tabs.length; i++) {
            var r = tabs[i].getBoundingClientRect();
            var d = Math.abs((r.left + r.width / 2) - (m.left + m.width / 2));
            if (d < bestDist) { bestDist = d; best = r; }
          }
          if (!best) return;
          var halfW = track.scrollWidth / 2 || 1;
          var delta = (best.left + best.width / 2) - (m.left + m.width / 2);
          var tx = getTranslateX() - delta;
          tx = (((tx % halfW) + halfW) % halfW) - halfW;
          if (smooth) {
            track.style.transition = 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)';
            setTx(tx);
            setTimeout(function () {
              track.style.transition = '';
            }, 360);
          } else {
            setTx(tx);
          }
        }

        function lockTape(month) {
          locked = true;
          resumeAfterTap = false;
          clearTimeout(holdTimer);
          holdTimer = null;
          pauseAnim();
          ensureTabVisible(month, true);
          scheduleIdleResume();
        }

        marquee.__lockTape = lockTape;

        function onDown(px, py) {
          if (momentumRaf) { cancelAnimationFrame(momentumRaf); momentumRaf = null; }
          clearTimeout(holdTimer);
          holdTimer = null;
          dragging = true;
          moved = false;
          startX = px;
          startY = py;
          startTx = getTranslateX();
          lastX = px;
          lastTime = Date.now();
          velocity = 0;
          pauseAnim();
          /* NO se marca "is-dragging" aquí: esa clase pone pointer-events:none
             sobre las pestañas y el navegador reenvía el toque al contenedor,
             Así que un simple toque nunca activaba la temporada. */
        }

        function onMove(px) {
          if (!dragging) return;
          var dx = px - startX;
          if (!moved && Math.abs(dx) > 10) {
            moved = true;
            track.classList.add('is-dragging');
          }
          if (!moved) return;
          setTx(startTx + dx);
          var now = Date.now();
          var dt = now - lastTime;
          if (dt > 0) velocity = (px - lastX) / dt;
          lastX = px;
          lastTime = now;
        }

        function onUp() {
          if (!dragging) return;
          dragging = false;
          track.classList.remove('is-dragging');
          var tx = getTranslateX();

          // Toque simple (sin arrastre): deja la cinta quieta para poder repetir el toque
          if (!moved) {
            if (resumeAfterTap) {
              resumeAfterTap = false;
              resumeAnimFrom(getTranslateX());
            } else {
              holdStill(HOLD_MS);
            }
            return;
          }

          // Inertia: desacelerar con la velocidad capturada
          var vel = velocity * 16;
          var friction = 0.92;
          function step() {
            vel *= friction;
            tx += vel;
            setTx(tx);
            if (Math.abs(vel) > 0.3) {
              momentumRaf = requestAnimationFrame(step);
            } else {
              momentumRaf = null;
              holdStill(HOLD_MS);
            }
          }
          if (Math.abs(vel) > 1) {
            momentumRaf = requestAnimationFrame(step);
          } else {
            holdStill(HOLD_MS);
          }
        }

        // Al enfocar una pestaña (teclado o toque) la cinta se detiene un momento
        marquee.addEventListener('focusin', function () {
          holdStill(HOLD_MS);
          scheduleIdleResume();
        });
        marquee.addEventListener('pointerdown', function (e) {
          /* Cualquier contacto con la cinta reinicia la cuenta de 8 s. */
          scheduleIdleResume();
          /* Volver a tocar el FONDO de la cinta la reanuda. Si el toque cae en
             una pestaña no se reanuda: ese click elige temporada y la vuelve a
             fijar. Las flechas tampoco, porque cambian de temporada. */
          var onTab = !!e.target.closest('.season-tab');
          var onArrow = !!e.target.closest('.season-marquee-arrow');
          if (!onTab && !onArrow) {
            if (locked) { unlockTape(); resumeAfterTap = true; return; }
          } else if (locked) {
            holdStill(HOLD_MS);
            return;
          }
          if (e.pointerType === 'mouse') return;
          holdStill(HOLD_MS);
        }, { passive: true });

        // Mouse events
        var lastTouch = 0;
        function isGhostMouse() { return Date.now() - lastTouch < 500; }

        function onDocMouseMove(e) {
          if (!dragging) return;
          if (Math.abs(e.clientX - startX) > 10) {
            e.preventDefault();
          }
          onMove(e.clientX);
        }

        function onDocMouseUp() {
          if (dragging) {
            document.removeEventListener('mousemove', onDocMouseMove);
            document.removeEventListener('mouseup', onDocMouseUp);
            onUp();
          }
        }

        marquee.addEventListener('mousedown', function (e) {
          if (e.button !== 0) return;
          if (isGhostMouse()) return;
          if (e.target.closest('.season-marquee-arrow')) return;
          // Si el clic es sobre una pestaña de temporada, no prevenimos por defecto para permitir activación inmediata con un solo clic
          if (!e.target.closest('.season-tab')) {
            e.preventDefault();
          }
          onDown(e.clientX, e.clientY);
          document.addEventListener('mousemove', onDocMouseMove);
          document.addEventListener('mouseup', onDocMouseUp);
        });

        // Touch events
        marquee.addEventListener('touchstart', function (e) {
          lastTouch = Date.now();
          if (e.target.closest('.season-marquee-arrow')) return;
          var t = e.touches[0];
          onDown(t.clientX, t.clientY);
        }, { passive: true });
        marquee.addEventListener('touchmove', function (e) {
          if (!dragging) return;
          var t = e.touches[0];
          var dx = Math.abs(t.clientX - startX);
          var dy = Math.abs(t.clientY - startY);
          if (dx > 10 && dx > dy * 1.5) e.preventDefault();
          onMove(t.clientX);
        }, { passive: false });
        marquee.addEventListener('touchend', function () { onUp(); }, { passive: true });
        marquee.addEventListener('touchcancel', function () { onUp(); }, { passive: true });
      });
    })();

    // Interactive Menu
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navClose = document.getElementById('nav-close');
    const navOverlay = document.getElementById('nav-overlay');
    const mqMobile = window.matchMedia('(max-width: 900px)');

    function closeMenu() {
      navMenu.classList.remove('is-open');
      menuToggle.classList.remove('is-active');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Abrir menú');
      document.body.classList.remove('menu-open');
      document.querySelectorAll('.has-dropdown').forEach((li) => {
        li.classList.remove('is-open');
        li.querySelector('.dropdown-toggle').setAttribute('aria-expanded', 'false');
      });
    }

    function openMenu() {
      navMenu.classList.add('is-open');
      menuToggle.classList.add('is-active');
      menuToggle.setAttribute('aria-expanded', 'true');
      menuToggle.setAttribute('aria-label', 'Cerrar menú');
      document.body.classList.add('menu-open');
    }

    /* En móvil el panel es la única forma de ver las 12 temporadas,
       así que "Temporadas" aparece siempre desplegado. */
    const seasonsDropdown = document.querySelector('#nav-menu .dropdown-grid')
      ? document.querySelector('#nav-menu .dropdown-grid').closest('.has-dropdown')
      : null;

    function expandSeasonsDropdown() {
      if (!seasonsDropdown) return;
      seasonsDropdown.classList.add('is-open');
      seasonsDropdown.querySelector('.dropdown-toggle').setAttribute('aria-expanded', 'true');
    }

    menuToggle.addEventListener('click', () => {
      if (navMenu.classList.contains('is-open')) {
        closeMenu();
      } else {
        openMenu();
        if (mqMobile.matches) expandSeasonsDropdown();
      }
    });

    if (navClose) {
      navClose.addEventListener('click', closeMenu);
    }

    if (navOverlay) {
      navOverlay.addEventListener('click', closeMenu);
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
        closeMenu();
        menuToggle.focus();
      }
    });

    // Al volver a desktop, limpia el estado del panel móvil
    mqMobile.addEventListener('change', (e) => {
      if (!e.matches) closeMenu();
    });

    // Dropdown toggles (click)
    document.querySelectorAll('.dropdown-toggle').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const li = btn.closest('.has-dropdown');
        const isOpen = li.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', isOpen);
        document.querySelectorAll('.has-dropdown').forEach((other) => {
          if (other !== li) {
            other.classList.remove('is-open');
            other.querySelector('.dropdown-toggle').setAttribute('aria-expanded', 'false');
          }
        });
        if (li === seasonsDropdown && mqMobile.matches) expandSeasonsDropdown();
      });
    });

    // Close menu and dropdowns when a link is chosen
    document.querySelectorAll('#nav-menu a').forEach((link) => {
      link.addEventListener('click', () => {
        closeMenu();
      });
    });

    // Season shortcuts (abrir directamente la temporada elegida)
    document.querySelectorAll('a[data-tab][href="#temporadas"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const linkedMonth = link.dataset.tab;
        selectSeason(linkedMonth);
        e.preventDefault();
        openSeason(linkedMonth);
      });
    });

    // Entrar a la temporada: revela todo el contenido e información del mes activo
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-enter]');
      if (!btn) return;
      openSeason(btn.dataset.enter);
    });

    // Cerrar menú o dropdowns al hacer clic afuera
    document.addEventListener('click', (e) => {
      // Si el menú móvil está abierto y el clic fue fuera del drawer y fuera del botón hamburguesa
      if (mqMobile.matches && navMenu.classList.contains('is-open')) {
        if (!e.target.closest('#nav-menu') && !e.target.closest('#menu-toggle') && !e.target.closest('#nav-close')) {
          closeMenu();
          return;
        }
      }
      if (!e.target.closest('.has-dropdown')) {
        document.querySelectorAll('.has-dropdown.is-open').forEach((li) => {
          li.classList.remove('is-open');
          const toggle = li.querySelector('.dropdown-toggle');
          if (toggle) toggle.setAttribute('aria-expanded', 'false');
        });
      }
    });

    // Highlight the active section in the menu
    const spyLinks = [...document.querySelectorAll('#nav-menu a[href^="#"]:not([data-tab])')];
    const spySections = spyLinks
      .map((a) => document.querySelector(a.getAttribute('href')))
      .filter(Boolean);

    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          spyLinks.forEach((a) => {
            a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
          });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    spySections.forEach((s) => spy.observe(s));

    // Lightbox: abre cada foto del catálogo ampliada
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.innerHTML =
      '<img alt="Foto ampliada">' +
      '<button type="button" class="lightbox-close" aria-label="Cerrar">&times;</button>';
    document.body.appendChild(lightbox);

    const lightboxImg = lightbox.querySelector('img');
    const lightboxClose = lightbox.querySelector('.lightbox-close');

    function openLightbox(src) {
      lightboxImg.src = src;
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    document.querySelectorAll('.img-ghost img').forEach((img) => {
      img.addEventListener('click', (e) => {
        if (document.body.classList.contains('admin-edit-mode')) return;
        e.preventDefault();
        openLightbox(img.currentSrc || img.src);
      });
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });

    // Reveal al hacer scroll (respetando prefers-reduced-motion)
    const revealTargets = document.querySelectorAll(
      '.section-head, .card-ghost, .season-catalog, .season-subsection, .season-hero, .season-item, .contact-card, .contact-form-container, .footer-col'
    );
    if ('IntersectionObserver' in window) {
      revealTargets.forEach((el, i) => {
        el.classList.add('reveal');
        el.style.setProperty('--d', ((i % 6) * 90) + 'ms');
      });
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
      revealTargets.forEach((el) => revealObserver.observe(el));
    }

    // vCard: descargar contacto con nombre ELBODEGONDELOSTRAJES
    // (eliminado junto con los elementos de descarga de contacto)
