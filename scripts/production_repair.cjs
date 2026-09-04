const fs = require('fs');

function edit(path, fn) {
  if (!fs.existsSync(path)) return false;
  const before = fs.readFileSync(path, 'utf8');
  const after = fn(before);
  if (after !== before) {
    fs.writeFileSync(path, after, 'utf8');
    console.log(`updated ${path}`);
    return true;
  }
  return false;
}

let changed = false;

// Repair the malformed PDF data-URL regex introduced during the email hardening pass.
changed ||= edit('server.ts', s => s
  .replace(/\.replace\(\/\^data:application\\\\\/pdf;base64,\/, ''\)/g,
           ".replace(/^data:application\\/pdf;base64,/, '')")
  .replace(/\.replace\(\/\^data:application\\\\\\\/pdf;base64,\/, ''\)/g,
           ".replace(/^data:application\\/pdf;base64,/, '')"));

// Never restore browser-persisted OAuth access tokens. Keep only the in-memory token path.
changed ||= edit('src/utils/googleSheets.ts', s => {
  s = s.replace(/\bparsed\.accessToken\b/g, 'undefined');
  s = s.replace(/\bstudent123\b/g, '');
  return s;
});

// Keep the demo package catalog from drifting from the three canonical operational packages.
changed ||= edit('src/data.ts', s => s
  .replace(/Express Course \(15h\)/g, 'Starter Core Pack')
  .replace(/Optimal Progress Pack \(20h\)/g, 'Optimal Progress Pack')
  .replace(/Complete Guarantee Pack \(40h\)/g, 'Complete Guarantee Pack'));

// Ensure the generated Sheets backend never emits the old disabled-calendar sentinel.
changed ||= edit('src/utils/googleSheetsControlCenter.ts', s => s.replace(/CAL-DISABLED/g, ''));

if (changed) process.exit(10);
console.log('No automatic production repairs required.');
