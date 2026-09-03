import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  User, 
  Wallet, 
  Globe, 
  Sun, 
  Moon, 
  Gear, 
  Question, 
  SignOut, 
  CaretRight, 
  Check, 
  ShieldCheck,
  List,
  CalendarBlank
} from '@phosphor-icons/react';
import { Phone as LucidePhone, MessageCircle as LucideMessageCircle, Mail as LucideMail, Database as LucideDatabase, Table as LucideTable } from 'lucide-react';
import { Language, UserRole, SchoolSettings, getSchoolName } from '../types';
import SchoolLogo from './SchoolLogo';
import { getStudentPhoto, getTrainerPhoto } from '../utils/studentPhoto';
import StudentSidebar from './StudentSidebar';
import InstructorSidebar from './InstructorSidebar';
import NotificationCenterModal from './NotificationCenterModal';
import HelpCenterModal from './HelpCenterModal';
import GoogleSheetsDiagnosticModal from './GoogleSheetsDiagnosticModal';
import { getUnreadNotificationCount, markAllNotificationsAsRead } from '../utils/notificationStore';

interface HeaderProps {
  lang: Language;
  setLang: (lang: Language) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  currentUser: { name: string; email: string; role?: string; profilePhoto?: string; studentId?: string; id?: string } | null;
  role: UserRole;
  schoolSettings: Partial<SchoolSettings> | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleLogout: () => void;
  unreadNotificationsCount?: number;
}

export default function Header({
  lang,
  setLang,
  darkMode,
  setDarkMode,
  currentUser,
  role,
  schoolSettings,
  activeTab,
  setActiveTab,
  handleLogout,
  unreadNotificationsCount
}: HeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showGoogleDiagnosticModal, setShowGoogleDiagnosticModal] = useState(false);
  const [localUnreadCount, setLocalUnreadCount] = useState(0);

  const unreadCount = unreadNotificationsCount !== undefined ? unreadNotificationsCount : localUnreadCount;

  const [photoUpdateTrigger, setPhotoUpdateTrigger] = useState(0);

  // Dynamic unread notification counter sync (Student ID > Email > Name fallback)
  useEffect(() => {
    const handlePhotoUpdate = () => setPhotoUpdateTrigger(prev => prev + 1);
    window.addEventListener('trainerPhotoUpdated', handlePhotoUpdate);
    window.addEventListener('storage', handlePhotoUpdate);

    let updateCount: (() => void) | null = null;
    if (unreadNotificationsCount === undefined) {
      updateCount = () => {
        const count = getUnreadNotificationCount(
          role,
          currentUser?.email,
          currentUser?.name,
          currentUser?.studentId || currentUser?.id
        );
        setLocalUnreadCount(count);
      };
      updateCount();
      window.addEventListener('appNotificationsUpdated', updateCount);
    }

    return () => {
      window.removeEventListener('trainerPhotoUpdated', handlePhotoUpdate);
      window.removeEventListener('storage', handlePhotoUpdate);
      if (updateCount) {
        window.removeEventListener('appNotificationsUpdated', updateCount);
      }
    };
  }, [role, currentUser, unreadNotificationsCount]);

  const isRtl = lang === 'ar';
  const isTrainer = role === 'trainer' || currentUser?.role === 'trainer';
  const userPhoto = isTrainer
    ? (getTrainerPhoto(currentUser?.email || currentUser?.name) || currentUser?.profilePhoto || null)
    : (currentUser?.profilePhoto || (currentUser ? getStudentPhoto(currentUser.email || currentUser.name) : null));

  const langNames = {
    ar: 'العربية',
    nl: 'Nederlands',
    en: 'English'
  };

  const handleNavFromDrawer = (tab: string) => {
    setActiveTab(tab);
    setDrawerOpen(false);
  };

  return (
    <>
      <header 
        id="app-header"
        className="sticky top-3 sm:top-4 z-40 w-full px-3 sm:px-6 transition-all duration-300 max-w-full"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="max-w-7xl mx-auto w-full">
          {/* Apple-inspired Floating Glass Pill Header */}
          <div className="bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl border border-slate-200/60 dark:border-zinc-800/60 shadow-[0_8px_28px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_28px_rgba(0,0,0,0.28)] rounded-full px-3.5 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-8 min-w-0">
            
            {/* Left Control: Hamburger Menu Button */}
            <div className="flex items-center shrink-0">
              <button
                onClick={() => setDrawerOpen(true)}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-100/80 hover:bg-slate-200/90 dark:bg-zinc-800/70 dark:hover:bg-zinc-700/90 text-slate-700 dark:text-zinc-200 border border-slate-200/50 dark:border-zinc-700/50 flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 shadow-2xs"
                title={isRtl ? 'القائمة' : 'Menu'}
                aria-label={isRtl ? 'القائمة' : 'Menu'}
              >
                <List size={22} weight="bold" className="text-slate-700 dark:text-zinc-200" />
              </button>
            </div>

            {/* Center: Brand Logo & Title (Apple Hierarchy) */}
            <div 
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2.5 sm:gap-4 cursor-pointer group min-w-0 select-none"
            >
              <SchoolLogo size="md" iconOnly schoolSettings={schoolSettings} className="shrink-0 transition-transform duration-300 group-hover:scale-105 drop-shadow-xs" />
              <div className="flex flex-col justify-center leading-none min-w-0">
                <span className="text-xs sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase font-sans truncate">
                  {getSchoolName(schoolSettings)}
                </span>
                <span className="text-[9px] sm:text-[11px] font-bold tracking-[0.15em] sm:tracking-[0.2em] text-slate-400 dark:text-zinc-400 uppercase leading-none mt-1 truncate">
                  {schoolSettings?.slogan || schoolSettings?.city || 'RIJSCHOOL'}
                </span>
              </div>
            </div>

            {/* Right Controls: Admin Control Center, Google Sheets Diagnostic, Notification Bell & User Avatar */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* Google Sheets Admin Control Center Button */}
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openAdminControlCenter'))}
                className="h-10 px-3 sm:px-3.5 rounded-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 flex items-center gap-1.5 text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 shadow-2xs"
                title={isRtl ? 'مركز إدارة وتحكم النظام (Google Sheets)' : 'Admin Control Center (Google Sheets)'}
              >
                <LucideDatabase size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="hidden md:inline">{isRtl ? 'مركز الإدارة' : 'Admin Center'}</span>
              </button>

              {/* Google Sheets Diagnostic & Connection Button */}
              <button
                onClick={() => setShowGoogleDiagnosticModal(true)}
                className="h-10 px-3 sm:px-3.5 rounded-full bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2 text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 shadow-2xs"
                title="Google Sheets Diagnostics & Settings"
              >
                <LucideTable size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="hidden sm:inline">Google Sheets</span>
              </button>

              {/* Notification Bell Button */}
              <button
                onClick={() => {
                  if (role === 'student') {
                    if (currentUser) {
                      markAllNotificationsAsRead(
                        role,
                        currentUser.email,
                        currentUser.name,
                        currentUser.studentId || currentUser.id
                      );
                    }
                    setActiveTab('profile');
                    setTimeout(() => {
                      const notifEl = document.getElementById('student-profile-notifications-section');
                      if (notifEl) {
                        notifEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 100);
                  } else {
                    setShowNotificationsModal(true);
                  }
                }}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-100/80 hover:bg-slate-200/90 dark:bg-zinc-800/70 dark:hover:bg-zinc-700/90 text-slate-700 dark:text-zinc-200 border border-slate-200/50 dark:border-zinc-700/50 flex items-center justify-center transition-all duration-200 cursor-pointer relative active:scale-95 shadow-2xs"
                title={isRtl ? 'مركز الإشعارات والتنبيهات' : lang === 'nl' ? 'Meldingenoverzicht' : 'Notification Center'}
                aria-label={isRtl ? 'الإشعارات' : 'Notifications'}
              >
                <Bell size={22} weight={unreadCount > 0 ? 'fill' : 'regular'} className={unreadCount > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-zinc-200'} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black text-white bg-blue-600 rounded-full ring-2 ring-white dark:ring-zinc-900 shadow-xs animate-in fade-in zoom-in duration-200">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* User Avatar Button */}
              <button
                onClick={() => setActiveTab('profile')}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 flex items-center justify-center text-white text-sm sm:text-base font-black shadow-xs shrink-0 overflow-hidden cursor-pointer active:scale-95 transition-all duration-200 ring-2 ring-blue-500/20 dark:ring-blue-400/30"
                title={isRtl ? 'الملف الشخصي' : 'Profile'}
                aria-label={isRtl ? 'الملف الشخصي' : 'Profile'}
              >
                {userPhoto ? (
                  <img src={userPhoto} alt={currentUser?.name || 'User'} className="w-full h-full object-cover" />
                ) : (
                  currentUser?.name ? currentUser.name[0].toUpperCase() : 'U'
                )}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* SIDEBAR COMPONENT (Student vs Instructor) */}
      {role === 'trainer' ? (
        <InstructorSidebar
          drawerOpen={drawerOpen}
          setDrawerOpen={setDrawerOpen}
          lang={lang}
          setLang={setLang}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          currentUser={currentUser}
          schoolSettings={schoolSettings}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          handleLogout={handleLogout}
          setShowSettingsModal={setShowSettingsModal}
          setShowHelpModal={setShowHelpModal}
        />
      ) : (
        <StudentSidebar
          drawerOpen={drawerOpen}
          setDrawerOpen={setDrawerOpen}
          lang={lang}
          setLang={setLang}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          currentUser={currentUser}
          schoolSettings={schoolSettings}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          handleLogout={handleLogout}
          setShowSettingsModal={setShowSettingsModal}
          setShowHelpModal={setShowHelpModal}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Gear size={20} weight="regular" className="text-blue-600" />
                <span>{isRtl ? 'إعدادات النظام' : 'System Settings'}</span>
              </h3>
              <button onClick={() => setShowSettingsModal(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={20} weight="bold" />
              </button>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isRtl ? 'تم ضبط تفضيلات الإشعارات والأمان بنجاح لمدرسة السياقة.' : 'Notification preferences and security configurations are active and managed via cloud database.'}
            </p>
            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-blue-700 transition"
            >
              {isRtl ? 'حفظ وإغلاق' : 'Save & Close'}
            </button>
          </div>
        </div>
      )}

      {/* Help & Support Center Modal */}
      {showHelpModal && (
        <HelpCenterModal
          lang={lang}
          schoolSettings={schoolSettings}
          onClose={() => setShowHelpModal(false)}
        />
      )}

      {/* Modern Notification Center Modal */}
      <NotificationCenterModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        lang={lang}
        currentUser={currentUser ? { role, name: currentUser.name, email: currentUser.email } : null}
        onNavigateToTab={(tab) => {
          setActiveTab(tab);
          setShowNotificationsModal(false);
        }}
      />

      {/* Google Sheets Strict Connection Diagnostic Modal */}
      <GoogleSheetsDiagnosticModal
        isOpen={showGoogleDiagnosticModal}
        onClose={() => setShowGoogleDiagnosticModal(false)}
        lang={lang}
      />
    </>
  );
}
