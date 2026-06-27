import React, { useState } from 'react';
import { 
  User, Shield, Bell, Moon, Sun, Award, Flame, CheckCircle, 
  Map, Star, KeyRound, AlertCircle, Compass, CheckCircle2, Sparkles 
} from 'lucide-react';
import { TRANSLATIONS, Language, AchievementBadge, Lesson } from '../types';

interface StudentProfileProps {
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof TRANSLATIONS['en'];
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  lessons: Lesson[];
  badges: AchievementBadge[];
  setBadges: (badges: AchievementBadge[]) => void;
  currentUser?: any;
}

export default function StudentProfile({ 
  lang, setLang, t, darkMode, setDarkMode, lessons, badges, setBadges, currentUser 
}: StudentProfileProps) {
  
  // Custom interactive personal info state
  const [name, setName] = useState(currentUser?.name || "Amir Al-Hassan");
  const [email, setEmail] = useState(currentUser?.email || "floggyc77@gmail.com");
  const [phone, setPhone] = useState(currentUser?.phone || "+31 6 1234 5678");

  // Profile forms
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);

  const [pushEnabled, setPushEnabled] = useState(true);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;
    setPassSuccess(true);
    setOldPassword('');
    setNewPassword('');
    setTimeout(() => {
      setPassSuccess(false);
    }, 3000);
  };

  // Driving stats calculation
  const completedCount = lessons.filter(l => l.status === 'completed').length;
  const totalCompletedHours = lessons
    .filter(l => l.status === 'completed')
    .reduce((sum, curr) => sum + curr.duration, 0);

  // Trigger gamified badge claiming manually as interactive Easter egg
  const toggleBadge = (badgeId: string) => {
    const updated = badges.map(b => {
      if (b.id === badgeId) {
        return { ...b, unlocked: !b.unlocked };
      }
      return b;
    });
    setBadges(updated);
  };

  return (
    <div className="space-y-6 pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">{t.profile}</h1>
        <p className="text-xs text-slate-400 mt-0.5">Edit license credentials, regional values, and claim gamified badges</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Bio stats & Personal Info fields */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl text-center space-y-4 shadow-sm">
            <div className="relative inline-block">
              {/* Avatar placeholder with modern neon ring */}
              <div className="h-20 w-20 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-black font-sans mx-auto shadow-md">
                AH
              </div>
              <span className="absolute bottom-0 right-1/2 translate-x-1/2 p-1 bg-blue-600 rounded-full border-2 border-white dark:border-zinc-900 text-white text-[9px] font-black uppercase">
                B-CLASS
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100">{name}</h2>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{t.student} • Al-Andalos Amsterdam</p>
              
              {/* Transmission Type Badge */}
              {currentUser?.transmissionType && (
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-xs">
                    <span role="img" aria-label="car">🚗</span>
                    <span>
                      {currentUser.transmissionType === 'manual'
                        ? (lang === 'ar' ? 'ناقل حركة يدوي (عادي)' : lang === 'nl' ? 'Handgeschakeld' : 'Manual')
                        : (lang === 'ar' ? 'ناقل حركة أوتوماتيكي' : lang === 'nl' ? 'Automaat' : 'Automatic')}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Quick dashboard stats list */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs">
              <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 rounded-xl">
                <p className="text-[10px] text-slate-400">{t.completedHrs} Log</p>
                <p className="text-base font-black text-slate-800 dark:text-zinc-200">{totalCompletedHours} Hours</p>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 rounded-xl">
                <p className="text-[10px] text-slate-400">Total Rides</p>
                <p className="text-base font-black text-slate-800 dark:text-zinc-200">{completedCount} Lessons</p>
              </div>
            </div>
          </div>

          {/* Form edit fields */}
          <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-800 pb-2">
              <User className="h-4 w-4 text-blue-500" />
              {t.personalInfo}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-450 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 text-xs font-semibold rounded-xl dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-450 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 text-xs font-semibold rounded-xl dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Mobile Contact Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 text-xs font-semibold rounded-xl dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right column: settings panel, list selection, and badges system */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Quick Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Preferences / regional toggles */}
            <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-sm border-b border-slate-100 dark:border-zinc-800 pb-2">Settings</h3>

              {/* Instant Language Switcher */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-bold block">{t.langSettings}</label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-zinc-950 rounded-xl">
                  {(['en', 'nl', 'ar'] as const).map(l => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition uppercase ${
                        lang === l
                          ? 'bg-blue-600 text-white shadow-xs font-black'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-300'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dark mode switcher toggle */}
              <div className="flex justify-between items-center py-2.5 border-t border-slate-100 dark:border-zinc-800 text-xs">
                <span className="font-bold text-slate-600 dark:text-zinc-350">{t.darkMode}</span>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-1 px-3 bg-slate-100 dark:bg-zinc-950 text-slate-700 dark:text-white rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center gap-1.5 font-bold cursor-pointer"
                >
                  {darkMode ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-blue-500" />}
                  <span>{darkMode ? "Light" : "Dark"}</span>
                </button>
              </div>

              {/* Push notification toggle */}
              <div className="flex justify-between items-center py-2.5 border-t border-slate-100 dark:border-zinc-800 text-xs">
                <span className="font-bold text-slate-600 dark:text-zinc-350">{t.notifications}</span>
                <button
                  onClick={() => setPushEnabled(!pushEnabled)}
                  className={`p-1 px-3 rounded-lg border flex items-center gap-1.5 font-bold cursor-pointer transition ${
                    pushEnabled
                      ? 'bg-blue-500/10 border-blue-500/20 text-blue-600'
                      : 'bg-slate-100 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-500'
                  }`}
                >
                  <Bell className="h-4 w-4" />
                  <span>{pushEnabled ? "Active" : "Silenced"}</span>
                </button>
              </div>
            </div>

            {/* Change password section */}
            <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-sm border-b border-slate-100 dark:border-zinc-800 pb-2 flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-blue-500" />
                {t.changePass}
              </h3>

              {passSuccess && (
                <p className="text-xs font-bold text-emerald-500 animate-pulse">Wachtwoord succesvol gewijzigd!</p>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs font-medium">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">Current Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-xl"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition cursor-pointer"
                >
                  Save Security Updates
                </button>
              </form>
            </div>

          </div>

          {/* Gamified Achievements badges section */}
          <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-800 pb-2">
              <Award className="h-4 w-4 text-blue-500" />
              {t.achievements} & Badges
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {badges.map(badge => (
                <div 
                  key={badge.id}
                  onClick={() => toggleBadge(badge.id)}
                  className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex items-start gap-3 select-none ${
                    badge.unlocked
                      ? 'bg-linear-to-br from-white to-amber-50/20 dark:from-zinc-950 dark:to-zinc-900 border-amber-500/20 shadow-xs'
                      : 'bg-slate-50/50 dark:bg-zinc-900/40 border-slate-100 dark:border-zinc-950 opacity-60'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${
                    badge.unlocked 
                      ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-500 animate-scale' 
                      : 'bg-slate-150 dark:bg-zinc-800 text-slate-400'
                  }`}>
                    {badge.icon === 'ShieldCheck' && <CheckCircle2 className="h-5 w-5" />}
                    {badge.icon === 'Moon' && <Moon className="h-5 w-5" />}
                    {badge.icon === 'KeyRound' && <KeyRound className="h-5 w-5" />}
                    {badge.icon === 'Sparkles' && <Sparkles className="h-5 w-5" />}
                  </div>

                  <div className="text-xs space-y-0.5">
                    <h4 className={`font-bold ${badge.unlocked ? 'text-slate-800 dark:text-amber-400' : 'text-slate-400'}`}>
                      {lang === 'ar' ? badge.titleAr : lang === 'nl' ? badge.titleNl : badge.titleEn}
                    </h4>
                    <p className="text-slate-400">
                      {lang === 'ar' ? badge.descriptionAr : lang === 'nl' ? badge.descriptionNl : badge.descriptionEn}
                    </p>
                    <p className="text-[10px] text-blue-500 font-extrabold mt-1">
                      {badge.unlocked ? t.badgeEarned : 'Click to lock/unlock'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
