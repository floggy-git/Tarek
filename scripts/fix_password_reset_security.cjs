const fs = require('node:fs');

const file = 'server.ts';
let server = fs.readFileSync(file, 'utf8');

const emailRecordPattern = /    const emailRecord = \{\n      id: `email-\$\{Date\.now\(\)\}-\$\{Math\.floor\(Math\.random\(\) \* 1000\)\}`,\n      timestamp: new Date\(\)\.toISOString\(\),\n      to: cleanEmail,\n      subject,\n      html: emailHtml,\n      type: 'booking',\n      studentName: 'Password Reset User',\n      metadata: \{ resetLink, token, expiresAt \}\n    \};/;
if (emailRecordPattern.test(server)) {
  server = server.replace(emailRecordPattern, "    const emailRecord = {\n      id: `email-\\${Date.now()}-\\${Math.floor(Math.random() * 1000)}`,\n      timestamp: new Date().toISOString(),\n      to: cleanEmail,\n      subject,\n      type: 'password_reset'\n    };");
}

const responsePattern = /    res\.json\(\{\n      success: true,\n      sentReal,\n      simulated: !sentReal,\n      smtpError,\n      message: 'Password reset token generated successfully\.',\n      expiresAt,\n      token\n    \}\);/;
if (responsePattern.test(server)) {
  server = server.replace(responsePattern, "    if (!sentReal) {\n      return res.status(503).json({ success: false, error: 'Password reset email is unavailable.' });\n    }\n\n    res.json({\n      success: true,\n      sentReal: true,\n      simulated: false,\n      message: 'Password reset email sent successfully.',\n      expiresAt\n    });");
}

// The migration replacement above must leave a real runtime template literal, not escaped interpolation.
server = server.replace(/email-\\\\\$\{Date\.now\(\)\}-\\\\\$\{Math\.floor\(Math\.random\(\) \* 1000\)\}/g, 'email-${Date.now()}-${Math.floor(Math.random() * 1000)}');

fs.writeFileSync(file, server);
console.log('Password-reset security migration applied.');
