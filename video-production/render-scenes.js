const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const scenesDir = path.join(__dirname, 'scenes');

const shots = [
  'shot_1a_alert',
  'shot_1b_terminal',
  'shot_2a_book_hero',
  'shot_2b_boxset',
  'shot_3_diagrams',
  'shot_4_workbook_fieldguide',
  'shot_5_exam_simulator',
  'shot_6_offer_pricing',
  'shot_7_cta_outro'
];

async function renderAll() {
  console.log('Launching Edge for Full HD Scene Rendering...');
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--allow-file-access-from-files',
      '--window-size=1920,1080'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  for (const shot of shots) {
    const htmlFile = path.join(scenesDir, `${shot}.html`);
    const pngFile = path.join(scenesDir, `${shot}.png`);
    const fileUrl = 'file:///' + htmlFile.replace(/\\/g, '/');

    console.log(`Rendering ${shot}...`);
    await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    // Small delay to ensure all fonts and SVG/shadows render
    await new Promise(r => setTimeout(r, 1000));

    await page.screenshot({
      path: pngFile,
      type: 'png',
      omitBackground: false
    });
    const stat = fs.statSync(pngFile);
    console.log(`  -> Saved: ${shot}.png (${stat.size} bytes)`);
  }

  await browser.close();
  console.log('All 9 scene plates rendered successfully!');
}

renderAll().catch(err => {
  console.error('Rendering failed:', err);
  process.exit(1);
});
