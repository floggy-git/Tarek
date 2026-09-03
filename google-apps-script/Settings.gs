/**
 * Al-Andalos Driving Academy — Settings, Sheet Initialization & Database Setup
 */

/**
 * Initializes all database tables, styles headers, applies freezing, and appends seed records.
 */
function initDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetsSpecs = {
    "Dashboard": [], // Handled by a dedicated layout function
    "Students": [
      "Student ID", "Full Name", "Email", "Phone", "Date of Birth", 
      "City", "Current Package", "Balance", "Exam Readiness Score", 
      "Joined Date", "Password", "Status", "Theory Completed", "Notifications Enabled"
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
    ],
    "SchoolSettings": [
      "name", "instructorName", "phone", "email", "address", 
      "logoUrl", "kvk", "btw", "licenseAuthority", "schoolStamp", 
      "instructorSignature", "notificationsEnabled", "lessonPricePerHour", "flexiblePackageDescription"
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

  // 2. Insert Legacy Key-Value Settings for compatibility
  const settingsSheet = ss.getSheetByName("Settings");
  if (settingsSheet.getLastRow() <= 1) {
    settingsSheet.appendRow(["HOURLY_RATE_STANDARD", "65", "Standard driving lesson price per hour"]);
    settingsSheet.appendRow(["VAT_RATE_PERCENT", "21", "Standard Dutch VAT tax for services (BTW)"]);
    settingsSheet.appendRow(["SCHOOL_NAME", "Al-Andalos Rijschool", "Official business title"]);
    settingsSheet.appendRow(["COMPANY_EMAIL", "info@al-andalos.nl", "Primary corporate correspondence mailbox"]);
  }

  // 3. Seed Modern SchoolSettings Row 2
  const schoolSettingsSheet = ss.getSheetByName("SchoolSettings");
  if (schoolSettingsSheet.getLastRow() <= 1) {
    schoolSettingsSheet.appendRow([
      "Al-Andalos Rijschool",
      "Instructeur Samir",
      "+31 6 23456789",
      "samir@al-andalos.nl",
      "Sloterdijk Station, Amsterdam",
      "", // logoUrl
      "KVK-12345678", // kvk
      "NL876543210B01", // btw
      "CBR (Centraal Bureau Rijvaardigheidsbewijzen)", // licenseAuthority
      "", // schoolStamp
      "", // instructorSignature
      "TRUE", // notificationsEnabled
      "65", // lessonPricePerHour
      "Ideal for pupils seeking maximum pacing flexibility. Top up your digital wallet, reserve single hourly blocks directly from the portal, and complete driving milestones at your own convenience." // flexiblePackageDescription
    ]);
  }

  // 4. Inject Seeds & Sample Data if Empty
  seedSampleData(ss);

  // 5. Construct a beautiful interactive Admin Dashboard
  setupDashboardSheet(ss);

  try {
    SpreadsheetApp.getUi().alert(
      "Database Initialized Successfully", 
      "All 17 sheets created, seed data loaded, and Control Dashboard designed!", 
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (err) {
    Logger.log("DB Initialized programmatically without UI: " + err.toString());
  }
}

/**
 * Feeds representative sample data sets into empty tables for testing.
 */
function seedSampleData(ss) {
  const studentsSheet = ss.getSheetByName("Students");
  if (studentsSheet.getLastRow() <= 1) {
    studentsSheet.appendRow(["ST-101", "Amir Al-Hassan", "floggyc77@gmail.com", "+31 6 12345678", "1998-05-12", "Amsterdam", "Premium 30H", 250, 75, "2026-01-10", "password123", "active", "FALSE", "TRUE"]);
    studentsSheet.appendRow(["ST-102", "Yasmin Al-Andalusi", "yasmin@example.com", "+31 6 87654321", "2001-09-24", "Rotterdam", "Standard 15H", 0, 45, "2026-03-15", "secure999", "active", "FALSE", "TRUE"]);
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

/**
 * Designs an elegant, professional visual dashboard layout with responsive formulas and command labels.
 */
function setupDashboardSheet(ss) {
  const dashboard = ss.getSheetByName("Dashboard");
  dashboard.clear();
  dashboard.setGridLines(false);

  // Set column sizes for elegant formatting
  dashboard.setColumnWidth(1, 30);  // Margin left
  dashboard.setColumnWidth(2, 160); // Card A Left
  dashboard.setColumnWidth(3, 160); // Card A Right
  dashboard.setColumnWidth(4, 40);  // Gap column
  dashboard.setColumnWidth(5, 160); // Card B Left
  dashboard.setColumnWidth(6, 160); // Card B Right
  dashboard.setColumnWidth(7, 30);  // Margin right

  // Title Banner
  const titleRange = dashboard.getRange("B2:F2");
  titleRange.merge()
    .setValue("AL-ANDALOS DRIVING ACADEMY — ADMINISTRATIVE CONTROL PANEL")
    .setFontFamily("Trebuchet MS")
    .setFontSize(14)
    .setFontWeight("bold")
    .setBackground("#0f172a") // Deep Navy
    .setFontColor("#f59e0b") // Warm Gold
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  dashboard.setRowHeight(2, 45);

  // Subheader: Metrics
  const metricsHeader = dashboard.getRange("B4:F4");
  metricsHeader.merge()
    .setValue("📊 LIVE SCHOOL PERFORMANCE METRIC CARDS")
    .setFontFamily("Trebuchet MS")
    .setFontSize(11)
    .setFontWeight("bold")
    .setBackground("#1e293b") // Soft Navy
    .setFontColor("#ffffff")
    .setHorizontalAlignment("left")
    .setVerticalAlignment("middle");
  dashboard.setRowHeight(4, 25);

  // --- CARD 1: Active Students ---
  const c1Val = dashboard.getRange("B5:C6");
  c1Val.merge()
    .setFormula(`=COUNTIF(Students!L2:L, "active")`)
    .setFontFamily("Consolas")
    .setFontSize(24)
    .setFontWeight("bold")
    .setFontColor("#0f172a")
    .setBackground("#f8fafc")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  
  const c1Lbl = dashboard.getRange("B7:C7");
  c1Lbl.merge()
    .setValue("Active Students 👤")
    .setFontFamily("Trebuchet MS")
    .setFontSize(9)
    .setFontWeight("bold")
    .setFontColor("#64748b")
    .setBackground("#f1f5f9")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  
  dashboard.getRange("B5:C7").setBorder(true, true, true, true, false, false, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);

  // --- CARD 2: Upcoming Lessons ---
  const c2Val = dashboard.getRange("E5:F6");
  c2Val.merge()
    .setFormula(`=COUNTIF(Bookings!K2:K, "upcoming")`)
    .setFontFamily("Consolas")
    .setFontSize(24)
    .setFontWeight("bold")
    .setFontColor("#1d4ed8") // Indigo Blue
    .setBackground("#f8fafc")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  
  const c2Lbl = dashboard.getRange("E7:F7");
  c2Lbl.merge()
    .setValue("Upcoming Lesson Bookings 📅")
    .setFontFamily("Trebuchet MS")
    .setFontSize(9)
    .setFontWeight("bold")
    .setFontColor("#64748b")
    .setBackground("#f1f5f9")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");

  dashboard.getRange("E5:F7").setBorder(true, true, true, true, false, false, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);

  // --- CARD 3: Gross Revenue ---
  const c3Val = dashboard.getRange("B9:C10");
  c3Val.merge()
    .setFormula(`=SUM(Invoices!K2:K)`)
    .setNumberFormat("€#,##0.00")
    .setFontFamily("Consolas")
    .setFontSize(20)
    .setFontWeight("bold")
    .setFontColor("#15803d") // Emerald Green
    .setBackground("#f8fafc")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  
  const c3Lbl = dashboard.getRange("B11:C11");
  c3Lbl.merge()
    .setValue("Gross Invoiced Revenue 💰")
    .setFontFamily("Trebuchet MS")
    .setFontSize(9)
    .setFontWeight("bold")
    .setFontColor("#64748b")
    .setBackground("#f1f5f9")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");

  dashboard.getRange("B9:C11").setBorder(true, true, true, true, false, false, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);

  // --- CARD 4: Total Wallet Deposits ---
  const c4Val = dashboard.getRange("E9:F10");
  c4Val.merge()
    .setFormula(`=SUMIF(WalletTransactions!F2:F, "deposit", WalletTransactions!G2:G)`)
    .setNumberFormat("€#,##0.00")
    .setFontFamily("Consolas")
    .setFontSize(20)
    .setFontWeight("bold")
    .setFontColor("#b45309") // Warm Amber
    .setBackground("#f8fafc")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  
  const c4Lbl = dashboard.getRange("E11:F11");
  c4Lbl.merge()
    .setValue("Total Student Wallet Deposits 💳")
    .setFontFamily("Trebuchet MS")
    .setFontSize(9)
    .setFontWeight("bold")
    .setFontColor("#64748b")
    .setBackground("#f1f5f9")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");

  dashboard.getRange("E9:F11").setBorder(true, true, true, true, false, false, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);

  // Subheader: Commands
  const cmdsHeader = dashboard.getRange("B13:F13");
  cmdsHeader.merge()
    .setValue("⚡ INTERACTIVE ACTION COMMAND PANEL")
    .setFontFamily("Trebuchet MS")
    .setFontSize(11)
    .setFontWeight("bold")
    .setBackground("#d97706") // Deep Amber
    .setFontColor("#ffffff")
    .setHorizontalAlignment("left")
    .setVerticalAlignment("middle");
  dashboard.setRowHeight(13, 25);

  // Commands info text box
  const cmdInfo = dashboard.getRange("B14:F17");
  cmdInfo.merge()
    .setValue(
      "All ERP operations should be performed via the Google Sheets application menu:\n" +
      "👉 Go to the main Google Sheets menu bar -> Click [ 🚗 Al-Andalos Control Center ]\n\n" +
      "• Open Search & Action Console 🔍 — Search pupils and lessons, mark completion, or trigger wallet deposits.\n" +
      "• Register Student / Recruit Instructor — Modern popup modals to sync database records dynamically.\n" +
      "• Schedule Lesson / Top-Up Wallet — Instant scheduling and digital financial ledger registrations."
    )
    .setFontFamily("Arial")
    .setFontSize(9.5)
    .setFontColor("#1e293b")
    .setBackground("#fffbeb") // Amber-tinted background
    .setHorizontalAlignment("left")
    .setVerticalAlignment("middle");
  cmdInfo.setBorder(true, true, true, true, false, false, "#f59e0b", SpreadsheetApp.BorderStyle.SOLID);

  // Subheader: Settings Preview
  const settingsHeader = dashboard.getRange("B19:F19");
  settingsHeader.merge()
    .setValue("⚙️ SYSTEM CONFIGURATION PREVIEW (SYNCED WITH APP)")
    .setFontFamily("Trebuchet MS")
    .setFontSize(11)
    .setFontWeight("bold")
    .setBackground("#475569") // Slate Gray
    .setFontColor("#ffffff")
    .setHorizontalAlignment("left")
    .setVerticalAlignment("middle");
  dashboard.setRowHeight(19, 25);

  // Show configured settings keys and values
  dashboard.getRange("B20").setValue("Flexible Package Hourly Rate:").setFontFamily("Arial").setFontSize(9.5).setFontWeight("bold").setFontColor("#475569");
  dashboard.getRange("C20").setFormula("=SchoolSettings!M2").setNumberFormat("€#,##0.00").setFontFamily("Consolas").setFontSize(10).setFontWeight("bold").setHorizontalAlignment("left");
  
  dashboard.getRange("B21").setValue("Flexible Package Description:").setFontFamily("Arial").setFontSize(9.5).setFontWeight("bold").setFontColor("#475569");
  dashboard.getRange("C21").setFormula("=SchoolSettings!N2").setFontFamily("Arial").setFontSize(9.5).setHorizontalAlignment("left");

  dashboard.getRange("E20").setValue("Base Admin Contact:").setFontFamily("Arial").setFontSize(9.5).setFontWeight("bold").setFontColor("#475569");
  dashboard.getRange("F20").setFormula("=SchoolSettings!D2").setFontFamily("Arial").setFontSize(9.5).setHorizontalAlignment("left");

  dashboard.getRange("E21").setValue("School Tax Number (KVK):").setFontFamily("Arial").setFontSize(9.5).setFontWeight("bold").setFontColor("#475569");
  dashboard.getRange("F21").setFormula("=SchoolSettings!G2").setFontFamily("Arial").setFontSize(9.5).setHorizontalAlignment("left");

  dashboard.getRange("B20:C21").setBorder(true, true, true, true, false, false, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
  dashboard.getRange("E20:F21").setBorder(true, true, true, true, false, false, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);

  // Footer visual hint
  const footerRange = dashboard.getRange("B23:F23");
  footerRange.merge()
    .setValue("🛡️ Al-Andalos Rijschool Driving ERP • Bidirectional Real-Time Database Sync Active")
    .setFontFamily("Arial")
    .setFontSize(8.5)
    .setFontColor("#94a3b8")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
}
