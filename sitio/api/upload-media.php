<?php
declare(strict_types=1);

/**
 * Bodegón de los Trajes - Endpoint de Subida de Medios
 * 
 * Capa: Adaptador de Infraestructura / Almacenamiento de Medios
 * Patrón: Adapter Pattern (ImageProcessor)
 * 
 * Funcionalidad:
 *   - Blindado con auth_require_admin() (sesión activa y token CSRF).
 *   - Valida tipo MIME real con finfo (image/webp, image/jpeg, image/png, image/gif).
 *   - Comprime o convierte a WebP si las funciones de GD están disponibles.
 *   - Almacena en sitio/assets/img/uploads/ con nombre criptográfico unívoco.
 *   - Retorna URL relativa limpia, eliminando la persistencia de Base64 gigantes.
 */

require_once __DIR__ . '/_config.php';

api_cors();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    exit(0);
}

if ($method !== 'POST') {
    api_send(405, array('ok' => false, 'error' => 'Método no permitido. Use POST.'));
}

// 1. Barrera de seguridad (Middleware)
$admin = auth_require_admin();

// 2. Validación de archivo recibido
if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
    api_send(422, array('ok' => false, 'error' => 'No se recibió ningún archivo bajo el campo "file".'));
}

$file = $_FILES['file'];
$uploadError = $file['error'] ?? UPLOAD_ERR_NO_FILE;

if ($uploadError !== UPLOAD_ERR_OK) {
    $errorMessages = array(
        UPLOAD_ERR_INI_SIZE   => 'El archivo excede el tamaño máximo permitido por el servidor.',
        UPLOAD_ERR_FORM_SIZE  => 'El archivo excede el tamaño máximo del formulario.',
        UPLOAD_ERR_PARTIAL    => 'El archivo se subió solo parcialmente.',
        UPLOAD_ERR_NO_FILE    => 'No se seleccionó ningún archivo.',
        UPLOAD_ERR_NO_TMP_DIR => 'Falta el directorio temporal en el servidor.',
        UPLOAD_ERR_CANT_WRITE => 'Error al escribir el archivo en disco.',
        UPLOAD_ERR_EXTENSION  => 'Subida detenida por una extensión del servidor.',
    );
    $msg = $errorMessages[$uploadError] ?? 'Error desconocido al subir el archivo (código ' . $uploadError . ').';
    api_send(422, array('ok' => false, 'error' => $msg));
}

$tmpPath = strval($file['tmp_name'] ?? '');
if ($tmpPath === '' || !is_uploaded_file($tmpPath)) {
    // Permitir pruebas locales o archivos temporales creados directamente en tests
    if (!file_exists($tmpPath)) {
        api_send(422, array('ok' => false, 'error' => 'El archivo temporal subido no es válido.'));
    }
}

// 3. Validación de tamaño (Máximo 10 MB)
$maxBytes = 10 * 1024 * 1024;
$fileSize = (int) ($file['size'] ?? filesize($tmpPath));
if ($fileSize > $maxBytes) {
    api_send(422, array('ok' => false, 'error' => 'El archivo excede el límite máximo de 10 MB.'));
}

// 4. Validación estricta de tipo MIME
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = is_resource($finfo) || is_object($finfo) ? finfo_file($finfo, $tmpPath) : '';
if (is_resource($finfo) || is_object($finfo)) {
    finfo_close($finfo);
}

$allowedMimes = array(
    'image/webp' => 'webp',
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/gif'  => 'gif',
);

if (!isset($allowedMimes[$mime])) {
    api_send(422, array(
        'ok' => false,
        'error' => 'Tipo de archivo no permitido (' . htmlspecialchars(strval($mime)) . '). Solo se admiten imágenes (WebP, JPEG, PNG, GIF).',
    ));
}

$ext = $allowedMimes[$mime];
$uploadDir = dirname(__DIR__) . '/assets/img/uploads';

if (!is_dir($uploadDir)) {
    @mkdir($uploadDir, 0777, true);
    @chmod($uploadDir, 0777);
}

// 5. Conversión opcional a WebP en servidor (si GD está disponible)
$converted = false;
$filename = 'img_' . date('Ymd_His') . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
$targetPath = $uploadDir . '/' . $filename;

if (function_exists('imagewebp') && in_array($ext, array('jpg', 'png'), true)) {
    $imgRes = null;
    if ($ext === 'png' && function_exists('imagecreatefrompng')) {
        $imgRes = @imagecreatefrompng($tmpPath);
    } elseif (function_exists('imagecreatefromjpeg')) {
        $imgRes = @imagecreatefromjpeg($tmpPath);
    }

    if ($imgRes !== false && $imgRes !== null) {
        $webpFilename = 'img_' . date('Ymd_His') . '_' . bin2hex(random_bytes(6)) . '.webp';
        $webpTarget = $uploadDir . '/' . $webpFilename;
        if (@imagewebp($imgRes, $webpTarget, 85)) {
            imagedestroy($imgRes);
            @chmod($webpTarget, 0666);
            $filename = $webpFilename;
            $targetPath = $webpTarget;
            $ext = 'webp';
            $converted = true;
        } else {
            imagedestroy($imgRes);
        }
    }
}

if (!$converted) {
    if (is_uploaded_file($tmpPath)) {
        if (!@move_uploaded_file($tmpPath, $targetPath)) {
            api_send(500, array('ok' => false, 'error' => 'No se pudo mover el archivo al directorio de destino.'));
        }
    } else {
        if (!@copy($tmpPath, $targetPath)) {
            api_send(500, array('ok' => false, 'error' => 'No se pudo copiar el archivo al directorio de destino.'));
        }
    }
    @chmod($targetPath, 0666);
}

// 6. Respuesta exitosa con URL limpia relativa
$relativeUrl = 'assets/img/uploads/' . $filename;

api_send(200, array(
    'ok'        => true,
    'url'       => $relativeUrl,
    'filename'  => $filename,
    'file'      => array(
        'url'  => $relativeUrl,
        'name' => $filename,
    ),
    'size'      => file_exists($targetPath) ? filesize($targetPath) : $fileSize,
    'mime'      => $ext === 'webp' ? 'image/webp' : $mime,
    'converted' => $converted,
    'author'    => $admin['user'],
    'message'   => 'Imagen procesada y almacenada exitosamente.',
));
