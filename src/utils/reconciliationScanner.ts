import { StudentRecord, Lesson, WalletTransaction } from '../types';
import { AppNotification } from './notificationStore';

export interface UnresolvedRecordDetail {
  recordType: 'lesson' | 'transaction' | 'notification' | 'invoice';
  recordId: string;
  currentStudentName: string;
  currentEmail?: string;
  currentPhone?: string;
  existingStudentId?: string;
  candidateStudentIds: string[];
  candidateStudentNames: string[];
  reason: 'multiple_name_matches' | 'conflicting_email_and_phone' | 'unmatched_orphan' | 'invalid_id_format';
}

export interface DuplicateIdentityConflict {
  type: 'duplicate_name' | 'duplicate_email' | 'duplicate_phone' | 'conflicting_id';
  studentA: { id: string; name: string; email: string; phone?: string };
  studentB: { id: string; name: string; email: string; phone?: string };
  description: string;
}

export interface ReconciliationReport {
  auditTimestamp: string;
  totalStudentsScanned: number;
  totalLessonsScanned: number;
  totalWalletTransactionsScanned: number;
  totalInvoicesScanned: number;
  totalNotificationsScanned: number;
  
  // Aggregate classification across all historical child records
  alreadyCanonicalRecords: number;
  safelyMatchedByEmail: number;
  safelyMatchedByPhone: number;
  safelyMatchedByUniqueName: number;
  unresolvedAmbiguousRecords: number;
  unmatchedOrphanRecords: number;
  
  // Student identity registry analysis
  potentialDuplicateIdentities: DuplicateIdentityConflict[];
  recordsWithInvalidStudentIds: number;
  recordsMissingStudentId: number;
  projectedMutationsIfApproved: number;

  // Breakdown by Record Type
  breakdown: {
    lessons: { canonical: number; email: number; phone: number; name: number; unresolved: number; orphan: number };
    transactions: { canonical: number; email: number; phone: number; name: number; unresolved: number; orphan: number };
    notifications: { canonical: number; email: number; phone: number; name: number; unresolved: number; orphan: number };
  };

  // Detailed records for manual investigation
  unresolvedRecords: UnresolvedRecordDetail[];
  unmatchedOrphans: UnresolvedRecordDetail[];
}

/**
 * Normalization helpers
 */
export function normalizeEmail(email?: string): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

export function normalizePhone(phone?: string): string {
  if (!phone) return '';
  // Remove spaces, dashes, parentheses, dots, but keep digits and leading +
  return phone.replace(/[\s\-\(\)\.]/g, '').trim();
}

export function normalizeName(name?: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[,\-_.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isValidCanonicalStudentId(id?: string): boolean {
  if (!id) return false;
  // Canonical Student ID format: ST-XXXXXX (at least 5 digits, typically 6)
  return /^ST-\d{4,8}$/i.test(id.trim());
}

/**
 * Pure, 100% Read-Only Reconciliation Scanner.
 * Takes immutable snapshot inputs and produces an audit report.
 * Does NOT mutate any input array or external state.
 */
export function runReadOnlyReconciliationAudit(
  students: ReadonlyArray<StudentRecord>,
  lessons: ReadonlyArray<Lesson>,
  transactions: ReadonlyArray<WalletTransaction>,
  notifications: ReadonlyArray<AppNotification>
): ReconciliationReport {
  const auditTimestamp = new Date().toISOString();

  // 1. Analyze Student Master Registry for Duplicates & Conflicts
  const duplicateIdentities: DuplicateIdentityConflict[] = [];
  const normalizedStudents = students.map(s => ({
    raw: s,
    normName: normalizeName(s.name),
    normEmail: normalizeEmail(s.email),
    normPhone: normalizePhone(s.phone),
    studentId: s.studentId || s.id
  }));

  for (let i = 0; i < normalizedStudents.length; i++) {
    for (let j = i + 1; j < normalizedStudents.length; j++) {
      const a = normalizedStudents[i];
      const b = normalizedStudents[j];

      if (a.normEmail && b.normEmail && a.normEmail === b.normEmail && a.studentId !== b.studentId) {
        duplicateIdentities.push({
          type: 'duplicate_email',
          studentA: { id: a.studentId, name: a.raw.name, email: a.raw.email, phone: a.raw.phone },
          studentB: { id: b.studentId, name: b.raw.name, email: b.raw.email, phone: b.raw.phone },
          description: `Two different Student IDs (${a.studentId} & ${b.studentId}) share the exact same email: "${a.raw.email}".`
        });
      }

      if (a.normPhone && b.normPhone && a.normPhone === b.normPhone && a.studentId !== b.studentId) {
        duplicateIdentities.push({
          type: 'duplicate_phone',
          studentA: { id: a.studentId, name: a.raw.name, email: a.raw.email, phone: a.raw.phone },
          studentB: { id: b.studentId, name: b.raw.name, email: b.raw.email, phone: b.raw.phone },
          description: `Two different Student IDs (${a.studentId} & ${b.studentId}) share the same phone number: "${a.raw.phone}".`
        });
      }

      if (a.normName && b.normName && a.normName === b.normName && a.studentId !== b.studentId) {
        duplicateIdentities.push({
          type: 'duplicate_name',
          studentA: { id: a.studentId, name: a.raw.name, email: a.raw.email, phone: a.raw.phone },
          studentB: { id: b.studentId, name: b.raw.name, email: b.raw.email, phone: b.raw.phone },
          description: `Two different Student IDs (${a.studentId} & ${b.studentId}) share the exact same student name: "${a.raw.name}".`
        });
      }
    }
  }

  // 2. Child Record Matching Engine (Deterministic Hierarchy)
  let canonicalCount = 0;
  let matchedEmailCount = 0;
  let matchedPhoneCount = 0;
  let matchedNameCount = 0;
  let unresolvedCount = 0;
  let orphanCount = 0;
  let invalidIdCount = 0;
  let missingIdCount = 0;

  const unresolvedRecords: UnresolvedRecordDetail[] = [];
  const unmatchedOrphans: UnresolvedRecordDetail[] = [];

  const breakdown = {
    lessons: { canonical: 0, email: 0, phone: 0, name: 0, unresolved: 0, orphan: 0 },
    transactions: { canonical: 0, email: 0, phone: 0, name: 0, unresolved: 0, orphan: 0 },
    notifications: { canonical: 0, email: 0, phone: 0, name: 0, unresolved: 0, orphan: 0 },
  };

  function matchRecord(
    recordType: 'lesson' | 'transaction' | 'notification',
    recordId: string,
    rawId: string | undefined,
    rawName: string | undefined,
    rawEmail: string | undefined,
    rawPhone: string | undefined
  ) {
    // Check if ID is missing or invalid
    if (!rawId) {
      missingIdCount++;
    } else if (!isValidCanonicalStudentId(rawId)) {
      invalidIdCount++;
    }

    // Step 1: Check canonical studentId
    if (rawId && isValidCanonicalStudentId(rawId)) {
      const existsInMaster = normalizedStudents.some(s => s.studentId === rawId);
      if (existsInMaster) {
        canonicalCount++;
        breakdown[recordType === 'lesson' ? 'lessons' : recordType === 'transaction' ? 'transactions' : 'notifications'].canonical++;
        return;
      }
    }

    // Step 2: Exact Normalized Email Match
    const normEmail = normalizeEmail(rawEmail);
    if (normEmail) {
      const emailMatches = normalizedStudents.filter(s => s.normEmail === normEmail);
      if (emailMatches.length === 1) {
        matchedEmailCount++;
        breakdown[recordType === 'lesson' ? 'lessons' : recordType === 'transaction' ? 'transactions' : 'notifications'].email++;
        return;
      } else if (emailMatches.length > 1) {
        unresolvedCount++;
        breakdown[recordType === 'lesson' ? 'lessons' : recordType === 'transaction' ? 'transactions' : 'notifications'].unresolved++;
        unresolvedRecords.push({
          recordType,
          recordId,
          currentStudentName: rawName || '',
          currentEmail: rawEmail,
          currentPhone: rawPhone,
          existingStudentId: rawId,
          candidateStudentIds: emailMatches.map(m => m.studentId),
          candidateStudentNames: emailMatches.map(m => m.raw.name),
          reason: 'multiple_name_matches'
        });
        return;
      }
    }

    // Step 3: Exact Normalized Phone Match
    const normPhone = normalizePhone(rawPhone);
    if (normPhone) {
      const phoneMatches = normalizedStudents.filter(s => s.normPhone === normPhone);
      if (phoneMatches.length === 1) {
        matchedPhoneCount++;
        breakdown[recordType === 'lesson' ? 'lessons' : recordType === 'transaction' ? 'transactions' : 'notifications'].phone++;
        return;
      } else if (phoneMatches.length > 1) {
        unresolvedCount++;
        breakdown[recordType === 'lesson' ? 'lessons' : recordType === 'transaction' ? 'transactions' : 'notifications'].unresolved++;
        unresolvedRecords.push({
          recordType,
          recordId,
          currentStudentName: rawName || '',
          currentEmail: rawEmail,
          currentPhone: rawPhone,
          existingStudentId: rawId,
          candidateStudentIds: phoneMatches.map(m => m.studentId),
          candidateStudentNames: phoneMatches.map(m => m.raw.name),
          reason: 'conflicting_email_and_phone'
        });
        return;
      }
    }

    // Step 4: Exact Normalized Name Match
    const normName = normalizeName(rawName);
    if (normName) {
      const nameMatches = normalizedStudents.filter(s => s.normName === normName || s.normName.includes(normName) || normName.includes(s.normName));
      if (nameMatches.length === 1) {
        matchedNameCount++;
        breakdown[recordType === 'lesson' ? 'lessons' : recordType === 'transaction' ? 'transactions' : 'notifications'].name++;
        return;
      } else if (nameMatches.length > 1) {
        unresolvedCount++;
        breakdown[recordType === 'lesson' ? 'lessons' : recordType === 'transaction' ? 'transactions' : 'notifications'].unresolved++;
        unresolvedRecords.push({
          recordType,
          recordId,
          currentStudentName: rawName || '',
          currentEmail: rawEmail,
          currentPhone: rawPhone,
          existingStudentId: rawId,
          candidateStudentIds: nameMatches.map(m => m.studentId),
          candidateStudentNames: nameMatches.map(m => m.raw.name),
          reason: 'multiple_name_matches'
        });
        return;
      }
    }

    // Step 5: Zero Candidates -> Unmatched Orphan
    orphanCount++;
    breakdown[recordType === 'lesson' ? 'lessons' : recordType === 'transaction' ? 'transactions' : 'notifications'].orphan++;
    unmatchedOrphans.push({
      recordType,
      recordId,
      currentStudentName: rawName || '',
      currentEmail: rawEmail,
      currentPhone: rawPhone,
      existingStudentId: rawId,
      candidateStudentIds: [],
      candidateStudentNames: [],
      reason: 'unmatched_orphan'
    });
  }

  // Process Lessons
  lessons.forEach(l => {
    matchRecord('lesson', l.id, l.studentId, l.studentName, undefined, undefined);
  });

  // Process Transactions
  transactions.forEach(tx => {
    matchRecord('transaction', tx.id, tx.studentId, tx.studentName, undefined, undefined);
  });

  // Process Notifications (only student-directed)
  const studentNotifications = notifications.filter(n => n.recipientRole === 'student' || n.metadata?.studentName || n.targetStudentName);
  studentNotifications.forEach(n => {
    const rawId = n.targetStudentId || n.metadata?.studentId;
    const rawName = n.targetStudentName || n.recipientName || n.metadata?.studentName;
    const rawEmail = n.recipientEmail || n.targetUserEmail;
    matchRecord('notification', n.id, rawId, rawName, rawEmail, undefined);
  });

  // Count distinct invoices attached to lessons and transactions
  const uniqueInvoices = new Set<string>();
  lessons.forEach(l => { if (l.invoiceId) uniqueInvoices.add(l.invoiceId); });
  transactions.forEach(tx => { if (tx.invoiceId) uniqueInvoices.add(tx.invoiceId); });

  const projectedMutationsIfApproved = matchedEmailCount + matchedPhoneCount + matchedNameCount;

  return {
    auditTimestamp,
    totalStudentsScanned: students.length,
    totalLessonsScanned: lessons.length,
    totalWalletTransactionsScanned: transactions.length,
    totalInvoicesScanned: uniqueInvoices.size,
    totalNotificationsScanned: studentNotifications.length,
    alreadyCanonicalRecords: canonicalCount,
    safelyMatchedByEmail: matchedEmailCount,
    safelyMatchedByPhone: matchedPhoneCount,
    safelyMatchedByUniqueName: matchedNameCount,
    unresolvedAmbiguousRecords: unresolvedCount,
    unmatchedOrphanRecords: orphanCount,
    potentialDuplicateIdentities: duplicateIdentities,
    recordsWithInvalidStudentIds: invalidIdCount,
    recordsMissingStudentId: missingIdCount,
    projectedMutationsIfApproved,
    breakdown,
    unresolvedRecords,
    unmatchedOrphans
  };
}
