const fs = require('node:fs');
const file = 'server.ts';
let server = fs.readFileSync(file, 'utf8');
const pattern = /  app\.post\('\/api\/send-email'[\s\S]*?\n  \}\);\n\n  \/\/ Return current server-authoritative time/;
const replacement = [
  "  app.post('/api/send-email', async (req, res) => {",
  "    const { to, subject, html, type, studentName, metadata, pdfBase64 } = req.body;",
  "    if (!to || !subject || !html) return res.status(400).json({ error: 'Missing required email fields (to, subject, html)' });",
  "    const transporter = getMailTransporter();",
  "    if (!transporter) return res.status(503).json({ success: false, error: 'Email service is not configured.' });",
  "    try {",
  "      const mail: any = { from: process.env.SMTP_FROM || ('Al-Andalos Rijschool <' + process.env.SMTP_USER + '>'), to: String(to).trim(), subject: String(subject), html: String(html) };",
  "      if (pdfBase64) mail.attachments = [{ filename: 'Al_Andalos_Dossier_' + String(studentName || 'Student').replace(/[\\\\s]+/g, '_') + '.pdf', content: Buffer.from(String(pdfBase64).replace(/^data:application\\\\/pdf;base64,/, ''), 'base64'), contentType: 'application/pdf' }];",
  "      await transporter.sendMail(mail);",
  "      const emailRecord = { id: 'email-' + Date.now() + '-' + Math.floor(Math.random() * 1000), timestamp: new Date().toISOString(), to: String(to).trim(), subject: String(subject), type, studentName, metadata };",
  "      sentEmailsLog.unshift(emailRecord);",
  "      if (sentEmailsLog.length > 100) sentEmailsLog.pop();",
  "      return res.json({ success: true, sentReal: true, simulated: false, email: emailRecord });",
  "    } catch (err: any) {",
  "      console.error('[SMTP Error] Failed sending email:', err?.message || err);",
  "      return res.status(502).json({ success: false, error: 'Email delivery failed.' });",
  "    }",
  "  });",
  "",
  "  // Return current server-authoritative time"
].join('\\n');
if (!pattern.test(server)) throw new Error('Could not locate /api/send-email endpoint.');
server = server.replace(pattern, replacement);
fs.writeFileSync(file, server);
console.log('Replaced simulated email endpoint with real SMTP delivery.');
