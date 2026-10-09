<?php
/**
 * Capa de Persistencia: LeadRepository — El Bodegón de los Trajes.
 * Arquitectura Limpia: Patrón Repositorio (Repository Pattern).
 * 
 * Desacopla la persistencia de mensajes de contacto y consultas del asistente
 * de APIs externas o Git, garantizando atomicidad (LOCK_EX) y privacidad (Habeas Data).
 */

require_once __DIR__ . '/_config.php';

class LeadRepository
{
    private static function getStorageDir(): string
    {
        $dir = dirname(__DIR__) . '/data/leads';
        if (!is_dir($dir)) {
            @mkdir($dir, 0777, true);
            @chmod($dir, 0777);
            // Proteger contra acceso web directo si el servidor web no tiene regla explícita
            $htaccess = $dir . '/.htaccess';
            if (!file_exists($htaccess)) {
                @file_put_contents($htaccess, "Deny from all\n");
                @chmod($htaccess, 0666);
            }
            $index = $dir . '/index.html';
            if (!file_exists($index)) {
                @file_put_contents($index, "<!DOCTYPE html><title>403 Forbidden</title><h1>Acceso Denegado</h1>");
                @chmod($index, 0666);
            }
        }
        return $dir;
    }

    /**
     * Guarda un registro en un archivo JSON local de forma atómica y segura.
     */
    private static function appendRecord(string $filename, array $record): bool
    {
        $dir = self::getStorageDir();
        $filepath = $dir . '/' . $filename;

        $fp = @fopen($filepath, 'c+');
        if (!$fp) {
            return false;
        }

        $success = false;
        if (flock($fp, LOCK_EX)) {
            $size = filesize($filepath);
            $content = '';
            if ($size > 0) {
                $content = fread($fp, $size);
            }

            $list = array();
            if (is_string($content) && trim($content) !== '') {
                $decoded = json_decode($content, true);
                if (is_array($decoded)) {
                    $list = $decoded;
                }
            }

            // Insertar al inicio y limitar a los últimos 500 registros para evitar crecimiento ilimitado
            array_unshift($list, $record);
            if (count($list) > 500) {
                $list = array_slice($list, 0, 500);
            }

            ftruncate($fp, 0);
            rewind($fp);
            $written = fwrite($fp, json_encode($list, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n");
            fflush($fp);
            flock($fp, LOCK_UN);
            $success = ($written !== false);
            @chmod($filepath, 0666);
        }

        fclose($fp);
        return $success;
    }

    /**
     * Persiste un mensaje de contacto.
     */
    public static function saveContact(array $contactData): bool
    {
        $record = array(
            'id'        => 'lead_' . bin2hex(random_bytes(6)),
            'fecha'     => gmdate('c'),
            'tipo'      => $contactData['tipo'] ?? 'contacto',
            'nombre'    => strval($contactData['nombre'] ?? ''),
            'correo'    => strval($contactData['correo'] ?? ''),
            'whatsapp'  => strval($contactData['whatsapp'] ?? ''),
            'mensaje'   => strval($contactData['mensaje'] ?? ''),
            'ip'        => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1',
        );

        $saved = self::appendRecord('mensajes_contacto.json', $record);

        // Envío de correo administrativo si está disponible
        self::sendAdminNotification(
            'Nuevo mensaje de contacto web (' . ($record['nombre'] ?: 'Cliente') . ')',
            "Nombre: " . $record['nombre'] . "\n"
            . "Contacto: " . ($record['correo'] ?: $record['whatsapp']) . "\n"
            . "Tipo: " . $record['tipo'] . "\n\n"
            . "Mensaje:\n" . $record['mensaje'],
            $record['correo']
        );

        return $saved;
    }

    /**
     * Persiste una consulta originada en el Asistente Virtual.
     */
    public static function saveChatQuery(array $chatData): bool
    {
        $record = array(
            'id'        => 'chat_' . bin2hex(random_bytes(6)),
            'fecha'     => gmdate('c'),
            'categoria' => strval($chatData['categoria'] ?? 'consulta libre'),
            'consulta'  => strval($chatData['consulta'] ?? ''),
            'nombre'    => strval($chatData['nombre'] ?? ''),
            'whatsapp'  => strval($chatData['whatsapp'] ?? ''),
            'ip'        => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1',
        );

        return self::appendRecord('consultas_asistente.json', $record);
    }

    /**
     * Notificación por email directo (SMTP nativo) sin depender de APIs de terceros.
     */
    private static function sendAdminNotification(string $subject, string $body, string $replyTo = ''): void
    {
        $cfg = bodegon_config();
        $to = $cfg['CONTACT_EMAIL'] ?? 'elbodegondelostrajes@gmail.com';

        // Solo invocar mail() en entornos web con agente de transporte (MTA) operativo
        if (function_exists('mail') && !empty($to) && php_sapi_name() !== 'cli') {
            $fromHost = $_SERVER['SERVER_NAME'] ?? 'elbodegondelostrajes.com';
            $headers = "From: webmaster@" . $fromHost . "\r\n";
            $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
            if ($replyTo !== '') {
                $headers .= "Reply-To: " . $replyTo . "\r\n";
            }
            @mail($to, $subject, $body, $headers);
        }
    }

    /**
     * Retorna todos los leads almacenados para el panel de administración.
     */
    public static function getAllLeads(): array
    {
        $dir = self::getStorageDir();
        $mensajes = array();
        $consultas = array();

        $mf = $dir . '/mensajes_contacto.json';
        if (is_file($mf)) {
            $decoded = json_decode(@file_get_contents($mf), true);
            if (is_array($decoded)) $mensajes = $decoded;
        }

        $cf = $dir . '/consultas_asistente.json';
        if (is_file($cf)) {
            $decoded = json_decode(@file_get_contents($cf), true);
            if (is_array($decoded)) $consultas = $decoded;
        }

        // Combinar y enriquecer con enlaces a WhatsApp
        $all = array();
        foreach ($mensajes as $m) {
            $phone = preg_replace('/[^0-9]/', '', strval($m['whatsapp'] ?? ''));
            if ($phone !== '' && strlen($phone) === 10) {
                $phone = '57' . $phone;
            }
            $nombre = trim(strval($m['nombre'] ?? ''));
            $waMsg = 'Hola' . ($nombre !== '' ? ' ' . $nombre : '') . ', te escribimos de El Bodegón de los Trajes respecto a tu mensaje en la página web.';
            $m['wa_link'] = ($phone !== '') ? 'https://wa.me/' . $phone . '?text=' . rawurlencode($waMsg) : null;
            $all[] = $m;
        }

        foreach ($consultas as $c) {
            $phone = preg_replace('/[^0-9]/', '', strval($c['whatsapp'] ?? ''));
            if ($phone !== '' && strlen($phone) === 10) {
                $phone = '57' . $phone;
            }
            $nombre = trim(strval($c['nombre'] ?? ''));
            $waMsg = 'Hola' . ($nombre !== '' ? ' ' . $nombre : '') . ', te escribimos de El Bodegón de los Trajes respecto a tu consulta en el asistente virtual.';
            $c['wa_link'] = ($phone !== '') ? 'https://wa.me/' . $phone . '?text=' . rawurlencode($waMsg) : null;
            $c['mensaje'] = $c['consulta'] ?? '';
            $all[] = $c;
        }

        // Ordenar cronológicamente descendente
        usort($all, function ($a, $b) {
            return strcmp(strval($b['fecha'] ?? ''), strval($a['fecha'] ?? ''));
        });

        return $all;
    }
}

// =========================================================================
// Controlador HTTP si se invoca leads.php directamente
// =========================================================================
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'leads.php') {
    api_cors();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'OPTIONS') {
        api_send(200, array('ok' => true));
    }

    // Exige sesión activa de administrador
    auth_require_admin();

    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    $leads = LeadRepository::getAllLeads();
    api_send(200, array(
        'ok' => true,
        'total' => count($leads),
        'leads' => $leads
    ));
}
