const fs = require('fs');
const html = fs.readFileSync('sitio/index.html', 'utf8');
console.log('HTML length:', html.length, 'lines:', html.split('\n').length);
const panels = html.match(/<article[^>]*class="[^"]*season-panel[^"]*"[^>]*>/g);
console.log('Panels found:', panels);

// Check if there are other panels or huge elements
const sections = html.match(/<section[^>]*id="([^"]*)"[^>]*>/g);
console.log('Sections with id:', sections);
