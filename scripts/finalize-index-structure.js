const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'sitio', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// 1. Put #catalogo anchor before #temporadas
if (!html.includes('<div id="catalogo" class="season-catalog-anchor"></div>\n  <section id="temporadas"')) {
  // Remove any existing <div id="catalogo" class="season-catalog-anchor"></div>
  html = html.replace(/<div id="catalogo" class="season-catalog-anchor"><\/div>\s*/g, '');
  html = html.replace('<section id="temporadas"', '<div id="catalogo" class="season-catalog-anchor"></div>\n  <section id="temporadas"');
}

// 2. Fix Enero Panel completely
const eneroStart = html.indexOf('<article class="season-panel season-panel-stack is-active" data-panel="enero"');
const eneroEnd = html.indexOf('</article>', eneroStart) + '</article>'.length;

const cleanEnero = `      <article class="season-panel season-panel-stack is-active" data-panel="enero" data-cat-panel="enero" role="tabpanel">
        <div class="season-hero-wrapper enero-hero-wrapper">
          <div class="season-hero enero-hero-full">
            <span class="season-milestone" data-field="enero.hero_milestone">Hito Colombiano · Reyes Magos y regreso a clases</span>
            <h3 class="season-title" data-field="enero.hero_title">Enero · Reyes Magos, Uniformes y Batas</h3>
            <p class="season-subtitle" data-field="enero.hero_subtitle">Celebra el Día de Reyes con nuestros trajes y prepárate para el nuevo año escolar con uniformes y batas ajustados a la medida. Elige una categoría o explora el catálogo completo.</p>
            <a class="season-cta" href="https://wa.me/573107706615?text=Hola%2C%20quiero%20cotizar%20para%20enero." data-field="enero.hero_cta">Cotizar por WhatsApp</a>
            <nav class="season-quick-nav enero-quick-nav" aria-label="Navegación de enero">
              <a href="#enero-temporada">La temporada</a>
              <a href="#enero-catalogo">Catálogo</a>
              <a href="#enero-contacto">Contáctanos</a>
            </nav>
          </div>
          <div class="enero-hero-photo" id="enero-hero-photo">
            <img src="assets/img/reyes_magos.webp" alt="Foto de temporada - Enero" loading="eager" fetchpriority="high" decoding="async">
          </div>
        </div>

        <div class="season-sub-sections">
          <section class="season-catalog" id="enero-temporada">
            <span class="season-catalog-tag">Nuestra temporada de Enero</span>
            <h4>Enero en el Bodegón</h4>
            <p class="season-subtitle">Enero abre el año con la majestuosidad del Día de Reyes y el regreso al colegio. Cada túnica, manto, uniforme y bata se elabora a la medida con las mejores telas en nuestro taller de Tunja.</p>
          </section>

          <section class="season-catalog" id="enero-catalogo">
            <span class="season-catalog-tag">Catálogo del Mes</span>
            <h4>Catálogo de Enero</h4>
            <p class="season-subtitle">Confección a la medida en nuestro taller de la Diagonal 66 2B 04 de Tunja. Elige lo que te gustó y te cotizamos sin compromiso por WhatsApp.</p>
            <div class="grid-haunted">
              <div class="card-ghost" data-card-id="card-enero-reyes-magos">
                <div class="img-ghost"><img loading="lazy" src="assets/img/reyes_magos.webp" alt="Traje de Reyes Magos"></div>
                <div class="card-body-haunted">
                  <h3>Reyes Magos</h3>
                  <p>Los Reyes Magos llegan el 6 de enero. Confeccionamos sus trajes con túnica, manto y corona de acuerdo a la foto o modelo que nos compartas.</p>
                </div>
              </div>
              <div class="card-ghost" data-card-id="card-enero-uniformes">
                <div class="img-ghost"><img loading="lazy" src="assets/img/uniforme_colegio.webp" alt="Uniformes Escolares"></div>
                <div class="card-body-haunted">
                  <h3>Uniformes Escolares</h3>
                  <p>Confección completa de uniformes de colegio para niña y niño, con el entalle y los escudos bordados de cada institución de Tunja y Boyacá.</p>
                </div>
              </div>
              <div class="card-ghost" data-card-id="card-enero-batas">
                <div class="img-ghost"><img loading="lazy" src="assets/img/bata_laboratorio.webp" alt="Batas de Laboratorio"></div>
                <div class="card-body-haunted">
                  <h3>Batas</h3>
                  <p>Batas de laboratorio para colegio y universidad, confeccionadas a la medida con telas lavables y durables.</p>
                </div>
              </div>
            </div>
          </section>

          <section class="season-catalog" id="enero-contacto">
            <span class="season-catalog-tag">Contáctanos</span>
            <h4>Cotiza tu Enero</h4>
            <p class="season-subtitle">📍 Diagonal 66 2B 04, Tunja, Boyacá</p>
            <p class="season-subtitle">📞 +57 310 770 6615</p>
            <p class="season-subtitle">📅 Lunes a sábado: 8:00 am a 6:00 pm</p>
            <p class="season-subtitle">🏁 Domingos y festivos: 9:00 am a 1:00 pm</p>
            <a class="season-cta" href="https://wa.me/573107706615?text=Hola%2C%20quiero%20cotizar%20para%20enero.">Cotizar por WhatsApp</a>
          </section>
        </div>
      </article>`;

html = html.substring(0, eneroStart) + cleanEnero + html.substring(eneroEnd);

// 3. Fix Octubre:
// Replace <a href="#catalogo">Catálogo Halloween</a> with <a href="#octubre-catalogo">Catálogo Halloween</a>
html = html.replace('<a href="#catalogo">Catálogo Halloween</a>', '<a href="#octubre-catalogo">Catálogo Halloween</a>');

// Replace <section class="season-catalog" id="catalogo"> with <section class="season-catalog" id="octubre-catalogo">
html = html.replace('<section class="season-catalog" id="catalogo">', '<section class="season-catalog" id="octubre-catalogo">');

// Add card-octubre-parca-muerte if not already present
if (!html.includes('data-card-id="card-octubre-parca-muerte"')) {
  const pennywiseMarker = 'data-card-id="card-octubre-pennywise"';
  const pIdx = html.indexOf(pennywiseMarker);
  if (pIdx !== -1) {
    const pCardEnd = html.indexOf('</div>\n            </div>', pIdx) + '</div>\n            </div>'.length;
    const parcaCard = `\n            <div class="card-ghost" data-card-id="card-octubre-parca-muerte">
              <div class="img-ghost"><img loading="lazy" src="assets/img/remote/r2E1NzY1NjY1OTcxODk2ODU2X24uanBn.jpg" alt="PARCA(muerte)"></div>
              <div class="card-body-haunted">
                <h3>PARCA(muerte)</h3>
                <p>Túnica negra profunda con capucha amplia, acabado espectral y guadaña incluida.</p>
              </div>
            </div>`;
    html = html.substring(0, pCardEnd) + parcaCard + html.substring(pCardEnd);
  }
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Finalized index.html structure successfully!');
