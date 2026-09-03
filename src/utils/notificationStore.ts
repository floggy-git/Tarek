import { UserRole, IdentityStatus } from '../types';
import { isRecordForStudent } from './identity';

export type NotificationType =
  | 'lesson_cancelled_by_student'
  | 'lesson_cancelled_by_trainer'
  | 'lesson_completed'
  | 'invoice_sent'
  | 'instructor_feedback'
  | 'instructor_note'
  | 'lesson_booked';

export interface AppNotification {
  id: string;
  recipientRole: 'student' | 'trainer' | 'all';
  recipientEmail?: string;
  recipientName?: string;
  targetStudentId?: string; // Permanent Student ID (e.g. ST-000001)
  identityStatus?: IdentityStatus;
  targetStudentName?: string;
  targetUserEmail?: string;
  type: NotificationType;
  titleAr: string;
  titleNl: string;
  titleEn: string;
  messageAr: string;
  messageNl: string;
  messageEn: string;
  timestamp: number; // epoch ms
  read: boolean;
  expiresAt?: number; // epoch ms; when set, expires and auto-hides after this time (e.g. 3 days for student cancellations)
  metadata?: {
    studentId?: string;
    studentName?: string;
    trainerName?: string;
    lessonId?: string;
    date?: string;
    time?: string;
    reason?: string;
    notes?: string;
    invoiceNumber?: string;
    amount?: number;
    evaluation?: string;
    rating?: number;
  };
}

const STORAGE_KEY = 'app_driving_notifications_v3';
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

const DEFAULT_SEED_NOTIFICATIONS: AppNotification[] = [
  // Student persistent notifications (from Instructor)
  {
    id: 'seed-student-1',
    recipientRole: 'student',
    targetStudentId: 'ST-000001',
    recipientName: 'Amir',
    recipientEmail: 'amir@student.drivingschool.nl',
    type: 'instructor_feedback',
    titleAr: 'ملاحظات وتوجيهات جديدة من المدرب',
    titleNl: 'Nieuwe instructeur feedback',
    titleEn: 'New instructor feedback',
    messageAr: 'أضاف المدرب سمير: "تحكم ممتاز في المقود ومراقبة النقاط العمياء. استمر في التركيز على الانعطاف الهادئ."',
    messageNl: 'Instructeur Samir heeft toegevoegd: "Uitstekende stuurcontrole en dodehoekcontrole. Blijf oefenen op rustig insturen."',
    messageEn: 'Instructor Samir added: "Excellent steering control and blind-spot checks. Keep focusing on smooth cornering."',
    timestamp: Date.now() - 4 * 60 * 60 * 1000,
    read: false,
    metadata: {
      studentId: 'ST-000001',
      trainerName: 'Samir',
      date: '2026-06-20',
      time: '14:00',
      evaluation: 'excellent',
      rating: 5,
      notes: 'تحكم ممتاز في المقود ومراقبة النقاط العمياء. استمر في التركيز على الانعطاف الهادئ.'
    }
  },
  {
    id: 'seed-student-2',
    recipientRole: 'student',
    targetStudentId: 'ST-000001',
    recipientName: 'Amir',
    recipientEmail: 'amir@student.drivingschool.nl',
    type: 'lesson_completed',
    titleAr: 'تم إكمال درس القيادة #3',
    titleNl: 'Rijles #3 voltooid & gedocumenteerd',
    titleEn: 'Lesson #3 completed & documented',
    messageAr: 'تم إكمال درس القيادة بنجاح، وتم تحديث سجل تقدمك وملاحظات الدرس.',
    messageNl: 'Rijles voltooid en voortgangskaart en notities succesvol bijgewerkt.',
    messageEn: 'Lesson completed and progress card and notes successfully updated.',
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    read: true,
    metadata: {
      studentId: 'ST-000001',
      trainerName: 'Samir',
      date: '2026-06-18',
      time: '11:00',
      evaluation: 'good',
      rating: 4
    }
  },
  // Instructor temporary notification (from student cancellation - 3 day lifetime)
  {
    id: 'seed-trainer-1',
    recipientRole: 'trainer',
    type: 'lesson_cancelled_by_student',
    titleAr: 'إلغاء درس من قبل المتدرب',
    titleNl: 'Rijles geannuleerd door leerling',
    titleEn: 'Lesson cancelled by student',
    messageAr: 'قام المتدرب أمير بإلغاء درس يوم 21 أغسطس الساعة 11:00. السبب: تغيير في الجدول.',
    messageNl: 'Amir heeft de rijles op 21 aug om 11:00 geannuleerd. Reden: Wijziging in planning.',
    messageEn: 'Amir cancelled the lesson on 21 Aug at 11:00. Reason: Change in schedule.',
    timestamp: Date.now() - 5 * 60 * 60 * 1000,
    read: false,
    expiresAt: Date.now() - 5 * 60 * 60 * 1000 + THREE_DAYS_MS,
    metadata: {
      studentId: 'ST-000001',
      studentName: 'Amir',
      date: '2026-08-21',
      time: '11:00',
      reason: 'Change in schedule / تغيير في الجدول'
    }
  }
];

export function getAllStoredNotifications(): AppNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SEED_NOTIFICATIONS));
      return DEFAULT_SEED_NOTIFICATIONS;
    }
    const parsed: AppNotification[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_SEED_NOTIFICATIONS;
    // Sanitize any existing cached notifications to enforce the exact wording
    const cleaned = parsed.map((item) => {
      if (item.id === 'seed-student-2' || (item.type === 'lesson_completed' && item.titleAr?.includes('درس القيادة #3'))) {
        return {
          ...item,
          titleAr: 'تم إكمال درس القيادة #3',
          messageAr: 'تم إكمال درس القيادة بنجاح، وتم تحديث سجل تقدمك وملاحظات الدرس.'
        };
      }
      return item;
    });
    return cleaned;
  } catch (err) {
    console.error('Failed to parse notifications:', err);
    return DEFAULT_SEED_NOTIFICATIONS;
  }
}

export function saveNotifications(items: AppNotification[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('appNotificationsUpdated'));
  } catch (err) {
    console.error('Failed to save notifications:', err);
  }
}

/**
 * Returns active notifications for a specific user role and identity.
 * Automatically filters out expired notifications (e.g. temporary cancellation notifications older than 3 days).
 * Persistent notifications (expiresAt undefined) are always preserved.
 */
export function getActiveNotifications(
  role: UserRole | string,
  userEmail?: string,
  userName?: string,
  userStudentId?: string
): AppNotification[] {
  const all = getAllStoredNotifications();
  const now = Date.now();

  return all.filter((n) => {
    // 1. Check expiration for temporary notifications
    if (n.expiresAt && n.expiresAt <= now) {
      return false; // Expired (older than 3 days)
    }

    // 2. Role match
    if (role === 'trainer') {
      return n.recipientRole === 'trainer' || n.recipientRole === 'all';
    }

    if (role === 'student') {
      if (n.recipientRole !== 'student' && n.recipientRole !== 'all') {
        return false;
      }
      
      const hasSpecificRecipient = Boolean(
        n.targetStudentId ||
        n.recipientEmail ||
        n.targetUserEmail ||
        n.recipientName ||
        n.targetStudentName ||
        (n.metadata && (n.metadata.studentId || n.metadata.studentName))
      );

      if (!hasSpecificRecipient) {
        return true; // General announcement to all students
      }

      return isRecordForStudent(n, {
        studentId: userStudentId,
        email: userEmail,
        name: userName
      });
    }

    return true;
  }).sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Returns all persistent student history/notes (never expires).
 */
export function getPersistentStudentHistory(
  userEmail?: string,
  userName?: string,
  userStudentId?: string
): AppNotification[] {
  const all = getAllStoredNotifications();

  return all.filter((n) => {
    if (n.recipientRole !== 'student' && n.recipientRole !== 'all') return false;
    
    const hasSpecificRecipient = Boolean(
      n.targetStudentId ||
      n.recipientEmail ||
      n.targetUserEmail ||
      n.recipientName ||
      n.targetStudentName ||
      (n.metadata && (n.metadata.studentId || n.metadata.studentName))
    );

    if (!hasSpecificRecipient) {
      return true; // Broadcast announcement
    }

    return isRecordForStudent(n, {
      studentId: userStudentId,
      email: userEmail,
      name: userName
    });
  }).sort((a, b) => b.timestamp - a.timestamp);
}

export function addNotification(
  notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & {
    id?: string;
    timestamp?: number;
    read?: boolean;
    expiresInDays?: number;
  }
): AppNotification {
  const all = getAllStoredNotifications();
  const timestamp = notif.timestamp || Date.now();
  const expiresAt = notif.expiresInDays
    ? timestamp + notif.expiresInDays * 24 * 60 * 60 * 1000
    : notif.expiresAt;

  const newEntry: AppNotification = {
    ...notif,
    id: notif.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp,
    read: notif.read ?? false,
    expiresAt,
  };

  const updated = [newEntry, ...all];
  saveNotifications(updated);
  return newEntry;
}

export function markNotificationAsRead(id: string): void {
  const all = getAllStoredNotifications();
  const updated = all.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveNotifications(updated);
}

export function markAllNotificationsAsRead(
  role: UserRole | string,
  userEmail?: string,
  userName?: string,
  userStudentId?: string
): void {
  const activeIds = new Set(
    getActiveNotifications(role, userEmail, userName, userStudentId).map((n) => n.id)
  );
  const all = getAllStoredNotifications();
  const updated = all.map((n) => (activeIds.has(n.id) ? { ...n, read: true } : n));
  saveNotifications(updated);
}

export function deleteNotification(id: string): void {
  const all = getAllStoredNotifications();
  const updated = all.filter((n) => n.id !== id);
  saveNotifications(updated);
}

export function getUnreadNotificationCount(
  role: UserRole | string,
  userEmail?: string,
  userName?: string,
  userStudentId?: string
): number {
  const active = getActiveNotifications(role, userEmail, userName, userStudentId);
  return active.filter((n) => !n.read).length;
}

export function addAppNotification(options: {
  title: string;
  message: string;
  type?: any;
  recipientRole?: 'student' | 'trainer' | 'all';
  targetStudentId?: string;
  recipientEmail?: string;
  recipientName?: string;
}): AppNotification {
  return addNotification({
    titleAr: options.title,
    titleNl: options.title,
    titleEn: options.title,
    messageAr: options.message,
    messageNl: options.message,
    messageEn: options.message,
    type: (options.type as NotificationType) || 'instructor_note',
    recipientRole: options.recipientRole || 'all',
    targetStudentId: options.targetStudentId,
    recipientEmail: options.recipientEmail,
    recipientName: options.recipientName
  });
}

