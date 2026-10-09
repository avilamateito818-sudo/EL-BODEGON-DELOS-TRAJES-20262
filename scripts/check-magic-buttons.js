const fs = require('fs');
const html = fs.readFileSync('sitio/index.html', 'utf8');
const regex = /<button type="button" class="btn-season-magic" data-enter="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g;
let match;
while ((match = regex.exec(html)) !== null) {
  console.log(match[1].padEnd(12), '-->', match[2].trim().replace(/\s+/g, ' '));
}
