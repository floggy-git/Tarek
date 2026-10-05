import { CategorySelect } from '../categories/CategorySelect';
import type { DrivingCategory } from '../categories';
import { getEnabledDrivingCategories, normalizeDrivingCategory, categoryHourlyRate, isDrivingCategoryEnabled } from '../utils/companyCategoryAccess';
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
  handleGoogleStudentLogin: () => void;
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
  handleGoogleStudentLogin,
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
  const [registrationCategory, setRegistrationCategory] = useState<DrivingCategory>('B');
  const enabledCategories = getEnabledDrivingCategories(schoolSettings);
  const selectedCategory = enabledCategories.includes(registrationCategory) ? registrationCategory : 'B';
  const visiblePackages = packages.filter(pkg => pkg.isActive !== false &&
    isDrivingCategoryEnabled(schoolSettings, pkg.category) && normalizeDrivingCategory(pkg.category) === selectedCategory);
  const selectCategory = (value: DrivingCategory | '') => {
    const category = value || 'B';
    setRegistrationCategory(category);
    const first = packages.find(pkg => pkg.isActive !== false && normalizeDrivingCategory(pkg.category) === category);
    setRegPackageId(first?.id || '');
    setRegPackage(first?.name || first?.title || '');
  };
  const submitRegistration = (event: React.FormEvent) => {
    if (!visiblePackages.some(pkg => pkg.id === regPackageId)) {
      event.preventDefault();
      alert(lang === 'ar' ? 'اختر باقة متاحة لهذه الفئة أولاً.' : lang === 'nl' ? 'Kies eerst een beschikbaar pakket voor deze categorie.' : 'Please choose an available package for this category.');
      return;
    }
    handleRegisterSubmit(event);
  };
  const isRtl = lang === 'ar';
  const isNl = lang === 'nl';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const text = {
    welcome: isRtl ? 'مرحباً بك مجدداً. الرجاء تسجيل الدخول لمتابعة حسابك.' : isNl ? 'Welkom terug. Log in om je dashboard te openen.' : 'Welcome back. Please sign in to access your dashboard.',
    createAccount: isRtl ? 'أنشئ حسابك الجديد وابدأ رحلتك في تعلم القيادة.' : isNl ? 'Maak je studentenaccount aan om te beginnen.' : 'Create your student account to start learning.',
    signIn: isRtl ? 'تسجيل الدخول' : isNl ? 'Inloggen' : 'Sign In',
    register: isRtl ? 'حساب جديد' : isNl ? 'Registreren' : 'Register',
    accountType: isRtl ? 'نوع الحساب' : isNl ? 'Accounttype' : 'Account Type',
    student: isRtl ? 'طالب قيادة' : isNl ? 'Leerling' : 'Student',
    trainer: isRtl ? 'مدرب' : isNl ? 'Instructeur' : 'Trainer',
    email: isRtl ? 'البريد الإلكتروني' : isNl ? 'E-mailadres' : 'Email Address',
    forgot: isRtl ? 'نسيت كلمة المرور؟' : isNl ? 'Wachtwoord vergeten?' : 'Forgot Password?',
    demoDivider: isRtl ? 'أو التجربة السريعة بنقرة واحدة' : isNl ? 'Of probeer de demo met één klik' : 'Or try with a one-click demo',
    studentDemo: isRtl ? 'تجربة الطالب' : isNl ? 'Leerlingdemo' : 'Student Demo',
    trainerDemo: isRtl ? 'تجربة المدرب' : isNl ? 'Instructeursdemo' : 'Trainer Demo',
    fullName: isRtl ? 'الاسم الكامل' : isNl ? 'Volledige naam' : 'Full Name',
    phone: isRtl ? 'رقم الهاتف' : isNl ? 'Telefoonnummer' : 'Phone Number',
    city: isRtl ? 'المدينة' : isNl ? 'Stad' : 'City',
    dateOfBirth: isRtl ? 'تاريخ الميلاد' : isNl ? 'Geboortedatum' : 'Date of Birth',
    selectDob: isRtl ? 'اختر تاريخ الميلاد' : isNl ? 'Selecteer geboortedatum' : 'Select date of birth',
    transmission: isRtl ? 'نوع ناقل الحركة (الغيير)' : isNl ? 'Type versnellingsbak' : 'Transmission Type',
    manual: isRtl ? 'عادي (Manual)' : isNl ? 'Handgeschakeld' : 'Manual',
    automatic: isRtl ? 'أوتوماتيك (Automatic)' : isNl ? 'Automaat' : 'Automatic',
    selectPackage: isRtl ? 'اختر باقة القيادة المطلوبة' : isNl ? 'Kies je rijlespakket' : 'Select Your Driving Package',
    packagesAvailable: isRtl ? 'باقات متاحة' : isNl ? 'pakketten beschikbaar' : 'packages available',
    terms: isRtl ? 'أوافق على الشروط والأحكام وسياسة الخصوصية للمدرسة' : isNl ? 'Ik ga akkoord met de voorwaarden en het privacybeleid van de rijschool' : 'I agree to the school terms, conditions and privacy policy',
    completeRegistration: isRtl ? 'إنشاء الحساب الآن' : isNl ? 'Registratie voltooien' : 'Complete Registration',
    lightMode: isRtl ? 'التبديل إلى الوضع الفاتح' : isNl ? 'Naar lichte modus' : 'Switch to Light Mode',
    darkMode: isRtl ? 'التبديل إلى الوضع الداكن' : isNl ? 'Naar donkere modus' : 'Switch to Dark Mode',
    showPassword: isRtl ? 'إظهار كلمة المرور' : isNl ? 'Wachtwoord tonen' : 'Show password',
    hidePassword: isRtl ? 'إخفاء كلمة المرور' : isNl ? 'Wachtwoord verbergen' : 'Hide password',
  };

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
                title={darkMode ? text.lightMode : text.darkMode}
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
              ? text.welcome
              : text.createAccount}
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
            <span>{text.signIn}</span>
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
            <span>{text.register}</span>
          </button>
        </div>

        {/* SIGN IN FORM */}
        {authTab === 'login' && (
          <form onSubmit={handleManualLogin} className="space-y-4">
            
            {/* Role Switcher */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider block">
                {text.accountType}
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
                  <span>{text.student}</span>
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
                  <span>{text.trainer}</span>
                </button>
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                {text.email}
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
                  {isRtl ? 'كلمة المرور' : isNl ? 'Wachtwoord' : 'Password'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordEmail(loginEmail);
                    setIsForgotPasswordOpen(true);
                  }}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {text.forgot}
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
              <span>{text.signIn}</span>
              <ArrowIcon className="h-4 w-4" />
            </button>

            {loginRole === 'student' && (
              <>
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  <span className="h-px flex-1 bg-slate-200 dark:bg-zinc-800" />
                  <span>{isRtl ? 'أو' : isNl ? 'of' : 'or'}</span>
                  <span className="h-px flex-1 bg-slate-200 dark:bg-zinc-800" />
                </div>
                <button
                  type="button"
                  onClick={handleGoogleStudentLogin}
                  className="w-full py-3 px-4 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="font-black text-base text-blue-600">G</span>
                  <span>{isRtl ? 'المتابعة باستخدام Google' : isNl ? 'Doorgaan met Google' : 'Continue with Google'}</span>
                </button>
              </>
            )}

            {/* Instant Quick Demo Divider */}
            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                {text.demoDivider}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('student')}
                  className="py-2.5 px-3 bg-slate-100 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>{text.studentDemo}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('trainer')}
                  className="py-2.5 px-3 bg-slate-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Shield className="h-3.5 w-3.5" />
                  <span>{text.trainerDemo}</span>
                </button>
              </div>
            </div>

          </form>
        )}

        {/* REGISTER FORM */}
        {authTab === 'register' && (
          <form onSubmit={submitRegistration} className="space-y-4">
            
            {/* Full Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                  {text.fullName} *
                </label>
                <div className="relative">
                  <User className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder={isRtl ? 'محمد علي' : isNl ? 'Volledige naam' : 'Full name'}
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                  {text.phone} *
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
                  {text.email} *
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
                  {text.city} *
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
                    aria-label={showRegPassword ? text.hidePassword : text.showPassword}
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
                    aria-label={showRegConfirmPassword ? text.hidePassword : text.showPassword}
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
                {text.dateOfBirth} *
              </label>
              <DatePicker
                value={regDob}
                onChange={setRegDob}
                placeholder={text.selectDob}
                className="w-full"
              />
            </div>

            {/* Transmission Selector */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                {text.transmission}
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
                  {text.manual}
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
                  {text.automatic}
                </button>
              </div>
            </div>

            <CategorySelect value={selectedCategory} onChange={selectCategory}
              categories={enabledCategories} lang={lang} showSingle />

            {/* Premium Interactive Package Selection Cards */}
            <div className="space-y-3 pt-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  {text.selectPackage}
                </label>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-200/50 dark:border-blue-900/50">
                  {visiblePackages.length} {text.packagesAvailable}
                </span>
              </div>

              {visiblePackages.length === 0 && <p className="rounded-xl border border-slate-200 dark:border-zinc-700 p-4 text-sm text-slate-600 dark:text-zinc-300">
                {isRtl ? 'لم تُضف باقات لهذه الفئة بعد. تواصل مع المدرسة.' : isNl ? 'Er zijn nog geen pakketten voor deze categorie. Neem contact op met de rijschool.' : 'No packages have been added for this category yet. Contact the school.'}
              </p>}
              <div className="grid auto-rows-fr items-stretch grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-1">
                {visiblePackages
                  .map(pkg => {
                    const isSelected = regPackageId === pkg.id;
                    const CardComp = PassedPackageCard || PackageCard;
                    return (
                      <div key={pkg.id} className="flex h-full min-w-0 cursor-pointer">
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
                          hourlyRate={categoryHourlyRate(schoolSettings, selectedCategory, lessonHourlyRate)}
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
                {text.terms}
              </span>
            </label>

            {/* Register Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs sm:text-sm transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>{text.completeRegistration}</span>
              <ArrowIcon className="h-4 w-4" />
            </button>

          </form>
        )}

      </div>
    </div>
  );
}
