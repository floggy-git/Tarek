const fs = require('node:fs');
const path = require('node:path');

const file = path.join(process.cwd(), 'scripts/production_repair.cjs');
let s = fs.readFileSync(file, 'utf8');
const broken = 'String\\(row\\[pkgIdx\\]\\.trim\\(\\)';
const fixed = 'String\\(row\\[pkgIdx\\]\\)\\.trim\\(\\)';
if (s.includes(broken)) {
  s = s.replace(broken, fixed);
  fs.writeFileSync(file, s);
}
