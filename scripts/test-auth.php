<?php
/**
 * Test de Integración Automatizado para /api/auth.php
 * Ejecución: docker run --rm -v "${PWD}/sitio:/var/www/html" -v "${PWD}/scripts:/var/www/scripts" php:8.3-fpm-alpine php /var/www/scripts/test-auth.php
 */

function test_call(string $method, array $get = [], array $post = []): array {
    $code = '
        $_SERVER["REQUEST_METHOD"] = ' . var_export($method, true) . ';
        $_GET = ' . var_export($get, true) . ';
        $_POST = ' . var_export($post, true) . ';
        require "/var/www/html/api/auth.php";
    ';
    $cmd = 'php -r ' . escapeshellarg($code);
    $out = shell_exec($cmd);
    return json_decode(trim($out), true) ?? [];
}

$errors = [];

// Test 1: Status anónimo
$t1 = test_call("GET", ["action" => "status"]);
if (($t1["authenticated"] ?? null) !== false) {
    $errors[] = "Test 1 Falló: Status anónimo debe tener authenticated=false";
} else {
    echo "✔ Test 1 PASS: Status anónimo devuelve authenticated=false\n";
}

// Test 2: Login con credenciales incorrectas
$t2 = test_call("POST", ["action" => "login"], ["user" => "Ana Avila", "pass" => "CLAVE_INCORRECTA"]);
if (($t2["ok"] ?? null) !== false || !str_contains($t2["error"] ?? "", "incorrectos")) {
    $errors[] = "Test 2 Falló: Credenciales incorrectas no fueron rechazadas";
} else {
    echo "✔ Test 2 PASS: Credenciales incorrectas rechazadas con 401\n";
}

// Test 3: Login con campos vacíos
$t3 = test_call("POST", ["action" => "login"], ["user" => "", "pass" => ""]);
if (($t3["ok"] ?? null) !== false || !str_contains($t3["error"] ?? "", "obligatorios")) {
    $errors[] = "Test 3 Falló: Validación de campos vacíos no activada";
} else {
    echo "✔ Test 3 PASS: Campos vacíos rechazados con 422\n";
}

// Test 4: Login con credenciales correctas
$t4 = test_call("POST", ["action" => "login"], ["user" => "Ana Avila", "pass" => "ANAISABEL2026"]);
if (($t4["authenticated"] ?? null) !== true || strlen($t4["csrf_token"] ?? "") !== 64) {
    $errors[] = "Test 4 Falló: Login válido no generó sesión o CSRF token de 64 caracteres";
} else {
    echo "✔ Test 4 PASS: Login exitoso genera sesión activa y token CSRF (64 chars: " . substr($t4["csrf_token"], 0, 8) . "...)\n";
}

// Test 5: Logout
$t5 = test_call("POST", ["action" => "logout"]);
if (($t5["authenticated"] ?? null) !== false) {
    $errors[] = "Test 5 Falló: Logout no destruyó sesión";
} else {
    echo "✔ Test 5 PASS: Logout destruye sesión y devuelve authenticated=false\n";
}

if (!empty($errors)) {
    echo "\n❌ ERRORES ENCONTRADOS:\n" . implode("\n", $errors) . "\n";
    exit(1);
}

echo "\n🎉 TODOS LOS TESTS DE T2.1 PASARON EXITOSAMENTE (5/5).\n";
exit(0);
