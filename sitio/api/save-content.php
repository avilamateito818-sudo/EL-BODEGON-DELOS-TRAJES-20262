<?php
/* Endpoint: sincronización del panel de administración → sitio/data/admin-content.js en GitHub. */

require __DIR__ . '/_config.php';

api_cors();
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    api_send(200, array('ok' => true));
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    api_send(405, array('ok' => false, 'error' => 'Método no permitido'));
}

$cfg = bodegon_config();
$token = $cfg['GITHUB_TOKEN'];

if ($token === '') {
    api_send(500, array('ok' => false, 'error' => 'GITHUB_TOKEN no está configurado en el servidor'));
}

$payload = api_read_json_body();
if ($payload === null) {
    api_send(400, array('ok' => false, 'error' => 'JSON inválido'));
}

$file = 'sitio/data/admin-content.js';
$repo = $cfg['GITHUB_REPO'];
$branch = $cfg['GITHUB_BRANCH'];

if (!empty($payload['test'])) {
    $head = gh_http(
        'GET',
        'https://api.github.com/repos/' . $repo . '/contents/' . $file . '?ref=' . urlencode($branch),
        $token
    );
    $sha = ($head !== null && $head['status'] === 200 && is_array($head['json']) && isset($head['json']['sha']))
        ? strval($head['json']['sha'])
        : null;
    api_send(200, array('ok' => $sha !== null, 'test' => true, 'sha' => $sha));
}

$rawContent = isset($payload['content']) ? strval($payload['content']) : '';

$parsed = json_decode($rawContent, true);
if (!is_array($parsed)) {
    $stripped = preg_replace('/^\s*window\.ADMIN_CONTENT\s*=\s*/', '', $rawContent);
    $stripped = preg_replace('/;\s*$/', '', strval($stripped));
    $parsed = json_decode(strval($stripped), true);
}
if (!is_array($parsed)) {
    api_send(400, array('ok' => false, 'error' => 'Contenido inválido'));
}

$fileContent = 'window.ADMIN_CONTENT = ' . api_json_pretty($parsed) . ';';

$message = isset($payload['message']) && strval($payload['message']) !== ''
    ? strval($payload['message'])
    : 'Admin update: contenido actualizado desde el panel';

$ok = gh_write_file($repo, $file, $branch, $token, $fileContent, $message);

if ($ok) {
    api_send(200, array('ok' => true));
}

api_send(502, array('ok' => false, 'error' => 'GitHub rechazó la escritura'));
