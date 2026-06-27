import React, { useState } from 'react';
import { 
  Shield, BarChart4, TrendingUp, Users, Calendar, Inbox, Plus, 
  Settings, UserCheck, RefreshCw, Mail, CheckCircle2, DollarSign 
} from 'lucide-react';
import { TRANSLATIONS, Language, Lesson, WalletTransaction } from '../types';

interface AdminDashboardProps {
  lang: Language;
  t: typeof TRANSLATIONS['en'];
  lessons: Lesson[];
  setLessons: (lessons: Lesson[]) => void;
  transactions: WalletTransaction[];
}

const LOCAL_T = {
  en: {
    escrowRoot: "AUTHORIZED SYSTEM",
    rootAdmin: "Administrator",
    subtitle: "Manage instructors, balances, readiness, and payments.",
    tabOverview: "Overview",
    tabStudents: "Students",
    tabTrainers: "Trainers",
    tabLessons: "Lessons",
    combinedCheckout: "Checkout Volume",
    clearedFees: "Fees Cleared",
    commissionsDisbursed: "Commissions Paid",
    activeCohorts: "Active Staff",
    classLicense: "B-Class licensed instruction",
    chartSubtitle: "Chart shows growth in lesson bookings this quarter.",
    rootParameters: "Settings",
    apiSync: "Calendar Sync",
    smtpTriggers: "Email Triggers",
    questBank: "Questions v2",
    auditBtn: "Audit",
    priceTier: "Trainee PriceTier",
    classLogs: "Lessons Archive",
    studentLabel: "Student",
    instructorLabel: "Instructor",
    costLabel: "Cost",
    joinedLabel: "Joined",
    successEnabled: "Enabled",
    successActive: "Active",
    successLatest: "Latest",
  },
  ar: {
    escrowRoot: "النظام المعتمد",
    rootAdmin: "المدير العام",
    subtitle: "إدارة المدربين، أرصدة الطلاب، جاهزية الاختبار، والمدفوعات.",
    tabOverview: "الرئيسية",
    tabStudents: "المتدربون",
    tabTrainers: "المدربون",
    tabLessons: "الدروس",
    combinedCheckout: "حجم الدفع",
    clearedFees: "الرسوم المسواة",
    commissionsDisbursed: "العمولات المدفوعة",
    activeCohorts: "الموظفون النشطون",
    classLicense: "تدريب فئة B مرخص",
    chartSubtitle: "يوضح المخطط نمو حجز الدروس هذا الربع.",
    rootParameters: "الإعدادات",
    apiSync: "مزامنة التقويم",
    smtpTriggers: "إشعارات البريد",
    questBank: "بنك الأسئلة v2",
    auditBtn: "تدقيق",
    priceTier: "فئة السعر",
    classLogs: "أرشيف الدروس",
    studentLabel: "المتدرب",
    instructorLabel: "المدرب",
    costLabel: "التكلفة",
    joinedLabel: "تاريخ الانضمام",
    successEnabled: "مفعل",
    successActive: "نشط",
    successLatest: "الأحدث",
  },
  nl: {
    escrowRoot: "GEAUTORISEERD SYSTEEM",
    rootAdmin: "Systeembeheerder",
    subtitle: "Beheer rijinstructeurs, leerlingsaldi, examengaranties en betalingen.",
    tabOverview: "Overzicht",
    tabStudents: "Leerlingen",
    tabTrainers: "Instructeurs",
    tabLessons: "Lessen",
    combinedCheckout: "Totaal kassa-volume",
    clearedFees: "Lesgelden Uitbetaald",
    commissionsDisbursed: "Uitgekeerde commissies",
    activeCohorts: "Actieve Instructeurs",
    classLicense: "Actieve B-Klasse rijopleidingen",
    chartSubtitle: "Grafiek toont de groei van lesboekingen in het huidige kwartaal.",
    rootParameters: "Instellingen",
    apiSync: "Agenda Sync",
    smtpTriggers: "E-mail SMTP",
    questBank: "Vragenbank v2",
    auditBtn: "Audit",
    priceTier: "Tarieven Klasse",
    classLogs: "Lessenarchief",
    studentLabel: "Leerling",
    instructorLabel: "Instructeur",
    costLabel: "Kosten",
    joinedLabel: "Inschrijfdatum",
    successEnabled: "Ingeschakeld",
    successActive: "Actief",
    successLatest: "Laatste versie",
  }
};

export default function AdminDashboard({ lang, t, lessons, setLessons, transactions }: AdminDashboardProps) {
  
  const [adminTab, setAdminTab] = useState<'overview' | 'students' | 'trainers' | 'lessons'>('overview');

  const lt = LOCAL_T[lang] || LOCAL_T['en'];

  // Math totals for stats
  const totalRevenue = transactions
    .filter(tx => tx.type === 'deposit')
    .reduce((curr, next) => curr + next.amount, 0);

  const pendingRefundsLogs = transactions
    .filter(tx => tx.type === 'payment')
    .reduce((curr, next) => curr + next.amount, 0);

  const activeStudentsList = [
    { 
      id: "st-1", 
      name: lang === 'ar' ? "أمير الحسن" : "Amir Al-Hassan", 
      email: "floggyc77@gmail.com", 
      joined: "2026-04-10", 
      balance: 195, 
      lessonsCount: 4 
    },
    { 
      id: "st-2", 
      name: lang === 'ar' ? "ساني دي يونغ" : "Sanne de Jong", 
      email: "sanne.dejong@al-andalos.nl", 
      joined: "2026-05-18", 
      balance: 65, 
      lessonsCount: 2 
    },
    { 
      id: "st-3", 
      name: lang === 'ar' ? "مايكل فان بيرغ" : "Michael van Berg", 
      email: "michael.vanberg@outlook.com", 
      joined: "2026-06-01", 
      balance: 340, 
      lessonsCount: 5 
    }
  ];

  const trainersList = [
    { 
      id: "tr-1", 
      name: lang === 'ar' ? "سمير الفيلالي" : "Samir El-Filali", 
      phone: "+31 6 4501 2288", 
      status: lang === 'ar' ? "في تدريب ميداني نشط" : lang === 'nl' ? "Actief training" : "Active training", 
      rate: "€65 / Hr", 
      region: "Amsterdam Sloterdijk" 
    },
    { 
      id: "tr-2", 
      name: lang === 'ar' ? "يوسف بناني" : "Youssef Bennani", 
      phone: "+31 6 8801 9422", 
      status: lang === 'ar' ? "على الطريق الميداني" : lang === 'nl' ? "On road" : "On road", 
      rate: "€70 / Hr", 
      region: "Utrecht Centraal" 
    }
  ];

  return (
    <div className="space-y-6 pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Top Admin Header */}
      <div className="p-6 rounded-3xl bg-linear-to-r from-zinc-900 via-zinc-950 to-slate-950 text-white border border-zinc-800 shadow-md flex justify-between items-center">
        <div className="space-y-1">
          <span className="p-1 px-2.5 bg-yellow-400/25 text-yellow-500 rounded-full text-[9px] font-black tracking-widest border border-yellow-500/10">
            {lt.escrowRoot}
          </span>
          <h1 className="text-xl font-bold mt-1.5 flex items-center gap-1.5">
            <Shield className="h-5 w-5 text-yellow-500" />
            {t.adminDashboard}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">{lt.subtitle}</p>
        </div>
        <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-mono font-bold shrink-0">{lt.rootAdmin}</span>
      </div>

      {/* Navigation segments */}
      <div className="flex bg-slate-100/80 dark:bg-zinc-900/80 p-1 rounded-xl max-w-full overflow-x-auto no-scrollbar gap-1 border border-slate-200/40 dark:border-zinc-800/40 flex-nowrap shrink-0" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {(['overview', 'students', 'trainers', 'lessons'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setAdminTab(tab)}
            className={`px-4 py-2.5 whitespace-nowrap text-xs font-semibold rounded-lg transition-all duration-150 shrink-0 cursor-pointer ${
              adminTab === tab
                ? 'bg-white dark:bg-zinc-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/50 dark:border-zinc-700/50 font-bold'
                : 'text-slate-500 hover:text-slate-850 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-white/40 dark:hover:bg-zinc-800/10'
            }`}
          >
            {tab === 'overview' ? lt.tabOverview : tab === 'students' ? lt.tabStudents : tab === 'trainers' ? lt.tabTrainers : lt.tabLessons}
          </button>
        ))}
      </div>

      {adminTab === 'overview' && (
        <div id="admin-overview" className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Stat Box 1 */}
            <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl shadow-xs space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t.revenue}</span>
              <p className="text-3xl font-black text-slate-800 dark:text-white font-mono">€{totalRevenue}</p>
              <p className="text-xs text-slate-400">{lt.combinedCheckout}</p>
            </div>

            {/* Stat Box 2 */}
            <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl shadow-xs space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{lang === 'ar' ? 'الرسوم المسواة للمدربين' : 'Fees Cleared'}</span>
              <p className="text-3xl font-black text-blue-600 dark:text-blue-400 font-mono">€{pendingRefundsLogs}</p>
              <p className="text-xs text-slate-400">{lt.commissionsDisbursed}</p>
            </div>

            {/* Stat Box 3 */}
            <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl shadow-xs space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{lt.activeCohorts}</span>
              <p className="text-3xl font-black text-slate-800 dark:text-white">
                {lang === 'ar' ? '5 موظفين نشطين' : '5 Employees'}
              </p>
              <p className="text-xs text-slate-400">{lt.classLicense}</p>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Simple Dynamic SVG Chart of business perform */}
            <div id="admin-charts" className="lg:col-span-8 p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl shadow-xs space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-zinc-800">
                <BarChart4 className="h-4 w-4 text-blue-500" />
                {t.reports} & {lang === 'ar' ? 'المؤشرات' : 'Statistics'}
              </h3>

              <div className="h-44 w-full bg-slate-55 relative rounded-2xl overflow-hidden border border-slate-100 dark:border-zinc-950 flex flex-col justify-end p-3">
                <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
                  {/* Grid layout */}
                  <line x1="0" y1="30" x2="600" y2="30" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-zinc-800" />
                  <line x1="0" y1="80" x2="600" y2="80" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-zinc-800" />
                  <line x1="0" y1="130" x2="600" y2="130" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-zinc-800" />

                  {/* Bezier Area Graph */}
                  <path
                    d="M 20,130 Q 100,60 200,100 T 400,30 L 600,30 L 600,160 L 20,160 Z"
                    fill="url(#blue-grad-svg)"
                    opacity="0.15"
                  />
                  <path
                    d="M 20,130 Q 100,60 200,100 T 400,30"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                  />

                  <defs>
                    <linearGradient id="blue-grad-svg" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="relative flex justify-between px-4 text-[9px] font-mono font-bold text-slate-400">
                  <span>{lang === 'ar' ? 'الأسبوع ١' : 'WEEK 1'}</span>
                  <span>{lang === 'ar' ? 'الأسبوع ٢' : 'WEEK 2'}</span>
                  <span>{lang === 'ar' ? 'الأسبوع ٣' : 'WEEK 3'}</span>
                  <span>{lang === 'ar' ? 'الأسبوع ٤' : 'WEEK 4'}</span>
                </div>
              </div>

              <p className="text-xs text-slate-400">{lt.chartSubtitle}</p>
            </div>

            {/* General Settings */}
            <div className="lg:col-span-4 p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl shadow-xs space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm pb-2 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-1.5">
                <Settings className="h-4 w-4 text-blue-500" />
                {lt.rootParameters}
              </h3>

              <div className="space-y-3 font-semibold text-xs">
                <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-zinc-950 rounded-xl">
                  <span className="text-slate-500">{lt.apiSync}</span>
                  <span className="p-1 px-2.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-bold">{lt.successEnabled}</span>
                </div>

                <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-zinc-950 rounded-xl">
                  <span className="text-slate-500">{lt.smtpTriggers}</span>
                  <span className="p-1 px-2.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-bold">{lt.successActive}</span>
                </div>

                <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-zinc-950 rounded-xl">
                  <span className="text-slate-500">{lt.questBank}</span>
                  <span className="p-1 px-2.5 bg-blue-500/10 text-blue-500 rounded-lg text-[10px] font-bold">{lt.successLatest}</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {adminTab === 'students' && (
        <div id="admin-students-panel" className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-white text-base">{t.studentList}</h3>

          <div className="space-y-3">
            {activeStudentsList.map(st => (
              <div key={st.id} className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-150 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-0.5 text-xs">
                  <h4 className="font-bold text-slate-800 dark:text-zinc-250 text-sm">{st.name}</h4>
                  <p className="text-slate-400 font-semibold">{st.email} • Code ID: {st.id}</p>
                  <p className="text-slate-400">{lt.joinedLabel}: {st.joined}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">{lang === 'ar' ? 'رصيد المحفظة المالي' : 'Wallet balance'}</p>
                    <p className="text-sm font-bold text-indigo-500 font-mono">€{st.balance}</p>
                  </div>
                  <button
                    onClick={() => {
                      alert(lang === 'ar' ? `تم تفويض طلب فحص ملف المتدرب ${st.name} وتأكيده مع إدارة الأندلس بنجاح.` : `${st.name} practical profile audit requested correctly.`);
                    }}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition"
                  >
                    {lang === 'ar' ? 'تدقيق طبي وعملي' : lt.auditBtn}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {adminTab === 'trainers' && (
        <div id="admin-trainers-panel" className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-white text-base">{t.trainerList}</h3>

          <div className="space-y-3">
            {trainersList.map(tr => (
              <div key={tr.id} className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-150 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-0.5 text-xs">
                  <h4 className="font-bold text-slate-800 dark:text-zinc-250 text-sm">{tr.name}</h4>
                  <p className="text-slate-400">{lang === 'ar' ? 'خط الاتصال للتنسيق الكلي:' : 'Roster Contact:'} {tr.phone} • {lang === 'ar' ? 'منطقة التدريب المعتمدة:' : 'Region:'} {tr.region}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">{lt.priceTier}</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">{tr.rate}</p>
                  </div>
                  <span className="p-1 px-2 text-[9px] font-bold bg-emerald-500/10 text-emerald-500 rounded-md">
                    {tr.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {adminTab === 'lessons' && (
        <div id="admin-lessons-panel" className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-white text-base">{lt.classLogs}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lessons.map(ls => (
              <div key={ls.id} className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-150 dark:border-zinc-900 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-zinc-400">{ls.id}</span>
                  <span className={`p-1 px-2.5 rounded-full text-[9px] font-black uppercase ${
                    ls.status === 'upcoming' 
                      ? 'bg-blue-500/10 text-blue-600' 
                      : ls.status === 'completed' 
                        ? 'bg-emerald-500/10 text-emerald-600' 
                        : 'bg-red-500/10 text-red-500'
                  }`}>
                    {ls.status === 'upcoming' ? (lang === 'ar' ? 'قادمة' : 'upcoming') : ls.status === 'completed' ? (lang === 'ar' ? 'مكتملة' : 'completed') : (lang === 'ar' ? 'ملغاة' : 'cancelled')}
                  </span>
                </div>

                <div className="space-y-1.5 font-medium">
                  <p className="text-slate-800 dark:text-zinc-200">{lt.studentLabel}: <span className="font-bold">{ls.studentName}</span></p>
                  <p className="text-slate-500">{lt.instructorLabel}: <span className="font-bold text-slate-650">{ls.trainerName}</span></p>
                  <p className="text-slate-400 font-mono text-[10px]">{ls.date} | {lt.costLabel}: €{ls.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
