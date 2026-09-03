import React, { useState } from 'react';
import {
  Users,
  Calendar,
  Wallet,
  Receipt,
  Package,
  UserCheck,
  Bell,
  HelpCircle,
  Settings,
  Film,
  BarChart3,
  ShieldAlert,
  Activity,
  ExternalLink,
  RefreshCw,
  Database,
  CheckCircle2,
  FileCode,
  Copy,
  Check
} from 'lucide-react';
import { AdminControlTab, AdminLang, ADMIN_I18N } from './types';
import { generateAppsScriptCode } from '../../utils/googleSheetsControlCenter';
import { getSheetsConfig } from '../../utils/googleSheets';

interface AdminDashboardViewProps {
  lang: AdminLang;
  setActiveTab: (tab: AdminControlTab) => void;
  targetSpreadsheetId: string;
  studentCount: number;
  lessonCount: number;
  packageCount: number;
  walletBalanceTotal: number;
  onRunDiagnostic: () => void;
  onInitSchema: () => void;
  isRunningDiagnostic: boolean;
  isInitializingSchema: boolean;
}

export default function AdminDashboardView({
  lang,
  setActiveTab,
  targetSpreadsheetId,
  studentCount,
  lessonCount,
  packageCount,
  walletBalanceTotal,
  onRunDiagnostic,
  onInitSchema,
  isRunningDiagnostic,
  isInitializingSchema
}: AdminDashboardViewProps) {
  const [copiedScript, setCopiedScript] = useState(false);
  const t = ADMIN_I18N[lang];

  const handleCopyScript = async () => {
    try {
      const sheetsConfig = getSheetsConfig();
      const token = sheetsConfig.accessToken || 'andalos_admin_sec_2026_root_auth';
      const res = await fetch('/api/admin/control-center-script', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-Role': 'admin'
        }
      });
      if (res.ok) {
        const serverScript = await res.text();
        if (serverScript && serverScript.length > 100) {
          await navigator.clipboard.writeText(serverScript);
          setCopiedScript(true);
          setTimeout(() => setCopiedScript(false), 2500);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not fetch server script bundle, falling back to generator:', e);
    }
    const code = generateAppsScriptCode();
    await navigator.clipboard.writeText(code);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const navItems: Array<{
    id: AdminControlTab;
    icon: any;
    title: string;
    description: string;
    badge?: string;
    color: string;
  }> = [
    {
      id: 'students',
      icon: Users,
      title: t.tabs.students,
      description: lang === 'ar' ? 'إدارة بيانات المتدربين، الهوية، والباقات' : lang === 'nl' ? 'Beheer leerlinggegevens, identiteit & pakketten' : 'Manage student profiles, credentials & packages',
      badge: `${studentCount} Records`,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50'
    },
    {
      id: 'lessons',
      icon: Calendar,
      title: t.tabs.lessons,
      description: lang === 'ar' ? 'جدولة الدروس، تعيين المدربين، والتقييمات' : lang === 'nl' ? 'Rooster lessen in, wijs instructeurs toe & beoordeel' : 'Schedule lessons, assign instructors & track ratings',
      badge: `${lessonCount} Lessons`,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'
    },
    {
      id: 'payments',
      icon: Wallet,
      title: t.tabs.payments,
      description: lang === 'ar' ? 'تعديل أرصدة المحفظة، الإيداعات، والحركات' : lang === 'nl' ? 'Saldocorrecties, stortingen & transactiebeheer' : 'Adjust wallet balances, record deposits & transactions',
      badge: `€${walletBalanceTotal.toFixed(2)}`,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50'
    },
    {
      id: 'invoices',
      icon: Receipt,
      title: t.tabs.invoices,
      description: lang === 'ar' ? 'إصدار وتتبع الفواتير والروابط في Google Drive' : lang === 'nl' ? 'Facturen genereren, opvolgen & Drive PDF links' : 'Generate invoices, update status & Drive PDF links',
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50'
    },
    {
      id: 'packages',
      icon: Package,
      title: t.tabs.packages,
      description: lang === 'ar' ? 'إدارة باقات القيادة، الأسعار، والمميزات' : lang === 'nl' ? 'Beheer lespakketten, tarieven & kenmerken' : 'Manage driving packages, pricing & included features',
      badge: `${packageCount} Active`,
      color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900/50'
    },
    {
      id: 'instructors',
      icon: UserCheck,
      title: t.tabs.instructors,
      description: lang === 'ar' ? 'أوقات عمل المدربين، المركبات، والتعويضات' : lang === 'nl' ? 'Instructeursroosters, voertuigen & tarieven' : 'Instructor profiles, working hours & vehicles',
      color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/50'
    },
    {
      id: 'notifications',
      icon: Bell,
      title: t.tabs.notifications,
      description: lang === 'ar' ? 'إرسال تنبيهات مخصصة أو جماعية للطلاب' : lang === 'nl' ? 'Verstuur gerichte of algemene mededelingen' : 'Dispatch custom alerts or broadcast announcements',
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50'
    },
    {
      id: 'help',
      icon: HelpCircle,
      title: t.tabs.help,
      description: lang === 'ar' ? 'الأسئلة الشائعة متعددة اللغات (عربي / هولندي / إنجليزي)' : lang === 'nl' ? 'Meertalige veelgestelde vragen (AR / NL / EN)' : 'Multilingual FAQ knowledge base (AR / NL / EN)',
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/50'
    },
    {
      id: 'settings',
      icon: Settings,
      title: t.tabs.settings,
      description: lang === 'ar' ? 'بيانات المدرسة، KVK، BTW، وسياسات الذكاء الاصطناعي' : lang === 'nl' ? 'Bedrijfsgegevens, KvK, BTW & AI-richtlijnen' : 'School legal profile, KVK, BTW, IBAN & AI policies',
      color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-zinc-800'
    },
    {
      id: 'media',
      icon: Film,
      title: t.tabs.media,
      description: lang === 'ar' ? 'مكتبة الفيديوهات التعليمية ومستندات Google Drive' : lang === 'nl' ? 'Educatieve instructievideo’s & Drive-bestanden' : 'Educational videos library & Google Drive docs',
      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/50'
    },
    {
      id: 'reports',
      icon: BarChart3,
      title: t.tabs.reports,
      description: lang === 'ar' ? 'ملفات الطلاب التراكمية والإيرادات ومعدلات CBR' : lang === 'nl' ? 'Leerlingdossiers, omzetcijfers & CBR slagingsdata' : 'Student progress dossiers, revenue & CBR readiness',
      color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900/50'
    },
    {
      id: 'audit',
      icon: ShieldAlert,
      title: t.tabs.audit,
      description: lang === 'ar' ? 'سجل التدقيق الشامل: من عدل وماذا ومتى' : lang === 'nl' ? 'Auditlogboek: wie heeft wat gewijzigd en wanneer' : 'Security audit trail: who changed what and when',
      color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50'
    },
    {
      id: 'status',
      icon: Activity,
      title: t.tabs.status,
      description: lang === 'ar' ? 'فحص الاتصال الحي بـ Google Sheets والتبويبات' : lang === 'nl' ? 'Live verbindingstest & tabbladen integriteit' : 'Live Google Sheets API ping & tab integrity verification',
      color: 'bg-lime-500/10 text-lime-600 dark:text-lime-400 border-lime-200 dark:border-lime-900/50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Spreadsheet Link */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-200/60 dark:border-blue-900/40 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shrink-0">
              CC
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{t.title}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  LIVE V2.0
                </span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                {t.subtitle}
              </p>
            </div>
          </div>

          <a
            href={`https://docs.google.com/spreadsheets/d/${targetSpreadsheetId}/edit`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-mono text-xs font-semibold border border-slate-200 dark:border-zinc-700 hover:shadow-xs transition self-start sm:self-auto"
          >
            <span>{targetSpreadsheetId.substring(0, 14)}...</span>
            <ExternalLink size={13} />
          </a>
        </div>

        {/* Safety Constraint Warning */}
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-[11px] font-semibold flex items-center gap-2">
          <ShieldAlert size={15} className="shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{t.calendarNotice}</span>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={onInitSchema}
          disabled={isInitializingSchema || isRunningDiagnostic}
          className="py-3 px-4 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
        >
          {isInitializingSchema ? (
            <>
              <RefreshCw size={15} className="animate-spin" />
              <span>Initializing 8 Tabs...</span>
            </>
          ) : (
            <>
              <Database size={15} />
              <span>Initialize 8 Tabs & Schemas</span>
            </>
          )}
        </button>

        <button
          onClick={onRunDiagnostic}
          disabled={isRunningDiagnostic || isInitializingSchema}
          className="py-3 px-4 rounded-xl font-bold text-xs text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-750 active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-zinc-700 disabled:opacity-50"
        >
          {isRunningDiagnostic ? (
            <>
              <RefreshCw size={15} className="animate-spin" />
              <span>Running Write/Read Test...</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={15} className="text-emerald-600" />
              <span>Run Strict Write Test</span>
            </>
          )}
        </button>

        <button
          onClick={handleCopyScript}
          className="py-3 px-4 rounded-xl font-bold text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer border border-indigo-200 dark:border-indigo-900"
        >
          {copiedScript ? (
            <>
              <Check size={15} className="text-emerald-600" />
              <span>Script Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <FileCode size={15} />
              <span>Copy Apps Script Bundle</span>
            </>
          )}
        </button>
      </div>

      {/* Navigation Sections Grid */}
      <div className="space-y-2">
        <h5 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
          {lang === 'ar' ? 'أقسام التحكم الإداري (13 قسماً تشغيلياً)' : lang === 'nl' ? 'Beheerderssecties (13 Operationele Modules)' : 'Administrative Management Areas (13 Operational Modules)'}
        </h5>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-md transition-all text-start flex flex-col justify-between group cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2 w-full mb-2">
                  <div className={`p-2 rounded-lg border ${item.color} group-hover:scale-110 transition-transform`}>
                    <Icon size={18} />
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                      {item.badge}
                    </span>
                  )}
                </div>
                <div>
                  <h6 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h6>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
