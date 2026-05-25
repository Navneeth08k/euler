const fs = require('fs');
const path = require('path');

const metroPackages = [
  'metro',
  'metro-babel-transformer',
  'metro-cache',
  'metro-cache-key',
  'metro-config',
  'metro-core',
  'metro-file-map',
  'metro-minify-terser',
  'metro-resolver',
  'metro-runtime',
  'metro-source-map',
  'metro-symbolicate',
  'metro-transform-plugins',
  'metro-transform-worker',
];

let patched = 0;
for (const pkg of metroPackages) {
  const pkgPath = path.join(__dirname, '..', 'node_modules', pkg, 'package.json');
  if (!fs.existsSync(pkgPath)) continue;

  const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (!pkgJson.exports) continue;

  let changed = false;
  // Match imports that already carry .js extension (pass through unchanged)
  if (!pkgJson.exports['./src/*.js']) {
    pkgJson.exports['./src/*.js'] = './src/*.js';
    changed = true;
  }
  // Match bare imports (no extension) and resolve to .js
  if (!pkgJson.exports['./src/*']) {
    pkgJson.exports['./src/*'] = './src/*.js';
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 2));
    patched++;
  }
}

console.log(`✓ Patched ${patched} metro package(s) for Node 22 compatibility`);
