/**
 * TAREK RIJSCHOOL — Digital Wallet Operations.
 * Google Sheets is the ledger source of truth for wallet transactions.
 */

function apiAddDeposit(params) {
  const studentId = String(params && params.studentId || '').trim();
  const amount = Number(params && params.amount);
  const desc = String(params && params.description || 'Cash Deposit / Balance Top-Up').trim();
  if (!studentId) throw new Error('Student ID is required.');
  if (!(amount > 0)) throw new Error('Deposit amount must be greater than zero.');

  const dashboard = apiGetStudentDashboard(studentId);
  const student = dashboard && dashboard.student;
  if (!student) throw new Error('Target student not registered.');

  writeTransactionRecord(student.id, student.name, 'deposit', amount, desc);
  rebuildStudentBalance(student.id);

  const updatedStudent = apiGetStudentDashboard(studentId).student;
  if (updatedStudent.email) {
    sendResponsiveEmail(updatedStudent.email, updatedStudent.name, 'deposit', {
      amount,
      paymentMethod: desc,
      newBalance: updatedStudent.balance
    });
  }

  writeAdminLog('Add Deposit API', 'App API', 'Credited student ' + student.name + ' with €' + amount);
  return { newBalance: updatedStudent.balance };
}

function menuAddDeposit() {
  const ui = SpreadsheetApp.getUi();
  const studentName = ui.prompt('Top-Up Balance', 'Student full name:', ui.ButtonSet.OK_CANCEL).getResponseText();
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
    ui.alert('Error', 'Student not registered.', ui.ButtonSet.OK);
    return;
  }

  const amount = ui.prompt('Top-Up Balance', 'Amount in EUR:', ui.ButtonSet.OK_CANCEL).getResponseText();
  const method = ui.prompt('Top-Up Balance', 'Payment method description:', ui.ButtonSet.OK_CANCEL).getResponseText();
  try {
    const res = apiAddDeposit({ studentId, amount, description: method });
    ui.alert('Success', 'Credited student. New Balance: €' + res.newBalance, ui.ButtonSet.OK);
  } catch (err) {
    ui.alert('Top-Up Failed', String(err), ui.ButtonSet.OK);
  }
}

function writeTransactionRecord(studentId, studentName, type, amount, desc) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const txSheet = ss.getSheetByName('WalletTransactions');
  if (!txSheet) throw new Error('WalletTransactions sheet is missing.');
  const txId = 'TX-' + Date.now();
  const now = new Date();
  const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const timeStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm:ss');
  txSheet.appendRow([txId, studentId, studentName, dateStr, timeStr, type, amount, desc, 'API']);
}

function rebuildStudentBalance(studentId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const txSheet = ss.getSheetByName('WalletTransactions');
  const studentSheet = ss.getSheetByName('Students');
  if (!txSheet || !studentSheet) throw new Error('Required wallet sheets are missing.');

  const txs = txSheet.getDataRange().getValues();
  let newBalance = 0;
  for (let i = 1; i < txs.length; i++) {
    if (String(txs[i][1] || '') !== String(studentId)) continue;
    const type = String(txs[i][5] || '').toLowerCase();
    const value = Number(txs[i][6]) || 0;
    if (type === 'deposit') newBalance += value;
    else if (type === 'payment') newBalance -= value;
  }

  const students = studentSheet.getDataRange().getValues();
  for (let i = 1; i < students.length; i++) {
    if (String(students[i][0] || '') === String(studentId)) {
      studentSheet.getRange(i + 1, 8).setValue(newBalance);
      return;
    }
  }
  throw new Error('Student ' + studentId + ' was not found while rebuilding wallet balance.');
}

function addDeposit(params) { return apiAddDeposit(params); }
