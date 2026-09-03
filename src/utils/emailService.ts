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
  cancellationReason?: string;
  cancellationNotes?: string;
  paymentLink?: string;
  lessonId?: string;
  lessonNumber?: number | string;
  lang?: string;
  whatsappNumber?: string;
  website?: string;
  logoUrl?: string;
  primaryColor?: string;
  kvk?: string;
  openingHours?: string;
  city?: string;
  postalCode?: string;
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
  transmissionType?: string;
  vehicleModel?: string;
  icsContent?: string;
}

/**
 * Sends a highly styled email to the student's email.
 * Defaults to the active user's registered email (floggyc77@gmail.com) for realistic delivery.
 */
export async function sendAppEmail(
  toName: string,
  type: 'booking' | 'cancellation' | 'completion' | 'deposit' | 'invoice' | 'dossier' | 'reminder',
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

export interface DirectEmailPayload {
  to: string;
  subject: string;
  html: string;
  pdfBase64?: string;
}

/**
 * Dispatches a direct email notification with custom HTML and optional PDF attachment.
 */
export async function sendEmailNotification(payload: DirectEmailPayload) {
  try {
    const encodedBody = new TextEncoder().encode(JSON.stringify(payload));
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: encodedBody
    });
    return await response.json();
  } catch (error) {
    console.warn("Direct email notification error:", error);
    return { success: false, error: String(error) };
  }
}

function getEmailSubject(type: string, details: EmailDetails): string {
  const sName = details.schoolName || 'Driving School';
  const lang = details.lang || 'ar';
  switch (type) {
    case 'reminder':
      if (lang === 'nl') return `Betalingsherinnering rijles - ${sName}`;
      if (lang === 'en') return `Driving Lesson Payment Reminder - ${sName}`;
      return `تذكير بمستحقات درس القيادة - ${sName}`;
    case 'booking':
      return `تم تأكيد حجز درس القيادة الخاص بك - ${sName}`;
    case 'cancellation':
      return `تنبيه: تم إلغاء درس القيادة الخاص بك - ${sName}`;
    case 'completion':
      return `تقرير درس القيادة وملاحظات المدرب - ${sName}`;
    case 'deposit':
      return `تأكيد شحن رصيد محفظتك الرقمية - ${sName}`;
    case 'invoice':
      return `فاتورة ضريبية رسمية جديدة (${details.invoiceId || 'INV'}) - ${sName}`;
    case 'dossier':
      return `ملف الطالب والتقرير الشامل للتدريب - ${sName}`;
    default:
      return `إشعار جديد من ${sName}`;
  }
}

function getEmailHtml(toName: string, type: 'booking' | 'cancellation' | 'completion' | 'deposit' | 'invoice' | 'dossier' | 'reminder', details: EmailDetails): string {
  const dateStr = details.date || new Date().toISOString().split('T')[0];
  const timeStr = details.time || '10:00';
  const schoolName = details.schoolName || 'مدرسة القيادة المعتمدة';
  const lang = details.lang || 'ar';
  const isRtl = lang === 'ar';
  
  // Style config variables
  const primaryColor = "#0f172a"; // Slate-900
  const accentColor = "#1e40af"; // Blue-800
  const goldColor = "#d97706"; // Amber-600

  // Dedicated Premium / Minimal Payment Reminder Email Layout
  if (type === 'reminder') {
    const brandColor = details.primaryColor || "#0f172a";
    const greetingText = lang === 'ar' 
      ? `مرحباً ${toName || 'بك'}،` 
      : lang === 'nl' 
        ? `Beste ${toName || 'student'},` 
        : `Hello ${toName || 'there'},`;
    
    const subgreetingText = lang === 'ar' 
      ? 'نتمنى أن تكون بخير.' 
      : lang === 'nl' 
        ? 'We hopen dat alles goed met je gaat.' 
        : 'We hope you are doing well.';
        
    const introText = lang === 'ar' 
      ? 'نود أن نذكرك بلطف بأن رسوم درس القيادة الموضح أدناه ما زالت غير مسددة. يمكنك سداد المبلغ بسهولة عبر الضغط على زر الدفع أدناه.'
      : lang === 'nl' 
        ? 'Hierbij willen we je er vriendelijk aan herinneren dat het lesgeld voor de onderstaande rijles nog openstaat. Je kunt het bedrag eenvoudig voldoen via de onderstaande betaalknop.'
        : 'We would like to kindly remind you that the payment for the driving lesson shown below is still outstanding. You can easily settle the amount using the payment button below.';
    
    const cardTitle = lang === 'ar' ? 'تفاصيل الدرس' : lang === 'nl' ? 'Lesdetails' : 'Lesson Details';
    const lessonNumLabel = lang === 'ar' ? 'رقم الدرس' : lang === 'nl' ? 'Lesnummer' : 'Lesson Ref';
    const dateLabel = lang === 'ar' ? 'تاريخ الدرس' : lang === 'nl' ? 'Datum' : 'Date';
    const timeLabel = lang === 'ar' ? 'وقت الدرس' : lang === 'nl' ? 'Tijdstip' : 'Time';
    const pickupLabel = lang === 'ar' ? 'مكان الالتقاء' : lang === 'nl' ? 'Ophaallocatie' : 'Pickup Location';
    const amountLabel = lang === 'ar' ? 'المبلغ المستحق' : lang === 'nl' ? 'Openstaand bedrag' : 'Amount Due';
    const payNowText = lang === 'ar' ? 'دفع الآن' : lang === 'nl' ? 'Nu betalen' : 'Pay Now';
    
    const friendlyClosing = lang === 'ar'
      ? 'شكراً لاختيارك مدرستنا وثقتك بنا، ونتطلع لرؤيتك في درسك القادم.'
      : lang === 'nl'
        ? 'Hartelijk dank voor je vertrouwen in onze rijschool. We kijken ernaar uit je bij de volgende les te zien.'
        : 'Thank you for choosing our driving school and for your trust. We look forward to seeing you at your next lesson.';
    
    const instructorNoteTitle = lang === 'ar' ? 'رسالة من مدربك' : lang === 'nl' ? 'Bericht van je instructeur' : 'Message from your instructor';
    const helpTitle = lang === 'ar' ? 'تحتاج إلى مساعدة؟' : lang === 'nl' ? 'Hulp nodig?' : 'Need help?';
    const contactUsText = lang === 'ar' ? 'تواصل معنا:' : lang === 'nl' ? 'Neem contact met ons op:' : 'Contact us:';

    const lessonRef = details.lessonId || 'LES-000001';
    const priceFormatted = details.price !== undefined ? `€${details.price}` : '€0';
    const locationStr = details.pickupLocation || details.address || '';
    const paymentLinkUrl = details.paymentLink || '#';

    const contactItems: string[] = [];
    if (details.phone) contactItems.push(`${details.phone}`);
    if (details.whatsappNumber) contactItems.push(`WhatsApp: ${details.whatsappNumber}`);
    if (details.email) contactItems.push(`${details.email}`);
    if (details.website) contactItems.push(`${details.website}`);
    const contactRowHtml = contactItems.join(' &bull; ');

    const fullAddressParts = [details.address, details.postalCode, details.city].filter(Boolean);
    const fullAddressHtml = fullAddressParts.length > 0 ? fullAddressParts.join(', ') : '';

    return `
      <!DOCTYPE html>
      <html lang="${lang}" dir="${isRtl ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${getEmailSubject('reminder', details)}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 24px 12px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; max-width: 540px; overflow: hidden; text-align: ${isRtl ? 'right' : 'left'};">
                
                <!-- School Header -->
                <tr>
                  <td style="padding: 28px 28px 20px 28px; border-bottom: 1px solid #f1f5f9;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td>
                          ${details.logoUrl ? `
                            <img src="${details.logoUrl}" alt="${schoolName}" style="max-height: 44px; max-width: 160px; object-fit: contain; margin-bottom: 8px; display: block;" />
                          ` : ''}
                          <span style="font-size: 18px; font-weight: 800; color: #0f172a; display: block; letter-spacing: -0.2px;">${schoolName}</span>
                          ${details.phone || details.email ? `<span style="font-size: 11px; color: #64748b; margin-top: 3px; display: block;">${[details.phone, details.email].filter(Boolean).join(' &bull; ')}</span>` : ''}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content Area -->
                <tr>
                  <td style="padding: 28px;">
                    <!-- Greeting -->
                    <h2 style="font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">${greetingText}</h2>
                    <p style="font-size: 13px; color: #475569; margin: 0 0 8px 0; line-height: 1.5;">${subgreetingText}</p>
                    <p style="font-size: 13px; color: #475569; margin: 0 0 20px 0; line-height: 1.6;">${introText}</p>

                    <!-- Lesson Details Card -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px; padding: 18px;">
                      <tr>
                        <td style="padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;">
                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="font-size: 11px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">${cardTitle}</td>
                              <td align="${isRtl ? 'left' : 'right'}" style="font-size: 11px; font-family: monospace; color: #64748b; font-weight: 600;">#${lessonRef}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 12px;">
                          <table width="100%" border="0" cellspacing="0" cellpadding="5">
                            <tr>
                              <td style="font-size: 12px; color: #64748b; width: 40%;">${dateLabel}</td>
                              <td align="${isRtl ? 'left' : 'right'}" style="font-size: 12px; color: #0f172a; font-weight: 600; font-family: monospace;">${dateStr}</td>
                            </tr>
                            <tr>
                              <td style="font-size: 12px; color: #64748b;">${timeLabel}</td>
                              <td align="${isRtl ? 'left' : 'right'}" style="font-size: 12px; color: #0f172a; font-weight: 600; font-family: monospace;">${timeStr}</td>
                            </tr>
                            ${locationStr ? `
                            <tr>
                              <td style="font-size: 12px; color: #64748b;">${pickupLabel}</td>
                              <td align="${isRtl ? 'left' : 'right'}" style="font-size: 12px; color: #0f172a; font-weight: 600;">${locationStr}</td>
                            </tr>
                            ` : ''}
                            <tr>
                              <td style="padding-top: 10px; font-size: 13px; color: #0f172a; font-weight: 700; border-top: 1px solid #e2e8f0;">${amountLabel}</td>
                              <td align="${isRtl ? 'left' : 'right'}" style="padding-top: 10px; font-size: 17px; color: #0f172a; font-weight: 800; font-family: monospace; border-top: 1px solid #e2e8f0;">${priceFormatted}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Prominent Large Payment CTA Button -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0 20px 0;">
                      <tr>
                        <td align="center">
                          <a href="${paymentLinkUrl}" target="_blank" style="background-color: ${brandColor}; color: #ffffff; padding: 16px 28px; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 12px; display: block; width: 100%; box-sizing: border-box; text-align: center; letter-spacing: 0.3px; line-height: 1.2;">
                            ${payNowText}
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Friendly note -->
                    <p style="font-size: 12px; color: #64748b; text-align: center; line-height: 1.5; margin: 0 0 20px 0;">
                      ${friendlyClosing}
                    </p>

                    <!-- Instructor's Note (Conditional - Completely hidden if empty) -->
                    ${details.notes && details.notes.trim() ? `
                    <div style="background-color: #f8fafc; border-${isRtl ? 'right' : 'left'}: 3px solid #cbd5e1; padding: 14px 16px; border-radius: 8px; margin: 20px 0;">
                      <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 4px;">${instructorNoteTitle}</span>
                      <p style="font-size: 12px; color: #334155; margin: 0; line-height: 1.5; font-style: italic;">"${details.notes.trim()}"</p>
                    </div>
                    ` : ''}

                    <!-- Contact & Help (Only visible if contact details exist) -->
                    ${contactRowHtml ? `
                    <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.6;">
                      <span style="font-weight: 600; color: #334155;">${helpTitle}</span> ${contactUsText}<br />
                      <span>${contactRowHtml}</span>
                    </div>
                    ` : ''}

                  </td>
                </tr>

                <!-- Footer -->
                <tr style="background-color: #fafafa; border-top: 1px solid #f1f5f9;">
                  <td style="padding: 20px 28px; text-align: center; font-size: 10px; color: #94a3b8; line-height: 1.5;">
                    <strong style="color: #64748b;">${schoolName}</strong><br />
                    ${fullAddressHtml ? `${fullAddressHtml}<br />` : ''}
                    ${details.kvk ? `KvK: ${details.kvk}<br />` : ''}
                    &copy; ${new Date().getFullYear()} ${schoolName}. All rights reserved.
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
  
  let contentHtml = "";

  if (type === 'booking') {
    const rawLessonNum = details.lessonNumber || 1;
    const lessonNumLabel = lang === 'ar' 
      ? `الدرس ${rawLessonNum}` 
      : lang === 'nl' 
      ? `Les ${rawLessonNum}` 
      : `Lesson ${rawLessonNum}`;

    const calendarBtnLabel = lang === 'ar'
      ? 'إضافة الدرس إلى تقويمك 📅'
      : lang === 'nl'
      ? 'Les aan je agenda toevoegen 📅'
      : 'Add lesson to your calendar 📅';

    const instructorDisplay = details.instructorName || 'سمير الفيلالي';
    const vehicleTypeDisplay = details.transmissionType === 'automatic'
      ? (lang === 'ar' ? 'أوتوماتيك' : lang === 'nl' ? 'Automaat' : 'Automatic')
      : (lang === 'ar' ? 'عادي / يدوي' : lang === 'nl' ? 'Handgeschakeld' : 'Manual');

    // Create safe data URI for client/email calendar opening
    const icsBase64 = details.icsContent ? btoa(unescape(encodeURIComponent(details.icsContent))) : '';
    const icsDataUri = icsBase64 ? `data:text/calendar;charset=utf-8;base64,${icsBase64}` : '#';

    contentHtml = `
      <div style="direction: ${isRtl ? 'rtl' : 'ltr'}; text-align: ${isRtl ? 'right' : 'left'}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <h2 style="color: ${accentColor}; margin-bottom: 15px;">
          ${lang === 'ar' ? 'تهانينا، تم تأكيد حجز الدرس بنجاح! 🎉' : lang === 'nl' ? 'Gefeliciteerd, je rijles is bevestigd! 🎉' : 'Congratulations, your lesson is confirmed! 🎉'}
        </h2>
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          ${lang === 'ar' 
            ? `عزيزي المتدرب <strong>${toName}</strong>، يسعدنا إبلاغك بأنه قد تم تسجيل وتأكيد درس القيادة الميداني الخاص بك (${lessonNumLabel}) بنجاح في جدول المدرب <strong>${instructorDisplay}</strong>.`
            : lang === 'nl'
            ? `Beste <strong>${toName}</strong>, we zijn verheugd te bevestigen dat je praktijkles (${lessonNumLabel}) succesvol is ingepland bij instructeur <strong>${instructorDisplay}</strong>.`
            : `Dear <strong>${toName}</strong>, we are pleased to confirm that your practical driving lesson (${lessonNumLabel}) has been scheduled with instructor <strong>${instructorDisplay}</strong>.`}
        </p>
        
        <div style="background-color: #f8fafc; border-${isRtl ? 'right' : 'left'}: 4px solid ${accentColor}; padding: 16px; margin: 20px 0; border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #64748b;"><strong>${lang === 'ar' ? 'رقم الدرس:' : lang === 'nl' ? 'Lesnummer:' : 'Lesson Number:'}</strong></td>
              <td style="padding: 6px 0; font-size: 14px; color: #0f172a; text-align: ${isRtl ? 'left' : 'right'}; font-weight: bold; font-family: monospace;">${lessonNumLabel}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #64748b;"><strong>${lang === 'ar' ? 'التاريخ والوقت:' : lang === 'nl' ? 'Datum & Tijd:' : 'Date & Time:'}</strong></td>
              <td style="padding: 6px 0; font-size: 14px; color: #0f172a; text-align: ${isRtl ? 'left' : 'right'};"><strong>${dateStr} (${timeStr})</strong></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #64748b;"><strong>${lang === 'ar' ? 'مدة الدرس:' : lang === 'nl' ? 'Lesduur:' : 'Duration:'}</strong></td>
              <td style="padding: 6px 0; font-size: 14px; color: #0f172a; text-align: ${isRtl ? 'left' : 'right'};">${details.duration || 1} ${lang === 'ar' ? (details.duration === 1 ? 'ساعة تدريبية' : 'ساعات تدريبية') : lang === 'nl' ? 'uur' : 'hour(s)'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #64748b;"><strong>${lang === 'ar' ? 'المدرب المسؤول:' : lang === 'nl' ? 'Instructeur:' : 'Instructor:'}</strong></td>
              <td style="padding: 6px 0; font-size: 14px; color: #0f172a; text-align: ${isRtl ? 'left' : 'right'}; font-weight: 600;">${instructorDisplay}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #64748b;"><strong>${lang === 'ar' ? 'نوع المركبة:' : lang === 'nl' ? 'Type voertuig:' : 'Vehicle Type:'}</strong></td>
              <td style="padding: 6px 0; font-size: 14px; color: #0f172a; text-align: ${isRtl ? 'left' : 'right'};">${vehicleTypeDisplay} ${details.vehicleModel ? `(${details.vehicleModel})` : ''}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #64748b;"><strong>${lang === 'ar' ? 'نقطة الالتقاء:' : lang === 'nl' ? 'Ophaallocatie:' : 'Pickup Location:'}</strong></td>
              <td style="padding: 6px 0; font-size: 14px; color: #0f172a; text-align: ${isRtl ? 'left' : 'right'};">${details.pickupLocation || 'موقعك المختار'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #64748b;"><strong>${lang === 'ar' ? 'التكلفة الإجمالية:' : lang === 'nl' ? 'Totaalprijs:' : 'Total Price:'}</strong></td>
              <td style="padding: 6px 0; font-size: 15px; color: ${goldColor}; text-align: ${isRtl ? 'left' : 'right'}; font-weight: bold;">€${details.price || 65}</td>
            </tr>
          </table>
        </div>

        <!-- Prominent Calendar Action CTA in Email -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0 20px 0;">
          <tr>
            <td align="center">
              <a href="${icsDataUri}" download="driving-lesson-${dateStr}.ics" target="_blank" style="background-color: #059669; color: #ffffff; padding: 15px 28px; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 12px; display: block; width: 100%; max-width: 440px; box-sizing: border-box; text-align: center; letter-spacing: 0.3px; box-shadow: 0 2px 6px rgba(5, 150, 105, 0.25);">
                ${calendarBtnLabel}
              </a>
            </td>
          </tr>
        </table>

        <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 15px;">
          ⚠️ <strong>${lang === 'ar' ? 'ملاحظة هامة للسلامة:' : lang === 'nl' ? 'Belangrijke opmerking:' : 'Important Note:'}</strong> 
          ${lang === 'ar' 
            ? 'يرجى التواجد في مكان الالتقاء المحدد قبل الموعد بـ 5 دقائق وإحضار بطاقة الهوية الخاصة بك. إذا كنت بحاجة لإلغاء الدرس أو تعديله، يرجى القيام بذلك قبل 24 ساعة على الأقل من موعد الدرس لتجنب احتساب الرسوم.'
            : lang === 'nl'
            ? 'Zorg dat je 5 minuten voor aanvang aanwezig bent op de afgesproken locatie met je identiteitsbewijs. Annuleren kan tot 24 uur van tevoren kosteloos.'
            : 'Please be at the agreed pickup location 5 minutes prior with your ID card. Cancellations must be made at least 24 hours in advance.'}
        </p>
      </div>
    `;
  } else if (type === 'cancellation') {
    contentHtml = `
      <div style="direction: ${isRtl ? 'rtl' : 'ltr'}; text-align: ${isRtl ? 'right' : 'left'}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <h2 style="color: #dc2626; margin-bottom: 15px;">
          ${lang === 'ar' ? 'تنبيه: تم إلغاء درس القيادة ⚠️' : lang === 'nl' ? 'Let op: Rijles Geannuleerd ⚠️' : 'Notice: Driving Lesson Cancelled ⚠️'}
        </h2>
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          ${lang === 'ar' 
            ? `عزيزي المتدرب <strong>${toName}</strong>، نود إبلاغك بأنه قد تم إلغاء درس القيادة العملي الذي كان مجدولاً مسبقاً.`
            : lang === 'nl'
            ? `Beste <strong>${toName}</strong>, hierbij informeren wij je dat de geplande rijles is geannuleerd.`
            : `Dear <strong>${toName}</strong>, this is to inform you that your scheduled driving lesson has been cancelled.`}
        </p>

        <div style="background-color: #fef2f2; border-${isRtl ? 'right' : 'left'}: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #991b1b;"><strong>${lang === 'ar' ? 'موعد الدرس الملغي:' : lang === 'nl' ? 'Geannuleerde datum/tijd:' : 'Cancelled Date & Time:'}</strong></td>
              <td style="padding: 6px 0; font-size: 14px; color: #0f172a; text-align: ${isRtl ? 'left' : 'right'};"><strong>${dateStr} (${timeStr})</strong></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #991b1b;"><strong>${lang === 'ar' ? 'المدرب:' : lang === 'nl' ? 'Instructeur:' : 'Instructor:'}</strong></td>
              <td style="padding: 6px 0; font-size: 14px; color: #0f172a; text-align: ${isRtl ? 'left' : 'right'};">${details.instructorName || 'سمير الفيلالي'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #991b1b;"><strong>${lang === 'ar' ? 'سبب الإلغاء:' : lang === 'nl' ? 'Reden van annulering:' : 'Cancellation Reason:'}</strong></td>
              <td style="padding: 6px 0; font-size: 14px; color: #dc2626; text-align: ${isRtl ? 'left' : 'right'}; font-weight: bold;">${details.cancellationReason || (lang === 'ar' ? 'إلغاء تنظيمي' : 'Administrative cancellation')}</td>
            </tr>
            ${details.cancellationNotes ? `
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #991b1b;"><strong>${lang === 'ar' ? 'ملاحظات إضافية:' : lang === 'nl' ? 'Opmerkingen:' : 'Notes:'}</strong></td>
              <td style="padding: 6px 0; font-size: 13px; color: #334155; text-align: ${isRtl ? 'left' : 'right'};">${details.cancellationNotes}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #991b1b;"><strong>${lang === 'ar' ? 'حالة المستحقات المادية:' : lang === 'nl' ? 'Financiële status:' : 'Financial Status:'}</strong></td>
              <td style="padding: 6px 0; font-size: 13px; color: #16a34a; text-align: ${isRtl ? 'left' : 'right'}; font-weight: bold;">
                ${lang === 'ar' ? `تمت إعادة رصيد الدرس (€${details.price || 65}) إلى محفظتك الإلكترونية` : lang === 'nl' ? `Het lesbedrag (€${details.price || 65}) is teruggestort naar je tegoed` : `Lesson fee (€${details.price || 65}) has been refunded to your wallet`}
              </td>
            </tr>
          </table>
        </div>

        <!-- Personal Calendar Removal Notice -->
        <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 14px; margin: 16px 0;">
          <p style="margin: 0; font-size: 12px; color: #92400e; line-height: 1.5;">
            🗓️ <strong>${lang === 'ar' ? 'تنبيه التقويم الشخصي:' : lang === 'nl' ? 'Persoonlijke Agenda:' : 'Personal Calendar:'}</strong>
            ${lang === 'ar' 
              ? 'إذا كنت قد أضفت هذا الدرس سابقاً إلى تقويمك الشخصي (Apple Calendar أو Google Calendar أو غيره)، يرجى حذفه يدوياً من تقويمك.'
              : lang === 'nl'
              ? 'Als je deze les eerder hebt toegevoegd aan je persoonlijke agenda (Apple Calendar, Google Calendar, etc.), vergeet deze dan niet handmatig te verwijderen.'
              : 'If you previously added this lesson to your personal calendar (Apple Calendar, Google Calendar, etc.), please remove it manually from your calendar.'}
          </p>
        </div>

        <p style="font-size: 13px; color: #475569; line-height: 1.5;">
          ${lang === 'ar' 
            ? 'بإمكانك الدخول إلى حسابك وحجز موعد بديل في أي وقت يناسبك من خلال جدول المواعيد المتاحة الجديد للمدرب.'
            : lang === 'nl'
            ? 'Je kunt op elk gewenst moment via de app een nieuwe rijles inplannen.'
            : 'You can log into your student account and book an alternative lesson at any time.'}
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
          عزيزي المتدرب <strong>${toName}</strong>، نؤكد لك استلام وإضافة الدفعة المالية المذكورة أدناه إلى حساب محفظتك الرقمية المعتمدة لدى ${schoolName}.
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
          بإمكانك استهلاك هذا الرصيد لحجز حصص القيادة الميدانية أو تمويل باقات التدريب الإضافية بسهولة تامة من تطبيق الطالب الخاص بك. شكراً لثقتكم بنا.
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
                <h1 style="color: ${primaryColor}; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 1px;">${(details.schoolName || 'DRIVING SCHOOL').toUpperCase()}</h1>
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
          نرفق لكم طيه بيان الفاتورة الضريبية الصادرة عن ${details.schoolName || 'مدرسة القيادة'} لقاء الدروس أو الخدمات الإضافية المذكورة أدناه:
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
            سيتم خصم هذه المعاملة تلقائياً من محفظتكم الرقمية المعتمدة في ${details.schoolName || 'مدرسة القيادة'}، أو بإمكانكم السداد بالبطاقة البنكية مباشرة عبر مسح الـ QR في حسابكم أو عبر الرابط المرفق بالتطبيق.
          </p>
        </div>

        <p style="font-size: 11px; text-align: center; color: #94a3b8; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 15px;">
          ${details.schoolName || 'Driving School'} | ${details.address ? (details.address.includes('Amsterdam') ? 'Maastricht' : details.address.split(',')[1]?.trim() || 'Maastricht') : 'Maastricht'} | KVK: 78945612 | BTW: NL888899999B01
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
    
    const schoolName = details.schoolName || "Driving School";
    const instructorName = details.instructorName || "Driving Instructor";
    const phone = details.phone || "+31 6 1234 5678";
    const email = details.email || "info@drivingschool.nl";
    const address = details.address || "Maastricht, Netherlands";

    contentHtml = `
      <div style="direction: rtl; text-align: right; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="border-bottom: 2px solid ${primaryColor}; padding-bottom: 15px; margin-bottom: 25px;">
          <h2 style="color: ${primaryColor}; margin: 0; font-size: 20px; font-weight: 800;">📋 ملف الطالب والتقرير الشامل للتدريب</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; font-weight: bold;">
            وثيقة رسمية صادرة عن ${schoolName} لقاء تفاصيل السجل العملي والمالي للطالب
          </p>
        </div>

        <!-- 1. School Information Box -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
          <tr>
            <td style="padding: 15px; vertical-align: top;">
              <h3 style="margin: 0 0 8px 0; font-size: 13px; color: #0f172a;">🏫 معلومات المدرسة:</h3>
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
            <td style="padding: 10px; background-color: #f1f5f9; font-size: 12px; color: #475569;"><strong>التقدم العام ومستوى الجاهزية:</strong></td>
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
              <th style="padding: 10px; font-size: 12px; text-align: right; color: #475569;">المعيار الأساسي للتقييم</th>
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
              <td style="padding: 12px 10px; font-size: 13px; color: #0f172a;">مؤشر جاهزية الامتحان العملي الإجمالي:</td>
              <td style="padding: 12px 10px; font-size: 13px; text-align: center; color: #1e40af; text-transform: uppercase;" colspan="2">
                ${cbrReadiness === 'cbr_ready' ? '🔥 جاهز للامتحان العملي (EXAM READY)' : cbrReadiness === 'developing' ? '📈 قيد التطور والتحضير (DEVELOPING)' : '🚗 مستوى مبتدئ (BEGINNER)'}
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
          ملاحظة للمتدرب: يرجى مراجعة هذا التقرير بانتظام مع مدربك المباشر لتعزيز النقاط التي تحتاج إلى تقوية وضمان الجاهزية الكاملة قبل التقديم على حجز الامتحان العملي النهائي.
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
                  <span style="color: #ffffff; font-size: 20px; font-weight: 900; letter-spacing: 3px; display: block;">${(details.schoolName || 'DRIVING SCHOOL').toUpperCase()}</span>
                  <span style="color: #94a3b8; font-size: 11px; font-weight: bold; letter-spacing: 1px; display: block; margin-top: 4px; text-transform: uppercase;">Licensed Driving Instruction</span>
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
                  <strong style="color: #334155;">${details.schoolName || 'Driving School'}</strong><br />
                  Location: ${details.address || "Netherlands"}<br />
                  Email Support: ${details.email || "info@drivingschool.nl"} | Phone: ${details.phone || "+31 6 1234 5678"}<br />
                  <span style="color: #94a3b8; display: block; margin-top: 10px;">&copy; 2026 ${details.schoolName || 'Driving School'}. All Rights Reserved.</span>
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
