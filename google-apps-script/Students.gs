/**
 * TAREK RIJSCHOOL — Student Operations.
 * Uses the canonical Students sheet headers used by the application.
 */

function studentHeaderMap_(sheet) {
  if (!sheet || sheet.getLastRow() < 1) throw new Error('Students sheet is missing or empty.');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((header, index) => { const key = String(header || '').trim().toLowerCase(); if (key) map[key] = index; });
  return map;
}

function studentCol_(map, names, required) {
  for (const name of names) {
    const index = map[String(name).toLowerCase()];
    if (index !== undefined) return index;
  }
  if (required) throw new Error('Required Students column is missing: ' + names[0]);
  return -1;
}

function apiGetStudentDashboard(identifier) {
  if (!identifier) throw new Error('Student email or ID is required.');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const studentsSheet = ss.getSheetByName('Students');
  const bookingsSheet = ss.getSheetByName('Bookings');
  const txSheet = ss.getSheetByName('WalletTransactions');
  if (!studentsSheet || !bookingsSheet || !txSheet) throw new Error('Required student sheets are missing.');

  const map = studentHeaderMap_(studentsSheet);
  const cId = studentCol_(map, ['student id'], true);
  const cName = studentCol_(map, ['name', 'full name'], true);
  const cEmail = studentCol_(map, ['email'], true);
  const cPhone = studentCol_(map, ['phone'], false);
  const cDob = studentCol_(map, ['date of birth'], false);
  const cCity = studentCol_(map, ['city'], false);
  const cPackage = studentCol_(map, ['current package'], false);
  const cBalance = studentCol_(map, ['balance (€)', 'balance'], false);
  const cReadiness = studentCol_(map, ['exam readiness (%)', 'exam readiness score'], false);
  const cStatus = studentCol_(map, ['status'], false);

  const students = studentsSheet.getDataRange().getValues();
  let student = null;
  for (let i = 1; i < students.length; i++) {
    const id = cId >= 0 ? String(students[i][cId] || '') : '';
    const email = cEmail >= 0 ? String(students[i][cEmail] || '').toLowerCase() : '';
    if (id === String(identifier) || email === String(identifier).toLowerCase()) {
      student = {
        id: cId >= 0 ? students[i][cId] : '',
        name: cName >= 0 ? students[i][cName] : '',
        email: cEmail >= 0 ? students[i][cEmail] : '',
        phone: cPhone >= 0 ? students[i][cPhone] : '',
        dob: cDob >= 0 ? students[i][cDob] : '',
        city: cCity >= 0 ? students[i][cCity] : '',
        package: cPackage >= 0 ? students[i][cPackage] : '',
        balance: cBalance >= 0 ? Number(students[i][cBalance]) || 0 : 0,
        readiness: cReadiness >= 0 ? Number(students[i][cReadiness]) || 0 : 0,
        status: cStatus >= 0 ? students[i][cStatus] : ''
      };
      break;
    }
  }
  if (!student) throw new Error('Student was not found.');

  const bookings = bookingsSheet.getDataRange().getValues();
  const studentBookings = [];
  for (let i = 1; i < bookings.length; i++) {
    if (String(bookings[i][1] || '') === String(student.id)) {
      studentBookings.push({ bookingId: bookings[i][0], trainerName: bookings[i][4], date: bookings[i][5], time: bookings[i][6], duration: Number(bookings[i][7]), price: Number(bookings[i][8]), pickup: bookings[i][9], status: bookings[i][10] });
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
  for (let i = 1; i < progressData.length; i++) if (String(progressData[i][1] || '') === String(studentId)) curriculum.push({ topic: progressData[i][4], percent: progressData[i][5], videosCompleted: Number(progressData[i][6]), videosTotal: Number(progressData[i][7]), lastUpdated: progressData[i][8] });

  const theoryData = theorySheet.getDataRange().getValues();
  const tests = [];
  for (let i = 1; i < theoryData.length; i++) if (String(theoryData[i][1] || '') === String(studentId)) tests.push({ date: theoryData[i][3], testType: theoryData[i][4], score: Number(theoryData[i][5]), total: Number(theoryData[i][6]), passed: String(theoryData[i][7] || '').toUpperCase() === 'TRUE', time: theoryData[i][8] });
  return { curriculum, tests };
}

function createStudent(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Students');
  if (!sheet) throw new Error('Students sheet is missing.');
  const map = studentHeaderMap_(sheet);
  const required = ['student id', 'name', 'email', 'phone', 'date of birth', 'city', 'current package', 'balance (€)', 'exam readiness (%)', 'status'];
  required.forEach(key => { if (map[key] === undefined) throw new Error('Canonical Students column is missing: ' + key); });

  const name = String(params && params.name || '').trim();
  if (!name) throw new Error('Student name is required.');
  const id = 'ST-' + Date.now();
  const row = new Array(sheet.getLastColumn()).fill('');
  row[map['student id']] = id;
  row[map['name']] = name;
  row[map['email']] = String(params.email || '').trim();
  row[map['phone']] = String(params.phone || '').trim();
  row[map['date of birth']] = String(params.dob || '').trim();
  row[map['city']] = String(params.city || '').trim();
  row[map['current package']] = String(params.package || '').trim();
  row[map['balance (€)']] = 0;
  row[map['exam readiness (%)']] = 0;
  row[map['status']] = 'active';
  sheet.appendRow(row);
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
