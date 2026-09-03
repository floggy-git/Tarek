/**
 * Al-Andalos Driving Academy — Invoice Generation & Itemization
 */

/**
 * Generates an ERP invoice itemized with VAT tax breakdown.
 */
function apiCreateInvoice(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const invoicesSheet = ss.getSheetByName("Invoices");
  const invoiceId = "INV-2026-" + Math.floor(Math.random() * 9000 + 1000);

  const studentId = params.studentId;
  const trainerId = params.trainerId;
  const bookingsList = params.bookingsList; // Comma-separated Booking IDs

  const student = apiGetStudentDashboard(studentId).student;
  const trainer = apiGetTrainerDashboard(trainerId).trainer;

  // Calculate gross lesson values
  let grossSum = 0;
  const bookings = bookingsList.split(",");
  bookings.forEach(id => {
    // Lookup price
    const bookData = ss.getSheetByName("Bookings").getDataRange().getValues();
    for (let i = 1; i < bookData.length; i++) {
      if (bookData[i][0].toString() === id.trim()) {
        grossSum += Number(bookData[i][8]);
      }
    }
  });

  const vatRate = 21; // 21% BTW Dutch driving academy service charge
  const subtotal = grossSum / (1 + vatRate / 100);
  const vatAmount = grossSum - subtotal;

  invoicesSheet.appendRow([
    invoiceId,
    student.id,
    student.name,
    trainer.id,
    trainer.name,
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
    bookingsList,
    subtotal.toFixed(2),
    vatRate + "%",
    vatAmount.toFixed(2),
    grossSum.toFixed(2),
    "https://example.com/mock-pdf/" + invoiceId + ".pdf", // Simulated PDF url
    "paid"
  ]);

  writeAdminLog("Create Invoice API", "App API", "Generated Invoice " + invoiceId + " for " + student.name);

  return { invoiceId, grandTotal: grossSum };
}

/**
 * Sends a formal tax PDF notice invoice via Gmail.
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
        list: invoices[i][6]
      };
      break;
    }
  }

  if (!invoice) throw new Error("Invoice " + invoiceId + " does not exist.");

  const student = apiGetStudentDashboard(invoice.studentId).student;

  sendResponsiveEmail(student.email, student.name, "invoice", {
    invoiceId: invoice.id,
    description: "Driving practical curriculum: " + invoice.list,
    subtotal: invoice.subtotal,
    vatAmount: invoice.vatAmount,
    grandTotal: invoice.grandTotal
  });

  writeAdminLog("Send Invoice API", "App API", "Sent Invoice PDF receipt email to " + student.name);
  return { success: true };
}

/**
 * ERP Admin Macro: Interactive invoice generation prompt.
 */
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

/**
 * ERP Admin Macro: Interactive invoice dispatch prompt.
 */
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

// Global programmatic API aliases mapping to React frontend calls
function createInvoice(params) { return apiCreateInvoice(params); }
function sendInvoice(params) { return apiSendInvoice(params); }
