/**
 * build-refactored-seasons-css.js
 * 
 * Script de refactorización para T4.4:
 * Aplica el principio Open/Closed (SOLID) en seasons.css unificando
 * las 12 temporadas en reglas genéricas parametrizadas por Custom Properties (--m-* y --season-*),
 * eliminando miles de líneas duplicadas y reduciendo el archivo en más del 70%.
 */

const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'sitio', 'css', 'seasons.css');
const originalContent = fs.readFileSync(targetFile, 'utf8');
const originalSize = 75370; // Tamaño original antes de la refactorización

const refactoredCss = `/* ===================================================================
   TEMPORADAS (CATÁLOGO POR TEMPORADA) · ARQUITECTURA MODULAR (SOLID: O)
   -------------------------------------------------------------------
   Refactorizado bajo el Principio Abierto/Cerrado (Open/Closed).
   Reglas genéricas gobernadas por CSS Custom Properties (--m-* / --season-*).
   Para alterar o añadir una temporada solo se ajustan tokens de color,
   sin duplicar bloques de selectores.
   =================================================================== */

/* ============ CONTENEDOR BASE DE TEMPORADAS ============ */
#temporadas {
  padding: 12rem 12%;
  background:
    radial-gradient(circle at 85% 8%, var(--season-accent-soft, var(--m-soft, rgba(255, 140, 0, 0.15))), transparent 45%),
    radial-gradient(circle at 12% 92%, rgba(255, 255, 255, 0.4), transparent 55%),
    linear-gradient(165deg, var(--season-bg1, var(--m-bg1, #1a0a02)), var(--season-bg2, var(--m-bg2, #0d0500)) 50%, var(--season-bg3, var(--m-bg3, #2a1000)));
  border-top: 1px solid var(--season-accent, var(--m-accent, #ff8c00));
  border-bottom: 1px solid var(--season-accent, var(--m-accent, #ff8c00));
  transition: var(--transition-premium);
}

/* ============ TIPOGRAFÍA Y ENCABEZADOS GENÉRICOS ============ */
#temporadas .section-head {
  border: none;
  border-radius: 20px;
  padding: 3rem 4rem;
  margin-bottom: 4rem;
  position: relative;
  overflow: hidden;
}

#temporadas .section-head span {
  color: var(--season-accent, var(--m-accent, #ff8c00));
  font-weight: 700;
  display: block;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  letter-spacing: 8px;
}

#temporadas .section-head h2 {
  color: var(--season-dark, var(--m-dark, var(--ghostly-white)));
  font-size: 4.4rem;
  text-shadow: 0 0 25px var(--season-glow, var(--m-glow, rgba(255, 140, 0, 0.3))), 0 2px 3px rgba(0, 0, 0, 0.12);
  position: relative;
  margin-bottom: 1.5rem;
}

@media (max-width: 640px) {
  #temporadas .section-head h2 { font-size: 2.7rem; }
  #temporadas .section-head { padding: 2.5rem 1.5rem; margin-bottom: 5rem; }
}

#temporadas .season-title {
  color: var(--season-dark, var(--m-dark, #FFFFFF));
  font-size: 2.6rem;
  line-height: 1.3;
  margin-bottom: 1.6rem;
  letter-spacing: 2px;
  text-shadow: 0 0 20px var(--season-glow, var(--m-glow, rgba(255, 179, 71, 0.2)));
}

#temporadas .season-range {
  color: var(--season-dark-soft, var(--m-dark-soft, var(--season-accent, #1A3A6B)));
  font-weight: 700;
  display: block;
  padding-top: 1.2rem;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  letter-spacing: 4px;
}

#temporadas .season-subtitle,
#temporadas .season-item-body p,
#temporadas .season-subsection p,
#temporadas .subsection-list li,
#temporadas .season-blank-title {
  color: var(--season-dark-soft, var(--m-dark-soft, var(--ghostly-white)));
  font-weight: 500;
  line-height: 1.8;
}

#temporadas .season-subtitle strong,
#temporadas .season-subsection p strong,
#temporadas .subsection-list li strong {
  color: var(--season-strong, var(--m-strong, var(--season-accent, #ffd700)));
  font-weight: 800;
}

#temporadas .season-subsection h4,
#temporadas .season-item-body h4 {
  color: var(--season-strong, var(--m-strong, var(--season-accent, #ffd700)));
  text-shadow: 0 0 14px var(--season-glow, var(--m-glow, rgba(255, 140, 0, 0.3)));
  font-weight: 700;
}

/* ============ TARJETAS, SUBSECCIONES Y ELEMENTOS ESTRUCTURALES ============ */
#temporadas .season-hero,
#temporadas .season-expand-wrap,
#temporadas .season-subsection,
#temporadas .season-item,
#temporadas .season-nav-card,
#temporadas .subsection-img,
#temporadas .season-blank {
  border-color: var(--season-accent, var(--m-accent, #ff8c00));
}

#temporadas .season-hero,
#temporadas .season-item,
#temporadas .season-nav-card,
#temporadas .season-subsection {
  border-width: 1.5px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.25));
}

#temporadas .season-item:hover,
#temporadas .season-subsection:hover {
  border-color: var(--season-accent, var(--m-accent, #ff8c00));
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.25), 0 0 30px var(--season-glow, var(--m-glow, rgba(255, 140, 0, 0.2)));
}

#temporadas .season-blank {
  border-color: var(--season-accent, var(--m-accent, #ff8c00));
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.25));
  width: 100%;
  max-width: 640px;
  text-align: center;
  padding: 6rem 2rem;
  border-radius: 16px;
}

#temporadas .season-blank-title {
  font-family: 'Cinzel Decorative', cursive;
  font-size: 1.2rem;
  text-transform: uppercase;
  letter-spacing: 10px;
  color: var(--season-accent, var(--m-accent, var(--halloween-vivid)));
  opacity: 0.95;
}

/* ============ CATÁLOGOS DENTRO DE TEMPORADA ============ */
.season-catalog {
  border: 1px solid var(--season-accent, var(--m-accent, rgba(255, 140, 0, 0.35)));
  border-radius: 16px;
  padding: 2.5rem;
  background: linear-gradient(135deg, var(--season-accent-soft, var(--m-soft, rgba(255, 255, 255, 0.02))), transparent 60%);
  scroll-margin-top: 140px;
  transition: var(--transition-premium);
}

.season-catalog:hover {
  border-color: var(--season-accent, var(--m-accent, #ff8c00));
  box-shadow: 0 0 35px var(--season-glow, var(--m-glow, rgba(255, 140, 0, 0.35)));
}

.season-catalog h4 {
  font-size: 1.6rem;
  color: var(--season-accent, var(--m-accent, var(--halloween-vivid)));
  letter-spacing: 3px;
  margin-bottom: 2rem;
  text-shadow: 0 0 14px var(--season-glow, var(--m-glow, rgba(255, 157, 46, 0.3)));
}

.season-catalog-tag {
  display: inline-block;
  font-size: 0.62rem;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: var(--season-accent, var(--m-accent, var(--halloween-vivid)));
  border: 1px solid var(--season-accent, var(--m-accent, var(--halloween-primary)));
  padding: 0.4rem 1.1rem;
  border-radius: 40px;
  margin-bottom: 1.2rem;
}

.season-catalog .grid-haunted { gap: 2rem; }

@media (max-width: 640px) {
  .season-catalog { padding: 1.6rem; }
}

/* ============ BOTONES CALL TO ACTION ============ */
.season-cta {
  display: inline-block;
  padding: 1.2rem 3rem;
  background: var(--season-accent, var(--m-accent, #ff8c00));
  color: var(--season-on-accent, var(--m-on-accent, #0a0a0a));
  text-decoration: none;
  font-family: 'Quicksand', sans-serif;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 3px;
  font-size: 0.8rem;
  border-radius: 40px;
  transition: var(--transition-premium);
  box-shadow: 0 8px 32px var(--season-glow, var(--m-glow, rgba(255, 140, 0, 0.3))), 0 0 0 3px var(--season-accent, var(--m-accent, #ff8c00));
  position: relative;
  z-index: 5;
  border: 2px solid transparent;
}

.season-cta:hover {
  transform: translateY(-5px) scale(1.03);
  box-shadow: 0 14px 44px var(--season-glow, var(--m-glow, rgba(255, 140, 0, 0.4))), 0 0 0 4px var(--season-accent, var(--m-accent, #ff8c00));
  filter: brightness(1.15);
}

.season-milestone {
  display: inline-block;
  font-size: 0.62rem;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: var(--season-accent, var(--m-accent, var(--halloween-vivid)));
  border: 1px solid var(--season-accent, var(--m-accent, var(--halloween-vivid)));
  padding: 0.5rem 1.2rem;
  border-radius: 40px;
  margin-bottom: 2.2rem;
  font-weight: 700;
}

.milestone-link {
  color: inherit;
  text-decoration: none;
}

.milestone-link:hover {
  text-decoration: underline;
  color: var(--season-accent, var(--m-accent));
}

/* ============ CINTA DE TEMPORADAS (MARQUEE) ============ */
.season-marquee {
  position: relative;
  overflow: hidden;
  max-width: 100%;
  margin-bottom: 5rem;
  padding: 1.25rem 0;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 3%, #000 97%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 3%, #000 97%, transparent);
}

.season-marquee-track {
  display: flex;
  width: max-content;
  animation: marqueeScroll 22s linear infinite;
  will-change: transform;
  cursor: grab;
}
.season-marquee-track.is-dragging {
  cursor: grabbing;
  user-select: none;
  -webkit-user-select: none;
}
.season-marquee-track.is-dragging * {
  pointer-events: none;
}

@media (hover: hover) and (pointer: fine) {
  .season-marquee:hover .season-marquee-track,
  .season-marquee:focus-within .season-marquee-track {
    animation-play-state: paused;
  }
}

.season-marquee-track.is-paused {
  animation-play-state: paused;
}

.season-marquee .season-tabs {
  display: flex;
  flex-wrap: nowrap;
  gap: 1.2rem;
  width: max-content;
  margin: 0;
  padding-right: 1.2rem;
  border: 0;
}

.season-marquee .season-tab {
  flex: 0 0 auto;
  white-space: normal;
  width: 236px;
  padding-left: 1.4rem;
  padding-right: 1.4rem;
  min-height: 120px;
  text-align: center;
  line-height: 1.35;
}

@keyframes marqueeScroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}

.season-marquee-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 20;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-radius: 50%;
  background: rgba(10, 5, 18, 0.55);
  color: #fff;
  font-size: 1.25rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  transition: background .15s ease, border-color .15s ease, transform .15s ease;
}
.season-marquee-prev { left: 0.5rem; }
.season-marquee-next { right: 0.5rem; }
.season-marquee-arrow:hover {
  background: rgba(160, 107, 255, 0.45);
  border-color: #c9a8ff;
}
.season-marquee-arrow:active {
  transform: translateY(-50%) scale(0.92);
}

.season-tab {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  color: var(--ghostly-white);
  padding: 1.4rem 2.8rem;
  font-family: 'Cinzel Decorative', cursive;
  font-size: 1.15rem;
  letter-spacing: 3px;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 14px;
  transition: var(--transition-premium);
  position: relative;
  overflow: hidden;
  font-weight: 700;
}

.season-tab .tab-label {
  display: block;
  font-family: 'Quicksand', sans-serif;
  font-size: 0.62rem;
  letter-spacing: 2px;
  font-weight: 700;
  text-transform: uppercase;
  opacity: 0.85;
  margin-top: 0.5rem;
  white-space: normal;
  overflow-wrap: break-word;
  hyphens: auto;
}

.season-tab .tab-desc {
  display: block;
  font-family: 'Quicksand', sans-serif;
  font-size: 0.66rem;
  font-weight: 500;
  letter-spacing: 0.4px;
  line-height: 1.45;
  text-transform: none;
  opacity: 0.9;
  margin-top: 0.45rem;
  white-space: normal;
}

.season-tab:hover {
  color: var(--season-accent);
  border-color: var(--season-accent);
  transform: translateY(-3px);
}

#temporadas .season-tab.is-active {
  background: linear-gradient(135deg, var(--season-bg1, var(--m-bg1)), var(--season-bg2, var(--m-bg2)));
  color: var(--season-dark, var(--m-dark));
  border-color: var(--season-accent, var(--m-accent));
  text-shadow: none;
  box-shadow: 0 0 30px var(--season-glow, var(--m-glow));
}

#temporadas .season-tab.is-active .tab-label {
  color: var(--season-dark, var(--m-dark));
}

#temporadas .season-marquee .season-tab:not(.is-active):not(.season-tab-exclusive) {
  background:
    radial-gradient(150% 140% at 0% 0%, color-mix(in srgb, var(--pill-accent, var(--m-accent, #ff8c00)) 10%, transparent), transparent 58%),
    linear-gradient(180deg, #d3f0f2, #b8e0e6);
  border: 1px solid rgba(22, 120, 138, 0.35);
  border-left: 4px solid var(--pill-accent, var(--m-accent, #ff8c00));
  color: #10333b;
  box-shadow: 0 10px 26px rgba(15, 45, 55, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.7);
  border-radius: 16px;
  text-shadow: none;
}

#temporadas .season-marquee .season-tab:not(.is-active):not(.season-tab-exclusive) .tab-label {
  color: color-mix(in srgb, var(--pill-accent, var(--m-accent, #ff8c00)) 55%, #10333b);
  opacity: 1;
}

#temporadas .season-marquee .season-tab:not(.is-active):not(.season-tab-exclusive) .tab-desc {
  color: #14525d;
  opacity: 1;
}

#temporadas .season-marquee .season-tab:not(.is-active):not(.season-tab-exclusive):hover {
  transform: translateY(-4px);
  border: 2px solid var(--pill-accent, var(--m-accent, #ff8c00));
  border-left: 4px solid var(--pill-accent, var(--m-accent, #ff8c00));
  color: #0b2228;
  background:
    radial-gradient(150% 140% at 0% 0%, color-mix(in srgb, var(--pill-accent, var(--m-accent, #ff8c00)) 22%, transparent), transparent 60%),
    linear-gradient(180deg, #e0f6f8, #c8ecf0);
  box-shadow: 0 18px 36px rgba(15, 45, 55, 0.26);
}

.season-marquee::after {
  content: '';
  position: absolute;
  left: 4%; right: 4%; top: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.28), transparent);
  pointer-events: none;
}
.season-marquee::before {
  content: '';
  position: absolute;
  left: 4%; right: 4%; bottom: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent);
  pointer-events: none;
}

/* ============ PANELES, GRID Y SUBSECCIONES ============ */
.season-panel { display: none; }

.season-panel.is-active {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 4rem;
  align-items: center;
  animation: seasonIn 0.7s ease-out;
}

.season-panel.is-active.season-panel-stack {
  grid-template-columns: 1fr;
  gap: 3rem;
  align-items: start;
}

.season-panel.is-active.season-panel-blank {
  display: flex;
  justify-content: center;
  align-items: center;
}

.season-hero {
  padding: 3.5rem;
  border: 1px solid var(--glass-border);
  border-left: 3px solid var(--season-accent, var(--m-accent));
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.02), transparent 60%);
  border-radius: 16px;
  position: relative;
}

.season-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.season-item {
  display: grid;
  grid-template-columns: 130px 1fr;
  align-items: center;
  gap: 1.6rem;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 14px;
  padding: 0.9rem 1.5rem 0.9rem 0.9rem;
  transition: var(--transition-premium);
  overflow: hidden;
}

.season-item:hover {
  border-color: var(--season-accent, var(--m-accent));
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.7), 0 0 25px var(--season-glow, var(--m-glow));
  transform: translateX(6px);
}

.season-item img {
  width: 130px;
  height: 130px;
  object-fit: cover;
  border-radius: 10px;
  filter: contrast(1.05) brightness(0.9);
  transition: var(--transition-premium);
}

.season-item:hover img {
  filter: contrast(1.15) brightness(1.05);
}

.season-item-body h4 {
  font-size: 1.05rem;
  color: var(--season-accent, var(--m-accent));
  margin-bottom: 0.6rem;
  letter-spacing: 2px;
}

.season-item-body p {
  font-size: 0.88rem;
  color: var(--ghostly-white);
  line-height: 1.7;
  font-weight: 500;
}

.season-nav-card {
  grid-template-columns: 130px 1fr auto;
  cursor: pointer;
}

.season-nav-card:hover .expand-icon {
  background: var(--season-accent, var(--m-accent));
  color: #0a0a0a;
  transform: translateX(4px);
  box-shadow: 0 0 18px var(--season-glow, var(--m-glow));
}

.expand-icon {
  width: 34px;
  height: 34px;
  border: 1px solid var(--season-accent, var(--m-accent));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.05rem;
  line-height: 1;
  color: var(--season-accent, var(--m-accent));
  transition: var(--transition-premium);
  flex-shrink: 0;
}

.season-sub-sections {
  grid-column: 1 / -1;
  display: grid;
  gap: 2.5rem;
  margin-top: 1.5rem;
}

.season-subsection {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2.5rem;
  align-items: center;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.02), transparent 60%);
  border: 1px solid var(--season-accent, var(--m-accent));
  border-radius: 16px;
  padding: 2rem;
  scroll-margin-top: 140px;
  transition: var(--transition-premium);
}

.season-subsection:hover {
  border-color: var(--season-accent, var(--m-accent));
  box-shadow: 0 0 40px var(--season-glow, var(--m-glow)), 0 15px 40px rgba(0, 0, 0, 0.7);
}

.subsection-img {
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid var(--season-accent, var(--m-accent));
  aspect-ratio: var(--foto-relacion, 4 / 3);
  background: #0d0d12;
}

.subsection-img img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  transition: transform 2s var(--transition-haunted);
}

.season-subsection:hover .subsection-img img { transform: scale(1.08); }

.subsection-list {
  list-style: none;
  margin: 0 0 1.8rem;
  padding: 0;
  display: grid;
  gap: 0.7rem;
}

.subsection-list li {
  position: relative;
  padding-left: 1.9rem;
  color: var(--ghostly-white);
  font-size: 0.98rem;
  line-height: 1.65;
  font-weight: 500;
}

.subsection-list li::before {
  content: '\\2726';
  position: absolute;
  left: 0;
  top: 0.15rem;
  color: var(--season-accent, var(--m-accent));
  font-size: 0.85rem;
  text-shadow: 0 0 10px var(--season-glow, var(--m-glow));
}

.subsection-list li strong {
  color: var(--halloween-vivid);
  font-weight: 700;
}

.season-quick-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.8rem;
  flex-wrap: wrap;
  margin: -2rem 0 4rem;
}

.season-quick-nav.month-nav {
  margin: 0 0 3rem;
  justify-content: flex-start;
}

.season-quick-nav a {
  padding: 0.7rem 1.6rem;
  font-family: 'Quicksand', sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: var(--season-accent, var(--m-accent, var(--halloween-vivid)));
  border: 1px solid var(--season-accent, var(--m-accent));
  border-radius: 40px;
  background: var(--glass-bg);
  text-decoration: none;
  transition: var(--transition-premium);
}

.season-quick-nav a:hover {
  background: var(--season-accent, var(--m-accent));
  color: #0a0a0a;
  transform: translateY(-3px);
  box-shadow: 0 10px 25px var(--season-glow, var(--m-glow));
}

/* ============ AJUSTES ESPECÍFICOS DE ENERO ============ */
#temporadas[data-season="enero"] {
  border-top: 2px solid var(--m-accent, #FFD700);
  border-bottom: 2px solid var(--m-accent, #FFD700);
}

#temporadas[data-season="enero"] .section-head {
  background: linear-gradient(145deg, rgba(13, 36, 64, 0.9), rgba(26, 58, 107, 0.75));
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(255, 215, 0, 0.4), 0 0 50px rgba(255, 215, 0, 0.12);
}

#temporadas[data-season="enero"] .enero-hero-wrapper {
  display: flex;
  gap: 1.5rem;
  align-items: stretch;
  margin-bottom: 1.8rem;
}

#temporadas[data-season="enero"] .enero-hero-wrapper .season-hero {
  flex: 1.2;
  margin-bottom: 0;
  padding: 2.5rem 3rem;
  text-align: left;
  align-items: flex-start;
}

#temporadas[data-season="enero"] .enero-hero-photo {
  position: relative;
  width: 380px;
  max-width: 100%;
  aspect-ratio: var(--foto-relacion, 4 / 3);
  flex-shrink: 0;
  border-radius: 20px;
  overflow: hidden;
  border: 3px solid rgba(255, 215, 0, 0.5);
  box-shadow: 0 15px 45px rgba(0, 0, 0, 0.35), 0 0 30px rgba(255, 215, 0, 0.15);
  background: #0d0d12;
}

#temporadas[data-season="enero"] .enero-hero-photo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

#temporadas[data-season="enero"] .enero-hero-photo .photo-change-btn {
  position: absolute;
  bottom: 12px;
  right: 12px;
  z-index: 30;
  background: linear-gradient(135deg, #FFD700, #DAA520);
  color: #0D2440;
  border: 3px solid #FFD700;
  padding: 0.9rem 1.3rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 8px 25px rgba(255, 215, 0, 0.5);
  transition: var(--transition-premium);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

#temporadas[data-season="enero"] .season-hero {
  background: linear-gradient(145deg, rgba(13, 36, 64, 0.92), rgba(26, 58, 107, 0.8));
}

#temporadas[data-season="enero"] .season-grid {
  display: grid !important;
  grid-template-columns: repeat(3, 1fr) !important;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

#temporadas[data-season="enero"] .season-item {
  display: flex !important;
  flex-direction: row !important;
  background: linear-gradient(145deg, rgba(13, 36, 64, 0.85), rgba(26, 58, 107, 0.65));
}

#temporadas[data-season="enero"] .season-item img {
  width: 160px !important;
  height: 160px !important;
}

#temporadas[data-season="enero"] .season-panel.is-active {
  grid-template-columns: 1fr;
  gap: 2.5rem;
  align-items: start;
}

@media (max-width: 768px) {
  #temporadas[data-season="enero"] .season-grid {
    grid-template-columns: 1fr !important;
  }
}

/* ============ AJUSTES ESPECÍFICOS DE OCTUBRE (HALLOWEEN) ============ */
#temporadas[data-season="octubre"] {
  background:
    radial-gradient(circle at 85% 8%, rgba(255, 107, 0, 0.16), transparent 45%),
    linear-gradient(165deg, #1A0A02, #0D0500 50%, #2A1000 100%);
}

.halloween-landing {
  display: none;
  grid-column: 1 / -1;
  text-align: center;
  padding: 6rem 2rem;
  border: 1px solid rgba(255, 140, 0, 0.4);
  border-radius: 16px;
  background: linear-gradient(160deg, rgba(15, 8, 0, 0.35), rgba(5, 5, 5, 0.72)), url('../assets/img/horror_bg.webp');
  background-size: cover;
  background-position: center;
  position: relative;
  isolation: isolate;
}

.halloween-landing.is-visible {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2.2rem;
}

.halloween-landing::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: radial-gradient(ellipse at center, rgba(10, 5, 0, 0.6) 0%, rgba(5, 5, 5, 0.1) 72%);
  pointer-events: none;
}

.halloween-landing-title {
  font-size: clamp(1.6rem, 4vw, 3.2rem);
  color: #FFFFFF;
  line-height: 1.25;
  letter-spacing: 2px;
  text-transform: uppercase;
  max-width: 900px;
  text-shadow: 0 0 40px rgba(0, 0, 0, 0.9), 0 0 25px rgba(255, 157, 46, 0.3);
}

.halloween-landing-title span { color: #ff8c00; }

.halloween-landing-sub {
  color: var(--halloween-vivid);
  font-size: 1.1rem;
  letter-spacing: 6px;
  font-weight: 700;
  text-transform: uppercase;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.95);
}

.halloween-content { display: none; }
.halloween-content.is-visible { display: contents; }

.season-tab-exclusive {
  background: linear-gradient(135deg, #fff7ec, #ffe8cc);
  border-color: rgba(255, 140, 0, 0.7);
  color: #4a2600;
  animation: exclusivePulse 2.5s ease-in-out infinite;
}

.season-tab-exclusive .tab-label { color: #a04a00; font-weight: 700; }
.season-tab-exclusive .tab-desc { color: #6b3a00; }

@keyframes exclusivePulse {
  0%, 100% { box-shadow: 0 0 18px rgba(255, 140, 0, 0.18); }
  50%      { box-shadow: 0 0 42px rgba(255, 140, 0, 0.42); }
}

/* ============ AJUSTES ESPECÍFICOS DE DICIEMBRE ============ */
#temporadas[data-season="diciembre"] .season-title { font-size: 3.2rem; }
#temporadas[data-season="diciembre"] .season-catalog h4 { font-size: 2.4rem; }

/* ============ CATÁLOGO GENERAL Y PIE ============ */
.catalogo-general-root {
  padding: 7rem 72px;
  background: linear-gradient(180deg, rgba(5, 5, 5, 0) 0%, rgba(10, 6, 2, 0.6) 100%);
}

.catalogo-general-panel { display: none; }
.catalogo-general-panel.is-visible { display: block; animation: seasonIn 0.6s ease-out; }
.catalogo-general-panel .season-catalog { margin-bottom: 3rem; }
.catalogo-general-panel .season-catalog:last-child { margin-bottom: 0; }

.card-sin-foto .img-ghost img { filter: none; opacity: 0.92; }
.card-sin-foto .img-ghost::after {
  content: "";
  position: absolute;
  inset: 14px;
  border: 2px dashed var(--season-accent, rgba(255, 140, 0, 0.45));
  border-radius: 10px;
  opacity: 0.3;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
.card-sin-foto:hover .img-ghost::after { opacity: 0.7; }

.lista-temporadas {
  list-style: none;
  margin: 2rem 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.lista-temporadas a {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1.2rem 1.4rem;
  border: 1px solid var(--glass-border);
  border-left: 3px solid var(--halloween-primary);
  border-radius: 12px;
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  color: inherit;
  text-decoration: none;
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

.lista-temporadas a:hover {
  transform: translateY(-4px);
  border-color: var(--halloween-primary);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.45);
}

.lista-temporadas strong {
  font-family: var(--font-haunted);
  font-size: 1.1rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #FFFFFF;
}

.lista-temporadas span {
  font-size: 0.72rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--halloween-primary);
}

@keyframes seasonIn {
  from { opacity: 0; transform: translateY(25px); }
  to   { opacity: 1; transform: translateY(0); }
}

@media (max-width: 1024px) {
  #temporadas { padding: 8rem 8%; }
  .season-panel.is-active { grid-template-columns: 1fr; gap: 3.5rem; }
  .season-title { font-size: 2.1rem; }
}

@media (max-width: 640px) {
  .season-tab { width: 100%; }
  .season-hero { padding: 2.4rem; }
  .season-item { grid-template-columns: 96px 1fr; gap: 1.2rem; }
  .season-item img { width: 96px; height: 96px; }
  .season-cta { padding: 1.1rem 2rem; letter-spacing: 2px; }
  .lista-temporadas { grid-template-columns: 1fr; }
}
`;

fs.writeFileSync(targetFile, refactoredCss.trim() + '\n', 'utf8');

const finalSize = Buffer.byteLength(fs.readFileSync(targetFile, 'utf8'), 'utf8');
const savedBytes = originalSize - finalSize;
const percentSaved = ((savedBytes / originalSize) * 100).toFixed(1);

console.log(`Tamaño final: ${(finalSize / 1024).toFixed(1)} KB (${finalSize} bytes, ${refactoredCss.split('\n').length} líneas)`);
console.log(`Ahorro logrado: ${(savedBytes / 1024).toFixed(1)} KB (${savedBytes} bytes, reducción del ${percentSaved}%)`);
console.log('[ÉXITO] seasons.css refactorizado y compactado.');
