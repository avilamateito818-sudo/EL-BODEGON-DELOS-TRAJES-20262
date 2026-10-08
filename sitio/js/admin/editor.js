/**
 * Módulo de Edición Visual y Estilos — Panel de Administración
 * El Bodegón de los Trajes (Single Responsibility: Manipulación Visual, Guías, Snapping e Inspector)
 */
(function () {
  'use strict';

  window.BodegonAdmin = window.BodegonAdmin || {};
  var core = window.BodegonAdmin.core;

  var editor = {};

  var PX_PROPS = { width: 1, height: 1, left: 1, top: 1, borderWidth: 1, borderRadius: 1, fontSize: 1 };
  var selectedEl = null;

  editor.getSelectedElement = function () {
    return selectedEl;
  };

  editor.setSelectedElement = function (el) {
    selectedEl = el;
  };

  editor.applyEditorStyles = function () {
    var content = window.BodegonAdmin.content || {};
    var es = content.editorStyles || {};
    Object.keys(es).forEach(function (key) {
      var el = core.q('[data-editor-id="' + key + '"]') || core.q(key);
      if (el && es[key]) {
        el.style.cssText = es[key];
        if (!el.dataset.editorId) el.dataset.editorId = key;
        if (el.matches('section, footer')) {
          el.style.removeProperty('height');
          el.style.removeProperty('min-height');
          el.style.removeProperty('max-height');
        }
        if (el.matches('section, footer, header, main, h1, h2, h3, h4, .season-root, .catalogo-general') || (el.style.width && parseInt(el.style.width, 10) > 400)) {
          el.style.removeProperty('width');
          el.style.maxWidth = '100%';
        }
      }
    });
  };

  editor.applyEditorStylesWithRetry = function () {
    editor.applyEditorStyles();
    var intentos = 0;
    (function reintentar() {
      if (intentos++ >= 6) return;
      var content = window.BodegonAdmin.content || {};
      var es = content.editorStyles || {};
      var pendientes = Object.keys(es).filter(function (key) {
        return !(core.q('[data-editor-id="' + key + '"]') || core.q(key));
      });
      if (!pendientes.length) return;
      setTimeout(function () {
        editor.applyEditorStyles();
        reintentar();
      }, 400 * intentos);
    })();
  };

  editor.exposeAdminApi = function (state) {
    if (window.BodegonAdminApi) return;
    window.BodegonAdminApi = {
      isActive: function () { return !!(state && state.editMode); },
      select: function (el) {
        try {
          if (el && typeof state.selectElement === 'function') {
            state.selectElement(el);
            return true;
          }
        } catch (e) {}
        return false;
      },
      deselect: function () {
        try {
          if (typeof state.deselectElement === 'function') state.deselectElement();
        } catch (e) {}
      },
      getSelected: function () {
        try {
          if (!selectedEl) return null;
          return 'ETIQUETA ' + selectedEl.tagName.toLowerCase() +
            (selectedEl.id ? ' (#' + selectedEl.id + ')' : '') +
            (selectedEl.className ? ' .' + String(selectedEl.className).split(' ')[0] : '');
        } catch (e) { return null; }
      },
      resetSelected: function () {
        try {
          if (!selectedEl || !selectedEl.dataset.origStyles) return false;
          selectedEl.style.cssText = selectedEl.dataset.origStyles;
          delete selectedEl.dataset.origStyles;
          if (typeof state.syncPanel === 'function') state.syncPanel();
          if (typeof state.updateHandle === 'function') state.updateHandle();
          if (window.BodegonAdmin.Storage) window.BodegonAdmin.Storage.autoSave();
          return true;
        } catch (e) { return false; }
      },
      applyProp: function (prop, value) {
        try {
          if (!selectedEl) return false;
          var panel = document.getElementById('editor-panel');
          var input = panel ? panel.querySelector('[data-prop="' + prop + '"]') : null;
          if (input) {
            input.value = value;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
          }
          selectedEl.style[prop] = PX_PROPS[prop] ? String(Number(value)) + 'px' : value;
          if (typeof state.updateHandle === 'function') state.updateHandle();
          if (window.BodegonAdmin.Storage) window.BodegonAdmin.Storage.autoSave();
          return true;
        } catch (e) { return false; }
      },
      pos: function (key) {
        try {
          if (!selectedEl) return false;
          var panel = document.getElementById('editor-panel');
          var btn = panel ? panel.querySelector('.editor-pos-btn[data-pos="' + key + '"]') : null;
          if (!btn) return false;
          btn.click();
          return true;
        } catch (e) { return false; }
      }
    };
  };

  window.BodegonAdmin.Editor = editor;
})();
