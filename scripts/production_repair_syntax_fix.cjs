const fs = require('node:fs');
const path = require('node:path');

const file = path.join(process.cwd(), 'scripts/production_repair.cjs');
let s = fs.readFileSync(file, 'utf8');

const fixes = [
  [
    'String\\\\(row\\\\[pkgIdx\\\\]\\\\.trim\\\\(\\\\)',
    'String\\\\(row\\\\[pkgIdx\\\\]\\\\)\\\\.trim\\\\(\\\\)'
  ],
  [
    'const studentId = `ST-${String(students.length + 1).padStart(6, \'0\')}`;',
    "const studentId = 'ST-' + String(students.length + 1).padStart(6, '0');"
  ],
  [
    'setRegSuccessMessage(lang === \'ar\' ? `أهلاً بك ${regName}! تم إنشاء حسابك بنجاح.` : lang === \'nl\' ? `Welkom ${regName}! Je account is succesvol aangemaakt.` : `Welcome ${regName}! Your account was created successfully.`);',
    "setRegSuccessMessage(lang === 'ar' ? 'أهلاً بك ' + regName + '! تم إنشاء حسابك بنجاح.' : lang === 'nl' ? 'Welkom ' + regName + '! Je account is succesvol aangemaakt.' : 'Welcome ' + regName + '! Your account was created successfully.');"
  ]
];

for (const [broken, fixed] of fixes) {
  if (s.includes(broken)) s = s.split(broken).join(fixed);
}

// The student-source repair used an overly brittle exact regex. Replace that
// repair call structurally so it works against the current source shape and is idempotent.
const startMarker = "  s = replaceRequired(s,\n    /      let studentId = idIdx";
const endMarker = "    'student source defaults');";
const start = s.indexOf(startMarker);
if (start !== -1) {
  const end = s.indexOf(endMarker, start);
  if (end === -1) throw new Error('Production repair target not found: student source repair end');
  const endExclusive = end + endMarker.length;
  const replacement = `  const studentSourceRepair = /      let studentId = idIdx[\\s\\S]*?      const currentPackage = [^\\n]+;/;
  if (studentSourceRepair.test(s)) {
    s = s.replace(studentSourceRepair, \`      const studentId = idIdx !== -1 && row[idIdx] ? String(row[idIdx]).trim() : '';
      if (!/^ST-\\\\d{6}$/.test(studentId)) continue;

      const name = nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]).trim() : '';
      const email = emailIdx !== -1 && row[emailIdx] ? String(row[emailIdx]).trim() : '';
      const phone = phoneIdx !== -1 && row[phoneIdx] ? String(row[phoneIdx]).trim() : '';
      const dob = dobIdx !== -1 && row[dobIdx] ? String(row[dobIdx]).trim() : '';
      const city = cityIdx !== -1 && row[cityIdx] ? String(row[cityIdx]).trim() : '';
      const currentPackage = pkgIdx !== -1 && row[pkgIdx] ? String(row[pkgIdx]).trim() : '';
      if (!name || !email) continue;\`);
  } else if (!/const studentId = idIdx !== -1 && row\\[idIdx\\]/.test(s)) {
    throw new Error('Production repair target not found: student parser');
  }`;
  s = s.slice(0, start) + replacement + s.slice(endExclusive);
}

fs.writeFileSync(file, s);
