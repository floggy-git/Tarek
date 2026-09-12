/* TAREK RIJSCHOOL — Google Sheets Master Control Center. */

function controlCenterHtml() {
  return HtmlService.createHtmlOutputFromFile('ControlCenter')
    .setTitle('TAREK RIJSCHOOL — Master Control Center')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function controlCenterOpen() {
  SpreadsheetApp.getUi().showSidebar(
    HtmlService.createHtmlOutputFromFile('ControlCenter').setTitle('TAREK RIJSCHOOL Control Center')
  );
}

function controlCenterGetData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
    generatedAt: new Date().toISOString(),
    dashboard: controlCenterDashboard_(ss),
    students: controlCenterRows_(ss, 'Students'),
    lessons: controlCenterRows_(ss, 'Bookings'),
    trainers: controlCenterRows_(ss, 'Trainers'),
    packages: controlCenterRows_(ss, 'Packages'),
    invoices: controlCenterRows_(ss, 'Invoices'),
    payments: controlCenterRows_(ss, 'WalletTransactions'),
    notifications: controlCenterRows_(ss, 'Notifications')
  };
}

function controlCenterDashboard_(ss) {
  const students = controlCenterRows_(ss, 'Students');
  const lessons = controlCenterRows_(ss, 'Bookings');
  const payments = controlCenterRows_(ss, 'WalletTransactions');
  const invoices = controlCenterRows_(ss, 'Invoices');
  const today = controlCenterDateKey_(new Date());
  const month = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM');
  const activeStudents = students.filter(r => ['active', 'actief', 'true', ''].includes(String(r.status || '').toLowerCase())).length;
  const todayLessons = lessons.filter(r => controlCenterDateKey_(r.date) === today).length;
  const upcomingLessons = lessons.filter(r => {
    const d = controlCenterDateKey_(r.date);
    return d && d >= today;
  }).length;
  const monthlyRevenue = payments.reduce((sum, r) => {
    const d = controlCenterDateKey_(r.date || r.timestamp);
    const amount = Number(r.amount || 0);
    return d.startsWith(month) && amount > 0 ? sum + amount : sum;
  }, 0);
  const outstandingBalance = students.reduce((sum, r) => {
    const balance = Number(r.balance || 0);
    return balance < 0 ? sum + Math.abs(balance) : sum;
  }, 0);
  return {
    totalStudents: students.length,
    activeStudents,
    todayLessons,
    upcomingLessons,
    monthlyRevenue,
    outstandingBalance,
    totalInvoices: invoices.length,
    lastSync: new Date().toISOString()
  };
}

function controlCenterRows_(ss, sheetName) {
  const sh = ss.getSheetByName(sheetName);
  if (!sh || sh.getLastRow() < 1) return [];
  const values = sh.getDataRange().getValues();
  const headers = values[0].map(h => String(h || '').trim());
  return values.slice(1).filter(row => row.some(v => v !== '')).map((row, index) => {
    const obj = { _row: index + 2, _sheet: sheetName };
    headers.forEach((h, i) => { if (h) obj[h] = row[i]; });
    obj.id = controlCenterFirst_(obj, ['ID', 'Id', 'id', 'Student ID', 'Trainer ID', 'Booking ID', 'Invoice ID', 'Transaction ID']);
    obj.studentId = controlCenterFirst_(obj, ['Student ID', 'studentId', 'student_id']);
    obj.name = controlCenterFirst_(obj, ['Name', 'Full Name', 'Student Name', 'studentName']);
    obj.email = controlCenterFirst_(obj, ['Email', 'email', 'Email Address']);
    obj.phone = controlCenterFirst_(obj, ['Phone', 'phone', 'Telephone']);
    obj.date = controlCenterFirst_(obj, ['Date', 'date', 'Lesson Date', 'Invoice Date', 'Transaction Date', 'Date Issued']);
    obj.time = controlCenterFirst_(obj, ['Time', 'time', 'Lesson Time']);
    obj.status = controlCenterFirst_(obj, ['Status', 'status']);
    obj.amount = controlCenterFirst_(obj, ['Amount', 'amount', 'Price', 'Total', 'Grand Total']);
    obj.balance = controlCenterFirst_(obj, ['Balance', 'balance', 'Outstanding']);
    return obj;
  });
}

function controlCenterFirst_(obj, keys) {
  for (const key of keys) if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== '') return obj[key];
  return '';
}

function controlCenterDateKey_(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return String(value).slice(0, 10);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function controlCenterCreateStudent(data) {
  if (!data || !String(data.name || '').trim()) throw new Error('Student name is required.');
  if (typeof createStudent !== 'function') throw new Error('createStudent() is not available.');
  return createStudent(data);
}

function controlCenterCreateBooking(data) {
  if (!data || !data.studentId) throw new Error('Student ID is required.');
  if (!data.date) throw new Error('Lesson date is required.');
  if (typeof apiCreateBooking !== 'function') throw new Error('apiCreateBooking() is not available.');
  return apiCreateBooking(data);
}

function controlCenterAddDeposit(data) {
  if (!data || !data.studentId) throw new Error('Student ID is required.');
  if (!(Number(data.amount) > 0)) throw new Error('Deposit amount must be greater than zero.');
  if (typeof apiAddDeposit !== 'function') throw new Error('apiAddDeposit() is not available.');
  return apiAddDeposit(data);
}

function controlCenterCreateInvoice(data) {
  if (!data || !data.studentId) throw new Error('Student ID is required.');
  if (typeof apiCreateInvoice !== 'function') throw new Error('apiCreateInvoice() is not available.');
  return apiCreateInvoice(data);
}

function controlCenterSendInvoice(data) {
  if (!data || !data.invoiceId) throw new Error('Invoice ID is required.');
  if (typeof apiSendInvoice !== 'function') throw new Error('apiSendInvoice() is not available.');
  return apiSendInvoice(data);
}

function controlCenterMenu_() {
  SpreadsheetApp.getUi().createMenu('🚗 TAREK RIJSCHOOL')
    .addItem('Open Master Control Center', 'controlCenterOpen')
    .addItem('Refresh Control Center Data', 'controlCenterRefresh_')
    .addToUi();
}

function controlCenterRefresh_() {
  SpreadsheetApp.getActiveSpreadsheet().toast('Control Center data refreshed.', 'TAREK RIJSCHOOL', 3);
}

function onOpen() { controlCenterMenu_(); }
