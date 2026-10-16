<?php
/**
 * save-content.php — Endpoint Deprecado (410 Gone)
 * El Bodegón de los Trajes (Tunja, Boyacá)
 * 
 * Este endpoint fue reemplazado definitivamente por la arquitectura REST SSOT:
 *   - Catálogo de Trajes:    /api/catalogo (catalogo.php)
 *   - Ajustes de Negocio:    /api/config (config.php)
 *   - Bandeja de Prospectos: /api/leads (leads.php)
 */

require_once __DIR__ . '/_config.php';

api_cors();

api_send(410, array(
    'ok' => false,
    'error' => 'Endpoint deprecado (410 Gone). La gestión de contenidos ahora se realiza a través de /api/catalogo y /api/config bajo arquitectura REST SSOT.',
    'migracion' => array(
        'catalogo' => '/api/catalogo',
        'configuracion' => '/api/config',
        'leads' => '/api/leads'
    )
));
