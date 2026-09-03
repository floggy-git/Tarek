/**
 * Google Sheets Operational Data Service
 * Provides centralized, validated synchronization for:
 * - Students (Primary Key: studentId / id)
 * - Trainers
 * - Bookings & Lessons
 * - Wallet Transactions
 * - Invoices
 * - Notifications
 * - School Settings
 * - Packages
 */

import {
  StudentRecord,
  TrainerRecord,
  Lesson,
  WalletTransaction,
  InvoiceRecord,
  SchoolSettings,
  DrivePackage,
  HelpFaqItem
} from '../types';
import { AppNotification } from '../utils/notificationStore';
import {
  getSheetsConfig,
  GoogleSheetsConfig,
  loadSchoolSettingsFromGoogleSheet,
  writeSchoolSettingsToGoogleSheet
} from '../utils/googleSheets';

export interface SheetSyncResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

const DEFAULT_BATCH_RANGE_LIMIT = 500;

/**
 * Sanitizes cell values to prevent Google Sheets Formula Injection (CWE-1236)
 */
export function sanitizeSpreadsheetCell(val: any, allowFormula: boolean = false): any {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number' || typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!allowFormula && (trimmed.startsWith('=') || trimmed.startsWith('+') || (trimmed.startsWith('-') && !/^-?\d+(\.\d+)?$/.test(trimmed)) || trimmed.startsWith('@'))) {
      return `'${val}`;
    }
  }
  return val;
}

// Helper to make authenticated Google Sheets API requests with automatic Formula Injection sanitization
async function callSheetsApi(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
  accessToken?: string
): Promise<any> {
  const token = accessToken || getSheetsConfig().accessToken;
  if (!token) {
    throw new Error('Google OAuth Access Token is required for Sheets API operations.');
  }

  // Automatically sanitize outgoing tabular cell data (except header row and Dashboard)
  let sanitizedBody = body;
  if (body && Array.isArray(body.values)) {
    const isDashboard = url.includes('Dashboard');
    sanitizedBody = {
      ...body,
      values: body.values.map((row: any[], rIdx: number) => {
        if (rIdx === 0 || isDashboard) return row;
        return Array.isArray(row) ? row.map(cell => sanitizeSpreadsheetCell(cell)) : row;
      })
    };
  }

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const response = await fetch(url, {
    method,
    headers,
    body: sanitizedBody ? JSON.stringify(sanitizedBody) : undefined
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sheets API ${method} ${response.status}: ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

/**
 * ----------------------------------------------------
 * 1. STUDENTS INTEGRATION
 * Primary Key: Student ID (stable, never rely solely on name/email)
 * ----------------------------------------------------
 */
export async function syncStudentsFromSheet(
  spreadsheetId: string,
  accessToken?: string
): Promise<SheetSyncResult<StudentRecord[]>> {
  try {
    if (!spreadsheetId) throw new Error('Spreadsheet ID is required.');
    const range = encodeURIComponent('Students!A1:Z500');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
    const data = await callSheetsApi(url, 'GET', undefined, accessToken);

    if (!data.values || data.values.length <= 1) {
      return { success: true, data: [], timestamp: new Date().toISOString() };
    }

    const headers = data.values[0].map((h: any) => String(h).trim().toLowerCase());
    const idIdx = headers.findIndex((h: string) => h.includes('id') || h === 'student id' || h === 'studentid');
    const nameIdx = headers.findIndex((h: string) => h.includes('name') || h === 'full name');
    const emailIdx = headers.findIndex((h: string) => h.includes('email'));
    const phoneIdx = headers.findIndex((h: string) => h.includes('phone') || h.includes('tel'));
    const dobIdx = headers.findIndex((h: string) => h.includes('dob') || h.includes('birth'));
    const cityIdx = headers.findIndex((h: string) => h.includes('city') || h.includes('stad'));
    const pkgIdx = headers.findIndex((h: string) => h.includes('package') || h.includes('pakket'));
    const balIdx = headers.findIndex((h: string) => h.includes('balance') || h.includes('saldo'));
    const readyIdx = headers.findIndex((h: string) => h.includes('readiness') || h.includes('progress'));
    const statusIdx = headers.findIndex((h: string) => h.includes('status'));
    const theoryIdx = headers.findIndex((h: string) => h.includes('theory') || h.includes('theorie'));
    const driveFolderIdx = headers.findIndex((h: string) => h.includes('drivefolder') || h.includes('drive folder'));

    const students: StudentRecord[] = [];

    for (let i = 1; i < data.values.length; i++) {
      const row = data.values[i];
      if (!row || row.length === 0) continue;

      let studentId = idIdx !== -1 && row[idIdx] ? String(row[idIdx]).trim() : '';
      if (!studentId) {
        studentId = `STD-${String(i).padStart(6, '0')}`;
      }

      const name = nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]).trim() : `Student ${studentId}`;
      const email = emailIdx !== -1 && row[emailIdx] ? String(row[emailIdx]).trim() : '';
      const phone = phoneIdx !== -1 && row[phoneIdx] ? String(row[phoneIdx]).trim() : '';
      const dob = dobIdx !== -1 && row[dobIdx] ? String(row[dobIdx]).trim() : '2000-01-01';
      const city = cityIdx !== -1 && row[cityIdx] ? String(row[cityIdx]).trim() : 'Amsterdam';
      const currentPackage = pkgIdx !== -1 && row[pkgIdx] ? String(row[pkgIdx]).trim() : 'Optimal Progress';
      const balance = balIdx !== -1 && row[balIdx] && !isNaN(parseFloat(row[balIdx])) ? parseFloat(row[balIdx]) : 0;
      const readiness = readyIdx !== -1 && row[readyIdx] && !isNaN(parseInt(row[readyIdx], 10)) ? parseInt(row[readyIdx], 10) : 0;
      const status = statusIdx !== -1 && row[statusIdx] ? String(row[statusIdx]).trim() : 'active';
      const theoryExamStatus = theoryIdx !== -1 && row[theoryIdx] ? String(row[theoryIdx]).trim() : 'Passed';
      const driveFolderId = driveFolderIdx !== -1 && row[driveFolderIdx] ? String(row[driveFolderIdx]).trim() : undefined;

      students.push({
        id: studentId,
        studentId,
        name,
        email,
        phone,
        dob,
        city,
        currentPackage,
        balance,
        readiness,
        status,
        theoryExamStatus,
        driveFolderId
      });
    }

    return { success: true, data: students, timestamp: new Date().toISOString() };
  } catch (err: any) {
    console.error('Error in syncStudentsFromSheet:', err);
    return { success: false, error: err.message, timestamp: new Date().toISOString() };
  }
}

export async function writeStudentsToSheet(
  spreadsheetId: string,
  students: StudentRecord[],
  accessToken?: string
): Promise<SheetSyncResult<void>> {
  try {
    if (!spreadsheetId) throw new Error('Spreadsheet ID is required.');
    const headers = [
      'Student ID',
      'Name',
      'Email',
      'Phone',
      'Date of Birth',
      'City',
      'Current Package',
      'Balance (€)',
      'Exam Readiness (%)',
      'Status',
      'Theory Exam Status',
      'Drive Folder ID'
    ];

    const rows: any[][] = [headers];
    for (const st of students) {
      if (isDemoStudent(st)) continue; // STRICT SAFETY: Never upload demo students to Google Sheets
      rows.push([
        st.studentId || st.id,
        st.name,
        st.email,
        st.phone,
        st.dob,
        st.city,
        st.currentPackage,
        st.balance ?? 0,
        st.readiness ?? 0,
        st.status || 'active',
        st.theoryExamStatus || 'Passed',
        st.driveFolderId || ''
      ]);
    }

    const range = encodeURIComponent(`Students!A1:L${rows.length}`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;
    await callSheetsApi(url, 'PUT', { values: rows }, accessToken);

    return { success: true, timestamp: new Date().toISOString() };
  } catch (err: any) {
    console.error('Error in writeStudentsToSheet:', err);
    return { success: false, error: err.message, timestamp: new Date().toISOString() };
  }
}

/**
 * ----------------------------------------------------
 * 2. LESSONS & BOOKINGS INTEGRATION
 * Stable relationship: Lesson ID, Student ID, Calendar Event ID
 * ----------------------------------------------------
 */
export async function syncLessonsFromSheet(
  spreadsheetId: string,
  accessToken?: string
): Promise<SheetSyncResult<Lesson[]>> {
  try {
    if (!spreadsheetId) throw new Error('Spreadsheet ID is required.');
    const range = encodeURIComponent('Lessons!A1:Z1000');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
    const data = await callSheetsApi(url, 'GET', undefined, accessToken);

    if (!data.values || data.values.length <= 1) {
      return { success: true, data: [], timestamp: new Date().toISOString() };
    }

    const headers = data.values[0].map((h: any) => String(h).trim().toLowerCase());
    const idIdx = headers.findIndex((h: string) => h.includes('id') || h === 'lesson id' || h === 'booking id');
    const studentIdIdx = headers.findIndex((h: string) => h.includes('student id') || h === 'studentid');
    const studentNameIdx = headers.findIndex((h: string) => h.includes('student name') || h === 'student');
    const trainerIdx = headers.findIndex((h: string) => h.includes('trainer') || h.includes('instructor'));
    const dateIdx = headers.findIndex((h: string) => h.includes('date') || h.includes('datum'));
    const timeIdx = headers.findIndex((h: string) => h.includes('time') || h.includes('tijd'));
    const durIdx = headers.findIndex((h: string) => h.includes('duration') || h.includes('duur') || h.includes('hours'));
    const priceIdx = headers.findIndex((h: string) => h.includes('price') || h.includes('prijs'));
    const locIdx = headers.findIndex((h: string) => h.includes('location') || h.includes('locatie') || h.includes('pickup'));
    const statusIdx = headers.findIndex((h: string) => h.includes('status'));
    const calEventIdx = headers.findIndex((h: string) => h.includes('calendar') || h.includes('event id') || h.includes('calendareventid'));
    const notesIdx = headers.findIndex((h: string) => h.includes('notes') || h.includes('notities'));
    const ratingIdx = headers.findIndex((h: string) => h.includes('rating') || h.includes('score'));

    const lessons: Lesson[] = [];

    for (let i = 1; i < data.values.length; i++) {
      const row = data.values[i];
      if (!row || row.length === 0) continue;

      let id = idIdx !== -1 && row[idIdx] ? String(row[idIdx]).trim() : '';
      if (!id) id = `LES-${String(i).padStart(6, '0')}`;

      const studentId = studentIdIdx !== -1 && row[studentIdIdx] ? String(row[studentIdIdx]).trim() : undefined;
      const studentName = studentNameIdx !== -1 && row[studentNameIdx] ? String(row[studentNameIdx]).trim() : 'Student';
      const trainerName = trainerIdx !== -1 && row[trainerIdx] ? String(row[trainerIdx]).trim() : 'Instructor Samir';
      const date = dateIdx !== -1 && row[dateIdx] ? String(row[dateIdx]).trim() : new Date().toISOString().split('T')[0];
      const time = timeIdx !== -1 && row[timeIdx] ? String(row[timeIdx]).trim() : '10:00';
      const duration = durIdx !== -1 && row[durIdx] && !isNaN(parseFloat(row[durIdx])) ? parseFloat(row[durIdx]) : 1;
      const price = priceIdx !== -1 && row[priceIdx] && !isNaN(parseFloat(row[priceIdx])) ? parseFloat(row[priceIdx]) : 65;
      const pickupLocation = locIdx !== -1 && row[locIdx] ? String(row[locIdx]).trim() : 'School Center';
      const statusRaw = statusIdx !== -1 && row[statusIdx] ? String(row[statusIdx]).trim().toLowerCase() : 'upcoming';
      const status: 'upcoming' | 'active' | 'completed' | 'cancelled' =
        statusRaw === 'completed' || statusRaw === 'voltooid'
          ? 'completed'
          : statusRaw === 'cancelled' || statusRaw === 'geannuleerd'
          ? 'cancelled'
          : statusRaw === 'active' || statusRaw === 'actief'
          ? 'active'
          : 'upcoming';

      const calendarEventId = calEventIdx !== -1 && row[calEventIdx] ? String(row[calEventIdx]).trim() : undefined;
      const instructorNotes = notesIdx !== -1 && row[notesIdx] ? String(row[notesIdx]).trim() : undefined;
      const performanceRating = ratingIdx !== -1 && row[ratingIdx] && !isNaN(parseInt(row[ratingIdx], 10)) ? parseInt(row[ratingIdx], 10) : undefined;

      lessons.push({
        id,
        studentId,
        studentName,
        trainerName,
        date,
        time,
        duration,
        price,
        pickupLocation,
        status,
        calendarEventId,
        calendarStatus: calendarEventId ? 'synced' : undefined,
        instructorNotes,
        performanceRating
      });
    }

    return { success: true, data: lessons, timestamp: new Date().toISOString() };
  } catch (err: any) {
    console.error('Error in syncLessonsFromSheet:', err);
    return { success: false, error: err.message, timestamp: new Date().toISOString() };
  }
}

export async function writeLessonsToSheet(
  spreadsheetId: string,
  lessons: Lesson[],
  accessToken?: string
): Promise<SheetSyncResult<void>> {
  try {
    if (!spreadsheetId) throw new Error('Spreadsheet ID is required.');
    const headers = [
      'Lesson ID',
      'Student ID',
      'Student Name',
      'Trainer Name',
      'Date',
      'Time',
      'Duration (h)',
      'Price (€)',
      'Pickup Location',
      'Status',
      'Calendar Event ID',
      'Instructor Notes',
      'Rating'
    ];

    const rows: any[][] = [headers];
    for (const l of lessons) {
      rows.push([
        l.id,
        l.studentId || '',
        l.studentName,
        l.trainerName,
        l.date,
        l.time,
        l.duration,
        l.price,
        l.pickupLocation,
        l.status,
        l.calendarEventId || '',
        l.instructorNotes || l.trainerNotes || '',
        l.performanceRating || ''
      ]);
    }

    const range = encodeURIComponent(`Lessons!A1:M${rows.length}`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;
    await callSheetsApi(url, 'PUT', { values: rows }, accessToken);

    return { success: true, timestamp: new Date().toISOString() };
  } catch (err: any) {
    console.error('Error in writeLessonsToSheet:', err);
    return { success: false, error: err.message, timestamp: new Date().toISOString() };
  }
}

/**
 * ----------------------------------------------------
 * 3. WALLET TRANSACTIONS & INVOICES INTEGRATION
 * ----------------------------------------------------
 */
export async function syncWalletFromSheet(
  spreadsheetId: string,
  accessToken?: string
): Promise<SheetSyncResult<WalletTransaction[]>> {
  try {
    if (!spreadsheetId) throw new Error('Spreadsheet ID is required.');
    const range = encodeURIComponent('Wallet!A1:Z1000');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
    const data = await callSheetsApi(url, 'GET', undefined, accessToken);

    if (!data.values || data.values.length <= 1) {
      return { success: true, data: [], timestamp: new Date().toISOString() };
    }

    const headers = data.values[0].map((h: any) => String(h).trim().toLowerCase());
    const idIdx = headers.findIndex((h: string) => h.includes('id') || h === 'tx id' || h === 'transaction id');
    const stIdIdx = headers.findIndex((h: string) => h.includes('student id') || h === 'studentid');
    const stNameIdx = headers.findIndex((h: string) => h.includes('student name') || h === 'student');
    const dateIdx = headers.findIndex((h: string) => h.includes('date') || h.includes('datum'));
    const typeIdx = headers.findIndex((h: string) => h.includes('type'));
    const amtIdx = headers.findIndex((h: string) => h.includes('amount') || h.includes('bedrag'));
    const descIdx = headers.findIndex((h: string) => h.includes('description') || h.includes('omschrijving'));
    const invIdx = headers.findIndex((h: string) => h.includes('invoice') || h.includes('factuur'));
    const driveInvIdx = headers.findIndex((h: string) => h.includes('drive') || h.includes('pdf url'));

    const txs: WalletTransaction[] = [];

    for (let i = 1; i < data.values.length; i++) {
      const row = data.values[i];
      if (!row || row.length === 0) continue;

      let id = idIdx !== -1 && row[idIdx] ? String(row[idIdx]).trim() : '';
      if (!id) id = `TX-${String(i).padStart(6, '0')}`;

      const studentId = stIdIdx !== -1 && row[stIdIdx] ? String(row[stIdIdx]).trim() : undefined;
      const studentName = stNameIdx !== -1 && row[stNameIdx] ? String(row[stNameIdx]).trim() : undefined;
      const date = dateIdx !== -1 && row[dateIdx] ? String(row[dateIdx]).trim() : new Date().toISOString().split('T')[0];
      const typeRaw = typeIdx !== -1 && row[typeIdx] ? String(row[typeIdx]).trim().toLowerCase() : 'deposit';
      const type: 'deposit' | 'payment' | 'adjustment' =
        typeRaw === 'payment' || typeRaw === 'betaling'
          ? 'payment'
          : typeRaw === 'adjustment'
          ? 'adjustment'
          : 'deposit';
      const amount = amtIdx !== -1 && row[amtIdx] && !isNaN(parseFloat(row[amtIdx])) ? parseFloat(row[amtIdx]) : 0;
      const description = descIdx !== -1 && row[descIdx] ? String(row[descIdx]).trim() : 'Transaction';
      const invoiceId = invIdx !== -1 && row[invIdx] ? String(row[invIdx]).trim() : undefined;
      const driveInvoiceUrl = driveInvIdx !== -1 && row[driveInvIdx] ? String(row[driveInvIdx]).trim() : undefined;

      txs.push({
        id,
        studentId,
        studentName,
        date,
        type,
        amount,
        description,
        invoiceId,
        driveInvoiceUrl
      });
    }

    return { success: true, data: txs, timestamp: new Date().toISOString() };
  } catch (err: any) {
    console.error('Error in syncWalletFromSheet:', err);
    return { success: false, error: err.message, timestamp: new Date().toISOString() };
  }
}

export async function writeWalletToSheet(
  spreadsheetId: string,
  transactions: WalletTransaction[],
  accessToken?: string
): Promise<SheetSyncResult<void>> {
  try {
    if (!spreadsheetId) throw new Error('Spreadsheet ID is required.');
    const headers = [
      'Transaction ID',
      'Student ID',
      'Student Name',
      'Date',
      'Type',
      'Amount (€)',
      'Description',
      'Invoice ID',
      'Drive Invoice URL'
    ];

    const rows: any[][] = [headers];
    for (const tx of transactions) {
      rows.push([
        tx.id,
        tx.studentId || '',
        tx.studentName || '',
        tx.date,
        tx.type,
        tx.amount,
        tx.description,
        tx.invoiceId || '',
        tx.driveInvoiceUrl || ''
      ]);
    }

    const range = encodeURIComponent(`Wallet!A1:I${rows.length}`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;
    await callSheetsApi(url, 'PUT', { values: rows }, accessToken);

    return { success: true, timestamp: new Date().toISOString() };
  } catch (err: any) {
    console.error('Error in writeWalletToSheet:', err);
    return { success: false, error: err.message, timestamp: new Date().toISOString() };
  }
}

/**
 * ----------------------------------------------------
 * 4. INVOICES SHEET INTEGRATION
 * ----------------------------------------------------
 */
export async function syncInvoicesFromSheet(
  spreadsheetId: string,
  accessToken?: string
): Promise<SheetSyncResult<InvoiceRecord[]>> {
  try {
    if (!spreadsheetId) throw new Error('Spreadsheet ID is required.');
    const range = encodeURIComponent('Invoices!A1:Z500');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
    const data = await callSheetsApi(url, 'GET', undefined, accessToken);

    if (!data.values || data.values.length <= 1) {
      return { success: true, data: [], timestamp: new Date().toISOString() };
    }

    const headers = data.values[0].map((h: any) => String(h).trim().toLowerCase());
    const idIdx = headers.findIndex((h: string) => h.includes('id') || h === 'invoice id');
    const stIdIdx = headers.findIndex((h: string) => h.includes('student id') || h === 'studentid');
    const stNameIdx = headers.findIndex((h: string) => h.includes('name'));
    const emailIdx = headers.findIndex((h: string) => h.includes('email'));
    const amtIdx = headers.findIndex((h: string) => h.includes('amount') || h.includes('bedrag'));
    const dateIdx = headers.findIndex((h: string) => h.includes('date') || h.includes('datum'));
    const descIdx = headers.findIndex((h: string) => h.includes('description') || h.includes('omschrijving'));
    const statusIdx = headers.findIndex((h: string) => h.includes('status'));
    const driveFileIdx = headers.findIndex((h: string) => h.includes('drive file') || h.includes('drivefileid'));
    const driveUrlIdx = headers.findIndex((h: string) => h.includes('drive url') || h.includes('pdf link'));

    const invoices: InvoiceRecord[] = [];

    for (let i = 1; i < data.values.length; i++) {
      const row = data.values[i];
      if (!row || row.length === 0) continue;

      const id = idIdx !== -1 && row[idIdx] ? String(row[idIdx]).trim() : `INV-${new Date().getFullYear()}-${String(i).padStart(3, '0')}`;
      const studentId = stIdIdx !== -1 && row[stIdIdx] ? String(row[stIdIdx]).trim() : '';
      const studentName = stNameIdx !== -1 && row[stNameIdx] ? String(row[stNameIdx]).trim() : 'Student';
      const studentEmail = emailIdx !== -1 && row[emailIdx] ? String(row[emailIdx]).trim() : undefined;
      const amount = amtIdx !== -1 && row[amtIdx] && !isNaN(parseFloat(row[amtIdx])) ? parseFloat(row[amtIdx]) : 0;
      const date = dateIdx !== -1 && row[dateIdx] ? String(row[dateIdx]).trim() : new Date().toISOString().split('T')[0];
      const description = descIdx !== -1 && row[descIdx] ? String(row[descIdx]).trim() : 'Official Driving Tuition Invoice';
      const statusRaw = statusIdx !== -1 && row[statusIdx] ? String(row[statusIdx]).trim().toLowerCase() : 'paid';
      const status: 'paid' | 'unpaid' | 'credited' =
        statusRaw === 'unpaid' ? 'unpaid' : statusRaw === 'credited' ? 'credited' : 'paid';
      const driveFileId = driveFileIdx !== -1 && row[driveFileIdx] ? String(row[driveFileIdx]).trim() : undefined;
      const driveUrl = driveUrlIdx !== -1 && row[driveUrlIdx] ? String(row[driveUrlIdx]).trim() : undefined;

      invoices.push({
        id,
        studentId,
        studentName,
        studentEmail,
        amount,
        date,
        description,
        status,
        driveFileId,
        driveUrl
      });
    }

    return { success: true, data: invoices, timestamp: new Date().toISOString() };
  } catch (err: any) {
    console.error('Error in syncInvoicesFromSheet:', err);
    return { success: false, error: err.message, timestamp: new Date().toISOString() };
  }
}

export async function writeInvoicesToSheet(
  spreadsheetId: string,
  invoices: InvoiceRecord[],
  accessToken?: string
): Promise<SheetSyncResult<void>> {
  try {
    if (!spreadsheetId) throw new Error('Spreadsheet ID is required.');
    const headers = [
      'Invoice ID',
      'Student ID',
      'Student Name',
      'Student Email',
      'Amount (€)',
      'Date',
      'Description',
      'Status',
      'Drive File ID',
      'Drive PDF URL'
    ];

    const rows: any[][] = [headers];
    for (const inv of invoices) {
      rows.push([
        inv.id,
        inv.studentId,
        inv.studentName,
        inv.studentEmail || '',
        inv.amount,
        inv.date,
        inv.description,
        inv.status,
        inv.driveFileId || '',
        inv.driveUrl || ''
      ]);
    }

    const range = encodeURIComponent(`Invoices!A1:J${rows.length}`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;
    await callSheetsApi(url, 'PUT', { values: rows }, accessToken);

    return { success: true, timestamp: new Date().toISOString() };
  } catch (err: any) {
    console.error('Error in writeInvoicesToSheet:', err);
    return { success: false, error: err.message, timestamp: new Date().toISOString() };
  }
}

/**
 * ----------------------------------------------------
 * 5. NOTIFICATIONS SHEET INTEGRATION
 * ----------------------------------------------------
 */
export async function syncNotificationsFromSheet(
  spreadsheetId: string,
  accessToken?: string
): Promise<SheetSyncResult<AppNotification[]>> {
  try {
    if (!spreadsheetId) throw new Error('Spreadsheet ID is required.');
    const range = encodeURIComponent('Notifications!A1:Z500');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
    const data = await callSheetsApi(url, 'GET', undefined, accessToken);

    if (!data.values || data.values.length <= 1) {
      return { success: true, data: [], timestamp: new Date().toISOString() };
    }

    const headers = data.values[0].map((h: any) => String(h).trim().toLowerCase());
    const idIdx = headers.findIndex((h: string) => h.includes('id') || h === 'notification id');
    const roleIdx = headers.findIndex((h: string) => h.includes('role') || h.includes('recipient role'));
    const stIdIdx = headers.findIndex((h: string) => h.includes('student id') || h === 'target student id');
    const emailIdx = headers.findIndex((h: string) => h.includes('email'));
    const typeIdx = headers.findIndex((h: string) => h.includes('type'));
    const titleIdx = headers.findIndex((h: string) => h.includes('title') || h.includes('titel'));
    const msgIdx = headers.findIndex((h: string) => h.includes('message') || h.includes('bericht'));
    const dateIdx = headers.findIndex((h: string) => h.includes('timestamp') || h.includes('date'));
    const readIdx = headers.findIndex((h: string) => h.includes('read') || h.includes('gelezen'));

    const notifs: AppNotification[] = [];

    for (let i = 1; i < data.values.length; i++) {
      const row = data.values[i];
      if (!row || row.length === 0) continue;

      const id = idIdx !== -1 && row[idIdx] ? String(row[idIdx]).trim() : `notif-${Date.now()}-${i}`;
      const recipientRole = roleIdx !== -1 && row[roleIdx] ? (String(row[roleIdx]).trim().toLowerCase() as any) : 'student';
      const targetStudentId = stIdIdx !== -1 && row[stIdIdx] ? String(row[stIdIdx]).trim() : undefined;
      const recipientEmail = emailIdx !== -1 && row[emailIdx] ? String(row[emailIdx]).trim() : undefined;
      const type = typeIdx !== -1 && row[typeIdx] ? (String(row[typeIdx]).trim() as any) : 'lesson_booked';
      const title = titleIdx !== -1 && row[titleIdx] ? String(row[titleIdx]).trim() : 'Notification';
      const message = msgIdx !== -1 && row[msgIdx] ? String(row[msgIdx]).trim() : '';
      const timestamp = dateIdx !== -1 && row[dateIdx] ? (isNaN(parseInt(row[dateIdx], 10)) ? new Date(row[dateIdx]).getTime() : parseInt(row[dateIdx], 10)) : Date.now();
      const read = readIdx !== -1 && row[readIdx] ? String(row[readIdx]).toLowerCase() === 'true' : false;

      notifs.push({
        id,
        recipientRole,
        targetStudentId,
        recipientEmail,
        type,
        titleAr: title,
        titleNl: title,
        titleEn: title,
        messageAr: message,
        messageNl: message,
        messageEn: message,
        timestamp,
        read
      });
    }

    return { success: true, data: notifs, timestamp: new Date().toISOString() };
  } catch (err: any) {
    console.error('Error in syncNotificationsFromSheet:', err);
    return { success: false, error: err.message, timestamp: new Date().toISOString() };
  }
}

export async function writeNotificationsToSheet(
  spreadsheetId: string,
  notifications: AppNotification[],
  accessToken?: string
): Promise<SheetSyncResult<void>> {
  try {
    if (!spreadsheetId) throw new Error('Spreadsheet ID is required.');
    const headers = [
      'Notification ID',
      'Recipient Role',
      'Target Student ID',
      'Recipient Email',
      'Type',
      'Title',
      'Message',
      'Timestamp',
      'Read Status'
    ];

    const rows: any[][] = [headers];
    for (const n of notifications) {
      rows.push([
        n.id,
        n.recipientRole,
        n.targetStudentId || '',
        n.recipientEmail || '',
        n.type,
        n.titleNl || n.titleEn || n.titleAr || 'Notification',
        n.messageNl || n.messageEn || n.messageAr || '',
        n.timestamp,
        n.read ? 'TRUE' : 'FALSE'
      ]);
    }

    const range = encodeURIComponent(`Notifications!A1:I${rows.length}`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;
    await callSheetsApi(url, 'PUT', { values: rows }, accessToken);

    return { success: true, timestamp: new Date().toISOString() };
  } catch (err: any) {
    console.error('Error in writeNotificationsToSheet:', err);
    return { success: false, error: err.message, timestamp: new Date().toISOString() };
  }
}

/**
 * ----------------------------------------------------
 * 9. HELP & SUPPORT INTEGRATION
 * Sheet Tab: 'Help & Support'
 * Headers: ID | Category | Question_AR | Answer_AR | Question_NL | Answer_NL | Question_EN | Answer_EN | Active | Order
 * ----------------------------------------------------
 */
export async function syncHelpItemsFromSheet(
  spreadsheetId: string,
  accessToken?: string
): Promise<SheetSyncResult<HelpFaqItem[]>> {
  try {
    if (!spreadsheetId) throw new Error('Spreadsheet ID is required.');
    const range = encodeURIComponent('Help & Support!A1:J200');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
    const data = await callSheetsApi(url, 'GET', undefined, accessToken);

    if (!data.values || data.values.length <= 1) {
      return { success: true, data: [], timestamp: new Date().toISOString() };
    }

    const headers = data.values[0].map((h: any) => String(h || '').trim().toLowerCase());
    const idIdx = headers.findIndex((h: string) => h === 'id' || h.includes('id'));
    const catIdx = headers.findIndex((h: string) => h === 'category' || h.includes('cat') || h.includes('categorie'));
    const qArIdx = headers.findIndex((h: string) => h === 'question_ar' || h === 'question ar' || h.includes('(ar)'));
    const aArIdx = headers.findIndex((h: string) => h === 'answer_ar' || h === 'answer ar' || h.includes('(ar)'));
    const qNlIdx = headers.findIndex((h: string) => h === 'question_nl' || h === 'question nl' || h.includes('(nl)'));
    const aNlIdx = headers.findIndex((h: string) => h === 'answer_nl' || h === 'answer nl' || h.includes('(nl)'));
    const qEnIdx = headers.findIndex((h: string) => h === 'question_en' || h === 'question en' || h.includes('(en)'));
    const aEnIdx = headers.findIndex((h: string) => h === 'answer_en' || h === 'answer en' || h.includes('(en)'));
    const activeIdx = headers.findIndex((h: string) => h === 'active' || h === 'isactive');
    const orderIdx = headers.findIndex((h: string) => h === 'order' || h.includes('order'));

    const items: HelpFaqItem[] = [];
    for (let i = 1; i < data.values.length; i++) {
      const row = data.values[i];
      if (!row || row.length === 0) continue;

      const rawQAr = qArIdx !== -1 && row[qArIdx] ? String(row[qArIdx]).trim() : '';
      const rawQNl = qNlIdx !== -1 && row[qNlIdx] ? String(row[qNlIdx]).trim() : '';
      const rawQEn = qEnIdx !== -1 && row[qEnIdx] ? String(row[qEnIdx]).trim() : '';

      if (!rawQAr && !rawQNl && !rawQEn) continue;

      const id = idIdx !== -1 && row[idIdx] ? String(row[idIdx]).trim() : `FAQ-${String(i).padStart(3, '0')}`;
      const category = catIdx !== -1 && row[catIdx] ? String(row[catIdx]).trim() : 'Frequently Asked Questions';

      const questionAr = rawQAr || rawQEn || rawQNl;
      const answerAr = aArIdx !== -1 && row[aArIdx] ? String(row[aArIdx]).trim() : '';
      const questionNl = rawQNl || rawQEn || rawQAr;
      const answerNl = aNlIdx !== -1 && row[aNlIdx] ? String(row[aNlIdx]).trim() : '';
      const questionEn = rawQEn || rawQNl || rawQAr;
      const answerEn = aEnIdx !== -1 && row[aEnIdx] ? String(row[aEnIdx]).trim() : '';

      let active = true;
      if (activeIdx !== -1 && row[activeIdx] !== undefined && row[activeIdx] !== '') {
        const actStr = String(row[activeIdx]).trim().toLowerCase();
        active = actStr === 'true' || actStr === 'yes' || actStr === '1' || actStr === 'active';
      }

      const order = orderIdx !== -1 && row[orderIdx] ? (parseInt(row[orderIdx], 10) || i) : i;

      items.push({
        id,
        category,
        questionAr,
        answerAr,
        questionNl,
        answerNl,
        questionEn,
        answerEn,
        active,
        order
      });
    }

    return {
      success: true,
      data: items.sort((a, b) => a.order - b.order),
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    console.error('Error in syncHelpItemsFromSheet:', err);
    return { success: false, error: err.message, timestamp: new Date().toISOString() };
  }
}

export async function syncHelpItemsToSheet(
  spreadsheetId: string,
  items: HelpFaqItem[],
  accessToken?: string
): Promise<SheetSyncResult<void>> {
  try {
    if (!spreadsheetId) throw new Error('Spreadsheet ID is required.');
    const headers = [
      'ID',
      'Category',
      'Question_AR',
      'Answer_AR',
      'Question_NL',
      'Answer_NL',
      'Question_EN',
      'Answer_EN',
      'Active',
      'Order'
    ];

    const rows: any[][] = [headers];
    const sorted = [...items].sort((a, b) => a.order - b.order);

    for (const item of sorted) {
      rows.push([
        item.id,
        item.category,
        item.questionAr,
        item.answerAr,
        item.questionNl,
        item.answerNl,
        item.questionEn,
        item.answerEn,
        item.active ? 'TRUE' : 'FALSE',
        item.order
      ]);
    }

    const range = encodeURIComponent(`Help & Support!A1:J${rows.length}`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;
    await callSheetsApi(url, 'PUT', { values: rows }, accessToken);

    return { success: true, timestamp: new Date().toISOString() };
  } catch (err: any) {
    console.error('Error in syncHelpItemsToSheet:', err);
    return { success: false, error: err.message, timestamp: new Date().toISOString() };
  }
}

/**
 * ----------------------------------------------------
 * 10. PACKAGES CATALOG INTEGRATION (ADMIN CONTROL PANEL)
 * Sheet Tab: 'Packages'
 * 13 Columns: id | name | description | hours | price | discountPrice | badge | popular | recommended | colorTheme | displayOrder | isActive | features
 * ----------------------------------------------------
 */
export async function syncPackagesFromSheet(
  spreadsheetId: string,
  accessToken?: string
): Promise<SheetSyncResult<DrivePackage[]>> {
  try {
    if (!spreadsheetId) throw new Error('Spreadsheet ID is required.');
    const range = encodeURIComponent('Packages!A1:M100');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
    const data = await callSheetsApi(url, 'GET', undefined, accessToken);

    if (!data.values || data.values.length <= 1) {
      return { success: true, data: [], timestamp: new Date().toISOString() };
    }

    const headers = data.values[0].map((h: any) => String(h || '').trim().toLowerCase());
    const idIdx = headers.findIndex((h: string) => h === 'id' || h.includes('id'));
    const nameIdx = headers.findIndex((h: string) => h === 'name' || h.includes('naam') || h.includes('name'));
    const descIdx = headers.findIndex((h: string) => h === 'description' || h.includes('desc') || h.includes('omschrijving'));
    const hoursIdx = headers.findIndex((h: string) => h === 'hours' || h.includes('hour') || h.includes('uur') || h.includes('uren'));
    const priceIdx = headers.findIndex((h: string) => h === 'price' || h.includes('price') || h.includes('prijs'));
    const discountIdx = headers.findIndex((h: string) => h === 'discountprice' || h.includes('discount') || h.includes('korting'));
    const badgeIdx = headers.findIndex((h: string) => h === 'badge');
    const popIdx = headers.findIndex((h: string) => h === 'popular' || h.includes('populair'));
    const recIdx = headers.findIndex((h: string) => h === 'recommended' || h.includes('aanbevolen'));
    const themeIdx = headers.findIndex((h: string) => h === 'colortheme' || h.includes('theme') || h.includes('color'));
    const orderIdx = headers.findIndex((h: string) => h === 'displayorder' || h.includes('order') || h.includes('volgorde'));
    const activeIdx = headers.findIndex((h: string) => h === 'isactive' || h === 'active');
    const featIdx = headers.findIndex((h: string) => h === 'features' || h.includes('feature') || h.includes('kenmerken'));

    const packages: DrivePackage[] = [];

    for (let i = 1; i < data.values.length; i++) {
      const row = data.values[i];
      if (!row || row.length === 0) continue;

      let id = idIdx !== -1 && row[idIdx] ? String(row[idIdx]).trim() : '';
      if (!id || id === 'pack-1') id = 'PKG-000001';
      else if (id === 'pack-2') id = 'PKG-000002';
      else if (id === 'pack-3') id = 'PKG-000003';
      else if (!id.startsWith('PKG-')) id = `PKG-${String(i).padStart(6, '0')}`;

      const name = nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]).trim() : `Package ${i}`;
      const description = descIdx !== -1 && row[descIdx] ? String(row[descIdx]).trim() : '';
      const hours = hoursIdx !== -1 && row[hoursIdx] && !isNaN(parseFloat(row[hoursIdx])) ? parseFloat(row[hoursIdx]) : 10;
      const price = priceIdx !== -1 && row[priceIdx] && !isNaN(parseFloat(row[priceIdx])) ? parseFloat(row[priceIdx]) : 650;
      const discountPrice = discountIdx !== -1 && row[discountIdx] && !isNaN(parseFloat(row[discountIdx])) ? parseFloat(row[discountIdx]) : undefined;
      const badge = badgeIdx !== -1 && row[badgeIdx] ? String(row[badgeIdx]).trim() : undefined;
      const popular = popIdx !== -1 && row[popIdx] ? String(row[popIdx]).trim().toLowerCase() === 'true' : false;
      const recommended = recIdx !== -1 && row[recIdx] ? String(row[recIdx]).trim().toLowerCase() === 'true' : false;
      const colorTheme = themeIdx !== -1 && row[themeIdx] ? String(row[themeIdx]).trim() : 'classic-blue';
      const displayOrder = orderIdx !== -1 && row[orderIdx] && !isNaN(parseInt(row[orderIdx], 10)) ? parseInt(row[orderIdx], 10) : i;

      let isActive = true;
      if (activeIdx !== -1 && row[activeIdx] !== undefined && row[activeIdx] !== '') {
        const actStr = String(row[activeIdx]).trim().toLowerCase();
        isActive = actStr === 'true' || actStr === 'yes' || actStr === '1' || actStr === 'active';
      }

      let features: string[] | undefined = undefined;
      if (featIdx !== -1 && row[featIdx]) {
        const featStr = String(row[featIdx]).trim();
        if (featStr) {
          features = featStr.includes('|')
            ? featStr.split('|').map(s => s.trim()).filter(Boolean)
            : featStr.split('\n').map(s => s.trim()).filter(Boolean);
        }
      }

      packages.push({
        id,
        name,
        description,
        hours,
        price,
        discountPrice,
        badge: badge || undefined,
        popular,
        recommended,
        colorTheme,
        displayOrder,
        isActive,
        features
      });
    }

    return {
      success: true,
      data: packages.sort((a, b) => a.displayOrder - b.displayOrder),
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    console.error('Error in syncPackagesFromSheet:', err);
    return { success: false, error: err.message, timestamp: new Date().toISOString() };
  }
}

export async function writePackagesToSheet(
  spreadsheetId: string,
  packages: DrivePackage[],
  accessToken?: string
): Promise<SheetSyncResult<void>> {
  try {
    if (!spreadsheetId) throw new Error('Spreadsheet ID is required.');
    const headers = [
      'id',
      'name',
      'description',
      'hours',
      'price',
      'discountPrice',
      'badge',
      'popular',
      'recommended',
      'colorTheme',
      'displayOrder',
      'isActive',
      'features'
    ];

    const rows: any[][] = [headers];
    const sorted = [...packages].sort((a, b) => a.displayOrder - b.displayOrder);

    for (const pkg of sorted) {
      rows.push([
        pkg.id,
        pkg.name,
        pkg.description,
        pkg.hours,
        pkg.price,
        pkg.discountPrice !== undefined ? pkg.discountPrice : '',
        pkg.badge || '',
        pkg.popular ? 'TRUE' : 'FALSE',
        pkg.recommended ? 'TRUE' : 'FALSE',
        pkg.colorTheme || 'classic-blue',
        pkg.displayOrder,
        pkg.isActive ? 'TRUE' : 'FALSE',
        pkg.features ? pkg.features.join(' | ') : ''
      ]);
    }

    const range = encodeURIComponent(`Packages!A1:M${rows.length}`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;
    await callSheetsApi(url, 'PUT', { values: rows }, accessToken);

    return { success: true, timestamp: new Date().toISOString() };
  } catch (err: any) {
    console.error('Error in writePackagesToSheet:', err);
    return { success: false, error: err.message, timestamp: new Date().toISOString() };
  }
}

/**
 * Sync Audit Logs from Google Sheets 'AuditLogs' tab
 */
export async function syncAuditLogsFromSheet(
  spreadsheetId: string,
  accessToken?: string
): Promise<SheetSyncResult<any[]>> {
  try {
    if (!spreadsheetId) throw new Error('Spreadsheet ID is required.');
    const range = encodeURIComponent('AuditLogs!A1:M200');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
    const data = await callSheetsApi(url, 'GET', undefined, accessToken);

    if (!data.values || data.values.length <= 1) {
      return { success: true, data: [], timestamp: new Date().toISOString() };
    }

    const rows = data.values;
    const entries: any[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      entries.push({
        auditId: row[0] || `AUD-${i}`,
        userId: row[1] || '',
        userName: row[2] || '',
        userRole: row[3] || 'Admin',
        action: row[4] || '',
        changedBy: row[5] || '',
        date: row[6] || '',
        time: row[7] || '',
        timeZone: row[8] || '',
        ipAddress: row[9] || '',
        deviceBrowser: row[10] || '',
        targetRecord: row[11] || '',
        previousValue: row[12] || '',
        newValue: row[13] || '',
        source: 'Google Sheets'
      });
    }

    return { success: true, data: entries.reverse(), timestamp: new Date().toISOString() };
  } catch (err: any) {
    console.error('Error in syncAuditLogsFromSheet:', err);
    return { success: false, error: err.message, timestamp: new Date().toISOString() };
  }
}

/**
 * ----------------------------------------------------
 * 11. BATCH OPERATIONAL SCHEMA INITIALIZER & AUDITOR
 * Initializes exactly the 8 operational tabs with exact schemas:
 * Students, Lessons, Wallet, Invoices, Notifications, Packages, Help & Support, SchoolSettings
 * ----------------------------------------------------
 */
export interface SpreadsheetVerificationReport {
  success?: boolean;
  error?: string;
  spreadsheetId: string;
  spreadsheetTitle: string;
  tabsBefore: string[];
  tabsCreated: string[];
  tabsAlreadyExisting: string[];
  allTabsAfter: string[];
  headersVerified: Record<string, string[]>;
  packagesWritten: number;
  packagesVerifiedCount: number;
  packagesRowsVerified: Array<{ id: string; name: string; hours: string; price: string }>;
  studentDataWritten: boolean;
  lessonDataWritten: boolean;
  paymentDataWritten: boolean;
  invoiceDataWritten: boolean;
  notificationDataWritten: boolean;
  googleCalendarDisabled: boolean;
}

export function isDemoStudent(student: Partial<StudentRecord>): boolean {
  const id = student.id || student.studentId || '';
  const email = (student.email || '').toLowerCase();
  const name = (student.name || '').toLowerCase();
  if (['ST-000001', 'ST-000002', 'ST-000003'].includes(id)) return true;
  if (email.includes('@student.drivingschool.nl')) return true;
  if (email.includes('amir.al-hassan') || email.includes('sanne.dejong') || email.includes('michael.vanberg')) return true;
  if (name.includes('amir al-hassan') || name.includes('sanne de jong') || name.includes('michael van berg')) return true;
  return false;
}

export async function initializeSpreadsheetTabsAndHeaders(
  spreadsheetId: string,
  accessToken?: string
): Promise<SpreadsheetVerificationReport> {
  const token = accessToken || getSheetsConfig().accessToken;
  if (!token) {
    throw new Error('Google OAuth Access Token is required to initialize Google Spreadsheet schema.');
  }

  // 1. Fetch metadata before initialization
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const metaBefore = await callSheetsApi(metaUrl, 'GET', undefined, token);
  const spreadsheetTitle: string = metaBefore.properties?.title || 'Google Spreadsheet';
  const existingSheetsBefore: any[] = metaBefore.sheets || [];
  const tabNamesBefore: string[] = existingSheetsBefore.map((s: any) => s.properties?.title || '');

  const requiredTabs = [
    { title: 'Dashboard', color: { red: 0.15, green: 0.39, blue: 0.92 } },
    { title: 'Students', color: { red: 0.15, green: 0.39, blue: 0.92 } },
    { title: 'Lessons', color: { red: 0.05, green: 0.59, blue: 0.41 } },
    { title: 'Wallet', color: { red: 0.85, green: 0.47, blue: 0.05 } },
    { title: 'Invoices', color: { red: 0.55, green: 0.36, blue: 0.96 } },
    { title: 'Notifications', color: { red: 0.94, green: 0.27, blue: 0.24 } },
    { title: 'Packages', color: { red: 0.08, green: 0.72, blue: 0.65 } },
    { title: 'Help & Support', color: { red: 0.1, green: 0.6, blue: 0.8 } },
    { title: 'SchoolSettings', color: { red: 0.45, green: 0.55, blue: 0.65 } },
    { title: 'AuditLogs', color: { red: 0.85, green: 0.25, blue: 0.25 } }
  ];

  const tabsToCreate = requiredTabs.filter(t => !tabNamesBefore.includes(t.title));
  const tabsAlreadyExisting = requiredTabs.filter(t => tabNamesBefore.includes(t.title)).map(t => t.title);

  // 2. Batch add missing sheets
  if (tabsToCreate.length > 0) {
    const addSheetRequests = tabsToCreate.map(t => ({
      addSheet: {
        properties: {
          title: t.title,
          tabColor: t.color
        }
      }
    }));

    await callSheetsApi(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      'POST',
      { requests: addSheetRequests },
      token
    );
  }

  // 3. Define the exact verified schemas for each sheet
  const studentsHeaders = [
    'Student ID', 'Name', 'Email', 'Phone', 'Date of Birth', 'City',
    'Current Package', 'Balance (€)', 'Exam Readiness (%)', 'Status', 'Theory Exam Status', 'Drive Folder ID'
  ];

  const lessonsHeaders = [
    'Lesson ID', 'Student ID', 'Student Name', 'Trainer Name', 'Date', 'Time',
    'Duration (h)', 'Price (€)', 'Pickup Location', 'Status', 'Calendar Event ID', 'Instructor Notes', 'Rating'
  ];

  const walletHeaders = [
    'Transaction ID', 'Student ID', 'Student Name', 'Date', 'Type',
    'Amount (€)', 'Description', 'Invoice ID', 'Drive Invoice URL'
  ];

  const invoicesHeaders = [
    'Invoice ID', 'Student ID', 'Student Name', 'Student Email', 'Amount (€)',
    'Date', 'Description', 'Status', 'Drive File ID', 'Drive PDF URL'
  ];

  const notificationsHeaders = [
    'Notification ID', 'Recipient Role', 'Target Student ID', 'Recipient Email',
    'Type', 'Title', 'Message', 'Timestamp', 'Read Status'
  ];

  const packagesHeaders = [
    'id', 'name', 'description', 'hours', 'price', 'discountPrice',
    'badge', 'popular', 'recommended', 'colorTheme', 'displayOrder', 'isActive', 'features'
  ];

  const helpHeaders = [
    'ID', 'Category', 'Question_AR', 'Answer_AR', 'Question_NL', 'Answer_NL',
    'Question_EN', 'Answer_EN', 'Active', 'Order'
  ];

  const schoolSettingsHeaders = [
    'name', 'shortName', 'logoUrl', 'faviconUrl', 'slogan',
    'address', 'city', 'postalCode', 'country', 'phone', 'email', 'website',
    'kvk', 'btw', 'iban', 'invoiceFooter', 'certificateFooter',
    'licenseAuthority', 'primaryVehicle', 'transmissionType', 'schoolStamp', 'instructorSignature', 'instructorName',
    'facebookUrl', 'instagramUrl', 'tiktokUrl', 'whatsappNumber', 'googleBusinessUrl', 'youtubeUrl',
    'primaryColor', 'secondaryColor', 'accentColor', 'dashboardTheme', 'loginBackgroundUrl', 'defaultPackageTheme',
    'aiAssistantName', 'aiCoachEnabled', 'aiSystemInstructions', 'aiApprovedSources', 'notificationsEnabled', 'lessonPricePerHour', 'flexiblePackageDescription',
    'privacyPolicyUrl', 'termsConditionsUrl'
  ];

  const auditLogsHeaders = [
    'Audit ID', 'User ID', 'User Name', 'Role', 'Action', 'Date', 'Time'
  ];

  // Map sheetIds for navigation hyperlinks
  const sheetIdMap: Record<string, number> = {};
  for (const s of existingSheetsBefore) {
    if (s.properties?.title) {
      sheetIdMap[s.properties.title] = s.properties.sheetId ?? 0;
    }
  }

  // 4. Batch populate headers & ONLY the 3 official Packages data + Native Dashboard
  const officialPackagesRows = [
    packagesHeaders,
    ['PKG-000001', 'Starter Core Pack', '10 hours comprehensive driving foundation with CBR exam orientation', '10', '650', '', 'Starter', 'FALSE', 'FALSE', 'emerald', '1', 'TRUE', '10 Practical Driving Lessons | Vehicle Controls Mastery | Basic Maneuvers | CBR Exam Orientation'],
    ['PKG-000002', 'Optimal Progress Pack', '20 hours intermediate traffic routines and parking mastery', '20', '1250', '', 'Most Popular', 'TRUE', 'TRUE', 'blue', '2', 'TRUE', '20 Practical Driving Lessons | Complex Intersections | Highway & Night Driving | Mock CBR Practical Exam'],
    ['PKG-000003', 'Complete Guarantee Pack', '40 hours comprehensive exam preparation with guaranteed guidance', '40', '2400', '', 'Best Value', 'FALSE', 'FALSE', 'amber', '3', 'TRUE', '40 Practical Driving Lessons | Unlimited Mock Practical Exams | CBR Practical Exam Guarantee | Intensive Traffic Routines']
  ];

  const dashboardRows = generateDashboardRows('en', sheetIdMap);

  const batchData = [
    { range: 'Dashboard!A1:H29', values: dashboardRows },
    { range: 'Students!A1:L1', values: [studentsHeaders] },
    { range: 'Lessons!A1:M1', values: [lessonsHeaders] },
    { range: 'Wallet!A1:I1', values: [walletHeaders] },
    { range: 'Invoices!A1:J1', values: [invoicesHeaders] },
    { range: 'Notifications!A1:I1', values: [notificationsHeaders] },
    { range: 'Packages!A1:M4', values: officialPackagesRows },
    { range: 'Help & Support!A1:J1', values: [helpHeaders] },
    { range: 'SchoolSettings!A1:AR1', values: [schoolSettingsHeaders] },
    { range: 'AuditLogs!A1:G1', values: [auditLogsHeaders] }
  ];

  await callSheetsApi(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    'POST',
    {
      valueInputOption: 'USER_ENTERED',
      data: batchData
    },
    token
  );

  // 5. REAL Read-Back Verification from Google Sheets API
  const metaAfter = await callSheetsApi(metaUrl, 'GET', undefined, token);
  const existingSheetsAfter: any[] = metaAfter.sheets || [];
  const allTabsAfter: string[] = existingSheetsAfter.map((s: any) => s.properties?.title || '');

  const rangesToVerify = [
    'Students!A1:L1',
    'Lessons!A1:M1',
    'Wallet!A1:I1',
    'Invoices!A1:J1',
    'Notifications!A1:I1',
    'Packages!A1:M4',
    'Help & Support!A1:J1',
    'SchoolSettings!A1:AR1'
  ];
  const queryRanges = rangesToVerify.map(r => `ranges=${encodeURIComponent(r)}`).join('&');
  const readBackRes = await callSheetsApi(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${queryRanges}`,
    'GET',
    undefined,
    token
  );

  const realHeadersVerified: Record<string, string[]> = {};
  let packagesVerifiedCount = 0;
  const packagesRowsVerified: Array<{ id: string; name: string; hours: string; price: string }> = [];

  const valueRanges = readBackRes.valueRanges || [];
  for (const vr of valueRanges) {
    const rangeName = vr.range || '';
    const sheetName = rangeName.split('!')[0].replace(/'/g, '');
    const rows = vr.values || [];
    if (rows.length > 0) {
      realHeadersVerified[sheetName] = rows[0];
    }
    if (sheetName === 'Packages' && rows.length > 1) {
      // row 0 is headers, rows 1..3 are packages
      packagesVerifiedCount = rows.length - 1;
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        packagesRowsVerified.push({
          id: String(row[0] || ''),
          name: String(row[1] || ''),
          hours: String(row[3] || ''),
          price: String(row[4] || '')
        });
      }
    }
  }

  return {
    spreadsheetId,
    spreadsheetTitle,
    tabsBefore: tabNamesBefore,
    tabsCreated: tabsToCreate.map(t => t.title),
    tabsAlreadyExisting,
    allTabsAfter,
    headersVerified: realHeadersVerified,
    packagesWritten: 3,
    packagesVerifiedCount,
    packagesRowsVerified,
    studentDataWritten: false,
    lessonDataWritten: false,
    paymentDataWritten: false,
    invoiceDataWritten: false,
    notificationDataWritten: false,
    googleCalendarDisabled: true,
    success: true
  };
}

/**
 * ----------------------------------------------------
 * 12. STRICT GOOGLE SHEETS CONNECTION DIAGNOSTIC TEST
 * Proves real READ -> WRITE -> READ-BACK -> CLEANUP on the target spreadsheet
 * ----------------------------------------------------
 */
export interface StrictDiagnosticReport {
  success?: boolean;
  spreadsheetId: string;
  spreadsheetTitle: string;
  tabsReturned: Array<{ title: string; sheetId: number }>;
  packagesTabExists: boolean;
  writeTest: 'PASS' | 'FAIL';
  readBackTest: 'PASS' | 'FAIL';
  testRowRemoved: boolean;
  isEmpty: boolean;
  details?: string;
  error?: string;
}

export async function runStrictDiagnosticConnectionTest(
  spreadsheetId: string,
  accessToken?: string
): Promise<StrictDiagnosticReport> {
  const token = accessToken || getSheetsConfig().accessToken;
  if (!token) {
    throw new Error('Google OAuth Access Token is required to run the diagnostic connection test.');
  }

  // 1. Read real spreadsheet metadata
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?includeGridData=false`;
  const meta = await callSheetsApi(metaUrl, 'GET', undefined, token);

  const spreadsheetTitle = meta.properties?.title || 'Untitled Spreadsheet';
  const sheets: any[] = meta.sheets || [];
  const tabsReturned = sheets.map(s => ({
    title: s.properties?.title || '',
    sheetId: s.properties?.sheetId ?? 0
  }));

  const packagesTabExists = tabsReturned.some(t => t.title.toLowerCase() === 'packages');

  // Check if spreadsheet is currently empty (e.g., only 1 default sheet with no data)
  let isEmpty = true;
  if (tabsReturned.length > 0) {
    try {
      const firstTabName = encodeURIComponent(tabsReturned[0].title + '!A1:Z50');
      const sample = await callSheetsApi(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${firstTabName}`,
        'GET',
        undefined,
        token
      );
      if (sample.values && sample.values.length > 0) {
        isEmpty = false;
      }
    } catch {
      isEmpty = true;
    }
  }

  // Ensure Packages tab exists for test
  if (!packagesTabExists) {
    await callSheetsApi(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      'POST',
      {
        requests: [
          {
            addSheet: {
              properties: {
                title: 'Packages',
                tabColor: { red: 0.08, green: 0.72, blue: 0.65 }
              }
            }
          }
        ]
      },
      token
    );
  }

  // Controlled Write Test: Write test row to row 99 so it never interferes with any data
  const testRange = 'Packages!A99:D99';
  const testValues = [['TEST-CONNECTION', 'TEST', '0', '0']];

  let writeTest: 'PASS' | 'FAIL' = 'FAIL';
  let readBackTest: 'PASS' | 'FAIL' = 'FAIL';
  let testRowRemoved = false;

  try {
    await callSheetsApi(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(testRange)}?valueInputOption=USER_ENTERED`,
      'PUT',
      {
        range: testRange,
        majorDimension: 'ROWS',
        values: testValues
      },
      token
    );
    writeTest = 'PASS';
  } catch (err: any) {
    console.error('Diagnostic Write Failed:', err);
    return {
      spreadsheetId,
      spreadsheetTitle,
      tabsReturned,
      packagesTabExists,
      writeTest: 'FAIL',
      readBackTest: 'FAIL',
      testRowRemoved: false,
      isEmpty,
      error: `Write failed: ${err.message}`
    };
  }

  // Read-Back Test
  try {
    const readRes = await callSheetsApi(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(testRange)}`,
      'GET',
      undefined,
      token
    );

    if (
      readRes.values &&
      readRes.values.length > 0 &&
      readRes.values[0][0] === 'TEST-CONNECTION'
    ) {
      readBackTest = 'PASS';
    } else {
      readBackTest = 'FAIL';
    }
  } catch (err: any) {
    console.error('Diagnostic Read-Back Failed:', err);
    readBackTest = 'FAIL';
  }

  // Remove test row (cleanup)
  try {
    await callSheetsApi(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(testRange)}:clear`,
      'POST',
      {},
      token
    );
    testRowRemoved = true;
  } catch (err: any) {
    console.error('Diagnostic Cleanup Failed:', err);
    testRowRemoved = false;
  }

  return {
    spreadsheetId,
    spreadsheetTitle,
    tabsReturned,
    packagesTabExists,
    writeTest,
    readBackTest,
    testRowRemoved,
    isEmpty,
    details: 'Real round-trip proof verified directly against Google Sheets API.',
    success: writeTest === 'PASS' && readBackTest === 'PASS'
  };
}

export const testGoogleSheetsWriteRead = runStrictDiagnosticConnectionTest;
export const initializeGoogleSheetsStructure = initializeSpreadsheetTabsAndHeaders;


/**
 * ----------------------------------------------------
 * 13. SCHOOL SETTINGS INTEGRATION (ADMIN CONTROL CENTER)
 * ----------------------------------------------------
 */
export async function syncSchoolSettingsFromSheet(
  spreadsheetId: string,
  accessToken?: string
): Promise<SheetSyncResult<Partial<SchoolSettings>>> {
  try {
    if (!spreadsheetId) throw new Error('Spreadsheet ID is required.');
    const token = accessToken || getSheetsConfig().accessToken;
    const res = await loadSchoolSettingsFromGoogleSheet({
      ...getSheetsConfig(),
      spreadsheetId,
      accessToken: token,
      sheetName: 'SchoolSettings',
      autoSync: false
    });
    return { success: true, data: res, timestamp: new Date().toISOString() };
  } catch (err: any) {
    console.error('Error in syncSchoolSettingsFromSheet:', err);
    return { success: false, error: err.message, timestamp: new Date().toISOString() };
  }
}

export async function writeSchoolSettingsToSheet(
  spreadsheetId: string,
  settings: SchoolSettings,
  accessToken?: string
): Promise<SheetSyncResult<void>> {
  try {
    if (!spreadsheetId) throw new Error('Spreadsheet ID is required.');
    const token = accessToken || getSheetsConfig().accessToken;
    await writeSchoolSettingsToGoogleSheet({
      ...getSheetsConfig(),
      spreadsheetId,
      accessToken: token,
      sheetName: 'SchoolSettings',
      autoSync: false
    }, settings);
    return { success: true, timestamp: new Date().toISOString() };
  } catch (err: any) {
    console.error('Error in writeSchoolSettingsToSheet:', err);
    return { success: false, error: err.message, timestamp: new Date().toISOString() };
  }
}

/**
 * ----------------------------------------------------
 * 14. SPREADSHEET METADATA FETCHER (SYSTEM STATUS)
 * ----------------------------------------------------
 */
export async function fetchSpreadsheetMetadata(
  spreadsheetId: string,
  accessToken?: string
): Promise<SheetSyncResult<any>> {
  try {
    if (!spreadsheetId) throw new Error('Spreadsheet ID is required.');
    const token = accessToken || getSheetsConfig().accessToken;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
    const data = await callSheetsApi(url, 'GET', undefined, token);
    return { success: true, data, timestamp: new Date().toISOString() };
  } catch (err: any) {
    console.error('Error fetching spreadsheet metadata:', err);
    return { success: false, error: err.message, timestamp: new Date().toISOString() };
  }
}

/**
 * ----------------------------------------------------
 * 15. NATIVE GOOGLE SHEETS DASHBOARD WORKSHEET GENERATOR
 * Generates the central administrative Dashboard tab directly inside Google Sheets
 * ----------------------------------------------------
 */
export function generateDashboardRows(
  lang: 'en' | 'nl' | 'ar' = 'en',
  sheetIdMap: Record<string, number> = {}
): string[][] {
  const isAr = lang === 'ar';
  const isNl = lang === 'nl';

  const titleText = isAr
    ? "  🚗 مدرسة الأندلس لتعليم القيادة — لوحة التحكم الإدارية المركزية (مباشر)"
    : isNl
    ? "  🚗 AL-ANDALOS RIJSCHOOL — ADMINISTRATIEF CONTROLECENTRUM (LIVE)"
    : "  🚗 AL-ANDALOS RIJSCHOOL — ADMINISTRATIVE CONTROL CENTER (LIVE)";

  const getLink = (name: string, label: string) => {
    const gid = sheetIdMap[name] !== undefined ? sheetIdMap[name] : 0;
    return `=HYPERLINK("#gid=${gid}", "${label}")`;
  };

  return [
    ['', '', '', '', '', '', '', ''],
    ['', titleText, '', '', '', '', 'STATUS: 🟢 OPERATIONAL (ZERO DEMO DATA)', ''],
    ['', isAr ? 'نظام المزامنة الحية | بيانات تشغيلية حقيقية 100%' : isNl ? 'Live Synchronisatie met Webapplicatie | 100% Echte Data' : 'Live Synchronization with Web App | 100% Real Operational Data', '', '', '', '', '="Last Sync: " & TEXT(NOW(), "yyyy-mm-dd hh:mm:ss")', ''],
    [
      '',
      isAr ? '🌐 لغة لوحة التحكم:' : isNl ? '🌐 Taal Dashboard:' : '🌐 Dashboard Language:',
      lang === 'en' ? '🇺🇸 English [Active]' : '🇺🇸 English',
      lang === 'nl' ? '🇳🇱 Nederlands [Actief]' : '🇳🇱 Nederlands',
      lang === 'ar' ? '🇸🇦 العربية [نشط]' : '🇸🇦 العربية (RTL)',
      '',
      'Google Calendar: 🚫 DISABLED (Local RFC 5545 Export Only)',
      ''
    ],
    ['', isAr ? '🔗 روابط التنقل السريع بين التبويبات التشغيلية:' : isNl ? '🔗 Snelle Navigatie naar Operationele Tabbladen:' : '🔗 Quick Navigation to Operational Sheets:', '', '', '', '', '', ''],
    [
      '',
      getLink('Students', isAr ? '👨‍🎓 المتدربون' : isNl ? '👨‍🎓 Leerlingen' : '👨‍🎓 Students'),
      getLink('Lessons', isAr ? '📅 الدروس' : isNl ? '📅 Lessen' : '📅 Lessons'),
      getLink('Wallet', isAr ? '💳 المحفظة' : isNl ? '💳 Portemonnee' : '💳 Wallet'),
      getLink('Invoices', isAr ? '🧾 الفواتير' : isNl ? '🧾 Facturen' : '🧾 Invoices'),
      '',
      getLink('Packages', isAr ? '📦 الباقات' : isNl ? '📦 Pakketten' : '📦 Packages'),
      getLink('Notifications', isAr ? '🔔 الإشعارات' : isNl ? '🔔 Mededelingen' : '🔔 Notifications')
    ],
    [
      '',
      getLink('Help & Support', isAr ? '❓ الدعم والأسئلة' : '❓ Help & Support'),
      getLink('SchoolSettings', isAr ? '⚙️ إعدادات المدرسة' : isNl ? '⚙️ Instellingen' : '⚙️ SchoolSettings'),
      getLink('AuditLogs', isAr ? '📋 سجل التدقيق' : '📋 AuditLogs'),
      '',
      '',
      isAr ? '⚡ إجراءات الإدارة المنظمة' : isNl ? '⚡ GESTRUCTUREERDE ACTIES' : '⚡ STRUCTURED ADMIN CONTROLS',
      ''
    ],
    ['', '', '', '', '', '', '', ''],
    [
      '',
      isAr ? '📊 1. المتدربون والباقات (معادلات حية)' : isNl ? '📊 1. LEERLINGEN & PAKKETTEN (LIVE FORMULES)' : '📊 1. STUDENTS & PACKAGES (LIVE FORMULAS)',
      '',
      '',
      '',
      '',
      isAr ? '👨‍🎓 المتدربون: تسجيل / تعديل' : '👨‍🎓 Students: New / Edit',
      isAr ? 'استخدم تطبيق الويب أو قائمة التحكم' : 'Use Web App or Menu'
    ],
    [
      '',
      isAr ? 'إجمالي المتدربين' : isNl ? 'Totaal Leerlingen' : 'Total Students',
      isAr ? 'المتدربون النشطون' : isNl ? 'Actieve Leerlingen' : 'Active Students',
      isAr ? 'غير نشط / معلق' : isNl ? 'Inactief / Geschorst' : 'Inactive / Suspended',
      isAr ? 'الباقات النشطة' : isNl ? 'Actieve Pakketten' : 'Active Packages',
      '',
      '',
      ''
    ],
    [
      '',
      '=IFERROR(COUNTA(Students!A2:A), 0)',
      '=IFERROR(COUNTIF(Students!J2:J, "active"), 0)',
      '=IFERROR(COUNTIF(Students!J2:J, "inactive") + COUNTIF(Students!J2:J, "suspended"), 0)',
      '=IFERROR(COUNTIF(Packages!L2:L, "TRUE") + COUNTIF(Packages!L2:L, TRUE), 0)',
      '',
      isAr ? '📅 الدروس: حجز / جدولة / إكمال' : '📅 Lessons: Schedule / Complete',
      isAr ? 'استخدم تطبيق الويب أو قائمة التحكم' : 'Use Web App or Menu'
    ],
    ['', '', '', '', '', '', '', ''],
    [
      '',
      isAr ? '📅 2. نشاط وجدول الدروس' : isNl ? '📅 2. LESROOSTER & ACTIVITEIT' : '📅 2. LESSON SCHEDULE & ACTIVITY',
      '',
      '',
      '',
      '',
      isAr ? '💳 المدفوعات: رصيد / إيداع' : '💳 Payments: Deposit / Wallet',
      isAr ? 'استخدم تطبيق الويب أو قائمة التحكم' : 'Use Web App or Menu'
    ],
    [
      '',
      isAr ? 'دروس اليوم' : isNl ? 'Lessen Vandaag' : "Today's Lessons",
      isAr ? 'الدروس القادمة' : isNl ? 'Aankomende Lessen' : 'Upcoming Lessons',
      isAr ? 'الدروس المكتملة' : isNl ? 'Voltooide Lessen' : 'Completed Lessons',
      isAr ? 'الدروس الملغاة' : isNl ? 'Geannuleerde Lessen' : 'Cancelled Lessons',
      '',
      '',
      ''
    ],
    [
      '',
      '=IFERROR(COUNTIFS(Lessons!E2:E, TODAY()), 0)',
      '=IFERROR(COUNTIF(Lessons!J2:J, "scheduled") + COUNTIF(Lessons!J2:J, "upcoming"), 0)',
      '=IFERROR(COUNTIF(Lessons!J2:J, "completed"), 0)',
      '=IFERROR(COUNTIF(Lessons!J2:J, "cancelled"), 0)',
      '',
      isAr ? '🧾 الفواتير: إصدار PDF في Drive' : '🧾 Invoices: Generate Drive PDF',
      isAr ? 'استخدم تطبيق الويب أو قائمة التحكم' : 'Use Web App or Menu'
    ],
    ['', '', '', '', '', '', '', ''],
    [
      '',
      isAr ? '💶 3. الوضع المالي والفواتير' : isNl ? '💶 3. FINANCIEEL OVERZICHT & FACTUREN' : '💶 3. FINANCIAL OVERVIEW & INVOICES',
      '',
      '',
      '',
      '',
      isAr ? '📢 الإشعارات: إرسال / بث' : '📢 Notifications: Send Alert',
      isAr ? 'استخدم تطبيق الويب أو قائمة التحكم' : 'Use Web App or Menu'
    ],
    [
      '',
      isAr ? 'إجمالي المحفظة (€)' : isNl ? 'Totaal Portemonnee (€)' : 'Total Wallet (€)',
      isAr ? 'الفواتير المدفوعة (€)' : isNl ? 'Betaalde Facturen (€)' : 'Paid Invoices (€)',
      isAr ? 'الرصيد المستحق (€)' : isNl ? 'Openstaand Saldo (€)' : 'Outstanding Balance (€)',
      isAr ? 'فواتير غير مدفوعة' : isNl ? 'Onbetaalde Facturen' : 'Unpaid Invoices',
      '',
      '',
      ''
    ],
    [
      '',
      '=IFERROR(SUM(Wallet!F2:F), 0)',
      '=IFERROR(SUMIFS(Invoices!E2:E, Invoices!H2:H, "paid"), 0)',
      '=IFERROR(SUM(Students!H2:H), 0)',
      '=IFERROR(COUNTIF(Invoices!H2:H, "unpaid") + COUNTIF(Invoices!H2:H, "pending"), 0)',
      '',
      isAr ? '⚙️ الإعدادات: هوية المدرسة وKVK' : '⚙️ Settings: School Profile & KVK',
      isAr ? 'استخدم تطبيق الويب أو قائمة التحكم' : 'Use Web App or Menu'
    ],
    ['', '', '', '', '', '', '', ''],
    [
      '',
      isAr ? '🚦 4. اختبارات CBR النظرية والجاهزية' : isNl ? '🚦 4. CBR THEORIE & EXAMENGEREEDHEID' : '🚦 4. CBR THEORY & EXAM READINESS',
      '',
      '',
      '',
      '',
      '',
      ''
    ],
    [
      '',
      isAr ? 'اجتاز النظري CBR' : isNl ? 'Theorie Geslaagd' : 'Theory Passed',
      isAr ? 'في انتظار النظري' : isNl ? 'Theorie In Afwachting' : 'Theory Pending',
      isAr ? 'متوسط الجاهزية (%)' : isNl ? 'Gem. Gereedheid (%)' : 'Avg Readiness (%)',
      isAr ? 'رصيد منخفض (< €100)' : isNl ? 'Laag Saldo (< €100)' : 'Low Balance (< €100)',
      '',
      '',
      ''
    ],
    [
      '',
      '=IFERROR(COUNTIF(Students!K2:K, "Passed") + COUNTIF(Students!K2:K, "passed"), 0)',
      '=IFERROR(COUNTIF(Students!K2:K, "Pending") + COUNTIF(Students!K2:K, "pending"), 0)',
      '=IFERROR(AVERAGE(Students!I2:I), 0)',
      '=IFERROR(COUNTIF(Students!H2:H, "<100"), 0)',
      '',
      '',
      ''
    ],
    ['', '', '', '', '', '', '', ''],
    [
      '',
      isAr ? '📋 سجل التدقيق الأمني الأخير (آخر 5 أحداث)' : isNl ? '📋 RECENTE BEVEILIGINGSAUDIT (LAATSTE 5 ACTIES)' : '📋 RECENT ADMINISTRATIVE AUDIT FEED (LAST 5 EVENTS)',
      '',
      '',
      '',
      '',
      '',
      ''
    ],
    [
      '',
      'Audit ID',
      'User ID',
      'User Name',
      'Role',
      'Action / Description',
      'Date',
      'Time'
    ],
    [
      '',
      '=IFERROR(INDEX(AuditLogs!A2:A, 1), "-")',
      '=IFERROR(INDEX(AuditLogs!B2:B, 1), "-")',
      '=IFERROR(INDEX(AuditLogs!C2:C, 1), "-")',
      '=IFERROR(INDEX(AuditLogs!D2:D, 1), "-")',
      '=IFERROR(INDEX(AuditLogs!E2:E, 1), "No recent audit events recorded")',
      '=IFERROR(INDEX(AuditLogs!F2:F, 1), "-")',
      '=IFERROR(INDEX(AuditLogs!G2:G, 1), "-")'
    ],
    [
      '',
      '=IFERROR(INDEX(AuditLogs!A2:A, 2), "-")',
      '=IFERROR(INDEX(AuditLogs!B2:B, 2), "-")',
      '=IFERROR(INDEX(AuditLogs!C2:C, 2), "-")',
      '=IFERROR(INDEX(AuditLogs!D2:D, 2), "-")',
      '=IFERROR(INDEX(AuditLogs!E2:E, 2), "")',
      '=IFERROR(INDEX(AuditLogs!F2:F, 2), "-")',
      '=IFERROR(INDEX(AuditLogs!G2:G, 2), "-")'
    ],
    [
      '',
      '=IFERROR(INDEX(AuditLogs!A2:A, 3), "-")',
      '=IFERROR(INDEX(AuditLogs!B2:B, 3), "-")',
      '=IFERROR(INDEX(AuditLogs!C2:C, 3), "-")',
      '=IFERROR(INDEX(AuditLogs!D2:D, 3), "-")',
      '=IFERROR(INDEX(AuditLogs!E2:E, 3), "")',
      '=IFERROR(INDEX(AuditLogs!F2:F, 3), "-")',
      '=IFERROR(INDEX(AuditLogs!G2:G, 3), "-")'
    ]
  ];
}

export async function buildNativeGoogleSheetsDashboard(
  spreadsheetId: string,
  accessToken?: string,
  lang: 'en' | 'nl' | 'ar' = 'en'
): Promise<SheetSyncResult<any>> {
  try {
    if (!spreadsheetId) throw new Error('Spreadsheet ID is required.');
    const token = accessToken || getSheetsConfig().accessToken;
    if (!token) throw new Error('Google OAuth Access Token is required.');

    // 1. Fetch current sheets metadata
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
    const meta = await callSheetsApi(metaUrl, 'GET', undefined, token);
    const existingSheets: any[] = meta.sheets || [];
    const sheetIdMap: Record<string, number> = {};
    let dashboardSheetId: number | null = null;

    for (const s of existingSheets) {
      const title = s.properties?.title || '';
      const id = s.properties?.sheetId ?? 0;
      sheetIdMap[title] = id;
      if (title.toLowerCase() === 'dashboard') {
        dashboardSheetId = id;
      }
    }

    const batchRequests: any[] = [];

    // 2. Create Dashboard worksheet if it does not exist
    if (dashboardSheetId === null) {
      batchRequests.push({
        addSheet: {
          properties: {
            title: 'Dashboard',
            index: 0,
            tabColor: { red: 0.15, green: 0.39, blue: 0.92 }
          }
        }
      });
    }

    // Also ensure AuditLogs exists for feed formulas
    if (sheetIdMap['AuditLogs'] === undefined) {
      batchRequests.push({
        addSheet: {
          properties: {
            title: 'AuditLogs',
            tabColor: { red: 0.85, green: 0.25, blue: 0.25 }
          }
        }
      });
    }

    if (batchRequests.length > 0) {
      const addRes = await callSheetsApi(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        'POST',
        { requests: batchRequests },
        token
      );
      // Update sheetIdMap with newly created sheets
      if (addRes.replies) {
        for (const reply of addRes.replies) {
          if (reply.addSheet?.properties) {
            const prop = reply.addSheet.properties;
            sheetIdMap[prop.title] = prop.sheetId;
            if (prop.title === 'Dashboard') {
              dashboardSheetId = prop.sheetId;
            }
          }
        }
      }
    }

    // 3. Set Right-to-Left formatting if Arabic
    if (dashboardSheetId !== null) {
      await callSheetsApi(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        'POST',
        {
          requests: [
            {
              updateSheetProperties: {
                properties: {
                  sheetId: dashboardSheetId,
                  rightToLeft: lang === 'ar'
                },
                fields: 'rightToLeft'
              }
            }
          ]
        },
        token
      );
    }

    // 4. Populate the complete Dashboard grid
    const dashboardRows = generateDashboardRows(lang, sheetIdMap);
    await callSheetsApi(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Dashboard!A1:H29?valueInputOption=USER_ENTERED`,
      'PUT',
      {
        range: 'Dashboard!A1:H29',
        majorDimension: 'ROWS',
        values: dashboardRows
      },
      token
    );

    // Also populate AuditLogs header if needed
    if (sheetIdMap['AuditLogs'] !== undefined) {
      await callSheetsApi(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/AuditLogs!A1:G1?valueInputOption=USER_ENTERED`,
        'PUT',
        {
          range: 'AuditLogs!A1:G1',
          majorDimension: 'ROWS',
          values: [['Audit ID', 'User ID', 'User Name', 'Role', 'Action', 'Date', 'Time']]
        },
        token
      );
    }

    return {
      success: true,
      data: {
        spreadsheetId,
        dashboardCreated: dashboardSheetId !== null,
        language: lang,
        rightToLeft: lang === 'ar',
        rowsPopulated: dashboardRows.length
      },
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    console.error('Error building native Google Sheets Dashboard:', err);
    return { success: false, error: err.message, timestamp: new Date().toISOString() };
  }
}



