    // Header Effect
    window.onscroll = () => {
      const header = document.getElementById('main-header');
      if (window.scrollY > 100) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    }

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

    document.querySelectorAll('.season-tab').forEach((tab) => {
      tab.addEventListener('click', (e) => {
        if (document.body.classList.contains('admin-edit-mode') && e.target.closest('.tab-desc')) return;
        document.querySelectorAll('.season-tab').forEach((t) => {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.season-panel').forEach((p) => {
          p.classList.remove('is-active');
        });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
        document.querySelector('.season-panel[data-panel="' + tab.dataset.month + '"]').classList.add('is-active');
        if (seasonSection) seasonSection.dataset.season = tab.dataset.month;
        resetSeasonGates();
        showLanding(tab.dataset.month);
        if (window.__centerMarqueeOn) window.__centerMarqueeOn(tab.dataset.month);
      });
    });

    // Estado inicial: enero
    resetSeasonGates();
    showLanding('enero');

    // Flechas de la cinta transportadora
    const seasonTabsAll = () => Array.from(document.querySelectorAll('.season-tabs[role="tablist"] .season-tab'));
    const activeMonth = () => {
      const activeTab = seasonTabsAll().find((t) => t.classList.contains('is-active'));
      return activeTab ? activeTab.dataset.month : 'enero';
    };
    const visibleMonths = () => seasonTabsAll()
      .filter((t) => t.style.display !== 'none')
      .map((t) => t.dataset.month);

    const moveSeason = (dir) => {
      const list = visibleMonths();
      if (!list.length) return;
      const cur = activeMonth();
      const idx = list.indexOf(cur);
      let next;
      if (dir === 'next') {
        next = list[(idx + 1) % list.length];
      } else {
        next = list[(idx - 1 + list.length) % list.length];
      }
      if (next && next !== cur) {
        const tab = document.querySelector('.season-tabs[role="tablist"] .season-tab[data-month="' + next + '"]');
        if (tab) tab.click();
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
        var velocity = 0, momentumRaf = null;

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
          track.dataset._savedAnim = track.style.animation || '';
          track.style.animation = 'none';
        }

        function resumeAnimFrom(tx) {
          /* En modo admin la cinta queda pausada (para editar con doble clic);
             el arrastre deja el desplazamiento fijo en su sitio, sin reanudar. */
          if (document.body.classList.contains('admin-edit-mode')) return;
          track.style.animation = '';
          void track.offsetWidth;
          var halfW = track.scrollWidth / 2 || 1;
          var pct = tx / halfW;
          var dur = parseFloat(getComputedStyle(track).animationDuration) || 22;
          var delay = -pct * dur;
          track.style.animationDelay = delay + 's';
        }

        function onDown(px, py) {
          if (momentumRaf) { cancelAnimationFrame(momentumRaf); momentumRaf = null; }
          dragging = true;
          startX = px;
          startY = py;
          startTx = getTranslateX();
          lastX = px;
          lastTime = Date.now();
          velocity = 0;
          pauseAnim();
          track.classList.add('is-dragging');
        }

        function onMove(px) {
          if (!dragging) return;
          var dx = px - startX;
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
              resumeAnimFrom(tx);
            }
          }
          if (Math.abs(vel) > 1) {
            momentumRaf = requestAnimationFrame(step);
          } else {
            resumeAnimFrom(tx);
          }
        }

        // Mouse events
        marquee.addEventListener('mousedown', function (e) {
          if (e.button !== 0) return;
          if (e.target.closest('.season-marquee-arrow')) return;
          e.preventDefault();
          onDown(e.clientX, e.clientY);
        });
        document.addEventListener('mousemove', function (e) {
          if (!dragging) return;
          e.preventDefault();
          onMove(e.clientX);
        });
        document.addEventListener('mouseup', function () {
          if (dragging) onUp();
        });

        // Touch events
        marquee.addEventListener('touchstart', function (e) {
          if (e.target.closest('.season-marquee-arrow')) return;
          var t = e.touches[0];
          onDown(t.clientX, t.clientY);
        }, { passive: true });
        marquee.addEventListener('touchmove', function (e) {
          if (!dragging) return;
          var t = e.touches[0];
          var dx = Math.abs(t.clientX - startX);
          var dy = Math.abs(t.clientY - startY);
          if (dx > 8 && dx > dy * 1.5) e.preventDefault();
          onMove(t.clientX);
        }, { passive: false });
        marquee.addEventListener('touchend', function () { onUp(); }, { passive: true });
        marquee.addEventListener('touchcancel', function () { onUp(); }, { passive: true });
      });
    })();

    // Interactive Menu
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');

    menuToggle.addEventListener('click', () => {
      const open = navMenu.classList.toggle('is-open');
      menuToggle.classList.toggle('is-active', open);
      menuToggle.setAttribute('aria-expanded', open);
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
      });
    });

    // Close menu and dropdowns when a link is chosen
    document.querySelectorAll('#nav-menu a').forEach((link) => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('is-open');
        menuToggle.classList.remove('is-active');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.querySelectorAll('.has-dropdown').forEach((li) => {
          li.classList.remove('is-open');
          li.querySelector('.dropdown-toggle').setAttribute('aria-expanded', 'false');
        });
      });
    });

    // Season shortcuts (navigate within the active month, never jump to another month)
    document.querySelectorAll('a[data-tab][href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const linkedMonth = link.dataset.tab;
        const activeMonth = seasonSection.dataset.season || 'enero';
        const href = link.getAttribute('href');

        // Menú Temporadas: activa el mes elegido y muestra su pared de entrada
        if (href === '#temporadas') {
          const tab = document.querySelector('.season-tab[data-month="' + linkedMonth + '"]');
          if (!tab) return;
          tab.click();
          e.preventDefault();
          const landing = getLanding(linkedMonth) || seasonSection;
          setTimeout(() => landing.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
          return;
        }

        // Sobre Nosotros y Disfraces: su contenido vive en el mes indicado (octubre)
        e.preventDefault();
        let month = activeMonth;
        if (linkedMonth !== activeMonth) {
          const monthTab = document.querySelector('.season-tab[data-month="' + linkedMonth + '"]');
          if (monthTab) {
            monthTab.click();
            month = linkedMonth;
          }
        }
        const target = findMonthSection(href, month);
        const content = getContent(month);
        if (target) {
          if (content && content.contains(target)) revealContent(month);
          setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
        } else if (content) {
          revealContent(month);
          setTimeout(() => content.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
        }
      });
    });

    function findMonthSection(href, month) {
      const map = {
        '#nosotros': month === 'octubre' ? '#nosotros' : '#' + month + '-nosotros',
        '#catalogo': '#' + month + '-catalogo',
        '#ninos': month === 'octubre' ? '#ninos' : '#' + month + '-catalogo',
        '#jovenes': month === 'octubre' ? '#jovenes' : '#' + month + '-catalogo',
        '#adultos': month === 'octubre' ? '#adultos' : '#' + month + '-catalogo'
      };
      const id = map[href];
      return id ? document.querySelector(id) : null;
    }

    // Entrar al Callejón: revela el contenido del mes activo
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-enter]');
      if (!btn) return;
      const month = btn.dataset.enter;
      const landing = getLanding(month);
      const content = getContent(month);
      if (landing) landing.classList.remove('is-visible');
      if (content) {
        content.classList.add('is-visible');
        content.querySelectorAll('.reveal:not(.is-revealed)').forEach((el) => el.classList.add('is-revealed'));
        setTimeout(() => content.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      }
    });

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.has-dropdown')) {
        document.querySelectorAll('.has-dropdown.is-open').forEach((li) => {
          li.classList.remove('is-open');
          li.querySelector('.dropdown-toggle').setAttribute('aria-expanded', 'false');
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