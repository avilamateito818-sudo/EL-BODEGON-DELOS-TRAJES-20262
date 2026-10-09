const fs = require('fs');

const html = fs.readFileSync('sitio/index.html', 'utf8');
const cat = JSON.parse(fs.readFileSync('sitio/data/catalogo.json', 'utf8'));

// Regex to find each article.season-panel
const panelRegex = /<article\s+class=\"[^\"]*season-panel[^\"]*\"\s+data-panel=\"([^\"]+)\"[\s\S]*?(?=<article\s+class=\"[^\"]*season-panel|$)/gi;

let match;
console.log('--- PANELS IN INDEX.HTML ---');
while ((match = panelRegex.exec(html)) !== null) {
  const panelName = match[1];
  const panelHtml = match[0];
  const cardMatches = [...panelHtml.matchAll(/data-card-id=\"([^\"]+)\"/g)].map(m => m[1]);
  const foreign = cardMatches.filter(id => !id.startsWith('card-' + panelName));
  console.log(`Panel [${panelName}]: ${cardMatches.length} cards, foreign: ${foreign.length > 0 ? foreign.join(', ') : 'none'}`);
}

console.log('\n--- TRAJES IN CATALOGO.JSON BY TEMPORADA ---');
const catBySeason = {};
const allHtmlCards = [...html.matchAll(/data-card-id=\"([^\"]+)\"/g)].map(m => m[1]);
const catCards = cat.trajes.map(t => t.id);

cat.trajes.forEach(t => {
  catBySeason[t.temporada] = (catBySeason[t.temporada] || 0) + 1;
});
console.log(catBySeason);

console.log('\nIn catalogo.json but not in HTML:');
catCards.forEach(id => {
  if (!allHtmlCards.includes(id)) {
    const t = cat.trajes.find(x => x.id === id);
    console.log(` + [${t.temporada}] ${id} (${t.titulo})`);
  }
});

console.log('\nIn HTML but not in catalogo.json:');
allHtmlCards.forEach(id => {
  if (!catCards.includes(id)) {
    console.log(` - ${id}`);
  }
});
