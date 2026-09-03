/**
 * Al-Andalos Driving Academy — System Notifications & Alert Dispatches
 */

/**
 * ERP Admin Macro: Sends a balance warning reminder to a student with insufficient funds.
 */
function menuSendReminder() {
  const ui = SpreadsheetApp.getUi();
  const bookingId = ui.prompt("Send Balance Reminder", "Enter Booking ID:", ui.ButtonSet.OK_CANCEL).getResponseText();
  if (!bookingId) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookings = ss.getSheetByName("Bookings").getDataRange().getValues();
  let studentId = "";

  for (let i = 1; i < bookings.length; i++) {
    if (bookings[i][0].toString() === bookingId.trim()) {
      studentId = bookings[i][1];
      break;
    }
  }

  if (!studentId) {
    ui.alert("Error", "Booking not found.", ui.ButtonSet.OK);
    return;
  }

  const student = apiGetStudentDashboard(studentId).student;

  const subject = "⚠️ تذكير بالسداد: رصيد غير كافٍ لحصة القيادة - مدرسة الأندلس";
  const body = "Dear " + student.name + ",\n\nYour scheduled driving lesson is upcoming. Please top up your wallet account balance to keep your reservation active.\n\nMet vriendelijke groet,\nAl-Andalos ERP Control Team";
  
  MailApp.sendEmail(student.email, subject, body);
  ui.alert("Reminder Dispatched", "Gmail notification sent to " + student.email, ui.ButtonSet.OK);
}
