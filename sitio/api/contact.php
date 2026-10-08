<?php
/**
 * Endpoint de Formulario de Contacto — El Bodegón de los Trajes.
 * Arquitectura Limpia: Controlador HTTP / Capa de Adaptadores de Interfaz.
 * 
 * Desacoplado de Git: Persiste mediante LeadRepository en almacenamiento protegido.
 */

require_once __DIR__ . '/_config.php';
require_once __DIR__ . '/leads.php';

api_cors();

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    api_send(200, array('ok' => true));
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    api_send(405, array('ok' => false, 'error' => 'Método no permitido. Use POST.'));
}

$payload = api_read_json_body();
if ($payload === null) {
    api_send(400, array('ok' => false, 'error' => 'JSON inválido o ausente.'));
}

$nombre   = trim(strip_tags(strval($payload['nombre'] ?? '')));
$correo   = trim(strip_tags(strval($payload['correo'] ?? '')));
$whatsapp = trim(strip_tags(strval($payload['whatsapp'] ?? '')));
$mensaje  = trim(strip_tags(strval($payload['mensaje'] ?? '')));
$tipo     = trim(strip_tags(strval($payload['tipo'] ?? 'contacto')));

if ($mensaje === '' && $nombre === '' && $correo === '' && $whatsapp === '') {
    api_send(422, array('ok' => false, 'error' => 'Los datos de contacto están vacíos'));
}

if ($mensaje === '') {
    api_send(422, array('ok' => false, 'error' => 'El mensaje es obligatorio'));
}

if ($correo === '' && $whatsapp === '') {
    api_send(422, array('ok' => false, 'error' => 'Se requiere al menos un medio de contacto (WhatsApp o correo)'));
}

$record = array(
    'tipo'     => $tipo !== '' ? $tipo : 'contacto',
    'nombre'   => $nombre,
    'correo'   => $correo,
    'whatsapp' => $whatsapp,
    'mensaje'  => $mensaje,
);

// Persistencia en LeadRepository (desacoplada de Git)
$saved = LeadRepository::saveContact($record);

$cfg = bodegon_config();
$waPhone = !empty($cfg['CONTACT_PHONE']) ? $cfg['CONTACT_PHONE'] : '573107706615';

$waText = 'Mensaje del sitio (' . $record['tipo'] . '): '
    . ($record['mensaje'] !== '' ? $record['mensaje'] . '. ' : '')
    . 'Nombre: ' . ($record['nombre'] !== '' ? $record['nombre'] : 'Cliente') . '. Contacto: '
    . ($record['correo'] !== '' ? $record['correo'] : $record['whatsapp']);

$waLink = 'https://wa.me/' . $waPhone . '?text=' . rawurlencode($waText);

api_send(200, array(
    'ok'      => true,
    'saved'   => $saved,
    'waLink'  => $waLink,
    'message' => 'Mensaje recibido exitosamente.'
));
