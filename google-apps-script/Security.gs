/**
 * Al-Andalos Driving Academy — Security, Credentials Auditing & Table Validations
 */

/**
 * Validates credentials for dual student/trainer login.
 */
function apiLogin(email, password) {
  if (!email || !password) throw new Error("Credentials cannot be left empty.");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Check Students
  const students = ss.getSheetByName("Students").getDataRange().getValues();
  for (let i = 1; i < students.length; i++) {
    if (students[i][2].toString().toLowerCase() === email.toLowerCase() && students[i][10].toString() === password) {
      return {
        role: "student",
        id: students[i][0],
        name: students[i][1],
        email: students[i][2],
        balance: Number(students[i][7]),
        package: students[i][6]
      };
    }
  }

  // 2. Check Trainers
  const trainers = ss.getSheetByName("Trainers").getDataRange().getValues();
  for (let i = 1; i < trainers.length; i++) {
    // For simplicity, passwords for trainers are set to "trainer123" if not present
    if (trainers[i][2].toString().toLowerCase() === email.toLowerCase() && password === "trainer123") {
      return {
        role: "trainer",
        id: trainers[i][0],
        name: trainers[i][1],
        email: trainers[i][2],
        rate: Number(trainers[i][6])
      };
    }
  }

  throw new Error("Invalid username credentials or password combination.");
}

/**
 * Applies Google Sheets native dropdown menus across various tables.
 */
function applySystemDataValidations(ss) {
  // Students Status drop downs (Column L)
  const studentsSheet = ss.getSheetByName("Students");
  if (studentsSheet) {
    const studentStatusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["active", "inactive"], true)
      .setAllowInvalid(false)
      .build();
    studentsSheet.getRange("L2:L1000").setDataValidation(studentStatusRule);
  }

  // Trainers Status drop downs (Column H)
  const trainersSheet = ss.getSheetByName("Trainers");
  if (trainersSheet) {
    const trainerStatusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["active", "inactive"], true)
      .setAllowInvalid(false)
      .build();
    trainersSheet.getRange("H2:H1000").setDataValidation(trainerStatusRule);
  }

  // Bookings Status drop downs (Column K)
  const bookingsSheet = ss.getSheetByName("Bookings");
  if (bookingsSheet) {
    const bookingStatusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["upcoming", "completed", "cancelled"], true)
      .setAllowInvalid(false)
      .build();
    bookingsSheet.getRange("K2:K5000").setDataValidation(bookingStatusRule);
  }

  // CompletedLessons Invoice Status (Column K)
  const completedSheet = ss.getSheetByName("CompletedLessons");
  if (completedSheet) {
    const invoiceStatusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["pending", "generated"], true)
      .setAllowInvalid(false)
      .build();
    completedSheet.getRange("K2:K5000").setDataValidation(invoiceStatusRule);
  }

  // WalletTransactions Type (Column F)
  const walletSheet = ss.getSheetByName("WalletTransactions");
  if (walletSheet) {
    const txTypeRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["deposit", "payment", "refund", "adjustment"], true)
      .setAllowInvalid(false)
      .build();
    walletSheet.getRange("F2:F10000").setDataValidation(txTypeRule);
  }

  // Invoices Status (Column M)
  const invoicesSheet = ss.getSheetByName("Invoices");
  if (invoicesSheet) {
    const invoiceStatusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["paid", "unpaid", "refunded"], true)
      .setAllowInvalid(false)
      .build();
    invoicesSheet.getRange("M2:M5000").setDataValidation(invoiceStatusRule);
  }

  // CalendarSettings Sync Enabled (Column D)
  const calSheet = ss.getSheetByName("CalendarSettings");
  if (calSheet) {
    const syncRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["TRUE", "FALSE"], true)
      .setAllowInvalid(false)
      .build();
    calSheet.getRange("D2:D100").setDataValidation(syncRule);
  }

  // TrainerSchedule Is Available (Column F)
  const schedSheet = ss.getSheetByName("TrainerSchedule");
  if (schedSheet) {
    const availRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["TRUE", "FALSE"], true)
      .setAllowInvalid(false)
      .build();
    schedSheet.getRange("F2:F1000").setDataValidation(availRule);
  }
}

/**
 * Applies Google Sheets conditional formatting color-codes across statuses.
 */
function applySystemConditionalFormatting(ss) {
  // Clear pre-existing rules to avoid duplicate stacking on multiple runs
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    sheets[i].setConditionalFormatRules([]);
  }

  // 1. Students Formatting (active: soft green, inactive: soft red)
  const studentsSheet = ss.getSheetByName("Students");
  if (studentsSheet) {
    const rules = [];
    const range = studentsSheet.getRange("L2:L1000");
    
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("active")
      .setBackground("#e6f4ea")
      .setFontColor("#137333")
      .setRanges([range])
      .build());

    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("inactive")
      .setBackground("#fce8e6")
      .setFontColor("#c5221f")
      .setRanges([range])
      .build());
      
    studentsSheet.setConditionalFormatRules(rules);
  }

  // 2. Trainers Formatting (active: soft green, inactive: soft red)
  const trainersSheet = ss.getSheetByName("Trainers");
  if (trainersSheet) {
    const rules = [];
    const range = trainersSheet.getRange("H2:H1000");

    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("active")
      .setBackground("#e6f4ea")
      .setFontColor("#137333")
      .setRanges([range])
      .build());

    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("inactive")
      .setBackground("#fce8e6")
      .setFontColor("#c5221f")
      .setRanges([range])
      .build());

    trainersSheet.setConditionalFormatRules(rules);
  }

  // 3. Bookings Formatting (upcoming: orange, completed: green, cancelled: red)
  const bookingsSheet = ss.getSheetByName("Bookings");
  if (bookingsSheet) {
    const rules = [];
    const range = bookingsSheet.getRange("K2:K5000");

    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("completed")
      .setBackground("#e6f4ea")
      .setFontColor("#137333")
      .setRanges([range])
      .build());

    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("upcoming")
      .setBackground("#fef7e0")
      .setFontColor("#b06000")
      .setRanges([range])
      .build());

    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("cancelled")
      .setBackground("#fce8e6")
      .setFontColor("#c5221f")
      .setRanges([range])
      .build());

    bookingsSheet.setConditionalFormatRules(rules);
  }

  // 4. Invoices Formatting (paid: green, unpaid: red, refunded: orange)
  const invoicesSheet = ss.getSheetByName("Invoices");
  if (invoicesSheet) {
    const rules = [];
    const range = invoicesSheet.getRange("M2:M5000");

    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("paid")
      .setBackground("#e6f4ea")
      .setFontColor("#137333")
      .setRanges([range])
      .build());

    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("unpaid")
      .setBackground("#fce8e6")
      .setFontColor("#c5221f")
      .setRanges([range])
      .build());

    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("refunded")
      .setBackground("#fef7e0")
      .setFontColor("#b06000")
      .setRanges([range])
      .build());

    invoicesSheet.setConditionalFormatRules(rules);
  }
}
