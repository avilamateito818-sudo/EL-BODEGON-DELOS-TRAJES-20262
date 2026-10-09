const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'sitio', 'index.html');
const backupPath = path.join(__dirname, '..', 'sitio', 'index.html.bak');

let html = fs.readFileSync(indexPath, 'utf8');
fs.writeFileSync(backupPath, html, 'utf8');
console.log('Backup saved to', backupPath);

// 1. Añadir CSS de nosotros.css en el head si no existe
if (!html.includes('css/nosotros.css')) {
  html = html.replace('<link rel="stylesheet" href="css/seasons.css">', '<link rel="stylesheet" href="css/seasons.css">\n  <link rel="stylesheet" href="css/nosotros.css">');
}

// 2. Actualizar menú de navegación principal
const oldNavMenuRegex = /<ul class="nav-menu" id="nav-menu">[\s\S]*?<\/ul>/;
const newNavMenu = `<ul class="nav-menu" id="nav-menu">
        <li><a href="#inicio">Portada</a></li>
        <li><a href="#nosotros">Sobre Nosotros</a></li>
        <li class="has-dropdown">
          <button type="button" class="dropdown-toggle" aria-expanded="false">
            Temporadas <span class="caret">&#9662;</span>
          </button>
          <ul class="dropdown dropdown-grid">
            <li><a href="#temporadas" data-tab="enero">Enero · Reyes &amp; Retorno</a></li>
            <li><a href="#temporadas" data-tab="febrero">Febrero · Carnaval &amp; Glamour</a></li>
            <li><a href="#temporadas" data-tab="marzo">Marzo · Efecto Ejecutivo</a></li>
            <li><a href="#temporadas" data-tab="abril">Abril · Feria &amp; Renovación</a></li>
            <li><a href="#temporadas" data-tab="mayo">Mayo · Día de las Madres</a></li>
            <li><a href="#temporadas" data-tab="junio">Junio · Bodas &amp; Quinceañeras</a></li>
            <li><a href="#temporadas" data-tab="julio">Julio · Fiestas Patrias</a></li>
            <li><a href="#temporadas" data-tab="agosto">Agosto · Celebraciones de Gala</a></li>
            <li><a href="#temporadas" data-tab="septiembre">Septiembre · Amor &amp; Amistad</a></li>
            <li><a href="#temporadas" data-tab="octubre">Octubre · Halloween Exclusivo</a></li>
            <li><a href="#temporadas" data-tab="noviembre">Noviembre · Grados &amp; Clausuras</a></li>
            <li><a href="#temporadas" data-tab="diciembre">Diciembre · Navidad &amp; Fin de Año</a></li>
          </ul>
        </li>
        <li><a href="#catalogo">Catálogo</a></li>
        <li><a href="#contacto">Contacto</a></li>
        <li class="admin-menu-item">
          <button type="button" class="admin-menu-btn" id="admin-menu-btn">
            <span aria-hidden="true">&#128274;</span> Panel de administración
          </button>
        </li>
      </ul>`;

html = html.replace(oldNavMenuRegex, newNavMenu);

// 3. Crear sección #nosotros si no existe ya
const nosotrosSectionHtml = `
  <!-- SECCIÓN SOBRE NOSOTROS (DEDICADA Y ELEGANTE) -->
  <section id="nosotros" class="nosotros-section">
    <div class="section-head">
      <span>El Taller &amp; Nuestra Historia</span>
      <h2>Sobre Nosotros</h2>
      <p class="nosotros-subtitle">Tradición, alta costura y pasión artesanal en el corazón de Tunja, Boyacá</p>
    </div>

    <div class="nosotros-container">
      <div class="nosotros-grid">
        <div class="nosotros-media">
          <div class="nosotros-img-frame">
            <img loading="lazy" src="assets/img/horror_bg.webp" alt="Taller El Bodegón de los Trajes Tunja">
            <div class="nosotros-badge-experience">
              <strong>+10 Años</strong>
              <span>de Alta Costura</span>
            </div>
          </div>
        </div>
        <div class="nosotros-content">
          <span class="nosotros-tag">Sastrería de Élite &amp; Disfraces a Medida</span>
          <h3 class="nosotros-title">Viste tu imaginación, vive tu historia con alta costura boyacense</h3>
          <p class="nosotros-lead">
            En <strong>El Bodegón de los Trajes</strong>, fundado y liderado por <strong>Doña Ana Isabel</strong> en Tunja, transformamos cada idea en una obra de arte textil. No somos un depósito de prendas genéricas; somos un auténtico taller de sastrería donde cada disfraz, traje de época, uniforme y atuendo de gala se corta, entalla y confecciona meticulosamente a la medida.
          </p>
          <p class="nosotros-body">
            Con más de una década vistiendo a familias, instituciones educativas, comparsas y eventos culturales de Boyacá, combinamos técnicas tradicionales de confección con telas de primera calidad. Desde el misterio de los disfraces de Halloween hasta la solemnidad de trajes coloniales, fin de año y vestidos de gala, cuidamos cada costura, detalle y accesorio.
          </p>

          <div class="nosotros-pillars">
            <div class="pillar-card">
              <span class="pillar-icon" aria-hidden="true">✂️</span>
              <h4>A la Medida</h4>
              <p>Entalle perfecto y ajuste anatómico según tu figura.</p>
            </div>
            <div class="pillar-card">
              <span class="pillar-icon" aria-hidden="true">🧵</span>
              <h4>Telas Finas</h4>
              <p>Materiales durables, forros cómodos y acabados de sastrería.</p>
            </div>
            <div class="pillar-card">
              <span class="pillar-icon" aria-hidden="true">🎭</span>
              <h4>Todas las Épocas</h4>
              <p>De superhéroes a trajes históricos, cuentos y terror gótico.</p>
            </div>
            <div class="pillar-card">
              <span class="pillar-icon" aria-hidden="true">📍</span>
              <h4>Atención en Tunja</h4>
              <p>Taller físico en Diagonal 66 2B 04 con asesoría directa.</p>
            </div>
          </div>

          <div class="nosotros-cta-row">
            <a href="https://wa.me/573107706615?text=Hola%2C%20quiero%20conocer%20m%C3%A1s%20sobre%20El%20Bodeg%C3%B3n%20de%20los%20Trajes%20y%20agendar%20una%20cita." target="_blank" rel="noopener" class="btn-haunted">
              <span aria-hidden="true">&#128172;</span> Visítanos o Escríbenos
            </a>
            <a href="#temporadas" class="nosotros-btn-secondary">
              Ver Temporadas &amp; Catálogo &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
`;

if (!html.includes('id="nosotros"')) {
  // Insertar después de </section> de #inicio
  html = html.replace('</section>\n\n  <!-- TEMPORADAS SECTION -->', '</section>\n' + nosotrosSectionHtml + '\n  <!-- TEMPORADAS SECTION -->');
}

// 4. Extraer el contenido de cada panel de catálogo de catalogo-general
// Buscamos <div class="catalogo-general-panel[^>]*id="cat-panel-([a-z]+)"[^>]*>([\s\S]*?)<\/div>\s*(?=<div class="catalogo-general-panel|<p class="catalogo-general-aviso|<\/section>)
const catPanels = {};
const panelRegex = /<div class="catalogo-general-panel[^>]*id="cat-panel-([a-z]+)"[^>]*>([\s\S]*?)<\/div>\s*(?=<div class="catalogo-general-panel|<p class="catalogo-general-aviso|<\/section>)/g;

let match;
while ((match = panelRegex.exec(html)) !== null) {
  const month = match[1];
  let content = match[2].trim();
  catPanels[month] = content;
}

console.log('Found catalog panels for months:', Object.keys(catPanels));

// 5. Integrar el catálogo directamente en cada season-panel
// Para Enero: agregar reyes-magos, uniformes y batas dentro de season-panel data-panel="enero"
// Para los demás meses: insertar su catálogo entre section [mes]-temporada y section [mes]-contacto
// Para Octubre: limpiar la vieja nosotros-halloween e insertar el catálogo exclusivo de Halloween

// Enero:
if (catPanels['enero']) {
  const eneroOldContent = html.match(/<!-- ENERO -->[\s\S]*?<article class="season-panel[^>]*data-panel="enero"[\s\S]*?<\/article>/);
  if (eneroOldContent) {
    const eneroArticle = `<article class="season-panel is-active" data-panel="enero" data-cat-panel="enero" role="tabpanel">
        <div class="season-hero-wrapper enero-hero-wrapper">
          <div class="season-hero enero-hero-full">
            <span class="season-milestone" data-field="enero.hero_milestone">Hito Colombiano · Reyes Magos y regreso a clases</span>
            <h3 class="season-title" data-field="enero.hero_title">Enero · Reyes Magos, Uniformes y Batas</h3>
            <p class="season-subtitle" data-field="enero.hero_subtitle">Celebra el Día de Reyes con nuestros trajes y prepárate para el nuevo año escolar con uniformes y batas ajustados a la medida. Elige una categoría o explora el catálogo completo.</p>
            <a class="season-cta" href="https://wa.me/573107706615?text=Hola%2C%20quiero%20cotizar%20para%20enero." data-field="enero.hero_cta">Cotizar por WhatsApp</a>
            <nav class="season-quick-nav enero-quick-nav" aria-label="Navegación de enero">
              <a href="#reyes-magos">Reyes Magos</a>
              <a href="#uniformes">Uniformes</a>
              <a href="#batas">Batas</a>
              <a href="https://wa.me/573107706615?text=Hola%2C%20quiero%20cotizar%20para%20enero.">Contacto</a>
            </nav>
          </div>
          <div class="enero-hero-photo" id="enero-hero-photo">
            <img src="assets/img/reyes_magos.webp" alt="Foto de temporada - Enero" loading="eager" fetchpriority="high" decoding="async">
          </div>
        </div>

        <div id="catalogo" class="season-catalog-anchor"></div>
        ${catPanels['enero']}
      </article>`;
    html = html.replace(eneroOldContent[0], '<!-- ENERO -->\n      ' + eneroArticle);
  }
}

// Febrero a Septiembre:
const otherMonths = ['febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre'];
otherMonths.forEach(m => {
  if (!catPanels[m]) return;
  const reg = new RegExp(`(<article class="season-panel[^>]*data-panel="${m}"[\\s\\S]*?<div class="season-sub-sections">\\s*<section class="season-catalog" id="${m}-temporada">[\\s\\S]*?<\\/section>)([\\s\\S]*?)(<section class="season-catalog" id="${m}-contacto">[\\s\\S]*?<\\/article>)`);
  const mMatch = html.match(reg);
  if (mMatch) {
    const updated = mMatch[1] + '\n\n          ' + catPanels[m] + '\n\n          ' + mMatch[3];
    // Asegurar atributo data-cat-panel
    const withCatPanel = updated.replace(`data-panel="${m}"`, `data-panel="${m}" data-cat-panel="${m}"`);
    html = html.replace(mMatch[0], withCatPanel);
  }
});

// Octubre:
if (catPanels['octubre']) {
  const octMatch = html.match(/<!-- OCTUBRE -->[\s\S]*?<article class="season-panel[^>]*data-panel="octubre"[\s\S]*?<\/article>/);
  if (octMatch) {
    const octArticle = `<!-- OCTUBRE -->
      <article class="season-panel season-panel-stack season-panel-exclusive" data-panel="octubre" data-cat-panel="octubre" role="tabpanel">
        <nav class="season-quick-nav month-nav" aria-label="Navegación de octubre">
          <a href="#octubre-temporada">La temporada</a>
          <a href="#catalogo">Catálogo Halloween</a>
          <a href="#contacto-octubre">Contacto</a>
        </nav>
        <div class="season-hero">
          <span class="season-milestone">Hito de Terror · Temporada de Halloween</span>
          <h3 class="season-title">Terror en Tunja, edición exclusiva.</h3>
          <p class="season-subtitle">Colección exclusiva de disfraces de Halloween en Negro &amp; Naranja, confeccionada a la medida en nuestro taller de Tunja. Explora superhéroes, personajes de terror clásico, cuentos de hadas y gala del inframundo.</p>
          <a class="season-cta" href="https://wa.me/573107706615?text=Hola%2C%20quiero%20cotizar%20un%20disfraz%20de%20Halloween.">Cotizar por WhatsApp</a>
        </div>
        <div class="season-sub-sections">
          <section class="season-catalog" id="octubre-temporada">
            <span class="season-catalog-tag">Edición Especial</span>
            <h4>Halloween en El Bodegón</h4>
            <p class="season-subtitle">Octubre es el mes más icónico del taller: superhéroes de cómic, villanos cinematográficos, brujas, vampiros, princesas y personajes terroríficos. Cada disfraz se confecciona a la medida o se arma según la foto de referencia que nos compartas por WhatsApp.</p>
          </section>

          ${catPanels['octubre']}

          <section class="season-catalog" id="contacto-octubre">
            <span class="season-catalog-tag">Contáctanos</span>
            <h4>Cotiza tu disfraz de Halloween</h4>
            <p class="season-subtitle">📍 Diagonal 66 2B 04, Tunja</p>
            <p class="season-subtitle">📞 +57 310 770 6615</p>
            <a class="season-cta" href="https://wa.me/573107706615?text=Hola%2C%20quiero%20cotizar%20un%20disfraz%20de%20Halloween.">Cotizar por WhatsApp</a>
          </section>
        </div>
      </article>`;
    html = html.replace(octMatch[0], octArticle);
  }
}

// Noviembre:
if (catPanels['noviembre']) {
  const novReg = new RegExp(`(<article class="season-panel[^>]*data-panel="noviembre"[\\s\\S]*?<div class="season-sub-sections">\\s*<section class="season-catalog" id="noviembre-temporada">[\\s\\S]*?<\\/section>)([\\s\\S]*?)(<section class="season-catalog" id="noviembre-contacto">[\\s\\S]*?<\\/article>)`);
  const nMatch = html.match(novReg);
  if (nMatch) {
    const updatedNov = nMatch[1] + '\n\n          ' + catPanels['noviembre'] + '\n\n          ' + nMatch[3];
    const withCatNov = updatedNov.replace(`data-panel="noviembre"`, `data-panel="noviembre" data-cat-panel="noviembre"`);
    html = html.replace(nMatch[0], withCatNov);
  }
}

// Diciembre:
if (catPanels['diciembre']) {
  const dicReg = new RegExp(`(<article class="season-panel[^>]*data-panel="diciembre"[\\s\\S]*?<div class="season-sub-sections">\\s*<section class="season-catalog" id="diciembre-temporada">[\\s\\S]*?<\\/section>)([\\s\\S]*?)(<section class="season-catalog" id="diciembre-contacto">[\\s\\S]*?<\\/article>)`);
  const dMatch = html.match(dicReg);
  if (dMatch) {
    const updatedDic = dMatch[1] + '\n\n          ' + catPanels['diciembre'] + '\n\n          ' + dMatch[3];
    const withCatDic = updatedDic.replace(`data-panel="diciembre"`, `data-panel="diciembre" data-cat-panel="diciembre"`);
    html = html.replace(dMatch[0], withCatDic);
  }
}

// 6. Eliminar completamente la sección redundante #catalogo-general
const catalogoGeneralRegex = /<!-- CATÁLOGO GENERAL -->[\s\S]*?<\/section>\s*(?=\s*<section id="contacto">)/;
if (catalogoGeneralRegex.test(html)) {
  html = html.replace(catalogoGeneralRegex, '');
  console.log('Removed #catalogo-general section successfully.');
}

// 7. Actualizar footer enlaces
html = html.replace(
  /<nav class="footer-col" aria-label="Enlaces rápidos">[\s\S]*?<\/nav>/,
  `<nav class="footer-col" aria-label="Enlaces rápidos">
        <h4>Explora</h4>
        <ul>
          <li><a href="#inicio">Portada</a></li>
          <li><a href="#nosotros">Sobre Nosotros</a></li>
          <li><a href="#temporadas">Temporadas</a></li>
          <li><a href="#catalogo">Catálogo</a></li>
          <li><a href="#contacto">Contáctanos</a></li>
          <li class="admin-menu-item">
            <button type="button" class="admin-menu-btn" id="admin-menu-btn-footer">
              <span aria-hidden="true">&#128274;</span> Panel de administración
            </button>
          </li>
        </ul>
      </nav>`
);

// 8. Reemplazar cualquier link remanente #catalogo-general por #catalogo
html = html.replace(/href="#catalogo-general"/g, 'href="#catalogo"');

fs.writeFileSync(indexPath, html, 'utf8');
console.log('sitio/index.html updated successfully with complete clean structure!');
