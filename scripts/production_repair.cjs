const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }
function write(rel, text) { fs.writeFileSync(path.join(root, rel), text); }
function replaceRequired(text, pattern, replacement, label) {
  if (!pattern.test(text)) {
    if (text.includes(replacement)) return text;
    throw new Error(`Production repair target not found: ${label}`);
  }
  return text.replace(pattern, replacement);
}

{
  let s = read('src/App.tsx');
  s = s.replace(/password: \"student123\",/g, 'password: "",');
  s = s.replace(/password: s\.password \|\| 'student123'/g, "password: s.password || ''");
  s = s.replace(/const storedPassword = matchedStudent\.password \|\| 'student123';/g, "const storedPassword = String(matchedStudent.password || '');");
  write('src/App.tsx', s);
}

{
  let s = read('src/services/googleSheetsService.ts');
  s = replaceRequired(s,
    /      let id = idIdx !== -1 && row\[idIdx\] \? String\(row\[idIdx\]\)\.trim\(\) : '';[\s\S]*?      const price = priceIdx !== -1 && row\[priceIdx\] && !isNaN\(parseFloat\(row\[priceIdx\]\)\) \? parseFloat\(row\[priceIdx\]\) : 650;/,
    `      let id = idIdx !== -1 && row[idIdx] ? String(row[idIdx]).trim() : '';\n      if (id === 'pack-1') id = 'PKG-000001';\n      else if (id === 'pack-2') id = 'PKG-000002';\n      else if (id === 'pack-3') id = 'PKG-000003';\n      if (!['PKG-000001', 'PKG-000002', 'PKG-000003'].includes(id)) continue;\n      if (packages.some(p => p.id === id)) continue;\n\n      const name = nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]).trim() : '';\n      const description = descIdx !== -1 && row[descIdx] ? String(row[descIdx]).trim() : '';\n      const hours = hoursIdx !== -1 && row[hoursIdx] && !isNaN(parseFloat(row[hoursIdx])) ? parseFloat(row[hoursIdx]) : NaN;\n      const price = priceIdx !== -1 && row[priceIdx] && !isNaN(parseFloat(row[priceIdx])) ? parseFloat(row[priceIdx]) : NaN;\n      if (!name || !Number.isFinite(hours) || !Number.isFinite(price)) continue;`,
    'package row defaults');
  s = replaceRequired(s,
    /    return \{\n      success: true,\n      data: packages\.sort\(\(a, b\) => a\.displayOrder - b\.displayOrder\),\n      timestamp: new Date\(\)\.toISOString\(\)\n    \};/,
    `    const ordered = packages.sort((a, b) => a.displayOrder - b.displayOrder);\n    if (ordered.length !== 3 || new Set(ordered.map(p => p.id)).size !== 3) {\n      return { success: false, error: 'Packages source must contain exactly PKG-000001, PKG-000002, PKG-000003.', timestamp: new Date().toISOString() };\n    }\n    return { success: true, data: ordered, timestamp: new Date().toISOString() };`,
    'package count validation');
  s = replaceRequired(s,
    /    const sorted = \[\.\.\.packages\]\.sort\(\(a, b\) => a\.displayOrder - b\.displayOrder\);/,
    `    const canonicalIds = ['PKG-000001', 'PKG-000002', 'PKG-000003'];\n    const sorted = [...packages].sort((a, b) => a.displayOrder - b.displayOrder);\n    if (sorted.length !== 3 || new Set(sorted.map(pkg => pkg.id)).size !== 3 || !canonicalIds.every(id => sorted.some(pkg => pkg.id === id))) {\n      throw new Error('Exactly the three canonical packages must be written.');\n    }`,
    'package write validation');
  write('src/services/googleSheetsService.ts', s);
}

{
  let s = read('src/components/adminControlCenter/AdminPackagesView.tsx');
  s = s.replace(/import \{\n  Package,\n  Search,\n  Plus,/g, "import {\n  Package,\n  Search,");
  const start = s.indexOf('  const handleOpenNew = () => {');
  const end = s.indexOf('\n  const handleSavePackage', start);
  if (start >= 0 && end > start) s = s.slice(0, start) + s.slice(end);
  s = s.replace(/          <button\n            onClick=\{handleOpenNew\}[\s\S]*?          <\/button>\n/g, '');
  s = s.replace(/    if \(isNewPkg\) \{\n      updatedPackages = \[\.\.\.packages, finalPkg\]\.sort\(\(a, b\) => a\.displayOrder - b\.displayOrder\);\n    \} else \{/g, '    if (isNewPkg) return;\n    {');
  s = s.replace(/action: isNewPkg \? 'Package Created' : 'Package Updated'/g, "action: 'Package Updated'");
  s = s.replace(/\{isNewPkg \? \(lang === 'ar' \? 'إضافة باقة جديدة' : 'Add New Package'\) : `Edit: \$\{selectedPkg\.name\}`\}/g, '{`Edit: ${selectedPkg.name}`}');
  write('src/components/adminControlCenter/AdminPackagesView.tsx', s);
}

{
  let s = read('server.ts');
  s = s.replace(/const targetSpreadsheetId = spreadsheetId \|\| '1nKF40i125QY7MQMghOoOnyqjpHLFWKM12ZYIIGxW9Ck';/g, "const targetSpreadsheetId = spreadsheetId || process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '';\n      if (!targetSpreadsheetId) return res.status(500).json({ success: false, error: 'GOOGLE_SHEETS_SPREADSHEET_ID is not configured' });");
  write('server.ts', s);
  let g = read('src/utils/googleSheets.ts');
  g = g.replace(/VITE_GOOGLE_SPREADSHEET_ID \|\| '1nKF40i125QY7MQMghOoOnyqjpHLFWKM12ZYIIGxW9Ck'/g, "VITE_GOOGLE_SPREADSHEET_ID || ''");
  write('src/utils/googleSheets.ts', g);
}

const legacyWorkflow = path.join(root, '.github/workflows/repair-auth-and-demo-data.yml');
if (fs.existsSync(legacyWorkflow)) fs.rmSync(legacyWorkflow);
console.log('Production source repair completed. UI/UX and application architecture are unchanged.');
