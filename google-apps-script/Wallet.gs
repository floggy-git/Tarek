/**
 * Al-Andalos Driving Academy — Digital Wallet Operations (Deposits, Ledgers & Balances)
 */

/**
 * Handles student account top-ups.
 */
function apiAddDeposit(params) {
  const studentId = params.studentId;
  const amount = Number(params.amount);
  const desc = params.description || "Cash Deposit / Balance Top-Up";

  const student = apiGetStudentDashboard(studentId).student;
  if (!student) throw new Error("Target student not registered.");

  writeTransactionRecord(student.id, student.name, "deposit", amount, desc);
  rebuildStudentBalance(student.id);

  const updatedStudent = apiGetStudentDashboard(studentId).student;

  // Send balance deposit receipt
  sendResponsiveEmail(student.email, student.name, "deposit", {
    amount,
    paymentMethod: desc,
    newBalance: updatedStudent.balance
  });

  writeAdminLog("Add Deposit API", "App API", "Credited student " + student.name + " with €" + amount);

  return { newBalance: updatedStudent.balance };
}

/**
 * ERP Admin Macro: Interactive balance top-up prompts.
 */
function menuAddDeposit() {
  const ui = SpreadsheetApp.getUi();
  const studentName = ui.prompt("Top-Up Balance", "Student full name:", ui.ButtonSet.OK_CANCEL).getResponseText();
  if (!studentName) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const students = ss.getSheetByName("Students").getDataRange().getValues();
  let studentId = "";
  for (let i = 1; i < students.length; i++) {
    if (students[i][1].toString().toLowerCase() === studentName.toLowerCase()) {
      studentId = students[i][0];
      break;
    }
  }

  if (!studentId) {
    ui.alert("Error", "Student not registered.", ui.ButtonSet.OK);
    return;
  }

  const amount = ui.prompt("Top-Up Balance", "Amount in EUR:", ui.ButtonSet.OK_CANCEL).getResponseText();
  const method = ui.prompt("Top-Up Balance", "Payment method description:", ui.ButtonSet.OK_CANCEL).getResponseText();

  try {
    const res = apiAddDeposit({
      studentId,
      amount,
      description: method
    });
    ui.alert("Success", "Credited student. New Balance: €" + res.newBalance, ui.ButtonSet.OK);
  } catch (err) {
    ui.alert("Top-Up Failed", err.toString(), ui.ButtonSet.OK);
  }
}

/**
 * Records a double-entry transaction in the WalletTransactions sheet ledger.
 */
function writeTransactionRecord(studentId, studentName, type, amount, desc) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const txSheet = ss.getSheetByName("WalletTransactions");
  const txId = "TX-" + Math.floor(Math.random() * 900000 + 100000);
  const dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  
  txSheet.appendRow([
    txId,
    studentId,
    studentName,
    dateStr,
    new Date().toLocaleTimeString(),
    type,
    amount,
    desc,
    "API"
  ]);
}

/**
 * Scans the double-entry transactions ledger and recalculates a student's total balance.
 */
function rebuildStudentBalance(studentId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const txs = ss.getSheetByName("WalletTransactions").getDataRange().getValues();
  let newBalance = 0;

  for (let i = 1; i < txs.length; i++) {
    if (txs[i][1].toString() === studentId) {
      if (txs[i][5] === "deposit") {
        newBalance += Number(txs[i][6]);
      } else if (txs[i][5] === "payment") {
        newBalance -= Number(txs[i][6]);
      }
    }
  }

  // Update students row balance
  const studentSheet = ss.getSheetByName("Students");
  const students = studentSheet.getDataRange().getValues();
  for (let i = 1; i < students.length; i++) {
    if (students[i][0].toString() === studentId) {
      studentSheet.getRange(i + 1, 8).setValue(newBalance); // Balance is column H (8)
      break;
    }
  }
}

// Global programmatic alias matching frontend calls
function addDeposit(params) { return apiAddDeposit(params); }
