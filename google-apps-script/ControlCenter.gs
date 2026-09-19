/* TAREK RIJSCHOOL — Google Sheets Master Control Center. */

var CONTROL_CENTER_SHEETS = {
  students: 'Students',
  lessons: 'Lessons',
  trainers: 'Trainers',
  trainerSchedule: 'TrainerSchedule',
  payments: 'Wallet',
  invoices: 'Invoices',
  packages: 'Packages',
  notifications: 'Notifications',
  help: 'Help & Support',
  settings: 'SchoolSettings',
  controlSettings: 'ControlSettings',
  expenseCategories: 'ExpenseCategories',
  expenses: 'Expenses',
  availability: 'Availability',
  documents: 'Documents',
  media: 'MediaLibrary',
  audit: 'AuditLogs'
};

var CONTROL_CENTER_IDS = {
  students: { header: 'Student ID', prefix: 'ST-', width: 6 },
  lessons: { header: 'Lesson ID', prefix: 'LES-', width: 6 },
  trainers: { header: 'Trainer ID', prefix: 'TR-', width: 6 },
  payments: { header: 'Transaction ID', prefix: 'TX-', width: 6 },
  invoices: { header: 'Invoice ID', prefix: 'INV-' + new Date().getFullYear() + '-', width: 3 },
  packages: { header: 'id', prefix: 'PKG-', width: 6 },
  notifications: { header: 'Notification ID', prefix: 'NOT-', width: 6 },
  help: { header: 'ID', prefix: 'FAQ-', width: 3 },
  controlSettings: { header: 'Key', prefix: 'CFG-', width: 6 },
  expenseCategories: { header: 'Category ID', prefix: 'EXP-CAT-', width: 4 },
  expenses: { header: 'Expense ID', prefix: 'EXP-', width: 6 },
  availability: { header: 'Availability ID', prefix: 'AVL-', width: 6 },
  documents: { header: 'Document ID', prefix: 'DOC-', width: 6 },
  media: { header: 'id', prefix: 'MED-', width: 6 }
};

var CONTROL_CENTER_MEDIA_HEADERS = [
  'id', 'titleEn', 'titleNl', 'titleAr',
  'descriptionEn', 'descriptionNl', 'descriptionAr',
  'category', 'isEnabled', 'url', 'thumbnail', 'duration',
  'language', 'driveFileId', 'driveShareUrl', 'isDeletedByTrainer', 'type'
];

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
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  controlCenterEnsureRequiredSheets_(ss);
  var settings = controlCenterSingleRow_(ss, CONTROL_CENTER_SHEETS.settings);
  return {
    generatedAt: new Date().toISOString(),
    dashboard: controlCenterDashboard_(ss),
    students: controlCenterRows_(ss, CONTROL_CENTER_SHEETS.students),
    lessons: controlCenterRows_(ss, CONTROL_CENTER_SHEETS.lessons),
    trainers: controlCenterRows_(ss, CONTROL_CENTER_SHEETS.trainers),
    trainerSchedule: controlCenterRows_(ss, CONTROL_CENTER_SHEETS.trainerSchedule),
    instructors: controlCenterRows_(ss, CONTROL_CENTER_SHEETS.trainers),
    payments: controlCenterRows_(ss, CONTROL_CENTER_SHEETS.payments),
    invoices: controlCenterRows_(ss, CONTROL_CENTER_SHEETS.invoices),
    packages: controlCenterRows_(ss, CONTROL_CENTER_SHEETS.packages),
    notifications: controlCenterRows_(ss, CONTROL_CENTER_SHEETS.notifications),
    help: controlCenterRows_(ss, CONTROL_CENTER_SHEETS.help),
    settings: settings,
    controlSettings: controlCenterRows_(ss, CONTROL_CENTER_SHEETS.controlSettings),
    expenseCategories: controlCenterRows_(ss, CONTROL_CENTER_SHEETS.expenseCategories),
    expenses: controlCenterRows_(ss, CONTROL_CENTER_SHEETS.expenses),
    availability: controlCenterRows_(ss, CONTROL_CENTER_SHEETS.availability),
    documents: controlCenterRows_(ss, CONTROL_CENTER_SHEETS.documents),
    media: controlCenterRows_(ss, CONTROL_CENTER_SHEETS.media),
    audit: controlCenterRows_(ss, CONTROL_CENTER_SHEETS.audit).slice(-100).reverse(),
    schemas: controlCenterSchemas_(ss),
    status: controlCenterStatus_(ss)
  };
}

function controlCenterEnsureRequiredSheets_(ss) {
  var media = ss.getSheetByName(CONTROL_CENTER_SHEETS.media);
  if (!media) {
    media = ss.insertSheet(CONTROL_CENTER_SHEETS.media);
    media.getRange(1, 1, 1, CONTROL_CENTER_MEDIA_HEADERS.length).setValues([CONTROL_CENTER_MEDIA_HEADERS]);
    media.setFrozenRows(1);
    controlCenterAudit_('Create schema', 'MediaLibrary', '', JSON.stringify(CONTROL_CENTER_MEDIA_HEADERS));
  }
}

function controlCenterStatus_(ss) {
  var expected = {
    Students: ['Student ID','Name','Email','Phone','Date of Birth','City','Current Package','Balance (€)','Exam Readiness (%)','Status','Theory Exam Status','Drive Folder ID'],
    Lessons: ['Lesson ID','Student ID','Student Name','Trainer Name','Date','Time','Duration (h)','Price (€)','Pickup Location','Status','Calendar Event ID','Instructor Notes','Rating'],
    Wallet: ['Transaction ID','Student ID','Student Name','Date','Type','Amount (€)','Description','Invoice ID','Drive Invoice URL'],
    Invoices: ['Invoice ID','Student ID','Student Name','Student Email','Amount (€)','Date','Description','Status','Drive File ID','Drive PDF URL'],
    Notifications: ['Notification ID','Recipient Role','Target Student ID','Recipient Email','Type','Title','Message','Timestamp','Read Status'],
    Packages: ['id','name','description','hours','price','discountPrice','badge','popular','recommended','colorTheme','displayOrder','isActive','features'],
    'Help & Support': ['ID','Category','Question_AR','Answer_AR','Question_NL','Answer_NL','Question_EN','Answer_EN','Active','Order'],
    SchoolSettings: ['name','shortName','logoUrl','faviconUrl','slogan','address','city','postalCode','country','phone','email','website','kvk','btw','iban','invoiceFooter','certificateFooter','licenseAuthority','primaryVehicle','transmissionType','schoolStamp','instructorSignature','instructorName','facebookUrl','instagramUrl','tiktokUrl','whatsappNumber','googleBusinessUrl','youtubeUrl','primaryColor','secondaryColor','accentColor','dashboardTheme','loginBackgroundUrl','defaultPackageTheme','aiAssistantName','aiCoachEnabled','aiSystemInstructions','aiApprovedSources','notificationsEnabled','lessonPricePerHour','flexiblePackageDescription','privacyPolicyUrl','termsConditionsUrl'],
    Trainers: ['Trainer ID','Name','Email','Phone','License','Vehicle','Rate (€)','Status'],
    TrainerSchedule: ['Trainer ID','Trainer Name','Day of Week','Start Time','End Time','Is Available'],
    ControlSettings: ['Key','Value','Category','Description','Editable','Updated At'],
    ExpenseCategories: ['Category ID','Name','Description','Active','Display Order'],
    Expenses: ['Expense ID','Date','Category ID','Category Name','Amount (€)','Description','Vendor','Payment Method','Receipt URL','Status'],
    Availability: ['Availability ID','Trainer ID','Trainer Name','Date','Start Time','End Time','Status','Notes'],
    Documents: ['Document ID','Owner Type','Owner ID','Owner Name','Document Type','File Name','Drive File ID','Drive URL','Created At','Status'],
    MediaLibrary: CONTROL_CENTER_MEDIA_HEADERS,
    AuditLogs: ['Audit ID','User ID','User Name','User Role','Action','Changed By','Date','Time','Time Zone','IP Address','Device / Browser','Target Record','Previous Value','New Value','Source']
  };
  var checks = [];
  Object.keys(expected).forEach(function(name) {
    var sh = ss.getSheetByName(name);
    if (!sh) {
      checks.push({ sheet: name, ok: false, message: 'Missing sheet' });
      return;
    }
    var actual = sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0].map(function(h){return String(h||'').trim();}) : [];
    var exp = expected[name];
    var ok = actual.length >= exp.length && exp.every(function(h, i){ return actual[i] === h; });
    checks.push({ sheet: name, ok: ok, message: ok ? 'Schema OK' : 'Header mismatch', expected: exp, actual: actual });
  });
  return { ok: checks.every(function(x){ return x.ok; }), checks: checks };
}

function controlCenterSchemas_(ss) {
  var out = {};
  Object.keys(CONTROL_CENTER_SHEETS).forEach(function(key) {
    var sh = ss.getSheetByName(CONTROL_CENTER_SHEETS[key]);
    out[key] = sh && sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0] : [];
  });
  out.instructors = out.trainers || [];
  return out;
}

function controlCenterDashboard_(ss) {
  var students = controlCenterRows_(ss, 'Students');
  var lessons = controlCenterRows_(ss, 'Lessons');
  var payments = controlCenterRows_(ss, 'Wallet');
  var invoices = controlCenterRows_(ss, 'Invoices');
  var today = controlCenterDateKey_(new Date());
  var month = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM');
  var activeStudents = students.filter(function(r){ return String(r.status || '').toLowerCase() === 'active'; }).length;
  var todayLessons = lessons.filter(function(r){ return controlCenterDateKey_(r.date) === today; }).length;
  var upcomingLessons = lessons.filter(function(r){
    var d = controlCenterDateKey_(r.date);
    return d && d >= today && String(r.status || '').toLowerCase() !== 'cancelled';
  }).length;
  var monthlyRevenue = payments.reduce(function(sum, r){
    var d = controlCenterDateKey_(r.date);
    var amount = Number(r.amount || 0);
    var type = String(r.type || '').toLowerCase();
    return d.indexOf(month) === 0 && amount > 0 && type === 'deposit' ? sum + amount : sum;
  }, 0);
  var outstandingBalance = students.reduce(function(sum, r){
    var balance = Number(r.balance || 0);
    return balance < 0 ? sum + Math.abs(balance) : sum;
  }, 0);
  return {
    totalStudents: students.length,
    activeStudents: activeStudents,
    todayLessons: todayLessons,
    upcomingLessons: upcomingLessons,
    monthlyRevenue: monthlyRevenue,
    outstandingBalance: outstandingBalance,
    totalInvoices: invoices.length,
    lastSync: new Date().toISOString()
  };
}

function controlCenterRows_(ss, sheetName) {
  var sh = ss.getSheetByName(sheetName);
  if (!sh || sh.getLastRow() < 1 || sh.getLastColumn() < 1) return [];
  var values = sh.getDataRange().getValues();
  var headers = values[0].map(function(h){ return String(h || '').trim(); });
  return values.slice(1).filter(function(row){ return row.some(function(v){ return v !== ''; }); }).map(function(row, index){
    var obj = { _row: index + 2, _sheet: sheetName };
    headers.forEach(function(h, i){ if (h) obj[h] = controlCenterSerializable_(row[i]); });
    obj.id = controlCenterFirst_(obj, ['Student ID','Lesson ID','Trainer ID','Transaction ID','Invoice ID','Notification ID','Category ID','Expense ID','Availability ID','Document ID','Key','id','ID']);
    if (!obj.id && sheetName === 'TrainerSchedule') obj.id = String(obj['Trainer ID'] || '') + '|' + String(obj['Day of Week'] || '');
    obj.studentId = controlCenterFirst_(obj, ['Student ID','Target Student ID']);
    obj.name = controlCenterFirst_(obj, ['Name','Student Name','titleEn','Question_EN']);
    obj.email = controlCenterFirst_(obj, ['Email','Student Email','Recipient Email']);
    obj.phone = controlCenterFirst_(obj, ['Phone']);
    obj.date = controlCenterFirst_(obj, ['Date']);
    obj.time = controlCenterFirst_(obj, ['Time']);
    obj.status = controlCenterFirst_(obj, ['Status','Read Status','isActive','Active','isEnabled']);
    obj.amount = controlCenterFirst_(obj, ['Amount (€)','Price (€)','price']);
    obj.balance = controlCenterFirst_(obj, ['Balance (€)']);
    obj.type = controlCenterFirst_(obj, ['Type','type']);
    obj.desc = controlCenterFirst_(obj, ['Description','Message','description']);
    return obj;
  });
}

function controlCenterSingleRow_(ss, sheetName) {
  var rows = controlCenterRows_(ss, sheetName);
  return rows.length ? rows[0] : {};
}

function controlCenterInstructorRows_(settings) {
  if (!settings) return [];
  var name = settings.instructorName || '';
  if (!name && !settings.phone && !settings.email) return [];
  return [{
    id: 'PRIMARY-INSTRUCTOR',
    'Instructor Name': name,
    Phone: settings.phone || '',
    Email: settings.email || '',
    'Primary Vehicle': settings.primaryVehicle || '',
    'Transmission Type': settings.transmissionType || '',
    'License Authority': settings.licenseAuthority || '',
    'Lesson Price Per Hour': settings.lessonPricePerHour || '',
    'Instructor Signature': settings.instructorSignature || '',
    name: name,
    phone: settings.phone || '',
    email: settings.email || '',
    status: name ? 'active' : 'inactive'
  }];
}

function controlCenterSaveRecord(section, data) {
  if (!data || typeof data !== 'object') throw new Error('Record data is required.');
  if (section === 'settings') return controlCenterSaveSettings_(data);
  if (section === 'instructors' || section === 'trainers') return controlCenterSaveGeneric_('trainers', data);
  if (section === 'trainerSchedule') return controlCenterSaveTrainerSchedule_(data);
  if (section === 'payments') return controlCenterSavePayment_(data);
  if (section === 'lessons') return controlCenterSaveLesson_(data);
  if (section === 'students') return controlCenterSaveStudent_(data);
  if (section === 'invoices') return controlCenterSaveInvoice_(data);
  if (section === 'notifications') return controlCenterSaveNotification_(data);
  return controlCenterSaveGeneric_(section, data);
}

function controlCenterSaveStudent_(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Students');
  if (!sh) throw new Error('Students sheet is missing.');
  var headers = controlCenterHeaders_(sh);
  var id = String(data['Student ID'] || data.id || '').trim();
  var isNew = !id;
  if (!id) id = controlCenterNextId_(sh, 'Student ID', 'ST-', 6);
  data['Student ID'] = id;
  if (!String(data.Name || '').trim()) throw new Error('Student name is required.');
  if (!String(data.Email || '').trim()) throw new Error('Student email is required.');
  if (isNew) {
    if (data['Balance (€)'] === '' || data['Balance (€)'] == null) data['Balance (€)'] = 0;
    if (data['Exam Readiness (%)'] === '' || data['Exam Readiness (%)'] == null) data['Exam Readiness (%)'] = 0;
    if (!data.Status) data.Status = 'active';
  }
  return controlCenterUpsertRow_(sh, headers, 'Student ID', id, data, 'student');
}

function controlCenterSaveLesson_(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Lessons');
  if (!sh) throw new Error('Lessons sheet is missing.');
  var headers = controlCenterHeaders_(sh);
  var id = String(data['Lesson ID'] || data.id || '').trim();
  var isNew = !id;
  if (!id) id = controlCenterNextId_(sh, 'Lesson ID', 'LES-', 6);
  data['Lesson ID'] = id;
  var studentId = String(data['Student ID'] || '').trim();
  if (!studentId) throw new Error('Student ID is required.');
  if (!String(data.Date || '').trim()) throw new Error('Lesson date is required.');
  if (!String(data.Time || '').trim()) throw new Error('Lesson time is required.');
  var student = controlCenterFindStudent_(ss, studentId);
  data['Student Name'] = student.name;
  var settings = controlCenterSingleRow_(ss, 'SchoolSettings');
  if (!String(data['Trainer Name'] || '').trim()) data['Trainer Name'] = settings.instructorName || 'Instructor';
  var duration = Number(data['Duration (h)'] || 1);
  if (!(duration > 0 && duration <= 8)) throw new Error('Lesson duration must be between 0 and 8 hours.');
  data['Duration (h)'] = duration;
  var price = Number(data['Price (€)']);
  if (!(price >= 0)) price = duration * (Number(settings.lessonPricePerHour) || 65);
  data['Price (€)'] = price;
  if (!data.Status) data.Status = 'upcoming';
  if (isNew && Number(student.balance) < price) throw new Error('Insufficient student wallet balance. Required €' + price + ', current €' + Number(student.balance || 0));
  var result = controlCenterUpsertRow_(sh, headers, 'Lesson ID', id, data, 'lesson');
  if (isNew && price > 0) {
    controlCenterAppendWallet_(ss, studentId, student.name, 'payment', price, 'Reserved driving lesson (' + id + ') on ' + data.Date + ' at ' + data.Time, '');
    controlCenterRebuildBalance_(ss, studentId);
  }
  return result;
}

function controlCenterSavePayment_(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Wallet');
  if (!sh) throw new Error('Wallet sheet is missing.');
  var id = String(data['Transaction ID'] || data.id || '').trim();
  if (id) {
    var headers = controlCenterHeaders_(sh);
    var old = controlCenterFindRowById_(sh, headers, 'Transaction ID', id);
    if (old.row < 2) throw new Error('Wallet transaction not found.');
    var previous = sh.getRange(old.row, 1, 1, headers.length).getDisplayValues()[0];
    var studentId = String(data['Student ID'] || previous[1] || '').trim();
    var result = controlCenterUpsertRow_(sh, headers, 'Transaction ID', id, data, 'payment');
    controlCenterRebuildBalance_(ss, studentId);
    return result;
  }
  var sid = String(data['Student ID'] || '').trim();
  var amount = Number(data['Amount (€)']);
  if (!sid) throw new Error('Student ID is required.');
  if (!(amount > 0)) throw new Error('Deposit amount must be greater than zero.');
  var student = controlCenterFindStudent_(ss, sid);
  var desc = String(data.Description || 'Balance Top-Up').trim();
  var txId = controlCenterAppendWallet_(ss, sid, student.name, 'deposit', amount, desc, String(data['Invoice ID'] || ''));
  controlCenterRebuildBalance_(ss, sid);
  controlCenterAudit_('Add deposit', txId, '', JSON.stringify({ studentId: sid, amount: amount, description: desc }));
  return { success: true, id: txId, created: true };
}

function controlCenterAppendWallet_(ss, studentId, studentName, type, amount, description, invoiceId) {
  var sh = ss.getSheetByName('Wallet');
  var headers = controlCenterHeaders_(sh);
  var id = controlCenterNextId_(sh, 'Transaction ID', 'TX-', 6);
  var row = {
    'Transaction ID': id,
    'Student ID': studentId,
    'Student Name': studentName,
    'Date': Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    'Type': type,
    'Amount (€)': amount,
    'Description': description,
    'Invoice ID': invoiceId || '',
    'Drive Invoice URL': ''
  };
  sh.appendRow(headers.map(function(h){ return controlCenterSanitizeCell_(row[h]); }));
  return id;
}

function controlCenterSaveInvoice_(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Invoices');
  if (!sh) throw new Error('Invoices sheet is missing.');
  var headers = controlCenterHeaders_(sh);
  var id = String(data['Invoice ID'] || data.id || '').trim();
  if (!id) id = controlCenterNextId_(sh, 'Invoice ID', 'INV-' + new Date().getFullYear() + '-', 3);
  data['Invoice ID'] = id;
  var sid = String(data['Student ID'] || '').trim();
  if (!sid) throw new Error('Student ID is required.');
  var student = controlCenterFindStudent_(ss, sid);
  data['Student Name'] = student.name;
  data['Student Email'] = student.email;
  if (!data.Date) data.Date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  if (!data.Status) data.Status = 'unpaid';
  if (!(Number(data['Amount (€)']) >= 0)) throw new Error('Invoice amount must be zero or greater.');
  return controlCenterUpsertRow_(sh, headers, 'Invoice ID', id, data, 'invoice');
}

function controlCenterSaveNotification_(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Notifications');
  if (!sh) throw new Error('Notifications sheet is missing.');
  var headers = controlCenterHeaders_(sh);
  var id = String(data['Notification ID'] || data.id || '').trim();
  if (!id) id = controlCenterNextId_(sh, 'Notification ID', 'NOT-', 6);
  data['Notification ID'] = id;
  if (!String(data.Title || '').trim()) throw new Error('Notification title is required.');
  if (!String(data.Message || '').trim()) throw new Error('Notification message is required.');
  if (!data.Timestamp) data.Timestamp = new Date().toISOString();
  if (data['Read Status'] === '' || data['Read Status'] == null) data['Read Status'] = 'FALSE';
  return controlCenterUpsertRow_(sh, headers, 'Notification ID', id, data, 'notification');
}

function controlCenterSaveInstructor_(data) {
  var settingsPatch = {
    instructorName: data['Instructor Name'] || data.name || '',
    phone: data.Phone || data.phone || '',
    email: data.Email || data.email || '',
    primaryVehicle: data['Primary Vehicle'] || '',
    transmissionType: data['Transmission Type'] || '',
    licenseAuthority: data['License Authority'] || '',
    lessonPricePerHour: data['Lesson Price Per Hour'] || '',
    instructorSignature: data['Instructor Signature'] || ''
  };
  if (!String(settingsPatch.instructorName).trim()) throw new Error('Instructor name is required.');
  return controlCenterSaveSettings_(settingsPatch, 'Update instructor profile');
}

function controlCenterSaveSettings_(data, action) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('SchoolSettings');
  if (!sh) throw new Error('SchoolSettings sheet is missing.');
  var headers = controlCenterHeaders_(sh);
  var old = sh.getLastRow() >= 2 ? sh.getRange(2, 1, 1, headers.length).getDisplayValues()[0] : headers.map(function(){ return ''; });
  var next = headers.map(function(h, i){ return Object.prototype.hasOwnProperty.call(data, h) ? controlCenterSanitizeCell_(data[h]) : old[i]; });
  if (sh.getLastRow() >= 2) sh.getRange(2, 1, 1, headers.length).setValues([next]); else sh.appendRow(next);
  controlCenterAudit_(action || 'Update school settings', 'SchoolSettings', JSON.stringify(old), JSON.stringify(next));
  return { success: true, id: 'SchoolSettings', created: sh.getLastRow() < 2 };
}

function controlCenterSaveTrainerSchedule_(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('TrainerSchedule');
  if (!sh) throw new Error('TrainerSchedule sheet is missing.');
  var trainerId = String(data['Trainer ID'] || '').trim();
  var day = String(data['Day of Week'] || '').trim();
  if (!trainerId) throw new Error('Trainer ID is required.');
  if (!day) throw new Error('Day of Week is required.');
  var trainer = controlCenterFindTrainer_(ss, trainerId);
  data['Trainer Name'] = trainer.name;
  var headers = controlCenterHeaders_(sh);
  var rows = sh.getLastRow() >= 2 ? sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getDisplayValues() : [];
  var trIdx = headers.indexOf('Trainer ID'), dayIdx = headers.indexOf('Day of Week'), foundRow = -1;
  for (var i = 0; i < rows.length; i++) if (String(rows[i][trIdx]) === trainerId && String(rows[i][dayIdx]) === day) { foundRow = i + 2; break; }
  var previous = foundRow > 1 ? sh.getRange(foundRow, 1, 1, headers.length).getDisplayValues()[0] : null;
  var values = headers.map(function(h){ return controlCenterSanitizeCell_(Object.prototype.hasOwnProperty.call(data, h) ? data[h] : ''); });
  if (foundRow > 1) sh.getRange(foundRow, 1, 1, headers.length).setValues([values]); else sh.appendRow(values);
  var id = trainerId + '|' + day;
  controlCenterAudit_((foundRow > 1 ? 'Update ' : 'Create ') + 'trainer schedule', id, previous ? JSON.stringify(previous) : '', JSON.stringify(values));
  return { success: true, id: id, created: foundRow < 2 };
}

function controlCenterFindTrainer_(ss, id) {
  var rows = controlCenterRows_(ss, 'Trainers');
  for (var i = 0; i < rows.length; i++) if (String(rows[i]['Trainer ID']) === String(id)) return { id: id, name: rows[i].Name || '', row: rows[i]._row };
  throw new Error('Trainer was not found.');
}

function controlCenterSaveGeneric_(section, data) {
  var cfg = controlCenterSectionConfig_(section);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(cfg.sheet);
  if (!sh) throw new Error(cfg.sheet + ' sheet is missing.');
  var headers = controlCenterHeaders_(sh);
  var id = String(data[cfg.idHeader] || data.id || '').trim();
  if (!id) id = controlCenterNextId_(sh, cfg.idHeader, cfg.prefix, cfg.width);
  data[cfg.idHeader] = id;
  if (section === 'packages' && !String(data.name || '').trim()) throw new Error('Package name is required.');
  if (section === 'trainers') { if (!String(data.Name || '').trim()) throw new Error('Trainer name is required.'); if (!(Number(data['Rate (€)']) > 0)) throw new Error('Trainer hourly rate must be greater than zero.'); }
  if (section === 'controlSettings') { if (!String(data.Key || data.id || '').trim()) throw new Error('Control setting Key is required.'); if (String(data.Editable || '').toUpperCase() === 'FALSE' && data.id) throw new Error('This control setting is read-only.'); data['Updated At'] = new Date().toISOString(); }
  if (section === 'expenseCategories' && !String(data.Name || '').trim()) throw new Error('Expense category name is required.');
  if (section === 'expenses') { if (!String(data.Date || '').trim()) throw new Error('Expense date is required.'); if (!(Number(data['Amount (€)']) > 0)) throw new Error('Expense amount must be greater than zero.'); if (data['Category ID']) { var catRows = controlCenterRows_(ss, 'ExpenseCategories'); for (var ci=0; ci<catRows.length; ci++) if (String(catRows[ci]['Category ID']) === String(data['Category ID'])) { data['Category Name'] = catRows[ci].Name || ''; break; } } }
  if (section === 'availability') { if (!String(data['Trainer ID'] || '').trim()) throw new Error('Trainer ID is required.'); var tr = controlCenterFindTrainer_(ss, data['Trainer ID']); data['Trainer Name'] = tr.name; if (!String(data.Date || '').trim()) throw new Error('Availability date is required.'); }
  if (section === 'documents') { if (!String(data['Owner Type'] || '').trim()) throw new Error('Owner Type is required.'); if (!String(data['Owner ID'] || '').trim()) throw new Error('Owner ID is required.'); if (!String(data['Drive URL'] || '').trim()) throw new Error('Drive URL is required.'); var ownerType=String(data['Owner Type']).toLowerCase(); if (ownerType==='student') { var st=controlCenterFindStudent_(ss,data['Owner ID']); data['Owner Name']=st.name; } else if (ownerType==='trainer') { var trn=controlCenterFindTrainer_(ss,data['Owner ID']); data['Owner Name']=trn.name; } if (!data['Created At']) data['Created At'] = new Date().toISOString(); }
  if (section === 'help' && !String(data.Question_EN || data.Question_AR || data.Question_NL || '').trim()) throw new Error('At least one FAQ question is required.');
  if (section === 'media' && !String(data.titleEn || data.titleNl || data.titleAr || '').trim()) throw new Error('Media title is required.');
  return controlCenterUpsertRow_(sh, headers, cfg.idHeader, id, data, section);
}

function controlCenterUpsertRow_(sh, headers, idHeader, id, data, auditLabel) {
  var found = controlCenterFindRowById_(sh, headers, idHeader, id);
  var previous = found.row > 1 ? sh.getRange(found.row, 1, 1, headers.length).getDisplayValues()[0] : null;
  var values = headers.map(function(h){ return controlCenterSanitizeCell_(Object.prototype.hasOwnProperty.call(data, h) ? data[h] : ''); });
  if (found.row > 1) sh.getRange(found.row, 1, 1, headers.length).setValues([values]); else sh.appendRow(values);
  controlCenterAudit_((found.row > 1 ? 'Update ' : 'Create ') + auditLabel, id, previous ? JSON.stringify(previous) : '', JSON.stringify(values));
  return { success: true, id: id, created: found.row < 2 };
}

function controlCenterDeleteRecord(section, id) {
  if (['settings','audit'].indexOf(section) !== -1) throw new Error('This section cannot be deleted from the Control Center.');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (section === 'trainerSchedule') {
    var shSchedule = ss.getSheetByName('TrainerSchedule');
    var headersSchedule = controlCenterHeaders_(shSchedule);
    var trIdx = headersSchedule.indexOf('Trainer ID'), dayIdx = headersSchedule.indexOf('Day of Week');
    var parts = String(id).split('|');
    if (parts.length < 2) throw new Error('Trainer schedule key is invalid.');
    var dataRows = shSchedule.getLastRow() >= 2 ? shSchedule.getRange(2,1,shSchedule.getLastRow()-1,headersSchedule.length).getDisplayValues() : [];
    for (var si=dataRows.length-1; si>=0; si--) if (String(dataRows[si][trIdx])===parts[0] && String(dataRows[si][dayIdx])===parts.slice(1).join('|')) { var oldSchedule=dataRows[si]; shSchedule.deleteRow(si+2); controlCenterAudit_('Delete trainer schedule',id,JSON.stringify(oldSchedule),'DELETED'); return {success:true,id:id}; }
    throw new Error('Trainer schedule record not found.');
  }
  var cfg = controlCenterSectionConfig_(section);
  var sh = ss.getSheetByName(cfg.sheet);
  if (!sh) throw new Error(cfg.sheet + ' sheet is missing.');
  var headers = controlCenterHeaders_(sh);
  var found = controlCenterFindRowById_(sh, headers, cfg.idHeader, id);
  if (found.row < 2) throw new Error('Record not found.');
  var old = sh.getRange(found.row, 1, 1, headers.length).getDisplayValues()[0];

  if (section === 'students') {
    var sid = String(id);
    var referenced = controlCenterRows_(ss, 'Lessons').some(function(r){ return String(r['Student ID']) === sid; }) || controlCenterRows_(ss, 'Wallet').some(function(r){ return String(r['Student ID']) === sid; }) || controlCenterRows_(ss, 'Invoices').some(function(r){ return String(r['Student ID']) === sid; });
    if (referenced) throw new Error('Student has related operational records. Set Status to inactive instead of deleting.');
  }
  if (section === 'trainers') {
    var trainerId = String(id), trainerName = headers.indexOf('Name') >= 0 ? String(old[headers.indexOf('Name')] || '') : '';
    var trainerUsed = controlCenterRows_(ss,'TrainerSchedule').some(function(r){return String(r['Trainer ID'])===trainerId;}) || controlCenterRows_(ss,'Availability').some(function(r){return String(r['Trainer ID'])===trainerId;}) || controlCenterRows_(ss,'Lessons').some(function(r){return trainerName && String(r['Trainer Name'])===trainerName;});
    if (trainerUsed) throw new Error('Trainer has related records. Set Status to inactive instead of deleting.');
  }
  if (section === 'packages') {
    var nameIdx = headers.indexOf('name'), packageName = nameIdx >= 0 ? String(old[nameIdx] || '') : '';
    var inUse = controlCenterRows_(ss, 'Students').some(function(r){ return String(r['Current Package'] || '') === packageName; });
    if (inUse) throw new Error('Package is assigned to students. Disable it with isActive=FALSE instead of deleting.');
  }
  if (section === 'invoices') {
    var usedByWallet = controlCenterRows_(ss, 'Wallet').some(function(r){ return String(r['Invoice ID'] || '') === String(id); });
    if (usedByWallet) throw new Error('Invoice is referenced by wallet transactions and cannot be deleted.');
  }
  if (section === 'expenseCategories') {
    var usedByExpense = controlCenterRows_(ss,'Expenses').some(function(r){return String(r['Category ID']||'')===String(id);});
    if (usedByExpense) throw new Error('Expense category is in use and cannot be deleted. Set Active to FALSE instead.');
  }
  var studentId = '';
  if (section === 'payments') { var stIdx = headers.indexOf('Student ID'); studentId = stIdx >= 0 ? String(old[stIdx] || '') : ''; }
  if (section === 'lessons') {
    var stIdxLesson = headers.indexOf('Student ID'); studentId = stIdxLesson >= 0 ? String(old[stIdxLesson] || '') : '';
    var wallet = ss.getSheetByName('Wallet');
    if (wallet && wallet.getLastRow() >= 2) {
      var wHeaders = controlCenterHeaders_(wallet), descIdx = wHeaders.indexOf('Description'), typeIdx = wHeaders.indexOf('Type'), walletRows = wallet.getDataRange().getDisplayValues();
      for (var wi = walletRows.length - 1; wi >= 1; wi--) { var desc = descIdx >= 0 ? String(walletRows[wi][descIdx] || '') : '', type = typeIdx >= 0 ? String(walletRows[wi][typeIdx] || '').toLowerCase() : ''; if (type === 'payment' && desc.indexOf('(' + id + ')') !== -1) wallet.deleteRow(wi + 1); }
    }
  }
  sh.deleteRow(found.row);
  if (studentId) controlCenterRebuildBalance_(ss, studentId);
  controlCenterAudit_('Delete ' + section, String(id), JSON.stringify(old), 'DELETED');
  return { success: true, id: id };
}

function controlCenterRebuildBalance_(ss, studentId) {
  var tx = controlCenterRows_(ss, 'Wallet');
  var balance = 0;
  tx.forEach(function(r){
    if (String(r['Student ID']) !== String(studentId)) return;
    var amount = Number(r['Amount (€)']) || 0;
    var type = String(r.Type || '').toLowerCase();
    if (type === 'deposit' || type === 'adjustment') balance += amount;
    else if (type === 'payment') balance -= amount;
  });
  var sh = ss.getSheetByName('Students');
  var headers = controlCenterHeaders_(sh);
  var idCol = headers.indexOf('Student ID');
  var balCol = headers.indexOf('Balance (€)');
  if (idCol < 0 || balCol < 0) throw new Error('Students wallet columns are missing.');
  if (sh.getLastRow() < 2) throw new Error('Student was not found while rebuilding balance.');
  var ids = sh.getRange(2, idCol + 1, sh.getLastRow() - 1, 1).getDisplayValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(studentId)) {
      sh.getRange(i + 2, balCol + 1).setValue(balance);
      return balance;
    }
  }
  throw new Error('Student was not found while rebuilding balance.');
}

function controlCenterFindStudent_(ss, id) {
  var rows = controlCenterRows_(ss, 'Students');
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i]['Student ID']) === String(id)) {
      return { id: id, name: rows[i].Name || '', email: rows[i].Email || '', balance: Number(rows[i]['Balance (€)']) || 0, row: rows[i]._row };
    }
  }
  throw new Error('Student was not found.');
}

function controlCenterHeaders_(sh) {
  if (!sh || !sh.getLastColumn()) return [];
  return sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0].map(function(h){ return String(h || '').trim(); });
}

function controlCenterSectionConfig_(section) {
  var ids = CONTROL_CENTER_IDS[section];
  var sheet = CONTROL_CENTER_SHEETS[section];
  if (!ids || !sheet) throw new Error('Unsupported Control Center section: ' + section);
  return { sheet: sheet, idHeader: ids.header, prefix: ids.prefix, width: ids.width };
}

function controlCenterFindRowById_(sh, headers, idHeader, id) {
  var idx = headers.indexOf(idHeader);
  if (idx < 0) throw new Error('Required ID column "' + idHeader + '" is missing from ' + sh.getName() + '.');
  if (sh.getLastRow() < 2) return { row: -1, index: idx };
  var ids = sh.getRange(2, idx + 1, sh.getLastRow() - 1, 1).getDisplayValues();
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return { row: i + 2, index: idx };
  return { row: -1, index: idx };
}

function controlCenterNextId_(sh, idHeader, prefix, width) {
  var headers = controlCenterHeaders_(sh);
  var idx = headers.indexOf(idHeader);
  if (idx < 0) throw new Error('Required ID column "' + idHeader + '" is missing.');
  var max = 0;
  if (sh.getLastRow() >= 2) {
    sh.getRange(2, idx + 1, sh.getLastRow() - 1, 1).getDisplayValues().forEach(function(r){
      var value = String(r[0] || '');
      if (value.indexOf(prefix) === 0) {
        var n = parseInt(value.slice(prefix.length), 10);
        if (!isNaN(n) && n > max) max = n;
      }
    });
  }
  return prefix + String(max + 1).padStart(width, '0');
}

function controlCenterSanitizeCell_(value) {
  if (value === null || typeof value === 'undefined') return '';
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  var s = String(value);
  if (/^[=+@]/.test(s) || (/^-/.test(s) && !/^-?\d+(\.\d+)?$/.test(s))) return "'" + s;
  return s;
}

function controlCenterSerializable_(value) {
  return value instanceof Date ? Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss') : value;
}

function controlCenterFirst_(obj, keys) {
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== '') return obj[key];
  }
  return '';
}

function controlCenterDateKey_(value) {
  if (!value) return '';
  var d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return String(value).slice(0, 10);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function controlCenterAudit_(action, target, previousValue, newValue) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AuditLogs');
  if (!sh) return;
  var headers = controlCenterHeaders_(sh);
  var now = new Date();
  var row = {
    'Audit ID': 'AUD-' + Date.now(),
    'User ID': 'ADMIN-01',
    'User Name': 'System Administrator',
    'User Role': 'Admin',
    'Action': action,
    'Changed By': 'Master Control Center',
    'Date': Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    'Time': Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm:ss'),
    'Time Zone': Session.getScriptTimeZone(),
    'IP Address': '',
    'Device / Browser': '',
    'Target Record': target,
    'Previous Value': previousValue,
    'New Value': newValue,
    'Source': 'Google Sheets Master Control Center'
  };
  sh.appendRow(headers.map(function(h){ return Object.prototype.hasOwnProperty.call(row, h) ? row[h] : ''; }));
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
