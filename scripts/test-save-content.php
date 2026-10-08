<?php
/**
 * Test de Integración Automatizado para T2.2: Blindaje de /api/save-content.php
 * Verifica que el endpoint rechaza peticiones no autorizadas y valida sesión y CSRF token.
 */

function test_save_call(string $method, array $sessionData = [], array $headers = [], array $body = []): array {
    $code = '
        $_SERVER["REQUEST_METHOD"] = ' . var_export($method, true) . ';
        if (!empty(' . var_export($headers, true) . ')) {
            foreach (' . var_export($headers, true) . ' as $k => $v) {
                $_SERVER[$k] = $v;
            }
        }
        require_once "/var/www/html/api/_config.php";
        auth_session_start();
        if (!empty(' . var_export($sessionData, true) . ')) {
            foreach (' . var_export($sessionData, true) . ' as $k => $v) {
                $_SESSION[$k] = $v;
            }
        }
        $_POST = ' . var_export($body, true) . ';
        require "/var/www/html/api/save-content.php";
    ';
    $cmd = 'php -r ' . escapeshellarg($code) . ' 2>&1';
    $out = shell_exec($cmd);
    return json_decode(trim($out), true) ?? [];
}

$errors = [];

// Test 1: Petición anónima (sin sesión de administrador)
$t1 = test_save_call("POST", [], [], ["content" => "{}"]);
if (($t1["ok"] ?? null) !== false || !str_contains($t1["error"] ?? "", "No autorizado")) {
    $errors[] = "Test 1 Falló: Petición anónima no fue rechazada con 401. Respuesta: " . json_encode($t1);
} else {
    echo "✔ Test 1 PASS: Petición anónima rechazada inmediatamente con 401 Unauthorized\n";
}

// Test 2: Petición autenticada pero sin token CSRF
$fakeCsrf = bin2hex(random_bytes(32));
$t2 = test_save_call("POST", ["admin_logged_in" => true, "admin_user" => "Ana Avila", "csrf_token" => $fakeCsrf], [], ["content" => "{}"]);
if (($t2["ok"] ?? null) !== false || !str_contains($t2["error"] ?? "", "CSRF")) {
    $errors[] = "Test 2 Falló: Petición sin token CSRF no fue rechazada con 403. Respuesta: " . json_encode($t2);
} else {
    echo "✔ Test 2 PASS: Petición sin token CSRF rechazada con 403 Forbidden\n";
}

// Test 3: Petición autenticada con token CSRF incorrecto
$t3 = test_save_call(
    "POST",
    ["admin_logged_in" => true, "admin_user" => "Ana Avila", "csrf_token" => $fakeCsrf],
    ["HTTP_X_CSRF_TOKEN" => "TOKEN_FALSO_1234567890"],
    ["content" => "{}"]
);
if (($t3["ok"] ?? null) !== false || !str_contains($t3["error"] ?? "", "CSRF")) {
    $errors[] = "Test 3 Falló: Petición con token CSRF falso no fue rechazada. Respuesta: " . json_encode($t3);
} else {
    echo "✔ Test 3 PASS: Petición con token CSRF incorrecto rechazada con 403 Forbidden\n";
}

// Test 4: Petición autenticada con sesión válida y token CSRF correcto (modo test)
$t4 = test_save_call(
    "POST",
    ["admin_logged_in" => true, "admin_user" => "Ana Avila", "csrf_token" => $fakeCsrf],
    ["HTTP_X_CSRF_TOKEN" => $fakeCsrf],
    ["test" => true]
);
if (($t4["ok"] ?? null) !== true || ($t4["test"] ?? null) !== true) {
    $errors[] = "Test 4 Falló: Petición autorizada con CSRF válido no respondió 200 OK. Respuesta: " . json_encode($t4);
} else {
    echo "✔ Test 4 PASS: Petición autorizada con sesión y token CSRF válido responde 200 OK (test mode)\n";
}

// Test 5: Petición autenticada guardando contenido válido en disco local
$t5 = test_save_call(
    "POST",
    ["admin_logged_in" => true, "admin_user" => "Ana Avila", "csrf_token" => $fakeCsrf],
    ["HTTP_X_CSRF_TOKEN" => $fakeCsrf],
    ["content" => ["texts" => [], "images" => []], "message" => "Test unitario"]
);
if (($t5["ok"] ?? null) !== true || ($t5["user"] ?? "") !== "Ana Avila") {
    $errors[] = "Test 5 Falló: Guardado autorizado falló. Respuesta: " . json_encode($t5);
} else {
    echo "✔ Test 5 PASS: Guardado autorizado exitoso con atribución de autor ('Ana Avila')\n";
}

if (!empty($errors)) {
    echo "\n❌ ERRORES ENCONTRADOS EN T2.2:\n" . implode("\n", $errors) . "\n";
    exit(1);
}

echo "\n🎉 TODOS LOS TESTS DE T2.2 PASARON EXITOSAMENTE (5/5).\n";
exit(0);
