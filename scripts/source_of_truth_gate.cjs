const fs = require('fs');
const path = require('path');

const root = process.cwd();
const files = ['src/utils/googleSheets.ts', 'src/services/googleSheetsService.ts'];
const failures = [];

for (const relative of files) {
  const filePath = path.join(root, relative);
  if (!fs.existsSync(filePath)) continue;
  const source = fs.readFileSync(filePath, 'utf8');
  if (/localStorage\.(getItem|setItem)\([^)]*(ACCESS_TOKEN|OAUTH_TOKEN|accessToken)/i.test(source) || /parsed\.accessToken/.test(source)) failures.push(`${relative}: OAuth access tokens must never use persistent localStorage.`);
}

const source = fs.readFileSync(path.join(root, 'src/utils/googleSheets.ts'), 'utf8');
const canonicalStudents = ['Student ID', 'Name', 'Email', 'Phone', 'Date of Birth', 'City', 'Current Package', 'Balance (€)', 'Exam Readiness (%)', 'Status', 'Theory Exam Status', 'Drive Folder ID'];
for (const header of canonicalStudents) if (!source.includes(`'${header}'`)) failures.push(`googleSheets.ts: canonical Students header missing: ${header}`);
if (/student123/.test(source)) failures.push('googleSheets.ts: fallback student password must not exist.');
if (/VITE_GOOGLE_(SHEETS_ACCESS_TOKEN|OAUTH_TOKEN)/.test(source)) failures.push('googleSheets.ts: OAuth token environment variables must not be exposed to browser code.');
if (/Full Name|Joined Date|Notifications Enabled|Password/.test(source)) failures.push('googleSheets.ts: legacy/non-canonical Students columns remain in the operational Sheets adapter.');

const serverPath = path.join(root, 'server.ts');
if (fs.existsSync(serverPath)) {
  const server = fs.readFileSync(serverPath, 'utf8');
  if (/SHEETS_WEBHOOK_SECRET\s*\|\|\s*['\"][^'\"]+['\"]/.test(server)) failures.push('server.ts: webhook secret must have no hardcoded fallback.');
  if (/ADMIN_SECRET_KEY\s*\|\|\s*['\"][^'\"]+['\"]/.test(server)) failures.push('server.ts: admin secret must have no hardcoded fallback.');
  if (/metadata:\s*\{\s*resetLink\s*,\s*token/.test(server)) failures.push('server.ts: password-reset links/tokens must not be persisted in email logs.');
  if (/message:\s*['"]Password reset token generated successfully/.test(server)) failures.push('server.ts: password-reset token must not be returned as API response data.');
  if (/sentReal:\s*false/.test(server)) failures.push('server.ts: production email route must not claim simulated delivery as success.');
  if (/hashedPassword\s*\/\/ Return secure hash to updating client/.test(server)) failures.push('server.ts: password hashes must never be returned to the browser.');
}

if (failures.length) {
  console.error('Source-of-truth gate FAILED:');
  failures.forEach(f => console.error(`- ${f}`));
  process.exit(1);
}
console.log('Source-of-truth gate PASSED.');
