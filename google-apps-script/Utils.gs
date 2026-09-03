/**
 * Al-Andalos Driving Academy — Shared Utility Functions
 */

/**
 * Records an entry in the AdminLogs sheet for security and audit transparency.
 */
function writeAdminLog(action, operator, details) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logsSheet = ss.getSheetByName("AdminLogs");
  const logId = "LOG-" + Date.now();
  logsSheet.appendRow([
    logId,
    new Date(),
    action,
    operator,
    details,
    "API Gateway"
  ]);
}
