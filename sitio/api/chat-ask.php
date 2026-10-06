<?php
/* Endpoint: consultas del asistente → data/consultas.json en GitHub.
   Equivalente PHP de la antigua api/chat-ask.js (Vercel). */

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
    'categoria'=> strval($p['categoria'] ?? 'consulta libre'),
    'consulta' => strval($p['consulta'] ?? ''),
    'nombre'   => strval($p['nombre'] ?? ''),
    'whatsapp' => strval($p['whatsapp'] ?? ''),
);

$waText = 'Nueva consulta en El Bodegón: ' . $record['categoria']
    . ($record['consulta'] !== '' ? '. Mensaje: ' . $record['consulta'] . '. ' : '')
    . 'Nombre: ' . $record['nombre'] . '. WhatsApp: ' . $record['whatsapp'];
$waLink = 'https://wa.me/' . $cfg['CONTACT_PHONE'] . '?text=' . rawurlencode($waText);

/* Sin token: responder OK con el enlace de WhatsApp para no romper la UX */
if ($cfg['GITHUB_TOKEN'] === '') {
    api_send(200, array('ok' => true, 'fallback' => true, 'waLink' => $waLink));
}

try {
    $file = 'data/consultas.json';
    $read = gh_read_json($cfg['GITHUB_REPO'], $file, $cfg['GITHUB_BRANCH'], $cfg['GITHUB_TOKEN']);
    $data = $read['data'];
    array_unshift($data, $record);
    $data = array_slice($data, 0, 500);
    /* Si la escritura falla no bloqueamos la UX */
    gh_write_file(
        $cfg['GITHUB_REPO'],
        $file,
        $cfg['GITHUB_BRANCH'],
        $cfg['GITHUB_TOKEN'],
        api_json_pretty($data) . "\n",
        'Nueva consulta del asistente'
    );
} catch (Throwable $e) {
    /* no bloquear la UX */
}

api_send(200, array('ok' => true, 'waLink' => $waLink));
