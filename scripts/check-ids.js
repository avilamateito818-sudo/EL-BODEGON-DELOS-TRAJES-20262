const fs = require('fs');
const cat = JSON.parse(fs.readFileSync('sitio/data/catalogo.json', 'utf8'));

const ids = cat.trajes.map(t => t.id);
console.log('Total trajes:', ids.length);
console.log('Sample IDs:', ids.slice(0, 20));

// Check if IDs have months in them
const monthsInId = {};
ids.forEach(id => {
  const parts = id.split('-');
  if (parts.length > 1) {
    const m = parts[1];
    monthsInId[m] = (monthsInId[m] || 0) + 1;
  }
});
console.log('Months parsed from IDs:', monthsInId);
