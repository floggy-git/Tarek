/**
 * Al-Andalos Driving Academy — Invoice Generation & Itemization
 */

/**
 * Generates an ERP invoice itemized with VAT tax breakdown and archives a real PDF.
 */
function apiCreateInvoice(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const invoicesSheet = ss.getSheetByName("Invoices");
  const invoiceId = "INV-2026-" + Math.floor(Math.random() * 9000 + 1000);

  const studentId = params.studentId;
  const trainerId = params.trainerId;
  const bookingsList = params.bookingsList;

  const student = apiGetStudentDashboard(studentId).student;
  const trainer = apiGetTrainerDashboard(trainerId).trainer;

  let grossSum = 0;
  const bookings = bookingsList.split(",");
  const bookData = ss.getSheetByName("Bookings").getDataRange().getValues();
  bookings.forEach(id => {
    for (let i = 1; i < bookData.length; i++) {
      if (bookData[i][0].toString() === id.trim()) {
        grossSum += Number(bookData[i][8]) || 0;
      }
    }
  });

  const vatRate = 21;
  const subtotal = grossSum / (1 + vatRate / 100);
  const vatAmount = grossSum - subtotal;
  const invoiceDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

  const pdfHtml = getInvoicePdfHtml_({
    invoiceId,
    invoiceDate,
    studentName: student.name,
    studentId: student.id,
    trainerName: trainer.name,
    bookingsList,
    subtotal,
    vatRate,
    vatAmount,
    grandTotal: grossSum
  });

  const pdfBlob = HtmlService.createHtmlOutput(pdfHtml)
    .getBlob()
    .getAs(MimeType.PDF)
    .setName(invoiceId + ".pdf");
  const pdfFile = DriveApp.createFile(pdfBlob);
  const pdfUrl = pdfFile.getUrl();

  invoicesSheet.appendRow([
    invoiceId,
    student.id,
    student.name,
    trainer.id,
    trainer.name,
    invoiceDate,
    bookingsList,
    subtotal.toFixed(2),
    vatRate + "%",
    vatAmount.toFixed(2),
    grossSum.toFixed(2),
    pdfUrl,
    "paid"
  ]);

  writeAdminLog("Create Invoice API", "App API", "Generated Invoice " + invoiceId + " and archived PDF for " + student.name);

  return { invoiceId, grandTotal: grossSum, pdfUrl };
}

/**
 * Sends the generated invoice PDF as a Gmail attachment.
 */
function apiSendInvoice(params) {
  const invoiceId = params.invoiceId;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const invoices = ss.getSheetByName("Invoices").getDataRange().getValues();
  let invoice = null;

  for (let i = 1; i < invoices.length; i++) {
    if (invoices[i][0].toString() === invoiceId) {
      invoice = {
        id: invoices[i][0],
        studentId: invoices[i][1],
        studentName: invoices[i][2],
        subtotal: Number(invoices[i][7]),
        vatAmount: Number(invoices[i][9]),
        grandTotal: Number(invoices[i][10]),
        list: invoices[i][6],
        pdfUrl: invoices[i][11]
      };
      break;
    }
  }

  if (!invoice) throw new Error("Invoice " + invoiceId + " does not exist.");
  if (!invoice.pdfUrl || invoice.pdfUrl.indexOf("http") !== 0) throw new Error("Invoice PDF is missing for " + invoiceId + ".");

  const student = apiGetStudentDashboard(invoice.studentId).student;
  const pdfFileIdMatch = invoice.pdfUrl.match(/[-\w]{25,}/);
  if (!pdfFileIdMatch) throw new Error("Invalid stored PDF URL for " + invoiceId + ".");
  const pdfBlob = DriveApp.getFileById(pdfFileIdMatch[0]).getBlob();

  sendResponsiveEmail(student.email, student.name, "invoice", {
    invoiceId: invoice.id,
    description: "Driving practical curriculum: " + invoice.list,
    subtotal: invoice.subtotal,
    vatAmount: invoice.vatAmount,
    grandTotal: invoice.grandTotal,
    attachments: [pdfBlob]
  });

  writeAdminLog("Send Invoice API", "App API", "Sent Invoice PDF attachment to " + student.name);
  return { success: true, pdfUrl: invoice.pdfUrl };
}

/**
 * Builds the HTML source used only to render the invoice PDF.
 */
function getInvoicePdfHtml_(data) {
  return '<!doctype html><html><head><meta charset="UTF-8"><style>' +
    'body{font-family:Arial,sans-serif;padding:36px;color:#0f172a}' +
    'h1{margin:0 0 8px;font-size:24px}h2{font-size:16px;margin-top:28px}' +
    'table{width:100%;border-collapse:collapse;margin-top:20px}' +
    'th,td{border:1px solid #cbd5e1;padding:10px;text-align:left}' +
    'th{background:#f1f5f9}.total{font-weight:700;font-size:16px}' +
    '</style></head><body>' +
    '<h1>AL-ANDALOS RIJSCHOOL</h1>' +
    '<div>Tax invoice: ' + data.invoiceId + '</div>' +
    '<div>Date: ' + data.invoiceDate + '</div>' +
    '<h2>Student</h2><div>' + data.studentName + ' (' + data.studentId + ')</div>' +
    '<div>Trainer: ' + data.trainerName + '</div>' +
    '<table><tr><th>Service</th><th>Amount</th></tr>' +
    '<tr><td>Driving lessons: ' + data.bookingsList + '</td><td>€' + data.subtotal.toFixed(2) + '</td></tr>' +
    '<tr><td>VAT ' + data.vatRate + '%</td><td>€' + data.vatAmount.toFixed(2) + '</td></tr>' +
    '<tr class="total"><td>Total</td><td>€' + data.grandTotal.toFixed(2) + '</td></tr></table>' +
    '</body></html>';
}

function menuCreateInvoice() {
  const ui = SpreadsheetApp.getUi();
  const bookingId = ui.prompt("Generate Invoice", "Enter Booking ID:", ui.ButtonSet.OK_CANCEL).getResponseText();
  if (!bookingId) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookings = ss.getSheetByName("Bookings").getDataRange().getValues();
  let studentId = "";
  let trainerId = "";

  for (let i = 1; i < bookings.length; i++) {
    if (bookings[i][0].toString() === bookingId.trim()) {
      studentId = bookings[i][1];
      trainerId = bookings[i][3];
      break;
    }
  }

  if (!studentId) {
    ui.alert("Error", "Booking not found.", ui.ButtonSet.OK);
    return;
  }

  try {
    const res = apiCreateInvoice({ studentId, trainerId, bookingsList: bookingId });
    ui.alert("Invoice Generated", "Successfully generated invoice under ID: " + res.invoiceId, ui.ButtonSet.OK);
  } catch (err) {
    ui.alert("Failed", err.toString(), ui.ButtonSet.OK);
  }
}

function menuSendInvoice() {
  const ui = SpreadsheetApp.getUi();
  const invoiceId = ui.prompt("Send Invoice PDF via Email", "Enter Invoice ID:", ui.ButtonSet.OK_CANCEL).getResponseText();
  if (!invoiceId) return;

  try {
    apiSendInvoice({ invoiceId });
    ui.alert("Dispatched", "Email invoice dispatch sent to student's inbox successfully!", ui.ButtonSet.OK);
  } catch (err) {
    ui.alert("Delivery Failed", err.toString(), ui.ButtonSet.OK);
  }
}

function createInvoice(params) { return apiCreateInvoice(params); }
function sendInvoice(params) { return apiSendInvoice(params); }
