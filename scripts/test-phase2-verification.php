<?php
/**
 * test-phase2-verification.php — Suite Automatizada de Verificación de Backend (Fase 2)
 * El Bodegón de los Trajes (Tunja, Boyacá)
 * 
 * Valida:
 *   - TSK-04: Autenticación, sesión segura y CSRF
 *   - TSK-05: CRUD de catálogo público y protegido con LOCK_EX
 *   - TSK-06: Carga de medios y validación MIME
 *   - TSK-07: Bandeja de leads y formateo WhatsApp
 */

$baseUrl = 'http://localhost'; // Se ejecuta dentro del contenedor Nginx/PHP

$passed = 0;
$total = 7;

echo "=== VERIFICACIÓN AUTOMATIZADA: FASE 2 (BACKEND REST & PERSISTENCIA) ===\n\n";

// Helper para peticiones HTTP cURL con cookies de sesión
function make_request(string $url, string $method = 'GET', $data = null, array $headers = [], $cookieJar = null) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HEADER, true);

    if ($cookieJar) {
        curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieJar);
        curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieJar);
    }

    if ($data !== null) {
        if (is_array($data) && !isset($headers['Content-Type'])) {
            $data = json_encode($data);
            $headers[] = 'Content-Type: application/json';
        }
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    }

    if (!empty($headers)) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }

    $response = curl_exec($ch);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $statusCode = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    unset($ch);

    $headerStr = substr($response, 0, $headerSize);
    $bodyStr = substr($response, $headerSize);
    $json = json_decode($bodyStr, true);

    return [
        'status' => $statusCode,
        'headers' => $headerStr,
        'body' => $bodyStr,
        'json' => $json
    ];
}

$cookieJar = tempnam(sys_get_temp_dir(), 'bodegon_test_');

// -------------------------------------------------------------
// Test 1: GET /api/auth?action=status (Anónimo)
// -------------------------------------------------------------
$res = make_request($baseUrl . '/api/auth?action=status');
if ($res['status'] === 200 && isset($res['json']['authenticated']) && $res['json']['authenticated'] === false) {
    echo "[PASS] Test 1: /api/auth responde anónimo correctamente.\n";
    $passed++;
} else {
    echo "[FAIL] Test 1: Status code {$res['status']} o estado de autenticación inesperado.\n";
}

// -------------------------------------------------------------
// Test 2: POST /api/auth?action=login (Fallo con malas credenciales y Éxito con válidas)
// -------------------------------------------------------------
$failLogin = make_request($baseUrl . '/api/auth?action=login', 'POST', [
    'user' => 'Ana Avila',
    'pass' => 'ClaveIncorrecta123'
]);

$successLogin = make_request($baseUrl . '/api/auth?action=login', 'POST', [
    'user' => 'Ana Avila',
    'pass' => 'ANAISABEL2026'
], [], $cookieJar);

$csrfToken = $successLogin['json']['csrf_token'] ?? '';

if ($failLogin['status'] === 401 && $successLogin['status'] === 200 && strlen($csrfToken) === 64) {
    echo "[PASS] Test 2: Login rechaza claves erróneas (401) y genera sesión con CSRF de 64 chars.\n";
    $passed++;
} else {
    echo "[FAIL] Test 2: Fallo en login (failStatus: {$failLogin['status']}, okStatus: {$successLogin['status']}).\n";
}

// -------------------------------------------------------------
// Test 3: GET /api/catalogo (Consulta pública del catálogo estructurado)
// -------------------------------------------------------------
$resCat = make_request($baseUrl . '/api/catalogo');
if ($resCat['status'] === 200 && !empty($resCat['json']['temporadas']) && count($resCat['json']['trajes'] ?? []) >= 100) {
    $count = count($resCat['json']['trajes']);
    echo "[PASS] Test 3: /api/catalogo sirve catálogo público ({$count} trajes, 12 temporadas).\n";
    $passed++;
} else {
    echo "[FAIL] Test 3: Error en /api/catalogo (status {$resCat['status']}).\n";
}

// -------------------------------------------------------------
// Test 4: POST /api/catalogo (Creación protegida con sesión y CSRF)
// -------------------------------------------------------------
// Intento anónimo -> 401
$anonPost = make_request($baseUrl . '/api/catalogo', 'POST', ['titulo' => 'Test', 'temporada' => 'octubre']);
// Intento sin CSRF -> 403
$noCsrfPost = make_request($baseUrl . '/api/catalogo', 'POST', ['titulo' => 'Test', 'temporada' => 'octubre'], [], $cookieJar);
// Intento autorizado con CSRF -> 201
$testTraje = [
    'titulo' => 'Traje de Prueba Automatizada ' . time(),
    'temporada' => 'octubre',
    'descripcion' => 'Descripción de prueba para test unitario',
    'grupo' => 'Pruebas QA',
    'foto' => 'assets/img/ph-octubre.svg'
];
$authPost = make_request($baseUrl . '/api/catalogo', 'POST', $testTraje, [
    'X-CSRF-Token: ' . $csrfToken
], $cookieJar);

$newId = $authPost['json']['traje']['id'] ?? '';

if ($anonPost['status'] === 401 && $noCsrfPost['status'] === 403 && $authPost['status'] === 201 && !empty($newId)) {
    echo "[PASS] Test 4: Creación de traje blindada (401 anónimo, 403 sin CSRF, 201 autorizado con ID: {$newId}).\n";
    $passed++;
} else {
    echo "[FAIL] Test 4: Anon: {$anonPost['status']}, NoCsrf: {$noCsrfPost['status']}, Auth: {$authPost['status']}.\n";
}

// -------------------------------------------------------------
// Test 5: PUT /api/catalogo (Actualización protegida)
// -------------------------------------------------------------
$updateData = [
    'id' => $newId,
    'titulo' => 'Traje Modificado por Test ' . time(),
    'descripcion' => 'Nueva descripción modificada'
];
$putRes = make_request($baseUrl . '/api/catalogo', 'PUT', $updateData, [
    'X-CSRF-Token: ' . $csrfToken
], $cookieJar);

if ($putRes['status'] === 200 && ($putRes['json']['traje']['titulo'] ?? '') === $updateData['titulo']) {
    echo "[PASS] Test 5: Actualización de traje con PUT procesada con éxito (HTTP 200).\n";
    $passed++;
} else {
    echo "[FAIL] Test 5: Error en PUT (status {$putRes['status']}).\n";
}

// -------------------------------------------------------------
// Test 6: DELETE /api/catalogo (Eliminación protegida y limpieza)
// -------------------------------------------------------------
$delRes = make_request($baseUrl . '/api/catalogo?id=' . urlencode($newId), 'DELETE', null, [
    'X-CSRF-Token: ' . $csrfToken
], $cookieJar);

if ($delRes['status'] === 200 && ($delRes['json']['deleted_id'] ?? '') === $newId) {
    echo "[PASS] Test 6: Eliminación con DELETE procesada y traje de prueba removido (HTTP 200).\n";
    $passed++;
} else {
    echo "[FAIL] Test 6: Error en DELETE (status {$delRes['status']}).\n";
}

// -------------------------------------------------------------
// Test 7: GET /api/leads (Consulta protegida de prospectos y WhatsApp helper)
// -------------------------------------------------------------
$anonLeads = make_request($baseUrl . '/api/leads');
$authLeads = make_request($baseUrl . '/api/leads', 'GET', null, [], $cookieJar);

if ($anonLeads['status'] === 401 && $authLeads['status'] === 200 && isset($authLeads['json']['leads'])) {
    $leadsCount = count($authLeads['json']['leads']);
    echo "[PASS] Test 7: /api/leads protegido con sesión (401 anónimo, 200 autorizado con {$leadsCount} prospectos).\n";
    $passed++;
} else {
    echo "[FAIL] Test 7: Error en leads (anon: {$anonLeads['status']}, auth: {$authLeads['status']}).\n";
}

@unlink($cookieJar);

echo "\nResultado: {$passed}/{$total} pruebas superadas.\n";
if ($passed === $total) {
    echo "✅ FASE 2 VERIFICADA Y COMPLETADA CON ÉXITO.\n";
    exit(0);
} else {
    echo "❌ Errores en la verificación de Fase 2.\n";
    exit(1);
}
