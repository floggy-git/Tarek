/**
 * Google Calendar Integration Service
 *
 * Google Calendar is intentionally disabled for the application.
 * The Lessons schema keeps Calendar Event ID for compatibility, but no
 * Google Calendar OAuth/API operation is performed.
 */

import { Lesson, StudentRecord, SchoolSettings, Language } from '../types';

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
  date: string;
  time: string;
  duration: number;
  pickupLocation: string;
  vehicleInfo?: string;
  notes?: string;
  bookingId?: string;
  lang?: Language;
}

export function getSequentialLessonNumber(lesson: Partial<Lesson>, allLessons?: Lesson[]): number {
  if (lesson.lessonNumber && lesson.lessonNumber > 0) return lesson.lessonNumber;
  if (allLessons && allLessons.length > 0) {
    const studentId = lesson.studentId;
    const studentName = lesson.studentName?.trim().toLowerCase();
    const matches = allLessons.filter(l => {
      if (l.status === 'cancelled') return false;
      if (studentId && l.studentId === studentId) return true;
      if (studentName && l.studentName && l.studentName.trim().toLowerCase() === studentName) return true;
      return false;
    });
    matches.sort((a, b) => (a.date + ' ' + a.time).localeCompare(b.date + ' ' + b.time));
    const idx = matches.findIndex(l => l.id === lesson.id);
    if (idx !== -1) return idx + 1;
    return matches.length + 1;
  }
  if (lesson.id) {
    const match = lesson.id.match(/\d+/);
    if (match) {
      const parsed = parseInt(match[0], 10);
      if (parsed > 0 && parsed < 1000) return parsed;
    }
  }
  return 1;
}

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

export async function createLessonCalendarEvent(
  _params: CreateCalendarEventParams
): Promise<CalendarEventResult> {
  return {
    success: false,
    error: 'Google Calendar integration is explicitly disabled. No Calendar API call was made.'
  };
}

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
  const formatIcsDt = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const startFormatted = formatIcsDt(startDt);
  const endFormatted = formatIcsDt(endDt);
  const nowFormatted = formatIcsDt(new Date());
  const escapeIcs = (str: string) => (str || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  const lessonNumLabel = lang === 'ar' ? `الدرس ${lessonNumber}` : lang === 'nl' ? `Les ${lessonNumber}` : `Lesson ${lessonNumber}`;
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

export async function dispatchIcsEvent(options: {
  filename: string;
  icsContent: string;
  title: string;
  descriptionText?: string;
}): Promise<CalendarDispatchResult> {
  const { filename, icsContent, title, descriptionText } = options;
  const safeFilename = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  if (typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function' && typeof File !== 'undefined') {
    try {
      const icsFile = new File([icsContent], safeFilename, { type: 'text/calendar' });
      if (typeof (navigator as any).canShare === 'function' && (navigator as any).canShare({ files: [icsFile] })) {
        await (navigator as any).share({
          files: [icsFile],
          title: title || 'Driving Lesson',
          text: descriptionText || title || 'Driving Lesson'
        });
        return 'shared';
      }
    } catch (err: any) {
      if (err && (err.name === 'AbortError' || err.code === 20)) return 'cancelled';
      console.warn('Web Share API failed or unsupported for file, falling back to download:', err);
    }
  }
  return downloadIcsFile(safeFilename, icsContent) ? 'downloaded' : 'failed';
}

/**
 * Calendar cancellation is intentionally disabled. Returning success here would
 * falsely report a mutation against Google Calendar, so callers must handle the
 * explicit disabled result instead.
 */
export async function cancelLessonCalendarEvent(
  _calendarEventId: string,
  _accessToken?: string
): Promise<CalendarEventResult> {
  return {
    success: false,
    error: 'Google Calendar integration is explicitly disabled. No Calendar API call was made.'
  };
}
