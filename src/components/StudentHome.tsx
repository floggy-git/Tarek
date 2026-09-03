import React, { useMemo, useState, useEffect } from 'react';
import { 
  CalendarBlank, Wallet, CheckCircle, TrendUp, 
  Brain, CaretRight, Car, Lightning,
  Lightbulb, BookOpen, Warning, House, User, Bell, SquaresFour,
  ArrowRight, FacebookLogo, YoutubeLogo, InstagramLogo, Globe, GraduationCap,
  MapPin, Clock
} from '@phosphor-icons/react';
import { TRANSLATIONS, Language, Lesson, WalletTransaction, AchievementBadge, getSchoolName, getSchoolShortName, getAiAssistantName } from '../types';
import { DrivingTipCard } from './DrivingTipCard';
import { getStudentInitials, getStudentPhoto } from '../utils/studentPhoto';
import { isRecordForStudent } from '../utils/identity';

interface StudentHomeProps {
  lang: Language;
  t: typeof TRANSLATIONS['en'];
  lessons: Lesson[];
  transactions: WalletTransaction[];
  badges: AchievementBadge[];
  setActiveTab: (tab: string) => void;
  setLearningActiveSubTab?: (tab: 'theory' | 'videos' | 'images' | 'signs' | 'quiz' | 'coaching') => void;
  isOffline: boolean;
  selectedReplayLessonId?: string;
  setSelectedReplayLessonId?: (id: string) => void;
  currentUser?: any;
  schoolSettings?: any;
}

interface HeroBannerSliderProps {
  lang: Language;
  schoolSettings?: any;
  setActiveTab: (tab: string) => void;
  isRtl: boolean;
}

const HeroBannerSlider = React.memo(({ lang, schoolSettings, setActiveTab, isRtl }: HeroBannerSliderProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = useMemo(() => [
    {
      id: 0,
      title: lang === 'ar' ? 'مرحباً بك في' : lang === 'nl' ? 'Welkom bij' : 'Welcome to',
      schoolName: getSchoolName(schoolSettings),
      subtitle: lang === 'ar' 
        ? 'طريقك الأسرع نحو القيادة بثقة وااحتراف' 
        : lang === 'nl' 
          ? 'Jouw snelste weg naar zelfverzekerd en veilig autorijden' 
          : 'Your fastest route to driving with confidence & mastery',
      cta: lang === 'ar' ? 'ابدأ رحلتك الآن' : lang === 'nl' ? 'Start Je Reis Nu' : 'Start Your Journey Now',
      tabTarget: 'lessons',
      bgImage: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=1200&auto=format&fit=crop'
    },
    {
      id: 1,
      title: lang === 'ar' ? 'دروس قيادة متقدمة' : lang === 'nl' ? 'Geavanceerde Rijlessen' : 'Advanced Practical Lessons',
      schoolName: getSchoolShortName(schoolSettings),
      subtitle: lang === 'ar'
        ? 'احجز مواعيد دروسك التدريبية بسهولة مع أفضل المدربين المعتمدين'
        : lang === 'nl'
          ? 'Boek eenvoudig je rijlessen bij gecertificeerde instructeurs'
          : 'Book your training sessions easily with certified instructors',
      cta: lang === 'ar' ? 'احجز درسك القادم' : lang === 'nl' ? 'Boek Volgende Les' : 'Book Next Lesson',
      tabTarget: 'lessons',
      bgImage: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1200&auto=format&fit=crop'
    },
    {
      id: 2,
      title: lang === 'ar' ? 'استعد لاختبار القيادة CBR' : lang === 'nl' ? 'Bereid je voor op het CBR' : 'Prepare for CBR Exam',
      schoolName: getSchoolShortName(schoolSettings),
      subtitle: lang === 'ar'
        ? 'أسئلة نظري شاملة وااختبارات تجريبية لضمان النجاح من المرة الأولى'
        : lang === 'nl'
          ? 'Uitgebreide theorievragen en oefenexamens voor een hoge slaagkans'
          : 'Comprehensive practice tests & theory coaching for top pass rate',
      cta: lang === 'ar' ? 'ابدأ التدريب النظري' : lang === 'nl' ? 'Start Theorie' : 'Start Theory',
      tabTarget: 'learning',
      bgImage: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?q=80&w=1200&auto=format&fit=crop'
    }
  ], [lang, schoolSettings]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  return (
    <div 
      id="hero-banner-slider" 
      className="relative overflow-hidden rounded-[24px] shadow-sm min-h-[280px] sm:min-h-[320px] md:min-h-[350px] flex items-center transition-all duration-300 group"
    >
      {heroSlides.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
            currentSlide === idx ? 'opacity-100 z-0' : 'opacity-0 z-[-1]'
          }`}
        >
          <img
            src={slide.bgImage}
            alt={slide.schoolName}
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
            loading={idx === 0 ? "eager" : "lazy"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/55 to-slate-950/25 rtl:bg-gradient-to-l ltr:bg-gradient-to-r rtl:from-slate-950/95 rtl:via-slate-950/65 rtl:to-slate-950/25 ltr:from-slate-950/95 ltr:via-slate-950/65 ltr:to-slate-950/25" />
        </div>
      ))}

      <div className="relative z-10 w-full p-5 sm:p-8 md:p-10 flex flex-col justify-between min-h-[280px] sm:min-h-[320px] md:min-h-[350px]">
        <div className="space-y-2 sm:space-y-3 max-w-2xl text-right rtl:text-right ltr:text-left mt-auto pt-6 sm:pt-8">
          <p className="text-xs sm:text-sm font-bold text-blue-300 tracking-wide">
            {heroSlides[currentSlide].title}
          </p>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white uppercase leading-tight font-sans">
            {heroSlides[currentSlide].schoolName}
          </h1>

          <p className="text-xs sm:text-sm font-medium text-slate-200 max-w-lg leading-relaxed">
            {heroSlides[currentSlide].subtitle}
          </p>

          <div className="pt-2 flex justify-start rtl:justify-start ltr:justify-start">
            <button
              onClick={() => setActiveTab(heroSlides[currentSlide].tabTarget)}
              className="px-6 py-3 sm:px-7 sm:py-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-full text-xs sm:text-sm font-bold transition-all duration-200 shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <span>{heroSlides[currentSlide].cta}</span>
              <CaretRight size={16} weight="bold" className={isRtl ? 'rotate-180' : ''} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 pt-4">
          {heroSlides.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlide(idx)}
              className={`transition-all duration-200 cursor-pointer ${
                currentSlide === idx 
                  ? 'h-2.5 w-6 bg-white rounded-full shadow-xs' 
                  : 'h-2.5 w-2.5 bg-white/40 rounded-full hover:bg-white/70'
              }`}
              title={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
});



function StudentHomeComponent({ 
  lang, t, lessons, transactions, badges, setActiveTab, setLearningActiveSubTab, isOffline,
  selectedReplayLessonId, setSelectedReplayLessonId, currentUser, schoolSettings
}: StudentHomeProps) {
  // State for initial load ring entrance animation
  const [isRingAnimated, setIsRingAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRingAnimated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Filter core databases to show only the logged-in student's data
  const studentName = currentUser?.name || "";

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

  const myLessons = useMemo(() => {
    return lessons.filter(l => isRecordForStudent(l, currentUser));
  }, [lessons, currentUser]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => isRecordForStudent(tx, currentUser));
  }, [transactions, currentUser]);

  // Find next upcoming lesson
  const upcomingLessonsList = useMemo(() => {
    return myLessons.filter(l => l.status === 'upcoming');
  }, [myLessons]);

  const nextLesson = useMemo(() => {
    return upcomingLessonsList.length > 0 ? upcomingLessonsList[0] : null;
  }, [upcomingLessonsList]);

  // Counts
  const completedCount = useMemo(() => {
    return myLessons.filter(l => l.status === 'completed').length;
  }, [myLessons]);

  const upcomingCount = useMemo(() => {
    return upcomingLessonsList.length;
  }, [upcomingLessonsList]);

  // Total completed hours calculated strictly as SUM(actual completed lesson durations)
  const completedHours = useMemo(() => {
    return myLessons
      .filter(l => l.status === 'completed')
      .reduce((sum, current) => sum + (Number(current.duration) || 1), 0);
  }, [myLessons]);

  // Calculate wallet balance
  const currentBalance = useMemo(() => {
    return filteredTransactions.reduce((acc, curr) => {
      return curr.type === 'deposit' ? acc + curr.amount : acc - curr.amount;
    }, 0);
  }, [filteredTransactions]);

  // Target & Remaining Hours
  const targetHours = useMemo(() => {
    if (currentUser?.packageHours !== undefined) return Number(currentUser.packageHours);
    if (currentUser?.targetHours !== undefined) return Number(currentUser.targetHours);
    const rawPkg = currentUser?.packageName || currentUser?.packageSelection || currentUser?.currentPackage || '';
    const match = rawPkg.match(/(\d+)\s*(?:hours|hour|h|ساعة|uur)/i);
    if (match) return parseInt(match[1], 10);
    return 0;
  }, [currentUser]);

  const remainingHours = useMemo(() => {
    return Math.max(0, targetHours - completedHours);
  }, [targetHours, completedHours]);

  const userPhoto = useMemo(() => {
    return currentUser?.profilePhoto || (currentUser ? getStudentPhoto(currentUser.email || currentUser.name) : null);
  }, [currentUser]);

  const firstName = useMemo(() => {
    if (!currentUser?.name) return lang === 'ar' ? 'المتدرب' : 'Student';
    return currentUser.name.split(' ')[0];
  }, [currentUser, lang]);

  const packageName = useMemo(() => {
    return currentUser?.packageName || currentUser?.packageSelection || currentUser?.currentPackage || currentUser?.package || (lang === 'ar' ? 'بلا باقة' : lang === 'nl' ? 'Geen Pakket' : 'No Package');
  }, [currentUser, lang]);

  const nextLessonFormatted = useMemo(() => {
    if (!nextLesson) {
      return lang === 'ar' ? 'لا توجد دروس قادمة' : lang === 'nl' ? 'Geen lessen gepland' : 'No upcoming lessons';
    }
    const lessonDate = new Date(nextLesson.date);
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(lessonDate);
    target.setHours(0,0,0,0);
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 3600 * 24));

    let dayText = '';
    if (diffDays === 0) dayText = lang === 'nl' ? 'Vandaag' : lang === 'ar' ? 'اليوم' : 'Today';
    else if (diffDays === 1) dayText = lang === 'nl' ? 'Morgen' : lang === 'ar' ? 'غداً' : 'Tomorrow';
    else dayText = lessonDate.toLocaleDateString(lang === 'ar' ? 'ar-EG' : lang === 'nl' ? 'nl-NL' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    return `${dayText} • ${nextLesson.time}`;
  }, [nextLesson, lang]);

  // Stats
  const progressPercentage = useMemo(() => {
    if (!targetHours) return 0;
    return Math.min(Math.round((completedHours / targetHours) * 100), 100);
  }, [completedHours, targetHours]);

  const motivationMessage = useMemo(() => {
    if (completedHours === 0 && completedCount === 0) {
      return lang === 'nl' 
        ? 'Klaar voor je eerste rijles.' 
        : lang === 'ar' 
        ? 'جاهز لدرسك الأول.' 
        : 'Ready for your first lesson.';
    }
    if (progressPercentage >= 100) {
      return lang === 'nl'
        ? 'Cursus afgerond.'
        : lang === 'ar'
        ? 'اكتملت الدورة.'
        : 'Course completed.';
    }
    if (progressPercentage >= 75) {
      return lang === 'nl'
        ? 'Bijna op het doel.'
        : lang === 'ar'
        ? 'اقتربت من الهدف.'
        : 'Almost there.';
    }
    if (progressPercentage >= 40) {
      return lang === 'nl'
        ? 'Goede vorderingen.'
        : lang === 'ar'
        ? 'تقدم جيد.'
        : "You're making good progress.";
    }
    return lang === 'nl'
      ? 'Goede start.'
      : lang === 'ar'
      ? 'بداية جيدة.'
      : 'Great start.';
  }, [progressPercentage, completedHours, completedCount, lang]);

  const achievementSentence = useMemo(() => {
    if (completedHours === 0 && completedCount === 0) {
      return lang === 'nl' 
        ? 'Boek je eerste les om te beginnen.' 
        : lang === 'ar' 
        ? 'احجز درسك الأول لبدء رحلتك.' 
        : 'Book your first lesson to start your journey.';
    }
    if (progressPercentage >= 100) {
      return lang === 'nl'
        ? 'Je bent helemaal klaar voor het praktijkexamen.'
        : lang === 'ar'
        ? 'أنت جاهز تماماً للامتحان العملي.'
        : 'You are completely ready for your practical exam.';
    }
    if (progressPercentage >= 75) {
      return lang === 'nl'
        ? 'Elke les brengt je dichter bij je rijbewijs.'
        : lang === 'ar'
        ? 'كل درس يقربك أكثر من رخصة القيادة.'
        : 'Every lesson brings you closer to your license.';
    }
    if (progressPercentage >= 40) {
      return lang === 'nl'
        ? 'Je bouwt elke les meer zelfvertrouwen op.'
        : lang === 'ar'
        ? 'تبني المزيد من الثقة مع كل درس.'
        : "You're building confidence with every lesson.";
    }
    return lang === 'nl'
      ? 'Je hebt je eerste rijuren succesvol voltooid.'
      : lang === 'ar'
      ? 'لقد أكملت ساعات القيادة الأولى بنجاح.'
      : "You've completed your first driving hours.";
  }, [progressPercentage, completedHours, completedCount, lang]);

  const aiAssistantContext = useMemo(() => {
    if (nextLesson) {
      return {
        headline: lang === 'nl' 
          ? 'Hulp nodig bij het voorbereiden van je volgende les?'
          : lang === 'ar'
          ? 'هل تحتاج مساعدة في التحضير لدرسك القادم؟'
          : 'Need help preparing for your next lesson?',
        detail: lang === 'nl'
          ? 'Bespreek verkeersregels, manoeuvres of bijzondere situaties met je assistent.'
          : lang === 'ar'
          ? 'ناقش قواعد المرور، التناورات أو المواقف الخاصة مع مساعدك.'
          : 'Practice traffic scenarios and review key maneuvers before driving.',
        action: lang === 'nl' ? 'Open Assistent' : lang === 'ar' ? 'افتح المساعد' : 'Ask AI'
      };
    }
    if (completedCount > 0) {
      return {
        headline: lang === 'nl'
          ? 'Je recente rijles evalueren?'
          : lang === 'ar'
          ? 'هل ترغب في مراجعة درسك الأخير؟'
          : "Let's review your recent lesson.",
        detail: lang === 'nl'
          ? 'Stel vragen over situaties waar je twijfels over had tijdens het rijden.'
          : lang === 'ar'
          ? 'اطرح أسئلة حول المواقف التي كانت لديك شكوك حولها أثناء القيادة.'
          : 'Review tricky intersections, priority rules, or maneuvers from your drive.',
        action: lang === 'nl' ? 'Open Assistent' : lang === 'ar' ? 'افتح المساعد' : 'Ask AI'
      };
    }
    return {
      headline: lang === 'nl'
        ? 'Stel al je vragen over de rijtheorie.'
        : lang === 'ar'
        ? 'اسأل أي شيء عن نظرية القيادة والقوانين.'
        : 'Ask anything about driving theory.',
      detail: lang === 'nl'
        ? 'Ontvang direct antwoord op verkeersborden, voorrang en examenvragen.'
        : lang === 'ar'
        ? 'احصل على إجابات فورية حول إشارات المرور وأولويات المرور.'
        : 'Get instant guidance on traffic signs, right-of-way, and exam concepts.',
      action: lang === 'nl' ? 'Stel een vraag' : lang === 'ar' ? 'اطرح سؤالاً' : 'Ask AI'
    };
  }, [nextLesson, completedCount, lang]);

  const examReadinessScore = useMemo(() => {
    return Math.min(30 + completedCount * 12 + (completedHours * 1.5), 98); // dynamic calculation
  }, [completedCount, completedHours]);

  const isRtl = lang === 'ar';

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto px-1 sm:px-2" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Offline sync banner if offline */}
      {isOffline && (
        <div id="offline-banner" className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/20 text-amber-300 rounded-2xl border border-amber-500/30 text-xs shadow-lg animate-pulse">
          <Warning size={16} weight="regular" className="text-amber-400 shrink-0" />
          <span>{t.offlineMsg}</span>
        </div>
      )}

      {/* 0. Premium Apple-Style Welcome Card */}
      <div 
        id="welcome-card" 
        className="bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs transition-all duration-200"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          
          {/* Greeting & Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white text-lg sm:text-xl font-black shadow-xs shrink-0 overflow-hidden ring-4 ring-blue-500/10 dark:ring-blue-400/20">
              {userPhoto ? (
                <img src={userPhoto} alt={firstName} className="w-full h-full object-cover" />
              ) : (
                firstName[0].toUpperCase()
              )}
            </div>

            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                {lang === 'ar' ? `مرحباً بعودتك، ${firstName}` : lang === 'nl' ? `Welkom terug, ${firstName}` : `Welcome back, ${firstName}`}
              </h1>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                <span>{packageName}</span>
              </p>
            </div>
          </div>

          {/* Clean Apple-style metrics */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-zinc-800/70">
            
            {/* Metric 1: Next Lesson */}
            <div className="flex-1 sm:flex-initial flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-zinc-950/70 border border-slate-200/50 dark:border-zinc-800/60 rounded-xl sm:rounded-2xl">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <CalendarBlank size={18} weight="bold" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-400 leading-none">
                  {lang === 'ar' ? 'الدرس القادم' : lang === 'nl' ? 'Volgende les' : 'Next lesson'}
                </p>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate mt-1 leading-none">
                  {nextLessonFormatted}
                </p>
              </div>
            </div>

            {/* Metric 2: Remaining Hours */}
            <div className="flex-1 sm:flex-initial flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-zinc-950/70 border border-slate-200/50 dark:border-zinc-800/60 rounded-xl sm:rounded-2xl">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Clock size={18} weight="bold" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-400 leading-none">
                  {lang === 'ar' ? 'الرصيد المتبقي' : lang === 'nl' ? 'Resterende uren' : 'Remaining balance'}
                </p>
                <p className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 truncate mt-1 leading-none">
                  {remainingHours} {lang === 'ar' ? 'ساعة متبقية' : lang === 'nl' ? 'uur resterend' : 'hours remaining'}
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* 1. Full-width Premium Hero Banner Slider */}
      <HeroBannerSlider lang={lang} schoolSettings={schoolSettings} setActiveTab={setActiveTab} isRtl={isRtl} />

      {/* 2. Quick Actions Grid (Compact SaaS Cards) */}
      <div 
        id="quick-actions-grid"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5"
      >
        {/* Card 1: My Bookings (حجوزاتي) */}
        <button
          onClick={() => setActiveTab('lessons')}
          className="p-3 sm:p-3.5 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 rounded-2xl shadow-2xs hover:shadow-sm hover:border-slate-300/80 dark:hover:border-zinc-700/80 hover:-translate-y-0.5 active:scale-98 transition-all duration-200 flex flex-col items-center text-center group cursor-pointer"
        >
          <div className="w-9 h-9 bg-blue-500/8 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 rounded-xl mb-2 flex items-center justify-center border border-blue-500/15 dark:border-blue-400/20 group-hover:scale-105 transition-transform shrink-0">
            <CalendarBlank size={20} weight="regular" />
          </div>
          <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
            {isRtl ? 'حجوزاتي' : lang === 'nl' ? 'Mijn Boekingen' : 'My Bookings'}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            {isRtl ? 'المواعيد القادمة' : lang === 'nl' ? 'Aankomende lessen' : 'Upcoming Schedule'}
          </p>
        </button>

        {/* Card 2: Packages (الباقات) */}
        <button
          onClick={() => setActiveTab('packages')}
          className="p-3 sm:p-3.5 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 rounded-2xl shadow-2xs hover:shadow-sm hover:border-slate-300/80 dark:hover:border-zinc-700/80 hover:-translate-y-0.5 active:scale-98 transition-all duration-200 flex flex-col items-center text-center group cursor-pointer"
        >
          <div className="w-9 h-9 bg-blue-500/8 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 rounded-xl mb-2 flex items-center justify-center border border-blue-500/15 dark:border-blue-400/20 group-hover:scale-105 transition-transform shrink-0">
            <SquaresFour size={20} weight="regular" />
          </div>
          <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
            {isRtl ? 'الباقات' : lang === 'nl' ? 'Pakketten' : 'Packages'}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            {isRtl ? 'الأسعار والعروض' : lang === 'nl' ? 'Prijzen & Aanbiedingen' : 'Rates & Offers'}
          </p>
        </button>

        {/* Card 3: My Wallet (محفظتي) */}
        <button
          onClick={() => setActiveTab('wallet')}
          className="p-3 sm:p-3.5 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 rounded-2xl shadow-2xs hover:shadow-sm hover:border-slate-300/80 dark:hover:border-zinc-700/80 hover:-translate-y-0.5 active:scale-98 transition-all duration-200 flex flex-col items-center text-center group cursor-pointer"
        >
          <div className="w-9 h-9 bg-blue-500/8 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 rounded-xl mb-2 flex items-center justify-center border border-blue-500/15 dark:border-blue-400/20 group-hover:scale-105 transition-transform shrink-0">
            <Wallet size={20} weight="regular" />
          </div>
          <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
            {isRtl ? 'محفظتي' : lang === 'nl' ? 'Mijn Portemonnee' : 'My Wallet'}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            {isRtl ? 'الرصيد والفواتير' : lang === 'nl' ? 'Saldo & Facturen' : 'Balance & Receipts'}
          </p>
        </button>

        {/* Card 4: Learning (تعلم) */}
        <button
          onClick={() => setActiveTab('learning')}
          className="p-3 sm:p-3.5 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 rounded-2xl shadow-2xs hover:shadow-sm hover:border-slate-300/80 dark:hover:border-zinc-700/80 hover:-translate-y-0.5 active:scale-98 transition-all duration-200 flex flex-col items-center text-center group cursor-pointer"
        >
          <div className="w-9 h-9 bg-blue-500/8 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 rounded-xl mb-2 flex items-center justify-center border border-blue-500/15 dark:border-blue-400/20 group-hover:scale-105 transition-transform shrink-0">
            <BookOpen size={20} weight="regular" />
          </div>
          <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
            {isRtl ? 'تعلم' : lang === 'nl' ? 'Leren' : 'Learning'}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            {isRtl ? 'مواد تعليمية' : lang === 'nl' ? 'Lesmateriaal' : 'Course Material'}
          </p>
        </button>
      </div>

      {/* 3. Quick Summary Section (Ultra-Compact Modern Metric Cards) */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {isRtl ? 'ملخص سريع' : lang === 'nl' ? 'Snelle Samenvatting' : 'Quick Summary'}
          </h3>
          <button 
            onClick={() => setActiveTab('lessons')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer flex items-center gap-1 group"
          >
            <span>{isRtl ? 'عرض الكل' : lang === 'nl' ? 'Bekijk alles' : 'View All'}</span>
            <CaretRight size={14} weight="bold" className={`transition-transform group-hover:translate-x-0.5 ${isRtl ? 'rotate-180 group-hover:-translate-x-0.5' : ''}`} />
          </button>
        </div>

        {/* 3-Card Ultra-Compact Metric Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
          {/* Card 1: Completed Lessons */}
          <button
            onClick={() => setActiveTab('lessons')}
            className="py-2.5 px-3.5 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 rounded-xl sm:rounded-2xl shadow-2xs hover:shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 active:scale-[0.99] transition-all duration-200 flex items-center gap-3 text-left rtl:text-right group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-500/8 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/15 dark:border-blue-400/20 group-hover:scale-105 transition-transform">
              <CheckCircle size={18} weight="regular" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                {completedCount}
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                {isRtl ? 'دروس مكتملة' : lang === 'nl' ? 'Voltooide lessen' : 'Completed lessons'}
              </div>
            </div>
          </button>

          {/* Card 2: Upcoming Lessons */}
          <button
            onClick={() => setActiveTab('lessons')}
            className="py-2.5 px-3.5 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 rounded-xl sm:rounded-2xl shadow-2xs hover:shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 active:scale-[0.99] transition-all duration-200 flex items-center gap-3 text-left rtl:text-right group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-500/8 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/15 dark:border-blue-400/20 group-hover:scale-105 transition-transform">
              <CalendarBlank size={18} weight="regular" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                {upcomingCount}
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                {isRtl ? 'دروس قادمة' : lang === 'nl' ? 'Aankomende lessen' : 'Upcoming lessons'}
              </div>
            </div>
          </button>

          {/* Card 3: Wallet Balance */}
          <button
            onClick={() => setActiveTab('wallet')}
            className="py-2.5 px-3.5 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 rounded-xl sm:rounded-2xl shadow-2xs hover:shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 active:scale-[0.99] transition-all duration-200 flex items-center gap-3 text-left rtl:text-right group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-500/8 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/15 dark:border-blue-400/20 group-hover:scale-105 transition-transform">
              <Wallet size={18} weight="regular" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight leading-none">
                € {currentBalance}
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                {isRtl ? 'رصيد المحفظة' : lang === 'nl' ? 'Portemonnee saldo' : 'Wallet balance'}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Featured Driving Tip Section ("Tip van de Dag") */}
      <div className="pt-0.5">
        <DrivingTipCard lang={lang} lessons={lessons} currentUser={currentUser} />
      </div>

      {/* 5. Services Section ("خدماتنا" - 3 Real Driving School Services) */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {isRtl ? 'خدماتنا' : lang === 'nl' ? 'Onze Diensten' : 'Our Services'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
          {/* Service 1: Driving Lessons */}
          <button
            onClick={() => setActiveTab('lessons')}
            className="py-2.5 px-3.5 sm:py-3 sm:px-4 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 rounded-xl sm:rounded-2xl shadow-2xs hover:shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 active:scale-[0.99] transition-all duration-200 flex items-center gap-3 text-left rtl:text-right group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-500/8 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/15 dark:border-blue-400/20 group-hover:scale-105 transition-transform">
              <Car size={18} weight="regular" />
            </div>
            <div className="flex flex-col min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                {isRtl ? 'دروس القيادة' : lang === 'nl' ? 'Rijlessen' : 'Driving lessons'}
              </h4>
              <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                {isRtl ? 'دروس عملية' : lang === 'nl' ? 'Praktijklessen' : 'Practical lessons'}
              </p>
            </div>
          </button>

          {/* Service 2: Theory Lessons */}
          <button
            onClick={() => {
              if (setLearningActiveSubTab) setLearningActiveSubTab('theory');
              setActiveTab('learning');
            }}
            className="py-2.5 px-3.5 sm:py-3 sm:px-4 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 rounded-xl sm:rounded-2xl shadow-2xs hover:shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 active:scale-[0.99] transition-all duration-200 flex items-center gap-3 text-left rtl:text-right group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-500/8 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/15 dark:border-blue-400/20 group-hover:scale-105 transition-transform">
              <BookOpen size={18} weight="regular" />
            </div>
            <div className="flex flex-col min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                {isRtl ? 'الدروس النظرية' : lang === 'nl' ? 'Theorielessen' : 'Theory Lessons'}
              </h4>
              <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                {isRtl ? 'قواعد المرور' : lang === 'nl' ? 'Verkeersregels' : 'Traffic rules'}
              </p>
            </div>
          </button>

          {/* Service 3: Intensive Course */}
          <button
            onClick={() => setActiveTab('packages')}
            className="py-2.5 px-3.5 sm:py-3 sm:px-4 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 rounded-xl sm:rounded-2xl shadow-2xs hover:shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 active:scale-[0.99] transition-all duration-200 flex items-center gap-3 text-left rtl:text-right group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-500/8 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/15 dark:border-blue-400/20 group-hover:scale-105 transition-transform">
              <Lightning size={18} weight="regular" />
            </div>
            <div className="flex flex-col min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                {isRtl ? 'دروس المكثفة' : lang === 'nl' ? 'Spoedcursus' : 'Intensive course'}
              </h4>
              <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                {isRtl ? 'دروس سريعة ومكثفة' : lang === 'nl' ? 'Snel & intensief' : 'Fast & intensive'}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 6. Upcoming Lesson Card details (Apple Calendar Event Minimalist Floating Card) */}
      <div id="next-lesson-details-card" className="pt-1">
        <div className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-[20px] p-5 sm:p-6 shadow-[0_8px_26px_rgba(0,0,0,0.035)] dark:shadow-[0_8px_26px_rgba(0,0,0,0.25)] transition-all duration-200">
          
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2.5 pb-3.5 border-b border-slate-100 dark:border-zinc-800/50">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                {t.nextLesson}
              </h2>

              {/* Dynamic Contextual Status Label */}
              {nextLesson && (() => {
                const lessonDate = new Date(nextLesson.date);
                const today = new Date();
                today.setHours(0,0,0,0);
                const target = new Date(lessonDate);
                target.setHours(0,0,0,0);
                const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 3600 * 24));
                
                let relText = null;
                if (diffDays === 0) relText = lang === 'nl' ? 'Vandaag' : lang === 'ar' ? 'اليوم' : 'Today';
                else if (diffDays === 1) relText = lang === 'nl' ? 'Morgen' : lang === 'ar' ? 'غداً' : 'Tomorrow';
                else if (diffDays > 1 && diffDays <= 14) relText = lang === 'nl' ? `Over ${diffDays} dagen` : lang === 'ar' ? `خلال ${diffDays} أيام` : `In ${diffDays} days`;

                return relText ? (
                  <span className="ml-1 text-[10px] sm:text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/50 px-2 py-0.5 rounded-md leading-none">
                    {relText}
                  </span>
                ) : null;
              })()}
            </div>

            {nextLesson && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] sm:text-[11px] font-bold tracking-tight leading-none shrink-0">
                <CheckCircle size={12} weight="fill" className="text-emerald-500 shrink-0" />
                <span>{isRtl ? 'مؤكد' : lang === 'nl' ? 'Bevestigd' : 'Confirmed'}</span>
              </span>
            )}
          </div>

          {nextLesson ? (
            <div className="pt-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-5">
              
              {/* Essential Information Grid: Date & Time/Duration */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-5 sm:gap-7 flex-1">
                
                {/* Priority 1: Primary Date Information (Apple Style) */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100/60 dark:border-blue-900/40 flex items-center justify-center shrink-0 shadow-2xs">
                    <CalendarBlank size={17} weight="bold" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-zinc-400 uppercase tracking-wider leading-none">
                      {lang === 'nl' ? 'Datum' : lang === 'ar' ? 'التاريخ' : 'Date'}
                    </p>
                    <p className="font-black text-slate-900 dark:text-white text-base sm:text-[17px] tracking-tight capitalize mt-1.5 leading-none">
                      {new Date(nextLesson.date).toLocaleDateString(isRtl ? 'ar-EG' : lang === 'nl' ? 'nl-NL' : 'en-US', {
                        weekday: 'short', month: 'short', day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:block h-7 w-px bg-slate-100 dark:bg-zinc-800/60" />

                {/* Priority 2 & 3: Time & Duration */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100/60 dark:border-blue-900/40 flex items-center justify-center shrink-0 shadow-2xs">
                    <Clock size={17} weight="bold" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-zinc-400 uppercase tracking-wider leading-none">
                      {lang === 'nl' ? 'Tijd & lesduur' : lang === 'ar' ? 'الوقت والمدة' : 'Time & duration'}
                    </p>
                    <p className="font-extrabold text-slate-900 dark:text-white text-base sm:text-[17px] mt-1.5 leading-none">
                      {nextLesson.time} <span className="text-slate-400 dark:text-zinc-400 font-normal text-xs ml-0.5">
                        ({nextLesson.duration === 1 
                          ? (lang === 'nl' ? '1 uur' : lang === 'ar' ? 'ساعة واحدة' : '1 hour')
                          : nextLesson.duration === 2
                          ? (lang === 'nl' ? '2 uur' : lang === 'ar' ? 'ساعتان' : '2 hours')
                          : nextLesson.duration === 1.5
                          ? (lang === 'nl' ? '90 min' : lang === 'ar' ? '90 دقيقة' : '90 min')
                          : `${nextLesson.duration} ${lang === 'nl' ? 'uur' : lang === 'ar' ? 'ساعة' : 'hours'}`
                        })
                      </span>
                    </p>
                  </div>
                </div>

              </div>

              {/* Action Button: Apple Style Secondary Button */}
              <div className="shrink-0 flex items-center pt-1 sm:pt-0">
                <button 
                  id="goto-lessons-tab-btn"
                  onClick={() => setActiveTab('lessons')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100/80 hover:bg-slate-200/70 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-slate-800 hover:text-slate-950 dark:text-zinc-100 dark:hover:text-white border border-slate-200/70 dark:border-zinc-700/70 rounded-xl text-xs font-bold active:scale-97 transition-all duration-150 cursor-pointer shadow-2xs"
                >
                  <span>{lang === 'nl' ? 'Lesdetails' : lang === 'ar' ? 'تفاصيل الدرس' : 'Lesson details'}</span>
                  <CaretRight size={13} weight="bold" className={`shrink-0 ${isRtl ? 'rotate-180' : ''}`} />
                </button>
              </div>

            </div>
          ) : (
            <div className="py-4 flex flex-col items-center text-center space-y-1.5">
              <div className="w-7 h-7 rounded-md bg-slate-100/80 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 flex items-center justify-center">
                <CalendarBlank size={16} weight="bold" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200">{t.noLessonsBooked}</p>
              </div>
              <button 
                onClick={() => setActiveTab('lessons')}
                className="mt-0.5 inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
              >
                <span>{t.bookLesson}</span>
                <CaretRight size={12} weight="bold" className={isRtl ? 'rotate-180' : ''} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 7. Progress Gauges & AI Assistant */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
        {/* Driving Progress Dashboard Card */}
        <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-[24px] shadow-[0_10px_32px_rgba(0,0,0,0.035)] dark:shadow-[0_10px_32px_rgba(0,0,0,0.25)] flex flex-col justify-between transition-all duration-200">
          {/* Header Row */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/50">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                {t.progress}
              </h2>
            </div>
          </div>

          {/* Body: Connected Ring -> Motivation -> Achievement -> Stats */}
          <div className="pt-3 pb-1 flex flex-col items-center justify-center text-center">
            {/* Apple Fitness Style Hero Ring */}
            <div className="relative shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 120 120" className="w-40 h-40 sm:w-44 sm:h-44 transform -rotate-90">
                <circle 
                  cx="60" cy="60" r="50" 
                  stroke="currentColor" 
                  strokeWidth="8.5" 
                  fill="transparent" 
                  className="text-slate-100 dark:text-zinc-800/80" 
                />
                <circle 
                  cx="60" cy="60" r="50" 
                  stroke="currentColor" 
                  strokeWidth="8.5" 
                  fill="transparent" 
                  strokeDasharray={2 * Math.PI * 50}
                  strokeDashoffset={
                    isRingAnimated 
                      ? 2 * Math.PI * 50 * (1 - Math.min(100, Math.max(0, progressPercentage)) / 100)
                      : 2 * Math.PI * 50
                  }
                  strokeLinecap="round"
                  className="text-blue-600 dark:text-blue-500 transition-all duration-1000 ease-out drop-shadow-[0_2px_8px_rgba(37,99,235,0.2)]"
                />
              </svg>
              <div className="absolute flex flex-col items-center text-center">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                  {progressPercentage}%
                </span>
                <span className="text-[10px] sm:text-[10.5px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider mt-1.5 leading-none">
                  {isRtl ? "تقدم الدورة" : lang === "nl" ? "Rijopleiding" : "Course Progress"}
                </span>
              </div>
            </div>

            {/* Motivation & Dynamic Achievement Sentence (Visually connected to ring) */}
            <div className="mt-3 px-3 text-center flex flex-col items-center gap-1">
              <p className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                {motivationMessage}
              </p>
              <p className="text-[11.5px] sm:text-xs font-normal text-slate-500 dark:text-zinc-400 tracking-tight leading-snug">
                {achievementSentence}
              </p>
            </div>

            {/* Fully Integrated Statistics Panel (Seamless border-t divider layout) */}
            <div className="w-full pt-3.5 mt-4 border-t border-slate-100 dark:border-zinc-800/60 grid grid-cols-2 divide-x divide-slate-100 dark:divide-zinc-800/60">
              {/* Completed */}
              <div className="flex flex-col items-center justify-center text-center px-2">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-zinc-400 uppercase tracking-wider leading-none">
                  {lang === "nl" ? "Voltooid" : lang === "ar" ? "المكتمل" : "Completed"}
                </span>
                <div className="flex items-baseline gap-1 mt-1.5 leading-none">
                  <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {completedHours}
                  </span>
                  <span className="text-xs font-bold text-slate-400 dark:text-zinc-500">
                    {lang === "nl" ? "uur" : lang === "ar" ? "ساعة" : "hrs"}
                  </span>
                </div>
              </div>

              {/* Remaining */}
              <div className="flex flex-col items-center justify-center text-center px-2">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-zinc-400 uppercase tracking-wider leading-none">
                  {lang === "nl" ? "Resterend" : lang === "ar" ? "المتبقي" : "Remaining"}
                </span>
                <div className="flex items-baseline gap-1 mt-1.5 leading-none">
                  <span className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
                    {remainingHours}
                  </span>
                  <span className="text-xs font-bold text-blue-500/70 dark:text-blue-400/70">
                    {lang === "nl" ? "uur" : lang === "ar" ? "ساعة" : "hrs"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Driving School AI Card - Personal Assistant */}
        <div 
          onClick={() => {
            if (setLearningActiveSubTab) setLearningActiveSubTab('coaching');
            setActiveTab('learning');
          }}
          className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-[24px] shadow-[0_10px_32px_rgba(0,0,0,0.035)] dark:shadow-[0_10px_32px_rgba(0,0,0,0.25)] flex flex-col justify-between transition-all duration-200 cursor-pointer group hover:border-blue-400/50 dark:hover:border-blue-500/50"
        >
          {/* Header Row */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/50">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                {getAiAssistantName(schoolSettings)}
              </h2>
            </div>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
              AI
            </span>
          </div>

          {/* Body: Refined Ambient Focal Point + Contextual Message */}
          <div className="pt-3 pb-2 flex flex-col items-center justify-center text-center">
            {/* Refined AI Brain Focal Point with Soft Blue Aura (Apple Intelligence Style) */}
            <div className="relative shrink-0 flex items-center justify-center my-1">
              {/* Soft Subtle Ambient Radial Glow */}
              <div className="absolute inset-0 w-16 h-16 -m-1 rounded-2xl bg-blue-500/10 dark:bg-blue-500/15 blur-lg pointer-events-none transition-opacity duration-300 group-hover:opacity-100"></div>
              
              {/* Minimal Squircle Icon Container */}
              <div className="relative w-14 h-14 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs group-hover:scale-105 transition-transform duration-300">
                <Brain size={28} weight="duotone" className="text-blue-600 dark:text-blue-400 drop-shadow-[0_2px_8px_rgba(37,99,235,0.2)]" />
              </div>
            </div>

            {/* Dynamic Contextual Headlines */}
            <div className="mt-3 px-2 flex flex-col items-center">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                {aiAssistantContext.headline}
              </h3>
              <p className="text-xs font-normal text-slate-500 dark:text-zinc-400 tracking-tight leading-relaxed mt-1.5 max-w-[280px]">
                {aiAssistantContext.detail}
              </p>
            </div>
          </div>

          {/* Bottom Action: Clean Apple-Style Secondary Action */}
          <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/60">
            <div className="w-full py-2.5 px-4 bg-slate-50 dark:bg-zinc-800/50 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 border border-slate-200/60 dark:border-zinc-700/60 hover:border-blue-200 dark:hover:border-blue-800/60 rounded-xl transition-all duration-200 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              <div className="flex items-center gap-2">
                <Brain size={15} weight="duotone" className="text-blue-600 dark:text-blue-400" />
                <span>{aiAssistantContext.action}</span>
              </div>
              <ArrowRight size={14} weight="bold" className={`text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors transform ${isRtl ? 'rotate-180 group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* 8. Social Links Footer */}
      <div 
        id="follow-us-section"
        className="mt-4 p-5 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-[22px] shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="space-y-0.5">
          <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
            {isRtl ? 'تابعنا على وسائل التواصل' : lang === 'nl' ? 'Volg Ons' : 'Follow Us'}
          </h3>
          <p className="text-xs text-slate-400">
            {isRtl 
              ? `ابقَ على اطلاع بأحدث النصائح والعروض عبر قنواتنا الرسمية.` 
              : `Stay updated with tips and announcements from our school.`}
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0 justify-center">
          <a
            href={schoolSettings?.facebookUrl || "https://facebook.com"}
            target="_blank"
            rel="noopener noreferrer"
            title="Facebook"
            className="flex items-center justify-center w-10 h-10 bg-slate-50 dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700 hover:border-blue-500 rounded-xl transition-all text-blue-600 dark:text-blue-400"
          >
            <FacebookLogo size={18} weight="bold" />
          </a>
          <a
            href={schoolSettings?.youtubeUrl || "https://youtube.com"}
            target="_blank"
            rel="noopener noreferrer"
            title="YouTube"
            className="flex items-center justify-center w-10 h-10 bg-slate-50 dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700 hover:border-red-500 rounded-xl transition-all text-red-600 dark:text-red-400"
          >
            <YoutubeLogo size={18} weight="bold" />
          </a>
          <a
            href={schoolSettings?.instagramUrl || "https://instagram.com"}
            target="_blank"
            rel="noopener noreferrer"
            title="Instagram"
            className="flex items-center justify-center w-10 h-10 bg-slate-50 dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700 hover:border-pink-500 rounded-xl transition-all text-pink-600 dark:text-pink-400"
          >
            <InstagramLogo size={18} weight="bold" />
          </a>
          <a
            href={schoolSettings?.googleBusinessUrl || "https://google.com"}
            target="_blank"
            rel="noopener noreferrer"
            title="Google Business"
            className="flex items-center justify-center w-10 h-10 bg-slate-50 dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700 hover:border-amber-500 rounded-xl transition-all text-amber-600 dark:text-amber-400"
          >
            <Globe size={18} weight="bold" />
          </a>
        </div>
      </div>

    </div>
  );
}

const StudentHome = React.memo(StudentHomeComponent);
export default StudentHome;
