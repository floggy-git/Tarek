/**
 * Al-Andalos Driving Academy — Reporting & Aggregated Business Performance Analytics
 */

/**
 * ERP Admin Macro: Exports statistical analytics summaries.
 */
function menuExportReports() {
  const ui = SpreadsheetApp.getUi();
  const reportsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Reports");
  
  const reportId = "REP-" + Date.now();
  const title = "Al-Andalos School Quarterly Review";
  const dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

  const summaryData = {
    grossInvoicedRevenue: "=SUM(Invoices!K2:K)",
    totalLessonsCount: "=COUNTA(Bookings!A2:A)",
    averageCBRReadyRate: "=AVERAGE(Students!I2:I)"
  };

  reportsSheet.appendRow([
    reportId,
    title,
    dateStr,
    "Financial & Performance Metrics",
    JSON.stringify(summaryData),
    "Sheets Administrator ERP"
  ]);

  ui.alert("Report Exported", "Metrics logs exported to 'Reports' sheet! ID: " + reportId, ui.ButtonSet.OK);
}
