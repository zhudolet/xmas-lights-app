// Builds www/ (what goes inside the Android/iOS app) from the game source.
// The game files are only READ, never changed. All store-only changes are applied to the copy:
//   1. Google Fonts links -> bundled local fonts (game works offline, no external requests)
//   2. Test mode forced off and its button hidden
//   3. A tiny hook (window.__xlApp) so the app bridge can grant Hot Cocoa after a rewarded ad
//   4. app/app-bridge.js + app/app.css added (ads, consent, Android back button, pause/resume)
//
// Usage: node scripts/build-web.mjs [path-to-game-folder]
// Default game folder: ./game (copied from /mnt/project-files/nanas-lights/xmas-lights-city/: index.html, levels/, studio-kit/, city/{city-map.js,city.css,three.min.js})
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.resolve(process.argv[2] || path.join(root, 'game'));
const out = path.join(root, 'www');

const must = (cond, msg) => { if (!cond) { console.error('build-web: ' + msg); process.exit(1); } };
must(fs.existsSync(path.join(src, 'index.html')), `no index.html in ${src}`);

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

// copy the game folders the page loads
for (const dir of ['studio-kit', 'levels', 'city']) {
  fs.cpSync(path.join(src, dir), path.join(out, dir), { recursive: true });
}
// copy app bridge files; real AdMob ad unit ids can come from env (CI) instead of editing the file
fs.cpSync(path.join(root, 'app'), path.join(out, 'app'), { recursive: true });
{
  const bp = path.join(out, 'app', 'app-bridge.js');
  let b = fs.readFileSync(bp, 'utf8');
  const env = process.env;
  const set = (key, val) => { b = b.replace(new RegExp(`(${key}: )[^,\\n]+`), `$1${val}`); };
  if (env.XL_REWARDED_ANDROID) set('rewardedAndroid', JSON.stringify(env.XL_REWARDED_ANDROID));
  if (env.XL_REWARDED_IOS) set('rewardedIOS', JSON.stringify(env.XL_REWARDED_IOS));
  if (env.XL_ADS_TESTING) set('testing', env.XL_ADS_TESTING === 'false' ? 'false' : 'true');
  fs.writeFileSync(bp, b);
  const testing = /testing: true/.test(b);
  console.log(`build-web: ads ${testing ? 'in TEST mode (Google test ads)' : 'LIVE'}`);
}

// fonts
const fontsDir = path.join(out, 'fonts');
fs.mkdirSync(fontsDir, { recursive: true });
const nm = path.join(root, 'node_modules');
const faces = [];
const addFace = (family, file, weight, range, extra = '') => {
  fs.copyFileSync(file, path.join(fontsDir, path.basename(file)));
  faces.push(`@font-face{font-family:'${family}';font-style:normal;font-display:swap;font-weight:${weight};${extra}src:url(${path.basename(file)}) format('woff2');unicode-range:${range}}`);
};
const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const LATIN_EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';
for (const w of [500, 600, 700]) {
  addFace('Fredoka', `${nm}/@fontsource/fredoka/files/fredoka-latin-${w}-normal.woff2`, w, LATIN);
  addFace('Fredoka', `${nm}/@fontsource/fredoka/files/fredoka-latin-ext-${w}-normal.woff2`, w, LATIN_EXT);
}
for (const w of [500, 700, 800, 900]) {
  const f = `${nm}/@fontsource/nunito/files/nunito-latin-${w}-normal.woff2`;
  if (fs.existsSync(f)) addFace('Nunito', f, w, LATIN);
}
addFace('Fraunces', `${nm}/@fontsource-variable/fraunces/files/fraunces-latin-opsz-normal.woff2`, '100 900', LATIN);
fs.writeFileSync(path.join(fontsDir, 'fonts.css'), faces.join('\n') + '\n');

// index.html with store patches
let html = fs.readFileSync(path.join(src, 'index.html'), 'utf8');
const patch = (name, re, rep) => {
  const before = html;
  html = html.replace(re, rep);
  must(html !== before, `patch "${name}" did not apply - the game source changed, update scripts/build-web.mjs`);
};
patch('fonts', /<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*/, '');
patch('fonts-fredoka', /<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2\?family=Fredoka[^"]*">/, '<link rel="stylesheet" href="fonts/fonts.css">');
patch('fonts-fraunces', /<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2\?family=Fraunces[^"]*">\s*/, '');
patch('test-off', /let TEST=\/\[\?#&\]test\\b\/\.test\(location\.href\)\|\|store\.get\('test',false\);/, "let TEST=false;");
patch('app-hook', /window\.__nl=\{/, "window.__xlApp={getCocoa:()=>cocoa,addCocoa:n=>{cocoa+=n;store.set('cocoa',cocoa)},useCocoa:()=>jUseCocoa()};\nwindow.__nl={");
html += '\n<link rel="stylesheet" href="app/app.css">\n<script src="app/app-bridge.js"></script>\n'; // game file has no </body>; append at the end
must(!/googleapis|gstatic/.test(html), 'an external font reference is still in index.html');
fs.writeFileSync(path.join(out, 'index.html'), html);

const kb = (p) => Math.round(fs.statSync(p).size / 1024);
console.log(`build-web: www/ ready from ${src} (index.html ${kb(path.join(out, 'index.html'))} KB, ${faces.length} font faces)`);
