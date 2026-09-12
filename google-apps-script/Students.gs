/**
 * TAREK RIJSCHOOL — Student Operations.
 * Authentication is handled by Firebase; Google Sheets stores profile data only.
 */

function apiGetStudentDashboard(identifier) {
  if (!identifier) throw new Error('Student email or ID is required.');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const studentsSheet = ss.getSheetByName('Students');
  const bookingsSheet = ss.getSheetByName('Bookings');
  const txSheet = ss.getSheetByName('WalletTransactions');
  if (!studentsSheet || !bookingsSheet || !txSheet) throw new Error('Required student sheets are missing.');

  const students = studentsSheet.getDataRange().getValues();
  let student = null;
  for (let i = 1; i < students.length; i++) {
    const id = String(students[i][0] || '');
    const email = String(students[i][2] || '').toLowerCase();
    if (id === String(identifier) || email === String(identifier).toLowerCase()) {
      student = {
        id: students[i][0], name: students[i][1], email: students[i][2], phone: students[i][3],
        dob: students[i][4], city: students[i][5], package: students[i][6], balance: Number(students[i][7]) || 0,
        readiness: Number(students[i][8]) || 0, joinedDate: students[i][9], status: students[i][11]
      };
      break;
    }
  }
  if (!student) throw new Error('Student was not found.');

  const bookings = bookingsSheet.getDataRange().getValues();
  const studentBookings = [];
  for (let i = 1; i < bookings.length; i++) {
    if (String(bookings[i][1] || '') === String(student.id)) {
      studentBookings.push({
        bookingId: bookings[i][0], trainerName: bookings[i][4], date: bookings[i][5], time: bookings[i][6],
        duration: Number(bookings[i][7]), price: Number(bookings[i][8]), pickup: bookings[i][9], status: bookings[i][10]
      });
    }
  }

  const txs = txSheet.getDataRange().getValues();
  const studentTxs = [];
  for (let i = 1; i < txs.length; i++) {
    if (String(txs[i][1] || '') === String(student.id)) {
      studentTxs.push({ txId: txs[i][0], date: txs[i][3], timestamp: txs[i][4], type: txs[i][5], amount: Number(txs[i][6]) || 0, desc: txs[i][7] });
    }
  }
  return { student, bookings: studentBookings, transactions: studentTxs };
}

function apiGetLearningProgress(studentId) {
  if (!studentId) throw new Error('Student ID required.');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const progressSheet = ss.getSheetByName('LearningProgress');
  const theorySheet = ss.getSheetByName('TheoryResults');
  if (!progressSheet || !theorySheet) throw new Error('Learning progress sheets are missing.');

  const progressData = progressSheet.getDataRange().getValues();
  const curriculum = [];
  for (let i = 1; i < progressData.length; i++) {
    if (String(progressData[i][1] || '') === String(studentId)) {
      curriculum.push({ topic: progressData[i][4], percent: progressData[i][5], videosCompleted: Number(progressData[i][6]), videosTotal: Number(progressData[i][7]), lastUpdated: progressData[i][8] });
    }
  }

  const theoryData = theorySheet.getDataRange().getValues();
  const tests = [];
  for (let i = 1; i < theoryData.length; i++) {
    if (String(theoryData[i][1] || '') === String(studentId)) {
      tests.push({ date: theoryData[i][3], testType: theoryData[i][4], score: Number(theoryData[i][5]), total: Number(theoryData[i][6]), passed: String(theoryData[i][7] || '').toUpperCase() === 'TRUE', time: theoryData[i][8] });
    }
  }
  return { curriculum, tests };
}

function createStudent(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Students');
  if (!sheet) throw new Error('Students sheet is missing.');
  const name = String(params && params.name || '').trim();
  if (!name) throw new Error('Student name is required.');
  const email = String(params && params.email || '').trim();
  const phone = String(params && params.phone || '').trim();
  const dob = String(params && params.dob || '').trim();
  const city = String(params && params.city || '').trim();
  const pkg = String(params && params.package || 'Standard Manual 20H').trim();
  const id = 'ST-' + Date.now();

  // Column K is retained for backwards-compatible sheet layout, but no password is stored.
  sheet.appendRow([id, name, email, phone, dob, city, pkg, 0, 0, Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'), '', 'active']);
  writeAdminLog('Create Student', 'System', 'Successfully registered student ' + name + ' (' + id + ')');
  return { success: true, studentId: id, name };
}

function menuAddStudent() {
  const ui = SpreadsheetApp.getUi();
  const name = ui.prompt('Register Student', 'Enter full name:', ui.ButtonSet.OK_CANCEL).getResponseText();
  if (!name) return;
  const email = ui.prompt('Register Student', 'Enter email address:', ui.ButtonSet.OK_CANCEL).getResponseText();
  const phone = ui.prompt('Register Student', 'Enter telephone number:', ui.ButtonSet.OK_CANCEL).getResponseText();
  const dob = ui.prompt('Register Student', 'Enter DOB (YYYY-MM-DD):', ui.ButtonSet.OK_CANCEL).getResponseText();
  const city = ui.prompt('Register Student', 'Enter residence city:', ui.ButtonSet.OK_CANCEL).getResponseText();
  try {
    const result = createStudent({ name, email, phone, dob, city });
    ui.alert('Success', 'Registered student ' + result.name + ' with ID ' + result.studentId, ui.ButtonSet.OK);
  } catch (err) {
    ui.alert('Registration Failed', String(err), ui.ButtonSet.OK);
  }
}
