import { DrivePackage, StudentRecord, AuditLogEntry, Lesson, HelpFaqItem } from '../types';
import { getStudentId } from './studentPhoto';
import bcrypt from 'bcryptjs';
import { safeSetItem } from './safeStorage';

/**
 * Utility functions for syncing package data directly with Google Sheets.
 * This satisfies the requirement to prepare the Package Management system
 * to use Google Sheets as the single source of truth.
 */

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  sheetName: string;
  accessToken?: string;
  apiKey?: string;
  autoSync: boolean;
}

// Default config stored in localStorage (Sensitive tokens kept strictly in memory)
const CONFIG_KEY = 'drivingschool_sheets_config';
const LEGACY_CONFIG_KEY = 'al_andalos_sheets_config';

let memoryAccessToken = '';

export function setCachedOAuthToken(token: string) {
  memoryAccessToken = token;
}

export function getCachedOAuthToken(): string {
  return memoryAccessToken;
}

/**
 * Sanitizes a cell value to prevent formula injection in Google Sheets.
 * Prepends single quote if string begins with =, +, -, @ (unless allowed formula).
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





















export function getSheetsConfig(): GoogleSheetsConfig {
  const env = (import.meta as any).env || {};
  let spreadsheetId = env.VITE_GOOGLE_SPREADSHEET_ID || '1nKF40i125QY7MQMghOoOnyqjpHLFWKM12ZYIIGxW9Ck';
  let sheetName = env.VITE_GOOGLE_SHEETS_TAB_NAME || 'Packages';
  const accessToken = memoryAccessToken || '';
  let apiKey = env.VITE_GOOGLE_API_KEY || '';
  try {
    const saved = localStorage.getItem(CONFIG_KEY) || localStorage.getItem(LEGACY_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.spreadsheetId) spreadsheetId = parsed.spreadsheetId;
      if (parsed.sheetName) sheetName = parsed.sheetName;
      if (!apiKey) apiKey = parsed.apiKey || '';
    }
  } catch (e) { console.error('Error reading sheets config', e); }
  return { spreadsheetId, sheetName, accessToken, apiKey, autoSync: true };
}

export function saveSheetsConfig(config: GoogleSheetsConfig): void {
  if (config.accessToken) {
    memoryAccessToken = config.accessToken;
  }
  // Strip sensitive OAuth access token from persistent localStorage for security
  const { accessToken, ...safeConfig } = config;
  safeSetItem(CONFIG_KEY, JSON.stringify(safeConfig));
}

/**
 * Parse Google Sheets row data into DrivePackage structures.
 * Expected headers row format:
 * id | name | description | hours | price | discountPrice | badge | popular | recommended | colorTheme | displayOrder | isActive | features
 */
export function parseSheetRowsToPackages(rows: any[][]): DrivePackage[] {
  if (!rows || rows.length <= 1) return [];
  
  // Detect header index positions to be highly robust and flexible to column order
  const headers = rows[0].map(h => String(h).trim().toLowerCase());
  
  const idIdx = headers.indexOf('id');
  const nameIdx = headers.indexOf('name');
  const descIdx = headers.indexOf('description');
  const hoursIdx = headers.indexOf('hours');
  const priceIdx = headers.indexOf('price');
  const discountPriceIdx = headers.indexOf('discountprice');
  const badgeIdx = headers.indexOf('badge');
  const popularIdx = headers.indexOf('popular');
  const recommendedIdx = headers.indexOf('recommended');
  const themeIdx = headers.indexOf('colortheme');
  const orderIdx = headers.indexOf('displayorder');
  const activeIdx = headers.indexOf('isactive');
  const featuresIdx = headers.indexOf('features');

  const parsedPackages: DrivePackage[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    let id = idIdx !== -1 && row[idIdx] ? String(row[idIdx]) : '';
    if (!id || id === 'pack-1') id = 'PKG-000001';
    else if (id === 'pack-2') id = 'PKG-000002';
    else if (id === 'pack-3') id = 'PKG-000003';
    else if (!id.startsWith('PKG-')) id = `PKG-${String(i).padStart(6, '0')}`;
    const name = nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]) : `Unnamed Package ${i}`;
    const description = descIdx !== -1 && row[descIdx] ? String(row[descIdx]) : '';
    const hours = hoursIdx !== -1 && row[hoursIdx] ? (parseInt(row[hoursIdx], 10) || 10) : 10;
    const price = priceIdx !== -1 && row[priceIdx] ? (parseFloat(row[priceIdx]) || 0) : 0;
    const discountPrice = discountPriceIdx !== -1 && row[discountPriceIdx] && !isNaN(parseFloat(row[discountPriceIdx])) ? parseFloat(row[discountPriceIdx]) : undefined;
    const badge = badgeIdx !== -1 && row[badgeIdx] ? String(row[badgeIdx]) : undefined;
    const popular = popularIdx !== -1 && row[popularIdx] ? String(row[popularIdx]).toLowerCase() === 'true' : false;
    const recommended = recommendedIdx !== -1 && row[recommendedIdx] ? String(row[recommendedIdx]).toLowerCase() === 'true' : false;
    const colorTheme = themeIdx !== -1 && row[themeIdx] ? String(row[themeIdx]) : 'blue';
    const displayOrder = orderIdx !== -1 && row[orderIdx] ? (parseInt(row[orderIdx], 10) || i) : i;
    
    // Check isActive string representations (e.g. "TRUE", "yes", "1", "true")
    let isActive = true;
    if (activeIdx !== -1 && row[activeIdx] !== undefined) {
      const activeStr = String(row[activeIdx]).trim().toLowerCase();
      isActive = activeStr === 'true' || activeStr === 'yes' || activeStr === '1' || activeStr === 'active' || activeStr === 'نعم';
    }

    // Parse features from pipe or newline separator
    let features: string[] | undefined = undefined;
    if (featuresIdx !== -1 && row[featuresIdx]) {
      const featStr = String(row[featuresIdx]).trim();
      if (featStr) {
        features = featStr.includes('|') ? featStr.split('|').map(s => s.trim()).filter(Boolean) : featStr.split('\n').map(s => s.trim()).filter(Boolean);
      }
    }

    parsedPackages.push({
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

  return parsedPackages;
}

/**
 * Converts DrivePackage array into sheets grid format (rows) for writing.
 */
export function convertPackagesToSheetRows(packages: DrivePackage[]): any[][] {
  const headers = ['id', 'name', 'description', 'hours', 'price', 'discountPrice', 'badge', 'popular', 'recommended', 'colorTheme', 'displayOrder', 'isActive', 'features'];
  const rows: any[][] = [headers];

  // Sort by display order
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
      pkg.colorTheme || 'blue',
      pkg.displayOrder,
      pkg.isActive ? 'TRUE' : 'FALSE',
      pkg.features ? pkg.features.join(' | ') : ''
    ]);
  }

  return rows;
}

/**
 * Reads driving package values from specified spreadsheet.
 * Supports standard GAPI or REST fetches.
 */
export async function loadPackagesFromGoogleSheet(config: GoogleSheetsConfig): Promise<DrivePackage[]> {
  const { spreadsheetId, sheetName, accessToken, apiKey } = config;
  
  if (!spreadsheetId) {
    throw new Error("Spreadsheet ID is required to fetch from Google Sheets.");
  }

  const range = `${sheetName || 'Packages'}!A1:M100`;
  let url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  
  const headers: HeadersInit = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  } else if (apiKey) {
    url += `?key=${apiKey}`;
  } else {
    throw new Error("Either Google OAuth Access Token or API Key is required.");
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Google Sheets API Error: ${response.status} ${response.statusText} - ${errorDetails}`);
  }

  const data = await response.json();
  if (!data.values || data.values.length === 0) {
    throw new Error(`No data found in sheet tab "${sheetName}". Please ensure headers are set up.`);
  }

  return parseSheetRowsToPackages(data.values);
}

/**
 * Writes package array to specified Google Sheet.
 * Requires Google OAuth Write Scopes (https://www.googleapis.com/auth/spreadsheets).
 */
export async function writePackagesToGoogleSheet(config: GoogleSheetsConfig, packages: DrivePackage[]): Promise<void> {
  const { spreadsheetId, sheetName, accessToken } = config;

  if (!spreadsheetId) {
    throw new Error("Spreadsheet ID is required to publish to Google Sheets.");
  }
  if (!accessToken) {
    throw new Error("Google OAuth Write Scopes require a valid Google OAuth Access Token (read-only API Key is not enough).");
  }

  const rows = convertPackagesToSheetRows(packages);
  const range = `${sheetName || 'Packages'}!A1:M${rows.length}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: rows
    })
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Google Sheets Write Error: ${response.status} ${response.statusText} - ${errorDetails}`);
  }
}

/**
 * Helper to generate a fully styled sample of Google Sheets packages for the admin to copy.
 */




















export function getSampleSpreadsheetStructure() {
  return [
    { id: 'PKG-000001', name: 'Starter Core Pack', description: 'Basic theory app & standard lessons.', hours: 10, price: 650, discountPrice: '', badge: 'Essential', popular: 'FALSE', recommended: 'FALSE', colorTheme: 'blue', displayOrder: 1, isActive: 'TRUE', features: '' },
    { id: 'PKG-000002', name: 'Optimal Progress Pack', description: 'Structured lessons and practical exam preparation.', hours: 20, price: 1250, discountPrice: '', badge: 'Most Popular', popular: 'TRUE', recommended: 'TRUE', colorTheme: 'indigo', displayOrder: 2, isActive: 'TRUE', features: '' },
    { id: 'PKG-000003', name: 'Complete Guarantee Pack', description: 'Comprehensive driving training and exam preparation.', hours: 40, price: 2400, discountPrice: '', badge: 'Recommended', popular: 'FALSE', recommended: 'TRUE', colorTheme: 'amber', displayOrder: 3, isActive: 'TRUE', features: '' }
  ];
}


export function parseSheetRowsToStudents(rows: any[][]): StudentRecord[] {
  if (!rows || rows.length <= 1) return [];
  const headers = rows[0].map(h => String(h).trim().toLowerCase());
  const requiredHeaders = ['student id', 'name', 'email', 'phone', 'date of birth', 'city', 'current package', 'balance (€)', 'exam readiness (%)', 'status', 'theory exam status', 'drive folder id'];
  const idx = requiredHeaders.map(header => headers.indexOf(header));
  if (idx.some(i => i === -1)) throw new Error('Students sheet schema mismatch. Expected canonical 12-column schema.');
  const parsedStudents: StudentRecord[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const name = String(row[idx[1]] ?? '').trim();
    if (!name) continue;
    const rawId = String(row[idx[0]] ?? '').trim();
    if (!/^ST-\d{6}$/.test(rawId)) throw new Error('Invalid Student ID at Students row ' + (i + 1) + ': ' + (rawId || '(empty)'));
    const readinessRaw = Number(row[idx[8]] ?? 0);
    parsedStudents.push({ id: rawId, studentId: rawId, name, email: String(row[idx[2]] ?? '').trim(), phone: String(row[idx[3]] ?? '').trim(), dob: String(row[idx[4]] ?? '').trim(), city: String(row[idx[5]] ?? '').trim(), currentPackage: String(row[idx[6]] ?? '').trim(), balance: Number(row[idx[7]] ?? 0) || 0, readiness: Number.isFinite(readinessRaw) ? readinessRaw : 0, status: String(row[idx[9]] ?? '').trim(), theoryExamStatus: String(row[idx[10]] ?? '').trim(), driveFolderId: String(row[idx[11]] ?? '').trim() || undefined });
  }
  return parsedStudents;
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

export function isDemoLesson(lesson: Partial<Lesson>): boolean {
  const id = lesson.id || '';
  if (['LES-000001', 'LES-000002', 'LES-000003', 'LES-000004', 'LES-000005'].includes(id)) return true;
  if (lesson.studentName && isDemoStudent({ name: lesson.studentName })) return true;
  return false;
}

/**
 * Converts StudentRecord array into sheet rows format.
 */




















export function convertStudentsToSheetRows(students: StudentRecord[]): any[][] {
  const headers = ['Student ID', 'Name', 'Email', 'Phone', 'Date of Birth', 'City', 'Current Package', 'Balance (€)', 'Exam Readiness (%)', 'Status', 'Theory Exam Status', 'Drive Folder ID'];
  const rows: any[][] = [headers];
  for (const student of students) {
    const studentId = student.studentId || student.id;
    if (!/^ST-\d{6}$/.test(studentId)) throw new Error('Invalid Student ID for Sheets write: ' + (studentId || '(empty)'));
    rows.push([sanitizeSpreadsheetCell(studentId), sanitizeSpreadsheetCell(student.name), sanitizeSpreadsheetCell(student.email), sanitizeSpreadsheetCell(student.phone), sanitizeSpreadsheetCell(student.dob), sanitizeSpreadsheetCell(student.city), sanitizeSpreadsheetCell(student.currentPackage), Number(student.balance ?? 0), Number(student.readiness ?? 0), sanitizeSpreadsheetCell(student.status || ''), sanitizeSpreadsheetCell(student.theoryExamStatus || ''), sanitizeSpreadsheetCell(student.driveFolderId || '')]);
  }
  return rows;
}

export async function loadStudentsFromGoogleSheet(config: GoogleSheetsConfig): Promise<StudentRecord[]> {
  const { spreadsheetId, accessToken, apiKey } = config;
  
  if (!spreadsheetId) {
    throw new Error("Spreadsheet ID is required to fetch from Google Sheets.");
  }

  const range = `Students!A1:N200`;
  let url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  
  const headers: HeadersInit = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  } else if (apiKey) {
    url += `?key=${apiKey}`;
  } else {
    throw new Error("Either Google OAuth Access Token or API Key is required.");
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Google Sheets API Error: ${response.status} ${response.statusText} - ${errorDetails}`);
  }

  const data = await response.json();
  if (!data.values || data.values.length === 0) {
    return [];
  }

  return parseSheetRowsToStudents(data.values);
}

/**
 * Writes the student records array to the 'Students' sheet tab.
 */
export async function writeStudentsToGoogleSheet(config: GoogleSheetsConfig, students: StudentRecord[]): Promise<void> {
  const { spreadsheetId, accessToken } = config;

  if (!spreadsheetId) {
    throw new Error("Spreadsheet ID is required to publish to Google Sheets.");
  }
  if (!accessToken) {
    throw new Error("Google OAuth Write Scopes require a valid Google OAuth Access Token (read-only API Key is not enough).");
  }

  const range = `Students!A1:N200`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  
  const rows = convertStudentsToSheetRows(students);

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values: rows })
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Google Sheets Write Error: ${response.status} ${response.statusText} - ${errorDetails}`);
  }
}

/**
 * Parses Google Sheets Rows from the 'Lessons' sheet tab into Lesson array.
 */
export function parseSheetRowsToLessons(rows: any[][]): Lesson[] {
  if (!rows || rows.length <= 1) return [];

  const headers = rows[0].map(h => String(h).trim().toLowerCase());

  const getIdx = (name: string) => headers.indexOf(name.toLowerCase());

  const idIdx = getIdx('id') !== -1 ? getIdx('id') : getIdx('lesson id');
  const studentIdIdx = getIdx('student id') !== -1 ? getIdx('student id') : getIdx('studentid');
  const trainerIdIdx = getIdx('trainer id') !== -1 ? getIdx('trainer id') : getIdx('trainerid');
  const vehicleIdIdx = getIdx('vehicle id') !== -1 ? getIdx('vehicle id') : getIdx('vehicleid');
  const numIdx = getIdx('lesson number') !== -1 ? getIdx('lesson number') : getIdx('lessonnumber');
  const studentIdx = getIdx('student name') !== -1 ? getIdx('student name') : getIdx('studentname');
  const trainerIdx = getIdx('trainer name') !== -1 ? getIdx('trainer name') : getIdx('trainername');
  const dateIdx = getIdx('date');
  const timeIdx = getIdx('time');
  const durationIdx = getIdx('duration');
  const priceIdx = getIdx('price');
  const locationIdx = getIdx('pickup location') !== -1 ? getIdx('pickup location') : getIdx('pickuplocation');
  const statusIdx = getIdx('status');
  const payStatusIdx = getIdx('payment status') !== -1 ? getIdx('payment status') : getIdx('paystatus');
  const payMethodIdx = getIdx('payment method') !== -1 ? getIdx('payment method') : getIdx('paymethod');
  const ratingIdx = getIdx('performance rating') !== -1 ? getIdx('performance rating') : getIdx('performancerating');
  const evalIdx = getIdx('performance evaluation') !== -1 ? getIdx('performance evaluation') : getIdx('performanceevaluation');
  const topicsIdx = getIdx('topics covered') !== -1 ? getIdx('topics covered') : getIdx('lessonnotes');
  const notesIdx = getIdx('instructor notes') !== -1 ? getIdx('instructor notes') : getIdx('instructornotes');
  const completedAtIdx = getIdx('completion timestamp') !== -1 ? getIdx('completion timestamp') : getIdx('completedat');

  const parsedLessons: Lesson[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const id = idIdx !== -1 && row[idIdx] ? String(row[idIdx]) : `LES-${String(i).padStart(6, '0')}`;
    const studentName = studentIdx !== -1 && row[studentIdx] ? String(row[studentIdx]) : '';
    let studentId = studentIdIdx !== -1 && row[studentIdIdx] ? String(row[studentIdIdx]) : undefined;
    if (!studentId && studentName) {
      studentId = getStudentId(studentName);
    }
    const trainerName = trainerIdx !== -1 && row[trainerIdx] ? String(row[trainerIdx]) : '';
    const trainerId = trainerIdIdx !== -1 && row[trainerIdIdx] ? String(row[trainerIdIdx]) : 'TR-000001';
    const vehicleId = vehicleIdIdx !== -1 && row[vehicleIdIdx] ? String(row[vehicleIdIdx]) : 'VEH-000001';

    const date = dateIdx !== -1 && row[dateIdx] ? String(row[dateIdx]) : '';
    const time = timeIdx !== -1 && row[timeIdx] ? String(row[timeIdx]) : '10:00';
    const duration = durationIdx !== -1 && row[durationIdx] ? (parseInt(row[durationIdx], 10) === 2 ? 2 : 1) : 1;
    const price = priceIdx !== -1 && row[priceIdx] ? parseFloat(row[priceIdx]) || 50 : 50;
    const pickupLocation = locationIdx !== -1 && row[locationIdx] ? String(row[locationIdx]) : 'School HQ';
    const status = statusIdx !== -1 && row[statusIdx] ? (String(row[statusIdx]).toLowerCase() as any) : 'upcoming';
    const payStatus = payStatusIdx !== -1 && row[payStatusIdx] ? (String(row[payStatusIdx]).toLowerCase() as any) : 'unpaid';
    const payMethod = payMethodIdx !== -1 && row[payMethodIdx] ? String(row[payMethodIdx]) : undefined;
    const performanceRating = ratingIdx !== -1 && row[ratingIdx] ? parseInt(row[ratingIdx], 10) : undefined;
    const performanceEvaluation = evalIdx !== -1 && row[evalIdx] ? (String(row[evalIdx]).toLowerCase() as any) : undefined;
    const lessonNotes = topicsIdx !== -1 && row[topicsIdx] ? String(row[topicsIdx]) : undefined;
    const instructorNotes = notesIdx !== -1 && row[notesIdx] ? String(row[notesIdx]) : undefined;
    const lessonNumber = numIdx !== -1 && row[numIdx] ? parseInt(row[numIdx], 10) : undefined;
    const completedAt = completedAtIdx !== -1 && row[completedAtIdx] ? String(row[completedAtIdx]) : undefined;

    parsedLessons.push({
      id,
      studentId,
      studentName,
      trainerId,
      trainerName,
      vehicleId,
      date,
      time,
      duration,
      price,
      pickupLocation,
      status,
      payStatus,
      payMethod,
      performanceRating,
      performanceEvaluation,
      lessonNotes,
      instructorNotes,
      lessonNumber,
      completedAt
    });
  }

  return parsedLessons;
}

/**
 * Converts Lesson array into sheet rows format.
 */
export function convertLessonsToSheetRows(lessons: Lesson[]): any[][] {
  const headers = [
    'Lesson ID', 'Student ID', 'Student Name', 'Trainer ID', 'Trainer Name', 'Vehicle ID',
    'Lesson Number', 'Scheduled Date', 'Scheduled Time', 'Duration (Hrs)', 'Price (€)',
    'Pickup Location', 'Status', 'Payment Status', 'Payment Method', 'Performance Rating',
    'Performance Evaluation', 'Topics Covered', 'Instructor Notes', 'Completion Timestamp'
  ];

  const rows: any[][] = [headers];

  for (const l of lessons) {
    if (isDemoLesson(l)) continue; // STRICT SAFETY: Never upload demo lessons to Google Sheets
    rows.push([
      l.id,
      l.studentId || (l.studentName ? getStudentId(l.studentName) : 'ST-000001'),
      l.studentName || '',
      l.trainerId || 'TR-000001',
      l.trainerName || '',
      l.vehicleId || 'VEH-000001',
      l.lessonNumber || '',
      l.date || '',
      l.time || '',
      l.duration || 1,
      l.price || 50,
      l.pickupLocation || '',
      l.status || 'upcoming',
      l.payStatus || 'unpaid',
      l.payMethod || '',
      l.performanceRating !== undefined ? l.performanceRating : '',
      l.performanceEvaluation || '',
      l.lessonNotes || '',
      l.instructorNotes || l.trainerNotes || '',
      l.completedAt || ''
    ]);
  }

  return rows;
}

/**
 * Loads lesson records from the 'Lessons' sheet tab.
 */
export async function loadLessonsFromGoogleSheet(config: GoogleSheetsConfig): Promise<Lesson[]> {
  const { spreadsheetId, accessToken, apiKey } = config;

  if (!spreadsheetId) {
    throw new Error("Spreadsheet ID is required to fetch from Google Sheets.");
  }

  const range = `Lessons!A1:Q500`;
  let url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const headers: HeadersInit = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  } else if (apiKey) {
    url += `?key=${apiKey}`;
  } else {
    throw new Error("Either Google OAuth Access Token or API Key is required.");
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Google Sheets API Error for Lessons: ${response.status} ${response.statusText} - ${errorDetails}`);
  }

  const data = await response.json();
  if (!data.values || data.values.length === 0) {
    return [];
  }

  return parseSheetRowsToLessons(data.values);
}

/**
 * Writes the lesson records array to the 'Lessons' sheet tab.
 */
export async function writeLessonsToGoogleSheet(config: GoogleSheetsConfig, lessons: Lesson[]): Promise<void> {
  const { spreadsheetId, accessToken } = config;

  if (!spreadsheetId) {
    throw new Error("Spreadsheet ID is required to publish to Google Sheets.");
  }
  if (!accessToken) {
    throw new Error("Google OAuth Write Scopes require a valid Google OAuth Access Token.");
  }

  const range = `Lessons!A1:Q500`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

  const rows = convertLessonsToSheetRows(lessons);

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values: rows })
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Google Sheets Write Error for Lessons: ${response.status} ${response.statusText} - ${errorDetails}`);
  }
}

import { SchoolSettings } from '../types';
export type { SchoolSettings };

export function parseSheetRowsToSchoolSettings(rows: any[][]): Partial<SchoolSettings> {
  if (!rows || rows.length <= 1) return {};
  
  const headers = rows[0].map(h => String(h).trim().toLowerCase());
  const row = rows[1];
  if (!row || row.length === 0) return {};

  const getVal = (prop: string) => {
    const idx = headers.indexOf(prop.toLowerCase());
    return idx !== -1 && row[idx] !== undefined ? String(row[idx]) : '';
  };

  return {
    name: getVal('name'),
    shortName: getVal('shortname') || getVal('short_name') || getVal('short name'),
    logoUrl: getVal('logourl') || getVal('logo_url') || getVal('logo url'),
    faviconUrl: getVal('faviconurl') || getVal('favicon_url') || getVal('favicon url'),
    slogan: getVal('slogan'),
    address: getVal('address'),
    city: getVal('city'),
    postalCode: getVal('postalcode') || getVal('postal_code') || getVal('postal code') || getVal('zip'),
    country: getVal('country'),
    phone: getVal('phone'),
    email: getVal('email'),
    website: getVal('website'),
    kvk: getVal('kvk') || getVal('kvk number') || getVal('kvk_number'),
    btw: getVal('btw') || getVal('btw number') || getVal('btw_number') || getVal('vat'),
    iban: getVal('iban'),
    invoiceFooter: getVal('invoicefooter') || getVal('invoice_footer') || getVal('invoice footer'),
    certificateFooter: getVal('certificatefooter') || getVal('certificate_footer') || getVal('certificate footer'),
    licenseAuthority: getVal('licenseauthority') || getVal('license_authority'),
    primaryVehicle: getVal('primaryvehicle') || getVal('primary_vehicle') || getVal('primary vehicle'),
    transmissionType: getVal('transmissiontype') || getVal('transmission_type') || getVal('transmission type'),
    schoolStamp: getVal('schoolstamp') || getVal('school_stamp') || getVal('school stamp'),
    instructorSignature: getVal('instructorsignature') || getVal('instructor_signature') || getVal('instructor signature'),
    instructorName: getVal('instructorname') || getVal('instructor_name') || getVal('instructor Name'),
    facebookUrl: getVal('facebookurl') || getVal('facebook_url') || getVal('facebook'),
    instagramUrl: getVal('instagramurl') || getVal('instagram_url') || getVal('instagram'),
    tiktokUrl: getVal('tiktokurl') || getVal('tiktok_url') || getVal('tiktok'),
    whatsappNumber: getVal('whatsappnumber') || getVal('whatsapp_number') || getVal('whatsapp'),
    googleBusinessUrl: getVal('googlebusinessurl') || getVal('google_business_url') || getVal('googlebusiness') || getVal('google_business'),
    youtubeUrl: getVal('youtubeurl') || getVal('youtube_url') || getVal('youtube'),
    primaryColor: getVal('primarycolor') || getVal('primary_color') || getVal('primary color'),
    secondaryColor: getVal('secondarycolor') || getVal('secondary_color') || getVal('secondary color'),
    accentColor: getVal('accentcolor') || getVal('accent_color') || getVal('accent color'),
    dashboardTheme: getVal('dashboardtheme') || getVal('dashboard_theme') || getVal('dashboard theme'),
    loginBackgroundUrl: getVal('loginbackgroundurl') || getVal('login_background_url') || getVal('login background'),
    defaultPackageTheme: getVal('defaultpackagetheme') || getVal('default_package_theme') || getVal('package theme'),
    aiAssistantName: getVal('aiassistantname') || getVal('ai_assistant_name') || getVal('assistant name') || getVal('ai_name'),
    aiCoachEnabled: (getVal('aicoachenabled') || getVal('ai_coach_enabled') || getVal('ai coach enabled') || 'TRUE').toUpperCase() !== 'FALSE',
    aiSystemInstructions: getVal('aisysteminstructions') || getVal('ai_system_instructions') || getVal('ai system instructions'),
    aiApprovedSources: getVal('aiapprovedsources') || getVal('ai_approved_sources') || getVal('ai approved sources'),
    aiEnforceStrictBoundary: (getVal('aienforcestrictboundary') || getVal('ai_enforce_strict_boundary') || 'TRUE').toUpperCase() !== 'FALSE',
    notificationsEnabled: (getVal('notificationsenabled') || getVal('notifications_enabled') || getVal('notifications enabled') || getVal('notifications')).toUpperCase() !== 'FALSE',
    lessonPricePerHour: parseFloat(getVal('lessonpriceperhour') || getVal('lesson_price_per_hour') || getVal('lesson price per hour') || getVal('price')) || 65,
    flexiblePackageDescription: getVal('flexiblepackagedescription') || getVal('flexible_package_description') || getVal('flexible package description') || getVal('description'),
    privacyPolicyUrl: getVal('privacypolicyurl') || getVal('privacy_policy_url') || getVal('privacy') || getVal('privacypolicy'),
    termsConditionsUrl: getVal('termsconditionsurl') || getVal('terms_conditions_url') || getVal('terms') || getVal('termsconditions')
  };
}

export function convertSchoolSettingsToSheetRows(settings: SchoolSettings): any[][] {
  const headers = [
    'name', 'shortName', 'logoUrl', 'faviconUrl', 'slogan',
    'address', 'city', 'postalCode', 'country', 'phone', 'email', 'website',
    'kvk', 'btw', 'iban', 'invoiceFooter', 'certificateFooter',
    'licenseAuthority', 'primaryVehicle', 'transmissionType', 'schoolStamp', 'instructorSignature', 'instructorName',
    'facebookUrl', 'instagramUrl', 'tiktokUrl', 'whatsappNumber', 'googleBusinessUrl', 'youtubeUrl',
    'primaryColor', 'secondaryColor', 'accentColor', 'dashboardTheme', 'loginBackgroundUrl', 'defaultPackageTheme',
    'aiAssistantName', 'aiCoachEnabled', 'aiSystemInstructions', 'aiApprovedSources', 'notificationsEnabled', 'lessonPricePerHour', 'flexiblePackageDescription',
    'privacyPolicyUrl', 'termsConditionsUrl'
  ];
  const values = [
    settings.name || '',
    settings.shortName || '',
    settings.logoUrl || '',
    settings.faviconUrl || '',
    settings.slogan || '',
    settings.address || '',
    settings.city || '',
    settings.postalCode || '',
    settings.country || '',
    settings.phone || '',
    settings.email || '',
    settings.website || '',
    settings.kvk || '',
    settings.btw || '',
    settings.iban || '',
    settings.invoiceFooter || '',
    settings.certificateFooter || '',
    settings.licenseAuthority || '',
    settings.primaryVehicle || '',
    settings.transmissionType || '',
    settings.schoolStamp || '',
    settings.instructorSignature || '',
    settings.instructorName || '',
    settings.facebookUrl || '',
    settings.instagramUrl || '',
    settings.tiktokUrl || '',
    settings.whatsappNumber || '',
    settings.googleBusinessUrl || '',
    settings.youtubeUrl || '',
    settings.primaryColor || '',
    settings.secondaryColor || '',
    settings.accentColor || '',
    settings.dashboardTheme || '',
    settings.loginBackgroundUrl || '',
    settings.defaultPackageTheme || '',
    settings.aiAssistantName || '',
    settings.aiCoachEnabled !== false ? 'TRUE' : 'FALSE',
    settings.aiSystemInstructions || '',
    settings.aiApprovedSources || '',
    settings.notificationsEnabled !== false ? 'TRUE' : 'FALSE',
    String(settings.lessonPricePerHour || 65),
    settings.flexiblePackageDescription || '',
    settings.privacyPolicyUrl || '',
    settings.termsConditionsUrl || ''
  ];
  return [headers, values];
}

export async function loadSchoolSettingsFromGoogleSheet(config: GoogleSheetsConfig): Promise<Partial<SchoolSettings>> {
  const { spreadsheetId, accessToken, apiKey } = config;
  
  if (!spreadsheetId) {
    throw new Error("Spreadsheet ID is required to fetch from Google Sheets.");
  }

  const range = `SchoolSettings!A1:AM2`;
  let url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  
  const headers: HeadersInit = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  } else if (apiKey) {
    url += `?key=${apiKey}`;
  } else {
    throw new Error("Either Google OAuth Access Token or API Key is required.");
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Google Sheets API Error for SchoolSettings: ${response.status} ${response.statusText} - ${errorDetails}`);
  }

  const data = await response.json();
  if (!data.values || data.values.length === 0) {
    return {};
  }

  return parseSheetRowsToSchoolSettings(data.values);
}

export async function writeSchoolSettingsToGoogleSheet(config: GoogleSheetsConfig, settings: SchoolSettings): Promise<void> {
  const { spreadsheetId, accessToken } = config;

  if (!spreadsheetId) {
    throw new Error("Spreadsheet ID is required to publish to Google Sheets.");
  }
  if (!accessToken) {
    throw new Error("Google OAuth Write Scopes require a valid Google OAuth Access Token.");
  }

  const range = `SchoolSettings!A1:AM2`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  
  const rows = convertSchoolSettingsToSheetRows(settings);

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values: rows })
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Google Sheets Write Error for SchoolSettings: ${response.status} ${response.statusText} - ${errorDetails}`);
  }
}

export interface MediaVideo {
  id: string;
  titleEn: string;
  titleNl: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionNl?: string;
  descriptionAr?: string;
  category: string;
  isEnabled: boolean;
  url: string;
  thumbnail: string;
  duration: string;
  language?: string;
  driveFileId?: string;
  driveShareUrl?: string;
  isMissingFromDrive?: boolean;
  isDeletedByTrainer?: boolean;
  type?: 'video' | 'image';
}

export function parseSheetRowsToMediaVideos(rows: any[][]): MediaVideo[] {
  if (!rows || rows.length <= 1) return [];
  
  const headers = rows[0].map(h => String(h).trim().toLowerCase());
  const videos: MediaVideo[] = [];

  const idIdx = headers.indexOf('id');
  const titleEnIdx = headers.indexOf('titleen') !== -1 ? headers.indexOf('titleen') : headers.indexOf('title');
  const titleNlIdx = headers.indexOf('titlenl');
  const titleArIdx = headers.indexOf('titlear');
  const descEnIdx = headers.indexOf('descriptionen') !== -1 ? headers.indexOf('descriptionen') : headers.indexOf('description');
  const descNlIdx = headers.indexOf('descriptionnl');
  const descArIdx = headers.indexOf('descriptionar');
  const categoryIdx = headers.indexOf('category');
  const isEnabledIdx = headers.indexOf('isenabled');
  const urlIdx = headers.indexOf('url');
  const thumbnailIdx = headers.indexOf('thumbnail');
  const durationIdx = headers.indexOf('duration');
  const languageIdx = headers.indexOf('language');
  const driveFileIdIdx = headers.indexOf('drivefileid');
  const driveShareUrlIdx = headers.indexOf('driveshareurl');
  const isDeletedByTrainerIdx = headers.indexOf('isdeletedbytrainer');
  const typeIdx = headers.indexOf('type');

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const id = idIdx !== -1 && row[idIdx] ? String(row[idIdx]) : `vid-${Date.now()}-${i}`;
    const titleEn = titleEnIdx !== -1 && row[titleEnIdx] ? String(row[titleEnIdx]) : `Video ${i}`;
    const titleNl = titleNlIdx !== -1 && row[titleNlIdx] ? String(row[titleNlIdx]) : titleEn;
    const titleAr = titleArIdx !== -1 && row[titleArIdx] ? String(row[titleArIdx]) : titleEn;
    const descriptionEn = descEnIdx !== -1 && row[descEnIdx] ? String(row[descEnIdx]) : '';
    const descriptionNl = descNlIdx !== -1 && row[descNlIdx] ? String(row[descNlIdx]) : descriptionEn;
    const descriptionAr = descArIdx !== -1 && row[descArIdx] ? String(row[descArIdx]) : descriptionEn;
    const category = categoryIdx !== -1 && row[categoryIdx] ? String(row[categoryIdx]) : 'General';
    
    let isEnabled = true;
    if (isEnabledIdx !== -1 && row[isEnabledIdx] !== undefined) {
      const val = String(row[isEnabledIdx]).trim().toLowerCase();
      isEnabled = val === 'true' || val === 'yes' || val === '1' || val === 'active';
    }

    const url = urlIdx !== -1 && row[urlIdx] ? String(row[urlIdx]) : '';
    const thumbnail = thumbnailIdx !== -1 && row[thumbnailIdx] ? String(row[thumbnailIdx]) : '';
    const duration = durationIdx !== -1 && row[durationIdx] ? String(row[durationIdx]) : '2:00';
    const language = languageIdx !== -1 && row[languageIdx] ? String(row[languageIdx]) : 'all';
    const driveFileId = driveFileIdIdx !== -1 && row[driveFileIdIdx] ? String(row[driveFileIdIdx]) : '';
    const driveShareUrl = driveShareUrlIdx !== -1 && row[driveShareUrlIdx] ? String(row[driveShareUrlIdx]) : '';

    let isDeletedByTrainer = false;
    if (isDeletedByTrainerIdx !== -1 && row[isDeletedByTrainerIdx] !== undefined) {
      const val = String(row[isDeletedByTrainerIdx]).trim().toLowerCase();
      isDeletedByTrainer = val === 'true' || val === 'yes' || val === '1';
    }

    const rawType = typeIdx !== -1 && row[typeIdx] ? String(row[typeIdx]).trim().toLowerCase() : 'video';
    const type = rawType === 'image' ? 'image' : 'video';

    videos.push({
      id,
      titleEn,
      titleNl,
      titleAr,
      descriptionEn,
      descriptionNl,
      descriptionAr,
      category,
      isEnabled,
      url,
      thumbnail,
      duration,
      language,
      driveFileId,
      driveShareUrl,
      isDeletedByTrainer,
      type
    });
  }

  return videos;
}

export function convertMediaVideosToSheetRows(videos: MediaVideo[]): any[][] {
  const headers = [
    'id', 'titleEn', 'titleNl', 'titleAr', 
    'descriptionEn', 'descriptionNl', 'descriptionAr', 
    'category', 'isEnabled', 'url', 'thumbnail', 'duration',
    'language', 'driveFileId', 'driveShareUrl', 'isDeletedByTrainer', 'type'
  ];
  const rows: any[][] = [headers];

  for (const v of videos) {
    rows.push([
      v.id,
      v.titleEn || '',
      v.titleNl || '',
      v.titleAr || '',
      v.descriptionEn || '',
      v.descriptionNl || '',
      v.descriptionAr || '',
      v.category || 'General',
      v.isEnabled ? 'TRUE' : 'FALSE',
      v.url || '',
      v.thumbnail || '',
      v.duration || '2:00',
      v.language || 'all',
      v.driveFileId || '',
      v.driveShareUrl || '',
      v.isDeletedByTrainer ? 'TRUE' : 'FALSE',
      v.type || 'video'
    ]);
  }

  return rows;
}

export async function loadMediaVideosFromGoogleSheet(config: GoogleSheetsConfig): Promise<MediaVideo[]> {
  const { spreadsheetId, accessToken, apiKey } = config;
  
  if (!spreadsheetId) {
    throw new Error("Spreadsheet ID is required to fetch from Google Sheets.");
  }

  const range = `MediaLibrary!A1:Q100`;
  let url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  
  const headers: HeadersInit = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  } else if (apiKey) {
    url += `?key=${apiKey}`;
  } else {
    throw new Error("Either Google OAuth Access Token or API Key is required.");
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Google Sheets API Error for MediaLibrary: ${response.status} ${response.statusText} - ${errorDetails}`);
  }

  const data = await response.json();
  if (!data.values || data.values.length === 0) {
    return [];
  }

  return parseSheetRowsToMediaVideos(data.values);
}

export async function writeMediaVideosToGoogleSheet(config: GoogleSheetsConfig, videos: MediaVideo[]): Promise<void> {
  const { spreadsheetId, accessToken } = config;

  if (!spreadsheetId) {
    throw new Error("Spreadsheet ID is required to publish to Google Sheets.");
  }
  if (!accessToken) {
    throw new Error("Google OAuth Write Scopes require a valid Google OAuth Access Token.");
  }

  const range = `MediaLibrary!A1:Q100`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  
  const rows = convertMediaVideosToSheetRows(videos);

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values: rows })
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Google Sheets Write Error for MediaLibrary: ${response.status} ${response.statusText} - ${errorDetails}`);
  }
}

/**
 * Upload a video file/blob to the school's Google Drive.
 * Supports large files (500 MB+) using resumable chunked uploads.
 * Gives anyone with link viewing access, and returns file ID and preview URL.
 */
export async function uploadVideoToGoogleDrive(
  accessToken: string,
  fileBlob: Blob | File,
  filename: string,
  mimeType: string,
  onProgress?: (progress: number) => void
): Promise<{ fileId: string; shareUrl: string; directStreamUrl: string }> {
  const totalSize = fileBlob.size;
  let mime = mimeType || fileBlob.type || 'video/mp4';

  // 1. Initiate Resumable Upload Session
  const initResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': mime,
      'X-Upload-Content-Length': String(totalSize)
    },
    body: JSON.stringify({
      name: filename,
      mimeType: mime
    })
  });

  if (!initResponse.ok) {
    const errText = await initResponse.text();
    throw new Error(`Failed to initiate Google Drive upload session: ${initResponse.status} - ${errText}`);
  }

  const sessionUrl = initResponse.headers.get('Location');
  if (!sessionUrl) {
    throw new Error("Failed to get Google Drive upload session Location header.");
  }

  // 2. Upload in chunks (5MB chunk size, which is a multiple of 256KB)
  const CHUNK_SIZE = 5 * 1024 * 1024;
  let start = 0;
  let fileId = '';

  while (start < totalSize) {
    const end = Math.min(start + CHUNK_SIZE, totalSize);
    const chunk = fileBlob.slice(start, end);
    const contentLength = end - start;

    const headers: HeadersInit = {
      'Content-Length': String(contentLength),
      'Content-Range': `bytes ${start}-${end - 1}/${totalSize}`
    };

    const chunkResponse = await fetch(sessionUrl, {
      method: 'PUT',
      headers,
      body: chunk
    });

    if (chunkResponse.status === 308 || chunkResponse.ok) {
      start = end;
      if (onProgress) {
        const percent = Math.min(Math.round((start / totalSize) * 100), 100);
        onProgress(percent);
      }
      if (chunkResponse.ok) {
        const data = await chunkResponse.json();
        fileId = data.id;
      }
    } else {
      const errText = await chunkResponse.text();
      throw new Error(`Error uploading chunk ${start}-${end - 1}: ${chunkResponse.status} - ${errText}`);
    }
  }

  if (!fileId) {
    throw new Error("Upload completed but file ID was not returned by Google Drive.");
  }

  // 3. Set standard Google Drive permission: Anyone can read (so embed works for students)
  const permResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone'
    })
  });

  if (!permResponse.ok) {
    console.warn("Could not set 'anyone' reader permission on Google Drive file. Embedding may fail.");
  }

  // 4. Resolve direct stream link for HTML5 <video> with native audio
  const directStreamUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
  const shareUrl = `https://drive.google.com/file/d/${fileId}/preview`;

  return {
    fileId,
    shareUrl: directStreamUrl || shareUrl,
    directStreamUrl
  };
}

/**
 * Check if a Google Drive file exists.
 * Returns false if deleted manually or not found.
 */
export async function checkGoogleDriveFileExists(accessToken: string, fileId: string): Promise<boolean> {
  if (!fileId) return false;
  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    if (response.status === 404) {
      return false;
    }
    return response.ok;
  } catch (err) {
    console.error(`Error checking Google Drive file ${fileId} existence:`, err);
    return false;
  }
}

/**
 * Permanently delete a video from Google Drive.
 */
export async function deleteVideoFromGoogleDrive(accessToken: string, fileId: string): Promise<boolean> {
  if (!fileId) return true;
  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return response.ok;
  } catch (err) {
    console.error(`Error deleting Google Drive file ${fileId}:`, err);
    return false;
  }
}

/**
 * Fetch client IP address using the local backend API endpoint with a robust timeout.
 * This ensures no dependency on external services and remains fully safe.
 */
export async function fetchClientIpAddress(): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('/api/client-ip', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      return data.ip || 'Unknown';
    }
  } catch (e) {
    console.warn("Could not fetch client IP address from local endpoint:", e);
  }
  return 'Unknown';
}

/**
 * Ensures the 'AuditLogs' tab exists in Google Sheets, creating it and adding headers if it does not.
 */
export async function ensureAuditLogsSheetExists(config: GoogleSheetsConfig): Promise<void> {
  const { spreadsheetId, accessToken } = config;
  if (!spreadsheetId || !accessToken) return;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch spreadsheet metadata: ${response.statusText}`);
  }

  const data = await response.json();
  const sheets = data.sheets || [];
  const auditLogsSheetExists = sheets.some((sheet: any) => sheet?.properties?.title === 'AuditLogs');

  if (!auditLogsSheetExists) {
    const createUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: 'AuditLogs'
              }
            }
          }
        ]
      })
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Failed to create AuditLogs sheet tab: ${createRes.statusText} - ${errText}`);
    }

    const headers = [
      "Audit ID",
      "User ID",
      "User Name",
      "User Role",
      "Action",
      "Changed By",
      "Date",
      "Time",
      "Time Zone",
      "IP Address",
      "Device / Browser"
    ];
    const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/AuditLogs!A1:K1?valueInputOption=USER_ENTERED`;
    const headerRes = await fetch(headerUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: [headers] })
    });

    if (!headerRes.ok) {
      const errText = await headerRes.text();
      throw new Error(`Failed to write AuditLogs headers: ${headerRes.statusText} - ${errText}`);
    }
  }
}

/**
 * Appends an AuditLogEntry to the 'AuditLogs' sheet tab in Google Sheets.
 */
export async function writeAuditLogToGoogleSheet(config: GoogleSheetsConfig, entry: AuditLogEntry): Promise<void> {
  const { spreadsheetId, accessToken } = config;
  if (!spreadsheetId) {
    throw new Error("Spreadsheet ID is required to log audit trails.");
  }
  if (!accessToken) {
    throw new Error("Google OAuth Access Token is required to append audit trails.");
  }

  await ensureAuditLogsSheetExists(config);

  const range = `AuditLogs!A1`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

  const rowValue = [
    entry.auditId,
    entry.userId,
    entry.userName,
    entry.userRole,
    entry.action,
    entry.changedBy,
    entry.date,
    entry.time,
    entry.timeZone,
    entry.ipAddress,
    entry.deviceBrowser
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range: "AuditLogs!A1",
      majorDimension: "ROWS",
      values: [rowValue]
    })
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Google Sheets Append Error: ${response.status} ${response.statusText} - ${errorDetails}`);
  }
}

/**
 * Resolves a Google Drive URL to a direct CDN media stream link for native HTML5 video/audio playback.
 */
export function resolvePlayableMediaUrl(url: string | undefined | null): string {
  if (!url) return '';
  if (url.includes('drive.google.com/file/d/')) {
    const match = url.match(/\/file\/d\/([^\/]+)/);
    if (match && match[1]) {
      const fileId = match[1].split('?')[0].split('/')[0];
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  } else if (url.includes('drive.google.com/uc?')) {
    const match = url.match(/[?&]id=([^&]+)/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
  }
  return url;
}

// =========================================================================
// TARGETED GRANULAR ROW-LEVEL PATCHES (ZERO FULL-TABLE REWRITES)
// =========================================================================

/**
 * Patches a single student row in Google Sheets by locating their canonical Student ID.
 */
export async function patchStudentInGoogleSheet(
  studentId: string,
  changes: Partial<StudentRecord>,
  config: GoogleSheetsConfig,
  originClientId?: string,
  syncId?: string
): Promise<boolean> {
  const { spreadsheetId, accessToken } = config;
  if (!spreadsheetId || !accessToken || !studentId) return false;

  try {
    // 1. Fetch current Student IDs to find exact row index
    const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Students!A:A`;
    const res = await fetch(readUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!res.ok) return false;
    const data = await res.json();
    const rows = data.values || [];
    
    let targetRowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i] && String(rows[i][0]).trim() === studentId) {
        targetRowIndex = i + 1; // 1-indexed for Sheets
        break;
      }
    }

    if (targetRowIndex === -1) {
      console.warn(`[GoogleSheets] Student ${studentId} not found in Students sheet for targeted patch.`);
      return false;
    }

    // 2. Fetch full target row to preserve untouched fields
    const rowRange = `Students!A${targetRowIndex}:Q${targetRowIndex}`;
    const rowRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(rowRange)}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!rowRes.ok) return false;
    const rowData = await rowRes.json();
    const currentRow = (rowData.values && rowData.values[0]) || [];

    // Map updated fields into row cells
    if (changes.name !== undefined) currentRow[1] = changes.name;
    if (changes.email !== undefined) currentRow[2] = changes.email;
    if (changes.phone !== undefined) currentRow[3] = changes.phone;
    if (changes.city !== undefined) currentRow[4] = changes.city;
    if (changes.currentPackage !== undefined) currentRow[5] = changes.currentPackage;
    if (changes.balance !== undefined) currentRow[6] = changes.balance;
    if (changes.readiness !== undefined) currentRow[7] = changes.readiness;
    if (changes.theoryExamStatus !== undefined) currentRow[8] = changes.theoryExamStatus;
    if (changes.status !== undefined) currentRow[11] = changes.status;
    if (changes.notificationsEnabled !== undefined) currentRow[13] = changes.notificationsEnabled ? 'TRUE' : 'FALSE';
    if (changes.aiWarningCount !== undefined) currentRow[14] = changes.aiWarningCount;
    if (changes.aiSuspendedUntil !== undefined) currentRow[15] = changes.aiSuspendedUntil || '';
    if (changes.aiSuspensionTier !== undefined) currentRow[16] = changes.aiSuspensionTier || 0;

    // 3. Write ONLY the target row
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(rowRange)}?valueInputOption=USER_ENTERED`;
    const updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: [currentRow] })
    });

    return updateRes.ok;
  } catch (err) {
    console.error(`[GoogleSheets] Error patching student ${studentId}:`, err);
    return false;
  }
}

/**
 * Patches a single key-value setting in the SchoolSettings sheet tab.
 */
export async function patchSettingInGoogleSheet(
  key: string,
  value: any,
  config: GoogleSheetsConfig
): Promise<boolean> {
  const { spreadsheetId, accessToken } = config;
  if (!spreadsheetId || !accessToken || !key) return false;

  try {
    const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/SchoolSettings!A:A`;
    const res = await fetch(readUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!res.ok) return false;
    const data = await res.json();
    const rows = data.values || [];

    let targetRowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i] && String(rows[i][0]).trim() === key) {
        targetRowIndex = i + 1;
        break;
      }
    }

    const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);

    if (targetRowIndex !== -1) {
      // Update existing setting row cell B{targetRowIndex}
      const cellRange = `SchoolSettings!B${targetRowIndex}`;
      const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(cellRange)}?valueInputOption=USER_ENTERED`;
      const updateRes = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: [[valStr]] })
      });
      return updateRes.ok;
    } else {
      // Append new setting row
      const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/SchoolSettings!A1:append?valueInputOption=USER_ENTERED`;
      const appendRes = await fetch(appendUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: [[key, valStr, 'Custom Setting']] })
      });
      return appendRes.ok;
    }
  } catch (err) {
    console.error(`[GoogleSheets] Error patching setting ${key}:`, err);
    return false;
  }
}

/**
 * Official Google Apps Script Installable Trigger code template.
 * Copy this into Google Sheets > Extensions > Apps Script to push live changes to the Web App.
 */
export const GOOGLE_APPS_SCRIPT_TRIGGER_TEMPLATE = `
/**
 * GOOGLE APPS SCRIPT: Installable onChange Trigger for Real-Time Sync
 * 
 * Instructions:
 * 1. Open your Google Spreadsheet -> Extensions -> Apps Script
 * 2. Paste this code.
 * 3. Set WEBHOOK_URL to your application's domain + /api/webhooks/sheets-change
 * 4. In Apps Script -> Triggers -> Add Trigger -> 'handleSpreadsheetChange' -> From spreadsheet -> On change -> Save.
 */

var WEBHOOK_URL = "https://YOUR_APPLET_URL/api/webhooks/sheets-change";

function handleSpreadsheetChange(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var sheetName = sheet.getName();
    
    // Only capture relevant app sheets
    if (sheetName !== "Students" && sheetName !== "Lessons" && sheetName !== "SchoolSettings" && sheetName !== "Packages") {
      return;
    }
    
    var activeRange = sheet.getActiveRange();
    var row = activeRange ? activeRange.getRow() : 2;
    var rowValues = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    var studentId = "";
    if (sheetName === "Students" || sheetName === "Lessons") {
      studentId = rowValues[0] && String(rowValues[0]).startsWith("ST-") ? String(rowValues[0]) : (rowValues[1] || "");
    }
    
    var payload = {
      sheetName: sheetName,
      changeType: e ? e.changeType : "EDIT",
      row: row,
      studentId: studentId,
      rowData: rowValues,
      originClientId: "google-sheets-apps-script",
      timestamp: new Date().getTime()
    };
    
    UrlFetchApp.fetch(WEBHOOK_URL, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch (err) {
    Logger.log("Error in handleSpreadsheetChange: " + err);
  }
}
`;

/**
 * Creates or updates the visual Dashboard worksheet directly via Google Sheets REST API
 */
export async function setupDashboardWorksheet(config: GoogleSheetsConfig): Promise<boolean> {
  const { spreadsheetId, accessToken } = config;
  if (!spreadsheetId || !accessToken) return false;

  try {
    // 1. Check if Dashboard sheet exists
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!metaRes.ok) return false;
    const meta = await metaRes.json();
    const sheets = meta.sheets || [];
    const hasDashboard = sheets.some((s: any) => s.properties?.title === 'Dashboard');

    // If not exists, insert Dashboard sheet at index 0
    if (!hasDashboard) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'Dashboard',
                  index: 0,
                  tabColor: { red: 0.15, green: 0.39, blue: 0.92 }
                }
              }
            }
          ]
        })
      });
    }

    // 2. Populate Dashboard visual header and KPI formulas
    const dashboardValues = [
      ["", "  🚗 AL-ANDALOS RIJSCHOOL — ADMINISTRATIVE CONTROL CENTER", "", "", "", "", "", "STATUS: 🟢 REAL-TIME SYNC ACTIVE"],
      ["", "📊 KEY PERFORMANCE METRICS", "", "", "", "", "⚡ QUICK ACTIONS", ""],
      ["", "Total Students", "Upcoming Lessons", "Completed Lessons", "Total Revenue (€)", "", "[ ➕ New Student ]", "[ 📅 Schedule Lesson ]"],
      ["", '=IFERROR(COUNTA(Students!A2:A)-1, 0)', '=IFERROR(COUNTIF(Lessons!M2:M, "upcoming"), 0)', '=IFERROR(COUNTIF(Lessons!M2:M, "completed"), 0)', '=IFERROR(SUMIFS(Lessons!K2:K, Lessons!N2:N, "paid"), 0)', "", "[ 💵 Record Payment ]", "[ 📢 Send Notification ]"],
      ["", "", "", "", "", "", "[ ⚙️ School Settings ]", "[ ⚡ Sync Now ]"],
      ["", "🚦 CBR THEORY & EXAM READINESS", "", "", "", "", "", ""],
      ["", "Theory Passed", "Theory Pending", "Avg Readiness", "Active Packages", "", "", ""],
      ["", '=IFERROR(COUNTIF(Students!I2:I, "Passed"), 0)', '=IFERROR(COUNTIF(Students!I2:I, "Pending"), 0)', '=IFERROR(AVERAGE(Students!H2:H), 0)', '=IFERROR(COUNTA(Packages!A2:A)-1, 0)', "", "", ""],
      ["", "📋 RECENT ADMINISTRATIVE AUDIT FEED", "", "", "", "", "", ""],
      ["", "Audit ID", "User ID", "User Name", "Action", "Changed By", "Date", "Time"]
    ];

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Dashboard!A2:H12?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: dashboardValues })
    });

    return true;
  } catch (err) {
    console.error("Failed to setup Dashboard worksheet via REST API:", err);
    return false;
  }
}

/**
 * ----------------------------------------------------
 * HELP & SUPPORT / FAQ INTEGRATION (Google Sheets)
 * Sheet Tab: 'Help & Support'
 * Headers: ID | Category | Question_AR | Answer_AR | Question_NL | Answer_NL | Question_EN | Answer_EN | Active | Order
 * ----------------------------------------------------
 */

export function getDefaultHelpFaqItems(): HelpFaqItem[] {
  return [
    // 1. Bookings & Lessons
    {
      id: "FAQ-001",
      category: "Bookings & Lessons",
      questionAr: "كيف يمكنني حجز درس قيادة عملي جديد؟",
      answerAr: "يمكنك حجز موعد جديد بسهولة من خلال قسم 'الدروس' في التطبيق. اختر التاريخ المتاح، والوقت المناسب، ونقطة الالتقاء، ثم أكد حجزك فوراً.",
      questionNl: "Hoe kan ik een nieuwe praktijkles inplannen?",
      answerNl: "Ga naar het onderdeel 'Lessen' in de app. Kies een beschikbare datum, gewenst tijdstip en ophaallocatie, en bevestig direct je boeking.",
      questionEn: "How do I book a new practical driving lesson?",
      answerEn: "Navigate to the 'Lessons' section in the app. Select an available date, your preferred time slot, and pickup location, then confirm your booking instantly.",
      active: true,
      order: 1
    },
    {
      id: "FAQ-002",
      category: "Bookings & Lessons",
      questionAr: "ما هي سياسة إلغاء أو تعديل مواعيد الدروس؟",
      answerAr: "يمكنك إلغاء أو تعديل موعد الدرس مجاناً قبل الموعد بـ 24 ساعة على الأقل عبر التطبيق، وستتم إعادة رسوم الدرس تلقائياً إلى محفظتك الإلكترونية.",
      questionNl: "Wat is het beleid voor het annuleren of wijzigen van een les?",
      answerNl: "Je kunt een les tot 24 uur van tevoren kosteloos annuleren of verzetten via de app. Het lesbedrag wordt automatisch teruggestort naar je saldo.",
      questionEn: "What is the policy for cancelling or rescheduling a lesson?",
      answerEn: "You can cancel or reschedule a lesson free of charge up to 24 hours in advance via the app. The lesson fee will be automatically refunded to your wallet balance.",
      active: true,
      order: 2
    },
    {
      id: "FAQ-003",
      category: "Bookings & Lessons",
      questionAr: "كم تبلغ مدة درس القيادة النموذجي؟",
      answerAr: "مدة الدرس القياسية هي ساعة واحدة أو ساعة ونصف أو ساعتان حسب تفضيلاتك والخطة التدريبية المعتمدة مع مدربك.",
      questionNl: "Hoe lang duurt een standaard rijles?",
      answerNl: "Een standaard les duurt 1 uur, 1,5 uur of 2 uur, afhankelijk van je gekozen voorkeur en het lesplan met je instructeur.",
      questionEn: "How long is a standard driving lesson?",
      answerEn: "Standard lessons are 1 hour, 1.5 hours, or 2 hours depending on your chosen preference and training plan with your instructor.",
      active: true,
      order: 3
    },

    // 2. Payments & Packages
    {
      id: "FAQ-004",
      category: "Payments & Packages",
      questionAr: "كيف يمكنني شحن رصيد المحفظة أو شراء باقة تدريبية؟",
      answerAr: "انتقل إلى قسم 'الباقات والمحفظة' في التطبيق، ثم اختر الباقة المناسبة أو حدد المبلغ المطلوب شحنه لإتمام الدفع الآمن.",
      questionNl: "Hoe kan ik mijn lessaldo opwaarderen of een pakket aanschaffen?",
      answerNl: "Ga naar 'Pakketten & Saldo' in de app. Kies het gewenste pakket of vul het gewenste bedrag in om veilig af te rekenen.",
      questionEn: "How can I top up my wallet balance or buy a lesson package?",
      answerEn: "Go to the 'Packages & Wallet' section in the app. Choose your desired package or enter a custom amount to complete your secure payment.",
      active: true,
      order: 4
    },
    {
      id: "FAQ-005",
      category: "Payments & Packages",
      questionAr: "أين يمكنني العثور على فواتير الدروس وإيصالات الدفع؟",
      answerAr: "جميع الفواتير وإيصالات الدفع الرسمية بصيغة PDF محفوظة ومتاحة للتحميل المباشر في سجل المعاملات داخل قسم المحفظة.",
      questionNl: "Waar kan ik mijn facturen en betalingsbewijzen vinden?",
      answerNl: "Al je officiële facturen en PDF-betalingsbewijzen zijn direct inzichtelijk en downloadbaar in het transactieoverzicht in je wallet.",
      questionEn: "Where can I find my invoices and payment receipts?",
      answerEn: "All official PDF invoices and payment receipts are securely stored and available for instant download in your Wallet transaction history.",
      active: true,
      order: 5
    },

    // 3. Account & Profile
    {
      id: "FAQ-006",
      category: "Account & Profile",
      questionAr: "كيف يمكنني تحديث بياناتي الشخصية أو رقم الهاتف؟",
      answerAr: "اضغط على أيقونة ملفك الشخصي في أعلى الشاشة للوصول إلى الإعدادات، حيث يمكنك تعديل رقم هاتفك، عنوانك، أو كلمة المرور.",
      questionNl: "Hoe kan ik mijn persoonlijke gegevens of telefoonnummer wijzigen?",
      answerNl: "Klik op je profielicoon bovenin het scherm om naar instellingen te gaan. Hier kun je je telefoonnummer, adres of wachtwoord bijwerken.",
      questionEn: "How do I update my personal details or phone number?",
      answerEn: "Click on your profile icon in the top header to access settings, where you can update your phone number, address, or password.",
      active: true,
      order: 6
    },
    {
      id: "FAQ-007",
      category: "Account & Profile",
      questionAr: "كيف يتم احتساب نسبة جاهزيتي لامتحان القيادة العملي؟",
      answerAr: "يقوم المدرب بتقييم مهاراتك بعد كل درس عملي وفق معايير CBR الرسمية، وتظهر نسبة الجاهزية تلقائياً في لوحة تقدمك التعليمي والمدرب الذكي.",
      questionNl: "Hoe wordt mijn examengereedheid berekend?",
      answerNl: "Je instructeur beoordeelt je vaardigheden na elke praktijkles volgens officiële CBR-normen. Je voortgang is zichtbaar in je dashboard en AI Coach.",
      questionEn: "How is my driving exam readiness calculated?",
      answerEn: "Your instructor evaluates your competencies after each practical lesson according to official CBR standards. Your score is displayed in your progress dashboard and AI Coach.",
      active: true,
      order: 7
    },

    // 4. Notifications
    {
      id: "FAQ-008",
      category: "Notifications",
      questionAr: "كيف أستقبل تذكيرات بمواعيد الدروس القادمة؟",
      answerAr: "يرسل التطبيق تلقائياً إشعارات فورية ورسائل تأكيد عبر البريد الإلكتروني مع إمكانية إضافة الموعد لتقويم هاتفك بنقرة واحدة.",
      questionNl: "Hoe ontvang ik herinneringen voor mijn geplande lessen?",
      answerNl: "De app stuurt automatisch meldingen en bevestigingsmails, inclusief een handige knop om de les direct aan je agenda toe te voegen.",
      questionEn: "How do I receive reminders for upcoming lessons?",
      answerEn: "The app automatically sends in-app notifications and email confirmations, complete with a one-click button to add the lesson to your device calendar.",
      active: true,
      order: 8
    },
    {
      id: "FAQ-009",
      category: "Notifications",
      questionAr: "هل يمكنني تفعيل أو إيقاف استلام الإشعارات؟",
      answerAr: "نعم، يمكنك التحكم في إعدادات الإشعارات من خلال صفحة الملف الشخصي أو القائمة الجانبية في أي وقت.",
      questionNl: "Kan ik mijn notificatievoorkeuren aanpassen?",
      answerNl: "Ja, je kunt meldingen op elk gewenst moment in- of uitschakelen via je profielinstellingen of het zijmenu.",
      questionEn: "Can I manage my notification preferences?",
      answerEn: "Yes, you can enable or disable notification alerts at any time through your profile settings or sidebar menu.",
      active: true,
      order: 9
    },

    // 5. Frequently Asked Questions
    {
      id: "FAQ-010",
      category: "Frequently Asked Questions",
      questionAr: "ما الذي يجب إحضاره معي في أول درس قيادة؟",
      answerAr: "يرجى إحضار بطاقة الهوية الرسمية أو تصريح الإقامة الساري، والتواجد في نقطة الالتقاء المحددة قبل الموعد بـ 5 دقائق.",
      questionNl: "Wat moet ik meenemen naar mijn eerste rijles?",
      answerNl: "Neem een geldig identiteitsbewijs of verblijfsdocument mee en zorg dat je 5 minuten voor aanvang aanwezig bent op de ophaallocatie.",
      questionEn: "What should I bring to my first driving lesson?",
      answerEn: "Please bring a valid photo ID or residence card, and ensure you arrive at the designated pickup location 5 minutes prior to start time.",
      active: true,
      order: 10
    },
    {
      id: "FAQ-011",
      category: "Frequently Asked Questions",
      questionAr: "هل تتوفر الدروس بالسيارات الأوتوماتيكية والعادية؟",
      answerAr: "نعم، توفر المدرسة تدريباً احترافياً على أحدث السيارات المجهزة بدواسات تحكم مزدوجة لكلا النوعين: أوتوماتيك وعادي.",
      questionNl: "Zijn er lessen beschikbaar in zowel automaat als handgeschakeld?",
      answerNl: "Ja, onze rijschool biedt professionele lessen in moderne lesauto's met dubbele bediening voor zowel automaat als handgeschakeld.",
      questionEn: "Are lessons available in both automatic and manual vehicles?",
      answerEn: "Yes, our school provides professional lessons in modern dual-control vehicles in both automatic and manual transmission options.",
      active: true,
      order: 11
    },

    // 6. Technical Issues
    {
      id: "FAQ-012",
      category: "Technical Issues",
      questionAr: "ماذا أفعل إذا واجهت مشكلة تقنية في التطبيق؟",
      answerAr: "يرجى تجربة تحديث الصفحة أو التأكد من اتصالك بالإنترنت. إذا استمرت المشكلة، يمكنك التواصل مع فريق الدعم الفني مباشرة عبر واتساب أو الهاتف من خلال خيارات الاتصال أدناه.",
      questionNl: "Wat moet ik doen bij een technisch probleem in de app?",
      answerNl: "Vernieuw de pagina of controleer je internetverbinding. Blijft het probleem bestaan? Neem dan direct contact op via WhatsApp of telefoon via de contactknoppen hieronder.",
      questionEn: "What should I do if I encounter a technical problem in the app?",
      answerEn: "Try refreshing the page or checking your internet connection. If the issue persists, please reach out to our team directly via WhatsApp or phone using the contact buttons below.",
      active: true,
      order: 12
    }
  ];
}

/**
 * Parses rows from the 'Help & Support' Google Sheets tab.
 */
export function parseSheetRowsToHelpItems(rows: any[][]): HelpFaqItem[] {
  if (!rows || rows.length <= 1) return [];

  const headers = rows[0].map(h => String(h || '').trim().toLowerCase());

  const idIdx = headers.findIndex(h => h === 'id' || h.includes('id'));
  const catIdx = headers.findIndex(h => h === 'category' || h.includes('cat') || h.includes('قسم') || h.includes('categorie'));
  const qArIdx = headers.findIndex(h => h === 'question_ar' || h === 'question ar' || h.includes('question (ar)') || h.includes('سؤال'));
  const aArIdx = headers.findIndex(h => h === 'answer_ar' || h === 'answer ar' || h.includes('answer (ar)') || h.includes('جواب') || h.includes('إجابة'));
  const qNlIdx = headers.findIndex(h => h === 'question_nl' || h === 'question nl' || h.includes('question (nl)') || h.includes('vraag'));
  const aNlIdx = headers.findIndex(h => h === 'answer_nl' || h === 'answer nl' || h.includes('answer (nl)') || h.includes('antwoord'));
  const qEnIdx = headers.findIndex(h => h === 'question_en' || h === 'question en' || h.includes('question (en)'));
  const aEnIdx = headers.findIndex(h => h === 'answer_en' || h === 'answer en' || h.includes('answer (en)'));
  const activeIdx = headers.findIndex(h => h === 'active' || h === 'isactive' || h === 'is_active' || h.includes('مفعل') || h.includes('actief'));
  const orderIdx = headers.findIndex(h => h === 'order' || h === 'displayorder' || h === 'display_order' || h.includes('ترتيب') || h.includes('volgorde'));

  const parsedItems: HelpFaqItem[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const rawQAr = qArIdx !== -1 && row[qArIdx] ? String(row[qArIdx]).trim() : '';
    const rawQNl = qNlIdx !== -1 && row[qNlIdx] ? String(row[qNlIdx]).trim() : '';
    const rawQEn = qEnIdx !== -1 && row[qEnIdx] ? String(row[qEnIdx]).trim() : '';

    // Must have at least one question populated
    if (!rawQAr && !rawQNl && !rawQEn) continue;

    let id = idIdx !== -1 && row[idIdx] ? String(row[idIdx]).trim() : `FAQ-${String(i).padStart(3, '0')}`;
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
      active = actStr === 'true' || actStr === 'yes' || actStr === '1' || actStr === 'نعم' || actStr === 'ja' || actStr === 'active';
    }

    const order = orderIdx !== -1 && row[orderIdx] ? (parseInt(row[orderIdx], 10) || i) : i;

    parsedItems.push({
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

  // Sort by order
  return parsedItems.sort((a, b) => a.order - b.order);
}

/**
 * Converts HelpFaqItem array into standard 2D rows for Google Sheets.
 */
export function convertHelpItemsToSheetRows(items: HelpFaqItem[]): any[][] {
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

  return rows;
}

/**
 * Loads Help & Support questions from Google Sheets with fallback.
 */
export async function loadHelpItemsFromGoogleSheet(config: GoogleSheetsConfig): Promise<HelpFaqItem[]> {
  const { spreadsheetId, accessToken, apiKey } = config;

  if (!spreadsheetId) {
    return getDefaultHelpFaqItems();
  }

  const possibleSheetNames = ['Help & Support', 'Help_Support', 'HelpSupport', 'HelpCenter', 'FAQ'];

  for (const tabName of possibleSheetNames) {
    try {
      const range = `${tabName}!A1:J200`;
      let url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

      const headers: HeadersInit = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      } else if (apiKey) {
        url += `?key=${apiKey}`;
      } else {
        return getDefaultHelpFaqItems();
      }

      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        if (data.values && data.values.length > 1) {
          const parsed = parseSheetRowsToHelpItems(data.values);
          if (parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch (e) {
      // Continue to next sheet name fallback
    }
  }

  return getDefaultHelpFaqItems();
}

/**
 * Writes Help & Support items to the Google Sheets tab 'Help & Support'.
 */
export async function writeHelpItemsToGoogleSheet(config: GoogleSheetsConfig, items: HelpFaqItem[]): Promise<void> {
  const { spreadsheetId, accessToken } = config;

  if (!spreadsheetId) {
    throw new Error("Spreadsheet ID is required to write Help Center items to Google Sheets.");
  }
  if (!accessToken) {
    throw new Error("Google OAuth Access Token is required to write Help Center items to Google Sheets.");
  }

  const rows = convertHelpItemsToSheetRows(items);
  const sheetName = 'Help & Support';

  // 1. Ensure sheet exists
  try {
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (metaRes.ok) {
      const meta = await metaRes.json();
      const sheets = meta.sheets || [];
      const hasSheet = sheets.some((s: any) => s.properties?.title === sheetName);
      if (!hasSheet) {
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requests: [{
              addSheet: {
                properties: {
                  title: sheetName,
                  tabColor: { red: 0.1, green: 0.6, blue: 0.8 }
                }
              }
            }]
          })
        });
      }
    }
  } catch (e) {
    console.warn("Could not auto-create Help & Support sheet tab:", e);
  }

  // 2. Clear old range
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:J200:clear`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (e) {
    // Continue
  }

  // 3. Write new rows
  const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1?valueInputOption=USER_ENTERED`;
  const response = await fetch(writeUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values: rows })
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Google Sheets Help Write Error: ${response.status} ${response.statusText} - ${errorDetails}`);
  }
}



