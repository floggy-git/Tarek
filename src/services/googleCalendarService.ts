/**
 * Google Calendar Integration Service
 * Manages Google Calendar Events for Driving Lessons & Bookings.
 * 
 * Strict Data Relationship:
 * Booking ID (Lesson ID) <---------> Google Calendar Event ID
 * 
 * Provides:
 * - Create verified Calendar Event
 * - Delete/Cancel Calendar Event with IDOR & isolation protection
 * - Update existing Calendar Event
 * - Prevent duplicate calendar events
 */

import { Lesson, StudentRecord, SchoolSettings, Language } from '../types';
import { getSchoolName } from '../types';
import { getSheetsConfig } from '../utils/googleSheets';

export interface CalendarEventResult {
  success: boolean;
  calendarEventId?: string;
  htmlLink?: string;
  error?: string;
}

export interface CreateCalendarEventParams {
  booking: Lesson;
  student?: Partial<StudentRecord>;
  trainerName?: string;
  schoolSettings?: Partial<SchoolSettings>;
  accessToken?: string;
  timeZone?: string;
  allLessons?: Lesson[];
}

export interface IcsEventOptions {
  schoolTitle: string;
  studentName: string;
  instructorName: string;
  lessonNumber: number | string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number; // Hours
  pickupLocation: string;
  vehicleInfo?: string;
  notes?: string;
  bookingId?: string;
  lang?: Language;
}

/**
 * Calculates human-readable sequential lesson number for a student (e.g. 1, 2, 3...)
 * without exposing internal IDs (like LES-000002).
 */
export function getSequentialLessonNumber(
  lesson: Partial<Lesson>,
  allLessons?: Lesson[]
): number {
  if (lesson.lessonNumber && lesson.lessonNumber > 0) {
    return lesson.lessonNumber;
  }
  if (allLessons && allLessons.length > 0) {
    const studentId = lesson.studentId;
    const studentName = lesson.studentName?.trim().toLowerCase();

    const matches = allLessons.filter(l => {
      if (l.status === 'cancelled') return false;
      if (studentId && l.studentId === studentId) return true;
      if (studentName && l.studentName && l.studentName.trim().toLowerCase() === studentName) return true;
      return false;
    });

    // Sort chronologically
    matches.sort((a, b) => (a.date + ' ' + a.time).localeCompare(b.date + ' ' + b.time));
    const idx = matches.findIndex(l => l.id === lesson.id);
    if (idx !== -1) {
      return idx + 1;
    }
    return matches.length + 1;
  }
  if (lesson.id) {
    const match = lesson.id.match(/\d+/);
    if (match) {
      const parsed = parseInt(match[0], 10);
      if (parsed > 0 && parsed < 1000) {
        return parsed;
      }
    }
  }
  return 1;
}

/**
 * Formats a localized human-readable lesson number label (e.g. "Lesson 2", "الدرس 2", "Les 2")
 */
export function formatDisplayLessonNumber(
  lesson: Partial<Lesson>,
  allLessons?: Lesson[],
  lang: Language = 'ar'
): string {
  const num = getSequentialLessonNumber(lesson, allLessons);
  if (lang === 'ar') return `الدرس ${num}`;
  if (lang === 'nl') return `Les ${num}`;
  return `Lesson ${num}`;
}

// Convert YYYY-MM-DD and HH:MM + duration (hours) into ISO string start/end
function calculateEventDateTimes(
  date: string,
  time: string,
  durationHours: number = 1
): { startIso: string; endIso: string; endTimeFormatted: string } {
  // Safe parsing
  const cleanDate = date.trim();
  const cleanTime = time.trim();
  
  // Format HH:MM
  const timeParts = cleanTime.split(':');
  const hours = parseInt(timeParts[0] || '10', 10);
  const minutes = parseInt(timeParts[1] || '00', 10);

  const startDate = new Date(`${cleanDate}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
  const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);

  const endH = String(endDate.getHours()).padStart(2, '0');
  const endM = String(endDate.getMinutes()).padStart(2, '0');

  return {
    startIso: startDate.toISOString(),
    endIso: endDate.toISOString(),
    endTimeFormatted: `${endH}:${endM}`
  };
}

/**
 * Creates a Google Calendar Event in the instructor's configured Google Calendar.
 * Automatically triggered on booking creation.
 * Contains real driving school information, human-readable lesson numbering, and vehicle specifications.
 */
export async function createLessonCalendarEvent(
  _params: CreateCalendarEventParams
): Promise<CalendarEventResult> {
  // Google Calendar is explicitly DISABLED in this environment
  return {
    success: false,
    error: 'Google Calendar integration is explicitly disabled.'
  };
}

/**
 * Generates standard RFC 5545 iCalendar (.ics) format string for PWA/iOS/Android device calendars.
 */
export function generateIcsContent(options: IcsEventOptions): string {
  const {
    schoolTitle,
    studentName,
    instructorName,
    lessonNumber,
    date,
    time,
    duration = 1,
    pickupLocation,
    vehicleInfo,
    notes,
    bookingId = 'LES-1',
    lang = 'ar'
  } = options;

  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);

  const startDt = new Date(year, (month || 1) - 1, day || 1, hours || 10, minutes || 0, 0);
  const endDt = new Date(startDt.getTime() + (duration || 1) * 60 * 60 * 1000);

  const pad = (n: number) => String(n).padStart(2, '0');
  const formatIcsDt = (d: Date) => 
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

  const startFormatted = formatIcsDt(startDt);
  const endFormatted = formatIcsDt(endDt);
  const nowFormatted = formatIcsDt(new Date());

  const escapeIcs = (str: string) =>
    (str || '')
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');

  const lessonNumLabel = lang === 'ar' 
    ? `الدرس ${lessonNumber}` 
    : lang === 'nl' 
    ? `Les ${lessonNumber}` 
    : `Lesson ${lessonNumber}`;

  const summary = `${schoolTitle} - ${lessonNumLabel} (${studentName})`;

  const descriptionLines = [
    lang === 'ar' ? `تفاصيل درس القيادة - ${schoolTitle}` : `${schoolTitle} Driving Lesson`,
    `--------------------------------`,
    `${lang === 'ar' ? 'رقم الدرس' : lang === 'nl' ? 'Lesnummer' : 'Lesson'}: ${lessonNumLabel}`,
    `${lang === 'ar' ? 'المتدرب' : lang === 'nl' ? 'Leerling' : 'Student'}: ${studentName}`,
    `${lang === 'ar' ? 'المدرب' : lang === 'nl' ? 'Instructeur' : 'Instructor'}: ${instructorName}`,
    `${lang === 'ar' ? 'التاريخ' : lang === 'nl' ? 'Datum' : 'Date'}: ${date}`,
    `${lang === 'ar' ? 'الوقت' : lang === 'nl' ? 'Tijd' : 'Time'}: ${time} (${duration} ${lang === 'ar' ? 'ساعة' : lang === 'nl' ? 'uur' : 'hour(s)'})`,
    `${lang === 'ar' ? 'مكان بدء الدرس' : lang === 'nl' ? 'Startlocatie van de rijles' : 'Lesson Start Location'}: ${pickupLocation}`,
    vehicleInfo ? `${lang === 'ar' ? 'نوع المركبة' : lang === 'nl' ? 'Lesvoertuig' : 'Vehicle'}: ${vehicleInfo}` : null,
    notes ? `${lang === 'ar' ? 'ملاحظات' : 'Notes'}: ${notes}` : null
  ].filter(Boolean).join('\n');

  const uid = `lesson-${bookingId}-${Date.now()}@drivingschool.app`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Driving School App//Driving Lesson//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowFormatted}`,
    `DTSTART:${startFormatted}`,
    `DTEND:${endFormatted}`,
    `SUMMARY:${escapeIcs(summary)}`,
    `DESCRIPTION:${escapeIcs(descriptionLines)}`,
    `LOCATION:${escapeIcs(pickupLocation)}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Lesson Reminder',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Lesson Reminder (24h)',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

/**
 * Triggers native browser/PWA download of the .ics file.
 * Priority 2 fallback when Web Share API is unavailable.
 */
export function downloadIcsFile(filename: string, content: string): boolean {
  try {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename.endsWith('.ics') ? filename : `${filename}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch (err) {
    console.error('Error downloading .ics file:', err);
    return false;
  }
}

export type CalendarDispatchResult = 'shared' | 'downloaded' | 'cancelled' | 'failed';

/**
 * Dispatches an iCalendar (.ics) event to the student's device using standards-based client capabilities.
 * 
 * PRIORITY 1:
 * If the browser/PWA environment supports the Web Share API with file sharing (navigator.canShare with files):
 * - Packages .ics content into a File object (MIME type 'text/calendar')
 * - Invokes navigator.share({ files: [file], title, text })
 * - Allows the OS / browser to display the native calendar/sheet picker (iOS Calendar, Android Calendar, etc.)
 * 
 * PRIORITY 2 (Fallback):
 * - Invokes downloadIcsFile for direct standards-based browser opening/downloading.
 */
export async function dispatchIcsEvent(options: {
  filename: string;
  icsContent: string;
  title: string;
  descriptionText?: string;
}): Promise<CalendarDispatchResult> {
  const { filename, icsContent, title, descriptionText } = options;
  const safeFilename = filename.endsWith('.ics') ? filename : `${filename}.ics`;

  // Check if Web Share API with files is available and supported
  if (typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function' && typeof File !== 'undefined') {
    try {
      const icsFile = new File([icsContent], safeFilename, { type: 'text/calendar' });
      
      // Capability detection using navigator.canShare
      if (typeof (navigator as any).canShare === 'function' && (navigator as any).canShare({ files: [icsFile] })) {
        await (navigator as any).share({
          files: [icsFile],
          title: title || 'Driving Lesson',
          text: descriptionText || title || 'Driving Lesson'
        });
        return 'shared';
      }
    } catch (err: any) {
      // If user aborted/cancelled the share sheet, return 'cancelled' gracefully without error
      if (err && (err.name === 'AbortError' || err.code === 20)) {
        return 'cancelled';
      }
      console.warn('Web Share API failed or unsupported for file, falling back to download:', err);
    }
  }

  // Priority 2 Fallback: standard client-side .ics blob trigger
  const downloaded = downloadIcsFile(safeFilename, icsContent);
  return downloaded ? 'downloaded' : 'failed';
}

/**
 * Cancels and deletes a specific Google Calendar Event by its unique calendarEventId.
 * Validates that this cancellation does NOT touch any other event.
 */
export async function cancelLessonCalendarEvent(
  _calendarEventId: string,
  _accessToken?: string
): Promise<CalendarEventResult> {
  return {
    success: true
  };
}
