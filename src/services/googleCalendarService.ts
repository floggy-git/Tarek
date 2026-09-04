/**
 * Google Calendar Integration Service
 *
 * Google Calendar is supported for lesson events. The Lessons schema keeps
 * Calendar Event ID as the durable reference to the Google Calendar event.
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

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
const DEFAULT_TIME_ZONE = 'Europe/Amsterdam';

function requireAccessToken(accessToken?: string): string {
  if (!accessToken) {
    throw new Error('Google Calendar authorization is required. Please sign in with Google again.');
  }
  return accessToken;
}

function addMinutesToLocalDateTime(date: string, time: string, durationHours: number): { date: string; time: string } {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const totalMinutes = (Number.isFinite(hour) ? hour : 0) * 60 + (Number.isFinite(minute) ? minute : 0) + Math.round((durationHours || 1) * 60);
  const dayBase = Date.UTC(year || 1970, (month || 1) - 1, day || 1);
  const result = new Date(dayBase + totalMinutes * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${result.getUTCFullYear()}-${pad(result.getUTCMonth() + 1)}-${pad(result.getUTCDate())}`,
    time: `${pad(result.getUTCHours())}:${pad(result.getUTCMinutes())}:00`
  };
}

function calendarError(status: number, body: string): string {
  if (status === 401) return 'Google Calendar authorization expired or is missing. Please sign in with Google again.';
  if (status === 403) return 'Google Calendar permission was denied. Please sign in with Google again and allow Calendar access.';
  if (status === 404) return 'The Google Calendar event or calendar could not be found.';
  try {
    const parsed = JSON.parse(body);
    return parsed?.error?.message || `Google Calendar request failed (${status}).`;
  } catch {
    return `Google Calendar request failed (${status}).`;
  }
}

async function calendarRequest(
  url: string,
  accessToken: string,
  init: RequestInit
): Promise<any> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init.headers || {})
    }
  });
  const body = await response.text();
  if (!response.ok) throw new Error(calendarError(response.status, body));
  return body ? JSON.parse(body) : null;
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

export function formatDisplayLessonNumber(lesson: Partial<Lesson>, allLessons?: Lesson[], lang: Language = 'ar'): string {
  const num = getSequentialLessonNumber(lesson, allLessons);
  if (lang === 'ar') return `الدرس ${num}`;
  if (lang === 'nl') return `Les ${num}`;
  return `Lesson ${num}`;
}

export async function createLessonCalendarEvent(params: CreateCalendarEventParams): Promise<CalendarEventResult> {
  try {
    const accessToken = requireAccessToken(params.accessToken);
    const booking = params.booking;
    const studentName = params.student?.name || booking.studentName || '';
    const trainerName = params.trainerName || booking.trainerName || '';
    const schoolTitle = params.schoolSettings?.name || 'Driving School';
    const timeZone = params.timeZone || DEFAULT_TIME_ZONE;
    const duration = Number(booking.duration) || 1;
    const end = addMinutesToLocalDateTime(booking.date, booking.time, duration);
    const lessonNumber = getSequentialLessonNumber(booking, params.allLessons);

    const description = [
      `${schoolTitle} - Driving Lesson`,
      `Lesson: ${lessonNumber}`,
      `Student: ${studentName}`,
      `Instructor: ${trainerName}`,
      `Date: ${booking.date}`,
      `Time: ${booking.time}`,
      `Duration: ${duration} hour(s)`,
      `Pickup: ${booking.pickupLocation || ''}`,
      booking.instructorNotes ? `Notes: ${booking.instructorNotes}` : ''
    ].filter(Boolean).join('\n');

    const event = await calendarRequest(CALENDAR_API, accessToken, {
      method: 'POST',
      body: JSON.stringify({
        summary: `${schoolTitle} - Lesson ${lessonNumber} (${studentName})`,
        location: booking.pickupLocation || undefined,
        description,
        start: { dateTime: `${booking.date}T${booking.time}:00`, timeZone },
        end: { dateTime: `${end.date}T${end.time}`, timeZone },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 60 },
            { method: 'popup', minutes: 24 * 60 }
          ]
        }
      })
    });

    return {
      success: true,
      calendarEventId: event?.id,
      htmlLink: event?.htmlLink
    };
  } catch (error: any) {
    console.error('Google Calendar create event failed:', error);
    return { success: false, error: error?.message || 'Failed to create Google Calendar event.' };
  }
}

export async function updateLessonCalendarEvent(
  calendarEventId: string,
  params: CreateCalendarEventParams
): Promise<CalendarEventResult> {
  try {
    const accessToken = requireAccessToken(params.accessToken);
    if (!calendarEventId) return { success: false, error: 'Calendar Event ID is required for an update.' };

    const booking = params.booking;
    const studentName = params.student?.name || booking.studentName || '';
    const trainerName = params.trainerName || booking.trainerName || '';
    const schoolTitle = params.schoolSettings?.name || 'Driving School';
    const timeZone = params.timeZone || DEFAULT_TIME_ZONE;
    const duration = Number(booking.duration) || 1;
    const end = addMinutesToLocalDateTime(booking.date, booking.time, duration);
    const lessonNumber = getSequentialLessonNumber(booking, params.allLessons);

    const event = await calendarRequest(`${CALENDAR_API}/${encodeURIComponent(calendarEventId)}`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify({
        summary: `${schoolTitle} - Lesson ${lessonNumber} (${studentName})`,
        location: booking.pickupLocation || undefined,
        description: `${schoolTitle} - Driving Lesson\nLesson: ${lessonNumber}\nStudent: ${studentName}\nInstructor: ${trainerName}\nDate: ${booking.date}\nTime: ${booking.time}\nDuration: ${duration} hour(s)\nPickup: ${booking.pickupLocation || ''}\n${booking.instructorNotes ? `Notes: ${booking.instructorNotes}` : ''}`,
        start: { dateTime: `${booking.date}T${booking.time}:00`, timeZone },
        end: { dateTime: `${end.date}T${end.time}`, timeZone }
      })
    });

    return { success: true, calendarEventId: event?.id || calendarEventId, htmlLink: event?.htmlLink };
  } catch (error: any) {
    console.error('Google Calendar update event failed:', error);
    return { success: false, error: error?.message || 'Failed to update Google Calendar event.' };
  }
}

export function generateIcsContent(options: IcsEventOptions): string {
  const { schoolTitle, studentName, instructorName, lessonNumber, date, time, duration = 1, pickupLocation, vehicleInfo, notes, bookingId = 'LES-1', lang = 'ar' } = options;
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
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Driving School App//Driving Lesson//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',`UID:${uid}`,`DTSTAMP:${nowFormatted}`,`DTSTART:${startFormatted}`,`DTEND:${endFormatted}`,`SUMMARY:${escapeIcs(summary)}`,`DESCRIPTION:${escapeIcs(descriptionLines)}`,`LOCATION:${escapeIcs(pickupLocation)}`,'STATUS:CONFIRMED','BEGIN:VALARM','TRIGGER:-PT1H','ACTION:DISPLAY','DESCRIPTION:Lesson Reminder','END:VALARM','BEGIN:VALARM','TRIGGER:-PT24H','ACTION:DISPLAY','DESCRIPTION:Lesson Reminder (24h)','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');
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

export async function dispatchIcsEvent(options: { filename: string; icsContent: string; title: string; descriptionText?: string }): Promise<CalendarDispatchResult> {
  const { filename, icsContent, title, descriptionText } = options;
  const safeFilename = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  if (typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function' && typeof File !== 'undefined') {
    try {
      const icsFile = new File([icsContent], safeFilename, { type: 'text/calendar' });
      if (typeof (navigator as any).canShare === 'function' && (navigator as any).canShare({ files: [icsFile] })) {
        await (navigator as any).share({ files: [icsFile], title: title || 'Driving Lesson', text: descriptionText || title || 'Driving Lesson' });
        return 'shared';
      }
    } catch (err: any) {
      if (err && (err.name === 'AbortError' || err.code === 20)) return 'cancelled';
      console.warn('Web Share API failed or unsupported for file, falling back to download:', err);
    }
  }
  return downloadIcsFile(safeFilename, icsContent) ? 'downloaded' : 'failed';
}

export async function cancelLessonCalendarEvent(calendarEventId: string, accessToken?: string): Promise<CalendarEventResult> {
  try {
    const token = requireAccessToken(accessToken);
    if (!calendarEventId) return { success: false, error: 'Calendar Event ID is required for cancellation.' };
    await calendarRequest(`${CALENDAR_API}/${encodeURIComponent(calendarEventId)}`, token, { method: 'DELETE' });
    return { success: true, calendarEventId };
  } catch (error: any) {
    console.error('Google Calendar delete event failed:', error);
    return { success: false, error: error?.message || 'Failed to cancel Google Calendar event.' };
  }
}
