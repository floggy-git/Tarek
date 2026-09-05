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

fs.writeFileSync(file, s);
