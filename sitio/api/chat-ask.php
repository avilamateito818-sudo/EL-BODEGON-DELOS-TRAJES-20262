<?php
/**
 * Endpoint de Consultas del Asistente Virtual — El Bodegón de los Trajes.
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

$consulta  = trim(strip_tags(strval($payload['consulta'] ?? '')));
$nombre    = trim(strip_tags(strval($payload['nombre'] ?? '')));
$whatsapp  = trim(strip_tags(strval($payload['whatsapp'] ?? '')));
$categoria = trim(strip_tags(strval($payload['categoria'] ?? 'consulta libre')));

if ($consulta === '' && $nombre === '' && $whatsapp === '') {
    api_send(422, array('ok' => false, 'error' => 'La consulta no contiene información válida'));
}

$record = array(
    'categoria' => $categoria !== '' ? $categoria : 'consulta libre',
    'consulta'  => $consulta,
    'nombre'    => $nombre,
    'whatsapp'  => $whatsapp,
);

// Persistencia en LeadRepository (desacoplada de Git)
$saved = LeadRepository::saveChatQuery($record);

$cfg = bodegon_config();
$waPhone = !empty($cfg['CONTACT_PHONE']) ? $cfg['CONTACT_PHONE'] : '573107706615';

$waText = 'Nueva consulta en El Bodegón: ' . $record['categoria']
    . ($record['consulta'] !== '' ? '. Mensaje: ' . $record['consulta'] . '. ' : '')
    . 'Nombre: ' . ($record['nombre'] !== '' ? $record['nombre'] : 'Cliente')
    . ($record['whatsapp'] !== '' ? '. WhatsApp: ' . $record['whatsapp'] : '');

$waLink = 'https://wa.me/' . $waPhone . '?text=' . rawurlencode($waText);

api_send(200, array(
    'ok'      => true,
    'saved'   => $saved,
    'waLink'  => $waLink,
    'message' => 'Consulta registrada exitosamente.'
));
