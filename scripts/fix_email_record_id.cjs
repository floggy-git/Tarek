const fs = require('node:fs');
const file = 'server.ts';
let server = fs.readFileSync(file, 'utf8');
const bad = 'id: `email-\\${Date.now()}-\\${Math.floor(Math.random() * 1000)}`';
const good = 'id: `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`';
if (server.includes(bad)) {
  server = server.replaceAll(bad, good);
  fs.writeFileSync(file, server);
  console.log('Fixed escaped password-reset email record identifier.');
} else {
  console.log('No escaped password-reset email record identifier found.');
}
