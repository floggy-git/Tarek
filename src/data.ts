import { Lesson, WalletTransaction, TheoryLesson, VideoLesson, RoadSign, AchievementBadge, TrainerSchedule, DrivePackage, SchoolSettings } from './types';

export const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  name: "Driving School",
  shortName: "Driving School",
  logoUrl: "",
  coverImageUrl: "",
  appIconUrl: "",
  faviconUrl: "",
  slogan: "Your Fast Track to Driving Excellence",

  address: "Main Street 42",
  city: "Utrecht",
  postalCode: "3511 AA",
  country: "Netherlands",
  phone: "+31 6 1234 5678",
  email: "info@drivingschool.nl",
  website: "https://drivingschool.nl",

  kvk: "87654321",
  btw: "NL876543210B01",
  iban: "NL91 ABNA 0417 1234 56",
  kvkDetails: "Registered with Kamer van Koophandel Utrecht",
  invoiceFooter: "Thank you for training with our driving school.",
  certificateFooter: "Official Certificate of Driving Course Completion & Exam Readiness.",
  licenseAuthority: "Driving School License Authority",
  primaryVehicle: "Golf VIII",
  transmissionType: "manual",
  schoolStamp: "",
  instructorSignature: "",
  instructorName: "Samir El-Filali",

  facebookUrl: "https://facebook.com/drivingschool",
  instagramUrl: "https://instagram.com/drivingschool",
  tiktokUrl: "https://tiktok.com/@drivingschool",
  whatsappNumber: "+31612345678",
  googleBusinessUrl: "https://g.page/r/drivingschool",
  youtubeUrl: "https://youtube.com/@drivingschool",

  themeId: "classic-blue",
  primaryColor: "#2563eb",
  secondaryColor: "#0284c7",
  accentColor: "#f59e0b",
  dashboardTheme: "dark",
  loginBackgroundUrl: "",
  defaultPackageTheme: "classic-blue",

  defaultLessonDuration: 1,
  lessonPricePerHour: 65,
  cancellationPolicy: "Free cancellation up to 24 hours prior to scheduled lesson time. Cancellations under 24 hours may incur full lesson rate.",
  bookingRules: "Lessons can be scheduled up to 60 days in advance. Minimum booking notice is 12 hours.",
  minAdvanceNoticeHours: 12,
  cancellationDeadlineHours: 24,

  smtpHost: "smtp.gmail.com",
  smtpPort: "587",
  smtpUser: "notifications@drivingschool.nl",
  smtpSenderName: "Driving School Notifications",
  replyToEmail: "info@drivingschool.nl",
  emailSignature: "Kind regards,\nDriving School Team",

  aiAssistantName: "AI Coach",
  aiCoachEnabled: true,
  aiSystemInstructions: "Grounded strictly in official Dutch traffic regulations (RVV 1990), CBR criteria, and certified driving school educational methods.",
  aiApprovedSources: "RVV 1990, CBR Theory & Practical Standards, Rijksoverheid, Certified School Driving Syllabus",
  aiEnforceStrictBoundary: true,

  notificationsEnabled: true,
  flexiblePackageDescription: "Flexible pay-per-lesson plan with certified personal instruction.",
  privacyPolicyUrl: "https://drivingschool.nl/privacy-policy",
  termsConditionsUrl: "https://drivingschool.nl/terms-conditions"
};

export const INITIAL_LESSONS: Lesson[] = [
  {
    id: "LES-000001",
    studentId: "ST-000001",
    studentName: "Amir Al-Hassan",
    trainerId: "TR-000001",
    trainerName: "Instructeur Samir",
    vehicleId: "VEH-000001",
    date: "2026-06-24",
    time: "10:00",
    duration: 1,
    price: 65,
    pickupLocation: "Maastricht Centraal Station",
    status: "upcoming",
    routePoints: [
      { lat: 52.3892, lng: 4.8378 },
      { lat: 52.3920, lng: 4.8450 },
      { lat: 52.3950, lng: 4.8500 },
      { lat: 52.3900, lng: 4.8600 },
      { lat: 52.3830, lng: 4.8520 },
      { lat: 52.3892, lng: 4.8378 }
    ],
    trainerNotes: "Focus on early mirror checks and roundabout rules near Utrechtseweg."
  },
  {
    id: "LES-000002",
    studentId: "ST-000001",
    studentName: "Amir Al-Hassan",
    trainerId: "TR-000001",
    trainerName: "Instructeur Samir",
    vehicleId: "VEH-000001",
    date: "2026-06-25",
    time: "14:00",
    duration: 2,
    price: 130,
    pickupLocation: "Utrecht Centraal",
    status: "upcoming",
    routePoints: [
      { lat: 52.0908, lng: 5.1216 },
      { lat: 52.0950, lng: 5.1300 },
      { lat: 52.1000, lng: 5.1400 },
      { lat: 52.0880, lng: 5.1350 },
      { lat: 52.0908, lng: 5.1216 }
    ]
  },
  {
    id: "LES-000003",
    studentId: "ST-000001",
    studentName: "Amir Al-Hassan",
    trainerId: "TR-000001",
    trainerName: "Instructeur Samir",
    vehicleId: "VEH-000001",
    date: "2026-07-30",
    time: "14:00",
    duration: 2,
    price: 130,
    pickupLocation: "Markt, Maastricht",
    status: "completed",
    payStatus: "paid",
    payMethod: "cash",
    invoiceId: "INV-2026-081",
    lessonNumber: 12,
    performanceRating: 5,
    performanceEvaluation: "excellent",
    lessonNotes: "Parallel parking, Roundabouts, Blind-spot checks",
    instructorNotes: "Excellent mirror checks today. Continue practicing roundabouts and keep improving lane positioning.",
    routePoints: [
      { lat: 52.3731, lng: 4.8926 },
      { lat: 52.3700, lng: 4.8800 },
      { lat: 52.3650, lng: 4.8900 },
      { lat: 52.3731, lng: 4.8926 }
    ],
    trainerNotes: "Excellent mirror checks today. Continue practicing roundabouts and keep improving lane positioning.",
    reviewed: true
  },
  {
    id: "LES-000004",
    studentId: "ST-000001",
    studentName: "Amir Al-Hassan",
    trainerId: "TR-000001",
    trainerName: "Instructeur Samir",
    vehicleId: "VEH-000001",
    date: "2026-07-29",
    time: "11:00",
    duration: 1,
    price: 65,
    pickupLocation: "Maastricht Centraal",
    status: "completed",
    payStatus: "paid",
    payMethod: "wallet",
    invoiceId: "INV-2026-082",
    lessonNumber: 11,
    performanceRating: 4,
    performanceEvaluation: "good",
    lessonNotes: "Highway cruising, Lane positioning",
    instructorNotes: "Great progress with parallel parking and highway merging. Remember to signal earlier before changing lanes.",
    routePoints: [
      { lat: 51.9244, lng: 4.4777 },
      { lat: 51.9300, lng: 4.4900 },
      { lat: 51.9244, lng: 4.4777 }
    ],
    trainerNotes: "Great progress with parallel parking and highway merging. Remember to signal earlier before changing lanes."
  },
  {
    id: "LES-000005",
    studentId: "ST-000001",
    studentName: "Amir Al-Hassan",
    trainerId: "TR-000001",
    trainerName: "Instructeur Samir",
    vehicleId: "VEH-000001",
    date: "2026-06-15",
    time: "16:00",
    duration: 1,
    price: 65,
    pickupLocation: "Leiden Centraal",
    status: "cancelled",
    trainerNotes: "Cancelled due to bad heavy rain warning."
  }
];

export const INITIAL_TRANSACTIONS: WalletTransaction[] = [
  {
    id: "TX-000001",
    studentId: "ST-000001",
    studentName: "Amir Al-Hassan",
    trainerId: "TR-000001",
    trainerName: "Instructeur Samir",
    date: "2026-06-22",
    type: "deposit",
    amount: 350,
    description: "iDEAL Bank Transfer (Student Portal)"
  },
  {
    id: "TX-000002",
    studentId: "ST-000001",
    studentName: "Amir Al-Hassan",
    trainerId: "TR-000001",
    trainerName: "Instructeur Samir",
    lessonId: "LES-000003",
    invoiceId: "INV-2026-081",
    date: "2026-06-20",
    type: "payment",
    amount: 130,
    description: "Payment for Completed Lesson (LES-000003)"
  },
  {
    id: "TX-000003",
    studentId: "ST-000001",
    studentName: "Amir Al-Hassan",
    trainerId: "TR-000001",
    trainerName: "Instructeur Samir",
    date: "2026-06-10",
    type: "deposit",
    amount: 200,
    description: "Mastercard Credit Deposit"
  },
  {
    id: "TX-000004",
    studentId: "ST-000001",
    studentName: "Amir Al-Hassan",
    trainerId: "TR-000001",
    trainerName: "Instructeur Samir",
    invoiceId: "INV-2026-042",
    date: "2026-06-10",
    type: "payment",
    amount: 65,
    description: "Theory Mock Test Bundle Access"
  }
];

export const THEORY_LESSONS: TheoryLesson[] = [
  {
    id: "th1",
    category: "priority",
    titleEn: "Priority Regimes in the Netherlands",
    titleNl: "Voorrangsregels in Nederland",
    titleAr: "حقوق الأولوية وقواعدها في هولندا",
    contentEn: "At intersections without signs, traffic coming from the right always has right of way! This is a core rule in both the CBR theory exam and standard driving routines. Keep in mind that trams have priority regardless of direction.",
    contentNl: "Op gelijkwaardige kruispunten heeft verkeer van rechts altijd voorrang! Dit is een van de belangrijkste theorie-examenvragen. Onthoud dat trams bijna altijd voorrang hebben.",
    contentAr: "في التقاطعات المتساوية الكفاءة، تكون الأولوية دائماً للمركبات القادمة من اليمين! هذه قاعدة ذهبية في اختبار النظري ونظام السير الهولندي العام. تذكر أن الترام له الأولوية دائماً بغض النظر عن جهة قدومه."
  },
  {
    id: "th2",
    category: "signs",
    titleEn: "The Shark Teeth Markings (Haaientanden)",
    titleNl: "Haaientanden Rijstrookmarkeringen",
    titleAr: "علامات أسنان القرش الأرضية (Haaientanden)",
    contentEn: "White triangles painted on the road surface - known as 'shark teeth' - mean you must yield priority to crossing traffic from both directions. Always slow down and check lanes before entering.",
    contentNl: "Witte driehoeken op het wegdek ('haaientanden') verplichten u voorrang te verlenen aan kruisend verkeer op de kruisende weg. Altijd rustig naderen en goed kijken.",
    contentAr: "المثلثات البيضاء المرسومة على سطح الطريق لتشبه أسنان القرش تعني إجبار السائق على إعطاء الأولوية التامة لحركة المرور العابرة من الاتجاهين. يجب تخفيف السرعة والتحقق بوضوح قبل المتابعة."
  },
  {
    id: "th3",
    category: "speed",
    titleEn: "Standard Dutch Speed Limitations",
    titleNl: "Standaard Maximumsnelheden",
    titleAr: "الحدود القصوى للسرعة في هولندا",
    contentEn: "Regular maximum speed limits: Urban zones (within built-up area) - 50 km/h (often 30 km/h now). Rural highways - 80 km/h. Motorways (A-roads) - 100 km/h between 06:00 and 19:00, and 130 km/h at night.",
    contentNl: "Standaard snelheidslimieten: Binnen de bebouwde kom - 50 km/u (vaak 30 km/u). Buiten de bebouwde kom - 80 km/u. Autosnelwegen - 100 km/u overdag (06:00 - 19:00) en 130 km/u in de nacht.",
    contentAr: "الحدود القياسية للسرعة: داخل المناطق السكنية 50 كم/ساعة (وكثير منها 30 كم/ساعة). الطرق السريعة الخارجية 80 كم/ساعة. الطرق السريعة الكبرى (Autosnelweg) تكون 100 كم/ساعة نهاراً (6 صباحاً حتى 7 مساءً) وتصل إلى 130 كم/ساعة ليلاً."
  }
];

export const DEFAULT_VIDEO_THUMBNAIL = "https://images.unsplash.com/photo-1506015391300-4802dc74de2e?w=600&auto=format&fit=crop";

export const INSTRUCTIONAL_VIDEOS: VideoLesson[] = [
  {
    id: "v1",
    titleEn: "Step-by-Step Highway Lane Merging",
    titleNl: "Stappenplan Invoegen op de Autosnelweg",
    titleAr: "دليل الدمج على الطرق السريعة خطوة بخطوة",
    duration: "4:32",
    thumbnail: "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=600&q=80",
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ"
  },
  {
    id: "v2",
    titleEn: "Mastering Parallel Parking in Urban Cities",
    titleNl: "Bestuur Fileparkeren in de Stad",
    titleAr: "احتراف الركن المتوازي والصف الجانبي في المدن",
    duration: "5:15",
    thumbnail: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80",
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ"
  },
  {
    id: "v3",
    titleEn: "Turbo Roundabout Entry & Exit Procedures",
    titleNl: "Turborotondes Correct Naderen en Verlaten",
    titleAr: "إجراءات الدخول والخروج الصحيحة من الدوارات الذكية",
    duration: "3:40",
    thumbnail: "https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=600&q=80",
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ"
  }
];

import { ROAD_SIGNS as IMPORTED_ROAD_SIGNS } from './data/roadSigns';

export const ROAD_SIGNS: RoadSign[] = IMPORTED_ROAD_SIGNS;

export const INITIAL_ACHIEVEMENTS: AchievementBadge[] = [
  {
    id: "a1",
    titleEn: "Road Safety Champion",
    titleNl: "Veiligheidskampioen",
    titleAr: "بطل السلامة على الطرق",
    descriptionEn: "Completed your first lesson with zero critical trainer interventions.",
    descriptionNl: "Voltooide uw eerste les zonder kritieke ingrepen van de instructeur.",
    descriptionAr: "أكملت درسك الأول دون أي تدخلات حرجة من مدربك.",
    icon: "ShieldCheck",
    unlocked: true
  },
  {
    id: "a2",
    titleEn: "Night Rider",
    titleNl: "Nachtrijder",
    titleAr: "قيادة الليل الاحترافية",
    descriptionEn: "Completed a full 2-hour twilight/night driving session.",
    descriptionNl: "Voltooide een volledige 2-urige avond- of nachtrit.",
    descriptionAr: "أكملت جلسة كاملة مدتها ساعتان في وقت الغسق أو الليل.",
    icon: "Moon",
    unlocked: true
  },
  {
    id: "a3",
    titleEn: "Parallel Parking King",
    titleNl: "Fileparkeerkoning",
    titleAr: "ملك الاصطفاف المتوازي",
    descriptionEn: "Achieved perfect marks for parallel parking simulations.",
    descriptionNl: "Behaalde een perfecte score voor fileparkeren.",
    descriptionAr: "حققت علامة مثالية في محاكاة الركن المتوازي والجانبي.",
    icon: "KeyRound",
    unlocked: false
  },
  {
    id: "a4",
    titleEn: "Highway Hero",
    titleNl: "Snelwegheld",
    titleAr: "بطل الطرق السريعة",
    descriptionEn: "Successfully executed safe merging on the high-speed motorway.",
    descriptionNl: "Succesvol ingevoegd op de autosnelweg met hoge snelheid.",
    descriptionAr: "نجحت في دمج سيارتك بأمان على ممرات الطرق السريعة وبسرعات عالية.",
    icon: "Navigation",
    unlocked: false
  }
];

export const MOCK_TRAINER_SCHEDULE: TrainerSchedule = {
  workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  startTime: "08:00",
  endTime: "18:00",
  lessonPricePerHour: 65
};

export const INITIAL_PACKAGES: DrivePackage[] = [
  {
    id: "PKG-000001",
    name: "Starter Core Pack",
    description: "Basic theory app & standard lessons. Ideal for beginners starting their driving journey.",
    hours: 10,
    price: 650,
    badge: "Essential",
    colorTheme: "classic-blue",
    displayOrder: 1,
    isActive: true,
    features: [
      "10 Practical Driving Hours (5 x 2h sessions)",
      "CBR Practical Exam Route Preparation",
      "Digital Student Progress Tracker",
      "Free Theory Mobile App Access",
      "Home Pick-up & Drop-off Included"
    ]
  },
  {
    id: "PKG-000002",
    name: "Optimal Progress Pack",
    description: "Mock test & TTT interim test included, perfect for passing on your first attempt.",
    hours: 20,
    price: 1250,
    badge: "Most Popular",
    popular: true,
    recommended: true,
    colorTheme: "royal-purple",
    displayOrder: 2,
    isActive: true,
    features: [
      "20 Practical Driving Hours (10 x 2h sessions)",
      "CBR Interim Assessment (Tussentijdse Toets)",
      "Official Mock Practical Driving Exam",
      "Unlimited Theory Exam Practice App",
      "Priority Evening & Weekend Lessons",
      "Home Pick-up & Drop-off Included"
    ]
  },
  {
    id: "PKG-000003",
    name: "Complete Guarantee Pack",
    description: "Full exam protection, priority instructor booking, and comprehensive CBR exam fee coverage.",
    hours: 40,
    price: 2400,
    badge: "Recommended VIP",
    recommended: true,
    colorTheme: "premium-gold",
    displayOrder: 3,
    isActive: true,
    features: [
      "40 Complete Driving Hours (Intensive)",
      "CBR Practical Exam Fee Fully Included",
      "CBR TTT Interim Assessment Included",
      "VIP Dedicated Instructor Schedule",
      "Free Exam Resit Protection Voucher",
      "Multilingual Instruction (NL / AR / EN)"
    ]
  }
];

