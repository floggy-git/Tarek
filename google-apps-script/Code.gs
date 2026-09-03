/**
 * Al-Andalos Driving Academy — Spreadsheet Entry Points & Admin UI Controls
 */

/**
 * Auto-creates the "Al-Andalos Control Center" menu when the sheet is opened.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("🚗 Al-Andalos Control Center")
    .addItem("Search & Action Console 🔍", "menuSearchConsole")
    .addSeparator()
    .addItem("Register Student (Dialog)", "menuAddStudent")
    .addItem("Register Trainer (Dialog)", "menuAddTrainer")
    .addSeparator()
    .addItem("Create Booking (Dialog)", "menuAddLesson")
    .addItem("Add Wallet Deposit (Dialog)", "menuAddDeposit")
    .addItem("Complete Selected Lesson ✅", "menuCompleteLesson")
    .addSeparator()
    .addItem("Generate Invoice Document", "menuCreateInvoice")
    .addItem("Send Pending Invoice Email 🧾", "menuSendInvoice")
    .addItem("Send Lack-of-Balance Reminder ⚠️", "menuSendReminder")
    .addItem("Update Trainer Schedule Settings ⚙️", "menuUpdateSchedule")
    .addSeparator()
    .addItem("Export High-Level Reports 📊", "menuExportReports")
    .addToUi();
}

/**
 * Main database setup macro called programmatically or via button.
 */
function setupSchoolDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Run the core initializer (Creates 16 sheets, headers, default setting keys, and populates mock data)
  initDatabase();
  
  // 2. Establish Data Validation Rules (Dropdown lists) across the tables
  applySystemDataValidations(ss);
  
  // 3. Establish Conditional Formatting rules to highlight status codes automatically
  applySystemConditionalFormatting(ss);
  
  // 4. Send visual confirmation
  try {
    SpreadsheetApp.getUi().alert(
      "Al-Andalos ERP Database Setup Complete! 🚙", 
      "All sheets have been successfully styled, headers frozen, dummy rows seeded, interactive live formulas bound, dropdown validation menus configured, and automatic color-coding set up!", 
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (e) {
    Logger.log("UI alert not available. Setup ran programmatically: " + e.toString());
  }
}

/**
 * Trigger handler that runs on cell edits to keep balances, dashboards, and calendar schedules aligned.
 */
function onEditTriggerHandler(e) {
  if (!e) return;
  const range = e.range;
  const sheet = range.getSheet();
  const sheetName = sheet.getName();
  
  // If edited in WalletTransactions, rebuild the student balance
  if (sheetName === "WalletTransactions") {
    const row = range.getRow();
    if (row > 1) {
      const studentId = sheet.getRange(row, 2).getValue();
      if (studentId) {
        rebuildStudentBalance(studentId);
      }
    }
    setupDashboardSheet(SpreadsheetApp.getActiveSpreadsheet());
  }
  
  // If edited in Bookings, Invoices, or Students, refresh Dashboard statistics
  if (sheetName === "Bookings" || sheetName === "Invoices" || sheetName === "Students") {
    setupDashboardSheet(SpreadsheetApp.getActiveSpreadsheet());
  }
}

/**
 * Installs time-driven and spreadsheet-bound triggers for automatic background operations.
 */
function installTriggers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Delete existing triggers first to prevent duplicates
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  
  // 1. Create a Time-driven trigger for processing the Email Queue every 10 minutes
  ScriptApp.newTrigger("processEmailQueue")
    .timeBased()
    .everyMinutes(10)
    .create();
    
  // 2. Create an onEdit trigger for automatic dashboard and data sync on edit
  ScriptApp.newTrigger("onEditTriggerHandler")
    .forSpreadsheet(ss)
    .onEdit()
    .create();

  try {
    SpreadsheetApp.getUi().alert(
      "Triggers Installed Successfully! ⚙️",
      "Automated system triggers are now active:\n" +
      "• Email Queue will process every 10 minutes.\n" +
      "• Spreadsheet modifications will auto-synchronize balances and update the Dashboard.",
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (e) {
    Logger.log("Triggers installed programmatically: " + e.toString());
  }
}

/* ==========================================
   INTERACTIVE HTML SERVICE DIALOG TRIGGERS
   ========================================== */

/**
 * Opens the Interactive Administrative Search Console Sidebar.
 */
function menuSearchConsole() {
  const html = HtmlService.createHtmlOutputFromFile('SearchConsoleDialog')
      .setWidth(750)
      .setHeight(600)
      .setTitle('Al-Andalos ERP — Search & Control Console');
  SpreadsheetApp.getUi().showModalDialog(html, ' ');
}

/**
 * Opens Register Student Modal Dialog.
 */
function menuAddStudent() {
  const html = HtmlService.createHtmlOutputFromFile('AddStudentDialog')
      .setWidth(500)
      .setHeight(550)
      .setTitle('Al-Andalos ERP — Register Student');
  SpreadsheetApp.getUi().showModalDialog(html, ' ');
}

/**
 * Opens Hire Trainer Modal Dialog.
 */
function menuAddTrainer() {
  const html = HtmlService.createHtmlOutputFromFile('AddTrainerDialog')
      .setWidth(500)
      .setHeight(500)
      .setTitle('Al-Andalos ERP — Recruit Instructor');
  SpreadsheetApp.getUi().showModalDialog(html, ' ');
}

/**
 * Opens Schedule Lesson Modal Dialog.
 */
function menuAddLesson() {
  const html = HtmlService.createHtmlOutputFromFile('AddLessonDialog')
      .setWidth(500)
      .setHeight(550)
      .setTitle('Al-Andalos ERP — Schedule Driving Lesson');
  SpreadsheetApp.getUi().showModalDialog(html, ' ');
}

/**
 * Opens Wallet Top-Up Modal Dialog.
 */
function menuAddDeposit() {
  const html = HtmlService.createHtmlOutputFromFile('AddDepositDialog')
      .setWidth(500)
      .setHeight(450)
      .setTitle('Al-Andalos ERP — Student Wallet Top-Up');
  SpreadsheetApp.getUi().showModalDialog(html, ' ');
}

/* ==========================================
   PROGRAMMATIC ENDPOINTS FOR DYNAMIC FORMS
   ========================================== */

/**
 * Fetches lists of active student IDs/Names and Trainer IDs/Names for Dialog dropdowns.
 */
function apiGetStudentsAndTrainers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Students
  const studentsSheet = ss.getSheetByName("Students");
  const studentsData = studentsSheet.getDataRange().getValues();
  const students = [];
  for (let i = 1; i < studentsData.length; i++) {
    if (studentsData[i][0]) {
      students.push({
        id: studentsData[i][0].toString(),
        name: studentsData[i][1].toString(),
        balance: Number(studentsData[i][7] || 0)
      });
    }
  }

  // Trainers
  const trainersSheet = ss.getSheetByName("Trainers");
  const trainersData = trainersSheet.getDataRange().getValues();
  const trainers = [];
  for (let i = 1; i < trainersData.length; i++) {
    if (trainersData[i][0]) {
      trainers.push({
        id: trainersData[i][0].toString(),
        name: trainersData[i][1].toString()
      });
    }
  }

  return { students, trainers };
}

/**
 * Compiles all Student Records and Bookings for real-time console search/filtering.
 */
function apiGetAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Students
  const studentsSheet = ss.getSheetByName("Students");
  const studentsData = studentsSheet.getDataRange().getValues();
  const students = [];
  for (let i = 1; i < studentsData.length; i++) {
    if (studentsData[i][0]) {
      students.push({
        id: studentsData[i][0].toString(),
        name: studentsData[i][1].toString(),
        email: studentsData[i][2].toString(),
        phone: studentsData[i][3].toString(),
        city: studentsData[i][5].toString(),
        package: studentsData[i][6].toString(),
        balance: Number(studentsData[i][7] || 0),
        status: studentsData[i][11].toString()
      });
    }
  }

  // Bookings
  const bookingsSheet = ss.getSheetByName("Bookings");
  const bookingsData = bookingsSheet.getDataRange().getValues();
  const bookings = [];
  for (let i = 1; i < bookingsData.length; i++) {
    if (bookingsData[i][0]) {
      bookings.push({
        bookingId: bookingsData[i][0].toString(),
        studentId: bookingsData[i][1].toString(),
        studentName: bookingsData[i][2].toString(),
        trainerId: bookingsData[i][3].toString(),
        trainerName: bookingsData[i][4].toString(),
        date: bookingsData[i][5] instanceof Date ? Utilities.formatDate(bookingsData[i][5], Session.getScriptTimeZone(), "yyyy-MM-dd") : bookingsData[i][5].toString(),
        time: bookingsData[i][6].toString(),
        duration: Number(bookingsData[i][7] || 0),
        pickup: bookingsData[i][9].toString(),
        status: bookingsData[i][10].toString()
      });
    }
  }

  return { students, bookings };
}

/**
 * Wrapper to credit student funds via Wallet dialog form.
 */
function apiAddWalletDeposit(params) {
  return apiAddDeposit(params);
}

/**
 * Completes a booking programmatically from the Search Console action.
 */
function apiCompleteBookingProgrammatic(bookingId) {
  return apiCompleteLesson({
    bookingId: bookingId,
    score: 8,
    feedback: "Completed via Administrative ERP Command Search Console.",
    examReady: false
  });
}

/**
 * Quick top-up trigger triggered directly from Search Console row.
 */
function menuAddDepositFromId(studentId) {
  const ui = SpreadsheetApp.getUi();
  const amount = ui.prompt("Top-Up Wallet Balance", "Enter deposit amount in EUR (€):", ui.ButtonSet.OK_CANCEL).getResponseText();
  if (!amount) return;
  const method = ui.prompt("Top-Up Wallet Balance", "Enter payment reference/method (e.g. Cash, iDEAL):", ui.ButtonSet.OK_CANCEL).getResponseText();
  if (!method) return;

  try {
    const res = apiAddDeposit({
      studentId: studentId,
      amount: Number(amount),
      description: method
    });
    ui.alert("Top-Up Success ✅", "Credited student wallet with €" + amount + ". Total Balance is now €" + res.newBalance, ui.ButtonSet.OK);
  } catch(err) {
    ui.alert("Top-Up Failed ❌", err.toString(), ui.ButtonSet.OK);
  }
}
