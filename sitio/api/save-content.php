<?php
/**
 * Endpoint de Sincronización del Contenido del CMS — El Bodegón de los Trajes.
 * Arquitectura Limpia: Controlador HTTP / Capa de Adaptadores de Interfaz.
 * 
 * Seguridad:
 *   - Requiere sesión activa de administrador (auth_require_admin()).
 *   - Valida token anti-CSRF para mitigar ataques Cross-Site Request Forgery.
 *   - Sanitiza y formatea el JSON a window.ADMIN_CONTENT antes de persistir.
 *   - Persiste en GitHub (si GITHUB_TOKEN está configurado) y actualiza copia local en disco.
 */

require_once __DIR__ . '/_config.php';

api_cors();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'OPTIONS') {
    api_send(200, array('ok' => true));
}

if ($method !== 'POST') {
    api_send(405, array('ok' => false, 'error' => 'Método no permitido. Use POST.'));
}

// 🔐 Middleware de Seguridad: Exige sesión activa de administrador y valida CSRF
$admin = auth_require_admin();
$adminUser = $admin['user'] ?? 'admin';

$payload = api_read_json_body();
if ($payload === null) {
    api_send(400, array('ok' => false, 'error' => 'Cuerpo JSON inválido o ausente.'));
}

$cfg = bodegon_config();
$token = $cfg['GITHUB_TOKEN'];
$repo = $cfg['GITHUB_REPO'];
$branch = $cfg['GITHUB_BRANCH'];
$file = 'sitio/data/admin-content.js';
$localPath = dirname(__DIR__) . '/data/admin-content.js';

// Caso de prueba de conexión desde el panel de administración
if (!empty($payload['test'])) {
    if ($token !== '') {
        $head = gh_http(
            'GET',
            'https://api.github.com/repos/' . $repo . '/contents/' . $file . '?ref=' . urlencode($branch),
            $token
        );
        $sha = ($head !== null && $head['status'] === 200 && is_array($head['json']) && isset($head['json']['sha']))
            ? strval($head['json']['sha'])
            : null;
        api_send(200, array('ok' => $sha !== null, 'test' => true, 'sha' => $sha, 'user' => $adminUser));
    } else {
        // En entorno local o sin token de GitHub, verificar disponibilidad de almacenamiento en disco
        $diskOk = file_exists($localPath) || is_writable(dirname($localPath));
        api_send(200, array('ok' => true, 'test' => true, 'local_storage' => $diskOk, 'user' => $adminUser));
    }
}

$rawContent = isset($payload['content']) ? $payload['content'] : '';
$parsed = null;

if (is_array($rawContent)) {
    $parsed = $rawContent;
} elseif (is_string($rawContent)) {
    $parsed = json_decode($rawContent, true);
    if (!is_array($parsed)) {
        $stripped = preg_replace('/^\s*window\.ADMIN_CONTENT\s*=\s*/', '', $rawContent);
        $stripped = preg_replace('/;\s*$/', '', strval($stripped));
        $parsed = json_decode(strval($stripped), true);
    }
}

if (!is_array($parsed)) {
    api_send(422, array('ok' => false, 'error' => 'Estructura de contenido inválida. Se esperaba objeto JSON.'));
}

$fileContent = 'window.ADMIN_CONTENT = ' . api_json_pretty($parsed) . ';';

$message = isset($payload['message']) && strval($payload['message']) !== ''
    ? (strval($payload['message']) . ' [' . $adminUser . ']')
    : ('Admin update (' . $adminUser . '): contenido actualizado desde el panel');

// 1. Si hay token de GitHub, guardar en el repositorio remoto
$gitOk = false;
if ($token !== '') {
    $gitOk = gh_write_file($repo, $file, $branch, $token, $fileContent, $message);
}

// 2. Actualizar también la copia local en disco si es escribible
$diskOk = false;
if (file_exists($localPath) && is_writable($localPath)) {
    $diskOk = (@file_put_contents($localPath, $fileContent, LOCK_EX) !== false);
} elseif (is_writable(dirname($localPath))) {
    $diskOk = (@file_put_contents($localPath, $fileContent, LOCK_EX) !== false);
}

// Determinar resultado exitoso
if ($gitOk || $diskOk) {
    api_send(200, array(
        'ok'           => true,
        'github_saved' => $gitOk,
        'local_saved'  => $diskOk,
        'user'         => $adminUser,
        'message'      => 'Contenido guardado exitosamente.'
    ));
}

// Si falló tanto GitHub como el disco
if ($token === '') {
    api_send(500, array('ok' => false, 'error' => 'GITHUB_TOKEN no configurado y sin permisos de escritura en disco'));
}

api_send(502, array('ok' => false, 'error' => 'GitHub rechazó la escritura y el archivo local no pudo actualizarse'));
