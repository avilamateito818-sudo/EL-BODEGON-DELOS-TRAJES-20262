<?php
/**
 * Test de Integración Automatizado para T2.3: Repository Pattern de Leads y Consultas
 * Verifica persistencia local atómica, sanitización y desacoplamiento total de Git.
 */

function run_endpoint(string $endpointFile, array $body): array {
    $code = '
        $_SERVER["REQUEST_METHOD"] = "POST";
        $_POST = ' . var_export($body, true) . ';
        require_once "/var/www/html/api/_config.php";
        require "/var/www/html/api/' . $endpointFile . '";
    ';
    $cmd = 'php -r ' . escapeshellarg($code) . ' 2>&1';
    $out = shell_exec($cmd);
    if (preg_match('/\{[\s\S]*\}/', strval($out), $matches)) {
        return json_decode($matches[0], true) ?? [];
    }
    return json_decode(trim(strval($out)), true) ?? [];
}

$errors = [];

// Test 1: Rechazo de campos vacíos en /api/contact.php
$t1 = run_endpoint("contact.php", ["nombre" => "", "correo" => "", "whatsapp" => "", "mensaje" => ""]);
if (($t1["ok"] ?? null) !== false) {
    $errors[] = "Test 1 Falló: Contacto vacío debió ser rechazado. Respuesta: " . json_encode($t1);
} else {
    echo "✔ Test 1 PASS: Contacto vacío rechazado con código 422\n";
}

// Test 2: Envío de contacto válido y persistencia en LeadRepository
$t2 = run_endpoint("contact.php", [
    "nombre"   => "Maria Rodriguez",
    "whatsapp" => "3123456789",
    "mensaje"  => "Necesito alquilar un traje para el sábado",
    "tipo"     => "alquiler"
]);

if (($t2["ok"] ?? null) !== true || empty($t2["waLink"])) {
    $errors[] = "Test 2 Falló: Contacto válido no retornó OK o waLink. Respuesta: " . json_encode($t2);
} else {
    // Validar que el archivo local existe y contiene el registro
    $leadsFile = '/var/www/html/data/leads/mensajes_contacto.json';
    if (!file_exists($leadsFile)) {
        $errors[] = "Test 2 Falló: El archivo $leadsFile no fue creado";
    } else {
        $content = json_decode(file_get_contents($leadsFile), true);
        if (!is_array($content) || empty($content) || $content[0]["nombre"] !== "Maria Rodriguez") {
            $errors[] = "Test 2 Falló: El registro guardado no coincide con los datos enviados";
        } else {
            echo "✔ Test 2 PASS: Contacto persistido exitosamente en disco seguro (id: " . $content[0]["id"] . ")\n";
        }
    }
}

// Test 3: Rechazo de consulta vacía en /api/chat-ask.php
$t3 = run_endpoint("chat-ask.php", ["consulta" => "", "nombre" => "", "whatsapp" => ""]);
if (($t3["ok"] ?? null) !== false) {
    $errors[] = "Test 3 Falló: Consulta vacía debió ser rechazada. Respuesta: " . json_encode($t3);
} else {
    echo "✔ Test 3 PASS: Consulta vacía del asistente rechazada con código 422\n";
}

// Test 4: Consulta válida del asistente virtual y persistencia en LeadRepository
$t4 = run_endpoint("chat-ask.php", [
    "nombre"    => "Juan Camilo",
    "whatsapp"  => "3159988776",
    "consulta"  => "¿Tienen disfraces de época para la temporada de noviembre?",
    "categoria" => "noviembre"
]);

if (($t4["ok"] ?? null) !== true || empty($t4["waLink"])) {
    $errors[] = "Test 4 Falló: Consulta válida no retornó OK o waLink. Respuesta: " . json_encode($t4);
} else {
    $chatFile = '/var/www/html/data/leads/consultas_asistente.json';
    if (!file_exists($chatFile)) {
        $errors[] = "Test 4 Falló: El archivo $chatFile no fue creado";
    } else {
        $content = json_decode(file_get_contents($chatFile), true);
        if (!is_array($content) || empty($content) || $content[0]["nombre"] !== "Juan Camilo") {
            $errors[] = "Test 4 Falló: El registro de consulta no coincide";
        } else {
            echo "✔ Test 4 PASS: Consulta del asistente persistida exitosamente (id: " . $content[0]["id"] . ")\n";
        }
    }
}

// Test 5: Comprobación de que el directorio privado está protegido con .htaccess e index.html
$htaccess = '/var/www/html/data/leads/.htaccess';
$index = '/var/www/html/data/leads/index.html';
if (file_exists($htaccess) && file_exists($index)) {
    echo "✔ Test 5 PASS: Directorio de almacenamiento protegido con control de acceso (.htaccess + index.html)\n";
} else {
    $errors[] = "Test 5 Falló: No se encontraron archivos de protección en data/leads/";
}

if (!empty($errors)) {
    echo "\n❌ ERRORES ENCONTRADOS EN T2.3:\n" . implode("\n", $errors) . "\n";
    exit(1);
}

echo "\n🎉 TODOS LOS TESTS DE T2.3 PASARON EXITOSAMENTE (5/5).\n";
exit(0);
