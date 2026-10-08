<?php
/**
 * Endpoint de Autenticación de Administrador — El Bodegón de los Trajes.
 * Arquitectura Limpia: Controlador HTTP / Capa de Adaptadores de Interfaz.
 * 
 * Acciones soportadas:
 *   - GET  /api/auth          -> Estado actual de la sesión (status)
 *   - POST /api/auth (login)  -> Validación segura de credenciales y creación de sesión
 *   - POST /api/auth (logout) -> Destrucción de sesión y limpieza de cookies
 */

require_once __DIR__ . '/_config.php';

api_cors();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'OPTIONS') {
    api_send(200, array('ok' => true));
}

$body = api_read_json_body() ?? array();
$action = strval($_GET['action'] ?? ($body['action'] ?? ''));

// Si es GET y no se especificó acción, se asume consulta de estado (status)
if ($method === 'GET' && $action === '') {
    $action = 'status';
}

switch ($action) {
    case 'status':
        auth_session_start();
        $isAuth = !empty($_SESSION['admin_logged_in']);
        api_send(200, array(
            'ok'            => true,
            'authenticated' => $isAuth,
            'user'          => $isAuth ? strval($_SESSION['admin_user'] ?? '') : null,
            'csrf_token'    => $isAuth ? auth_get_csrf_token() : null,
        ));
        break;

    case 'login':
        if ($method !== 'POST') {
            api_send(405, array('ok' => false, 'error' => 'Método no permitido. Use POST para login.'));
        }

        $user = trim(strval($body['user'] ?? ($body['username'] ?? '')));
        $pass = strval($body['pass'] ?? ($body['password'] ?? ''));

        if ($user === '' || $pass === '') {
            api_send(422, array('ok' => false, 'error' => 'Usuario y contraseña obligatorios.'));
        }

        if (!auth_validate_credentials($user, $pass)) {
            // Mitigación de fuerza bruta con retardo
            usleep(400000); // 400ms
            api_send(401, array('ok' => false, 'error' => 'Usuario o contraseña incorrectos.'));
        }

        auth_session_start();
        session_regenerate_id(true); // Previene ataques de fijación de sesión
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_user'] = $user;
        $csrf = auth_get_csrf_token();

        api_send(200, array(
            'ok'            => true,
            'authenticated' => true,
            'user'          => $user,
            'csrf_token'    => $csrf,
            'message'       => 'Sesión iniciada exitosamente.',
        ));
        break;

    case 'logout':
        auth_session_start();
        $_SESSION = array();
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params['path'],
                $params['domain'],
                $params['secure'],
                $params['httponly']
            );
        }
        session_destroy();
        api_send(200, array(
            'ok'            => true,
            'authenticated' => false,
            'message'       => 'Sesión cerrada exitosamente.',
        ));
        break;

    default:
        // Si se hace POST sin action explícito pero con credenciales, asumir login
        if ($method === 'POST' && (isset($body['user']) || isset($body['username']))) {
            $user = trim(strval($body['user'] ?? ($body['username'] ?? '')));
            $pass = strval($body['pass'] ?? ($body['password'] ?? ''));

            if (!auth_validate_credentials($user, $pass)) {
                usleep(400000);
                api_send(401, array('ok' => false, 'error' => 'Usuario o contraseña incorrectos.'));
            }

            auth_session_start();
            session_regenerate_id(true);
            $_SESSION['admin_logged_in'] = true;
            $_SESSION['admin_user'] = $user;
            $csrf = auth_get_csrf_token();

            api_send(200, array(
                'ok'            => true,
                'authenticated' => true,
                'user'          => $user,
                'csrf_token'    => $csrf,
                'message'       => 'Sesión iniciada exitosamente.',
            ));
        }

        api_send(400, array('ok' => false, 'error' => 'Acción no reconocida.'));
        break;
}
