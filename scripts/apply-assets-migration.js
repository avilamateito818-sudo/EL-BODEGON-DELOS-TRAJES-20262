const fs = require('fs');
const path = require('path');

const htmlPath = 'sitio/index.html';
let html = fs.readFileSync(htmlPath, 'utf8');

// T4.1: Mapping of 28 external URLs to local assets/img/remote/ files
const urlMap = [
  {
    from: 'https://www.graduacion.com/cdn/shop/products/82f951f873ce72ada8360d4e4b125862.jpg?v=1579938235',
    to: 'assets/img/remote/rU4NjIuanBnP3Y9MTU3OTkzODIzNQ.webp'
  },
  {
    from: 'https://www.graduacion.com/cdn/shop/products/f932254c2000286e4f87c517fbd08622_bfa94108-8e6a-4d25-8bb6-2e42f3a2a012.jpg?v=1579938172',
    to: 'assets/img/remote/rhMDEyLmpwZz92PTE1Nzk5MzgxNzI.webp'
  },
  {
    from: 'https://www.graduacion.com/cdn/shop/products/12360e8204d820c7c0e0be625e707eb7.jpg?v=1579938235',
    to: 'assets/img/remote/rdlYjcuanBnP3Y9MTU3OTkzODIzNQ.webp'
  },
  {
    from: 'https://antifazdisfracesbogota.com/wp-content/uploads/2023/09/cumbia-colombia-mujer-falda-amarilla-arandela-tricolor-blusa-campesina-antifaz-disfraces-bogota.jpg.jpg',
    to: 'assets/img/remote/rZnJhY2VzLWJvZ290YS5qcGcuanBn.webp'
  },
  {
    from: 'https://latiendadelaempatia.com/cdn/shop/files/Trajetipicodecumbiaparamujerbailecolombiano_1800x1800.jpg?v=1721701664',
    to: 'assets/img/remote/r4MTgwMC5qcGcdj0xNzIxNzAxNjY0.webp'
  },
  {
    from: 'https://antifazdisfracesbogota.com/wp-content/uploads/2023/09/San-Juanero.jpg',
    to: 'assets/img/remote/ryMy8wOS9TYW4tSnVhbmVyby5qcGc.webp'
  },
  {
    from: 'https://antifazdisfracesbogota.com/wp-content/uploads/2023/09/traje-joropo-pareja.jpg',
    to: 'assets/img/remote/rFqZS1qb3JvcG8tcGFyZWphLmpwZw.webp'
  },
  {
    from: 'https://antifazdisfracesbogota.com/wp-content/uploads/2023/09/Antifaz-Disfraces-Bogota-Bambuco-Pareja-Region-Andina.jpg',
    to: 'assets/img/remote/rlamEtUmVnaW9uLUFuZGluYS5qcGc.webp'
  },
  {
    from: 'https://antifazdisfracesbogota.com/wp-content/uploads/2025/03/Pacifico-rojo-sombrero.jpg',
    to: 'assets/img/remote/rljby1yb2pvLXNvbWJyZXJvLmpwZw.webp'
  },
  {
    from: 'https://www.elitetuxedo.com.mx/wp-content/uploads/2021/09/ETC_0059-cc-1-scaled.jpg',
    to: 'assets/img/remote/r8wMDU5LWNjLTEtc2NhbGVkLmpwZw.jpg'
  },
  {
    from: 'https://www.elitetuxedo.com.mx/wp-content/uploads/2026/07/SMOK-BLUE.png',
    to: 'assets/img/remote/ryMDI2LzA3L1NNT0stQkxVRS5wbmc.png'
  },
  {
    from: 'https://ceremoniasanny.com/cdn/shop/files/traje-daltonceremonias-anny-4124966.jpg?v=1762482697&amp;width=533',
    to: 'assets/img/remote/rMjQ4MjY5NyZhbXA7d2lkdGg9NTMz.webp'
  },
  {
    from: 'https://gerat.com.mx/cdn/shop/files/3411_mode_caf59852-63d0-46e9-88ad-fe475bb65017.jpg?v=1715724141',
    to: 'assets/img/remote/r2NTAxNy5qcGcdj0xNzE1NzI0MTQx.webp'
  },
  {
    from: 'https://www.princessly.com/cdn/shop/files/GreenSatinHighLowFormalGirlPartyDress_400x.jpg',
    to: 'assets/img/remote/rJsUGFydHlEcmVzc180MDB4LmpwZw.webp'
  },
  {
    from: 'https://www.princessly.com/cdn/shop/files/NavyBlueFlowerGirlDress-0031_800x.jpg',
    to: 'assets/img/remote/rJsRHJlc3MtMDAzMV84MDB4LmpwZw.webp'
  },
  {
    from: 'https://www.elitetuxedo.com.mx/wp-content/uploads/2021/09/ETC_0059-cc-scaled.jpg',
    to: 'assets/img/remote/rUQ18wMDU5LWNjLXNjYWxlZC5qcGc.jpg'
  },
  {
    from: 'https://mimetikbcn.com/cdn/shop/products/p_2_0_4_0_2040-Teal-long-dress-maxi-dress-bridesmaid-dress-turquoise-party-dress-turquoise-bridesmaid-dresses-feminine-party-long-dress-e_1024x.jpg?v=1754044322',
    to: 'assets/img/remote/rxMDI0eC5qcGcdj0xNzU0MDQ0MzIy.webp'
  },
  {
    from: 'https://lalapita.com/wp-content/uploads/2025/05/986-vestido-rosa-largo-dama-honor-palo-de-rosa-largo-de-mujer.webp',
    to: 'assets/img/remote/r_vestido_gala_diciembre.webp'
  },
  {
    from: 'https://ceremoniasanny.com/cdn/shop/files/traje-daltonceremonias-anny-4124966.jpg?v=1762482697&amp;width=533',
    to: 'assets/img/remote/rMjQ4MjY5NyZhbXA7d2lkdGg9NTMz.webp'
  },
  {
    from: 'https://ceremoniasanny.com/cdn/shop/files/Vestido_unicornio_5.jpg?v=1775156375&amp;width=533',
    to: 'assets/img/remote/r1MTU2Mzc1JmFtcDt3aWR0aD01MzM.webp'
  },
  {
    from: 'https://www.disfracesjarana.com/cdn/shop/files/disfraz-de-papa_noel-deluxe-para-hombre.jpg?v=1711486583&amp;width=1200',
    to: 'assets/img/remote/rQ4NjU4MyZhbXA7d2lkdGg9MTIwMA.webp'
  },
  {
    from: 'https://www.disfracesjarana.com/cdn/shop/files/disfraz-de-elfo-de-papa-noel-para-nino.jpg?v=1711644363&amp;width=1500',
    to: 'assets/img/remote/rNjQ0MzYzJmFtcDt3aWR0aD0xNTAw.webp'
  },
  {
    from: 'https://correos-market.ams3.cdn.digitaloceanspaces.com/prod-new/uploads/correos-marketplace-shop/1/product/35619-f4lpvvob-disfraz-de-arbol-de-navidad-para-ninos-1.jpg',
    to: 'assets/img/remote/rlkYWQtcGFyYS1uaW5vcy0xLmpwZw.jpg'
  },
  {
    from: 'https://mercadisfraces.es/cdn/shop/files/disfraz-angel-bebe_1024x.webp',
    to: 'assets/img/remote/rFuZ2VsLWJlYmVfMTAyNHgud2VicA.webp'
  },
  {
    from: 'https://www.casangel.com/axos/imagenes/by03065-disfraz-muneco-nieve-infantil-1.jpg',
    to: 'assets/img/remote/r1uaWV2ZS1pbmZhbnRpbC0xLmpwZw.jpg'
  },
  {
    from: 'https://www.disfracesjarana.com/cdn/shop/files/disfraz-de-galleta-de-jengibre-para-nino.jpg?v=1711492225&amp;width=1500',
    to: 'assets/img/remote/r0OTIyMjUmYW1wO3dpZHRoPTE1MDA.webp'
  },
  {
    from: 'https://www.disfracesjarana.com/cdn/shop/files/disfraz-de-estrella-de-navidad-para-nino.jpg?width=1500',
    to: 'assets/img/remote/rYS1uaW5vLmpwZz93aWR0aD0xNTAw.webp'
  },
  {
    from: 'https://www.disfracessimon.com/cdn/shop/files/disfraz-de-duende-grunon-de-navidad-verde-para-nino-230641.jpg?v=1751449960',
    to: 'assets/img/remote/rA2NDEuanBnP3Y9MTc1MTQ0OTk2MA.webp'
  }
];

// Verify all target files exist physically on disk
console.log('--- Verificando existencia física de assets locales ---');
urlMap.forEach((entry, i) => {
  const diskPath = path.join('sitio', entry.to);
  if (!fs.existsSync(diskPath)) {
    throw new Error(`[ERROR] No existe el archivo físico: ${diskPath}`);
  }
  const stats = fs.statSync(diskPath);
  console.log(`[OK] (${i+1}/28) ${entry.to} (${stats.size} bytes)`);
});

// Perform T4.1 replacements
console.log('\n--- Aplicando reemplazos T4.1 (Hotlinking -> Local) ---');
let t41Count = 0;
urlMap.forEach(entry => {
  if (html.includes(entry.from)) {
    // Replace all occurrences of this URL
    while (html.includes(entry.from)) {
      html = html.replace(entry.from, entry.to);
      t41Count++;
    }
  }
});
console.log(`Total reemplazos realizados en T4.1: ${t41Count}`);

// T4.2: Replace heavy local JPG/PNG with WebP versions
console.log('\n--- Aplicando reemplazos T4.2 (Pesadas -> WebP) ---');
const heavyReplacements = [
  { from: 'assets/img/horror_bg.png', to: 'assets/img/horror_bg.webp' },
  { from: 'assets/img/reyes_magos.jpg', to: 'assets/img/reyes_magos.webp' },
  { from: 'assets/img/uniforme_colegio.jpg', to: 'assets/img/uniforme_colegio.webp' },
  { from: 'assets/img/bata_laboratorio.jpg', to: 'assets/img/bata_laboratorio.webp' },
  { from: 'assets/img/ima21.jpg', to: 'assets/img/ima21.webp' },
  { from: 'assets/img/jr2.jpg', to: 'assets/img/jr2.webp' },
  { from: 'assets/img/img19.jpg', to: 'assets/img/img19.webp' },
  { from: 'assets/img/img20.jpg', to: 'assets/img/img20.webp' },
  { from: 'assets/img/img13.jpg', to: 'assets/img/img13.webp' },
  { from: 'assets/img/vestido_nina.jpg', to: 'assets/img/vestido_nina.webp' },
  { from: 'assets/img/reno_rudolfo.jpg', to: 'assets/img/reno_rudolfo.webp' }
];

let t42Count = 0;
heavyReplacements.forEach(entry => {
  const diskPath = path.join('sitio', entry.to);
  if (!fs.existsSync(diskPath)) {
    throw new Error(`[ERROR] No existe el WebP local: ${diskPath}`);
  }
  if (html.includes(entry.from)) {
    while (html.includes(entry.from)) {
      html = html.replace(entry.from, entry.to);
      t42Count++;
    }
    console.log(`[OK] Reemplazado ${entry.from} => ${entry.to}`);
  } else {
    console.log(`[WARN] No se encontró en HTML: ${entry.from}`);
  }
});
console.log(`Total reemplazos realizados en T4.2: ${t42Count}`);

// Guardar los cambios
fs.writeFileSync(htmlPath, html, 'utf8');
console.log('\n[ÉXITO] Archivo sitio/index.html actualizado y guardado correctamente.');
