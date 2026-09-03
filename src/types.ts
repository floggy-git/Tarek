export type Language = 'en' | 'nl' | 'ar';
export type UserRole = 'student' | 'trainer';

export type IdentityStatus = 
  | 'canonical'             // Verified matching valid studentId
  | 'matched_email'         // Reconciled by unique email
  | 'matched_phone'         // Reconciled by unique phone
  | 'matched_name'          // Reconciled by unique name
  | 'unresolved'            // Ambiguous/unresolved conflict requiring admin review
  | 'unmatched_orphan';     // No matching master student record found

export interface User {
  id?: string;
  studentId?: string; // Permanent Student ID (e.g. ST-000001)
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  identityStatus?: IdentityStatus;
}

export interface Lesson {
  id: string; // Permanent Unique Lesson ID (e.g. LES-000001)
  studentId?: string; // Permanent Student ID (e.g. ST-000001)
  identityStatus?: IdentityStatus;
  studentName: string;
  trainerId?: string; // Permanent Trainer ID (e.g. TR-000001)
  trainerName: string;
  vehicleId?: string; // Permanent Vehicle ID (e.g. VEH-000001)
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number; // Hours (e.g. 1, 1.5, 2)
  price: number;
  pickupLocation: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  cancellationReason?: string;
  cancellationDate?: string;
  cancellationTime?: string;
  cancelledBy?: 'Trainer' | 'Admin' | 'Student';
  cancellationNotes?: string;
  notifiedStudent?: boolean;
  routePoints?: { lat: number; lng: number; timestamp?: number }[];
  elapsedTime?: string;
  distanceKm?: number;
  trainerNotes?: string;
  lessonNotes?: string;
  instructorNotes?: string;
  performanceRating?: number; // 5 = Excellent, 3 = Good, 1 = Needs Improvement
  performanceEvaluation?: 'excellent' | 'good' | 'needs_improvement';
  lessonNumber?: number;
  completedAt?: string;
  reviewed?: boolean;
  payStatus?: 'paid' | 'unpaid';
  payMethod?: string;
  invoiceId?: string; // Permanent Invoice ID (e.g. INV-2026-001)
  calendarEventId?: string; // External Google Calendar Event ID
  calendarStatus?: 'synced' | 'failed' | 'deleted';
  driveReportId?: string; // Google Drive Dossier/Report File ID
  driveReportUrl?: string; // Google Drive Web View Link
  reminderSent?: boolean;
  reminderLink?: string;
  reminderNotes?: string;
}

export interface WalletTransaction {
  id: string; // Permanent Transaction ID (e.g. TX-000001)
  studentId?: string; // Permanent Student ID (e.g. ST-000001)
  identityStatus?: IdentityStatus;
  studentName?: string;
  trainerId?: string; // Permanent Trainer ID (e.g. TR-000001)
  trainerName?: string;
  lessonId?: string; // Permanent Lesson ID (e.g. LES-000001)
  date: string;
  type: 'deposit' | 'payment' | 'adjustment';
  amount: number;
  description: string;
  invoiceId?: string; // Permanent Invoice ID (e.g. INV-2026-001)
  driveInvoiceId?: string; // Google Drive File ID for the PDF Invoice
  driveInvoiceUrl?: string; // Google Drive Link for the PDF Invoice
}

export interface InvoiceRecord {
  id: string; // Permanent Invoice ID (e.g. INV-2026-001)
  studentId: string;
  studentName: string;
  studentEmail?: string;
  amount: number;
  date: string;
  description: string;
  status: 'paid' | 'unpaid' | 'credited';
  lessonId?: string;
  driveFileId?: string;
  driveUrl?: string;
  drivePdfUrl?: string;
}

export interface MediaVideo {
  id: string;
  titleEn?: string;
  titleNl?: string;
  titleAr?: string;
  title?: string;
  descriptionEn?: string;
  descriptionNl?: string;
  descriptionAr?: string;
  description?: string;
  category: string;
  isEnabled: boolean;
  url: string;
  thumbnail?: string;
  duration: string;
  language?: string;
  driveFileId?: string;
  driveShareUrl?: string;
  isMissingFromDrive?: boolean;
  isDeletedByTrainer?: boolean;
  type?: 'video' | 'image';
  displayOrder?: number;
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
  id: string; // Unique internal ID
  code: string; // Official sign code (e.g. B1, B6, B7, C1)
  symbol: string; // Visual icon character or emoji
  type: 'danger' | 'priority' | 'prohibitory' | 'mandatory' | 'information' | 'parking' | 'highway';
  nameEn: string;
  nameNl: string;
  nameAr: string;
  descriptionEn: string;
  descriptionNl: string;
  descriptionAr: string;
  practicalAdviceEn?: string;
  practicalAdviceNl?: string;
  practicalAdviceAr?: string;
  examTipsEn?: string;
  examTipsNl?: string;
  examTipsAr?: string;
  commonMistakesEn?: string;
  commonMistakesNl?: string;
  commonMistakesAr?: string;
  needsReview?: boolean;
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

export interface VacationModeSettings {
  enabled: boolean;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  note?: string; // Optional short note e.g. "Summer Holiday"
}

export interface HelpFaqItem {
  id: string;
  category: string;
  questionAr: string;
  answerAr: string;
  questionNl: string;
  answerNl: string;
  questionEn: string;
  answerEn: string;
  active: boolean;
  order: number;
}

export interface TrainerSchedule {
  workingDays: string[]; // e.g. ["Monday", "Tuesday", ...]
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  lessonPricePerHour: number;
  vacationMode?: VacationModeSettings;
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  image?: string;
  imageUrl?: string;
  isWarning?: boolean;
  isOffTopic?: boolean;
}

export interface Assessment {
  id: string; // Permanent Assessment ID (e.g. ASM-000001)
  studentId?: string; // Permanent Student ID (e.g. ST-000001)
  identityStatus?: IdentityStatus;
  studentName: string;
  trainerId?: string; // Permanent Trainer ID (e.g. TR-000001)
  trainerName: string;
  lessonId?: string; // Permanent Lesson ID (e.g. LES-000001)
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
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
    appName: "Driving School",
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
    aiCoachShortcut: "AI Assistant",
    bookLesson: "Book Lesson",
    trainerInfo: "Your Trainer",
    bookLessonHeader: "Book a Lesson",
    selectDate: "Select Date",
    selectTime: "Select Time",
    duration: "Duration",
    oneHour: "1 Hour",
    twoHours: "2 Hours",
    price: "Price",
    pickupLocation: "Lesson Start Location",
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
    aiPlaceholder: "Ask about traffic rules, priority, exams...",
    studentBalance: "Student Balance",
    totalDeposits: "Total Deposits",
    totalCostsPaid: "Total Costs Paid",
    walletSafety: "Balance & Security",
    walletPolicyDesc: "Your lesson balance is managed directly by the driving school. Deposits, lesson charges, and balance adjustments are processed by the driving school.",
    walletWarningDesc: "Students cannot edit, add, or deduct funds directly. To add balance or clarify lesson charges, please contact your instructor.",
    liveFeed: "Live feed",
    noTransactions: "No transactions recorded for this wallet yet.",
    walletShortcutDesc: "Check balance and download invoices",
  },
  nl: {
    appName: "Rijschool Portal",
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
    aiCoachShortcut: "AI Assistent",
    bookLesson: "Les Boeken",
    trainerInfo: "Je Instructeur",
    bookLessonHeader: "Boek een Les",
    selectDate: "Kies Datum",
    selectTime: "Kies Tijd",
    duration: "Lesduur",
    oneHour: "1 Uur",
    twoHours: "2 Uur",
    price: "Prijs",
    pickupLocation: "Startlocatie van de rijles",
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
    studentBalance: "Saldo Leerling",
    totalDeposits: "Totale Stortingen",
    totalCostsPaid: "Totaal Betaalde Kosten",
    walletSafety: "Saldo & Beveiliging",
    walletPolicyDesc: "Je lesaldo wordt rechtstreeks beheerd door de rijschool. Stortingen, leskosten en saldo-aanpassingen worden door de rijschool verwerkt.",
    walletWarningDesc: "Als leerling kun je zelf geen saldo toevoegen of afschrijven. Neem contact op met je instructeur om je saldo op te waarderen of afschrijvingen te bespreken.",
    liveFeed: "Live overzicht",
    noTransactions: "Nog geen transacties geregistreerd voor deze wallet.",
    walletShortcutDesc: "Controleer saldo en download facturen",
  },
  ar: {
    appName: "مدرسة القيادة",
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
    aiCoachShortcut: "المساعد الذكي",
    bookLesson: "حجز درس",
    trainerInfo: "المدرب",
    bookLessonHeader: "حجز درس عملي",
    selectDate: "التاريخ",
    selectTime: "الوقت",
    duration: "المدة",
    oneHour: "ساعة",
    twoHours: "ساعتان",
    price: "التكلفة",
    pickupLocation: "مكان بدء الدرس",
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
    studentBalance: "رصيد الطالب",
    totalDeposits: "إجمالي الإيداعات",
    totalCostsPaid: "إجمالي التكاليف المدفوعة",
    walletSafety: "الرصيد والأمان",
    walletPolicyDesc: "تتم إدارة رصيد دروسك مباشرة من قبل مدرسة القيادة. تتم معالجة الإيداعات، تكاليف الدروس، وتعديلات الرصيد بواسطة مدرسة القيادة.",
    walletWarningDesc: "لا يمكن للمتدرب تعديل أو شحن الرصيد مباشرة. لشحن رصيدك أو الاستفسار عن الرسوم، يرجى التواصل مباشرة مع مدربك.",
    liveFeed: "البث المباشر",
    noTransactions: "لا توجد معاملات مالية مسجلة لهذه المحفظة حالياً.",
    walletShortcutDesc: "التحقق من الرصيد وتحميل الفواتير",
  }
};

export interface DrivePackage {
  id: string; // Permanent Unique Package ID (e.g. PKG-000001)
  name: string;
  description: string;
  hours: number;
  price: number;
  discountPrice?: number;
  badge?: string;
  popular?: boolean;
  recommended?: boolean;
  colorTheme: string; // 'blue' | 'indigo' | 'emerald' | 'violet' | 'amber' etc.
  displayOrder: number;
  isActive: boolean;
  features?: string[];
}

export interface StudentRecord {
  id: string; // Permanent Student ID (e.g. ST-000001)
  studentId?: string; // Permanent Student ID (e.g. ST-000001)
  identityStatus?: IdentityStatus;
  packageId?: string; // Permanent Package ID (e.g. PKG-000001)
  name: string;
  email: string;
  phone: string;
  dob: string;
  city: string;
  currentPackage: string;
  packageSelection?: string;
  packageName?: string;
  packageHours?: number;
  targetHours?: number;
  packagePrice?: number;
  balance?: number;
  readiness?: number;
  joinedDate?: string;
  password?: string;
  status?: string;
  theoryExamStatus: string;
  notificationsEnabled?: boolean;
  aiWarningCount?: number;
  aiSuspendedUntil?: string | null; // ISO timestamp string e.g. "2026-08-18T14:30:00.000Z"
  aiSuspensionTier?: number; // 0 = None, 1 = 24h suspension, 2 = 48h suspension
  aiLastActivity?: string;
  driveFolderId?: string; // Google Drive folder ID for Student-{studentId}
}

export interface VehicleRecord {
  id: string; // Permanent Vehicle ID (e.g. VEH-000001)
  name: string;
  licensePlate: string;
  transmission: 'manual' | 'automatic';
  model: string;
  status: 'active' | 'maintenance' | 'inactive';
}

export interface TrainerRecord {
  id: string; // Permanent Trainer ID (e.g. TR-000001)
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  status?: string;
}

export interface AuditLogEntry {
  auditId: string;
  userId: string;
  studentId?: string;
  userName: string;
  userRole: string; // 'Student' | 'Trainer' | 'Admin'
  action: string;   // 'Password Changed' etc.
  changedBy: string; // 'Self' | 'Admin'
  date: string;     // YYYY-MM-DD
  time: string;     // HH:MM:SS
  timeZone: string;
  ipAddress: string;
  deviceBrowser: string;
  targetRecord?: string;
  previousValue?: string;
  newValue?: string;
  source?: string;
}

export interface Package {
  id: string;
  title: string;
  price: number;
  lessonsCount: number;
  description?: string;
  features?: string[];
  recommended?: boolean;
}

export interface SchoolSettings {
  // 1. School Identity
  name: string;             // e.g. "Royal Driving School"
  shortName?: string;        // e.g. "Royal Drive"
  logoUrl?: string;         // Custom uploaded logo or URL
  coverImageUrl?: string;   // School cover image header
  appIconUrl?: string;      // Custom app icon
  faviconUrl?: string;      // Custom favicon URL
  slogan?: string;          // e.g. "Your Fast Track to CBR Success"

  // 2. Contact Information
  address: string;          // e.g. "Main Street 42"
  city: string;             // e.g. "Utrecht"
  postalCode?: string;      // e.g. "3511 AA"
  country?: string;         // e.g. "Netherlands"
  phone: string;            // e.g. "+31 6 1234 5678"
  email: string;            // e.g. "info@drivingschool.nl"
  website?: string;         // e.g. "www.drivingschool.nl"

  // 3. Business & Legal Information
  kvk: string;              // Chamber of Commerce (KVK)
  btw: string;              // VAT Number (BTW)
  iban?: string;            // Bank IBAN for top-ups
  kvkDetails?: string;      // KvK registration information
  invoiceFooter?: string;   // Custom footer on PDF Invoices
  certificateFooter?: string;// Custom footer on Completion Certificates
  licenseAuthority?: string;// e.g. "CBR / RDW"
  primaryVehicle?: string;  // e.g. "Volkswagen Golf VIII", "Toyota Yaris"
  transmissionType?: 'manual' | 'automatic' | 'both' | string; // Transmission type
  schoolStamp?: string;     // URL or base64 of official school stamp
  instructorSignature?: string; // Signature image URL
  instructorName?: string;  // Primary instructor name (e.g. "Samir El-Filali")

  // 4. Social Media
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  whatsappNumber?: string;
  googleBusinessUrl?: string;
  youtubeUrl?: string;

  // 5. Visual Identity & Branding Theme
  themeId?: 'classic-blue' | 'emerald' | 'graphite' | 'sunset';
  primaryColor?: string;     // Hex code e.g. "#4f46e5"
  secondaryColor?: string;   // Hex code e.g. "#0284c7"
  accentColor?: string;      // Hex code e.g. "#f59e0b"
  dashboardTheme?: string;   // 'dark' | 'light' | 'indigo' | 'slate' | 'emerald'
  loginBackgroundUrl?: string;
  defaultPackageTheme?: string;

  // 6. Business Operations & Rules
  defaultLessonDuration?: number; // 1 or 2 hours
  lessonPricePerHour?: number;
  cancellationPolicy?: string;
  bookingRules?: string;
  minAdvanceNoticeHours?: number; // Minimum hours required before booking a lesson
  cancellationDeadlineHours?: number; // Hours before lesson start that student can cancel online

  // 7. Email Settings (Placeholders for SMTP/Gmail)
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPass?: string;
  smtpEncryption?: 'tls' | 'ssl' | 'none';
  smtpSenderName?: string;
  replyToEmail?: string;
  emailSignature?: string;
  enableBookingEmails?: boolean;
  enableCancelEmails?: boolean;
  enableInvoiceEmails?: boolean;
  enableReminderEmails?: boolean;

  // 8. AI Assistant Branding & Policy
  aiAssistantName?: string;  // Custom AI assistant name
  aiCoachEnabled?: boolean;  // Global toggle for AI Coach (default true)
  aiSystemInstructions?: string; // Custom school instructions for AI
  aiApprovedSources?: string; // Approved knowledge sources e.g. "RVV 1990, CBR, Rijksoverheid, School Curriculum"
  aiEnforceStrictBoundary?: boolean; // Strictly enforce driving education boundary

  // System & Operations
  notificationsEnabled?: boolean;
  flexiblePackageDescription?: string;
  privacyPolicyUrl?: string;
  termsConditionsUrl?: string;
}

export function getSchoolName(s?: Partial<SchoolSettings> | null): string {
  return s?.name?.trim() || "Driving School";
}

export function getSchoolShortName(s?: Partial<SchoolSettings> | null): string {
  if (s?.shortName?.trim()) return s.shortName.trim();
  const full = getSchoolName(s);
  const cleaned = full.replace(/rijschool|driving school|rijscholen/gi, '').trim();
  return cleaned || full;
}

export function getAiAssistantName(s?: Partial<SchoolSettings> | null): string {
  if (s?.aiAssistantName?.trim()) return s.aiAssistantName.trim();
  const short = getSchoolShortName(s);
  return `${short} AI`;
}

export interface StudentAiStatus {
  isSuspended: boolean;
  remainingSeconds: number;
  suspendedUntilDate: Date | null;
  tier: number; // 0 = active, 1 = 24h, 2 = 48h
  warningCount: number;
}

/**
 * Evaluates whether a student is currently under AI Coach suspension
 * based on their canonical record timestamp.
 */
export function isStudentAiSuspended(student?: Partial<StudentRecord> | null): StudentAiStatus {
  const warningCount = student?.aiWarningCount || 0;
  const tier = student?.aiSuspensionTier || (warningCount >= 3 ? 2 : warningCount >= 2 ? 1 : 0);

  if (!student?.aiSuspendedUntil) {
    return {
      isSuspended: false,
      remainingSeconds: 0,
      suspendedUntilDate: null,
      tier,
      warningCount
    };
  }

  const suspendedUntilDate = new Date(student.aiSuspendedUntil);
  const now = Date.now();
  const diffMs = suspendedUntilDate.getTime() - now;

  if (isNaN(suspendedUntilDate.getTime()) || diffMs <= 0) {
    return {
      isSuspended: false,
      remainingSeconds: 0,
      suspendedUntilDate: null,
      tier,
      warningCount
    };
  }

  return {
    isSuspended: true,
    remainingSeconds: Math.ceil(diffMs / 1000),
    suspendedUntilDate,
    tier: tier || 1,
    warningCount
  };
}



