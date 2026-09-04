const fs = require('node:fs');
const file = 'server.ts';
let server = fs.readFileSync(file, 'utf8');
const pattern = /(  app\.post\('\/api\/send-email'[\s\S]*?)(\n  \/\/ Return current server-authoritative time)/;
if (pattern.test(server)) {
  server = server.replace(pattern, (_m, block, tail) => [block.replaceAll('\\n', '\n'), tail].join(''));
  fs.writeFileSync(file, server);
  console.log('Normalized literal newline escapes in send-email endpoint.');
} else {
  throw new Error('Could not locate /api/send-email endpoint.');
}
