import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Check, Plus, Landmark, Navigation, MapPin, 
  CheckCircle2, ChevronRight, CalendarCheck, Flame, Info,
  ChevronLeft, Sunrise, Sunset, Sun, XCircle, Palmtree, AlertTriangle, FileText
} from 'lucide-react';
import { TRANSLATIONS, Language, Lesson, WalletTransaction, StudentRecord, TrainerSchedule, SchoolSettings, getSchoolName } from '../types';
import { sendAppEmail } from '../utils/emailService';
import { getSheetsConfig, loadStudentsFromGoogleSheet, writeLessonsToGoogleSheet, writeAuditLogToGoogleSheet, fetchClientIpAddress } from '../utils/googleSheets';
import CancelLessonModal from './CancelLessonModal';
import { getTrainerPhoto } from '../utils/studentPhoto';
import { isDateInVacationRange, isVacationModeActive, getVacationBlockedMessage } from '../utils/scheduleUtils';
import { addNotification } from '../utils/notificationStore';
import { isRecordForStudent } from '../utils/identity';
import { executeStudentBookingWorkflow, executeStudentCancellationWorkflow } from '../services/integrationManager';
import { formatDisplayLessonNumber } from '../services/googleCalendarService';

interface StudentLessonsProps {
  lang: Language;
  t: typeof TRANSLATIONS['en'];
  lessons: Lesson[];
  setLessons: (lessons: Lesson[]) => void;
  transactions: WalletTransaction[];
  setTransactions: (transactions: WalletTransaction[]) => void;
  isOffline: boolean;
  setParentActiveTab: (tab: string) => void;
  setSelectedReplayLessonId: (id: string) => void;
  currentUser?: any;
  students: StudentRecord[];
  setStudents: (students: StudentRecord[]) => void;
  schedule: TrainerSchedule;
  schoolSettings?: Partial<SchoolSettings> | null;
}

const cleanTrainerName = (name: string) => {
  if (!name) return "";
  return name
    .replace(/^(Instructeur|Instructor|المدرب|Your Trainer|Je Instructeur|المدرب الخاص بك)(?:\s+|:\s*)/i, '')
    .trim();
};

const BOOKING_TIME_SLOTS = [
  { time: "08:00", p: "morning", tag: "Early Bird", tagNl: "Vroege vogel", tagAr: "صباحي مبكر" },
  { time: "09:00", p: "morning", tag: "Most Request", tagNl: "Populair", tagAr: "مفضل جداً" },
  { time: "10:00", p: "morning", tag: "Standard", tagNl: "Standaard", tagAr: "قياسي" },
  { time: "11:00", p: "morning", tag: "Premium Hour", tagNl: "Premium uur", tagAr: "ساعة مميزة" },
  { time: "12:00", p: "afternoon", tag: "Lunch Slot", tagNl: "Lunchpauze", tagAr: "فترة الغداء" },
  { time: "13:00", p: "afternoon", tag: "Afternoon Cruise", tagNl: "Middagrit", tagAr: "جولة بعد الظهر" },
  { time: "14:00", p: "afternoon", tag: "Most Request", tagNl: "Populair", tagAr: "مفضل جداً" },
  { time: "15:00", p: "afternoon", tag: "Standard", tagNl: "Standaard", tagAr: "قياسي" },
  { time: "16:00", p: "evening", tag: "Sunset Drive", tagNl: "Late Avond", tagAr: "مسائي مميز" },
  { time: "17:00", p: "evening", tag: "Sunset Drive", tagNl: "Late Avond", tagAr: "مسائي مميز" }
];

function StudentLessonsComponent({ 
  lang, t, lessons, setLessons, transactions, setTransactions, isOffline,
  setParentActiveTab, setSelectedReplayLessonId, currentUser,
  students, setStudents, schedule, schoolSettings
}: StudentLessonsProps) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [isBooking, setIsBooking] = useState(false);

  // Booking Form State
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [duration, setDuration] = useState<number>(() => {
    const defaultDur = Number(schoolSettings?.defaultLessonDuration);
    return defaultDur === 2 ? 2 : 1;
  });
  const [pickup, setPickup] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [lastBookedLesson, setLastBookedLesson] = useState<Lesson | null>(null);

  // Available Duration Options: Always allow choosing 1-hour or 2-hour lesson
  const availableDurationOptions = React.useMemo(() => {
    return [
      { value: 1, label: lang === 'ar' ? 'ساعة واحدة (1h)' : lang === 'nl' ? '1 Uur' : '1 Hour' },
      { value: 2, label: lang === 'ar' ? 'ساعتان (2h)' : lang === 'nl' ? '2 Uur' : '2 Hours' }
    ];
  }, [lang]);

  // Keep duration valid
  useEffect(() => {
    if (duration !== 1 && duration !== 2) {
      setDuration(1);
    }
  }, [duration]);

  // Time offset from server to prevent system clock spoofing
  const [amsterdamTimeOffset, setAmsterdamTimeOffset] = useState<number>(0);

  // Helper to fetch and sync authoritative server time
  const syncServerTime = async (): Promise<Date> => {
    try {
      const res = await fetch('/api/time');
      const data = await res.json();
      if (data.success) {
        const serverAmsterdamTime = new Date(
          data.year,
          data.month - 1,
          data.day,
          data.hour,
          data.minute,
          data.second
        );
        const offset = serverAmsterdamTime.getTime() - Date.now();
        setAmsterdamTimeOffset(offset);
        return serverAmsterdamTime;
      }
    } catch (err) {
      console.warn("Could not fetch server time, utilizing robust local timezone calculation fallback:", err);
    }
    return getLocalAmsterdamFallback();
  };

  const getLocalAmsterdamFallback = (): Date => {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Amsterdam',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
      });
      const parts = formatter.formatToParts(new Date());
      const val = (name: string) => Number(parts.find(p => p.type === name)?.value || 0);
      return new Date(val('year'), val('month') - 1, val('day'), val('hour'), val('minute'), val('second'));
    } catch (e) {
      return new Date();
    }
  };

  const getAmsterdamNow = (): Date => {
    if (amsterdamTimeOffset !== 0) {
      return new Date(Date.now() + amsterdamTimeOffset);
    }
    return getLocalAmsterdamFallback();
  };

  const getAmsterdamTodayStr = (d?: Date): string => {
    const target = d || getAmsterdamNow();
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const dayVal = String(target.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayVal}`;
  };

  // Sync server time on mount
  useEffect(() => {
    syncServerTime();
  }, []);

  // Custom Calendar Navigation (uses Europe/Amsterdam as initialization standard)
  const now = getAmsterdamNow();
  const [displayedMonth, setDisplayedMonth] = useState(() => getLocalAmsterdamFallback().getMonth());
  const [displayedYear, setDisplayedYear] = useState(() => getLocalAmsterdamFallback().getFullYear());

  // Real-time synchronization state
  const [freshBookings, setFreshBookings] = useState<Lesson[]>([]);
  const [freshStudents, setFreshStudents] = useState<StudentRecord[]>([]);
  const [isLoadingFreshData, setIsLoadingFreshData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Constants
  const LESSON_PRICE_PER_HOUR = Number(schoolSettings?.lessonPricePerHour ?? schedule?.lessonPricePerHour ?? 65) || 65;
  const computedPrice = Number(((Number(duration) || 1) * LESSON_PRICE_PER_HOUR).toFixed(2));

  // Check name similarity or exact match
  const studentNamesMatch = React.useCallback((nameA?: string, nameB?: string) => {
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
  }, []);

  const studentName = currentUser?.name || "";

  const instructorDisplayName = React.useMemo(() => {
    const raw = schoolSettings?.instructorName || (schedule as any)?.trainerName || "";
    const cleaned = cleanTrainerName(raw);
    if (cleaned) return cleaned;
    return lang === 'ar' ? 'المدرب' : lang === 'nl' ? 'de instructeur' : 'Instructor';
  }, [schedule, schoolSettings?.instructorName, lang, cleanTrainerName]);

  const formatVacationDate = React.useCallback((dateStr: string, l: Language): string => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    
    const monthsShortEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsShortNl = ['jan.', 'feb.', 'mrt.', 'apr.', 'mei', 'jun.', 'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.'];
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    if (l === 'ar') {
      return `${d} ${monthsAr[m - 1]}`;
    }
    if (l === 'nl') {
      return `${d} ${monthsShortNl[m - 1]}`;
    }
    return `${monthsShortEn[m - 1]} ${d}`;
  }, []);

  // Filter lessons based on status and logged-in student (Student ID > Email > Name fallback)
  const filteredLessons = React.useMemo(() => {
    return lessons
      .filter(l => isRecordForStudent(l, currentUser))
      .filter(l => l.status === activeTab);
  }, [lessons, activeTab, currentUser]);

  // Helpers for Booking Logic & Past Check
  const timeToMinutes = React.useCallback((timeStr: string): number => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  }, []);

  // Dynamic time slots generation based on duration and schedule
  const bookingTimeSlots = React.useMemo(() => {
    const slots: Array<{ time: string; p: 'morning' | 'afternoon' | 'evening'; tag: string; tagNl: string; tagAr: string }> = [];
    const startTimeStr = schedule?.startTime || "08:00";
    const endTimeStr = schedule?.endTime || "18:00";
    
    const startMins = timeToMinutes(startTimeStr);
    const endMins = timeToMinutes(endTimeStr);
    const durToUse = Number(duration) || 1;
    const stepMins = Math.round(durToUse * 60);

    if (stepMins <= 0) return slots;

    for (let mins = startMins; mins + stepMins <= endMins; mins += stepMins) {
      const hours = Math.floor(mins / 60);
      const m = mins % 60;
      const timeStr = `${String(hours).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      
      let p: 'morning' | 'afternoon' | 'evening' = 'morning';
      let tag = 'Standard';
      let tagNl = 'Standaard';
      let tagAr = 'قياسي';

      if (hours < 10) {
        tag = 'Early Bird'; tagNl = 'Vroege vogel'; tagAr = 'صباحي مبكر';
      } else if (hours < 12) {
        tag = 'Popular'; tagNl = 'Populair'; tagAr = 'مفضل جداً';
      } else if (hours < 16) {
        p = 'afternoon';
        if (hours === 12) { tag = 'Lunch Slot'; tagNl = 'Lunchpauze'; tagAr = 'فترة الغداء'; }
        else if (hours === 14) { tag = 'Most Requested'; tagNl = 'Populair'; tagAr = 'مفضل جداً'; }
        else { tag = 'Afternoon Drive'; tagNl = 'Middagrit'; tagAr = 'جولة بعد الظهر'; }
      } else {
        p = 'evening';
        tag = 'Sunset Drive'; tagNl = 'Late Avond'; tagAr = 'مسائي مميز';
      }

      slots.push({ time: timeStr, p, tag, tagNl, tagAr });
    }

    return slots;
  }, [duration, schedule?.startTime, schedule?.endTime, timeToMinutes]);

  // Clear selected slot if no longer valid for new duration
  useEffect(() => {
    if (selectedTimeSlot) {
      const validTimes = bookingTimeSlots.map(s => s.time);
      if (!validTimes.includes(selectedTimeSlot)) {
        setSelectedTimeSlot('');
      }
    }
  }, [bookingTimeSlots, selectedTimeSlot]);

  const isPastDate = React.useCallback((year: number, month: number, day: number): boolean => {
    const nowDate = getAmsterdamNow();
    const todayMidnight = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
    const checkDate = new Date(year, month, day);
    return checkDate < todayMidnight;
  }, []);

  const isSlotPast = React.useCallback((dateStr: string, slotTime: string): boolean => {
    const nowDate = getAmsterdamNow();
    const todayStr = getAmsterdamTodayStr(nowDate);
    
    if (dateStr < todayStr) {
      return true; // Date is strictly in the past
    }
    
    if (dateStr === todayStr) {
      const [slotHour, slotMin] = slotTime.split(':').map(Number);
      const currentHour = nowDate.getHours();
      const currentMin = nowDate.getMinutes();
      
      if (currentHour > slotHour) {
        return true;
      }
      if (currentHour === slotHour && currentMin >= (slotMin || 0)) {
        return true;
      }
    }
    
    return false;
  }, []);

  const isSlotInWorkingHours = React.useCallback((slotTime: string, durationHours: number): boolean => {
    if (!schedule) return true;
    const startMinutes = timeToMinutes(slotTime);
    const endMinutes = startMinutes + durationHours * 60;
    
    const workStartMinutes = timeToMinutes(schedule.startTime || "08:00");
    const workEndMinutes = timeToMinutes(schedule.endTime || "18:00");
    
    return startMinutes >= workStartMinutes && endMinutes <= workEndMinutes;
  }, [schedule, timeToMinutes]);

  const hasConflict = React.useCallback((dateStr: string, slotTime: string, durHours: number, bookingsList: Lesson[]): boolean => {
    if (!dateStr || !slotTime) return false;
    
    const P_start = timeToMinutes(slotTime);
    const P_end = P_start + durHours * 60;
    
    for (const b of bookingsList) {
      if (b.date === dateStr && b.status !== 'cancelled') {
        const E_start = timeToMinutes(b.time);
        const E_end = E_start + (b.duration || 1) * 60;
        
        // Overlap: S1 < E2 and S2 < E1
        if (P_start < E_end && E_start < P_end) {
          return true;
        }
      }
    }
    return false;
  }, [timeToMinutes]);

  const minNoticeHours = schoolSettings?.minAdvanceNoticeHours ?? 12;
  const cancellationDeadlineHours = schoolSettings?.cancellationDeadlineHours ?? 24;

  const isSlotTooSoon = React.useCallback((dateStr: string, slotTime: string): boolean => {
    if (!dateStr || !slotTime) return false;
    const [hours, mins] = slotTime.split(':').map(Number);
    const lessonDate = new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${String(mins || 0).padStart(2, '0')}:00`);
    const now = getAmsterdamNow();
    const diffHours = (lessonDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours < minNoticeHours;
  }, [minNoticeHours]);

  const formatCutoffDateTime = (d: Date, l: string): string => {
    if (!d || isNaN(d.getTime())) return '';
    const day = d.getDate();
    const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const monthsNl = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

    const monthStr = l === 'ar' ? monthsAr[d.getMonth()] : l === 'nl' ? monthsNl[d.getMonth()] : monthsEn[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${monthStr} ${year} • ${hours}:${minutes}`;
  };

  const [cancellingLessonItem, setCancellingLessonItem] = useState<Lesson | null>(null);
  const [cancellationSuccessModal, setCancellationSuccessModal] = useState<{
    isOpen: boolean;
    lesson: Lesson | null;
    reason: string;
  } | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleStudentCancelLesson = (lessonId: string) => {
    const target = lessons.find(l => l.id === lessonId);
    if (target) {
      setCancellingLessonItem(target);
    }
  };

  const handleConfirmStudentCancellation = async (cancellationData: {
    reason: string;
    notes?: string;
    notifyStudent: boolean;
  }) => {
    if (!cancellingLessonItem) return;
    setIsCancelling(true);

    const targetLesson = cancellingLessonItem;
    const nowDate = getAmsterdamNow();
    const cancellationDate = getAmsterdamTodayStr(nowDate);
    const cancellationTime = nowDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updated = lessons.map(l => {
      if (l.id === targetLesson.id) {
        return {
          ...l,
          status: 'cancelled' as const,
          cancellationReason: cancellationData.reason || (lang === 'ar' ? 'تم الإلغاء بواسطة الطالب' : lang === 'nl' ? 'Geannuleerd door leerling' : 'Cancelled by student'),
          cancellationNotes: cancellationData.notes,
          cancellationDate,
          cancellationTime,
          cancelledBy: 'Student' as const,
          notifiedStudent: cancellationData.notifyStudent
        };
      }
      return l;
    });

    // 1. Immediately update React state -> Instantly updates Student Portal & Instructor Dashboard
    setLessons(updated);

    const sheetsConfig = getSheetsConfig();

    // 2. Execute full cancellation workflow (Google Calendar deletion + Sheets sync + Notifications)
    try {
      await executeStudentCancellationWorkflow({
        bookingId: targetLesson.id,
        studentId: currentUser?.studentId || currentUser?.id || targetLesson.studentId || '',
        reason: cancellationData.reason,
        cancelledBy: 'Student',
        allLessons: updated,
        student: currentUser,
        schoolSettings: schoolSettings || undefined,
        lang,
        accessToken: sheetsConfig.accessToken,
        spreadsheetId: sheetsConfig.spreadsheetId
      });
    } catch (wfErr) {
      console.warn("Workflow cancellation warning:", wfErr);
    }

    // 3. Post to Google Apps Script Web App (fallback compatibility)
    const webAppUrl = (import.meta as any).env.VITE_GOOGLE_SHEETS_WEB_APP_URL;
    const hasSheetsWebApp = webAppUrl && !webAppUrl.includes('AKfycby...');
    if (hasSheetsWebApp && !isOffline) {
      try {
        await fetch(webAppUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: "cancelBooking",
            lessonId: targetLesson.id,
            studentName: targetLesson.studentName || currentUser?.name || "",
            date: targetLesson.date,
            time: targetLesson.time,
            duration: targetLesson.duration,
            cancellationReason: cancellationData.reason,
            cancellationNotes: cancellationData.notes,
            cancelledBy: "Student"
          })
        });
      } catch (postErr) {
        console.warn("Failed POST cancelBooking to Apps Script:", postErr);
      }
    }

    // 4. Record audit log in Google Sheets
    if (sheetsConfig.spreadsheetId) {
      try {
        const clientIp = await fetchClientIpAddress().catch(() => '127.0.0.1');
        await writeAuditLogToGoogleSheet(sheetsConfig, {
          auditId: `audit-${Date.now()}`,
          userId: currentUser?.id || 'ST-000001',
          userName: currentUser?.name || targetLesson.studentName || 'Student',
          userRole: 'Student',
          action: `CANCEL_LESSON: Student ${targetLesson.studentName || 'Student'} cancelled lesson on ${targetLesson.date} at ${targetLesson.time}. Reason: ${cancellationData.reason}`,
          changedBy: currentUser?.name || targetLesson.studentName || 'Student',
          date: cancellationDate,
          time: cancellationTime,
          timeZone: 'Europe/Amsterdam',
          ipAddress: clientIp,
          deviceBrowser: typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser'
        });
      } catch (auditErr) {
        console.warn("Audit log write error:", auditErr);
      }
    }

    // 5. Send confirmation email & dispatch instructor notification (with 3-day lifetime)
    if (cancellationData.notifyStudent) {
      sendAppEmail(targetLesson.studentName || currentUser?.name || 'Student', 'cancellation', {
        date: targetLesson.date,
        time: targetLesson.time,
        price: targetLesson.price,
        cancellationReason: cancellationData.reason,
        cancellationNotes: cancellationData.notes
      });
    }

    // Add notification to instructor with 3-day automatic expiration
    const studentDisplayName = targetLesson.studentName || currentUser?.name || 'Amir';
    const authoritativeStudentId = targetLesson.studentId || currentUser?.studentId || currentUser?.id;
    addNotification({
      recipientRole: 'trainer',
      targetStudentId: authoritativeStudentId,
      identityStatus: authoritativeStudentId ? 'canonical' : undefined,
      type: 'lesson_cancelled_by_student',
      titleAr: 'إلغاء درس من قبل المتدرب',
      titleNl: 'Rijles geannuleerd door leerling',
      titleEn: 'Lesson cancelled by student',
      messageAr: `قام المتدرب ${studentDisplayName} بإلغاء درس يوم ${targetLesson.date} الساعة ${targetLesson.time || '12:00'}.${cancellationData.reason ? ` السبب: ${cancellationData.reason}` : ''}`,
      messageNl: `${studentDisplayName} heeft de rijles op ${targetLesson.date} om ${targetLesson.time || '12:00'} geannuleerd.${cancellationData.reason ? ` Reden: ${cancellationData.reason}` : ''}`,
      messageEn: `${studentDisplayName} cancelled the lesson on ${targetLesson.date} at ${targetLesson.time || '12:00'}.${cancellationData.reason ? ` Reason: ${cancellationData.reason}` : ''}`,
      expiresInDays: 3,
      metadata: {
        studentId: authoritativeStudentId,
        studentName: studentDisplayName,
        date: targetLesson.date,
        time: targetLesson.time,
        reason: cancellationData.reason,
        notes: cancellationData.notes
      }
    });

    setIsCancelling(false);
    setCancellingLessonItem(null);

    // 6. Display professional cancellation success confirmation modal
    setCancellationSuccessModal({
      isOpen: true,
      lesson: targetLesson,
      reason: cancellationData.reason
    });
  };

  const loadFreshDataFromSheets = async (): Promise<{ bookings: Lesson[]; students: StudentRecord[] }> => {
    setIsLoadingFreshData(true);
    setErrorMessage('');
    
    let bookingsToUse: Lesson[] = lessons;
    let studentsToUse: StudentRecord[] = students;
    
    const webAppUrl = (import.meta as any).env.VITE_GOOGLE_SHEETS_WEB_APP_URL;
    const hasSheetsWebApp = webAppUrl && !webAppUrl.includes('AKfycby...');
    
    if (hasSheetsWebApp && !isOffline) {
      try {
        const schoolEmail = schoolSettings?.email || "trainer@drivingschool.nl";
        const response = await fetch(`${webAppUrl}?action=getTrainerDashboard&trainerEmail=${encodeURIComponent(schoolEmail)}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          if (result.data.bookings) {
            bookingsToUse = result.data.bookings.map((b: any) => {
              const localLesson = lessons.find(l => l.id === b.bookingId);
              return {
                id: b.bookingId,
                studentName: b.studentName,
                trainerName: b.trainerName || schoolSettings?.instructorName || "Instructor",
                date: b.date ? b.date.substring(0, 10) : getAmsterdamTodayStr(),
                time: b.time || "12:00",
                duration: b.duration || 1,
                price: b.price || 65,
                pickupLocation: b.pickup || b.pickupLocation || "Maastricht",
                status: b.status || "completed",
                payStatus: b.payStatus || (b.bookingId === 'l3' || b.bookingId === 'l4' || b.bookingId === 'LES-000003' || b.bookingId === 'LES-000004' ? 'paid' : 'unpaid'),
                trainerNotes: b.trainerNotes || b.feedback || localLesson?.trainerNotes || "",
                lessonNotes: b.lessonNotes || localLesson?.lessonNotes || "",
                instructorNotes: b.instructorNotes || localLesson?.instructorNotes || "",
                routePoints: b.routePoints || localLesson?.routePoints,
                distanceKm: b.distanceKm || localLesson?.distanceKm,
                elapsedTime: b.elapsedTime || localLesson?.elapsedTime
              };
            });
          }
        }
        
        const config = getSheetsConfig();
        if (config.spreadsheetId && (config.apiKey || config.accessToken)) {
          const loadedStudents = await loadStudentsFromGoogleSheet(config);
          if (loadedStudents && loadedStudents.length > 0) {
            studentsToUse = loadedStudents;
          }
        }
      } catch (err) {
        console.error("Failed to load fresh data from Google Sheets:", err);
      }
    }
    
    setFreshBookings(bookingsToUse);
    setFreshStudents(studentsToUse);
    setIsLoadingFreshData(false);
    return { bookings: bookingsToUse, students: studentsToUse };
  };

  useEffect(() => {
    if (isBooking) {
      loadFreshDataFromSheets();
    }
  }, [isBooking]);

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTimeSlot || !pickup) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // 1. Fetch the absolute latest, secure server time to prevent clock bypass
      await syncServerTime();

      // 2. Re-read fresh data from Google Sheets (Single Source of Truth)
      const { bookings: latestBookings, students: latestStudents } = await loadFreshDataFromSheets();
      
      // 3. Perform final verification before saving using Europe/Amsterdam rules
      const dateParts = selectedDate.split('-').map(Number); // [year, month, day] where month is 1-indexed
      const isPast = isPastDate(dateParts[0], dateParts[1] - 1, dateParts[2]);
      if (isPast) {
        alert(
          lang === 'ar'
            ? 'خطأ: لا يمكن حجز موعد في الماضي.'
            : lang === 'nl'
              ? 'Fout: Je kunt geen afspraak in het verleden boeken.'
              : 'Error: You cannot book a lesson in the past.'
        );
        setIsSubmitting(false);
        return;
      }
      
      if (isSlotPast(selectedDate, selectedTimeSlot)) {
        alert(
          lang === 'ar'
            ? 'خطأ: هذا الوقت قد مضى بالفعل اليوم. يرجى اختيار وقت آخر.'
            : lang === 'nl'
              ? 'Fout: Dit tijdstip is vandaag al verstreken. Kies een ander tijdstip.'
              : 'Error: This time slot has already passed today. Please choose another slot.'
        );
        setIsSubmitting(false);
        return;
      }
      
      if (isDateInVacationRange(selectedDate, schedule?.vacationMode)) {
        alert(getVacationBlockedMessage(lang, schedule?.vacationMode));
        setIsSubmitting(false);
        return;
      }
      
      const dateObj = new Date(selectedDate);
      const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayName = weekdayNames[dateObj.getDay()];
      if (!schedule.workingDays.includes(dayName)) {
        alert(
          lang === 'ar'
            ? 'عذراً، هذا اليوم ليس من ضمن أيام عمل المدرب.'
            : lang === 'nl'
              ? 'Sorry, deze dag maakt geen deel uit van de werkdagen van de instructeur.'
              : 'Sorry, this day is not among the instructor\'s working days.'
        );
        setIsSubmitting(false);
        return;
      }
      
      if (!isSlotInWorkingHours(selectedTimeSlot, duration)) {
        alert(
          lang === 'ar'
            ? 'عذراً، الموعد المحدد خارج ساعات العمل الرسمية للمدرب.'
            : lang === 'nl'
              ? 'Sorry, het geselecteerde tijdstip valt buiten de werktijden van de instructeur.'
              : 'Sorry, the selected slot is outside of the instructor\'s working hours.'
        );
        setIsSubmitting(false);
        return;
      }
      
      if (hasConflict(selectedDate, selectedTimeSlot, duration, latestBookings)) {
        alert(
          lang === 'ar'
            ? 'عذراً! هذا الموعد لم يعد متاحاً (تم حجزه من قبل شخص آخر أو يتداخل مع درس آخر). يرجى اختيار موعد آخر.'
            : lang === 'nl'
              ? 'Sorry! Dit tijdstip is niet meer beschikbaar (het is geboekt door iemand anders of overlapt met een andere les). Kies een ander tijdstip.'
              : 'Sorry! This time slot is no longer available (it has been booked by someone else or overlaps with another lesson). Please choose another slot.'
        );
        setIsSubmitting(false);
        return;
      }

      if (isSlotTooSoon(selectedDate, selectedTimeSlot)) {
        alert(
          lang === 'ar'
            ? `يجب إجراء الحجوزات قبل ${minNoticeHours} ساعة على الأقل من موعد الدرس.`
            : lang === 'nl'
              ? `Boekingen moeten minimaal ${minNoticeHours} uur van tevoren worden gemaakt.`
              : `Bookings must be made at least ${minNoticeHours} hours before the lesson.`
        );
        setIsSubmitting(false);
        return;
      }
      
      const activeName = currentUser?.name || "";
      const activeEmail = currentUser?.email || "";
      
      const authoritativeStudentId = currentUser?.studentId || currentUser?.id;

      const newLessonId = `LES-${String(Date.now()).slice(-6)}`;
      let newLesson: Lesson = {
        id: newLessonId,
        studentId: authoritativeStudentId,
        identityStatus: authoritativeStudentId ? 'canonical' : undefined,
        studentName: activeName,
        trainerName: schoolSettings?.instructorName || (schedule as any)?.trainerName || "Instructor",
        date: selectedDate,
        time: selectedTimeSlot,
        duration: duration,
        price: computedPrice,
        pickupLocation: pickup,
        status: 'upcoming',
        routePoints: [
          { lat: 52.3731, lng: 4.8926 },
          { lat: 52.3800, lng: 4.9000 },
          { lat: 52.3731, lng: 4.8926 }
        ]
      };

      const sheetsConfig = getSheetsConfig();

      // Execute full workflow (Google Calendar Event + Google Sheets sync + Notifications + Email)
      try {
        const wfResult = await executeStudentBookingWorkflow({
          booking: newLesson,
          student: {
            id: authoritativeStudentId || 'ST-000001',
            studentId: authoritativeStudentId,
            name: activeName,
            email: activeEmail,
            phone: currentUser?.phone || ''
          } as StudentRecord,
          schoolSettings: schoolSettings || undefined,
          allLessons: lessons,
          allStudents: latestStudents,
          allTransactions: transactions,
          lang,
          accessToken: sheetsConfig.accessToken,
          spreadsheetId: sheetsConfig.spreadsheetId
        });

        if (wfResult.data) {
          newLesson = wfResult.data;
        }
      } catch (wfErr) {
        console.warn("Workflow booking warning:", wfErr);
      }
      
      const webAppUrl = (import.meta as any).env.VITE_GOOGLE_SHEETS_WEB_APP_URL;
      const hasSheetsWebApp = webAppUrl && !webAppUrl.includes('AKfycby...');
      
      if (hasSheetsWebApp && !isOffline) {
        try {
          const studentIdParam = authoritativeStudentId || currentUser?.studentId || currentUser?.id || "ST-000001";
          await fetch(webAppUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              action: "createBooking",
              studentId: studentIdParam,
              trainerId: "TR-201",
              date: selectedDate,
              time: selectedTimeSlot,
              duration: duration,
              pickupLocation: pickup
            })
          });
        } catch (postErr) {
          console.warn("Failed to submit POST to Apps Script:", postErr);
        }
      }
      
      setLessons([newLesson, ...lessons]);
      setLastBookedLesson(newLesson);
      setBookingSuccess(true);
      
      sendAppEmail(activeName, 'booking', {
        date: selectedDate,
        time: selectedTimeSlot,
        duration: duration,
        pickupLocation: pickup,
        price: computedPrice
      });
      
    } catch (err) {
      console.error("Booking submission failed:", err);
      alert(lang === 'ar' ? 'حدث خطأ أثناء معالجة الحجز. يرجى المحاولة مرة أخرى.' : 'An error occurred while processing the booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetBooking = () => {
    setIsBooking(false);
    setSelectedDate('');
    setSelectedTimeSlot('');
    setDuration(Number(schoolSettings?.defaultLessonDuration || 1));
    setPickup('');
    setBookingSuccess(false);
    setLastBookedLesson(null);
    setErrorMessage('');
  };

  // Helper for highlighting date availability visually
  const currentDaysList = [
    { label: "Today", value: "2026-06-23", status: "unavailable", wday: "TU" },
    { label: "Wed", value: "2026-06-24", status: "available", wday: "WE" },
    { label: "Thu", value: "2026-06-25", status: "available", wday: "TH" },
    { label: "Fri", value: "2026-06-26", status: "available", wday: "FR" },
    { label: "Sat", value: "2026-06-27", status: "unavailable", wday: "SA" },
    { label: "Sun", value: "2026-06-28", status: "unavailable", wday: "SU" },
    { label: "Mon", value: "2026-06-29", status: "available", wday: "MO" },
  ];

  const timeSlots = ["09:00", "11:00", "14:00", "16:00"];

  return (
    <div className="space-y-6 pb-20">
      
      {/* Top Banner Control */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">{t.lessons}</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'ar' 
              ? `إدارة الحجوزات الحالية أو حجز موعد جديد مع ${instructorDisplayName}` 
              : lang === 'nl' 
                ? `Beheer bestaande boekingen of reserveer een plekje bij ${instructorDisplayName}` 
                : `Manage existing bookings or claim a slot with ${instructorDisplayName}`}
          </p>
        </div>

        {!isBooking && (
          <button
            id="start-booking-flow"
            onClick={() => {
              const defaultDur = Number(schoolSettings?.defaultLessonDuration) || 1;
              setDuration(defaultDur);
              setIsBooking(true);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{t.bookLesson}</span>
          </button>
        )}
      </div>

      {isBooking ? (
        <div id="booking-container-card" className="p-6 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl shadow-xl space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="flex justify-between items-center">
            <h2 className="text-base font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-wider">{t.bookLessonHeader}</h2>
            <button 
              id="exit-booking-btn"
              onClick={handleResetBooking}
              className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 rounded-lg text-xs font-bold cursor-pointer"
            >
              {lang === 'ar' ? 'إلغاء' : lang === 'nl' ? 'Annuleren' : 'Cancel'}
            </button>
          </div>

          {!bookingSuccess ? (
            <form onSubmit={handleBookSubmit} className="space-y-6">
              {/* Active Vacation Informational Banner - Compact, elegant & positioned above calendar */}
              {isVacationModeActive(schedule?.vacationMode) && (
                <div 
                  id="instructor-vacation-banner"
                  className="w-full px-4 py-3 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 dark:border-amber-500/30 rounded-2xl flex items-center gap-3 text-amber-950 dark:text-amber-100 shadow-xs"
                  dir={lang === 'ar' ? 'rtl' : 'ltr'}
                >
                  <div className="h-8 w-8 rounded-xl bg-amber-500/20 dark:bg-amber-500/25 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Palmtree className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black tracking-tight text-amber-900 dark:text-amber-200">
                        {lang === 'ar' 
                          ? 'المدرب غير متاح' 
                          : lang === 'nl' 
                          ? 'Instructeur niet beschikbaar' 
                          : 'Instructor Unavailable'}
                      </span>
                      {schedule?.vacationMode?.note && (
                        <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                          ({schedule.vacationMode.note})
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-amber-700/90 dark:text-amber-300/90 leading-tight mt-0.5">
                      {lang === 'ar' ? (
                        <>
                          المدرب في إجازة من{' '}
                          <span className="font-bold font-mono">{formatVacationDate(schedule?.vacationMode?.startDate || '', 'ar')}</span> إلى{' '}
                          <span className="font-bold font-mono">{formatVacationDate(schedule?.vacationMode?.endDate || '', 'ar')}</span>.{' '}
                          يرجى اختيار تاريخ خارج هذه الفترة.
                        </>
                      ) : lang === 'nl' ? (
                        <>
                          De instructeur is met vakantie van{' '}
                          <span className="font-bold font-mono">{formatVacationDate(schedule?.vacationMode?.startDate || '', 'nl')}</span> t/m{' '}
                          <span className="font-bold font-mono">{formatVacationDate(schedule?.vacationMode?.endDate || '', 'nl')}</span>.{' '}
                          Kies een datum buiten deze periode.
                        </>
                      ) : (
                        <>
                          The instructor is on vacation from{' '}
                          <span className="font-bold font-mono">{formatVacationDate(schedule?.vacationMode?.startDate || '', 'en')}</span> to{' '}
                          <span className="font-bold font-mono">{formatVacationDate(schedule?.vacationMode?.endDate || '', 'en')}</span>.{' '}
                          Please select a date outside this period.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Custom High-Fidelity Month Calendar */}
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-zinc-950 p-3 rounded-2xl border border-slate-100/10 dark:border-zinc-850/50">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.selectDate}</label>
                    <span className="text-sm font-black text-slate-800 dark:text-white mt-1">
                      {selectedDate ? (
                        <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping shrink-0" />
                          {selectedDate}
                        </span>
                      ) : (
                        <span className="text-amber-500 text-xs font-bold">{lang === 'ar' ? 'الرجاء اختيار تاريخ الدرس' : lang === 'nl' ? 'Kies een datum' : 'Pick a Date'}</span>
                      )}
                    </span>
                  </div>

                  {/* Calendar Month Navigation Header */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (displayedYear === 2026 && displayedMonth <= 5) return;
                        if (displayedMonth === 0) {
                          setDisplayedMonth(11);
                          setDisplayedYear(prev => prev - 1);
                        } else {
                          setDisplayedMonth(prev => prev - 1);
                        }
                      }}
                      disabled={displayedYear === 2026 && displayedMonth <= 5}
                      className="p-1.5 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-30 border border-slate-100 dark:border-zinc-805/40 cursor-pointer flex items-center justify-center transition"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-black text-slate-700 dark:text-zinc-200 min-w-[100px] text-center font-mono">
                      {
                        lang === 'ar' ? `${["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"][displayedMonth]} ${displayedYear}`
                        : lang === 'nl' ? `${["Januari", "Februari", "Maart", "April", "Mei", "Juni", "Juli", "Augustus", "September", "Oktober", "November", "December"][displayedMonth]} ${displayedYear}`
                        : `${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][displayedMonth]} ${displayedYear}`
                      }
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (displayedMonth === 11) {
                          setDisplayedMonth(0);
                          setDisplayedYear(prev => prev + 1);
                        } else {
                          setDisplayedMonth(prev => prev + 1);
                        }
                      }}
                      className="p-1.5 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-100 dark:border-zinc-805/40 cursor-pointer flex items-center justify-center transition"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Weekdays Grid Headers */}
                <div className="grid grid-cols-7 gap-1 text-center font-mono font-extrabold text-[10px] text-slate-450 dark:text-zinc-500 tracking-wider">
                  {(lang === 'ar' ? ['إثن', 'ثلا', 'أرب', 'خميس', 'جمع', 'سبت', 'أحد'] : lang === 'nl' ? ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']).map(wd => (
                    <div key={wd} className="py-1 uppercase">{wd}</div>
                  ))}
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 gap-1.5 border border-slate-100 dark:border-zinc-800 p-2.5 rounded-2xl bg-white dark:bg-zinc-950/20">
                  {/* Render Blanks */}
                  {Array.from({ length: (new Date(displayedYear, displayedMonth, 1).getDay() === 0 ? 6 : new Date(displayedYear, displayedMonth, 1).getDay() - 1) }).map((_, i) => (
                    <div key={`blank-${i}`} className="p-2 opacity-0 select-none pointer-events-none" />
                  ))}

                  {/* Render Month Days */}
                  {Array.from({ length: new Date(displayedYear, displayedMonth + 1, 0).getDate() }).map((_, i) => {
                    const dayNum = i + 1;
                    const dateObj = new Date(displayedYear, displayedMonth, dayNum);
                    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
                    const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                    const dayName = weekdayNames[dayOfWeek];
                    const isTrainerWorkingDay = schedule?.workingDays?.includes(dayName) ?? (dayOfWeek !== 0 && dayOfWeek !== 6);
                    
                    const isPast = isPastDate(displayedYear, displayedMonth, dayNum);
                    const dateString = `${displayedYear}-${String(displayedMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const isVacationDay = isDateInVacationRange(dateString, schedule?.vacationMode);
                    const isSelected = selectedDate === dateString;
                    const isToday = dateString === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

                    let btnClass = "";
                    if (isPast) {
                      btnClass = "bg-slate-50 dark:bg-zinc-900/10 text-slate-300 dark:text-zinc-750 cursor-not-allowed border-transparent line-through opacity-30 text-xs";
                    } else if (isVacationDay) {
                      btnClass = "bg-amber-500/10 dark:bg-amber-950/20 border-amber-500/30 text-amber-700 dark:text-amber-400 cursor-not-allowed text-xs relative overflow-hidden opacity-80 font-bold";
                    } else if (!isTrainerWorkingDay) {
                      btnClass = "bg-red-500/5 dark:bg-red-950/5 border-transparent text-red-400 dark:text-red-500/40 cursor-not-allowed text-xs relative overflow-hidden opacity-45";
                    } else if (isSelected) {
                      btnClass = "bg-blue-600 border-blue-600 text-white font-extrabold shadow-md shadow-blue-500/20 scale-102 z-10 text-xs";
                    } else if (isToday) {
                      btnClass = "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-500 font-extrabold hover:bg-amber-500/20 text-xs";
                    } else {
                      btnClass = "bg-white dark:bg-zinc-900 border-slate-100/70 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-blue-500 hover:bg-blue-50/10 cursor-pointer text-xs font-bold";
                    }

                    return (
                      <button
                        key={`day-${dayNum}`}
                        type="button"
                        disabled={isPast || !isTrainerWorkingDay || isVacationDay}
                        onClick={() => {
                          if (isVacationDay) {
                            alert(getVacationBlockedMessage(lang, schedule?.vacationMode));
                            return;
                          }
                          setSelectedDate(dateString);
                        }}
                        className={`h-11 rounded-xl border flex flex-col items-center justify-center transition-all duration-150 ${btnClass}`}
                        title={
                          isVacationDay
                            ? (lang === 'ar' ? `إجازة للمدرب (${schedule?.vacationMode?.note || 'غير متاح'})` : lang === 'nl' ? `Instructeur met vakantie (${schedule?.vacationMode?.note || 'Niet beschikbaar'})` : `Instructor on vacation (${schedule?.vacationMode?.note || 'Unavailable'})`)
                            : !isTrainerWorkingDay
                            ? (lang === 'ar' ? 'عطلة - مغلق' : 'Weekend - Closed')
                            : dateString
                        }
                      >
                        <span className="text-xs font-black">{dayNum}</span>
                        {isToday && !isVacationDay && (
                          <span className="text-[7px] uppercase font-bold text-amber-500 tracking-tighter block leading-none mt-0.5 whitespace-nowrap">
                            {lang === 'ar' ? 'اليوم' : 'Today'}
                          </span>
                        )}
                        {isVacationDay && (
                          <span className="text-[7px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-tighter block leading-none mt-0.5 whitespace-nowrap">
                            {lang === 'ar' ? 'إجازة' : lang === 'nl' ? 'Vakantie' : 'Vacation'}
                          </span>
                        )}
                        {!isPast && !isVacationDay && !isTrainerWorkingDay && (
                          <span className="text-[7px] uppercase font-semibold text-red-400/85 dark:text-red-550 tracking-tighter block leading-none mt-0.5 whitespace-nowrap">
                            {lang === 'ar' ? 'عطلة' : 'Closed'}
                          </span>
                        )}
                        {!isPast && !isVacationDay && isTrainerWorkingDay && !isToday && !isSelected && (
                          <span className="text-[7px] uppercase font-bold text-blue-500/70 tracking-tighter block leading-none mt-0.5 whitespace-nowrap">
                            {lang === 'ar' ? 'متاح' : 'Free'}
                          </span>
                        )}
                        {isSelected && !isVacationDay && (
                          <span className="text-[7px] uppercase font-black text-white tracking-tighter block leading-none mt-0.5 whitespace-nowrap">
                            {lang === 'ar' ? 'محدد' : 'Selected'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {/* Visual Legend */}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center items-center py-2 px-3 bg-slate-50 dark:bg-zinc-950 text-[9px] font-bold text-slate-400 dark:text-zinc-500 rounded-xl" dir="ltr">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                    <span>{lang === 'ar' ? 'محدد' : lang === 'nl' ? 'Geselecteerd' : 'Selected'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-white dark:bg-zinc-900 border border-slate-200" />
                    <span>{lang === 'ar' ? 'يوم متاح' : lang === 'nl' ? 'Beschikbaar' : 'Free Day'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span>{lang === 'ar' ? 'إجازة' : lang === 'nl' ? 'Vakantie' : 'Vacation'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-red-400/20 border border-red-500/10" />
                    <span>{lang === 'ar' ? 'نهاية الأسبوع (مغلق)' : lang === 'nl' ? 'Weekend (Geen lessen)' : 'Weekend (No Lessons)'}</span>
                  </div>
                </div>
                
                <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                  <Info className="h-3 w-3 inline shrink-0 text-blue-500" />
                  <span>{lang === 'ar' ? 'ساعات التدريب المتاحة: الإثنين إلى الجمعة، من 08:00 صباحاً حتى 18:00 مساءً.' : 'Available working days: Monday through Friday, 08:00 - 18:00.'}</span>
                </p>
              </div>

              {/* Enhanced Interactive Categorized Time Selector */}
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 dark:text-zinc-400 uppercase tracking-wider block flex items-center justify-between">
                  <span>{t.selectTime}</span>
                  {selectedTimeSlot ? (
                    <span 
                      className="text-blue-600 dark:text-blue-400 font-mono tracking-tight font-black bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-lg border border-blue-500/10 text-xs not-italic inline-block"
                      dir="ltr"
                    >
                      {selectedTimeSlot}
                    </span>
                  ) : (
                    <span className="text-amber-500 normal-case font-bold">{lang === 'ar' ? 'الرجاء اختيار التوقيت' : lang === 'nl' ? 'Kies een tijdstip' : 'Please select a slot'}</span>
                  )}
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {bookingTimeSlots.map(slot => {
                    const isSelected = selectedTimeSlot === slot.time;
                    const isMorning = slot.p === 'morning';
                    const isAfternoon = slot.p === 'afternoon';
                    
                    const isPastSlot = selectedDate ? isSlotPast(selectedDate, slot.time) : false;
                    const inWorkingHours = isSlotInWorkingHours(slot.time, duration);
                    const isConflicted = selectedDate ? hasConflict(selectedDate, slot.time, duration, freshBookings) : false;
                    const isTooSoonSlot = selectedDate ? isSlotTooSoon(selectedDate, slot.time) : false;
                    const isSlotDisabled = isPastSlot || !inWorkingHours || isConflicted || isTooSoonSlot;
                    
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={isSlotDisabled}
                        onClick={() => setSelectedTimeSlot(slot.time)}
                        className={`p-3 rounded-2xl border text-start flex items-center justify-between gap-2 transition-all duration-200 ${
                          isSlotDisabled
                            ? 'bg-slate-100 dark:bg-zinc-900/40 border-transparent text-slate-400 dark:text-zinc-600 cursor-not-allowed opacity-50'
                            : isSelected
                              ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/10 scale-[1.01] ring-2 ring-blue-500/50 cursor-pointer'
                              : 'bg-slate-50 dark:bg-zinc-950 border-slate-100 dark:border-zinc-900 text-slate-700 dark:text-zinc-300 hover:border-blue-400 hover:bg-slate-100/50 dark:hover:bg-zinc-900/40 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className={`p-1.5 rounded-lg shrink-0 ${
                            isSelected 
                              ? 'bg-white/20 text-white' 
                              : isMorning 
                                ? 'bg-amber-500/10 text-amber-500' 
                                : isAfternoon 
                                  ? 'bg-orange-500/10 text-orange-400' 
                                  : 'bg-indigo-500/10 text-indigo-400'
                          }`}>
                            {isMorning ? (
                              <Sunrise className="h-4 w-4" />
                            ) : isAfternoon ? (
                              <Sun className="h-4 w-4" />
                            ) : (
                              <Sunset className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex flex-col justify-center min-w-0 text-start flex-1">
                            <span 
                              className="text-xs font-black font-mono tracking-tight leading-tight mb-0.5 not-italic block"
                              dir="ltr"
                            >
                              {slot.time}
                            </span>
                            <span className={`text-[9px] font-bold leading-tight truncate whitespace-nowrap block ${isSelected ? 'text-white/80' : 'text-slate-400 dark:text-zinc-500'}`}>
                              {lang === 'ar' ? slot.tagAr : lang === 'nl' ? slot.tagNl : slot.tag}
                            </span>
                          </div>
                        </div>

                        {isSlotDisabled ? (
                          <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 shrink-0 whitespace-nowrap">
                            {isConflicted 
                              ? (lang === 'ar' ? 'محجوز' : lang === 'nl' ? 'Geboekt' : 'Booked') 
                              : isTooSoonSlot
                                ? (lang === 'ar' ? `< ${minNoticeHours}س مهلة` : lang === 'nl' ? `< ${minNoticeHours}u termijn` : `< ${minNoticeHours}h notice`)
                                : (lang === 'ar' ? 'غير متاح' : lang === 'nl' ? 'Niet beschikbaar' : 'Unavailable')}
                          </span>
                        ) : isSelected ? (
                          <div className="h-5 w-5 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0">
                            <Check className="h-3 w-3 font-semibold" />
                          </div>
                        ) : (
                          <span className="text-[10px] font-semibold text-blue-500 dark:text-blue-400 shrink-0 whitespace-nowrap">{lang === 'ar' ? 'اختر' : 'Book'}</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedDate && selectedTimeSlot && isSlotTooSoon(selectedDate, selectedTimeSlot) && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-bold flex items-center gap-2 mt-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                    <span>
                      {lang === 'ar'
                        ? `يجب إجراء الحجوزات قبل ${minNoticeHours} ساعة على الأقل من موعد الدرس.`
                        : lang === 'nl'
                          ? `Boekingen moeten minimaal ${minNoticeHours} uur van tevoren worden gemaakt.`
                          : `Bookings must be made at least ${minNoticeHours} hours before the lesson.`}
                    </span>
                  </div>
                )}
              </div>

              {/* Duration Segmented Picker */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{t.duration}</label>
                <div className="flex bg-slate-100/80 dark:bg-zinc-950 p-1 rounded-xl border border-slate-200/40 dark:border-zinc-900 gap-1">
                  {availableDurationOptions.map(dur => (
                    <button
                      key={dur.value}
                      type="button"
                      onClick={() => setDuration(dur.value)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                        duration === dur.value 
                          ? 'bg-white dark:bg-zinc-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/50 dark:border-zinc-700/50 font-bold' 
                          : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-white/40 dark:hover:bg-zinc-800/10'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lesson Start Location */}
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 block mb-1.5">{t.pickupLocation}</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder={lang === 'ar' ? 'أدخل مكان بدء الدرس' : lang === 'nl' ? 'Voer startlocatie in' : 'Enter lesson start location'}
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    className="w-full h-8 pl-10 pr-3 text-xs font-semibold bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Instant Automatic Pricing Display */}
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-500/10 rounded-2xl flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    {lang === 'ar' ? 'تفاصيل السعر' : lang === 'nl' ? 'Prijsopbouw' : 'Price Breakdown'}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {lang === 'ar' 
                      ? `${duration} ${duration === 1 ? 'ساعة' : 'ساعات'} × €${LESSON_PRICE_PER_HOUR}/ساعة` 
                      : lang === 'nl' 
                        ? `${duration} uur x €${LESSON_PRICE_PER_HOUR}/uur tarief` 
                        : `${duration} ${duration === 1 ? 'Hour' : 'Hours'} x €${LESSON_PRICE_PER_HOUR}/Hour rate`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-blue-600 dark:text-blue-400">€{computedPrice}</p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !selectedDate || !selectedTimeSlot || !pickup}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:dark:bg-zinc-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition shadow-lg tracking-wider pointer-events-auto flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent inline-block"></span>
                    <span>{lang === 'ar' ? 'جاري التحقق والتأكيد من Google Sheets...' : lang === 'nl' ? 'Controleren met Google Sheets...' : 'Verifying with Google Sheets...'}</span>
                  </>
                ) : (
                  <span>{t.confirmBooking}</span>
                )}
              </button>

            </form>
          ) : (
            <div className="text-center py-8 space-y-6">
              <div className="inline-flex p-4 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full">
                <CheckCircle2 className="h-10 w-10 animate-scale" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black dark:text-zinc-100">{t.bookingSuccess}</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">{t.emailSent}</p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  id="return-to-lessons-btn"
                  onClick={handleResetBooking}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold rounded-xl cursor-pointer transition"
                >
                  {lang === 'ar' ? 'العودة إلى سجل الدروس' : lang === 'nl' ? 'Terug naar lessen' : 'Go back to Lessons'}
                </button>
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Tabs Filter Selector */}
          <div className="flex bg-slate-100/80 dark:bg-zinc-900/80 p-1 rounded-xl max-w-md border border-slate-200/40 dark:border-zinc-800/40" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {(['upcoming', 'completed', 'cancelled'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  activeTab === tab
                    ? 'bg-white dark:bg-zinc-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/50 dark:border-zinc-700/50 font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-white/40 dark:hover:bg-zinc-800/10'
                }`}
              >
                {tab === 'upcoming' ? t.upcomingLessons : tab === 'completed' ? t.completedLessons : t.cancelled}
              </button>
            ))}
          </div>

          {/* List display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {filteredLessons.length > 0 ? (
              filteredLessons.map(lessonItem => (
                <div 
                  key={lessonItem.id} 
                  className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-xs space-y-4 hover:translate-y-[-1px] transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="p-1 px-2 text-[10px] font-bold rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200/60 dark:border-zinc-700/60">
                          {formatDisplayLessonNumber(lessonItem, lessons, lang)}
                        </span>
                        <span className="p-1 px-2 text-[10px] font-bold rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          {lessonItem.duration === 1 
                            ? t.oneHour 
                            : lessonItem.duration === 2 
                              ? t.twoHours 
                              : `${lessonItem.duration} ${lang === 'nl' ? 'uur' : lang === 'ar' ? 'ساعة' : 'hours'}`}
                        </span>
                        {lessonItem.status === 'upcoming' && (
                          <span className="p-1 px-2 text-[10px] font-bold rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/15 flex items-center gap-1">
                            <Clock className="h-3 w-3 shrink-0" />
                            {t.upcomingLessons}
                          </span>
                        )}
                        {lessonItem.status === 'completed' && (
                          <span className="p-1 px-2 text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 shrink-0" />
                            {t.completedLessons}
                          </span>
                        )}
                        {lessonItem.status === 'cancelled' && (
                          <span className="p-1 px-2 text-[10px] font-bold rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/15 flex items-center gap-1">
                            <XCircle className="h-3 w-3 shrink-0" />
                            {t.cancelled}
                          </span>
                        )}
                        {/* Payment Status Badge - Only for Completed Lessons */}
                        {lessonItem.status === 'completed' && (() => {
                          const isPaid = (lessonItem.payStatus || (lessonItem.id === 'l3' || lessonItem.id === 'l4' || lessonItem.id === 'LES-000003' || lessonItem.id === 'LES-000004' ? 'paid' : 'unpaid')) === 'paid';
                          const payMethodLabel = lessonItem.payMethod 
                            ? (lessonItem.payMethod === 'cash' ? (lang === 'ar' ? 'نقداً' : 'Cash')
                              : lessonItem.payMethod === 'wallet' ? (lang === 'ar' ? 'المحفظة' : 'Wallet')
                              : lessonItem.payMethod === 'transfer' ? (lang === 'ar' ? 'تحويل' : 'Transfer')
                              : (lang === 'ar' ? 'بطاقة' : 'Card'))
                            : '';

                          const payLabel = isPaid 
                            ? (lang === 'ar' ? `مدفوع${payMethodLabel ? ` (${payMethodLabel})` : ''}` : lang === 'nl' ? `Betaald${payMethodLabel ? ` (${payMethodLabel})` : ''}` : `Paid${payMethodLabel ? ` (${payMethodLabel})` : ''}`) 
                            : (lang === 'ar' ? 'غير مدفوع' : lang === 'nl' ? 'Niet betaald' : 'Unpaid');

                          return (
                            <span className={`p-1 px-2 text-[10px] font-bold rounded-md border flex items-center gap-1 ${
                              isPaid 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/15' 
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/15'
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isPaid ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                              {payLabel}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden font-bold text-[9px] text-slate-600 dark:text-zinc-300 shrink-0 border border-slate-200 dark:border-zinc-700">
                          {getTrainerPhoto(lessonItem.trainerName) ? (
                            <img src={getTrainerPhoto(lessonItem.trainerName)!} alt={lessonItem.trainerName} className="w-full h-full object-cover" />
                          ) : (
                            <span>{cleanTrainerName(lessonItem.trainerName).split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                          {lang === 'ar' ? `المدرب: ${cleanTrainerName(lessonItem.trainerName)}` : lang === 'nl' ? `Instructeur: ${cleanTrainerName(lessonItem.trainerName)}` : `Instructor: ${cleanTrainerName(lessonItem.trainerName)}`}
                        </h4>
                      </div>
                    </div>
                    <span className="text-base font-extrabold text-slate-700 dark:text-zinc-200">
                      €{lessonItem.price}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 py-2 border-t border-b border-dashed border-slate-100 dark:border-zinc-800 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">{t.date}</p>
                      <p className="font-bold text-slate-700 dark:text-zinc-300">{lessonItem.date}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">{t.selectTime}</p>
                      <p className="font-bold text-slate-700 dark:text-zinc-300">{lessonItem.time}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase">{t.pickupLocation}</p>
                    <p className="text-xs font-medium text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                      {lessonItem.pickupLocation}
                    </p>
                  </div>

                  {/* Dynamic Student Cancellation Policy Status Card & Action Button */}
                  {lessonItem.status === 'upcoming' && (() => {
                    const [lHours, lMins] = (lessonItem.time || '12:00').split(':').map(Number);
                    const lessonDateObj = new Date(`${lessonItem.date}T${String(lHours).padStart(2, '0')}:${String(lMins || 0).padStart(2, '0')}:00`);
                    const deadlineHours = schoolSettings?.cancellationDeadlineHours ?? 24;
                    const cutoffTimeMs = lessonDateObj.getTime() - (deadlineHours * 60 * 60 * 1000);
                    const cutoffDate = new Date(cutoffTimeMs);
                    const now = getAmsterdamNow();
                    const isCancellationAllowed = now.getTime() < cutoffTimeMs;

                    return (
                      <div className="pt-2 space-y-2">
                        {isCancellationAllowed ? (
                          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl space-y-1 text-xs">
                            <div className="flex items-center gap-1.5 font-bold">
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                              <span>
                                {lang === 'ar' ? 'إمكانية الإلغاء متاحة حتى:' : lang === 'nl' ? 'Annuleren mogelijk tot:' : 'Cancellation available until:'}
                              </span>
                            </div>
                            <p className="font-black text-xs text-emerald-800 dark:text-emerald-300 rtl:pr-5 ltr:pl-5 font-mono">
                              {formatCutoffDateTime(cutoffDate, lang)}
                            </p>
                          </div>
                        ) : (
                          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-xl space-y-1 text-xs font-semibold">
                            <div className="flex items-start gap-1.5 font-bold">
                              <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                              <span>
                                {lang === 'ar'
                                  ? 'الإلغاء عبر الإنترنت لم يعد متاحاً. يرجى التواصل مع المدرب الخاص بك إذا كنت بحاجة إلى مساعدة.'
                                  : lang === 'nl'
                                    ? 'Online annuleren is niet meer mogelijk. Neem contact op met je instructeur voor hulp.'
                                    : 'Online cancellation is no longer available. Please contact your instructor if you need assistance.'}
                              </span>
                            </div>
                          </div>
                        )}

                        {isCancellationAllowed && (
                          <button
                            type="button"
                            onClick={() => handleStudentCancelLesson(lessonItem.id)}
                            className="w-full py-2.5 px-3 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
                          >
                            <XCircle className="h-4 w-4 shrink-0 text-rose-500" />
                            <span>{lang === 'ar' ? 'إلغاء الدرس' : lang === 'nl' ? 'Les Annuleren' : 'Cancel Lesson'}</span>
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  {lessonItem.status === 'cancelled' && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300">
                        <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span>{lang === 'ar' ? 'سبب الإلغاء:' : lang === 'nl' ? 'Reden van annulering:' : 'Cancellation reason:'}</span>
                        <span className="font-extrabold">{lessonItem.cancellationReason || (lang === 'ar' ? 'إلغاء تنظيمي' : 'Administrative cancellation')}</span>
                      </div>
                      {lessonItem.cancellationNotes && (
                        <p className="text-xs text-rose-600/90 dark:text-rose-300/80 italic pl-5">
                          "{lessonItem.cancellationNotes}"
                        </p>
                      )}
                      {lessonItem.cancellationDate && (
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                          {lang === 'ar' ? 'تاريخ الإلغاء:' : 'Cancelled on:'} {lessonItem.cancellationDate} {lessonItem.cancellationTime ? `@ ${lessonItem.cancellationTime}` : ''}
                        </p>
                      )}
                    </div>
                  )}

                  {/* INSTRUCTOR EVALUATION SECTION - Only shown if evaluation/notes exist */}
                  {(() => {
                    const evalRating = lessonItem.performanceRating || (
                      lessonItem.performanceEvaluation === 'excellent' ? 5 :
                      lessonItem.performanceEvaluation === 'good' ? 3 :
                      lessonItem.performanceEvaluation === 'needs_improvement' ? 1 : 0
                    );

                    const hasEvaluation = lessonItem.status === 'completed' && (
                      evalRating > 0 || 
                      Boolean(lessonItem.performanceEvaluation) || 
                      Boolean(lessonItem.instructorNotes) || 
                      Boolean(lessonItem.lessonNotes)
                    );

                    if (!hasEvaluation) return null;

                    const ratingLabel = evalRating === 5 || lessonItem.performanceEvaluation === 'excellent'
                      ? (lang === 'ar' ? 'ممتاز' : lang === 'nl' ? 'Uitstekend' : 'Excellent')
                      : evalRating === 3 || lessonItem.performanceEvaluation === 'good'
                      ? (lang === 'ar' ? 'جيد' : lang === 'nl' ? 'Goed' : 'Good')
                      : (lang === 'ar' ? 'يحتاج تحسين' : lang === 'nl' ? 'Verbetering nodig' : 'Needs Improvement');

                    return (
                      <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-zinc-800/80 pb-2.5">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                              {lang === 'ar' ? 'تقييم الأداء والملاحظات' : lang === 'nl' ? 'Les Beoordeling & Feedback' : 'Instructor Evaluation'}
                            </span>
                          </div>

                          {/* Performance Rating Badge */}
                          {evalRating > 0 && (
                            <span className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 ${
                              evalRating === 5 || lessonItem.performanceEvaluation === 'excellent'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : evalRating === 3 || lessonItem.performanceEvaluation === 'good'
                                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            }`}>
                              {ratingLabel}
                            </span>
                          )}
                        </div>

                        {/* Topics Covered */}
                        {lessonItem.lessonNotes && (
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                              {lang === 'ar' ? 'مواضيع الحصة:' : lang === 'nl' ? 'Onderwerpen:' : 'Topics Covered:'}
                            </p>
                            <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                              {lessonItem.lessonNotes}
                            </p>
                          </div>
                        )}

                        {/* Instructor Feedback / Notes */}
                        {(lessonItem.instructorNotes || lessonItem.trainerNotes) && (
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                              {lang === 'ar' ? 'توجيهات المدرب:' : lang === 'nl' ? 'Instructeur Feedback:' : 'Instructor Notes:'}
                            </p>
                            <p className="text-xs font-medium text-slate-600 dark:text-zinc-300 italic">
                              "{lessonItem.instructorNotes || lessonItem.trainerNotes}"
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ))
            ) : (
              <div className="col-span-1 md:col-span-2 text-center py-12 bg-white dark:bg-zinc-900/40 rounded-3xl border border-slate-100 dark:border-zinc-800/80">
                <Calendar className="h-8 w-8 text-slate-400 mx-auto opacity-60 mb-2" />
                <p className="text-xs text-slate-400">
                  {lang === 'ar' ? 'لا توجد دروس مطابقة لهذا التصنيف.' : lang === 'nl' ? 'Geen lessen gevonden voor dit filter.' : 'No lessons found for this selection.'}
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Student Cancel Lesson Modal */}
      <React.Suspense fallback={null}>
        <CancelLessonModal
          isOpen={!!cancellingLessonItem}
          onClose={() => setCancellingLessonItem(null)}
          onConfirm={handleConfirmStudentCancellation}
          lesson={cancellingLessonItem}
          lang={lang}
          userRole="student"
        />
      </React.Suspense>

      {/* Cancellation Success Confirmation Modal */}
      {cancellationSuccessModal?.isOpen && cancellationSuccessModal.lesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="h-8 w-8 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {lang === 'ar' ? 'تم إلغاء الدرس بنجاح' : lang === 'nl' ? 'Les Succesvol Geannuleerd' : 'Lesson Cancelled Successfully'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                {cancellationSuccessModal.lesson.date} @ {cancellationSuccessModal.lesson.time}
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-700/60 rounded-2xl text-xs space-y-2 text-start">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span>{lang === 'ar' ? 'تم تحديث حالة الدرس في بوابة الطالب' : lang === 'nl' ? 'Lesstatus bijgewerkt in leerlingenportaal' : 'Lesson status updated in Student Portal'}</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span>{lang === 'ar' ? 'تم تحديث لوحة تحكم المدرب فوراً' : lang === 'nl' ? 'Direct bijgewerkt op instructeursdashboard' : 'Updated on Instructor Dashboard'}</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span>{lang === 'ar' ? 'تم تحرير الموعد وأصبح متاحاً للحجز مجدداً' : lang === 'nl' ? 'Tijdstip is weer vrijgegeven voor nieuwe boekingen' : 'Time slot released & available for booking'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCancellationSuccessModal(null)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
            >
              {lang === 'ar' ? 'حسناً، فهمت' : lang === 'nl' ? 'Begrepen' : 'Got it'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

const StudentLessons = React.memo(StudentLessonsComponent);
export default StudentLessons;
