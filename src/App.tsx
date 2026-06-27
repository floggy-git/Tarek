import React, { useState, useEffect } from 'react';
import { 
  Compass, Calendar, Wallet, User, Globe, Shield, Sparkles, Bell, 
  Moon, Sun, Wifi, WifiOff, RefreshCw, X, CheckSquare, Trophy, AlertTriangle, ArrowRight, LogIn, UserPlus, LogOut
} from 'lucide-react';
import { Language, UserRole, TRANSLATIONS, Lesson, WalletTransaction, AchievementBadge, TrainerSchedule } from './types';
import { INITIAL_LESSONS, INITIAL_TRANSACTIONS, INITIAL_ACHIEVEMENTS, MOCK_TRAINER_SCHEDULE } from './data';

// Import our custom sub-app workspaces
import StudentHome from './components/StudentHome';
import StudentLessons from './components/StudentLessons';
import StudentLearning from './components/StudentLearning';
import StudentWallet from './components/StudentWallet';
import StudentProfile from './components/StudentProfile';
import TrainerDashboard from './components/TrainerDashboard';

export default function App() {
  // Application general config/state
  const [lang, setLang] = useState<Language>('nl'); // Default to Dutch
  const [role, setRole] = useState<UserRole>('student'); 
  const [darkMode, setDarkMode] = useState(false);
  const [isOffline, setIsOffline] = useState(false); // Simulated Offline state toggle

  // Session Authentication state
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    phone: string;
    role: 'student' | 'trainer';
    lang: Language;
    packageSelection?: string;
    dob?: string;
    city?: string;
    priorExperience?: string;
    transmissionType?: 'manual' | 'automatic';
  } | null>(() => {
    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem('al_andalos_user');
    } catch (e) {
      console.warn("sessionStorage is not accessible", e);
    }
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.role === 'student' || parsed.role === 'trainer')) {
          return parsed;
        }
        sessionStorage.removeItem('al_andalos_user');
      } catch {
        return null;
      }
    }
    return null;
  });

  // Auth gate options state
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [loginRole, setLoginRole] = useState<'student' | 'trainer'>('student');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDob, setRegDob] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regPackage, setRegPackage] = useState('Optimal Progress (20h)');
  const [regExperience, setRegExperience] = useState('none');
  const [regTransmission, setRegTransmission] = useState<'manual' | 'automatic'>('manual');
  const [regCheckedTerms, setRegCheckedTerms] = useState(false);
  const [regSuccessMessage, setRegSuccessMessage] = useState('');

  // Core databases
  const [lessons, setLessons] = useState<Lesson[]>(INITIAL_LESSONS);
  const [transactions, setTransactions] = useState<WalletTransaction[]>(INITIAL_TRANSACTIONS);
  const [badges, setBadges] = useState<AchievementBadge[]>(INITIAL_ACHIEVEMENTS);
  const [schedule, setSchedule] = useState<TrainerSchedule>(MOCK_TRAINER_SCHEDULE);

  // Bottom Navigation tabs for student App
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedReplayLessonId, setSelectedReplayLessonId] = useState<string>('');

  // Multi-language system translation dictionary helper
  const t = TRANSLATIONS[lang];

  // Sync users with state roles
  useEffect(() => {
    if (currentUser) {
      try {
        sessionStorage.setItem('al_andalos_user', JSON.stringify(currentUser));
      } catch (e) {
        console.warn("sessionStorage is not accessible", e);
      }
      setRole(currentUser.role);
    } else {
      try {
        sessionStorage.removeItem('al_andalos_user');
      } catch (e) {
        console.warn("sessionStorage is not accessible", e);
      }
    }
  }, [currentUser]);

  // Apply dark mode configuration on body index class list
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Push notifications pop toast logs state
  const [notificationsAlerts, setNotificationsAlerts] = useState<string[]>([]);
  
  // Trigger automatic lesson reminder simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setNotificationsAlerts(prev => [
        ...prev, 
        lang === 'ar' ? "تذكير تلقائي: غداً درس القيادة القادم مع المدرب سمير في العاشرة صباحاً." : lang === 'nl' ? "Automatische herinnering: Je volgende rijles staat morgen om 10:00 uur gepland met Samir!" : "Automatic reminder: Your upcoming driving session with Samir is scheduled tomorrow at 10:00!"
      ]);
    }, 7000);
    return () => clearTimeout(timer);
  }, [lang]);

  const dismissNotification = (index: number) => {
    setNotificationsAlerts(prev => prev.filter((_, i) => i !== index));
  };

  // Age calculation helper based on Birth Date for Al-Andalos / Dutch criteria
  const calculateAge = (dobString: string) => {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const regAge = calculateAge(regDob);

  // Demo account logger helper
  const handleDemoLogin = (pRole: 'student' | 'trainer') => {
    if (pRole === 'student') {
      const demoUser = {
        name: "Amir Al-Hassan",
        email: "amir@al-andalos.nl",
        phone: "+31 6 1234 5678",
        role: "student" as const,
        lang: lang,
        packageSelection: "Optimal Progress (20h)",
        dob: "2005-08-15",
        city: "Amsterdam"
      };
      setCurrentUser(demoUser);
    } else {
      const demoTrainer = {
        name: "Instructeur Samir",
        email: "samir@al-andalos.nl",
        phone: "+31 6 9876 5432",
        role: "trainer" as const,
        lang: lang
      };
      setCurrentUser(demoTrainer);
    }
    setActiveTab('home');
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) return;

    if (loginRole === 'trainer') {
      // Login as customized trainer
      const trainer = {
        name: loginEmail.split('@')[0].toUpperCase() === 'SAMIR' ? "Instructeur Samir" : loginEmail.split('@')[0].toUpperCase(),
        email: loginEmail,
        phone: "+31 6 9876 5432",
        role: "trainer" as const,
        lang: lang
      };
      setCurrentUser(trainer);
    } else {
      // Login as customized student
      const user = {
        name: loginEmail.split('@')[0].toUpperCase(),
        email: loginEmail,
        phone: "+31 6 8888 9999",
        role: "student" as const,
        lang: lang,
        packageSelection: "Standard Comfort (15h)",
        dob: "2004-10-10",
        city: "Rotterdam",
        transmissionType: 'manual' as const
      };
      setCurrentUser(user);
    }
    setActiveTab('home');
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPhone.trim()) {
      alert(lang === 'ar' ? 'الرجاء إدخال الاسم والبريد الإلكتروني ورقم الهاتف.' : lang === 'nl' ? 'Voer je naam, e-mailadres en telefoonnummer in.' : 'Please enter your name, email and phone number.');
      return;
    }

    // Register details dynamically
    const newStudent = {
      name: regName,
      email: regEmail,
      phone: regPhone,
      role: 'student' as const,
      lang: lang,
      packageSelection: regPackage,
      dob: regDob,
      city: regCity,
      priorExperience: regExperience,
      transmissionType: regTransmission
    };

    // Auto add a personalized welcome lesson
    const welcomeLesson: Lesson = {
      id: `l-welcome-${Date.now()}`,
      studentName: regName,
      trainerName: "Instructeur Samir",
      date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // 3 days from now
      time: "11:00",
      duration: 1,
      price: 65,
      pickupLocation: regCity || "Utrecht Centraal",
      status: "upcoming"
    };

    setLessons(prev => [welcomeLesson, ...prev]);

    // Show dynamic success banner
    const successText = lang === 'ar' 
      ? `أهلاً بك ${regName}! تم تسجيلك بنجاح في مدرسة الأندلس للتعليم العالي لتعليم القيادة. لقد قمنا بتفعيل باقة (${regPackage}) وحجز أول درس تمهيدي لك في ${welcomeLesson.pickupLocation}!` 
      : lang === 'nl' 
      ? `Gefeliciteerd ${regName}! Je bent succesvol ingeschreven bij Al-Andalos Rijschool. Je pakket (${regPackage}) is actief en je eerste les is ingepland op ${welcomeLesson.pickupLocation}!` 
      : `Welcome ${regName}! You have registered successfully at Al-Andalos Driving Academy. Package (${regPackage}) is active and your intro driving session is reserved in ${welcomeLesson.pickupLocation}!`;
    
    setRegSuccessMessage(successText);
    
    // Auto login after 3 seconds
    setTimeout(() => {
      setCurrentUser(newStudent);
      setRegSuccessMessage('');
      setActiveTab('home');
    }, 4500);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Auth translation dict helpers
  const authLabels = {
    ar: {
      title: "تسجيل الدخول الأندلس",
      desc: "أكاديمية القيادة الأولى والفاخرة لتدريب الطلاب والمحترفين بهولندا",
      roleSelect: "اختر نوع الحساب",
      loginTab: "تسجيل الدخول",
      registerTab: "تسجيل مبرمج جديد",
      fullName: "الاسم الكامل المزدوج",
      email: "البريد الإلكتروني الرئيسي",
      phone: "رقم الجوال الهولندي",
      dob: "تاريخ الميلاد لتحديد الأحقية",
      city: "مكان الإقامة والبلدية",
      pakket: "باقة التدريب المفضلة",
      pastExp: "الخبرة السابقة في القيادة",
      expNone: "مبتدئ بالكامل (بدون أي خبرة)",
      expSome: "لدي بعض المبادئ الأساسية",
      expExp: "لدي رخصة أجنبية أو خبرة متوسطة",
      acceptTerms: "أوافق على الشروط والأحكام الخاصة بأكاديمية الأندلس والتدريب العملي",
      submitReg: "تقديم طلب التسجيل الفوري",
      demoTitle: "بوابة الدخول السريع التجريبية",
      demoStudent: "دخول سريع كطالب (أمير الحسين)",
      demoTrainer: "دخول سريع كمدرب (الأستاذ سمير)",
      logout: "تسجيل الخروج",
      welcomeUser: "مرحباً يا",
      ageCheck: "شروط السن القانوني للقيادة",
      ageEligible: "مؤهل قانونياً لاجتياز اختبار القيادة العملي والنظري!",
      ageUnder: "السن أقل من 16.5 - متاح دراسة النظرية فقط والتدريب لاحقاً.",
      activePackage: "الباقة النشطة",
      transType: "نوع ناقل الحركة",
      manual: "عادي / يدوي",
      automatic: "أوتوماتيك"
    },
    nl: {
      title: "Inloggen Al-Andalos",
      desc: "De meest premium en technologische rijopleiding van Nederland met AI-begeleiding.",
      roleSelect: "Selecteer Rol",
      loginTab: "Inloggen",
      registerTab: "Nieuwe Leerling Registreren",
      fullName: "Volledige Naam",
      email: "E-mailadres",
      phone: "Telefoonnummer",
      dob: "Geboortedatum (Leeftijdscontrole)",
      city: "Woonplaats / Amsterdam",
      pakket: "Selecteer lespakket",
      pastExp: "Eerdere rijervaring",
      expNone: "Geen ervaring (Beginner)",
      expSome: "Enige ervaring (Koppeling & Sturen)",
      expExp: "Buitenlands rijbewijs / Gevorderd",
      acceptTerms: "Ik ga akkoord met de algemene voorwaarden van Al-Andalos",
      submitReg: "Nu Registreren & Starten",
      demoTitle: "Demo Quick Inlog Portaal",
      demoStudent: "Inloggen als Amir (Leerling)",
      demoTrainer: "Inloggen as Samir (Instructeur)",
      logout: "Uitloggen",
      welcomeUser: "Welkom,",
      ageCheck: "Leeftijdsindicator",
      ageEligible: "Leeftijd is uitstekend! Je kunt direct op voor het praktijkexamen.",
      ageUnder: "Let op: onder de 16.5 jaar mag je alleen theorie studeren.",
      activePackage: "Actief Pakket",
      transType: "Transmissie type",
      manual: "Handgeschakeld (Manual)",
      automatic: "Automaat (Automatic)"
    },
    en: {
      title: "Al-Andalos Rijschool Portal",
      desc: "Premium Apple-inspired driver education suite with real-time route replays.",
      roleSelect: "Account Role",
      loginTab: "Sign In",
      registerTab: "Register New Driving Student",
      fullName: "Full Name",
      email: "Email Address",
      phone: "Phone Number",
      dob: "Date of Birth (Age Eligibility)",
      city: "City of Residence",
      pakket: "Select Drive Package",
      pastExp: "Prior driving experience",
      expNone: "None (Absolute Beginner)",
      expSome: "A little (Clutch & Steering basics)",
      expExp: "Foreign license holder / Advanced",
      acceptTerms: "I accept the Al-Andalos conditions of training",
      submitReg: "Submit Flight Academy Registration",
      demoTitle: "One-Click Quick Authentication",
      demoStudent: "Demo Student Login (Amir)",
      demoTrainer: "Demo Instructor Login (Samir)",
      logout: "Logout Session",
      welcomeUser: "Welcome Back,",
      ageCheck: "Traffic Law Indicator",
      ageEligible: "Age verification perfect! Eligible for practical & theory exams.",
      ageUnder: "Note: Under 16.5 years - only theoretical prep is permitted.",
      activePackage: "Active Pack",
      transType: "Transmission Type",
      manual: "Manual Gearbox",
      automatic: "Automatic"
    }
  }[lang];

  return (
    <div id="app" className={`min-h-screen font-sans antialiased text-slate-800 dark:text-zinc-100 transition-colors duration-300 bg-slate-50/50 dark:bg-black pb-28`}>
      
      {/* Dynamic Push Toast Notification Banner overlay top-right */}
      <div id="push-toast-box" className="fixed top-20 right-4 z-50 space-y-2 max-w-sm w-full font-sans">
        {notificationsAlerts.map((note, idx) => (
          <div key={idx} className="p-4 bg-linear-to-r from-blue-900 to-indigo-950 text-white rounded-2xl shadow-2xl border border-indigo-500/30 flex items-start gap-3 animate-[slideIn_0.3s_ease-out]">
            <Bell className="h-5 w-5 text-blue-400 mt-0.5 shrink-0 animate-bounce" />
            <div className="flex-1 text-xs font-semibold leading-relaxed">
              <p className="font-extrabold text-blue-300 text-[10px] uppercase tracking-wider mb-0.5">Al-Andalos Auto Alert</p>
              <p>{note}</p>
            </div>
            <button 
              onClick={() => dismissNotification(idx)}
              className="p-1 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition shrink-0 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Top Main Shell Header (Apple-styled frosted bar) */}
      <header 
        id="app-header"
        className="sticky top-0 z-40 w-full bg-white/75 dark:bg-zinc-950/75 backdrop-blur-xl border-b border-slate-100 dark:border-zinc-900/80 px-4 py-3 sm:px-6"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Logo Brand Accent with modern badge */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-linear-to-tr from-blue-600 via-indigo-600 to-blue-800 text-white flex items-center justify-center font-black tracking-tighter text-lg shadow-md relative">
              AL
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight dark:text-white">AL-ANDALOS RIJSCHOOL</h1>
              <p className="text-[9px] uppercase tracking-widest text-blue-500 font-extrabold font-mono">Premium Driving Academy</p>
            </div>
          </div>

          {/* Configuration utility ribbon */}
          <div className="flex items-center flex-wrap gap-2.5">
            
            {/* Safe simulated Network connection toggle */}
            <button
              id="offline-state-toggle"
              onClick={() => setIsOffline(!isOffline)}
              className={`p-1.5 rounded-xl border flex items-center gap-1 text-[10px] font-bold transition duration-300 cursor-pointer ${
                isOffline 
                  ? 'bg-amber-100 dark:bg-amber-950/40 border-amber-500/20 text-amber-600 dark:text-amber-400' 
                  : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              }`}
              title="Simulator: click to emulate offline Al-Andalos caching mode"
            >
              {isOffline ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
              <span>{isOffline ? "Offline Caching" : "Live Sync Server"}</span>
            </button>

            {/* Language Switcher selector */}
            <div className="relative inline-flex items-center gap-1 bg-slate-100 dark:bg-zinc-900/50 p-1 rounded-xl border border-slate-100 dark:border-zinc-800">
              <Globe className="h-3.5 w-3.5 text-slate-400 mx-1 shrink-0" />
              {(['nl', 'en', 'ar'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2 py-1 rounded-lg text-[10px] uppercase font-bold transition ${
                    lang === l 
                      ? 'bg-blue-600 text-white shadow-xs font-black' 
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-350'
                  }`}
                >
                  {l === 'nl' ? 'Nl' : l === 'ar' ? 'العربية' : 'En'}
                </button>
              ))}
            </div>

            {/* Dark mode toggle block */}
            <button
              id="dark-mode-toggle"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 border border-slate-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-350 rounded-xl hover:text-blue-500 hover:border-blue-400 transition cursor-pointer"
            >
              {darkMode ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-indigo-500" />}
            </button>

            {/* Professional logout trigger */}
            {currentUser && (
              <button
                id="header-logout-btn"
                onClick={handleLogout}
                className="p-2 border border-rose-500/20 bg-rose-500/5 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-600 hover:text-white transition flex items-center gap-1 text-[10px] font-bold cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{authLabels.logout}</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* User Session Metadata Banner & Role Switcher */}
      {currentUser && (
        <div 
          id="approle-selector-strip"
          className="w-full bg-slate-100 dark:bg-zinc-950 py-2.5 border-b border-slate-200/50 dark:border-zinc-900 px-4"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <p className="text-xs font-bold text-slate-600 dark:text-zinc-300">
                {authLabels.welcomeUser} <span className="text-blue-600 dark:text-blue-400 font-extrabold">{currentUser.name}</span> 
                {currentUser.packageSelection && <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/30 text-[9px] px-2 py-0.5 rounded-full ml-2 mr-2">{authLabels.activePackage}: {currentUser.packageSelection}</span>}
              </p>
            </div>

            {currentUser.role === 'trainer' && (
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Environment Selector:</span>
                <div className="flex bg-slate-200 dark:bg-zinc-900 p-0.5 rounded-lg w-max shrink-0">
                  {(['student', 'trainer'] as const).map(roleOption => (
                    <button
                      key={roleOption}
                      onClick={() => {
                        setRole(roleOption);
                        if (roleOption === 'student') {
                          setActiveTab('home');
                        }
                      }}
                      className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition shrink-0 ${
                        role === roleOption
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-350'
                      }`}
                    >
                      {roleOption === 'student' ? t.student : t.trainer}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Core View Area */}
      <main className={`max-w-7xl mx-auto px-4 py-8 sm:px-6 ${currentUser && role === 'student' ? 'pb-28 sm:pb-8' : ''}`}>
        
        {/* ACCESS FLOW: Show Login & Registration Form Wall if not Authenticated */}
        {!currentUser ? (
          <div id="auth-wall-container" className="max-w-4xl mx-auto py-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            
            {/* Success Celebration Toast overlay */}
            {regSuccessMessage && (
              <div className="mb-6 p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl border border-emerald-500/20 shadow-2xl flex items-center gap-4 animate-[slideIn_0.3s_ease] z-40">
                <Trophy className="h-10 w-10 text-amber-300 shrink-0 animate-bounce" />
                <div>
                  <h4 className="font-extrabold text-sm">{lang === 'ar' ? 'تهانينا! تم تفعيل حسابك بنجاح' : 'Gefeliciteerd! Account Activering'}</h4>
                  <p className="text-xs text-emerald-100 font-medium leading-relaxed">{regSuccessMessage}</p>
                  <p className="text-[10px] text-amber-200 font-mono mt-1 animate-pulse">{lang === 'ar' ? 'جاري تحويلك الآن لتجربة لوحة التحكم الفاخرة...' : 'U wordt nu direct doorverwezen naar uw cockpit...'}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* BRAND CARD & HERO COLUMN (Left) */}
              <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
                <div className="bg-gradient-to-b from-blue-900/40 via-indigo-950/30 to-black rounded-3xl p-6 border border-indigo-500/10 shadow-xl space-y-6 text-white text-center sm:text-left">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center font-black text-2xl shadow-lg mx-auto sm:mx-0">
                    AL
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black tracking-tight leading-tight">
                      {authLabels.title}
                    </h2>
                    <p className="text-xs text-blue-200/80 leading-relaxed font-medium">
                      {authLabels.desc}
                    </p>
                  </div>

                  {/* Highlights Bullet Indicators */}
                  <div className="space-y-3 pt-4 text-xs font-semibold text-slate-300 text-left" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-mono border border-blue-500/10">✓</div>
                      <span>{lang === 'ar' ? 'دروس مجهزة بخرائط مسارات قيادة عالية الجودة' : lang === 'nl' ? 'Lessen voorzien van realtime GPS routes' : 'Lessons equipped with real-time GPS paths'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-mono border border-blue-500/10">✓</div>
                      <span>{lang === 'ar' ? 'محرك ذكاء اصطناعي للتحضير لاختبارات الأندلس' : lang === 'nl' ? 'AI-Coach ter voorbereiding op Al-Andalos-examens' : 'AI-Coach integrated for Al-Andalos exams'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-mono border border-blue-500/10">✓</div>
                      <span>{lang === 'ar' ? 'أكثر من 100 لوحة مرورية حقيقية ومفصلة' : lang === 'nl' ? 'Meer dan 100 officiële verkeersborden' : 'Over 100 accurate Dutch RVV road signs'}</span>
                    </div>
                  </div>
                </div>

                {/* QUICK PRE-SET DEMO LOGINS BAR */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800/80 shadow-md space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 justify-center sm:justify-start">
                    <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                    {authLabels.demoTitle}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <button
                      onClick={() => handleDemoLogin('student')}
                      className="py-3 px-4 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-xs font-extrabold text-blue-600 dark:text-blue-400 transition text-center flex items-center justify-center gap-2 cursor-pointer shadow-xs scale-100 hover:scale-[1.01]"
                    >
                      <User className="h-4 w-4 shrink-0" />
                      <span>{authLabels.demoStudent}</span>
                    </button>
                    <button
                      onClick={() => handleDemoLogin('trainer')}
                      className="py-3 px-4 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-xs font-extrabold text-indigo-600 dark:text-indigo-400 transition text-center flex items-center justify-center gap-2 cursor-pointer shadow-xs scale-100 hover:scale-[1.01]"
                    >
                      <Shield className="h-4 w-4 shrink-0" />
                      <span>{authLabels.demoTrainer}</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* AUTH PANEL CARD FORM COLUMN (Right) */}
              <div className="lg:col-span-7 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800/80 shadow-2xl p-6 sm:p-8 space-y-6">
                
                {/* Sign In vs register Segment Control bar */}
                <div className="flex p-1 bg-slate-100 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/60 rounded-2xl gap-2">
                  <button
                    onClick={() => setAuthTab('login')}
                    className={`flex-1 py-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                      authTab === 'login' 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    <LogIn className="h-4 w-4 shrink-0" />
                    <span>{authLabels.loginTab}</span>
                  </button>
                  <button
                    onClick={() => setAuthTab('register')}
                    className={`flex-1 py-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                      authTab === 'register' 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    <UserPlus className="h-4 w-4 shrink-0" />
                    <span>{authLabels.registerTab}</span>
                  </button>
                </div>

                {/* FORM VIEW 1: MANUAL SIGN IN */}
                {authTab === 'login' && (
                  <form onSubmit={handleManualLogin} className="space-y-4">
                    
                    {/* Role Selector Switch for Login */}
                    <div className="space-y-2 mb-3">
                      <label className="text-xs font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                        {authLabels.roleSelect}
                      </label>
                      <div className="flex p-1 bg-slate-100/80 dark:bg-zinc-950 border border-slate-200/40 dark:border-zinc-800/60 rounded-2xl gap-1">
                        <button
                          type="button"
                          onClick={() => setLoginRole('student')}
                          className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all duration-150 cursor-pointer ${
                            loginRole === 'student'
                              ? 'bg-white dark:bg-zinc-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/50 dark:border-zinc-700/50 font-bold'
                              : 'text-slate-500 hover:text-slate-850 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-white/40 dark:hover:bg-zinc-800/10'
                          }`}
                        >
                          {t.student}
                        </button>
                        <button
                          type="button"
                           onClick={() => setLoginRole('trainer')}
                          className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all duration-150 cursor-pointer ${
                            loginRole === 'trainer'
                              ? 'bg-white dark:bg-zinc-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/50 dark:border-zinc-700/50 font-bold'
                              : 'text-slate-500 hover:text-slate-850 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-white/40 dark:hover:bg-zinc-800/10'
                          }`}
                        >
                          {t.trainer}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-500">{authLabels.email}</label>
                      <input 
                        type="email" 
                        placeholder={loginRole === 'student' ? "amir@al-andalos.nl" : "samir@al-andalos.nl"}
                        required
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        className="w-full text-xs font-semibold p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-black/40 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-extrabold text-slate-500">
                          {lang === 'ar' ? 'كلمة المرور' : lang === 'nl' ? 'Wachtwoord' : 'Password'}
                        </label>
                        <span className="text-[10px] text-blue-500 font-extrabold hover:underline cursor-pointer">
                          {lang === 'ar' ? 'نسيت كلمة المرور؟' : lang === 'nl' ? 'Wachtwoord vergeten?' : 'Forgot passcode?'}
                        </span>
                      </div>
                      <input 
                        type="password" 
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        className="w-full text-xs p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-black/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-linear-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-2xl text-xs font-extrabold transition shadow-lg shadow-blue-500/10 mt-6 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <LogIn className="h-4 w-4 shrink-0" />
                      <span>{lang === 'ar' ? 'دخول آمن' : lang === 'nl' ? 'Veilig Inloggen' : 'Secure Login'}</span>
                    </button>
                  </form>
                )}

                {/* FORM VIEW 2: COMPREHENSIVE NEW STUDENT REGISTRATION */}
                {authTab === 'register' && (
                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    
                    {/* Full name field */}
                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-500">{authLabels.fullName} *</label>
                      <input 
                        type="text" 
                        required
                        placeholder={lang === 'ar' ? 'مثال: محمد الأندلسي' : 'e.g. Amir Al-Hassan'}
                        value={regName}
                        onChange={e => setRegName(e.target.value)}
                        className="w-full text-xs font-semibold p-3 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      />
                    </div>

                    {/* Contact grid: email & phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-500">{authLabels.email} *</label>
                        <input 
                          type="email" 
                          required
                          placeholder="amir.hassan@gmail.com"
                          value={regEmail}
                          onChange={e => setRegEmail(e.target.value)}
                          className="w-full text-xs font-semibold p-3 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-500">{authLabels.phone} *</label>
                        <input 
                          type="tel" 
                          required
                          placeholder="+31 6 12345678"
                          value={regPhone}
                          onChange={e => setRegPhone(e.target.value)}
                          className="w-full text-xs font-semibold p-3 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Birthday with Al-Andalos validator badge & residence city */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-500">{authLabels.dob}</label>
                        <input 
                          type="date" 
                          value={regDob}
                          onChange={e => setRegDob(e.target.value)}
                          className="w-full text-xs font-semibold p-3 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-500">{authLabels.city}</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Amsterdam, Utrecht"
                          value={regCity}
                          onChange={e => setRegCity(e.target.value)}
                          className="w-full text-xs font-semibold p-3 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Live Al-Andalos / Dutch Age feedback banner */}
                    {regDob && regAge !== null && (
                      <div className="p-3.5 rounded-2xl text-xs flex gap-2 border bg-blue-500/5 border-blue-500/10 text-slate-700 dark:text-zinc-200 animate-fade-in" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                        <AlertTriangle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-[10px] uppercase text-blue-500 tracking-wider">
                            {authLabels.ageCheck} (Age: {regAge})
                          </p>
                          <p className="font-medium text-[11px]">
                            {regAge >= 16.5 ? authLabels.ageEligible : authLabels.ageUnder}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Selection Package cards selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-slate-500">{authLabels.pakket}</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { name: "Starter Core Pack", count: "10h package", desc: "€650 basic theory app", price: 650 },
                          { name: "Optimal Progress (20h)", count: "20h package", desc: "€1250 Al-Andalos mock tests", price: 1250 },
                          { name: "Royal Al-Andalos Intensive", count: "40h package", desc: "€2400 rapid booking", price: 2400 }
                        ].map(pack => (
                          <div
                            key={pack.name}
                            onClick={() => setRegPackage(`${pack.name} (${pack.count})`)}
                            className={`p-3.5 rounded-2xl border text-left cursor-pointer transition select-none flex flex-col justify-between h-28 ${
                              regPackage.startsWith(pack.name)
                                ? 'border-blue-600 bg-blue-500/5 dark:bg-blue-900/10 ring-2 ring-blue-500/20'
                                : 'border-slate-150 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/50'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <h5 className="font-black text-[11px] leading-tight dark:text-white line-clamp-1">{pack.name}</h5>
                              <p className="text-[9px] text-slate-400 font-bold">{pack.desc}</p>
                            </div>
                            <div className="flex justify-between items-baseline pt-2">
                              <span className="text-[9px] text-blue-500 font-black uppercase font-mono">{pack.count}</span>
                              <span className="text-xs font-black text-slate-900 dark:text-white">€{pack.price}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Experience & Transmission selector grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Prior driving experience dropdown */}
                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-500">{authLabels.pastExp}</label>
                        <select 
                          value={regExperience}
                          onChange={e => setRegExperience(e.target.value)}
                          className="w-full text-xs font-semibold p-3.5 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        >
                          <option value="none">{authLabels.expNone}</option>
                          <option value="some">{authLabels.expSome}</option>
                          <option value="experienced">{authLabels.expExp}</option>
                        </select>
                      </div>

                      {/* Transmission Type Selector */}
                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-500">{authLabels.transType} *</label>
                        <select 
                          required
                          value={regTransmission}
                          onChange={e => setRegTransmission(e.target.value as 'manual' | 'automatic')}
                          className="w-full text-xs font-semibold p-3.5 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        >
                          <option value="manual">{authLabels.manual}</option>
                          <option value="automatic">{authLabels.automatic}</option>
                        </select>
                      </div>
                    </div>

                    {/* Terms approval checkbox */}
                    <div className="flex items-start gap-2.5 pt-2">
                      <input 
                        type="checkbox" 
                        id="terms-checkbox"
                        checked={regCheckedTerms}
                        onChange={e => setRegCheckedTerms(e.target.checked)}
                        className="h-4 w-4 rounded-md border-slate-300 dark:border-zinc-800 text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer"
                      />
                      <label htmlFor="terms-checkbox" className="text-[11px] text-slate-400 font-semibold cursor-pointer select-none leading-normal">
                        {authLabels.acceptTerms} *
                      </label>
                    </div>

                    {/* Submit Registration button */}
                    <button
                      type="submit"
                      disabled={!regCheckedTerms}
                      className={`w-full py-4 text-white rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 mt-4 cursor-pointer shadow-lg ${
                        regCheckedTerms 
                          ? 'bg-linear-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-blue-500/15' 
                          : 'bg-slate-300 dark:bg-zinc-800 text-slate-500 cursor-not-allowed shadow-none'
                      }`}
                    >
                      <UserPlus className="h-4 w-4 shrink-0" />
                      <span>{authLabels.submitReg}</span>
                    </button>

                  </form>
                )}

              </div>

            </div>

          </div>
        ) : (
          
          /* AUTHENTICATED WORKSPACES: Show Student or Trainer portal based on selected view */
          <div dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            
            {role === 'student' && (
              <div id="student-portal-host">
                {activeTab === 'home' && (
                  <StudentHome 
                    lang={lang} 
                    t={t} 
                    lessons={lessons} 
                    transactions={transactions} 
                    setActiveTab={setActiveTab}
                    isOffline={isOffline}
                    selectedReplayLessonId={selectedReplayLessonId}
                    setSelectedReplayLessonId={setSelectedReplayLessonId}
                  />
                )}
                {activeTab === 'lessons' && (
                  <StudentLessons 
                    lang={lang} 
                    t={t} 
                    lessons={lessons} 
                    setLessons={setLessons}
                    transactions={transactions}
                    setTransactions={setTransactions}
                    isOffline={isOffline}
                    setParentActiveTab={setActiveTab}
                    setSelectedReplayLessonId={setSelectedReplayLessonId}
                  />
                )}
                {activeTab === 'learning' && (
                  <StudentLearning 
                    lang={lang} 
                    t={t} 
                  />
                )}
                {activeTab === 'wallet' && (
                  <StudentWallet 
                    lang={lang} 
                    t={t} 
                    transactions={transactions} 
                    setTransactions={setTransactions}
                    currentUser={currentUser}
                  />
                )}
                {activeTab === 'profile' && (
                  <StudentProfile 
                    lang={lang} 
                    setLang={setLang}
                    t={t} 
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                    lessons={lessons}
                    badges={badges}
                    setBadges={setBadges}
                    currentUser={currentUser}
                  />
                )}
              </div>
            )}

            {role === 'trainer' && (
              <div id="trainer-portal-host">
                <TrainerDashboard 
                  lang={lang} 
                  t={t} 
                  lessons={lessons} 
                  setLessons={setLessons}
                  transactions={transactions}
                  setTransactions={setTransactions}
                  schedule={schedule}
                  setSchedule={setSchedule}
                />
              </div>
            )}

          </div>
        )}

      </main>

      {/* Primary Apple-style Frosted Student Bottom Navigation Bar */}
      {currentUser && role === 'student' && (
        <nav 
          id="student-bottom-nav"
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border-t border-slate-100 dark:border-zinc-900 p-1 pb-4 sm:pb-2 text-xs shadow-xl"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          <div className="max-w-md mx-auto flex justify-between items-center px-2">
            {/* Nav 1: Home */}
            <button 
              id="nav-home"
              onClick={() => setActiveTab('home')}
              className={`flex-1 flex flex-col items-center gap-1 py-2 transition-all duration-150 cursor-pointer relative ${
                activeTab === 'home' 
                  ? 'text-blue-600 dark:text-blue-400 font-semibold' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'
              }`}
            >
              <Compass className={`h-5 w-5 transition-transform duration-150 ${activeTab === 'home' ? 'scale-110 text-blue-600 dark:text-blue-400' : ''}`} />
              <span className="text-[10px] font-medium tracking-tight">{t.home}</span>
              {activeTab === 'home' && (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </button>

            {/* Nav 2: Lessons */}
            <button 
              id="nav-lessons"
              onClick={() => setActiveTab('lessons')}
              className={`flex-1 flex flex-col items-center gap-1 py-2 transition-all duration-150 cursor-pointer relative ${
                activeTab === 'lessons' 
                  ? 'text-blue-600 dark:text-blue-400 font-semibold' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'
              }`}
            >
              <Calendar className={`h-5 w-5 transition-transform duration-150 ${activeTab === 'lessons' ? 'scale-110 text-blue-600 dark:text-blue-400' : ''}`} />
              <span className="text-[10px] font-medium tracking-tight">{t.lessons}</span>
              {activeTab === 'lessons' && (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </button>

            {/* Nav 3: Learning */}
            <button 
              id="nav-learning"
              onClick={() => setActiveTab('learning')}
              className={`flex-1 flex flex-col items-center gap-1 py-2 transition-all duration-150 cursor-pointer relative ${
                activeTab === 'learning' 
                  ? 'text-blue-600 dark:text-blue-400 font-semibold' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'
              }`}
            >
              <Sparkles className={`h-5 w-5 text-indigo-500 transition-transform duration-150 ${activeTab === 'learning' ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-medium tracking-tight">{t.learning}</span>
              {activeTab === 'learning' && (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </button>

            {/* Nav 4: Wallet */}
            <button 
              id="nav-wallet"
              onClick={() => setActiveTab('wallet')}
              className={`flex-1 flex flex-col items-center gap-1 py-2 transition-all duration-150 cursor-pointer relative ${
                activeTab === 'wallet' 
                  ? 'text-blue-600 dark:text-blue-400 font-semibold' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'
              }`}
            >
              <Wallet className={`h-5 w-5 transition-transform duration-150 ${activeTab === 'wallet' ? 'scale-110 text-blue-600 dark:text-blue-400' : ''}`} />
              <span className="text-[10px] font-medium tracking-tight">{t.wallet}</span>
              {activeTab === 'wallet' && (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </button>

            {/* Nav 5: Profile */}
            <button 
              id="nav-profile"
              onClick={() => setActiveTab('profile')}
              className={`flex-1 flex flex-col items-center gap-1 py-2 transition-all duration-150 cursor-pointer relative ${
                activeTab === 'profile' 
                  ? 'text-blue-600 dark:text-blue-400 font-semibold' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'
              }`}
            >
              <User className={`h-5 w-5 transition-transform duration-150 ${activeTab === 'profile' ? 'scale-110 text-blue-600 dark:text-blue-400' : ''}`} />
              <span className="text-[10px] font-medium tracking-tight">{t.profile}</span>
              {activeTab === 'profile' && (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
          </div>
        </nav>
      )}

    </div>
  );
}
