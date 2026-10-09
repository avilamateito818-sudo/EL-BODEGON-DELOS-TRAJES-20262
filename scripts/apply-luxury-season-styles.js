const fs = require('fs');
const path = require('path');

// 1. UPDATE SITIO/CSS/SEASON-COLORS.CSS
const colorsPath = path.join(__dirname, '../sitio/css/season-colors.css');
let colorsCss = fs.readFileSync(colorsPath, 'utf8');

// Replace palettes block (from ENERO to DICIEMBRE before PUENTES)
const newPalettes = `/* ------------------------------------------------------------------
   ENERO · ORO DE REYES
   ------------------------------------------------------------------ */
body[data-season="enero"] {
  --m-accent: #D4A017;
  --m-ink: #FFD700;
  --m-lit: #FFD700;
  --m-on-accent: #1A1204;
  --m-soft: rgba(212, 160, 23, 0.18);
  --m-faint: rgba(212, 160, 23, 0.07);
  --m-glow: rgba(212, 160, 23, 0.45);
  --m-bg1: #0A121E;
  --m-bg2: #05090F;
  --m-bg3: #121E2E;
  --m-deep1: #0A121E;
  --m-deep2: #05090F;
  --m-deep3: #121E2E;
  --m-dark: #F5E6BE;
  --m-dark-soft: #D4A017;
  --m-strong: #FFD700;
}

/* ------------------------------------------------------------------
   FEBRERO · ROSA DE SAN VALENTIN & CARNAVAL
   ------------------------------------------------------------------ */
body[data-season="febrero"] {
  --m-accent: #E4738F;
  --m-ink: #FFAEC3;
  --m-lit: #FFAEC3;
  --m-on-accent: #2A0A14;
  --m-soft: rgba(228, 115, 143, 0.18);
  --m-faint: rgba(228, 115, 143, 0.07);
  --m-glow: rgba(228, 115, 143, 0.45);
  --m-bg1: #1F0A12;
  --m-bg2: #110408;
  --m-bg3: #2B0E19;
  --m-deep1: #1F0A12;
  --m-deep2: #110408;
  --m-deep3: #2B0E19;
  --m-dark: #FCE8EE;
  --m-dark-soft: #E4738F;
  --m-strong: #FFAEC3;
}

/* ------------------------------------------------------------------
   MARZO · VIOLETA DE CUARESMA & EJECUTIVO
   ------------------------------------------------------------------ */
body[data-season="marzo"] {
  --m-accent: #9D74FF;
  --m-ink: #C4A8FF;
  --m-lit: #C4A8FF;
  --m-on-accent: #120524;
  --m-soft: rgba(157, 116, 255, 0.18);
  --m-faint: rgba(157, 116, 255, 0.07);
  --m-glow: rgba(157, 116, 255, 0.45);
  --m-bg1: #140A24;
  --m-bg2: #0A0413;
  --m-bg3: #1E0F36;
  --m-deep1: #140A24;
  --m-deep2: #0A0413;
  --m-deep3: #1E0F36;
  --m-dark: #EFE8FF;
  --m-dark-soft: #9D74FF;
  --m-strong: #C4A8FF;
}

/* ------------------------------------------------------------------
   ABRIL · VERDE DE PRIMAVERA & RENOVACION
   ------------------------------------------------------------------ */
body[data-season="abril"] {
  --m-accent: #4CA968;
  --m-ink: #72D991;
  --m-lit: #72D991;
  --m-on-accent: #06180D;
  --m-soft: rgba(76, 169, 104, 0.18);
  --m-faint: rgba(76, 169, 104, 0.07);
  --m-glow: rgba(76, 169, 104, 0.42);
  --m-bg1: #081A10;
  --m-bg2: #040E08;
  --m-bg3: #0F2B1A;
  --m-deep1: #081A10;
  --m-deep2: #040E08;
  --m-deep3: #0F2B1A;
  --m-dark: #E2F5E8;
  --m-dark-soft: #4CA968;
  --m-strong: #72D991;
}

/* ------------------------------------------------------------------
   MAYO · MAGENTA DEL DIA DE LAS MADRES
   ------------------------------------------------------------------ */
body[data-season="mayo"] {
  --m-accent: #C94E9F;
  --m-ink: #F078C7;
  --m-lit: #F078C7;
  --m-on-accent: #1E0617;
  --m-soft: rgba(201, 78, 159, 0.18);
  --m-faint: rgba(201, 78, 159, 0.07);
  --m-glow: rgba(201, 78, 159, 0.45);
  --m-bg1: #1E0A1A;
  --m-bg2: #0F040D;
  --m-bg3: #2D0E27;
  --m-deep1: #1E0A1A;
  --m-deep2: #0F040D;
  --m-deep3: #2D0E27;
  --m-dark: #FBE6F4;
  --m-dark-soft: #C94E9F;
  --m-strong: #F078C7;
}

/* ------------------------------------------------------------------
   JUNIO · CHAMPANA DE LAS BODAS & QUINCEAÑERAS
   ------------------------------------------------------------------ */
body[data-season="junio"] {
  --m-accent: #E0A838;
  --m-ink: #FFCF6B;
  --m-lit: #FFCF6B;
  --m-on-accent: #1E1303;
  --m-soft: rgba(224, 168, 56, 0.18);
  --m-faint: rgba(224, 168, 56, 0.07);
  --m-glow: rgba(224, 168, 56, 0.45);
  --m-bg1: #1C1408;
  --m-bg2: #0E0903;
  --m-bg3: #2A1E0B;
  --m-deep1: #1C1408;
  --m-deep2: #0E0903;
  --m-deep3: #2A1E0B;
  --m-dark: #FCF4DF;
  --m-dark-soft: #E0A838;
  --m-strong: #FFCF6B;
}

/* ------------------------------------------------------------------
   JULIO · TURQUESA DE LAS FIESTAS PATRIAS & VERANO
   ------------------------------------------------------------------ */
body[data-season="julio"] {
  --m-accent: #17B2B2;
  --m-ink: #4FE1E1;
  --m-lit: #4FE1E1;
  --m-on-accent: #031818;
  --m-soft: rgba(23, 178, 178, 0.18);
  --m-faint: rgba(23, 178, 178, 0.07);
  --m-glow: rgba(23, 178, 178, 0.45);
  --m-bg1: #06181B;
  --m-bg2: #030D0F;
  --m-bg3: #0A252A;
  --m-deep1: #06181B;
  --m-deep2: #030D0F;
  --m-deep3: #0A252A;
  --m-dark: #E2FAFA;
  --m-dark-soft: #17B2B2;
  --m-strong: #4FE1E1;
}

/* ------------------------------------------------------------------
   AGOSTO · VINO DE LAS GALAS & ANIVERSARIO
   ------------------------------------------------------------------ */
body[data-season="agosto"] {
  --m-accent: #B83256;
  --m-ink: #E85B82;
  --m-lit: #E85B82;
  --m-on-accent: #1E050D;
  --m-soft: rgba(184, 50, 86, 0.18);
  --m-faint: rgba(184, 50, 86, 0.07);
  --m-glow: rgba(184, 50, 86, 0.45);
  --m-bg1: #1D0811;
  --m-bg2: #0E0308;
  --m-bg3: #2B0C1A;
  --m-deep1: #1D0811;
  --m-deep2: #0E0308;
  --m-deep3: #2B0C1A;
  --m-dark: #FAE8EE;
  --m-dark-soft: #B83256;
  --m-strong: #E85B82;
}

/* ------------------------------------------------------------------
   SEPTIEMBRE · AZUL AMOR & AMISTAD Y REGRESO A CLASES
   ------------------------------------------------------------------ */
body[data-season="septiembre"] {
  --m-accent: #5D8FD4;
  --m-ink: #8CB4F2;
  --m-lit: #8CB4F2;
  --m-on-accent: #0A1424;
  --m-soft: rgba(93, 143, 212, 0.18);
  --m-faint: rgba(93, 143, 212, 0.07);
  --m-glow: rgba(93, 143, 212, 0.45);
  --m-bg1: #0A1422;
  --m-bg2: #050A12;
  --m-bg3: #102035;
  --m-deep1: #0A1422;
  --m-deep2: #050A12;
  --m-deep3: #102035;
  --m-dark: #EBF3FC;
  --m-dark-soft: #5D8FD4;
  --m-strong: #8CB4F2;
}

/* ------------------------------------------------------------------
   OCTUBRE · NARANJA DE HALLOWEEN
   ------------------------------------------------------------------ */
body[data-season="octubre"] {
  --m-accent: #FF6B00;
  --m-ink: #FF8C00;
  --m-lit: #FF8C00;
  --m-on-accent: #1A0A00;
  --m-soft: rgba(255, 107, 0, 0.18);
  --m-faint: rgba(255, 107, 0, 0.07);
  --m-glow: rgba(255, 107, 0, 0.45);
  --m-bg1: #2A0D00;
  --m-bg2: #160800;
  --m-bg3: #3A1500;
  --m-deep1: #2A0D00;
  --m-deep2: #160800;
  --m-deep3: #3A1500;
  --m-dark: #FFB870;
  --m-dark-soft: #E08A3C;
  --m-strong: #FF8C00;
}

/* ------------------------------------------------------------------
   NOVIEMBRE · AZUL MARINO DE LOS GRADOS & CLAUSURAS
   ------------------------------------------------------------------ */
body[data-season="noviembre"] {
  --m-accent: #3A74D4;
  --m-ink: #689EFA;
  --m-lit: #689EFA;
  --m-on-accent: #061122;
  --m-soft: rgba(58, 116, 212, 0.18);
  --m-faint: rgba(58, 116, 212, 0.07);
  --m-glow: rgba(58, 116, 212, 0.45);
  --m-bg1: #0A1326;
  --m-bg2: #050A14;
  --m-bg3: #111E3B;
  --m-deep1: #0A1326;
  --m-deep2: #050A14;
  --m-deep3: #111E3B;
  --m-dark: #E6EFFC;
  --m-dark-soft: #3A74D4;
  --m-strong: #689EFA;
}

/* ------------------------------------------------------------------
   DICIEMBRE · VERDE ESMERALDA DE NAVIDAD & FIN DE AÑO
   ------------------------------------------------------------------ */
body[data-season="diciembre"] {
  --m-accent: #2E9E3C;
  --m-ink: #54CF65;
  --m-lit: #54CF65;
  --m-on-accent: #041407;
  --m-soft: rgba(46, 158, 60, 0.18);
  --m-faint: rgba(46, 158, 60, 0.07);
  --m-glow: rgba(46, 158, 60, 0.45);
  --m-bg1: #07170B;
  --m-bg2: #030D06;
  --m-bg3: #0D2613;
  --m-deep1: #07170B;
  --m-deep2: #030D06;
  --m-deep3: #0D2613;
  --m-dark: #E3F6E6;
  --m-dark-soft: #2E9E3C;
  --m-strong: #54CF65;
}`;

const paletteStart = colorsCss.indexOf('/* ------------------------------------------------------------------\r\n   ENERO · ORO DE REYES') !== -1
  ? colorsCss.indexOf('/* ------------------------------------------------------------------\r\n   ENERO · ORO DE REYES')
  : colorsCss.indexOf('/* ------------------------------------------------------------------\n   ENERO · ORO DE REYES');

const bridgesIdx = colorsCss.indexOf('/* ===================================================================\r\n   PUENTES') !== -1
  ? colorsCss.indexOf('/* ===================================================================\r\n   PUENTES')
  : colorsCss.indexOf('/* ===================================================================\n   PUENTES');

if (paletteStart !== -1 && bridgesIdx !== -1) {
  colorsCss = colorsCss.slice(0, paletteStart) + newPalettes + '\n\n' + colorsCss.slice(bridgesIdx);
} else {
  console.error('Could not locate palette boundary in season-colors.css');
}

// Replace the overriding rule that forced var(--m-ink) for non-october seasons:
const badInkRegex = /body\[data-season\]:not\(\[data-season="octubre"\]\) #temporadas\[data-season\] \.season-panel\.is-active \.season-title[\s\S]*?color:\s*var\(--m-ink\);[\s\S]*?\}/;
if (badInkRegex.test(colorsCss)) {
  colorsCss = colorsCss.replace(badInkRegex, `/* En fondo oscuro elegante, los titulos de todas las temporadas brillan con su color iluminado */
#temporadas[data-season] .season-panel.is-active .season-title,
#temporadas[data-season] .season-panel.is-active .season-range,
#temporadas[data-season] .season-panel.is-active .season-subsection h4,
#temporadas[data-season] .season-panel.is-active .season-item-body h4,
#temporadas[data-season] .season-panel.is-active .card-body-haunted h3,
#temporadas[data-season] .season-panel.is-active .section-head span,
#temporadas[data-season] .season-panel.is-active .season-milestone,
#temporadas[data-season] .season-panel.is-active .section-head h2,
#temporadas .season-marquee .season-tab.is-active .tab-label {
  color: var(--m-lit);
  text-shadow: 0 0 20px var(--m-glow);
}`);
}

// Also update marquee tabs active styling in season-colors.css:
colorsCss = colorsCss.replace(
  /#temporadas \.season-marquee \.season-tab\.is-active\s*\{[\s\S]*?color:\s*var\(--m-dark\);[\s\S]*?\}/,
  `#temporadas .season-marquee .season-tab.is-active {
  background:
    radial-gradient(160% 150% at 20% 0%, var(--m-soft), transparent 62%),
    linear-gradient(180deg, rgba(24, 32, 46, 0.95), rgba(12, 16, 24, 0.95));
  border-color: var(--m-accent);
  box-shadow: 0 0 25px var(--m-glow), 0 10px 30px rgba(0, 0, 0, 0.7);
  color: #FFFFFF;
}`
);

fs.writeFileSync(colorsPath, colorsCss, 'utf8');
console.log('Updated season-colors.css successfully');

// 2. UPDATE SITIO/CSS/SEASONS.CSS
const seasonsPath = path.join(__dirname, '../sitio/css/seasons.css');
let seasonsCss = fs.readFileSync(seasonsPath, 'utf8');

// Ensure #temporadas container is dark luxury
seasonsCss = seasonsCss.replace(
  /#temporadas\s*\{[\s\S]*?transition:\s*var\(--transition-premium\);[\s\S]*?\}/,
  `#temporadas {
  padding: 8rem 8%;
  background:
    radial-gradient(circle at 85% 8%, var(--season-accent-soft, var(--m-soft, rgba(212, 160, 23, 0.15))), transparent 45%),
    radial-gradient(circle at 12% 92%, var(--m-soft, rgba(212, 160, 23, 0.1)), transparent 55%),
    linear-gradient(165deg, var(--season-bg1, var(--m-bg1, #0a0e17)), var(--season-bg2, var(--m-bg2, #05070c)) 50%, var(--season-bg3, var(--m-bg3, #101624)));
  border-top: 1.5px solid var(--season-accent, var(--m-accent, #d4a017));
  border-bottom: 1.5px solid var(--season-accent, var(--m-accent, #d4a017));
  transition: var(--transition-premium);
}`
);

// Replace season-hero-banner block with Photo 2 target aesthetics
const heroBannerTarget = `/* ============ HERO BANNER DE TEMPORADA (CINEMÁTICO & ELEGANTE - ESTILO FOTO 2) ============ */
.season-hero-banner {
  position: relative;
  width: 100%;
  min-height: 500px;
  border-radius: 20px !important;
  border: 1.5px solid var(--season-accent, #d4a017) !important;
  overflow: hidden;
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4.5rem 2.5rem;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(212, 160, 23, 0.25) !important;
  margin-bottom: 2.5rem;
  transition: transform 0.4s ease, box-shadow 0.4s ease;
}

.season-hero-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(10, 8, 5, 0.52) 0%, rgba(5, 4, 3, 0.88) 100%) !important;
  backdrop-filter: blur(1.5px);
  -webkit-backdrop-filter: blur(1.5px);
  z-index: 1;
}

.season-hero-content {
  position: relative;
  z-index: 2;
  max-width: 950px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.6rem;
}

.season-hero-badge {
  display: inline-block;
  padding: 0.55rem 2.2rem;
  border-radius: 50px;
  border: 1.5px solid var(--season-accent, #d4a017) !important;
  color: var(--season-accent, #d4a017) !important;
  background: rgba(10, 8, 6, 0.78) !important;
  font-family: 'Cinzel Decorative', 'Cinzel', serif;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 4px;
  text-transform: uppercase;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.6);
}

.season-hero-title {
  font-family: 'Cinzel Decorative', 'Cinzel', serif !important;
  font-size: 3.4rem !important;
  line-height: 1.25;
  font-weight: 700;
  color: #FFFFFF !important;
  text-transform: uppercase;
  letter-spacing: 3px;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.95), 0 0 35px rgba(212, 160, 23, 0.35) !important;
  margin: 0;
}

.season-hero-month {
  color: var(--season-accent, #d4a017) !important;
  font-weight: 800;
  text-shadow: 0 0 25px rgba(212, 160, 23, 0.75) !important;
}

.season-hero-subtitle {
  font-family: 'Quicksand', sans-serif !important;
  font-size: 1.05rem !important;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--season-accent, #e5a93b) !important;
  opacity: 0.95;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.95) !important;
  max-width: 820px;
  margin: 0;
  line-height: 1.65;
}

.btn-season-magic {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.9rem;
  background: linear-gradient(135deg, #d4981a 0%, #e0ba55 50%, #b8860b 100%) !important;
  color: #0c0a06 !important;
  font-family: 'Cinzel Decorative', 'Cinzel', serif !important;
  font-size: 1.05rem !important;
  font-weight: 800 !important;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  padding: 1.25rem 3.2rem;
  border-radius: 6px !important;
  border: none !important;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.65), 0 0 25px rgba(212, 152, 26, 0.5) !important;
  transition: all 0.35s cubic-bezier(0.25, 1, 0.5, 1);
  margin-top: 0.8rem;
}

.btn-season-magic:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.75), 0 0 40px rgba(255, 215, 0, 0.75) !important;
  background: linear-gradient(135deg, #f0b020 0%, #ffd700 50%, #d4981a 100%) !important;
  color: #000 !important;
}

.btn-season-magic:active {
  transform: translateY(0) scale(0.98);
}

.btn-season-magic .magic-sparkle {
  display: none !important;
}

/* ============ SUBSECCIONES EXPANDIBLES (TEMPORADA, CATÁLOGO, CONTACTO) ============ */
.season-panel .season-sub-sections {
  display: flex;
  flex-direction: column;
  gap: 3.5rem;
  width: 100%;
}

.season-panel:not(.is-expanded) .season-sub-sections {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transform: translateY(-20px);
  pointer-events: none;
  margin: 0;
  padding: 0;
  gap: 0;
  transition: all 0.4s ease;
}

.season-panel.is-expanded .season-sub-sections {
  max-height: 60000px;
  opacity: 1;
  overflow: visible;
  transform: translateY(0);
  pointer-events: auto;
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.season-catalog {
  border: 1.5px solid rgba(212, 160, 23, 0.35) !important;
  border-radius: 20px !important;
  padding: 3rem !important;
  background: linear-gradient(145deg, rgba(14, 18, 28, 0.88), rgba(8, 11, 18, 0.94)) !important;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.65) !important;
  scroll-margin-top: 140px;
  transition: var(--transition-premium);
}

.season-catalog:hover {
  border-color: var(--season-accent, var(--m-accent, #d4a017)) !important;
  box-shadow: 0 0 35px var(--season-glow, var(--m-glow, rgba(212, 160, 23, 0.35))), 0 25px 60px rgba(0, 0, 0, 0.75) !important;
}

.season-catalog h4 {
  font-family: 'Cinzel Decorative', 'Cinzel', serif !important;
  font-size: 2.1rem !important;
  color: var(--season-accent, var(--m-lit, #ffd700)) !important;
  letter-spacing: 2.5px;
  margin-bottom: 1.5rem;
  text-shadow: 0 0 16px var(--season-glow, var(--m-glow)) !important;
}

.season-catalog-tag {
  display: inline-block;
  font-family: 'Cinzel Decorative', serif !important;
  font-size: 0.78rem !important;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--season-accent, var(--m-lit, #ffd700)) !important;
  border: 1.5px solid var(--season-accent, var(--m-accent, #d4a017)) !important;
  background: rgba(212, 160, 23, 0.12) !important;
  padding: 0.5rem 1.6rem !important;
  border-radius: 40px !important;
  margin-bottom: 1.4rem;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
}

.season-catalog .season-subtitle {
  color: #e2e8f0 !important;
  font-size: 1.05rem !important;
  line-height: 1.75 !important;
  max-width: 900px;
  margin-bottom: 2rem;
}

.season-catalog .card-ghost {
  background: rgba(18, 24, 36, 0.75) !important;
  border: 1.5px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 16px !important;
  overflow: hidden;
  transition: all 0.35s ease;
}

.season-catalog .card-ghost:hover {
  border-color: var(--season-accent, var(--m-accent, #d4a017)) !important;
  transform: translateY(-6px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.65), 0 0 25px var(--season-glow, var(--m-glow)) !important;
}

.season-catalog .card-body-haunted h3 {
  font-family: 'Cinzel Decorative', serif !important;
  color: #FFFFFF !important;
  font-size: 1.25rem !important;
  margin-bottom: 0.6rem;
}

.season-catalog .card-body-haunted p {
  color: #cbd5e1 !important;
  font-size: 0.92rem !important;
  line-height: 1.6 !important;
}

.season-catalog .season-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #d4981a 0%, #e0ba55 50%, #b8860b 100%) !important;
  color: #0c0a06 !important;
  font-family: 'Cinzel Decorative', serif !important;
  font-size: 0.95rem !important;
  font-weight: 800 !important;
  letter-spacing: 2px;
  text-transform: uppercase;
  padding: 1.1rem 2.6rem;
  border-radius: 6px !important;
  border: none !important;
  text-decoration: none;
  box-shadow: 0 8px 24px rgba(212, 160, 23, 0.4) !important;
  margin-top: 1.5rem;
  transition: all 0.35s ease;
}

.season-catalog .season-cta:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 35px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.6) !important;
  filter: brightness(1.1);
}`;

const oldHeroRegex = /\/\* ============ HERO BANNER DE TEMPORADA \(CINEMÁTICO & ELEGANTE\) ============ \*\/[\s\S]*?@media \(max-width: 768px\)/;
if (oldHeroRegex.test(seasonsCss)) {
  seasonsCss = seasonsCss.replace(oldHeroRegex, heroBannerTarget + '\n\n@media (max-width: 768px)');
} else {
  // Append or replace
  seasonsCss += '\n\n' + heroBannerTarget;
}

fs.writeFileSync(seasonsPath, seasonsCss, 'utf8');
console.log('Updated seasons.css successfully');
