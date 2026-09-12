/**
 * TAREK RIJSCHOOL — Lesson completion and route logging.
 */

function apiCompleteLesson(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookingsSheet = ss.getSheetByName('Bookings');
  const completedSheet = ss.getSheetByName('CompletedLessons');
  if (!bookingsSheet || !completedSheet) throw new Error('Required lesson sheets are missing.');

  const bookingId = String(params && params.bookingId || '').trim();
  const score = Number(params && params.score);
  const feedback = String(params && params.feedback || '').trim();
  const examReady = Boolean(params && params.examReady);
  if (!bookingId) throw new Error('Booking ID is required.');
  if (!(score >= 1 && score <= 10)) throw new Error('Lesson score must be between 1 and 10.');

  const bookings = bookingsSheet.getDataRange().getValues();
  let bookingRow = -1, booking = null;
  for (let i = 1; i < bookings.length; i++) {
    if (String(bookings[i][0] || '') === bookingId) {
      bookingRow = i + 1;
      booking = { id: bookings[i][0], studentId: bookings[i][1], studentName: bookings[i][2], trainerId: bookings[i][3], trainerName: bookings[i][4], date: bookings[i][5], duration: Number(bookings[i][7]), price: Number(bookings[i][8]) };
      break;
    }
  }
  if (!booking) throw new Error('Booking record ' + bookingId + ' not found.');

  bookingsSheet.getRange(bookingRow, 11).setValue('completed');
  const recordId = 'CL-' + Date.now();
  completedSheet.appendRow([recordId, bookingId, booking.studentName, booking.trainerName, booking.date, booking.duration, booking.price, score, feedback, 'FALSE', 'pending']);

  const invDetails = apiCreateInvoice({ studentId: booking.studentId, trainerId: booking.trainerId, bookingsList: bookingId });
  if (examReady) {
    const studentSheet = ss.getSheetByName('Students');
    const map = studentHeaderMap_(studentSheet);
    const readinessCol = studentCol_(map, ['exam readiness (%)', 'exam readiness score'], true);
    const idCol = studentCol_(map, ['student id'], true);
    const rows = studentSheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) if (String(rows[i][idCol] || '') === String(booking.studentId)) { studentSheet.getRange(i + 1, readinessCol + 1).setValue(95); break; }
  }

  const student = apiGetStudentDashboard(booking.studentId).student;
  if (student.email) sendResponsiveEmail(student.email, student.name, 'completion', { date: booking.date, duration: booking.duration, notes: feedback });
  writeAdminLog('Complete Lesson API', 'App API', 'Lesson ' + bookingId + ' finalized. Score: ' + score);
  return { success: true, recordId, invoiceId: invDetails.invoiceId };
}

function menuCompleteLesson() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Bookings');
  if (!sheet) throw new Error('Bookings sheet is missing.');
  const row = sheet.getActiveCell().getRow();
  if (row === 1) { ui.alert('Error', 'Please click on a valid booking row first.', ui.ButtonSet.OK); return; }
  const bookingId = sheet.getRange(row, 1).getValue();
  if (!bookingId || !String(bookingId).startsWith('B-')) { ui.alert('Error', 'Selected row is not a valid booking.', ui.ButtonSet.OK); return; }
  const score = ui.prompt('Complete Lesson', 'Trainer score evaluation (1 to 10):', ui.ButtonSet.OK_CANCEL).getResponseText();
  const notes = ui.prompt('Complete Lesson', 'Training feedback notes:', ui.ButtonSet.OK_CANCEL).getResponseText();
  try { apiCompleteLesson({ bookingId, score, feedback: notes, examReady: false }); ui.alert('Lesson Finalized', 'Lesson completion and invoice processing succeeded.', ui.ButtonSet.OK); }
  catch (err) { ui.alert('Failed', String(err), ui.ButtonSet.OK); }
}

function apiSaveRoute(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const routeSheet = ss.getSheetByName('RouteTracking');
  if (!routeSheet) throw new Error('RouteTracking sheet is missing.');
  const bookingId = String(params && params.bookingId || '').trim();
  const studentName = String(params && params.studentName || '').trim();
  const trainerName = String(params && params.trainerName || '').trim();
  const points = params && params.points;
  if (!bookingId) throw new Error('Booking ID is required.');
  if (!Array.isArray(points) || points.length === 0) throw new Error('Points must be a non-empty array of GPS nodes.');
  points.forEach((pt, idx) => {
    if (!pt || !Number.isFinite(Number(pt.lat)) || !Number.isFinite(Number(pt.lng))) throw new Error('Invalid GPS point at index ' + idx + '.');
    routeSheet.appendRow(['RT-' + bookingId + '-' + Date.now() + '-' + idx, bookingId, studentName, trainerName, Number(pt.lat), Number(pt.lng), new Date()]);
  });
  return { success: true, loggedCount: points.length };
}

function apiGetRoute(bookingId) {
  if (!bookingId) throw new Error('Booking ID required.');
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('RouteTracking');
  if (!sheet) throw new Error('RouteTracking sheet is missing.');
  const data = sheet.getDataRange().getValues();
  const points = [];
  for (let i = 1; i < data.length; i++) if (String(data[i][1] || '') === String(bookingId)) points.push({ lat: Number(data[i][4]), lng: Number(data[i][5]), timestamp: data[i][6] });
  return { bookingId, points };
}
