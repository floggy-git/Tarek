/** Adds the Master Control Center to the spreadsheet UI. */
function addControlCenterMenu(){
  SpreadsheetApp.getUi().createMenu('Control Center').addItem('Open Master Panel','controlCenterOpen').addToUi();
}
