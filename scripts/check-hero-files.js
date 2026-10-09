const fs = require('fs');
const path = require('path');

const images = [
  'sitio/assets/img/reyes_magos.webp',
  'sitio/assets/img/remote/rFqZS1qb3JvcG8tcGFyZWphLmpwZw.webp',
  'sitio/assets/img/remote/rA2NDEuanBnP3Y9MTc1MTQ0OTk2MA.webp',
  'sitio/assets/img/abril_hero.jpg',
  'sitio/assets/img/mayo_hero.jpg',
  'sitio/assets/img/remote/rJsRHJlc3MtMDAzMV84MDB4LmpwZw.webp',
  'sitio/assets/img/remote/rlamEtUmVnaW9uLUFuZGluYS5qcGc.webp',
  'sitio/assets/img/remote/ryMDI2LzA3L1NNT0stQkxVRS5wbmc.png',
  'sitio/assets/img/remote/r_vestido_gala_diciembre.webp',
  'sitio/assets/img/horror_bg.webp',
  'sitio/assets/img/remote/rUQ18wMDU5LWNjLXNjYWxlZC5qcGc.jpg',
  'sitio/assets/img/navidad_hero.jpg'
];

images.forEach(img => {
  const exists = fs.existsSync(img);
  let size = 0;
  if (exists) {
    size = fs.statSync(img).size;
  }
  console.log(exists ? 'OK  ' : 'FAIL', (size + 'B').padStart(10), img);
});
