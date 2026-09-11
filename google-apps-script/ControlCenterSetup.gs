/** One-time setup helper for the Master Control Center. */
function setupControlCenter(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  if(!ss) throw new Error('Open the Driving School Control Center spreadsheet first.');
  SpreadsheetApp.getUi().alert('Master Control Center is installed. Use the Control Center menu to open it.');
}
