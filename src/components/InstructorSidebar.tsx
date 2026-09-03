import React, { useState, useEffect } from 'react';
import { 
  X, 
  Globe, 
  Sun, 
  Moon, 
  SignOut, 
  CaretRight, 
  House,
  Users,
  CalendarBlank,
  Compass,
  FileText
} from '@phosphor-icons/react';
import { 
  Image as LucideImage, 
  Package as LucidePackage, 
  Building as LucideBuilding, 
  Calendar as LucideCalendar, 
  Mail as LucideMail, 
  Palette as LucidePalette, 
  Globe as LucideGlobe, 
  Bot as LucideBot,
  Database as LucideDatabase
} from 'lucide-react';
import { Language, SchoolSettings } from '../types';
import SchoolLogo from './SchoolLogo';
import { getTrainerPhoto } from '../utils/studentPhoto';

export interface InstructorSidebarProps {
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

export default function InstructorSidebar({
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
  handleLogout
}: InstructorSidebarProps) {
  const [photoUpdateTrigger, setPhotoUpdateTrigger] = useState(0);

  useEffect(() => {
    const handlePhotoUpdate = () => setPhotoUpdateTrigger(prev => prev + 1);
    window.addEventListener('trainerPhotoUpdated', handlePhotoUpdate);
    window.addEventListener('storage', handlePhotoUpdate);
    return () => {
      window.removeEventListener('trainerPhotoUpdated', handlePhotoUpdate);
      window.removeEventListener('storage', handlePhotoUpdate);
    };
  }, []);

  if (!drawerOpen) return null;

  const isRtl = lang === 'ar';
  const userPhoto = getTrainerPhoto(currentUser?.email || currentUser?.name || '') || currentUser?.profilePhoto || null;

  const langNames = {
    ar: 'العربية',
    nl: 'Nederlands',
    en: 'English'
  };

  const handleNavFromDrawer = (tab: string) => {
    setActiveTab(tab);
    setDrawerOpen(false);
  };

  const handleOpenConfigSection = (subTab: 'rota' | 'packages' | 'school' | 'media', innerTab?: 'info' | 'business' | 'email' | 'branding' | 'social' | 'ai') => {
    setActiveTab('schedule');
    window.dispatchEvent(new CustomEvent('openSchoolConfig', { 
      detail: { subTab, innerTab } 
    }));
    setDrawerOpen(false);
  };

  const operationalItems = [
    {
      id: 'home',
      label: isRtl ? 'لوحة التحكم' : lang === 'nl' ? 'Dashboard' : 'Dashboard',
      icon: House,
      action: () => handleNavFromDrawer('home')
    },
    {
      id: 'students',
      label: isRtl ? 'الطلاب' : lang === 'nl' ? 'Leerlingen' : 'Students',
      icon: Users,
      action: () => handleNavFromDrawer('students')
    },
    {
      id: 'lessons',
      label: isRtl ? 'الدروس' : lang === 'nl' ? 'Lessen' : 'Lessons',
      icon: CalendarBlank,
      action: () => handleNavFromDrawer('lessons')
    },
    {
      id: 'tracker',
      label: isRtl ? 'مسارات الاختبار' : lang === 'nl' ? 'Examroutes' : 'Exam Routes',
      icon: Compass,
      action: () => handleNavFromDrawer('tracker')
    },
    {
      id: 'reports',
      label: isRtl ? 'التقارير' : lang === 'nl' ? 'Rapporten' : 'Reports',
      icon: FileText,
      action: () => handleNavFromDrawer('reports')
    }
  ];

  const schoolManagementItems = [
    {
      id: 'admin-control-center',
      label: isRtl ? 'مركز التحكم الشامل (Google Sheets)' : lang === 'nl' ? 'Beheer & Sheets Control Center' : 'Admin Sheets Control Center',
      icon: LucideDatabase,
      action: () => {
        window.dispatchEvent(new CustomEvent('openAdminControlCenter'));
        setDrawerOpen(false);
      }
    },
    {
      id: 'admin-media',
      label: isRtl ? 'مكتبة الوسائط' : lang === 'nl' ? 'Educatieve Mediatheek' : 'Media Library',
      icon: LucideImage,
      action: () => handleOpenConfigSection('media')
    },
    {
      id: 'admin-packages',
      label: isRtl ? 'إدارة الباقات' : lang === 'nl' ? 'Lespakketten Beheer' : 'Package Management',
      icon: LucidePackage,
      action: () => handleOpenConfigSection('packages')
    },
    {
      id: 'admin-school',
      label: isRtl ? 'تهيئة المدرسة' : lang === 'nl' ? 'School Configuratie' : 'School Configuration',
      icon: LucideBuilding,
      action: () => handleOpenConfigSection('school', 'info')
    },
    {
      id: 'admin-rota',
      label: isRtl ? 'جدول العمل والدروس' : lang === 'nl' ? 'Werkrooster & Lessen' : 'Work Schedule & Lessons',
      icon: LucideCalendar,
      action: () => handleOpenConfigSection('rota')
    },
    {
      id: 'admin-email',
      label: isRtl ? 'إعدادات البريد' : lang === 'nl' ? 'E-mail Instellingen' : 'Email Settings',
      icon: LucideMail,
      action: () => handleOpenConfigSection('school', 'email')
    },
    {
      id: 'admin-branding',
      label: isRtl ? 'الهوية البصرية والسمات' : lang === 'nl' ? 'Branding & Visuele Identiteit' : 'Branding & Visual Identity',
      icon: LucidePalette,
      action: () => handleOpenConfigSection('school', 'branding')
    },
    {
      id: 'admin-social',
      label: isRtl ? 'التواصل والقوانين' : lang === 'nl' ? 'Communicatie & Juridisch' : 'Communication & Legal',
      icon: LucideGlobe,
      action: () => handleOpenConfigSection('school', 'social')
    },
    {
      id: 'admin-ai',
      label: isRtl ? 'إعدادات الذكاء الاصطناعي' : lang === 'nl' ? 'AI Instellingen' : 'AI Settings',
      icon: LucideBot,
      action: () => handleOpenConfigSection('school', 'ai')
    }
  ];

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
            
            {/* Instructor Operational Navigation Section */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 block px-3 mb-2">
                {isRtl ? 'لوحة المدرب' : lang === 'nl' ? 'Instructeur Menu' : 'Instructor Navigation'}
              </span>

              {operationalItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                      isActive 
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40' 
                        : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent size={18} weight="regular" className="text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    <CaretRight size={16} weight="bold" className={`text-slate-400 shrink-0 ${isRtl ? 'rotate-180' : ''}`} />
                  </button>
                );
              })}
            </div>

            {/* School Management Section */}
            <div className="space-y-1 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 block px-3 mb-2">
                {isRtl ? 'إدارة المدرسة' : lang === 'nl' ? 'Schoolbeheer' : 'School Management'}
              </span>

              {schoolManagementItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    className="w-full flex items-center justify-between p-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-950/60 dark:group-hover:text-blue-400 transition-colors shrink-0">
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <span className="truncate">{item.label}</span>
                    </div>
                    <CaretRight size={14} weight="bold" className={`text-slate-400 shrink-0 ${isRtl ? 'rotate-180' : ''}`} />
                  </button>
                );
              })}
            </div>

            {/* Preferences Section */}
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
