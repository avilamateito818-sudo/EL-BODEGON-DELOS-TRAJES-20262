const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../sitio/css/seasons.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Replace duplicate lines 827 to 929 with clean rules
const duplicateCatalogStart = css.indexOf('.season-catalog {\r\n  border: 1.5px solid rgba(212, 160, 23, 0.35) !important;') !== -1
  ? css.indexOf('.season-catalog {\r\n  border: 1.5px solid rgba(212, 160, 23, 0.35) !important;')
  : css.indexOf('.season-catalog {\n  border: 1.5px solid rgba(212, 160, 23, 0.35) !important;');

const media768Idx = css.indexOf('@media (max-width: 768px) {\r\n  .season-hero-banner { min-height: 380px;') !== -1
  ? css.indexOf('@media (max-width: 768px) {\r\n  .season-hero-banner { min-height: 380px;')
  : css.indexOf('@media (max-width: 768px) {\n  .season-hero-banner { min-height: 380px;');

if (duplicateCatalogStart !== -1 && media768Idx !== -1) {
  css = css.slice(0, duplicateCatalogStart) + css.slice(media768Idx);
}

// Ensure .enero-hero-wrapper and .enero-hero-photo are present
if (!css.includes('.enero-hero-wrapper')) {
  css = css.replace(
    '#temporadas[data-season="enero"] .season-grid {',
    '#temporadas[data-season="enero"] .season-grid,\n.enero-hero-wrapper {'
  );
}

if (!css.includes('.enero-hero-photo')) {
  css = css.replace(
    '#temporadas[data-season="enero"] .season-item {',
    '#temporadas[data-season="enero"] .season-item,\n.enero-hero-photo {'
  );
}

fs.writeFileSync(cssPath, css, 'utf8');
console.log('Optimized seasons.css size:', (fs.statSync(cssPath).size / 1024).toFixed(1), 'KB');
