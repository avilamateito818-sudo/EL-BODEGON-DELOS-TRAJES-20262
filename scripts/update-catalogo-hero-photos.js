const fs = require('fs');
const path = require('path');

const catPath = path.join(__dirname, '..', 'sitio', 'data', 'catalogo.json');
const cat = JSON.parse(fs.readFileSync(catPath, 'utf8'));

const heroPhotos = {
  enero: 'assets/img/reyes_magos.webp',
  febrero: 'assets/img/remote/rFqZS1qb3JvcG8tcGFyZWphLmpwZw.webp',
  marzo: 'assets/img/remote/rA2NDEuanBnP3Y9MTc1MTQ0OTk2MA.webp',
  abril: 'assets/img/uniforme_colegio.webp',
  mayo: 'assets/img/vestido_nina.webp',
  junio: 'assets/img/remote/rJsRHJlc3MtMDAzMV84MDB4LmpwZw.webp',
  julio: 'assets/img/remote/rlamEtUmVnaW9uLUFuZGluYS5qcGc.webp',
  agosto: 'assets/img/remote/ryMDI2LzA3L1NNT0stQkxVRS5wbmc.png',
  septiembre: 'assets/img/remote/r_vestido_gala_diciembre.webp',
  octubre: 'assets/img/horror_bg.webp',
  noviembre: 'assets/img/remote/rUQ18wMDU5LWNjLXNjYWxlZC5qcGc.jpg',
  diciembre: 'assets/img/reno_rudolfo.webp'
};

Object.keys(heroPhotos).forEach(m => {
  if (cat.temporadas[m]) {
    cat.temporadas[m].foto_hero = heroPhotos[m];
  }
});

fs.writeFileSync(catPath, JSON.stringify(cat, null, 4), 'utf8');
console.log('Successfully updated foto_hero for all 12 seasons in catalogo.json!');
