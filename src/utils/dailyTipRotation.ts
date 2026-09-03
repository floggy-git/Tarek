import { DrivingTip, DRIVING_TIPS } from '../data/drivingTips';
import { Lesson, StudentRecord } from '../types';
import { safeSetItem } from './safeStorage';

const TIP_HISTORY_STORAGE_PREFIX = 'drivingschool_tip_history_';
const MAX_HISTORY_LENGTH = 10; // Remember last 10 tips to avoid immediate re-picks

/**
 * Normalizes a stable student identifier string.
 */
export function getStudentTipSeed(student?: StudentRecord | null | any): string {
  if (!student) return 'generic_student';
  return (student.studentId || student.id || student.email || student.name || 'generic_student')
    .toString()
    .trim()
    .toLowerCase();
}

/**
 * Returns a stable YYYY-MM-DD date key in the local timezone.
 */
export function getTodayDateKey(overrideDate?: Date): string {
  const d = overrideDate || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generates a stable numeric hash from a seed string.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Reads the recent tip history for a given student ID from localStorage.
 */
function getStudentTipHistory(studentSeed: string): string[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(`${TIP_HISTORY_STORAGE_PREFIX}${studentSeed}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves a tip ID into the student's recent tip history.
 */
function recordTipToHistory(studentSeed: string, tipId: string): void {
  if (typeof window === 'undefined' || !window.localStorage || !tipId) return;
  try {
    const history = getStudentTipHistory(studentSeed);
    const updated = [tipId, ...history.filter(id => id !== tipId)].slice(0, MAX_HISTORY_LENGTH);
    safeSetItem(`${TIP_HISTORY_STORAGE_PREFIX}${studentSeed}`, JSON.stringify(updated));
  } catch (err) {
    console.warn('[dailyTipRotation] Error saving tip history:', err);
  }
}

/**
 * Inspects reliable lesson records to detect if there is a primary learning focus.
 * NEVER fabricates data — only matches real existing instructor/lesson text.
 */
function getMatchingCategoryFromLessons(lessons?: Lesson[]): string[] | null {
  if (!lessons || lessons.length === 0) return null;

  // Take recent completed or scheduled lessons with real instructor notes
  const activeLessons = lessons
    .filter(l => l.status === 'completed' || l.status === 'upcoming')
    .slice(0, 5);

  if (activeLessons.length === 0) return null;

  const corpus = activeLessons
    .map(l => `${l.instructorNotes || ''} ${l.trainerNotes || ''} ${l.lessonNotes || ''} ${l.pickupLocation || ''}`)
    .join(' ')
    .toLowerCase();

  const categories: string[] = [];

  // Parking & Manoeuvres
  if (/parkeer|parking|fileparker|vakparker|achteruit|bijzondere verrichting|اصطفاف|ركن/.test(corpus)) {
    categories.push('parking');
  }

  // Observation & Mirrors & Blind Spots
  if (/spiegel|mirror|kijkgedrag|kijk|dode hoek|blind spot|مرايا|نقطة عمياء|مراقبة/.test(corpus)) {
    categories.push('observation');
  }

  // Intersections & Priority
  if (/kruispunt|intersection|voorrang|priority|haaientanden|gelijkwaardig|تقاطع|أولوية|أسنان القرش/.test(corpus)) {
    categories.push('intersections', 'priority_rules', 'traffic_signs');
  }

  // Roundabouts
  if (/rotonde|roundabout|دوار/.test(corpus)) {
    categories.push('roundabouts');
  }

  // Highway / Invoegen / Uitvoegen
  if (/snelweg|motorway|highway|invoeg|uitvoeg|طريق سريع|اندماج/.test(corpus)) {
    categories.push('highway_driving');
  }

  // Cyclists & Pedestrians
  if (/fiets|cyclist|fietser|voetganger|pedestrian|zebra|دراجة|مشاة/.test(corpus)) {
    categories.push('cyclists', 'pedestrians', 'vulnerable_users');
  }

  // Vehicle Control & Clutch
  if (/koppeling|clutch|aangrijpingspunt|hellingproef|schakel|gear|دبرياج|تلامس|مرتفعات/.test(corpus)) {
    categories.push('vehicle_control');
  }

  // Speed & Following Distance
  if (/snelheid|speed|afstand|distance|volgafstand|2 second|سرعة|مسافة/.test(corpus)) {
    categories.push('speed_and_space');
  }

  // CBR Exam Prep
  if (/examen|cbr|proefexamen|mock exam|toets|اختبار|فحص/.test(corpus)) {
    categories.push('cbr_exam_prep');
  }

  return categories.length > 0 ? categories : null;
}

/**
 * Core Dynamic Daily Tip Selector:
 * 
 * Rules guaranteed:
 * 1. Same student + Same calendar day -> Same Tip (deterministic).
 * 2. Next calendar day -> Automatically advances to a new Tip.
 * 3. Page refreshes do NOT change the tip during the day.
 * 4. Different students get varied rotation offsets based on studentId.
 * 5. Uses recent tip history to prevent immediate repetition across consecutive days.
 * 6. High-priority personalization when real lesson feedback exists, without fabricating anything.
 */
export function getDailyDrivingTip(
  student?: StudentRecord | null | any,
  lessons?: Lesson[],
  customTips?: DrivingTip[],
  targetDate?: Date
): DrivingTip {
  const tips = customTips && customTips.length > 0 ? customTips : DRIVING_TIPS;
  if (!tips || tips.length === 0) {
    return DRIVING_TIPS[0];
  }

  const studentSeed = getStudentTipSeed(student);
  const dateKey = getTodayDateKey(targetDate);
  const compositeSeed = `${studentSeed}_${dateKey}`;
  const baseHash = hashString(compositeSeed);

  // Check recent history to prevent repeating the same tip in close succession
  const history = getStudentTipHistory(studentSeed);

  // Check if student has authentic lesson focus
  const matchedCategories = getMatchingCategoryFromLessons(lessons);

  let candidatePool = tips;

  if (matchedCategories && matchedCategories.length > 0) {
    const focusedTips = tips.filter(t => matchedCategories.includes(t.category));
    // If we have at least 2 relevant tips in the focused category, use them
    if (focusedTips.length >= 2) {
      candidatePool = focusedTips;
    }
  }

  // Filter out recent history if possible (keep at least 1 candidate)
  const freshCandidates = candidatePool.filter(t => !history.includes(t.id));
  const activePool = freshCandidates.length > 0 ? freshCandidates : candidatePool;

  // Deterministic pick based on baseHash
  const selectedIndex = baseHash % activePool.length;
  const selectedTip = activePool[selectedIndex] || tips[0];

  // Record to history in browser
  recordTipToHistory(studentSeed, selectedTip.id);

  return selectedTip;
}
