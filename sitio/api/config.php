<?php
/**
 * Endpoint de Configuración General del Negocio — El Bodegón de los Trajes
 * Arquitectura Limpia: Controlador HTTP / Capa de Adaptadores de Interfaz
 * 
 * Acciones soportadas:
 *   - GET  /api/config  -> Consulta pública de los datos de contacto y horarios
 *   - POST /api/config  -> Actualización de datos de negocio (Requiere Admin + CSRF)
 */

require_once __DIR__ . '/_config.php';

api_cors();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'OPTIONS') {
    api_send(200, array('ok' => true));
}

$configFile = dirname(__DIR__) . '/data/config-negocio.json';

function default_config(): array
{
    return array(
        'whatsapp' => '573107706615',
        'phone_display' => '+57 310 770 6615',
        'email' => 'elbodegondelostrajes@gmail.com',
        'address' => 'Diagonal 66 2B 04, Tunja, Boyacá',
        'hours_week' => 'Lun–Sáb 8:00 am – 6:00 pm',
        'hours_sun' => 'Dom y festivos 9:00 am – 1:00 pm',
        'ultima_actualizacion' => gmdate('Y-m-d\TH:i:s\Z')
    );
}

function load_business_config(string $filePath): array
{
    if (!is_file($filePath)) {
        return default_config();
    }
    $raw = @file_get_contents($filePath);
    if (!is_string($raw)) {
        return default_config();
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        return default_config();
    }
    return array_merge(default_config(), $data);
}

function save_business_config(string $filePath, array $data): bool
{
    $dir = dirname($filePath);
    if (!is_dir($dir)) {
        @mkdir($dir, 0777, true);
    }
    $data['ultima_actualizacion'] = gmdate('Y-m-d\TH:i:s\Z');
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        return false;
    }
    return @file_put_contents($filePath, $json, LOCK_EX) !== false;
}

if ($method === 'GET') {
    $config = load_business_config($configFile);
    api_send(200, array('ok' => true, 'config' => $config));
}

if ($method === 'POST') {
    $admin = auth_require_admin();
    $payload = api_read_json_body();
    if (!is_array($payload)) {
        api_send(400, array('ok' => false, 'error' => 'Cuerpo JSON inválido.'));
    }

    $current = load_business_config($configFile);

    if (isset($payload['whatsapp'])) {
        $cleanWa = preg_replace('/[^0-9]/', '', (string)$payload['whatsapp']);
        if (strlen($cleanWa) >= 7) {
            $current['whatsapp'] = $cleanWa;
        }
    }
    if (isset($payload['phone_display'])) {
        $current['phone_display'] = trim((string)$payload['phone_display']);
    }
    if (isset($payload['email'])) {
        $cleanEmail = filter_var(trim((string)$payload['email']), FILTER_VALIDATE_EMAIL);
        if ($cleanEmail) {
            $current['email'] = $cleanEmail;
        }
    }
    if (isset($payload['address'])) {
        $current['address'] = trim((string)$payload['address']);
    }
    if (isset($payload['hours_week'])) {
        $current['hours_week'] = trim((string)$payload['hours_week']);
    }
    if (isset($payload['hours_sun'])) {
        $current['hours_sun'] = trim((string)$payload['hours_sun']);
    }

    if (!save_business_config($configFile, $current)) {
        api_send(500, array('ok' => false, 'error' => 'No se pudo guardar la configuración en disco.'));
    }

    api_send(200, array(
        'ok' => true,
        'mensaje' => 'Configuración de negocio guardada exitosamente.',
        'config' => $current,
        'user' => $admin['user'] ?? 'admin'
    ));
}

api_send(405, array('ok' => false, 'error' => 'Método no permitido.'));
