const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'sitio', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const seasonConfigs = {
  enero: {
    name: 'Enero',
    upper: 'ENERO',
    photo: 'assets/img/reyes_magos.webp',
    subtitle: 'REYES MAGOS, UNIFORMES Y BATAS PARA ARRANCAR EL AÑO CON ESTILO.',
    btnText: 'DESCUBRE LA MAGIA DE REYES'
  },
  febrero: {
    name: 'Febrero',
    upper: 'FEBRERO',
    photo: 'assets/img/remote/rFqZS1qb3JvcG8tcGFyZWphLmpwZw.webp',
    subtitle: 'CARNAVAL DE NEGROS Y BLANCOS, SAN VALENTÍN Y BODAS A LA MEDIDA.',
    btnText: 'DESCUBRE EL CARNAVAL Y GLAMOUR'
  },
  marzo: {
    name: 'Marzo',
    upper: 'MARZO',
    photo: 'assets/img/remote/rA2NDEuanBnP3Y9MTc1MTQ0OTk2MA.webp',
    subtitle: 'CUARESMA, SEMANA SANTA Y EL DÍA DE LA MUJER.',
    btnText: 'DESCUBRE EL EFECTO EJECUTIVO'
  },
  abril: {
    name: 'Abril',
    upper: 'ABRIL',
    photo: 'assets/img/uniforme_colegio.webp',
    subtitle: 'PRENDA DE PRIMAVERA, LA FERIA Y LOS UNIFORMES DE INGRESO.',
    btnText: 'DESCUBRE LA FERIA Y RENOVACIÓN'
  },
  mayo: {
    name: 'Mayo',
    upper: 'MAYO',
    photo: 'assets/img/vestido_nina.webp',
    subtitle: 'TODO PARA EL DÍA DE LAS MADRES Y PRIMERA COMUNIÓN.',
    btnText: 'DESCUBRE EL DÍA DE LAS MADRES'
  },
  junio: {
    name: 'Junio',
    upper: 'JUNIO',
    photo: 'assets/img/remote/rJsRHJlc3MtMDAzMV84MDB4LmpwZw.webp',
    subtitle: 'QUINCEAÑERAS, BODAS Y EL DÍA DEL PADRE.',
    btnText: 'DESCUBRE BODAS Y QUINCEAÑERAS'
  },
  julio: {
    name: 'Julio',
    upper: 'JULIO',
    photo: 'assets/img/remote/rlamEtUmVnaW9uLUFuZGluYS5qcGc.webp',
    subtitle: 'EL 20 DE JULIO, EL DESFILE Y TODA LA ROPA DEL VERANO.',
    btnText: 'DESCUBRE LAS FIESTAS PATRIAS'
  },
  agosto: {
    name: 'Agosto',
    upper: 'AGOSTO',
    photo: 'assets/img/remote/ryMDI2LzA3L1NNT0stQkxVRS5wbmc.png',
    subtitle: 'ANIVERSARIO DE TUNJA, GALAS Y TEMPORADA DE BODAS.',
    btnText: 'DESCUBRE LA GALA Y ANIVERSARIO'
  },
  septiembre: {
    name: 'Septiembre',
    upper: 'SEPTIEMBRE',
    photo: 'assets/img/remote/r_vestido_gala_diciembre.webp',
    subtitle: 'AMOR Y AMISTAD, ANIVERSARIOS Y REGRESO A LAS AULAS.',
    btnText: 'DESCUBRE AMOR Y AMISTAD'
  },
  octubre: {
    name: 'Octubre',
    upper: 'OCTUBRE',
    photo: 'assets/img/horror_bg.webp',
    subtitle: 'DISFRACES TERRORÍFICOS Y DE FANTASÍA PARA HALLOWEEN.',
    btnText: 'DESCUBRE EL TERROR Y FANTASÍA'
  },
  noviembre: {
    name: 'Noviembre',
    upper: 'NOVIEMBRE',
    photo: 'assets/img/remote/rUQ18wMDU5LWNjLXNjYWxlZC5qcGc.jpg',
    subtitle: 'GRADOS, CLAUSURAS Y CEREMONIAS DE FIN DE AÑO.',
    btnText: 'DESCUBRE GRADOS Y CLAUSURAS'
  },
  diciembre: {
    name: 'Diciembre',
    upper: 'DICIEMBRE',
    photo: 'assets/img/reno_rudolfo.webp',
    subtitle: 'LA NAVIDAD SE VISTE AQUÍ. BRILLA EN CADA CELEBRACIÓN.',
    btnText: 'DESCUBRE LA MAGIA NAVIDEÑA'
  }
};

const months = Object.keys(seasonConfigs);

months.forEach(m => {
  const conf = seasonConfigs[m];
  const panelMarker = 'data-panel="' + m + '"';
  const start = html.indexOf(panelMarker);
  if (start === -1) {
    console.error('Missing panel for month:', m);
    return;
  }
  const end = html.indexOf('</article>', start);
  let panelHtml = html.substring(start, end);

  // We want to replace whatever hero is between <nav class="season-quick-nav ... </nav> and <div class="season-sub-sections">
  const navEndIdx = panelHtml.indexOf('</nav>') + '</nav>'.length;
  const subSecIdx = panelHtml.indexOf('<div class="season-sub-sections">');

  if (navEndIdx === -1 || subSecIdx === -1) {
    console.error(`Could not locate insertion point in panel [${m}]`);
    return;
  }

  const newHeroHtml = `\n\n        <div class="season-hero-banner" data-hero-season="${m}" style="background-image: url('${conf.photo}');">
          <div class="season-hero-overlay"></div>
          <div class="season-hero-content">
            <span class="season-hero-badge" data-field="${m}.hero_badge">TEMPORADA DE ${conf.upper}</span>
            <h3 class="season-hero-title">
              EL BODEGÓN DE LOS TRAJES<br>
              TE TRAE LA COLECCIÓN DE<br>
              <span class="season-hero-month" data-field="${m}.hero_month">${conf.upper}</span> · TUNJA
            </h3>
            <p class="season-hero-subtitle" data-field="${m}.hero_subtitle">${conf.subtitle}</p>
            <button type="button" class="btn-season-magic" data-enter="${m}" aria-expanded="false">
              <span class="magic-sparkle">✨</span> ${conf.btnText}
            </button>
          </div>
        </div>\n\n        `;

  panelHtml = panelHtml.substring(0, navEndIdx) + newHeroHtml + panelHtml.substring(subSecIdx);
  html = html.substring(0, start) + panelHtml + html.substring(end);
});

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Successfully placed cinematic Hero Banner in all 12 season panels!');
