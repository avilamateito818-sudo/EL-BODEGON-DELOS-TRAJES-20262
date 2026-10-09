<?php
/**
 * Configuración y utilidades compartidas de los endpoints /api/*.php.
 * Requiere PHP 7.4+ con extensión curl.
 */

function bodegon_config(): array
{
    static $cfg = null;
    if ($cfg !== null) {
        return $cfg;
    }

    $defaults = array(
        'GITHUB_TOKEN' => '',
        'GITHUB_REPO' => 'avilamateito818-sudo/EL-BODEGON-DELOS-TRAJES-20262',
        'GITHUB_BRANCH' => 'main',
        'CONTACT_PHONE' => '573107706615',
        'CONTACT_EMAIL' => 'elbodegondelostrajes@gmail.com',
    );

    /* Orden de búsqueda del archivo de configuración:
       1) variable de entorno BODEGON_CONFIG (ruta absoluta)
       2) ~/bodegon-config.php  (fuera del docroot, permisos 600)
       3) config.local.php junto a este archivo (desarrollo local, gitignored) */
    $candidates = array();

    $envConfig = getenv('BODEGON_CONFIG');
    if (is_string($envConfig) && $envConfig !== '') {
        $candidates[] = $envConfig;
    }

    foreach (array('HOME', 'USERPROFILE') as $homeVar) {
        $home = getenv($homeVar);
        if (is_string($home) && $home !== '') {
            $candidates[] = rtrim($home, "/\\") . DIRECTORY_SEPARATOR . 'bodegon-config.php';
            break;
        }
    }

    $candidates[] = __DIR__ . DIRECTORY_SEPARATOR . 'config.local.php';

    foreach ($candidates as $file) {
        if (is_file($file) && is_readable($file)) {
            $loaded = include $file;
            if (is_array($loaded)) {
                $cfg = array_merge($defaults, $loaded);
                break;
            }
        }
    }

    if ($cfg === null) {
        $cfg = $defaults;
    }

    /* Variables de entorno (Docker / hosting): solo las no vacías mandan.
       Permiten configurar el token sin escribir archivos dentro de la imagen. */
    $envMap = array(
        'GITHUB_TOKEN' => 'GITHUB_TOKEN',
        'GITHUB_REPO' => 'GITHUB_REPO',
        'GITHUB_BRANCH' => 'GITHUB_BRANCH',
        'CONTACT_PHONE' => 'CONTACT_PHONE',
    );
    foreach ($envMap as $key => $envVar) {
        $val = getenv($envVar);
        if (is_string($val) && $val !== '') {
            $cfg[$key] = $val;
        }
    }

    return $cfg;
}

function api_cors(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '') {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
    } else {
        header('Access-Control-Allow-Origin: *');
    }
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
    header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token, Authorization, X-Session-ID');
}

/** Inicia la sesión PHP con parámetros de cookie seguros (HttpOnly, SameSite=Lax) y soporte para header X-Session-ID / Bearer. */
function auth_session_start(): void
{
    @ini_set('session.gc_maxlifetime', '604800');
    @ini_set('session.cookie_lifetime', '604800');

    $sessionSavePath = dirname(__DIR__) . '/data/sessions';
    if (!is_dir($sessionSavePath)) {
        @mkdir($sessionSavePath, 0777, true);
        @chmod($sessionSavePath, 0777);
    }
    if (is_dir($sessionSavePath) && is_writable($sessionSavePath)) {
        @ini_set('session.save_path', $sessionSavePath);
    }

    $hdrId = trim(strval($_SERVER['HTTP_X_SESSION_ID'] ?? ''));
    if ($hdrId === '') {
        $authHdr = trim(strval($_SERVER['HTTP_AUTHORIZATION'] ?? ''));
        if (stripos($authHdr, 'Bearer ') === 0) {
            $hdrId = trim(substr($authHdr, 7));
        }
    }

    if (session_status() === PHP_SESSION_ACTIVE) {
        if (empty($_SESSION['admin_logged_in']) && !empty($hdrId)) {
            if (preg_match('/^[a-zA-Z0-9,-]{16,128}$/', $hdrId) && $hdrId !== session_id()) {
                session_write_close();
                session_id($hdrId);
                @session_start();
            }
        }
        return;
    }

    if (!headers_sent()) {
        $proto = strtolower($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '');
        $cfVisitor = strtolower($_SERVER['HTTP_CF_VISITOR'] ?? '');
        $isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || ($proto === 'https')
            || (strpos($cfVisitor, 'https') !== false)
            || (($_SERVER['SERVER_PORT'] ?? '') === '443');
        session_name('BODEGON_SESSID');
        session_set_cookie_params(array(
            'lifetime' => 86400 * 7, // 7 días
            'path'     => '/',
            'domain'   => '',
            'secure'   => $isSecure,
            'httponly' => true,
            'samesite' => 'Lax',
        ));
        if ($hdrId !== '' && preg_match('/^[a-zA-Z0-9,-]{16,128}$/', $hdrId)) {
            session_id($hdrId);
        }
        session_start();
    } else {
        if ($hdrId !== '' && preg_match('/^[a-zA-Z0-9,-]{16,128}$/', $hdrId)) {
            session_id($hdrId);
        }
        @session_start();
    }
}

/** Genera o devuelve el token CSRF para la sesión activa. */
function auth_get_csrf_token(): string
{
    auth_session_start();
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return strval($_SESSION['csrf_token']);
}

/** Valida credenciales contra variables de entorno o hash bcrypt del servidor. */
function auth_validate_credentials(string $user, string $pass): bool
{
    $envUser = getenv('ADMIN_USER');
    $normalizedUser = strtolower(trim($user));

    // Variantes válidas para el usuario administrador
    $validUsers = array('ana avila', 'ana isabel', 'anaisabel', 'admin');
    if (is_string($envUser) && $envUser !== '') {
        $validUsers[] = strtolower(trim($envUser));
    }

    if (!in_array($normalizedUser, $validUsers, true)) {
        return false;
    }

    $envHash = getenv('ADMIN_PASSWORD_HASH');
    $expectedHash = (is_string($envHash) && $envHash !== '')
        ? $envHash
        : '$2y$10$ABl/MWHAOO6HhjcWrMSYl.RUcMSQRx91CAyVYKLCHyMg6axtSGOwe';

    if (password_verify($pass, $expectedHash)) {
        return true;
    }

    $envPass = getenv('ADMIN_PASS');
    if (is_string($envPass) && $envPass !== '' && hash_equals($envPass, $pass)) {
        return true;
    }

    return false;
}

/** Middleware: Exige sesión activa de administrador y valida CSRF en peticiones mutantes. */
function auth_require_admin(): array
{
    auth_session_start();

    // Si la sesión activa no está autenticada, intentar reconectar con X-Session-ID / Bearer si se proporcionó
    if (empty($_SESSION['admin_logged_in'])) {
        $hdrId = trim(strval($_SERVER['HTTP_X_SESSION_ID'] ?? ''));
        if ($hdrId === '') {
            $authHdr = trim(strval($_SERVER['HTTP_AUTHORIZATION'] ?? ''));
            if (stripos($authHdr, 'Bearer ') === 0) {
                $hdrId = trim(substr($authHdr, 7));
            }
        }
        if ($hdrId !== '' && preg_match('/^[a-zA-Z0-9,-]{16,128}$/', $hdrId) && $hdrId !== session_id()) {
            session_write_close();
            session_id($hdrId);
            @session_start();
        }
    }

    if (empty($_SESSION['admin_logged_in'])) {
        api_send(401, array('ok' => false, 'error' => 'No autorizado. Se requiere sesión activa de administrador.'));
    }

    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (in_array($method, array('POST', 'PUT', 'DELETE'), true)) {
        $csrfSent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        if ($csrfSent === '') {
            $body = api_read_json_body();
            $csrfSent = strval($body['csrf_token'] ?? '');
        }
        $expectedCsrf = strval($_SESSION['csrf_token'] ?? '');
        if ($expectedCsrf === '' || !hash_equals($expectedCsrf, $csrfSent)) {
            api_send(403, array('ok' => false, 'error' => 'Token CSRF inválido o ausente.'));
        }
    }

    return array(
        'user'       => strval($_SESSION['admin_user'] ?? 'admin'),
        'csrf_token' => strval($_SESSION['csrf_token'] ?? ''),
    );
}

function api_send(int $status, array $body): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function api_read_json_body(): ?array
{
    static $cachedBody = null;
    if ($cachedBody !== null) {
        return $cachedBody;
    }
    $raw = file_get_contents('php://input');
    if (is_string($raw) && trim($raw) !== '') {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            $cachedBody = $decoded;
            return $cachedBody;
        }
    }
    if (!empty($_POST)) {
        $cachedBody = $_POST;
        return $cachedBody;
    }
    return null;
}

/** JSON con sangría de 2 espacios, igual que JSON.stringify(x, null, 2) de Node. */
function api_json_pretty($data): string
{
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (!is_string($json)) {
        return 'null';
    }
    return preg_replace_callback(
        '/^(?:    )+/m',
        function ($m) {
            return str_repeat('  ', intdiv(strlen($m[0]), 4));
        },
        $json
    );
}

function gh_http(string $method, string $url, ?string $token, ?string $jsonBody = null): ?array
{
    $ch = curl_init($url);
    $headers = array('Accept: application/vnd.github+json', 'User-Agent: bodegon-site');
    if (is_string($token) && $token !== '') {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    if ($jsonBody !== null) {
        $headers[] = 'Content-Type: application/json';
    }

    curl_setopt_array($ch, array(
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_HTTPHEADER => $headers,
    ));
    if ($jsonBody !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonBody);
    }

    $out = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    unset($ch);
    if (!is_string($out)) {
        return null;
    }
    $decoded = json_decode($out, true);
    return array(
        'status' => $status,
        'json' => is_array($decoded) ? $decoded : null,
        'raw' => $out,
    );
}

/** Lee un JSON del repo en GitHub. Devuelve ['sha' => ?string, 'data' => array]. */
function gh_read_json(string $repo, string $path, string $branch, string $token): array
{
    $url = 'https://api.github.com/repos/' . $repo . '/contents/' . $path . '?ref=' . urlencode($branch);
    $res = gh_http('GET', $url, $token);
    if ($res === null || $res['status'] === 404) {
        return array('sha' => null, 'data' => array());
    }
    if ($res['status'] !== 200 || !is_array($res['json']) || !isset($res['json']['content'])) {
        return array('sha' => null, 'data' => array());
    }
    $sha = isset($res['json']['sha']) ? strval($res['json']['sha']) : null;
    $b64 = preg_replace('/\s+/', '', strval($res['json']['content']));
    $decoded = base64_decode(strval($b64), true);
    if (!is_string($decoded)) {
        return array('sha' => $sha, 'data' => array());
    }
    $parsed = json_decode($decoded, true);
    return array('sha' => $sha, 'data' => is_array($parsed) ? $parsed : array());
}

/** Escribe un archivo en el repo (con sha para actualizar). Devuelve true si GitHub aceptó. */
function gh_write_file(
    string $repo,
    string $path,
    string $branch,
    string $token,
    string $content,
    string $message
): bool {
    $head = gh_http(
        'GET',
        'https://api.github.com/repos/' . $repo . '/contents/' . $path . '?ref=' . urlencode($branch),
        $token
    );

    $payload = array(
        'message' => $message,
        'content' => base64_encode($content),
        'branch' => $branch,
    );
    if ($head !== null && $head['status'] === 200 && is_array($head['json']) && isset($head['json']['sha'])) {
        $payload['sha'] = strval($head['json']['sha']);
    }

    $res = gh_http(
        'PUT',
        'https://api.github.com/repos/' . $repo . '/contents/' . $path,
        $token,
        json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
    );

    return $res !== null && $res['status'] >= 200 && $res['status'] < 300;
}

/* Este archivo es solo para include: denegar el acceso directo por HTTP. */
if (isset($_SERVER['SCRIPT_FILENAME']) && realpath($_SERVER['SCRIPT_FILENAME']) === realpath(__FILE__)) {
    http_response_code(403);
    exit;
}
