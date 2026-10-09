/**
 * catalog-renderer.js — Renderizador Dinámico de Catálogo y Portada
 * El Bodegón de los Trajes (Tunja, Boyacá)
 * 
 * Responsabilidad:
 * - Cargar de forma asíncrona sitio/data/catalogo.json (o /api/catalogo)
 * - Hidratar las tarjetas de trajes en cada panel de temporada y en Portada (Vitrina Principal)
 * - Soportar elección de formato/tamaño de fotografía (carta 3:4, cuadrado 1:1, panorámico 16:9)
 * - Presentar tarjetas tipo "carta de producto" con categoría, tallas, descripción y WhatsApp
 * - Sincronizar reactivamente adiciones, ediciones, reubicaciones y borrados
 */
(function () {
  'use strict';

  var CATALOG_URL = 'data/catalogo.json?v=' + Date.now();

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getAspectValue(formato) {
    if (formato === 'cuadrado') return '1 / 1';
    if (formato === 'panoramico') return '16 / 9';
    return '3 / 4'; // Default formato carta vertical
  }

  function createCardElement(traje) {
    var hasRealPhoto = Boolean(traje.tiene_foto_real || (traje.foto && traje.foto.indexOf('ph-') === -1));
    var card = document.createElement('div');
    var formato = traje.formato_foto || 'carta';
    card.className = 'card-ghost card-formato-' + formato + (hasRealPhoto ? '' : ' card-sin-foto');
    card.setAttribute('data-card-id', traje.id);
    card.style.setProperty('--foto-relacion', getAspectValue(formato));

    var catText = traje.categoria || traje.grupo || '';
    var catBadgeHtml = catText ? '<span class="card-cat-badge">' + escapeHtml(catText) + '</span>' : '';

    var tallasArr = Array.isArray(traje.tallas) ? traje.tallas : (typeof traje.tallas === 'string' && traje.tallas ? traje.tallas.split(',') : ['S', 'M', 'L', 'A la medida']);
    var tallasHtml = '';
    if (tallasArr && tallasArr.length > 0) {
      tallasHtml = '<div class="card-tallas-chips">' + tallasArr.map(function (t) {
        return '<span class="card-talla-pill">' + escapeHtml(t.trim()) + '</span>';
      }).join('') + '</div>';
    }

    var waText = encodeURIComponent('Hola El Bodegón, quiero consultar disponibilidad del traje: ' + (traje.titulo || ''));
    var waUrl = 'https://wa.me/573107706615?text=' + waText;

    card.innerHTML =
      catBadgeHtml +
      '<div class="img-ghost">' +
        '<img loading="lazy" src="' + escapeHtml(traje.foto || 'assets/img/ph-generico.svg') + '" alt="' + escapeHtml(traje.titulo || 'Traje') + '">' +
      '</div>' +
      '<div class="card-body-haunted">' +
        '<h3>' + escapeHtml(traje.titulo || 'Traje Exclusivo') + '</h3>' +
        tallasHtml +
        '<p>' + escapeHtml(traje.descripcion || '') + '</p>' +
        '<div class="card-cta-row">' +
          '<a href="' + waUrl + '" class="card-cta-wa" target="_blank" rel="noopener">' +
            '<span aria-hidden="true">&#128172;</span> Consultar Disponibilidad' +
          '</a>' +
        '</div>' +
      '</div>';

    return card;
  }

  function applyTrajeToCard(cardEl, traje) {
    if (!cardEl || !traje) return;

    var formato = traje.formato_foto || 'carta';
    cardEl.style.setProperty('--foto-relacion', getAspectValue(formato));
    cardEl.classList.remove('card-formato-carta', 'card-formato-cuadrado', 'card-formato-panoramico');
    cardEl.classList.add('card-formato-' + formato);

    // Badge de categoría
    var catText = traje.categoria || traje.grupo || '';
    var catBadge = cardEl.querySelector('.card-cat-badge');
    if (catText) {
      if (!catBadge) {
        catBadge = document.createElement('span');
        catBadge.className = 'card-cat-badge';
        cardEl.prepend(catBadge);
      }
      catBadge.textContent = catText;
    } else if (catBadge) {
      catBadge.remove();
    }

    // Imagen
    var img = cardEl.querySelector('img');
    if (img && traje.foto && img.getAttribute('src') !== traje.foto) {
      img.src = traje.foto;
      img.alt = traje.titulo || 'Traje';
    }
    if (traje.foto && (traje.tiene_foto_real || traje.foto.indexOf('ph-') === -1)) {
      cardEl.classList.remove('card-sin-foto');
    }

    // Título
    var titleEl = cardEl.querySelector('h3, h4, h5');
    if (titleEl && traje.titulo) {
      titleEl.textContent = traje.titulo;
    }

    // Tallas
    var tallasArr = Array.isArray(traje.tallas) ? traje.tallas : (typeof traje.tallas === 'string' && traje.tallas ? traje.tallas.split(',') : []);
    var tallasBox = cardEl.querySelector('.card-tallas-chips');
    if (tallasArr && tallasArr.length > 0) {
      if (!tallasBox) {
        tallasBox = document.createElement('div');
        tallasBox.className = 'card-tallas-chips';
        var descEl = cardEl.querySelector('p');
        if (descEl && descEl.parentElement) {
          descEl.parentElement.insertBefore(tallasBox, descEl);
        }
      }
      tallasBox.innerHTML = tallasArr.map(function (t) {
        return '<span class="card-talla-pill">' + escapeHtml(t.trim()) + '</span>';
      }).join('');
    } else if (tallasBox) {
      tallasBox.remove();
    }

    // Descripción
    var pEl = cardEl.querySelector('p');
    if (pEl && traje.descripcion !== undefined) {
      pEl.textContent = traje.descripcion;
    }

    // Botón WhatsApp
    var waText = encodeURIComponent('Hola El Bodegón, quiero consultar disponibilidad del traje: ' + (traje.titulo || ''));
    var waUrl = 'https://wa.me/573107706615?text=' + waText;
    var ctaWa = cardEl.querySelector('.card-cta-wa');
    if (!ctaWa) {
      var bodyEl = cardEl.querySelector('.card-body-haunted');
      if (bodyEl) {
        var row = cardEl.querySelector('.card-cta-row');
        if (!row) {
          row = document.createElement('div');
          row.className = 'card-cta-row';
          bodyEl.appendChild(row);
        }
        ctaWa = document.createElement('a');
        ctaWa.className = 'card-cta-wa';
        ctaWa.target = '_blank';
        ctaWa.rel = 'noopener';
        ctaWa.innerHTML = '<span aria-hidden="true">&#128172;</span> Consultar Disponibilidad';
        row.appendChild(ctaWa);
      }
    }
    if (ctaWa) ctaWa.href = waUrl;
  }

  function findCategoryGrid(panel, categoryName) {
    if (!panel) return null;
    var normCat = (categoryName || '').toLowerCase().trim();

    // 1. Buscar entre todos los títulos de grupo en el panel
    var groupTitles = panel.querySelectorAll('.catalog-group-title, h4, h5');
    for (var i = 0; i < groupTitles.length; i++) {
      var titleEl = groupTitles[i];
      var titleText = titleEl.textContent.toLowerCase();

      var isMatch = false;
      if (normCat.indexOf('terror') !== -1 && titleText.indexOf('terror') !== -1) {
        isMatch = true;
      } else if ((normCat.indexOf('princesa') !== -1 || normCat.indexOf('cuento') !== -1 || normCat.indexOf('fantasia') !== -1 || normCat.indexOf('fantasía') !== -1) && (titleText.indexOf('cuento') !== -1 || titleText.indexOf('fantas') !== -1 || titleText.indexOf('princesa') !== -1)) {
        isMatch = true;
      } else if ((normCat.indexOf('super') !== -1 || normCat.indexOf('anime') !== -1 || normCat.indexOf('comic') !== -1) && (titleText.indexOf('super') !== -1 || titleText.indexOf('anime') !== -1)) {
        isMatch = true;
      } else if ((normCat.indexOf('gala') !== -1 || normCat.indexOf('eleganc') !== -1) && (titleText.indexOf('gala') !== -1 || titleText.indexOf('eleganc') !== -1)) {
        isMatch = true;
      } else if ((normCat.indexOf('oficio') !== -1 || normCat.indexOf('uniform') !== -1) && (titleText.indexOf('oficio') !== -1 || titleText.indexOf('uniform') !== -1)) {
        isMatch = true;
      } else if (normCat && (titleText.indexOf(normCat) !== -1 || normCat.indexOf(titleText) !== -1)) {
        isMatch = true;
      }

      if (isMatch) {
        var sibling = titleEl.nextElementSibling;
        while (sibling && !sibling.classList.contains('grid-haunted') && !sibling.classList.contains('season-grid')) {
          sibling = sibling.nextElementSibling;
        }
        if (sibling) return sibling;
      }
    }

    // 2. Si no encontró una sección existente y se especificó una categoría no general, crear la sección
    var catalogSection = panel.querySelector('.season-catalog') || panel;
    if (normCat && normCat !== 'general' && normCat !== 'default') {
      var newTitle = document.createElement('h5');
      newTitle.className = 'catalog-group-title';
      newTitle.textContent = categoryName;

      var newGrid = document.createElement('div');
      newGrid.className = 'grid-haunted';

      var note = catalogSection.querySelector('.catalog-note');
      if (note) {
        catalogSection.insertBefore(newTitle, note);
        catalogSection.insertBefore(newGrid, note);
      } else {
        catalogSection.appendChild(newTitle);
        catalogSection.appendChild(newGrid);
      }
      return newGrid;
    }

    // 3. Fallback: primera grilla encontrada en el panel
    return panel.querySelector('.grid-haunted, .season-grid, .season-catalog-grid') || catalogSection;
  }

  function hydrateCards(trajes) {
    if (!Array.isArray(trajes)) return;

    var trajesMap = {};
    trajes.forEach(function (t) {
      if (t.id) trajesMap[t.id] = t;
    });

    // 1. Actualizar tarjetas ya existentes en el DOM (en paneles de temporadas)
    document.querySelectorAll('[data-card-id]').forEach(function (cardEl) {
      var cardId = cardEl.getAttribute('data-card-id');
      var traje = trajesMap[cardId];
      if (!traje) return;

      // Si está desactivado, ocultar la tarjeta
      if (traje.activo === false) {
        cardEl.style.display = 'none';
        return;
      } else {
        cardEl.style.display = '';
      }

      // Reubicar tarjeta si su temporada cambió para garantizar aislamiento absoluto por mes
      var cat = traje.categoria || traje.grupo;
      if (traje.temporada) {
        var panel = document.querySelector('[data-cat-panel="' + CSS.escape(traje.temporada) + '"]') ||
                    document.querySelector('[data-panel="' + CSS.escape(traje.temporada) + '"]');
        if (panel) {
          var currentPanel = cardEl.closest('[data-panel]');
          if (!currentPanel || currentPanel !== panel) {
            var targetGrid = findCategoryGrid(panel, cat);
            if (targetGrid) {
              targetGrid.appendChild(cardEl);
            }
          }
        }
      }

      applyTrajeToCard(cardEl, traje);
    });

    // 2. Insertar trajes nuevos que no existían en el HTML estático en su temporada correspondiente
    trajes.forEach(function (traje) {
      if (!traje.id || !traje.temporada || traje.activo === false) return;
      var existing = document.querySelector('[data-card-id="' + CSS.escape(traje.id) + '"]');
      if (existing) return;

      var panel = document.querySelector('[data-cat-panel="' + CSS.escape(traje.temporada) + '"]') ||
                  document.querySelector('[data-panel="' + CSS.escape(traje.temporada) + '"]');
      if (!panel) return;

      var targetGrid = findCategoryGrid(panel, traje.categoria || traje.grupo);
      if (!targetGrid) return;

      var newCard = createCardElement(traje);
      targetGrid.appendChild(newCard);
    });
  }

  function initCatalog(cb) {
    fetch(CATALOG_URL)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.trajes) return;
        window.BODEGON_CATALOGO = data;

        // Sincronizar temporada activa si está definida
        if (data.temporada_activa && typeof window.selectSeason === 'function') {
          window.selectSeason(data.temporada_activa);
        }

        // Sincronizar fotos de banner de temporadas si están definidas
        if (data.temporadas) {
          Object.keys(data.temporadas).forEach(function (m) {
            var sInfo = data.temporadas[m];
            if (sInfo && sInfo.foto_hero) {
              var banner = document.querySelector('.season-hero-banner[data-hero-season="' + m + '"]');
              if (banner) {
                banner.style.backgroundImage = "url('" + sInfo.foto_hero + "')";
              }
            }
          });
        }

        // Hidratar catálogo y vitrina de portada
        hydrateCards(data.trajes);

        // Notificar a componentes externos (in-page-admin, etc.)
        window.dispatchEvent(new CustomEvent('bodegon:catalog-updated', { detail: data }));
        if (typeof cb === 'function') cb(data);
      })
      .catch(function (err) {
        console.warn('[Catalogo] Usando contenido estático del HTML:', err.message);
        if (typeof cb === 'function') cb(null, err);
      });
  }

  // API global para refrescar el catálogo sin recargar la página
  window.refreshBodegonCatalog = function (cb) {
    initCatalog(cb);
  };

  // Inicializar al cargar el DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initCatalog(); });
  } else {
    initCatalog();
  }
})();
