/**
 * TAREK RIJSCHOOL — HTML email template engine.
 */

function emailSchoolSettings_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SchoolSettings');
  const fallback = { name: 'TAREK RIJSCHOOL', shortName: 'TAREK RIJSCHOOL', city: '', email: '', instructorName: '' };
  if (!sh || sh.getLastRow() < 2 || sh.getLastColumn() < 1) return fallback;
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0];
  const values = sh.getRange(2, 1, 1, sh.getLastColumn()).getDisplayValues()[0];
  const out = Object.assign({}, fallback);
  headers.forEach((h, i) => { if (h) out[String(h).trim()] = values[i]; });
  out.name = out.name || fallback.name;
  out.shortName = out.shortName || out.name;
  return out;
}

function sendResponsiveEmail(recipientEmail, studentName, type, details) {
  if (!recipientEmail) throw new Error('Recipient email is required.');
  details = details || {};
  const school = emailSchoolSettings_();
  const schoolName = school.name || 'TAREK RIJSCHOOL';
  const instructorName = school.instructorName || 'your instructor';
  const subjects = {
    booking: '🚙 تم تأكيد حجز درس القيادة - ' + schoolName,
    completion: '📝 تقرير درس القيادة - ' + schoolName,
    deposit: '💰 تأكيد إضافة رصيد المحفظة - ' + schoolName,
    invoice: '🧾 فاتورة جديدة ' + (details.invoiceId || '') + ' - ' + schoolName
  };
  const subject = subjects[type] || '🔔 إشعار جديد - ' + schoolName;
  const htmlBody = getEmailHtmlTemplate(studentName, type, details);
  const mailOptions = { htmlBody: htmlBody, name: schoolName };
  if (details.attachments && details.attachments.length) mailOptions.attachments = details.attachments;

  GmailApp.sendEmail(recipientEmail, subject, '', mailOptions);

  if (typeof controlCenterCreateNotification_ === 'function') {
    controlCenterCreateNotification_({
      studentId: String(details.studentId || ''),
      email: recipientEmail,
      type: 'email_' + String(type || 'general'),
      title: subject,
      message: 'Email sent to ' + recipientEmail + (mailOptions.attachments ? ' with attachment.' : '.')
    });
  }
  if (typeof writeAdminLog === 'function') {
    writeAdminLog('Send Email', 'Apps Script', 'Sent ' + String(type || 'general') + ' email to ' + recipientEmail);
  }
  return { success: true };
}

function getEmailHtmlTemplate(studentName, type, details) {
  details = details || {};
  const school = emailSchoolSettings_();
  const schoolName = school.name || 'TAREK RIJSCHOOL';
  const instructorName = school.instructorName || 'المدرب';
  const footerBits = [school.city, school.email].filter(Boolean).join(' | ');
  const dateStr = details.date || '';
  const timeStr = details.time || '';
  const duration = details.duration || '';
  const pickup = details.pickupLocation || '';
  const price = Number(details.price || 0);
  const notes = details.notes || '';
  const amount = Number(details.amount || 0);
  const paymentMethod = details.paymentMethod || '';
  const newBalance = Number(details.newBalance || 0);
  const invoiceTotal = Number(details.grandTotal || details.amount || 0);
  let bodyContent = '';

  if (type === 'booking') {
    bodyContent = '<h2 style="color:#1e40af">تم تأكيد حجز الدرس 🎉</h2>' +
      '<p>عزيزي المتدرب <strong>' + studentName + '</strong>، تم تسجيل درس القيادة الخاص بك.</p>' +
      '<div style="background:#f8fafc;border-right:4px solid #1e40af;padding:15px;margin:20px 0">' +
      '<p>📅 <strong>التاريخ:</strong> ' + dateStr + '</p><p>🕒 <strong>الوقت:</strong> ' + timeStr + '</p>' +
      '<p>⏳ <strong>المدة:</strong> ' + duration + ' ساعة</p><p>📍 <strong>موقع الالتقاء:</strong> ' + pickup + '</p>' +
      '<p>💰 <strong>السعر:</strong> €' + price.toFixed(2) + '</p></div>';
  } else if (type === 'completion') {
    bodyContent = '<h2 style="color:#16a34a">تقرير الحصة 📝</h2>' +
      '<p>عزيزي المتدرب <strong>' + studentName + '</strong>، تم إكمال حصتك التدريبية.</p>' +
      '<div style="background:#f0fdf4;border-right:4px solid #16a34a;padding:15px;margin:20px 0">' +
      '<p>📅 <strong>التاريخ:</strong> ' + dateStr + '</p><p>⏱️ <strong>المدة:</strong> ' + duration + ' ساعة</p>' +
      '<p>💬 <strong>ملاحظات ' + instructorName + ':</strong> ' + notes + '</p></div>';
  } else if (type === 'deposit') {
    bodyContent = '<h2 style="color:#d97706">تمت إضافة الرصيد 💰</h2>' +
      '<p>عزيزي المتدرب <strong>' + studentName + '</strong>، تم تسجيل الدفعة في محفظتك.</p>' +
      '<div style="background:#fffbeb;border-right:4px solid #d97706;padding:15px;margin:20px 0">' +
      '<p>💵 <strong>المبلغ:</strong> €' + amount.toFixed(2) + '</p><p>💳 <strong>الوصف:</strong> ' + paymentMethod + '</p>' +
      '<p><strong>الرصيد الحالي:</strong> €' + newBalance.toFixed(2) + '</p></div>';
  } else if (type === 'invoice') {
    bodyContent = '<h2 style="color:#0f172a">فاتورة جديدة 🧾</h2>' +
      '<p>رقم الفاتورة: <strong>' + (details.invoiceId || '') + '</strong></p>' +
      '<div style="background:#f8fafc;padding:15px;margin:20px 0"><p>' + (details.description || 'Driving lessons') + '</p>' +
      '<p><strong>الإجمالي:</strong> €' + invoiceTotal.toFixed(2) + '</p></div>';
  } else {
    bodyContent = '<p>عزيزي <strong>' + studentName + '</strong>، لديك إشعار جديد من ' + schoolName + '.</p>';
  }

  return '<div style="background:#f1f5f9;padding:20px 10px;direction:rtl;text-align:right;font-family:Arial,sans-serif">' +
    '<table style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;width:100%">' +
    '<tr><td style="background:#0f172a;padding:25px 30px;text-align:center;border-bottom:4px solid #d97706;color:#fff;font-size:20px;font-weight:900">' + schoolName + '</td></tr>' +
    '<tr><td style="padding:30px">' + bodyContent + '</td></tr>' +
    '<tr><td style="background:#f8fafc;padding:18px;text-align:center;font-size:11px;color:#64748b;border-top:1px solid #e2e8f0">' + schoolName + (footerBits ? ' | ' + footerBits : '') + '</td></tr>' +
    '</table></div>';
}
