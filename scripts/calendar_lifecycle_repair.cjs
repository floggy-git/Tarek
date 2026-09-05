const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const file = path.join(root, 'src/services/integrationManager.ts');
let s = fs.readFileSync(file, 'utf8');

if (!s.includes('updateLessonCalendarEvent')) {
  s = s.replace(
    "import { createLessonCalendarEvent, cancelLessonCalendarEvent, generateIcsContent } from './googleCalendarService';",
    "import { createLessonCalendarEvent, updateLessonCalendarEvent, cancelLessonCalendarEvent, generateIcsContent } from './googleCalendarService';"
  );
}

if (!s.includes('export interface LessonUpdateWorkflowParams')) {
  const anchor = 'export interface CancellationWorkflowParams {';
  if (!s.includes(anchor)) throw new Error('Calendar lifecycle anchor not found');

  const block = `export interface LessonUpdateWorkflowParams {
  booking: Lesson;
  allLessons: Lesson[];
  student?: Partial<StudentRecord>;
  schoolSettings?: Partial<SchoolSettings>;
  accessToken?: string;
  spreadsheetId?: string;
}

/**
 * Complete lesson edit/reschedule lifecycle.
 * Existing Google Calendar event is updated by its persisted calendarEventId;
 * if the ID is missing, a new event is created and the returned ID is persisted.
 */
export async function executeLessonUpdateWorkflow(
  params: LessonUpdateWorkflowParams
): Promise<WorkflowResult<Lesson>> {
  const {
    booking,
    allLessons,
    student,
    schoolSettings,
    accessToken,
    spreadsheetId
  } = params;

  const warnings: string[] = [];
  let calendarSynced = false;
  let sheetsSynced = false;
  const token = accessToken || getSheetsConfig().accessToken;
  const sheetId = spreadsheetId || getSheetsConfig().spreadsheetId;

  if (student) {
    const ownerId = student.studentId || student.id || '';
    if (ownerId && booking.studentId !== ownerId) {
      return {
        success: false,
        sheetsSynced: false,
        calendarSynced: false,
        notificationSent: false,
        error: 'Security Error: You are not authorized to edit this booking.'
      };
    }
  }

  const updatedBooking: Lesson = { ...booking };

  if (token) {
    try {
      const calRes = updatedBooking.calendarEventId
        ? await updateLessonCalendarEvent(updatedBooking.calendarEventId, {
            booking: updatedBooking,
            student: student as StudentRecord,
            trainerName: updatedBooking.trainerName,
            schoolSettings,
            accessToken: token,
            allLessons
          })
        : await createLessonCalendarEvent({
            booking: updatedBooking,
            student: student as StudentRecord,
            trainerName: updatedBooking.trainerName,
            schoolSettings,
            accessToken: token,
            allLessons
          });

      if (calRes.success) {
        if (calRes.calendarEventId) updatedBooking.calendarEventId = calRes.calendarEventId;
        updatedBooking.calendarStatus = 'synced';
        calendarSynced = true;
      } else {
        updatedBooking.calendarStatus = 'failed';
        if (calRes.error) warnings.push(\`Calendar update warning: \${calRes.error}\`);
      }
    } catch (err) {
      updatedBooking.calendarStatus = 'failed';
      warnings.push(\`Calendar update error: \${err instanceof Error ? err.message : String(err)}\`);
    }
  }

  const updatedLessons = allLessons.some(l => l.id === updatedBooking.id)
    ? allLessons.map(l => l.id === updatedBooking.id ? updatedBooking : l)
    : [updatedBooking, ...allLessons];

  if (sheetId && token) {
    try {
      const sheetRes = await writeLessonsToSheet(sheetId, updatedLessons, token);
      if (sheetRes.success) sheetsSynced = true;
      else if (sheetRes.error) warnings.push(\`Sheets update warning: \${sheetRes.error}\`);
    } catch (err) {
      warnings.push(\`Sheets update error: \${err instanceof Error ? err.message : String(err)}\`);
    }
  }

  return {
    success: true,
    data: updatedBooking,
    sheetsSynced,
    calendarSynced,
    notificationSent: false,
    warnings: warnings.length ? warnings : undefined
  };
}

`;
  s = s.replace(anchor, block + anchor);
}

fs.writeFileSync(file, s);
console.log('Calendar edit lifecycle repair completed.');
