import { Lesson, WalletTransaction, TheoryLesson, VideoLesson, RoadSign, AchievementBadge, TrainerSchedule } from './types';

export const INITIAL_LESSONS: Lesson[] = [
  {
    id: "l1",
    studentName: "Amir Al-Hassan",
    trainerName: "Instructeur Samir",
    date: "2026-06-24",
    time: "10:00",
    duration: 1,
    price: 65,
    pickupLocation: "Amsterdam Sloterdijk Station",
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
    id: "l2",
    studentName: "Amir Al-Hassan",
    trainerName: "Instructeur Samir",
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
    id: "l3",
    studentName: "Amir Al-Hassan",
    trainerName: "Instructeur Samir",
    date: "2026-06-20",
    time: "09:00",
    duration: 2,
    price: 130,
    pickupLocation: "Dam Square, Amsterdam",
    status: "completed",
    payStatus: "paid",
    routePoints: [
      { lat: 52.3731, lng: 4.8926 },
      { lat: 52.3700, lng: 4.8800 },
      { lat: 52.3650, lng: 4.8900 },
      { lat: 52.3731, lng: 4.8926 }
    ],
    trainerNotes: "Excellent clutch control. Parallel parking needs structured steps. Score: 85%",
    reviewed: true
  },
  {
    id: "l4",
    studentName: "Sanne de Jong",
    trainerName: "Instructeur Samir",
    date: "2026-06-22",
    time: "11:00",
    duration: 1,
    price: 65,
    pickupLocation: "Rotterdam Alexander",
    status: "completed",
    payStatus: "paid",
    routePoints: [
      { lat: 51.9244, lng: 4.4777 },
      { lat: 51.9300, lng: 4.4900 },
      { lat: 51.9244, lng: 4.4777 }
    ],
    trainerNotes: "Comfortable with highway cruising. Minor speeding near offramps."
  },
  {
    id: "l5",
    studentName: "Amir Al-Hassan",
    trainerName: "Instructeur Samir",
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
    id: "t1",
    date: "2026-06-22",
    type: "deposit",
    amount: 350,
    description: "iDEAL Bank Transfer (Al-Andalos Portal)",
    studentName: "Amir Al-Hassan"
  },
  {
    id: "t2",
    date: "2026-06-20",
    type: "payment",
    amount: 130,
    description: "Payment for Completed Lesson (l3)",
    invoiceId: "INV-2026-081",
    studentName: "Amir Al-Hassan"
  },
  {
    id: "t3",
    date: "2026-06-10",
    type: "deposit",
    amount: 200,
    description: "Mastercard Credit Deposit",
    studentName: "Amir Al-Hassan"
  },
  {
    id: "t4",
    date: "2026-06-10",
    type: "payment",
    amount: 65,
    description: "Theory Mock Test Bundle Access",
    invoiceId: "INV-2026-042",
    studentName: "Amir Al-Hassan"
  }
];

export const THEORY_LESSONS: TheoryLesson[] = [
  {
    id: "th1",
    category: "priority",
    titleEn: "Priority Regimes in the Netherlands",
    titleNl: "Voorrangsregels in Nederland",
    titleAr: "حقوق الأولوية وقواعدها في هولندا",
    contentEn: "At intersections without signs, traffic coming from the right always has right of way! This is a core rule in both the Al-Andalos theory exam and standard driving routines. Keep in mind that trams have priority regardless of direction.",
    contentNl: "Op gelijkwaardige kruispunten heeft verkeer van rechts altijd voorrang! Dit is een van de belangrijkste Al-Andalos-theorie-examenvragen. Onthoud dat trams bijna altijd voorrang hebben.",
    contentAr: "في التقاطعات المتساوية الكفاءة، تكون الأولوية دائماً للمركبات القادمة من اليمين! هذه قاعدة ذهبية في اختبار الأندلس ونظام السير الهولندي العام. تذكر أن الترام له الأولوية دائماً بغض النظر عن جهة قدومه."
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
    icon: "Sparkles",
    unlocked: false
  }
];

export const MOCK_TRAINER_SCHEDULE: TrainerSchedule = {
  workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  startTime: "08:00",
  endTime: "18:00",
  lessonPricePerHour: 65
};
