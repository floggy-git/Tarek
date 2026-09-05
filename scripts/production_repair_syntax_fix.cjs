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

// Replace the student parser repair with a structural, idempotent transformation.
// The source has changed shape across repair passes, so an exact old block is too brittle.
const studentRepairCall = /  s = replaceRequired\(s,\n    \/      let studentId = idIdx[\\s\\S]*?    'student source defaults'\);/;
const studentRepairReplacement = `  const studentParserBlock = /      let studentId = idIdx[\\s\\S]*?      const currentPackage = [^\\n]+;\\n/;
  if (studentParserBlock.test(s)) {
    s = s.replace(studentParserBlock, \`      const studentId = idIdx !== -1 && row[idIdx] ? String(row[idIdx]).trim() : '';
      if (!/^ST-\\\\d{6}$/.test(studentId)) continue;

      const name = nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]).trim() : '';
      const email = emailIdx !== -1 && row[emailIdx] ? String(row[emailIdx]).trim() : '';
      const phone = phoneIdx !== -1 && row[phoneIdx] ? String(row[phoneIdx]).trim() : '';
      const dob = dobIdx !== -1 && row[dobIdx] ? String(row[dobIdx]).trim() : '';
      const city = cityIdx !== -1 && row[cityIdx] ? String(row[cityIdx]).trim() : '';
      const currentPackage = pkgIdx !== -1 && row[pkgIdx] ? String(row[pkgIdx]).trim() : '';
      if (!name || !email) continue;\`);
  } else if (!/if \(!\\/\\^ST-\\\\d\\{6\\}\\$\\/.test\(studentId\)\) continue;/.test(s)) {
    throw new Error('Production repair target not found: student parser');
  }`;

if (studentRepairCall.test(s)) {
  s = s.replace(studentRepairCall, studentRepairReplacement);
}

fs.writeFileSync(file, s);