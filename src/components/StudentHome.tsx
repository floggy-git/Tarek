import { 
  Calendar, Wallet, CheckCircle, Flame, Trophy, 
  Sparkles, UserCheck, AlertTriangle, ChevronRight, MessageSquare 
} from 'lucide-react';
import { TRANSLATIONS, Language, Lesson, WalletTransaction } from '../types';

interface StudentHomeProps {
  lang: Language;
  t: typeof TRANSLATIONS['en'];
  lessons: Lesson[];
  transactions: WalletTransaction[];
  setActiveTab: (tab: string) => void;
  isOffline: boolean;
  selectedReplayLessonId?: string;
  setSelectedReplayLessonId?: (id: string) => void;
  currentUser?: any;
}

export default function StudentHome({ 
  lang, t, lessons, transactions, setActiveTab, isOffline,
  selectedReplayLessonId, setSelectedReplayLessonId, currentUser
}: StudentHomeProps) {
  // Find next upcoming lesson
  const upcomingLessonsList = lessons.filter(l => l.status === 'upcoming');
  const nextLesson = upcomingLessonsList.length > 0 ? upcomingLessonsList[0] : null;

  // Counts
  const completedCount = lessons.filter(l => l.status === 'completed').length;
  const upcomingCount = upcomingLessonsList.length;

  // Total completed hours (assuming 1H or 2H per lesson)
  const completedHours = lessons
    .filter(l => l.status === 'completed')
    .reduce((sum, current) => sum + current.duration, 0);

  // Calculate wallet balance
  const currentBalance = transactions.reduce((acc, curr) => {
    return curr.type === 'deposit' ? acc + curr.amount : acc - curr.amount;
  }, 0);

  // Stats
  const progressPercentage = Math.min(Math.round((completedHours / 40) * 100), 100); // 40 hours target
  const examReadinessScore = Math.min(30 + completedCount * 12 + (completedHours * 1.5), 98); // dynamic calculation

  // Badges count
  const earnedBadges = 2; // Hardcoded initial unlocked badge value

  return (
    <div className="space-y-6 pb-20">
      
      {/* Offline sync banner if offline */}
      {isOffline && (
        <div id="offline-banner" className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30 text-xs shadow-lg animate-pulse" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <span>{t.offlineMsg}</span>
        </div>
      )}

      {/* Top Greeting Card */}
      <div 
        id="dashboard-header"
        className="relative overflow-hidden p-6 rounded-3xl bg-linear-to-r from-blue-700 via-indigo-800 to-blue-950 text-white shadow-2xl border border-indigo-500/30"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md text-blue-200 border border-white/10 mb-3">
              <Sparkles className="h-3 ml-1" />
              Al-Andalos Elite Rijschool
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {t.welcomeBack} <span className="bg-linear-to-r from-blue-200 to-white bg-clip-text text-transparent">{currentUser?.name || "Amir Al-Hassan"}</span>
            </h1>
            <p className="text-sm font-medium text-blue-100/85 mt-1.5">{t.readyToDrive}</p>
          </div>
          
          <div className="flex bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl p-3 items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/30 text-blue-300">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-blue-200 uppercase tracking-widest leading-none">Instructeur</p>
              <h3 className="text-sm font-bold mt-0.5">Samir El-Filali</h3>
              <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                {t.online}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Highlights Metrics Cards Grid */}
      <div 
        id="quick-stats-grid"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Metric 1 */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm hover:translate-y-[-2px] transition duration-300">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-semibold">{t.upcomingLessons}</span>
            <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2 dark:text-white">{upcomingCount} <span className="text-xs font-normal text-slate-400">{t.lessons.toLowerCase()}</span></p>
        </div>

        {/* Metric 2 */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm hover:translate-y-[-2px] transition duration-300">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-semibold">{t.completedLessons}</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2 dark:text-white">{completedCount} <span className="text-xs font-normal text-slate-400">{t.lessons.toLowerCase()}</span></p>
        </div>

        {/* Metric 3 */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm hover:translate-y-[-2px] transition duration-300">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-semibold">{t.balance}</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2 text-indigo-600 dark:text-indigo-400 font-mono">€{currentBalance}</p>
        </div>

        {/* Metric 4 */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm hover:translate-y-[-2px] transition duration-300">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-semibold">{t.achievements.split('&')[0]}</span>
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <Trophy className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2 dark:text-white">{earnedBadges} <span className="text-xs font-normal text-slate-400">/ 4</span></p>
        </div>
      </div>

      {/* Primary Section: Next Lesson Details */}
      <div 
        id="dashboard-analytics-split"
        className="w-full"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Next Lesson Details */}
        <div className="p-6 bg-linear-to-b from-slate-50 to-white dark:from-zinc-900 dark:to-zinc-950 border border-slate-100 dark:border-zinc-800/85 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6">
          <div className="flex-1">
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-650 animate-pulse"></span>
              {t.nextLesson}
            </h2>

            {nextLesson ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white dark:bg-zinc-900/40 rounded-2xl border border-slate-100 dark:border-zinc-800/40">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t.date}</p>
                  <p className="font-extrabold text-slate-800 dark:text-zinc-200 text-sm mt-1">
                    {new Date(nextLesson.date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : lang === 'nl' ? 'nl-NL' : 'en-US', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 col-span-1">
                  <div className="p-4 bg-white dark:bg-zinc-900/40 rounded-2xl border border-slate-100 dark:border-zinc-800/40">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t.selectTime}</p>
                    <p className="font-extrabold text-slate-800 dark:text-zinc-200 text-sm mt-1">{nextLesson.time}</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-zinc-900/40 rounded-2xl border border-slate-100 dark:border-zinc-800/40">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t.duration}</p>
                    <p className="font-extrabold text-slate-800 dark:text-zinc-200 text-sm mt-1">
                      {nextLesson.duration} {nextLesson.duration === 1 ? t.oneHour : t.twoHours}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-zinc-900/40 rounded-2xl border border-slate-100 dark:border-zinc-800/40">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t.pickupLocation}</p>
                  <p className="font-extrabold text-slate-800 dark:text-zinc-200 text-xs mt-1 break-all">{nextLesson.pickupLocation}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-slate-400 dark:text-zinc-500">{t.noLessonsBooked}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center shrink-0 md:border-l md:border-slate-100 md:dark:border-zinc-800 md:pl-6 md:rtl:border-l-0 md:rtl:border-r md:rtl:pl-0 md:rtl:pr-6 min-w-[200px]">
            <button 
              id="goto-lessons-tab-btn"
              onClick={() => setActiveTab('lessons')}
              className="w-full flex justify-between items-center px-5 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-black transition shadow-md shadow-blue-500/10 cursor-pointer gap-2"
            >
              <span>{t.bookLesson}</span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* Sleek Progress Gauges Grid */}
      <div 
        id="dashboard-progress-meters"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Driving Goals meter */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/85 rounded-3xl shadow-sm flex flex-col md:flex-row items-center gap-6">
          <div className="relative shrink-0 flex items-center justify-center">
            {/* Circle SVG Progress */}
            <svg className="w-28 h-28 transform -rotate-90">
              <circle cx="56" cy="56" r="48" stroke="#f1f5f9" strokeWidth="8" fill="transparent" className="dark:stroke-zinc-800" />
              <circle 
                cx="56" cy="56" r="48" 
                stroke="#3b82f6" strokeWidth="8" fill="transparent" 
                strokeDasharray={2 * Math.PI * 48}
                strokeDashoffset={2 * Math.PI * 48 * (1 - progressPercentage / 100)}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-xl font-extrabold text-slate-800 dark:text-white">{progressPercentage}%</span>
              <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">Target Pass</span>
            </div>
          </div>

          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">{t.progress}</h3>
            <p className="text-xs text-slate-400 max-w-xs">
              Dutch core driver licenses require 40 verified hours training. You successfully accomplished <span className="font-bold text-blue-500">{completedHours} hours</span> log!
            </p>
            <div className="flex gap-4 mt-2 justify-center md:justify-start">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{t.completedHrs}</p>
                <p className="text-base font-extrabold text-slate-700 dark:text-zinc-200">{completedHours}h</p>
              </div>
              <div className="w-px bg-slate-100 dark:bg-zinc-800"></div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Remaining</p>
                <p className="text-base font-extrabold text-slate-700 dark:text-zinc-200">{Math.max(0, 40 - completedHours)}h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Readiness Exam Meter */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/85 rounded-3xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              {t.examReadiness}
            </h3>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-500/10">
              High Probability Pass
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-end">
              <span className="text-2xl font-black text-slate-800 dark:text-white">{examReadinessScore}%</span>
              <span className="text-xs text-slate-400 font-semibold">Exam Benchmark: 80%</span>
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-linear-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-1000" style={{ width: `${examReadinessScore}%` }}></div>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Al-Andalos exams incorporate theory verification + practical observation. You performed stellar maneuvers on your last lesson (Sloterdijk Roundabout)!
          </p>
        </div>
      </div>

      {/* Floating Interactive Shortcuts */}
      <div 
        id="dashboard-shortcuts"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <button 
          id="shortcut-ai-coach" 
          onClick={() => setActiveTab('learning')}
          className="p-4 bg-linear-to-r from-indigo-950/80 to-blue-900/80 border border-indigo-500/30 rounded-2xl flex items-center justify-between text-left cursor-pointer group hover:border-indigo-500/60 transition"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t.aiCoachShortcut}</h4>
              <p className="text-xs text-indigo-200">{t.aiTrainerChatDesc.substring(0, 48)}...</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-indigo-400 group-hover:translate-x-1 transition" />
        </button>

        <button 
          id="shortcut-wallet" 
          onClick={() => setActiveTab('wallet')}
          className="p-4 bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80 rounded-2xl flex items-center justify-between text-left cursor-pointer group hover:border-slate-300 dark:hover:border-zinc-700 transition"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">{t.wallet}</h4>
              <p className="text-xs text-slate-400">Check balance and download invoices</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition" />
        </button>
      </div>

    </div>
  );
}
