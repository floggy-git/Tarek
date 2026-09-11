const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }
function write(rel, text) { fs.writeFileSync(path.join(root, rel), text); }

// Runs after production_repair.cjs. Firebase remains the password authority.
// Google Sheets remains the source for the student profile when that data is available.
{
  let s = read('src/App.tsx');
  const before = s;

  // Do not block an authenticated Firebase student merely because the Sheets
  // profile has not loaded yet. The profile is reconciled when Sheets data arrives.
  s = s.replace(/\n\s*if \(loginRole === 'student' && !matchedStudent\) \{[\s\S]*?\n\s*\}\n\n\s*const isNotificationsEnabled/, '\n\n      const isNotificationsEnabled');

  // The demo login handler is no longer part of the production UI.
  s = s.replace(/\n\s*const handleDemoLogin = \(_pRole: 'student' \| 'trainer'\) => \{[\s\S]*?\n\s*\};\n\n\s*const handleManualLogin/, '\n\n  const handleManualLogin');
  s = s.replace(/\n\s*handleDemoLogin=\{handleDemoLogin\}\n?/, '\n');

  if (s !== before) write('src/App.tsx', s);
}

{
  let s = read('src/components/LoginScreen.tsx');
  const before = s;

  s = s.replace(/\n\s*handleDemoLogin: \(role: 'student' \| 'trainer'\) => void;\n/, '\n');
  s = s.replace(/\n\s*handleDemoLogin,\n/, '\n');

  s = s.replace(/\n\s*\{\/\* Instant Quick Demo Divider \*\/\}[\s\S]*?\n\s*<\/div>\n\s*\n\s*<\/form>/, '\n\n          </form>');

  if (s !== before) write('src/components/LoginScreen.tsx', s);
}

console.log('Production login normalization completed. Demo login UI removed.');
