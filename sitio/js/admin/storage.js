/**
 * Módulo de Almacenamiento, Respaldo y Sincronización — Panel de Administración
 * El Bodegón de los Trajes (Single Responsibility: Persistencia Local, Backups Rotativos y Sync con Backend)
 */
(function () {
  'use strict';

  window.BodegonAdmin = window.BodegonAdmin || {};
  var core = window.BodegonAdmin.core;

  var storage = {};

  var AUTOSAVE_KEY = 'bodegon_autosave';
  var BACKUP_KEY_PREFIX = 'bodegon_backup_';
  var BACKUP_SLOTS = 5;
  var BACKUP_LOG_KEY = 'bodegon_backup_log';
  var PENDING_SYNC_KEY = 'bodegon_pending_sync';
  var CLOUD_SYNC_API = '/api/save-content';

  storage.loadAutoSave = function () {
    try {
      var raw = localStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  };

  storage.serialize = function (data) {
    var target = data || (window.BodegonAdmin.content || {});
    return JSON.stringify(target, null, 2);
  };

  storage.mergeData = function (base, override) {
    var result = JSON.parse(JSON.stringify(base || {}));
    override = override || {};
    if (override.texts !== undefined) result.texts = override.texts;
    if (override.images !== undefined) result.images = override.images;
    if (override.addCards !== undefined) result.addCards = override.addCards;
    if (override.addTexts !== undefined) result.addTexts = override.addTexts;
    if (override.addTitles !== undefined) result.addTitles = override.addTitles;
    if (override.addPhotos !== undefined) result.addPhotos = override.addPhotos;
    if (override.addSections !== undefined) result.addSections = override.addSections;
    if (override.deleteCards !== undefined) result.deleteCards = override.deleteCards;
    if (override.deleteTexts !== undefined) result.deleteTexts = override.deleteTexts;
    if (override.deleteSections !== undefined) result.deleteSections = override.deleteSections;
    if (override.hiddenSeasons !== undefined) result.hiddenSeasons = override.hiddenSeasons;
    if (override.seasonCovers !== undefined) result.seasonCovers = override.seasonCovers;
    if (override.seasonColors !== undefined) result.seasonColors = override.seasonColors;
    if (override.specialColors !== undefined) result.specialColors = override.specialColors;
    if (override.photoSettings !== undefined) result.photoSettings = override.photoSettings;
    if (override.editorStyles !== undefined) result.editorStyles = override.editorStyles;
    if (override.passwordHash) result.passwordHash = override.passwordHash;
    if (override.usernameHash) result.usernameHash = override.usernameHash;
    return result;
  };

  storage.saveToDisk = function (data) {
    var text = 'window.ADMIN_CONTENT = ' + storage.serialize(data) + ';';
    var blob = new Blob([text], { type: 'application/javascript;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'admin-content.js';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      a.remove();
      URL.revokeObjectURL(url);
    }, 100);
  };

  storage.autoSave = function () {
    try {
      var serial = storage.serialize();
      localStorage.setItem(AUTOSAVE_KEY, serial);
      localStorage.setItem(PENDING_SYNC_KEY, serial);
    } catch (e) {
      console.warn('Error en autoSave local:', e);
    }
  };

  window.BodegonAdmin.Storage = storage;
})();
