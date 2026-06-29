export type Language = 'en' | 'nl' | 'ar';
export type UserRole = 'student' | 'trainer';

export interface Lesson {
  id: string;
  studentName: string;
  trainerName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: 1 | 2; // Hours
  price: number;
  pickupLocation: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  routePoints?: { lat: number; lng: number; timestamp?: number }[];
  elapsedTime?: string;
  distanceKm?: number;
  trainerNotes?: string;
  lessonNotes?: string;
  instructorNotes?: string;
  reviewed?: boolean;
  payStatus?: 'paid' | 'unpaid';
  payMethod?: string;
  invoiceId?: string;
  reminderSent?: boolean;
  reminderLink?: string;
  reminderNotes?: string;
}

export interface WalletTransaction {
  id: string;
  date: string;
  type: 'deposit' | 'payment' | 'adjustment';
  amount: number;
  description: string;
  invoiceId?: string;
  studentName?: string;
  trainerName?: string;
}

export interface TheoryLesson {
  id: string;
  titleEn: string;
  titleNl: string;
  titleAr: string;
  category: 'signs' | 'priority' | 'speed' | 'parking' | 'general';
  contentEn: string;
  contentNl: string;
  contentAr: string;
}

export interface VideoLesson {
  id: string;
  titleEn: string;
  titleNl: string;
  titleAr: string;
  duration: string;
  url: string; // Mock visual image placeholder or embed style
  thumbnail: string;
}

export interface RoadSign {
  id: string;
  code: string;
  symbol: string; // Visual icon character or emoji
  type: 'danger' | 'priority' | 'prohibitory' | 'mandatory' | 'information' | 'parking' | 'highway';
  nameEn: string;
  nameNl: string;
  nameAr: string;
  descriptionEn: string;
  descriptionNl: string;
  descriptionAr: string;
  shape?: string;
  visualText?: string;
  visualIcon?: string;
}

export interface AchievementBadge {
  id: string;
  titleEn: string;
  titleNl: string;
  titleAr: string;
  descriptionEn: string;
  descriptionNl: string;
  descriptionAr: string;
  icon: string;
  unlocked: boolean;
}

export interface TrainerSchedule {
  workingDays: string[]; // e.g. ["Monday", "Tuesday", ...]
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  lessonPricePerHour: number;
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export interface Assessment {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  studentName: string;
  trainerName: string;
  lessonId?: string; // Lesson number/id if available
  scores: {
    control: number;
    priority: number;
    highway: number;
    maneuvers: number;
    theory: number;
  };
  overallScore: number;
  notes: string;
  cbrReadiness: 'beginner' | 'developing' | 'exam_mock' | 'ready_cbr';
  status: 'synced' | 'pending';
}

// Translations structure
export const TRANSLATIONS = {
  en: {
    appName: "Al-Andalos",
    home: "Home",
    lessons: "Lessons",
    learning: "Learn",
    wallet: "Wallet",
    profile: "Profile",
    roleSelector: "Role",
    student: "Student",
    trainer: "Trainer",
    welcomeBack: "Welcome,",
    readyToDrive: "Ready to drive?",
    nextLesson: "Next Lesson",
    noLessonsBooked: "No upcoming lessons",
    upcomingLessons: "Upcoming",
    completedLessons: "Completed",
    cancelled: "Cancelled",
    drivingRoutePreview: "Route Replay",
    progress: "Progress",
    examReadiness: "Exam Readiness",
    aiCoachShortcut: "AI Coach",
    bookLesson: "Book Lesson",
    trainerInfo: "Your Trainer",
    bookLessonHeader: "Book a Lesson",
    selectDate: "Select Date",
    selectTime: "Select Time",
    duration: "Duration",
    oneHour: "1 Hour",
    twoHours: "2 Hours",
    price: "Price",
    pickupLocation: "Pickup",
    confirmBooking: "Confirm Booking",
    bookingSuccess: "Lesson booked!",
    addToCalendar: "Add to Calendar",
    studentCalendar: "My Calendar",
    trainerCalendar: "Calendar",
    emailSent: "Notifications Sent!",
    balance: "Balance",
    deposits: "Top-ups",
    transactions: "Transactions",
    history: "History",
    amount: "Amount",
    description: "Description",
    date: "Date",
    viewInvoice: "Invoices",
    downloadInvoice: "Get PDF",
    addDeposit: "Top Up",
    personalInfo: "Personal Info",
    changePass: "Password",
    langSettings: "Language",
    notifications: "Notifications",
    darkMode: "Dark Mode",
    drivingStats: "Driving Stats",
    completedHrs: "Completed Hours",
    achievements: "Achievements",
    theoryLessons: "Theory",
    videos: "Videos",
    roadSigns: "Road Signs",
    examPrep: "Exam Prep",
    aiTrainerChatDesc: "Ask AI about traffic laws, exams, or road signs.",
    send: "Send",
    trainerDashboard: "Trainer Workspace",
    studentsText: "Students",
    todaysSchedule: "Today's Schedule",
    allLessons: "All Lessons",
    completeLessonForm: "Log Lesson",
    passedExam: "Exam Ready",
    addTrainerNotes: "Trainer Notes",
    sendReminder: "Send Reminder",
    createBill: "Issue Bill",
    workingDays: "Working Days",
    workingHrs: "Working Hours",
    start: "Start",
    end: "End",
    reports: "Reports",
    statistics: "Statistics",
    revenue: "Revenue",
    studentList: "Students",
    trainerList: "Trainers",
    badgeEarned: "Unlocked!",
    roadSafetyChampion: "First Clean Run",
    nightRider: "Night Driving",
    parkingKing: "Parking Maestro",
    highwayHero: "Highway Hero",
    examReadyBadge: "Theory Certified",
    interactiveLiveReplay: "Route Replay",
    startReplay: "Play Replay",
    pauseReplay: "Pause",
    resetReplay: "Reset",
    activeOfflineMode: "Offline Mode",
    online: "Online Sync",
    offlineMsg: "Offline. Saved changes will sync automatically.",
    aiPlaceholder: "Ask about Dutch rules, priority, exams...",
  },
  nl: {
    appName: "Al-Andalos",
    home: "Home",
    lessons: "Lessen",
    learning: "Leren",
    wallet: "Saldo",
    profile: "Profiel",
    roleSelector: "Rol",
    student: "Leerling",
    trainer: "Instructeur",
    welcomeBack: "Welkom,",
    readyToDrive: "Klaar voor de rit?",
    nextLesson: "Volgende Les",
    noLessonsBooked: "Geen lessen gepland",
    upcomingLessons: "Gepland",
    completedLessons: "Afgerond",
    cancelled: "Geannuleerd",
    drivingRoutePreview: "Route Replay",
    progress: "Voortgang",
    examReadiness: "Examenbereidheid",
    aiCoachShortcut: "AI Coach",
    bookLesson: "Les Boeken",
    trainerInfo: "Je Instructeur",
    bookLessonHeader: "Boek een Les",
    selectDate: "Kies Datum",
    selectTime: "Kies Tijd",
    duration: "Lesduur",
    oneHour: "1 Uur",
    twoHours: "2 Uur",
    price: "Prijs",
    pickupLocation: "Ophaallocatie",
    confirmBooking: "Bevestig",
    bookingSuccess: "Les geboekt!",
    addToCalendar: "In Agenda",
    studentCalendar: "Mijn Agenda",
    trainerCalendar: "Agenda",
    emailSent: "Meldingen Verzonden!",
    balance: "Saldo",
    deposits: "Betalingen",
    transactions: "Transacties",
    history: "Geschiedenis",
    amount: "Bedrag",
    description: "Omschrijving",
    date: "Datum",
    viewInvoice: "Facturen",
    downloadInvoice: "Download Factuur",
    addDeposit: "Opwaarderen",
    personalInfo: "Persoonlijke Info",
    changePass: "Wachtwoord",
    langSettings: "Taal",
    notifications: "Notificaties",
    darkMode: "Donkere Modus",
    drivingStats: "Rijstatistieken",
    completedHrs: "Afgeronde Uren",
    achievements: "Prestaties",
    theoryLessons: "Theorie",
    videos: "Video's",
    roadSigns: "Verkeersborden",
    examPrep: "Examen Prep",
    aiTrainerChatDesc: "Stel vragen over verkeersregels of examens.",
    send: "Verstuur",
    trainerDashboard: "Instructeur Workspace",
    studentsText: "Leerlingen",
    todaysSchedule: "Vandaag",
    allLessons: "Alle Lessen",
    completeLessonForm: "Les Loggen",
    passedExam: "Examenklaar",
    addTrainerNotes: "Feedback",
    sendReminder: "Herinnering",
    createBill: "Factuur Maken",
    workingDays: "Werkdagen",
    workingHrs: "Werktijden",
    start: "Start",
    end: "Einde",
    reports: "Rapportages",
    statistics: "Statistieken",
    revenue: "Omzet",
    studentList: "Leerlingen",
    trainerList: "Instructeurs",
    badgeEarned: "Ontgrendeld!",
    roadSafetyChampion: "Eerste Foutloze Rit",
    nightRider: "Nachtrijden",
    parkingKing: "Fileparkeren",
    highwayHero: "Snelweg",
    examReadyBadge: "Theorie Gecertificeerd",
    interactiveLiveReplay: "Route Replay",
    startReplay: "Speel Af",
    pauseReplay: "Pauze",
    resetReplay: "Reset",
    activeOfflineMode: "Offline Modus",
    online: "Online Sync",
    offlineMsg: "Geen internet. Wijzigingen worden offline gesynchroniseerd.",
    aiPlaceholder: "Stel vragen over CBR regels, voorrang of borden...",
  },
  ar: {
    appName: "الأندلس",
    home: "الرئيسية",
    lessons: "الدروس",
    learning: "التعليم",
    wallet: "المحفظة",
    profile: "الملف",
    roleSelector: "الواجهة",
    student: "المتدرب",
    trainer: "المدرب",
    welcomeBack: "مرحباً،",
    readyToDrive: "مستعد للقيادة؟",
    nextLesson: "الدرس القادم",
    noLessonsBooked: "لا توجد دروس مجدولة",
    upcomingLessons: "القادمة",
    completedLessons: "المكتملة",
    cancelled: "الملغاة",
    drivingRoutePreview: "إعادة المسار",
    progress: "التقدم",
    examReadiness: "جاهزية الامتحان",
    aiCoachShortcut: "المدرب الذكي",
    bookLesson: "حجز درس",
    trainerInfo: "المدرب",
    bookLessonHeader: "حجز درس عملي",
    selectDate: "التاريخ",
    selectTime: "الوقت",
    duration: "المدة",
    oneHour: "ساعة",
    twoHours: "ساعتان",
    price: "التكلفة",
    pickupLocation: "موقع اللقاء",
    confirmBooking: "تأكيد",
    bookingSuccess: "تم الحجز!",
    addToCalendar: "للتقويم",
    studentCalendar: "تقويمي",
    trainerCalendar: "التقويم",
    emailSent: "تم الإرسال!",
    balance: "الرصيد",
    deposits: "شحن الرصيد",
    transactions: "المعاملات",
    history: "السجل",
    amount: "المبلغ",
    description: "الوصف",
    date: "التاريخ",
    viewInvoice: "الفواتير",
    downloadInvoice: "تحميل الفاتورة",
    addDeposit: "شحن الرصيد",
    personalInfo: "البيانات",
    changePass: "كلمة المرور",
    langSettings: "اللغة",
    notifications: "الإشعارات",
    darkMode: "المظهر الداكن",
    drivingStats: "الإحصاءات",
    completedHrs: "الساعات المنجزة",
    achievements: "الإنجازات",
    theoryLessons: "الدروس النظرية",
    videos: "مكتبة الفيديو",
    roadSigns: "الإشارات",
    examPrep: "التحضير للاختبار",
    aiTrainerChatDesc: "اسأل المدرب الذكي عن القوانين أو قواعد الأسبقية.",
    send: "إرسال",
    trainerDashboard: "بوابة المدرب",
    studentsText: "المتدربون",
    todaysSchedule: "جدول اليوم",
    allLessons: "سجل الدروس",
    completeLessonForm: "تقرير الدرس",
    passedExam: "جاهز للاختبار",
    addTrainerNotes: "ملاحظات المدرب",
    sendReminder: "إرسال تذكير",
    createBill: "إنشاء فاتورة",
    workingDays: "أيام العمل",
    workingHrs: "ساعات العمل",
    start: "البدء",
    end: "الانتهاء",
    reports: "التقارير",
    statistics: "الإحصاءات",
    revenue: "الإيرادات",
    studentList: "المتدربون",
    trainerList: "المدربون",
    badgeEarned: "تم كسب وسام!",
    roadSafetyChampion: "بطل السلامة",
    nightRider: "القيادة الليلية",
    parkingKing: "رائد الركن",
    highwayHero: "بطل الطريق السريع",
    examReadyBadge: "خبير النظري",
    interactiveLiveReplay: "محاكاة المسار",
    startReplay: "بدء المحاكاة",
    pauseReplay: "إيقاف مؤقت",
    resetReplay: "إعادة تعيين",
    activeOfflineMode: "غير متصل",
    online: "مزامنة متصلة",
    offlineMsg: "لا يوجد اتصال. سيتم المزامنة تلقائياً.",
    aiPlaceholder: "اسأل عن القوانين، الأولوية، والامتحانات...",
  }
};
