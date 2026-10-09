const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'sitio', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

console.log('Original index.html length:', html.length);

// 1. Remove admin scripts and insert catalog-renderer.js
const oldScriptsRegex = /<script src="data\/admin-content\.js"><\/script>[\s\S]*?<script src="js\/admin\.js"><\/script>/i;
if (oldScriptsRegex.test(html)) {
  html = html.replace(oldScriptsRegex, '<script src="js/catalog-renderer.js"></script>');
  console.log('Admin scripts removed and replaced by catalog-renderer.js.');
} else {
  console.log('Regex did not match exact old scripts block, checking individual scripts.');
}

// 2. Remove floating edit button
const editBtnRegex = /<button class="admin-ui edit-float"[^>]*>[\s\S]*?<\/button>/i;
if (editBtnRegex.test(html)) {
  html = html.replace(editBtnRegex, '');
  console.log('edit-float-btn removed.');
}

// 3. Remove admin photo controls and change buttons
html = html.replace(/<div class="admin-photo-controls admin-ui" id="admin-photo-controls">[\s\S]*?<\/div>\s*<\/div>/g, '');
html = html.replace(/<button class="admin-season-photo-btn[^"]*"[^>]*>[\s\S]*?<\/button>/gi, '');

// 4. In footer-bottom, add discreet link to /admin/
const footerMatch = '<div class="footer-bottom">';
if (html.includes(footerMatch)) {
  html = html.replace(
    footerMatch,
    '<div class="footer-bottom">\n      <p><a href="admin/" class="footer-admin-link" style="color: inherit; opacity: 0.35; font-size: 0.75rem; text-decoration: none;">Acceso Administrativo</a></p>'
  );
  console.log('Discreet admin link added to footer.');
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Clean index.html saved. New length:', html.length);
