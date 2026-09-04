const fs = require('fs');
const file = 'src/App.tsx';
let s = fs.readFileSync(file, 'utf8');
function must(re, replacement, label) { if (!re.test(s)) throw new Error('Missing repair target: ' + label); s = s.replace(re, replacement); }

must(/const INITIAL_STUDENTS: StudentRecord\[\] = \[[\s\S]*?\n  \];/, 'const INITIAL_STUDENTS: StudentRecord[] = [];', 'demo student seed removal');
s = s.replace(/const \[lessons, setLessons\] = useState<Lesson\[\]>\(INITIAL_LESSONS\);/, 'const [lessons, setLessons] = useState<Lesson[]>([]);');
s = s.replace(/const \[transactions, setTransactions\] = useState<WalletTransaction\[\]>\(INITIAL_TRANSACTIONS\);/, 'const [transactions, setTransactions] = useState<WalletTransaction[]>([]);');
s = s.replace(/const \[assessments, setAssessments\] = useState<Assessment\[\]>\(\(\) => \{[\s\S]*?\n  \}\);/, 'const [assessments, setAssessments] = useState<Assessment[]>([]);');
s = s.replace(/password: s\.password \|\| 'student123'/g, "password: s.password || ''");
s = s.replace(/const storedPassword = matchedStudent\.password \|\| 'student123';[\s\S]*?\n      if \(!loginPassword \|\| !isPasswordCorrect\) \{/, "const storedPassword = matchedStudent.password || '';\n      let isPasswordCorrect = false;\n      try {\n        if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$')) {\n          isPasswordCorrect = bcrypt.compareSync(loginPassword, storedPassword);\n        }\n      } catch (err) {\n        console.error('Password verification error:', err);\n      }\n\n      if (!loginPassword || !isPasswordCorrect) {");
fs.writeFileSync(file, s);
console.log('Production seed/auth cleanup applied.');
