/**
 * Al-Andalos Driving Academy — Student Operations (CRUD & Reports)
 */

/**
 * Compiles student home data, transactions, lessons, and progress in one call.
 */
function apiGetStudentDashboard(identifier) {
  if (!identifier) throw new Error("Student email or ID is required.");
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const students = ss.getSheetByName("Students").getDataRange().getValues();
  let student = null;

  for (let i = 1; i < students.length; i++) {
    if (students[i][0].toString() === identifier || students[i][2].toString().toLowerCase() === identifier.toLowerCase()) {
      student = {
        id: students[i][0],
        name: students[i][1],
        email: students[i][2],
        phone: students[i][3],
        dob: students[i][4],
        city: students[i][5],
        package: students[i][6],
        balance: Number(students[i][7]),
        readiness: Number(students[i][8]),
        joinedDate: students[i][9],
        status: students[i][11]
      };
      break;
    }
  }

  if (!student) throw new Error("Student was not found.");

  // Fetch student lessons
  const bookings = ss.getSheetByName("Bookings").getDataRange().getValues();
  const studentBookings = [];
  for (let i = 1; i < bookings.length; i++) {
    if (bookings[i][1].toString() === student.id) {
      studentBookings.push({
        bookingId: bookings[i][0],
        trainerName: bookings[i][4],
        date: bookings[i][5],
        time: bookings[i][6],
        duration: Number(bookings[i][7]),
        price: Number(bookings[i][8]),
        pickup: bookings[i][9],
        status: bookings[i][10]
      });
    }
  }

  // Fetch transactions list
  const txs = ss.getSheetByName("WalletTransactions").getDataRange().getValues();
  const studentTxs = [];
  for (let i = 1; i < txs.length; i++) {
    if (txs[i][1].toString() === student.id) {
      studentTxs.push({
        txId: txs[i][0],
        date: txs[i][3],
        timestamp: txs[i][4],
        type: txs[i][5],
        amount: Number(txs[i][6]),
        desc: txs[i][7]
      });
    }
  }

  return {
    student,
    bookings: studentBookings,
    transactions: studentTxs
  };
}

/**
 * Fetches learning and theory test records for a student.
 */
function apiGetLearningProgress(studentId) {
  if (!studentId) throw new Error("Student ID required.");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const progressData = ss.getSheetByName("LearningProgress").getDataRange().getValues();
  const studentProg = [];

  for (let i = 1; i < progressData.length; i++) {
    if (progressData[i][1].toString() === studentId) {
      studentProg.push({
        topic: progressData[i][4],
        percent: progressData[i][5],
        videosCompleted: Number(progressData[i][6]),
        videosTotal: Number(progressData[i][7]),
        lastUpdated: progressData[i][8]
      });
    }
  }

  const theoryData = ss.getSheetByName("TheoryResults").getDataRange().getValues();
  const studentTheory = [];

  for (let i = 1; i < theoryData.length; i++) {
    if (theoryData[i][1].toString() === studentId) {
      studentTheory.push({
        date: theoryData[i][3],
        testType: theoryData[i][4],
        score: Number(theoryData[i][5]),
        total: Number(theoryData[i][6]),
        passed: theoryData[i][7].toString().toUpperCase() === "TRUE",
        time: theoryData[i][8]
      });
    }
  }

  return {
    curriculum: studentProg,
    tests: studentTheory
  };
}

/**
 * Programmatic helper to register a new Student.
 */
function createStudent(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const studentsSheet = ss.getSheetByName("Students");
  const id = "ST-" + (studentsSheet.getLastRow() + 100);
  const name = params.name || "Unnamed Student";
  const email = params.email || "";
  const phone = params.phone || "";
  const dob = params.dob || "";
  const city = params.city || "";
  const pkg = params.package || "Standard Manual 20H";
  const pass = params.password || "password123";
  
  studentsSheet.appendRow([
    id, name, email, phone, dob, city, pkg, 0, 0, 
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"), pass, "active"
  ]);
  
  writeAdminLog("Create Student", "System", "Successfully registered student " + name + " (" + id + ")");
  return { success: true, studentId: id, name: name };
}

/**
 * ERP Admin Macro: Adds student profile directly from Google Sheets prompts.
 */
function menuAddStudent() {
  const ui = SpreadsheetApp.getUi();
  const name = ui.prompt("Register Student", "Enter full name:", ui.ButtonSet.OK_CANCEL).getResponseText();
  if (!name) return;
  const email = ui.prompt("Register Student", "Enter email address:", ui.ButtonSet.OK_CANCEL).getResponseText();
  const phone = ui.prompt("Register Student", "Enter telephone number:", ui.ButtonSet.OK_CANCEL).getResponseText();
  const dob = ui.prompt("Register Student", "Enter DOB (YYYY-MM-DD):", ui.ButtonSet.OK_CANCEL).getResponseText();
  const city = ui.prompt("Register Student", "Enter residence city:", ui.ButtonSet.OK_CANCEL).getResponseText();

  const id = "ST-" + (SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Students").getLastRow() + 100);
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Students").appendRow([
    id, name, email, phone, dob, city, "Standard Manual 20H", 0, 0, 
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"), "password123", "active"
  ]);

  ui.alert("Success", "Registered student " + name + " with ID " + id, ui.ButtonSet.OK);
}
