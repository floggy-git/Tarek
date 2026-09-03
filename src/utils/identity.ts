/**
 * Helper to match student names across translations (Arabic and English/Dutch)
 */
export function studentNamesMatch(nameA?: string | null, nameB?: string | null): boolean {
  if (!nameA || !nameB) return false;
  const clean = (n: string) => n.toLowerCase().trim().replace(/[\s-_]/g, '');
  const a = clean(nameA);
  const b = clean(nameB);
  if (a === b) return true;
  
  // Check known translations
  if ((a.includes("amir") || a.includes("أمير")) && (b.includes("amir") || b.includes("أمير"))) return true;
  if ((a.includes("sanne") || a.includes("ساني")) && (b.includes("sanne") || b.includes("ساني"))) return true;
  if ((a.includes("michael") || a.includes("مايكل")) && (b.includes("michael") || b.includes("مايكل"))) return true;

  return false;
}

export interface StudentIdentityQuery {
  studentId?: string | null;
  email?: string | null;
  name?: string | null;
}

export interface StudentRecordCandidate {
  studentId?: string | null;
  targetStudentId?: string | null;
  email?: string | null;
  recipientEmail?: string | null;
  targetUserEmail?: string | null;
  studentEmail?: string | null;
  studentName?: string | null;
  name?: string | null;
  recipientName?: string | null;
  targetStudentName?: string | null;
  [key: string]: any;
}

/**
 * Normalizes email for safe, case-insensitive, whitespace-trimmed comparison.
 */
export function normalizeEmail(email?: string | null): string {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

/**
 * Normalizes student ID for comparison.
 */
export function normalizeStudentId(id?: string | null): string {
  if (!id || typeof id !== 'string') return '';
  return id.trim();
}

/**
 * Canonical matching function for student records.
 *
 * Strict Student ID Enforcement:
 * - studentId is the ONLY authoritative identifier for student-owned data.
 * - Lessons, payments, notifications, achievements, and AI context must belong to a studentId.
 * - NO name-based fallback or email-based fallback guessing.
 *
 * @param record The entity record (lesson, transaction, notification, assessment, etc.)
 * @param user The current authenticated student or target student identifier
 * @returns boolean whether the record belongs to the student
 */
export function isRecordForStudent(
  record: StudentRecordCandidate | null | undefined,
  user: StudentIdentityQuery | null | undefined
): boolean {
  if (!record || !user) return false;

  // Extract candidate record Student ID strictly
  const recordStudentId = normalizeStudentId(
    record.studentId || record.targetStudentId || (record.metadata && record.metadata.studentId)
  );
  const userStudentId = normalizeStudentId(user.studentId || (user as any).id);

  // Both record and user MUST provide a valid studentId and they MUST match exactly.
  if (!recordStudentId || !userStudentId) {
    return false;
  }

  return recordStudentId === userStudentId;
}
