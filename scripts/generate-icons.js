 
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '..', 'src', 'assets', 'icons');
fs.mkdirSync(ICONS_DIR, { recursive: true });

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6c63ff"/>
      <stop offset="100%" stop-color="#8b83ff"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="#0d1117"/>
  <circle cx="256" cy="256" r="220" fill="url(#g)"/>
  <text x="256" y="320" font-family="-apple-system,Segoe UI,sans-serif" font-size="200" font-weight="800" fill="#fff" text-anchor="middle">NH</text>
</svg>`;

const sizes = [192, 512];

(async () => {
  for (const size of sizes) {
    const out = path.join(ICONS_DIR, `icon-${size}.png`);
    await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out);
    console.log('Wrote', out);
  }

  // Also regenerate OG image PNG (so it stays fresh on rebuilds)
  const ogPath = path.join(__dirname, '..', 'src', 'assets', 'og-image.png');
  const ogSvgPath = path.join(__dirname, '..', 'src', 'assets', 'og-image.svg');
  if (fs.existsSync(ogSvgPath)) {
    await sharp(ogSvgPath).resize(1200, 630).png().toFile(ogPath);
    console.log('Wrote', ogPath);
  }
})();
