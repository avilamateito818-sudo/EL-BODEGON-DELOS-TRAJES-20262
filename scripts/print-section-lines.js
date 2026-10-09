const fs = require('fs');
const html = fs.readFileSync('sitio/index.html', 'utf8');
const lines = html.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('<article class="season-panel') || line.includes('</article>') || line.includes('<section') || line.includes('</section>')) {
    console.log(`Line ${i + 1}: ${line.trim().substring(0, 80)}`);
  }
}
