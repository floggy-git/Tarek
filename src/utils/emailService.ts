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
  // Extra fields for dossier
  studentId?: string;
  package?: string;
  progress?: string;
  examStatus?: string;
  balance?: number;
  totalHours?: number;
  completedLessons?: number;
  remainingLessons?: number;
  scoreControl?: number;
  scorePriority?: number;
  scoreHighway?: number;
  scoreManeuvers?: number;
  scoreTheory?: number;
  cbrReadiness?: string;
  schoolName?: string;
  instructorName?: string;
  phone?: string;
  email?: string;
  address?: string;
}

/**
 * Sends a highly styled email to the student's email.
 * Defaults to the active user's registered email (floggyc77@gmail.com) for realistic delivery.
 */
export async function sendAppEmail(
  toName: string,
  type: 'booking' | 'cancellation' | 'completion' | 'deposit' | 'invoice' | 'dossier',
  details: EmailDetails,
  pdfBase64?: string
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
      metadata: details,
      pdfBase64
    });

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
    case 'dossier':
      return `📋 ملف الطالب والتقرير الشامل للتدريب - مدرسة الأندلس للقيادة | Al-Andalus Dossier`;
    default:
      return `🔔 إشعار جديد من مدرسة الأندلس للقيادة`;
  }
}

function getEmailHtml(toName: string, type: 'booking' | 'cancellation' | 'completion' | 'deposit' | 'invoice' | 'dossier', details: EmailDetails): string {
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
  } else if (type === 'dossier') {
    const studentId = details.studentId || "STU-NEW";
    const packageName = details.package || "Optimal Progress (20h)";
    const progress = details.progress || "50%";
    const examStatus = details.examStatus || "In Active Training";
    const balance = details.balance ?? 0;
    const totalHours = details.totalHours || 0;
    const completedLessons = details.completedLessons || 0;
    const remainingLessons = details.remainingLessons || 0;
    
    const scControl = details.scoreControl || 0;
    const scPriority = details.scorePriority || 0;
    const scHighway = details.scoreHighway || 0;
    const scManeuvers = details.scoreManeuvers || 0;
    const scTheory = details.scoreTheory || 0;
    const cbrReadiness = details.cbrReadiness || "developing";
    const notes = details.notes || "";
    
    const schoolName = details.schoolName || "Al-Andalus Driving School";
    const instructorName = details.instructorName || "Samir El-Filali";
    const phone = details.phone || "+31 6 9876 5432";
    const email = details.email || "samir@al-andalos.nl";
    const address = details.address || "Sloterdijk Area, Amsterdam, NL";

    contentHtml = `
      <div style="direction: rtl; text-align: right; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="border-bottom: 2px solid ${primaryColor}; padding-bottom: 15px; margin-bottom: 25px;">
          <h2 style="color: ${primaryColor}; margin: 0; font-size: 20px; font-weight: 800;">📋 ملف الطالب والتقرير الشامل للتدريب</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; font-weight: bold;">
            وثيقة رسمية صادرة عن مدرسة الأندلس لتعليم القيادة بهولندا لقاء تفاصيل السجل العملي والمالي للطالب
          </p>
        </div>

        <!-- 1. School Information Box -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
          <tr>
            <td style="padding: 15px; vertical-align: top;">
              <h3 style="margin: 0 0 8px 0; font-size: 13px; color: #0f172a;">🏫 معلومات الأكاديمية:</h3>
              <p style="margin: 2px 0; font-size: 12px; color: #475569;"><strong>المدرسة:</strong> ${schoolName}</p>
              <p style="margin: 2px 0; font-size: 12px; color: #475569;"><strong>العنوان:</strong> ${address}</p>
              <p style="margin: 2px 0; font-size: 12px; color: #475569;"><strong>اتصال:</strong> ${phone} | ${email}</p>
            </td>
            <td style="padding: 15px; vertical-align: top; text-align: left; width: 180px;">
              <h3 style="margin: 0 0 8px 0; font-size: 13px; color: #0f172a;">📋 معلومات الملف:</h3>
              <p style="margin: 2px 0; font-size: 12px; color: #475569;"><strong>الرقم المرجعي:</strong> DOS-${toName.substring(0,3).toUpperCase()}-2026</p>
              <p style="margin: 2px 0; font-size: 12px; color: #475569;"><strong>تاريخ الإصدار:</strong> ${dateStr}</p>
              <p style="margin: 2px 0; font-size: 12px; color: #475569;"><strong>المدرب المسؤول:</strong> ${instructorName}</p>
            </td>
          </tr>
        </table>

        <!-- 2. Student Information Table -->
        <h3 style="margin: 15px 0 8px 0; font-size: 14px; color: ${accentColor}; font-weight: bold;">👤 ملف المتدرب الشخصي:</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #e2e8f0;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px; background-color: #f1f5f9; font-size: 12px; color: #475569; width: 140px;"><strong>الاسم الكامل:</strong></td>
            <td style="padding: 10px; font-size: 13px; color: #0f172a;"><strong>${toName}</strong></td>
            <td style="padding: 10px; background-color: #f1f5f9; font-size: 12px; color: #475569; width: 140px;"><strong>رقم الطالب (Student ID):</strong></td>
            <td style="padding: 10px; font-size: 13px; color: #0f172a; font-family: monospace;">${studentId}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px; background-color: #f1f5f9; font-size: 12px; color: #475569;"><strong>الباقة التدريبية:</strong></td>
            <td style="padding: 10px; font-size: 13px; color: #0f172a;">${packageName}</td>
            <td style="padding: 10px; background-color: #f1f5f9; font-size: 12px; color: #475569;"><strong>التقدم العام ومستوى CBR:</strong></td>
            <td style="padding: 10px; font-size: 13px; color: #0f172a;">
              <span style="background-color: #1e40af; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;">${progress}</span>
              <span style="background-color: #f59e0b; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-right: 4px;">${examStatus}</span>
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px; background-color: #f1f5f9; font-size: 12px; color: #475569;"><strong>الدروس المنجزة:</strong></td>
            <td style="padding: 10px; font-size: 13px; color: #0f172a;"><strong>${completedLessons}</strong> حصة (${totalHours} ساعة)</td>
            <td style="padding: 10px; background-color: #f1f5f9; font-size: 12px; color: #475569;"><strong>الدروس المتبقية بالباقة:</strong></td>
            <td style="padding: 10px; font-size: 13px; color: #0f172a;"><strong>${remainingLessons}</strong> حصة تدريبية</td>
          </tr>
          <tr>
            <td style="padding: 10px; background-color: #f1f5f9; font-size: 12px; color: #475569;"><strong>رصيد المحفظة الحالي:</strong></td>
            <td style="padding: 10px; font-size: 14px; color: ${balance >= 0 ? '#16a34a' : '#dc2626'}; font-weight: bold;" colspan="3">€${balance.toFixed(2)}</td>
          </tr>
        </table>

        <!-- 3. Field Competencies Evaluation -->
        <h3 style="margin: 20px 0 8px 0; font-size: 14px; color: ${accentColor}; font-weight: bold;">📊 تقييم الكفاءة والمهارات الميدانية:</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #e2e8f0;">
          <thead>
            <tr style="background-color: #f1f5f9; border-bottom: 2px solid #e2e8f0;">
              <th style="padding: 10px; font-size: 12px; text-align: right; color: #475569;">المعيار الأساسي للـ CBR</th>
              <th style="padding: 10px; font-size: 12px; text-align: center; color: #475569; width: 100px;">النتيجة</th>
              <th style="padding: 10px; font-size: 12px; text-align: right; color: #475569;">مستوى الإتقان</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-size: 12px; color: #0f172a;"><strong>التحكم بالمركبة (Vehicle Control):</strong></td>
              <td style="padding: 10px; font-size: 12px; text-align: center; font-weight: bold; color: #1e40af;">${scControl} / 10</td>
              <td style="padding: 10px; font-size: 11px; color: #64748b;">${scControl >= 8 ? 'كفاءة ممتازة' : scControl >= 6 ? 'قيد التطوير الفعال' : 'مبتدئ يحتاج ممارسة'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-size: 12px; color: #0f172a;"><strong>قواعد الأسبقية والتقاطعات (Priority Rules):</strong></td>
              <td style="padding: 10px; font-size: 12px; text-align: center; font-weight: bold; color: #1e40af;">${scPriority} / 10</td>
              <td style="padding: 10px; font-size: 11px; color: #64748b;">${scPriority >= 8 ? 'كفاءة ممتازة' : scPriority >= 6 ? 'قيد التطوير الفعال' : 'مبتدئ يحتاج ممارسة'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-size: 12px; color: #0f172a;"><strong>القيادة على الطرق السريعة (Highway Driving):</strong></td>
              <td style="padding: 10px; font-size: 12px; text-align: center; font-weight: bold; color: #1e40af;">${scHighway} / 10</td>
              <td style="padding: 10px; font-size: 11px; color: #64748b;">${scHighway >= 8 ? 'كفاءة ممتازة' : scHighway >= 6 ? 'قيد التطوير الفعال' : 'مبتدئ يحتاج ممارسة'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-size: 12px; color: #0f172a;"><strong>المناورات الخاصة والاصطفاف (Special Maneuvers):</strong></td>
              <td style="padding: 10px; font-size: 12px; text-align: center; font-weight: bold; color: #1e40af;">${scManeuvers} / 10</td>
              <td style="padding: 10px; font-size: 11px; color: #64748b;">${scManeuvers >= 8 ? 'كفاءة ممتازة' : scManeuvers >= 6 ? 'قيد التطوير الفعال' : 'مبتدئ يحتاج ممارسة'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-size: 12px; color: #0f172a;"><strong>تطبيق النظرية والإشارات (Theory Application):</strong></td>
              <td style="padding: 10px; font-size: 12px; text-align: center; font-weight: bold; color: #1e40af;">${scTheory} / 10</td>
              <td style="padding: 10px; font-size: 11px; color: #64748b;">${scTheory >= 8 ? 'كفاءة ممتازة' : scTheory >= 6 ? 'قيد التطوير الفعال' : 'مبتدئ يحتاج ممارسة'}</td>
            </tr>
            <tr style="background-color: #f8fafc; font-weight: bold;">
              <td style="padding: 12px 10px; font-size: 13px; color: #0f172a;">مؤشر جاهزية امتحان الـ CBR الإجمالي:</td>
              <td style="padding: 12px 10px; font-size: 13px; text-align: center; color: #1e40af; text-transform: uppercase;" colspan="2">
                ${cbrReadiness === 'cbr_ready' ? '🔥 جاهز للامتحان العملي (CBR READY)' : cbrReadiness === 'developing' ? '📈 قيد التطور والتحضير (DEVELOPING)' : '🚗 مستوى مبتدئ (BEGINNER)'}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- 4. Notes & Feedback -->
        ${notes ? `
        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-right: 4px solid #d97706; padding: 15px; border-radius: 8px; margin-top: 15px;">
          <h4 style="margin: 0 0 8px 0; color: #92400e; font-size: 13px;">💬 تقييم وملاحظات التوجيه المعتمدة من المدرب:</h4>
          <p style="font-size: 12px; color: #78350f; line-height: 1.6; margin: 0; font-style: italic;">
            "${notes}"
          </p>
        </div>
        ` : ''}

        <p style="font-size: 12px; color: #64748b; line-height: 1.6; margin-top: 25px; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 15px;">
          ملاحظة للمتدرب: يرجى مراجعة هذا التقرير بانتظام مع مدربك المباشر لتعزيز النقاط التي تحتاج إلى تقوية وضمان الجاهزية الكاملة قبل التقديم على حجز الامتحان العملي النهائي لدى هيئة الـ CBR بهولندا.
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
