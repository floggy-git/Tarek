const fs = require('fs');
const file = 'src/App.tsx';
let s = fs.readFileSync(file, 'utf8');

s = s.replace("import bcrypt from 'bcryptjs';", "import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';\nimport { auth as firebaseAuth } from './services/googleAuthService';");
s = s.replace("const handleManualLogin = (e: React.FormEvent) => {", "const handleManualLogin = async (e: React.FormEvent) => {");
s = s.replace("const handleRegisterSubmit = (e: React.FormEvent) => {", "const handleRegisterSubmit = async (e: React.FormEvent) => {");

const marker = "      // Enforce password verification for registered students";
const start = s.indexOf(marker);
if (start === -1) throw new Error('student auth marker not found');
const end = s.indexOf("\n\n      if (!loginPassword || !isPasswordCorrect)", start);
if (end === -1) throw new Error('student auth marker end not found');
s = s.slice(0, start) + `      // Firebase Auth is the only password authority.\n      let isPasswordCorrect = false;\n      try {\n        await signInWithEmailAndPassword(firebaseAuth, cleanEmail, loginPassword);\n        isPasswordCorrect = true;\n      } catch {\n        isPasswordCorrect = false;\n      }` + s.slice(end);

const oldRegister = "const studentId = `ST-${String(students.length + 1).padStart(6, '0')}`;\n    const hashedPassword = bcrypt.hashSync(regPassword.trim(), 10);";
const newRegister = `try {\n      await createUserWithEmailAndPassword(firebaseAuth, regEmail.trim().toLowerCase(), regPassword.trim());\n    } catch (authError) {\n      const code = String(authError?.code || '');\n      const message = code === 'auth/email-already-in-use'\n        ? (lang === 'ar' ? 'هذا البريد مستخدم مسبقاً.' : lang === 'nl' ? 'Dit e-mailadres is al in gebruik.' : 'This email is already in use.')\n        : (lang === 'ar' ? 'تعذر إنشاء الحساب. حاول مرة أخرى.' : lang === 'nl' ? 'Account aanmaken mislukt. Probeer opnieuw.' : 'Could not create the account. Please try again.');\n      alert(message);\n      return;\n    }\n\n    const studentId = \`ST-\${String(students.length + 1).padStart(6, '0')}\`;`;
if (!s.includes(oldRegister)) throw new Error('student registration target not found');
s = s.replace(oldRegister, newRegister);

s = s.replace(/bcrypt\.[A-Za-z]+\([^\n]*\)/g, "''");
s = s.replace(/import bcrypt from 'bcryptjs';\n?/g, '');
s = s.replace(/student123/g, '');

if (s.includes('bcrypt.compareSync') || s.includes('bcrypt.hashSync') || s.includes('loginPassword === storedPassword')) throw new Error('legacy password verification remains');
if (!s.includes('signInWithEmailAndPassword') || !s.includes('createUserWithEmailAndPassword')) throw new Error('Firebase Auth calls missing');
fs.writeFileSync(file, s);
console.log('Student authentication source repaired.');
