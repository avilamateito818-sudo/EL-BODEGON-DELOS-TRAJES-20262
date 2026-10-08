/**
 * Módulo de Catálogo y Contenido — Panel de Administración
 * El Bodegón de los Trajes (Single Responsibility: Gestión de Trajes, Secciones, Títulos y Fotos)
 */
(function () {
  'use strict';

  window.BodegonAdmin = window.BodegonAdmin || {};
  var core = window.BodegonAdmin.core;

  var catalog = {};

  catalog.TEXT_SEL = [
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
    '.season-tab .tab-desc',
    '.dropdown-grid a',
    '.season-quick-nav a',
    '[data-field]',
    '[data-card-id] h3',
    '[data-card-id] p'
  ].join(',');

  catalog.cssPath = function (el) {
    if (!el) return '';
    if (el.getAttribute && el.getAttribute('data-field')) {
      return '[data-field="' + CSS.escape(el.getAttribute('data-field')) + '"]';
    }
    if (el.getAttribute && el.getAttribute('data-card-id')) {
      return '[data-card-id="' + CSS.escape(el.getAttribute('data-card-id')) + '"]';
    }
    if (el.getAttribute && el.getAttribute('data-cms-id')) {
      return '[data-cms-id="' + CSS.escape(el.getAttribute('data-cms-id')) + '"]';
    }
    if (el.id) return '#' + CSS.escape(el.id);

    var cardHost = el.closest ? el.closest('[data-card-id]') : null;
    if (cardHost && cardHost !== el) {
      return '[data-card-id="' + CSS.escape(cardHost.getAttribute('data-card-id')) + '"] ' + el.tagName.toLowerCase();
    }

    if (el === document.body) return 'body';

    var parts = [];
    var node = el;
    while (node && node.nodeType === 1) {
      if (node !== el && node.getAttribute && node.getAttribute('data-card-id')) {
        parts.unshift('[data-card-id="' + CSS.escape(node.getAttribute('data-card-id')) + '"]');
        break;
      }
      if (node !== el && node.getAttribute && node.getAttribute('data-field')) {
        parts.unshift('[data-field="' + CSS.escape(node.getAttribute('data-field')) + '"]');
        break;
      }
      if (node.id) {
        parts.unshift('#' + CSS.escape(node.id));
        break;
      }
      var mes = node.getAttribute && (node.getAttribute('data-landing') || node.getAttribute('data-season') || node.getAttribute('data-panel') || node.getAttribute('data-cat-panel'));
      if (mes) {
        var attr = node.hasAttribute('data-landing') ? 'data-landing' : (node.hasAttribute('data-panel') ? 'data-panel' : (node.hasAttribute('data-cat-panel') ? 'data-cat-panel' : 'data-season'));
        var clase = '';
        if (node.classList) {
          for (var c = 0; c < node.classList.length; c++) {
            var nombre = node.classList[c];
            if (/^(admin-|editor-|is-|has-|reveal|no-)/.test(nombre)) continue;
            clase = '.' + CSS.escape(nombre);
            break;
          }
        }
        parts.unshift(node.tagName.toLowerCase() + clase + '[' + attr + '="' + mes + '"]');
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
  };

  catalog.editorKey = function (el) {
    if (!el) return '';
    if (el.getAttribute && el.getAttribute('data-field')) return '[data-field="' + CSS.escape(el.getAttribute('data-field')) + '"]';
    if (el.getAttribute && el.getAttribute('data-card-id')) return '[data-card-id="' + CSS.escape(el.getAttribute('data-card-id')) + '"]';
    if (el.getAttribute && el.getAttribute('data-cms-id')) return '[data-cms-id="' + CSS.escape(el.getAttribute('data-cms-id')) + '"]';
    if (el.id) return '#' + CSS.escape(el.id);
    var cardHost = el.closest ? el.closest('[data-card-id]') : null;
    if (cardHost && cardHost !== el) {
      return '[data-card-id="' + CSS.escape(cardHost.getAttribute('data-card-id')) + '"] ' + el.tagName.toLowerCase();
    }
    var clases = String(el.className || '').trim().split(/\s+/).filter(function (c) {
      return c && c !== 'editor-selected' && c.indexOf('reveal') !== 0;
    });
    for (var i = 0; i < clases.length; i++) {
      var sel = '.' + CSS.escape(clases[i]);
      try {
        if (document.querySelectorAll(sel).length === 1) return sel;
      } catch (e) {}
    }
    return catalog.cssPath(el);
  };

  catalog.insertCard = function (entry) {
    if (document.querySelector('[data-admin-id="' + entry.id + '"]')) return;
    var host = core.q(entry.container) || (entry.container && document.body);
    if (!host) return;
    var grid = host.classList.contains('grid-haunted') ? host : host.querySelector('.grid-haunted');
    if (!grid) {
      var sec = host;
      grid = document.createElement('div');
      grid.className = 'grid-haunted';
      sec.appendChild(grid);
      var blank = sec.querySelector('.season-blank-title');
      if (blank) blank.style.display = 'none';
      var emptyBox = sec.querySelector('.season-empty');
      if (emptyBox) emptyBox.style.display = 'none';
      var secTag = sec.querySelector('.season-catalog-tag');
      if (secTag) {
        sec.insertBefore(grid, secTag.nextSibling ? secTag.nextSibling : null);
      }
    }
    var card = document.createElement('div');
    card.className = 'card-ghost admin-added';
    card.dataset.adminId = entry.id;
    card.dataset.cardId = 'card-' + entry.id;
    card.innerHTML =
      '<div class="img-ghost"><img loading="lazy" decoding="async" src="' + core.esc(entry.img) + '" alt="' + core.esc(entry.title) + '"></div>' +
      '<div class="card-body-haunted"><h3>' + core.esc(entry.title) + '</h3><p>' + core.esc(entry.desc) + '</p></div>';
    grid.appendChild(card);
    return card;
  };

  catalog.insertSection = function (entry, panel) {
    if (document.querySelector('[data-admin-id="' + entry.id + '"]')) return;
    var sec = document.createElement('section');
    sec.className = 'season-catalog';
    sec.id = entry.id;
    sec.setAttribute('data-admin-id', entry.id);
    sec.setAttribute('data-addsec-order', entry.order);
    var inner = '';
    if (entry.tag) inner += '<span class="season-catalog-tag">' + entry.tag + '</span>';
    inner += '<h4>' + entry.title + '</h4>';
    if (entry.desc) inner += '<p class="season-subtitle">' + entry.desc + '</p>';
    sec.innerHTML = inner;

    if (entry.textColor || entry.fontSize || entry.fontFamily) {
      var h4 = sec.querySelector('h4');
      var tag = sec.querySelector('.season-catalog-tag');
      var sub = sec.querySelector('.season-subtitle');
      [h4, tag, sub].forEach(function (t) {
        if (!t) return;
        if (entry.textColor) t.style.color = entry.textColor;
        if (entry.fontFamily) t.style.fontFamily = entry.fontFamily;
      });
      if (entry.fontSize && h4) {
        h4.style.fontSize = entry.fontSize + 'px';
        h4.style.textShadow = '0 0 14px rgba(0,0,0,0.6)';
      }
    }
    var host = panel && panel.querySelector('.season-sub-sections, .season-catalog') ? panel.querySelector('.season-sub-sections') : panel;
    if (!host) host = panel;

    core.qa('.admin-section-bar', panel).forEach(function (b) { b.remove(); });
    host.appendChild(sec);
    return sec;
  };

  window.BodegonAdmin.Catalog = catalog;
})();
