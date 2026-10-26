const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 841 });
  
  // Try local file or http
  const filePath = 'file://' + path.resolve(__dirname, '../sitio/index.html').replace(/\\/g, '/');
  await page.goto(filePath, { waitUntil: 'networkidle0' });
  
  // Scroll down to October superhero cards
  await page.evaluate(() => {
    const card = document.querySelector('[data-card-id="card-octubre-capitana-marvel"]');
    if (card) {
      // scroll so that it matches user screenshot
      const rect = card.getBoundingClientRect();
      window.scrollTo(0, window.scrollY + rect.top - 120);
    }
  });

  await new Promise(r => setTimeout(r, 500));

  const info = await page.evaluate(() => {
    const grid = document.querySelector('#temporadas .grid-haunted');
    const cards = Array.from(document.querySelectorAll('#temporadas .card-ghost'));
    const container = document.querySelector('#temporadas .season-catalog');
    const panel = document.querySelector('#temporadas .season-panel.is-active');
    
    return {
      windowWidth: window.innerWidth,
      gridRect: grid ? grid.getBoundingClientRect() : null,
      gridComputedCols: grid ? getComputedStyle(grid).gridTemplateColumns : null,
      gridGap: grid ? getComputedStyle(grid).gap : null,
      containerRect: container ? container.getBoundingClientRect() : null,
      containerOverflow: container ? getComputedStyle(container).overflow : null,
      containerOverflowX: container ? getComputedStyle(container).overflowX : null,
      firstRowCards: cards.slice(0, 4).map(c => {
        const r = c.getBoundingClientRect();
        const img = c.querySelector('.img-ghost');
        const imgR = img ? img.getBoundingClientRect() : null;
        const h3 = c.querySelector('h3');
        return {
          title: h3 ? h3.textContent : '',
          rect: { top: r.top, left: r.left, width: r.width, height: r.height, right: r.right },
          imgRect: imgR ? { top: imgR.top, height: imgR.height } : null
        };
      })
    };
  });

  console.log('INFO:', JSON.stringify(info, null, 2));

  await page.screenshot({ path: path.resolve(__dirname, '../scripts/crop-repro.png') });
  await browser.close();
})();
