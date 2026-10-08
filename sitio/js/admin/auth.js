/**
 * Módulo de Autenticación y Sesión — Panel de Administración
 * El Bodegón de los Trajes (Single Responsibility: Gestión de Sesiones, Credenciales y CSRF)
 */
(function () {
  'use strict';

  window.BodegonAdmin = window.BodegonAdmin || {};
  var core = window.BodegonAdmin.core;

  var auth = {};

  auth.SESSION_KEY = 'bodegon_admin_session';
  auth.AUTH_API = '/api/auth';
  auth.adminCsrfToken = '';
  auth.authed = false;

  var loginAttempts = 0;
  var lockUntil = 0;
  var LOCK_MS = 4 * 60 * 1000;

  auth.isAuthed = function () {
    return auth.authed;
  };

  auth.getCsrfToken = function () {
    return auth.adminCsrfToken;
  };

  auth.setCsrfToken = function (token) {
    auth.adminCsrfToken = token || '';
  };

  auth.checkServerAuth = function (callbacks) {
    callbacks = callbacks || {};
    return fetch(auth.AUTH_API + '?action=status', { credentials: 'same-origin' })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.authenticated) {
          auth.authed = true;
          auth.adminCsrfToken = data.csrf_token || '';
          try { localStorage.setItem(auth.SESSION_KEY, '1'); } catch (e) {}
          if (typeof callbacks.onSuccess === 'function') callbacks.onSuccess(data);
        } else {
          auth.authed = false;
          auth.adminCsrfToken = '';
          try { localStorage.removeItem(auth.SESSION_KEY); } catch (e) {}
          if (typeof callbacks.onRevoked === 'function') callbacks.onRevoked();
        }
      })
      .catch(function (err) {
        /* En caso de desconexión o fallo puntual, si existía bandera local, mantener estado */
        try {
          if (localStorage.getItem(auth.SESSION_KEY) === '1') {
            auth.authed = true;
            if (typeof callbacks.onSuccess === 'function') callbacks.onSuccess({ offline: true });
            return;
          }
        } catch (e) {}
        if (typeof callbacks.onError === 'function') callbacks.onError(err);
      });
  };

  auth.performLogout = function (callbacks) {
    callbacks = callbacks || {};
    fetch(auth.AUTH_API + '?action=logout', {
      method: 'POST',
      credentials: 'same-origin'
    }).catch(function () {});

    auth.authed = false;
    auth.adminCsrfToken = '';
    try { localStorage.removeItem(auth.SESSION_KEY); } catch (e) {}
    if (typeof callbacks.onLogout === 'function') callbacks.onLogout();
    core.toast('Sesión cerrada.');
  };

  auth.openLogin = function (callbacks) {
    callbacks = callbacks || {};
    var box = core.openModal(
      '<h3>Acceso de administrador</h3>' +
      '<label class="admin-field">Usuario</label>' +
      '<input type="text" class="admin-input" data-role="user" autocomplete="username">' +
      '<label class="admin-field">Contraseña</label>' +
      '<input type="password" class="admin-input" data-role="pass" autocomplete="current-password">' +
      '<p class="admin-hint" data-role="hint"></p>' +
      '<div class="admin-modal-actions">' +
      '<button type="button" class="admin-btn admin-btn-primary" data-role="ok">Entrar</button>' +
      '<button type="button" class="admin-btn" data-role="cancel">Cancelar</button>' +
      '</div>'
    );
    var userInp = box.querySelector('[data-role="user"]');
    var inp = box.querySelector('[data-role="pass"]');
    var okBtn = box.querySelector('[data-role="ok"]');
    var hint = box.querySelector('[data-role="hint"]');
    var timer = null;

    function fmt(s) {
      var m = Math.floor(s / 60);
      var sec = s % 60;
      return m + ':' + (sec < 10 ? '0' : '') + sec;
    }

    function setLocked(remaining) {
      userInp.disabled = true;
      inp.disabled = true;
      okBtn.disabled = true;
      hint.innerHTML = 'Máximo de intentos alcanzado. Si olvidaste la contraseña, comunícate al <a href="https://wa.me/573107706615" target="_blank" rel="noopener"><strong>' + core.CONTACT_PHONE + '</strong></a>. Podrás intentar de nuevo en ' + fmt(remaining) + '.';
    }

    function unlock() {
      loginAttempts = 0;
      lockUntil = 0;
      userInp.disabled = false;
      inp.disabled = false;
      okBtn.disabled = false;
      hint.textContent = 'Puedes intentar de nuevo.';
    }

    function tick() {
      if (!box.isConnected) { clearInterval(timer); return; }
      var left = Math.max(0, Math.round((lockUntil - Date.now()) / 1000));
      if (left <= 0) {
        unlock();
        clearInterval(timer);
        return;
      }
      setLocked(left);
    }

    function lockNow() {
      lockUntil = Date.now() + LOCK_MS;
      setLocked(LOCK_MS / 1000);
      clearInterval(timer);
      timer = setInterval(tick, 1000);
    }

    box.querySelector('[data-role="cancel"]').addEventListener('click', function () {
      clearInterval(timer);
      core.closeModal(box);
    });

    if (Date.now() < lockUntil) {
      setLocked(Math.max(0, Math.round((lockUntil - Date.now()) / 1000)));
      timer = setInterval(tick, 1000);
      return;
    }

    function tryLogin() {
      if (loginAttempts >= 5) return;
      var uVal = userInp.value.trim();
      var pVal = inp.value;
      if (!uVal || !pVal) {
        hint.textContent = 'Por favor ingresa usuario y contraseña.';
        return;
      }

      hint.textContent = 'Verificando credenciales...';

      fetch(auth.AUTH_API + '?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ user: uVal, pass: pVal })
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data && data.authenticated) {
            auth.authed = true;
            auth.adminCsrfToken = data.csrf_token || '';
            loginAttempts = 0;
            lockUntil = 0;
            try { localStorage.setItem(auth.SESSION_KEY, '1'); } catch (e) {}
            clearInterval(timer);
            core.closeModal(box);
            if (typeof callbacks.onSuccess === 'function') callbacks.onSuccess(data);
            core.toast(data.message || 'Bienvenido, administrador.');
          } else {
            loginAttempts++;
            var left = 5 - loginAttempts;
            if (left <= 0) {
              lockNow();
            } else {
              hint.textContent = (data && data.error) ? data.error : ('Error, intenta de nuevo. Te quedan ' + left + ' intento' + (left === 1 ? '' : 's') + '.');
            }
          }
        })
        .catch(function () {
          /* Fallback local */
          var expectedU = (window.BodegonAdmin.content && window.BodegonAdmin.content.usernameHash) || core.hash(core.DEFAULT_USERNAME);
          var expectedP = (window.BodegonAdmin.content && window.BodegonAdmin.content.passwordHash) || core.hash(core.DEFAULT_PASSWORD);
          if (core.hash(uVal) === expectedU && core.hash(pVal) === expectedP) {
            auth.authed = true;
            loginAttempts = 0;
            lockUntil = 0;
            try { localStorage.setItem(auth.SESSION_KEY, '1'); } catch (e) {}
            clearInterval(timer);
            core.closeModal(box);
            if (typeof callbacks.onSuccess === 'function') callbacks.onSuccess({ local: true });
            core.toast('Bienvenido, administrador.');
          } else {
            loginAttempts++;
            var left = 5 - loginAttempts;
            if (left <= 0) {
              lockNow();
            } else {
              hint.textContent = 'Error, intenta de nuevo. Te quedan ' + left + ' intento' + (left === 1 ? '' : 's') + '.';
            }
          }
        });
    }

    box.querySelector('[data-role="ok"]').addEventListener('click', tryLogin);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') tryLogin(); });
    setTimeout(function () { userInp.focus(); }, 60);
  };

  auth.changePassword = function (callbacks) {
    callbacks = callbacks || {};
    var box = core.openModal(
      '<h3>Cambiar acceso</h3>' +
      '<label class="admin-field">Contraseña actual</label>' +
      '<input type="password" class="admin-input" data-role="old">' +
      '<label class="admin-field">Nuevo usuario</label>' +
      '<input type="text" class="admin-input" data-role="user" placeholder="Ana Avila">' +
      '<label class="admin-field">Nueva contraseña</label>' +
      '<input type="password" class="admin-input" data-role="new">' +
      '<div class="admin-modal-actions">' +
      '<button type="button" class="admin-btn admin-btn-primary" data-role="ok">Guardar</button>' +
      '<button type="button" class="admin-btn" data-role="cancel">Cancelar</button>' +
      '</div>'
    );
    box.querySelector('[data-role="ok"]').addEventListener('click', function () {
      var content = window.BodegonAdmin.content || {};
      var expected = content.passwordHash || core.hash(core.DEFAULT_PASSWORD);
      if (core.hash(box.querySelector('[data-role="old"]').value) !== expected) {
        core.toast('Contraseña actual incorrecta.');
        return;
      }
      var nu = box.querySelector('[data-role="user"]').value.trim();
      var nw = box.querySelector('[data-role="new"]').value;
      if (!nu) { core.toast('Escribe un usuario.'); return; }
      if (nw.length < 5) { core.toast('La contraseña nueva debe tener al menos 5 caracteres.'); return; }
      content.usernameHash = core.hash(nu);
      content.passwordHash = core.hash(nw);
      core.closeModal(box);
      if (typeof callbacks.onSave === 'function') callbacks.onSave();
      core.toast('Acceso actualizado.');
    });
    box.querySelector('[data-role="cancel"]').addEventListener('click', function () { core.closeModal(box); });
  };

  window.BodegonAdmin.Auth = auth;
})();
