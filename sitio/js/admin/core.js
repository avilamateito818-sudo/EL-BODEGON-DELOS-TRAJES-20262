/**
 * Módulo Core — Panel de Administración
 * El Bodegón de los Trajes (Clean Architecture - Capa de Utilidades e Infraestructura Compartida)
 */
(function () {
  'use strict';

  window.BodegonAdmin = window.BodegonAdmin || {};

  var core = {};

  core.DEFAULT_PASSWORD = 'ANAISABEL2026';
  core.DEFAULT_USERNAME = 'Ana Avila';
  core.CONTACT_PHONE = '3107706615';

  core.q = function (path) {
    if (!path) return null;
    try {
      var target = document.querySelector(path);
      if (target) return target;
      if (/^[a-zA-Z0-9_\-\.]+$/.test(path)) {
        return document.querySelector('[data-field="' + CSS.escape(path) + '"]')
          || document.querySelector('[data-card-id="' + CSS.escape(path) + '"]')
          || document.getElementById(path);
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  core.qa = function (path, root) {
    try {
      return Array.prototype.slice.call((root || document).querySelectorAll(path));
    } catch (e) {
      return [];
    }
  };

  core.toast = function (msg) {
    var t = document.createElement('div');
    t.className = 'admin-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('is-show'); }, 20);
    setTimeout(function () {
      t.classList.remove('is-show');
      setTimeout(function () { t.remove(); }, 400);
    }, 2600);
  };

  core.esc = function (s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  core.uid = function () {
    return 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  };

  core.hash = function (s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) {
      h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    }
    return 'h' + h.toString(16);
  };

  core.openModal = function (html, opts) {
    opts = opts || {};
    var ov = document.createElement('div');
    ov.className = 'admin-modal-overlay';
    var box = document.createElement('div');
    box.className = 'admin-modal' + (opts.className ? ' ' + opts.className : '');
    box.innerHTML = html;
    ov.appendChild(box);
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) {
      if (e.target === ov && !opts.sticky) core.closeModal(box);
    });
    return box;
  };

  core.closeModal = function (box) {
    if (!box) {
      var ovs = document.querySelectorAll('.admin-modal-overlay');
      ovs.forEach(function (o) { o.remove(); });
      return;
    }
    var ov = box.closest('.admin-modal-overlay');
    if (ov) ov.remove();
    else box.remove();
  };

  core.notifyAdmin = function (type, titulo, detalle, opts) {
    opts = opts || {};
    try { core.toast((opts.localMsg || titulo)); } catch (e) {}
    return Promise.resolve(true);
  };

  window.BodegonAdmin.core = core;
})();
