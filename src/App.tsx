import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, Calendar, Wallet, User as LucideUser, Globe, Shield, Bell as LucideBell, 
  Moon, Sun, Wifi, WifiOff, RefreshCw, X, CheckSquare, Trophy, AlertTriangle, ArrowRight, LogIn, UserPlus, LogOut,
  KeyRound, Check, Menu, Home, LayoutGrid
} from 'lucide-react';
import { 
  House, CalendarBlank, Wallet as PhosphorWallet, User as PhosphorUser, Bell as PhosphorBell, SquaresFour
} from '@phosphor-icons/react';
import { Language, UserRole, TRANSLATIONS, Lesson, WalletTransaction, AchievementBadge, TrainerSchedule, Assessment, DrivePackage, StudentRecord, AuditLogEntry, SchoolSettings, getSchoolName, getSchoolShortName, getAiAssistantName } from './types';
import { safeSetItem } from './utils/safeStorage';
import { pruneExpiredAiConversations } from './utils/aiCoachStorage';
import { INITIAL_LESSONS, INITIAL_TRANSACTIONS, INITIAL_ACHIEVEMENTS, MOCK_TRAINER_SCHEDULE, INITIAL_PACKAGES, DEFAULT_SCHOOL_SETTINGS } from './data';
import { getSheetsConfig, loadPackagesFromGoogleSheet, writePackagesToGoogleSheet, loadStudentsFromGoogleSheet, writeStudentsToGoogleSheet, loadMediaVideosFromGoogleSheet, writeMediaVideosToGoogleSheet, loadLessonsFromGoogleSheet, writeLessonsToGoogleSheet, checkGoogleDriveFileExists, loadSchoolSettingsFromGoogleSheet, writeSchoolSettingsToGoogleSheet, writeAuditLogToGoogleSheet, fetchClientIpAddress, patchStudentInGoogleSheet, patchSettingInGoogleSheet } from './utils/googleSheets';
import { syncEngine, SyncDelta } from './utils/syncEngine';
import { isRecordForStudent, studentNamesMatch } from './utils/identity';
import { getUnreadNotificationCount, markAllNotificationsAsRead } from './utils/notificationStore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth as firebaseAuth } from './services/googleAuthService';

// Import our custom sub-app workspaces
import Header from './components/Header';
import StudentHome from './components/StudentHome';
import SchoolLogo from './components/SchoolLogo';
import { DatePicker } from './components/DatePicker';

import { ThemeProvider } from './themes/ThemeContext';
import LoginScreen from './components/LoginScreen';
import { PackageCard } from './components/PackageCard';
import AdminControlCenterModal from './components/adminControlCenter/AdminControlCenterModal';

const StudentLessons = React.lazy(() => import('./components/StudentLessons'));
const StudentLearning = React.lazy(() => import('./components/StudentLearning'));
const StudentWallet = React.lazy(() => import('./components/StudentWallet'));
const StudentProfile = React.lazy(() => import('./components/StudentProfile'));
const TrainerDashboard = React.lazy(() => import('./components/TrainerDashboard'));

const FORGOT_PASSWORD_T = {
  ar: {
    title: "نسيت كلمة المرور",
    desc: "أدخل بريدك الإلكتروني المسجل لإعادة تعيين كلمة المرور الخاصة بك.",
    emailLabel: "البريد الإلكتروني",
    placeholder: "name@drivingschool.nl",
    btnSend: "إرسال رابط إعادة التعيين",
    btnSending: "جاري الإرسال...",
    btnCancel: "إلغاء",
    errInvalidFormat: "الرجاء إدخال بريد إلكتروني بشكل صحيح.",
    errNotFound: "البريد الإلكتروني غير مسجل في قاعدة البيانات لدينا.",
    errOffline: "لا يوجد اتصال بالإنترنت. يرجى التحقق من الشبكة وإعادة المحاولة.",
    errSendFailed: "فشل إرسال البريد الإلكتروني. يرجى المحاولة لاحقاً.",
    successTitle: "تم الإرسال بنجاح!",
    successDesc: (email: string) => `لقد تم إرسال رسالة بريد إلكتروني لإعادة تعيين كلمة المرور إلى: ${email}. يرجى التحقق من صندوق الوارد الخاص بك.`,
    btnClose: "إغلاق"
  },
  nl: {
    title: "Wachtwoord vergeten",
    desc: "Voer je geregistreerde e-mailadres in om je wachtwoord opnieuw in te stellen.",
    emailLabel: "E-mailadres",
    placeholder: "naam@drivingschool.nl",
    btnSend: "Verzend Reset Link",
    btnSending: "Verzenden...",
    btnCancel: "Annuleren",
    errInvalidFormat: "Voer een geldig e-mailadres in.",
    errNotFound: "Het e-mailadres is niet geregistreerd in ons systeem.",
    errOffline: "Geen internetverbinding. Controleer je netwerk en probeer het opnieuw.",
    errSendFailed: "Het verzenden is mislukt. Probeer het later opnieuw.",
    successTitle: "Succesvol verzonden!",
    successDesc: (email: string) => `Er is een e-mail voor het opnieuw instellen van het wachtwoord verzonden naar: ${email}. Controleer je inbox.`,
    btnClose: "Sluiten"
  },
  en: {
    title: "Forgot Password",
    desc: "Enter your registered email address to reset your password.",
    emailLabel: "Email Address",
    placeholder: "name@drivingschool.nl",
    btnSend: "Send Reset Link",
    btnSending: "Sending...",
    btnCancel: "Cancel",
    errInvalidFormat: "Please enter a valid email address.",
    errNotFound: "This email address is not registered in our database.",
    errOffline: "No internet connection. Please check your network and try again.",
    errSendFailed: "Failed to send email. Please try again later.",
    successTitle: "Sent Successfully!",
    successDesc: (email: string) => `A password reset email has been sent to: ${email}. Please check your inbox.`,
    btnClose: "Close"
  }
};

const RESET_PAGE_T = {
  ar: {
    title: "إعادة تعيين كلمة المرور",
    subtitle: "اختر كلمة مرور جديدة لحسابك.",
    verifying: "جاري التحقق من أمان الرابط...",
    newPassword: "كلمة المرور الجديدة",
    confirmPassword: "تأكيد كلمة المرور",
    btnSubmit: "حفظ وتحديث كلمة المرور",
    btnSubmitting: "جاري تحديث كلمة المرور...",
    btnBack: "العودة إلى تسجيل الدخول",
    successTitle: "تمت إعادة التعيين بنجاح!",
    successDesc: "تم تحديث كلمة المرور الخاصة بك بنجاح. يمكنك الآن استخدام كلمة المرور الجديدة لتسجيل الدخول إلى حسابك.",
    placeholderNew: "أدخل كلمة مرور جديدة",
    placeholderConfirm: "تأكيد كلمة المرور الخاصة بك"
  },
  nl: {
    title: "Wachtwoord Opnieuw Instellen",
    subtitle: "Kies een nieuw veilig wachtwoord voor je account.",
    verifying: "Veiligheid van link controleren...",
    newPassword: "Nieuw Wachtwoord",
    confirmPassword: "Bevestig Wachtwoord",
    btnSubmit: "Wachtwoord Opslaan",
    btnSubmitting: "Wachtwoord bijwerken...",
    btnBack: "Terug naar Inloggen",
    successTitle: "Wachtwoord Gewijzigd!",
    successDesc: "Je wachtwoord is succesvol bijgewerkt. Je kunt nu inloggen met je nieuwe wachtwoord.",
    placeholderNew: "Voer een nieuw wachtwoord in",
    placeholderConfirm: "Bevestig je wachtwoord"
  },
  en: {
    title: "Reset Password",
    subtitle: "Choose a secure new password for your account.",
    verifying: "Verifying link security...",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    btnSubmit: "Save New Password",
    btnSubmitting: "Updating password...",
    btnBack: "Back to Login",
    successTitle: "Successfully Reset!",
    successDesc: "Your password has been updated successfully. You can now log in using your new credentials.",
    placeholderNew: "Enter a new password",
    placeholderConfirm: "Confirm your password"
  }
};

const LazyFallback = () => (
  <div className="flex flex-col items-center justify-center p-12 min-h-[350px] text-slate-400 dark:text-zinc-500">
    <RefreshCw className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
    <p className="text-xs font-mono tracking-wider uppercase">Loading module...</p>
  </div>
);

export default function App() {
  // Application general config/state
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('drivingschool_lang') || localStorage.getItem('al_andalos_lang');
      if (saved === 'ar' || saved === 'nl' || saved === 'en') {
        return saved as Language;
      }
    } catch (e) {}
    return 'nl';
  });

  const setLang = React.useCallback((newLang: Language) => {
    setLangState(newLang);
    try {
      safeSetItem('drivingschool_lang', newLang);
    } catch (e) {}

    setCurrentUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, lang: newLang };
      try {
        sessionStorage.setItem('drivingschool_user', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);
  const [role, setRole] = useState<UserRole>('student'); 
  const [darkMode, setDarkMode] = useState(false);
  const [isOffline, setIsOffline] = useState(false); // Simulated Offline state toggle

  // Session Authentication state
  const [currentUser, setCurrentUser] = useState<{
    id?: string;
    studentId?: string;
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
      saved = sessionStorage.getItem('drivingschool_user') || sessionStorage.getItem('al_andalos_user');
    } catch (e) {
      console.warn("sessionStorage is not accessible", e);
    }
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.role === 'student' || parsed.role === 'trainer')) {
          return parsed;
        }
        sessionStorage.removeItem('drivingschool_user');
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
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPackage, setRegPackage] = useState('No Package');
  const [regPackageId, setRegPackageId] = useState('no-package');
  const [regExperience, setRegExperience] = useState('none');
  const [regTransmission, setRegTransmission] = useState<'manual' | 'automatic'>('manual');
  const [regTheoryStatus, setRegTheoryStatus] = useState('⏳ Has not passed the theory exam yet');
  const [regCheckedTerms, setRegCheckedTerms] = useState(false);
  const [regSuccessMessage, setRegSuccessMessage] = useState('');

  // Forgot Password modal states
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordStatus, setForgotPasswordStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');

  // Password reset from URL link states
  const [resetTokenFromUrl, setResetTokenFromUrl] = useState<string | null>(null);
  const [resetEmailFromUrl, setResetEmailFromUrl] = useState<string | null>(null);
  const [resetPasswordStatus, setResetPasswordStatus] = useState<'idle' | 'verifying' | 'valid' | 'invalid' | 'submitting' | 'success'>('idle');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetErrorMsg, setResetErrorMsg] = useState('');

  // Admin Control Center Modal state
  const [showAdminControlCenter, setShowAdminControlCenter] = useState(false);

  useEffect(() => {
    const handleOpenAdmin = () => setShowAdminControlCenter(true);
    window.addEventListener('openAdminControlCenter', handleOpenAdmin);
    return () => window.removeEventListener('openAdminControlCenter', handleOpenAdmin);
  }, []);

  // Core databases
  const [lessons, setLessons] = useState<Lesson[]>(INITIAL_LESSONS);
  const [transactions, setTransactions] = useState<WalletTransaction[]>(INITIAL_TRANSACTIONS);
  const [badges, setBadges] = useState<AchievementBadge[]>(INITIAL_ACHIEVEMENTS);
  const [schedule, setSchedule] = useState<TrainerSchedule>(() => {
    try {
      const saved = localStorage.getItem('drivingschool_schedule') || localStorage.getItem('al_andalos_schedule');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Error reading schedule from localStorage", e);
    }
    return MOCK_TRAINER_SCHEDULE;
  });

  const initialScheduleRef = useRef(schedule);

  useEffect(() => {
    if (initialScheduleRef.current === schedule) return;
    const timer = setTimeout(() => {
      safeSetItem('drivingschool_schedule', JSON.stringify(schedule));
      initialScheduleRef.current = schedule;
    }, 500);
    return () => clearTimeout(timer);
  }, [schedule]);

  // Packages state
  const [packages, setPackages] = useState<DrivePackage[]>(() => {
    try {
      const saved = localStorage.getItem('drivingschool_packages') || localStorage.getItem('al_andalos_packages');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Error reading packages from localStorage", e);
    }
    return INITIAL_PACKAGES;
  });

  const initialPackagesRef = useRef(packages);

  useEffect(() => {
    if (initialPackagesRef.current === packages) return;
    const timer = setTimeout(() => {
      safeSetItem('drivingschool_packages', JSON.stringify(packages));
      initialPackagesRef.current = packages;
    }, 500);
    return () => clearTimeout(timer);
  }, [packages]);

  // Prune expired AI Coach conversations (>48 hours) on startup
  useEffect(() => {
    pruneExpiredAiConversations();
  }, []);

  // Verify reset password token from URL on startup
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tok = params.get('token');
    const em = params.get('email');
    if (tok && em) {
      setResetTokenFromUrl(tok);
      setResetEmailFromUrl(em);
      setResetPasswordStatus('verifying');
      
      const config = getSheetsConfig();
      fetch(`/api/verify-reset-token?email=${encodeURIComponent(em)}&token=${tok}&spreadsheetId=${encodeURIComponent(config.spreadsheetId || '')}&accessToken=${encodeURIComponent(config.accessToken || '')}`)
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            setResetPasswordStatus('valid');
          } else {
            setResetPasswordStatus('invalid');
            setResetErrorMsg(
              data.error === 'expired' 
                ? (lang === 'ar' ? 'انتهت صلاحية رابط إعادة التعيين.' : lang === 'nl' ? 'De resetlink is verlopen.' : 'The reset link has expired.')
                : (lang === 'ar' ? 'رابط إعادة التعيين غير صالح.' : lang === 'nl' ? 'De resetlink is ongeldig.' : 'The reset link is invalid.')
            );
          }
        })
        .catch(() => {
          setResetPasswordStatus('invalid');
          setResetErrorMsg(lang === 'ar' ? 'حدث خطأ أثناء التحقق من الرابط.' : lang === 'nl' ? 'Er is een fout opgetreden bij het controleren van de link.' : 'An error occurred while verifying the link.');
        });
    }
  }, [lang]);

  // Initial student records
  const INITIAL_STUDENTS: StudentRecord[] = [
    {
      id: "ST-000001",
      studentId: "ST-000001",
      name: "Amir Al-Hassan",
      email: "amir@student.drivingschool.nl",
      phone: "+31 6 1234 5678",
      password: "",
      dob: "2005-08-15",
      city: "Maastricht",
      packageId: "PKG-000002",
      packageName: "Optimal Progress Pack",
      packageSelection: "Optimal Progress Pack",
      currentPackage: "Optimal Progress Pack",
      packageHours: 20,
      targetHours: 20,
      packagePrice: 1250,
      balance: 150,
      readiness: 90,
      joinedDate: "2026-06-01",
      status: "active",
      theoryExamStatus: "✅ Passed the theory exam"
    },
    {
      id: "ST-000002",
      studentId: "ST-000002",
      name: "Sanne de Jong",
      email: "sanne.dejong@student.drivingschool.nl",
      phone: "+31 6 2345 6789",
      password: "",
      dob: "2004-11-22",
      city: "Rotterdam",
      packageId: "PKG-000001",
      packageName: "Starter Core Pack",
      packageSelection: "Starter Core Pack",
      currentPackage: "Starter Core Pack",
      packageHours: 10,
      targetHours: 10,
      packagePrice: 650,
      balance: -65,
      readiness: 75,
      joinedDate: "2026-06-10",
      status: "active",
      theoryExamStatus: "⌛ Waiting for theory exam result"
    },
    {
      id: "ST-000003",
      studentId: "ST-000003",
      name: "Michael van Berg",
      email: "michael.vanberg@outlook.com",
      phone: "+31 6 3456 7890",
      password: "",
      dob: "2003-04-05",
      city: "Utrecht",
      packageId: "PKG-000001",
      packageName: "Express Course (15h)",
      packageSelection: "Express Course (15h)",
      currentPackage: "Express Course (15h)",
      packageHours: 15,
      targetHours: 15,
      packagePrice: 950,
      balance: 0,
      readiness: 95,
      joinedDate: "2026-05-20",
      status: "active",
      theoryExamStatus: "✅ Passed the theory exam"
    }
  ];

  // Students state with localStorage persistence
  const [students, setStudents] = useState<StudentRecord[]>(() => {
    try {
      const saved = localStorage.getItem('drivingschool_students_db') || localStorage.getItem('al_andalos_students_db');
      if (saved) {
        const parsed: StudentRecord[] = JSON.parse(saved);
        // Normalize IDs to ST-xxxxxx format
        return parsed.map((s, idx) => {
          let stId = s.id || s.studentId;
          if (!stId || stId.includes('AND-AMIR')) stId = 'ST-000001';
          else if (stId.includes('AND-SANNE')) stId = 'ST-000002';
          else if (stId.includes('AND-MICHAEL')) stId = 'ST-000003';
          else if (!stId.startsWith('ST-')) stId = `ST-${String(idx + 1).padStart(6, '0')}`;
          return {
            ...s,
            id: stId,
            studentId: stId,
            password: s.password || ''
          };
        });
      }
    } catch (e) {
      console.error("Error reading students from localStorage", e);
    }
    return INITIAL_STUDENTS;
  });

  const initialStudentsRef = useRef(students);

  useEffect(() => {
    if (initialStudentsRef.current === students) return;
    const timer = setTimeout(() => {
      safeSetItem('drivingschool_students_db', JSON.stringify(students));
      initialStudentsRef.current = students;
    }, 500);
    return () => clearTimeout(timer);
  }, [students]);

  const isLoadedFromSheets = useRef(false);
  const isStudentsLoadedFromSheets = useRef(false);
  const isVideosLoadedFromSheets = useRef(false);
  const isSchoolSettingsLoadedFromSheets = useRef(false);

  // References to keep track of the last successfully saved/loaded values from Google Sheets
  // to avoid infinite sync loops and allow precise reversion on write errors.
  const lastSavedStudentsRef = useRef<StudentRecord[]>([]);
  const lastSavedLessonsRef = useRef<Lesson[]>([]);
  const lastSavedSchoolSettingsRef = useRef<any>(null);

  // School Settings state with local fallback and Google Sheets synchronization
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(() => {
    try {
      const saved = localStorage.getItem('drivingschool_school_settings') || localStorage.getItem('al_andalos_school_settings');
      if (saved) {
        return { ...DEFAULT_SCHOOL_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Error reading school settings from localStorage", e);
    }
    return DEFAULT_SCHOOL_SETTINGS;
  });

  const initialSchoolSettingsRef = useRef(schoolSettings);

  useEffect(() => {
    if (initialSchoolSettingsRef.current === schoolSettings) return;
    const timer = setTimeout(() => {
      safeSetItem('drivingschool_school_settings', JSON.stringify(schoolSettings));
      initialSchoolSettingsRef.current = schoolSettings;
    }, 500);
    return () => clearTimeout(timer);
  }, [schoolSettings]);

  // Dynamically synchronize document title & favicon with active School Identity
  useEffect(() => {
    if (schoolSettings) {
      const sName = getSchoolName(schoolSettings);
      document.title = `${sName} | Driving School`;

      const favUrl = schoolSettings.faviconUrl || schoolSettings.appIconUrl || schoolSettings.logoUrl;
      if (favUrl) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'shortcut icon';
          document.head.appendChild(link);
        }
        link.href = favUrl;
      }
    }
  }, [schoolSettings]);

  // Bidirectional synchronization between schedule.lessonPricePerHour and schoolSettings.lessonPricePerHour
  useEffect(() => {
    if (schoolSettings?.lessonPricePerHour !== undefined && !isNaN(schoolSettings.lessonPricePerHour)) {
      setSchedule(prev => {
        if (!prev || prev.lessonPricePerHour === schoolSettings.lessonPricePerHour) return prev;
        return { ...prev, lessonPricePerHour: schoolSettings.lessonPricePerHour };
      });
    }
  }, [schoolSettings?.lessonPricePerHour]);

  useEffect(() => {
    if (schedule?.lessonPricePerHour !== undefined && !isNaN(schedule.lessonPricePerHour)) {
      setSchoolSettings(prev => {
        if (!prev || prev.lessonPricePerHour === schedule.lessonPricePerHour) return prev;
        return { ...prev, lessonPricePerHour: schedule.lessonPricePerHour };
      });
    }
  }, [schedule?.lessonPricePerHour]);

  // Media Videos state with localStorage persistence
  const [mediaVideos, setMediaVideos] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('drivingschool_media_videos') || localStorage.getItem('al_andalos_media_videos');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error reading media videos from localStorage", e);
      return [];
    }
  });

  const initialMediaVideosRef = useRef(mediaVideos);

  useEffect(() => {
    if (initialMediaVideosRef.current === mediaVideos) return;
    const timer = setTimeout(() => {
      safeSetItem('drivingschool_media_videos', JSON.stringify(mediaVideos));
      initialMediaVideosRef.current = mediaVideos;
    }, 800);
    return () => clearTimeout(timer);
  }, [mediaVideos]);

  // Sync currentUser with fetched sheets data
  useEffect(() => {
    if (!currentUser) return;
    
    if (currentUser.role === 'student' && students.length > 0) {
      const match = students.find(s => s.email?.toLowerCase() === currentUser.email?.toLowerCase() || s.name?.toLowerCase() === currentUser.name?.toLowerCase());
      if (match) {
        const sheetsVal = match.notificationsEnabled !== false;
        if (currentUser.notificationsEnabled !== sheetsVal) {
          setCurrentUser(prev => prev ? {
            ...prev,
            notificationsEnabled: sheetsVal
          } : null);
        }
      }
    } else if (currentUser.role === 'trainer' && schoolSettings) {
      const sheetsVal = schoolSettings.notificationsEnabled !== false;
      if (currentUser.notificationsEnabled !== sheetsVal) {
        setCurrentUser(prev => prev ? {
          ...prev,
          notificationsEnabled: sheetsVal
        } : null);
      }
    }
  }, [students, schoolSettings?.notificationsEnabled, currentUser?.email, currentUser?.name, currentUser?.role]);

  // Auto-load packages, students, and media videos from Google Sheets on startup if configured
  useEffect(() => {
    const config = getSheetsConfig();
    if (config.spreadsheetId && (config.apiKey || config.accessToken)) {
      loadPackagesFromGoogleSheet(config)
        .then(pkgs => {
          if (pkgs && pkgs.length > 0) {
            setPackages(pkgs);
          }
          isLoadedFromSheets.current = true;
        })
        .catch(err => {
          console.error("Failed to auto-load packages from Google Sheets on startup:", err);
          isLoadedFromSheets.current = true;
        });

      loadStudentsFromGoogleSheet(config)
        .then(stList => {
          if (stList && stList.length > 0) {
            setStudents(stList);
            lastSavedStudentsRef.current = stList;
          } else {
            lastSavedStudentsRef.current = students;
          }
          isStudentsLoadedFromSheets.current = true;
        })
        .catch(err => {
          console.error("Failed to auto-load students from Google Sheets on startup:", err);
          lastSavedStudentsRef.current = students;
          isStudentsLoadedFromSheets.current = true;
        });

      loadLessonsFromGoogleSheet(config)
        .then(lessonList => {
          setLessons(lessonList || []);
          lastSavedLessonsRef.current = lessonList || [];
        })
        .catch(err => {
          console.error("Failed to auto-load lessons from Google Sheets on startup:", err);
          lastSavedLessonsRef.current = lessons;
        });

      loadMediaVideosFromGoogleSheet(config)
        .then(async (vids) => {
          if (vids && vids.length > 0) {
            // Check Google Drive file existence for each video having a driveFileId
            const checkedVids = await Promise.all(
              vids.map(async (v) => {
                if (v.driveFileId && config.accessToken) {
                  try {
                    const exists = await checkGoogleDriveFileExists(config.accessToken, v.driveFileId);
                    return { ...v, isMissingFromDrive: !exists };
                  } catch (e) {
                    console.error("Failed to verify Google Drive file existence:", e);
                    return v;
                  }
                }
                return v;
              })
            );
            setMediaVideos(checkedVids);
          }
          isVideosLoadedFromSheets.current = true;
        })
        .catch(err => {
          console.error("Failed to auto-load media videos from Google Sheets on startup:", err);
          isVideosLoadedFromSheets.current = true;
        });
      loadSchoolSettingsFromGoogleSheet(config)
        .then(settings => {
          if (settings && settings.name) {
            setSchoolSettings(prev => {
              const updated = { ...prev, ...settings };
              lastSavedSchoolSettingsRef.current = updated;
              return updated;
            });
          } else {
            lastSavedSchoolSettingsRef.current = schoolSettings;
          }
          isSchoolSettingsLoadedFromSheets.current = true;
        })
        .catch(err => {
          console.error("Failed to auto-load school settings from Google Sheets on startup:", err);
          lastSavedSchoolSettingsRef.current = schoolSettings;
          isSchoolSettingsLoadedFromSheets.current = true;
        });
    } else {
      isLoadedFromSheets.current = true;
      isStudentsLoadedFromSheets.current = true;
      isVideosLoadedFromSheets.current = true;
      isSchoolSettingsLoadedFromSheets.current = true;
      lastSavedStudentsRef.current = students;
      lastSavedLessonsRef.current = lessons;
      lastSavedSchoolSettingsRef.current = schoolSettings;
    }
  }, []);

  // Initialize and connect Real-Time Sync Engine
  useEffect(() => {
    const studentId = currentUser?.role === 'student' ? (currentUser.id || '') : '';
    syncEngine.init(currentUser?.role || 'guest', studentId);

    // Subscribe to live inbound deltas from other users / Google Sheets
    const unsubscribe = syncEngine.subscribe({
      id: 'app-root-sync-listener',
      callback: (delta: SyncDelta) => {
        // Enforce strict student scope isolation in client listener
        if (currentUser?.role === 'student') {
          const currentStudentId = currentUser.studentId || currentUser.id;
          if (delta.studentId && currentStudentId && delta.studentId !== currentStudentId) {
            return;
          }
          if (['STUDENT', 'LESSON', 'TRANSACTION', 'WALLET', 'INVOICE'].includes(delta.entityType)) {
            if (delta.studentId && delta.studentId !== currentStudentId) {
              return;
            }
            if (delta.entityType === 'STUDENT' && delta.entityId !== currentStudentId) {
              return;
            }
          }
        }

        console.log(`[App] Real-time delta received: ${delta.entityType} (${delta.action})`, delta);

        if (delta.entityType === 'STUDENT') {
          if (delta.action === 'UPDATE' || delta.action === 'CREATE') {
            setStudents(prev => {
              const targetId = delta.entityId || delta.studentId;
              const index = prev.findIndex(s => s.id === targetId || (s as any).studentId === targetId);
              if (index !== -1) {
                const updated = [...prev];
                updated[index] = { ...updated[index], ...delta.data };
                lastSavedStudentsRef.current = updated;
                return updated;
              } else if (delta.action === 'CREATE' && delta.data) {
                const updated = [...prev, delta.data];
                lastSavedStudentsRef.current = updated;
                return updated;
              }
              return prev;
            });

            // Update current user if this delta applies to them
            if (currentUser && (currentUser.id === delta.entityId || currentUser.id === delta.studentId)) {
              setCurrentUser(prev => prev ? { ...prev, ...delta.data } : null);
            }
          } else if (delta.action === 'DELETE') {
            setStudents(prev => {
              const updated = prev.filter(s => s.id !== delta.entityId && (s as any).studentId !== delta.entityId);
              lastSavedStudentsRef.current = updated;
              return updated;
            });
          }
        } else if (delta.entityType === 'TRANSACTION' || delta.entityType === 'WALLET') {
          if (delta.action === 'UPDATE' || delta.action === 'CREATE') {
            setTransactions(prev => {
              const targetId = delta.entityId;
              const index = prev.findIndex(t => t.id === targetId || (t as any).transactionId === targetId);
              if (index !== -1) {
                const updated = [...prev];
                updated[index] = { ...updated[index], ...delta.data };
                return updated;
              } else if (delta.data) {
                return [delta.data, ...prev];
              }
              return prev;
            });
          } else if (delta.action === 'DELETE') {
            setTransactions(prev => prev.filter(t => t.id !== delta.entityId && (t as any).transactionId !== delta.entityId));
          }
        } else if (delta.entityType === 'SETTING') {
          setSchoolSettings(prev => {
            const updated = { ...prev, ...delta.data };
            lastSavedSchoolSettingsRef.current = updated;
            return updated;
          });
        } else if (delta.entityType === 'PACKAGE') {
          if (delta.action === 'UPDATE' || delta.action === 'CREATE') {
            setPackages(prev => {
              const index = prev.findIndex(p => p.id === delta.entityId);
              if (index !== -1) {
                const updated = [...prev];
                updated[index] = { ...updated[index], ...delta.data };
                return updated;
              } else if (delta.data) {
                return [...prev, delta.data];
              }
              return prev;
            });
          }
        } else if (delta.entityType === 'LESSON') {
          setLessons(prev => {
            const index = prev.findIndex(l => l.id === delta.entityId);
            if (index !== -1) {
              const updated = [...prev];
              updated[index] = { ...updated[index], ...delta.data };
              return updated;
            } else if (delta.data) {
              return [...prev, delta.data];
            }
            return prev;
          });
        } else if (delta.entityType === 'INVOICE') {
          try {
            const raw = localStorage.getItem('drivingschool_invoices');
            const invoicesList = raw ? JSON.parse(raw) : [];
            const idx = invoicesList.findIndex((inv: any) => inv.invoiceId === delta.entityId || inv.id === delta.entityId);
            if (idx !== -1) {
              invoicesList[idx] = { ...invoicesList[idx], ...delta.data };
            } else if (delta.data) {
              invoicesList.unshift(delta.data);
            }
            localStorage.setItem('drivingschool_invoices', JSON.stringify(invoicesList));
            window.dispatchEvent(new CustomEvent('drivingschool_invoices_updated', { detail: delta }));
          } catch {}
        } else if (delta.entityType === 'NOTIFICATION') {
          if (delta.data?.message || delta.data?.title) {
            const msg = delta.data.title ? `${delta.data.title}: ${delta.data.message || ''}` : delta.data.message;
            setNotificationsAlerts(prev => [msg, ...prev].slice(0, 5));
          }
        } else if (delta.entityType === 'HELP') {
          try {
            window.dispatchEvent(new CustomEvent('drivingschool_help_updated', { detail: delta }));
          } catch {}
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser?.role, currentUser?.id]);

  // Auto-write school settings to Google Sheets on modification (debounced)
  useEffect(() => {
    if (!isSchoolSettingsLoadedFromSheets.current) return;
    if (lastSavedSchoolSettingsRef.current === schoolSettings) return;

    const timer = setTimeout(() => {
      if (lastSavedSchoolSettingsRef.current && JSON.stringify(lastSavedSchoolSettingsRef.current) === JSON.stringify(schoolSettings)) {
        lastSavedSchoolSettingsRef.current = schoolSettings;
        return;
      }

      const config = getSheetsConfig();
      if (config.spreadsheetId && config.accessToken) {
        writeSchoolSettingsToGoogleSheet(config, schoolSettings)
          .then(() => {
            console.log("Successfully synchronized school settings to Google Sheets in background.");
            lastSavedSchoolSettingsRef.current = schoolSettings;
          })
          .catch(err => {
            console.error("Failed to write school settings in background:", err);
          });
      } else {
        if (lastSavedSchoolSettingsRef.current) {
          lastSavedSchoolSettingsRef.current = schoolSettings;
        }
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [schoolSettings]);

  // Auto-write packages to Google Sheets on modification (debounced)
  useEffect(() => {
    if (!isLoadedFromSheets.current) return;
    
    const timer = setTimeout(() => {
      const config = getSheetsConfig();
      if (config.spreadsheetId && config.accessToken) {
        writePackagesToGoogleSheet(config, packages)
          .then(() => {
            console.log("Successfully synchronized packages to Google Sheets in background.");
          })
          .catch(err => {
            console.error("Failed to write packages to Google Sheets in background:", err);
          });
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [packages]);

  // Auto-write students to Google Sheets on modification (debounced)
  useEffect(() => {
    if (!isStudentsLoadedFromSheets.current) return;
    if (lastSavedStudentsRef.current === students) return;

    const timer = setTimeout(() => {
      if (lastSavedStudentsRef.current && JSON.stringify(lastSavedStudentsRef.current) === JSON.stringify(students)) {
        lastSavedStudentsRef.current = students;
        return;
      }

      const config = getSheetsConfig();
      if (config.spreadsheetId && config.accessToken) {
        writeStudentsToGoogleSheet(config, students)
          .then(() => {
            console.log("Successfully synchronized students to Google Sheets in background.");
            lastSavedStudentsRef.current = students;
          })
          .catch(err => {
            console.error("Failed to write students in background:", err);
          });
      } else {
        if (lastSavedStudentsRef.current) {
          lastSavedStudentsRef.current = students;
        }
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [students]);

  // Auto-write lessons to Google Sheets on modification (debounced)
  useEffect(() => {
    if (!isSchoolSettingsLoadedFromSheets.current && !isStudentsLoadedFromSheets.current && !isVideosLoadedFromSheets.current) return;
    if (lastSavedLessonsRef.current === lessons) return;

    const timer = setTimeout(() => {
      if (lastSavedLessonsRef.current && JSON.stringify(lastSavedLessonsRef.current) === JSON.stringify(lessons)) {
        lastSavedLessonsRef.current = lessons;
        return;
      }

      const config = getSheetsConfig();
      if (config.spreadsheetId && config.accessToken) {
        writeLessonsToGoogleSheet(config, lessons)
          .then(() => {
            console.log("Successfully synchronized lessons to Google Sheets in background.");
            lastSavedLessonsRef.current = lessons;
          })
          .catch(err => {
            console.error("Failed to write lessons to Google Sheets in background:", err);
          });
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [lessons]);

  // Auto-write media videos to Google Sheets on modification (debounced)
  useEffect(() => {
    if (!isVideosLoadedFromSheets.current) return;

    const timer = setTimeout(() => {
      const config = getSheetsConfig();
      if (config.spreadsheetId && config.accessToken) {
        writeMediaVideosToGoogleSheet(config, mediaVideos)
          .then(() => {
            console.log("Successfully synchronized media videos to Google Sheets in background.");
          })
          .catch(err => {
            console.error("Failed to write media videos to Google Sheets in background:", err);
          });
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [mediaVideos]);

  // Assessments state with localStorage persistence
  const [assessments, setAssessments] = useState<Assessment[]>(() => {
    try {
      const saved = localStorage.getItem('drivingschool_assessments') || localStorage.getItem('al_andalos_assessments');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Error reading assessments from localStorage", e);
    }
    // Default initial assessments
    return [
      {
        id: "REP-901",
        date: "2026-06-15",
        time: "14:30",
        studentName: "Amir Al-Hassan",
        trainerName: "Samir El-Filali",
        lessonId: "lesson-1718461800000",
        scores: {
          control: 8,
          priority: 7,
          highway: 8,
          maneuvers: 7,
          theory: 9
        },
        overallScore: 7.8,
        notes: "Promising control during roundabout joins and overtaking. Needs a bit more speed on highway merges.",
        cbrReadiness: "developing",
        status: "synced"
      }
    ];
  });

  const initialAssessmentsRef = useRef(assessments);

  // Persist assessments to localStorage (debounced)
  useEffect(() => {
    if (initialAssessmentsRef.current === assessments) return;
    const timer = setTimeout(() => {
      safeSetItem('drivingschool_assessments', JSON.stringify(assessments));
      initialAssessmentsRef.current = assessments;
    }, 500);
    return () => clearTimeout(timer);
  }, [assessments]);

  // Bottom Navigation tabs for student App
  const [activeTab, setActiveTab] = useState<string>('home');
  const [learningActiveSubTab, setLearningActiveSubTab] = useState<'theory' | 'videos' | 'images' | 'signs' | 'quiz' | 'coaching'>('theory');
  const [selectedReplayLessonId, setSelectedReplayLessonId] = useState<string>('');

  // Single source of truth for unread notification count
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);

  useEffect(() => {
    const updateCount = () => {
      const count = getUnreadNotificationCount(
        role,
        currentUser?.email,
        currentUser?.name,
        currentUser?.studentId || currentUser?.id
      );
      setUnreadNotificationsCount(count);
    };

    updateCount();
    window.addEventListener('appNotificationsUpdated', updateCount);
    window.addEventListener('storage', updateCount);

    return () => {
      window.removeEventListener('appNotificationsUpdated', updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, [role, currentUser]);

  // Multi-language system translation dictionary helper
  const t = TRANSLATIONS[lang];

  // Sync users with state roles
  useEffect(() => {
    if (currentUser) {
      try {
        sessionStorage.setItem('drivingschool_user', JSON.stringify(currentUser));
      } catch (e) {
        console.warn("sessionStorage is not accessible", e);
      }
      setRole(currentUser.role);
    } else {
      try {
        sessionStorage.removeItem('drivingschool_user');
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

  // Synchronize document direction (RTL for Arabic, LTR for Dutch/English) and lang attribute
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Push notifications pop toast logs state
  const [notificationsAlerts, setNotificationsAlerts] = useState<string[]>([]);
  
  const triggerNotification = React.useCallback((message: string) => {
    setNotificationsAlerts(prev => {
      if (prev.includes(message)) return prev;
      return [...prev, message];
    });

    // Auto dismiss after 4.5 seconds
    setTimeout(() => {
      setNotificationsAlerts(prev => prev.filter(m => m !== message));
    }, 4500);
  }, []);

  useEffect(() => {
    (window as any).triggerNotification = triggerNotification;
    return () => {
      delete (window as any).triggerNotification;
    };
  }, [triggerNotification]);

  const prevLessonsRef = useRef<Lesson[]>([]);
  const prevTransactionsRef = useRef<WalletTransaction[]>([]);
  const isFirstLoadRef = useRef(true);
  const hasShownStartupReminderRef = useRef(false);

  useEffect(() => {
    if (isFirstLoadRef.current) {
      prevLessonsRef.current = lessons;
      prevTransactionsRef.current = transactions;
      isFirstLoadRef.current = false;
      return;
    }

    const prevLessons = prevLessonsRef.current;
    const prevTransactions = prevTransactionsRef.current;

    // 1. Detect newly booked lessons or cancellations / reminders
    lessons.forEach(lesson => {
      const prevLesson = prevLessons.find(l => l.id === lesson.id);
      if (!prevLesson) {
        if (lesson.status === 'upcoming') {
          // Do not trigger immediate popup toast for the student who just completed the booking (they are viewing the booking confirmation screen)
          if (role !== 'student') {
            const msg = lang === 'ar'
              ? `📅 درس جديد محجوز: ${lesson.date} في ${lesson.time} مع ${lesson.trainerName}`
              : lang === 'nl'
              ? `📅 Nieuwe rijles geboekt op ${lesson.date} om ${lesson.time} met ${lesson.trainerName}`
              : `📅 New lesson booked on ${lesson.date} at ${lesson.time} with ${lesson.trainerName}`;
            triggerNotification(msg);
          }
        }
      } else {
        if (lesson.status === 'cancelled' && prevLesson.status !== 'cancelled') {
          const msg = lang === 'ar'
            ? `❌ تم إلغاء درس القيادة بتاريخ ${lesson.date} في ${lesson.time}`
            : lang === 'nl'
            ? `❌ Rijles op ${lesson.date} om ${lesson.time} is geannuleerd`
            : `❌ Driving lesson on ${lesson.date} at ${lesson.time} has been cancelled`;
          triggerNotification(msg);
        }

        if (lesson.reminderSent && !prevLesson.reminderSent) {
          const msg = lang === 'ar'
            ? `✉️ تم إرسال تذكير الدفع لدرس ${lesson.date} في ${lesson.time}`
            : lang === 'nl'
            ? `✉️ Betalingsherinnering verzonden voor les op ${lesson.date} om ${lesson.time}`
            : `✉️ Payment reminder dispatched for lesson on ${lesson.date} at ${lesson.time}`;
          triggerNotification(msg);
        }
      }
    });

    // 2. Detect new transactions (payment received)
    transactions.forEach(tx => {
      const prevTx = prevTransactions.find(t => t.id === tx.id);
      if (!prevTx) {
        if (tx.type === 'deposit') {
          const msg = lang === 'ar'
            ? `💳 تم استلام دفعة جديدة بقيمة €${tx.amount} لـ ${tx.description}`
            : lang === 'nl'
            ? `💳 Betaling ontvangen: €${tx.amount} voor ${tx.description}`
            : `💳 Payment received: €${tx.amount} for ${tx.description}`;
          triggerNotification(msg);
        }
      }
    });

    prevLessonsRef.current = lessons;
    prevTransactionsRef.current = transactions;
  }, [lessons, transactions, lang, triggerNotification]);

  // Custom global non-blocking alert override state
  const [globalAlert, setGlobalAlert] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  // Override window.alert globally to show elegant UI toasts instead of raw alert dialogs
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message: string) => {
      setGlobalAlert({ message, visible: true });
    };
    return () => {
      window.alert = originalAlert;
    };
  }, []);

  // Auto dismiss toast after 6 seconds
  useEffect(() => {
    if (globalAlert.visible) {
      const timer = setTimeout(() => {
        setGlobalAlert(prev => ({ ...prev, visible: false }));
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [globalAlert.visible]);
  
  // Notifications are strictly event-driven (e.g. real bookings, cancellations, real status updates)
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
      const demoEmail = "amir@student.drivingschool.nl";
      const matchedStudent = students.find(s => s.studentId === "ST-000001" || s.id === "ST-000001" || s.email?.toLowerCase() === demoEmail.toLowerCase());
      const selectedPkgObj = packages.find(p => p.id === matchedStudent?.packageId || p.name === matchedStudent?.packageName || p.name === matchedStudent?.currentPackage);
      const pkgName = matchedStudent?.packageName || matchedStudent?.currentPackage || matchedStudent?.packageSelection || selectedPkgObj?.name || "Optimal Progress Pack";
      const pkgHours = matchedStudent?.packageHours !== undefined ? Number(matchedStudent.packageHours) : (matchedStudent?.targetHours !== undefined ? Number(matchedStudent.targetHours) : (selectedPkgObj?.hours ?? 20));
      const pkgPrice = matchedStudent?.packagePrice !== undefined ? Number(matchedStudent.packagePrice) : (selectedPkgObj?.price ?? 1250);

      const demoUser = {
        id: matchedStudent?.id || "ST-000001",
        studentId: matchedStudent?.studentId || "ST-000001",
        name: matchedStudent ? matchedStudent.name : "Amir Al-Hassan",
        email: demoEmail,
        phone: matchedStudent?.phone || "+31 6 1234 5678",
        role: "student" as const,
        lang: lang,
        packageName: pkgName,
        packageSelection: pkgName,
        currentPackage: pkgName,
        packageHours: pkgHours,
        targetHours: pkgHours,
        packagePrice: pkgPrice,
        packageId: matchedStudent?.packageId || selectedPkgObj?.id || "PKG-000002",
        dob: matchedStudent?.dob || "2005-08-15",
        city: matchedStudent?.city || schoolSettings?.city || "Maastricht",
        notificationsEnabled: matchedStudent ? matchedStudent.notificationsEnabled !== false : true
      };
      setCurrentUser(demoUser);
    } else {
      const isNotificationsEnabled = schoolSettings ? schoolSettings.notificationsEnabled !== false : true;
      const demoTrainer = {
        name: schoolSettings?.instructorName || "Lead Instructor",
        email: schoolSettings?.email || "trainer@drivingschool.nl",
        phone: "+31 6 9876 5432",
        role: "trainer" as const,
        lang: lang,
        notificationsEnabled: isNotificationsEnabled
      };
      setCurrentUser(demoTrainer);
    }
    setActiveTab('home');
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) return;

    if (loginRole === 'trainer') {
      // Login as customized trainer
      const cleanEmail = loginEmail.trim().toLowerCase();
      const trainerPassword = loginPassword;
      
      const isNotificationsEnabled = schoolSettings ? schoolSettings.notificationsEnabled !== false : true;
      const trainer = {
        name: cleanEmail.includes('samir') ? "Instructeur Samir" : cleanEmail.split('@')[0].toUpperCase(),
        email: loginEmail.trim(),
        phone: "+31 6 9876 5432",
        role: "trainer" as const,
        lang: lang,
        notificationsEnabled: isNotificationsEnabled
      };
      setCurrentUser(trainer);
    } else {
      // Login as student - STRICT VERIFICATION (No unauthenticated fallback)
      const cleanEmail = loginEmail.trim().toLowerCase();
      const matchedStudent = students.find(s => s.email?.toLowerCase() === cleanEmail);
      
      if (!matchedStudent) {
        alert(
          lang === 'ar' 
            ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' 
            : lang === 'nl' 
            ? 'Ongeldig e-mailadres of wachtwoord.' 
            : 'Invalid email or password.'
        );
        return;
      }

      // Firebase Auth is the only password authority.
      let isPasswordCorrect = false;
      try {
        await signInWithEmailAndPassword(firebaseAuth, cleanEmail, loginPassword);
        isPasswordCorrect = true;
      } catch {
        isPasswordCorrect = false;
      }

      if (!loginPassword || !isPasswordCorrect) {
        alert(
          lang === 'ar' 
            ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' 
            : lang === 'nl' 
            ? 'Ongeldig e-mailadres of wachtwoord.' 
            : 'Invalid email or password.'
        );
        return;
      }

      const rawPkg = matchedStudent.packageName || matchedStudent.packageSelection || matchedStudent.currentPackage || '';
      const matchedPkgObj = packages.find(p => p.id === matchedStudent.packageId || p.name === rawPkg || p.title === rawPkg);
      const matchHours = rawPkg.match(/(\d+)\s*(?:hours|hour|h|ساعة|uur)/i);
      const pkgHours = matchedStudent.packageHours !== undefined && matchedStudent.packageHours !== null
        ? Number(matchedStudent.packageHours)
        : (matchedStudent.targetHours !== undefined && matchedStudent.targetHours !== null
            ? Number(matchedStudent.targetHours)
            : (matchedPkgObj?.hours !== undefined
                ? matchedPkgObj.hours
                : (matchHours ? parseInt(matchHours[1], 10) : 0)));
      const pkgPrice = matchedStudent.packagePrice !== undefined && matchedStudent.packagePrice !== null
        ? Number(matchedStudent.packagePrice)
        : (matchedPkgObj?.price ?? 0);
      const resolvedPkgName = matchedStudent.packageName || matchedStudent.currentPackage || matchedStudent.packageSelection || matchedPkgObj?.name || (lang === 'ar' ? 'بلا باقة' : lang === 'nl' ? 'Geen Pakket' : 'No Package');

      const user = {
        id: matchedStudent.studentId || matchedStudent.id,
        studentId: matchedStudent.studentId || matchedStudent.id,
        name: matchedStudent.name,
        email: matchedStudent.email,
        phone: matchedStudent.phone || "+31 6 8888 9999",
        role: "student" as const,
        lang: lang,
        packageId: matchedStudent.packageId || matchedPkgObj?.id,
        packageName: resolvedPkgName,
        packageSelection: resolvedPkgName,
        currentPackage: resolvedPkgName,
        packageHours: pkgHours,
        targetHours: pkgHours,
        packagePrice: pkgPrice,
        dob: matchedStudent.dob || "2004-10-10",
        city: matchedStudent.city || "Rotterdam",
        transmissionType: matchedStudent.transmissionType || 'manual',
        notificationsEnabled: matchedStudent.notificationsEnabled !== false
      };
      setCurrentUser(user);
    }
    setLoginEmail('');
    setLoginPassword('');
    setActiveTab('home');
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPhone.trim()) {
      alert(lang === 'ar' ? 'الرجاء إدخال الاسم والبريد الإلكتروني ورقم الهاتف.' : lang === 'nl' ? 'Voer je naam, e-mailadres en telefoonnummer in.' : 'Please enter your name, email and phone number.');
      return;
    }

    if (!regPassword || regPassword.length < 8) {
      alert(
        lang === 'ar' 
          ? 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.' 
          : lang === 'nl' 
          ? 'Wachtwoord moet minimaal 8 tekens lang zijn.' 
          : 'Password must be at least 8 characters.'
      );
      return;
    }

    if (regPassword !== regConfirmPassword) {
      alert(
        lang === 'ar' 
          ? 'كلمتا المرور غير متطابقتين.' 
          : lang === 'nl' 
          ? 'Wachtwoorden komen niet overeen.' 
          : 'Passwords do not match.'
      );
      return;
    }

    try {
      await createUserWithEmailAndPassword(firebaseAuth, regEmail.trim().toLowerCase(), regPassword.trim());
    } catch (authError) {
      const code = String(authError?.code || '');
      const message = code === 'auth/email-already-in-use'
        ? (lang === 'ar' ? 'هذا البريد مستخدم مسبقاً.' : lang === 'nl' ? 'Dit e-mailadres is al in gebruik.' : 'This email is already in use.')
        : (lang === 'ar' ? 'تعذر إنشاء الحساب. حاول مرة أخرى.' : lang === 'nl' ? 'Account aanmaken mislukt. Probeer opnieuw.' : 'Could not create the account. Please try again.');
      alert(message);
      return;
    }

    const studentId = `ST-${String(students.length + 1).padStart(6, '0')}`;
    const selectedPkgObj = packages.find(p => p.id === regPackageId || p.name === regPackage || p.title === regPackage);
    const matchHours = regPackage.match(/(\d+)\s*(?:hours|hour|h|ساعة|uur)/i);
    const parsedPkgHours = selectedPkgObj?.hours !== undefined 
      ? Number(selectedPkgObj.hours) 
      : (matchHours ? parseInt(matchHours[1], 10) : 0);
    const parsedPkgPrice = selectedPkgObj?.price !== undefined ? Number(selectedPkgObj.price) : 0;
    const resolvedPkgName = selectedPkgObj?.name || selectedPkgObj?.title || regPackage;

    // Register details dynamically
    const newStudent = {
      id: studentId,
      studentId: studentId,
      packageId: selectedPkgObj?.id || regPackageId,
      name: regName.trim(),
      email: regEmail.trim(),
      phone: regPhone.trim(),
      role: 'student' as const,
      lang: lang,
      packageName: resolvedPkgName,
      packageSelection: resolvedPkgName,
      currentPackage: resolvedPkgName,
      packageHours: parsedPkgHours,
      targetHours: parsedPkgHours,
      packagePrice: parsedPkgPrice,
      dob: regDob,
      city: regCity,
      priorExperience: regExperience,
      transmissionType: regTransmission,
      theoryExamStatus: regTheoryStatus,
      notificationsEnabled: true
    };

    // Add Student Record to list with securely hashed password
    // REGISTRATION != PAYMENT: Starting wallet balance is €0.00 until payment is confirmed
    const newRecord: StudentRecord = {
      id: studentId,
      studentId: studentId,
      packageId: selectedPkgObj?.id || regPackageId,
      name: regName.trim(),
      email: regEmail.trim(),
      phone: regPhone.trim(),
      dob: regDob,
      city: regCity,
      packageName: resolvedPkgName,
      currentPackage: resolvedPkgName,
      packageSelection: resolvedPkgName,
      packageHours: parsedPkgHours,
      targetHours: parsedPkgHours,
      packagePrice: parsedPkgPrice,
      balance: 0,
      readiness: 0,
      joinedDate: new Date().toISOString().split('T')[0],
      status: "active",
      theoryExamStatus: regTheoryStatus,
      notificationsEnabled: true
    };
    setStudents(prev => [...prev, newRecord]);

    // Clear password fields from memory
    setRegPassword('');
    setRegConfirmPassword('');

    // Show dynamic success banner
    const successText = lang === 'ar' 
      ? `أهلاً بك ${regName}! تم إنشاء حسابك بنجاح في ${getSchoolName(schoolSettings)}. الباقة المحددة: ${regPackage}.` 
      : lang === 'nl' 
      ? `Welkom ${regName}! Je account is succesvol aangemaakt bij ${getSchoolName(schoolSettings)}. Geselecteerd pakket: ${regPackage}.` 
      : `Welcome ${regName}! Your account was created successfully at ${getSchoolName(schoolSettings)}. Selected package: ${regPackage}.`;
    
    setRegSuccessMessage(successText);
    
    // Auto login after 3 seconds
    setTimeout(() => {
      setCurrentUser(newStudent);
      setRegSuccessMessage('');
      setActiveTab('home');
    }, 4500);
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = forgotPasswordEmail.trim().toLowerCase();
    
    // Check for correct format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setForgotPasswordStatus('error');
      setForgotPasswordMessage(FORGOT_PASSWORD_T[lang].errInvalidFormat);
      return;
    }

    // Check offline mode
    if (isOffline || !navigator.onLine) {
      setForgotPasswordStatus('error');
      setForgotPasswordMessage(FORGOT_PASSWORD_T[lang].errOffline);
      return;
    }

    // Check account existence
    const matchedStudent = students.find(s => s.email?.toLowerCase() === cleanEmail);
    const trainerEmailSetting = schoolSettings?.email?.toLowerCase() || 'trainer@drivingschool.nl';
    const isTrainerEmail = cleanEmail === trainerEmailSetting || cleanEmail === 'samir@al-andalos.nl';
    
    if (!matchedStudent && !isTrainerEmail) {
      setForgotPasswordStatus('error');
      setForgotPasswordMessage(FORGOT_PASSWORD_T[lang].errNotFound);
      return;
    }

    setForgotPasswordStatus('submitting');

    try {
      const config = getSheetsConfig();
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          lang: lang,
          spreadsheetId: config.spreadsheetId,
          accessToken: config.accessToken
        })
      });

      const result = await response.json();
      if (result.success) {
        setForgotPasswordStatus('success');
      } else {
        throw new Error(result.error || "API call failed");
      }
    } catch (err) {
      console.error("Forgot password flow error:", err);
      setForgotPasswordStatus('error');
      setForgotPasswordMessage(FORGOT_PASSWORD_T[lang].errSendFailed);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetErrorMsg('');

    if (!resetNewPassword || resetNewPassword.length < 6) {
      setResetErrorMsg(
        lang === 'ar' 
          ? 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.' 
          : lang === 'nl' 
          ? 'Wachtwoord moet minimaal 6 tekens bevatten.' 
          : 'Password must be at least 6 characters.'
      );
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetErrorMsg(
        lang === 'ar' 
          ? 'كلمات المرور غير متطابقة.' 
          : lang === 'nl' 
          ? 'Wachtwoorden komen niet overeen.' 
          : 'Passwords do not match.'
      );
      return;
    }

    setResetPasswordStatus('submitting');

    try {
      const config = getSheetsConfig();
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmailFromUrl,
          token: resetTokenFromUrl,
          newPassword: resetNewPassword,
          spreadsheetId: config.spreadsheetId,
          accessToken: config.accessToken
        })
      });

      const result = await response.json();
      if (result.success && result.hashedPassword) {
        // Record Audit Log for Password Reset
        const matchedStudent = students.find(s => s.email?.toLowerCase() === resetEmailFromUrl?.toLowerCase());
        
        let logUserId = 'N/A';
        let logUserName = resetEmailFromUrl || 'Unknown User';
        let logUserRole = 'Student';

        if (matchedStudent) {
          logUserId = matchedStudent.id || 'N/A';
          logUserName = matchedStudent.name || matchedStudent.email || 'N/A';
          logUserRole = 'Student';
        } else {
          const isTrainer = resetEmailFromUrl?.toLowerCase() === 'samir@al-andalos.nl' || (schoolSettings?.email && schoolSettings.email.toLowerCase() === resetEmailFromUrl?.toLowerCase());
          if (isTrainer) {
            logUserId = 'trainer-samir';
            logUserName = schoolSettings?.instructorName || 'Instructeur Samir';
            logUserRole = 'Trainer';
          } else {
            logUserId = 'unknown';
            logUserName = resetEmailFromUrl || 'Unknown';
            logUserRole = 'Student';
          }
        }

        const ipAddress = await fetchClientIpAddress();
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0];
        const timeZoneStr = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
        const auditId = 'AUD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();

        const auditEntry: AuditLogEntry = {
          auditId: auditId,
          userId: logUserId,
          userName: logUserName,
          userRole: logUserRole,
          action: 'Password Changed',
          changedBy: 'Self',
          date: dateStr,
          time: timeStr,
          timeZone: timeZoneStr,
          ipAddress,
          deviceBrowser: navigator.userAgent || 'Unknown'
        };

        if (config.spreadsheetId && config.accessToken) {
          try {
            await writeAuditLogToGoogleSheet(config, auditEntry);
          } catch (auditErr) {
            console.error("Failed to write password reset audit log to sheets:", auditErr);
          }
        }

        // Update local React state for students with the hashed password returned by server
        setStudents(prevStudents => {
          const updated = prevStudents.map(student => {
            if (student.email?.toLowerCase() === resetEmailFromUrl?.toLowerCase()) {
              return { ...student, password: result.hashedPassword };
            }
            return student;
          });
          return updated;
        });

        setResetPasswordStatus('success');
        setResetNewPassword('');
        setResetConfirmPassword('');
      } else {
        throw new Error(result.error || 'Reset failed');
      }
    } catch (err) {
      console.error('Password reset submit error:', err);
      setResetPasswordStatus('valid');
      setResetErrorMsg(
        lang === 'ar' 
          ? 'فشل إعادة تعيين كلمة المرور. قد يكون الرابط قد انتهى أو تم استخدامه بالفعل.' 
          : lang === 'nl' 
          ? 'Wachtwoord reset mislukt. De link is mogelijk verlopen of al gebruikt.' 
          : 'Password reset failed. The link may have expired or already been used.'
      );
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginEmail('');
    setLoginPassword('');
    setActiveTab('home');
    try {
      sessionStorage.removeItem('drivingschool_user');
      sessionStorage.removeItem('al_andalos_user');
    } catch (e) {
      console.warn("Error clearing session storage", e);
    }
  };

  // Auth translation dict helpers
  const authLabels = {
    ar: {
      title: "تسجيل الدخول",
      desc: `${getSchoolName(schoolSettings)} - تدريب احترافي لقيادة السيارات وتجهيز شامل لاختبارات القيادة`,
      roleSelect: "اختر نوع الحساب",
      loginTab: "تسجيل الدخول",
      registerTab: "تسجيل طالب جديد",
      fullName: "الاسم الكامل",
      email: "البريد الإلكتروني الرئيسي",
      phone: "رقم الجوال",
      dob: "تاريخ الميلاد لتحديد الأحقية",
      city: "مكان الإقامة والبلدية",
      pakket: "باقة التدريب المفضلة",
      pastExp: "الخبرة السابقة في القيادة",
      expNone: "مبتدئ بالكامل (بدون أي خبرة)",
      expSome: "لدي بعض المبادئ الأساسية",
      expExp: "لدي رخصة أجنبية أو خبرة متوسطة",
      acceptTerms: `أوافق على الشروط والأحكام وسياسة الخصوصية الخاصة بـ ${getSchoolName(schoolSettings)}`,
      submitReg: "إنشاء حساب",
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
      automatic: "أوتوماتيك",
      placeholderName: "الاسم الكامل الخاص بك",
      placeholderEmail: "name@drivingschool.nl",
      placeholderPhone: "+31 6 1234 5678",
      placeholderCity: "ماستريخت",
      placeholderPassword: "أدخل كلمة المرور الخاصة بك"
    },
    nl: {
      title: "Inloggen",
      desc: `${getSchoolName(schoolSettings)} - Professionele rijopleiding met AI-begeleiding.`,
      roleSelect: "Selecteer Rol",
      loginTab: "Inloggen",
      registerTab: "Nieuwe leerling registreren",
      fullName: "Volledige Naam",
      email: "E-mailadres",
      phone: "Telefoonnummer",
      dob: "Geboortedatum (Leeftijdscontrole)",
      city: "Woonplaats",
      pakket: "Selecteer lespakket",
      pastExp: "Eerdere rijervaring",
      expNone: "Geen ervaring (Beginner)",
      expSome: "Enige ervaring (Koppeling & Sturen)",
      expExp: "Buitenlands rijbewijs / Gevorderd",
      acceptTerms: `Ik ga akkoord met de algemene voorwaarden van ${getSchoolShortName(schoolSettings)}`,
      submitReg: "Account aanmaken",
      demoTitle: "Demo Quick Inlog Portaal",
      demoStudent: "Inloggen als Amir (Leerling)",
      demoTrainer: "Inloggen als Samir (Instructeur)",
      logout: "Uitloggen",
      welcomeUser: "Welkom,",
      ageCheck: "Leeftijdsindicator",
      ageEligible: "Leeftijd is uitstekend! Je kunt direct op voor het praktijkexamen.",
      ageUnder: "Let op: onder de 16.5 jaar mag je alleen theorie studeren.",
      activePackage: "Actief Pakket",
      transType: "Transmissie type",
      manual: "Handgeschakeld (Manual)",
      automatic: "Automaat (Automatic)",
      placeholderName: "Je volledige naam",
      placeholderEmail: "naam@drivingschool.nl",
      placeholderPhone: "+31 6 1234 5678",
      placeholderCity: "Maastricht",
      placeholderPassword: "Voer je wachtwoord in"
    },
    en: {
      title: `${getSchoolName(schoolSettings)} Portal`,
      desc: "Apple-inspired driver education suite with real-time route replays.",
      roleSelect: "Account Role",
      loginTab: "Sign In",
      registerTab: "Register Now",
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
      acceptTerms: `I accept the conditions of training of ${getSchoolName(schoolSettings)}`,
      submitReg: "Create Account",
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
      automatic: "Automatic",
      placeholderName: "Your full name",
      placeholderEmail: "name@drivingschool.nl",
      placeholderPhone: "+31 6 1234 5678",
      placeholderCity: "Maastricht",
      placeholderPassword: "Enter your password"
    }
  }[lang];

  const lessonHourlyRate = schoolSettings?.lessonPricePerHour || schedule?.lessonPricePerHour || 65;

  const areNotificationsEnabled = currentUser?.role === 'student'
    ? (currentUser?.notificationsEnabled !== false)
    : (currentUser?.role === 'trainer' ? (schoolSettings?.notificationsEnabled !== false) : true);

  return (
    <ThemeProvider schoolSettings={schoolSettings}>
      <div id="app" className={`min-h-screen font-sans antialiased text-slate-800 dark:text-zinc-100 transition-colors duration-300 bg-slate-50/50 dark:bg-black pb-28 overflow-x-hidden w-full max-w-full`}>
      
      {/* Dynamic Push Toast Notification Banner overlay top-right */}
      {areNotificationsEnabled && (
        <div id="push-toast-box" className="fixed top-20 right-4 z-50 space-y-2 max-w-sm w-full font-sans">
          {notificationsAlerts.map((note, idx) => (
            <div key={idx} className="p-4 bg-linear-to-r from-blue-900 to-indigo-950 text-white rounded-2xl shadow-2xl border border-indigo-500/30 flex items-start gap-3 animate-[slideIn_0.3s_ease-out]">
              <PhosphorBell size={20} weight="regular" className="text-blue-400 mt-0.5 shrink-0 animate-bounce" />
              <div className="flex-1 text-xs font-semibold leading-relaxed">
                <p className="font-bold text-white text-xs mb-0.5">
                  {lang === 'ar' ? 'تذكير' : lang === 'nl' ? 'Lesherinnering' : 'Lesson Alert'}
                </p>
                <p className="whitespace-pre-line">{note}</p>
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
      )}

      {/* Top Main Shell Header Component */}
      {currentUser && (
        <Header
          lang={lang}
          setLang={setLang}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          currentUser={currentUser}
          role={role}
          schoolSettings={schoolSettings}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          handleLogout={handleLogout}
          unreadNotificationsCount={unreadNotificationsCount}
        />
      )}



      {/* Main Core View Area */}
      <main className={`max-w-7xl mx-auto px-3 sm:px-6 py-6 ${currentUser && role === 'student' ? 'pb-28 sm:pb-32' : 'pb-12'}`}>
        
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
                  <p className="text-[10px] text-amber-200 font-mono mt-1 animate-pulse">{lang === 'ar' ? 'جاري تحويلك الآن لتجربة لوحة التحكم الفاخرة...' : lang === 'nl' ? 'U wordt nu direct doorverwezen naar uw dashboard...' : 'Redirecting you to your dashboard now...'}</p>
                </div>
              </div>
            )}

            {resetTokenFromUrl ? (
              <div className="max-w-md mx-auto bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-slate-100 dark:border-zinc-800 shadow-2xl space-y-6">
                <div className="text-center space-y-2">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <KeyRound className="h-7 w-7" />
                  </div>
                  <h2 className="text-xl font-black tracking-tight text-slate-800 dark:text-white">
                    {RESET_PAGE_T[lang].title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {RESET_PAGE_T[lang].subtitle}
                  </p>
                </div>

                {resetPasswordStatus === 'verifying' ? (
                  <div className="text-center py-8 space-y-3">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-bold">
                      {RESET_PAGE_T[lang].verifying}
                    </p>
                  </div>
                ) : resetPasswordStatus === 'invalid' ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-2xl flex items-center gap-2.5">
                      <AlertTriangle className="h-5 w-5 shrink-0" />
                      <span>{resetErrorMsg}</span>
                    </div>
                    <button
                      onClick={() => {
                        window.history.replaceState({}, document.title, window.location.pathname);
                        setResetTokenFromUrl(null);
                        setResetEmailFromUrl(null);
                      }}
                      className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-white text-xs font-bold rounded-2xl transition cursor-pointer"
                    >
                      {RESET_PAGE_T[lang].btnBack}
                    </button>
                  </div>
                ) : resetPasswordStatus === 'success' ? (
                  <div className="text-center py-6 space-y-5">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                      <Check className="h-7 w-7" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">
                        {RESET_PAGE_T[lang].successTitle}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                        {RESET_PAGE_T[lang].successDesc}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        window.history.replaceState({}, document.title, window.location.pathname);
                        setResetTokenFromUrl(null);
                        setResetEmailFromUrl(null);
                        setResetPasswordStatus('idle');
                      }}
                      className="w-full py-3 bg-linear-to-r from-blue-600 to-indigo-700 text-white text-xs font-bold rounded-2xl transition shadow-lg shadow-blue-500/20 cursor-pointer"
                    >
                      {RESET_PAGE_T[lang].btnBack}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                    <div>
                      <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 block mb-1.5">
                        {RESET_PAGE_T[lang].newPassword}
                      </label>
                      <input
                        type="password"
                        required
                        placeholder={RESET_PAGE_T[lang].placeholderNew}
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        className="w-full h-8 px-3 py-1 text-xs font-semibold bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 block mb-1.5">
                        {RESET_PAGE_T[lang].confirmPassword}
                      </label>
                      <input
                        type="password"
                        required
                        placeholder={RESET_PAGE_T[lang].placeholderConfirm}
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                        className="w-full h-8 px-3 py-1 text-xs font-semibold bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>

                    {resetErrorMsg && (
                      <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>{resetErrorMsg}</span>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          window.history.replaceState({}, document.title, window.location.pathname);
                          setResetTokenFromUrl(null);
                          setResetEmailFromUrl(null);
                        }}
                        className="flex-1 py-3 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-600 dark:text-zinc-300 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        {FORGOT_PASSWORD_T[lang].btnCancel}
                      </button>
                      <button
                        type="submit"
                        disabled={resetPasswordStatus === 'submitting'}
                        className="flex-1 py-3 bg-linear-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition shadow-lg shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-2"
                      >
                        {resetPasswordStatus === 'submitting' ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>{RESET_PAGE_T[lang].btnSubmitting}</span>
                          </>
                        ) : (
                          <span>{RESET_PAGE_T[lang].btnSubmit}</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <LoginScreen 
                lang={lang}
                setLang={setLang}
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                t={t}
                authLabels={authLabels}
                schoolSettings={schoolSettings}
                authTab={authTab}
                setAuthTab={setAuthTab}
                loginRole={loginRole}
                setLoginRole={setLoginRole}
                loginEmail={loginEmail}
                setLoginEmail={setLoginEmail}
                loginPassword={loginPassword}
                setLoginPassword={setLoginPassword}
                handleManualLogin={handleManualLogin}
                handleDemoLogin={handleDemoLogin}
                handleRegisterSubmit={handleRegisterSubmit}
                regName={regName}
                setRegName={setRegName}
                regEmail={regEmail}
                setRegEmail={setRegEmail}
                regPhone={regPhone}
                setRegPhone={setRegPhone}
                regDob={regDob}
                setRegDob={setRegDob}
                regCity={regCity}
                setRegCity={setRegCity}
                regPassword={regPassword}
                setRegPassword={setRegPassword}
                regConfirmPassword={regConfirmPassword}
                setRegConfirmPassword={setRegConfirmPassword}
                regAge={regAge}
                regPackageId={regPackageId}
                setRegPackageId={setRegPackageId}
                setRegPackage={setRegPackage}
                packages={packages}
                lessonHourlyRate={lessonHourlyRate}
                regExperience={regExperience}
                setRegExperience={setRegExperience}
                regTransmission={regTransmission}
                setRegTransmission={setRegTransmission}
                regTheoryStatus={regTheoryStatus}
                setRegTheoryStatus={setRegTheoryStatus}
                regCheckedTerms={regCheckedTerms}
                setRegCheckedTerms={setRegCheckedTerms}
                setIsForgotPasswordOpen={setIsForgotPasswordOpen}
                setForgotPasswordEmail={setForgotPasswordEmail}
                setForgotPasswordStatus={setForgotPasswordStatus}
                setForgotPasswordMessage={setForgotPasswordMessage}
                getSchoolName={getSchoolName}
                getSchoolShortName={getSchoolShortName}
                PackageCard={PackageCard}
              />
            )}

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
                    badges={badges}
                    setActiveTab={setActiveTab}
                    setLearningActiveSubTab={setLearningActiveSubTab}
                    isOffline={isOffline}
                    selectedReplayLessonId={selectedReplayLessonId}
                    setSelectedReplayLessonId={setSelectedReplayLessonId}
                    currentUser={currentUser}
                    schoolSettings={schoolSettings}
                  />
                )}
                {activeTab === 'lessons' && (
                  <React.Suspense fallback={<LazyFallback />}>
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
                      currentUser={currentUser}
                      students={students}
                      setStudents={setStudents}
                      schedule={schedule}
                      schoolSettings={schoolSettings}
                    />
                  </React.Suspense>
                )}
                {activeTab === 'learning' && (
                  <React.Suspense fallback={<LazyFallback />}>
                    <StudentLearning 
                      lang={lang} 
                      t={t} 
                      mediaVideos={mediaVideos}
                      initialSubTab={learningActiveSubTab}
                      setInitialSubTab={setLearningActiveSubTab}
                      currentUser={currentUser}
                      setCurrentUser={setCurrentUser}
                      students={students}
                      setStudents={setStudents}
                      lessons={lessons}
                      transactions={transactions}
                      badges={badges}
                      schoolSettings={schoolSettings}
                    />
                  </React.Suspense>
                )}
                {activeTab === 'wallet' && (
                  <React.Suspense fallback={<LazyFallback />}>
                    <StudentWallet 
                      lang={lang} 
                      t={t} 
                      transactions={transactions} 
                      setTransactions={setTransactions}
                      currentUser={currentUser}
                      schoolSettings={schoolSettings}
                    />
                  </React.Suspense>
                )}
                {activeTab === 'profile' && (
                  <React.Suspense fallback={<LazyFallback />}>
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
                      setCurrentUser={setCurrentUser}
                      students={students}
                      setStudents={setStudents}
                      schoolSettings={schoolSettings}
                      transactions={transactions}
                      packages={packages}
                    />
                  </React.Suspense>
                )}
                {activeTab === 'packages' && (
                  <div className="space-y-6 pb-20">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200/60 dark:border-zinc-800 pb-4">
                      <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                          {lang === 'ar' ? 'باقات تدريب القيادة' : lang === 'nl' ? 'Rijlespakketten' : 'Driving Packages'}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                          {lang === 'ar' ? 'اختر الباقة المناسبة لاحتياجاتك وابدأ رحلتك في تعلم القيادة بثقة' : lang === 'nl' ? 'Kies het pakket dat bij je past en start je rijopleiding met vertrouwen' : 'Choose the ideal package for your goals and master driving with confidence'}
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab('home')}
                        className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-bold transition"
                      >
                        {lang === 'ar' ? '← العودة للرئيسية' : lang === 'nl' ? '← Terug naar Home' : '← Back to Home'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {packages
                        .filter(p => p.isActive)
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map(pkg => (
                          <PackageCard
                            key={pkg.id}
                            pkg={pkg}
                            lang={lang}
                            isNoPackage={pkg.id === 'no-package'}
                            hourlyRate={lessonHourlyRate}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {role === 'trainer' && (
              <div id="trainer-portal-host">
                <React.Suspense fallback={<LazyFallback />}>
                  <TrainerDashboard 
                    lang={lang} 
                    t={t} 
                    lessons={lessons} 
                    setLessons={setLessons}
                    transactions={transactions}
                    setTransactions={setTransactions}
                    schedule={schedule}
                    setSchedule={setSchedule}
                    assessments={assessments}
                    setAssessments={setAssessments}
                    packages={packages}
                    setPackages={setPackages}
                    students={students}
                    setStudents={setStudents}
                    mediaVideos={mediaVideos}
                    setMediaVideos={setMediaVideos}
                    schoolSettings={schoolSettings}
                    setSchoolSettings={setSchoolSettings}
                    currentUser={currentUser}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                  />
                </React.Suspense>
              </div>
            )}

          </div>
        )}

      </main>

      {/* Floating Modern Bottom Navigation Bar matching reference image */}
      {currentUser && role === 'student' && (
        <nav 
          id="student-bottom-nav"
          className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-md bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-800 px-3 py-2 rounded-full shadow-[0_6px_30px_rgba(0,0,0,0.08)] dark:shadow-none text-xs"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          <div className="flex justify-between items-center px-1">
            
            {/* Nav 1 (Far Right in RTL): Profile */}
            <button 
              id="nav-profile"
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 transition-all duration-200 cursor-pointer ${
                activeTab === 'profile' 
                  ? 'text-blue-600 dark:text-blue-400 font-bold' 
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-medium'
              }`}
            >
              <PhosphorUser size={20} weight="regular" />
              <span className="text-[10px]">
                {lang === 'ar' ? 'الملف الشخصي' : lang === 'nl' ? 'Profiel' : 'Profile'}
              </span>
            </button>

            {/* Nav 2: Lessons */}
            <button 
              id="nav-lessons"
              onClick={() => setActiveTab('lessons')}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 transition-all duration-200 cursor-pointer ${
                activeTab === 'lessons' 
                  ? 'text-blue-600 dark:text-blue-400 font-bold' 
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-medium'
              }`}
            >
              <CalendarBlank size={20} weight="regular" />
              <span className="text-[10px]">
                {lang === 'ar' ? 'الدروس' : lang === 'nl' ? 'Lessen' : 'Lessons'}
              </span>
            </button>

            {/* Nav 3: CENTER ACTIVE HOME BUTTON */}
            <button 
              id="nav-home-center"
              onClick={() => setActiveTab('home')}
              className="flex flex-col items-center gap-1 py-0.5 px-2.5 cursor-pointer group"
              title="Main Dashboard"
            >
              <div className={`w-10 h-10 rounded-full text-white shadow-md flex items-center justify-center group-hover:scale-105 transition-all duration-200 ${
                activeTab === 'home'
                  ? 'bg-blue-600 shadow-blue-600/35 ring-4 ring-blue-500/15'
                  : 'bg-slate-800 dark:bg-zinc-700 shadow-slate-900/20'
              }`}>
                <House size={20} weight="regular" />
              </div>
              <span className={`text-[10px] ${
                activeTab === 'home'
                  ? 'font-extrabold text-blue-600 dark:text-blue-400'
                  : 'font-semibold text-slate-500 dark:text-zinc-400'
              }`}>
                {lang === 'ar' ? 'الرئيسية' : lang === 'nl' ? 'Home' : 'Home'}
              </span>
            </button>

            {/* Nav 4: Notifications (Direct shortcut to Profile -> Notifications) */}
            <button 
              id="nav-notifications"
              onClick={() => {
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
              }}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 transition-all duration-200 cursor-pointer relative ${
                activeTab === 'profile' 
                  ? 'text-blue-600 dark:text-blue-400 font-bold' 
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-medium'
              }`}
            >
              <PhosphorBell size={20} weight={unreadNotificationsCount > 0 ? 'fill' : 'regular'} />
              <span className="text-[10px]">
                {lang === 'ar' ? 'الإشعارات' : lang === 'nl' ? 'Meldingen' : 'Alerts'}
              </span>
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-2.5 h-2 w-2 rounded-full bg-blue-500"></span>
              )}
            </button>

            {/* Nav 5 (Far Left in RTL): More / Learning */}
            <button 
              id="nav-more"
              onClick={() => setActiveTab('learning')}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 transition-all duration-200 cursor-pointer ${
                activeTab === 'learning' 
                  ? 'text-blue-600 dark:text-blue-400 font-bold' 
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-medium'
              }`}
            >
              <SquaresFour size={20} weight="regular" />
              <span className="text-[10px]">
                {lang === 'ar' ? 'المزيد' : lang === 'nl' ? 'Meer' : 'More'}
              </span>
            </button>

          </div>
        </nav>
      )}

      {/* Global premium alert toast override */}
      {globalAlert.visible && (
        <div className="fixed bottom-24 md:bottom-8 right-6 z-50 max-w-sm w-[calc(100vw-3rem)] p-4 bg-zinc-950/95 dark:bg-white/95 text-zinc-100 dark:text-zinc-900 border border-zinc-800 dark:border-zinc-200 rounded-2xl shadow-2xl backdrop-blur-md flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold font-sans tracking-tight">
              {lang === 'ar' ? 'تنبيه النظام' : lang === 'nl' ? 'Systeemmelding' : 'System Notification'}
            </p>
            <p className="text-xs font-semibold opacity-90 mt-1 leading-relaxed break-words whitespace-pre-line">
              {globalAlert.message}
            </p>
          </div>
          <button 
            onClick={() => setGlobalAlert(prev => ({ ...prev, visible: false }))}
            className="text-zinc-450 hover:text-white dark:hover:text-zinc-900 transition font-black text-sm p-1 cursor-pointer select-none"
          >
            ✕
          </button>
        </div>
      )}

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md p-6 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl shadow-2xl space-y-4 animate-in zoom-in-95 duration-250">
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg">
                  <KeyRound className="h-4 w-4" />
                </span>
                {FORGOT_PASSWORD_T[lang].title}
              </h3>
              <button 
                onClick={() => setIsForgotPasswordOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content states */}
            {forgotPasswordStatus === 'success' ? (
              <div className="text-center py-6 space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <Check className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">
                    {FORGOT_PASSWORD_T[lang].successTitle}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
                    {FORGOT_PASSWORD_T[lang].successDesc(forgotPasswordEmail)}
                  </p>
                </div>
                <button
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {FORGOT_PASSWORD_T[lang].btnClose}
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                  {FORGOT_PASSWORD_T[lang].desc}
                </p>

                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 block mb-1.5">
                    {FORGOT_PASSWORD_T[lang].emailLabel}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder={FORGOT_PASSWORD_T[lang].placeholder}
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="w-full h-8 px-3 py-1 text-xs font-semibold bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                {forgotPasswordStatus === 'error' && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{forgotPasswordMessage}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(false)}
                    className="flex-1 py-3 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-600 dark:text-zinc-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {FORGOT_PASSWORD_T[lang].btnCancel}
                  </button>
                  <button
                    type="submit"
                    disabled={forgotPasswordStatus === 'submitting'}
                    className="flex-1 py-3 bg-linear-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition shadow-lg shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {forgotPasswordStatus === 'submitting' ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>{FORGOT_PASSWORD_T[lang].btnSending}</span>
                      </>
                    ) : (
                      <span>{FORGOT_PASSWORD_T[lang].btnSend}</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Full Application Admin Control Center Modal (Google Sheets Central Authority) */}
      {showAdminControlCenter && (
        <AdminControlCenterModal
          isOpen={showAdminControlCenter}
          onClose={() => setShowAdminControlCenter(false)}
          defaultLang={lang === 'ar' ? 'ar' : lang === 'nl' ? 'nl' : 'en'}
          spreadsheetId={getSheetsConfig().spreadsheetId || '1nKF40i125QY7MQMghOoOnyqjpHLFWKM12ZYIIGxW9Ck'}
          students={students}
          setStudents={setStudents}
          lessons={lessons}
          setLessons={setLessons}
          packages={packages}
          setPackages={setPackages}
          schoolSettings={schoolSettings}
          setSchoolSettings={setSchoolSettings}
        />
      )}

      </div>
    </ThemeProvider>
  );
}
