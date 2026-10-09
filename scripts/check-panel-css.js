const fs = require('fs');

// Check CSS files for .season-panel
const seasonsCss = fs.readFileSync('sitio/css/seasons.css', 'utf8');
const layoutCss = fs.readFileSync('sitio/css/layout.css', 'utf8');
const responsiveCss = fs.readFileSync('sitio/css/responsive.css', 'utf8');
const colorsCss = fs.readFileSync('sitio/css/season-colors.css', 'utf8');

console.log('--- Checking seasons.css for .season-panel rules ---');
const regex = /[^{}]*\.season-panel[^{}]*\{[^}]*\}/g;
let m;
while ((m = regex.exec(seasonsCss)) !== null) {
  console.log(m[0].replace(/\s+/g, ' '));
}

console.log('\n--- Checking season-colors.css for .season-panel rules ---');
while ((m = regex.exec(colorsCss)) !== null) {
  if (m[0].includes('display')) {
    console.log(m[0].replace(/\s+/g, ' '));
  }
}

console.log('\n--- Checking responsive.css for .season-panel rules ---');
while ((m = regex.exec(responsiveCss)) !== null) {
  if (m[0].includes('display')) {
    console.log(m[0].replace(/\s+/g, ' '));
  }
}
