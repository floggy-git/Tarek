/**
 * Utility helper to dispatch premium styled notifications and invoices
 * directly to the student's email using the fullstack server.
 */

export interface EmailDetails {
  date?: string;
  time?: string;
  duration?: number;
  pickupLocation?: string;
  price?: number;
  amount?: number;
  paymentMethod?: string;
  newBalance?: number;
  invoiceId?: string;
  description?: string;
  subtotal?: number;
  vatRate?: number;
  vatAmount?: number;
  grandTotal?: number;
  notes?: string;
}

/**
 * Sends a highly styled email to the student's email.
 * Defaults to the active user's registered email (floggyc77@gmail.com) for realistic delivery.
 */
export async function sendAppEmail(
  toName: string,
  type: 'booking' | 'cancellation' | 'completion' | 'deposit' | 'invoice',
  details: EmailDetails
) {
  // Use the user's actual email for an immersive, fully-functional experience
  const recipientEmail = "floggyc77@gmail.com";
  const subject = getEmailSubject(type, details);
  const html = getEmailHtml(toName, type, details);

  try {
    const payload = JSON.stringify({
      to: recipientEmail,
      subject,
      html,
      type,
      studentName: toName,
      metadata: details
    });

    // Safely encode to Uint8Array (binary UTF-8) to completely bypass any browser/iframe string-to-binary conversion bugs
    const encodedBody = new TextEncoder().encode(payload);

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: encodedBody
    });
    return await response.json();
  } catch (error) {
    console.error("Failed to send app email via API:", error);
    return { success: false, error: String(error) };
  }
}

function getEmailSubject(type: string, details: EmailDetails): string {
  switch (type) {
    case 'booking':
      return `🚙 تم تأكيد حجز درس القيادة الخاص بك - مدرسة الأندلس للقيادة`;
    case 'cancellation':
      return `⚠️ تنبيه: تم إلغاء درس القيادة الخاص بك - مدرسة الأندلس للقيادة`;
    case 'completion':
      return `📝 تقرير درس القيادة وملاحظات المدرب سمير - مدرسة الأندلس`;
    case 'deposit':
      return `💰 تأكيد شحن رصيد محفظتك الرقمية - مدرسة الأندلس`;
    case 'invoice':
      return `🧾 فاتورة ضريبية رسمية جديدة (${details.invoiceId || 'INV'}) - مدرسة الأندلس`;
    default:
      return `🔔 إشعار جديد من مدرسة الأندلس للقيادة`;
  }
}

function getEmailHtml(toName: string, type: 'booking' | 'cancellation' | 'completion' | 'deposit' | 'invoice', details: EmailDetails): string {
  const dateStr = details.date || new Date().toISOString().split('T')[0];
  const timeStr = details.time || '10:00';
  
  // Style config variables
  const primaryColor = "#0f172a"; // Slate-900
  const accentColor = "#1e40af"; // Blue-800
  const goldColor = "#d97706"; // Amber-600
  
  let contentHtml = "";

  if (type === 'booking') {
    contentHtml = `
      <div style="direction: rtl; text-align: right; font-family: 'Inter', sans-serif;">
        <h2 style="color: ${accentColor}; margin-bottom: 15px;">تهانينا، تم تأكيد حجز الدرس بنجاح! 🎉</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          عزيزي المتدرب <strong>${toName}</strong>، يسعدنا إبلاغك بأنه قد تم تسجيل وتأكيد درس القيادة الميداني الخاص بك بنجاح في جدول المدرب <strong>سمير الفيلالي</strong>.
        </p>
        
        <div style="background-color: #f8fafc; border-right: 4px solid ${accentColor}; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #64748b;"><strong>التاريخ والوقت:</strong></td>
              <td style="padding: 6px 0; font-size: 14px; color: #0f172a; text-align: left;"><strong>${dateStr} (الساعة ${timeStr})</strong></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #64748b;"><strong>مدة الدرس:</strong></td>
              <td style="padding: 6px 0; font-size: 14px; color: #0f172a; text-align: left;">${details.duration || 1} ساعة تدريبية</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #64748b;"><strong>نقطة الالتقاء:</strong></td>
              <td style="padding: 6px 0; font-size: 14px; color: #0f172a; text-align: left;">${details.pickupLocation || 'موقعك المختار'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #64748b;"><strong>التكلفة الإجمالية:</strong></td>
              <td style="padding: 6px 0; font-size: 14px; color: ${goldColor}; text-align: left; font-weight: bold;">€${details.price || 65}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 15px;">
          ⚠️ <strong>ملاحظة هامة للسلامة:</strong> يرجى التواجد في مكان الالتقاء المحدد قبل الموعد بـ 5 دقائق وإحضار بطاقة الهوية الخاصة بك. إذا كنت بحاجة لإلغاء الدرس أو تعديله، يرجى القيام بذلك قبل 24 ساعة على الأقل من موعد الدرس لتجنب احتساب الرسوم.
        </p>
      </div>
    `;
  } else if (type === 'cancellation') {
    contentHtml = `
      <div style="direction: rtl; text-align: right; font-family: 'Inter', sans-serif;">
        <h2 style="color: #dc2626; margin-bottom: 15px;">تنبيه: تم إلغاء درس القيادة ⚠️</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          عزيزي المتدرب <strong>${toName}</strong>، نود إبلاغك بأنه قد تم إلغاء درس القيادة العملي الذي كان مجدولاً مسبقاً.
        </p>

        <div style="background-color: #fef2f2; border-right: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #991b1b;"><strong>موعد الدرس الملغي:</strong></td>
              <td style="padding: 6px 0; font-size: 14px; color: #0f172a; text-align: left;"><strong>${dateStr} (الساعة ${timeStr})</strong></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #991b1b;"><strong>المدرب:</strong></td>
              <td style="padding: 6px 0; font-size: 14px; color: #0f172a; text-align: left;">سمير الفيلالي</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #991b1b;"><strong>حالة المستحقات المادية:</strong></td>
              <td style="padding: 6px 0; font-size: 13px; color: #16a34a; text-align: left; font-weight: bold;">تمت إعادة رصيد الدرس كاملاً (€${details.price || 65}) إلى محفظتك الإلكترونية</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #475569; line-height: 1.5;">
          بإمكانك الدخول إلى حسابك وحجز موعد بديل في أي وقت يناسبك من خلال جدول المواعيد المتاحة الجديد للمدرب.
        </p>
      </div>
    `;
  } else if (type === 'completion') {
    contentHtml = `
      <div style="direction: rtl; text-align: right; font-family: 'Inter', sans-serif;">
        <h2 style="color: #16a34a; margin-bottom: 15px;">تقرير الدرس التدريبي وملاحظات القيادة 📝</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          عزيزي المتدرب <strong>${toName}</strong>، أحسنت صنعاً اليوم! لقد أكملت درسك التدريبي بنجاح مع المدرب <strong>سمير الفيلالي</strong>. إليك تفاصيل وملخص أدائك اليوم لتقوم بمراجعته:
        </p>

        <div style="background-color: #f0fdf4; border-right: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #166534;"><strong>تاريخ الدرس:</strong></td>
              <td style="padding: 6px 0; font-size: 14px; color: #0f172a; text-align: left;"><strong>${dateStr}</strong></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #166534;"><strong>المدة المنجزة:</strong></td>
              <td style="padding: 6px 0; font-size: 14px; color: #0f172a; text-align: left;">${details.duration || 1} ساعة قيادة عملية</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #166534;"><strong>حالة الدفع للدرس:</strong></td>
              <td style="padding: 6px 0; font-size: 13px; color: #1e3a8a; text-align: left; font-weight: bold;">مقتطعة من رصيد المحفظة / مدفوعة</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-top: 15px;">
          <h4 style="margin: 0 0 10px 0; color: #0f172a; font-size: 14px;">💬 تقييم وملاحظات المدرب سمير:</h4>
          <p style="font-size: 13px; color: #475569; line-height: 1.6; margin: 0; font-style: italic;">
            "${details.notes || 'أداء رائع جداً اليوم! تحكم ممتاز بالمسارات، نوصي بمواصلة مراجعة المرايا قبل المناورات الجانبية.'}"
          </p>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 20px;">
          تذكر دائماً أن القيادة الآمنة والالتزام بقوانين السير الهولندية المعتمدة هي طريقك المختصر للنجاح ونيل رخصتك من المرة الأولى!
        </p>
      </div>
    `;
  } else if (type === 'deposit') {
    contentHtml = `
      <div style="direction: rtl; text-align: right; font-family: 'Inter', sans-serif;">
        <h2 style="color: ${goldColor}; margin-bottom: 15px;">تم إيداع الدفعة بنجاح! 💳</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          عزيزي المتدرب <strong>${toName}</strong>، نؤكد لك استلام وإضافة الدفعة المالية المذكورة أدناه إلى حساب محفظتك الرقمية المعتمدة لدى مدرسة الأندلس للقيادة.
        </p>

        <div style="background-color: #fffbeb; border-right: 4px solid ${goldColor}; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #92400e;"><strong>المبلغ المودع:</strong></td>
              <td style="padding: 6px 0; font-size: 18px; color: ${goldColor}; text-align: left; font-weight: bold;">€${details.amount}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #92400e;"><strong>طريقة الدفع:</strong></td>
              <td style="padding: 6px 0; font-size: 13px; color: #0f172a; text-align: left;">${details.paymentMethod || 'إيداع يدوي نقدي / كاش'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #92400e;"><strong>تاريخ المعاملة:</strong></td>
              <td style="padding: 6px 0; font-size: 13px; color: #0f172a; text-align: left;">${dateStr}</td>
            </tr>
            <tr style="border-top: 1px solid #fcd34d;">
              <td style="padding: 10px 0 0 0; font-size: 14px; color: #0f172a; font-weight: bold;"><strong>الرصيد الإجمالي المتاح الآن:</strong></td>
              <td style="padding: 10px 0 0 0; font-size: 16px; color: #16a34a; text-align: left; font-weight: bold;">€${details.newBalance || details.amount}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #475569; line-height: 1.5;">
          بإمكانك استهلاك هذا الرصيد لحجز حصص القيادة الميدانية أو تمويل باقات التدريب الإضافية بسهولة تامة من تطبيق الطالب الخاص بك. شكراً لثقتكم بمدرسة الأندلس.
        </p>
      </div>
    `;
  } else if (type === 'invoice') {
    const vatPercent = details.vatRate || 21;
    const subtotal = details.subtotal || 0;
    const vatAmount = details.vatAmount || 0;
    const grandTotal = details.grandTotal || 0;

    contentHtml = `
      <div style="direction: rtl; text-align: right; font-family: 'Inter', sans-serif;">
        <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td>
                <h1 style="color: ${primaryColor}; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 1px;">AL-ANDALOS RIJSCHOOL</h1>
                <p style="margin: 3px 0 0 0; font-size: 11px; color: #64748b; font-weight: bold;">فاتورة ضريبية رسمية مبسطة | Factuur</p>
              </td>
              <td style="text-align: left; vertical-align: top;">
                <span style="background-color: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; font-family: monospace;">
                  ${details.invoiceId || 'INV-2026-001'}
                </span>
              </td>
            </tr>
          </table>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          المتلقّي الكرام، <strong>${toName}</strong>،<br />
          نرفق لكم طيه بيان الفاتورة الضريبية الصادرة عن مدرسة الأندلس لتعليم القيادة بهولندا لقاء الدروس أو الخدمات الإضافية المذكورة أدناه:
        </p>

        <div style="margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0;">
            <thead>
              <tr style="background-color: #f1f5f9; border-bottom: 2px solid #e2e8f0;">
                <th style="padding: 10px; font-size: 12px; font-weight: bold; color: #475569; text-align: right;">الخدمة / الوصف</th>
                <th style="padding: 10px; font-size: 12px; font-weight: bold; color: #475569; text-align: left; width: 100px;">المبلغ (قبل الضريبة)</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 10px; font-size: 13px; color: #0f172a;">
                  <strong>${details.description || 'حصص تدريب عملي منسقة'}</strong>
                  <div style="font-size: 11px; color: #64748b; margin-top: 3px;">تاريخ الإصدار: ${dateStr}</div>
                </td>
                <td style="padding: 12px 10px; font-size: 13px; color: #0f172a; text-align: left; font-family: monospace;">€${subtotal.toFixed(2)}</td>
              </tr>
              
              <!-- Subtotal row -->
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 10px; font-size: 12px; color: #64748b; text-align: left; font-weight: bold;" colspan="1">المجموع الفرعي (Subtotal):</td>
                <td style="padding: 8px 10px; font-size: 12px; color: #0f172a; text-align: left; font-family: monospace;">€${subtotal.toFixed(2)}</td>
              </tr>
              
              <!-- VAT row -->
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 10px; font-size: 12px; color: #64748b; text-align: left; font-weight: bold;" colspan="1">نسبة ضريبة القيمة المضافة (BTW ${vatPercent}%):</td>
                <td style="padding: 8px 10px; font-size: 12px; color: #d97706; text-align: left; font-family: monospace; font-weight: bold;">+€${vatAmount.toFixed(2)}</td>
              </tr>
              
              <!-- Grand total row -->
              <tr style="background-color: #f8fafc; font-weight: bold; border-top: 2px solid #e2e8f0;">
                <td style="padding: 12px 10px; font-size: 14px; color: #0f172a; text-align: left;" colspan="1">الإجمالي المستحق شامل الضريبة (Totaal BTW Incl.):</td>
                <td style="padding: 12px 10px; font-size: 16px; color: #1e40af; text-align: left; font-family: monospace;">€${grandTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; margin: 20px 0; text-align: center;">
          <span style="font-size: 12px; font-weight: bold; color: #15803d; display: block; margin-bottom: 3px;">ℹ️ طريقة التحصيل والسداد</span>
          <p style="font-size: 11px; color: #166534; margin: 0; line-height: 1.4;">
            سيتم خصم هذه المعاملة تلقائياً من محفظتكم الرقمية المعتمدة في مدرسة الأندلس، أو بإمكانكم السداد بالبطاقة البنكية مباشرة عبر مسح الـ QR في حسابكم أو عبر الرابط المرفق بالتطبيق.
          </p>
        </div>

        <p style="font-size: 11px; text-align: center; color: #94a3b8; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 15px;">
          Al-Andalos Rijschool B.V. | Amsterdam | KVK: 78945612 | BTW: NL888899999B01
        </p>
      </div>
    `;
  }

  // Global envelope layout for email templates
  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>${getEmailSubject(type, details)}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #f1f5f9;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
      </style>
    </head>
    <body>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
        <tr>
          <td align="center">
            <!-- Main Card Container -->
            <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); max-width: 600px;">
              <!-- Header Bar -->
              <tr>
                <td style="background-color: ${primaryColor}; padding: 25px 30px; text-align: center; border-bottom: 4px solid ${goldColor};">
                  <span style="color: #ffffff; font-size: 20px; font-weight: 900; letter-spacing: 3px; display: block;">AL-ANDALOS RIJSCHOOL</span>
                  <span style="color: #94a3b8; font-size: 11px; font-weight: bold; letter-spacing: 1px; display: block; margin-top: 4px; text-transform: uppercase;">Premium Dutch Driving Academy</span>
                </td>
              </tr>
              <!-- Content Body -->
              <tr>
                <td style="padding: 40px 30px; background-color: #ffffff;">
                  ${contentHtml}
                </td>
              </tr>
              <!-- Footer Section -->
              <tr>
                <td style="background-color: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 11px; line-height: 1.6;">
                  <strong style="color: #334155;">مدرسة الأندلس لتعليم القيادة بهولندا</strong><br />
                  موقعنا الرئيسي: Sloterdijk Area, Amsterdam, NL<br />
                  البريد الإلكتروني للدعم: support@al-andalos.nl | جوال: +31 6 9876 5432<br />
                  <span style="color: #94a3b8; display: block; margin-top: 10px;">&copy; 2026 Al-Andalos Rijschool. All Rights Reserved.</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
