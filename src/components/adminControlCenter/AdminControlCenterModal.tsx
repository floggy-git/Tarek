import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  RefreshCw,
  Globe,
  Database,
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
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  AdminControlTab,
  AdminLang,
  ADMIN_I18N
} from './types';
import {
  StudentRecord,
  Lesson,
  WalletTransaction,
  InvoiceRecord,
  DrivePackage,
  SchoolSettings,
  MediaVideo
} from '../../types';

// Subviews
import AdminDashboardView from './AdminDashboardView';
import AdminStudentsView from './AdminStudentsView';
import AdminLessonsView from './AdminLessonsView';
import AdminPaymentsView from './AdminPaymentsView';
import AdminInvoicesView from './AdminInvoicesView';
import AdminPackagesView from './AdminPackagesView';
import AdminInstructorsView from './AdminInstructorsView';
import AdminNotificationsView from './AdminNotificationsView';
import AdminHelpView from './AdminHelpView';
import AdminSettingsView from './AdminSettingsView';
import AdminMediaView from './AdminMediaView';
import AdminReportsView from './AdminReportsView';
import AdminAuditLogsView from './AdminAuditLogsView';
import AdminSystemStatusView from './AdminSystemStatusView';

import {
  testGoogleSheetsWriteRead,
  initializeGoogleSheetsStructure
} from '../../services/googleSheetsService';
import { recordAdminAuditLog } from '../../utils/adminAuditLogger';

interface AdminControlCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLang?: AdminLang;
  spreadsheetId?: string;
  students: StudentRecord[];
  setStudents: React.Dispatch<React.SetStateAction<StudentRecord[]>>;
  lessons: Lesson[];
  setLessons: React.Dispatch<React.SetStateAction<Lesson[]>>;
  packages: DrivePackage[];
  setPackages: React.Dispatch<React.SetStateAction<DrivePackage[]>>;
  schoolSettings: any;
  setSchoolSettings: React.Dispatch<React.SetStateAction<any>>;
}

export default function AdminControlCenterModal({
  isOpen,
  onClose,
  defaultLang = 'nl',
  spreadsheetId = '1nKF40i125QY7MQMghOoOnyqjpHLFWKM12ZYIIGxW9Ck',
  students,
  setStudents,
  lessons,
  setLessons,
  packages,
  setPackages,
  schoolSettings,
  setSchoolSettings
}: AdminControlCenterModalProps) {
  const [activeTab, setActiveTab] = useState<AdminControlTab>('dashboard');
  const [lang, setLang] = useState<AdminLang>(defaultLang);
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Invoices state
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(() => {
    try {
      const raw = localStorage.getItem('drivingschool_invoices');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  // Transactions state
  const [transactions, setTransactions] = useState<WalletTransaction[]>(() => {
    try {
      const raw = localStorage.getItem('drivingschool_transactions');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  // Media videos state
  const [mediaVideos, setMediaVideos] = useState<MediaVideo[]>(() => {
    try {
      const raw = localStorage.getItem('drivingschool_media_videos');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      {
        id: 'VID-001',
        title: 'Priority Rules at Dutch Roundabouts',
        titleAr: 'قواعد الأولوية عند الدوارات في هولندا',
        titleNl: 'Voorrangsregels op Nederlandse rotondes',
        category: 'Traffic Rules',
        duration: '06:45',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        isEnabled: true,
        displayOrder: 1
      },
      {
        id: 'VID-002',
        title: 'Parallel Parking Step-by-Step for CBR',
        titleAr: 'خطوات الركن الموازي لاختبار القيادة CBR',
        titleNl: 'Fileparkeren stap-voor-stap voor het CBR praktijkexamen',
        category: 'Special Maneuvers',
        duration: '08:20',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        isEnabled: true,
        displayOrder: 2
      }
    ];
  });

  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [isInitializingSchema, setIsInitializingSchema] = useState(false);

  const t = ADMIN_I18N[lang];
  const isRtl = lang === 'ar';

  const showToast = (msg: string, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleRunDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    try {
      const res = await testGoogleSheetsWriteRead(spreadsheetId);
      if (res.success) {
        showToast(
          lang === 'ar'
            ? 'نجح اختبار فحص الاتصال وقراءة/كتابة الجدول الحي'
            : 'Google Sheets live read/write test succeeded!'
        );
        await recordAdminAuditLog({
          action: 'Diagnostic Test Run',
          targetRecord: `Spreadsheet: ${spreadsheetId}`,
          newValue: 'PASS: write, read-back & cleanup',
          source: 'Control Center'
        });
      } else {
        showToast(res.error || 'Diagnostic test failed.', true);
      }
    } catch (err: any) {
      showToast(err.message || 'Error running diagnostic.', true);
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

  const handleInitSchema = async () => {
    setIsInitializingSchema(true);
    try {
      const res = await initializeGoogleSheetsStructure(spreadsheetId);
      if (res.success) {
        showToast(
          lang === 'ar'
            ? 'تم التحقق من جاهزية علامات التبويب الـ 8 في جدول البيانات'
            : 'All 8 operational sheets verified/initialized in Google Spreadsheet!'
        );
        await recordAdminAuditLog({
          action: 'Schema Initialized',
          targetRecord: 'All 8 Operational Tabs',
          newValue: 'Complete structure synchronized',
          source: 'Control Center'
        });
      } else {
        showToast(res.error || 'Failed to initialize schema.', true);
      }
    } catch (err: any) {
      showToast(err.message || 'Error initializing schema.', true);
    } finally {
      setIsInitializingSchema(false);
    }
  };

  if (!isOpen) return null;

  const totalWalletBalance = students.reduce((sum, s) => sum + (s.balance || 0), 0);

  const tabList: Array<{ id: AdminControlTab; label: string; icon: any }> = [
    { id: 'dashboard', label: t.tabs.dashboard, icon: Activity },
    { id: 'students', label: t.tabs.students, icon: Users },
    { id: 'lessons', label: t.tabs.lessons, icon: Calendar },
    { id: 'payments', label: t.tabs.payments, icon: Wallet },
    { id: 'invoices', label: t.tabs.invoices, icon: Receipt },
    { id: 'packages', label: t.tabs.packages, icon: Package },
    { id: 'instructors', label: t.tabs.instructors, icon: UserCheck },
    { id: 'notifications', label: t.tabs.notifications, icon: Bell },
    { id: 'help', label: t.tabs.help, icon: HelpCircle },
    { id: 'settings', label: t.tabs.settings, icon: Settings },
    { id: 'media', label: t.tabs.media, icon: Film },
    { id: 'reports', label: t.tabs.reports, icon: BarChart3 },
    { id: 'audit', label: t.tabs.audit, icon: ShieldAlert },
    { id: 'status', label: t.tabs.status, icon: Activity }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-7xl h-[94vh] bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-zinc-100">
        {/* Top App Bar */}
        <div className="h-16 px-4 sm:px-6 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          {/* Brand & Spreadsheet indicator */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black shadow-md shrink-0">
              <Database size={20} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                  {t.title}
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Google Sheets Connected</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono truncate">
                ID: {spreadsheetId}
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Open Google Sheet Link */}
            <a
              href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 border border-slate-200 dark:border-zinc-700 transition"
              title="Open Google Spreadsheet in new tab"
            >
              <span>Spreadsheet</span>
              <ExternalLink size={12} />
            </a>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-zinc-800 rounded-xl p-0.5 border border-slate-200 dark:border-zinc-700 text-xs">
              {(['ar', 'nl', 'en'] as AdminLang[]).map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                    lang === l
                      ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-300 shadow-2xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="Close Admin Control Center"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main Body with Tabs Bar & Viewport */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable Navigation Tabs Ribbon */}
          <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xs border-b border-slate-200 dark:border-zinc-800 px-4 py-2 shrink-0 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 min-w-max">
              {tabList.map(tab => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <IconComponent size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subview Active Content Area */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
            {activeTab === 'dashboard' && (
              <AdminDashboardView
                lang={lang}
                setActiveTab={setActiveTab}
                targetSpreadsheetId={spreadsheetId}
                studentCount={students.length}
                lessonCount={lessons.length}
                packageCount={packages.length}
                walletBalanceTotal={totalWalletBalance}
                onRunDiagnostic={handleRunDiagnostic}
                onInitSchema={handleInitSchema}
                isRunningDiagnostic={isRunningDiagnostic}
                isInitializingSchema={isInitializingSchema}
              />
            )}

            {activeTab === 'students' && (
              <AdminStudentsView
                lang={lang}
                students={students}
                setStudents={setStudents}
                packages={packages}
                spreadsheetId={spreadsheetId}
                onShowMessage={showToast}
              />
            )}

            {activeTab === 'lessons' && (
              <AdminLessonsView
                lang={lang}
                lessons={lessons}
                setLessons={setLessons}
                students={students}
                spreadsheetId={spreadsheetId}
                onShowMessage={showToast}
              />
            )}

            {activeTab === 'payments' && (
              <AdminPaymentsView
                lang={lang}
                students={students}
                setStudents={setStudents}
                transactions={transactions}
                setTransactions={setTransactions}
                spreadsheetId={spreadsheetId}
                onShowMessage={showToast}
              />
            )}

            {activeTab === 'invoices' && (
              <AdminInvoicesView
                lang={lang}
                invoices={invoices}
                setInvoices={setInvoices}
                students={students}
                spreadsheetId={spreadsheetId}
                onShowMessage={showToast}
              />
            )}

            {activeTab === 'packages' && (
              <AdminPackagesView
                lang={lang}
                packages={packages}
                setPackages={setPackages}
                spreadsheetId={spreadsheetId}
                onShowMessage={showToast}
              />
            )}

            {activeTab === 'instructors' && (
              <AdminInstructorsView
                lang={lang}
                schoolSettings={schoolSettings}
                setSchoolSettings={setSchoolSettings}
                onShowMessage={showToast}
              />
            )}

            {activeTab === 'notifications' && (
              <AdminNotificationsView
                lang={lang}
                students={students}
                spreadsheetId={spreadsheetId}
                onShowMessage={showToast}
              />
            )}

            {activeTab === 'help' && (
              <AdminHelpView
                lang={lang}
                spreadsheetId={spreadsheetId}
                onShowMessage={showToast}
              />
            )}

            {activeTab === 'settings' && (
              <AdminSettingsView
                lang={lang}
                schoolSettings={schoolSettings}
                setSchoolSettings={setSchoolSettings}
                spreadsheetId={spreadsheetId}
                onShowMessage={showToast}
              />
            )}

            {activeTab === 'media' && (
              <AdminMediaView
                lang={lang}
                mediaVideos={mediaVideos}
                setMediaVideos={setMediaVideos}
                spreadsheetId={spreadsheetId}
                onShowMessage={showToast}
              />
            )}

            {activeTab === 'reports' && (
              <AdminReportsView
                lang={lang}
                students={students}
                lessons={lessons}
                transactions={transactions}
                invoices={invoices}
              />
            )}

            {activeTab === 'audit' && (
              <AdminAuditLogsView
                lang={lang}
                spreadsheetId={spreadsheetId}
                onShowMessage={showToast}
              />
            )}

            {activeTab === 'status' && (
              <AdminSystemStatusView
                lang={lang}
                spreadsheetId={spreadsheetId}
                onShowMessage={showToast}
              />
            )}
          </div>
        </div>

        {/* Global Toast Alert */}
        {toastMessage && (
          <div
            className={`fixed bottom-6 right-6 z-50 max-w-md p-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200 ${
              toastMessage.isError
                ? 'bg-rose-600 text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {toastMessage.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-auto text-white/80 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
