const fs = require('node:fs');
const file = 'server.ts';
let server = fs.readFileSync(file, 'utf8');
const start = server.indexOf("  app.post('/api/send-email'");
const marker = '  // Return current server-authoritative time';
const end = start >= 0 ? server.indexOf(marker, start) : -1;
if (start >= 0 && end > start) {
  const block = server.slice(start, end).replaceAll('\\n', '\n');
  server = server.slice(0, start) + block + server.slice(end);
  fs.writeFileSync(file, server);
  console.log('Normalized literal newline escapes in send-email endpoint.');
} else {
  console.log('Send-email endpoint already normalized or not present.');
}
