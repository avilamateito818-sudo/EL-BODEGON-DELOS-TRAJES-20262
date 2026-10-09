const fs = require('fs');
const html = fs.readFileSync('sitio/index.html', 'utf8');
const regex = /<div class="season-hero-banner"[^>]*data-hero-season="([^"]+)"[^>]*style="background-image:\s*url\('([^']+)'\);"/g;
let match;
while ((match = regex.exec(html)) !== null) {
  console.log(match[1].padEnd(12), '->', match[2]);
}
