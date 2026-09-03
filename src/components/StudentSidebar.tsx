import React from 'react';
import { 
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
  CalendarBlank 
} from '@phosphor-icons/react';
import { Language, SchoolSettings } from '../types';
import SchoolLogo from './SchoolLogo';
import { getStudentPhoto } from '../utils/studentPhoto';

export interface StudentSidebarProps {
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  currentUser: { name: string; email: string; role?: string; profilePhoto?: string } | null;
  schoolSettings: Partial<SchoolSettings> | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleLogout: () => void;
  setShowSettingsModal: (show: boolean) => void;
  setShowHelpModal: (show: boolean) => void;
}

export default function StudentSidebar({
  drawerOpen,
  setDrawerOpen,
  lang,
  setLang,
  darkMode,
  setDarkMode,
  currentUser,
  schoolSettings,
  activeTab,
  setActiveTab,
  handleLogout,
  setShowSettingsModal,
  setShowHelpModal
}: StudentSidebarProps) {
  if (!drawerOpen) return null;

  const isRtl = lang === 'ar';
  const userPhoto = currentUser?.profilePhoto || (currentUser ? getStudentPhoto(currentUser.email || currentUser.name) : null);

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
    <div className="fixed inset-0 z-50 overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Backdrop Blur */}
      <div 
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => setDrawerOpen(false)}
      />

      {/* Drawer Container - LTR opens from LEFT (left-0), RTL opens from RIGHT (right-0) */}
      <div className={`fixed inset-y-0 ${isRtl ? 'right-0' : 'left-0'} max-w-full flex`}>
        <div className={`w-screen max-w-xs sm:max-w-sm bg-white dark:bg-zinc-900 shadow-2xl ${isRtl ? 'border-l' : 'border-r'} border-slate-200/80 dark:border-zinc-800 flex flex-col justify-between overflow-y-auto transition-transform duration-300 ease-out`}>
          
          {/* Drawer Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-zinc-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <SchoolLogo size="sm" schoolSettings={schoolSettings} />
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition-colors cursor-pointer active:scale-95"
                aria-label={isRtl ? 'إغلاق' : lang === 'nl' ? 'Sluiten' : 'Close'}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User Summary Card */}
            {currentUser && (
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950/80 border border-slate-200/60 dark:border-zinc-800">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-base font-black shadow-xs shrink-0 overflow-hidden">
                  {userPhoto ? (
                    <img src={userPhoto} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    currentUser.name[0].toUpperCase()
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {currentUser.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                    {currentUser.email}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Drawer Menu Items */}
          <div className="p-5 sm:p-6 space-y-6 flex-1">
            
            {/* Section 1: Core Navigation */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 block px-3 mb-2">
                {isRtl ? 'التنقل' : lang === 'nl' ? 'Navigatie' : 'Navigation'}
              </span>

              {/* 1. Profile */}
              <button
                onClick={() => handleNavFromDrawer('profile')}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                  activeTab === 'profile' 
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40' 
                    : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <User size={18} weight="regular" className="text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>{isRtl ? 'الملف الشخصي' : lang === 'nl' ? 'Mijn Profiel' : 'Profile'}</span>
                </div>
                <CaretRight size={16} weight="bold" className={`text-slate-400 shrink-0 ${isRtl ? 'rotate-180' : ''}`} />
              </button>

              {/* 2. Lessons */}
              <button
                onClick={() => handleNavFromDrawer('lessons')}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                  activeTab === 'lessons' 
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40' 
                    : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CalendarBlank size={18} weight="regular" className="text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>{isRtl ? 'دروسي وحجوزاتي' : lang === 'nl' ? 'Lessen & Boekingen' : 'Lessons & Bookings'}</span>
                </div>
                <CaretRight size={16} weight="bold" className={`text-slate-400 shrink-0 ${isRtl ? 'rotate-180' : ''}`} />
              </button>

              {/* 3. My Wallet */}
              <button
                onClick={() => handleNavFromDrawer('wallet')}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                  activeTab === 'wallet' 
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40' 
                    : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Wallet size={18} weight="regular" className="text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>{isRtl ? 'حسابي والمالية' : lang === 'nl' ? 'Mijn Account & Betalingen' : 'Account & Payments'}</span>
                </div>
                <CaretRight size={16} weight="bold" className={`text-slate-400 shrink-0 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Section 2: Preferences */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 block px-3">
                {isRtl ? 'التفضيلات' : lang === 'nl' ? 'Voorkeuren' : 'Preferences'}
              </span>

              {/* Language Selector */}
              <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200/60 dark:border-zinc-800 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-zinc-300">
                  <Globe size={18} weight="regular" className="text-slate-500 shrink-0" />
                  <span>{isRtl ? 'اللغة' : lang === 'nl' ? 'Taal' : 'Language'}</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['ar', 'nl', 'en'] as const).map(l => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`py-2 px-1.5 rounded-xl text-xs font-bold transition text-center cursor-pointer ${
                        lang === l 
                          ? 'bg-blue-600 text-white shadow-xs' 
                          : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/80 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {langNames[l]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dark / Light Mode Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200/60 dark:border-zinc-800">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-700 dark:text-zinc-300">
                  {darkMode ? <Sun size={18} weight="regular" className="text-amber-400 shrink-0" /> : <Moon size={18} weight="regular" className="text-blue-600 shrink-0" />}
                  <span>{isRtl ? 'المظهر (ليلي / نهاري)' : lang === 'nl' ? 'Donkere modus' : 'Dark Mode'}</span>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-11 h-6 rounded-full transition-colors p-1 flex items-center cursor-pointer ${
                    darkMode ? 'bg-blue-600 justify-end' : 'bg-slate-300 dark:bg-zinc-700 justify-start'
                  }`}
                  aria-label="Toggle Dark Mode"
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-xs"></div>
                </button>
              </div>
            </div>

            {/* Section 3: Support & Help */}
            <div className="space-y-1 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 block px-3 mb-2">
                {isRtl ? 'المساعدة والدعم' : lang === 'nl' ? 'Hulp & Ondersteuning' : 'Help & Support'}
              </span>

              {/* Help */}
              <button
                onClick={() => {
                  setShowHelpModal(true);
                  setDrawerOpen(false);
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Question size={18} weight="regular" className="text-slate-500 shrink-0" />
                  <span>{isRtl ? 'المساعدة والدعم' : lang === 'nl' ? 'Hulp & Support' : 'Help & Support'}</span>
                </div>
                <CaretRight size={16} weight="bold" className={`text-slate-400 shrink-0 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
            </div>

          </div>

          {/* Drawer Footer: Logout */}
          <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/50">
            <button
              onClick={() => {
                setDrawerOpen(false);
                handleLogout();
              }}
              className="w-full py-3.5 px-4 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-800/50 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <SignOut size={18} weight="regular" className="shrink-0" />
              <span>{isRtl ? 'تسجيل الخروج' : lang === 'nl' ? 'Uitloggen' : 'Logout'}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
