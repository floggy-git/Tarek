import React, { useState, useEffect } from 'react';
import { 
  User, Shield, Bell, Moon, Sun, Award, Flame, CheckCircle, 
  Map, KeyRound, AlertCircle, Compass, CheckCircle2,
  FileText, CalendarX, CalendarCheck, Clock, Inbox, MessageSquare, ChevronDown,
  CreditCard, Package as PackageIcon, Check, Info
} from 'lucide-react';
import bcrypt from 'bcryptjs';
import { getSheetsConfig, writeStudentsToGoogleSheet, writeAuditLogToGoogleSheet, fetchClientIpAddress } from '../utils/googleSheets';
import { TRANSLATIONS, Language, AchievementBadge, Lesson, StudentRecord, AuditLogEntry, SchoolSettings, getSchoolName, WalletTransaction, DrivePackage } from '../types';
import { getStudentPhoto, saveStudentPhoto, getStudentInitials, deleteStudentPhoto, compressImage, getTrainerPhoto } from '../utils/studentPhoto';
import { getPersistentStudentHistory, markAllNotificationsAsRead, AppNotification } from '../utils/notificationStore';
import { isRecordForStudent } from '../utils/identity';

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
  students?: StudentRecord[];
  setStudents?: React.Dispatch<React.SetStateAction<StudentRecord[]>>;
  schoolSettings?: Partial<SchoolSettings> | null;
  transactions?: WalletTransaction[];
  packages?: DrivePackage[];
}

function StudentProfileComponent({ 
  lang, setLang, t, darkMode, setDarkMode, lessons, badges, setBadges, currentUser, setCurrentUser, students, setStudents, schoolSettings, transactions = [], packages = [] 
}: StudentProfileProps) {
  
  // Custom interactive personal info state
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [photo, setPhoto] = useState<string | null>(() => getStudentPhoto(currentUser?.email || currentUser?.name || ""));

  const [persistentNotifications, setPersistentNotifications] = useState<AppNotification[]>(() => 
    getPersistentStudentHistory(currentUser?.email, currentUser?.name, currentUser?.studentId || currentUser?.id)
  );

  const [expandedNotifs, setExpandedNotifs] = useState<Record<string, boolean>>({});

  const toggleNotifExpand = (id: string) => {
    setExpandedNotifs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Mark all unread notifications for this student as read when viewing Profile Notifications
  useEffect(() => {
    if (currentUser) {
      markAllNotificationsAsRead(
        currentUser.role || 'student',
        currentUser.email,
        currentUser.name,
        currentUser.studentId || currentUser.id
      );
    }
  }, [currentUser]);

  useEffect(() => {
    const handleUpdate = () => {
      setPersistentNotifications(getPersistentStudentHistory(currentUser?.email, currentUser?.name, currentUser?.studentId || currentUser?.id));
    };
    window.addEventListener('appNotificationsUpdated', handleUpdate);
    return () => {
      window.removeEventListener('appNotificationsUpdated', handleUpdate);
    };
  }, [currentUser]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        compressImage(base64String, (compressed) => {
          setPhoto(compressed);
          const photoKey = currentUser?.email || currentUser?.name || name;
          saveStudentPhoto(photoKey, compressed);
          if (setCurrentUser && currentUser) {
            setCurrentUser({
              ...currentUser,
              profilePhoto: compressed
            });
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    const photoKey = currentUser?.email || currentUser?.name || name;
    deleteStudentPhoto(photoKey);
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
    
    const photoKey = email || currentUser?.email || currentUser?.name || name;
    if (photo) {
      saveStudentPhoto(photoKey, photo);
    } else {
      deleteStudentPhoto(photoKey);
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
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [pushEnabled, setPushEnabled] = useState<boolean>(() => {
    const studentRec = students?.find(s => s.email?.toLowerCase() === currentUser?.email?.toLowerCase() || s.name?.toLowerCase() === currentUser?.name?.toLowerCase());
    return studentRec ? studentRec.notificationsEnabled !== false : (currentUser?.notificationsEnabled !== false);
  });

  // Keep in sync with students array updates from sheets
  React.useEffect(() => {
    const studentRec = students?.find(s => s.email?.toLowerCase() === currentUser?.email?.toLowerCase() || s.name?.toLowerCase() === currentUser?.name?.toLowerCase());
    if (studentRec && studentRec.notificationsEnabled !== undefined) {
      setPushEnabled(studentRec.notificationsEnabled);
    }
  }, [students, currentUser]);

  const handleToggleNotifications = () => {
    const newVal = !pushEnabled;
    setPushEnabled(newVal);

    if (setStudents) {
      setStudents(prev => prev.map(s => {
        if (s.email?.toLowerCase() === currentUser?.email?.toLowerCase() || s.name?.toLowerCase() === currentUser?.name?.toLowerCase()) {
          return { ...s, notificationsEnabled: newVal };
        }
        return s;
      }));
    }

    if (setCurrentUser && currentUser) {
      setCurrentUser({
        ...currentUser,
        notificationsEnabled: newVal
      });
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPassSuccess(false);

    if (!oldPassword || !newPassword) {
      setPasswordError(
        lang === 'ar' 
          ? 'يرجى ملء جميع الحقول المطلوبة.' 
          : lang === 'nl' 
          ? 'Vul a.u.b. alle verplichte velden in.' 
          : 'Please fill in all required fields.'
      );
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(
        lang === 'ar' 
          ? 'يجب أن تتكون كلمة المرور الجديدة من 6 أحرف على الأقل.' 
          : lang === 'nl' 
          ? 'Het nieuwe wachtwoord moet minimaal 6 tekens lang zijn.' 
          : 'The new password must be at least 6 characters.'
      );
      return;
    }

    const currentStudentRec = students?.find(
      s => s.email?.toLowerCase() === currentUser?.email?.toLowerCase() || s.name?.toLowerCase() === currentUser?.name?.toLowerCase()
    );

    if (!currentStudentRec) {
      setPasswordError(
        lang === 'ar' 
          ? 'لم يتم العثور على سجل المستخدم.' 
          : lang === 'nl' 
          ? 'Gebruikersrecord niet gevonden.' 
          : 'User record not found.'
      );
      return;
    }

    // Verify current password
    const storedPassword = currentStudentRec.password || 'student123';
    let isPasswordCorrect = false;
    try {
      if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$')) {
        isPasswordCorrect = bcrypt.compareSync(oldPassword, storedPassword);
      } else {
        isPasswordCorrect = oldPassword === storedPassword;
      }
    } catch (err) {
      console.error("Password verification error:", err);
      isPasswordCorrect = oldPassword === storedPassword;
    }

    if (!isPasswordCorrect) {
      setPasswordError(
        lang === 'ar' 
          ? 'كلمة المرور الحالية غير صحيحة.' 
          : lang === 'nl' 
          ? 'Huidig wachtwoord is onjuist.' 
          : 'Current password is incorrect.'
      );
      return;
    }

    setIsSavingPassword(true);

    try {
      // Hash new password using bcrypt
      const newHashedPassword = bcrypt.hashSync(newPassword, 10);

      // Create updated students list
      const updatedStudents = (students || []).map(s => {
        if (s.email?.toLowerCase() === currentUser?.email?.toLowerCase() || s.name?.toLowerCase() === currentUser?.name?.toLowerCase()) {
          return { ...s, password: newHashedPassword };
        }
        return s;
      });

      const config = getSheetsConfig();
      if (config.spreadsheetId && config.accessToken) {
        try {
          const ipAddress = await fetchClientIpAddress();
          const now = new Date();
          const dateStr = now.toISOString().split('T')[0];
          const timeStr = now.toTimeString().split(' ')[0];
          const timeZoneStr = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
          const auditId = 'AUD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();

          const auditLogEntry: AuditLogEntry = {
            auditId: auditId,
            userId: currentStudentRec.id || 'N/A',
            userName: currentStudentRec.name || 'N/A',
            userRole: 'Student',
            action: 'Password Changed',
            changedBy: 'Self',
            date: dateStr,
            time: timeStr,
            timeZone: timeZoneStr,
            ipAddress: ipAddress,
            deviceBrowser: navigator.userAgent || 'Unknown'
          };

          await writeStudentsToGoogleSheet(config, updatedStudents);
          await writeAuditLogToGoogleSheet(config, auditLogEntry);
        } catch (e) {
          console.error("Background sync failed for password change:", e);
        }
      }

      if (setStudents) {
        setStudents(updatedStudents);
      }

      setPassSuccess(true);
      setOldPassword('');
      setNewPassword('');

      setTimeout(() => {
        setPassSuccess(false);
      }, 5000);

    } catch (err: any) {
      console.error("Failed to update password:", err);
      setPasswordError(
        lang === 'ar' 
          ? 'فشل تحديث كلمة المرور. يرجى المحاولة لاحقاً.' 
          : lang === 'nl' 
          ? 'Wachtwoord update mislukt. Probeer het later opnieuw.' 
          : `Password update failed. Please try again.`
      );
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Check name similarity or exact match
  const studentNamesMatch = React.useCallback((nameA?: string, nameB?: string) => {
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
  }, []);

  const myLessons = React.useMemo(() => {
    return lessons.filter(l => isRecordForStudent(l, currentUser));
  }, [lessons, currentUser]);

  // Authoritative package derivation
  const studentPkg = React.useMemo(() => {
    const rawPkgName = currentUser?.packageName || currentUser?.packageSelection || currentUser?.currentPackage || '';
    const matchedPkg = packages.find(p => p.id === currentUser?.packageId || p.name === rawPkgName);
    const matchHours = rawPkgName.match(/(\d+)\s*(?:hours|hour|h|ساعة|uur)/i);
    
    const totalHours = currentUser?.packageHours !== undefined && currentUser?.packageHours !== null
      ? Number(currentUser.packageHours)
      : (currentUser?.targetHours !== undefined && currentUser?.targetHours !== null
          ? Number(currentUser.targetHours)
          : (matchedPkg?.hours !== undefined 
              ? matchedPkg.hours 
              : (matchHours ? parseInt(matchHours[1], 10) : 0)));

    const price = currentUser?.packagePrice !== undefined && currentUser?.packagePrice !== null
      ? Number(currentUser.packagePrice)
      : (matchedPkg?.price !== undefined ? matchedPkg.price : 0);

    const name = matchedPkg?.name || rawPkgName || (lang === 'ar' ? 'بلا باقة' : lang === 'nl' ? 'Geen Pakket' : 'No Package');

    return {
      id: currentUser?.packageId || matchedPkg?.id,
      name,
      totalHours,
      price
    };
  }, [currentUser, packages, lang]);

  // Driving stats calculation
  const completedCount = React.useMemo(() => {
    return myLessons.filter(l => l.status === 'completed').length;
  }, [myLessons]);

  const totalCompletedHours = React.useMemo(() => {
    return myLessons
      .filter(l => l.status === 'completed')
      .reduce((sum, curr) => sum + (Number(curr.duration) || 1), 0);
  }, [myLessons]);

  const remainingHours = React.useMemo(() => {
    return Math.max(0, studentPkg.totalHours - totalCompletedHours);
  }, [studentPkg.totalHours, totalCompletedHours]);

  // Financial transactions and payment calculation
  const myTransactions = React.useMemo(() => {
    return transactions.filter(tx => isRecordForStudent(tx, currentUser));
  }, [transactions, currentUser]);

  const totalPaid = React.useMemo(() => {
    return myTransactions
      .filter(tx => tx.type === 'deposit')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [myTransactions]);

  const remainingPayment = React.useMemo(() => {
    return Math.max(0, studentPkg.price - totalPaid);
  }, [studentPkg.price, totalPaid]);

  const paymentStatus = React.useMemo(() => {
    if (!studentPkg.price || studentPkg.price === 0) return 'none';
    if (totalPaid <= 0) return 'unpaid';
    if (totalPaid >= studentPkg.price) return 'paid';
    return 'partial';
  }, [studentPkg.price, totalPaid]);

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
        <p className="text-xs text-slate-400 mt-0.5">{lang === 'ar' ? 'الملف الشخصي وإعدادات الحساب' : lang === 'nl' ? 'Persoonlijk profiel & accountinstellingen' : 'Personal profile & account settings'}</p>
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
                {lang === 'ar' ? 'فئة B' : lang === 'nl' ? 'Categorie B' : 'Category B'}
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
              {(() => {
                const sName = getSchoolName(schoolSettings);
                const sCity = schoolSettings?.city || 'Maastricht';
                return (
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                    {t.student} • {sName} ({sCity})
                  </p>
                );
              })()}
              
              {/* Transmission Type, Package and Payment Status Badges */}
              <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
                {currentUser?.transmissionType && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-xs">
                    <span role="img" aria-label="car">🚗</span>
                    <span>
                      {currentUser.transmissionType === 'manual'
                        ? (lang === 'ar' ? 'يدوي' : lang === 'nl' ? 'Handgeschakeld' : 'Manual')
                        : (lang === 'ar' ? 'أوتوماتيك' : lang === 'nl' ? 'Automaat' : 'Automatic')}
                    </span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-xs">
                  <span>📦</span>
                  <span>{studentPkg.name}</span>
                </span>
                {studentPkg.price > 0 && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-xs ${
                    paymentStatus === 'paid'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : paymentStatus === 'partial'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                  }`}>
                    <span>{paymentStatus === 'paid' ? '🟢' : paymentStatus === 'partial' ? '🟡' : '🔴'}</span>
                    <span>
                      {paymentStatus === 'paid'
                        ? (lang === 'ar' ? 'مدفوعة بالكامل' : lang === 'nl' ? 'Volledig Betaald' : 'Fully Paid')
                        : paymentStatus === 'partial'
                        ? (lang === 'ar' ? 'مدفوعة جزئيًا' : lang === 'nl' ? 'Deels Betaald' : 'Partially Paid')
                        : (lang === 'ar' ? 'غير مدفوعة' : lang === 'nl' ? 'Niet Betaald' : 'Unpaid')}
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* Quick dashboard stats list */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs">
              <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 rounded-xl">
                <p className="text-[10px] text-slate-400 font-semibold">{lang === 'ar' ? 'الساعات المنجزة' : lang === 'nl' ? 'Voltooide uren' : 'Completed'}</p>
                <p className="text-sm sm:text-base font-black text-slate-800 dark:text-zinc-200 mt-0.5">{totalCompletedHours}h</p>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 rounded-xl">
                <p className="text-[10px] text-slate-400 font-semibold">{lang === 'ar' ? 'الساعات المتبقية' : lang === 'nl' ? 'Resterende uren' : 'Remaining'}</p>
                <p className="text-sm sm:text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">{remainingHours}h</p>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 rounded-xl">
                <p className="text-[10px] text-slate-400 font-semibold">{lang === 'ar' ? 'إجمالي الحزمة' : lang === 'nl' ? 'Totaal pakket' : 'Total Package'}</p>
                <p className="text-sm sm:text-base font-black text-slate-800 dark:text-zinc-200 mt-0.5">{studentPkg.totalHours}h</p>
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

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 block mb-1.5">{lang === 'ar' ? 'الاسم الكامل' : lang === 'nl' ? 'Volledige Naam' : 'Full Name'}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-8 px-3 py-1 text-xs font-semibold bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 block mb-1.5">{lang === 'ar' ? 'البريد الإلكتروني' : lang === 'nl' ? 'E-mailadres' : 'Email Address'}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-8 px-3 py-1 text-xs font-semibold bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 block mb-1.5">{lang === 'ar' ? 'رقم الهاتف المحمول' : lang === 'nl' ? 'Mobiel Telefoonnummer' : 'Mobile Contact Phone'}</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-8 px-3 py-1 text-xs font-semibold bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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
          
          {/* Driving Package & Payment Status Overview Card */}
          <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-3xl shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                  <PackageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {lang === 'ar' ? 'تفاصيل باقة القيادة وحالة الدفع' : lang === 'nl' ? 'Lespakket & Betalingsstatus' : 'Driving Package & Payment Status'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {studentPkg.name}
                  </p>
                </div>
              </div>

              {/* Status Tag */}
              <div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-xs ${
                  paymentStatus === 'paid'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : paymentStatus === 'partial'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                }`}>
                  <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                  <span>
                    {paymentStatus === 'paid'
                      ? (lang === 'ar' ? 'مدفوعة بالكامل' : lang === 'nl' ? 'Volledig Betaald' : 'Fully Paid')
                      : paymentStatus === 'partial'
                      ? (lang === 'ar' ? 'مدفوعة جزئيًا' : lang === 'nl' ? 'Gedeeltelijk Betaald' : 'Partially Paid')
                      : (lang === 'ar' ? 'غير مدفوعة (Unpaid)' : lang === 'nl' ? 'Niet Betaald (Unpaid)' : 'Unpaid')}
                  </span>
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3.5 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800/60">
                <span className="text-[11px] font-bold text-slate-400 block">{lang === 'ar' ? 'إجمالي ساعات الباقة' : lang === 'nl' ? 'Totale Pakketuren' : 'Total Package Hours'}</span>
                <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1 block">{studentPkg.totalHours}h</span>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800/60">
                <span className="text-[11px] font-bold text-slate-400 block">{lang === 'ar' ? 'الساعات المتبقية' : lang === 'nl' ? 'Resterende Uren' : 'Remaining Hours'}</span>
                <span className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 mt-1 block">{remainingHours}h</span>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800/60">
                <span className="text-[11px] font-bold text-slate-400 block">{lang === 'ar' ? 'المبلغ الإجمالي للباقة' : lang === 'nl' ? 'Pakketprijs' : 'Package Price'}</span>
                <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1 block">€{studentPkg.price > 0 ? studentPkg.price.toFixed(2) : '0.00'}</span>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800/60">
                <span className="text-[11px] font-bold text-slate-400 block">{lang === 'ar' ? 'المبلغ المسدد' : lang === 'nl' ? 'Reeds Betaald' : 'Amount Paid'}</span>
                <span className={`text-lg sm:text-xl font-black mt-1 block ${totalPaid > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                  €{totalPaid.toFixed(2)}
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800/60 col-span-2 sm:col-span-1">
                <span className="text-[11px] font-bold text-slate-400 block">{lang === 'ar' ? 'المبلغ المتبقي' : lang === 'nl' ? 'Openstaand Bedrag' : 'Remaining Due'}</span>
                <span className={`text-lg sm:text-xl font-black mt-1 block ${remainingPayment > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  €{remainingPayment.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Informative Security/Payment Note */}
            {paymentStatus === 'unpaid' && (
              <div className="p-3 bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5 font-medium">
                  <p className="font-bold">
                    {lang === 'ar' ? 'ملاحظة حول سداد رسوم الباقة:' : lang === 'nl' ? 'Opmerking over pakketbetaling:' : 'Package Payment Note:'}
                  </p>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {lang === 'ar' 
                      ? 'تم تسجيل باقتك بنجاح. لا يتم خصم أو فرض أي دفعات تلقائية عند التسجيل. يتم سداد الرسوم مباشرة عبر إدارة مدرسة تعليم القيادة أو من خلال التحويل البنكي المعتمد.' 
                      : lang === 'nl' 
                      ? 'Je pakket is succesvol geregistreerd. Er worden geen automatische betalingen geïncasseerd bij registratie. Betaling geschiedt direct via de rijschooladministratie of bankoverschrijving.' 
                      : 'Your package is registered. No automatic payments are processed at registration. Payments are settled directly with the driving school administration or via bank transfer.'}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Quick Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Preferences / regional toggles */}
            <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-sm border-b border-slate-100 dark:border-zinc-800 pb-2">{lang === 'ar' ? 'الإعدادات' : lang === 'nl' ? 'Instellingen' : 'Settings'}</h3>

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
                  <span>{darkMode ? (lang === 'ar' ? 'نهاري' : lang === 'nl' ? 'Licht' : 'Light') : (lang === 'ar' ? 'ليلي' : lang === 'nl' ? 'Donker' : 'Dark')}</span>
                </button>
              </div>

              {/* Push notification toggle */}
              <div className="flex justify-between items-center py-2.5 border-t border-slate-100 dark:border-zinc-800 text-xs">
                <span className="font-bold text-slate-600 dark:text-zinc-350">{t.notifications}</span>
                <button
                  onClick={handleToggleNotifications}
                  className={`p-1 px-3 rounded-lg border flex items-center gap-1.5 font-bold cursor-pointer transition ${
                    pushEnabled
                      ? 'bg-blue-500/10 border-blue-500/20 text-blue-600'
                      : 'bg-slate-100 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-500'
                  }`}
                >
                  <Bell className="h-4 w-4" />
                  <span>{pushEnabled ? (lang === 'ar' ? 'نشط' : lang === 'nl' ? 'Actief' : 'Active') : (lang === 'ar' ? 'صامت' : lang === 'nl' ? 'Stil' : 'Silenced')}</span>
                </button>
              </div>
            </div>

            {/* Change password section */}
            <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-sm border-b border-slate-100 dark:border-zinc-800 pb-2 flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-blue-500" />
                {lang === 'ar' ? 'تغيير كلمة المرور' : lang === 'nl' ? 'Wachtwoord Wijzigen' : 'Change Password'}
              </h3>

              {passSuccess && (
                <p className="text-xs font-bold text-emerald-500 animate-pulse">
                  {lang === 'ar' ? 'تم تغيير كلمة المرور بنجاح!' : lang === 'nl' ? 'Wachtwoord succesvol gewijzigd!' : 'Password successfully changed!'}
                </p>
              )}

              {passwordError && (
                <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200/55 dark:border-red-500/20 text-red-600 rounded-xl text-[11px] font-bold flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-3.5 text-xs font-medium">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 block mb-1.5">
                    {lang === 'ar' ? 'كلمة المرور الحالية' : lang === 'nl' ? 'Huidig Wachtwoord' : 'Current Password'}
                  </label>
                  <input
                    type="password"
                    placeholder={lang === 'ar' ? 'أدخل كلمة المرور الخاصة بك' : lang === 'nl' ? 'Voer je wachtwoord in' : 'Enter your password'}
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    disabled={isSavingPassword}
                    className="w-full h-8 px-3 py-1 text-xs font-semibold bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 block mb-1.5">
                    {lang === 'ar' ? 'كلمة المرور الجديدة' : lang === 'nl' ? 'Nieuw Wachtwoord' : 'New Password'}
                  </label>
                  <input
                    type="password"
                    placeholder={lang === 'ar' ? 'أدخل كلمة مرور جديدة' : lang === 'nl' ? 'Voer een nieuw wachtwoord in' : 'Enter a new password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isSavingPassword}
                    className="w-full h-8 px-3 py-1 text-xs font-semibold bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/55 text-white font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSavingPassword ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{lang === 'ar' ? 'جاري حفظ التحديثات الأمانية...' : lang === 'nl' ? 'Beveiligingsupdates opslaan...' : 'Saving Security Updates...'}</span>
                    </>
                  ) : (
                    <span>{lang === 'ar' ? 'حفظ التحديثات الأمانية' : lang === 'nl' ? 'Beveiligingsupdates Opslaan' : 'Save Security Updates'}</span>
                  )}
                </button>
              </form>
            </div>

          </div>

          {/* Instructor Notes timeline section */}
          <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-[20px] shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
              <User className="h-4 w-4 text-slate-500 dark:text-zinc-400" />
              <span>{lang === 'nl' ? 'Instructeur Notities' : lang === 'ar' ? 'ملاحظات المدرب' : 'Instructor Notes'}</span>
            </h3>

            {(() => {
              const completedWithNotes = lessons
                .filter(l => l.status === 'completed' && (l.instructorNotes || l.trainerNotes || l.lessonNotes))
                .sort((a, b) => {
                  const timeA = new Date(a.completedAt || `${a.date}T${a.time || '12:00'}`).getTime();
                  const timeB = new Date(b.completedAt || `${b.date}T${b.time || '12:00'}`).getTime();
                  return timeB - timeA;
                });
              
              if (completedWithNotes.length === 0) {
                return (
                  <div className="py-6 px-4 text-center space-y-1 bg-slate-50/50 dark:bg-zinc-950/30 border border-slate-100 dark:border-zinc-800/40 rounded-[20px]">
                    <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-zinc-200">
                      {lang === 'nl' ? 'Geen recente instructeur notities.' : lang === 'ar' ? 'لا توجد ملاحظات مؤخرة من المدرب.' : 'No recent instructor notes.'}
                    </p>
                    <p className="text-[11px] font-normal text-slate-500 dark:text-zinc-400">
                      {lang === 'nl' ? 'Voltooi je volgende les om feedback te ontvangen.' : lang === 'ar' ? 'أكمل درسك القادم للحصول على ملاحظات المدرب.' : 'Complete your next lesson to receive instructor feedback.'}
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {completedWithNotes.map((lesson, idx) => {
                    const notes = (lesson.instructorNotes || lesson.trainerNotes || lesson.lessonNotes || '').trim();
                    const rawName = lesson.trainerName || (lang === 'nl' ? 'Instructeur' : lang === 'ar' ? 'المدرب' : 'Instructor');
                    const trainerName = rawName.replace(/^(Instructeur|Instructor|مدرب|المدرب)\s+/i, '').trim() || rawName;
                    const trainerPhoto = getTrainerPhoto(trainerName);
                    const dateFormatted = new Date(`${lesson.date}T${lesson.time || '12:00'}`).toLocaleDateString(lang === 'ar' ? 'ar-EG' : lang === 'nl' ? 'nl-NL' : 'en-US', { month: 'short', day: 'numeric' });
                    const timeStr = lesson.time || '14:00';
                    const isLatest = idx === 0;
                    const isPositive = (lesson.performanceRating && lesson.performanceRating >= 4) || lesson.performanceEvaluation === 'excellent' || lesson.performanceEvaluation === 'good' || notes.toLowerCase().includes('excellent') || notes.toLowerCase().includes('great');
                    
                    return (
                      <div 
                        key={lesson.id}
                        className={`p-4 sm:p-4.5 rounded-[20px] shadow-xs space-y-2.5 border transition-all duration-200 ${
                          isLatest 
                            ? 'bg-white dark:bg-zinc-950 border-slate-200/80 dark:border-zinc-800/90' 
                            : 'bg-white/80 dark:bg-zinc-950/70 border-slate-200/50 dark:border-zinc-800/60 opacity-95'
                        } ${
                          isPositive ? 'border-l-[3px] border-l-blue-500/80 dark:border-l-blue-400/80' : ''
                        }`}
                      >
                        {/* Instructor Identity */}
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden font-bold text-[10px] text-slate-600 dark:text-zinc-300 shrink-0 border border-slate-200/50 dark:border-zinc-700/50">
                            {trainerPhoto ? (
                              <img src={trainerPhoto} alt={trainerName} className="w-full h-full object-cover" />
                            ) : (
                              <span>{trainerName.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1 flex items-center gap-2">
                            <p className="text-[12px] font-semibold text-slate-700 dark:text-zinc-300 leading-tight truncate">
                              {trainerName}
                            </p>
                            <span className="text-[10px] text-slate-300 dark:text-zinc-600">•</span>
                            <p className="text-[11px] font-normal text-slate-400 dark:text-zinc-500 leading-tight truncate">
                              {dateFormatted} • {timeStr}
                            </p>
                          </div>
                        </div>
                        {/* Feedback Text */}
                        <p className="text-sm sm:text-[15px] font-normal text-slate-900 dark:text-zinc-100 leading-relaxed pt-0.5">
                          “{notes}”
                        </p>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Notifications Section (Permanent history, completely separate from Instructor Notes) */}
          <div id="student-profile-notifications-section" className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-[20px] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue-500" />
                <span>{lang === 'nl' ? 'Notificaties' : lang === 'ar' ? 'الإشعارات' : 'Notifications'}</span>
              </h3>
              {persistentNotifications.length > 0 && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                  {persistentNotifications.length} {lang === 'ar' ? 'إشعار' : lang === 'nl' ? 'meldingen' : 'notifications'}
                </span>
              )}
            </div>

            {persistentNotifications.length === 0 ? (
              <div className="py-6 px-4 text-center space-y-1 bg-slate-50/50 dark:bg-zinc-950/30 border border-slate-100 dark:border-zinc-800/40 rounded-[20px]">
                <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-zinc-200">
                  {lang === 'nl' ? 'Geen eerdere notificaties.' : lang === 'ar' ? 'لا توجد إشعارات مسجلة.' : 'No notification history.'}
                </p>
                <p className="text-[11px] font-normal text-slate-500 dark:text-zinc-400">
                  {lang === 'nl' ? 'Ontvangen meldingen en updates worden hier bewaard.' : lang === 'ar' ? 'جميع التنبيهات والإشعارات المستلمة تُحفظ هنا بشكل دائم.' : 'Received notifications and updates are permanently stored here.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {persistentNotifications.map((notif) => {
                  const title = lang === 'ar' ? notif.titleAr : lang === 'nl' ? notif.titleNl : notif.titleEn;
                  const message = lang === 'ar' ? notif.messageAr : lang === 'nl' ? notif.messageNl : notif.messageEn;
                  const dateStr = new Date(notif.timestamp).toLocaleDateString(lang === 'ar' ? 'ar-EG' : lang === 'nl' ? 'nl-NL' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const timeStr = new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const isExpanded = !!expandedNotifs[notif.id];

                  return (
                    <div
                      key={notif.id}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      onClick={() => toggleNotifExpand(notif.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleNotifExpand(notif.id);
                        }
                      }}
                      className="p-3.5 sm:p-4 rounded-[18px] bg-slate-50/60 dark:bg-zinc-950/50 border border-slate-200/60 dark:border-zinc-800/70 hover:border-slate-300 dark:hover:border-zinc-700/80 space-y-1.5 transition-all duration-200 cursor-pointer text-start w-full focus:outline-none focus:ring-2 focus:ring-blue-500/30 select-none"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            {notif.type.includes('cancel') ? (
                              <CalendarX className="w-3.5 h-3.5 text-rose-500" />
                            ) : notif.type.includes('invoice') ? (
                              <FileText className="w-3.5 h-3.5 text-emerald-500" />
                            ) : notif.type.includes('completed') ? (
                              <Award className="w-3.5 h-3.5 text-amber-500" />
                            ) : (
                              <Bell className="w-3.5 h-3.5 text-blue-500" />
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">
                            {title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-zinc-500 shrink-0 font-medium">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{dateStr} • {timeStr}</span>
                          </div>
                          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180 text-blue-500 dark:text-blue-400' : ''}`} />
                        </div>
                      </div>
                      <p className={`text-xs font-normal text-slate-600 dark:text-zinc-400 leading-relaxed ps-8 transition-all ${isExpanded ? 'whitespace-pre-line break-words' : 'line-clamp-2'}`}>
                        {message}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

const StudentProfile = React.memo(StudentProfileComponent);
export default StudentProfile;
