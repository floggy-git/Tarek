const fs = require('node:fs');
const path = require('node:path');

// Legacy repair entry point retained for compatibility. Production builds no longer
// execute one-time source mutations automatically; current source is maintained directly.
const root = process.cwd();
const legacyWorkflow = path.join(root, '.github/workflows/repair-auth-and-demo-data.yml');

if (fs.existsSync(legacyWorkflow)) {
  fs.rmSync(legacyWorkflow);
}

console.log('Legacy production repair entry point completed without source mutations.');
