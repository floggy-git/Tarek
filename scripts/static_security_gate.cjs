const fs = require('fs');
const path = require('path');

const root = process.cwd();
const files = [
  'server.ts',
  'src/services/googleCalendarService.ts',
  'src/utils/googleSheets.ts',
  'src/services/googleSheetsService.ts'
];

const forbiddenPatterns = [
  { pattern: /SHEETS_WEBHOOK_SECRET\s*\|\|\s*['"]/g, message: 'Webhook secret must not have a hardcoded fallback.' },
  { pattern: /ADMIN_SECRET_KEY\s*\|\|\s*['"]/g, message: 'Admin secret must not have a hardcoded fallback.' },
  { pattern: /CalendarApp\./g, message: 'Legacy Apps Script CalendarApp must not be used by the web application runtime.' }
];

const failures = [];
for (const relative of files) {
  const filePath = path.join(root, relative);
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rule of forbiddenPatterns) {
    if (rule.pattern.test(content)) failures.push(`${relative}: ${rule.message}`);
    rule.pattern.lastIndex = 0;
  }
}

const expectedPackages = [
  ['PKG-000001', 'Starter Core Pack', 10, 650],
  ['PKG-000002', 'Optimal Progress Pack', 20, 1250],
  ['PKG-000003', 'Complete Guarantee Pack', 40, 2400]
];

const source = fs.readFileSync(path.join(root, 'server.ts'), 'utf8');
for (const [id, name, hours, price] of expectedPackages) {
  if (!source.includes(`'${id}', '${name}'`) || !source.includes(`'${hours}', '${price}'`)) {
    failures.push(`server.ts: canonical package ${id} is not present with the locked name/hours/price.`);
  }
}

if (failures.length) {
  console.error('Static security/data gate FAILED:');
  failures.forEach(f => console.error(`- ${f}`));
  process.exit(1);
}

console.log('Static security/data gate PASSED.');
