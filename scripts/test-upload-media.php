<?php
declare(strict_types=1);

/**
 * Suite de Pruebas Automatizadas para T3.2: Endpoint de Subida de Medios (/api/upload-media.php)
 * 
 * Verifica:
 *   1. Rechazo inmediato a llamadas anónimas con 401 Unauthorized.
 *   2. Rechazo a llamadas de admin sin token CSRF con 403 Forbidden.
 *   3. Rechazo a peticiones sin archivo bajo el campo 'file' con 422 Unprocessable Entity.
 *   4. Rechazo estricto a tipos MIME no permitidos (ej. texto/script) con 422 Unprocessable Entity.
 *   5. Subida autorizada exitosa de imagen con respuesta 200 OK y verificación de persistencia en disco.
 */

$baseUrl = 'http://127.0.0.1'; // probado dentro del contenedor o directamente contra el endpoint
$cookieFile = sys_get_temp_dir() . '/cookie_test_upload_' . uniqid() . '.txt';

function runCurlRequest(string $url, string $method, array $headers = array(), $postFields = null, ?string $cookieJar = null): array
{
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    if ($postFields !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
    }
    if ($cookieJar !== null) {
        curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieJar);
        curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieJar);
    }
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return array(
        'status' => $status,
        'body'   => is_string($response) ? json_decode($response, true) : null,
        'raw'    => $response,
    );
}

echo "=== INICIANDO SUITE DE PRUEBAS T3.2 (/api/upload-media) ===\n\n";

$passCount = 0;
$totalTests = 5;

// TEST 1: Petición anónima (debe fallar con 401)
$res1 = runCurlRequest('http://127.0.0.1/api/upload-media.php', 'POST', array(), array('test' => '1'));
if ($res1['status'] === 401) {
    echo "✔ Test 1 PASS: Petición anónima rechazada inmediatamente con 401 Unauthorized\n";
    $passCount++;
} else {
    echo "❌ Test 1 FAIL: Se esperaba 401, recibido " . $res1['status'] . "\n";
}

// Iniciar sesión para pruebas autorizadas
$loginRes = runCurlRequest('http://127.0.0.1/api/auth.php?action=login', 'POST', array('Content-Type: application/json'), json_encode(array(
    'user' => 'Ana Avila',
    'pass' => 'ANAISABEL2026',
)), $cookieFile);

$csrfToken = $loginRes['body']['csrf_token'] ?? '';

// TEST 2: Admin con sesión pero SIN token CSRF (debe fallar con 403)
$res2 = runCurlRequest('http://127.0.0.1/api/upload-media.php', 'POST', array(), array('test' => '1'), $cookieFile);
if ($res2['status'] === 403) {
    echo "✔ Test 2 PASS: Petición sin token CSRF rechazada con 403 Forbidden\n";
    $passCount++;
} else {
    echo "❌ Test 2 FAIL: Se esperaba 403, recibido " . $res2['status'] . "\n";
}

// TEST 3: Admin con CSRF pero sin campo 'file' (debe fallar con 422)
$res3 = runCurlRequest('http://127.0.0.1/api/upload-media.php', 'POST', array(
    'X-CSRF-Token: ' . $csrfToken,
), array('campo_incorrecto' => '1'), $cookieFile);

if ($res3['status'] === 422) {
    echo "✔ Test 3 PASS: Petición sin archivo 'file' rechazada con 422 Unprocessable Entity\n";
    $passCount++;
} else {
    echo "❌ Test 3 FAIL: Se esperaba 422, recibido " . $res3['status'] . "\n";
}

// TEST 4: Subida de archivo no permitido (ej. archivo de texto con script) (debe fallar con 422)
$fakeScript = tempnam(sys_get_temp_dir(), 'test_fake_');
file_put_contents($fakeScript, "<?php echo 'malicioso';");

$cFileBad = new CURLFile($fakeScript, 'text/plain', 'exploit.php');
$res4 = runCurlRequest('http://127.0.0.1/api/upload-media.php', 'POST', array(
    'X-CSRF-Token: ' . $csrfToken,
), array('file' => $cFileBad), $cookieFile);
@unlink($fakeScript);

if ($res4['status'] === 422 && strpos(strval($res4['body']['error'] ?? ''), 'Tipo de archivo no permitido') !== false) {
    echo "✔ Test 4 PASS: Archivo no permitido (PHP/texto) rechazado estrictamente con 422\n";
    $passCount++;
} else {
    echo "❌ Test 4 FAIL: Se esperaba 422 tipo no permitido, recibido " . $res4['status'] . "\n";
}

// TEST 5: Subida válida de imagen WebP con token CSRF
// Creamos una imagen WebP válida mínima (1x1 transparente)
$validWebpBytes = base64_decode('UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==');
$tempWebp = tempnam(sys_get_temp_dir(), 'test_img_') . '.webp';
file_put_contents($tempWebp, $validWebpBytes);

$cFileGood = new CURLFile($tempWebp, 'image/webp', 'test_photo.webp');
$res5 = runCurlRequest('http://127.0.0.1/api/upload-media.php', 'POST', array(
    'X-CSRF-Token: ' . $csrfToken,
), array('file' => $cFileGood), $cookieFile);
@unlink($tempWebp);

$uploadedUrl = $res5['body']['url'] ?? '';
$filename = $res5['body']['filename'] ?? '';
$physicalPath = file_exists('/usr/share/nginx/html/' . $uploadedUrl)
    ? '/usr/share/nginx/html/' . $uploadedUrl
    : dirname(__DIR__) . '/sitio/' . $uploadedUrl;

if ($res5['status'] === 200 && !empty($uploadedUrl) && strpos($uploadedUrl, 'assets/img/uploads/') === 0 && file_exists($physicalPath)) {
    echo "✔ Test 5 PASS: Subida exitosa con HTTP 200, URL limpia y archivo persistido físicamente en disco ({$uploadedUrl})\n";
    $passCount++;
    // Limpiar archivo de prueba
    @unlink($physicalPath);
} else {
    echo "❌ Test 5 FAIL: Subida autorizada falló o archivo no se guardó. Status: " . $res5['status'] . ", body: " . json_encode($res5['body']) . "\n";
}

// Limpiar cookie de prueba
@unlink($cookieFile);

echo "\nResultado Final: {$passCount}/{$totalTests} pruebas pasadas.\n";

if ($passCount === $totalTests) {
    echo "🎉 TODOS LOS TESTS DE T3.2 PASARON EXITOSAMENTE (5/5).\n\n";
    exit(0);
} else {
    echo "⚠️ ALGUNOS TESTS DE T3.2 FALLARON.\n\n";
    exit(1);
}
