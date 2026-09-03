import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CaretRight, X, CheckCircle, Lightbulb
} from '@phosphor-icons/react';
import { Language, Lesson, StudentRecord } from '../types';
import { getFullDrivingTipsDatabase, DrivingTip } from '../data/drivingTips';
import { getDetailedTip } from '../utils/drivingTipDetailsHelper';
import { getDailyDrivingTip } from '../utils/dailyTipRotation';

interface DrivingTipCardProps {
  lang: Language;
  lessons?: Lesson[];
  currentUser?: StudentRecord | null | any;
  customTips?: DrivingTip[];
  autoRotateIntervalMs?: number;
}

/* ============================================================================
   CLEAN, MODERN, MINIMAL CONTEXTUAL VECTOR ILLUSTRATIONS
   ============================================================================ */

function DistanceIllustration() {
  return (
    <svg viewBox="0 0 140 90" className="w-full h-full text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <line x1="10" y1="72" x2="130" y2="72" strokeDasharray="3 3" opacity="0.4" />
      {/* Front Car */}
      <rect x="84" y="36" width="38" height="20" rx="5" className="fill-blue-500/15 dark:fill-blue-400/20" />
      <path d="M90 36 L96 26 L112 26 L118 36 Z" className="fill-blue-500/20 dark:fill-blue-400/25" />
      <circle cx="93" cy="56" r="4" className="fill-slate-800 dark:fill-zinc-200" />
      <circle cx="113" cy="56" r="4" className="fill-slate-800 dark:fill-zinc-200" />
      
      {/* Back Car */}
      <rect x="18" y="36" width="38" height="20" rx="5" className="fill-blue-600/25 dark:fill-blue-400/30" />
      <path d="M24 36 L30 26 L46 26 L52 36 Z" className="fill-blue-600/30 dark:fill-blue-400/35" />
      <circle cx="27" cy="56" r="4" className="fill-slate-800 dark:fill-zinc-200" />
      <circle cx="47" cy="56" r="4" className="fill-slate-800 dark:fill-zinc-200" />

      {/* 2-Second Gap Line & Badge */}
      <line x1="58" y1="46" x2="82" y2="46" strokeDasharray="2.5 2.5" strokeWidth="1.75" className="text-blue-500" />
      <path d="M56 46 L60 42 M56 46 L60 50 M84 46 L80 42 M84 46 L80 50" strokeWidth="1.75" className="text-blue-500" />
      <rect x="61" y="18" width="18" height="16" rx="4" className="fill-blue-600 text-white" stroke="none" />
      <text x="70" y="29" textAnchor="middle" fontSize="10" fontWeight="800" fill="white" stroke="none">2s</text>
    </svg>
  );
}

function RoundaboutIllustration() {
  return (
    <svg viewBox="0 0 140 90" className="w-full h-full text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="70" cy="45" r="32" opacity="0.3" strokeDasharray="4 3" />
      <circle cx="70" cy="45" r="16" className="fill-blue-500/15 dark:fill-blue-400/20" />
      <circle cx="70" cy="45" r="7" className="fill-blue-600 dark:fill-blue-400" opacity="0.6" stroke="none" />
      
      <path d="M 70 13 A 32 32 0 0 1 102 45" strokeWidth="2.2" className="text-blue-600 dark:text-blue-400" />
      <polygon points="102,45 97,37 106,39" className="fill-blue-600 dark:fill-blue-400" stroke="none" />
      
      <line x1="70" y1="2" x2="70" y2="13" />
      <line x1="70" y1="77" x2="70" y2="88" />
      <line x1="26" y1="45" x2="38" y2="45" />
      <line x1="102" y1="45" x2="114" y2="45" />
    </svg>
  );
}

function ParkingIllustration() {
  return (
    <svg viewBox="0 0 140 90" className="w-full h-full text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <line x1="28" y1="18" x2="28" y2="72" opacity="0.5" />
      <line x1="70" y1="18" x2="70" y2="72" strokeWidth="2" />
      <line x1="110" y1="18" x2="110" y2="72" strokeWidth="2" />
      
      <rect x="36" y="24" width="22" height="22" rx="5" className="fill-blue-500/15 border-none" stroke="none" />
      <text x="47" y="39" textAnchor="middle" fontSize="13" fontWeight="900" className="fill-blue-600 dark:fill-blue-400" stroke="none">P</text>

      <rect x="76" y="28" width="26" height="40" rx="5" className="fill-blue-600/25 dark:fill-blue-400/30" />
      <path d="M 80 32 Q 89 25 98 32" />
      <circle cx="81" cy="60" r="3" className="fill-slate-800 dark:fill-zinc-200" />
      <circle cx="97" cy="60" r="3" className="fill-slate-800 dark:fill-zinc-200" />

      <path d="M 124 68 Q 104 62 89 50" strokeDasharray="3 2" strokeWidth="1.75" className="text-blue-500" />
    </svg>
  );
}

function HighwayIllustration() {
  return (
    <svg viewBox="0 0 140 90" className="w-full h-full text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="84" x2="56" y2="10" strokeWidth="2.2" />
      <line x1="118" y1="84" x2="84" y2="10" strokeWidth="2.2" />
      <line x1="70" y1="84" x2="70" y2="10" strokeDasharray="6 5" opacity="0.6" strokeWidth="1.75" />

      <circle cx="110" cy="26" r="16" className="fill-white dark:fill-zinc-900" stroke="#EF4444" strokeWidth="2.8" />
      <text x="110" y="31" textAnchor="middle" fontSize="10" fontWeight="900" className="fill-slate-900 dark:fill-white" stroke="none">100</text>
      
      <rect x="56" y="50" width="28" height="20" rx="4" className="fill-blue-600 dark:fill-blue-400" stroke="none" />
      <circle cx="61" cy="70" r="3" className="fill-slate-800 dark:fill-zinc-200" />
      <circle cx="79" cy="70" r="3" className="fill-slate-800 dark:fill-zinc-200" />
    </svg>
  );
}

function WeatherRainIllustration() {
  return (
    <svg viewBox="0 0 140 90" className="w-full h-full text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 18 72 Q 70 32 122 72" strokeWidth="2.2" opacity="0.4" />
      <line x1="70" y1="72" x2="104" y2="38" strokeWidth="2.8" className="text-blue-600 dark:text-blue-400" />
      <path d="M 70 72 Q 98 32 115 50" strokeDasharray="2.5 2.5" opacity="0.5" />

      <path d="M 28 20 L 25 28" opacity="0.8" strokeWidth="1.75" />
      <path d="M 52 14 L 48 23" opacity="0.8" strokeWidth="1.75" />
      <path d="M 82 17 L 78 25" opacity="0.8" strokeWidth="1.75" />
      <path d="M 108 20 L 104 29" opacity="0.8" strokeWidth="1.75" />
      <path d="M 40 36 L 36 43" opacity="0.6" strokeWidth="1.75" />
      <path d="M 94 34 L 90 41" opacity="0.6" strokeWidth="1.75" />
    </svg>
  );
}

function CyclistIllustration() {
  return (
    <svg viewBox="0 0 140 90" className="w-full h-full text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="70" x2="128" y2="70" opacity="0.4" />
      <line x1="12" y1="22" x2="128" y2="22" strokeDasharray="4 3" opacity="0.4" />

      <circle cx="46" cy="52" r="11" />
      <circle cx="86" cy="52" r="11" />
      <path d="M 46 52 L 62 52 L 73 36 L 86 52" strokeWidth="2.2" />
      <path d="M 62 52 L 55 34 L 67 34" strokeWidth="2.2" />
      <circle cx="73" cy="27" r="3.5" className="fill-blue-600 dark:fill-blue-400" stroke="none" />

      <path d="M 35 20 Q 66 9 98 20" strokeDasharray="3 2" className="text-blue-500" />
      <text x="66" y="15" textAnchor="middle" fontSize="9" fontWeight="800" className="fill-blue-600 dark:fill-blue-400" stroke="none">1.5m</text>
    </svg>
  );
}

function EcoIllustration() {
  return (
    <svg viewBox="0 0 140 90" className="w-full h-full text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 28 68 A 44 44 0 0 1 112 68" strokeWidth="3.2" opacity="0.3" />
      <path d="M 28 68 A 44 44 0 0 1 70 24" strokeWidth="4" className="text-emerald-500" />

      <line x1="70" y1="68" x2="52" y2="36" strokeWidth="3" className="text-emerald-600 dark:text-emerald-400" />
      <circle cx="70" cy="68" r="6" className="fill-emerald-600 dark:fill-emerald-400" stroke="none" />

      <path d="M 100 50 C 82 38 85 22 100 22 C 100 37 112 37 100 50 Z" className="fill-emerald-500/30 text-emerald-500" strokeWidth="1.75" />
    </svg>
  );
}

function MirrorsIllustration() {
  return (
    <svg viewBox="0 0 140 90" className="w-full h-full text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <rect x="35" y="20" width="70" height="30" rx="7" className="fill-blue-500/15 dark:fill-blue-400/20" strokeWidth="2.2" />
      <line x1="70" y1="20" x2="70" y2="8" strokeWidth="3" />
      <path d="M 46 43 L 26 70" strokeDasharray="2.5 2.5" className="text-blue-500" />
      <path d="M 94 43 L 114 70" strokeDasharray="2.5 2.5" className="text-blue-500" />
      <path d="M 58 35 Q 70 26 82 35 Q 70 44 58 35 Z" className="fill-blue-600/30 dark:fill-blue-400/40" />
      <circle cx="70" cy="35" r="3" className="fill-blue-600 dark:fill-blue-400" stroke="none" />
    </svg>
  );
}

/* Intelligent Illustration Matcher */
function renderTipIllustration(tip: DrivingTip) {
  const titleLower = tip.title.en.toLowerCase();
  const category = tip.category;

  if (category === 'observation' || titleLower.includes('look') || titleLower.includes('mirror') || titleLower.includes('blind spot') || titleLower.includes('spiegel') || titleLower.includes('glance') || category === 'self_reflection' || category === 'cbr_exam_prep') {
    return <MirrorsIllustration />;
  }
  if (category === 'intersections' || category === 'roundabouts' || category === 'priority_rules' || category === 'traffic_signs' || titleLower.includes('roundabout') || titleLower.includes('rotonde') || titleLower.includes('intersection')) {
    return <RoundaboutIllustration />;
  }
  if (category === 'vulnerable_users' || category === 'cyclists' || category === 'pedestrians' || titleLower.includes('cyclist') || titleLower.includes('door') || titleLower.includes('portier') || titleLower.includes('pedestrian')) {
    return <CyclistIllustration />;
  }
  if (category === 'eco_driving' || titleLower.includes('eco') || titleLower.includes('gas')) {
    return <EcoIllustration />;
  }
  if (category === 'adverse_conditions' || category === 'rain' || category === 'fog' || category === 'snow' || titleLower.includes('weather') || titleLower.includes('rain') || titleLower.includes('aquaplaning')) {
    return <WeatherRainIllustration />;
  }
  if (category === 'vehicle_control' || category === 'parking' || category === 'vehicle_checks') {
    return <ParkingIllustration />;
  }
  if (category === 'driver_assistance' || category === 'highway_driving' || category === 'night_driving' || titleLower.includes('highway') || titleLower.includes('headlight')) {
    return <HighwayIllustration />;
  }
  return <DistanceIllustration />;
}

/** Utility to guarantee no internal IDs or numbers in titles */
function cleanTitle(title: string): string {
  if (!title) return '';
  return title.replace(/#\d+/g, '').replace(/Tip \d+/gi, '').replace(/\s+/g, ' ').trim();
}

/* ============================================================================
   MAIN COMPONENT: STUDENT-FRIENDLY DRIVING TIP CARD (APPLE / LINEAR STYLE)
   ============================================================================ */

export const DrivingTipCard = React.memo(function DrivingTipCard({
  lang,
  lessons,
  currentUser,
  customTips,
}: DrivingTipCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load tips database
  const tipsList = useMemo(() => {
    if (customTips && customTips.length > 0) return customTips;
    return getFullDrivingTipsDatabase();
  }, [customTips]);

  // Deterministic daily tip based on studentId + current calendar date + authentic lesson context
  const currentTip = useMemo(() => {
    return getDailyDrivingTip(currentUser, lessons, tipsList);
  }, [currentUser, lessons, tipsList]);

  if (!currentTip) return null;

  const isRtl = lang === 'ar';

  // Category Tag Translations (Student-Friendly)
  const getCategoryLabel = (category: string) => {
    const map: Record<string, { en: string; nl: string; ar: string }> = {
      observation: { en: "Observation & Mirrors", nl: "Kijkgedrag & Spiegels", ar: "المراقبة والمرايا" },
      speed_and_space: { en: "Speed & Safe Distance", nl: "Snelheid & Afstand", ar: "السرعة ومسافة الأمان" },
      intersections: { en: "Intersections & Priority", nl: "Kruispunten & Voorrang", ar: "التقاطعات والأولوية" },
      vehicle_control: { en: "Vehicle Control", nl: "Voertuigbeheersing", ar: "التحكم بالمركبة" },
      vulnerable_users: { en: "Cyclists & Pedestrians", nl: "Fietsers & Voetgangers", ar: "المشاة والدراجات" },
      social_driving: { en: "Social Driving", nl: "Sociaal Rijden", ar: "القيادة الاجتماعية" },
      eco_driving: { en: "Eco-Driving", nl: "Zuinig Rijden", ar: "القيادة الاقتصادية" },
      roundabouts: { en: "Roundabouts", nl: "Rotondes", ar: "الدوارات" },
      adverse_conditions: { en: "Weather & Wet Roads", nl: "Weersomstandigheden", ar: "الطقس والمطر" },
      trip_preparation: { en: "Car Setup & Ergonomics", nl: "Zithouding & Afstelling", ar: "وضعية الجلوس والتحضير" },
      driver_assistance: { en: "Lights & Visibility", nl: "Verlichting & Zicht", ar: "الإضاءة والرؤية" },
      anticipation: { en: "Hazard Awareness", nl: "Gevaarherkenning", ar: "توقع المخاطر" },
      risk_awareness: { en: "Safety & Focus", nl: "Veiligheid & Focus", ar: "السلامة والتركيز" },
      self_reflection: { en: "Lesson Practice", nl: "Lespraktijk", ar: "تطوير القيادة" },
      priority_rules: { en: "Priority Rules", nl: "Voorrangsregels", ar: "قواعد الأولوية" },
      traffic_signs: { en: "Traffic Signs", nl: "Verkeersborden", ar: "شواخص المرور" },
      parking: { en: "Parking & Manoeuvres", nl: "Parkeren & Verrichtingen", ar: "الاصطفاف والمناورات" },
      highway_driving: { en: "Highway Driving", nl: "Snelweg & Invoegen", ar: "الطريق السريع والاندماج" },
      cyclists: { en: "Cyclist Safety", nl: "Fietsers & Brommers", ar: "سلامة الدراجات" },
      pedestrians: { en: "Pedestrian Care", nl: "Voetgangers", ar: "حماية المشاة" },
      cbr_exam_prep: { en: "CBR Exam Ready", nl: "CBR Examentips", ar: "نصائح فحص الـ CBR" },
      vehicle_checks: { en: "Vehicle Checks", nl: "Voertuigcontrole", ar: "فحص المركبة" },
      night_driving: { en: "Night Driving", nl: "Rijden in het Donker", ar: "القيادة الليلية" }
    };
    const entry = map[category];
    if (!entry) return lang === 'nl' ? 'Rijtip' : lang === 'ar' ? 'نصيحة قيادة' : 'Driving Tip';
    return entry[lang] || entry.en;
  };

  // Header Title
  const headerTitle = {
    en: "Tip of the Day",
    nl: "Tip van de Dag",
    ar: "نصيحة اليوم"
  }[lang] || "Tip of the Day";

  const viewExplanationText = {
    en: "View explanation",
    nl: "Bekijk uitleg",
    ar: "عرض الشرح"
  }[lang];

  // Detailed Modal Content
  const details = getDetailedTip(currentTip.id, currentTip.category, currentTip.title.en, lang);

  const modalCloseText = { en: "Close", nl: "Sluiten", ar: "إغلاق" }[lang];
  const sectionStepsText = { en: "How to apply this", nl: "In de praktijk", ar: "خطوات التطبيق" }[lang];
  const sectionExampleText = { en: "Example from a lesson", nl: "Praktijkvoorbeeld", ar: "مثال من الواقع" }[lang];

  const formattedTitle = cleanTitle(currentTip.title[lang] || currentTip.title.en);

  return (
    <>
      <div 
        id="driving-tip-card-featured"
        onClick={() => setIsModalOpen(true)}
        className="relative overflow-hidden w-full bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-[24px] shadow-2xs hover:shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 cursor-pointer group select-none p-6 sm:p-7 md:p-8 flex flex-col gap-5 sm:gap-6"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Category & Header */}
        <div className="flex items-center justify-between gap-3 z-10 w-full">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-100 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-wide">
              <Lightbulb size={14} weight="bold" className="text-blue-600 dark:text-blue-400 shrink-0" />
              <span>{headerTitle}</span>
            </div>
            <span className="text-slate-300 dark:text-zinc-700">•</span>
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold">
              {getCategoryLabel(currentTip.category)}
            </span>
          </div>
        </div>

        {/* Vector Illustration */}
        <div className="w-full h-44 sm:h-52 shrink-0 flex items-center justify-center p-4 bg-gradient-to-br from-blue-50/80 via-indigo-50/30 to-slate-50 dark:from-zinc-800/80 dark:via-zinc-800/40 dark:to-zinc-900 rounded-2xl border border-slate-100/90 dark:border-zinc-800/80 text-blue-600 dark:text-blue-400 group-hover:scale-[1.01] transition-transform duration-300 shadow-inner overflow-hidden relative">
          <div className="w-full h-full max-w-[260px] max-h-[160px] flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            {renderTipIllustration(currentTip)}
          </div>
        </div>

        {/* Tip Title & Short Description */}
        <div className="space-y-2.5 text-left rtl:text-right z-10">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {formattedTitle}
          </h3>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-zinc-300 leading-relaxed font-normal line-clamp-3">
            {currentTip.description[lang] || currentTip.description.en}
          </p>
        </div>

        {/* View Explanation Button */}
        <div className="pt-1 flex items-center justify-start rtl:justify-end z-10">
          <button
            type="button"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 group-hover:bg-blue-700 dark:group-hover:bg-blue-500 transition-all duration-200 cursor-pointer"
          >
            <span>{viewExplanationText}</span>
            <CaretRight size={16} weight="bold" className={`${isRtl ? 'rotate-180' : ''} group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform`} />
          </button>
        </div>
      </div>

      {/* Simplified, Student-Friendly Detail Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: "spring", duration: 0.3, bounce: 0.08 }}
              className="relative w-full max-w-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden z-10 p-6 sm:p-8 flex flex-col max-h-[88vh]"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-400" />

              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 ltr:right-5 rtl:left-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition cursor-pointer"
                title={modalCloseText}
              >
                <X size={20} weight="bold" />
              </button>

              {/* Modal Category Badge */}
              <div className="flex items-center gap-2 mb-3 mt-1">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-bold">
                  <Lightbulb size={14} weight="bold" />
                  <span>{getCategoryLabel(currentTip.category)}</span>
                </div>
              </div>

              {/* Modal Scrollable Body */}
              <div className="overflow-y-auto space-y-5 pr-1 pb-2">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    {formattedTitle}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
                    {currentTip.description[lang] || currentTip.description.en}
                  </p>
                </div>

                {/* Practical Points */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    <Lightbulb size={16} weight="bold" className="text-blue-600 dark:text-blue-400" />
                    <span>{sectionStepsText}</span>
                  </div>
                  <ul className="space-y-2">
                    {details.explanation.map((line, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
                        <CheckCircle size={18} weight="fill" className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Practical Example */}
                {details.example && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 space-y-1.5">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      {sectionExampleText}
                    </h5>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
                      {details.example}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer with Standard Blue Button */}
              <div className="pt-4 mt-2 border-t border-slate-100 dark:border-zinc-800 flex justify-end items-center">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer shadow-sm shadow-blue-600/20"
                >
                  {modalCloseText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
});
