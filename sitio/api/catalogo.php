<?php
/**
 * Endpoint de Catálogo Comercial — El Bodegón de los Trajes (Tunja)
 * Arquitectura Limpia: Controlador HTTP / Capa de Adaptadores de Interfaz
 * 
 * Acciones soportadas:
 *   - GET    /api/catalogo                       -> Consulta pública del catálogo completo
 *   - POST   /api/catalogo (crear traje)         -> Agrega una nueva prenda (Requiere Admin)
 *   - PUT    /api/catalogo (actualizar traje)    -> Modifica una prenda existente (Requiere Admin)
 *   - DELETE /api/catalogo (eliminar traje)      -> Elimina una prenda por ID (Requiere Admin)
 *   - POST   /api/catalogo?action=set_season     -> Configura la temporada activa del mes (Requiere Admin)
 *   - POST   /api/catalogo?action=update_hero    -> Actualiza los textos del banner principal (Requiere Admin)
 */

require_once __DIR__ . '/_config.php';

api_cors();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'OPTIONS') {
    api_send(200, array('ok' => true));
}

$catalogFile = dirname(__DIR__) . '/data/catalogo.json';

/** Función auxiliar para cargar el catálogo con bloqueo compartido */
function load_catalog(string $filePath): array
{
    if (!is_file($filePath)) {
        return array(
            'version' => 1,
            'ultima_actualizacion' => gmdate('Y-m-d\TH:i:s\Z'),
            'temporada_activa' => 'octubre',
            'hero_general' => array(),
            'temporadas' => array(),
            'trajes' => array(),
        );
    }

    $raw = @file_get_contents($filePath);
    if (!is_string($raw)) {
        api_send(500, array('ok' => false, 'error' => 'No se pudo leer el archivo de catálogo.'));
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        api_send(500, array('ok' => false, 'error' => 'Formato JSON corrupto en el catálogo.'));
    }

    return $data;
}

/** Función auxiliar para guardar el catálogo de forma atómica y segura */
function save_catalog(string $filePath, array $data): bool
{
    $dir = dirname($filePath);
    if (!is_dir($dir)) {
        @mkdir($dir, 0777, true);
    }
    @chmod($dir, 0777);

    $data['ultima_actualizacion'] = gmdate('Y-m-d\TH:i:s\Z');
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        return false;
    }

    $tmp = $filePath . '.' . bin2hex(random_bytes(6)) . '.tmp';
    if (@file_put_contents($tmp, $json, LOCK_EX) === false) {
        if (@file_put_contents($filePath, $json, LOCK_EX) !== false) {
            @chmod($filePath, 0666);
            return true;
        }
        return false;
    }

    if (!@rename($tmp, $filePath)) {
        if (@file_put_contents($filePath, $json, LOCK_EX) !== false) {
            @unlink($tmp);
            @chmod($filePath, 0666);
            return true;
        }
        @unlink($tmp);
        return false;
    }

    @chmod($filePath, 0666);
    return true;
}

// =========================================================================
// 1. MÉTODO GET: Consulta Pública
// =========================================================================
if ($method === 'GET') {
    $catalog = load_catalog($catalogFile);
    header('Cache-Control: no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    api_send(200, array_merge(array('ok' => true), $catalog));
}

// =========================================================================
// 2. MÉTODOS MUTANTES (POST, PUT, DELETE): Exigen Sesión Activa de Admin
// =========================================================================
auth_require_admin();

$body = api_read_json_body() ?? array();
$action = strval($_GET['action'] ?? ($body['action'] ?? ''));

// --- ACCIÓN: Cambiar Temporada Activa ---
if ($action === 'set_season') {
    $season = trim(strval($body['temporada'] ?? ''));
    $validMonths = array(
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    );

    if (!in_array($season, $validMonths, true)) {
        api_send(422, array('ok' => false, 'error' => 'Temporada no válida.'));
    }

    $catalog = load_catalog($catalogFile);
    $catalog['temporada_activa'] = $season;

    if (!save_catalog($catalogFile, $catalog)) {
        api_send(500, array('ok' => false, 'error' => 'Error al persistir la temporada activa.'));
    }

    api_send(200, array(
        'ok' => true,
        'message' => 'Temporada activa actualizada a ' . $season,
        'temporada_activa' => $season
    ));
}

// --- ACCIÓN: Actualizar Hero General ---
if ($action === 'update_hero') {
    $hero = $body['hero'] ?? null;
    if (!is_array($hero)) {
        api_send(422, array('ok' => false, 'error' => 'Objeto hero requerido.'));
    }

    $catalog = load_catalog($catalogFile);
    $catalog['hero_general'] = array_merge($catalog['hero_general'] ?? array(), array(
        'tag' => strip_tags(strval($hero['tag'] ?? '')),
        'titulo' => strip_tags(strval($hero['titulo'] ?? '')),
        'subtitulo' => strip_tags(strval($hero['subtitulo'] ?? '')),
        'whatsapp_cta' => strip_tags(strval($hero['whatsapp_cta'] ?? ''))
    ));

    if (!save_catalog($catalogFile, $catalog)) {
        api_send(500, array('ok' => false, 'error' => 'Error al persistir el hero general.'));
    }

    api_send(200, array(
        'ok' => true,
        'message' => 'Hero general actualizado con éxito.',
        'hero_general' => $catalog['hero_general']
    ));
}

// --- ACCIÓN: Eliminar Traje (DELETE o POST con action=delete) ---
if ($method === 'DELETE' || $action === 'delete') {
    $id = trim(strval($_GET['id'] ?? ($body['id'] ?? '')));
    if ($id === '') {
        api_send(422, array('ok' => false, 'error' => 'ID de traje requerido para eliminar.'));
    }

    $catalog = load_catalog($catalogFile);
    $found = false;
    $newTrajes = array();

    foreach ($catalog['trajes'] as $item) {
        if (strval($item['id'] ?? '') === $id) {
            $found = true;
            continue; // Se omite para eliminar
        }
        $newTrajes[] = $item;
    }

    if (!$found) {
        api_send(404, array('ok' => false, 'error' => 'Traje no encontrado con el ID especificado.'));
    }

    $catalog['trajes'] = $newTrajes;
    if (!save_catalog($catalogFile, $catalog)) {
        api_send(500, array('ok' => false, 'error' => 'Error al persistir la eliminación.'));
    }

    api_send(200, array(
        'ok' => true,
        'message' => 'Traje eliminado exitosamente.',
        'deleted_id' => $id,
        'total_trajes' => count($newTrajes)
    ));
}

// --- ACCIÓN: Actualizar Traje Existente (PUT o POST con action=update) ---
if ($method === 'PUT' || $action === 'update') {
    $id = trim(strval($body['id'] ?? ($_GET['id'] ?? '')));
    if ($id === '') {
        api_send(422, array('ok' => false, 'error' => 'ID de traje requerido para actualizar.'));
    }

    $catalog = load_catalog($catalogFile);
    $found = false;
    $updatedItem = null;

    foreach ($catalog['trajes'] as &$item) {
        if (strval($item['id'] ?? '') === $id) {
            $found = true;
            if (isset($body['titulo'])) $item['titulo'] = strip_tags(trim(strval($body['titulo'])));
            if (isset($body['descripcion'])) $item['descripcion'] = strip_tags(trim(strval($body['descripcion'])));
            if (isset($body['temporada'])) $item['temporada'] = strtolower(trim(strval($body['temporada'])));
            if (isset($body['categoria']) || isset($body['grupo'])) {
                $cat = strip_tags(trim(strval($body['categoria'] ?? $body['grupo'])));
                $item['categoria'] = $cat;
                $item['grupo'] = $cat;
            }
            if (isset($body['foto'])) {
                $item['foto'] = trim(strval($body['foto']));
                $item['tiene_foto_real'] = (!empty($item['foto']) && strpos($item['foto'], 'ph-') === false);
            }
            if (isset($body['destacado'])) $item['destacado'] = (bool)$body['destacado'];
            if (isset($body['formato_foto'])) {
                $formato = strtolower(strip_tags(trim(strval($body['formato_foto']))));
                $item['formato_foto'] = in_array($formato, array('carta', 'cuadrado', 'panoramico'), true) ? $formato : 'carta';
            }
            if (isset($body['activo'])) $item['activo'] = (bool)$body['activo'];
            if (isset($body['tallas'])) {
                if (is_array($body['tallas'])) {
                    $item['tallas'] = array_values(array_filter(array_map('trim', array_map('strval', $body['tallas']))));
                } else if (is_string($body['tallas'])) {
                    $item['tallas'] = array_values(array_filter(array_map('trim', explode(',', $body['tallas']))));
                }
            }

            $updatedItem = $item;
            break;
        }
    }
    unset($item);

    if (!$found) {
        api_send(404, array('ok' => false, 'error' => 'Traje no encontrado para actualizar.'));
    }

    if (!save_catalog($catalogFile, $catalog)) {
        api_send(500, array('ok' => false, 'error' => 'Error al persistir la actualización.'));
    }

    api_send(200, array(
        'ok' => true,
        'message' => 'Traje actualizado exitosamente.',
        'traje' => $updatedItem
    ));
}

// --- ACCIÓN: Crear Nuevo Traje (POST) ---
if ($method === 'POST') {
    $titulo = strip_tags(trim(strval($body['titulo'] ?? '')));
    $temporada = strtolower(trim(strval($body['temporada'] ?? '')));

    if ($titulo === '' || $temporada === '') {
        api_send(422, array('ok' => false, 'error' => 'Título y temporada obligatorios.'));
    }

    $catalog = load_catalog($catalogFile);

    // Generar un ID único determinista
    $slug = preg_replace('/[^a-z0-9]+/', '-', strtolower($titulo));
    $slug = trim($slug, '-');
    $id = 'card-' . $temporada . '-' . ($slug !== '' ? $slug : bin2hex(random_bytes(3)));

    // Si ya existe el ID, sufijar con hash
    $existingIds = array_column($catalog['trajes'], 'id');
    if (in_array($id, $existingIds, true)) {
        $id .= '-' . bin2hex(random_bytes(2));
    }

    $foto = trim(strval($body['foto'] ?? ''));
    if ($foto === '') {
        // Fallback a placeholder SVG de la temporada
        $foto = 'assets/img/ph-' . $temporada . '.svg';
    }

    $categoria = strip_tags(trim(strval($body['categoria'] ?? ($body['grupo'] ?? 'General'))));

    $rawTallas = $body['tallas'] ?? null;
    $parsedTallas = array('S', 'M', 'L', 'A la medida');
    if (is_array($rawTallas)) {
        $parsedTallas = array_values(array_filter(array_map('trim', array_map('strval', $rawTallas))));
    } else if (is_string($rawTallas) && trim($rawTallas) !== '') {
        $parsedTallas = array_values(array_filter(array_map('trim', explode(',', $rawTallas))));
    }

    $formato = strtolower(strip_tags(trim(strval($body['formato_foto'] ?? 'carta'))));
    $formatoFoto = in_array($formato, array('carta', 'cuadrado', 'panoramico'), true) ? $formato : 'carta';

    $nuevoTraje = array(
        'id' => $id,
        'temporada' => $temporada,
        'categoria' => $categoria,
        'grupo' => $categoria,
        'titulo' => $titulo,
        'descripcion' => strip_tags(trim(strval($body['descripcion'] ?? ''))),
        'foto' => $foto,
        'formato_foto' => $formatoFoto,
        'tiene_foto_real' => (!empty($foto) && strpos($foto, 'ph-') === false),
        'tallas' => $parsedTallas,
        'destacado' => !empty($body['destacado']),
        'activo' => isset($body['activo']) ? (bool)$body['activo'] : true,
        'creado_en' => gmdate('Y-m-d\TH:i:s\Z')
    );

    // Añadir al inicio del array de trajes de esa temporada
    array_unshift($catalog['trajes'], $nuevoTraje);

    if (!save_catalog($catalogFile, $catalog)) {
        api_send(500, array('ok' => false, 'error' => 'Error al persistir el nuevo traje en disco.'));
    }

    api_send(201, array(
        'ok' => true,
        'message' => 'Traje creado exitosamente.',
        'traje' => $nuevoTraje,
        'total_trajes' => count($catalog['trajes'])
    ));
}

api_send(405, array('ok' => false, 'error' => 'Método HTTP no permitido.'));
