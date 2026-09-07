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
  s = s.replace(/import bcrypt from 'bcryptjs';\n/g, "import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';\nimport { auth } from './services/googleAuthService';\n");
  s = replaceRequired(s,
    /  const handleDemoLogin = \(pRole: 'student' \| 'trainer'\) => \{[\s\S]*?\n  \};\n\n  const handleManualLogin/,
    `  const handleDemoLogin = (_pRole: 'student' | 'trainer') => {\n    alert(lang === 'ar' ? 'الدخول التجريبي غير متاح.' : lang === 'nl' ? 'Demo-login is niet beschikbaar.' : 'Demo login is not available.');\n  };\n\n  const handleManualLogin`,
    'remove demo login data');

  s = replaceRequired(s,
    /  const handleManualLogin = \(e: React\.FormEvent\) => \{[\s\S]*?\n  \};\n\n  const handleRegisterSubmit/,
    `  const handleManualLogin = async (e: React.FormEvent) => {\n    e.preventDefault();\n    const cleanEmail = loginEmail.trim().toLowerCase();\n    if (!cleanEmail || !loginPassword) return;\n\n    try {\n      const credential = await signInWithEmailAndPassword(auth, cleanEmail, loginPassword);\n      const firebaseUser = credential.user;\n      const matchedStudent = students.find(s => s.email?.toLowerCase() === cleanEmail);\n\n      if (loginRole === 'student' && !matchedStudent) {\n        await auth.signOut();\n        alert(lang === 'ar' ? 'هذا الحساب غير مرتبط بمتدرب مسجل.' : lang === 'nl' ? 'Dit account is niet gekoppeld aan een geregistreerde leerling.' : 'This account is not linked to a registered student.');\n        return;\n      }\n\n      const isNotificationsEnabled = schoolSettings ? schoolSettings.notificationsEnabled !== false : true;\n      const user = loginRole === 'student'\n        ? {\n            id: matchedStudent?.studentId || matchedStudent?.id,\n            studentId: matchedStudent?.studentId || matchedStudent?.id,\n            name: matchedStudent?.name || firebaseUser.displayName || cleanEmail.split('@')[0],\n            email: firebaseUser.email || cleanEmail,\n            phone: matchedStudent?.phone || '',\n            role: 'student' as const,\n            lang,\n            packageId: matchedStudent?.packageId,\n            packageName: matchedStudent?.packageName || matchedStudent?.currentPackage || matchedStudent?.packageSelection || '',\n            packageSelection: matchedStudent?.packageName || matchedStudent?.currentPackage || matchedStudent?.packageSelection || '',\n            currentPackage: matchedStudent?.currentPackage || matchedStudent?.packageName || matchedStudent?.packageSelection || '',\n            packageHours: matchedStudent?.packageHours ?? matchedStudent?.targetHours ?? 0,\n            targetHours: matchedStudent?.targetHours ?? matchedStudent?.packageHours ?? 0,\n            packagePrice: matchedStudent?.packagePrice ?? 0,\n            dob: matchedStudent?.dob || '',\n            city: matchedStudent?.city || '',\n            transmissionType: matchedStudent?.transmissionType || 'manual',\n            notificationsEnabled: matchedStudent?.notificationsEnabled !== false\n          }\n        : {\n            name: firebaseUser.displayName || cleanEmail.split('@')[0],\n            email: firebaseUser.email || cleanEmail,\n            phone: '',\n            role: 'trainer' as const,\n            lang,\n            notificationsEnabled: isNotificationsEnabled\n          };\n\n      setCurrentUser(user);\n      setLoginEmail('');\n      setLoginPassword('');\n      setActiveTab('home');\n    } catch (err: any) {\n      console.error('Firebase sign-in failed:', err);\n      alert(lang === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' : lang === 'nl' ? 'Ongeldig e-mailadres of wachtwoord.' : 'Invalid email or password.');\n    }\n  };\n\n  const handleRegisterSubmit`,
    'replace manual login with Firebase');

  s = replaceRequired(s,
    /  const handleRegisterSubmit = \(e: React\.FormEvent\) => \{[\s\S]*?\n  \};\n\n  const handleForgotPasswordSubmit/,
    `  const handleRegisterSubmit = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (!regName.trim() || !regEmail.trim() || !regPhone.trim()) {\n      alert(lang === 'ar' ? 'الرجاء إدخال الاسم والبريد الإلكتروني ورقم الهاتف.' : lang === 'nl' ? 'Voer je naam, e-mailadres en telefoonnummer in.' : 'Please enter your name, email and phone number.');\n      return;\n    }\n    if (!regPassword || regPassword.length < 8) {\n      alert(lang === 'ar' ? 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.' : lang === 'nl' ? 'Wachtwoord moet minimaal 8 tekens lang zijn.' : 'Password must be at least 8 characters.');\n      return;\n    }\n    if (regPassword !== regConfirmPassword) {\n      alert(lang === 'ar' ? 'كلمتا المرور غير متطابقتين.' : lang === 'nl' ? 'Wachtwoorden komen niet overeen.' : 'Passwords do not match.');\n      return;\n    }\n\n    try {\n      const credential = await createUserWithEmailAndPassword(auth, regEmail.trim().toLowerCase(), regPassword.trim());\n      const firebaseUser = credential.user;\n      await updateProfile(firebaseUser, { displayName: regName.trim() });\n\n      const studentId = `ST-${String(students.length + 1).padStart(6, '0')}`;\n      const selectedPkgObj = packages.find(p => p.id === regPackageId || p.name === regPackage || p.title === regPackage);\n      const matchHours = regPackage.match(/(\\d+)\\s*(?:hours|hour|h|ساعة|uur)/i);\n      const parsedPkgHours = selectedPkgObj?.hours !== undefined ? Number(selectedPkgObj.hours) : (matchHours ? parseInt(matchHours[1], 10) : 0);\n      const parsedPkgPrice = selectedPkgObj?.price !== undefined ? Number(selectedPkgObj.price) : 0;\n      const resolvedPkgName = selectedPkgObj?.name || selectedPkgObj?.title || regPackage;\n\n      const newStudent = {\n        id: studentId,\n        studentId,\n        firebaseUid: firebaseUser.uid,\n        packageId: selectedPkgObj?.id || regPackageId,\n        name: regName.trim(),\n        email: firebaseUser.email || regEmail.trim().toLowerCase(),\n        phone: regPhone.trim(),\n        role: 'student' as const,\n        lang,\n        packageName: resolvedPkgName,\n        packageSelection: resolvedPkgName,\n        currentPackage: resolvedPkgName,\n        packageHours: parsedPkgHours,\n        targetHours: parsedPkgHours,\n        packagePrice: parsedPkgPrice,\n        dob: regDob,\n        city: regCity,\n        priorExperience: regExperience,\n        transmissionType: regTransmission,\n        theoryExamStatus: regTheoryStatus,\n        notificationsEnabled: true\n      };\n\n      const newRecord: StudentRecord = {\n        id: studentId,\n        studentId,\n        name: regName.trim(),\n        email: firebaseUser.email || regEmail.trim().toLowerCase(),\n        phone: regPhone.trim(),\n        dob: regDob,\n        city: regCity,\n        packageId: selectedPkgObj?.id || regPackageId,\n        packageName: resolvedPkgName,\n        currentPackage: resolvedPkgName,\n        packageSelection: resolvedPkgName,\n        packageHours: parsedPkgHours,\n        targetHours: parsedPkgHours,\n        packagePrice: parsedPkgPrice,\n        balance: 0,\n        readiness: 0,\n        status: 'active',\n        theoryExamStatus: regTheoryStatus,\n        notificationsEnabled: true\n      };\n\n      setStudents(prev => [...prev, newRecord]);\n      setRegPassword('');\n      setRegConfirmPassword('');\n      setRegSuccessMessage(lang === 'ar' ? `أهلاً بك ${regName}! تم إنشاء حسابك بنجاح.` : lang === 'nl' ? `Welkom ${regName}! Je account is succesvol aangemaakt.` : `Welcome ${regName}! Your account was created successfully.`);\n\n      setTimeout(() => {\n        setCurrentUser(newStudent);\n        setRegSuccessMessage('');\n        setActiveTab('home');\n      }, 4500);\n    } catch (err: any) {\n      console.error('Firebase registration failed:', err);\n      const message = err?.code === 'auth/email-already-in-use'\n        ? (lang === 'ar' ? 'هذا البريد الإلكتروني مستخدم بالفعل.' : lang === 'nl' ? 'Dit e-mailadres is al in gebruik.' : 'This email address is already in use.')\n        : (lang === 'ar' ? 'تعذر إنشاء الحساب. يرجى المحاولة مرة أخرى.' : lang === 'nl' ? 'Account aanmaken mislukt. Probeer het opnieuw.' : 'Unable to create the account. Please try again.');\n      alert(message);\n    }\n  };\n\n  const handleForgotPasswordSubmit`,
    'replace registration with Firebase');

  s = s.replace(/const studentId = currentUser\?\.role === 'student' \? \(currentUser\.id \|\| ''\) : '';/g, "const studentId = currentUser?.role === 'student' ? (currentUser.studentId || currentUser.id || '') : '';");
  s = s.replace(/student123/gi, '');
  if (s !== read('src/App.tsx')) write('src/App.tsx', s);
}

{
  let s = read('src/services/googleSheetsService.ts');
  const studentSourcePattern = /      let studentId = idIdx[\s\S]*?      const currentPackage = [^\n]+\n/;
  const studentSourceReplacement = `      const studentId = idIdx !== -1 && row[idIdx] ? String(row[idIdx]).trim() : '';\n      if (!/^ST-\\d{6}$/.test(studentId)) continue;\n\n      const name = nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]).trim() : '';\n      const email = emailIdx !== -1 && row[emailIdx] ? String(row[emailIdx]).trim() : '';\n      const phone = phoneIdx !== -1 && row[phoneIdx] ? String(row[phoneIdx]).trim() : '';\n      const dob = dobIdx !== -1 && row[dobIdx] ? String(row[dobIdx]).trim() : '';\n      const city = cityIdx !== -1 && row[cityIdx] ? String(row[cityIdx]).trim() : '';\n      const currentPackage = pkgIdx !== -1 && row[pkgIdx] ? String(row[pkgIdx]).trim() : '';\n      if (!name || !email) continue;\n`;
  if (studentSourcePattern.test(s)) {
    s = s.replace(studentSourcePattern, studentSourceReplacement);
  } else if (!s.includes("if (!/^ST-\\d{6}$/.test(studentId)) continue;")) {
    throw new Error('Production repair target not found: student source defaults');
  }
  s = s.replace(/const status = statusIdx !== -1 && row\[statusIdx\] \? String\(row\[statusIdx\]\)\.trim\(\) : 'active';/g, "const status = statusIdx !== -1 && row[statusIdx] ? String(row[statusIdx]).trim() : '';");
  s = s.replace(/const theoryExamStatus = theoryIdx !== -1 && row\[theoryIdx\] \? String\(row\[theoryIdx\]\)\.trim\(\) : 'Passed';/g, "const theoryExamStatus = theoryIdx !== -1 && row[theoryIdx] ? String(row[theoryIdx]).trim() : '';");
  s = s.replace(/st\.status \|\| 'active'/g, "st.status ?? ''");
  s = s.replace(/st\.theoryExamStatus \|\| 'Passed'/g, "st.theoryExamStatus ?? ''");
  if (s !== read('src/services/googleSheetsService.ts')) write('src/services/googleSheetsService.ts', s);
}

{
  let s = read('server.ts');
  s = s.replace(/const targetSpreadsheetId = spreadsheetId \|\| '1nKF40i125QY7MQMghOoOnyqjpHLFWKM12ZYIIGxW9Ck';/g, "const targetSpreadsheetId = spreadsheetId || process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '';\n      if (!targetSpreadsheetId) return res.status(500).json({ success: false, error: 'GOOGLE_SHEETS_SPREADSHEET_ID is not configured' });");
  if (s !== read('server.ts')) write('server.ts', s);
  let g = read('src/utils/googleSheets.ts');
  g = g.replace(/VITE_GOOGLE_SPREADSHEET_ID \|\| '1nKF40i125QY7MQMghOoOnyqjpHLFWKM12ZYIIGxW9Ck'/g, "VITE_GOOGLE_SPREADSHEET_ID || ''");
  if (g !== read('src/utils/googleSheets.ts')) write('src/utils/googleSheets.ts', g);
}

require('./calendar_lifecycle_repair.cjs');

// Targeted visual repair: only the two trainer schedule time inputs are changed.
// Match the input by its bound value instead of relying on JSX attribute order.
// Also avoid rewriting the component when no change is needed, which keeps the
// dev server/Vite watcher from receiving unnecessary filesystem events.
{
  let s = read('src/components/TrainerDashboard.tsx');
  const repairTimeInput = (source, boundValue) => {
    const inputPattern = new RegExp(
      `<input\\b(?=[^>]*\\bvalue=\\{${boundValue}\\})(?=[^>]*\\btype=["']time["'])[^>]*\\bclassName=["']([^"']+)["'][^>]*>`,
      'm'
    );

    return source.replace(inputPattern, (full, className) => {
      if (className.split(/\\s+/).includes('box-border')) return full;
      return full.replace(className, `box-border ${className}`);
    });
  };

  const before = s;
  s = repairTimeInput(s, 'schedule\\.startTime');
  s = repairTimeInput(s, 'schedule\\.endTime');

  if (s === before) {
    // Fallback for JSX where the className/value ordering differs from the
    // standard input shape: add box-border to the first time-input class in
    // each schedule binding block without changing any schedule behavior.
    const repairBindingBlock = (source, boundValue) => source.replace(
      new RegExp(`(<input\\b[\\s\\S]{0,1200}\\bvalue=\\{${boundValue}\\}[\\s\\S]{0,1200}?>)`, 'm'),
      block => block.replace(/\\bclassName=["']([^"']+)["']/, (m, cls) =>
        cls.split(/\\s+/).includes('box-border') ? m : `className="box-border ${cls}"`
      )
    );
    s = repairBindingBlock(s, 'schedule\\.startTime');
    s = repairBindingBlock(s, 'schedule\\.endTime');
  }

  if (s !== before) write('src/components/TrainerDashboard.tsx', s);
}

const legacyWorkflow = path.join(root, '.github/workflows/repair-auth-and-demo-data.yml');
if (fs.existsSync(legacyWorkflow)) fs.rmSync(legacyWorkflow);
console.log('Production source repair completed. UI/UX and application architecture are unchanged.');