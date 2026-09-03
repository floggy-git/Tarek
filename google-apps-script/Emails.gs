/**
 * Al-Andalos Driving Academy — HTML Email Template Engine & Background Workers
 */

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

/**
 * Compiles beautiful, premium, branded responsive HTML templates based on event types.
 */
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
