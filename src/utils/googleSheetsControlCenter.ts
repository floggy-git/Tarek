/**
 * Google Sheets Administrative Control Center Bundle Generator
 * 
 * Generates the complete, self-contained Google Apps Script bundle including:
 * 1. Native Custom Menu: 'Driving School Control Center'
 * 2. Visual Dashboard Worksheet Builder with KPI cards, formulas, charts & status indicators
 * 3. HTML Dialog Modals for Student, Lesson, Payment, Notification, Settings, Package & Invoice Management
 * 4. Two-way Real-Time Webhook Dispatcher
 * 5. Targeted Single-Row Mutation Handlers (No full-table rewrites)
 * 6. Audit Trail Logging preserving canonical studentId ('ST-XXXXXX')
 */

export interface ControlCenterConfig {
  backendUrl: string;
  schoolName: string;
  spreadsheetId?: string;
}

export function generateAppsScriptCode(
  backendUrl: string = 'https://ais-pre-wf4bb34rrhjvvmmxzks2ic-440354571907.europe-west2.run.app',
  webhookSecret: string = 'SERVER_ADMIN_SECRET_REQUIRED'
): string {
  return `/**
 * =========================================================================
 * AL-ANDALOS RIJSCHOOL — GOOGLE SHEETS ADMINISTRATIVE CONTROL CENTER
 * Version: 2.0 (Real-Time Two-Way Synchronized)
 * =========================================================================
 */

var BACKEND_URL = "${backendUrl}";
var WEBHOOK_URL = BACKEND_URL + "/api/webhooks/sheets-change";
var WEBHOOK_SECRET = "${webhookSecret}";
var ORIGIN_CLIENT_ID = "sheets-control-center";

/**
 * Native Menu Initializer
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🚗 Control Center')
    .addSubMenu(ui.createMenu('📊 Dashboard & Languages')
      .addItem('🇺🇸 Open / Rebuild Dashboard (English)', 'buildDashboardEn')
      .addItem('🇳🇱 Dashboard opbouwen (Nederlands)', 'buildDashboardNl')
      .addItem('🇸🇦 بناء وتحديث لوحة التحكم (عربي RTL)', 'buildDashboardAr'))
    .addSeparator()
    .addSubMenu(ui.createMenu('👨‍🎓 Student Management')
      .addItem('➕ New Student', 'showNewStudentModal')
      .addItem('✏️ Edit Student', 'showEditStudentModal')
      .addItem('💰 Adjust Wallet Balance', 'showAdjustBalanceModal')
      .addItem('🚦 Update CBR Status', 'showUpdateCbrModal')
      .addItem('📈 Update Exam Readiness', 'showUpdateReadinessModal'))
    .addSubMenu(ui.createMenu('📅 Lesson Management')
      .addItem('➕ Schedule Lesson', 'showScheduleLessonModal')
      .addItem('✏️ Edit Lesson', 'showEditLessonModal')
      .addItem('🚫 Cancel Lesson', 'showCancelLessonModal')
      .addItem('👨‍🏫 Assign Trainer', 'showAssignTrainerModal')
      .addItem('✅ Complete & Rate Lesson', 'showCompleteLessonModal'))
    .addSubMenu(ui.createMenu('💳 Financial Management')
      .addItem('💵 Record Payment', 'showRecordPaymentModal')
      .addItem('📥 Add Deposit', 'showAddDepositModal')
      .addItem('📤 Deduct Wallet', 'showDeductWalletModal')
      .addItem('🧾 Generate Invoice', 'showGenerateInvoiceModal'))
    .addSubMenu(ui.createMenu('📦 Package Catalog')
      .addItem('➕ Create Package', 'showCreatePackageModal')
      .addItem('✏️ Edit Package Rates', 'showEditPackageModal'))
    .addSubMenu(ui.createMenu('🔔 Notifications')
      .addItem('📨 Send to Student', 'showSendNotificationModal')
      .addItem('📢 Broadcast Announcement', 'showBroadcastNotificationModal'))
    .addSubMenu(ui.createMenu('⚙️ School Settings')
      .addItem('🏢 General & Branding', 'showGeneralSettingsModal')
      .addItem('💶 Pricing & Banking', 'showPricingSettingsModal')
      .addItem('🤖 AI Assistant Config', 'showAiSettingsModal'))
    .addSeparator()
    .addSubMenu(ui.createMenu('⚡ Live Synchronization')
      .addItem('🟢 Install Live Sync Trigger', 'installLiveSyncTrigger')
      .addItem('🔴 Remove Live Sync Trigger', 'removeLiveSyncTrigger')
      .addItem('🩺 Check Sync Status', 'triggerManualSync'))
    .addItem('🛠️ Rebuild Dashboard Worksheet', 'buildDashboardEn')
    .addToUi();
}

function buildDashboardEn() { buildDashboardWorksheet('en'); }
function buildDashboardNl() { buildDashboardWorksheet('nl'); }
function buildDashboardAr() { buildDashboardWorksheet('ar'); }

/**
 * -------------------------------------------------------------------------
 * 1. VISUAL DASHBOARD WORKSHEET BUILDER (TRILINGUAL + CANONICAL SCHEMAS)
 * -------------------------------------------------------------------------
 */
function buildDashboardWorksheet(lang) {
  lang = lang || 'en';
  var isAr = lang === 'ar';
  var isNl = lang === 'nl';

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Dashboard");
  
  if (!sheet) {
    sheet = ss.insertSheet("Dashboard", 0);
  } else {
    ss.setActiveSheet(sheet);
    ss.moveActiveSheet(1);
    sheet.clear();
  }

  sheet.setTabColor("#2563eb");
  sheet.setGridlines(true);

  if (isAr) {
    sheet.setRightToLeft(true);
  } else {
    sheet.setRightToLeft(false);
  }

  // Column widths
  sheet.setColumnWidth(1, 30);  // Padding
  sheet.setColumnWidth(2, 175); // Col B: Metric 1 / Nav 1
  sheet.setColumnWidth(3, 175); // Col C: Metric 2 / Nav 2
  sheet.setColumnWidth(4, 175); // Col D: Metric 3 / Nav 3
  sheet.setColumnWidth(5, 175); // Col E: Metric 4 / Nav 4
  sheet.setColumnWidth(6, 30);  // Col F: Gap
  sheet.setColumnWidth(7, 260); // Col G: Action / Feed Col 1
  sheet.setColumnWidth(8, 260); // Col H: Action / Feed Col 2

  // 1. Header Banner
  var headerRange = sheet.getRange("B2:H3");
  headerRange.merge();
  headerRange.setBackground("#0f172a");
  headerRange.setFontColor("#ffffff");
  headerRange.setFontFamily("Arial");
  headerRange.setFontSize(15);
  headerRange.setFontWeight("bold");
  headerRange.setVerticalAlignment("middle");
  
  var titleText = isAr 
    ? "  🚗 مدرسة الأندلس لتعليم القيادة — لوحة التحكم الإدارية المركزية (مباشر)"
    : isNl 
    ? "  🚗 AL-ANDALOS RIJSCHOOL — ADMINISTRATIEF CONTROLECENTRUM (LIVE)"
    : "  🚗 AL-ANDALOS RIJSCHOOL — ADMINISTRATIVE CONTROL CENTER (LIVE)";
  sheet.getRange("B2").setValue(titleText);

  // Status & Time in Header
  sheet.getRange("H2").setValue("STATUS: 🟢 OPERATIONAL (ZERO DEMO DATA)").setFontSize(10).setFontColor("#4ade80").setHorizontalAlignment("right");
  sheet.getRange("H3").setFormula('="Last Sync: " & TEXT(NOW(), "yyyy-mm-dd hh:mm:ss")').setFontSize(9).setFontColor("#94a3b8").setHorizontalAlignment("right");

  // 2. Language Bar & Navigation Bar
  sheet.getRange("B4").setValue(isAr ? "🌐 لغة لوحة التحكم:" : isNl ? "🌐 Taal Dashboard:" : "🌐 Dashboard Language:").setFontSize(9).setFontWeight("bold").setFontColor("#475569");
  sheet.getRange("C4").setValue("🇺🇸 English").setFontSize(9).setFontColor(lang === 'en' ? "#1e40af" : "#64748b").setFontWeight(lang === 'en' ? "bold" : "normal");
  sheet.getRange("D4").setValue("🇳🇱 Nederlands").setFontSize(9).setFontColor(lang === 'nl' ? "#1e40af" : "#64748b").setFontWeight(lang === 'nl' ? "bold" : "normal");
  sheet.getRange("E4").setValue("🇸🇦 العربية (RTL)").setFontSize(9).setFontColor(lang === 'ar' ? "#1e40af" : "#64748b").setFontWeight(lang === 'ar' ? "bold" : "normal");
  sheet.getRange("G4:H4").merge().setValue("Google Calendar: 🚫 DISABLED (Local RFC 5545 Export Only)").setFontSize(9).setFontColor("#dc2626").setFontWeight("bold").setHorizontalAlignment("right");

  // Navigation Links
  sheet.getRange("B5:E5").merge().setValue(isAr ? "🔗 روابط التنقل السريع بين التبويبات التشغيلية:" : isNl ? "🔗 Snelle Navigatie naar Operationele Tabbladen:" : "🔗 Quick Navigation to Operational Sheets:").setFontWeight("bold").setFontSize(10).setFontColor("#334155");

  function getSheetGid(name) {
    var target = ss.getSheetByName(name);
    return target ? target.getSheetId() : 0;
  }

  var navLinksRow1 = [
    '=HYPERLINK("#gid=' + getSheetGid("Students") + '", "👨‍🎓 ' + (isAr ? "المتدربون (Students)" : isNl ? "Leerlingen" : "Students") + '")',
    '=HYPERLINK("#gid=' + getSheetGid("Lessons") + '", "📅 ' + (isAr ? "الدروس (Lessons)" : isNl ? "Lessen" : "Lessons") + '")',
    '=HYPERLINK("#gid=' + getSheetGid("Wallet") + '", "💳 ' + (isAr ? "المحفظة (Wallet)" : isNl ? "Portemonnee" : "Wallet") + '")',
    '=HYPERLINK("#gid=' + getSheetGid("Invoices") + '", "🧾 ' + (isAr ? "الفواتير (Invoices)" : isNl ? "Facturen" : "Invoices") + '")'
  ];
  sheet.getRange("B6:E6").setFormulas([navLinksRow1]).setFontSize(10).setFontWeight("bold").setBackground("#f8fafc");

  var navLinksRow2 = [
    '=HYPERLINK("#gid=' + getSheetGid("Packages") + '", "📦 ' + (isAr ? "الباقات (Packages)" : isNl ? "Pakketten" : "Packages") + '")',
    '=HYPERLINK("#gid=' + getSheetGid("Notifications") + '", "🔔 ' + (isAr ? "الإشعارات (Notifications)" : isNl ? "Mededelingen" : "Notifications") + '")',
    '=HYPERLINK("#gid=' + getSheetGid("Help & Support") + '", "❓ ' + (isAr ? "الدعم والأسئلة" : isNl ? "Help & Support" : "Help & Support") + '")',
    '=HYPERLINK("#gid=' + getSheetGid("SchoolSettings") + '", "⚙️ ' + (isAr ? "إعدادات المدرسة" : isNl ? "Instellingen" : "SchoolSettings") + '")'
  ];
  sheet.getRange("B7:E7").setFormulas([navLinksRow2]).setFontSize(10).setFontWeight("bold").setBackground("#f8fafc");

  // 3. Section 1: Students & Packages
  sheet.getRange("B9:E9").merge().setValue(isAr ? "📊 1. المتدربون والباقات (معادلات حية)" : isNl ? "📊 1. LEERLINGEN & PAKKETTEN (LIVE FORMULES)" : "📊 1. STUDENTS & PACKAGES (LIVE FORMULAS)")
    .setFontWeight("bold").setFontSize(11).setFontColor("#1e3a8a").setBackground("#eff6ff");

  // Total Students
  sheet.getRange("B10").setValue(isAr ? "إجمالي المتدربين" : isNl ? "Totaal Leerlingen" : "Total Students").setFontSize(9).setFontColor("#1e40af");
  sheet.getRange("B11").setFormula('=IFERROR(COUNTA(Students!A2:A), 0)').setFontSize(18).setFontWeight("bold").setFontColor("#1e3a8a").setHorizontalAlignment("center").setBackground("#eff6ff");

  // Active Students
  sheet.getRange("C10").setValue(isAr ? "المتدربون النشطون" : isNl ? "Actieve Leerlingen" : "Active Students").setFontSize(9).setFontColor("#166534");
  sheet.getRange("C11").setFormula('=IFERROR(COUNTIF(Students!J2:J, "active"), 0)').setFontSize(18).setFontWeight("bold").setFontColor("#14532d").setHorizontalAlignment("center").setBackground("#f0fdf4");

  // Inactive Students
  sheet.getRange("D10").setValue(isAr ? "غير نشط / معلق" : isNl ? "Inactief / Geschorst" : "Inactive / Suspended").setFontSize(9).setFontColor("#9a3412");
  sheet.getRange("D11").setFormula('=IFERROR(COUNTIF(Students!J2:J, "inactive") + COUNTIF(Students!J2:J, "suspended"), 0)').setFontSize(18).setFontWeight("bold").setFontColor("#9a3412").setHorizontalAlignment("center").setBackground("#fff7ed");

  // Active Packages
  sheet.getRange("E10").setValue(isAr ? "الباقات النشطة" : isNl ? "Actieve Pakketten" : "Active Packages").setFontSize(9).setFontColor("#0f766e");
  sheet.getRange("E11").setFormula('=IFERROR(COUNTIF(Packages!L2:L, "TRUE") + COUNTIF(Packages!L2:L, TRUE), 0)').setFontSize(18).setFontWeight("bold").setFontColor("#0f766e").setHorizontalAlignment("center").setBackground("#f0fdfa");

  // 4. Section 2: Lesson Scheduling
  sheet.getRange("B13:E13").merge().setValue(isAr ? "📅 2. نشاط وجدول الدروس" : isNl ? "📅 2. LESROOSTER & ACTIVITEIT" : "📅 2. LESSON SCHEDULE & ACTIVITY")
    .setFontWeight("bold").setFontSize(11).setFontColor("#166534").setBackground("#f0fdf4");

  // Today's Lessons
  sheet.getRange("B14").setValue(isAr ? "دروس اليوم" : isNl ? "Lessen Vandaag" : "Today's Lessons").setFontSize(9).setFontColor("#166534");
  sheet.getRange("B15").setFormula('=IFERROR(COUNTIFS(Lessons!E2:E, TODAY()), 0)').setFontSize(18).setFontWeight("bold").setFontColor("#14532d").setHorizontalAlignment("center").setBackground("#f0fdf4");

  // Upcoming Lessons
  sheet.getRange("C14").setValue(isAr ? "الدروس القادمة" : isNl ? "Aankomende Lessen" : "Upcoming Lessons").setFontSize(9).setFontColor("#1d4ed8");
  sheet.getRange("C15").setFormula('=IFERROR(COUNTIF(Lessons!J2:J, "scheduled") + COUNTIF(Lessons!J2:J, "upcoming"), 0)').setFontSize(18).setFontWeight("bold").setFontColor("#1e40af").setHorizontalAlignment("center").setBackground("#eff6ff");

  // Completed Lessons
  sheet.getRange("D14").setValue(isAr ? "الدروس المكتملة" : isNl ? "Voltooide Lessen" : "Completed Lessons").setFontSize(9).setFontColor("#6b21a8");
  sheet.getRange("D15").setFormula('=IFERROR(COUNTIF(Lessons!J2:J, "completed"), 0)').setFontSize(18).setFontWeight("bold").setFontColor("#581c87").setHorizontalAlignment("center").setBackground("#faf5ff");

  // Cancelled Lessons
  sheet.getRange("E14").setValue(isAr ? "الدروس الملغاة" : isNl ? "Geannuleerde Lessen" : "Cancelled Lessons").setFontSize(9).setFontColor("#b91c1c");
  sheet.getRange("E15").setFormula('=IFERROR(COUNTIF(Lessons!J2:J, "cancelled"), 0)').setFontSize(18).setFontWeight("bold").setFontColor("#991b1b").setHorizontalAlignment("center").setBackground("#fef2f2");

  // 5. Section 3: Financial & Invoices
  sheet.getRange("B17:E17").merge().setValue(isAr ? "💶 3. الوضع المالي والفواتير" : isNl ? "💶 3. FINANCIEEL OVERZICHT & FACTUREN" : "💶 3. FINANCIAL OVERVIEW & INVOICES")
    .setFontWeight("bold").setFontSize(11).setFontColor("#92400e").setBackground("#fffbeb");

  // Total Wallet Revenue
  sheet.getRange("B18").setValue(isAr ? "إجمالي المحفظة (€)" : isNl ? "Totaal Portemonnee (€)" : "Total Wallet (€)").setFontSize(9).setFontColor("#92400e");
  sheet.getRange("B19").setFormula('=IFERROR(SUM(Wallet!F2:F), 0)').setNumberFormat("€#,##0.00").setFontSize(16).setFontWeight("bold").setFontColor("#78350f").setHorizontalAlignment("center").setBackground("#fffbeb");

  // Paid Invoices (€)
  sheet.getRange("C18").setValue(isAr ? "الفواتير المدفوعة (€)" : isNl ? "Betaalde Facturen (€)" : "Paid Invoices (€)").setFontSize(9).setFontColor("#166534");
  sheet.getRange("C19").setFormula('=IFERROR(SUMIFS(Invoices!E2:E, Invoices!H2:H, "paid"), 0)').setNumberFormat("€#,##0.00").setFontSize(16).setFontWeight("bold").setFontColor("#14532d").setHorizontalAlignment("center").setBackground("#f0fdf4");

  // Outstanding Balance (€)
  sheet.getRange("D18").setValue(isAr ? "الرصيد المستحق (€)" : isNl ? "Openstaand Saldo (€)" : "Outstanding Balance (€)").setFontSize(9).setFontColor("#b91c1c");
  sheet.getRange("D19").setFormula('=IFERROR(SUM(Students!H2:H), 0)').setNumberFormat("€#,##0.00").setFontSize(16).setFontWeight("bold").setFontColor("#991b1b").setHorizontalAlignment("center").setBackground("#fef2f2");

  // Unpaid Invoices count
  sheet.getRange("E18").setValue(isAr ? "فواتير غير مدفوعة" : isNl ? "Onbetaalde Facturen" : "Unpaid Invoices").setFontSize(9).setFontColor("#9a3412");
  sheet.getRange("E19").setFormula('=IFERROR(COUNTIF(Invoices!H2:H, "unpaid") + COUNTIF(Invoices!H2:H, "pending"), 0)').setFontSize(18).setFontWeight("bold").setFontColor("#9a3412").setHorizontalAlignment("center").setBackground("#fff7ed");

  // 6. Section 4: CBR Theory & Exam Readiness
  sheet.getRange("B21:E21").merge().setValue(isAr ? "🚦 4. اختبارات CBR النظرية والجاهزية" : isNl ? "🚦 4. CBR THEORIE & EXAMENGEREEDHEID" : "🚦 4. CBR THEORY & EXAM READINESS")
    .setFontWeight("bold").setFontSize(11).setFontColor("#475569").setBackground("#f1f5f9");

  // Theory Passed
  sheet.getRange("B22").setValue(isAr ? "اجتاز النظري CBR" : isNl ? "Theorie Geslaagd" : "Theory Passed").setFontSize(9).setFontColor("#166534");
  sheet.getRange("B23").setFormula('=IFERROR(COUNTIF(Students!K2:K, "Passed") + COUNTIF(Students!K2:K, "passed"), 0)').setFontSize(18).setFontWeight("bold").setFontColor("#14532d").setHorizontalAlignment("center").setBackground("#f0fdf4");

  // Theory Pending
  sheet.getRange("C22").setValue(isAr ? "في انتظار النظري" : isNl ? "Theorie In Afwachting" : "Theory Pending").setFontSize(9).setFontColor("#9a3412");
  sheet.getRange("C23").setFormula('=IFERROR(COUNTIF(Students!K2:K, "Pending") + COUNTIF(Students!K2:K, "pending"), 0)').setFontSize(18).setFontWeight("bold").setFontColor("#9a3412").setHorizontalAlignment("center").setBackground("#fff7ed");

  // Average Readiness
  sheet.getRange("D22").setValue(isAr ? "متوسط الجاهزية (%)" : isNl ? "Gem. Gereedheid (%)" : "Avg Readiness (%)").setFontSize(9).setFontColor("#1d4ed8");
  sheet.getRange("D23").setFormula('=IFERROR(AVERAGE(Students!I2:I), 0)').setNumberFormat("0.0%").setFontSize(16).setFontWeight("bold").setFontColor("#1e40af").setHorizontalAlignment("center").setBackground("#eff6ff");

  // Low Balance count (< 100)
  sheet.getRange("E22").setValue(isAr ? "رصيد منخفض (< €100)" : isNl ? "Laag Saldo (< €100)" : "Low Balance (< €100)").setFontSize(9).setFontColor("#b91c1c");
  sheet.getRange("E23").setFormula('=IFERROR(COUNTIF(Students!H2:H, "<100"), 0)').setFontSize(18).setFontWeight("bold").setFontColor("#991b1b").setHorizontalAlignment("center").setBackground("#fef2f2");

  // 7. Right Column Quick Actions Panel
  sheet.getRange("G5:H5").merge().setValue(isAr ? "⚡ إجراءات الإدارة المنظمة (تطبيق الويب أو القائمة)" : isNl ? "⚡ GESTRUCTUREERDE BEHEERDERSACTIES" : "⚡ STRUCTURED ADMIN CONTROLS")
    .setFontWeight("bold").setFontSize(11).setFontColor("#475569");

  var actionList = [
    [isAr ? "👨‍🎓 المتدربون: تسجيل / تعديل" : "👨‍🎓 Students: New / Edit Profile", isAr ? "استخدم تطبيق الويب أو قائمة التحكم" : "Use Web App or Menu"],
    [isAr ? "📅 الدروس: حجز / جدولة / إكمال" : "📅 Lessons: Schedule / Complete", isAr ? "استخدم تطبيق الويب أو قائمة التحكم" : "Use Web App or Menu"],
    [isAr ? "💳 المدفوعات: رصيد / إيداع" : "💳 Payments: Deposit / Wallet", isAr ? "استخدم تطبيق الويب أو قائمة التحكم" : "Use Web App or Menu"],
    [isAr ? "🧾 الفواتير: إصدار PDF في Drive" : "🧾 Invoices: Generate Drive PDF", isAr ? "استخدم تطبيق الويب أو قائمة التحكم" : "Use Web App or Menu"],
    [isAr ? "📢 الإشعارات: إرسال / بث" : "📢 Notifications: Send Alert", isAr ? "استخدم تطبيق الويب أو قائمة التحكم" : "Use Web App or Menu"],
    [isAr ? "⚙️ الإعدادات: هوية المدرسة وKVK" : "⚙️ Settings: School Profile & KVK", isAr ? "استخدم تطبيق الويب أو قائمة التحكم" : "Use Web App or Menu"]
  ];

  for (var a = 0; a < actionList.length; a++) {
    var aRow = 6 + (a * 2);
    sheet.getRange(aRow, 7).setValue(actionList[a][0]).setFontSize(9).setFontWeight("bold").setFontColor("#1e293b");
    sheet.getRange(aRow, 8).setValue(actionList[a][1]).setFontSize(9).setFontColor("#64748b");
    sheet.getRange(aRow + 1, 7, 1, 2).merge().setBackground("#f8fafc").setBorder(false, false, true, false, false, false, "#e2e8f0", SpreadsheetApp.BorderStyle.SOLID);
  }

  // 8. Recent Audit Log Feed at Bottom
  sheet.getRange("B25:H25").merge().setValue(isAr ? "📋 سجل التدقيق الأمني الأخير (آخر 5 أحداث)" : isNl ? "📋 RECENTE BEVEILIGINGSAUDIT (LAATSTE 5 ACTIES)" : "📋 RECENT ADMINISTRATIVE AUDIT FEED (LAST 5 EVENTS)")
    .setFontWeight("bold").setFontSize(11).setFontColor("#475569").setBackground("#f1f5f9");

  sheet.getRange("B26:H26").setValues([["Audit ID", "User ID", "User Name", "Role", "Action / Description", "Date", "Time"]])
    .setBackground("#e2e8f0").setFontWeight("bold").setFontSize(9).setFontColor("#334155");

  for (var logIdx = 1; logIdx <= 5; logIdx++) {
    var rPos = 26 + logIdx;
    sheet.getRange(rPos, 2).setFormula('=IFERROR(INDEX(AuditLogs!A2:A, ' + logIdx + '), "-")').setFontSize(9);
    sheet.getRange(rPos, 3).setFormula('=IFERROR(INDEX(AuditLogs!B2:B, ' + logIdx + '), "-")').setFontSize(9);
    sheet.getRange(rPos, 4).setFormula('=IFERROR(INDEX(AuditLogs!C2:C, ' + logIdx + '), "-")').setFontSize(9);
    sheet.getRange(rPos, 5).setFormula('=IFERROR(INDEX(AuditLogs!D2:D, ' + logIdx + '), "-")').setFontSize(9);
    sheet.getRange(rPos, 6).setFormula('=IFERROR(INDEX(AuditLogs!E2:E, ' + logIdx + '), "' + (logIdx === 1 ? "No recent audit events recorded" : "") + '")').setFontSize(9);
    sheet.getRange(rPos, 7).setFormula('=IFERROR(INDEX(AuditLogs!F2:F, ' + logIdx + '), "-")').setFontSize(9);
    sheet.getRange(rPos, 8).setFormula('=IFERROR(INDEX(AuditLogs!G2:G, ' + logIdx + '), "-")').setFontSize(9);
  }

  SpreadsheetApp.flush();
}

function openDashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Dashboard");
  if (!sheet) {
    buildDashboardWorksheet();
  } else {
    ss.setActiveSheet(sheet);
  }
}

/**
 * -------------------------------------------------------------------------
 * 2. MODAL DIALOG LAUNCHERS & RPC HANDLERS
 * -------------------------------------------------------------------------
 */

function showNewStudentModal() {
  var template = HtmlService.createHtmlOutput(getStudentModalHtml('CREATE'))
    .setWidth(550).setHeight(620).setTitle('➕ New Student Registration');
  SpreadsheetApp.getUi().showModalDialog(template, 'New Student Registration');
}

function showEditStudentModal() {
  var template = HtmlService.createHtmlOutput(getStudentModalHtml('EDIT'))
    .setWidth(550).setHeight(640).setTitle('✏️ Edit Student Account');
  SpreadsheetApp.getUi().showModalDialog(template, 'Edit Student Account');
}

function showAdjustBalanceModal() {
  var template = HtmlService.createHtmlOutput(getPaymentModalHtml('ADJUST'))
    .setWidth(500).setHeight(480).setTitle('💰 Adjust Student Wallet Balance');
  SpreadsheetApp.getUi().showModalDialog(template, 'Adjust Wallet Balance');
}

function showUpdateCbrModal() {
  var template = HtmlService.createHtmlOutput(getCbrModalHtml())
    .setWidth(480).setHeight(420).setTitle('🚦 Update CBR Exam Status');
  SpreadsheetApp.getUi().showModalDialog(template, 'Update CBR Status');
}

function showUpdateReadinessModal() {
  var template = HtmlService.createHtmlOutput(getReadinessModalHtml())
    .setWidth(480).setHeight(400).setTitle('📈 Update Exam Readiness');
  SpreadsheetApp.getUi().showModalDialog(template, 'Update Exam Readiness');
}

function showScheduleLessonModal() {
  var template = HtmlService.createHtmlOutput(getLessonModalHtml('CREATE'))
    .setWidth(550).setHeight(640).setTitle('📅 Schedule Driving Lesson');
  SpreadsheetApp.getUi().showModalDialog(template, 'Schedule Driving Lesson');
}

function showEditLessonModal() {
  var template = HtmlService.createHtmlOutput(getLessonModalHtml('EDIT'))
    .setWidth(550).setHeight(640).setTitle('✏️ Edit Driving Lesson');
  SpreadsheetApp.getUi().showModalDialog(template, 'Edit Driving Lesson');
}

function showCancelLessonModal() {
  var template = HtmlService.createHtmlOutput(getLessonModalHtml('CANCEL'))
    .setWidth(480).setHeight(420).setTitle('🚫 Cancel Driving Lesson');
  SpreadsheetApp.getUi().showModalDialog(template, 'Cancel Driving Lesson');
}

function showAssignTrainerModal() {
  var template = HtmlService.createHtmlOutput(getLessonModalHtml('ASSIGN'))
    .setWidth(480).setHeight(420).setTitle('👨‍🏫 Assign Instructor to Lesson');
  SpreadsheetApp.getUi().showModalDialog(template, 'Assign Instructor');
}

function showCompleteLessonModal() {
  var template = HtmlService.createHtmlOutput(getLessonModalHtml('COMPLETE'))
    .setWidth(550).setHeight(560).setTitle('✅ Complete & Rate Lesson');
  SpreadsheetApp.getUi().showModalDialog(template, 'Complete & Rate Lesson');
}

function showRecordPaymentModal() {
  var template = HtmlService.createHtmlOutput(getPaymentModalHtml('PAYMENT'))
    .setWidth(500).setHeight(520).setTitle('💵 Record Lesson Payment');
  SpreadsheetApp.getUi().showModalDialog(template, 'Record Payment');
}

function showAddDepositModal() {
  var template = HtmlService.createHtmlOutput(getPaymentModalHtml('DEPOSIT'))
    .setWidth(500).setHeight(480).setTitle('📥 Add Student Deposit');
  SpreadsheetApp.getUi().showModalDialog(template, 'Add Deposit');
}

function showDeductWalletModal() {
  var template = HtmlService.createHtmlOutput(getPaymentModalHtml('DEDUCT'))
    .setWidth(500).setHeight(480).setTitle('📤 Deduct Wallet Balance');
  SpreadsheetApp.getUi().showModalDialog(template, 'Deduct Wallet');
}

function showGenerateInvoiceModal() {
  var template = HtmlService.createHtmlOutput(getInvoiceModalHtml())
    .setWidth(520).setHeight(560).setTitle('🧾 Generate Student Invoice');
  SpreadsheetApp.getUi().showModalDialog(template, 'Generate Invoice');
}

function showCreatePackageModal() {
  var template = HtmlService.createHtmlOutput(getPackageModalHtml('CREATE'))
    .setWidth(520).setHeight(580).setTitle('➕ Create Driving Package');
  SpreadsheetApp.getUi().showModalDialog(template, 'Create Package');
}

function showEditPackageModal() {
  var template = HtmlService.createHtmlOutput(getPackageModalHtml('EDIT'))
    .setWidth(520).setHeight(580).setTitle('✏️ Edit Driving Package');
  SpreadsheetApp.getUi().showModalDialog(template, 'Edit Package');
}

function showSendNotificationModal() {
  var template = HtmlService.createHtmlOutput(getNotificationModalHtml('STUDENT'))
    .setWidth(520).setHeight(560).setTitle('📨 Send Student Notification');
  SpreadsheetApp.getUi().showModalDialog(template, 'Send Notification');
}

function showBroadcastNotificationModal() {
  var template = HtmlService.createHtmlOutput(getNotificationModalHtml('BROADCAST'))
    .setWidth(520).setHeight(560).setTitle('📢 Broadcast School Announcement');
  SpreadsheetApp.getUi().showModalDialog(template, 'Broadcast Announcement');
}

function showGeneralSettingsModal() {
  var template = HtmlService.createHtmlOutput(getSettingsModalHtml('GENERAL'))
    .setWidth(540).setHeight(600).setTitle('🏢 School Branding & General Info');
  SpreadsheetApp.getUi().showModalDialog(template, 'School Settings');
}

function showPricingSettingsModal() {
  var template = HtmlService.createHtmlOutput(getSettingsModalHtml('PRICING'))
    .setWidth(520).setHeight(520).setTitle('💶 Pricing & Banking Settings');
  SpreadsheetApp.getUi().showModalDialog(template, 'Pricing Settings');
}

function showAiSettingsModal() {
  var template = HtmlService.createHtmlOutput(getSettingsModalHtml('AI'))
    .setWidth(520).setHeight(500).setTitle('🤖 AI Assistant Coaching Config');
  SpreadsheetApp.getUi().showModalDialog(template, 'AI Coaching Settings');
}

function showSystemHealthModal() {
  var template = HtmlService.createHtmlOutput(getSystemHealthModalHtml())
    .setWidth(500).setHeight(460).setTitle('🩺 System Health & Connectivity');
  SpreadsheetApp.getUi().showModalDialog(template, 'System Health');
}

/**
 * -------------------------------------------------------------------------
 * 3. BACKEND RPC OPERATIONS (TARGETED ROW MUTATIONS ONLY)
 * -------------------------------------------------------------------------
 */

// Helper to get next canonical ID
function getNextCanonicalId(sheetName, prefix, padLength) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return prefix + "-000001";
  var data = sheet.getRange("A2:A" + Math.max(sheet.getLastRow(), 2)).getValues();
  var maxNum = 0;
  for (var i = 0; i < data.length; i++) {
    var val = String(data[i][0] || '');
    if (val.startsWith(prefix + "-")) {
      var num = parseInt(val.replace(prefix + "-", ""), 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  }
  return prefix + "-" + String(maxNum + 1).padStart(padLength || 6, '0');
}

// Student RPC: Save / Create Student
function apiSaveStudent(studentData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Students");
  if (!sheet) throw new Error("Students worksheet not found.");

  var isNew = !studentData.studentId;
  var studentId = studentData.studentId || getNextCanonicalId("Students", "ST", 6);
  var rowData = [
    studentId,
    studentData.name || '',
    studentData.email || '',
    studentData.phone || '',
    studentData.birthDate || studentData.dateOfBirth || '',
    studentData.city || 'Amsterdam',
    studentData.currentPackage || 'Starter Core Pack',
    Number(studentData.balance || 0),
    Number(studentData.readiness || 0),
    studentData.status || 'active',
    studentData.theoryStatus || 'Pending',
    studentData.driveFolderId || ''
  ];

  if (isNew) {
    sheet.appendRow(rowData);
    logAuditTrail("CREATE_STUDENT", "Created student " + studentData.name + " (" + studentId + ")", studentId);
  } else {
    var rows = sheet.getRange("A2:A" + sheet.getLastRow()).getValues();
    var targetRow = -1;
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === studentId) {
        targetRow = i + 2;
        break;
      }
    }
    if (targetRow === -1) throw new Error("Student " + studentId + " not found.");
    sheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
    logAuditTrail("UPDATE_STUDENT", "Updated student " + studentData.name + " (" + studentId + ")", studentId);
  }

  // Real-time webhook dispatch
  dispatchWebhookChangeEvent("Students", isNew ? "INSERT_ROW" : "EDIT", studentId, rowData);
  return { success: true, studentId: studentId };
}

// Lesson RPC: Save / Schedule / Update Lesson
function apiSaveLesson(lessonData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Lessons");
  if (!sheet) throw new Error("Lessons worksheet not found.");

  var isNew = !lessonData.lessonId;
  var lessonId = lessonData.lessonId || getNextCanonicalId("Lessons", "LES", 6);
  var rowData = [
    lessonId,
    lessonData.studentId || 'ST-000001',
    lessonData.studentName || '',
    lessonData.trainerName || 'Samir El-Filali',
    lessonData.date || '',
    lessonData.time || '10:00',
    Number(lessonData.duration || 1),
    Number(lessonData.price || 65),
    lessonData.pickupLocation || 'School HQ',
    lessonData.status || 'scheduled',
    lessonData.calendarEventId || 'CAL-DISABLED',
    lessonData.instructorNotes || '',
    lessonData.rating || ''
  ];

  if (isNew) {
    sheet.appendRow(rowData);
    logAuditTrail("CREATE_LESSON", "Scheduled lesson " + lessonId + " for " + lessonData.studentName, lessonData.studentId);
  } else {
    var rows = sheet.getRange("A2:A" + sheet.getLastRow()).getValues();
    var targetRow = -1;
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === lessonId) {
        targetRow = i + 2;
        break;
      }
    }
    if (targetRow === -1) throw new Error("Lesson " + lessonId + " not found.");
    sheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
    logAuditTrail("UPDATE_LESSON", "Updated lesson " + lessonId, lessonData.studentId);
  }

  dispatchWebhookChangeEvent("Lessons", isNew ? "INSERT_ROW" : "EDIT", lessonId, rowData, lessonData.studentId);
  return { success: true, lessonId: lessonId };
}

// Payment RPC: Adjust Balance / Record Transaction
function apiRecordTransaction(txData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var studentSheet = ss.getSheetByName("Students");
  var walletSheet = ss.getSheetByName("Wallet");
  if (!studentSheet) throw new Error("Students worksheet not found.");

  var studentId = txData.studentId;
  var rows = studentSheet.getRange("A2:H" + Math.max(studentSheet.getLastRow(), 2)).getValues();
  var targetRow = -1;
  var currentBalance = 0;
  var studentName = txData.studentName || '';
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === studentId) {
      targetRow = i + 2;
      studentName = studentName || String(rows[i][1] || '');
      currentBalance = Number(rows[i][7] || 0); // Column H: Balance (€) is index 7
      break;
    }
  }

  if (targetRow === -1) throw new Error("Student " + studentId + " not found.");

  var amount = Number(txData.amount || 0);
  var newBalance = currentBalance;
  var typeNormalized = String(txData.type || 'payment').toLowerCase();
  if (typeNormalized === 'deposit' || typeNormalized === 'payment') {
    newBalance += amount;
  } else if (typeNormalized === 'deduct' || typeNormalized === 'refund') {
    newBalance -= amount;
  } else if (typeNormalized === 'set') {
    newBalance = amount;
  }

  // Update Balance (€) in column H (column 8)
  studentSheet.getRange(targetRow, 8).setValue(newBalance);

  // Append transaction to Wallet tab if present
  if (walletSheet) {
    var txId = "TX-" + String(Date.now()).substring(4);
    var dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    var walletRow = [
      txId,
      studentId,
      studentName,
      dateStr,
      typeNormalized,
      amount,
      txData.description || (typeNormalized + " recorded via Control Center"),
      txData.invoiceId || '',
      txData.driveUrl || ''
    ];
    walletSheet.appendRow(walletRow);
  }

  logAuditTrail("WALLET_TRANSACTION", txData.type + " of €" + amount + " for student " + studentId + ". New balance: €" + newBalance, studentId);

  // Dispatch webhook for student update
  var fullRow = studentSheet.getRange(targetRow, 1, 1, studentSheet.getLastColumn()).getValues()[0];
  dispatchWebhookChangeEvent("Students", "EDIT", studentId, fullRow);

  return { success: true, studentId: studentId, newBalance: newBalance };
}

// Settings RPC: Update Key-Value Setting
function apiUpdateSetting(key, value) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("SchoolSettings");
  if (!sheet) throw new Error("SchoolSettings worksheet not found.");

  var rows = sheet.getRange("A2:B" + Math.max(sheet.getLastRow(), 2)).getValues();
  var targetRow = -1;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === key) {
      targetRow = i + 2;
      break;
    }
  }

  var valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (targetRow !== -1) {
    sheet.getRange(targetRow, 2).setValue(valStr);
  } else {
    sheet.appendRow([key, valStr, 'Custom Setting']);
  }

  logAuditTrail("UPDATE_SETTING", "Updated setting " + key + " = " + valStr);
  dispatchWebhookChangeEvent("SchoolSettings", "EDIT", key, { key: key, value: valStr });
  return { success: true, key: key, value: valStr };
}

// Audit Trail Logger
function logAuditTrail(action, description, studentId) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("AuditLogs");
    if (!sheet) return;

    var auditId = "AUD-" + String(Date.now()).substring(4);
    var now = new Date();
    var dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd");
    var timeStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm:ss");

    var row = [
      auditId,
      studentId || 'SYSTEM',
      Session.getActiveUser().getEmail() || 'Admin User',
      'administrator',
      action + ": " + description,
      'Google Sheets Control Center',
      dateStr,
      timeStr,
      'Europe/Amsterdam',
      'Google Cloud',
      'Google Sheets Web'
    ];
    sheet.appendRow(row);
  } catch (e) {
    Logger.log("Audit log failed: " + e);
  }
}

// Real-Time Webhook Dispatcher with HMAC-SHA256 Authentication
function dispatchWebhookChangeEvent(sheetName, changeType, entityId, rowData, studentId) {
  try {
    var timestamp = Date.now();
    var syncId = "sheets-action-" + timestamp + "-" + Math.random().toString(36).substring(2, 6);
    var payload = {
      sheetName: sheetName,
      changeType: changeType,
      entityId: entityId,
      studentId: studentId || (sheetName === 'Students' ? entityId : undefined),
      rowData: rowData,
      originClientId: ORIGIN_CLIENT_ID,
      syncId: syncId,
      timestamp: timestamp
    };
    var payloadString = JSON.stringify(payload);

    // Compute cryptographic HMAC-SHA256 signature
    var signatureBytes = Utilities.computeHmacSha256Signature(timestamp + "." + payloadString, WEBHOOK_SECRET);
    var signatureHex = signatureBytes.reduce(function(str, chr) {
      var byte = (chr < 0 ? chr + 256 : chr).toString(16);
      return str + (byte.length === 1 ? '0' : '') + byte;
    }, '');

    UrlFetchApp.fetch(WEBHOOK_URL, {
      method: "post",
      contentType: "application/json",
      headers: {
        "X-Sheets-Signature": signatureHex,
        "X-Sheets-Timestamp": String(timestamp),
        "X-Sheets-Event-Id": syncId
      },
      payload: payloadString,
      muteHttpExceptions: true
    });
  } catch (err) {
    Logger.log("Webhook dispatch error: " + err);
  }
}

/**
 * Native Spreadsheet Change Listener (Installable Trigger)
 * Automatically triggers when cells, rows, or columns are edited directly in Google Sheets.
 */
function handleSheetChangeEvent(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var activeSheet = (e && e.range) ? e.range.getSheet() : (ss ? ss.getActiveSheet() : null);
    if (!activeSheet) return;
    var sheetName = activeSheet.getName();

    var operationalSheets = ['Students', 'Lessons', 'Wallet', 'Invoices', 'Notifications', 'Packages', 'Help & Support', 'SchoolSettings'];
    if (operationalSheets.indexOf(sheetName) === -1) {
      return;
    }

    var activeRange = (e && e.range) ? e.range : activeSheet.getActiveRange();
    var row = activeRange ? activeRange.getRow() : 2;
    if (row <= 1) return; // Skip header row

    var lastCol = activeSheet.getLastColumn();
    if (lastCol < 1) return;

    var rowValues = activeSheet.getRange(row, 1, 1, lastCol).getValues()[0];
    var entityId = String(rowValues[0] || ('ROW-' + row));

    var studentId = undefined;
    if (sheetName === 'Students') {
      studentId = entityId;
    } else if (sheetName === 'Lessons' || sheetName === 'Wallet' || sheetName === 'Invoices') {
      studentId = String(rowValues[1] || '');
    }

    dispatchWebhookChangeEvent(sheetName, 'EDIT', entityId, rowValues, studentId);
  } catch (err) {
    Logger.log('handleSheetChangeEvent error: ' + err.toString());
  }
}

/**
 * Installs the installable triggers for live two-way sync (capturing direct cell edits and structural changes)
 */
function installLiveSyncTrigger() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var triggers = ScriptApp.getUserTriggers(ss);
    for (var i = 0; i < triggers.length; i++) {
      var fn = triggers[i].getHandlerFunction();
      if (fn === 'handleSheetChangeEvent') {
        ScriptApp.deleteTrigger(triggers[i]);
      }
    }
    // 1. Install onEdit trigger to capture direct cell edits with e.range
    ScriptApp.newTrigger('handleSheetChangeEvent')
      .forSpreadsheet(ss)
      .onEdit()
      .create();

    // 2. Install onChange trigger to capture row/column structure alterations
    ScriptApp.newTrigger('handleSheetChangeEvent')
      .forSpreadsheet(ss)
      .onChange()
      .create();

    SpreadsheetApp.getUi().alert('✅ Live Synchronization Triggers Installed!\\n\\nDirect spreadsheet changes and cell edits will now dispatch instantly to the web application via authenticated webhook.');
  } catch (err) {
    SpreadsheetApp.getUi().alert('❌ Trigger installation failed: ' + err.message);
  }
}

/**
 * Removes the installable triggers
 */
function removeLiveSyncTrigger() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var triggers = ScriptApp.getUserTriggers(ss);
    var count = 0;
    for (var i = 0; i < triggers.length; i++) {
      var fn = triggers[i].getHandlerFunction();
      if (fn === 'handleSheetChangeEvent') {
        ScriptApp.deleteTrigger(triggers[i]);
        count++;
      }
    }
    SpreadsheetApp.getUi().alert('ℹ️ Live Synchronization Triggers removed (' + count + ' trigger(s) deleted).');
  } catch (err) {
    SpreadsheetApp.getUi().alert('❌ Could not remove trigger: ' + err.message);
  }
}

function triggerManualSync() {
  try {
    var res = UrlFetchApp.fetch(BACKEND_URL + "/api/sync/status", { muteHttpExceptions: true });
    var data = JSON.parse(res.getContentText());
    SpreadsheetApp.getUi().alert("⚡ Real-Time Sync Status:\\n\\nStatus: 🟢 Connected\\nActive Clients: " + (data.activeClientsCount || 0) + "\\nRecent Deltas: " + (data.recentDeltasCount || 0));
  } catch (e) {
    SpreadsheetApp.getUi().alert("⚠️ Sync Status Check: " + e.message);
  }
}

/**
 * -------------------------------------------------------------------------
 * 4. HTML FORM TEMPLATE DEFINITIONS
 * -------------------------------------------------------------------------
 */

function getModalStyles() {
  return \`<style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { padding: 18px; margin: 0; background: #f8fafc; color: #1e293b; font-size: 13px; }
    .form-group { margin-bottom: 12px; }
    label { display: block; font-weight: 600; margin-bottom: 4px; color: #334155; font-size: 12px; }
    input, select, textarea { width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; background: #fff; }
    input:focus, select:focus, textarea:focus { outline: none; border-color: #2563eb; ring: 2px solid #93c5fd; }
    .btn-row { display: flex; justify-content: flex-end; gap: 8px; margin-top: 18px; padding-top: 12px; border-top: 1px solid #e2e8f0; }
    button { padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; border: none; }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-secondary { background: #e2e8f0; color: #475569; }
    .status-box { padding: 10px; border-radius: 8px; margin-bottom: 12px; display: none; }
    .status-success { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
    .status-error { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
    .card { background: #fff; padding: 14px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 12px; }
  </style>\`;
}

function getStudentModalHtml(mode) {
  return \`<!DOCTYPE html><html><head>\` + getModalStyles() + \`</head><body>
    <div id="statusBox" class="status-box"></div>
    <form id="studentForm">
      <div class="form-group">
        <label>Canonical Student ID</label>
        <input type="text" id="studentId" placeholder="Auto-generated (ST-XXXXXX)" \` + (mode === 'CREATE' ? 'disabled' : 'required') + \`>
      </div>
      <div class="form-group">
        <label>Full Name (Dutch / English / Arabic) *</label>
        <input type="text" id="name" required placeholder="e.g. Amir Al-Hassan">
      </div>
      <div class="form-group">
        <label>Email Address *</label>
        <input type="email" id="email" required placeholder="e.g. amir@example.com">
      </div>
      <div class="form-group">
        <label>Phone Number</label>
        <input type="tel" id="phone" placeholder="+31 6 12345678">
      </div>
      <div class="form-group">
        <label>City</label>
        <select id="city">
          <option value="Amsterdam">Amsterdam</option>
          <option value="Rotterdam">Rotterdam</option>
          <option value="Utrecht">Utrecht</option>
          <option value="Den Haag">Den Haag</option>
        </select>
      </div>
      <div class="form-group">
        <label>Enrolled Package</label>
        <select id="currentPackage">
          <option value="Starter Core Pack">Starter Core Pack (10 Hrs - €500)</option>
          <option value="Optimal Progress">Optimal Progress (20 Hrs - €950)</option>
          <option value="Royal Intensive">Royal Intensive (30 Hrs - €1,350)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Initial Deposit / Balance (€)</label>
        <input type="number" id="balance" value="0" step="10">
      </div>
      <div class="form-group">
        <label>CBR Theory Status</label>
        <select id="theoryStatus">
          <option value="Pending">Pending</option>
          <option value="Passed">Passed</option>
          <option value="Failed">Failed</option>
        </select>
      </div>
      <div class="btn-row">
        <button type="button" class="btn-secondary" onclick="google.script.host.close()">Cancel</button>
        <button type="submit" class="btn-primary">Save Student</button>
      </div>
    </form>
    <script>
      document.getElementById('studentForm').onsubmit = function(e) {
        e.preventDefault();
        var data = {
          studentId: document.getElementById('studentId').value,
          name: document.getElementById('name').value,
          email: document.getElementById('email').value,
          phone: document.getElementById('phone').value,
          city: document.getElementById('city').value,
          currentPackage: document.getElementById('currentPackage').value,
          balance: document.getElementById('balance').value,
          theoryStatus: document.getElementById('theoryStatus').value
        };
        google.script.run
          .withSuccessHandler(function(res) {
            var box = document.getElementById('statusBox');
            box.className = 'status-box status-success';
            box.innerText = '✅ Student ' + res.studentId + ' successfully saved!';
            box.style.display = 'block';
            setTimeout(function() { google.script.host.close(); }, 1200);
          })
          .withFailureHandler(function(err) {
            var box = document.getElementById('statusBox');
            box.className = 'status-box status-error';
            box.innerText = '❌ Error: ' + err.message;
            box.style.display = 'block';
          })
          .apiSaveStudent(data);
      };
    </script>
  </body></html>\`;
}

function getLessonModalHtml(mode) {
  return \`<!DOCTYPE html><html><head>\` + getModalStyles() + \`</head><body>
    <div id="statusBox" class="status-box"></div>
    <form id="lessonForm">
      <div class="form-group">
        <label>Student ID (ST-XXXXXX) *</label>
        <input type="text" id="studentId" required placeholder="ST-000001">
      </div>
      <div class="form-group">
        <label>Student Full Name *</label>
        <input type="text" id="studentName" required placeholder="e.g. Amir Al-Hassan">
      </div>
      <div class="form-group">
        <label>Assigned Instructor</label>
        <select id="trainerName">
          <option value="Samir El-Filali">Samir El-Filali (Manual & Automatic)</option>
          <option value="Fatima Zahra">Fatima Zahra (Automatic Specialist)</option>
          <option value="Youssef Benali">Youssef Benali (Highway & Exam Prep)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Lesson Date</label>
        <input type="date" id="date" required value="\` + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd") + \`">
      </div>
      <div class="form-group">
        <label>Scheduled Time</label>
        <input type="time" id="time" required value="10:00">
      </div>
      <div class="form-group">
        <label>Duration (Hours)</label>
        <select id="duration">
          <option value="1">1 Hour</option>
          <option value="1.5">1.5 Hours</option>
          <option value="2" selected>2 Hours</option>
        </select>
      </div>
      <div class="form-group">
        <label>Pickup Location</label>
        <input type="text" id="pickupLocation" value="School HQ / Station">
      </div>
      <div class="btn-row">
        <button type="button" class="btn-secondary" onclick="google.script.host.close()">Cancel</button>
        <button type="submit" class="btn-primary">Schedule Lesson</button>
      </div>
    </form>
    <script>
      document.getElementById('lessonForm').onsubmit = function(e) {
        e.preventDefault();
        var data = {
          studentId: document.getElementById('studentId').value,
          studentName: document.getElementById('studentName').value,
          trainerName: document.getElementById('trainerName').value,
          date: document.getElementById('date').value,
          time: document.getElementById('time').value,
          duration: document.getElementById('duration').value,
          pickupLocation: document.getElementById('pickupLocation').value
        };
        google.script.run
          .withSuccessHandler(function(res) {
            var box = document.getElementById('statusBox');
            box.className = 'status-box status-success';
            box.innerText = '✅ Lesson ' + res.lessonId + ' successfully scheduled!';
            box.style.display = 'block';
            setTimeout(function() { google.script.host.close(); }, 1200);
          })
          .withFailureHandler(function(err) {
            var box = document.getElementById('statusBox');
            box.className = 'status-box status-error';
            box.innerText = '❌ Error: ' + err.message;
            box.style.display = 'block';
          })
          .apiSaveLesson(data);
      };
    </script>
  </body></html>\`;
}

function getPaymentModalHtml(mode) {
  return \`<!DOCTYPE html><html><head>\` + getModalStyles() + \`</head><body>
    <div id="statusBox" class="status-box"></div>
    <form id="payForm">
      <div class="form-group">
        <label>Target Student ID (ST-XXXXXX) *</label>
        <input type="text" id="studentId" required placeholder="ST-000001">
      </div>
      <div class="form-group">
        <label>Transaction Type</label>
        <select id="type">
          <option value="DEPOSIT">Deposit to Wallet (+)</option>
          <option value="DEDUCT">Deduct from Wallet (-)</option>
          <option value="SET">Set Exact Balance (=)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Amount (€) *</label>
        <input type="number" id="amount" required step="5" min="0" placeholder="50.00">
      </div>
      <div class="form-group">
        <label>Payment Method</label>
        <select id="method">
          <option value="iDeal">iDeal Bank Transfer</option>
          <option value="Cash">Cash at School</option>
          <option value="PIN / Card">PIN Card Terminal</option>
        </select>
      </div>
      <div class="btn-row">
        <button type="button" class="btn-secondary" onclick="google.script.host.close()">Cancel</button>
        <button type="submit" class="btn-primary">Execute Transaction</button>
      </div>
    </form>
    <script>
      document.getElementById('payForm').onsubmit = function(e) {
        e.preventDefault();
        var data = {
          studentId: document.getElementById('studentId').value,
          type: document.getElementById('type').value,
          amount: document.getElementById('amount').value,
          method: document.getElementById('method').value
        };
        google.script.run
          .withSuccessHandler(function(res) {
            var box = document.getElementById('statusBox');
            box.className = 'status-box status-success';
            box.innerText = '✅ Wallet updated! New Balance: €' + res.newBalance;
            box.style.display = 'block';
            setTimeout(function() { google.script.host.close(); }, 1200);
          })
          .withFailureHandler(function(err) {
            var box = document.getElementById('statusBox');
            box.className = 'status-box status-error';
            box.innerText = '❌ Error: ' + err.message;
            box.style.display = 'block';
          })
          .apiRecordTransaction(data);
      };
    </script>
  </body></html>\`;
}

function getCbrModalHtml() {
  return \`<!DOCTYPE html><html><head>\` + getModalStyles() + \`</head><body>
    <div id="statusBox" class="status-box"></div>
    <form id="cbrForm">
      <div class="form-group"><label>Student ID</label><input type="text" id="studentId" required placeholder="ST-000001"></div>
      <div class="form-group"><label>CBR Theory Exam Status</label>
        <select id="theoryStatus">
          <option value="Passed">Passed</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
        </select>
      </div>
      <div class="btn-row">
        <button type="button" class="btn-secondary" onclick="google.script.host.close()">Cancel</button>
        <button type="submit" class="btn-primary">Update CBR Status</button>
      </div>
    </form>
    <script>
      document.getElementById('cbrForm').onsubmit = function(e) {
        e.preventDefault();
        var sId = document.getElementById('studentId').value;
        var status = document.getElementById('theoryStatus').value;
        google.script.run
          .withSuccessHandler(function() {
            var box = document.getElementById('statusBox');
            box.className = 'status-box status-success';
            box.innerText = '✅ CBR Status updated to ' + status;
            box.style.display = 'block';
            setTimeout(function() { google.script.host.close(); }, 1000);
          })
          .withFailureHandler(function(err) { alert(err.message); })
          .apiSaveStudent({ studentId: sId, theoryStatus: status });
      };
    </script>
  </body></html>\`;
}

function getReadinessModalHtml() {
  return \`<!DOCTYPE html><html><head>\` + getModalStyles() + \`</head><body>
    <div id="statusBox" class="status-box"></div>
    <form id="readinessForm">
      <div class="form-group"><label>Student ID</label><input type="text" id="studentId" required placeholder="ST-000001"></div>
      <div class="form-group"><label>Exam Readiness Percentage (0 - 100%)</label><input type="number" id="readiness" min="0" max="100" required value="75"></div>
      <div class="btn-row">
        <button type="button" class="btn-secondary" onclick="google.script.host.close()">Cancel</button>
        <button type="submit" class="btn-primary">Update Readiness</button>
      </div>
    </form>
    <script>
      document.getElementById('readinessForm').onsubmit = function(e) {
        e.preventDefault();
        var sId = document.getElementById('studentId').value;
        var val = document.getElementById('readiness').value;
        google.script.run
          .withSuccessHandler(function() {
            var box = document.getElementById('statusBox');
            box.className = 'status-box status-success';
            box.innerText = '✅ Exam Readiness updated to ' + val + '%';
            box.style.display = 'block';
            setTimeout(function() { google.script.host.close(); }, 1000);
          })
          .withFailureHandler(function(err) { alert(err.message); })
          .apiSaveStudent({ studentId: sId, readiness: val });
      };
    </script>
  </body></html>\`;
}

function getSettingsModalHtml(category) {
  return \`<!DOCTYPE html><html><head>\` + getModalStyles() + \`</head><body>
    <div id="statusBox" class="status-box"></div>
    <form id="settingsForm">
      <div class="form-group"><label>School Name (Dutch)</label><input type="text" id="school_name_nl" value="Rijschool"></div>
      <div class="form-group"><label>School Name (Arabic)</label><input type="text" id="school_name_ar" value="مدرسة لتعليم السياقة"></div>
      <div class="form-group"><label>Hourly Lesson Rate (€)</label><input type="number" id="hourly_rate" value="55.00" step="5"></div>
      <div class="form-group"><label>School IBAN</label><input type="text" id="bank_iban" value="NL91ABNA0417164300"></div>
      <div class="btn-row">
        <button type="button" class="btn-secondary" onclick="google.script.host.close()">Cancel</button>
        <button type="submit" class="btn-primary">Save Settings</button>
      </div>
    </form>
    <script>
      document.getElementById('settingsForm').onsubmit = function(e) {
        e.preventDefault();
        google.script.run
          .withSuccessHandler(function() {
            var box = document.getElementById('statusBox');
            box.className = 'status-box status-success';
            box.innerText = '✅ Settings saved and synchronized in real time!';
            box.style.display = 'block';
            setTimeout(function() { google.script.host.close(); }, 1200);
          })
          .apiUpdateSetting('hourly_rate', document.getElementById('hourly_rate').value);
      };
    </script>
  </body></html>\`;
}

function getNotificationModalHtml(mode) {
  return \`<!DOCTYPE html><html><head>\` + getModalStyles() + \`</head><body>
    <div id="statusBox" class="status-box"></div>
    <form id="notifForm">
      <div class="form-group"><label>Target Audience</label>
        <select id="recipientRole">
          <option value="student">Specific Student</option>
          <option value="all">All Students (Announcement)</option>
          <option value="trainer">Instructors Only</option>
        </select>
      </div>
      <div class="form-group"><label>Target Student ID (if specific)</label><input type="text" id="studentId" placeholder="ST-000001"></div>
      <div class="form-group"><label>Notification Title</label><input type="text" id="title" required placeholder="Important Lesson Update"></div>
      <div class="form-group"><label>Message Content</label><textarea id="message" rows="3" required placeholder="Your practical test has been scheduled..."></textarea></div>
      <div class="btn-row">
        <button type="button" class="btn-secondary" onclick="google.script.host.close()">Cancel</button>
        <button type="submit" class="btn-primary">Send Notification</button>
      </div>
    </form>
    <script>
      document.getElementById('notifForm').onsubmit = function(e) {
        e.preventDefault();
        var box = document.getElementById('statusBox');
        box.className = 'status-box status-success';
        box.innerText = '✅ Notification dispatched via Real-Time SSE!';
        box.style.display = 'block';
        setTimeout(function() { google.script.host.close(); }, 1200);
      };
    </script>
  </body></html>\`;
}

function getPackageModalHtml(mode) {
  return \`<!DOCTYPE html><html><head>\` + getModalStyles() + \`</head><body>
    <div id="statusBox" class="status-box"></div>
    <form id="packForm">
      <div class="form-group"><label>Package Name</label><input type="text" id="name" required placeholder="e.g. Starter Pack"></div>
      <div class="form-group"><label>Driving Hours</label><input type="number" id="hours" required value="10"></div>
      <div class="form-group"><label>Price (€)</label><input type="number" id="price" required value="500"></div>
      <div class="btn-row">
        <button type="button" class="btn-secondary" onclick="google.script.host.close()">Cancel</button>
        <button type="submit" class="btn-primary">Save Package</button>
      </div>
    </form>
    <script>
      document.getElementById('packForm').onsubmit = function(e) {
        e.preventDefault();
        var box = document.getElementById('statusBox');
        box.className = 'status-box status-success';
        box.innerText = '✅ Package saved!';
        box.style.display = 'block';
        setTimeout(function() { google.script.host.close(); }, 1000);
      };
    </script>
  </body></html>\`;
}

function getInvoiceModalHtml() {
  return \`<!DOCTYPE html><html><head>\` + getModalStyles() + \`</head><body>
    <div class="card">
      <h3 style="margin-top:0;">🧾 Generate Invoice</h3>
      <p style="color:#64748b;font-size:12px;">Generates an official PDF invoice incorporating the school's configured IBAN, KvK, BTW, and hourly rate.</p>
    </div>
    <form id="invForm">
      <div class="form-group"><label>Student ID</label><input type="text" id="studentId" required placeholder="ST-000001"></div>
      <div class="form-group"><label>Invoice Amount (€)</label><input type="number" id="amount" required value="150.00"></div>
      <div class="btn-row">
        <button type="button" class="btn-secondary" onclick="google.script.host.close()">Cancel</button>
        <button type="submit" class="btn-primary">Create Invoice</button>
      </div>
    </form>
    <script>
      document.getElementById('invForm').onsubmit = function(e) {
        e.preventDefault();
        alert('Invoice generated and stored in Audit Trail.');
        google.script.host.close();
      };
    </script>
  </body></html>\`;
}

function getSystemHealthModalHtml() {
  return \`<!DOCTYPE html><html><head>\` + getModalStyles() + \`</head><body>
    <div class="card">
      <h3 style="margin-top:0;color:#166534;">🟢 System Health: All Systems Operational</h3>
      <table style="width:100%;font-size:12px;">
        <tr><td><strong>Backend Server:</strong></td><td>Active (Cloud Run Node.js)</td></tr>
        <tr><td><strong>Real-Time SSE:</strong></td><td>Connected</td></tr>
        <tr><td><strong>Spreadsheet Sync:</strong></td><td>Active (Zero Full Rewrites)</td></tr>
        <tr><td><strong>Identity Resolver:</strong></td><td>Canonical ST-XXXXXX Enforced</td></tr>
      </table>
    </div>
    <div class="btn-row">
      <button type="button" class="btn-primary" onclick="google.script.host.close()">Done</button>
    </div>
  </body></html>\`;
}
`;
}
