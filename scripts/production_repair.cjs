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

// Repair the malformed PDF data-URL expression using literal string matching.
changed ||= edit('server.ts', s => s
  .replace(".replace(/^data:application\\\\/pdf;base64,/, '')", ".replace(/^data:application\\/pdf;base64,/, '')")
  .replace(".replace(/^data:application\\\\\\/pdf;base64,/, '')", ".replace(/^data:application\\/pdf;base64,/, '')"));

// Never restore browser-persisted OAuth access tokens.
changed ||= edit('src/utils/googleSheets.ts', s =>
  s.replace(/\\bparsed\\.accessToken\\b/g, 'undefined').replace(/student123/g, '')
);

// Keep the operational catalog limited to the three approved packages.
changed ||= edit('src/data.ts', s => s.replace(/Express Course \\(15h\\)/g, 'Starter Core Pack'));

// Calendar is enabled; never emit the legacy disabled sentinel.
changed ||= edit('src/utils/googleSheetsControlCenter.ts', s => s.replace(/CAL-DISABLED/g, ''));

process.exit(changed ? 10 : 0);
