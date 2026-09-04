const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/utils/googleSheets.ts');
let s = fs.readFileSync(file, 'utf8');

function replaceRequired(re, replacement, label) {
  if (!re.test(s)) throw new Error(`Repair target not found: ${label}`);
  s = s.replace(re, replacement);
}

replaceRequired(
  /export function parseSheetRowsToLessons\(rows: any\[\]\[\]\): Lesson\[\] \{[\s\S]*?\n\}\n\n\/\*\*\n \* Converts Lesson array into sheet rows format\./,
`export function parseSheetRowsToLessons(rows: any[][]): Lesson[] {
  if (!rows || rows.length <= 1) return [];
  const headers = rows[0].map(h => String(h ?? '').trim().toLowerCase());
  const idx = (name: string) => headers.indexOf(name.toLowerCase());
  const required = ['lesson id','student id','student name','trainer name','date','time','duration (h)','price (€)','pickup location','status','calendar event id','instructor notes','rating'];
  const positions = required.map(idx);
  if (positions.some(i => i === -1)) throw new Error('Lessons sheet schema mismatch. Expected canonical 13-column schema.');
  const parsed: Lesson[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const id = String(row[positions[0]] ?? '').trim();
    const studentId = String(row[positions[1]] ?? '').trim();
    const studentName = String(row[positions[2]] ?? '').trim();
    if (!id || !studentId || !studentName) continue;
    const status = String(row[positions[9]] ?? '').trim().toLowerCase();
    parsed.push({
      id,
      studentId,
      studentName,
      trainerName: String(row[positions[3]] ?? '').trim(),
      date: String(row[positions[4]] ?? '').trim(),
      time: String(row[positions[5]] ?? '').trim(),
      duration: Number(row[positions[6]] ?? 1) || 1,
      price: Number(row[positions[7]] ?? 0) || 0,
      pickupLocation: String(row[positions[8]] ?? '').trim(),
      status: status || 'upcoming',
      calendarEventId: String(row[positions[10]] ?? '').trim() || undefined,
      instructorNotes: String(row[positions[11]] ?? '').trim() || undefined,
      performanceRating: row[positions[12]] !== undefined && row[positions[12]] !== '' ? Number(row[positions[12]]) : undefined
    } as Lesson);
  }
  return parsed;
}

/**
 * Converts Lesson array into sheet rows format.
`,
  'canonical Lessons parser'
);

replaceRequired(
  /export function convertLessonsToSheetRows\(lessons: Lesson\[\]\): any\[\]\[\] \{[\s\S]*?\n\}\n\n\/\*\*\n \* Loads lesson records from the 'Lessons' sheet tab\./,
`export function convertLessonsToSheetRows(lessons: Lesson[]): any[][] {
  const headers = ['Lesson ID','Student ID','Student Name','Trainer Name','Date','Time','Duration (h)','Price (€)','Pickup Location','Status','Calendar Event ID','Instructor Notes','Rating'];
  const rows: any[][] = [headers];
  for (const l of lessons) {
    if (isDemoLesson(l)) continue;
    if (!/^ST-\\d{6}$/.test(String(l.studentId || ''))) continue;
    rows.push([
      sanitizeSpreadsheetCell(l.id),
      sanitizeSpreadsheetCell(l.studentId),
      sanitizeSpreadsheetCell(l.studentName || ''),
      sanitizeSpreadsheetCell(l.trainerName || ''),
      sanitizeSpreadsheetCell(l.date || ''),
      sanitizeSpreadsheetCell(l.time || ''),
      Number(l.duration || 1),
      Number(l.price || 0),
      sanitizeSpreadsheetCell(l.pickupLocation || ''),
      sanitizeSpreadsheetCell(l.status || 'upcoming'),
      sanitizeSpreadsheetCell((l as any).calendarEventId || ''),
      sanitizeSpreadsheetCell(l.instructorNotes || (l as any).trainerNotes || ''),
      l.performanceRating !== undefined && l.performanceRating !== null ? Number(l.performanceRating) : ''
    ]);
  }
  return rows;
}

/**
 * Loads lesson records from the 'Lessons' sheet tab.
`,
  'canonical Lessons writer'
);

s = s.replace(/const range = `Lessons!A1:Q500`;/g, "const range = `Lessons!A1:M500`;");

replaceRequired(
  /export async function ensureAuditLogsSheetExists\(config: GoogleSheetsConfig\): Promise<void> \{[\s\S]*?\n\}\n\n\/\*\*\n \* Appends an AuditLogEntry/,
`export async function ensureAuditLogsSheetExists(config: GoogleSheetsConfig): Promise<void> {
  const { spreadsheetId, accessToken } = config;
  if (!spreadsheetId || !accessToken) return;
  const meta = await (await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
    { headers: { Authorization: \\`Bearer ${accessToken}\\` } }
  )).json();
  const exists = (meta.sheets || []).some((sheet: any) => sheet?.properties?.title === 'AuditLogs');
  if (!exists) {
    const createRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: { Authorization: \\`Bearer ${accessToken}\\`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ addSheet: { properties: { title: 'AuditLogs' } } }] })
    });
    if (!createRes.ok) throw new Error('Failed to create AuditLogs sheet tab.');
  }
  const headers = [['Audit ID','User ID','User Name','Role','Action','Date','Time']];
  const writeRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent('AuditLogs!A1:G1')}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: { Authorization: \\`Bearer ${accessToken}\\`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: headers })
  });
  if (!writeRes.ok) throw new Error('Failed to write canonical AuditLogs headers.');
}

/**
 * Appends an AuditLogEntry`,
  'canonical AuditLogs'
);

replaceRequired(
  /const rowValue = \[[\s\S]*?\n  \];\n\n  const response = await fetch\(url, \{/,
`const rowValue = [
    entry.auditId,
    entry.userId,
    entry.userName,
    entry.userRole,
    entry.action,
    entry.date,
    entry.time
  ];

  const response = await fetch(url, {`,
  'canonical AuditLogs row'
);

s = s.replace(/const range = `AuditLogs!A1`;/g, "const range = `AuditLogs!A1:G1`;");
s = s.replace(/range: "AuditLogs!A1",\n      majorDimension: "ROWS",/g, 'range: "AuditLogs!A1:G1",\n      majorDimension: "ROWS",');

replaceRequired(
  /if \(changes\.name !== undefined\) currentRow\[1\] = changes\.name;[\s\S]*?if \(changes\.aiSuspensionTier !== undefined\) currentRow\[16\] = changes\.aiSuspensionTier \|\| 0;/,
`if (changes.name !== undefined) currentRow[1] = changes.name;
    if (changes.email !== undefined) currentRow[2] = changes.email;
    if (changes.phone !== undefined) currentRow[3] = changes.phone;
    if (changes.dob !== undefined) currentRow[4] = changes.dob;
    if (changes.city !== undefined) currentRow[5] = changes.city;
    if (changes.currentPackage !== undefined) currentRow[6] = changes.currentPackage;
    if (changes.balance !== undefined) currentRow[7] = changes.balance;
    if (changes.readiness !== undefined) currentRow[8] = changes.readiness;
    if (changes.status !== undefined) currentRow[9] = changes.status;
    if (changes.theoryExamStatus !== undefined) currentRow[10] = changes.theoryExamStatus;
    if (changes.driveFolderId !== undefined) currentRow[11] = changes.driveFolderId || '';`,
  'canonical Students row mapping'
);
s = s.replace(/Students!A\${targetRowIndex}:Q\${targetRowIndex}/g, 'Students!A${targetRowIndex}:L${targetRowIndex}');

// SchoolSettings is one canonical header row + one values row, not a key/value table.
replaceRequired(
  /export async function patchSettingInGoogleSheet\([\s\S]*?\n\}\n\n\/\*\*\n \* Official Google Apps Script/,
`export async function patchSettingInGoogleSheet(
  key: string,
  value: any,
  config: GoogleSheetsConfig
): Promise<boolean> {
  const { spreadsheetId, accessToken } = config;
  if (!spreadsheetId || !accessToken || !key) return false;
  try {
    const readRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/SchoolSettings!A1:AR2`, {
      headers: { Authorization: \\`Bearer ${accessToken}\\` }
    });
    if (!readRes.ok) return false;
    const data = await readRes.json();
    const rows = data.values || [];
    if (rows.length < 2) return false;
    const headers = rows[0].map((h: any) => String(h ?? '').trim());
    const index = headers.findIndex((h: string) => h.toLowerCase() === key.toLowerCase());
    if (index < 0) return false;
    const col = String.fromCharCode(65 + index);
    const valStr = typeof value === 'boolean' ? (value ? 'TRUE' : 'FALSE') : String(value ?? '');
    const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/SchoolSettings!${col}2?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: { Authorization: \\`Bearer ${accessToken}\\`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [[valStr]] })
    });
    return updateRes.ok;
  } catch (err) {
    console.error(\`[GoogleSheets] Error patching SchoolSettings field ${key}:\`, err);
    return false;
  }
}

/**
 * Official Google Apps Script`,
  'canonical SchoolSettings patch'
);

fs.writeFileSync(file, s);
console.log('Canonical Sheets repairs applied.');
