/**
 * Central Integration Manager
 * Coordinates end-to-end workflows across:
 * - Google Sheets (Database & Single Source of Truth)
 * - Google Calendar (Lesson Event Scheduling)
 * - Google Drive (Document & Invoice Storage)
 * - Notifications & Email (Communications)
 */

import {
  StudentRecord,
  Lesson,
  WalletTransaction,
  SchoolSettings,
  Language,
  getSchoolName
} from '../types';
import { createLessonCalendarEvent, cancelLessonCalendarEvent, generateIcsContent } from './googleCalendarService';
import {
  writeLessonsToSheet,
  writeStudentsToSheet,
  writeWalletToSheet,
  writeNotificationsToSheet,
  syncLessonsFromSheet
} from './googleSheetsService';
import { addNotification, AppNotification } from '../utils/notificationStore';
import { sendEmailNotification } from '../utils/emailService';
import { getSheetsConfig } from '../utils/googleSheets';

export interface WorkflowResult<T = any> {
  success: boolean;
  data?: T;
  sheetsSynced: boolean;
  calendarSynced: boolean;
  notificationSent: boolean;
  emailSent?: boolean;
  warnings?: string[];
  error?: string;
}

export interface BookingWorkflowParams {
  booking: Lesson;
  student: StudentRecord;
  schoolSettings?: Partial<SchoolSettings>;
  allLessons: Lesson[];
  allStudents?: StudentRecord[];
  allTransactions?: WalletTransaction[];
  lang?: Language;
  accessToken?: string;
  spreadsheetId?: string;
}

/**
 * PHASE 6: Complete Student Booking Workflow
 * 1. Validate student and booking information.
 * 2. Schedule Google Calendar Event & obtain calendarEventId.
 * 3. Update Lesson record with calendarEventId.
 * 4. Sync updated lessons list to Google Sheets.
 * 5. Issue in-app notification & confirmation email.
 */
export async function executeStudentBookingWorkflow(
  params: BookingWorkflowParams
): Promise<WorkflowResult<Lesson>> {
  const {
    booking,
    student,
    schoolSettings,
    allLessons,
    allStudents = [],
    allTransactions = [],
    lang = 'nl',
    accessToken,
    spreadsheetId
  } = params;

  const warnings: string[] = [];
  let calendarSynced = false;
  let sheetsSynced = false;
  let notificationSent = false;
  let emailSent = false;

  const schoolTitle = getSchoolName(schoolSettings);
  const token = accessToken || getSheetsConfig().accessToken;
  const sheetId = spreadsheetId || getSheetsConfig().spreadsheetId;

  // 1. Ensure immutable studentId binding
  const verifiedBooking: Lesson = {
    ...booking,
    studentId: student.studentId || student.id,
    studentName: student.name,
    status: 'upcoming'
  };

  // 2. Google Calendar Integration
  if (token) {
    try {
      const calRes = await createLessonCalendarEvent({
        booking: verifiedBooking,
        student,
        trainerName: verifiedBooking.trainerName,
        schoolSettings,
        accessToken: token,
        allLessons
      });

      if (calRes.success && calRes.calendarEventId) {
        verifiedBooking.calendarEventId = calRes.calendarEventId;
        verifiedBooking.calendarStatus = 'synced';
        calendarSynced = true;
      } else if (calRes.error) {
        warnings.push(`Calendar scheduling warning: ${calRes.error}`);
        verifiedBooking.calendarStatus = 'failed';
      }
    } catch (calErr: any) {
      warnings.push(`Calendar scheduling error: ${calErr.message}`);
      verifiedBooking.calendarStatus = 'failed';
    }
  }

  // 3. Update Lessons list
  const existingIdx = allLessons.findIndex(l => l.id === verifiedBooking.id);
  const updatedLessons = existingIdx >= 0
    ? allLessons.map((l, i) => i === existingIdx ? verifiedBooking : l)
    : [verifiedBooking, ...allLessons];

  // 4. Google Sheets Synchronization
  if (sheetId && token) {
    try {
      const sheetRes = await writeLessonsToSheet(sheetId, updatedLessons, token);
      if (sheetRes.success) {
        sheetsSynced = true;
      } else {
        warnings.push(`Sheets synchronization warning: ${sheetRes.error}`);
      }
    } catch (sheetErr: any) {
      warnings.push(`Sheets sync error: ${sheetErr.message}`);
    }
  }

  // 5. In-App Notification (Student & Instructor)
  try {
    const studentNotification: AppNotification = addNotification({
      recipientRole: 'student',
      targetStudentId: student.studentId || student.id,
      recipientEmail: student.email,
      type: 'lesson_booked',
      titleAr: 'تم تأكيد حجز درس القيادة',
      titleNl: 'Rijles Bevestigd',
      titleEn: 'Driving Lesson Confirmed',
      messageAr: `تم تأكيد حجز درسك يوم ${verifiedBooking.date} الساعة ${verifiedBooking.time} مع ${verifiedBooking.trainerName}.`,
      messageNl: `Je rijles op ${verifiedBooking.date} om ${verifiedBooking.time} met ${verifiedBooking.trainerName} is bevestigd.`,
      messageEn: `Your lesson on ${verifiedBooking.date} at ${verifiedBooking.time} with ${verifiedBooking.trainerName} is confirmed.`,
      metadata: {
        studentId: student.studentId || student.id,
        studentName: student.name,
        trainerName: verifiedBooking.trainerName,
        lessonId: verifiedBooking.id,
        date: verifiedBooking.date,
        time: verifiedBooking.time
      }
    });

    // Trainer Notification
    addNotification({
      recipientRole: 'trainer',
      type: 'lesson_booked',
      titleAr: 'حجز درس جديد من متدرب',
      titleNl: 'Nieuwe Rijles Geboekt',
      titleEn: 'New Lesson Booked',
      messageAr: `قام المتدرب ${student.name} بحجز موعد يوم ${verifiedBooking.date} الساعة ${verifiedBooking.time}.`,
      messageNl: `${student.name} heeft een rijles geboekt op ${verifiedBooking.date} om ${verifiedBooking.time}.`,
      messageEn: `${student.name} booked a lesson on ${verifiedBooking.date} at ${verifiedBooking.time}.`,
      metadata: {
        studentId: student.studentId || student.id,
        studentName: student.name,
        lessonId: verifiedBooking.id,
        date: verifiedBooking.date,
        time: verifiedBooking.time
      }
    });

    notificationSent = true;
  } catch (notifErr: any) {
    warnings.push(`Notification delivery error: ${notifErr.message}`);
  }

  // 6. Confirmation Email (Safe fire-and-forget)
  if (student.email) {
    try {
      // Calculate human-readable sequential lesson number
      const studentLessons = allLessons.filter(l => 
        l.studentId === (student.studentId || student.id) || 
        l.studentName === student.name
      );
      const humanLessonCount = studentLessons.length + 1;
      const lessonNumDisplay = lang === 'ar' 
        ? `الدرس ${humanLessonCount}` 
        : lang === 'nl' 
        ? `Les ${humanLessonCount}` 
        : `Lesson ${humanLessonCount}`;

      const rawTransmission = schoolSettings?.transmissionType || (student as any)?.transmissionType || 'manual';
      const transmissionLabel = rawTransmission === 'automatic'
        ? (lang === 'ar' ? 'أوتوماتيك' : lang === 'nl' ? 'Automaat' : 'Automatic')
        : (lang === 'ar' ? 'عادي / يدوي' : lang === 'nl' ? 'Handgeschakeld' : 'Manual');
      const vehicleModel = schoolSettings?.primaryVehicle || (schoolSettings as any)?.vehicle || '';
      const vehicleInfo = vehicleModel ? `${transmissionLabel} (${vehicleModel})` : transmissionLabel;

      const emailSubject = lang === 'ar'
        ? `تأكيد حجز درس القيادة (${lessonNumDisplay}) - ${schoolTitle}`
        : lang === 'nl'
        ? `Bevestiging Rijles (${lessonNumDisplay}) - ${schoolTitle}`
        : `Driving Lesson Confirmation (${lessonNumDisplay}) - ${schoolTitle}`;

      // Generate compliant RFC 5545 ICS
      const icsContent = generateIcsContent({
        schoolTitle,
        studentName: student.name,
        instructorName: verifiedBooking.trainerName,
        lessonNumber: humanLessonCount,
        date: verifiedBooking.date,
        time: verifiedBooking.time,
        duration: verifiedBooking.duration || 1,
        pickupLocation: verifiedBooking.pickupLocation || (schoolSettings?.address || 'School Center'),
        vehicleInfo,
        notes: verifiedBooking.lessonNotes || verifiedBooking.trainerNotes,
        bookingId: verifiedBooking.id,
        lang
      });

      const icsBase64 = btoa(unescape(encodeURIComponent(icsContent)));
      const icsDataUri = `data:text/calendar;charset=utf-8;base64,${icsBase64}`;

      const calendarBtnLabel = lang === 'ar'
        ? 'إضافة الدرس إلى تقويمك'
        : lang === 'nl'
        ? 'Les aan je agenda toevoegen'
        : 'Add lesson to your calendar';

      const isRtl = lang === 'ar';

      const emailHtml = `
        <!DOCTYPE html>
        <html lang="${lang}" dir="${isRtl ? 'rtl' : 'ltr'}">
        <head>
          <meta charset="UTF-8">
          <title>${emailSubject}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 24px 12px;">
            <tr>
              <td align="center">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; max-width: 540px; overflow: hidden; text-align: ${isRtl ? 'right' : 'left'};">
                  <tr>
                    <td style="padding: 24px 28px; background-color: #0f172a; color: #ffffff; border-bottom: 3px solid #d97706;">
                      <h2 style="margin: 0; font-size: 18px; font-weight: 800; letter-spacing: 0.5px;">${schoolTitle}</h2>
                      <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8;">${lang === 'ar' ? 'تأكيد حجز درس القيادة الرسمي' : lang === 'nl' ? 'Officiële Rijlesbevestiging' : 'Official Lesson Confirmation'}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 28px;">
                      <p style="font-size: 15px; margin: 0 0 8px 0; color: #0f172a;">
                        ${lang === 'ar' ? `مرحباً <strong>${student.name}</strong>،` : lang === 'nl' ? `Beste <strong>${student.name}</strong>,` : `Hello <strong>${student.name}</strong>,`}
                      </p>
                      <p style="font-size: 13px; color: #475569; margin: 0 0 20px 0; line-height: 1.6;">
                        ${lang === 'ar' 
                          ? `يسعدنا تأكيد حجز درس القيادة الخاص بك (<strong>${lessonNumDisplay}</strong>) بنجاح مع المدرب <strong>${verifiedBooking.trainerName}</strong>.` 
                          : lang === 'nl' 
                          ? `Je rijles (<strong>${lessonNumDisplay}</strong>) bij instructeur <strong>${verifiedBooking.trainerName}</strong> is succesvol bevestigd.` 
                          : `Your driving lesson (<strong>${lessonNumDisplay}</strong>) with instructor <strong>${verifiedBooking.trainerName}</strong> is successfully confirmed.`}
                      </p>

                      <!-- Lesson Details Card -->
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px; padding: 16px;">
                        <tr>
                          <td style="padding-bottom: 10px; border-bottom: 1px solid #e2e8f0;">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                              <tr>
                                <td style="font-size: 12px; font-weight: 700; color: #0f172a;">${lang === 'ar' ? 'تفاصيل الموعد' : lang === 'nl' ? 'Lesdetails' : 'Lesson Details'}</td>
                                <td align="${isRtl ? 'left' : 'right'}" style="font-size: 12px; font-weight: 800; color: #0284c7; font-family: monospace;">${lessonNumDisplay}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-top: 10px;">
                            <table width="100%" border="0" cellspacing="0" cellpadding="4">
                              <tr>
                                <td style="font-size: 12px; color: #64748b; width: 38%;">${lang === 'ar' ? 'التاريخ:' : lang === 'nl' ? 'Datum:' : 'Date:'}</td>
                                <td align="${isRtl ? 'left' : 'right'}" style="font-size: 12px; color: #0f172a; font-weight: 600;">${verifiedBooking.date}</td>
                              </tr>
                              <tr>
                                <td style="font-size: 12px; color: #64748b;">${lang === 'ar' ? 'الوقت:' : lang === 'nl' ? 'Tijdstip:' : 'Time:'}</td>
                                <td align="${isRtl ? 'left' : 'right'}" style="font-size: 12px; color: #0f172a; font-weight: 600;">${verifiedBooking.time} (${verifiedBooking.duration || 1} ${lang === 'ar' ? 'ساعة' : 'uur'})</td>
                              </tr>
                              <tr>
                                <td style="font-size: 12px; color: #64748b;">${lang === 'ar' ? 'المدرب:' : lang === 'nl' ? 'Instructeur:' : 'Instructor:'}</td>
                                <td align="${isRtl ? 'left' : 'right'}" style="font-size: 12px; color: #0f172a; font-weight: 600;">${verifiedBooking.trainerName}</td>
                              </tr>
                              <tr>
                                <td style="font-size: 12px; color: #64748b;">${lang === 'ar' ? 'نوع المركبة:' : lang === 'nl' ? 'Voertuig:' : 'Vehicle:'}</td>
                                <td align="${isRtl ? 'left' : 'right'}" style="font-size: 12px; color: #0f172a; font-weight: 600;">${vehicleInfo}</td>
                              </tr>
                              <tr>
                                <td style="font-size: 12px; color: #64748b;">${lang === 'ar' ? 'نقطة الالتقاء:' : lang === 'nl' ? 'Ophaallocatie:' : 'Pickup Location:'}</td>
                                <td align="${isRtl ? 'left' : 'right'}" style="font-size: 12px; color: #0f172a; font-weight: 600;">${verifiedBooking.pickupLocation || 'School Center'}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Prominent Calendar Action CTA in Email -->
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
                        <tr>
                          <td align="center">
                            <a href="${icsDataUri}" download="lesson-${verifiedBooking.date}.ics" target="_blank" style="background-color: #059669; color: #ffffff; padding: 14px 24px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 12px; display: block; width: 100%; box-sizing: border-box; text-align: center; letter-spacing: 0.3px;">
                              📅 ${calendarBtnLabel}
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="font-size: 11px; color: #64748b; line-height: 1.5; margin: 15px 0 0 0;">
                        ⚠️ ${lang === 'ar' 
                          ? 'يرجى التواجد في المكان المحدد قبل الموعد بـ 5 دقائق. لإلغاء الموعد أو تعديله يرجى إشعارنا قبل 24 ساعة على الأقل.' 
                          : lang === 'nl' 
                          ? 'Zorg dat je 5 minuten van tevoren aanwezig bent. Annuleren kan kosteloos tot 24 uur van tevoren.' 
                          : 'Please arrive 5 minutes prior to start time. Cancellations must be made at least 24 hours in advance.'}
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #fafafa; border-top: 1px solid #f1f5f9; padding: 16px 28px; text-align: center; font-size: 10px; color: #94a3b8;">
                      ${schoolTitle} &bull; ${schoolSettings?.address || ''} ${schoolSettings?.city || ''}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      sendEmailNotification({
        to: student.email,
        subject: emailSubject,
        html: emailHtml
      }).then(res => {
        if (res.success) emailSent = true;
      }).catch(err => {
        console.warn('Email dispatch skipped or non-fatal:', err);
      });
    } catch (e) {
      // Non-fatal
    }
  }

  return {
    success: true,
    data: verifiedBooking,
    sheetsSynced,
    calendarSynced,
    notificationSent,
    emailSent,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

export interface CancellationWorkflowParams {
  bookingId: string;
  studentId: string;
  reason?: string;
  cancelledBy?: 'Student' | 'Trainer' | 'Admin';
  allLessons: Lesson[];
  student?: Partial<StudentRecord>;
  schoolSettings?: Partial<SchoolSettings>;
  lang?: Language;
  accessToken?: string;
  spreadsheetId?: string;
}

/**
 * PHASE 7: Complete Student Cancellation Workflow
 * 1. Locate booking and verify authorization (must belong to student or trainer).
 * 2. Delete / cancel the corresponding Google Calendar event using calendarEventId.
 * 3. Update Lesson status to 'cancelled' with timestamp and reason.
 * 4. Sync updated lessons list to Google Sheets.
 * 5. Issue in-app cancellation notification & alert.
 */
export async function executeStudentCancellationWorkflow(
  params: CancellationWorkflowParams
): Promise<WorkflowResult<Lesson>> {
  const {
    bookingId,
    studentId,
    reason = 'Student requested cancellation',
    cancelledBy = 'Student',
    allLessons,
    student,
    schoolSettings,
    lang = 'nl',
    accessToken,
    spreadsheetId
  } = params;

  const warnings: string[] = [];
  let calendarSynced = false;
  let sheetsSynced = false;
  let notificationSent = false;
  let emailSent = false;

  const schoolTitle = getSchoolName(schoolSettings);
  const token = accessToken || getSheetsConfig().accessToken;
  const sheetId = spreadsheetId || getSheetsConfig().spreadsheetId;

  // 1. Locate booking
  const booking = allLessons.find(l => l.id === bookingId);
  if (!booking) {
    return {
      success: false,
      sheetsSynced: false,
      calendarSynced: false,
      notificationSent: false,
      error: `Lesson / Booking ID "${bookingId}" not found.`
    };
  }

  // Security authorization check: If cancelled by Student, ensure studentId matches
  if (cancelledBy === 'Student') {
    const isOwner = booking.studentId === studentId || (student && booking.studentName === student.name);
    if (!isOwner) {
      return {
        success: false,
        sheetsSynced: false,
        calendarSynced: false,
        notificationSent: false,
        error: 'Security Error: You are not authorized to cancel this booking.'
      };
    }
  }

  // 2. Google Calendar Cancellation
  if (booking.calendarEventId && token) {
    try {
      const calRes = await cancelLessonCalendarEvent(booking.calendarEventId, token);
      if (calRes.success) {
        calendarSynced = true;
      } else if (calRes.error) {
        warnings.push(`Calendar event removal warning: ${calRes.error}`);
      }
    } catch (calErr: any) {
      warnings.push(`Calendar cancellation error: ${calErr.message}`);
    }
  }

  // 3. Mark Lesson as Cancelled
  const updatedBooking: Lesson = {
    ...booking,
    status: 'cancelled',
    cancelledBy,
    cancellationReason: reason,
    cancellationDate: new Date().toISOString().split('T')[0],
    cancellationTime: new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
    calendarStatus: 'deleted'
  };

  const updatedLessons = allLessons.map(l => l.id === bookingId ? updatedBooking : l);

  // 4. Google Sheets Synchronization
  if (sheetId && token) {
    try {
      const sheetRes = await writeLessonsToSheet(sheetId, updatedLessons, token);
      if (sheetRes.success) {
        sheetsSynced = true;
      } else {
        warnings.push(`Sheets synchronization warning: ${sheetRes.error}`);
      }
    } catch (sheetErr: any) {
      warnings.push(`Sheets cancellation sync error: ${sheetErr.message}`);
    }
  }

  // 5. In-App Notifications
  try {
    // Notify Instructor (Temporary 3-day notice)
    addNotification({
      recipientRole: 'trainer',
      type: 'lesson_cancelled_by_student',
      expiresInDays: 3,
      titleAr: 'إلغاء درس من قبل المتدرب',
      titleNl: 'Rijles Geannuleerd door Leerling',
      titleEn: 'Lesson Cancelled by Student',
      messageAr: `قام ${booking.studentName} بإلغاء درس يوم ${booking.date} الساعة ${booking.time}. السبب: ${reason}`,
      messageNl: `${booking.studentName} heeft de rijles op ${booking.date} om ${booking.time} geannuleerd. Reden: ${reason}`,
      messageEn: `${booking.studentName} cancelled the lesson on ${booking.date} at ${booking.time}. Reason: ${reason}`,
      metadata: {
        studentId: booking.studentId || studentId,
        studentName: booking.studentName,
        lessonId: booking.id,
        date: booking.date,
        time: booking.time,
        reason
      }
    });

    // Notify Student
    addNotification({
      recipientRole: 'student',
      targetStudentId: booking.studentId || studentId,
      recipientEmail: student?.email,
      type: 'lesson_cancelled_by_student',
      titleAr: 'تم إلغاء درس القيادة',
      titleNl: 'Rijles Geannuleerd',
      titleEn: 'Lesson Cancelled',
      messageAr: `تم إلغاء درس يوم ${booking.date} الساعة ${booking.time} بنجاح.`,
      messageNl: `Je rijles op ${booking.date} om ${booking.time} is succesvol geannuleerd.`,
      messageEn: `Your lesson on ${booking.date} at ${booking.time} has been cancelled successfully.`,
      metadata: {
        studentId: booking.studentId || studentId,
        studentName: booking.studentName,
        lessonId: booking.id,
        date: booking.date,
        time: booking.time,
        reason
      }
    });

    notificationSent = true;
  } catch (notifErr: any) {
    warnings.push(`Notification delivery warning: ${notifErr.message}`);
  }

  return {
    success: true,
    data: updatedBooking,
    sheetsSynced,
    calendarSynced,
    notificationSent,
    emailSent,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}
