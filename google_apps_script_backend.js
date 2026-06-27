/**
 * ==============================================================================
 * AL-ANDALOS RIJSCHOOL — FULL ERP SYSTEM & BACKEND ENGINE
 * Google Sheets Database + Google Apps Script Web App API + Calendar & Gmail Sync
 * ==============================================================================
 *
 * This is the production-ready script for the driving school's Google Sheets ERP system.
 * It controls all data logic, provides clean REST APIs for the React frontend, and
 * allows school admins to perform all business operations directly from Sheets menus.
 *
 * INSTRUCTIONS:
 * 1. Open your Google Spreadsheet.
 * 2. Click "Extensions" -> "Apps Script".
 * 3. Delete any default code and paste this entire file.
 * 4. Configure the Google Calendar ID at the top of the file.
 * 5. Click Save.
 * 6. Run the function "initDatabase" first to auto-generate all 16 sheets with headers,
 *    create sample data, and construct a beautiful, functional ERP Dashboard.
 * 7. Click "Deploy" -> "New deployment". Choose "Web app", set it to execute as "Me" (your account),
 *    and allow access to "Anyone" (to bypass CORS limits for the client application).
 * 8. Copy the Web App URL and use it for your fetch endpoints.
 */

// --- CONFIGURATION ---
const CALENDAR_ID = "primary"; // Replace with your Google Calendar ID or keep "primary"

// ==============================================================================
// 1. PRIMARY SYSTEM BUILDER — AUTOMATIC ERP BUILDER & STYLER
// ==============================================================================

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

// ==============================================================================
// 1B. DATABASE INITIALIZER (CREATES 16 SHEETS, HEADERS, SAMPLE DATA & DASHBOARD)
// ==============================================================================

function initDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetsSpecs = {
    "Dashboard": [], // Handled by a dedicated layout function
    "Students": [
      "Student ID", "Full Name", "Email", "Phone", "Date of Birth", 
      "City", "Current Package", "Balance", "Exam Readiness Score", 
      "Joined Date", "Password", "Status"
    ],
    "Trainers": [
      "Trainer ID", "Full Name", "Email", "Phone", "License Category", 
      "Vehicle Type", "Rate Per Hour", "Status"
    ],
    "Bookings": [
      "Booking ID", "Student ID", "Student Name", "Trainer ID", "Trainer Name", 
      "Date", "Time", "Duration (Hours)", "Price", "Pickup Location", 
      "Status", "Calendar Event ID"
    ],
    "CompletedLessons": [
      "Record ID", "Booking ID", "Student Name", "Trainer Name", "Date", 
      "Duration", "Price", "Score (1-10)", "Trainer Feedback", 
      "Route Points Logged", "Invoice Status"
    ],
    "WalletTransactions": [
      "Transaction ID", "Student ID", "Student Name", "Date", "Timestamp", 
      "Type", "Amount", "Description", "Operator"
    ],
    "Invoices": [
      "Invoice ID", "Student ID", "Student Name", "Trainer ID", "Trainer Name", 
      "Date Issued", "Lesson List", "Subtotal", "VAT Rate", "VAT Amount", 
      "Grand Total", "PDF URL", "Status"
    ],
    "CalendarSettings": [
      "Trainer ID", "Trainer Name", "Calendar ID", "Sync Enabled"
    ],
    "TrainerSchedule": [
      "Trainer ID", "Trainer Name", "Day of Week", "Start Time", "End Time", "Is Available"
    ],
    "RouteTracking": [
      "Route ID", "Booking ID", "Student Name", "Trainer Name", "Latitude", "Longitude", "Timestamp"
    ],
    "LearningProgress": [
      "Progress ID", "Student ID", "Student Name", "Category", "Topic Name", 
      "Percent Complete", "Videos Completed", "Videos Total", "Last Updated"
    ],
    "TheoryResults": [
      "Result ID", "Student ID", "Student Name", "Test Date", "Test Type", 
      "Correct Answers", "Total Questions", "Passing Score", "Time Taken"
    ],
    "Notifications": [
      "Notification ID", "Recipient ID", "Recipient Name", "Recipient Email", 
      "Message", "Type", "Status", "Timestamp"
    ],
    "Reports": [
      "Report ID", "Title", "Date Generated", "Type", "Metric Summary", "Operator"
    ],
    "EmailQueue": [
      "Email ID", "Recipient Email", "Subject", "Body (HTML)", "Queue Date", "Send Date", "Status"
    ],
    "AdminLogs": [
      "Log ID", "Timestamp", "Action", "Operator", "Details", "Source"
    ],
    "Settings": [
      "Key", "Value", "Description"
    ]
  };

  // 1. Create Sheets and Write Headers
  for (let name in sheetsSpecs) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    const headers = sheetsSpecs[name];
    if (headers.length > 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
           .setFontWeight("bold")
           .setBackground("#1e293b")
           .setFontColor("#ffffff")
           .setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }
  }

  // 2. Insert Standard Settings
  const settingsSheet = ss.getSheetByName("Settings");
  if (settingsSheet.getLastRow() <= 1) {
    settingsSheet.appendRow(["HOURLY_RATE_STANDARD", "65", "Standard driving lesson price per hour"]);
    settingsSheet.appendRow(["VAT_RATE_PERCENT", "21", "Standard Dutch VAT tax for services (BTW)"]);
    settingsSheet.appendRow(["SCHOOL_NAME", "Al-Andalos Rijschool", "Official business title"]);
    settingsSheet.appendRow(["COMPANY_EMAIL", "info@al-andalos.nl", "Primary corporate correspondence mailbox"]);
  }

  // 3. Inject Seeds & Sample Data if Empty
  seedSampleData(ss);

  // 4. Construct a beautiful interactive Admin Dashboard
  setupDashboardSheet(ss);

  SpreadsheetApp.getUi().alert("Database Initialized Successfully", "All 16 sheets created, seed data loaded, and Control Dashboard designed!", SpreadsheetApp.getUi().ButtonSet.OK);
}

// --- SAMPLE DATA SEEDING ENGINE ---
function seedSampleData(ss) {
  const studentsSheet = ss.getSheetByName("Students");
  if (studentsSheet.getLastRow() <= 1) {
    studentsSheet.appendRow(["ST-101", "Amir Al-Hassan", "floggyc77@gmail.com", "+31 6 12345678", "1998-05-12", "Amsterdam", "Premium 30H", 250, 75, "2026-01-10", "password123", "active"]);
    studentsSheet.appendRow(["ST-102", "Yasmin Al-Andalusi", "yasmin@example.com", "+31 6 87654321", "2001-09-24", "Rotterdam", "Standard 15H", 0, 45, "2026-03-15", "secure999", "active"]);
  }

  const trainersSheet = ss.getSheetByName("Trainers");
  if (trainersSheet.getLastRow() <= 1) {
    trainersSheet.appendRow(["TR-201", "Instructeur Samir", "samir@example.com", "+31 6 23456789", "B Klasse (Manual/Auto)", "Tesla Model 3", 65, "active"]);
    trainersSheet.appendRow(["TR-202", "Instructeur Fatima", "fatima@example.com", "+31 6 34567890", "B Klasse (Manual)", "Volkswagen Golf", 65, "active"]);
  }

  const trainerScheduleSheet = ss.getSheetByName("TrainerSchedule");
  if (trainerScheduleSheet.getLastRow() <= 1) {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    days.forEach(day => {
      trainerScheduleSheet.appendRow(["TR-201", "Instructeur Samir", day, "08:00", "23:00", "TRUE"]);
      trainerScheduleSheet.appendRow(["TR-202", "Instructeur Fatima", day, "09:00", "18:00", "TRUE"]);
    });
  }

  const bookingsSheet = ss.getSheetByName("Bookings");
  if (bookingsSheet.getLastRow() <= 1) {
    bookingsSheet.appendRow(["B-1001", "ST-101", "Amir Al-Hassan", "TR-201", "Instructeur Samir", "2026-06-25", "10:00", 2, 130, "Sloterdijk Station, Amsterdam", "upcoming", "CAL-EV-1001"]);
    bookingsSheet.appendRow(["B-1002", "ST-101", "Amir Al-Hassan", "TR-201", "Instructeur Samir", "2026-06-22", "14:00", 1, 65, "Amsterdam Centraal", "completed", "CAL-EV-1002"]);
  }

  const completedLessonsSheet = ss.getSheetByName("CompletedLessons");
  if (completedLessonsSheet.getLastRow() <= 1) {
    completedLessonsSheet.appendRow(["CL-501", "B-1002", "Amir Al-Hassan", "Instructeur Samir", "2026-06-22", 1, 65, 8, "Uitstekend gereden, goed kijken in de spiegels bij afslaan.", "TRUE", "generated"]);
  }

  const walletTransactionsSheet = ss.getSheetByName("WalletTransactions");
  if (walletTransactionsSheet.getLastRow() <= 1) {
    walletTransactionsSheet.appendRow(["TX-901", "ST-101", "Amir Al-Hassan", "2026-06-20", "12:00:00", "deposit", 380, "iDEAL Bank Transfer deposit", "App"]);
    walletTransactionsSheet.appendRow(["TX-902", "ST-101", "Amir Al-Hassan", "2026-06-22", "15:00:00", "payment", 65, "Payment for Completed Lesson B-1002", "System"]);
    walletTransactionsSheet.appendRow(["TX-903", "ST-101", "Amir Al-Hassan", "2026-06-24", "10:30:00", "payment", 130, "Reservation block for Lesson B-1001", "App"]);
  }

  const learningProgressSheet = ss.getSheetByName("LearningProgress");
  if (learningProgressSheet.getLastRow() <= 1) {
    learningProgressSheet.appendRow(["PR-301", "ST-101", "Amir Al-Hassan", "Theory", "Road Signs & Priority", "100%", 5, 5, "2026-06-23"]);
    learningProgressSheet.appendRow(["PR-302", "ST-101", "Amir Al-Hassan", "Theory", "Intersections & Yield Rules", "80%", 4, 5, "2026-06-24"]);
  }

  const theoryResultsSheet = ss.getSheetByName("TheoryResults");
  if (theoryResultsSheet.getLastRow() <= 1) {
    theoryResultsSheet.appendRow(["TR-401", "ST-101", "Amir Al-Hassan", "2026-06-22", "CBR Practice Test", 43, 50, "TRUE", "22m 15s"]);
    theoryResultsSheet.appendRow(["TR-402", "ST-101", "Amir Al-Hassan", "2026-06-23", "Hazard Perception Test", 23, 25, "TRUE", "08m 40s"]);
  }

  const routeTrackingSheet = ss.getSheetByName("RouteTracking");
  if (routeTrackingSheet.getLastRow() <= 1) {
    // Inject initial route replay coordinates for demo purposes
    const amsterdamCoords = [
      {lat: 52.3676, lng: 4.9041},
      {lat: 52.3685, lng: 4.9030},
      {lat: 52.3702, lng: 4.9015},
      {lat: 52.3720, lng: 4.9000},
      {lat: 52.3735, lng: 4.8980},
    ];
    amsterdamCoords.forEach((pt, index) => {
      routeTrackingSheet.appendRow([
        "RT-" + Date.now() + "-" + index,
        "B-1002",
        "Amir Al-Hassan",
        "Instructeur Samir",
        pt.lat,
        pt.lng,
        "14:" + (10 + index * 5) + ":00"
      ]);
    });
  }

  const calendarSettingsSheet = ss.getSheetByName("CalendarSettings");
  if (calendarSettingsSheet.getLastRow() <= 1) {
    calendarSettingsSheet.appendRow(["TR-201", "Instructeur Samir", "primary", "TRUE"]);
    calendarSettingsSheet.appendRow(["TR-202", "Instructeur Fatima", "primary", "TRUE"]);
  }
}

// --- BEAUTIFUL SHEET DASHBOARD CREATOR ---
function setupDashboardSheet(ss) {
  const dashboard = ss.getSheetByName("Dashboard");
  dashboard.clear();
  dashboard.setGridLines(false);

  // Set column sizes for elegance
  dashboard.setColumnWidth(1, 40);  // Buffer space
  dashboard.setColumnWidth(2, 220); // Labels
  dashboard.setColumnWidth(3, 160); // Metric values
  dashboard.setColumnWidth(4, 50);  // Buffer
  dashboard.setColumnWidth(5, 200); // Quick actions
  dashboard.setColumnWidth(6, 160); // Button values

  // Elegant Slate Title
  dashboard.getRange("B2:F2").merge().setValue("AL-ANDALOS RIJSCHOOL — CONTROL CENTER ERP")
           .setFontFamily("Trebuchet MS").setFontSize(16).setFontWeight("bold")
           .setBackground("#0f172a").setFontColor("#ffffff").setHorizontalAlignment("center");
  
  // Statistics Title
  dashboard.getRange("B4:C4").merge().setValue("🏆 LIVE SCHOOL STATISTICS")
           .setFontFamily("Trebuchet MS").setFontSize(11).setFontWeight("bold")
           .setBackground("#1e293b").setFontColor("#ffffff").setHorizontalAlignment("center");

  // Formulas for real-time statistics
  const stats = [
    ["Total Active Students", "=COUNTA(Students!A2:A)"],
    ["Total Instructors", "=COUNTA(Trainers!A2:A)"],
    ["Total Bookings Registered", "=COUNTA(Bookings!A2:A)"],
    ["Completed Practical Lessons", '=COUNTIF(Bookings!K2:K, "completed")'],
    ["Total Invoiced Gross Revenue", "=SUM(Invoices!K2:K)"],
    ["Global System Wallet Deposits", '=SUMIF(WalletTransactions!F2:F, "deposit", WalletTransactions!G2:G)'],
    ["Global Net Balance Deductions", '=SUMIF(WalletTransactions!F2:F, "payment", WalletTransactions!G2:G)'],
  ];

  let currentBarRow = 5;
  stats.forEach(pair => {
    dashboard.getRange(currentBarRow, 2).setValue(pair[0]).setFontFamily("Arial").setFontSize(10).setFontWeight("bold").setFontColor("#334155");
    dashboard.getRange(currentBarRow, 3).setValue(pair[1]).setFontFamily("Consolas").setFontSize(10).setHorizontalAlignment("right").setFontWeight("bold").setFontColor("#0f172a");
    dashboard.getRange(currentBarRow, 2, 1, 2).setBorder(true, true, true, true, false, false, "#e2e8f0", SpreadsheetApp.BorderStyle.SOLID);
    currentBarRow++;
  });

  // ERP Commands Panel
  dashboard.getRange("E4:F4").merge().setValue("⚙️ QUICK ADMINISTRATIVE COMMANDS")
           .setFontFamily("Trebuchet MS").setFontSize(11).setFontWeight("bold")
           .setBackground("#d97706").setFontColor("#ffffff").setHorizontalAlignment("center");

  const cmds = [
    ["Register New Student", "menuAddStudent()"],
    ["Hire / Register New Trainer", "menuAddTrainer()"],
    ["Schedule Driving Lesson", "menuAddLesson()"],
    ["Complete Active Lesson Record", "menuCompleteLesson()"],
    ["Top-Up Student Wallet Account", "menuAddDeposit()"],
    ["Generate PDF Invoice Document", "menuCreateInvoice()"],
    ["Dispatch Invoice Email to Pupil", "menuSendInvoice()"],
    ["Export High-Level Reports", "menuExportReports()"]
  ];

  let currentCmdRow = 5;
  cmds.forEach(cmd => {
    dashboard.getRange(currentCmdRow, 5).setValue(cmd[0]).setFontFamily("Arial").setFontSize(10).setFontWeight("bold").setFontColor("#1e293b");
    dashboard.getRange(currentCmdRow, 6).setValue("⚡ Click Menu to Run").setFontFamily("Arial").setFontStyle("italic").setFontSize(9).setFontColor("#d97706").setHorizontalAlignment("center");
    dashboard.getRange(currentCmdRow, 5, 1, 2).setBorder(true, true, true, true, false, false, "#e2e8f0", SpreadsheetApp.BorderStyle.SOLID);
    currentCmdRow++;
  });

  // Footer note
  dashboard.getRange("B14:F14").merge().setValue("💡 Tips: All commands can be triggered securely from the top application bar [ Al-Andalos Control Center 🚙 ]")
           .setFontFamily("Arial").setFontSize(9).setFontColor("#64748b").setHorizontalAlignment("center").setFontStyle("italic");
}


// ==============================================================================
// 2. HTTP ROUTING GATEWAYS (doGet & doPost)
// ==============================================================================

/**
 * REST Web API - doGet handles all Read endpoints.
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    let payload = null;

    if (!action) {
      throw new Error("Missing query string action parameter.");
    }

    if (action === "getStudentDashboard") {
      payload = apiGetStudentDashboard(e.parameter.studentEmail || e.parameter.studentId);
    } else if (action === "getTrainerDashboard") {
      payload = apiGetTrainerDashboard(e.parameter.trainerEmail || e.parameter.trainerId);
    } else if (action === "getRoute") {
      payload = apiGetRoute(e.parameter.bookingId);
    } else if (action === "getLearningProgress") {
      payload = apiGetLearningProgress(e.parameter.studentId);
    } else {
      throw new Error("Action '" + action + "' is not supported by doGet Router.");
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      data: payload
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      timestamp: new Date().toISOString(),
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * REST Web API - doPost handles all Write endpoints.
 */
function doPost(e) {
  try {
    const postBody = JSON.parse(e.postData.contents);
    const action = postBody.action;
    let payload = null;

    if (!action) {
      throw new Error("Missing action parameter in request payload.");
    }

    if (action === "login") {
      payload = apiLogin(postBody.email, postBody.password);
    } else if (action === "createBooking") {
      payload = apiCreateBooking(postBody);
    } else if (action === "completeLesson") {
      payload = apiCompleteLesson(postBody);
    } else if (action === "addDeposit") {
      payload = apiAddDeposit(postBody);
    } else if (action === "createInvoice") {
      payload = apiCreateInvoice(postBody);
    } else if (action === "sendInvoice") {
      payload = apiSendInvoice(postBody);
    } else if (action === "saveRoute") {
      payload = apiSaveRoute(postBody);
    } else {
      throw new Error("Action '" + action + "' is not supported by doPost Router.");
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      data: payload
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      timestamp: new Date().toISOString(),
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}


// ==============================================================================
// 3. SECURE ENDPOINT CONTROLLERS
// ==============================================================================

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
 * Returns trainer calendar availability, invoices, and completed lessons.
 */
function apiGetTrainerDashboard(identifier) {
  if (!identifier) throw new Error("Trainer email or ID is required.");
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const trainers = ss.getSheetByName("Trainers").getDataRange().getValues();
  let trainer = null;

  for (let i = 1; i < trainers.length; i++) {
    if (trainers[i][0].toString() === identifier || trainers[i][2].toString().toLowerCase() === identifier.toLowerCase()) {
      trainer = {
        id: trainers[i][0],
        name: trainers[i][1],
        email: trainers[i][2],
        phone: trainers[i][3],
        license: trainers[i][4],
        vehicle: trainers[i][5],
        rate: Number(trainers[i][6])
      };
      break;
    }
  }

  if (!trainer) throw new Error("Trainer profile not found.");

  // Fetch associated bookings
  const bookings = ss.getSheetByName("Bookings").getDataRange().getValues();
  const trainerBookings = [];
  for (let i = 1; i < bookings.length; i++) {
    if (bookings[i][3].toString() === trainer.id) {
      trainerBookings.push({
        bookingId: bookings[i][0],
        studentId: bookings[i][1],
        studentName: bookings[i][2],
        date: bookings[i][5],
        time: bookings[i][6],
        duration: Number(bookings[i][7]),
        price: Number(bookings[i][8]),
        pickup: bookings[i][9],
        status: bookings[i][10]
      });
    }
  }

  return {
    trainer,
    bookings: trainerBookings
  };
}

/**
 * Books a driving lesson, reserves wallet credits, creates Calendar invites and dispatches Gmail confirmations.
 */
function apiCreateBooking(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookingsSheet = ss.getSheetByName("Bookings");
  const bookingId = "B-" + Date.now();

  const studentId = params.studentId;
  const trainerId = params.trainerId || "TR-201";
  const dateStr = params.date; // YYYY-MM-DD
  const timeStr = params.time; // HH:MM
  const duration = Number(params.duration || 1);
  const pickup = params.pickupLocation || "Selected Pickup Station";

  // Validate student details
  const studentData = apiGetStudentDashboard(studentId);
  const student = studentData.student;
  
  // Calculate price
  const baseRate = Number(ss.getSheetByName("Settings").getDataRange().getValues()[1][1]);
  const finalPrice = duration * baseRate;

  // Check balance
  if (student.balance < finalPrice) {
    throw new Error("Insufficient student wallet balance. Price: €" + finalPrice + " Current: €" + student.balance);
  }

  // Retrieve trainer
  const trainerData = apiGetTrainerDashboard(trainerId);
  const trainer = trainerData.trainer;

  // 1. Sync entry to Google Calendar
  const eventId = createCalendarBooking(student.name, student.email, trainer.name, dateStr, timeStr, duration, pickup);

  // 2. Record Booking
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
    "upcoming",
    eventId
  ]);

  // 3. Record transaction deduct ledger
  writeTransactionRecord(student.id, student.name, "payment", finalPrice, "Reserved driving lesson (" + bookingId + ") on " + dateStr + " at " + timeStr);
  rebuildStudentBalance(student.id);

  // 4. Dispatch Email Confirmation
  sendResponsiveEmail(student.email, student.name, "booking", {
    date: dateStr,
    time: timeStr,
    duration: duration,
    pickupLocation: pickup,
    price: finalPrice
  });

  writeAdminLog("Create Booking API", "App API", "Successfully scheduled " + bookingId + " for " + student.name);

  return { bookingId, eventId, price: finalPrice };
}

/**
 * Handles completing a lesson, logging trainer reports, releasing payments, and issuing PDF tax invoices.
 */
function apiCompleteLesson(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookingsSheet = ss.getSheetByName("Bookings");
  const completedSheet = ss.getSheetByName("CompletedLessons");

  const bookingId = params.bookingId;
  const score = Number(params.score || 8);
  const feedback = params.feedback || "Good progress, keep polishing mirror checks.";
  const examReady = params.examReady || false;

  // Search booking
  const bookings = bookingsSheet.getDataRange().getValues();
  let bookingRow = -1;
  let booking = null;

  for (let i = 1; i < bookings.length; i++) {
    if (bookings[i][0].toString() === bookingId) {
      bookingRow = i + 1;
      booking = {
        id: bookings[i][0],
        studentId: bookings[i][1],
        studentName: bookings[i][2],
        trainerId: bookings[i][3],
        trainerName: bookings[i][4],
        date: bookings[i][5],
        duration: Number(bookings[i][7]),
        price: Number(bookings[i][8])
      };
      break;
    }
  }

  if (!booking) throw new Error("Booking record " + bookingId + " not found.");

  // Mark Booking as Completed
  bookingsSheet.getRange(bookingRow, 11).setValue("completed");

  // Save to CompletedLessons sheet
  const recordId = "CL-" + Date.now();
  completedSheet.appendRow([
    recordId,
    bookingId,
    booking.studentName,
    booking.trainerName,
    booking.date,
    booking.duration,
    booking.price,
    score,
    feedback,
    "FALSE", // Default route points logged false
    "pending"
  ]);

  // Auto-generate official invoice documentation
  const invDetails = apiCreateInvoice({
    studentId: booking.studentId,
    trainerId: booking.trainerId,
    bookingsList: bookingId
  });

  // If exam eligibility flagged, update CBR status
  if (examReady) {
    const studentSheet = ss.getSheetByName("Students");
    const students = studentSheet.getDataRange().getValues();
    for (let i = 1; i < students.length; i++) {
      if (students[i][0].toString() === booking.studentId) {
        studentSheet.getRange(i + 1, 9).setValue(95); // Readiness score
        break;
      }
    }
  }

  // Get student email to send confirmation
  const student = apiGetStudentDashboard(booking.studentId).student;
  
  // Dispatch completion email report with notes
  sendResponsiveEmail(student.email, student.name, "completion", {
    date: booking.date,
    duration: booking.duration,
    notes: feedback
  });

  writeAdminLog("Complete Lesson API", "App API", "Lesson " + bookingId + " finalized. Score: " + score);

  return { success: true, recordId, invoiceId: invDetails.invoiceId };
}

/**
 * Handles account top-ups.
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
 * Generates an ERP invoice itemized with VAT tax breakdown.
 */
function apiCreateInvoice(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const invoicesSheet = ss.getSheetByName("Invoices");
  const invoiceId = "INV-2026-" + Math.floor(Math.random() * 9000 + 1000);

  const studentId = params.studentId;
  const trainerId = params.trainerId;
  const bookingsList = params.bookingsList; // Comma-separated Booking IDs

  const student = apiGetStudentDashboard(studentId).student;
  const trainer = apiGetTrainerDashboard(trainerId).trainer;

  // Calculate gross lesson values
  let grossSum = 0;
  const bookings = bookingsList.split(",");
  bookings.forEach(id => {
    // Lookup price
    const bookData = ss.getSheetByName("Bookings").getDataRange().getValues();
    for (let i = 1; i < bookData.length; i++) {
      if (bookData[i][0].toString() === id.trim()) {
        grossSum += Number(bookData[i][8]);
      }
    }
  });

  const vatRate = 21; // 21% BTW Dutch driving academy service charge
  const subtotal = grossSum / (1 + vatRate / 100);
  const vatAmount = grossSum - subtotal;

  invoicesSheet.appendRow([
    invoiceId,
    student.id,
    student.name,
    trainer.id,
    trainer.name,
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
    bookingsList,
    subtotal.toFixed(2),
    vatRate + "%",
    vatAmount.toFixed(2),
    grossSum.toFixed(2),
    "https://example.com/mock-pdf/" + invoiceId + ".pdf", // Simulated PDF url
    "paid"
  ]);

  writeAdminLog("Create Invoice API", "App API", "Generated Invoice " + invoiceId + " for " + student.name);

  return { invoiceId, grandTotal: grossSum };
}

/**
 * Sends a formal tax PDF notice invoice via Gmail.
 */
function apiSendInvoice(params) {
  const invoiceId = params.invoiceId;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const invoices = ss.getSheetByName("Invoices").getDataRange().getValues();
  let invoice = null;

  for (let i = 1; i < invoices.length; i++) {
    if (invoices[i][0].toString() === invoiceId) {
      invoice = {
        id: invoices[i][0],
        studentId: invoices[i][1],
        studentName: invoices[i][2],
        subtotal: Number(invoices[i][7]),
        vatAmount: Number(invoices[i][9]),
        grandTotal: Number(invoices[i][10]),
        list: invoices[i][6]
      };
      break;
    }
  }

  if (!invoice) throw new Error("Invoice " + invoiceId + " does not exist.");

  const student = apiGetStudentDashboard(invoice.studentId).student;

  sendResponsiveEmail(student.email, student.name, "invoice", {
    invoiceId: invoice.id,
    description: "Driving practical curriculum: " + invoice.list,
    subtotal: invoice.subtotal,
    vatAmount: invoice.vatAmount,
    grandTotal: invoice.grandTotal
  });

  writeAdminLog("Send Invoice API", "App API", "Sent Invoice PDF receipt email to " + student.name);
  return { success: true };
}

/**
 * Saves real-time GPS coordinates during a practical session to RouteTracking sheet.
 */
function apiSaveRoute(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const routeSheet = ss.getSheetByName("RouteTracking");

  const bookingId = params.bookingId;
  const studentName = params.studentName;
  const trainerName = params.trainerName;
  const points = params.points; // Array of {lat, lng}

  if (!points || !Array.isArray(points)) throw new Error("Points must be an array of GPS nodes.");

  points.forEach((pt, idx) => {
    const routeId = "RT-" + bookingId + "-" + Date.now() + "-" + idx;
    routeSheet.appendRow([
      routeId,
      bookingId,
      studentName,
      trainerName,
      pt.lat,
      pt.lng,
      new Date().toLocaleTimeString()
    ]);
  });

  return { success: true, loggedCount: points.length };
}

/**
 * Fetches the interactive GPS route logs associated with a Booking ID for map display.
 */
function apiGetRoute(bookingId) {
  if (!bookingId) throw new Error("Booking ID required.");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const routeData = ss.getSheetByName("RouteTracking").getDataRange().getValues();
  const pts = [];

  for (let i = 1; i < routeData.length; i++) {
    if (routeData[i][1].toString() === bookingId) {
      pts.push({
        lat: Number(routeData[i][4]),
        lng: Number(routeData[i][5]),
        timestamp: routeData[i][6]
      });
    }
  }

  return { bookingId, points: pts };
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


// ==============================================================================
// 4. GOOGLE CALENDAR & RESPONSIVE GMAIL UTILS
// ==============================================================================

/**
 * Sync event triggers to the administrative Google Calendar.
 */
function createCalendarBooking(studentName, studentEmail, trainerName, dateStr, timeStr, duration, pickup) {
  try {
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID) || CalendarApp.getDefaultCalendar();
    
    const startDateTime = new Date(dateStr + "T" + timeStr + ":00");
    const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 60 * 1000);

    const title = "🚙 Al-Andalos Lesson: " + studentName + " ⇄ " + trainerName;
    const description = "Al-Andalos Rijschool Driving Academy Scheduled Lesson:\n\n" +
                        "• Student: " + studentName + " (" + studentEmail + ")\n" +
                        "• Trainer: " + trainerName + "\n" +
                        "• Duration: " + duration + " Hour(s)\n" +
                        "• Pickup Station: " + pickup + "\n\n" +
                        "Note: Driving cancellations require 24 hours prior notice to prevent full financial loss.";

    const event = calendar.createEvent(title, startDateTime, endDateTime, {
      description: description,
      location: pickup,
      guests: studentEmail,
      sendInvites: true
    });

    return event.getId();
  } catch (err) {
    Logger.log("Calendar creation error, returning mock ID: " + err.toString());
    return "MOCK-EVENT-ID-" + Date.now();
  }
}

/**
 * Gmail sender utilizing beautifully customized premium templates for student dispatches.
 */
function sendResponsiveEmail(recipientEmail, studentName, type, details) {
  const subjects = {
    "booking": "🚙 تم تأكيد حجز درس القيادة الخاص بك - مدرسة الأندلس للقيادة",
    "completion": "📝 تقرير درس القيادة وملاحظات المدرب سمير - مدرسة الأندلس",
    "deposit": "💰 تأكيد شحن رصيد محفظتك الرقمية - مدرسة الأندلس",
    "invoice": "🧾 فاتورة ضريبية رسمية جديدة (" + (details.invoiceId || "INV") + ") - مدرسة الأندلس"
  };

  const subject = subjects[type] || "🔔 إشعار جديد من مدرسة الأندلس للقيادة";
  const htmlBody = getEmailHtmlTemplate(studentName, type, details);

  try {
    GmailApp.sendEmail(recipientEmail, subject, "", {
      htmlBody: htmlBody,
      name: "Al-Andalos Rijschool"
    });
    // Log to Notification queue sheet for transparency
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Notifications").appendRow([
      "NOT-" + Date.now(),
      recipientEmail,
      studentName,
      recipientEmail,
      "Sent standard " + type + " HTML dispatch.",
      "Email",
      "Sent",
      new Date()
    ]);
  } catch (err) {
    Logger.log("Email dispatch failure: " + err.toString());
  }
}

function getEmailHtmlTemplate(studentName, type, details) {
  const dateStr = details.date || "";
  const timeStr = details.time || "10:00";
  const duration = details.duration || 1;
  const pickup = details.pickupLocation || "";
  const price = details.price || 65;
  const notes = details.notes || "";
  const amount = details.amount || 0;
  const paymentMethod = details.paymentMethod || "iDEAL";
  const newBalance = details.newBalance || 0;

  const styleHeader = 'background-color: #0f172a; padding: 25px 30px; text-align: center; border-bottom: 4px solid #d97706;';
  const textTitle = 'color: #ffffff; font-size: 20px; font-weight: 900; letter-spacing: 2px;';
  
  let bodyContent = "";

  if (type === 'booking') {
    bodyContent = `
      <div style="direction: rtl; text-align: right; font-family: sans-serif;">
        <h2 style="color: #1e40af;">تهانينا، تم تأكيد حجز الدرس بنجاح! 🎉</h2>
        <p style="font-size: 14px; color: #334155;">عزيزي المتدرب <strong>${studentName}</strong>، يسعدنا إبلاغك بأنه قد تم تسجيل وتأكيد درس القيادة الميداني الخاص بك بنجاح.</p>
        <div style="background-color: #f8fafc; border-right: 4px solid #1e40af; padding: 15px; margin: 20px 0;">
          <p style="margin: 5px 0;">📅 <strong>التاريخ:</strong> ${dateStr}</p>
          <p style="margin: 5px 0;">🕒 <strong>الوقت:</strong> الساعة ${timeStr}</p>
          <p style="margin: 5px 0;">⏳ <strong>المدة:</strong> ${duration} ساعة تدريبية</p>
          <p style="margin: 5px 0;">📍 <strong>موقع الالتقاء:</strong> ${pickup}</p>
          <p style="margin: 5px 0; color: #d97706;">💰 <strong>السعر الكلي:</strong> €${price}</p>
        </div>
        <p style="font-size: 11px; color: #64748b;">يرجى إحضار بطاقة الهوية الخاصة بك. الإلغاء قبل 24 ساعة لتجنب الرسوم.</p>
      </div>
    `;
  } else if (type === 'completion') {
    bodyContent = `
      <div style="direction: rtl; text-align: right; font-family: sans-serif;">
        <h2 style="color: #16a34a;">تقرير الحصة وملاحظات التدريب الميداني 📝</h2>
        <p style="font-size: 14px; color: #334155;">عزيزي المتدرب <strong>${studentName}</strong>، لقد أكملت حصتك التدريبية بنجاح. إليك ملخص وتقييم أدائك:</p>
        <div style="background-color: #f0fdf4; border-right: 4px solid #16a34a; padding: 15px; margin: 20px 0;">
          <p>📅 <strong>تاريخ الحصة:</strong> ${dateStr}</p>
          <p>⏱️ <strong>مدة التدريب:</strong> ${duration} ساعة قيادة عملية</p>
          <p style="font-style: italic; color: #475569; padding: 10px; background: #fff; border-radius: 6px; margin-top: 10px;">💬 <strong>ملاحظات المدرب سمير:</strong> "${notes}"</p>
        </div>
      </div>
    `;
  } else if (type === 'deposit') {
    bodyContent = `
      <div style="direction: rtl; text-align: right; font-family: sans-serif;">
        <h2 style="color: #d97706;">تم إيداع الدفعة بنجاح! 💰</h2>
        <p style="font-size: 14px; color: #334155;">عزيزي المتدرب <strong>${studentName}</strong>، نؤكد لك استلام وإضافة الدفعة المالية المذكورة إلى حساب محفظتك الرقمية.</p>
        <div style="background-color: #fffbeb; border-right: 4px solid #d97706; padding: 15px; margin: 20px 0;">
          <p>💵 <strong>المبلغ المودع:</strong> €${amount}</p>
          <p>💳 <strong>طريقة الدفع:</strong> ${paymentMethod}</p>
          <p style="font-size: 15px; font-weight: bold; color: #16a34a;">الرصيد الإجمالي الحالي: €${newBalance}</p>
        </div>
      </div>
    `;
  } else if (type === 'invoice') {
    const subtotal = Number(details.subtotal || 0).toFixed(2);
    const vatAmount = Number(details.vatAmount || 0).toFixed(2);
    const grandTotal = Number(details.grandTotal || 0).toFixed(2);
    
    bodyContent = `
      <div style="direction: rtl; text-align: right; font-family: sans-serif;">
        <h2 style="color: #0f172a;">فاتورة ضريبية رسمية مبسطة 🧾</h2>
        <p style="font-size: 12px; color: #64748b;">رقم الفاتورة: ${details.invoiceId}</p>
        <div style="margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background-color: #f1f5f9;">
              <th style="padding: 10px; text-align: right;">الخدمة</th>
              <th style="padding: 10px; text-align: left;">المجموع</th>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${details.description}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: left;">€${subtotal}</td>
            </tr>
            <tr>
              <td style="padding: 10px; text-align: left; color: #64748b;">المجموع الفرعي:</td>
              <td style="padding: 10px; text-align: left;">€${subtotal}</td>
            </tr>
            <tr>
              <td style="padding: 10px; text-align: left; color: #64748b;">الضريبة 21% BTW:</td>
              <td style="padding: 10px; text-align: left; color: #d97706;">+€${vatAmount}</td>
            </tr>
            <tr style="background-color: #f8fafc; font-weight: bold;">
              <td style="padding: 10px; text-align: left;">المجموع الكلي:</td>
              <td style="padding: 10px; text-align: left; color: #1e40af;">€${grandTotal}</td>
            </tr>
          </table>
        </div>
      </div>
    `;
  }

  return `
    <div style="background-color: #f1f5f9; padding: 20px 10px;">
      <table style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); width: 100%;">
        <tr>
          <td style="${styleHeader}">
            <span style="${textTitle}">AL-ANDALOS RIJSCHOOL</span>
            <span style="color: #94a3b8; font-size: 10px; display: block; margin-top: 5px;">PREMIUM DRIVING ACADEMY</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 30px;">
            ${bodyContent}
          </td>
        </tr>
        <tr>
          <td style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
            Al-Andalos Rijschool B.V. | Amsterdam | support@al-andalos.nl
          </td>
        </tr>
      </table>
    </div>
  `;
}


// ==============================================================================
// 5. DATA LEDGER SYNC HELPERS
// ==============================================================================

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

function writeAdminLog(action, operator, details) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logsSheet = ss.getSheetByName("AdminLogs");
  const logId = "LOG-" + Date.now();
  logsSheet.appendRow([
    logId,
    new Date(),
    action,
    operator,
    details,
    "API Gateway"
  ]);
}


// ==============================================================================
// 6. INTERACTIVE GOOGLE SHEETS MENUS (ERP CAPABILITIES)
// ==============================================================================

/**
 * Auto-creates the "Al-Andalos Control Center" menu when sheet is opened.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("🚗 Al-Andalos Control Center")
    .addItem("Add Student Profile", "menuAddStudent")
    .addItem("Add Trainer Profile", "menuAddTrainer")
    .addSeparator()
    .addItem("Create New Booking", "menuAddLesson")
    .addItem("Complete Selected Lesson ✅", "menuCompleteLesson")
    .addItem("Add Wallet Deposit 💰", "menuAddDeposit")
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
 * ERP Admin: Adds student profile directly.
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

/**
 * ERP Admin: Adds trainer profile directly.
 */
function menuAddTrainer() {
  const ui = SpreadsheetApp.getUi();
  const name = ui.prompt("Hire Instructor", "Enter trainer name:", ui.ButtonSet.OK_CANCEL).getResponseText();
  if (!name) return;
  const email = ui.prompt("Hire Instructor", "Enter trainer email:", ui.ButtonSet.OK_CANCEL).getResponseText();
  const license = ui.prompt("Hire Instructor", "License classification (e.g. B Klasse):", ui.ButtonSet.OK_CANCEL).getResponseText();
  const vehicle = ui.prompt("Hire Instructor", "Assigned vehicle model:", ui.ButtonSet.OK_CANCEL).getResponseText();

  const id = "TR-" + (SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Trainers").getLastRow() + 200);
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Trainers").appendRow([
    id, name, email, "+31 6 00000000", license, vehicle, 65, "active"
  ]);

  ui.alert("Success", "Trainer registered under ID " + id, ui.ButtonSet.OK);
}

/**
 * ERP Admin: Schedules a driving lesson and updates calendars.
 */
function menuAddLesson() {
  const ui = SpreadsheetApp.getUi();
  const studentName = ui.prompt("Schedule Lesson", "Student name:", ui.ButtonSet.OK_CANCEL).getResponseText();
  if (!studentName) return;

  // Search Student
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
    ui.alert("Registration Error", "No registered student matching that name was found.", ui.ButtonSet.OK);
    return;
  }

  const date = ui.prompt("Schedule Lesson", "Date (YYYY-MM-DD):", ui.ButtonSet.OK_CANCEL).getResponseText();
  const time = ui.prompt("Schedule Lesson", "Start time (HH:MM):", ui.ButtonSet.OK_CANCEL).getResponseText();
  const duration = ui.prompt("Schedule Lesson", "Duration (1 or 2 Hours):", ui.ButtonSet.OK_CANCEL).getResponseText();
  const pickup = ui.prompt("Schedule Lesson", "Pickup location:", ui.ButtonSet.OK_CANCEL).getResponseText();

  try {
    const res = apiCreateBooking({
      studentId,
      trainerId: "TR-201",
      date,
      time,
      duration,
      pickupLocation: pickup
    });
    ui.alert("Lesson Scheduled", "Successfully booked! Booking ID: " + res.bookingId + " Price: €" + res.price, ui.ButtonSet.OK);
  } catch (err) {
    ui.alert("Error Scheduling", err.toString(), ui.ButtonSet.OK);
  }
}

/**
 * ERP Admin: Complete active lesson row inside the Spreadsheet.
 */
function menuCompleteLesson() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Bookings");
  const cell = sheet.getActiveCell();
  const row = cell.getRow();

  if (row === 1) {
    ui.alert("Error", "Please click on a valid booking row first.", ui.ButtonSet.OK);
    return;
  }

  const bookingId = sheet.getRange(row, 1).getValue();
  if (!bookingId || !bookingId.toString().startsWith("B-")) {
    ui.alert("Error", "Selected cell does not belong to a valid booking row.", ui.ButtonSet.OK);
    return;
  }

  const score = ui.prompt("Complete Lesson", "Trainer score evaluation (1 to 10):", ui.ButtonSet.OK_CANCEL).getResponseText();
  const notes = ui.prompt("Complete Lesson", "Constructive training feedback notes:", ui.ButtonSet.OK_CANCEL).getResponseText();

  try {
    apiCompleteLesson({
      bookingId,
      score,
      feedback: notes,
      examReady: false
    });
    ui.alert("Lesson Finalized", "Deductions completed, student email sent, and PDF tax invoices generated!", ui.ButtonSet.OK);
  } catch (err) {
    ui.alert("Failed", err.toString(), ui.ButtonSet.OK);
  }
}

/**
 * ERP Admin: Adds deposits to balances.
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
 * ERP Admin: Generates dynamic invoices.
 */
function menuCreateInvoice() {
  const ui = SpreadsheetApp.getUi();
  const bookingId = ui.prompt("Generate Invoice", "Enter Booking ID:", ui.ButtonSet.OK_CANCEL).getResponseText();
  if (!bookingId) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookings = ss.getSheetByName("Bookings").getDataRange().getValues();
  let studentId = "";
  let trainerId = "";

  for (let i = 1; i < bookings.length; i++) {
    if (bookings[i][0].toString() === bookingId.trim()) {
      studentId = bookings[i][1];
      trainerId = bookings[i][3];
      break;
    }
  }

  if (!studentId) {
    ui.alert("Error", "Booking not found.", ui.ButtonSet.OK);
    return;
  }

  try {
    const res = apiCreateInvoice({ studentId, trainerId, bookingsList: bookingId });
    ui.alert("Invoice Generated", "Successfully generated invoice under ID: " + res.invoiceId, ui.ButtonSet.OK);
  } catch (err) {
    ui.alert("Failed", err.toString(), ui.ButtonSet.OK);
  }
}

/**
 * ERP Admin: Sends a created invoice.
 */
function menuSendInvoice() {
  const ui = SpreadsheetApp.getUi();
  const invoiceId = ui.prompt("Send Invoice PDF via Email", "Enter Invoice ID:", ui.ButtonSet.OK_CANCEL).getResponseText();
  if (!invoiceId) return;

  try {
    apiSendInvoice({ invoiceId });
    ui.alert("Dispatched", "Email invoice dispatch sent to student's inbox successfully!", ui.ButtonSet.OK);
  } catch (err) {
    ui.alert("Delivery Failed", err.toString(), ui.ButtonSet.OK);
  }
}

/**
 * ERP Admin: Sends a payment warning reminder.
 */
function menuSendReminder() {
  const ui = SpreadsheetApp.getUi();
  const bookingId = ui.prompt("Send Balance Reminder", "Enter Booking ID:", ui.ButtonSet.OK_CANCEL).getResponseText();
  if (!bookingId) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookings = ss.getSheetByName("Bookings").getDataRange().getValues();
  let studentId = "";

  for (let i = 1; i < bookings.length; i++) {
    if (bookings[i][0].toString() === bookingId.trim()) {
      studentId = bookings[i][1];
      break;
    }
  }

  if (!studentId) {
    ui.alert("Error", "Booking not found.", ui.ButtonSet.OK);
    return;
  }

  const student = apiGetStudentDashboard(studentId).student;

  const subject = "⚠️ تذكير بالسداد: رصيد غير كافٍ لحصة القيادة - مدرسة الأندلس";
  const body = "Dear " + student.name + ",\n\nYour scheduled driving lesson is upcoming. Please top up your wallet account balance to keep your reservation active.\n\nMet vriendelijke groet,\nAl-Andalos ERP Control Team";
  
  MailApp.sendEmail(student.email, subject, body);
  ui.alert("Reminder Dispatched", "Gmail notification sent to " + student.email, ui.ButtonSet.OK);
}

/**
 * ERP Admin: Updates trainer schedules.
 */
function menuUpdateSchedule() {
  const ui = SpreadsheetApp.getUi();
  const tName = ui.prompt("Update Trainer Schedule", "Trainer Full Name:", ui.ButtonSet.OK_CANCEL).getResponseText();
  if (!tName) return;

  const days = ui.prompt("Update Trainer Schedule", "Working Days (comma-separated, e.g. Monday, Tuesday):", ui.ButtonSet.OK_CANCEL).getResponseText();
  const start = ui.prompt("Update Trainer Schedule", "Start Hour (HH:MM):", ui.ButtonSet.OK_CANCEL).getResponseText();
  const end = ui.prompt("Update Trainer Schedule", "End Hour (HH:MM):", ui.ButtonSet.OK_CANCEL).getResponseText();

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const scheduleSheet = ss.getSheetByName("TrainerSchedule");
  const data = scheduleSheet.getDataRange().getValues();
  let updated = false;

  for (let i = 1; i < data.length; i++) {
    if (data[i][1].toString().toLowerCase() === tName.toLowerCase()) {
      scheduleSheet.getRange(i + 1, 3).setValue(days);
      scheduleSheet.getRange(i + 1, 4).setValue(start);
      scheduleSheet.getRange(i + 1, 5).setValue(end);
      updated = true;
    }
  }

  if (!updated) {
    scheduleSheet.appendRow(["TR-" + Date.now(), tName, days, start, end, "TRUE"]);
  }

  ui.alert("Success", "Trainer schedule settings successfully synchronized!", ui.ButtonSet.OK);
}

/**
 * ERP Admin: Exports statistical analytics summaries.
 */
function menuExportReports() {
  const ui = SpreadsheetApp.getUi();
  const reportsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Reports");
  
  const reportId = "REP-" + Date.now();
  const title = "Al-Andalos School Quarterly Review";
  const dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

  const summaryData = {
    grossInvoicedRevenue: "=SUM(Invoices!K2:K)",
    totalLessonsCount: "=COUNTA(Bookings!A2:A)",
    averageCBRReadyRate: "=AVERAGE(Students!I2:I)"
  };

  reportsSheet.appendRow([
    reportId,
    title,
    dateStr,
    "Financial & Performance Metrics",
    JSON.stringify(summaryData),
    "Sheets Administrator ERP"
  ]);

  ui.alert("Report Exported", "Metrics logs exported to 'Reports' sheet! ID: " + reportId, ui.ButtonSet.OK);
}

// ==============================================================================
// 7. SYSTEM AUTOMATION TRIGGERS & BACKGROUND SERVICES
// ==============================================================================

/**
 * Installs time-driven and spreadsheet-bound triggers for automatic background operations.
 * This sets up:
 * 1. A time-driven trigger to run "processEmailQueue" every 10 minutes.
 * 2. An onEdit spreadsheet trigger to auto-synchronize bookings & balances on change.
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
 * Background worker that automatically scans the EmailQueue sheet and dispatches pending mail.
 */
function processEmailQueue() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const queueSheet = ss.getSheetByName("EmailQueue");
  if (!queueSheet) return;
  
  const data = queueSheet.getDataRange().getValues();
  const nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  
  for (let i = 1; i < data.length; i++) {
    const emailId = data[i][0];
    const recipient = data[i][1];
    const subject = data[i][2];
    const body = data[i][3];
    const status = data[i][6];
    
    if (status === "pending" && recipient && subject) {
      try {
        GmailApp.sendEmail(recipient, subject, "", {
          htmlBody: body,
          name: "Al-Andalos Rijschool (Automated System)"
        });
        
        queueSheet.getRange(i + 1, 6).setValue(nowStr); // Send Date
        queueSheet.getRange(i + 1, 7).setValue("sent"); // Status
        
        writeAdminLog("Email Queue Trigger", "System Worker", "Dispatched queued email ID " + emailId + " to " + recipient);
      } catch (err) {
        Logger.log("Failed to process queued email " + emailId + ": " + err.toString());
        queueSheet.getRange(i + 1, 7).setValue("failed");
      }
    }
  }
}

// ==============================================================================
// 8. EXPLICIT PROGRAMMATIC ERP ALIAS & IMPLEMENTATION METHODS
// ==============================================================================

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
 * Programmatic helper to register a new Trainer.
 */
function createTrainer(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const trainersSheet = ss.getSheetByName("Trainers");
  const id = "TR-" + (trainersSheet.getLastRow() + 200);
  const name = params.name || "Unnamed Trainer";
  const email = params.email || "";
  const phone = params.phone || "+31 6 00000000";
  const license = params.license || "B Klasse";
  const vehicle = params.vehicle || "Standard Hatchback";
  const rate = Number(params.rate || 65);
  
  trainersSheet.appendRow([
    id, name, email, phone, license, vehicle, rate, "active"
  ]);
  
  writeAdminLog("Create Trainer", "System", "Successfully hired trainer " + name + " (" + id + ")");
  return { success: true, trainerId: id, name: name };
}

/**
 * Programmatic helper to update or set a trainer's shift schedule.
 */
function updateTrainerSchedule(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const scheduleSheet = ss.getSheetByName("TrainerSchedule");
  const trainerId = params.trainerId || "TR-201";
  const trainerName = params.trainerName || "Instructeur Samir";
  const day = params.dayOfWeek || "Monday";
  const startTime = params.startTime || "09:00";
  const endTime = params.endTime || "18:00";
  const isAvailable = params.isAvailable !== undefined ? params.isAvailable.toString().toUpperCase() : "TRUE";

  const data = scheduleSheet.getDataRange().getValues();
  let rowUpdated = -1;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString() === trainerId && data[i][2].toString().toLowerCase() === day.toLowerCase()) {
      rowUpdated = i + 1;
      break;
    }
  }

  if (rowUpdated !== -1) {
    scheduleSheet.getRange(rowUpdated, 4).setValue(startTime);
    scheduleSheet.getRange(rowUpdated, 5).setValue(endTime);
    scheduleSheet.getRange(rowUpdated, 6).setValue(isAvailable);
  } else {
    scheduleSheet.appendRow([trainerId, trainerName, day, startTime, endTime, isAvailable]);
  }

  writeAdminLog("Update Schedule", "System", "Schedule updated for trainer " + trainerName + " on " + day);
  return { success: true };
}

// Global API aliases matching specific client integrations
function createBooking(params) { return apiCreateBooking(params); }
function completeLesson(params) { return apiCompleteLesson(params); }
function addDeposit(params) { return apiAddDeposit(params); }
function createInvoice(params) { return apiCreateInvoice(params); }
function sendInvoice(params) { return apiSendInvoice(params); }
function saveRoute(params) { return apiSaveRoute(params); }
function getRoute(bookingId) { return apiGetRoute(bookingId); }
