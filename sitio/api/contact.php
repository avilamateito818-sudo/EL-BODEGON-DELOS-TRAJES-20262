<?php
/* Endpoint: mensajes del formulario de contacto → data/mensajes.json en GitHub. */

require __DIR__ . '/_config.php';

api_cors();
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    api_send(200, array('ok' => true));
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    api_send(405, array('ok' => false, 'error' => 'Método no permitido'));
}

$p = api_read_json_body();
if ($p === null) {
    api_send(400, array('ok' => false, 'error' => 'JSON inválido'));
}

$cfg = bodegon_config();

$record = array(
    'fecha'    => gmdate('c'),
    'tipo'     => strval($p['tipo'] ?? 'contacto'),
    'nombre'   => strval($p['nombre'] ?? ''),
    'correo'   => strval($p['correo'] ?? ''),
    'whatsapp' => strval($p['whatsapp'] ?? ''),
    'mensaje'  => strval($p['mensaje'] ?? ''),
);

$waText = 'Mensaje del sitio (' . $record['tipo'] . '): '
    . ($record['mensaje'] !== '' ? $record['mensaje'] . '. ' : '')
    . 'Nombre: ' . $record['nombre'] . '. Correo/WhatsApp: '
    . ($record['correo'] !== '' ? $record['correo'] : $record['whatsapp']);
$waLink = 'https://wa.me/' . $cfg['CONTACT_PHONE'] . '?text=' . rawurlencode($waText);

/* Intento de envío por correo nativo si el servidor lo tiene configurado */
if (!empty($cfg['CONTACT_EMAIL']) && function_exists('mail')) {
    $to = $cfg['CONTACT_EMAIL'];
    $subject = 'Nuevo mensaje web: ' . ($record['nombre'] !== '' ? $record['nombre'] : 'Cliente');
    $body = "Nombre: " . $record['nombre'] . "\n"
          . "Contacto: " . ($record['correo'] !== '' ? $record['correo'] : $record['whatsapp']) . "\n"
          . "Tipo: " . $record['tipo'] . "\n\n"
          . "Mensaje:\n" . $record['mensaje'];
    $headers = "From: webmaster@" . ($_SERVER['SERVER_NAME'] ?? 'elbodegondelostrajes.com') . "\r\n";
    if (!empty($record['correo'])) {
        $headers .= "Reply-To: " . $record['correo'] . "\r\n";
    }
    @mail($to, $subject, $body, $headers);
}

/* Sin token: responder OK con el enlace de WhatsApp para no romper la UX */
if ($cfg['GITHUB_TOKEN'] === '') {
    api_send(200, array('ok' => true, 'fallback' => true, 'waLink' => $waLink));
}

try {
    $file = 'data/mensajes.json';
    $read = gh_read_json($cfg['GITHUB_REPO'], $file, $cfg['GITHUB_BRANCH'], $cfg['GITHUB_TOKEN']);
    $data = $read['data'];
    array_unshift($data, $record);
    $data = array_slice($data, 0, 500);
    gh_write_file(
        $cfg['GITHUB_REPO'],
        $file,
        $cfg['GITHUB_BRANCH'],
        $cfg['GITHUB_TOKEN'],
        api_json_pretty($data) . "\n",
        'Nuevo mensaje del formulario de contacto'
    );
} catch (Throwable $e) {
    /* no bloquear la UX */
}

api_send(200, array('ok' => true, 'waLink' => $waLink));
