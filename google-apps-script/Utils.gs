/**
 * TAREK RIJSCHOOL — Shared Utility Functions.
 */

/**
 * Records operational actions in the live AuditLogs schema.
 * No IP/device value is fabricated by Apps Script.
 */
function writeAdminLog(action, operator, details) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName('AuditLogs');
  if (!sh) throw new Error('AuditLogs sheet is missing.');

  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0]
    .map(h => String(h || '').trim());
  const now = new Date();
  const row = {
    'Audit ID': 'AUD-' + Date.now(),
    'User ID': 'SYSTEM',
    'User Name': 'Apps Script',
    'User Role': 'System',
    'Action': String(action || ''),
    'Changed By': String(operator || 'Apps Script'),
    'Date': Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    'Time': Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm:ss'),
    'Time Zone': Session.getScriptTimeZone(),
    'IP Address': '',
    'Device / Browser': '',
    'Target Record': '',
    'Previous Value': '',
    'New Value': String(details || ''),
    'Source': 'Google Apps Script'
  };
  sh.appendRow(headers.map(h => Object.prototype.hasOwnProperty.call(row, h) ? row[h] : ''));
  return { success: true, auditId: row['Audit ID'] };
}
