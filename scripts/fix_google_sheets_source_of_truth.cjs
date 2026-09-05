const fs = require('node:fs');
const path = require('node:path');

const file = path.join(process.cwd(), 'src/utils/googleSheets.ts');
const source = fs.readFileSync(file, 'utf8');

function replaceExport(sourceText, name, replacement) {
  const pattern = new RegExp(`export\\s+(?:async\\s+)?function\\s+${name}\\s*[\\s\\S]*?(?=\\nexport\\s+(?:async\\s+)?function\\s+|\\nexport\\s+(?:const|let|class|interface|type)\\s+|$)`);
  if (!pattern.test(sourceText)) throw new Error(`Could not locate export function ${name}`);
  return sourceText.replace(pattern, replacement.trimEnd() + '\n');
}

let out = source;
out = replaceExport(out, 'getSheetsConfig', `
export function getSheetsConfig(): GoogleSheetsConfig {
  const env = (import.meta as any).env || {};
  let spreadsheetId = env.VITE_GOOGLE_SPREADSHEET_ID || '';
  let sheetName = env.VITE_GOOGLE_SHEETS_TAB_NAME || 'Packages';
  const accessToken = memoryAccessToken || '';
  let apiKey = env.VITE_GOOGLE_API_KEY || '';
  try {
    const saved = localStorage.getItem(CONFIG_KEY) || localStorage.getItem(LEGACY_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.spreadsheetId) spreadsheetId = parsed.spreadsheetId;
      if (parsed.sheetName) sheetName = parsed.sheetName;
      if (!apiKey) apiKey = parsed.apiKey || '';
    }
  } catch (e) { console.error('Error reading sheets config', e); }
  if (!spreadsheetId) throw new Error('Google Sheets spreadsheet ID is not configured.');
  return { spreadsheetId, sheetName, accessToken, apiKey, autoSync: true };
}
`);

out = replaceExport(out, 'getSampleSpreadsheetStructure', `
export function getSampleSpreadsheetStructure() {
  return [
    { id: 'PKG-000001', name: 'Starter Core Pack', description: 'Basic theory app & standard lessons.', hours: 10, price: 650, discountPrice: '', badge: 'Essential', popular: 'FALSE', recommended: 'FALSE', colorTheme: 'blue', displayOrder: 1, isActive: 'TRUE', features: '' },
    { id: 'PKG-000002', name: 'Optimal Progress Pack', description: 'Structured lessons and practical exam preparation.', hours: 20, price: 1250, discountPrice: '', badge: 'Most Popular', popular: 'TRUE', recommended: 'TRUE', colorTheme: 'indigo', displayOrder: 2, isActive: 'TRUE', features: '' },
    { id: 'PKG-000003', name: 'Complete Guarantee Pack', description: 'Comprehensive driving training and exam preparation.', hours: 40, price: 2400, discountPrice: '', badge: 'Recommended', popular: 'FALSE', recommended: 'TRUE', colorTheme: 'amber', displayOrder: 3, isActive: 'TRUE', features: '' }
  ];
}
`);

out = replaceExport(out, 'parseSheetRowsToStudents', `
export function parseSheetRowsToStudents(rows: any[][]): StudentRecord[] {
  if (!rows || rows.length <= 1) return [];
  const headers = rows[0].map(h => String(h).trim().toLowerCase());
  const requiredHeaders = ['student id', 'name', 'email', 'phone', 'date of birth', 'city', 'current package', 'balance (€)', 'exam readiness (%)', 'status', 'theory exam status', 'drive folder id'];
  const idx = requiredHeaders.map(header => headers.indexOf(header));
  if (idx.some(i => i === -1)) throw new Error('Students sheet schema mismatch. Expected canonical 12-column schema.');
  const parsedStudents: StudentRecord[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const name = String(row[idx[1]] ?? '').trim();
    if (!name) continue;
    const rawId = String(row[idx[0]] ?? '').trim();
    if (!/^ST-\\d{6}$/.test(rawId)) throw new Error('Invalid Student ID at Students row ' + (i + 1) + ': ' + (rawId || '(empty)'));
    const readinessRaw = Number(row[idx[8]] ?? 0);
    parsedStudents.push({ id: rawId, studentId: rawId, name, email: String(row[idx[2]] ?? '').trim(), phone: String(row[idx[3]] ?? '').trim(), dob: String(row[idx[4]] ?? '').trim(), city: String(row[idx[5]] ?? '').trim(), currentPackage: String(row[idx[6]] ?? '').trim(), balance: Number(row[idx[7]] ?? 0) || 0, readiness: Number.isFinite(readinessRaw) ? readinessRaw : 0, status: String(row[idx[9]] ?? '').trim(), theoryExamStatus: String(row[idx[10]] ?? '').trim(), driveFolderId: String(row[idx[11]] ?? '').trim() || undefined });
  }
  return parsedStudents;
}
`);

out = replaceExport(out, 'convertStudentsToSheetRows', `
export function convertStudentsToSheetRows(students: StudentRecord[]): any[][] {
  const headers = ['Student ID', 'Name', 'Email', 'Phone', 'Date of Birth', 'City', 'Current Package', 'Balance (€)', 'Exam Readiness (%)', 'Status', 'Theory Exam Status', 'Drive Folder ID'];
  const rows: any[][] = [headers];
  for (const student of students) {
    const studentId = student.studentId || student.id;
    if (!/^ST-\\d{6}$/.test(studentId)) throw new Error('Invalid Student ID for Sheets write: ' + (studentId || '(empty)'));
    rows.push([sanitizeSpreadsheetCell(studentId), sanitizeSpreadsheetCell(student.name), sanitizeSpreadsheetCell(student.email), sanitizeSpreadsheetCell(student.phone), sanitizeSpreadsheetCell(student.dob), sanitizeSpreadsheetCell(student.city), sanitizeSpreadsheetCell(student.currentPackage), Number(student.balance ?? 0), Number(student.readiness ?? 0), sanitizeSpreadsheetCell(student.status || ''), sanitizeSpreadsheetCell(student.theoryExamStatus || ''), sanitizeSpreadsheetCell(student.driveFolderId || '')]);
  }
  return rows;
}
`);

if (!out.includes("import { safeSetItem } from './safeStorage';")) out = out.replace("import bcrypt from 'bcryptjs';", "import bcrypt from 'bcryptjs';\nimport { safeSetItem } from './safeStorage';");
fs.writeFileSync(file, out);

const serverFile = path.join(process.cwd(), 'server.ts');
let server = fs.readFileSync(serverFile, 'utf8');
server = server.replace(/process\.env\.SHEETS_WEBHOOK_SECRET\s*\|\|\s*'andalos_sec_sheets_webhook_2026_x9k2m1q8'/g, "process.env.SHEETS_WEBHOOK_SECRET || ''");
server = server.replace(/process\.env\.ADMIN_SECRET_KEY\s*\|\|\s*'andalos_admin_sec_2026_root_auth'/g, "process.env.ADMIN_SECRET_KEY || ''");
fs.writeFileSync(serverFile, server);
console.log('Updated Sheets source-of-truth and removed hardcoded server secret fallbacks.');