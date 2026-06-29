import React, { useState } from 'react';
import { 
  User, Shield, Bell, Moon, Sun, Award, Flame, CheckCircle, 
  Map, Star, KeyRound, AlertCircle, Compass, CheckCircle2, Sparkles 
} from 'lucide-react';
import { TRANSLATIONS, Language, AchievementBadge, Lesson } from '../types';
import { getStudentPhoto, saveStudentPhoto, getStudentInitials, deleteStudentPhoto } from '../utils/studentPhoto';

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
  setCurrentUser?: (user: any) => void;
}

export default function StudentProfile({ 
  lang, setLang, t, darkMode, setDarkMode, lessons, badges, setBadges, currentUser, setCurrentUser 
}: StudentProfileProps) {
  
  // Custom interactive personal info state
  const [name, setName] = useState(currentUser?.name || "Amir Al-Hassan");
  const [email, setEmail] = useState(currentUser?.email || "floggyc77@gmail.com");
  const [phone, setPhone] = useState(currentUser?.phone || "+31 6 1234 5678");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [photo, setPhoto] = useState<string | null>(() => getStudentPhoto(currentUser?.name || "Amir Al-Hassan"));

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPhoto(base64String);
        saveStudentPhoto(name, base64String);
        if (setCurrentUser && currentUser) {
          setCurrentUser({
            ...currentUser,
            profilePhoto: base64String
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    deleteStudentPhoto(name);
    if (setCurrentUser && currentUser) {
      setCurrentUser({
        ...currentUser,
        profilePhoto: undefined
      });
    }
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    
    if (photo) {
      saveStudentPhoto(name, photo);
    } else {
      deleteStudentPhoto(name);
    }

    if (setCurrentUser && currentUser) {
      setCurrentUser({
        ...currentUser,
        name,
        email,
        phone,
        profilePhoto: photo || undefined
      });
    }
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

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

  // Check name similarity or exact match
  const studentNamesMatch = (nameA?: string, nameB?: string) => {
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
  };

  const studentName = currentUser?.name || "Amir Al-Hassan";
  const myLessons = lessons.filter(
    l => !l.studentName || studentNamesMatch(l.studentName, studentName)
  );

  // Driving stats calculation
  const completedCount = myLessons.filter(l => l.status === 'completed').length;
  const totalCompletedHours = myLessons
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
            <div className="relative inline-block group cursor-pointer" onClick={() => document.getElementById('student-photo-file-input')?.click()}>
              {/* Profile Photo or Default Avatar */}
              {photo ? (
                <img 
                  src={photo} 
                  alt={name} 
                  className="h-20 w-20 rounded-full object-cover mx-auto border-2 border-blue-500 shadow-md transition duration-300 group-hover:opacity-80"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-black font-sans mx-auto shadow-md transition duration-300 group-hover:from-blue-700 group-hover:to-indigo-700">
                  {getStudentInitials(name)}
                </div>
              )}
              {/* Edit Hover Overlay */}
              <div className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-[10px] text-white font-extrabold uppercase tracking-wider">
                  {lang === 'ar' ? 'تعديل' : lang === 'nl' ? 'Wijzig' : 'Edit'}
                </span>
              </div>
              <span className="absolute bottom-0 right-1/2 translate-x-1/2 px-2 py-0.5 bg-blue-600 rounded-full border-2 border-white dark:border-zinc-900 text-white text-[8px] font-black uppercase whitespace-nowrap">
                Category B
              </span>
            </div>

            <div className="mt-1 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button 
                type="button"
                onClick={() => document.getElementById('student-photo-file-input')?.click()}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-350 transition flex items-center gap-1"
              >
                <span>{photo ? (lang === 'ar' ? 'تغيير الصورة' : lang === 'nl' ? 'Foto wijzigen' : 'Change Photo') : (lang === 'ar' ? 'رفع صورة شخصية' : lang === 'nl' ? 'Foto uploaden' : 'Upload Photo')}</span>
              </button>
              {photo && (
                <>
                  <span className="text-slate-300 dark:text-zinc-800 hidden sm:inline">•</span>
                  <button 
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-350 transition flex items-center gap-1"
                  >
                    <span>{lang === 'ar' ? 'إزالة الصورة' : lang === 'nl' ? 'Foto verwijderen' : 'Remove Photo'}</span>
                  </button>
                </>
              )}
              <input 
                type="file" 
                id="student-photo-file-input" 
                accept="image/*" 
                className="hidden" 
                onChange={handlePhotoChange} 
              />
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
          <form onSubmit={handleProfileSave} className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-800 pb-2">
              <User className="h-4 w-4 text-blue-500" />
              {t.personalInfo}
            </h3>

            {saveSuccess && (
              <p className="text-xs font-bold text-emerald-500 animate-pulse">
                {lang === 'ar' ? 'تم حفظ التعديلات بنجاح!' : lang === 'nl' ? 'Gegevens succesvol opgeslagen!' : 'Profile details saved successfully!'}
              </p>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold block mb-1 text-slate-500 dark:text-zinc-400">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 text-xs font-semibold rounded-xl dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold block mb-1 text-slate-500 dark:text-zinc-400">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 text-xs font-semibold rounded-xl dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold block mb-1 text-slate-500 dark:text-zinc-400">Mobile Contact Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 text-xs font-semibold rounded-xl dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition cursor-pointer text-xs"
              >
                {lang === 'ar' ? 'حفظ البيانات الشخصية' : lang === 'nl' ? 'Persoonlijke Gegevens Opslaan' : 'Save Personal Details'}
              </button>
            </div>
          </form>
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
