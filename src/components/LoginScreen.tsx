import React, { useState } from 'react';
import { 
  LogIn, 
  UserPlus, 
  User, 
  Shield, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  Check, 
  ArrowRight,
  ArrowLeft,
  Package,
  HelpCircle,
  Globe,
  Sun,
  Moon,
  Eye,
  EyeOff
} from 'lucide-react';
import { Language, SchoolSettings, DrivePackage } from '../types';
import SchoolLogo from './SchoolLogo';
import { DatePicker } from './DatePicker';
import { PackageCard } from './PackageCard';

interface LoginScreenProps {
  lang: Language;
  setLang?: (lang: Language) => void;
  darkMode?: boolean;
  setDarkMode?: (dark: boolean) => void;
  t: any;
  authLabels: any;
  schoolSettings: Partial<SchoolSettings> | null;
  authTab: 'login' | 'register';
  setAuthTab: (tab: 'login' | 'register') => void;
  loginRole: 'student' | 'trainer';
  setLoginRole: (role: 'student' | 'trainer') => void;
  loginEmail: string;
  setLoginEmail: (val: string) => void;
  loginPassword: string;
  setLoginPassword: (val: string) => void;
  handleManualLogin: (e: React.FormEvent) => void;
  handleDemoLogin: (role: 'student' | 'trainer') => void;
  handleRegisterSubmit: (e: React.FormEvent) => void;
  regName: string;
  setRegName: (val: string) => void;
  regEmail: string;
  setRegEmail: (val: string) => void;
  regPhone: string;
  setRegPhone: (val: string) => void;
  regDob: string;
  setRegDob: (val: string) => void;
  regCity: string;
  setRegCity: (val: string) => void;
  regPassword?: string;
  setRegPassword?: (val: string) => void;
  regConfirmPassword?: string;
  setRegConfirmPassword?: (val: string) => void;
  regAge: number | null;
  regPackageId: string;
  setRegPackageId: (val: string) => void;
  setRegPackage: (val: string) => void;
  packages: any[];
  lessonHourlyRate: number;
  regExperience: string;
  setRegExperience: (val: string) => void;
  regTransmission: 'manual' | 'automatic';
  setRegTransmission: (val: 'manual' | 'automatic') => void;
  regTheoryStatus: string;
  setRegTheoryStatus: (val: string) => void;
  regCheckedTerms: boolean;
  setRegCheckedTerms: (val: boolean) => void;
  setIsForgotPasswordOpen: (val: boolean) => void;
  setForgotPasswordEmail: (val: string) => void;
  setForgotPasswordStatus: (val: any) => void;
  setForgotPasswordMessage: (val: string) => void;
  getSchoolName: (s: any) => string;
  getSchoolShortName: (s: any) => string;
  PackageCard: React.ComponentType<any>;
}

export default function LoginScreen({
  lang,
  setLang,
  darkMode,
  setDarkMode,
  t,
  authLabels,
  schoolSettings,
  authTab,
  setAuthTab,
  loginRole,
  setLoginRole,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  handleManualLogin,
  handleDemoLogin,
  handleRegisterSubmit,
  regName,
  setRegName,
  regEmail,
  setRegEmail,
  regPhone,
  setRegPhone,
  regDob,
  setRegDob,
  regCity,
  setRegCity,
  regPassword = '',
  setRegPassword,
  regConfirmPassword = '',
  setRegConfirmPassword,
  regAge,
  regPackageId,
  setRegPackageId,
  setRegPackage,
  packages,
  lessonHourlyRate,
  regTransmission,
  setRegTransmission,
  regCheckedTerms,
  setRegCheckedTerms,
  setIsForgotPasswordOpen,
  setForgotPasswordEmail,
  getSchoolName,
  PackageCard: PassedPackageCard
}: LoginScreenProps) {
  const isRtl = lang === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  const passwordLabel = isRtl ? 'كلمة المرور' : lang === 'nl' ? 'Wachtwoord' : 'Password';
  const confirmPasswordLabel = isRtl ? 'تأكيد كلمة المرور' : lang === 'nl' ? 'Bevestig wachtwoord' : 'Confirm Password';
  const minLengthMsg = isRtl 
    ? 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل' 
    : lang === 'nl' 
    ? 'Wachtwoord moet minimaal 8 tekens lang zijn' 
    : 'Password must be at least 8 characters';
  const mismatchMsg = isRtl 
    ? 'كلمتا المرور غير متطابقتين' 
    : lang === 'nl' 
    ? 'Wachtwoorden komen niet overeen' 
    : 'Passwords do not match';
  const matchSuccessMsg = isRtl
    ? 'كلمتا المرور متطابقتان'
    : lang === 'nl'
    ? 'Wachtwoorden komen overeen'
    : 'Passwords match';

  const isPasswordValid = regPassword.length >= 8;
  const isPasswordMatch = regPassword === regConfirmPassword && regConfirmPassword.length > 0;

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-4 px-3 sm:px-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className={`w-full ${authTab === 'register' ? 'max-w-3xl sm:max-w-4xl' : 'max-w-md sm:max-w-lg'} bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/90 dark:border-zinc-800 shadow-xl p-6 sm:p-8 space-y-5 transition-all duration-300`}>
        
        {/* Top Right Language & Theme Controls */}
        {(setLang || setDarkMode) && (
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-full border border-slate-200/60 dark:border-zinc-700/60">
              <Globe className="h-3.5 w-3.5 text-slate-400 ml-1.5 rtl:ml-0 rtl:mr-1.5 shrink-0" />
              {(['nl', 'en', 'ar'] as Language[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang && setLang(l)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition cursor-pointer ${
                    lang === l
                      ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs font-black'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {setDarkMode && (
              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                className="p-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition cursor-pointer border border-slate-200/60 dark:border-zinc-700/60"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
              </button>
            )}
          </div>
        )}

        {/* School Branding - Single Professional Branding Section */}
        <div className="text-center space-y-2 pt-1 pb-1">
          <div className="flex flex-col items-center justify-center space-y-2">
            <SchoolLogo size="lg" schoolSettings={schoolSettings} iconOnly={true} />
            <div className="space-y-0.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {getSchoolName(schoolSettings)}
              </h1>
              {schoolSettings?.slogan && (
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  {schoolSettings.slogan}
                </p>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 pt-0.5 font-medium">
            {authTab === 'login' 
              ? (isRtl ? 'مرحباً بك مجدداً. الرجاء تسجيل الدخول لمتابعة حسابك.' : 'Welcome back. Please sign in to access your dashboard.')
              : (isRtl ? 'أنشئ حسابك الجديد وابدأ رحلتك في تعلم القيادة.' : 'Create your student account to start learning.')}
          </p>
        </div>

        {/* Tab Toggle: Sign In vs Register */}
        <div className="p-1 bg-slate-100 dark:bg-zinc-950 rounded-2xl border border-slate-200/60 dark:border-zinc-800 flex gap-1">
          <button
            onClick={() => setAuthTab('login')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
              authTab === 'login'
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/60 dark:border-zinc-700'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LogIn className="h-4 w-4" />
            <span>{isRtl ? 'تسجيل الدخول' : 'Sign In'}</span>
          </button>

          <button
            onClick={() => setAuthTab('register')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
              authTab === 'register'
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/60 dark:border-zinc-700'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            <span>{isRtl ? 'حساب جديد' : 'Register'}</span>
          </button>
        </div>

        {/* SIGN IN FORM */}
        {authTab === 'login' && (
          <form onSubmit={handleManualLogin} className="space-y-4">
            
            {/* Role Switcher */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider block">
                {isRtl ? 'نوع الحساب' : 'Account Type'}
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200/60 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setLoginRole('student')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    loginRole === 'student'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  <span>{isRtl ? 'طالب قيادة' : 'Student'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLoginRole('trainer')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    loginRole === 'trainer'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Shield className="h-3.5 w-3.5" />
                  <span>{isRtl ? 'مدرب' : 'Trainer'}</span>
                </button>
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                {isRtl ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder={loginRole === 'trainer' ? 'trainer@drivingschool.nl' : 'student@drivingschool.nl'}
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-3 text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  {isRtl ? 'كلمة المرور' : 'Password'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordEmail(loginEmail);
                    setIsForgotPasswordOpen(true);
                  }}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {isRtl ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-3 text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs sm:text-sm transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 mt-2"
            >
              <span>{isRtl ? 'دخول الحساب' : 'Sign In'}</span>
              <ArrowIcon className="h-4 w-4" />
            </button>

            {/* Instant Quick Demo Divider */}
            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                {isRtl ? 'أو التجربة السريعة بنقرة واحدة' : 'Or try with a one-click demo'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('student')}
                  className="py-2.5 px-3 bg-slate-100 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>{isRtl ? 'تجربة الطالب' : 'Student Demo'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('trainer')}
                  className="py-2.5 px-3 bg-slate-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Shield className="h-3.5 w-3.5" />
                  <span>{isRtl ? 'تجربة المدرب' : 'Trainer Demo'}</span>
                </button>
              </div>
            </div>

          </form>
        )}

        {/* REGISTER FORM */}
        {authTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            
            {/* Full Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                  {isRtl ? 'الاسم الكامل' : 'Full Name'} *
                </label>
                <div className="relative">
                  <User className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder={isRtl ? 'محمد علي' : 'Full name'}
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                  {isRtl ? 'رقم الهاتف' : 'Phone Number'} *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="+31 6 12345678"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Email & City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                  {isRtl ? 'البريد الإلكتروني' : 'Email Address'} *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                  {isRtl ? 'المدينة' : 'City'} *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Amsterdam, Utrecht..."
                    value={regCity}
                    onChange={e => setRegCity(e.target.value)}
                    className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                  {passwordLabel} *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={e => setRegPassword && setRegPassword(e.target.value)}
                    className="w-full pl-9 pr-9 rtl:pl-9 rtl:pr-9 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(prev => !prev)}
                    className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition p-0.5 cursor-pointer"
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {regPassword.length > 0 && regPassword.length < 8 && (
                  <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 pt-0.5">
                    {minLengthMsg}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                  {confirmPasswordLabel} *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="••••••••"
                    value={regConfirmPassword}
                    onChange={e => setRegConfirmPassword && setRegConfirmPassword(e.target.value)}
                    className={`w-full pl-9 pr-9 rtl:pl-9 rtl:pr-9 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-zinc-950 border rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                      regConfirmPassword.length > 0 && regPassword !== regConfirmPassword
                        ? 'border-rose-400 dark:border-rose-700 focus:border-rose-500'
                        : regConfirmPassword.length > 0 && regPassword === regConfirmPassword && regPassword.length >= 8
                        ? 'border-emerald-400 dark:border-emerald-700 focus:border-emerald-500'
                        : 'border-slate-200 dark:border-zinc-800 focus:border-blue-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(prev => !prev)}
                    className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition p-0.5 cursor-pointer"
                    aria-label={showRegConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {regConfirmPassword.length > 0 && regPassword !== regConfirmPassword && (
                  <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 pt-0.5">
                    {mismatchMsg}
                  </p>
                )}
                {regConfirmPassword.length > 0 && regPassword === regConfirmPassword && regPassword.length >= 8 && (
                  <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 pt-0.5 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    <span>{matchSuccessMsg}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Date of Birth Picker */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                {isRtl ? 'تاريخ الميلاد' : 'Date of Birth'} *
              </label>
              <DatePicker
                value={regDob}
                onChange={setRegDob}
                placeholder={isRtl ? 'اختر تاريخ الميلاد' : 'Select date of birth'}
                className="w-full"
              />
            </div>

            {/* Transmission Selector */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                {isRtl ? 'نوع ناقل الحركة (الغيير)' : 'Transmission Type'}
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200/60 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setRegTransmission('manual')}
                  className={`py-2 text-xs font-bold rounded-xl transition ${
                    regTransmission === 'manual'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  {isRtl ? 'عادي (Manual)' : 'Manual'}
                </button>
                <button
                  type="button"
                  onClick={() => setRegTransmission('automatic')}
                  className={`py-2 text-xs font-bold rounded-xl transition ${
                    regTransmission === 'automatic'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  {isRtl ? 'أوتوماتيك (Automatic)' : 'Automatic'}
                </button>
              </div>
            </div>

            {/* Premium Interactive Package Selection Cards */}
            <div className="space-y-3 pt-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  {isRtl ? 'اختر باقة القيادة المطلوبة' : 'Select Your Driving Package'}
                </label>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-200/50 dark:border-blue-900/50">
                  {packages.length} {isRtl ? 'باقات متاحة' : 'packages available'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-1">
                {packages
                  .filter(pkg => pkg.isActive !== false)
                  .map(pkg => {
                    const isSelected = regPackageId === pkg.id;
                    const CardComp = PassedPackageCard || PackageCard;
                    return (
                      <div key={pkg.id} className="cursor-pointer">
                        <CardComp
                          pkg={pkg}
                          lang={lang}
                          isSelected={isSelected}
                          onSelect={() => {
                            setRegPackageId(pkg.id);
                            if (setRegPackage) {
                              setRegPackage(pkg.name || pkg.title || pkg.id);
                            }
                          }}
                          isNoPackage={pkg.id === 'no-package'}
                          hourlyRate={lessonHourlyRate}
                        />
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Terms & Conditions Checkbox */}
            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={regCheckedTerms}
                onChange={e => setRegCheckedTerms(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-600 dark:text-zinc-400">
                {isRtl ? 'أوافق على الشروط والأحكام وسياسة الخصوصية للمدرسة' : 'I agree to the school terms, conditions and privacy policy'}
              </span>
            </label>

            {/* Register Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs sm:text-sm transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>{isRtl ? 'إنشاء الحساب الآن' : 'Complete Registration'}</span>
              <ArrowIcon className="h-4 w-4" />
            </button>

          </form>
        )}

      </div>
    </div>
  );
}
