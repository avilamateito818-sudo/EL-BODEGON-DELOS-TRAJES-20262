/**
 * Módulo de Carga y Optimización de Imágenes — Panel de Administración
 * El Bodegón de los Trajes (Adapter Pattern: Conexión segura con /api/upload-media y WebP Canvas)
 */
(function () {
  'use strict';

  window.BodegonAdmin = window.BodegonAdmin || {};
  var core = window.BodegonAdmin.core;

  var uploader = {};

  var MAX_IMG_DIM = 1920;
  var MAX_IMG_BYTES = 450 * 1024; // ~450 KB

  uploader.compressImage = function (dataUrl, maxWidth, quality) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        var target = maxWidth || MAX_IMG_DIM;
        var w = img.width;
        var h = img.height;
        var maxDim = Math.max(w, h);
        if (maxDim > target) {
          var ratio = target / maxDim;
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        var q = (typeof quality === 'number') ? quality : 0.78;
        tryCompress(w, h, q, 0);
      };
      img.onerror = function () { resolve(dataUrl); };
      img.src = dataUrl;

      function tryCompress(cw, ch, cq, attempt) {
        try {
          var canvas = document.createElement('canvas');
          canvas.width = cw;
          canvas.height = ch;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, cw, ch);
          var out = canvas.toDataURL('image/jpeg', cq);
          var bytes = out.length * 3 / 4;
          if (bytes <= MAX_IMG_BYTES || attempt >= 4 || (cw <= 360 && ch <= 360)) {
            resolve(out);
          } else {
            var nextQ = cq * 0.82;
            var nextScale = 0.85;
            var nw = Math.max(240, Math.round(cw * (attempt >= 2 ? nextScale : 1)));
            var nh = Math.max(240, Math.round(ch * (attempt >= 2 ? nextScale : 1)));
            tryCompress(nw, nh, nextQ, attempt + 1);
          }
        } catch (e) {
          resolve(dataUrl);
        }
      }
    });
  };

  uploader.uploadMediaFile = function (file) {
    if (!file) return Promise.reject(new Error('No se seleccionó ningún archivo'));

    var csrfToken = (window.BodegonAdmin.Auth && window.BodegonAdmin.Auth.getCsrfToken()) || '';

    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var canvas = document.createElement('canvas');
        var maxDim = 1600;
        var w = img.width;
        var h = img.height;
        var maxOriginal = Math.max(w, h);
        if (maxOriginal > maxDim) {
          var ratio = maxDim / maxOriginal;
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        function sendBlob(blob) {
          var fd = new FormData();
          fd.append('file', blob, 'upload.webp');
          if (csrfToken) fd.append('csrf_token', csrfToken);

          fetch('/api/upload-media', {
            method: 'POST',
            body: fd,
            headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {}
          })
          .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
          })
          .then(function (data) {
            if (!data.ok || !data.url) throw new Error(data.error || 'Error al subir la imagen');
            resolve(data.url);
          })
          .catch(function (err) {
            console.warn('Fallo en /api/upload-media, fallback local:', err);
            uploader.compressImage(canvas.toDataURL('image/jpeg', 0.70), 1000, 0.55).then(resolve).catch(reject);
          });
        }

        if (canvas.toBlob) {
          canvas.toBlob(function (blob) {
            if (blob) sendBlob(blob);
            else sendBlob(file);
          }, 'image/webp', 0.85);
        } else {
          sendBlob(file);
        }
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        var fd = new FormData();
        fd.append('file', file);
        if (csrfToken) fd.append('csrf_token', csrfToken);
        fetch('/api/upload-media', {
          method: 'POST',
          body: fd,
          headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {}
        })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data && data.ok && data.url) resolve(data.url);
          else reject(new Error((data && data.error) || 'Error al subir'));
        })
        .catch(reject);
      };
      img.src = url;
    });
  };

  uploader.isBigBase64 = function (s) {
    return s && s.indexOf('data:image') === 0 && s.length > (MAX_IMG_BYTES * 4 / 3);
  };

  uploader.reCompressOld = function () {
    var content = window.BodegonAdmin.content || {};
    var changed = false;
    var processed = 0;
    var total = 0;
    Object.keys(content.seasonCovers || {}).forEach(function (k) { if (uploader.isBigBase64(content.seasonCovers[k])) total++; });
    (content.images || []).forEach(function (im) { if (uploader.isBigBase64(im.src)) total++; });
    (content.addCards || []).forEach(function (c) { if (uploader.isBigBase64(c.img)) total++; });

    function finishOne() {
      processed++;
      if (processed >= total && changed) {
        core.toast('Fotos antiguas comprimidas para liberar espacio.');
      }
    }
    function runCompress(current, assign) {
      uploader.compressImage(current, null, null).then(function (c) {
        if (c !== current) {
          assign(c);
          if (window.BodegonAdmin.Storage) window.BodegonAdmin.Storage.autoSave();
          changed = true;
        }
        finishOne();
      });
    }

    Object.keys(content.seasonCovers || {}).forEach(function (k) {
      var v = content.seasonCovers[k];
      if (uploader.isBigBase64(v)) {
        runCompress(v, function (c) { content.seasonCovers[k] = c; });
      }
    });
    (content.images || []).forEach(function (im) {
      if (uploader.isBigBase64(im.src)) {
        runCompress(im.src, function (c) { im.src = c; });
      }
    });
    (content.addCards || []).forEach(function (c) {
      if (uploader.isBigBase64(c.img)) {
        runCompress(c.img, function (cc) { c.img = cc; });
      }
    });
  };

  window.BodegonAdmin.Uploader = uploader;
})();
