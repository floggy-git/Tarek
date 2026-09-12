/**
 * TAREK RIJSCHOOL — Booking Operations.
 * Google Sheets remains the source of truth for lesson bookings.
 */

function apiCreateBooking(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookingsSheet = ss.getSheetByName('Bookings');
  const settingsSheet = ss.getSheetByName('Settings');
  if (!bookingsSheet || !settingsSheet) throw new Error('Required booking sheets are missing.');

  const studentId = String(params && params.studentId || '').trim();
  const trainerId = String(params && params.trainerId || 'TR-201').trim();
  const dateStr = String(params && params.date || '').trim();
  const timeStr = String(params && params.time || '').trim();
  const duration = Number(params && params.duration || 1);
  const pickup = String(params && params.pickupLocation || 'Selected Pickup Station').trim();

  if (!studentId) throw new Error('Student ID is required.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) throw new Error('Lesson date must use YYYY-MM-DD.');
  if (!/^\d{2}:\d{2}$/.test(timeStr)) throw new Error('Lesson time must use HH:MM.');
  if (!(duration > 0 && duration <= 8)) throw new Error('Lesson duration must be between 1 and 8 hours.');

  const student = apiGetStudentDashboard(studentId).student;
  if (!student) throw new Error('Student was not found.');

  const settings = settingsSheet.getDataRange().getValues();
  let baseRate = 65;
  for (let i = 1; i < settings.length; i++) {
    if (String(settings[i][0] || '') === 'HOURLY_RATE_STANDARD') {
      baseRate = Number(settings[i][1]) || 65;
      break;
    }
  }
  const finalPrice = duration * baseRate;
  if (Number(student.balance) < finalPrice) {
    throw new Error('Insufficient student wallet balance. Price: €' + finalPrice + ' Current: €' + student.balance);
  }

  const trainer = apiGetTrainerDashboard(trainerId).trainer;
  if (!trainer) throw new Error('Trainer was not found.');

  const bookingId = 'B-' + Date.now();
  bookingsSheet.appendRow([
    bookingId,
    student.id,
    student.name,
    trainer.id,
    trainer.name,
    dateStr,
    timeStr,
    duration,
    finalPrice,
    pickup,
    'upcoming',
    ''
  ]);

  writeTransactionRecord(student.id, student.name, 'payment', finalPrice, 'Reserved driving lesson (' + bookingId + ') on ' + dateStr + ' at ' + timeStr);
  rebuildStudentBalance(student.id);

  if (student.email) {
    sendResponsiveEmail(student.email, student.name, 'booking', {
      date: dateStr,
      time: timeStr,
      duration,
      pickupLocation: pickup,
      price: finalPrice
    });
  }

  writeAdminLog('Create Booking API', 'App API', 'Successfully scheduled ' + bookingId + ' for ' + student.name);
  return { bookingId, eventId: '', price: finalPrice };
}

function menuAddLesson() {
  const ui = SpreadsheetApp.getUi();
  const studentName = ui.prompt('Schedule Lesson', 'Student name:', ui.ButtonSet.OK_CANCEL).getResponseText();
  if (!studentName) return;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const studentsSheet = ss.getSheetByName('Students');
  if (!studentsSheet) throw new Error('Students sheet is missing.');
  const students = studentsSheet.getDataRange().getValues();
  let studentId = '';
  for (let i = 1; i < students.length; i++) {
    if (String(students[i][1] || '').toLowerCase() === studentName.toLowerCase()) {
      studentId = String(students[i][0] || '');
      break;
    }
  }
  if (!studentId) {
    ui.alert('Registration Error', 'No registered student matching that name was found.', ui.ButtonSet.OK);
    return;
  }

  const date = ui.prompt('Schedule Lesson', 'Date (YYYY-MM-DD):', ui.ButtonSet.OK_CANCEL).getResponseText();
  const time = ui.prompt('Schedule Lesson', 'Start time (HH:MM):', ui.ButtonSet.OK_CANCEL).getResponseText();
  const duration = ui.prompt('Schedule Lesson', 'Duration (1 or 2 Hours):', ui.ButtonSet.OK_CANCEL).getResponseText();
  const pickup = ui.prompt('Schedule Lesson', 'Pickup location:', ui.ButtonSet.OK_CANCEL).getResponseText();
  try {
    const res = apiCreateBooking({ studentId, trainerId: 'TR-201', date, time, duration, pickupLocation: pickup });
    ui.alert('Lesson Scheduled', 'Successfully booked! Booking ID: ' + res.bookingId + ' Price: €' + res.price, ui.ButtonSet.OK);
  } catch (err) {
    ui.alert('Error Scheduling', String(err), ui.ButtonSet.OK);
  }
}

// Kept as a safe compatibility helper. Calendar sync is disabled by configuration.
function createCalendarBooking() { return ''; }
function createBooking(params) { return apiCreateBooking(params); }
function completeLesson(params) { return apiCompleteLesson(params); }
function saveRoute(params) { return apiSaveRoute(params); }
function getRoute(bookingId) { return apiGetRoute(bookingId); }
