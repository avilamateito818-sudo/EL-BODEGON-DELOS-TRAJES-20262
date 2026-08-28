/* ==========================================================
   email/form-handler.js
   Manejo del formulario de contacto — El Bodegón de los Trajes
   Envía mensajes por correo a avimateo2@gmail.com vía Formspree
   ========================================================== */

(function () {
  'use strict';

  var cfg = window.EMAIL_CONFIG;
  if (!cfg) {
    console.error('[email] config.js no está cargado.');
    return;
  }

  var endpoint = 'https://formspree.io/f/' + cfg.formspreeId;

  function showToast(msg, type) {
    var existing = document.querySelector('.email-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'email-toast email-toast--' + (type || 'info');
    toast.textContent = msg;
    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      toast.classList.add('is-visible');
    });

    setTimeout(function () {
      toast.classList.remove('is-visible');
      setTimeout(function () { toast.remove(); }, 400);
    }, 4500);
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function handleSubmit(e) {
    e.preventDefault();

    var form = e.target;
    var nombre = (form.nombre.value || '').trim();
    var correo = (form.correo.value || '').trim();
    var mensaje = (form.mensaje.value || '').trim();

    if (!nombre || !correo || !mensaje) {
      showToast(cfg.messages.validation, 'error');
      return;
    }

    if (!validateEmail(correo)) {
      showToast('Ingresa un correo válido.', 'error');
      return;
    }

    var submitBtn = form.querySelector('.submit-btn');
    var originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = cfg.messages.sending;

    var body = {
      _subject: 'Nuevo mensaje desde el sitio — ' + cfg.businessName,
      nombre: nombre,
      correo: correo,
      mensaje: mensaje,
      _replyto: correo
    };

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(function (res) {
        if (res.ok) {
          showToast(cfg.messages.success, 'success');
          form.reset();
        } else {
          throw new Error(res.status);
        }
      })
      .catch(function () {
        showToast(cfg.messages.error, 'error');
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      });
  }

  function init() {
    var form = document.getElementById('contact-form');
    if (!form) {
      console.warn('[email] Formulario #contact-form no encontrado.');
      return;
    }

    form.removeEventListener('submit', handleSubmit);
    form.addEventListener('submit', handleSubmit);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
