const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'sitio', 'index.html');
const sitioDir = path.join(__dirname, '..', 'sitio');
let html = fs.readFileSync(htmlPath, 'utf8');

const initialSize = Buffer.byteLength(html, 'utf8');
console.log('--- Migración de Placeholders SVG Inline (T4.3) ---');
console.log(`Tamaño inicial de index.html: ${(initialSize / 1024).toFixed(1)} KB (${initialSize} bytes)`);

// Mapeo por mes para los placeholders
const monthMap = {
  febrero: 'assets/img/ph-febrero.svg',
  marzo: 'assets/img/ph-marzo.svg',
  abril: 'assets/img/ph-abril.svg',
  mayo: 'assets/img/ph-mayo.svg',
  junio: 'assets/img/ph-junio.svg',
  julio: 'assets/img/ph-julio.svg',
  agosto: 'assets/img/ph-agosto.svg',
  septiembre: 'assets/img/ph-septiembre.svg',
  noviembre: 'assets/img/ph-noviembre.svg'
};

// Verificar que todos los SVGs existan en disco
for (const [m, relPath] of Object.entries(monthMap)) {
  const absPath = path.join(sitioDir, relPath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`[ERROR] No existe el archivo físico: ${absPath}`);
  }
}
console.log('[OK] Todos los archivos ph-*.svg existen físicamente en disco.');

// Reemplazar data-URIs según el mes de la tarjeta
let replacedCount = 0;
const lines = html.split('\n');

const newLines = lines.map((line) => {
  if (line.includes('data:image/svg+xml')) {
    // Detectar mes de la tarjeta
    let month = null;
    const cardMatch = line.match(/data-card-id=["']card-([a-z]+)-/);
    if (cardMatch && monthMap[cardMatch[1]]) {
      month = cardMatch[1];
    } else if (line.includes('noviembre') || line.includes('Pasillo%20Fiestero')) {
      month = 'noviembre';
    } else {
      month = 'generico';
    }

    const targetSvg = monthMap[month] || 'assets/img/ph-generico.svg';
    
    // El src está delimitado por comillas dobles src="data:image/svg+xml...".
    // Dentro de la data URI no hay comillas dobles, solo comillas simples.
    // Usamos /src="data:image\/svg\+xml[^"]*"/ para capturar el atributo completo.
    const updatedLine = line.replace(/src="data:image\/svg\+xml[^"]*"/, `src="${targetSvg}"`);
    replacedCount++;
    return updatedLine;
  }
  return line;
});

const updatedHtml = newLines.join('\n');
const finalSize = Buffer.byteLength(updatedHtml, 'utf8');
const savedBytes = initialSize - finalSize;

console.log(`\nTotal de Data-URIs reemplazados: ${replacedCount}`);
console.log(`Tamaño final de index.html: ${(finalSize / 1024).toFixed(1)} KB (${finalSize} bytes)`);
console.log(`Ahorro total de peso en HTML: ${(savedBytes / 1024).toFixed(1)} KB (${savedBytes} bytes, reducción del ${((savedBytes / initialSize) * 100).toFixed(1)}%)`);

fs.writeFileSync(htmlPath, updatedHtml, 'utf8');
console.log('\n[ÉXITO] Archivo sitio/index.html actualizado y guardado correctamente.');
