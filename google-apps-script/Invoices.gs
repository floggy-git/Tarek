/**
 * TAREK RIJSCHOOL — Invoice Generation & Itemization.
 */

function apiCreateInvoice(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const invoicesSheet = ss.getSheetByName('Invoices');
  const bookingsSheet = ss.getSheetByName('Bookings');
  const settingsSheet = ss.getSheetByName('Settings');
  if (!invoicesSheet || !bookingsSheet || !settingsSheet) throw new Error('Required invoice sheets are missing.');

  const studentId = String(params && params.studentId || '').trim();
  const trainerId = String(params && params.trainerId || '').trim();
  const bookingsList = String(params && params.bookingsList || '').trim();
  if (!studentId || !trainerId || !bookingsList) throw new Error('Student, trainer and booking details are required.');

  const student = apiGetStudentDashboard(studentId).student;
  const trainer = apiGetTrainerDashboard(trainerId).trainer;
  const invoiceId = 'INV-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd') + '-' + Date.now();

  let grossSum = 0;
  const bookData = bookingsSheet.getDataRange().getValues();
  bookingsList.split(',').forEach(id => {
    for (let i = 1; i < bookData.length; i++) {
      if (String(bookData[i][0] || '') === id.trim()) {
        grossSum += Number(bookData[i][8]) || 0;
        break;
      }
    }
  });
  if (!(grossSum > 0)) throw new Error('No billable booking amount was found for this invoice.');

  let vatRate = 21;
  const settings = settingsSheet.getDataRange().getValues();
  for (let i = 1; i < settings.length; i++) {
    if (String(settings[i][0] || '') === 'VAT_RATE_PERCENT') { vatRate = Number(settings[i][1]) || 21; break; }
  }
  const subtotal = grossSum / (1 + vatRate / 100);
  const vatAmount = grossSum - subtotal;
  const invoiceDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  const pdfHtml = getInvoicePdfHtml_({ invoiceId, invoiceDate, studentName: student.name, studentId: student.id, trainerName: trainer.name, bookingsList, subtotal, vatRate, vatAmount, grandTotal: grossSum });
  const pdfBlob = HtmlService.createHtmlOutput(pdfHtml).getBlob().getAs(MimeType.PDF).setName(invoiceId + '.pdf');
  const pdfFile = DriveApp.createFile(pdfBlob);

  invoicesSheet.appendRow([invoiceId, student.id, student.name, trainer.id, trainer.name, invoiceDate, bookingsList, subtotal.toFixed(2), vatRate + '%', vatAmount.toFixed(2), grossSum.toFixed(2), pdfFile.getUrl(), 'issued']);
  writeAdminLog('Create Invoice API', 'App API', 'Generated Invoice ' + invoiceId + ' for ' + student.name);
  return { invoiceId, grandTotal: grossSum, pdfUrl: pdfFile.getUrl() };
}

function apiSendInvoice(params) {
  const invoiceId = String(params && params.invoiceId || '').trim();
  if (!invoiceId) throw new Error('Invoice ID is required.');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Invoices');
  if (!sheet) throw new Error('Invoices sheet is missing.');
  const invoices = sheet.getDataRange().getValues();
  let invoice = null;
  for (let i = 1; i < invoices.length; i++) {
    if (String(invoices[i][0] || '') === invoiceId) {
      invoice = { id: invoices[i][0], studentId: invoices[i][1], studentName: invoices[i][2], subtotal: Number(invoices[i][7]), vatAmount: Number(invoices[i][9]), grandTotal: Number(invoices[i][10]), list: invoices[i][6], pdfUrl: invoices[i][11] };
      break;
    }
  }
  if (!invoice) throw new Error('Invoice ' + invoiceId + ' does not exist.');
  if (!invoice.pdfUrl || String(invoice.pdfUrl).indexOf('http') !== 0) throw new Error('Invoice PDF is missing for ' + invoiceId + '.');
  const student = apiGetStudentDashboard(invoice.studentId).student;
  const match = String(invoice.pdfUrl).match(/[-\w]{25,}/);
  if (!match) throw new Error('Invalid stored PDF URL for ' + invoiceId + '.');
  const pdfBlob = DriveApp.getFileById(match[0]).getBlob();
  sendResponsiveEmail(student.email, student.name, 'invoice', { invoiceId: invoice.id, description: 'Driving practical curriculum: ' + invoice.list, subtotal: invoice.subtotal, vatAmount: invoice.vatAmount, grandTotal: invoice.grandTotal, attachments: [pdfBlob] });
  writeAdminLog('Send Invoice API', 'App API', 'Sent Invoice PDF attachment to ' + student.name);
  return { success: true, pdfUrl: invoice.pdfUrl };
}

function getInvoicePdfHtml_(data) {
  return '<!doctype html><html><head><meta charset="UTF-8"><style>' +
    'body{font-family:Arial,sans-serif;padding:36px;color:#0f172a}h1{margin:0 0 8px;font-size:24px}h2{font-size:16px;margin-top:28px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #cbd5e1;padding:10px;text-align:left}th{background:#f1f5f9}.total{font-weight:700;font-size:16px}' +
    '</style></head><body><h1>TAREK RIJSCHOOL</h1><div>Tax invoice: ' + data.invoiceId + '</div><div>Date: ' + data.invoiceDate + '</div><h2>Student</h2><div>' + data.studentName + ' (' + data.studentId + ')</div><div>Trainer: ' + data.trainerName + '</div><table><tr><th>Service</th><th>Amount</th></tr><tr><td>Driving lessons: ' + data.bookingsList + '</td><td>€' + data.subtotal.toFixed(2) + '</td></tr><tr><td>VAT ' + data.vatRate + '%</td><td>€' + data.vatAmount.toFixed(2) + '</td></tr><tr class="total"><td>Total</td><td>€' + data.grandTotal.toFixed(2) + '</td></tr></table></body></html>';
}

function menuCreateInvoice() {
  const ui = SpreadsheetApp.getUi();
  const bookingId = ui.prompt('Generate Invoice', 'Enter Booking ID:', ui.ButtonSet.OK_CANCEL).getResponseText();
  if (!bookingId) return;
  const bookings = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Bookings').getDataRange().getValues();
  let studentId = '', trainerId = '';
  for (let i = 1; i < bookings.length; i++) if (String(bookings[i][0] || '') === bookingId.trim()) { studentId = bookings[i][1]; trainerId = bookings[i][3]; break; }
  if (!studentId) { ui.alert('Error', 'Booking not found.', ui.ButtonSet.OK); return; }
  try { const res = apiCreateInvoice({ studentId, trainerId, bookingsList: bookingId }); ui.alert('Invoice Generated', 'Invoice created: ' + res.invoiceId, ui.ButtonSet.OK); }
  catch (err) { ui.alert('Failed', String(err), ui.ButtonSet.OK); }
}

function menuSendInvoice() {
  const ui = SpreadsheetApp.getUi();
  const invoiceId = ui.prompt('Send Invoice PDF via Email', 'Enter Invoice ID:', ui.ButtonSet.OK_CANCEL).getResponseText();
  if (!invoiceId) return;
  try { apiSendInvoice({ invoiceId }); ui.alert('Dispatched', 'Invoice email sent successfully.', ui.ButtonSet.OK); }
  catch (err) { ui.alert('Delivery Failed', String(err), ui.ButtonSet.OK); }
}

function createInvoice(params) { return apiCreateInvoice(params); }
function sendInvoice(params) { return apiSendInvoice(params); }
