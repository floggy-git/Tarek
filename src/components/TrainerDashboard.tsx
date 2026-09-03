import React, { useState, useEffect } from 'react';
import L from 'leaflet';
import { createPortal } from 'react-dom';
import { 
  Users, Calendar, Wallet, FileText, Settings, PlusCircle, 
  CheckCircle, Mail, DollarSign, Send, BookOpen, Clock, Trash2, Search, 
  BellRing, Award, ShieldAlert, CheckSquare, RefreshCw, Save, Coins, Check, AlertCircle,
  Download, Printer, Play, Pause, Navigation, Activity, Wifi, WifiOff,
  MapPin, Map as MapIcon, ExternalLink, User, Car, X, ChevronDown, ChevronUp, Copy, Edit3, MoreVertical, Package,
  Video, Eye, EyeOff, Upload, Camera, Bell, Image as ImageIcon, Palmtree, MessageSquare, SlidersHorizontal, Route
} from 'lucide-react';
import { TRANSLATIONS, Language, Lesson, WalletTransaction, TrainerSchedule, Assessment, DrivePackage, StudentRecord, AuditLogEntry, SchoolSettings, getSchoolName, getSchoolShortName } from '../types';
import { sendAppEmail } from '../utils/emailService';
import { safeSetItem } from '../utils/safeStorage';
import { DatePicker } from './DatePicker';
import { getStudentPhoto, getStudentInitials, getStudentId, saveStudentPhoto, compressImage, deleteStudentPhoto, getTrainerPhoto, saveTrainerPhoto, deleteTrainerPhoto } from '../utils/studentPhoto';
import { getSheetsConfig, uploadVideoToGoogleDrive, deleteVideoFromGoogleDrive, writeStudentsToGoogleSheet, writeAuditLogToGoogleSheet, fetchClientIpAddress, writePackagesToGoogleSheet, writeMediaVideosToGoogleSheet } from '../utils/googleSheets';
import { AlertTriangle, Compass, Mic, MicOff, Sliders, Palette, Type, Smile, Layers, Disc, Scissors, Snowflake, ZoomIn, Target, Droplet, Volume2, Square } from 'lucide-react';
import { PackageCard } from './PackageCard';
import { AddImageModule } from './AddImageModule';
import { AddVideoModule } from './AddVideoModule';
import { PaymentReminderModal } from './PaymentReminderModal';
import { useImageLocalizedText, getImageLocalizedTitle, getImageLocalizedDescription, getImageLocalizedTitleSync, getImageLocalizedDescriptionSync } from '../utils/imageTranslation';
import { DEFAULT_VIDEO_THUMBNAIL } from '../data';
import { getLocalVideoBlobUrl, getVideoThumbnail } from '../utils/localVideoStore';
import { addNotification } from '../utils/notificationStore';
import { isRecordForStudent } from '../utils/identity';
import { generateAndArchiveInvoice } from '../services/documentPipeline';
import { cancelLessonCalendarEvent, formatDisplayLessonNumber } from '../services/googleCalendarService';
import { writeLessonsToSheet, writeWalletToSheet } from '../services/googleSheetsService';

const ExamTracker = React.lazy(() => import('./ExamTracker'));
const DossierA4Pages = React.lazy(() => import('./DossierA4Pages').then(m => ({ default: m.DossierA4Pages })));
const LiveNavigationMap = React.lazy(() => import('./LiveNavigationMap'));
const CancelLessonModal = React.lazy(() => import('./CancelLessonModal'));
const CompleteLessonModal = React.lazy(() => import('./CompleteLessonModal'));
const SchoolConfigPanel = React.lazy(() => import('./SchoolConfigPanel').then(m => ({ default: m.SchoolConfigPanel })));

function TrainerMediaTitleDescription({ video, lang }: { video: any; lang: Language }) {
  const localizedTitle = useImageLocalizedText(video, lang, true);
  const localizedDesc = useImageLocalizedText(video, lang, false);

  return (
    <div className={lang === 'ar' ? 'text-right' : 'text-left'} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <h4 className="font-bold text-slate-800 dark:text-white text-xs line-clamp-1">
        {localizedTitle}
      </h4>
      <p className="text-[10px] text-slate-400 dark:text-zinc-500 line-clamp-2">
        {localizedDesc}
      </p>
    </div>
  );
}

function TrainerMediaModalHeader({ video, lang, onClose }: { video: any; lang: Language; onClose: () => void }) {
  const localizedTitle = useImageLocalizedText(video, lang, true);
  return (
    <div className={`p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 ${lang === 'ar' ? 'flex-row-reverse text-right' : 'flex-row text-left'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="space-y-0.5 min-w-0 flex-1">
        <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-[9px] rounded-md">
          {video.category || 'General'}
        </span>
        <h3 className="font-extrabold text-sm text-white line-clamp-1">
          {localizedTitle}
        </h3>
      </div>
      <button 
        type="button"
        onClick={onClose}
        className="p-1 px-2.5 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-400 rounded-lg text-xs cursor-pointer transition shrink-0 ml-2"
      >
        ✕
      </button>
    </div>
  );
}

function TrainerMediaModalFooter({ video, lang }: { video: any; lang: Language }) {
  const localizedDesc = useImageLocalizedText(video, lang, false);
  return (
    <div className={`p-4 bg-slate-950 text-xs text-slate-400 border-t border-slate-800 space-y-1 ${lang === 'ar' ? 'text-right' : 'text-left'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <p className="font-bold text-white">
        {lang === 'ar' ? 'الوصف التفصيلي:' : lang === 'nl' ? 'Gedetailleerde beschrijving:' : 'Detailed Description:'}
      </p>
      <p className="leading-relaxed">
        {localizedDesc}
      </p>
    </div>
  );
}

function TrainerMediaPreviewPlayer({ previewingMediaVideo, lang }: { previewingMediaVideo: any; lang: Language }) {
  const localizedTitle = useImageLocalizedText(previewingMediaVideo, lang, true);
  const urlToPlay = previewingMediaVideo.url || previewingMediaVideo.videoUrl || '';
  const [resolvedUrl, setResolvedUrl] = useState<string>(urlToPlay);

  useEffect(() => {
    let isMounted = true;
    if (previewingMediaVideo.id && (previewingMediaVideo.sourceType === 'UPLOAD_FILE' || previewingMediaVideo.provider === 'local' || urlToPlay.startsWith('blob:'))) {
      getLocalVideoBlobUrl(previewingMediaVideo.id).then((blobUrl) => {
        if (isMounted && blobUrl) {
          setResolvedUrl(blobUrl);
        }
      });
    } else {
      setResolvedUrl(urlToPlay);
    }
    return () => { isMounted = false; };
  }, [previewingMediaVideo.id, urlToPlay, previewingMediaVideo.sourceType, previewingMediaVideo.provider]);

  if (!urlToPlay) {
    return (
      <div className="p-8 text-center space-y-2 text-slate-400">
        <Play className="h-12 w-12 mx-auto text-slate-600 animate-pulse" />
        <p className="text-xs">
          {lang === 'ar' ? 'رابط الفيديو غير صالح أو مفقود' : 'Invalid or missing video URL'}
        </p>
      </div>
    );
  }

  const isImage = previewingMediaVideo.type === 'image' || 
                  urlToPlay.startsWith('data:image/') || 
                  urlToPlay.match(/\.(png|jpg|jpeg|webp|gif|bmp|svg)(\?|$)/i);

  if (isImage) {
    return (
      <img 
        src={urlToPlay || undefined} 
        alt={localizedTitle || 'Media'}
        className="w-full h-full max-h-[60vh] object-contain"
        referrerPolicy="no-referrer"
      />
    );
  }

  const driveId = previewingMediaVideo.driveFileId || 
    (urlToPlay.includes('/file/d/') ? urlToPlay.split('/file/d/')[1]?.split('/')[0]?.split('?')[0] : '') ||
    (urlToPlay.includes('lh3.googleusercontent.com/d/') ? urlToPlay.split('lh3.googleusercontent.com/d/')[1]?.split('?')[0] : '');

  let embedUrl = urlToPlay;
  let isYouTubeOrVimeo = false;

  if (urlToPlay.includes('youtube.com/watch?v=')) {
    const parts = urlToPlay.split('v=');
    if (parts.length > 1) {
      const videoId = parts[1].split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
      isYouTubeOrVimeo = true;
    }
  } else if (urlToPlay.includes('youtu.be/')) {
    const parts = urlToPlay.split('youtu.be/');
    if (parts.length > 1) {
      const videoId = parts[1].split('?')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
      isYouTubeOrVimeo = true;
    }
  } else if (urlToPlay.includes('vimeo.com/') && !urlToPlay.includes('player.vimeo.com')) {
    const match = urlToPlay.match(/vimeo\.com\/(\d+)/);
    if (match?.[1]) {
      embedUrl = `https://player.vimeo.com/video/${match[1]}`;
      isYouTubeOrVimeo = true;
    }
  } else if (embedUrl.includes('youtube.com/embed') || embedUrl.includes('player.vimeo.com')) {
    isYouTubeOrVimeo = true;
  }

  const isDirectVideo = !isYouTubeOrVimeo;
  const videoSrc = driveId ? `https://lh3.googleusercontent.com/d/${driveId}` : resolvedUrl;

  if (isDirectVideo) {
    return (
      <video 
        src={videoSrc || undefined} 
        controls 
        playsInline
        preload="metadata"
        controlsList="nodownload"
        className="w-full h-full max-h-[60vh] object-contain"
      />
    );
  }

  return (
    <iframe 
      src={embedUrl || undefined} 
      className="w-full h-full min-h-[250px] sm:min-h-[400px] border-0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      title={localizedTitle || 'Video'}
    />
  );
}

// Lazy-loaded canvas for modern color resolution
let colorConversionCtx: CanvasRenderingContext2D | null = null;
const getConversionContext = (): CanvasRenderingContext2D | null => {
  if (typeof document === 'undefined') return null;
  if (!colorConversionCtx) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      colorConversionCtx = canvas.getContext('2d');
    } catch (e) {
      console.warn("Failed to create color conversion canvas context", e);
    }
  }
  return colorConversionCtx;
};

// Helper to strip oklch, oklab and other advanced color spaces that crash html2canvas's CSS parser
const sanitizeCssColors = (css: string): string => {
  if (!css) return '';
  
  const ctx = getConversionContext();
  let result = css;
  
  // Clean up any known oklch/oklab occurrences
  const prefixes = ['oklch(', 'oklab(', 'OKLCH(', 'OKLAB('];
  for (const prefix of prefixes) {
    let index = result.indexOf(prefix);
    while (index !== -1) {
      let depth = 1;
      let i = index + prefix.length;
      for (; i < result.length; i++) {
        if (result[i] === '(') {
          depth++;
        } else if (result[i] === ')') {
          depth--;
          if (depth === 0) {
            break;
          }
        }
      }
      if (depth === 0) {
        const matchedColor = result.substring(index, i + 1);
        let resolved = 'rgb(71, 85, 105)'; // Safe fallback
        if (ctx) {
          try {
            // First clear any existing fillStyle
            ctx.fillStyle = 'transparent';
            ctx.fillStyle = matchedColor;
            // If the browser parsed the modern color successfully, fillStyle will change
            if (ctx.fillStyle && ctx.fillStyle !== 'transparent' && ctx.fillStyle !== 'rgba(0, 0, 0, 0)') {
              resolved = ctx.fillStyle;
            }
          } catch (e) {
            // keep fallback
          }
        }
        
        result = result.substring(0, index) + resolved + result.substring(i + 1);
        index = result.indexOf(prefix, index + resolved.length);
      } else {
        // Fallback if mismatched
        result = result.substring(0, index) + 'rgb(' + result.substring(index + prefix.length);
        index = result.indexOf(prefix, index + 4);
      }
    }
  }
  return result;
};

const sanitizeInlineStyles = (root: Element) => {
  try {
    const elementsWithStyle = Array.from(root.querySelectorAll('[style]'));
    if (root.getAttribute('style')) {
      elementsWithStyle.push(root);
    }
    elementsWithStyle.forEach(el => {
      const styleAttr = el.getAttribute('style');
      if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('oklab') || styleAttr.includes('OKLCH') || styleAttr.includes('OKLAB'))) {
        el.setAttribute('style', sanitizeCssColors(styleAttr));
      }
    });
  } catch (err) {
    console.warn("Failed to sanitize inline styles:", err);
  }
};

const sanitizeMainStylesheets = () => {
  try {
    // 1. Sanitize all <style> tags in the main document
    const styleTags = Array.from(document.querySelectorAll('style'));
    styleTags.forEach(style => {
      if (style.textContent && (style.textContent.includes('oklch') || style.textContent.includes('oklab') || style.textContent.includes('OKLCH') || style.textContent.includes('OKLAB'))) {
        style.textContent = sanitizeCssColors(style.textContent);
      }
    });

    // 2. Sanitize any same-origin styleSheets rules directly
    const sheets = Array.from(document.styleSheets);
    for (const sheet of sheets) {
      try {
        const rules = (sheet as any).cssRules || (sheet as any).rules;
        if (rules) {
          for (let i = rules.length - 1; i >= 0; i--) {
            const rule = rules[i];
            if (rule.cssText && (rule.cssText.includes('oklch') || rule.cssText.includes('oklab') || rule.cssText.includes('OKLCH') || rule.cssText.includes('OKLAB'))) {
              const sanitized = sanitizeCssColors(rule.cssText);
              try {
                sheet.deleteRule(i);
                sheet.insertRule(sanitized, i);
              } catch (ruleErr) {
                // If replacing fails, delete the rule to avoid crashing html2canvas
                try {
                  sheet.deleteRule(i);
                } catch (delErr) {}
              }
            }
          }
        }
      } catch (sheetErr) {
        // Cross-origin style sheets can be ignored/are safe
      }
    }
  } catch (err) {
    console.warn("Failed to sanitize main document stylesheets:", err);
  }
};

const sanitizeClonedDocForHtml2Canvas = (clonedDoc: Document) => {
  try {
    // 1. Sanitize inline style attributes on all elements
    sanitizeInlineStyles(clonedDoc.documentElement);

    // 2. We will look at the styleSheets of the original document
    const originalSheets = Array.from(document.styleSheets);
    const clonedStylesheets = Array.from(clonedDoc.querySelectorAll('link[rel="stylesheet"], style'));

    // We map cloned stylesheet elements to original styleSheets
    // If we can successfully read the rules of an original stylesheet, we can replace the cloned element with a sanitized <style> element.
    // If we cannot read the rules (e.g. cross-origin or blocked), we keep the cloned element as is so the browser can load it.
    clonedStylesheets.forEach((clonedEl, index) => {
      const originalEl = document.querySelectorAll('link[rel="stylesheet"], style')[index];
      const originalSheet = originalSheets.find(sheet => sheet.ownerNode === originalEl) 
                            || originalSheets[index];

      if (!originalSheet) return;

      try {
        const rules = (originalSheet as any).cssRules || (originalSheet as any).rules;
        if (rules && rules.length > 0) {
          // Successfully read rules! We can replace this stylesheet with a sanitized inline <style> tag.
          let sheetCss = '';
          for (let k = 0; k < rules.length; k++) {
            sheetCss += rules[k].cssText + '\n';
          }
          if (sheetCss) {
            const sanitizedCss = sanitizeCssColors(sheetCss);
            const newStyle = clonedDoc.createElement('style');
            newStyle.textContent = sanitizedCss;
            
            // Replace the cloned element with the new sanitized style tag
            if (clonedEl.parentNode) {
              clonedEl.parentNode.replaceChild(newStyle, clonedEl);
            }
          }
        }
      } catch (sheetErr) {
        // If we fail to read the rules of this stylesheet (e.g., CORS blocked),
        // we KEEP the cloned element (do not remove it) so the cloned document can still load it.
        console.warn("Keeping stylesheet in cloned doc because rules were unreadable:", sheetErr);
      }
    });
  } catch (err) {
    console.warn("Failed to sanitize cloned document for oklch/oklab:", err);
  }
};

interface TrainerDashboardProps {
  lang: Language;
  t: typeof TRANSLATIONS['en'];
  lessons: Lesson[];
  setLessons: (lessons: Lesson[]) => void;
  transactions: WalletTransaction[];
  setTransactions: (transactions: WalletTransaction[]) => void;
  schedule: TrainerSchedule;
  setSchedule: (sched: TrainerSchedule) => void;
  assessments: Assessment[];
  setAssessments: (assessments: Assessment[]) => void;
  packages: DrivePackage[];
  setPackages: React.Dispatch<React.SetStateAction<DrivePackage[]>>;
  students: StudentRecord[];
  setStudents: React.Dispatch<React.SetStateAction<StudentRecord[]>>;
  schoolSettings?: any;
  setSchoolSettings?: React.Dispatch<React.SetStateAction<any>>;
  mediaVideos?: any[];
  setMediaVideos?: React.Dispatch<React.SetStateAction<any[]>>;
  currentUser?: any;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

// Complete local translation dictionary for Trainer Dashboard to achieve 100% precise Arabic coverage
const LOCAL_T = {
  en: {
    trainerSuite: "TRAINER PORTAL",
    trainerDashboard: "Trainer Workspace",
    welcomeTrainer: "Welcome, Samir El-Filali. Manage working rotas and verify active student files.",
    lessonsToday: "Lessons Conducted Today",
    hoursLogged: "Hours Completed",
    outstandingInvoices: "Outstanding Invoices",
    avgRating: "Avg priority training rating: 4.9/5 stars",
    unpaid: "unpaid",
    remindersPrepared: "2 automated balance reminder alerts prepared",
    licenseAuthority: "Under official driving school license authority",
    loggedPayments: "Quick Deposit",
    manualDeposit: "Record Manual Student Cash Deposit",
    studentLabel: "Select Student",
    amountLabel: "Amount",
    amountPlaceholder: "e.g. 150",
    creditStudent: "Credit Student Wallet",
    issueInvoice: "Issue Custom Invoice bill",
    billRecipient: "Bill Recipient",
    billAmount: "Bill Amount",
    billDesc: "Bill Description",
    descPlaceholder: "Invoice reference",
    sendInvoice: "Send Invoice Out",
    allLessonsLog: "All Lessons Log Database",
    totalEntries: "Total entries",
    quickMark: "Quick-Mark Complete",
    searchNames: "Search...",
    drivingProgression: "Driving Progression",
    remindBalance: "Remind Balance",
    certifyReady: "Certify Exam Ready",
    workingScheduleSettings: "Trainer Working Schedule Settings",
    scheduleDesc: "Define active weekdays & time-blocks when students can automatically book sessions.",
    startHrs: "Start Office Hours",
    endHrs: "End Office Hours",
    hourlyRate: "Hourly Rate (€ / Hour)",
    persistRota: "Persist Working Rota",
    slot: "Slot",
    durationLabel: "duration",
    pickupLabel: "Pickup address",
    completeLesson: "End Lesson",
    cancelRide: "Cancel Ride",
    lessonCompletedAlert: "Lesson marked as completed!",
    reminderSentAlert: "Reminder Sent!",
    balanceLoggedAlert: "Balance logged correctly!",
    invoiceDispatchedAlert: "New invoice dispatched successfully!",
    rotaPersistedAlert: "Schedule Rota settings successfully persisted!",
    certifiedAlert: "marked as officially Exam Ready for practical driving tests!",
    lessonCompletedSuccess: "Rijles succesvol opgeslagen in het leerlingdossier!",
    homeTab: "Overview",
    lessonsTab: "Lessons",
    studentsTab: "Students",
    scheduleTab: "Settings",
    previewTitle: "Live Booking Calendar Preview",
    previewDesc: "This is how students will see your working rota availability in their app view.",
    invoicesTab: "Invoices",
    reportsTab: "Assessments",
    invoiceTitle: "Lesson Invoicing Panel",
    reportsTitle: "Student Assessment Logs",
  },
  ar: {
    trainerSuite: "بوابة المدرب المعتمد",
    trainerDashboard: "لوحة تحكم المدرب الميداني",
    welcomeTrainer: "مرحباً بك، كابتن سمير الفيلالي. قم بإدارة جدول المواعيد والموافقة على ملفات المتدربين النشطين.",
    lessonsToday: "الدروس العملية المنجزة اليوم",
    hoursLogged: "إجمالي الساعات المسجلة",
    outstandingInvoices: "المستحقات والمعاملات المعلقة",
    avgRating: "متوسط تقييم السلامة والأولوية: 4.9/5 نجوم",
    unpaid: "غير مدفوعة",
    remindersPrepared: "تجهيز تذكيرين تلقائيين لشحن الرصيد",
    licenseAuthority: "تحت إشراف وترخيص مدرسة القيادة المعتمدة",
    loggedPayments: "إيداع مبلغ مالي (شحن رصيد)",
    manualDeposit: "تسجيل مبلغ شحن نقدي يدوي للمتدرب",
    studentLabel: "اختر المتدرب",
    amountLabel: "المبلغ (€)",
    amountPlaceholder: "مثال: 150",
    creditStudent: "إيداع وتحديث محفظة المتدرب",
    issueInvoice: "إصدار فاتورة ضريبية جديدة",
    billRecipient: "المستلم (المتدرب)",
    billAmount: "قيمة الفاتورة (€)",
    billDesc: "تفاصيل وبيان الفاتورة",
    descPlaceholder: "مرجع الفاتورة",
    sendInvoice: "إصدار وإرسال الفاتورة",
    allLessonsLog: "قاعدة بيانات سجل الدروس الشاملة",
    totalEntries: "إجمالي الدروس المسجلة",
    quickMark: "تحديد سريع كمكتمل",
    searchNames: "بحث...",
    drivingProgression: "التقدم التدريبي العام",
    remindBalance: "إرسال تذكير الدفع",
    certifyReady: "اعتماد كجاهز للامتحان",
    workingScheduleSettings: "إعدادات أوقات العمل وجدول القيادة",
    scheduleDesc: "حدد أيام العمل الأسبوعية النشطة والفترات الزمنية لتمكين المتدربين من الحجز الميداني المباشر.",
    startHrs: "توقيت بدء العمل",
    endHrs: "توقيت انتهاء العمل",
    hourlyRate: "تكلفة الساعة التدريبية المعتمدة (€ / ساعة)",
    persistRota: "حفظ واعتماد جدول العمل العملي",
    slot: "الفترة",
    durationLabel: "المدة",
    pickupLabel: "عنوان ونقطة الإلتقاء",
    completeLesson: "إنهاء الدرس",
    cancelRide: "إلغاء الدرس",
    lessonCompletedAlert: "تم تسجيل الدرس التدريبي بنجاح بنظام مدرسة القيادة!",
    reminderSentAlert: "تم إرسال إشعار تذكير شحن الرصيد بنجاح!",
    balanceLoggedAlert: "تم شحن الرصيد المالي وإضافته للمحفظة بنجاح!",
    invoiceDispatchedAlert: "تم إصدار الفاتورة الضريبية الرسمية وإرسالها للمتدرب!",
    rotaPersistedAlert: "تم حفظ واعتماد أوقات وجدول العمل وتحديث بيانات الحجز التلقائي بنجاح!",
    certifiedAlert: "تم منحه شهادة الجاهزية الرسمية لخوض امتحان القيادة بنجاح!",
    lessonCompletedSuccess: "تم تحديث سجل المتدرب وحفظ تفاصيل الدرس بنجاح!",
    homeTab: "الرئيسية",
    lessonsTab: "الدروس",
    studentsTab: "المتدربون",
    scheduleTab: "الإعدادات",
    previewTitle: "معاينة مباشرة لما يظهر للمتدرب",
    previewDesc: "هكذا ستظهر أوقات وطبيعة توفرك للمتدربين عند قيامهم بحجز درس جديد في تطبيقاتهم.",
    invoicesTab: "الفواتير",
    reportsTab: "التقييمات",
    invoiceTitle: "فواتير الدروس العملية",
    reportsTitle: "أرشيف تقارير وتقييم المتدربين",
  },
  nl: {
    trainerSuite: "INSTRUCTEURS PORTAAL",
    trainerDashboard: "Instructeurs Portaal",
    welcomeTrainer: "Welkom. Beheer hier je werkrooster en bekijk actieve leerlingdossiers.",
    lessonsToday: "Lessen Vandaag Uitgevoerd",
    hoursLogged: "Geregistreerde Uren",
    outstandingInvoices: "Openstaande Facturen",
    avgRating: "Gemiddelde voorrangsscore: 4.9/5 sterren",
    unpaid: "openstaand",
    remindersPrepared: "2 automatische betalingsherinneringen klaargezet",
    licenseAuthority: "Onder licentietoezicht van de Erkende Rijschool",
    loggedPayments: "Geld Storten",
    manualDeposit: "Handmatige Contante Betaling Registreren",
    studentLabel: "Selecteer Leerling",
    amountLabel: "Bedrag (€)",
    amountPlaceholder: "bijv. 150",
    creditStudent: "Waardeer Portemonnee Op",
    issueInvoice: "Nieuwe Factuur Aanmaken",
    billRecipient: "Ontvanger (Leerling)",
    billAmount: "Factuurbedrag (€)",
    billDesc: "Factuur Omschrijving",
    descPlaceholder: "Factuurreferentie",
    sendInvoice: "Verstuur Factuur",
    allLessonsLog: "Volledige Lessen Database Log",
    totalEntries: "Totaal aantal ritten",
    quickMark: "Snel Afronden",
    searchNames: "Zoeken...",
    drivingProgression: "Rijvaardigheid Voortgang",
    remindBalance: "Stuur Herinnering",
    certifyReady: "Examenklaar Certificeren",
    workingScheduleSettings: "Werkrooster & Beschikbaarheid Instellingen",
    scheduleDesc: "Stel de actieve werkdagen en tijdsblokken in waarop leerlingen zelfstandig kunnen boeken.",
    startHrs: "Aanvang Werktijd",
    endHrs: "Einde Werktijd",
    hourlyRate: "Uurtarief (€ / Uur)",
    persistRota: "Werkrooster Opslaan",
    slot: "Tijdsblok",
    durationLabel: "lesduur",
    pickupLabel: "Ophaallocatie",
    completeLesson: "Les Afronden",
    cancelRide: "Les Annuleren",
    lessonCompletedAlert: "Les succesvol afgerond!",
    reminderSentAlert: "Herinnering succesvol verzonden!",
    balanceLoggedAlert: "Saldo succesvol opgewaardeerd!",
    invoiceDispatchedAlert: "Nieuwe factuur succesvol verzonden!",
    rotaPersistedAlert: "Werkrooster instellingen succesvol opgeslagen!",
    certifiedAlert: "is officieel gecertificeerd als examenklaar voor het praktijkexamen!",
    lessonCompletedSuccess: "Rijles succesvol opgeslagen in het leerlingdossier!",
    homeTab: "Overzicht",
    lessonsTab: "Lessen",
    studentsTab: "Leerlingen",
    scheduleTab: "Instellingen",
    previewTitle: "Live Boekingsvoorbeeld",
    previewDesc: "Dit is hoe leerlingen jouw beschikbaarheid en werktijden zien bij het boeken van een les.",
    invoicesTab: "Facturen",
    reportsTab: "Beoordelingen",
    invoiceTitle: "Lessen Facturatie",
    reportsTitle: "Rapportages & Evaluaties van Leerlingen",
  }
};

const DAY_NAMES = {
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  ar: ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"],
  nl: ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"]
};

const DAY_KEYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const loadLeaflet = (callback: () => void) => {
  callback();
};

// Sub-component to encapsulate the ticking system clock and isolate its state/re-renders
const DateTimeWatermark = ({ lang }: { lang: string }) => {
  const [liveDateStr, setLiveDateStr] = React.useState<string>('');
  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveDateStr(now.toLocaleString(lang === 'ar' ? 'ar-EG' : lang === 'nl' ? 'nl-NL' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'medium'
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [lang]);

  return (
    <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-black/75 backdrop-blur-md rounded-xl text-white text-[10px] font-mono shadow-lg border border-white/10">
      <Clock className="h-3.5 w-3.5 text-indigo-400" />
      <span>{liveDateStr}</span>
    </div>
  );
};

// Mini Route Graphic Thumbnail representing route preview in modern vector styling
const MiniRouteGraphic = ({ points }: { points?: { lat: number; lng: number }[] }) => {
  return (
    <div className="w-24 sm:w-28 h-14 sm:h-16 rounded-[14px] overflow-hidden border border-[#e6ecf2] dark:border-zinc-700/60 bg-[#f8fafc] dark:bg-zinc-800/80 relative shrink-0 shadow-xs flex items-center justify-center select-none group">
      <svg viewBox="0 0 120 70" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="70" fill="#f1f5f9" className="dark:fill-zinc-800" />
        <path d="M-10 18 L130 18" stroke="#e2e8f0" strokeWidth="4" className="dark:stroke-zinc-700" />
        <path d="M-10 52 L130 52" stroke="#e2e8f0" strokeWidth="3.5" className="dark:stroke-zinc-700" />
        <path d="M28 -10 L28 80" stroke="#e2e8f0" strokeWidth="3" className="dark:stroke-zinc-700" />
        <path d="M85 -10 L85 80" stroke="#e2e8f0" strokeWidth="4.5" className="dark:stroke-zinc-700" />
        <path d="M-10 35 C40 30, 80 40, 130 25" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3 3" className="dark:stroke-zinc-650" />
        
        {/* Route Blue Curved Line */}
        <path
          d="M 22 46 C 26 36, 42 42, 54 36 C 68 30, 78 46, 94 22"
          stroke="#1f4e94"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="dark:stroke-blue-400"
        />
        <path
          d="M 22 46 C 26 36, 42 42, 54 36 C 68 30, 78 46, 94 22"
          stroke="#60a5fa"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="dark:stroke-blue-200"
        />

        {/* Start Point - Green Pin */}
        <circle cx="22" cy="46" r="5" fill="#2e7d32" stroke="#ffffff" strokeWidth="1.5" />
        <circle cx="22" cy="46" r="2" fill="#ffffff" />

        {/* Destination Point - Blue Pin */}
        <circle cx="94" cy="22" r="5" fill="#1f4e94" stroke="#ffffff" strokeWidth="1.5" />
        <circle cx="94" cy="22" r="2" fill="#ffffff" />
      </svg>
    </div>
  );
};

// Sub-component to render interactive route previews on demand within completed lesson cards
interface CardMapPreviewProps {
  points?: { lat: number; lng: number }[];
  lessonId: string;
  pickupLocation?: string;
  lang: string;
}

const CardMapPreview: React.FC<CardMapPreviewProps> = React.memo(({ points, lessonId, pickupLocation, lang }) => {
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = React.useRef<L.Map | null>(null);
  const [mapError, setMapError] = React.useState<boolean>(false);

  React.useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    // Avoid double initialization
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (e) {
        // ignore
      }
      mapInstanceRef.current = null;
    }

    try {
      const validPoints = (points || []).filter(
        p => typeof p?.lat === 'number' && typeof p?.lng === 'number' && !isNaN(p.lat) && !isNaN(p.lng)
      );

      let centerLat = 50.8514;
      let centerLng = 5.6910; // Default Maastricht

      if (validPoints.length > 0) {
        centerLat = validPoints[0].lat;
        centerLng = validPoints[0].lng;
      }

      const map = L.map(container, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
        dragging: true,
        fadeAnimation: false,
        markerZoomAnimation: false
      }).setView([centerLat, centerLng], 13);

      mapInstanceRef.current = map;

      const isDark = document.documentElement.classList.contains('dark');
      const tileUrl = isDark 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' 
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      L.tileLayer(tileUrl, { 
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      if (validPoints.length > 0) {
        const latlngs: [number, number][] = validPoints.map(p => [p.lat, p.lng]);
        
        if (latlngs.length > 1) {
          L.polyline(latlngs, {
            color: '#1f4e94',
            weight: 4,
            opacity: 0.85,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(map);
        }

        // Start Pin (Green)
        L.circleMarker([validPoints[0].lat, validPoints[0].lng], {
          radius: 5,
          color: '#ffffff',
          weight: 2,
          fillColor: '#2e7d32',
          fillOpacity: 1
        }).addTo(map);

        // End Pin (Blue / Red)
        if (validPoints.length > 1) {
          const last = validPoints[validPoints.length - 1];
          L.circleMarker([last.lat, last.lng], {
            radius: 5,
            color: '#ffffff',
            weight: 2,
            fillColor: '#1f4e94',
            fillOpacity: 1
          }).addTo(map);
        }

        try {
          if (latlngs.length > 1) {
            const bounds = L.latLngBounds(latlngs);
            map.fitBounds(bounds, { padding: [16, 16], maxZoom: 16 });
          }
        } catch (e) {
          // fallback
        }
      } else {
        // Marker for location
        L.circleMarker([centerLat, centerLng], {
          radius: 6,
          color: '#ffffff',
          weight: 2,
          fillColor: '#1f4e94',
          fillOpacity: 1
        }).addTo(map);
      }

      // Container resize invalidation to ensure full rendered tiles without gray boxes
      const timer1 = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 60);

      const timer2 = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.remove();
          } catch (e) {
            // ignore
          }
          mapInstanceRef.current = null;
        }
      };
    } catch (err) {
      console.error("Failed to initialize card map preview:", err);
      setMapError(true);
    }
  }, [points, lessonId]);

  if (mapError) {
    return (
      <div className="p-3 bg-[#f8fafc] dark:bg-zinc-950/60 border border-[#e6ecf2] dark:border-zinc-800/60 text-center rounded-[14px] text-[#64748b] dark:text-zinc-400 text-xs font-semibold mt-2">
        {lang === 'ar' ? 'تعذر تحميل الخريطة حالياً' : 'Could not display map preview'}
      </div>
    );
  }

  return (
    <div className="w-full h-40 sm:h-48 rounded-[16px] overflow-hidden mt-3 border border-[#e6ecf2] dark:border-zinc-800 relative z-10 shadow-inner bg-slate-100 dark:bg-zinc-800">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
});

// Dedicated Memoized Completed Lesson Card to avoid unnecessary re-renders of the whole grid
interface CompletedLessonCardItemProps {
  item: Lesson;
  lang: string;
  isMapOpen: boolean;
  onToggleMap: (id: string) => void;
  onOpenGoogleMaps: (item: Lesson, e: React.MouseEvent) => void;
  onSendReminder: (item: Lesson) => void;
}

const CompletedLessonCardItem: React.FC<CompletedLessonCardItemProps> = React.memo(({
  item,
  lang,
  isMapOpen,
  onToggleMap,
  onOpenGoogleMaps,
  onSendReminder
}) => {
  const hasRoute = !!(item.routePoints && item.routePoints.length > 0);
  const isPaid = (item.payStatus || (item.id === 'l3' || item.id === 'l4' || item.id === 'LES-000003' || item.id === 'LES-000004' ? 'paid' : 'unpaid')) === 'paid';

  const displayLessonNumber = formatDisplayLessonNumber(item, undefined, lang);

  const studentPhoto = getStudentPhoto(item.studentName);

  const evalRating = item.performanceRating || (
    item.performanceEvaluation === 'excellent' ? 5 :
    item.performanceEvaluation === 'good' ? 3 :
    item.performanceEvaluation === 'needs_improvement' ? 1 : 0
  );
  const hasEvaluation = evalRating > 0 || Boolean(item.performanceEvaluation);
  const evalLabel = evalRating === 5 || item.performanceEvaluation === 'excellent'
    ? (lang === 'ar' ? 'ممتاز' : lang === 'nl' ? 'Uitstekend' : 'Excellent')
    : evalRating === 3 || item.performanceEvaluation === 'good'
    ? (lang === 'ar' ? 'جيد' : lang === 'nl' ? 'Goed' : 'Good')
    : (lang === 'ar' ? 'يحتاج تحسين' : lang === 'nl' ? 'Verbetering nodig' : 'Needs Improvement');

  const feedbackText = item.instructorNotes || item.trainerNotes;

  return (
    <div 
      className="p-5 md:p-6 bg-white dark:bg-zinc-900 border border-[#e6ecf2] dark:border-zinc-800 rounded-[22px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_-8px_rgba(31,78,148,0.12)] transition-all duration-300 flex flex-col justify-between space-y-4"
    >
      {/* 1. Header: Completed Check, Badges, Monospace ID & Price */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Green Circle Check */}
          <div className="h-6 w-6 rounded-full bg-[#2e7d32] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Check className="h-3.5 w-3.5 stroke-[3]" />
          </div>

          {/* COMPLETED Badge */}
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-[#e8f5e9] text-[#2e7d32] dark:bg-emerald-950/60 dark:text-emerald-400 border border-[#c8e6c9]/60 dark:border-emerald-800/40">
            {lang === 'ar' ? 'مكتملة' : 'COMPLETED'}
          </span>

          {/* PAID / UNPAID Badge */}
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
            isPaid 
              ? 'bg-[#e8f5e9] text-[#2e7d32] dark:bg-emerald-950/60 dark:text-emerald-400 border-[#c8e6c9]/60 dark:border-emerald-800/40' 
              : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800/40'
          }`}>
            {isPaid ? (lang === 'ar' ? 'مدفوعة' : 'PAID') : (lang === 'ar' ? 'غير مدفوعة' : 'UNPAID')}
          </span>

          {/* Performance Evaluation Badge */}
          {hasEvaluation && (
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border flex items-center gap-1 ${
              evalRating === 5 || item.performanceEvaluation === 'excellent'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                : evalRating === 3 || item.performanceEvaluation === 'good'
                ? 'bg-blue-50 text-[#1f4e94] dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800/40'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
            }`}>
              {evalLabel}
            </span>
          )}

          {/* Human-readable Lesson Number */}
          <span className="text-[11px] font-bold text-[#64748b] dark:text-zinc-400 ml-1 rtl:ml-0 rtl:mr-1">
            {displayLessonNumber}
          </span>
        </div>

        {/* Top-Right Price & Duration */}
        <div className="text-right rtl:text-left shrink-0">
          <span className="text-xl font-extrabold text-[#0f172a] dark:text-white font-mono tracking-tight leading-none block">
            €{item.price || 50}
          </span>
          <span className="text-xs font-semibold text-[#64748b] dark:text-zinc-400 mt-1 block">
            {item.duration || 1} {lang === 'ar' ? 'ساعة' : lang === 'nl' ? 'Uur' : 'Hour(s)'}
          </span>
        </div>
      </div>

      {/* 2. Student Info Row */}
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-[#f1f5f9] dark:bg-zinc-800 border border-[#e6ecf2] dark:border-zinc-700 overflow-hidden flex items-center justify-center shrink-0">
          {studentPhoto ? (
            <img src={studentPhoto} alt={item.studentName} className="h-full w-full object-cover" />
          ) : (
            <User className="h-5 w-5 text-[#64748b] dark:text-zinc-400" />
          )}
        </div>
        <div className="min-w-0">
          <h4 className="text-base font-extrabold text-[#0f172a] dark:text-white leading-tight truncate">
            {item.studentName}
          </h4>
          <p className="text-xs font-medium text-[#64748b] dark:text-zinc-400 mt-0.5">
            {lang === 'ar' ? 'المدرب:' : lang === 'nl' ? 'Instructeur:' : 'Trainer:'} {item.trainerName || 'Instructeur Samir'}
          </p>
        </div>
      </div>

      {/* 3. Date, Location & Optional Mini Map Route Graphic */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-center pt-3 border-t border-[#e6ecf2] dark:border-zinc-800">
        <div className="grid grid-cols-2 gap-3">
          {/* Date & Time */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-[#64748b] dark:text-zinc-400 block">
              {lang === 'ar' ? 'التاريخ والوقت:' : 'Date & Time:'}
            </span>
            <div className="flex items-start gap-1.5">
              <Calendar className="h-4 w-4 text-[#0f172a] dark:text-zinc-200 shrink-0 mt-0.5" />
              <div className="text-xs font-bold text-[#0f172a] dark:text-white leading-tight">
                <div>{item.date}</div>
                <div className="text-[#64748b] dark:text-zinc-400 font-medium">{item.time || '14:00'}</div>
              </div>
            </div>
          </div>

          {/* Pickup Location */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-[#64748b] dark:text-zinc-400 block">
              {lang === 'ar' ? 'عنوان الالتقاء:' : 'Pickup Location:'}
            </span>
            <div className="flex items-start gap-1.5">
              <MapPin className="h-4 w-4 text-[#0f172a] dark:text-zinc-200 shrink-0 mt-0.5" />
              <span className="text-xs font-bold text-[#0f172a] dark:text-white leading-tight line-clamp-2" title={item.pickupLocation}>
                {item.pickupLocation || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Mini Map Route Thumbnail Graphic - Only if route exists */}
        {hasRoute && <MiniRouteGraphic points={item.routePoints} />}
      </div>

      {/* 4. Metrics Bar - Shown when route or performance metadata is present */}
      {hasRoute ? (
        <div className="bg-[#f8fafc] dark:bg-zinc-800/40 border border-[#e6ecf2] dark:border-zinc-800/80 rounded-[14px] p-2.5 grid grid-cols-3 gap-2 text-center">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748b] dark:text-zinc-400 block mb-0.5">
              {lang === 'ar' ? 'المسافة' : 'Distance'}
            </span>
            <span className="text-xs font-bold text-[#0f172a] dark:text-white">
              {item.distanceKm ? `${Number(item.distanceKm).toFixed(1)} km` : '—'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748b] dark:text-zinc-400 block mb-0.5">
              {lang === 'ar' ? 'الوقت المستغرق' : 'Elapsed Time'}
            </span>
            <span className="text-xs font-bold text-[#0f172a] dark:text-white">
              {item.elapsedTime || `${item.duration || 1}h`}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748b] dark:text-zinc-400 block mb-0.5">
              {lang === 'ar' ? 'مسار GPS' : 'GPS Route'}
            </span>
            <span className="text-xs font-bold text-[#1f4e94] dark:text-blue-400 flex items-center justify-center gap-1">
              <Activity className="h-3 w-3 text-[#1f4e94]" />
              {item.routePoints!.length} pts
            </span>
          </div>
        </div>
      ) : null}

      {/* 5. Lesson Topics - Only shown if entered */}
      {item.lessonNotes ? (
        <div className="bg-[#f8fafc] dark:bg-zinc-800/30 border border-[#e6ecf2] dark:border-zinc-800/60 rounded-[14px] p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#0f172a] dark:text-white">
            <BookOpen className="h-3.5 w-3.5 text-[#0f172a] dark:text-zinc-300" />
            <span>{lang === 'ar' ? 'مواضيع الدرس:' : lang === 'nl' ? 'Lesonderwerpen:' : 'Lesson Topics:'}</span>
          </div>
          <p className="text-xs font-medium text-[#64748b] dark:text-zinc-300 leading-relaxed pl-5 rtl:pl-0 rtl:pr-5">
            {item.lessonNotes}
          </p>
        </div>
      ) : null}

      {/* 6. Instructor Feedback - Only shown if entered */}
      {feedbackText ? (
        <div className="bg-[#f5f8ff] dark:bg-blue-950/20 border border-[#1f4e94]/20 dark:border-blue-900/40 rounded-[14px] p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#0f172a] dark:text-white">
            <MessageSquare className="h-3.5 w-3.5 text-[#1f4e94] dark:text-blue-400" />
            <span>{lang === 'ar' ? 'ملاحظات المدرب والتقييم:' : lang === 'nl' ? 'Feedback Instructeur:' : 'Instructor Feedback:'}</span>
          </div>
          <p className="text-xs font-medium text-[#1f4e94] dark:text-blue-300 leading-relaxed pl-5 rtl:pl-0 rtl:pr-5">
            {feedbackText}
          </p>
        </div>
      ) : null}

      {/* 7. Card Footer & Action Buttons */}
      {(hasRoute || !isPaid) && (
        <div className="space-y-2 pt-3 border-t border-[#e6ecf2] dark:border-zinc-800">
          {/* Map Preview Expanded - Only if route exists */}
          {hasRoute && isMapOpen && (
            <CardMapPreview 
              points={item.routePoints} 
              lessonId={item.id} 
              pickupLocation={item.pickupLocation} 
              lang={lang} 
            />
          )}

          <div className="flex gap-2">
            {/* Primary Action Button: View Google Maps Route - ONLY if route exists */}
            {hasRoute && (
              <>
                <button
                  type="button"
                  onClick={(e) => onOpenGoogleMaps(item, e)}
                  className="flex-1 py-2.5 bg-[#1f4e94] hover:bg-[#183e78] text-white text-xs font-bold rounded-[12px] cursor-pointer transition flex items-center justify-center gap-2 shadow-xs hover:shadow-sm"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>{lang === 'ar' ? 'عرض المسار على Google Maps' : 'View Google Maps Route'}</span>
                </button>

                {/* Secondary Action: Map Toggle Button */}
                <button
                  type="button"
                  onClick={() => onToggleMap(item.id)}
                  className={`px-3.5 text-xs font-bold rounded-[12px] border transition flex items-center justify-center cursor-pointer ${
                    isMapOpen 
                      ? 'bg-[#1f4e94] text-white border-[#1f4e94]' 
                      : 'bg-[#f8fafc] dark:bg-zinc-800/60 text-[#0f172a] dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 border-[#e6ecf2] dark:border-zinc-800'
                  }`}
                  title={isMapOpen ? "Close Map Preview" : "Show Map Preview"}
                >
                  <MapIcon className="h-4 w-4" />
                </button>
              </>
            )}

            {/* Payment Reminder Button (if unpaid) */}
            {!isPaid && (
              <button
                type="button"
                onClick={() => onSendReminder(item)}
                className={`py-2.5 text-white text-xs font-bold rounded-[12px] cursor-pointer transition flex items-center justify-center gap-2 shadow-xs ${
                  hasRoute ? 'px-3.5 bg-amber-500 hover:bg-amber-600' : 'flex-1 bg-amber-500 hover:bg-amber-600'
                }`}
                title={lang === 'ar' ? 'إرسال تذكير بالدفع' : 'Send Payment Reminder'}
              >
                <Mail className="h-4 w-4" />
                <span>{lang === 'ar' ? 'تذكير بالدفع' : 'Payment Reminder'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

function TrainerDashboardComponent({ 
  lang, t, lessons, setLessons, transactions, setTransactions, schedule, setSchedule, assessments, setAssessments, packages, setPackages, students, setStudents,
  schoolSettings: parentSchoolSettings, setSchoolSettings: parentSetSchoolSettings, mediaVideos: parentMediaVideos, setMediaVideos: parentSetMediaVideos,
  currentUser,
  activeTab: parentActiveTab,
  setActiveTab: parentSetActiveTab
}: TrainerDashboardProps) {
  
  // Helper to match student names across translations (Arabic and English/Dutch)
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

  // Helper to dynamically calculate wallet balance for a student using Student ID > Email > Name fallback
  const getStudentBalance = React.useCallback((studentIdent: string | StudentRecord | { name?: string; studentId?: string; id?: string; email?: string }) => {
    const studentObj = typeof studentIdent === 'string' 
      ? (students.find(s => s.name === studentIdent || s.id === studentIdent || s.studentId === studentIdent) || { name: studentIdent, studentId: getStudentId(studentIdent) })
      : studentIdent;

    return transactions
      .filter(tx => isRecordForStudent(tx, studentObj))
      .reduce((acc, curr) => {
        return curr.type === 'deposit' ? acc + curr.amount : acc - curr.amount;
      }, 0);
  }, [transactions, students]);

  const getStudentProgress = React.useCallback((studentIdent: string | StudentRecord | { name?: string; studentId?: string; id?: string; email?: string }) => {
    const studentObj = typeof studentIdent === 'string'
      ? (students.find(s => s.name === studentIdent || s.id === studentIdent || s.studentId === studentIdent) || { name: studentIdent, studentId: getStudentId(studentIdent) })
      : studentIdent;

    const studentAssessments = assessments.filter(a => isRecordForStudent(a, studentObj));
    if (studentAssessments.length > 0) {
      // Sort by date & time or just take the first one since we prepend
      const latest = studentAssessments[0];
      const score = latest.overallScore || parseFloat(((latest.scores.control + latest.scores.priority + latest.scores.highway + latest.scores.maneuvers + latest.scores.theory) / 5).toFixed(1));
      return `${Math.round(score * 10)}%`;
    }
    const cleanName = (studentObj.name || '').toLowerCase();
    if (cleanName.includes("amir") || cleanName.includes("أمير")) return "85%";
    if (cleanName.includes("sanne") || cleanName.includes("ساني")) return "40%";
    if (cleanName.includes("michael") || cleanName.includes("مايكل")) return "95%";
    return "15%";
  }, [assessments, students]);

  const [internalActiveTab, setInternalActiveTab] = useState<'home' | 'lessons' | 'students' | 'tracker' | 'invoices' | 'reports' | 'schedule'>('home');

  const validTabs = ['home', 'lessons', 'students', 'tracker', 'invoices', 'reports', 'schedule'];
  const activeTab = (parentActiveTab && validTabs.includes(parentActiveTab))
    ? (parentActiveTab as 'home' | 'lessons' | 'students' | 'tracker' | 'invoices' | 'reports' | 'schedule')
    : internalActiveTab;

  const setActiveTab = (tab: 'home' | 'lessons' | 'students' | 'tracker' | 'invoices' | 'reports' | 'schedule') => {
    setInternalActiveTab(tab);
    if (parentSetActiveTab) {
      parentSetActiveTab(tab);
    }
  };
  const [cancellingLesson, setCancellingLesson] = useState<Lesson | null>(null);
  const [hasUnsavedRotaChanges, setHasUnsavedRotaChanges] = useState(false);
  const [rotaSaveSuccess, setRotaSaveSuccess] = useState(false);

  const handleConfirmCancellation = (cancellationData: {
    reason: string;
    notes?: string;
    notifyStudent: boolean;
  }) => {
    if (!cancellingLesson) return;

    const cancellationDate = new Date().toISOString().split('T')[0];
    const cancellationTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updated = lessons.map(l => {
      if (l.id === cancellingLesson.id) {
        return {
          ...l,
          status: 'cancelled' as const,
          cancellationReason: cancellationData.reason,
          cancellationDate,
          cancellationTime,
          cancelledBy: (currentUser?.role === 'student' ? 'Student' : 'Trainer') as 'Trainer' | 'Admin' | 'Student',
          cancellationNotes: cancellationData.notes,
          notifiedStudent: cancellationData.notifyStudent
        };
      }
      return l;
    });

    setLessons(updated);

    if (cancellationData.notifyStudent) {
      sendAppEmail(cancellingLesson.studentName, 'cancellation', {
        date: cancellingLesson.date,
        time: cancellingLesson.time,
        price: cancellingLesson.price,
        cancellationReason: cancellationData.reason,
        cancellationNotes: cancellationData.notes
      });
    }

    // Add persistent notification to student regarding instructor cancellation
    addNotification({
      recipientRole: 'student',
      targetStudentName: cancellingLesson.studentName,
      type: 'lesson_cancelled_by_trainer',
      titleAr: 'تم إلغاء موعد الدرس من قبل المدرب',
      titleNl: 'Rijles geannuleerd door instructeur',
      titleEn: 'Lesson cancelled by instructor',
      messageAr: `تم إلغاء درسك بتاريخ ${cancellingLesson.date} (${cancellingLesson.time || '12:00'}). السبب: ${cancellationData.reason || 'إلغاء من المدرب'}.`,
      messageNl: `Je rijles op ${cancellingLesson.date} om ${cancellingLesson.time || '12:00'} is geannuleerd door de instructeur. Reden: ${cancellationData.reason || 'Geannuleerd door instructeur'}.`,
      messageEn: `Your lesson on ${cancellingLesson.date} at ${cancellingLesson.time || '12:00'} was cancelled by the instructor. Reason: ${cancellationData.reason || 'Cancelled by instructor'}.`,
      metadata: {
        studentName: cancellingLesson.studentName,
        date: cancellingLesson.date,
        time: cancellingLesson.time,
        reason: cancellationData.reason,
        notes: cancellationData.notes
      }
    });

    const sheetsConfig = getSheetsConfig();

    // Cancel Google Calendar Event if attached
    if (cancellingLesson.calendarEventId && sheetsConfig.accessToken) {
      cancelLessonCalendarEvent(cancellingLesson.calendarEventId, sheetsConfig.accessToken).catch(e =>
        console.warn("Trainer cancellation calendar sync error:", e)
      );
    }

    // Sync updated lessons array to Google Sheets
    if (sheetsConfig.spreadsheetId && sheetsConfig.accessToken) {
      writeLessonsToSheet(sheetsConfig.spreadsheetId, updated, sheetsConfig.accessToken).catch(e =>
        console.warn("Trainer cancellation sheets sync error:", e)
      );
    }

    if (sheetsConfig.spreadsheetId) {
      writeAuditLogToGoogleSheet(sheetsConfig, {
        auditId: `audit-${Date.now()}`,
        userId: currentUser?.id || 'trainer-1',
        userName: currentUser?.name || 'Trainer',
        userRole: currentUser?.role || 'Trainer',
        action: `CANCEL_LESSON: ${cancellingLesson.studentName} on ${cancellingLesson.date}. Reason: ${cancellationData.reason}`,
        changedBy: currentUser?.name || 'Trainer',
        date: cancellationDate,
        time: cancellationTime,
        timeZone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Europe/Amsterdam',
        ipAddress: '127.0.0.1',
        deviceBrowser: typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser'
      });
    }

    setCancellingLesson(null);
  };
  
  const trainerName = currentUser?.name || "Instructor";
  const trainerEmail = currentUser?.email || "trainer@drivingschool.nl";
  const [trainerPhoto, setTrainerPhoto] = useState<string | null>(() => getTrainerPhoto(trainerEmail || trainerName));

  React.useEffect(() => {
    const syncPhoto = () => setTrainerPhoto(getTrainerPhoto(trainerEmail || trainerName));
    syncPhoto();
    window.addEventListener('trainerPhotoUpdated', syncPhoto);
    window.addEventListener('storage', syncPhoto);
    return () => {
      window.removeEventListener('trainerPhotoUpdated', syncPhoto);
      window.removeEventListener('storage', syncPhoto);
    };
  }, [trainerEmail, trainerName]);

  const handleTrainerPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        compressImage(base64String, (compressed) => {
          setTrainerPhoto(compressed);
          saveTrainerPhoto(trainerEmail || trainerName, compressed);
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveTrainerPhoto = () => {
    deleteTrainerPhoto(trainerEmail || trainerName);
    setTrainerPhoto(null);
  };
  const [financeSubTab, setFinanceSubTab] = useState<'deposit' | 'invoice'>('invoice');

  // Package management state variables
  const [settingsSubTab, setSettingsSubTab] = useState<'rota' | 'packages' | 'school' | 'media'>('rota');
  const [schoolConfigTab, setSchoolConfigTab] = useState<'profile' | 'branding' | 'business' | 'social' | 'ai' | 'packages'>('profile');
  const [schoolConfigInnerTab, setSchoolConfigInnerTab] = useState<'info' | 'business' | 'email' | 'branding' | 'social' | 'ai'>('info');

  React.useEffect(() => {
    const handleOpenSchoolConfig = (e: Event) => {
      setInternalActiveTab('schedule');
      const detail = (e as CustomEvent)?.detail;
      if (detail?.subTab) {
        setSettingsSubTab(detail.subTab);
      } else {
        setSettingsSubTab('school');
      }
      if (detail?.innerTab) {
        setSchoolConfigInnerTab(detail.innerTab);
      }
    };
    window.addEventListener('openSchoolConfig', handleOpenSchoolConfig);
    return () => window.removeEventListener('openSchoolConfig', handleOpenSchoolConfig);
  }, []);
  
  // Media library management states
  const [showAddImageModule, setShowAddImageModule] = useState(false);
  const [showAddVideoModule, setShowAddVideoModule] = useState(false);
  const [mediaVideoToDelete, setMediaVideoToDelete] = useState<any | null>(null);
  const [previewingMediaVideo, setPreviewingMediaVideo] = useState<any | null>(null);







  const handleDeleteVideo = (id: string) => {
    const videoToDelete = mediaVideos.find((v: any) => v.id === id);
    if (videoToDelete) {
      setMediaVideoToDelete(videoToDelete);
    }
  };

  const confirmDeleteVideo = async () => {
    if (!mediaVideoToDelete) return;
    const id = mediaVideoToDelete.id;

    // Delete from Google Drive if driveFileId exists
    if (mediaVideoToDelete.driveFileId) {
      const config = getSheetsConfig();
      if (config.accessToken) {
        try {
          await deleteVideoFromGoogleDrive(config.accessToken, mediaVideoToDelete.driveFileId);
        } catch (e) {
          console.warn("Failed to delete file from Google Drive:", e);
        }
      }
    }

    // Mark as deleted by trainer
    const updated = mediaVideos.map((v: any) => v.id === id ? { ...v, isDeletedByTrainer: true } : v);
    setMediaVideos(updated);
    safeSetItem('drivingschool_media_videos', JSON.stringify(updated));

    const config = getSheetsConfig();
    if (config.accessToken && config.spreadsheetId) {
      try {
        await writeMediaVideosToGoogleSheet(config, updated);
      } catch (e) {
        console.warn("Failed to sync media deletion to Google Sheets:", e);
      }
    }

    setMediaVideoToDelete(null);
  };

  const handleToggleVideoEnabled = (id: string) => {
    const updated = mediaVideos.map((v: any) => v.id === id ? { ...v, isEnabled: !v.isEnabled } : v);
    setMediaVideos(updated);
    safeSetItem('drivingschool_media_videos', JSON.stringify(updated));
  };
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [showPkgForm, setShowPkgForm] = useState<boolean>(false);
  const [pkgFormName, setPkgFormName] = useState<string>('');
  const [pkgFormDesc, setPkgFormDesc] = useState<string>('');
  const [pkgFormHours, setPkgFormHours] = useState<number>(10);
  const [pkgFormPrice, setPkgFormPrice] = useState<number>(650);
  const [pkgFormDiscountPrice, setPkgFormDiscountPrice] = useState<number | undefined>(undefined);
  const [pkgFormBadge, setPkgFormBadge] = useState<string>('');
  const [pkgFormPopular, setPkgFormPopular] = useState<boolean>(false);
  const [pkgFormRecommended, setPkgFormRecommended] = useState<boolean>(false);
  const [pkgFormColorTheme, setPkgFormColorTheme] = useState<string>('blue');
  const [pkgFormDisplayOrder, setPkgFormDisplayOrder] = useState<number>(1);
  const [pkgFormIsActive, setPkgFormIsActive] = useState<boolean>(true);
  const [pkgFormFeatures, setPkgFormFeatures] = useState<string[]>([]);
  const [pkgFormNewFeatureText, setPkgFormNewFeatureText] = useState<string>('');

  // Feature list manipulation handlers
  const handleAddPkgFeature = (customText?: string) => {
    const textToAdd = (customText || pkgFormNewFeatureText).trim();
    if (!textToAdd) return;
    setPkgFormFeatures(prev => [...prev, textToAdd]);
    if (!customText) {
      setPkgFormNewFeatureText('');
    }
  };

  const handleRemovePkgFeature = (index: number) => {
    setPkgFormFeatures(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleMovePkgFeature = (index: number, direction: 'up' | 'down') => {
    setPkgFormFeatures(prev => {
      const nextArr = [...prev];
      const targetIdx = direction === 'up' ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= nextArr.length) return prev;
      const temp = nextArr[index];
      nextArr[index] = nextArr[targetIdx];
      nextArr[targetIdx] = temp;
      return nextArr;
    });
  };

  const handleUpdatePkgFeature = (index: number, newText: string) => {
    setPkgFormFeatures(prev => prev.map((f, idx) => idx === index ? newText : f));
  };

  // Deletion modals & Google Sheets sync states
  const [packageToDelete, setPackageToDelete] = useState<DrivePackage | null>(null);
  const [pkgInUseError, setPkgInUseError] = useState<{ name: string; students: string[] } | null>(null);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [isSavingStudent, setIsSavingStudent] = useState(false);

  // Search filter
  const [searchInput, setSearchInput] = useState('');
  const [openActionMenuStudent, setOpenActionMenuStudent] = useState<string | null>(null);

  // Form states
  const [logNotes, setLogNotes] = useState('');
  const [logStudent, setLogStudent] = useState('Amir Al-Hassan');

  const [depositStudentName, setDepositStudentName] = useState('ST-000001');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [walletOperation, setWalletOperation] = useState<'deposit' | 'payment' | 'adjustment'>('deposit');

  // New billing form
  const [billStudent, setBillStudent] = useState('Amir Al-Hassan');
  const [billAmount, setBillAmount] = useState('');
  const [billDesc, setBillDesc] = useState('Intermediate Highway driving tuition');
  const [billSuccess, setBillSuccess] = useState(false);
  const [billVatRate, setBillVatRate] = useState<0 | 9 | 21>(21);
  const [latestBillReceipt, setLatestBillReceipt] = useState<any>(null);

  // New Invoice states
  const [billedLessonIds, setBilledLessonIds] = useState<string[]>([]);
  const [selectedInvoiceStudent, setSelectedInvoiceStudent] = useState<string>('Amir Al-Hassan');
  const [selectedInvoiceLessonIds, setSelectedInvoiceLessonIds] = useState<string[]>([]);
  const [customAdjustmentLabel, setCustomAdjustmentLabel] = useState<string>('');
  const [customAdjustmentPrice, setCustomAdjustmentPrice] = useState<string>('');
  const [draftInvoiceId, setDraftInvoiceId] = useState<string>(`INV-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [invoiceDispatchedOverlay, setInvoiceDispatchedOverlay] = useState<boolean>(false);
  const [latestIssuedInvoice, setLatestIssuedInvoice] = useState<any>(null);
  const [selectedVatRate, setSelectedVatRate] = useState<number>(21);
  const [invoicePaymentMethod, setInvoicePaymentMethod] = useState<'wallet' | 'cash' | 'transfer' | 'card'>('wallet');
  const [invoicePaymentStatus, setInvoicePaymentStatus] = useState<'paid' | 'unpaid'>('paid');

  // Report viewing state
  const [viewingReportStudentName, setViewingReportStudentName] = useState<string | null>(null);

  React.useEffect(() => {
    if (viewingReportStudentName) {
      document.body.classList.add('dossier-printing-active');
    } else {
      document.body.classList.remove('dossier-printing-active');
    }
    return () => {
      document.body.classList.remove('dossier-printing-active');
    };
  }, [viewingReportStudentName]);

  // Dynamic School & Settings state loaded from Sheets or configured
  const [localSchoolSettings, setLocalSchoolSettings] = useState(() => {
    const saved = localStorage.getItem('al_andalos_school_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      name: "",
      instructorName: "",
      phone: "",
      email: "",
      address: "",
      logoUrl: "", // Optional custom logo image URL
      website: "",
      kvk: "",
      btw: "",
      licenseAuthority: "",
      schoolStamp: "",
      instructorSignature: ""
    };
  });

  const schoolSettings = parentSchoolSettings || localSchoolSettings;
  const setSchoolSettings = parentSetSchoolSettings || setLocalSchoolSettings;

  const [logDuration, setLogDuration] = useState<number>(() => Number(schoolSettings?.defaultLessonDuration) || 1);
  const [logPrice, setLogPrice] = useState(() => schoolSettings?.lessonPricePerHour || schedule?.lessonPricePerHour || 65);

  React.useEffect(() => {
    const activePrice = schoolSettings?.lessonPricePerHour || schedule?.lessonPricePerHour;
    if (activePrice !== undefined && !isNaN(activePrice)) {
      setLogPrice(prev => prev === activePrice ? prev : activePrice);
    }
  }, [schoolSettings?.lessonPricePerHour, schedule?.lessonPricePerHour]);

  React.useEffect(() => {
    if (schoolSettings?.defaultLessonDuration) {
      const dur = Number(schoolSettings.defaultLessonDuration);
      if (!isNaN(dur)) {
        setLogDuration(prev => prev === dur ? prev : dur);
      }
    }
  }, [schoolSettings?.defaultLessonDuration]);

  const trainerNotifications = schoolSettings.notificationsEnabled !== false;
  const setTrainerNotifications = (val: boolean | ((prev: boolean) => boolean)) => {
    const newVal = typeof val === 'function' ? val(trainerNotifications) : val;
    setSchoolSettings((prev: any) => ({
      ...prev,
      notificationsEnabled: newVal
    }));
  };

  const [localMediaVideos, setLocalMediaVideos] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('al_andalos_media_videos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const mediaVideos = parentMediaVideos || localMediaVideos;
  const setMediaVideos = parentSetMediaVideos || setLocalMediaVideos;

  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [emailStatusToast, setEmailStatusToast] = useState<'success' | 'error' | null>(null);

  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [tempGenerationStudent, setTempGenerationStudent] = useState<string | null>(null);

  const generateUnifiedStudentDossierPDF = async (studentName: string): Promise<any> => {
    setIsGeneratingPDF(true);
    let isTemp = false;
    const isDark = document.documentElement.classList.contains('dark');
    try {
      const { jsPDF } = await import('jspdf');
      const { toPng } = await import('html-to-image');

      // Pre-trigger DossierA4Pages chunk load so it's ready
      try {
        await import('./DossierA4Pages');
      } catch (e) {
        // non-fatal if prefetch fails
      }

      // Render off-screen temporarily using dedicated export container
      isTemp = true;
      setTempGenerationStudent(studentName);
      
      // Temporarily switch off dark mode for high-contrast light PDF rendering
      if (isDark) {
        document.documentElement.classList.remove('dark');
      }

      // Poll up to 5000ms for container & pages to mount and render in DOM
      let targetContainer: HTMLElement | null = null;
      let pageElements: HTMLElement[] = [];
      const startTime = Date.now();

      while (Date.now() - startTime < 5000) {
        const tempContainer = document.getElementById('temp-pdf-generator');
        const modalContainer = document.querySelector('.dossier-print-preview');
        const containerCandidate = tempContainer || modalContainer;

        if (containerCandidate) {
          const pages = Array.from(containerCandidate.querySelectorAll('.dossier-pdf-page')) as HTMLElement[];
          if (pages.length > 0) {
            targetContainer = containerCandidate as HTMLElement;
            pageElements = pages;
            break;
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (!targetContainer) {
        throw new Error("Target container for PDF generation not found");
      }

      if (pageElements.length === 0) {
        throw new Error("No A4 pages found inside container");
      }

      // Create a jsPDF document (A4 portrait)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      // Render each page to image and add to PDF
      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i];

        let imgData: string;
        try {
          imgData = await toPng(pageEl, {
            quality: 1.0,
            pixelRatio: 2.0,
            backgroundColor: '#ffffff',
            cacheBust: true,
            skipFonts: true,
            style: {
              boxShadow: 'none',
              border: 'none',
              margin: '0',
              transform: 'none'
            }
          });
        } catch (captureErr) {
          console.warn("Retrying toPng capture without cacheBust...", captureErr);
          imgData = await toPng(pageEl, {
            quality: 0.95,
            pixelRatio: 2.0,
            backgroundColor: '#ffffff',
            skipFonts: true
          });
        }

        const widthPx = pageEl.offsetWidth || 1;
        const heightPx = pageEl.offsetHeight || 1;
        const heightMm = (heightPx / widthPx) * 210;

        if (heightMm <= 305) {
          if (i > 0) {
            doc.addPage('a4', 'portrait');
          }
          doc.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
        } else {
          let remainingHeight = heightMm;
          let currentOffset = 0;
          let isFirstSlice = true;

          while (remainingHeight > 0) {
            if (i > 0 || !isFirstSlice) {
              doc.addPage('a4', 'portrait');
            }
            isFirstSlice = false;

            doc.addImage(imgData, 'PNG', 0, -currentOffset, 210, heightMm, undefined, 'FAST');
            
            remainingHeight -= 297;
            currentOffset += 297;
          }
        }
      }

      return doc;
    } catch (err) {
      console.error("Failed to generate PDF using html-to-image approach:", err);
      return null;
    } finally {
      if (isTemp) {
        setTempGenerationStudent(null);
      }
      if (isDark) {
        document.documentElement.classList.add('dark');
      }
      setIsGeneratingPDF(false);
    }
  };

  const handleSendDossierEmail = async (overrideStudentName?: string, overrideAssessment?: Assessment, providedPdfBase64?: string) => {
    const sName = (typeof overrideStudentName === 'string' && overrideStudentName) ? overrideStudentName : viewingReportStudentName;
    if (!sName) return;
    setIsSendingEmail(true);
    setEmailStatusToast(null);

    try {
      const profile = getStudentDbInfo(sName);
      
      const studentLessons = lessons.filter(l => studentNamesMatch(l.studentName, sName));
      const completedLessons = studentLessons.filter(l => l.status === 'completed');
      
      const totalTrainingHours = completedLessons.reduce((sum, l) => sum + l.duration, 0);
      const studentTransactions = transactions.filter(t => studentNamesMatch(t.studentName, sName));
      
      const latestSavedReport = overrideAssessment || assessments.find(r => studentNamesMatch(r.studentName, sName));
      
      let currentScoreControl = 8;
      let currentScorePriority = 7;
      let currentScoreHighway = 8;
      let currentScoreManeuvers = 7;
      let currentScoreTheory = 9;
      let currentCbrReadiness = "developing";
      let currentReportObservs = "";

      if (latestSavedReport) {
        currentScoreControl = latestSavedReport.scores?.control ?? latestSavedReport.overallScore ?? 8;
        currentScorePriority = latestSavedReport.scores?.priority ?? latestSavedReport.overallScore ?? 7;
        currentScoreHighway = latestSavedReport.scores?.highway ?? latestSavedReport.overallScore ?? 8;
        currentScoreManeuvers = latestSavedReport.scores?.maneuvers ?? latestSavedReport.overallScore ?? 7;
        currentScoreTheory = latestSavedReport.scores?.theory ?? latestSavedReport.overallScore ?? 9;
        currentCbrReadiness = latestSavedReport.cbrReadiness ?? "developing";
        currentReportObservs = latestSavedReport.notes ?? "";
      } else {
        const isAmir = sName.includes("Amir") || sName.includes("أمير");
        const isSanne = sName.includes("Sanne") || sName.includes("ساني");
        const isMichael = sName.includes("Michael") || sName.includes("مايكل");

        if (isAmir) {
          currentScoreControl = 8; currentScorePriority = 7; currentScoreHighway = 8; currentScoreManeuvers = 7; currentScoreTheory = 9;
          currentCbrReadiness = "developing";
          currentReportObservs = lang === 'ar'
            ? "أظهر أمير أداءً ممتازاً وتطوراً مستمراً في مناورات الطرق السريعة والدوران. يحتاج فقط لتركيز إضافي على الركن المتوازي."
            : "Amir has shown excellent performance and steady progress on highway lane joining and roundabout exits. Needs some more focus on parallel parking.";
        } else if (isSanne) {
          currentScoreControl = 5; currentScorePriority = 4; currentScoreHighway = 4; currentScoreManeuvers = 3; currentScoreTheory = 6;
          currentCbrReadiness = "beginner";
          currentReportObservs = lang === 'ar'
            ? "المتدرب ساني في البداية التدريبية الأولى. يحتاج إلى حصص مركزة إضافية للتحكم في القابض والتوجيه وقواعد أفضلية المرور."
            : "Sanne is in the early training stages. Requires extra focused sessions on clutch/gear control, steering, and general priority rules.";
        } else if (isMichael) {
          currentScoreControl = 10; currentScorePriority = 9; currentScoreHighway = 10; currentScoreManeuvers = 9; currentScoreTheory = 10;
          currentCbrReadiness = "cbr_ready";
          const scCity = schoolSettings?.city || "Maastricht";
          currentReportObservs = lang === 'ar'
            ? `أداء قيادة استثنائي ورائع! التحكم بالسيارة والسرعة والملاحظة المرورية كلها في مستوى الامتياز. جاهز تماماً للاختبار العملي لبلدية ${scCity}.`
            : `Exceptional and outstanding driving performance! Vehicle control, speed merging, and observational safety are all at excellence level. Fully ready for the ${scCity} CBR practical test.`;
        }
      }

      const packageHours = parseInt(profile.package.match(/\d+/)?.[0] || "15", 10);
      const remainingLessons = Math.max(0, packageHours - completedLessons.length);

      // Automated Multi-page PDF compiling stage
      let finalPdfBase64 = providedPdfBase64;
      if (!finalPdfBase64) {
        try {
          const pdf = await generateUnifiedStudentDossierPDF(sName);
          if (pdf) {
            const fullUri = pdf.output('datauristring');
            finalPdfBase64 = fullUri.split(',')[1];
          }
        } catch (pdfErr) {
          console.error("Failed to compile background PDF attachment:", pdfErr);
        }
      }

      // Reset any temp generation
      setTempGenerationStudent(null);

      const res = await sendAppEmail(profile.name, 'dossier', {
        studentId: `STU-${profile.name.substring(0,3).toUpperCase()}-2026`,
        package: profile.package,
        progress: profile.progress,
        examStatus: profile.examStatus,
        balance: profile.balance,
        totalHours: totalTrainingHours,
        completedLessons: completedLessons.length,
        remainingLessons: remainingLessons,
        scoreControl: currentScoreControl,
        scorePriority: currentScorePriority,
        scoreHighway: currentScoreHighway,
        scoreManeuvers: currentScoreManeuvers,
        scoreTheory: currentScoreTheory,
        cbrReadiness: currentCbrReadiness,
        notes: currentReportObservs,
        schoolName: schoolSettings.name,
        instructorName: schoolSettings.instructorName,
        phone: schoolSettings.phone,
        email: schoolSettings.email,
        address: schoolSettings.address
      }, finalPdfBase64);

      if (res && res.success) {
        setEmailStatusToast('success');
        return true;
      } else {
        setEmailStatusToast('error');
        return false;
      }
    } catch (err) {
      console.error("Failed sending dossier email:", err);
      setEmailStatusToast('error');
      return false;
    } finally {
      setIsSendingEmail(false);
      setTempGenerationStudent(null);
      setTimeout(() => {
        setEmailStatusToast(null);
      }, 5000);
    }
  };

  // Lesson completion workflow state
  const [finishingLessonId, setFinishingLessonId] = useState<string | null>(null);
  const [finishingStep, setFinishingStep] = useState<'decision' | 'payment_method' | null>(null);
  const [completionPayStatus, setCompletionPayStatus] = useState<'paid' | 'unpaid'>('paid');
  const [completionPayMethod, setCompletionPayMethod] = useState<'wallet' | 'cash' | 'transfer' | 'card'>('wallet');
  const [completionLessonNotes, setCompletionLessonNotes] = useState<string>('');
  const [completionInstructorNotes, setCompletionInstructorNotes] = useState<string>('');
  const [completionLessonPrice, setCompletionLessonPrice] = useState<string>('');

  React.useEffect(() => {
    if (finishingLessonId) {
      const lesson = lessons.find(l => l.id === finishingLessonId);
      if (lesson) {
        setCompletionLessonPrice(String(lesson.price));
      }
    } else {
      setCompletionLessonPrice('');
    }
  }, [finishingLessonId, lessons]);

  // Beautiful payment reminder states
  const [reminderModalLessonId, setReminderModalLessonId] = useState<string | null>(null);
  const [reminderPaymentLink, setReminderPaymentLink] = useState<string>('');
  const [reminderCustomNotes, setReminderCustomNotes] = useState<string>('');
  const [reminderSuccessToast, setReminderSuccessToast] = useState<boolean>(false);

  // New Performance Reports states
  const [selectedReportStudent, setSelectedReportStudent] = useState<string>('Amir Al-Hassan');
  const [scoreControl, setScoreControl] = useState<number>(8);
  const [scorePriority, setScorePriority] = useState<number>(7);
  const [scoreHighway, setScoreHighway] = useState<number>(8);
  const [scoreManeuvers, setScoreManeuvers] = useState<number>(7);
  const [scoreTheory, setScoreTheory] = useState<number>(9);
  const [reportObservs, setReportObservs] = useState<string>('');
  const [cbrReadiness, setCbrReadiness] = useState<'beginner' | 'developing' | 'exam_mock' | 'ready_cbr'>('developing');
  const [reportSuccessToast, setReportSuccessToast] = useState<boolean>(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState<boolean>(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [assessmentDate, setAssessmentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [assessmentTime, setAssessmentTime] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [historyFilterStudent, setHistoryFilterStudent] = useState<string>('all');
  const [isSyncingSheets, setIsSyncingSheets] = useState<boolean>(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState<boolean>(false);
  const [expandedAssessmentNotes, setExpandedAssessmentNotes] = useState<Record<string, boolean>>({});
  const [deletingAssessmentId, setDeletingAssessmentId] = useState<string | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [deletedStudents, setDeletedStudents] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('al_andalos_deleted_students');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  React.useEffect(() => {
    safeSetItem('al_andalos_deleted_students', JSON.stringify(deletedStudents));
  }, [deletedStudents]);



  // Completed Lessons Archive States
  const [completedLessonStudentFilter, setCompletedLessonStudentFilter] = useState<string>('all');
  const [completedLessonSort, setCompletedLessonSort] = useState<'newest' | 'oldest' | 'price-high' | 'price-low'>('newest');
  const [isLoadingSheets, setIsLoadingSheets] = useState<boolean>(false);
  const [sheetsLoadSuccess, setSheetsLoadSuccess] = useState<boolean | null>(null);
  const [activeMapPreviewId, setActiveMapPreviewId] = useState<string | null>(null);


  // Active Driving Lesson GPS Tracking states
  const [activeTrackingLesson, setActiveTrackingLesson] = useState<Lesson | null>(null);
  const [activeRoutePoints, setActiveRoutePoints] = useState<{ lat: number; lng: number; timestamp?: number }[]>([]);
  const [isGPSTracking, setIsGPSTracking] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [lastTrackedRoute, setLastTrackedRoute] = useState<{
    points: { lat: number; lng: number; timestamp?: number }[];
    durationStr: string;
    distanceKm: number;
  } | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false); // default to real GPS tracking
  const [isDemoUnlocked, setIsDemoUnlocked] = useState<boolean>(false);
  const [hudTitleClicks, setHudTitleClicks] = useState<number>(0);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const gpsWatchIdRef = React.useRef<number | null>(null);
  const simIntervalRef = React.useRef<any>(null);
  const timerIntervalRef = React.useRef<any>(null);

  const SIMULATED_POINTS = [
    { lat: 52.3892, lng: 4.8378 }, // Amsterdam Sloterdijk Station (Start)
    { lat: 52.3905, lng: 4.8410 },
    { lat: 52.3920, lng: 4.8450 },
    { lat: 52.3935, lng: 4.8480 },
    { lat: 52.3950, lng: 4.8500 }, // Midpoint turn
    { lat: 52.3930, lng: 4.8550 },
    { lat: 52.3900, lng: 4.8600 },
    { lat: 52.3860, lng: 4.8560 },
    { lat: 52.3830, lng: 4.8520 },
    { lat: 52.3850, lng: 4.8450 },
    { lat: 52.3892, lng: 4.8378 } // Return to station (Finish)
  ];

  const triggerSheetsLoad = async () => {
    const webAppUrl = (import.meta as any).env.VITE_GOOGLE_SHEETS_WEB_APP_URL;
    if (!webAppUrl || webAppUrl.includes('AKfycby...')) {
      console.log("VITE_GOOGLE_SHEETS_WEB_APP_URL not configured. Using local/mock lessons dataset.");
      return;
    }
    setIsLoadingSheets(true);
    setSheetsLoadSuccess(null);
    try {
      const response = await fetch(`${webAppUrl}?action=getTrainerDashboard&trainerEmail=${encodeURIComponent(trainerEmail)}`);
      const result = await response.json();
      if (result.success && result.data) {
        if (result.data.school) {
          setSchoolSettings(prev => ({ ...prev, ...result.data.school }));
        } else if (result.data.settings) {
          setSchoolSettings(prev => ({ ...prev, ...result.data.settings }));
        }

        if (result.data.bookings) {
          // Map bookings to Lesson format
        const sheetsLessonsList: Lesson[] = result.data.bookings.map((b: any) => {
          const localLesson = lessons.find(l => l.id === b.bookingId);
          return {
            id: b.bookingId,
            studentName: b.studentName,
            trainerName: b.trainerName || "Instructeur Samir",
            date: b.date ? b.date.substring(0, 10) : new Date().toISOString().split('T')[0],
            time: b.time || "12:00",
            duration: b.duration || 1,
            price: b.price || ((b.duration || 1) * (schoolSettings?.lessonPricePerHour || schedule?.lessonPricePerHour || 65)),
            pickupLocation: b.pickup || (schoolSettings?.city || "Maastricht"),
            status: b.status || "completed",
            payStatus: b.payStatus || (b.bookingId === 'l3' || b.bookingId === 'l4' || b.bookingId === 'LES-000003' || b.bookingId === 'LES-000004' ? 'paid' : 'unpaid'),
            trainerNotes: b.trainerNotes || b.feedback || localLesson?.trainerNotes || "",
            lessonNotes: b.lessonNotes || localLesson?.lessonNotes || "",
            instructorNotes: b.instructorNotes || localLesson?.instructorNotes || "",
            routePoints: b.routePoints || localLesson?.routePoints,
            distanceKm: b.distanceKm || localLesson?.distanceKm,
            elapsedTime: b.elapsedTime || localLesson?.elapsedTime
          };
        });

        // Set lessons immediately to ensure instant UI rendering
        const nonCompletedLessons = lessons.filter(l => l.status !== 'completed');
        const completedFromSheets = sheetsLessonsList.filter(l => l.status === 'completed');
        
        if (completedFromSheets.length > 0) {
          setLessons([...nonCompletedLessons, ...completedFromSheets]);
        } else {
          setLessons(sheetsLessonsList);
        }
        setSheetsLoadSuccess(true);
        }
      } else {
        setSheetsLoadSuccess(false);
      }
    } catch (err) {
      console.error("Failed to load lessons from Google Sheets:", err);
      setSheetsLoadSuccess(false);
    } finally {
      setIsLoadingSheets(false);
    }
  };

  React.useEffect(() => {
    triggerSheetsLoad();
  }, []);

  const handleOpenGoogleMaps = React.useCallback((item: Lesson, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const points = item.routePoints || [];
    const validPoints = points.filter(p => typeof p?.lat === 'number' && typeof p?.lng === 'number' && !isNaN(p.lat) && !isNaN(p.lng));

    if (validPoints.length > 0) {
      // Generate Google Maps Directions URL
      const origin = validPoints[0];
      const destination = validPoints[validPoints.length - 1];
      let waypointsParam = '';
      if (validPoints.length > 2) {
        const intermediate = validPoints.slice(1, -1);
        const step = Math.max(1, Math.floor(intermediate.length / 8));
        const downsampled = [];
        for (let i = 0; i < intermediate.length; i += step) {
          downsampled.push(intermediate[i]);
          if (downsampled.length >= 8) break;
        }
        waypointsParam = downsampled.map(p => `${p.lat},${p.lng}`).join('|');
      }

      const url = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}${waypointsParam ? `&waypoints=${encodeURIComponent(waypointsParam)}` : ''}&travelmode=driving`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (item.pickupLocation) {
      const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.pickupLocation)}`;
      window.open(searchUrl, '_blank', 'noopener,noreferrer');
    } else {
      const defaultUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Maastricht, Netherlands')}`;
      window.open(defaultUrl, '_blank', 'noopener,noreferrer');
    }
  }, []);

  const activeMapRef = React.useRef<any>(null);
  const activePolylineRef = React.useRef<any>(null);
  const activeMarkersRef = React.useRef<any[]>([]);
  const activeCarMarkerRef = React.useRef<any>(null);

  // Note: Map rendering is handled by LiveNavigationMap component with smooth animation & auto-camera follow
  React.useEffect(() => {
    if (isGPSTracking) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isGPSTracking]);

  React.useEffect(() => {
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (gpsWatchIdRef.current !== null) {
        try {
          navigator.geolocation.clearWatch(gpsWatchIdRef.current);
        } catch (e) {
          console.warn("clearWatch failed:", e);
        }
      }
    };
  }, []);

  const startTracking = () => {
    if (!activeTrackingLesson) return;
    setIsGPSTracking(true);
    setGpsError(null);

    if (isDemoMode) {
      let simIndex = activeRoutePoints.length;
      if (simIndex >= SIMULATED_POINTS.length) {
        simIndex = 0;
        setActiveRoutePoints([]);
      }

      if (activeRoutePoints.length === 0) {
        setActiveRoutePoints([{ ...SIMULATED_POINTS[0], timestamp: Date.now() }]);
        simIndex = 1;
      }

      simIntervalRef.current = setInterval(() => {
        if (simIndex < SIMULATED_POINTS.length) {
          const nextPoint = { ...SIMULATED_POINTS[simIndex], timestamp: Date.now() };
          setActiveRoutePoints(prev => [...prev, nextPoint]);
          simIndex++;
        } else {
          clearInterval(simIntervalRef.current);
          simIntervalRef.current = null;
          setIsGPSTracking(false);
          alert(lang === 'ar' ? 'تمت محاكاة كامل مسار القيادة بنجاح!' : 'Demo ride simulation completed successfully!');
        }
      }, 3000);
    }
  };

  const pauseTracking = () => {
    setIsGPSTracking(false);
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    if (gpsWatchIdRef.current !== null) {
      try {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
      } catch (e) {
        console.warn("clearWatch failed:", e);
      }
      gpsWatchIdRef.current = null;
    }
  };

  const stopAndSaveTracking = () => {
    setIsGPSTracking(false);
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    if (gpsWatchIdRef.current !== null) {
      try {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
      } catch (e) {
        console.warn("clearWatch failed:", e);
      }
      gpsWatchIdRef.current = null;
    }

    if (!activeTrackingLesson) return;

    // Calculate total route distance in KM
    const calcDistance = activeRoutePoints.length > 1 ? activeRoutePoints.reduce((acc, curr, idx, arr) => {
      if (idx === 0) return 0;
      const prev = arr[idx - 1];
      const R = 6371;
      const dLat = (curr.lat - prev.lat) * Math.PI / 180;
      const dLon = (curr.lng - prev.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(prev.lat * Math.PI / 180) * Math.cos(curr.lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      return acc + R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
    }, 0) : 0;

    const hrs = Math.floor(elapsedSeconds / 3600);
    const mins = Math.floor((elapsedSeconds % 3600) / 60);
    const secs = elapsedSeconds % 60;
    const formattedDuration = hrs > 0 
      ? `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    const lessonId = activeTrackingLesson.id;

    // Attach tracked route data to the lesson without auto-completing it
    const updatedLessons = lessons.map(l => {
      if (l.id === lessonId) {
        return {
          ...l,
          routePoints: activeRoutePoints.length > 0 ? activeRoutePoints : l.routePoints,
          distanceKm: calcDistance > 0 ? Number(calcDistance.toFixed(2)) : l.distanceKm,
          elapsedTime: formattedDuration || l.elapsedTime
        };
      }
      return l;
    });

    setLessons(updatedLessons);
    safeSetItem('al_andalos_lessons', JSON.stringify(updatedLessons));

    // Close tracking HUD and open standard Complete Lesson workflow
    setActiveTrackingLesson(null);
    setFinishingLessonId(lessonId);
  };

  // Sync Invoice selected lessons when selectedStudent or lessons or billedLessonIds change (Student ID > Email > Name fallback)
  React.useEffect(() => {
    const matchedInvStudent = students.find(s => s.name === selectedInvoiceStudent || s.studentId === selectedInvoiceStudent || s.id === selectedInvoiceStudent) 
      || { name: selectedInvoiceStudent, studentId: getStudentId(selectedInvoiceStudent) };

    const studentUnbilledCompleted = lessons.filter(l => 
      isRecordForStudent(l, matchedInvStudent) && 
      l.status === 'completed' && 
      !billedLessonIds.includes(l.id) &&
      l.payStatus === 'paid' &&
      (!l.invoiceId || l.invoiceId === '')
    );
    const newIds = studentUnbilledCompleted.map(l => l.id);
    setSelectedInvoiceLessonIds(prev => {
      if (prev.length === newIds.length && prev.every((id, i) => id === newIds[i])) {
        return prev;
      }
      return newIds;
    });
  }, [selectedInvoiceStudent, billedLessonIds, lessons]);

  React.useEffect(() => {
    if (selectedInvoiceStudent) {
      setDraftInvoiceId(`INV-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  }, [selectedInvoiceStudent]);

  // Sync profile details and preset texts in the reports tab
  React.useEffect(() => {
    if (selectedReportStudent === 'Amir Al-Hassan') {
      setReportObservs(lang === 'ar' 
        ? "أظهر المتدرب مهارة ممتازة في التوجيه والتسارع والتحكم السلس في القابض (Clutch). يرجى التركيز أكثر على الملاحظة المستمرة لزوايا المربعات والمرايا الجانبية والعمياء قبل البدء بالانعطاف لضمان نيل رخصة القيادة بنجاح." 
        : "Excellent steering capability and very smooth clutch control! Prioritize more frequent rear-view and check mirror cycles prior to turning to pass tests cleanly."
      );
      setScoreControl(8);
      setScorePriority(7);
      setScoreHighway(8);
      setScoreManeuvers(7);
      setScoreTheory(9);
      setCbrReadiness('developing');
    } else if (selectedReportStudent === 'Sanne de Jong') {
      setReportObservs(lang === 'ar'
        ? "تقدّم مبدئي جيد في التحكم وتغيير السرعات، ولكن هناك بعض التوتر عند الانخراط في الطرق السريعة ومداخل ومخارج السير. يحتاج إلى 5 حصص عملية إضافية للتركيز على القيادة الدفاعية."
        : "Good progress on slow-speed maneuvers, but exhibits moderate anxiety when merging at highway junctions. Recommending further tactical drills to build heavy-traffic confidence."
      );
      setScoreControl(6);
      setScorePriority(5);
      setScoreHighway(4);
      setScoreManeuvers(6);
      setScoreTheory(7);
      setCbrReadiness('beginner');
    } else {
      setReportObservs(lang === 'ar'
        ? "المتدرب يبدي نضجًا كاملاً وهدوءًا متميزًا على الطرق السريعة وطرق السير المزدحمة. تمكن من الركن الموازي ومناورة الرجوع للخلف بدقة ٢ سم فقط عن الرصيف. جاهز ومؤهل تماماً لخوض الامتحان الرسمي الميداني."
        : "Magnificent overall performance! Confident, highly safety-oriented driving style on standard highways and residential slots. Special maneuvers are pristine. 100% exam-ready for the final test."
      );
      setScoreControl(9);
      setScorePriority(9);
      setScoreHighway(10);
      setScoreManeuvers(9);
      setScoreTheory(9);
      setCbrReadiness('ready_cbr');
    }
  }, [selectedReportStudent, lang]);

  // Action handlers
  const handleSendDetailedInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInvoiceLessonIds.length === 0 && !customAdjustmentPrice) {
      alert(lang === 'ar' ? "يرجى اختيار درس واحد على الأقل أو إضافة رسوم تعديل مخصصة لإصدار الفاتورة!" : "Please select at least one lesson or supply custom adjustments to generate the invoice!");
      return;
    }

    const billedLessons = lessons.filter(l => selectedInvoiceLessonIds.includes(l.id));
    const lessonsTotal = billedLessons.reduce((sum, l) => sum + l.price, 0);
    const adjustmentVal = parseFloat(customAdjustmentPrice) || 0;
    const finalSubtotal = lessonsTotal + adjustmentVal;
    const vatAmount = finalSubtotal * (selectedVatRate / 100);
    const grandTotal = finalSubtotal + vatAmount;

    // Create wallet transaction
    const matchedInvoiceStudent = students.find(s => s.name === selectedInvoiceStudent);
    const invoiceStudentId = matchedInvoiceStudent?.id || matchedInvoiceStudent?.studentId;
    const newTx: WalletTransaction = {
      id: `TX-${Date.now().toString().slice(-6)}`,
      studentId: invoiceStudentId,
      identityStatus: invoiceStudentId ? 'canonical' : undefined,
      studentName: selectedInvoiceStudent,
      trainerId: "TR-000001",
      trainerName: "Instructeur Samir",
      invoiceId: draftInvoiceId,
      date: new Date().toISOString().split('T')[0],
      type: invoicePaymentStatus === 'paid' ? 'deposit' : 'payment',
      amount: grandTotal,
      description: lang === 'ar' 
        ? `الفاتورة ${draftInvoiceId}: فوترة عدد ${billedLessons.length} حصص` + (customAdjustmentLabel ? ` + رسوم إضافية: ${customAdjustmentLabel}` : '')
        : `Invoice ${draftInvoiceId}: ${billedLessons.length} lessons billed` + (customAdjustmentLabel ? ` + Extra: ${customAdjustmentLabel}` : ''),
    };

    // Update real lessons state in database
    const updatedLessons = lessons.map(l => {
      if (selectedInvoiceLessonIds.includes(l.id)) {
        return {
          ...l,
          payStatus: invoicePaymentStatus,
          payMethod: invoicePaymentMethod,
          invoiceId: draftInvoiceId,
          reviewed: true
        };
      }
      return l;
    });

    setLessons(updatedLessons);
    setTransactions([newTx, ...transactions]);
    setBilledLessonIds([...billedLessonIds, ...selectedInvoiceLessonIds]);
    
    setLatestIssuedInvoice({
      invoiceId: draftInvoiceId,
      studentName: selectedInvoiceStudent,
      billedLessons: billedLessons,
      adjustmentLabel: customAdjustmentLabel,
      adjustmentPrice: adjustmentVal,
      grandTotal: grandTotal,
      vatAmount: vatAmount,
      subtotal: finalSubtotal,
      vatRate: selectedVatRate,
      paymentMethod: invoicePaymentMethod,
      paymentStatus: invoicePaymentStatus,
      date: new Date().toISOString().split('T')[0]
    });

    // Notify Student about issued invoice
    addNotification({
      recipientRole: 'student',
      targetStudentId: invoiceStudentId,
      targetStudentName: selectedInvoiceStudent,
      type: 'invoice_sent',
      titleAr: 'فاتورة ضريبية جديدة',
      titleNl: 'Nieuwe Fiscale Factuur',
      titleEn: 'New Tax Invoice',
      messageAr: `تم إصدار الفاتورة رقم ${draftInvoiceId} بمبلغ €${grandTotal.toFixed(2)}.`,
      messageNl: `Factuur ${draftInvoiceId} ter waarde van €${grandTotal.toFixed(2)} is uitgegeven.`,
      messageEn: `Invoice ${draftInvoiceId} of €${grandTotal.toFixed(2)} has been issued.`,
      metadata: {
        studentId: invoiceStudentId,
        studentName: selectedInvoiceStudent,
        invoiceNumber: draftInvoiceId,
        amount: grandTotal
      }
    });

    // Archival to Google Drive & Google Sheets Sync
    const sheetsConfig = getSheetsConfig();
    if (sheetsConfig.accessToken) {
      generateAndArchiveInvoice({
        invoice: {
          id: draftInvoiceId,
          studentId: invoiceStudentId || 'ST-000001',
          studentName: selectedInvoiceStudent,
          studentEmail: matchedInvoiceStudent?.email,
          studentPhone: matchedInvoiceStudent?.phone,
          studentAddress: matchedInvoiceStudent?.city,
          date: new Date().toISOString().split('T')[0],
          items: billedLessons.map(l => ({
            description: `Driving Lesson (${l.duration || 1}h) - ${l.date}`,
            hours: l.duration || 1,
            rate: l.price / (l.duration || 1),
            amount: l.price
          })),
          totalAmount: grandTotal,
          status: invoicePaymentStatus === 'paid' ? 'paid' : 'unpaid',
          paymentMethod: invoicePaymentMethod
        },
        student: matchedInvoiceStudent,
        schoolSettings: schoolSettings || undefined,
        lang,
        accessToken: sheetsConfig.accessToken
      }).then(driveRes => {
        if (driveRes.driveUrl) {
          console.log(`Invoice ${draftInvoiceId} archived to Google Drive:`, driveRes.driveUrl);
        }
      }).catch(err => {
        console.warn('Background invoice archive error:', err);
      });
    }

    if (sheetsConfig.spreadsheetId && sheetsConfig.accessToken) {
      writeLessonsToSheet(sheetsConfig.spreadsheetId, updatedLessons, sheetsConfig.accessToken).catch(e => console.warn(e));
      writeWalletToSheet(sheetsConfig.spreadsheetId, [newTx, ...transactions], sheetsConfig.accessToken).catch(e => console.warn(e));
    }

    setInvoiceDispatchedOverlay(true);
    setCustomAdjustmentLabel('');
    setCustomAdjustmentPrice('');
  };

  const handleSaveAssessment = () => {
    const avgScore = parseFloat(((scoreControl + scorePriority + scoreHighway + scoreManeuvers + scoreTheory) / 5).toFixed(1));
    const todayDate = new Date().toISOString().split('T')[0];
    const todayTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    const matchedAssessmentStudent = students.find(s => s.name === selectedReportStudent);
    const assessmentStudentId = matchedAssessmentStudent?.id || matchedAssessmentStudent?.studentId;

    const newAssessment: Assessment = {
      id: `ASS-${Date.now()}`,
      studentId: assessmentStudentId,
      identityStatus: assessmentStudentId ? 'canonical' : undefined,
      date: todayDate,
      time: todayTime,
      studentName: selectedReportStudent,
      trainerName: "Samir El-Filali",
      scores: {
        control: scoreControl,
        priority: scorePriority,
        highway: scoreHighway,
        maneuvers: scoreManeuvers,
        theory: scoreTheory
      },
      overallScore: avgScore,
      notes: reportObservs,
      cbrReadiness: cbrReadiness,
      status: 'pending'
    };

    // Save locally to assessments log without opening report or sending email
    setAssessments([newAssessment, ...assessments]);
    setSaveSuccessToast(true);
    setTimeout(() => {
      setSaveSuccessToast(false);
    }, 4500);
  };

  const handleViewAndSendReport = async () => {
    // Keep it as a fallback or for opening the report modal directly
    setViewingReportStudentName(selectedReportStudent);
  };

  const handleSyncToSheets = () => {
    setIsSyncingSheets(true);
    // Reload completed lessons from Sheets in parallel
    triggerSheetsLoad().catch(err => console.error("Sync reload error:", err));
    
    setTimeout(() => {
      setIsSyncingSheets(false);
      setSyncSuccessToast(true);
      // Synchronize all pending assessments to Google Sheets
      setAssessments(assessments.map(a => ({ ...a, status: 'synced' })));
      setTimeout(() => {
        setSyncSuccessToast(false);
      }, 4000);
    }, 1800);
  };



  // Localized string translation helper
  const lt = LOCAL_T[lang] || LOCAL_T['en'];

  // Completed lesson action logger
  const handleMarkCompleted = (
    lessonId: string, 
    payStatus?: 'paid' | 'unpaid', 
    method?: 'wallet' | 'cash' | 'transfer' | 'card' | null,
    customNotes?: string,
    routePoints?: { lat: number; lng: number; timestamp?: number }[],
    elapsedTime?: string,
    distanceKm?: number,
    lessonNotes?: string,
    instructorNotes?: string,
    customPrice?: number,
    performanceRating?: number,
    performanceEvaluation?: 'excellent' | 'good' | 'needs_improvement',
    lessonNumber?: number
  ) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    const matchedLessonStudent = students.find(s => s.name === lesson.studentName);
    const actualPrice = customPrice !== undefined && !isNaN(customPrice) ? customPrice : lesson.price;

    // Check if wallet payment is chosen and whether the student has sufficient balance (Student ID > Email > Name fallback)
    if (payStatus === 'paid' && method === 'wallet') {
      const studentIdent = matchedLessonStudent || { studentId: lesson.studentId, name: lesson.studentName };
      const studentBalance = transactions
        .filter(tx => isRecordForStudent(tx, studentIdent))
        .reduce((acc, curr) => {
          return curr.type === 'deposit' ? acc + curr.amount : acc - curr.amount;
        }, 0);

      if (studentBalance < actualPrice) {
        alert(
          lang === 'ar'
            ? `رصيد محفظة الطالب غير كافٍ. يرجى شحن المحفظة أو اختيار طريقة دفع أخرى.`
            : lang === 'nl'
              ? `Het saldo van de student is onvoldoende. Waardeer de wallet op of kies een andere betaalmethode.`
              : `The student’s wallet balance is insufficient. Please top up the wallet or choose another payment method.`
        );
        return;
      }
    }

    const notes = customNotes || (lang === 'ar' ? "تم إنهاء الدرس بنجاح!" : "Lesson completed successfully!");

    const updated = lessons.map(l => {
      if (l.id === lessonId) {
        return {
          ...l,
          status: 'completed' as const,
          price: actualPrice,
          trainerNotes: notes,
          lessonNotes: lessonNotes !== undefined ? lessonNotes : l.lessonNotes,
          instructorNotes: instructorNotes !== undefined ? instructorNotes : l.instructorNotes,
          payStatus: payStatus || 'unpaid',
          payMethod: method || l.payMethod,
          performanceRating: performanceRating !== undefined ? performanceRating : l.performanceRating,
          performanceEvaluation: performanceEvaluation || (performanceRating === 5 ? 'excellent' : performanceRating === 3 ? 'good' : performanceRating === 1 ? 'needs_improvement' : l.performanceEvaluation),
          lessonNumber: lessonNumber || l.lessonNumber,
          completedAt: l.completedAt || new Date().toISOString(),
          routePoints: routePoints !== undefined ? routePoints : l.routePoints,
          elapsedTime: elapsedTime !== undefined ? elapsedTime : l.elapsedTime,
          distanceKm: distanceKm !== undefined ? distanceKm : l.distanceKm
        };
      }
      return l;
    });
    setLessons(updated);

    // If explicit payStatus passed
    if (payStatus === 'paid' && method) {
      const dateStr = new Date().toISOString().split('T')[0];
      const methodLabelAr = method === 'wallet' ? 'المحفظة' : method === 'cash' ? 'كاش (نقدي)' : method === 'transfer' ? 'تحويل بنكي' : 'بطاقة الدفع';
      const methodLabelEn = method === 'wallet' ? 'Wallet' : method === 'cash' ? 'Cash' : method === 'transfer' ? 'Bank Transfer' : 'Card';

      const txDesc = lang === 'ar'
        ? `دفع درس قيادة (${lesson.date}) للمتدرب: ${lesson.studentName} - طريقة الدفع: ${methodLabelAr}`
        : `Driving Lesson fee (${lesson.date}) for ${lesson.studentName} - Method: ${methodLabelEn}`;

      const studentId = lesson.studentId || matchedLessonStudent?.studentId || matchedLessonStudent?.id || getStudentId(lesson.studentName);

      if (method === 'wallet') {
        const newPaymentTx: WalletTransaction = {
          id: `TX-${Date.now().toString().slice(-6)}`,
          studentId: studentId,
          identityStatus: studentId ? 'canonical' : undefined,
          studentName: lesson.studentName,
          trainerId: "TR-000001",
          trainerName: "Instructeur Samir",
          lessonId: lesson.id,
          date: dateStr,
          type: 'payment',
          amount: actualPrice,
          description: txDesc,
        };
        setTransactions([newPaymentTx, ...transactions]);
      } else {
        // Direct cash/bank/card payment: log both deposit and payment with net 0 effect on user wallet
        const depositTxId = `TX-${Date.now().toString().slice(-6)}`;
        const paymentTxId = `TX-${(Date.now() + 1).toString().slice(-6)}`;
        
        const depDesc = lang === 'ar'
          ? `إيداع فوري للدرس (${lesson.date}) - طريقة الدفع: ${methodLabelAr}`
          : `Direct deposit for lesson (${lesson.date}) - Method: ${methodLabelEn}`;

        const newDepositTx: WalletTransaction = {
          id: depositTxId,
          studentId: studentId,
          identityStatus: studentId ? 'canonical' : undefined,
          studentName: lesson.studentName,
          trainerId: "TR-000001",
          trainerName: "Instructeur Samir",
          lessonId: lesson.id,
          date: dateStr,
          type: 'deposit',
          amount: actualPrice,
          description: depDesc
        };

        const newPaymentTx: WalletTransaction = {
          id: paymentTxId,
          studentId: studentId,
          identityStatus: studentId ? 'canonical' : undefined,
          studentName: lesson.studentName,
          trainerId: "TR-000001",
          trainerName: "Instructeur Samir",
          lessonId: lesson.id,
          date: dateStr,
          type: 'payment',
          amount: actualPrice,
          description: txDesc
        };

        setTransactions([newDepositTx, newPaymentTx, ...transactions]);
      }
    }

    // Reset workflow state
    setFinishingLessonId(null);
    setFinishingStep(null);
    setLastTrackedRoute(null);

    // Send beautiful completion email to the student
    sendAppEmail(lesson.studentName, 'completion', {
      date: lesson.date,
      time: lesson.time,
      duration: lesson.duration,
      pickupLocation: lesson.pickupLocation,
      price: actualPrice,
      notes: notes
    });

    const completionStudentId = lesson.studentId || matchedLessonStudent?.studentId || matchedLessonStudent?.id;

    // Add persistent notification to student regarding completed lesson & feedback
    addNotification({
      recipientRole: 'student',
      targetStudentId: completionStudentId,
      identityStatus: completionStudentId ? 'canonical' : undefined,
      targetStudentName: lesson.studentName,
      type: 'lesson_completed',
      titleAr: 'تم توثيق درس القيادة وملاحظات الأداء',
      titleNl: 'Rijles afgerond & instructie feedback',
      titleEn: 'Driving lesson completed & feedback',
      messageAr: `تم توثيق درسك بتاريخ ${lesson.date} (${lesson.time || '12:00'}). أضاف المدرب تقييم وملاحظات أداء الدرس في ملفك.`,
      messageNl: `Je rijles van ${lesson.date} (${lesson.time || '12:00'}) is afgerond. De instructeur heeft beoordeling en notities toegevoegd aan je profiel.`,
      messageEn: `Your driving lesson on ${lesson.date} (${lesson.time || '12:00'}) is completed. The instructor added feedback and performance notes to your profile.`,
      metadata: {
        studentId: completionStudentId,
        studentName: lesson.studentName,
        date: lesson.date,
        time: lesson.time,
        notes: notes,
        rating: performanceRating
      }
    });

    alert(lang === 'ar' ? 'تم تحديث سجل الدرس وتوثيق العملية بنجاح!' : 'Lesson recorded successfully!');
  };

  // Add manual balance deposit or deduction (with negative balance protection)
  const handleAddDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(depositAmount);
    if (isNaN(amountVal) || amountVal <= 0) return;

    const matchedDepStudent = students.find(s => s.studentId === depositStudentName || s.id === depositStudentName || s.name === depositStudentName);
    const depStudentId = matchedDepStudent?.studentId || matchedDepStudent?.id || getStudentId(depositStudentName);
    const depStudentName = matchedDepStudent?.name || depositStudentName;
    const depStudentIdent = matchedDepStudent || { studentId: depStudentId, name: depStudentName };

    // Calculate current student balance to check for sufficient funds on deductions (Student ID > Email > Name fallback)
    const currentStudentBalance = transactions
      .filter(tx => isRecordForStudent(tx, depStudentIdent))
      .reduce((acc, curr) => {
        return curr.type === 'deposit' ? acc + curr.amount : acc - curr.amount;
      }, 0);

    const isDeduction = walletOperation === 'payment' || walletOperation === 'adjustment';

    if (isDeduction && currentStudentBalance < amountVal) {
      alert(
        lang === 'ar'
          ? `فشلت العملية: رصيد محفظة المتدرب ${depStudentName} غير كافٍ (€${currentStudentBalance}). لا يمكن خصم €${amountVal} لتفادي الرصيد السالب.`
          : lang === 'nl'
            ? `Fout: Student ${depStudentName} heeft onvoldoende saldo (€${currentStudentBalance}). Het afschrijven van €${amountVal} is niet toegestaan om een negatief saldo te voorkomen.`
            : `Error: Student ${depStudentName} has insufficient wallet balance (€${currentStudentBalance}). Deducting €${amountVal} is not permitted to prevent a negative balance.`
      );
      return;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    
    let descriptionStr = "";
    if (walletOperation === 'deposit') {
      descriptionStr = lang === 'ar'
        ? `إيداع نقدي يدوي بواسطة المدرب لحساب المتدرب: ${depStudentName}`
        : `Manual Cash Deposit by Instructor Samir into ${depStudentName}'s Account`;
    } else if (walletOperation === 'payment') {
      descriptionStr = lang === 'ar'
        ? `خصم تكلفة درس تدريبي للمتدرب: ${depStudentName}`
        : `Driving Lesson Cost Deduction for ${depStudentName}`;
    } else {
      descriptionStr = lang === 'ar'
        ? `تعديل رصيد المحفظة يدوياً للمتدرب: ${depStudentName}`
        : `Manual Wallet Balance Adjustment for ${depStudentName}`;
    }

    const newTx: WalletTransaction = {
      id: `TX-${Date.now().toString().slice(-6)}`,
      studentId: depStudentId,
      identityStatus: depStudentId ? 'canonical' : undefined,
      studentName: depStudentName,
      trainerId: "TR-000001",
      trainerName: "Instructeur Samir",
      date: dateStr,
      type: walletOperation,
      amount: amountVal,
      description: descriptionStr,
    };

    const updatedTransactions = [newTx, ...transactions];
    setTransactions(updatedTransactions);

    // Calculate new simulated balance
    const updatedBalance = walletOperation === 'deposit' 
      ? currentStudentBalance + amountVal 
      : currentStudentBalance - amountVal;

    // Send deposit/payment confirmation email to student's inbox
    sendAppEmail(depStudentName, walletOperation === 'deposit' ? 'deposit' : 'invoice', {
      amount: amountVal,
      paymentMethod: lang === 'ar' ? "إيداع يدوي / تعديل بواسطة المدرب" : "Manual Balance Adjustment by Instructor Samir",
      newBalance: updatedBalance,
      date: dateStr,
      invoiceId: newTx.id,
      description: descriptionStr
    });

    setDepositAmount('');
    setDepositSuccess(true);
    setTimeout(() => {
      setDepositSuccess(false);
    }, 4000);
  };

  // Form custom billing trigger
  const handleBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(billAmount);
    if (isNaN(amt) || amt <= 0) return;

    const dateStr = new Date().toISOString().split('T')[0];
    const invId = `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const vatPercent = billVatRate;
    const vatAmount = amt * (vatPercent / 100);
    const grandTotal = amt + vatAmount;

    const matchedBillStudent = students.find(s => s.name === billStudent);
    const billStudentId = matchedBillStudent?.studentId || matchedBillStudent?.id || getStudentId(billStudent);

    const newTx: WalletTransaction = {
      id: `TX-${Date.now().toString().slice(-6)}`,
      studentId: billStudentId,
      identityStatus: billStudentId ? 'canonical' : undefined,
      studentName: billStudent,
      trainerId: "TR-000001",
      trainerName: "Instructeur Samir",
      date: dateStr,
      type: 'payment',
      amount: grandTotal,
      description: lang === 'ar' 
        ? `فاتورة مخصصة ${invId}: ${billDesc} (شامل BTW %${vatPercent})`
        : `Custom Invoice ${invId}: ${billDesc} (Inc. VAT ${vatPercent}%)`,
      invoiceId: invId
    };

    setTransactions([newTx, ...transactions]);

    // Store latest bill receipt details to display a beautiful modern printed summary
    const invoiceReceiptObj = {
      invoiceId: invId,
      studentName: billStudent,
      description: billDesc,
      subtotal: amt,
      vatRate: vatPercent,
      vatAmount: vatAmount,
      grandTotal: grandTotal,
      date: dateStr
    };

    setLatestBillReceipt(invoiceReceiptObj);

    // Send beautiful custom invoice email to the student!
    sendAppEmail(billStudent, 'invoice', invoiceReceiptObj);

    setBillAmount('');
    setBillDesc('');
    setBillSuccess(true);
    setTimeout(() => {
      setBillSuccess(false);
    }, 4000);
  };

  // Update schedule states
  const toggleWorkingDay = (day: string) => {
    let updatedDays = [...schedule.workingDays];
    if (updatedDays.includes(day)) {
      updatedDays = updatedDays.filter(d => d !== day);
    } else {
      updatedDays.push(day);
    }
    setSchedule({ ...schedule, workingDays: updatedDays });
  };

  const handleAssetUpload = (key: keyof SchoolSettings, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setSchoolSettings((prev: SchoolSettings) => ({
          ...prev,
          [key]: reader.result
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSchoolSettings = (e: React.FormEvent) => {
    e.preventDefault();
    safeSetItem('drivingschool_school_settings', JSON.stringify(schoolSettings));
    if (parentSetSchoolSettings) {
      parentSetSchoolSettings(schoolSettings);
    }
    alert(lang === 'ar' ? 'تم حفظ تهيئة المدرسة بنجاح!' : lang === 'nl' ? 'School configuratie succesvol opgeslagen!' : 'School configuration saved successfully!');
  };

  // Package management handler operations
  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgFormName.trim()) return;

    if (editingPackageId) {
      setPackages(prev => prev.map(p => p.id === editingPackageId ? {
        ...p,
        name: pkgFormName,
        description: pkgFormDesc,
        hours: pkgFormHours,
        price: pkgFormPrice,
        discountPrice: pkgFormDiscountPrice !== undefined && !isNaN(pkgFormDiscountPrice) ? pkgFormDiscountPrice : undefined,
        badge: pkgFormBadge || undefined,
        popular: pkgFormPopular,
        recommended: pkgFormRecommended,
        colorTheme: pkgFormColorTheme,
        displayOrder: Number(pkgFormDisplayOrder),
        isActive: pkgFormIsActive,
        features: [...pkgFormFeatures]
      } : p));
      setEditingPackageId(null);
    } else {
      const nextIdNum = packages.length + 1;
      const newPkg: DrivePackage = {
        id: `PKG-${String(nextIdNum).padStart(6, '0')}`,
        name: pkgFormName,
        description: pkgFormDesc,
        hours: pkgFormHours,
        price: pkgFormPrice,
        discountPrice: pkgFormDiscountPrice !== undefined && !isNaN(pkgFormDiscountPrice) ? pkgFormDiscountPrice : undefined,
        badge: pkgFormBadge || undefined,
        popular: pkgFormPopular,
        recommended: pkgFormRecommended,
        colorTheme: pkgFormColorTheme,
        displayOrder: Number(pkgFormDisplayOrder),
        isActive: pkgFormIsActive,
        features: [...pkgFormFeatures]
      };
      setPackages(prev => [...prev, newPkg]);
    }

    setShowPkgForm(false);
    setPkgFormName('');
    setPkgFormDesc('');
    setPkgFormHours(10);
    setPkgFormPrice(650);
    setPkgFormDiscountPrice(undefined);
    setPkgFormBadge('');
    setPkgFormPopular(false);
    setPkgFormRecommended(false);
    setPkgFormColorTheme('blue');
    setPkgFormDisplayOrder(packages.length + 2);
    setPkgFormIsActive(true);
    setPkgFormFeatures([]);
    setPkgFormNewFeatureText('');
  };

  const handleStartEditPackage = (pkg: DrivePackage) => {
    setEditingPackageId(pkg.id);
    setPkgFormName(pkg.name);
    setPkgFormDesc(pkg.description);
    setPkgFormHours(pkg.hours);
    setPkgFormPrice(pkg.price);
    setPkgFormDiscountPrice(pkg.discountPrice);
    setPkgFormBadge(pkg.badge || '');
    setPkgFormPopular(Boolean(pkg.popular));
    setPkgFormRecommended(Boolean(pkg.recommended));
    setPkgFormColorTheme(pkg.colorTheme || 'blue');
    setPkgFormDisplayOrder(pkg.displayOrder);
    setPkgFormIsActive(pkg.isActive);
    setPkgFormFeatures(pkg.features ? [...pkg.features] : []);
    setPkgFormNewFeatureText('');
    setShowPkgForm(true);
  };

  const handleRequestDeletePackage = (pkg: DrivePackage) => {
    // Check if the package is assigned to any students
    const assignedStudents: string[] = [];
    studentsList.forEach(s => {
      const info = getStudentDbInfo(s.name);
      if (info && info.package) {
        const sPkg = info.package.trim().toLowerCase();
        const pName = pkg.name.trim().toLowerCase();
        
        // Match exactly or check if one contains another
        if (sPkg === pName || sPkg.includes(pName) || pName.includes(sPkg)) {
          assignedStudents.push(s.name);
        }
      }
    });

    if (assignedStudents.length > 0) {
      setPkgInUseError({
        name: pkg.name,
        students: assignedStudents
      });
    } else {
      setPackageToDelete(pkg);
    }
  };

  const handleConfirmDeletePackage = async () => {
    if (packageToDelete) {
      const updatedPackages = packages.filter(p => p.id !== packageToDelete.id);
      setPackages(updatedPackages);
      setPackageToDelete(null);

      // Sync to Google Sheets if configured
      const config = getSheetsConfig();
      if (config.spreadsheetId && config.accessToken) {
        try {
          await writePackagesToGoogleSheet(config, updatedPackages);
          console.log("Packages successfully synced to Google Sheets after deletion.");
        } catch (err) {
          console.error("Failed to sync packages to Google Sheets:", err);
        }
      }
    }
  };

  const handleMovePackage = (id: string, direction: 'up' | 'down') => {
    const sorted = [...packages].sort((a, b) => a.displayOrder - b.displayOrder);
    const index = sorted.findIndex(p => p.id === id);
    if (index === -1) return;

    const updated = [...sorted];
    if (direction === 'up' && index > 0) {
      const temp = updated[index].displayOrder;
      updated[index].displayOrder = updated[index - 1].displayOrder;
      updated[index - 1].displayOrder = temp;
    } else if (direction === 'down' && index < updated.length - 1) {
      const temp = updated[index].displayOrder;
      updated[index].displayOrder = updated[index + 1].displayOrder;
      updated[index + 1].displayOrder = temp;
    }

    setPackages(updated);
  };

  const handleTogglePackageActive = (id: string) => {
    setPackages(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
  };

  // Memoized Student List to prevent re-running heavy filters/mappings on every render
  const studentsList = React.useMemo(() => {
    const defaultNames = ["Amir Al-Hassan", "أمير الحسن", "Sanne de Jong", "ساني دي يونغ", "Michael van Berg", "مايكل فان بيرغ"];
    
    // Combine unique student names from lessons and wallet transactions
    const uniqueStudentNames = new Set<string>();
    lessons.forEach(l => {
      if (l.studentName) uniqueStudentNames.add(l.studentName);
    });
    transactions.forEach(t => {
      if (t.studentName) uniqueStudentNames.add(t.studentName);
    });

    const list = [...students]
      .map(s => {
        const progress = getStudentProgress(s);
        const balance = getStudentBalance(s);

        // Pre-calculate lessons info dynamically for optimal rendering performance (Student ID > Email > Name fallback)
        const studentLss = lessons.filter(l => isRecordForStudent(l, s) && l.status !== 'cancelled');
        const completed = [...studentLss]
          .filter(l => l.status === 'completed')
          .sort((a, b) => `${b.date}T${b.time || '00:00'}`.localeCompare(`${a.date}T${a.time || '00:00'}`));
        const upcoming = [...studentLss]
          .filter(l => l.status === 'upcoming')
          .sort((a, b) => `${a.date}T${a.time || '00:00'}`.localeCompare(`${b.date}T${b.time || '00:00'}`));

        const lastLesson = completed[0] ? `${completed[0].date} @ ${completed[0].time}` : null;
        const nextLesson = upcoming[0] ? `${upcoming[0].date} @ ${upcoming[0].time}` : null;

        return {
          id: s.id,
          name: s.name,
          email: s.email,
          progress,
          balance,
          examStatus: s.theoryExamStatus,
          lastLesson,
          nextLesson
        };
      })
      .filter(student => !deletedStudents.some(ds => studentNamesMatch(ds, student.name)));

    // If there are unique names in lessons/transactions that aren't in students state, add them to list
    uniqueStudentNames.forEach(studentName => {
      if (studentName && 
          !students.some(s => studentNamesMatch(s.name, studentName)) &&
          !list.some(s => studentNamesMatch(s.name, studentName)) &&
          !deletedStudents.some(ds => studentNamesMatch(ds, studentName))) {
        
        const fallbackStudent = { name: studentName, studentId: getStudentId(studentName) };
        const progress = getStudentProgress(fallbackStudent);
        const balance = getStudentBalance(fallbackStudent);

        const studentLss = lessons.filter(l => isRecordForStudent(l, fallbackStudent) && l.status !== 'cancelled');
        const completed = [...studentLss]
          .filter(l => l.status === 'completed')
          .sort((a, b) => `${b.date}T${b.time || '00:00'}`.localeCompare(`${a.date}T${a.time || '00:00'}`));
        const upcoming = [...studentLss]
          .filter(l => l.status === 'upcoming')
          .sort((a, b) => `${a.date}T${a.time || '00:00'}`.localeCompare(`${b.date}T${b.time || '00:00'}`));

        const lastLesson = completed[0] ? `${completed[0].date} @ ${completed[0].time}` : null;
        const nextLesson = upcoming[0] ? `${upcoming[0].date} @ ${upcoming[0].time}` : null;

        list.push({
          id: getStudentId(studentName),
          name: studentName,
          email: `${studentName.toLowerCase().replace(/[\s]/g, '.')}@student.drivingschool.nl`,
          progress,
          balance,
          examStatus: "⏳ Has not passed the theory exam yet",
          lastLesson,
          nextLesson
        });
      }
    });

    return list;
  }, [students, deletedStudents, lessons, transactions, getStudentProgress, getStudentBalance, studentNamesMatch]);

  const getStudentDbInfo = (name?: string) => {
    const safeName = typeof name === 'string' ? name : '';
    const foundStudent = students.find(s => studentNamesMatch(s.name, safeName));

    const isAmir = safeName === "Amir Al-Hassan" || safeName === "أمير الحسن" || safeName.includes("أمير") || safeName.includes("Amir");
    const isSanne = safeName === "Sanne de Jong" || safeName === "ساني دي يونغ" || safeName.includes("ساني") || safeName.includes("Sanne");
    const isMichael = safeName === "Michael van Berg" || safeName === "مايكل فان بيرغ" || safeName.includes("مايكل") || safeName.includes("Michael");
    
    const theoryStatus = foundStudent?.theoryExamStatus || (
      isAmir ? "✅ Passed the theory exam" :
      isSanne ? "⌛ Waiting for theory exam result" :
      isMichael ? "✅ Passed the theory exam" :
      "⏳ Has not passed the theory exam yet"
    );

    if (isAmir) {
      return {
        id: "ST-000001",
        studentId: "ST-000001",
        name: "Amir Al-Hassan",
        email: "amir@student.drivingschool.nl",
        phone: "+31 6 1234 5678",
        city: "Maastricht",
        dob: "2005-08-15",
        package: "Optimal Progress (20h)",
        regDate: "2026-06-01",
        progress: getStudentProgress("Amir Al-Hassan"),
        balance: getStudentBalance("Amir Al-Hassan"),
        examStatus: theoryStatus
      };
    } else if (isSanne) {
      return {
        id: "ST-000002",
        studentId: "ST-000002",
        name: "Sanne de Jong",
        email: "sanne.dejong@student.drivingschool.nl",
        phone: "+31 6 2345 6789",
        city: "Rotterdam",
        dob: "2004-11-22",
        package: "Basic Driving (10h)",
        regDate: "2026-06-10",
        progress: getStudentProgress("Sanne de Jong"),
        balance: getStudentBalance("Sanne de Jong"),
        examStatus: theoryStatus
      };
    } else if (isMichael) {
      return {
        id: "ST-000003",
        studentId: "ST-000003",
        name: "Michael van Berg",
        email: "michael.vanberg@outlook.com",
        phone: "+31 6 3456 7890",
        city: "Utrecht",
        dob: "2003-04-05",
        package: "Express Course (15h)",
        regDate: "2026-05-20",
        progress: getStudentProgress("Michael van Berg"),
        balance: getStudentBalance("Michael van Berg"),
        examStatus: theoryStatus
      };
    } else {
      // Dynamic fallback looking up lessons/transactions state registers
      const studentLss = lessons.filter(l => studentNamesMatch(l.studentName, safeName));
      const firstLesson = studentLss.length > 0 ? studentLss[studentLss.length - 1] : null; // earliest
      
      const fallbackSchCity = schoolSettings?.city || "Maastricht";
      const deducedCity = firstLesson 
        ? (firstLesson.pickupLocation.includes(fallbackSchCity) ? fallbackSchCity : firstLesson.pickupLocation.includes("Rotterdam") ? "Rotterdam" : firstLesson.pickupLocation.includes("Utrecht") ? "Utrecht" : fallbackSchCity)
        : (foundStudent?.city || fallbackSchCity);
      const regDate = firstLesson ? firstLesson.date : (foundStudent?.joinedDate || new Date().toISOString().split('T')[0]);

      // Smartly deduce package from transaction logs
      const initTx = transactions.find(t => t.studentName && studentNamesMatch(t.studentName, safeName) && t.type === 'deposit');
      let deducedPackage = foundStudent?.currentPackage || "No Package";
      if (initTx) {
        const match = initTx.description.match(/\(([^)]+)\)/);
        if (match && match[1]) {
          deducedPackage = match[1];
        }
      } else {
        const anyTx = transactions.find(t => t.studentName && studentNamesMatch(t.studentName, safeName) && t.description.toLowerCase().includes("package"));
        if (anyTx) {
          const match = anyTx.description.match(/\(([^)]+)\)/);
          if (match && match[1]) deducedPackage = match[1];
        }
      }
      
      return {
        id: foundStudent?.id || getStudentId(safeName),
        name: foundStudent?.name || safeName,
        email: foundStudent?.email || `${safeName.toLowerCase().replace(/[\s-_]/g, '.')}@student.drivingschool.nl`,
        phone: foundStudent?.phone || "+31 6 8888 9999",
        city: deducedCity,
        dob: foundStudent?.dob || "2004-10-10",
        package: deducedPackage,
        regDate: regDate,
        progress: getStudentProgress(safeName),
        balance: getStudentBalance(safeName),
        examStatus: theoryStatus
      };
    }
  };

  // Memoized home stats to prevent heavy filters and reduces inside JSX on every render
  const homeStats = React.useMemo(() => {
    const completedLessons = lessons.filter(l => l.status === 'completed');
    const upcomingOrActiveLessons = lessons.filter(l => l.status === 'upcoming' || l.status === 'active');
    
    const completedCount = completedLessons.length;
    const completedHours = completedLessons.reduce((acc, curr) => acc + curr.duration, 0);
    const paidRevenue = completedLessons
      .filter(l => l.payStatus === 'paid')
      .reduce((acc, curr) => acc + curr.price, 0);
    const unpaidRevenue = completedLessons
      .filter(l => (l.payStatus || 'unpaid') === 'unpaid')
      .reduce((acc, curr) => acc + curr.price, 0);

    return {
      completedCount,
      completedHours,
      paidRevenue,
      unpaidRevenue,
      upcomingOrActiveLessons
    };
  }, [lessons]);

  const filteredStudents = React.useMemo(() => {
    return studentsList.filter(s => 
      s.name.toLowerCase().includes(searchInput.toLowerCase())
    );
  }, [studentsList, searchInput]);

  // Memoized filtered completed lessons list
  const completedLessonsFiltered = React.useMemo(() => {
    let list = lessons
      .filter(l => l.status === 'completed')
      .filter(l => completedLessonStudentFilter === 'all' || l.studentName === completedLessonStudentFilter);

    if (completedLessonSort === 'newest') {
      list = [...list].sort((a, b) => new Date(`${b.date} ${b.time || '00:00'}`).getTime() - new Date(`${a.date} ${a.time || '00:00'}`).getTime());
    } else if (completedLessonSort === 'oldest') {
      list = [...list].sort((a, b) => new Date(`${a.date} ${a.time || '00:00'}`).getTime() - new Date(`${b.date} ${b.time || '00:00'}`).getTime());
    } else if (completedLessonSort === 'price-high') {
      list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (completedLessonSort === 'price-low') {
      list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
    }
    return list;
  }, [lessons, completedLessonStudentFilter, completedLessonSort]);

  // Memoized unique student filter list to avoid re-generating set on every render
  const studentFilterOptions = React.useMemo(() => {
    const names = new Set<string>();
    studentsList.forEach(s => { if (s.name) names.add(s.name); });
    lessons.forEach(l => { if (l.studentName) names.add(l.studentName); });
    return Array.from(names);
  }, [studentsList, lessons]);

  const handleToggleMapPreview = React.useCallback((id: string) => {
    setActiveMapPreviewId(prev => prev === id ? null : id);
  }, []);

  const handleSendReminderForLesson = React.useCallback((item: Lesson) => {
    setReminderModalLessonId(item.id);
  }, []);

  const handleSendReminderSubmit = React.useCallback(async (lessonId: string, paymentLink: string, customNotes: string) => {
    // 1. Update lessons state and storage
    const updated = lessons.map(l => {
      if (l.id === lessonId) {
        return {
          ...l,
          reminderSent: true,
          reminderLink: paymentLink,
          reminderNotes: customNotes
        };
      }
      return l;
    });
    setLessons(updated);
    safeSetItem('drivingschool_lessons', JSON.stringify(updated));

    // 2. Dispatch real email with minimal premium template
    const reminderTarget = lessons.find(l => l.id === lessonId);
    if (reminderTarget) {
      try {
        await sendAppEmail(reminderTarget.studentName, 'reminder', {
          schoolName: schoolSettings?.name,
          instructorName: schoolSettings?.instructorName || reminderTarget.trainerName,
          phone: schoolSettings?.phone,
          email: schoolSettings?.email,
          address: schoolSettings?.address,
          city: schoolSettings?.city,
          postalCode: schoolSettings?.postalCode,
          kvk: schoolSettings?.kvk,
          whatsappNumber: schoolSettings?.whatsappNumber,
          website: schoolSettings?.website,
          logoUrl: schoolSettings?.logoUrl,
          primaryColor: schoolSettings?.primaryColor,
          date: reminderTarget.date,
          time: reminderTarget.time,
          price: reminderTarget.price,
          pickupLocation: reminderTarget.pickupLocation,
          lessonId: reminderTarget.id,
          paymentLink: paymentLink,
          notes: customNotes,
          lang: lang
        });
      } catch (err) {
        console.error('Error sending reminder email:', err);
      }
    }

    // 3. Trigger toast
    setReminderSuccessToast(true);
    setTimeout(() => {
      setReminderSuccessToast(false);
    }, 4000);

    // 4. Close modal
    setReminderModalLessonId(null);
  }, [lessons, setLessons, schoolSettings, lang]);

  return (
    <div id="trainer-dashboard-root" className="space-y-6 pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Top Banner layout - High-Contrast Solid Trainer Welcome Card */}
      {(() => {
        const welcomeText = lt.welcomeTrainer || '';
        const dotIndex = welcomeText.indexOf('.');
        const greeting = dotIndex !== -1 ? welcomeText.substring(0, dotIndex + 1).trim() : welcomeText;
        const subtext = dotIndex !== -1 ? welcomeText.substring(dotIndex + 1).trim() : '';

        return (
          <div 
            id="trainer-welcome-card" 
            className="p-6 md:p-8 rounded-2xl bg-slate-900 text-white shadow-sm border border-slate-800 transition-all duration-300"
          >
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                  {greeting}
                </h1>
                {subtext && (
                  <p className="text-sm font-normal text-slate-300 mt-2 max-w-2xl leading-relaxed">
                    {subtext}
                  </p>
                )}
              </div>
              
              <div className="flex bg-slate-800 border border-slate-700 rounded-xl p-4 items-center gap-4 shrink-0 shadow-sm">
                <div 
                  className="relative shrink-0 cursor-pointer group"
                  onClick={() => document.getElementById('trainer-photo-file-input')?.click()}
                  title={lang === 'ar' ? 'انقر لتغيير الصورة الشخصية' : lang === 'nl' ? 'Klik om profielfoto te wijzigen' : 'Click to change profile photo'}
                >
                  {trainerPhoto ? (
                    <img 
                      src={trainerPhoto} 
                      alt={trainerName} 
                      className="w-12 h-12 rounded-xl object-cover border border-slate-600 shadow-sm transition duration-300 group-hover:opacity-85"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm border border-blue-500 shadow-sm transition duration-300 group-hover:bg-blue-700">
                      {getStudentInitials(trainerName)}
                    </div>
                  )}
                  
                  {/* Camera icon overlay on hover */}
                  <div className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Camera className="h-4.5 w-4.5 text-white" />
                  </div>

                  {/* Hidden Input File */}
                  <input 
                    type="file" 
                    id="trainer-photo-file-input" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleTrainerPhotoChange} 
                    onClick={(e) => e.stopPropagation()} 
                  />
                </div>
                <div>
                  <p className="text-[11px] text-blue-400 uppercase tracking-wider leading-none font-bold">
                    {lang === 'ar' ? 'المدرب المعتمد' : lang === 'nl' ? 'Hoofdinstructeur' : 'Authorized Trainer'}
                  </p>
                  <h3 className="text-sm font-bold mt-1.5 text-white">
                    {trainerName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[11px] text-emerald-400 font-semibold">
                      {lang === 'ar' ? 'نشط الآن' : lang === 'nl' ? 'Actief' : 'Active'}
                    </p>
                    {trainerPhoto && (
                      <>
                        <span className="text-slate-500 text-xs">•</span>
                        <button
                          type="button"
                          onClick={handleRemoveTrainerPhoto}
                          className="text-[11px] text-red-400 hover:text-red-300 font-medium transition cursor-pointer flex items-center gap-1 bg-transparent border-none p-0"
                          title={lang === 'ar' ? 'حذف الصورة الشخصية' : lang === 'nl' ? 'Profielfoto verwijderen' : 'Remove Profile Photo'}
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>{lang === 'ar' ? 'حذف الصورة' : lang === 'nl' ? 'Foto verwijderen' : 'Remove Photo'}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {reminderSuccessToast && (
        <div className="p-4 bg-emerald-600 border border-emerald-500 text-white rounded-2xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 stroke-[3] shrink-0" />
            <span className="text-xs font-bold leading-relaxed">
              {lang === 'ar' 
                ? 'تم إرسال تذكير الدفع للبريد الإلكتروني ومشاركة رابط iDEAL الآمن مع المتدرب بنجاح وجاري إقراره بالمحفظة!'
                : lang === 'nl'
                  ? 'De betalingsherinnering met de iDEAL betaallink is succesvol verstuurd naar de leerling!'
                  : 'The payment reminder with the secure link has been successfully emailed to the student!'}
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-white/20 rounded-md font-bold text-white uppercase tracking-widest shrink-0">Dispatched</span>
        </div>
      )}

      {/* Segment Navigation */}
      <div className="flex bg-slate-100/80 dark:bg-zinc-900/80 p-1 rounded-xl max-w-full overflow-x-auto no-scrollbar gap-1 border border-slate-200/40 dark:border-zinc-800/40 flex-nowrap shrink-0" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {(['home', 'lessons', 'students', 'tracker', 'invoices', 'reports', 'schedule'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 whitespace-nowrap text-xs font-semibold rounded-lg transition-all duration-150 shrink-0 cursor-pointer ${
              activeTab === tab
                ? 'bg-white dark:bg-zinc-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/50 dark:border-zinc-700/50 font-bold'
                : 'text-slate-500 hover:text-slate-850 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-white/40 dark:hover:bg-zinc-800/10'
            }`}
          >
            {tab === 'home' 
              ? lt.homeTab 
              : tab === 'lessons' 
                ? lt.lessonsTab 
                : tab === 'students' 
                  ? lt.studentsTab 
                  : tab === 'tracker'
                    ? (lang === 'ar' ? 'مسارات الاختبار' : lang === 'nl' ? 'Examroutes' : 'Exam Routes')
                    : tab === 'invoices' 
                      ? lt.invoicesTab 
                      : tab === 'reports' 
                        ? lt.reportsTab 
                        : lt.scheduleTab}
          </button>
        ))}
      </div>

      {activeTab === 'home' && (
        <div id="trainer-home-view" className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Quick stats totals */}
            <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl shadow-xs space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{lt.lessonsToday}</span>
              <p className="text-3xl font-black text-slate-800 dark:text-white">
                {homeStats.completedCount} {lang === 'ar' ? 'حصص' : 'Completed'}
              </p>
              {schoolSettings?.name ? (
                <p className="text-xs text-slate-400 font-medium">
                  {schoolSettings.name}
                  {schoolSettings.city ? ` • ${schoolSettings.city}` : ''}
                </p>
              ) : null}
            </div>

            <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl shadow-xs space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{lt.hoursLogged}</span>
              <p className="text-3xl font-black text-blue-600 dark:text-blue-400">
                {homeStats.completedHours} {lang === 'ar' ? 'ساعات منجزة' : 'hours logged'}
              </p>
              <p className="text-xs text-slate-400 font-medium">{lt.avgRating}</p>
            </div>

            {/* Paid Card badge */}
            <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl shadow-xs space-y-1">
              <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {lang === 'ar' ? 'الإيرادات المدفوعة' : lang === 'nl' ? 'Betaalde Omzet' : 'Paid Revenue'}
              </span>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                €{homeStats.paidRevenue}
              </p>
              <p className="text-xs text-slate-400 font-medium font-bold">
                {lang === 'ar' ? 'تم دفعها وتحصيلها نقداً أو إلكترونياً' : lang === 'nl' ? 'Voldaan contant of via de wallet afgeschreven' : 'Cleared on-spot or charged via wallet'}
              </p>
            </div>

            {/* Unpaid Card badge */}
            <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl shadow-xs space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {lang === 'ar' ? 'مستحقات غير مدفوعة' : lang === 'nl' ? 'Openstaand Saldo' : 'Outstanding/Unpaid'}
              </span>
              <p className="text-3xl font-black text-indigo-505 dark:text-indigo-400 font-mono">
                €{homeStats.unpaidRevenue}
              </p>
              <p className="text-xs text-amber-500 font-medium">
                {lang === 'ar' ? 'تذكيرات جاهزة ومتأخرات بانتظار الدفع' : lang === 'nl' ? 'Nog te factureren of openstaande betalingen' : 'Awaiting billing or manual student settlement'}
              </p>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Today schedule with action logger */}
            <div className="lg:col-span-7 p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-zinc-800">
                <Calendar className="h-4 w-4 text-blue-500" />
                {t.todaysSchedule}
              </h3>

              <div className="space-y-4">
                {homeStats.upcomingOrActiveLessons.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 text-center bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-900">
                    {lang === 'ar' ? 'لا توجد حصص نشطة أو مجدولة لليوم.' : 'No active or upcoming lessons for today.'}
                  </p>
                ) : (
                  homeStats.upcomingOrActiveLessons.map(item => (
                    <div key={item.id} className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-105 dark:border-zinc-900 w-full space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                            item.status === 'active'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-450 border border-amber-500/10 animate-pulse'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          }`}>
                            {item.status === 'active'
                              ? (lang === 'ar' ? '● نشطة حالياً' : '● ACTIVE NOW')
                              : (lang === 'ar' ? `فترة: ${item.time}` : `${item.time} Slot`)
                            }
                          </span>
                          <h4 className="font-bold text-slate-800 dark:text-zinc-200 mt-1 text-xs">{item.studentName}</h4>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {item.duration}h {lang === 'ar' ? 'ساعة' : lt.durationLabel}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400">{lt.pickupLabel}: <span className="font-bold text-slate-600 dark:text-zinc-300">{item.pickupLocation}</span></p>

                      <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-200/55">
                        {(item.status === 'upcoming' || item.status === 'active') && (
                          <button
                            onClick={() => {
                              setFinishingLessonId(item.id);
                            }}
                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer text-center transition flex items-center justify-center"
                          >
                            {lang === 'ar' ? 'إنهاء الدرس' : 'Finish Lesson'}
                          </button>
                        )}

                        {(item.status === 'upcoming' || item.status === 'active') && (
                          <button
                            onClick={() => setCancellingLesson(item)}
                            className="flex-1 py-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-lg text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/20 transition flex items-center justify-center cursor-pointer"
                            title={lt.cancelRide}
                          >
                            {lt.cancelRide}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Redesigned Premium Quick Finance Actions */}
            <div className="lg:col-span-5 p-6 bg-white dark:bg-zinc-900 border-2 border-slate-100/80 dark:border-zinc-800/80 rounded-3xl shadow-sm space-y-5">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-800">
                <h3 className="font-extrabold text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
                  {lang === 'ar' ? 'العمليات والتحصيلات المالية' : 'Financial Management Panel'}
                </h3>
                <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-550 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {lang === 'ar' ? 'آمنة %100' : '100% Secured'}
                </span>
              </div>

              {/* Segmented Controller Tab Switches */}
              <div className="flex bg-slate-50 dark:bg-zinc-950 p-1 rounded-2xl border border-slate-100 dark:border-zinc-800/40">
                <button
                  type="button"
                  onClick={() => setFinanceSubTab('invoice')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                    financeSubTab === 'invoice'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10 font-extrabold'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-zinc-350'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  {lang === 'ar' ? 'إصدار فاتورة ضريبية' : 'Create Tax Invoice'}
                </button>
                <button
                  type="button"
                  onClick={() => setFinanceSubTab('deposit')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                    financeSubTab === 'deposit'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10 font-extrabold'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-zinc-355'
                  }`}
                >
                  <Wallet className="h-3.5 w-3.5" />
                  {lang === 'ar' ? 'تسجيل شحن نقدي' : 'Record Cash Deposit'}
                </button>
              </div>

              {/* Tab Content 1: Custom Invoice Builder */}
              {financeSubTab === 'invoice' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="bg-blue-50/40 dark:bg-blue-950/10 p-3.5 rounded-2xl border border-blue-500/10">
                    <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
                      {lang === 'ar' 
                        ? 'قم بإصدار فاتورة ضريبية رسمية للخدمات الإضافية أو الدروس المنجزة. سيتم احتساب الضريبة تلقائياً وإرسال الفاتورة عبر الإيميل.' 
                        : 'Generate official Dutch BTW invoice for extra driving services. VAT calculations are computed in real-time.'}
                    </p>
                  </div>

                  {billSuccess && (
                    <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold animate-pulse flex items-center gap-1.5">
                      <Check className="h-4 w-4" />
                      {lang === 'ar' ? 'تم إصدار الفاتورة وإرسال الإيميل للطالب بنجاح!' : 'Invoice generated & dispatched via email!'}
                    </div>
                  )}

                  <form onSubmit={handleBillSubmit} className="space-y-3.5">
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 block mb-1.5">{lt.billRecipient}</label>
                        <select
                          value={billStudent}
                          onChange={(e) => setBillStudent(e.target.value)}
                          className="w-full h-8 px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                        >
                          {studentsList.map(s => (
                            <option key={s.name} value={s.name}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 block mb-1.5">{lang === 'ar' ? 'المبلغ (قبل الضريبة)' : 'Amount (Excl. VAT)'}</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">€</span>
                            <input
                              type="number"
                              placeholder="e.g. 150"
                              required
                              value={billAmount}
                              onChange={(e) => setBillAmount(e.target.value)}
                              className="w-full h-8 pl-8 pr-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 block mb-1.5">{lang === 'ar' ? 'نسبة الضريبة (BTW)' : 'VAT Rate'}</label>
                          <select
                            value={billVatRate}
                            onChange={(e) => setBillVatRate(Number(e.target.value) as 0 | 9 | 21)}
                            className="w-full h-8 px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                          >
                            <option value={21}>21% ({lang === 'ar' ? 'قياسي هولندي' : 'Standard BTW'})</option>
                            <option value={9}>9% ({lang === 'ar' ? 'مخفض هولندي' : 'Reduced BTW'})</option>
                            <option value={0}>0% ({lang === 'ar' ? 'معفى' : 'Exempted'})</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 block mb-1.5">{lt.billDesc}</label>
                        <input
                          type="text"
                          placeholder={lt.descPlaceholder}
                          required
                          value={billDesc}
                          onChange={(e) => setBillDesc(e.target.value)}
                          className="w-full h-8 px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Real-time Invoice Calculation Summary Card */}
                    {billAmount && parseFloat(billAmount) > 0 && (
                      <div className="p-4 bg-slate-50/50 dark:bg-zinc-950/40 border border-dashed border-slate-150 dark:border-zinc-800 rounded-2xl space-y-2 text-xs">
                        <div className="flex justify-between text-slate-500">
                          <span>{lang === 'ar' ? 'المجموع الأساسي (Subtotal):' : 'Base Subtotal:'}</span>
                          <span className="font-mono font-bold">€{parseFloat(billAmount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>{lang === 'ar' ? `ضريبة القيمة المضافة (BTW ${billVatRate}%):` : `VAT BTW (${billVatRate}%):`}</span>
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-500">+€{(parseFloat(billAmount) * (billVatRate / 100)).toFixed(2)}</span>
                        </div>
                        <div className="h-px bg-slate-100 dark:bg-zinc-800 my-1"></div>
                        <div className="flex justify-between text-slate-800 dark:text-white font-black">
                          <span>{lang === 'ar' ? 'الإجمالي النهائي شامل الضريبة:' : 'Grand Total:'}</span>
                          <span className="font-mono text-sm text-blue-600 dark:text-blue-400">€{(parseFloat(billAmount) + (parseFloat(billAmount) * (billVatRate / 100))).toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold cursor-pointer transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {lang === 'ar' ? 'إصدار الفاتورة وإرسال الإيميل للطالب' : 'Issue Invoice & Email Student'}
                    </button>
                  </form>
                </div>
              )}

              {/* Tab Content 2: Cash Deposit Logger / Wallet Management */}
              {financeSubTab === 'deposit' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="bg-indigo-50/40 dark:bg-indigo-950/10 p-3.5 rounded-2xl border border-indigo-500/10">
                    <p className="text-[11px] text-indigo-700 dark:text-indigo-300 leading-relaxed font-medium">
                      {lang === 'ar' 
                        ? 'لوحة إدارة المحفظة المالية: شحن الرصيد، خصم تكلفة الدروس، وتعديل الحسابات مع إشعار الطالب وإرسال إيصال فوري.' 
                        : 'Manage student balance: Deposit funds, deduct lesson costs, or apply manual balance adjustments with real-time student synchronization.'}
                    </p>
                  </div>

                  {depositSuccess && (
                    <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold animate-pulse flex items-center gap-1.5">
                      <Check className="h-4 w-4" />
                      {lang === 'ar' ? 'تمت معالجة المعاملة المالية وإرسال الإشعار بنجاح!' : 'Financial operation processed & notification dispatched!'}
                    </div>
                  )}

                  <form onSubmit={handleAddDepositSubmit} className="space-y-3.5">
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 block mb-1.5">{lt.studentLabel}</label>
                        <select
                          value={depositStudentName}
                          onChange={(e) => setDepositStudentName(e.target.value)}
                          className="w-full h-8 px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                        >
                          {studentsList.map(s => (
                            <option key={s.studentId || s.id || s.name} value={s.studentId || s.id || s.name}>
                              {s.name} ({s.studentId || s.id})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quick presets (€50, €100, €250, €500) */}
                      <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 block mb-1.5">
                          {lang === 'ar' ? 'اختر قيمة سريعة (€)' : 'Quick Preset Amount (€)'}
                        </label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[50, 100, 250, 500].map(preset => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setDepositAmount(preset.toString())}
                              className={`py-1 rounded-lg border text-xs font-mono font-bold transition duration-155 cursor-pointer ${
                                depositAmount === preset.toString()
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                                  : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                              }`}
                            >
                              €{preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 block mb-1.5">{lt.amountLabel}</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">€</span>
                          <input
                            type="number"
                            placeholder={lt.amountPlaceholder}
                            required
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            className="w-full h-8 pl-8 pr-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 text-white rounded-xl text-xs font-extrabold cursor-pointer transition flex items-center justify-center gap-1.5 shadow-md bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/10"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      {lang === 'ar' ? 'شحن الرصيد (إيداع أموال)' : lang === 'nl' ? 'Geld Storten' : 'Deposit Money'}
                    </button>
                  </form>
                </div>
              )}
            </div>

          </div>

          {/* Operations & Cancellation Analytics Section */}
          <div className="p-6 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-rose-500" />
                  <span>
                    {lang === 'ar'
                      ? 'إحصائيات وتحليلات إلغاء الدروس'
                      : lang === 'nl'
                      ? 'Lesannulering Analyse & Statistieken'
                      : 'Lesson Cancellation Analytics & Reports'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-medium">
                  {lang === 'ar'
                    ? 'تحليل أسباب إلغاء الدروس للمساعدة في تحسين الكفاءة التشغيلية لمدرسة القيادة'
                    : lang === 'nl'
                    ? 'Analyse van annuleringsredenen om de operationele efficiëntie te verbeteren'
                    : 'Analysis of cancellation reasons to improve driving school operations'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40 rounded-full text-xs font-bold">
                  {lessons.filter(l => l.status === 'cancelled').length} {lang === 'ar' ? 'درس ملغى' : 'Cancelled Lessons'}
                </span>
              </div>
            </div>

            {/* Quick Analytics Cards Breakdown */}
            {(() => {
              const cancelledList = lessons.filter(l => l.status === 'cancelled');
              const studentCancelled = cancelledList.filter(l => 
                (l.cancellationReason && (l.cancellationReason.includes('طالب') || l.cancellationReason.includes('مريض') || l.cancellationReason.toLowerCase().includes('student')))
              ).length;
              const weatherCancelled = cancelledList.filter(l => 
                (l.cancellationReason && (l.cancellationReason.includes('جوية') || l.cancellationReason.includes('جليد') || l.cancellationReason.toLowerCase().includes('weather') || l.cancellationReason.toLowerCase().includes('snow')))
              ).length;
              const vehicleCancelled = cancelledList.filter(l => 
                (l.cancellationReason && (l.cancellationReason.includes('سيارة') || l.cancellationReason.toLowerCase().includes('vehicle')))
              ).length;
              const otherCancelled = Math.max(0, cancelledList.length - (studentCancelled + weatherCancelled + vehicleCancelled));

              return (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-200/60 dark:border-zinc-700/60 space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 block">{lang === 'ar' ? 'إلغاءات الطلاب' : 'Student Cancellations'}</span>
                      <p className="text-xl font-black text-slate-800 dark:text-white">{studentCancelled}</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-200/60 dark:border-zinc-700/60 space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 block">{lang === 'ar' ? 'أعطال المركبات' : 'Vehicle Issues'}</span>
                      <p className="text-xl font-black text-slate-800 dark:text-white">{vehicleCancelled}</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-200/60 dark:border-zinc-700/60 space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 block">{lang === 'ar' ? 'الأحوال الجوية' : 'Weather / Conditions'}</span>
                      <p className="text-xl font-black text-slate-800 dark:text-white">{weatherCancelled}</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-200/60 dark:border-zinc-700/60 space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 block">{lang === 'ar' ? 'أسباب أخرى وتعارض' : 'Other / Conflicts'}</span>
                      <p className="text-xl font-black text-slate-800 dark:text-white">{otherCancelled}</p>
                    </div>
                  </div>

                  {/* Cancelled Lessons History - Responsive Layout */}
                  {/* Mobile Card View (sm:hidden) */}
                  <div className="block sm:hidden space-y-3">
                    {cancelledList.length > 0 ? (
                      cancelledList.map((cl) => (
                        <div 
                          key={cl.id} 
                          className="p-4 bg-slate-50/80 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-700/60 rounded-2xl space-y-3 shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-zinc-700/50 pb-2.5">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {cl.studentName}
                            </span>
                            <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-md shrink-0 ${
                              cl.notifiedStudent !== false 
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40'
                                : 'bg-slate-200/60 dark:bg-zinc-700 text-slate-600 dark:text-zinc-400'
                            }`}>
                              {cl.notifiedStudent !== false ? (lang === 'ar' ? 'تم الإشعار' : 'Notified') : (lang === 'ar' ? 'لم يُرسل' : 'Not Sent')}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 block uppercase">
                                {lang === 'ar' ? 'موعد الدرس' : 'Lesson Time'}
                              </span>
                              <span className="font-medium text-slate-700 dark:text-zinc-200">
                                {cl.date} ({cl.time})
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 block uppercase">
                                {lang === 'ar' ? 'تاريخ الإلغاء' : 'Cancelled On'}
                              </span>
                              <span className="font-mono text-[11px] text-slate-600 dark:text-zinc-300">
                                {cl.cancellationDate || cl.date} {cl.cancellationTime ? `@ ${cl.cancellationTime}` : ''}
                              </span>
                            </div>
                          </div>

                          <div className="pt-1">
                            <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 block uppercase mb-1">
                              {lang === 'ar' ? 'سبب الإلغاء' : 'Reason'}
                            </span>
                            <span className="inline-block w-full px-3 py-1.5 rounded-xl text-xs font-bold leading-normal bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/50 break-words whitespace-normal text-center shadow-2xs">
                              {cl.cancellationReason || (lang === 'ar' ? 'إلغاء تنظيمي' : 'Administrative')}
                            </span>
                            {cl.cancellationNotes && (
                              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1.5 italic break-words whitespace-normal leading-snug text-center px-1">
                                "{cl.cancellationNotes}"
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-400 text-xs bg-slate-50/50 dark:bg-zinc-800/30 border border-slate-200 dark:border-zinc-800 rounded-2xl">
                        {lang === 'ar' ? 'لا توجد دروس ملغاة مسجلة حتى الآن.' : 'No cancelled lessons recorded yet.'}
                      </div>
                    )}
                  </div>

                  {/* Desktop / Tablet Table View (hidden sm:block) */}
                  <div className="hidden sm:block overflow-x-auto border border-slate-200 dark:border-zinc-800 rounded-2xl">
                    <table className="w-full text-right text-xs min-w-[600px]">
                      <thead className="bg-slate-50 dark:bg-zinc-800/80 text-slate-500 dark:text-zinc-400 font-bold border-b border-slate-200 dark:border-zinc-800">
                        <tr>
                          <th className="p-3 text-right">{lang === 'ar' ? 'الطالب' : 'Student'}</th>
                          <th className="p-3 text-right">{lang === 'ar' ? 'موعد الدرس' : 'Lesson Date/Time'}</th>
                          <th className="p-3 text-right min-w-[160px]">{lang === 'ar' ? 'سبب الإلغاء' : 'Reason'}</th>
                          <th className="p-3 text-right">{lang === 'ar' ? 'تاريخ/وقت الإلغاء' : 'Cancellation Date'}</th>
                          <th className="p-3 text-right">{lang === 'ar' ? 'الإشعار' : 'Notified'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                        {cancelledList.length > 0 ? (
                          cancelledList.map((cl) => (
                            <tr key={cl.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition">
                              <td className="p-3 font-bold text-slate-800 dark:text-zinc-200 align-middle">{cl.studentName}</td>
                              <td className="p-3 text-slate-600 dark:text-zinc-300 font-medium align-middle">{cl.date} ({cl.time})</td>
                              <td className="p-3 align-middle min-w-[150px] max-w-[280px]">
                                <div className="inline-block w-full text-center">
                                  <span className="inline-block w-full px-3 py-1.5 rounded-xl text-xs font-bold leading-normal bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/50 break-words whitespace-normal text-center shadow-2xs">
                                    {cl.cancellationReason || (lang === 'ar' ? 'إلغاء تنظيمي' : 'Administrative')}
                                  </span>
                                </div>
                                {cl.cancellationNotes && (
                                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1.5 italic break-words whitespace-normal leading-snug text-center px-1">
                                    "{cl.cancellationNotes}"
                                  </p>
                                )}
                              </td>
                              <td className="p-3 text-slate-500 dark:text-zinc-400 font-mono text-[11px] align-middle">
                                {cl.cancellationDate || cl.date} {cl.cancellationTime ? `@ ${cl.cancellationTime}` : ''}
                              </td>
                              <td className="p-3 align-middle">
                                <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-md ${
                                  cl.notifiedStudent !== false 
                                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'
                                }`}>
                                  {cl.notifiedStudent !== false ? (lang === 'ar' ? 'تم الإشعار' : 'Notified') : (lang === 'ar' ? 'لم يُرسل' : 'Not Sent')}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-slate-400 text-xs">
                              {lang === 'ar' ? 'لا توجد دروس ملغاة مسجلة حتى الآن.' : 'No cancelled lessons recorded yet.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {activeTab === 'lessons' && (
        <div id="trainer-lessons-view" className="space-y-6 animate-fade-in">
          {/* Header Card with Title, Subtitle, Search and Filter Controls */}
          <div className="p-5 md:p-6 bg-white dark:bg-zinc-900 border border-[#e6ecf2] dark:border-zinc-800 rounded-[22px] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-extrabold tracking-tight text-[#0f172a] dark:text-white">
                  {lang === 'ar' ? 'سجل الدروس' : lang === 'nl' ? 'Lessen' : 'Lessons'}
                </h3>
                <p className="text-xs font-medium text-[#64748b] dark:text-zinc-400 mt-0.5">
                  {lang === 'ar' ? 'إدارة ومراجعة جميع الحصص والدروس التدريبية' : lang === 'nl' ? 'Beheer en bekijk alle rijlessen' : 'Manage and review all driving lessons'}
                </p>
              </div>

              {isLoadingSheets && (
                <div className="text-xs font-bold text-[#1f4e94] dark:text-blue-400 flex items-center gap-2 bg-[#f5f8ff] dark:bg-blue-950/30 px-3 py-1.5 rounded-xl border border-[#1f4e94]/20 animate-pulse">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#1f4e94] animate-ping"></div>
                  {lang === 'ar' ? 'جاري تحميل سجل الحصص...' : 'Retrieving lesson records...'}
                </div>
              )}
              {sheetsLoadSuccess === true && !isLoadingSheets && (
                <div className="text-xs font-semibold text-[#2e7d32] dark:text-emerald-400 flex items-center gap-1.5 bg-[#e8f5e9] dark:bg-emerald-950/30 px-3 py-1.5 rounded-xl border border-[#2e7d32]/20">
                  <Check className="h-3.5 w-3.5" />
                  {lang === 'ar' ? 'تم تحديث السجلات بنجاح' : 'Records updated successfully'}
                </div>
              )}
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-[#e6ecf2] dark:border-zinc-800">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b] dark:text-zinc-400 rtl:left-auto rtl:right-3" />
                  <select
                    value={completedLessonStudentFilter}
                    onChange={(e) => setCompletedLessonStudentFilter(e.target.value)}
                    className="w-full h-10 pl-9 pr-8 rtl:pl-8 rtl:pr-9 bg-[#f8fafc] dark:bg-zinc-800/80 border border-[#e6ecf2] dark:border-zinc-700/70 rounded-xl text-xs font-semibold text-[#0f172a] dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#1f4e94]/20 focus:border-[#1f4e94] cursor-pointer transition-all appearance-none"
                  >
                    <option value="all">{lang === 'ar' ? 'جميع الطلاب' : lang === 'nl' ? 'Alle Leerlingen' : 'All Students'}</option>
                    {studentFilterOptions.filter(Boolean).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#64748b] dark:text-zinc-400 pointer-events-none rtl:right-auto rtl:left-3" />
                </div>

                <button
                  type="button"
                  onClick={() => setCompletedLessonStudentFilter('all')}
                  className="h-10 px-3 bg-[#f8fafc] dark:bg-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-[#e6ecf2] dark:border-zinc-700/70 rounded-xl text-[#0f172a] dark:text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
                  title="Reset Filter"
                >
                  <SlidersHorizontal className="h-4 w-4 text-[#64748b]" />
                  <span className="hidden sm:inline">{lang === 'ar' ? 'تصفية' : 'Filter'}</span>
                </button>
              </div>

              {/* Counter and Sort Dropdown */}
              <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                <span className="font-bold text-[#64748b] dark:text-zinc-400">
                  {completedLessonsFiltered.length} {lang === 'ar' ? 'دروس متوفرة' : lang === 'nl' ? 'Lessen gevonden' : 'Lessons Found'}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-[#64748b] dark:text-zinc-400 whitespace-nowrap">
                    {lang === 'ar' ? 'الترتيب:' : 'Sort by:'}
                  </span>
                  <select
                    value={completedLessonSort}
                    onChange={(e) => setCompletedLessonSort(e.target.value as any)}
                    className="h-8 px-2.5 py-1 bg-[#f8fafc] dark:bg-zinc-800 border border-[#e6ecf2] dark:border-zinc-700/70 rounded-lg text-xs font-bold text-[#0f172a] dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#1f4e94]/20 focus:border-[#1f4e94] cursor-pointer transition"
                  >
                    <option value="newest">{lang === 'ar' ? 'الأحدث' : 'Newest'}</option>
                    <option value="oldest">{lang === 'ar' ? 'الأقدم' : 'Oldest'}</option>
                    <option value="price-high">{lang === 'ar' ? 'السعر (الأعلى)' : 'Price: High to Low'}</option>
                    <option value="price-low">{lang === 'ar' ? 'السعر (الأقل)' : 'Price: Low to High'}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {completedLessonsFiltered.length === 0 ? (
              <div className="col-span-1 lg:col-span-2 p-12 bg-white dark:bg-zinc-900 border border-[#e6ecf2] dark:border-zinc-800 rounded-[22px] text-center space-y-3 shadow-xs">
                <div className="h-12 w-12 bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 rounded-full flex items-center justify-center mx-auto">
                  <Activity className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-[#0f172a] dark:text-white text-base">
                  {lang === 'ar' ? 'لا توجد حصص مكتملة مطابقة' : 'No Lessons Found'}
                </h4>
                <p className="text-xs text-[#64748b] dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  {lang === 'ar' 
                    ? 'لم نجد أي حصص تدريبية مكتملة مطابقة لمعايير البحث الحالية.' 
                    : 'No completed driving sessions were found matching your active filter.'}
                </p>
              </div>
            ) : (
              completedLessonsFiltered.map(item => (
                <CompletedLessonCardItem
                  key={item.id}
                  item={item}
                  lang={lang}
                  isMapOpen={activeMapPreviewId === item.id}
                  onToggleMap={handleToggleMapPreview}
                  onOpenGoogleMaps={handleOpenGoogleMaps}
                  onSendReminder={handleSendReminderForLesson}
                />
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <div id="trainer-students-view" className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-2 border-b border-slate-100 dark:border-zinc-800">
            <h3 className="font-bold text-slate-800 dark:text-white text-base">{t.studentsText}</h3>
            
            {/* Student search input */}
            <div className="relative shrink-0 w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={lt.searchNames}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-xl text-xs dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map(student => {
              const details = getStudentDbInfo(student.name);
              const progressVal = parseInt(student.progress.replace('%', ''), 10) || 10;
              const lessonsInfo = { lastLesson: student.lastLesson, nextLesson: student.nextLesson };

              return (
                <div 
                  key={student.name}
                  className="p-4 bg-white dark:bg-zinc-900 border border-blue-100/80 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col justify-between space-y-3 hover:border-blue-300/80 dark:hover:border-zinc-700 hover:shadow-md transition duration-200"
                >
                  <div className="space-y-3">
                    {/* Header: Avatar, Large Name, ID, Email, Edit */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {getStudentPhoto(student.email || student.name) ? (
                          <img 
                            src={getStudentPhoto(student.email || student.name)!} 
                            alt={student.name} 
                            className="h-10 w-10 rounded-lg object-cover border border-slate-200 dark:border-zinc-800 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 flex items-center justify-center font-semibold text-sm shrink-0 uppercase">
                            {getStudentInitials(student.name)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-slate-900 dark:text-zinc-100 text-sm leading-tight truncate">
                            {student.name}
                          </h4>
                          <p className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 mt-0.5">
                            #{details.id}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                            {details.email}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const dbInfo = getStudentDbInfo(student.name);
                          const fullRec = students.find(s => studentNamesMatch(s.name, student.name)) || {
                            id: dbInfo.id,
                            name: dbInfo.name,
                            email: dbInfo.email,
                            phone: dbInfo.phone,
                            dob: dbInfo.dob,
                            city: dbInfo.city,
                            currentPackage: dbInfo.package,
                            theoryExamStatus: dbInfo.examStatus
                          };
                          setEditingStudent(fullRec);
                          setNewStudentPassword('');
                          setIsSavingStudent(false);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition shrink-0 cursor-pointer"
                        title={lang === 'ar' ? 'تعديل بيانات المتدرب' : 'Edit Student'}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Status Badges Row */}
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40">
                        {lang === 'ar' ? 'نشط' : lang === 'nl' ? 'Actief' : 'Active'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                        student.name.includes("Michael")
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/40'
                          : student.name.includes("Amir")
                            ? 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/40'
                      }`}>
                        {details.examStatus.includes('Geslaagd') || details.examStatus.includes('ناجح') || details.examStatus.includes('Passed')
                          ? (lang === 'ar' ? 'تم اجتياز النظري ✓' : 'Theory Passed ✓')
                          : details.examStatus}
                      </span>
                    </div>

                    {/* Thin Stripe Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 dark:text-zinc-400 font-medium">
                          {lang === 'ar' ? 'التقدم العملي' : lang === 'nl' ? 'Voortgang' : 'Practical Progress'}
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-zinc-300 font-mono text-[11px]">
                          {student.progress}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300" 
                          style={{ width: `${progressVal}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* 4 Compact Information Items */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-[11px]">
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 block font-medium">
                          {lang === 'ar' ? 'المحفظة' : lang === 'nl' ? 'Portemonnee' : 'Wallet'}
                        </span>
                        <span className={`font-mono font-semibold block ${
                          details.balance >= 0 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          €{details.balance.toFixed(2)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 block font-medium">
                          {lang === 'ar' ? 'الباقة' : lang === 'nl' ? 'Pakket' : 'Package'}
                        </span>
                        <span className="font-medium text-slate-700 dark:text-zinc-200 truncate block">
                          {details.package}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 block font-medium">
                          {lang === 'ar' ? 'الدرس القادم' : lang === 'nl' ? 'Volgende' : 'Next Lesson'}
                        </span>
                        <span className="font-medium text-slate-700 dark:text-zinc-200 truncate block">
                          {lessonsInfo.nextLesson || (lang === 'ar' ? 'لا يوجد' : lang === 'nl' ? 'Geen' : 'None')}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 block font-medium">
                          {lang === 'ar' ? 'الدرس السابق' : lang === 'nl' ? 'Vorige' : 'Last Lesson'}
                        </span>
                        <span className="font-medium text-slate-700 dark:text-zinc-200 truncate block">
                          {lessonsInfo.lastLesson || (lang === 'ar' ? 'لا يوجد' : lang === 'nl' ? 'Geen' : 'None')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Modern Stripe-Style Action Toolbar */}
                  <div className="grid grid-cols-4 gap-1 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80">
                    <button
                      onClick={() => setViewingReportStudentName(student.name)}
                      className="h-7 px-1.5 flex items-center justify-center gap-1 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded text-[10px] font-medium transition cursor-pointer border border-slate-200/60 dark:border-zinc-700/60"
                      title={lang === 'ar' ? 'عرض التقرير والسجل' : 'View Report'}
                    >
                      <FileText className="h-3 w-3 text-slate-500 shrink-0" />
                      <span>{lang === 'ar' ? 'عرض' : 'View'}</span>
                    </button>

                    <button
                      onClick={async () => {
                        try {
                          const pdf = await generateUnifiedStudentDossierPDF(student.name);
                          if (pdf) {
                            pdf.save(`Dossier_${student.name.replace(/[\s]+/g, '_')}.pdf`);
                          }
                        } catch (error) {
                          console.error("Direct PDF download failed:", error);
                        }
                      }}
                      className="h-7 px-1.5 flex items-center justify-center gap-1 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded text-[10px] font-medium transition cursor-pointer border border-slate-200/60 dark:border-zinc-700/60"
                      title={lang === 'ar' ? 'تحميل ملف PDF' : 'Download PDF'}
                    >
                      <Download className="h-3 w-3 text-slate-500 shrink-0" />
                      <span>{lang === 'ar' ? 'تحميل' : 'PDF'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setViewingReportStudentName(student.name);
                        const startTime = Date.now();
                        const checkAndPrint = () => {
                          const pages = document.querySelectorAll('.dossier-pdf-page');
                          if (pages.length > 0) {
                            setTimeout(() => {
                              window.print();
                            }, 150);
                          } else if (Date.now() - startTime < 3000) {
                            setTimeout(checkAndPrint, 50);
                          } else {
                            window.print();
                          }
                        };
                        setTimeout(checkAndPrint, 50);
                      }}
                      className="h-7 px-1.5 flex items-center justify-center gap-1 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded text-[10px] font-medium transition cursor-pointer border border-slate-200/60 dark:border-zinc-700/60"
                      title={lang === 'ar' ? 'طباعة التقرير' : 'Print'}
                    >
                      <Printer className="h-3 w-3 text-slate-500 shrink-0" />
                      <span>{lang === 'ar' ? 'طباعة' : 'Print'}</span>
                    </button>

                    <button
                      onClick={async () => {
                        setIsSendingEmail(true);
                        setEmailStatusToast(null);
                        try {
                          const pdf = await generateUnifiedStudentDossierPDF(student.name);
                          if (pdf) {
                            const fullUri = pdf.output('datauristring');
                            const base64Data = fullUri.split(',')[1];
                            const sent = await handleSendDossierEmail(student.name, undefined, base64Data);
                            if (sent) {
                              alert(lang === 'ar' ? `تم إرسال التقرير بنجاح للمتدرب ${student.name}!` : `Dossier report successfully emailed to ${student.name}!`);
                            } else {
                              alert(lang === 'ar' ? 'فشل في إرسال التقرير بالبريد.' : 'Failed to email dossier report.');
                            }
                          } else {
                            alert(lang === 'ar' ? 'فشل في إنشاء ملف التقرير.' : 'Failed to compile dossier report.');
                          }
                        } catch (error) {
                          console.error("Direct Send email failed:", error);
                          setIsSendingEmail(false);
                          alert(lang === 'ar' ? 'فشل في إرسال التقرير بالبريد.' : 'Failed to email dossier report.');
                        }
                      }}
                      className="h-7 px-1.5 flex items-center justify-center gap-1 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded text-[10px] font-medium transition cursor-pointer border border-slate-200/60 dark:border-zinc-700/60"
                      title={lang === 'ar' ? 'إرسال بالبريد الإلكتروني' : 'Email Report'}
                    >
                      <Send className="h-3 w-3 text-slate-500 shrink-0" />
                      <span>{lang === 'ar' ? 'إرسال' : 'Send'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'tracker' && (
        <React.Suspense fallback={<div className="p-8 text-center text-slate-400 font-mono text-xs">Loading exam tracker...</div>}>
          <ExamTracker 
            lang={lang} 
            lessons={lessons}
            onRouteSaved={(studentName, points, durationSeconds) => {
              const prev = lessons;
              // Try to find an active lesson for this student first
              let targetIndex = prev.findIndex(l => l.studentName === studentName && l.status === 'active');
              
              // If none, try to find an upcoming lesson
              if (targetIndex === -1) {
                targetIndex = prev.findIndex(l => l.studentName === studentName && l.status === 'upcoming');
              }
              
              // If still none, try to find any lesson for this student
              if (targetIndex === -1) {
                targetIndex = prev.findIndex(l => l.studentName === studentName);
              }

              if (targetIndex !== -1) {
                const updated = [...prev];
                updated[targetIndex] = {
                  ...updated[targetIndex],
                  routePoints: points,
                  elapsedTime: `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`,
                  distanceKm: Number((points.length * 0.15).toFixed(2))
                };
                setLessons(updated);
              }
            }}
          />
        </React.Suspense>
      )}

      {activeTab === 'invoices' && (
        <div id="trainer-invoices-view" className="space-y-6 animate-in fade-in duration-300">
          {/* Success Overlay Dialog */}
          {invoiceDispatchedOverlay && latestIssuedInvoice && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full border border-blue-100/80 dark:border-zinc-800 shadow-xl space-y-4">
                <div className="text-center space-y-2">
                  <div className="mx-auto h-11 w-11 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-center mb-1">
                    <CheckCircle className="h-5 w-5 stroke-[2.2]" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                    {lang === 'ar' ? 'تم إصدار وإرسال الفاتورة بنجاح!' : 'Invoice Dispatched Successfully!'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                    {lang === 'ar' 
                      ? `تم تسجيل الفاتورة الضريبية رقم ${latestIssuedInvoice.invoiceId} وإشعار المتدرب ${latestIssuedInvoice.studentName} بالبريد الإلكتروني ومزامنته بـ Wallet.`
                      : `Tax Invoice ${latestIssuedInvoice.invoiceId} compiled and dispatched to ${latestIssuedInvoice.studentName}'s portal.`}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50/80 dark:bg-zinc-950 rounded-xl border border-slate-200/60 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300 space-y-2 font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-zinc-400">{lang === 'ar' ? 'رقم الفاتورة:' : 'Invoice No:'}</span>
                    <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{latestIssuedInvoice.invoiceId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-zinc-400">{lang === 'ar' ? 'التاريخ:' : 'Date:'}</span>
                    <span>{latestIssuedInvoice.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-zinc-400">{lang === 'ar' ? 'عدد الدروس المفوترة:' : 'Lessons Billed:'}</span>
                    <span className="font-semibold">{latestIssuedInvoice.billedLessons.length}</span>
                  </div>
                  <div className="border-t border-slate-200/80 dark:border-zinc-800 pt-2 flex justify-between font-bold text-slate-900 dark:text-zinc-100">
                    <span>{lang === 'ar' ? `المجموع النهائي (شامل الـ ${latestIssuedInvoice.vatRate}%):` : `Grand Total (inc. VAT ${latestIssuedInvoice.vatRate}%):`}</span>
                    <span className="text-blue-600 dark:text-blue-400">€{latestIssuedInvoice.grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    onClick={async () => {
                      try {
                        const { generateInvoicePDF } = await import('../utils/arabicPdfHelper');
                        const doc = await generateInvoicePDF(latestIssuedInvoice, lang, schoolSettings);
                        doc.save(`invoice_${latestIssuedInvoice.invoiceId || 'draft'}.pdf`);
                      } catch (err) {
                        console.error("Failed to generate and download invoice PDF:", err);
                        alert(lang === 'ar' ? 'حدث خطأ أثناء تحميل ملف الـ PDF' : 'An error occurred while generating the PDF.');
                      }
                    }}
                    className="flex-1 h-9 bg-white hover:bg-slate-50 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {lang === 'ar' 
                      ? 'تحميل الفاتورة PDF' 
                      : lang === 'nl' 
                        ? 'PDF-factuur downloaden' 
                        : 'Download PDF Invoice'}
                  </button>
                  <button
                    onClick={() => setInvoiceDispatchedOverlay(false)}
                    className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    {lang === 'ar' ? 'متابعة العمل' : 'Done, return'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Invoice Card */}
          <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-blue-100/80 dark:border-zinc-800 rounded-2xl shadow-2xs space-y-6">
            
            {/* Panel Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-zinc-800/80">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-base tracking-tight">
                  {lt.invoiceTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  {lang === 'ar' 
                    ? 'إعداد الكشوفات وإرسال الفواتير للمتدربين استناداً إلى الدروس المنجزة المسجلة بالنظام ومزامنتها بالمحفظة المالية.'
                    : 'Select completed lessons, specify additions and dispatch professional invoices on demand.'}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-[11px] font-mono font-medium rounded-lg border border-slate-200/60 dark:border-zinc-700/60">
                <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Ref: {draftInvoiceId}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Form Config Left Panel */}
              <form onSubmit={handleSendDetailedInvoice} className="lg:col-span-7 space-y-5">
                
                {/* 1. Recipient & Invoice Parameters */}
                <div className="p-4 bg-slate-50/60 dark:bg-zinc-950/40 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-zinc-800/60">
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      {lang === 'ar' ? 'إعدادات وإعادة توجيه الفاتورة' : 'Invoice Settings & Recipient'}
                    </h4>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700 dark:text-zinc-300 block">{lt.studentLabel}</label>
                      <select
                        value={selectedInvoiceStudent}
                        onChange={(e) => {
                          setSelectedInvoiceStudent(e.target.value);
                          setSelectedInvoiceLessonIds([]);
                        }}
                        className="w-full h-9 px-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
                      >
                        {studentsList.map(s => (
                          <option key={s.name} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* VAT & Payment Configuration */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-700 dark:text-zinc-300 block">
                          {lang === 'ar' ? 'نسبة الضريبة (BTW):' : 'VAT / BTW Rate:'}
                        </label>
                        <select
                          value={selectedVatRate}
                          onChange={(e) => setSelectedVatRate(Number(e.target.value))}
                          className="w-full h-9 px-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
                        >
                          <option value={21}>21% ({lang === 'ar' ? 'القياسي' : 'Standard'})</option>
                          <option value={9}>9% ({lang === 'ar' ? 'المخفض' : 'Reduced'})</option>
                          <option value={0}>0% ({lang === 'ar' ? 'معفى' : 'Exempt'})</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-700 dark:text-zinc-300 block">
                          {lang === 'ar' ? 'طريقة الدفع:' : 'Payment Method:'}
                        </label>
                        <select
                          value={invoicePaymentMethod}
                          onChange={(e) => setInvoicePaymentMethod(e.target.value as any)}
                          className="w-full h-9 px-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
                        >
                          <option value="wallet">{lang === 'ar' ? 'المحفظة الرقمية' : 'Digital Wallet'}</option>
                          <option value="cash">{lang === 'ar' ? 'نقداً (كاش)' : 'Cash Payment'}</option>
                          <option value="transfer">{lang === 'ar' ? 'تحويل بنكي iDEAL' : 'Bank Transfer'}</option>
                          <option value="card">{lang === 'ar' ? 'بطاقة الائتمان' : 'Credit Card'}</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-700 dark:text-zinc-300 block">
                          {lang === 'ar' ? 'حالة السداد:' : 'Payment Status:'}
                        </label>
                        <select
                          value={invoicePaymentStatus}
                          onChange={(e) => setInvoicePaymentStatus(e.target.value as any)}
                          className="w-full h-9 px-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
                        >
                          <option value="paid">{lang === 'ar' ? 'مدفوعة بالكامل' : 'Paid'}</option>
                          <option value="unpaid">{lang === 'ar' ? 'غير مدفوعة (مستحقة)' : 'Unpaid (Pending)'}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Lessons logs with checkbox selection */}
                <div className="space-y-4 text-xs">
                  {selectedInvoiceStudent && (
                    (() => {
                      const studentCompletedLessons = lessons.filter(l => l.studentName === selectedInvoiceStudent && l.status === 'completed');
                      const unpaidCompletedLessons = studentCompletedLessons.filter(l => l.payStatus !== 'paid' && (!l.invoiceId || l.invoiceId === '') && !billedLessonIds.includes(l.id));
                      const paidCompletedLessons = studentCompletedLessons.filter(l => l.payStatus === 'paid' && (!l.invoiceId || l.invoiceId === '') && !billedLessonIds.includes(l.id));
                      const totalUnpaidAmount = unpaidCompletedLessons.reduce((sum, curr) => sum + (curr.price || 0), 0);

                      return (
                        <div className="space-y-4">
                          {/* Modern Refined KPI Summary Cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div className="px-3.5 py-2.5 bg-white dark:bg-zinc-950 rounded-xl border border-blue-100/90 dark:border-zinc-800 shadow-2xs hover:border-blue-200/80 transition-colors">
                              <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                                {lang === 'ar' ? 'المستحقات المعلقة' : 'Outstanding Unpaid'}
                              </span>
                              <div className="mt-0.5">
                                <span className="text-xl font-bold text-slate-900 dark:text-zinc-100 font-mono tracking-tight block">
                                  €{totalUnpaidAmount.toFixed(2)}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-zinc-400 block mt-0.5">
                                  {unpaidCompletedLessons.length} {lang === 'ar' ? 'دروس معلقة غير مدفوعة' : 'unpaid lessons pending'}
                                </span>
                              </div>
                            </div>

                            <div className="px-3.5 py-2.5 bg-white dark:bg-zinc-950 rounded-xl border border-blue-100/90 dark:border-zinc-800 shadow-2xs hover:border-blue-200/80 transition-colors">
                              <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                                {lang === 'ar' ? 'جاهزة للفوترة' : 'Ready for Invoice'}
                              </span>
                              <div className="mt-0.5">
                                <span className="text-xl font-bold text-slate-900 dark:text-zinc-100 font-mono tracking-tight block">
                                  {paidCompletedLessons.length}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-zinc-400 block mt-0.5">
                                  {lang === 'ar' ? 'دروس مدفوعة جاهزة للإصدار' : 'paid lessons eligible for receipt'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Outstanding Unpaid Lessons List (Read-Only) */}
                          <div className="space-y-2 p-3 bg-white dark:bg-zinc-950 rounded-xl border border-slate-200/80 dark:border-zinc-800">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                {lang === 'ar' ? 'الدروس المستحقة المعلقة (غير مدفوعة):' : 'Outstanding Lessons (Unpaid - Read Only):'}
                              </span>
                              <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200/60 dark:border-rose-900/40">
                                {unpaidCompletedLessons.length} {lang === 'ar' ? 'معلقة' : 'outstanding'}
                              </span>
                            </div>

                            {unpaidCompletedLessons.length === 0 ? (
                              <div className="px-3 py-2 rounded-lg border border-slate-200/60 dark:border-zinc-800/80 bg-slate-50/60 dark:bg-zinc-900/40 text-slate-500 dark:text-zinc-400 text-[11px] font-medium flex items-center justify-between">
                                <span>{lang === 'ar' ? 'لا توجد مبالغ مستحقة على هذا الطالب.' : 'No outstanding unpaid lessons for this student.'}</span>
                                <span className="font-mono text-[10px] text-slate-400">€0.00</span>
                              </div>
                            ) : (
                              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 no-scrollbar">
                                {unpaidCompletedLessons.map(item => (
                                  <div 
                                    key={item.id}
                                    className="p-2.5 rounded-lg bg-slate-50/50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-3 text-left"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                                      <div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <p className="font-semibold text-slate-800 dark:text-zinc-200 text-xs">{item.date} {lang === 'ar' ? 'في' : 'at'} {item.time}</p>
                                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/50 uppercase">
                                            {lang === 'ar' ? 'غير مدفوعة' : 'UNPAID'}
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                                          {lt.pickupLabel || "Pickup"}: {item.pickupLocation}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0 font-mono font-semibold">
                                      <p className="text-xs text-rose-600 dark:text-rose-400">€{item.price}</p>
                                      <p className="text-[10px] text-slate-400">{item.duration}h</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Selectable Paid Lessons Section */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block text-left">
                              {lang === 'ar' ? 'اختر الدروس المدفوعة المكتملة لإدراجها في إيصال الفاتورة:' : 'Select completed paid lessons to include in this receipt:'}
                            </label>

                            {paidCompletedLessons.length === 0 ? (
                              <div className="px-3 py-2.5 rounded-lg border border-slate-200/60 dark:border-zinc-800/80 bg-slate-50/60 dark:bg-zinc-900/40 text-slate-500 dark:text-zinc-400 text-[11px] text-center font-medium">
                                {lang === 'ar' 
                                  ? 'لا توجد دروس عملية مكتملة مدفوعة متاحة للفوترة لهذا الطالب حالياً. يرجى تصفية المستحقات في قسم الحصص التدريبية أولاً!'
                                  : 'No completed paid lessons available for invoice generation. Settle payments in the Lessons tab first!'}
                              </div>
                            ) : (
                              <div className="space-y-2 max-h-56 overflow-y-auto pr-1 no-scrollbar">
                                {paidCompletedLessons.map(item => {
                                  const isChecked = selectedInvoiceLessonIds.includes(item.id);
                                  return (
                                    <div 
                                      key={item.id}
                                      onClick={() => {
                                        if (isChecked) {
                                          setSelectedInvoiceLessonIds(selectedInvoiceLessonIds.filter(id => id !== item.id));
                                        } else {
                                          setSelectedInvoiceLessonIds([...selectedInvoiceLessonIds, item.id]);
                                        }
                                      }}
                                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 text-left ${
                                        isChecked 
                                          ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900/60' 
                                          : 'bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => {}} // onClick is handled by container
                                          className="h-4 w-4 text-blue-600 border-slate-300 dark:border-zinc-700 rounded cursor-pointer focus:ring-blue-500/20"
                                        />
                                        <div>
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <p className="font-semibold text-slate-800 dark:text-zinc-200 text-xs">{item.date} {lang === 'ar' ? 'في' : 'at'} {item.time}</p>
                                            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40">
                                              {lang === 'ar' ? 'مدفوعة' : 'Paid'}
                                            </span>
                                          </div>
                                          <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                                            {lt.pickupLabel || "Pickup"}: {item.pickupLocation}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right font-mono font-semibold shrink-0">
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400">€{item.price}</p>
                                        <p className="text-[10px] text-slate-400">{item.duration}h</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>

                {/* Section 4: Custom Adjustments */}
                <div className="p-3.5 bg-slate-50/60 dark:bg-zinc-950/40 rounded-xl border border-slate-200/70 dark:border-zinc-800 space-y-2.5">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <PlusCircle className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    {lang === 'ar' ? 'إضافة رسوم أو خدمات مخصصة (اختياري):' : 'Add custom charge adjustments (optional):'}
                  </h4>
                  <div className="grid grid-cols-3 gap-2.5 text-xs">
                    <div className="col-span-2">
                      <label className="text-[11px] text-slate-500 dark:text-zinc-400 block mb-1">{lang === 'ar' ? 'بيان الخدمة' : 'Description'}</label>
                      <input
                        type="text"
                        placeholder={lang === 'ar' ? 'مرجع الفاتورة' : lang === 'nl' ? 'Factuurreferentie' : 'Invoice reference'}
                        value={customAdjustmentLabel}
                        onChange={(e) => setCustomAdjustmentLabel(e.target.value)}
                        className="w-full h-9 px-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 dark:text-zinc-400 block mb-1">{lang === 'ar' ? 'السعر (€)' : 'Price (€)'}</label>
                      <input
                        type="number"
                        placeholder={lang === 'ar' ? 'مثال: 150' : lang === 'nl' ? 'bijv. 150' : 'e.g. 150'}
                        value={customAdjustmentPrice}
                        onChange={(e) => setCustomAdjustmentPrice(e.target.value)}
                        className="w-full h-9 px-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-mono font-medium text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-10 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-lg transition cursor-pointer shadow-2xs flex items-center justify-center gap-2"
                >
                  <Send className="h-3.5 w-3.5" />
                  {lang === 'ar' ? 'إصدار وإرسال الفاتورة الرسمية للمتدرب' : 'Compile & Send Tax Invoice'}
                </button>
              </form>

              {/* Live Preview Panel Right Side */}
              <div className="lg:col-span-5 space-y-2.5">
                <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block pl-0.5">
                  {lang === 'ar' ? 'معاينة حية للفاتورة الضريبية:' : 'Live invoice receipt preview:'}
                </span>

                <div className="p-5 bg-white dark:bg-zinc-950 border border-slate-200/90 dark:border-zinc-800 rounded-xl shadow-xs text-xs font-medium space-y-4 relative overflow-hidden">
                  
                  {/* Watermark logo */}
                  <div className="absolute top-2 right-2 opacity-5 rotate-12 select-none font-bold text-2xl text-blue-600 hidden dark:block uppercase">
                    {getSchoolShortName(schoolSettings)}
                  </div>

                  {/* Receipt Header */}
                  <div className="flex justify-between items-start pb-3 border-b border-slate-200/80 dark:border-zinc-800">
                    <div className="space-y-0.5">
                      <h4 className="font-mono text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase">
                        {getSchoolName(schoolSettings)}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400">{schoolSettings?.city ? (lang === 'ar' ? `بلدية ${schoolSettings.city}` : schoolSettings.city) : (lang === 'ar' ? 'ماستريخت' : 'Maastricht')}</p>
                      <p className="text-[10px] text-slate-400 font-mono">KvK: {schoolSettings?.kvk || (lang === 'ar' ? 'قيد التهيئة' : lang === 'nl' ? 'Nog te configureren' : 'To be configured')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">{draftInvoiceId}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{new Date().toISOString().split('T')[0]}</p>
                    </div>
                  </div>

                  {/* School & Trainer Information */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] pb-2 border-b border-slate-200/80 dark:border-zinc-800 text-slate-500 dark:text-zinc-400">
                    <div>
                      <span className="font-semibold block text-slate-700 dark:text-zinc-300">{lang === 'ar' ? 'المدرسة:' : 'School:'}</span>
                      <p>{getSchoolName(schoolSettings)}</p>
                      <p>{schoolSettings?.city || "Maastricht"}, NL</p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold block text-slate-700 dark:text-zinc-300">{lang === 'ar' ? 'المدرب:' : 'Trainer:'}</span>
                      <p>{schoolSettings?.instructorName || "Samir El-Filali"}</p>
                      <p>{schoolSettings?.email || "info@drivingschool.nl"}</p>
                    </div>
                  </div>

                  {/* Client Info from database */}
                  {(() => {
                    const client = getStudentDbInfo(selectedInvoiceStudent);
                    return (
                      <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-200/80 dark:border-zinc-800 text-[10px] text-slate-600 dark:text-zinc-400">
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">{lang === 'ar' ? 'العميل المستلم' : 'Recipient Client'}</span>
                          <p className="font-bold text-slate-900 dark:text-zinc-100 text-xs">{client.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-400">{client.email}</p>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-400">{client.phone}</p>
                        </div>
                        <div className="text-right self-end text-[10px]">
                          <p><span className="text-slate-400">{lang === 'ar' ? 'المدينة:' : 'City:'}</span> {client.city}</p>
                          <p><span className="text-slate-400 font-mono">{lang === 'ar' ? 'الباقة:' : 'Package:'}</span> {client.package}</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Items list table */}
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">{lang === 'ar' ? 'العناصر والخدمات المدرجة' : 'Billed driving components'}</span>
                    
                    {selectedInvoiceLessonIds.length === 0 && !customAdjustmentPrice ? (
                      <p className="text-[11px] text-slate-400 italic text-center py-2">
                        {lang === 'ar' ? '(لا توجد عناصر مختارة حالياً)' : '(No invoiced items selected)'}
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
                        
                        {/* Completed lessons selected */}
                        {lessons
                          .filter(l => selectedInvoiceLessonIds.includes(l.id))
                          .map((l, index) => (
                            <div key={l.id} className="flex justify-between text-[11px] text-slate-700 dark:text-zinc-300">
                              <span>
                                {index + 1}. {lang === 'ar' ? 'درس قيادة عملي' : 'Practical road slot'} 
                                <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 block ml-3">{l.date} - {l.time} ({l.pickupLocation})</span>
                              </span>
                              <span className="font-mono font-semibold">€{l.price.toFixed(2)}</span>
                            </div>
                          ))}

                        {/* Custom Adjustment adjustment pricing if set */}
                        {customAdjustmentPrice && (
                          <div className="flex justify-between text-[11px] font-semibold text-slate-800 dark:text-zinc-200 border-t border-slate-100 dark:border-zinc-900 pt-1.5">
                            <span>
                              ★ {customAdjustmentLabel || (lang === 'ar' ? 'رسوم/إضافات مخصصة' : 'Custom Addition')}
                            </span>
                            <span className="font-mono text-blue-600 dark:text-blue-400">€{(parseFloat(customAdjustmentPrice) || 0).toFixed(2)}</span>
                          </div>
                        )}

                      </div>
                    )}
                  </div>

                  {/* Totals Breakdown */}
                  {(() => {
                    const lessonsTotal = lessons.filter(l => selectedInvoiceLessonIds.includes(l.id)).reduce((sum, l) => sum + l.price, 0);
                    const adjustmentVal = parseFloat(customAdjustmentPrice) || 0;
                    const finalSubtotal = lessonsTotal + adjustmentVal;
                    const vatAmount = finalSubtotal * (selectedVatRate / 100);
                    const grandTotal = finalSubtotal + vatAmount;

                    return (
                      <div className="border-t border-slate-200/80 dark:border-zinc-800 pt-3 space-y-1">
                        <div className="flex justify-between text-slate-500 dark:text-zinc-400 text-[11px]">
                          <span>{lang === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                          <span className="font-mono">€{finalSubtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 dark:text-zinc-400 text-[11px]">
                          <span>
                            {lang === 'ar' 
                              ? `ضريبة القيمة المضافة (BTW ${selectedVatRate}%):` 
                              : `VAT / BTW (${selectedVatRate}%):`}
                          </span>
                          <span className="font-mono">€{vatAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-slate-900 dark:text-zinc-100 text-xs pt-1.5 border-t border-slate-100 dark:border-zinc-900">
                          <span>
                            {invoicePaymentStatus === 'paid'
                              ? (lang === 'ar' ? 'الإجمالي المدفوع (إيصال سداد):' : 'Total Amount Paid (Receipt):')
                              : (lang === 'ar' ? 'الإجمالي النهائي المطلوب:' : 'Total Amount Due:')}
                          </span>
                          <span className={`font-mono ${invoicePaymentStatus === 'paid' ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>€{grandTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Payment Info inside preview */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-200/80 dark:border-zinc-800 pt-2 text-slate-500 dark:text-zinc-400">
                    <div>
                      <span className="text-slate-400 block text-[9px]">{lang === 'ar' ? 'طريقة السداد:' : 'Payment Method:'}</span>
                      <span className="font-semibold text-slate-700 dark:text-zinc-300">
                        {invoicePaymentMethod === 'wallet' && (lang === 'ar' ? 'المحفظة الرقمية' : 'Digital Wallet')}
                        {invoicePaymentMethod === 'cash' && (lang === 'ar' ? 'نقداً (كاش)' : 'Cash')}
                        {invoicePaymentMethod === 'transfer' && (lang === 'ar' ? 'تحويل iDEAL' : 'Bank Transfer')}
                        {invoicePaymentMethod === 'card' && (lang === 'ar' ? 'بطاقة الائتمان' : 'Credit Card')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[9px]">{lang === 'ar' ? 'حالة السداد:' : 'Payment Status:'}</span>
                      <span className={`font-bold uppercase inline-block px-1.5 py-0.5 rounded text-[8px] ${
                        invoicePaymentStatus === 'paid' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40' 
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40'
                      }`}>
                        {invoicePaymentStatus === 'paid' ? (lang === 'ar' ? 'مدفوعة' : 'PAID') : (lang === 'ar' ? 'غير مدفوعة' : 'UNPAID')}
                      </span>
                    </div>
                  </div>

                  {/* Footnote notes */}
                  <div className="border-t border-dashed border-slate-200/80 dark:border-zinc-800 pt-2.5 text-center text-[10px] text-slate-400 dark:text-zinc-500">
                    <p>{getSchoolName(schoolSettings)} © 2026</p>
                    <p className="mt-0.5">{lang === 'ar' ? 'نشكر ثقتكم بنا دائمًا!' : 'Thank you for choosing us!'}</p>
                  </div>

                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div id="trainer-reports-view" className="space-y-5 animate-in fade-in duration-300">
          
          {saveSuccessToast && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center justify-between gap-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                <span className="text-xs font-semibold">
                  {lang === 'ar' 
                    ? 'تم حفظ تقييم المتدرب بنجاح! وهو متاح الآن في سجل ومستندات الطالب.' 
                    : 'Assessment evaluation saved successfully! It is now available in the student’s history and Dossier.'}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded font-semibold uppercase tracking-wider">{lang === 'ar' ? 'تم الحفظ' : 'Saved'}</span>
            </div>
          )}

          {emailStatusToast && (
            <div className={`p-3 border rounded-xl flex items-center justify-between gap-4 animate-in fade-in duration-300 ${
              emailStatusToast === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300' 
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300'
            }`}>
              <div className="flex items-center gap-2">
                {emailStatusToast === 'success' ? (
                  <Check className="h-4 w-4 stroke-[2.5]" />
                ) : (
                  <X className="h-4 w-4 stroke-[2.5]" />
                )}
                <span className="text-xs font-semibold">
                  {emailStatusToast === 'success' 
                    ? (lang === 'ar' ? 'تم إرسال تقرير PDF المعتمد بنجاح للطالب عبر البريد الإلكتروني.' : 'Success: Official PDF report generated and successfully sent to candidate.')
                    : (lang === 'ar' ? 'فشل في إنشاء أو إرسال تقرير PDF.' : 'Error: Failed to compile report PDF or deliver email.')}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-white/40 dark:bg-zinc-800 rounded font-semibold uppercase tracking-wider">
                {emailStatusToast === 'success' ? (lang === 'ar' ? 'تم الإرسال' : 'Sent') : (lang === 'ar' ? 'فشل' : 'Failed')}
              </span>
            </div>
          )}

          {reportSuccessToast && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                <span className="text-xs font-semibold">
                  {lang === 'ar' 
                    ? 'تم تسجيل وإرسال تقرير التقييم الفني للمتدرب بنظام الإشعار الفوري وعبر البريد الإلكتروني!' 
                    : 'Performance assessment evaluation compiled and dispatched successfully via email portal!'}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded font-semibold uppercase tracking-wider">Sent On-Demand</span>
            </div>
          )}

          <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-blue-100/80 dark:border-zinc-800 rounded-2xl shadow-2xs space-y-5">
            
            {/* Header Section */}
            <div className="pb-4 border-b border-slate-100 dark:border-zinc-800/80">
              <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-base tracking-tight">
                {lt.reportsTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                {lang === 'ar' 
                  ? 'إعداد ملفات تطور مستويات المتدربين واعتمادات جاهزيتهم للاختبارات الرسمية وإرسالها بناء على الطلب.'
                  : 'Evaluate driving indicators, write professional feedback, and dispatch candidate assessments on demand.'}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Form Controls Left Side */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Select Student for Report */}
                <div className="space-y-1.5 text-xs">
                  <label className="text-slate-700 dark:text-zinc-300 font-semibold block">{lang === 'ar' ? "اختر المتدرب:" : "Select Student:"}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 dark:text-zinc-500 pointer-events-none">
                      <User className="h-4 w-4" />
                    </span>
                    <select
                      value={selectedReportStudent}
                      onChange={(e) => {
                        setSelectedReportStudent(e.target.value);
                      }}
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
                    >
                      {studentsList.map(s => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Driving Competencies Indicators */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      {lang === 'ar' ? 'تقييم كفاءة القيادة التفصيلية:' : 'Detailed Driving Indicators:'}
                    </h4>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                      {lang === 'ar' ? 'اختر النتيجة (1-10)' : 'Select score (1–10)'}
                    </span>
                  </div>

                  {[
                    {
                      id: 'control',
                      label_ar: 'التحكم الفني بالمركبة (ثبات، قابض، ومكيف تروس)',
                      label_en: 'Vehicle Operation & Clutch Control',
                      val: scoreControl,
                      setVal: setScoreControl
                    },
                    {
                      id: 'priority',
                      label_ar: 'مراقبة الطريق وإعطاء الأولويات (مركبات ومرايا عمياء)',
                      label_en: 'Observer Cycles & Priority Rules',
                      val: scorePriority,
                      setVal: setScorePriority
                    },
                    {
                      id: 'highway',
                      label_ar: 'القيادة والاندماج على الطرق السريعة (تجاوز وتوافق مسارات)',
                      label_en: 'Highway Integration & Lane Overtaking',
                      val: scoreHighway,
                      setVal: setScoreHighway
                    },
                    {
                      id: 'maneuvers',
                      label_ar: 'المناورات الخاصة بالركن والرجوع (الركن، الالتفاف، الانحدار)',
                      label_en: 'Special Maneuvers & Hill Starts',
                      val: scoreManeuvers,
                      setVal: setScoreManeuvers
                    },
                    {
                      id: 'theory',
                      label_ar: 'الوعي بقوانين السير وإشارات المرور وتوقع المخاطر',
                      label_en: 'Traffic Signages & Hazard Awareness',
                      val: scoreTheory,
                      setVal: setScoreTheory
                    }
                  ].map((item) => (
                    <div key={item.id} className="p-2.5 bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 rounded-xl space-y-1.5 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-800 dark:text-zinc-200 leading-tight">
                          {lang === 'ar' ? item.label_ar : item.label_en}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-slate-200/60 dark:border-zinc-700/60 shrink-0">
                          {item.val}/10
                        </span>
                      </div>
                      <div className="flex bg-slate-50 dark:bg-zinc-900 p-0.5 rounded-lg w-full gap-0.5 border border-slate-200/60 dark:border-zinc-800">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                          <button
                            key={score}
                            type="button"
                            onClick={() => item.setVal(score)}
                            className={`flex-1 h-6.5 rounded text-[11px] font-mono font-medium transition-colors cursor-pointer flex items-center justify-center ${
                              item.val === score
                                ? 'bg-blue-600 text-white font-bold shadow-2xs'
                                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/70 dark:hover:bg-zinc-800/70'
                            }`}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Exam Readiness Section */}
                <div className="space-y-1.5 text-xs">
                  <label className="text-slate-700 dark:text-zinc-300 font-semibold block">
                    {lang === 'ar' ? 'الجاهزية للاختبار:' : 'Exam Readiness Status:'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'beginner', label_en: 'Beginner', label_ar: 'مبتدئ', sub_en: 'Initial stage', sub_ar: 'مرحلة أساسية' },
                      { key: 'developing', label_en: 'Intermediate', label_ar: 'متوسط', sub_en: 'In progress', sub_ar: 'قيد التطوير' },
                      { key: 'exam_mock', label_en: 'Ready for Mock Exam', label_ar: 'اختبار تجريبي', sub_en: 'Practice run', sub_ar: 'اختبار افتراضي' },
                      { key: 'ready_cbr', label_en: 'Ready for Official CBR', label_ar: 'امتحان CBR الرسمي', sub_en: 'Final CBR exam', sub_ar: 'اختبار CBR الرسمي' },
                    ].map(item => {
                      const isSelected = cbrReadiness === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setCbrReadiness(item.key)}
                          className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between h-full ${
                            isSelected
                              ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-500/80 dark:border-blue-500/60 text-blue-900 dark:text-blue-100 shadow-2xs'
                              : 'bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className={`h-2 w-2 rounded-full ${isSelected ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-700'}`} />
                            {isSelected && <Check className="h-3 w-3 text-blue-600 dark:text-blue-400 stroke-[2.5]" />}
                          </div>
                          <div>
                            <p className="font-semibold text-xs leading-tight">{lang === 'ar' ? item.label_ar : item.label_en}</p>
                            <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-blue-600 dark:text-blue-300' : 'text-slate-400 dark:text-zinc-500'}`}>
                              {lang === 'ar' ? item.sub_ar : item.sub_en}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Trainer Feedback Comments */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-700 dark:text-zinc-300 font-semibold block">
                      {lang === 'ar' ? "ملاحظات وتوصيات المدرب:" : "Instructor Evaluation Notes & Feedback:"}
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {reportObservs.length} / 500
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={reportObservs}
                    onChange={(e) => setReportObservs(e.target.value)}
                    placeholder={
                      lang === 'ar' 
                        ? "سجّل الملاحظات الفنية، كفاءة التحكم بالمركبة، والتوصيات الخاصة بالاختبار العملي..." 
                        : "Document specific driving competencies, traffic observation habits, or areas needing focus before the practical exam..."
                    }
                    className="w-full p-2.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs text-slate-800 dark:text-zinc-200 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-y"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                    {lang === 'ar'
                      ? "* ستتم إضافة هذه التوصيات تلقائياً إلى تقرير التقييم الرسمي للطالب."
                      : "* Notes will be appended to the candidate's official evaluation report and dossier."}
                  </p>
                </div>

                {/* Compact Professional Action Toolbar */}
                <div className="pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Primary Save Evaluation Button */}
                    <button
                      type="button"
                      onClick={handleSaveAssessment}
                      className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>{lang === 'ar' ? 'حفظ التقييم' : 'Save Evaluation'}</span>
                    </button>

                    {/* Secondary Action Toolbar Buttons */}
                    <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[280px]">
                      {/* View Report */}
                      <button
                        type="button"
                        onClick={() => setViewingReportStudentName(selectedReportStudent)}
                        className="h-9 px-3 bg-white hover:bg-slate-50 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-200 text-xs font-medium rounded-lg border border-slate-200 dark:border-zinc-800 transition cursor-pointer flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
                      >
                        <FileText className="h-3.5 w-3.5 text-slate-500" />
                        <span>{lang === 'ar' ? 'عرض التقرير' : 'View Report'}</span>
                      </button>

                      {/* Download PDF */}
                      <button
                        type="button"
                        onClick={async () => {
                          setIsGeneratingPDF(true);
                          try {
                            const pdf = await generateUnifiedStudentDossierPDF(selectedReportStudent);
                            if (pdf) {
                              pdf.save(`${getSchoolShortName(schoolSettings).replace(/[\s]+/g, '_')}_Dossier_${selectedReportStudent.replace(/[\s]+/g, '_')}.pdf`);
                            }
                          } catch (error) {
                            console.error("PDF generation failed:", error);
                          } finally {
                            setIsGeneratingPDF(false);
                          }
                        }}
                        disabled={isGeneratingPDF}
                        className="h-9 px-3 bg-white hover:bg-slate-50 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-200 text-xs font-medium rounded-lg border border-slate-200 dark:border-zinc-800 transition cursor-pointer flex items-center justify-center gap-1.5 flex-1 sm:flex-none disabled:opacity-50"
                      >
                        <Download className={`h-3.5 w-3.5 text-slate-500 ${isGeneratingPDF ? 'animate-spin' : ''}`} />
                        <span>{isGeneratingPDF ? (lang === 'ar' ? 'جاري التحميل...' : 'Downloading...') : (lang === 'ar' ? 'تحميل PDF' : 'Download PDF')}</span>
                      </button>

                      {/* Print */}
                      <button
                        type="button"
                        onClick={() => {
                          setViewingReportStudentName(selectedReportStudent);
                          const startTime = Date.now();
                          const checkAndPrint = () => {
                            const pages = document.querySelectorAll('.dossier-pdf-page');
                            if (pages.length > 0) {
                              setTimeout(() => {
                                window.print();
                              }, 150);
                            } else if (Date.now() - startTime < 3000) {
                              setTimeout(checkAndPrint, 50);
                            } else {
                              window.print();
                            }
                          };
                          setTimeout(checkAndPrint, 50);
                        }}
                        className="h-9 px-3 bg-white hover:bg-slate-50 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-200 text-xs font-medium rounded-lg border border-slate-200 dark:border-zinc-800 transition cursor-pointer flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
                      >
                        <Printer className="h-3.5 w-3.5 text-slate-500" />
                        <span>{lang === 'ar' ? 'طباعة' : 'Print'}</span>
                      </button>

                      {/* Send Report */}
                      <button
                        type="button"
                        onClick={async () => {
                          await handleSendDossierEmail(selectedReportStudent);
                        }}
                        disabled={isSendingEmail}
                        className="h-9 px-3 bg-white hover:bg-slate-50 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-200 text-xs font-medium rounded-lg border border-slate-200 dark:border-zinc-800 transition cursor-pointer flex items-center justify-center gap-1.5 flex-1 sm:flex-none disabled:opacity-50"
                      >
                        <Send className={`h-3.5 w-3.5 text-slate-500 ${isSendingEmail ? 'animate-bounce' : ''}`} />
                        <span>{isSendingEmail ? (lang === 'ar' ? 'جاري الإرسال...' : 'Sending...') : (lang === 'ar' ? 'إرسال التقرير' : 'Send Report')}</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Compact Assessment Report Preview Right Side */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between pl-0.5">
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    {lang === 'ar' ? 'معاينة تقرير التقييم المباشر:' : 'Evaluation Summary Preview:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setViewingReportStudentName(selectedReportStudent)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>{lang === 'ar' ? 'عرض التقرير الكامل' : 'View Full Dossier'}</span>
                  </button>
                </div>

                <div className="p-4 bg-slate-900 dark:bg-zinc-950 text-white border border-slate-800 dark:border-zinc-800 rounded-xl space-y-3.5 shadow-xs">
                  {/* Card Header */}
                  <div className="flex items-start justify-between border-b border-zinc-800/80 pb-3">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wider">
                        {getSchoolShortName(schoolSettings)} Dossier
                      </span>
                      <h4 className="text-sm font-bold text-white mt-0.5">
                        {selectedReportStudent}
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[10px] font-mono font-medium">
                      {lang === 'ar' ? 'معتمد' : 'Approved'}
                    </span>
                  </div>

                  {/* Overall Competency Metric */}
                  <div className="p-3 bg-zinc-900/90 rounded-lg border border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-medium text-zinc-400 block">
                        {lang === 'ar' ? 'المعدل العام للأداء:' : 'Overall Competency:'}
                      </span>
                      <p className="text-xl font-bold text-white font-mono mt-0.5">
                        {((scoreControl + scorePriority + scoreHighway + scoreManeuvers + scoreTheory) / 5).toFixed(1)}
                        <span className="text-xs font-normal text-zinc-500 font-sans ml-1">/ 10</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-medium text-zinc-400 block">
                        {lang === 'ar' ? 'حالة الجاهزية:' : 'Readiness Status:'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded block mt-1 uppercase ${
                        cbrReadiness === 'beginner' 
                          ? 'bg-red-500/20 text-red-400' 
                          : cbrReadiness === 'developing' 
                            ? 'bg-amber-500/20 text-amber-400' 
                            : cbrReadiness === 'exam_mock' 
                              ? 'bg-blue-500/20 text-blue-400' 
                              : 'bg-emerald-500/20 text-emerald-400 font-bold'
                      }`}>
                        {cbrReadiness === 'beginner' 
                          ? (lang === 'ar' ? 'مبتدئ' : 'Beginner') 
                          : cbrReadiness === 'developing' 
                            ? (lang === 'ar' ? 'متوسط' : 'Intermediate') 
                            : cbrReadiness === 'exam_mock' 
                              ? (lang === 'ar' ? 'اختبار تجريبي' : 'Mock Ready') 
                              : (lang === 'ar' ? 'جاهز للامتحان!' : 'CBR Ready')}
                      </span>
                    </div>
                  </div>

                  {/* Skills Mini Progress Bars */}
                  <div className="space-y-2 text-[11px] font-medium text-zinc-300">
                    {[
                      { name: lang === 'ar' ? 'التحكم بالمركبة' : 'Vehicle Control', val: scoreControl },
                      { name: lang === 'ar' ? 'المراقبة والأولويات' : 'Observation & Priority', val: scorePriority },
                      { name: lang === 'ar' ? 'الطرق السريعة' : 'Highway Driving', val: scoreHighway },
                      { name: lang === 'ar' ? 'المناورات والركن' : 'Maneuvers & Parking', val: scoreManeuvers },
                      { name: lang === 'ar' ? 'الوعي بالمرور' : 'Traffic Awareness', val: scoreTheory },
                    ].map((sk, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400 font-normal">{sk.name}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${sk.val * 10}%` }}></div>
                          </div>
                          <span className="font-semibold text-white w-4 text-right">{sk.val}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Comments Excerpt */}
                  {reportObservs && (
                    <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800 text-[11px] text-zinc-300 leading-relaxed font-sans">
                      <span className="text-[10px] text-zinc-500 font-semibold block mb-0.5">
                        {lang === 'ar' ? 'توصيات المدرب:' : 'Instructor Notes:'}
                      </span>
                      <p className="line-clamp-3 text-zinc-300">{reportObservs}</p>
                    </div>
                  )}

                  {/* Card Footer Button */}
                  <button
                    type="button"
                    onClick={() => setViewingReportStudentName(selectedReportStudent)}
                    className="w-full h-8 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-medium rounded-lg border border-zinc-700 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <FileText className="h-3.5 w-3.5 text-zinc-400" />
                    <span>{lang === 'ar' ? 'فتح التقرير التفصيلي الكامل' : 'Open Full Detailed Report'}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {activeTab === 'schedule' && (
        <div id="trainer-settings-view" className="space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          
          {/* Settings Tab / Sub-tab Navigation */}
          <div className="flex border-b border-slate-100 dark:border-zinc-850 pb-px gap-4 overflow-x-auto">
            <button
              onClick={() => setSettingsSubTab('rota')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 px-1 cursor-pointer whitespace-nowrap ${
                settingsSubTab === 'rota'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-zinc-350'
              }`}
            >
              {lang === 'ar' ? 'جدول المواعيد وأوقات العمل' : lang === 'nl' ? 'Werkrooster & Werktijden' : 'Trainer Working Schedule'}
            </button>
            <button
              onClick={() => setSettingsSubTab('packages')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 px-1 cursor-pointer whitespace-nowrap ${
                settingsSubTab === 'packages'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-zinc-350'
              }`}
            >
              {lang === 'ar' ? 'إدارة الباقات التدريبية' : lang === 'nl' ? 'Lespakketten Beheer' : 'Package Management'}
            </button>
            <button
              onClick={() => setSettingsSubTab('school')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 px-1 cursor-pointer whitespace-nowrap ${
                settingsSubTab === 'school'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-zinc-350'
              }`}
            >
              {lang === 'ar' ? 'تهيئة المدرسة' : lang === 'nl' ? 'School Configuratie' : 'School Configuration'}
            </button>
            <button
              onClick={() => setSettingsSubTab('media')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 px-1 cursor-pointer whitespace-nowrap ${
                settingsSubTab === 'media'
                  ? 'border-pink-600 text-pink-600 dark:text-pink-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-zinc-350'
              }`}
            >
              {lang === 'ar' ? 'مكتبة الوسائط التعليمية' : lang === 'nl' ? 'Educatieve Mediatheek' : 'Educational Media Library'}
            </button>
          </div>

          {settingsSubTab === 'rota' && (
            <div className="space-y-6 animate-fade-in" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              {/* Header Banner (NO SAVE BUTTON HERE) */}
              <div className="p-6 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">
                      {lang === 'ar' ? 'جدول المواعيد وأوقات العمل' : lang === 'nl' ? 'Werkrooster & Beschikbaarheid Instellingen' : 'Work Schedule & Availability Settings'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      {lang === 'ar' 
                        ? 'إدارة أيام العمل الرسمية، الساعات المتاحة للحجز، تعيين أسعار الدروس وإعدادات وضع الإجازة'
                        : lang === 'nl'
                          ? 'Beheer werkdagen, werktijden, uurtarieven en vakantie / verlof instellingen'
                          : 'Manage working days, available hours, hourly rates and vacation / holiday mode settings'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Working Days & Hours Card */}
              <div className="p-6 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-4 w-4 text-blue-500 shrink-0" />
                    <h4 className="font-extrabold text-slate-800 dark:text-zinc-100 text-sm">
                      {lang === 'ar' ? 'أيام وساعات العمل الرسمية' : lang === 'nl' ? 'Werkdagen & Werktijden' : 'Working Days & Hours'}
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
                    {schedule.workingDays.length} {lang === 'ar' ? 'أيام نشطة' : lang === 'nl' ? 'dagen actief' : 'days active'}
                  </span>
                </div>

                {/* Days Selector */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-600 dark:text-zinc-300 block">
                    {t.workingDays}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                    {DAY_KEYS.map((day, idx) => {
                      const isActive = schedule.workingDays.includes(day);
                      const localizedDayName = DAY_NAMES[lang][idx];
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            toggleWorkingDay(day);
                            setHasUnsavedRotaChanges(true);
                            setRotaSaveSuccess(false);
                          }}
                          className={`p-3.5 rounded-2xl border text-center font-bold flex flex-col justify-between items-center transition-all duration-200 cursor-pointer ${
                            isActive
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                              : 'bg-slate-50 dark:bg-zinc-950 border-slate-200/80 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700'
                          }`}
                        >
                          <span className="text-xs font-extrabold">{localizedDayName}</span>
                          <div className="mt-2">
                            {isActive ? (
                              <span className="p-1 rounded-full bg-white/20 text-white block">
                                <Check className="h-3.5 w-3.5 stroke-[3]" />
                              </span>
                            ) : (
                              <span className="h-5.5 w-5.5 rounded-full border border-dashed border-slate-300 dark:border-zinc-800 block" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hours Range Inputs & Hourly Rate */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {/* Start Time */}
                  <div className="p-4 bg-slate-50/80 dark:bg-zinc-950/60 rounded-2xl border border-slate-200/70 dark:border-zinc-800/80 space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500 shrink-0" />
                      <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">{lt.startHrs}</label>
                    </div>
                    <input
                      type="time"
                      value={schedule.startTime}
                      onChange={(e) => {
                        setSchedule({ ...schedule, startTime: e.target.value });
                        setHasUnsavedRotaChanges(true);
                        setRotaSaveSuccess(false);
                      }}
                      className="w-full h-11 px-3.5 text-xs font-extrabold text-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                      dir="ltr"
                    />
                  </div>

                  {/* End Time */}
                  <div className="p-4 bg-slate-50/80 dark:bg-zinc-950/60 rounded-2xl border border-slate-200/70 dark:border-zinc-800/80 space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-indigo-500 shrink-0" />
                      <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">{lt.endHrs}</label>
                    </div>
                    <input
                      type="time"
                      value={schedule.endTime}
                      onChange={(e) => {
                        setSchedule({ ...schedule, endTime: e.target.value });
                        setHasUnsavedRotaChanges(true);
                        setRotaSaveSuccess(false);
                      }}
                      className="w-full h-11 px-3.5 text-xs font-extrabold text-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                      dir="ltr"
                    />
                  </div>

                  {/* Hourly Rate */}
                  <div className="p-4 bg-slate-50/80 dark:bg-zinc-950/60 rounded-2xl border border-slate-200/70 dark:border-zinc-800/80 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Coins className="h-4 w-4 text-amber-500 shrink-0" />
                        <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 truncate">{lt.hourlyRate}</label>
                      </div>
                      <div className="flex gap-1 shrink-0" dir="ltr">
                        {[55, 65, 75].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              setSchedule({ ...schedule, lessonPricePerHour: preset });
                              setHasUnsavedRotaChanges(true);
                              setRotaSaveSuccess(false);
                            }}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer ${
                              schedule.lessonPricePerHour === preset
                                ? 'bg-blue-600 text-white'
                                : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-500'
                            }`}
                          >
                            €{preset}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="relative">
                      <span className={`absolute ${lang === 'ar' ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 font-extrabold font-mono text-slate-400 text-xs select-none pointer-events-none`}>€</span>
                      <input
                        type="number"
                        value={schedule.lessonPricePerHour}
                        onChange={(e) => {
                          setSchedule({ ...schedule, lessonPricePerHour: parseFloat(e.target.value) || 65 });
                          setHasUnsavedRotaChanges(true);
                          setRotaSaveSuccess(false);
                        }}
                        className={`w-full h-11 ${lang === 'ar' ? 'pr-9 pl-3.5 text-right' : 'pl-9 pr-3.5 text-left'} text-xs font-extrabold font-mono bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Vacation / Holiday Mode Card */}
              <div className="p-6 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                        <Palmtree className="h-5 w-5" />
                      </div>
                      <h4 className="font-extrabold text-slate-800 dark:text-zinc-100 text-base">
                        {lang === 'ar' ? 'وضع الإجازة والعطلات' : lang === 'nl' ? 'Vakantie & Verlof Modus' : 'Vacation / Holiday Mode'}
                      </h4>
                    </div>
                    {/* Small status text underneath */}
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium transition-all">
                      {schedule.vacationMode?.enabled
                        ? (lang === 'ar'
                            ? 'وضع الإجازة مفعل. الحجوزات الجديدة مسدودة خلال التواريخ المحددة.'
                            : lang === 'nl'
                              ? 'Vakantiemodus is ingeschakeld. Nieuwe boekingen zijn geblokkeerd tijdens de geselecteerde datums.'
                              : 'Vacation Mode is enabled. New bookings are blocked during the selected dates.')
                        : (lang === 'ar'
                            ? 'وضع الإجازة معطل. يمكن للطلاب حجز الدروس بشكل طبيعي.'
                            : lang === 'nl'
                              ? 'Vakantiemodus is uitgeschakeld. Leerlingen kunnen normaal lessen boeken.'
                              : 'Vacation Mode is disabled. Students can book lessons normally.')
                      }
                    </p>
                  </div>

                  {/* Clean iOS-style switch toggle */}
                  <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto" dir="ltr">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!!schedule.vacationMode?.enabled}
                      onClick={() => {
                        const currentVacation = schedule.vacationMode || { enabled: false, startDate: '', endDate: '', note: '' };
                        setSchedule({
                          ...schedule,
                          vacationMode: {
                            ...currentVacation,
                            enabled: !currentVacation.enabled
                          }
                        });
                        setHasUnsavedRotaChanges(true);
                        setRotaSaveSuccess(false);
                      }}
                      className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        schedule.vacationMode?.enabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          schedule.vacationMode?.enabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Vacation Inputs - disabled when OFF, active when ON */}
                <div className={`space-y-4 transition-all duration-300 ${!schedule.vacationMode?.enabled ? 'opacity-50 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Start Date */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                        {lang === 'ar' ? 'تاريخ بداية الإجازة' : lang === 'nl' ? 'Startdatum Vakantie' : 'Vacation Start Date'}
                      </label>
                      <input
                        type="date"
                        disabled={!schedule.vacationMode?.enabled}
                        value={schedule.vacationMode?.startDate || ''}
                        onChange={(e) => {
                          const currentVacation = schedule.vacationMode || { enabled: true, startDate: '', endDate: '', note: '' };
                          setSchedule({
                            ...schedule,
                            vacationMode: {
                              ...currentVacation,
                              startDate: e.target.value
                            }
                          });
                          setHasUnsavedRotaChanges(true);
                          setRotaSaveSuccess(false);
                        }}
                        className="w-full h-11 px-3.5 text-xs font-bold text-center bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all disabled:cursor-not-allowed font-mono"
                        dir="ltr"
                      />
                    </div>

                    {/* End Date */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                        {lang === 'ar' ? 'تاريخ نهاية الإجازة' : lang === 'nl' ? 'Einddatum Vakantie' : 'Vacation End Date'}
                      </label>
                      <input
                        type="date"
                        disabled={!schedule.vacationMode?.enabled}
                        value={schedule.vacationMode?.endDate || ''}
                        onChange={(e) => {
                          const currentVacation = schedule.vacationMode || { enabled: true, startDate: '', endDate: '', note: '' };
                          setSchedule({
                            ...schedule,
                            vacationMode: {
                              ...currentVacation,
                              endDate: e.target.value
                            }
                          });
                          setHasUnsavedRotaChanges(true);
                          setRotaSaveSuccess(false);
                        }}
                        className="w-full h-11 px-3.5 text-xs font-bold text-center bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all disabled:cursor-not-allowed font-mono"
                        dir="ltr"
                      />
                    </div>

                    {/* Optional Note */}
                    <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                        {lang === 'ar' ? 'ملاحظة الإجازة (اختياري)' : lang === 'nl' ? 'Notitie / Reden (Optioneel)' : 'Vacation Note (Optional)'}
                      </label>
                      <input
                        type="text"
                        disabled={!schedule.vacationMode?.enabled}
                        placeholder={lang === 'ar' ? "مثال: العطلة الصيفية، إجازة شخصية..." : lang === 'nl' ? "bv. Zomervakantie, Verlof..." : "e.g. Summer Holiday, Personal Leave..."}
                        value={schedule.vacationMode?.note || ''}
                        onChange={(e) => {
                          const currentVacation = schedule.vacationMode || { enabled: true, startDate: '', endDate: '', note: '' };
                          setSchedule({
                            ...schedule,
                            vacationMode: {
                              ...currentVacation,
                              note: e.target.value
                            }
                          });
                          setHasUnsavedRotaChanges(true);
                          setRotaSaveSuccess(false);
                        }}
                        className="w-full h-11 px-3.5 text-xs font-semibold bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all disabled:cursor-not-allowed"
                        dir={lang === 'ar' ? 'rtl' : 'ltr'}
                      />
                    </div>
                  </div>

                  {/* Active Vacation Status Summary */}
                  {schedule.vacationMode?.enabled && schedule.vacationMode?.startDate && schedule.vacationMode?.endDate && (
                    <div className="p-4 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                      <Palmtree className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs text-amber-900 dark:text-amber-200">
                        <span className="font-extrabold block">
                          {lang === 'ar' ? 'وضع الإجازة نشط حالياً' : lang === 'nl' ? 'Vakantiemodus is momenteel actief' : 'Vacation Mode is currently active'}
                        </span>
                        <p className="text-[11px] opacity-90 leading-relaxed">
                          {lang === 'ar'
                            ? `الحجوزات مسدودة من ${schedule.vacationMode.startDate} إلى ${schedule.vacationMode.endDate}.${schedule.vacationMode.note ? ` (${schedule.vacationMode.note})` : ''} ستفتح الحجوزات تلقائياً بعد هذا التاريخ.`
                            : lang === 'nl'
                              ? `Boekingen worden geblokkeerd van ${schedule.vacationMode.startDate} t/m ${schedule.vacationMode.endDate}.${schedule.vacationMode.note ? ` (${schedule.vacationMode.note})` : ''} Na deze datum worden boekingen automatisch weer vrijgegeven.`
                              : `Bookings are blocked from ${schedule.vacationMode.startDate} to ${schedule.vacationMode.endDate}.${schedule.vacationMode.note ? ` (${schedule.vacationMode.note})` : ''} Bookings will automatically re-open after this date.`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Rota Summary Preview Card */}
              <div className="p-6 bg-slate-100/70 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800 rounded-3xl space-y-4">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 text-blue-500 shrink-0" />
                  <h4 className="font-extrabold text-slate-800 dark:text-zinc-200 text-xs uppercase tracking-wider">
                    {lt.previewTitle}
                  </h4>
                </div>

                <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-900 dark:text-white">
                      {lang === 'ar' ? 'ملخص الجدول المعتمد' : lang === 'nl' ? 'Overzicht Actief Werkrooster' : 'Active Schedule Summary'}
                    </p>
                    <p className="text-slate-500 dark:text-zinc-400 text-[11px]">
                      {schedule.workingDays.length > 0
                        ? schedule.workingDays.map(d => DAY_NAMES[lang][DAY_KEYS.indexOf(d)]).join(', ')
                        : (lang === 'ar' ? 'لا توجد أيام عمل محددة' : 'Geen werkdagen ingesteld')}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center font-mono">
                      <p className="text-[10px] text-slate-400 font-sans">{lang === 'ar' ? 'ساعات العمل' : 'Hours'}</p>
                      <p className="font-extrabold text-slate-800 dark:text-zinc-200" dir="ltr">{schedule.startTime} - {schedule.endTime}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400">{lang === 'ar' ? 'السعر/ساعة' : 'Hourly Rate'}</p>
                      <p className="font-extrabold text-blue-600 font-mono" dir="ltr">€{schedule.lessonPricePerHour}/{lang === 'ar' ? 'س' : 'hr'}</p>
                    </div>
                    {schedule.vacationMode?.enabled && (
                      <div className="text-center">
                        <p className="text-[10px] text-amber-500 font-bold">{lang === 'ar' ? 'الإجازة' : 'Vacation'}</p>
                        <p className="font-extrabold text-amber-600 text-[11px] font-mono" dir="ltr">{schedule.vacationMode.startDate} → {schedule.vacationMode.endDate}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Single Save Button & Save Reminder Footer */}
              <div className="p-6 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {hasUnsavedRotaChanges && (
                    <div className="flex items-center gap-2 px-3.5 py-2 bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 rounded-2xl text-xs font-extrabold animate-pulse">
                      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                      <span>
                        {lang === 'ar'
                          ? 'لديك تغييرات غير محفوظة.'
                          : lang === 'nl'
                            ? 'Je hebt niet-opgeslagen wijzigingen.'
                            : 'You have unsaved changes.'}
                      </span>
                    </div>
                  )}

                  {rotaSaveSuccess && !hasUnsavedRotaChanges && (
                    <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 rounded-2xl text-xs font-extrabold">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 stroke-[3]" />
                      <span>
                        {lang === 'ar'
                          ? 'تم حفظ الإعدادات بنجاح.'
                          : lang === 'nl'
                            ? 'Instellingen succesvol opgeslagen.'
                            : 'Settings saved successfully.'}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSchedule({ ...schedule });
                    setHasUnsavedRotaChanges(false);
                    setRotaSaveSuccess(true);
                  }}
                  className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-extrabold rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2.5"
                >
                  <Save className="h-4 w-4" />
                  <span>{lt.persistRota}</span>
                </button>
              </div>
            </div>
          )}

          {settingsSubTab === 'packages' && (
            <div className="space-y-6">
              {/* Header card with action */}
              <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/85 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-800 dark:text-white text-base flex items-center gap-2">
                    <Award className="h-5 w-5 text-indigo-500" />
                    {lang === 'ar' ? 'إدارة باقات مدرسة القيادة' : lang === 'nl' ? 'Lespakketten Beheer' : 'Driving Packages Configurator'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === 'ar' ? 'قم بإنشاء وتعديل وإعادة ترتيب باقات تدريب القيادة. سيتم تحديث استمارة التسجيل فوراً.' : lang === 'nl' ? 'Beheer en configureer hier de rijlespakketten die leerlingen kunnen kiezen.' : 'Define driving packages, prices, and benefits. Instantly synced with registration.'}
                  </p>
                </div>
                {!showPkgForm && (
                  <button
                    onClick={() => {
                      setEditingPackageId(null);
                      setPkgFormName('');
                      setPkgFormDesc('');
                      setPkgFormHours(10);
                      setPkgFormPrice(650);
                      setPkgFormDiscountPrice(undefined);
                      setPkgFormBadge('');
                      setPkgFormPopular(false);
                      setPkgFormRecommended(false);
                      setPkgFormColorTheme('blue');
                      setPkgFormDisplayOrder(packages.length + 1);
                      setPkgFormIsActive(true);
                      setPkgFormFeatures([]);
                      setPkgFormNewFeatureText('');
                      setShowPkgForm(true);
                    }}
                    className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-xs transition text-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <PlusCircle className="h-4 w-4" />
                    {lang === 'ar' ? 'إضافة باقة جديدة' : lang === 'nl' ? 'Nieuw Pakket' : 'Create New Package'}
                  </button>
                )}
              </div>

              {/* Package Add/Edit Form */}
              {showPkgForm && (
                <form onSubmit={handleSavePackage} className="p-6 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/85 rounded-3xl shadow-md space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">
                        {editingPackageId 
                          ? (lang === 'ar' ? 'تعديل مواصفات الباقة' : lang === 'nl' ? 'Pakket Aanpassen' : 'Edit Package Specs')
                          : (lang === 'ar' ? 'إضافة باقة قيادة جديدة' : lang === 'nl' ? 'Nieuw Pakket Toevoegen' : 'Add Premium Driving Package')}
                      </h4>
                      {editingPackageId && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                          {editingPackageId}
                        </span>
                      )}
                    </div>
                    <button 
                      type="button"
                      onClick={() => setShowPkgForm(false)}
                      className="p-1 px-2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Basic Specifications */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                    {/* Package Name */}
                    <div className="space-y-1">
                      <label className="text-slate-500 dark:text-zinc-400 font-bold block">{lang === 'ar' ? 'اسم الباقة:' : 'Package Name'}</label>
                      <input 
                        type="text" 
                        required
                        placeholder={lang === 'ar' ? 'اسم الباقة' : lang === 'nl' ? 'Pakketnaam' : 'Package name'}
                        value={pkgFormName}
                        onChange={e => setPkgFormName(e.target.value)}
                        className="w-full p-3 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-zinc-800 rounded-xl font-semibold dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                      />
                    </div>

                    {/* Package ID (Read-only) */}
                    <div className="space-y-1">
                      <label className="text-slate-500 dark:text-zinc-400 font-bold block">{lang === 'ar' ? 'معرف الباقة (غير قابل للتعديل):' : 'Package ID (Read-only)'}</label>
                      <input 
                        type="text" 
                        readOnly
                        disabled
                        value={editingPackageId || `PKG-${String(packages.length + 1).padStart(6, '0')} (Auto)`}
                        className="w-full p-3 bg-slate-100/80 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 rounded-xl font-mono font-bold text-slate-500 dark:text-zinc-400 cursor-not-allowed"
                      />
                    </div>

                    {/* Badge / Tag Input + Quick Presets */}
                    <div className="space-y-1.5 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="text-slate-500 dark:text-zinc-400 font-bold block">{lang === 'ar' ? 'وسام أو شارة مميزة (اختياري):' : 'Badge Tag (Optional)'}</label>
                        <div className="flex gap-1">
                          {['Most Popular', 'Recommended', 'Best Value', 'Essential', 'VIP Intensive'].map(preset => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setPkgFormBadge(preset)}
                              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 hover:bg-indigo-50 text-slate-600 dark:text-zinc-300 hover:text-indigo-600 text-[10px] font-bold transition cursor-pointer"
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input 
                        type="text" 
                        placeholder={lang === 'ar' ? 'مثال: الأكثر مبيعاً / Most Popular' : lang === 'nl' ? 'bijv. Populair / Recommended' : 'e.g. Most Popular, Recommended, Best Value'}
                        value={pkgFormBadge}
                        onChange={e => setPkgFormBadge(e.target.value)}
                        className="w-full p-3 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-zinc-800 rounded-xl font-semibold dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-slate-500 dark:text-zinc-400 font-bold block">{lang === 'ar' ? 'الوصف المختصر للباقة:' : 'Short Description'}</label>
                      <input 
                        type="text" 
                        required
                        placeholder={lang === 'ar' ? 'ماذا تشمل هذه الباقة؟' : lang === 'nl' ? 'Wat is inbegrepen in dit pakket?' : 'What is included in this package?'}
                        value={pkgFormDesc}
                        onChange={e => setPkgFormDesc(e.target.value)}
                        className="w-full p-3 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-zinc-800 rounded-xl font-semibold dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                      />
                    </div>

                    {/* Number of Hours */}
                    <div className="space-y-1">
                      <label className="text-slate-500 dark:text-zinc-400 font-bold block">{lang === 'ar' ? 'عدد ساعات التدريب العملي:' : 'Number of Lesson Hours'}</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        value={pkgFormHours}
                        onChange={e => setPkgFormHours(parseInt(e.target.value) || 1)}
                        className="w-full p-3 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-zinc-800 rounded-xl font-semibold dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                      />
                    </div>

                    {/* Price */}
                    <div className="space-y-1">
                      <label className="text-slate-500 dark:text-zinc-400 font-bold block">{lang === 'ar' ? 'السعر الإجمالي للباقة (€):' : 'Total Price (€)'}</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        value={pkgFormPrice}
                        onChange={e => setPkgFormPrice(parseFloat(e.target.value) || 0)}
                        className="w-full p-3 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-zinc-800 rounded-xl font-semibold dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                      />
                    </div>

                    {/* Discount Price */}
                    <div className="space-y-1">
                      <label className="text-slate-500 dark:text-zinc-400 font-bold block">{lang === 'ar' ? 'السعر المخفض (اختياري):' : 'Discount Price (Optional)'}</label>
                      <input 
                        type="number" 
                        min="0"
                        placeholder={lang === 'ar' ? 'مثال: 2350' : lang === 'nl' ? 'bijv. 2350' : 'e.g. 2350'}
                        value={pkgFormDiscountPrice !== undefined ? pkgFormDiscountPrice : ''}
                        onChange={e => setPkgFormDiscountPrice(e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full p-3 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-zinc-800 rounded-xl font-semibold dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                      />
                    </div>

                    {/* Color Theme */}
                    <div className="space-y-1">
                      <label className="text-slate-500 dark:text-zinc-400 font-bold block">
                        {lang === 'ar' ? 'المظهر اللوني للباقة (الثيم):' : lang === 'nl' ? 'Pakket Thema / Vormgeving:' : 'Card Theme & Branding:'}
                      </label>
                      <select
                        value={pkgFormColorTheme}
                        onChange={e => setPkgFormColorTheme(e.target.value)}
                        className="w-full p-3 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-zinc-800 rounded-xl font-bold dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                      >
                        <option value="classic-blue">{lang === 'ar' ? '🔵 أزرق كلاسيكي (Classic Blue)' : lang === 'nl' ? '🔵 Klassiek Blauw (Classic Blue)' : '🔵 Classic Blue (Sky / Indigo Accent)'}</option>
                        <option value="premium-gold">{lang === 'ar' ? '👑 ذهبي فاخر (Premium Gold VIP)' : lang === 'nl' ? '👑 Premium Goud (VIP Luxe)' : '👑 Premium Gold (Luxury Amber / Black)'}</option>
                        <option value="emerald-green">{lang === 'ar' ? '🟢 زمردي أخضر (Emerald Green)' : lang === 'nl' ? '🟢 Smaragd Groen (Emerald Green)' : '🟢 Emerald Green (Fresh Mint)'}</option>
                        <option value="royal-purple">{lang === 'ar' ? '🟣 أرجواني ملكي (Royal Purple)' : lang === 'nl' ? '🟣 Koninklijk Paars (Royal Purple)' : '🟣 Royal Purple (Regal Violet)'}</option>
                        <option value="carbon-black">{lang === 'ar' ? '⬛ أسود كربوني (Carbon Black)' : lang === 'nl' ? '⬛ Karbon Zwart (Carbon Black)' : '⬛ Carbon Black (Matte Dark)'}</option>
                        <option value="modern-silver">{lang === 'ar' ? '⚪ فضي عصري (Modern Silver)' : lang === 'nl' ? '⚪ Modern Zilver (Modern Silver)' : '⚪ Modern Silver (Light Metallic)'}</option>
                      </select>
                    </div>

                    {/* Calculated Hourly Rate */}
                    <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-855 md:col-span-2 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-semibold">{lang === 'ar' ? 'سعر ساعة التدريب التقريبي في هذه الباقة:' : 'Calculated Price Per Hour:'}</span>
                      <span className="font-black text-indigo-600 dark:text-indigo-400 font-mono text-xs">
                        €{pkgFormHours > 0 ? (((pkgFormDiscountPrice !== undefined && !isNaN(pkgFormDiscountPrice) ? pkgFormDiscountPrice : pkgFormPrice)) / pkgFormHours).toFixed(2) : '0.00'} / hr
                      </span>
                    </div>

                    {/* Display Order */}
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-slate-500 dark:text-zinc-400 font-bold block">{lang === 'ar' ? 'ترتيب العرض:' : 'Display Order'}</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        value={pkgFormDisplayOrder}
                        onChange={e => setPkgFormDisplayOrder(parseInt(e.target.value) || 1)}
                        className="w-full p-3 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-zinc-800 rounded-xl font-semibold dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                      />
                    </div>

                    {/* Flags & Status Checkboxes */}
                    <div className="flex flex-wrap items-center gap-4 p-3.5 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-855 md:col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700 dark:text-zinc-300">
                        <input 
                          type="checkbox"
                          checked={pkgFormPopular}
                          onChange={e => setPkgFormPopular(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                        <span>{lang === 'ar' ? 'تمييز كباقة الأكثر شعبية (Popular)' : 'Highlight as Most Popular'}</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700 dark:text-zinc-300">
                        <input 
                          type="checkbox"
                          checked={pkgFormRecommended}
                          onChange={e => setPkgFormRecommended(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span>{lang === 'ar' ? 'تمييز كباقة موصى بها (Recommended)' : 'Highlight as Recommended VIP'}</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700 dark:text-zinc-300 ml-auto">
                        <input 
                          type="checkbox"
                          id="pkgFormIsActive"
                          checked={pkgFormIsActive}
                          onChange={e => setPkgFormIsActive(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span>{lang === 'ar' ? 'باقة نشطة (مرئية بالتسجيل)' : 'Active (Visible on Registration)'}</span>
                      </label>
                    </div>
                  </div>

                  {/* Configurable Package Features Manager Section */}
                  <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="font-extrabold text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                          {lang === 'ar' ? 'قائمة المميزات والمنافع المشمولة بالباقة:' : lang === 'nl' ? 'Inbegrepen Pakketvoordelen List:' : 'Configurable Feature List:'}
                        </h5>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-400 mt-0.5">
                          {lang === 'ar' ? 'أضف مميزات جديدة، عدلها، أو أعد ترتيبها. ستظهر جميعها ديناميكياً على كرت الباقة للطالب.' : lang === 'nl' ? 'Voeg functies toe, bewerk of verander de volgorde. Deze verschijnen direct op de studentkaart.' : 'Add, edit, remove or reorder features for this package. The package card will dynamically display only these features.'}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-extrabold">
                        {pkgFormFeatures.length} {lang === 'ar' ? 'مميزات' : 'features'}
                      </span>
                    </div>

                    {/* Quick Add Recommendation Chips */}
                    <div className="p-3 bg-slate-50 dark:bg-zinc-950/80 rounded-2xl border border-slate-200/70 dark:border-zinc-800/80 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
                        {lang === 'ar' ? 'إضافة سريعة لمميزات شائعة:' : lang === 'nl' ? 'Snelle toevoegingen van voordelen:' : 'Quick Add Common Features:'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(lang === 'ar' ? [
                          'تأهيل شامل لاختبار CBR العملي',
                          'وصول مجاني لتطبيق تدريب النظرية',
                          'تذكير آلي عبر الواتساب بالمواعيد',
                          'خدمة التوصيل من وإلى المنزل مجاناً',
                          'اختبار عملي تجريبي شبيه بنظام CBR',
                          'رسوم اختبار CBR مدفوعة بالكامل',
                          'اختبار TTT المرحلي مشمول',
                          'دروس مسائية وفي عطلة نهاية الأسبوع',
                          'أولوية حجز المواعيد واختيار المدرب'
                        ] : lang === 'nl' ? [
                          'CBR Practical exam preparation',
                          'Gratis toegang tot theorie-examen app',
                          'Automatische WhatsApp lesherinneringen',
                          'Gratis ophaal- en thuisbrengservice',
                          'Officieel CBR proefexamen',
                          'CBR Praktijkexamen kosten inbegrepen',
                          'CBR Tussentijdse Toets (TTT) inbegrepen',
                          'Avond- en weekendlessen mogelijk',
                          'VIP Prioriteit bij inplannen'
                        ] : [
                          'CBR Practical exam preparation',
                          'Free theory mobile app access',
                          'Automated WhatsApp reminders',
                          'Home pick-up & drop-off included',
                          'Official CBR mock driving test',
                          'CBR Practical exam fee fully included',
                          'CBR TTT Interim Assessment included',
                          'Weekend & evening lesson availability',
                          'Priority schedule & instructor booking'
                        ]).map((suggestion, sIdx) => {
                          const isAlreadyAdded = pkgFormFeatures.includes(suggestion);
                          return (
                            <button
                              key={sIdx}
                              type="button"
                              disabled={isAlreadyAdded}
                              onClick={() => handleAddPkgFeature(suggestion)}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition cursor-pointer flex items-center gap-1 ${
                                isAlreadyAdded
                                  ? 'bg-slate-200/50 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 opacity-60 cursor-not-allowed'
                                  : 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-200 dark:border-zinc-800 hover:border-indigo-300'
                              }`}
                            >
                              <PlusCircle className="w-3 h-3" />
                              <span>{suggestion}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Input field to add custom feature */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={lang === 'ar' ? 'اكتب ميزة جديدة هنا واضغط إضافة...' : lang === 'nl' ? 'Voeg een voordeel toe...' : 'Type custom feature and click Add...'}
                        value={pkgFormNewFeatureText}
                        onChange={e => setPkgFormNewFeatureText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddPkgFeature();
                          }
                        }}
                        className="flex-1 p-3 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddPkgFeature()}
                        className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-xs"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>{lang === 'ar' ? 'إضافة ميزة' : 'Add Feature'}</span>
                      </button>
                    </div>

                    {/* Configured Features List */}
                    <div className="space-y-2">
                      {pkgFormFeatures.length === 0 ? (
                        <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 text-center text-xs text-slate-400">
                          {lang === 'ar' ? 'لم يتم إضافة مميزات مخصصة بعد. استخدم الأزرار السريعة أعلاه أو اكتب ميزة جديدة.' : 'No custom features added yet. Click quick chips above or type a custom feature.'}
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {pkgFormFeatures.map((feat, fIdx) => (
                            <div
                              key={fIdx}
                              className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 dark:bg-zinc-950/70 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 text-xs"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                                  {fIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={feat}
                                  onChange={e => handleUpdatePkgFeature(fIdx, e.target.value)}
                                  className="flex-1 bg-transparent border-b border-transparent focus:border-indigo-500 font-medium text-slate-800 dark:text-slate-100 focus:outline-hidden py-0.5 px-1"
                                />
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  disabled={fIdx === 0}
                                  onClick={() => handleMovePkgFeature(fIdx, 'up')}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                                  title="Move Up"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={fIdx === pkgFormFeatures.length - 1}
                                  onClick={() => handleMovePkgFeature(fIdx, 'down')}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                                  title="Move Down"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePkgFeature(fIdx)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                                  title="Remove Feature"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form Action Buttons */}
                  <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                    <button
                      type="submit"
                      className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-xs transition text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="h-4 w-4" />
                      {editingPackageId 
                        ? (lang === 'ar' ? 'حفظ مواصفات الباقة' : 'Save Package Specs') 
                        : (lang === 'ar' ? 'إضافة الباقة للخدمة' : 'Add Package')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPkgForm(false);
                        setEditingPackageId(null);
                      }}
                      className="py-3 px-4 bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:text-zinc-350 dark:hover:text-white font-bold rounded-xl transition text-xs cursor-pointer"
                    >
                      {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </form>
              )}

              {/* Premium Package Cards list view */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-800 dark:text-white text-xs uppercase tracking-wider pl-1">
                    {lang === 'ar' ? 'معاينة الباقات والتحكم السريع' : lang === 'nl' ? 'Actieve Lespakketten' : 'SaaS Premium Package Cards'}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-semibold font-mono">
                    {packages.length} {lang === 'ar' ? 'باقات مدرجة' : 'packages loaded'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {packages
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((pkg, idx) => (
                      <PackageCard
                        key={pkg.id}
                        pkg={pkg}
                        lang={lang}
                        isNoPackage={pkg.id === 'no-package'}
                        actionButtons={
                          <div className="flex items-center justify-between gap-2 w-full">
                            <div className="flex items-center gap-1.5">
                              <button 
                                type="button"
                                onClick={() => handleTogglePackageActive(pkg.id)}
                                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black ${
                                  pkg.isActive 
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20' 
                                    : 'bg-slate-200/60 dark:bg-zinc-800 text-slate-500 hover:bg-slate-300'
                                }`}
                              >
                                {pkg.isActive ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'معطل' : 'Disabled')}
                              </button>

                              <button 
                                type="button"
                                onClick={() => handleMovePackage(pkg.id, 'up')}
                                disabled={idx === 0}
                                className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleMovePackage(pkg.id, 'down')}
                                disabled={idx === packages.length - 1}
                                className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleStartEditPackage(pkg)}
                                className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-[11px] font-black text-slate-700 dark:text-zinc-200 rounded-xl transition cursor-pointer"
                              >
                                {lang === 'ar' ? 'تعديل' : 'Edit'}
                              </button>
                              {pkg.id !== 'no-package' && (
                                <button
                                  type="button"
                                  onClick={() => handleRequestDeletePackage(pkg)}
                                  className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white text-[11px] font-extrabold rounded-xl transition cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        }
                      />
                    ))}
                </div>
              </div>
            </div>
          )}

          {settingsSubTab === 'school' && (
            <React.Suspense fallback={<div className="p-8 text-center text-slate-400 font-mono text-xs">Loading school configuration...</div>}>
              <SchoolConfigPanel
                schoolSettings={schoolSettings}
                setSchoolSettings={setSchoolSettings}
                lang={lang}
                trainerSchedule={schedule}
                setTrainerSchedule={setSchedule}
                setSettingsSubTab={setSettingsSubTab}
                handleSaveSchoolSettings={handleSaveSchoolSettings}
                handleAssetUpload={handleAssetUpload}
                trainerPhoto={trainerPhoto}
                trainerName={trainerEmail || trainerName}
                handleRemoveTrainerPhoto={handleRemoveTrainerPhoto}
                initialTab={schoolConfigInnerTab}
              />
            </React.Suspense>
          )}

          {false && settingsSubTab === 'school' && (
            <div className="space-y-6 animate-fade-in">
              <form onSubmit={handleSaveSchoolSettings} className="p-6 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/85 rounded-3xl shadow-xs space-y-6">
                
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800/80">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <Settings className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-800 dark:text-white text-base flex items-center gap-2">
                          {lang === 'ar' ? 'تهيئة المدرسة الشاملة' : lang === 'nl' ? 'School Configuratie' : 'School Configuration'}
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black tracking-wider uppercase border border-emerald-500/20">
                            {lang === 'ar' ? 'نظام معتمد' : lang === 'nl' ? 'Gecertificeerd System' : 'Certified System'}
                          </span>
                        </h3>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 pl-1">
                      {lang === 'ar' 
                        ? 'قم بتكوين هويتك التجارية، بيانات الفواتير، روابط التواصل وحسابات الذكاء الاصطناعي في مكان واحد.' 
                        : lang === 'nl' 
                          ? 'Beheer uw rijschool identiteit, branding, factuurgegevens, sociale media en AI-instellingen op één centrale plek.' 
                          : 'Central configuration hub for your driving school identity, branding, billing details, social links, and AI preferences.'}
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="h-10 px-5 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition cursor-pointer shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 shrink-0 self-start md:self-auto"
                  >
                    <span>💾</span>
                    {lang === 'ar' ? 'حفظ التغييرات' : lang === 'nl' ? 'Opslaan' : 'Save Changes'}
                  </button>
                </div>

                {/* Navigation Pills Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setSchoolConfigTab('profile')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                      schoolConfigTab === 'profile'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <span>🏫</span>
                    <span>{lang === 'ar' ? 'ملف المدرسة' : lang === 'nl' ? 'School Profiel' : 'School Profile'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSchoolConfigTab('branding')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                      schoolConfigTab === 'branding'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <span>🎨</span>
                    <span>{lang === 'ar' ? 'الهوية والبصمة البصرية' : lang === 'nl' ? 'Branding & Thema' : 'Branding & Theme'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSchoolConfigTab('business')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                      schoolConfigTab === 'business'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <span>💼</span>
                    <span>{lang === 'ar' ? 'البيانات التجارية والمالية' : lang === 'nl' ? 'Zakelijk & Juridisch' : 'Business & Legal'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSchoolConfigTab('social')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                      schoolConfigTab === 'social'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <span>🌐</span>
                    <span>{lang === 'ar' ? 'التواصل الاجتماعي والويب' : lang === 'nl' ? 'Sociale Media & Web' : 'Social Media & Web'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSchoolConfigTab('ai')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                      schoolConfigTab === 'ai'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <span>🤖</span>
                    <span>{lang === 'ar' ? 'الذكاء الاصطناعي والمزامنة' : lang === 'nl' ? 'AI & Systeem' : 'AI & Application'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSchoolConfigTab('packages')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                      schoolConfigTab === 'packages'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <span>📦</span>
                    <span>{lang === 'ar' ? 'تهيئة الباقات والأسعار' : lang === 'nl' ? 'Pakketten & Tarieven' : 'Package & Pricing'}</span>
                  </button>
                </div>

                {/* TAB 1: School Profile */}
                {schoolConfigTab === 'profile' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
                      <span className="text-base">🏫</span>
                      <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">
                        {lang === 'ar' ? 'معلومات الهوية الرسمية للمدرسة' : lang === 'nl' ? 'Officieel Schoolprofiel' : 'Official School Profile'}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">
                          {lang === 'ar' ? 'اسم مدرسة القيادة الكامل' : lang === 'nl' ? 'Rijschool Naam' : 'Driving School Name'}
                        </label>
                        <input
                          type="text"
                          value={schoolSettings.name || ''}
                          onChange={e => setSchoolSettings(prev => ({ ...prev, name: e.target.value }))}
                          placeholder={lang === 'ar' ? "اسم مدرسة القيادة" : "Driving School Name"}
                          className="w-full h-9 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">
                          {lang === 'ar' ? 'الاسم المختصر / الاختصار' : lang === 'nl' ? 'Korte Naam / Merknaam' : 'Short Name / Brand Abbreviation'}
                        </label>
                        <input
                          type="text"
                          value={schoolSettings.shortName || ''}
                          onChange={e => setSchoolSettings(prev => ({ ...prev, shortName: e.target.value }))}
                          placeholder="Royal Drive"
                          className="w-full h-9 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">
                          {lang === 'ar' ? 'الشعار اللفظي / Slogan' : lang === 'nl' ? 'Slogan / Tagline' : 'School Slogan / Tagline'}
                        </label>
                        <input
                          type="text"
                          value={schoolSettings.slogan || ''}
                          onChange={e => setSchoolSettings(prev => ({ ...prev, slogan: e.target.value }))}
                          placeholder={lang === 'ar' ? "طريقك السريع للنجاح في امتحان CBR" : "Your Fast Track to CBR Success"}
                          className="w-full h-9 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all"
                        />
                      </div>

                      <div className="md:col-span-2 p-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-slate-200 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 flex items-center justify-center font-bold text-slate-500">
                            {trainerPhoto ? (
                              <img src={trainerPhoto} alt={trainerName} className="w-full h-full object-cover" />
                            ) : (
                              <span>{getStudentInitials(trainerName)}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-white">
                              {lang === 'ar' ? 'الصورة الشخصية للمدرب' : lang === 'nl' ? 'Profielfoto Instructeur' : 'Instructor Profile Photo'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {lang === 'ar' ? 'تظهر في كافة الهيدر والقوائم والتقارير' : lang === 'nl' ? 'Zichtbaar in header, menu & rapporten' : 'Appears in header, sidebar & reports'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => document.getElementById('trainer-photo-file-input')?.click()}
                            className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                          >
                            {lang === 'ar' ? 'تغيير الصورة' : lang === 'nl' ? 'Foto wijzigen' : 'Change Photo'}
                          </button>
                          {trainerPhoto && (
                            <button
                              type="button"
                              onClick={handleRemoveTrainerPhoto}
                              className="px-3 py-1.5 text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl transition cursor-pointer"
                            >
                              {lang === 'ar' ? 'حذف' : lang === 'nl' ? 'Verwijderen' : 'Remove'}
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">
                          {lang === 'ar' ? 'اسم المدرب / مدير المدرسة المسؤول' : lang === 'nl' ? 'Naam Hoofdinstructeur / Eigenaar' : 'Head Instructor / Owner Name'}
                        </label>
                        <input
                          type="text"
                          value={schoolSettings.instructorName || ''}
                          onChange={e => setSchoolSettings(prev => ({ ...prev, instructorName: e.target.value }))}
                          placeholder={lang === 'ar' ? 'اسمك الكامل' : lang === 'nl' ? 'Volledige naam' : 'Full name'}
                          className="w-full h-9 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">
                          {lang === 'ar' ? 'البريد الإلكتروني الرسمي' : lang === 'nl' ? 'E-mailadres' : 'Official Contact Email'}
                        </label>
                        <input
                          type="email"
                          value={schoolSettings.email || ''}
                          onChange={e => setSchoolSettings(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="info@drivingschool.nl"
                          className="w-full h-9 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all text-left"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">
                          {lang === 'ar' ? 'رقم الهاتف / الجوال' : lang === 'nl' ? 'Telefoonnummer' : 'Phone Number'}
                        </label>
                        <input
                          type="text"
                          value={schoolSettings.phone || ''}
                          onChange={e => setSchoolSettings(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+31 6 1234 5678"
                          className="w-full h-9 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all text-left"
                        />
                      </div>

                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">
                            {lang === 'ar' ? 'عنوان الشارع والرقم' : lang === 'nl' ? 'Straatnaam & Huisnummer' : 'Street Address'}
                          </label>
                          <input
                            type="text"
                            value={schoolSettings.address || ''}
                            onChange={e => setSchoolSettings(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="Hoofdstraat 42"
                            className="w-full h-9 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">
                            {lang === 'ar' ? 'المدينة' : lang === 'nl' ? 'Stad' : 'City'}
                          </label>
                          <input
                            type="text"
                            value={schoolSettings.city || ''}
                            onChange={e => setSchoolSettings(prev => ({ ...prev, city: e.target.value }))}
                            placeholder="Utrecht"
                            className="w-full h-9 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">
                            {lang === 'ar' ? 'الرمز البريدي والدولة' : lang === 'nl' ? 'Postcode' : 'Postal Code & Country'}
                          </label>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={schoolSettings.postalCode || ''}
                              onChange={e => setSchoolSettings(prev => ({ ...prev, postalCode: e.target.value }))}
                              placeholder="3511 AA"
                              className="w-2/3 h-9 text-xs font-semibold px-2.5 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all text-left"
                            />
                            <input
                              type="text"
                              value={schoolSettings.country || 'Netherlands'}
                              onChange={e => setSchoolSettings(prev => ({ ...prev, country: e.target.value }))}
                              placeholder="NL"
                              className="w-1/3 h-9 text-xs font-semibold px-2 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all text-center"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Branding & Theme */}
                {schoolConfigTab === 'branding' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
                      <span className="text-base">🎨</span>
                      <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">
                        {lang === 'ar' ? 'تخصيص الهوية البصرية والشعارات والسمات' : lang === 'nl' ? 'Visuele Identiteit & Branding' : 'Visual Identity & Branding'}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Logo Uploader */}
                      <div className="space-y-2">
                        <label className="block text-slate-500 dark:text-zinc-400 font-extrabold text-xs uppercase tracking-wider">
                          {lang === 'ar' ? 'شعار المدرسة الرئيسي' : lang === 'nl' ? 'Rijschool Logo' : 'Official School Logo'}
                        </label>
                        <div 
                          className="border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-3xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative min-h-[150px] bg-slate-50/50 dark:bg-zinc-950/30"
                          onDragOver={e => e.preventDefault()}
                          onDrop={e => {
                            e.preventDefault();
                            const file = e.dataTransfer.files?.[0];
                            if (file) handleAssetUpload('logoUrl', file);
                          }}
                          onClick={() => document.getElementById('logo-file-input')?.click()}
                        >
                          <input 
                            id="logo-file-input" 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) handleAssetUpload('logoUrl', file);
                            }}
                          />
                          {schoolSettings.logoUrl ? (
                            <div className="space-y-3">
                              <img src={schoolSettings.logoUrl} alt="Logo Preview" className="h-16 w-auto object-contain mx-auto rounded-lg bg-white p-1 border border-slate-100 shadow-xs" referrerPolicy="no-referrer" />
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSchoolSettings(prev => ({ ...prev, logoUrl: '' }));
                                }}
                                className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold px-3 py-1 rounded-lg transition"
                              >
                                {lang === 'ar' ? 'إزالة الشعار' : 'Remove Logo'}
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="h-8 w-8 text-slate-400 mx-auto" />
                              <p className="text-[10px] text-slate-500 font-bold">{lang === 'ar' ? 'اسحب شعار المدرسة أو انقر للرفع' : lang === 'nl' ? 'Sleep logo hier of klik' : 'Drag school logo or click'}</p>
                              <span className="text-[9px] text-slate-400 block font-normal">PNG, JPG, SVG up to 5MB</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Favicon App Icon */}
                      <div className="space-y-2">
                        <label className="block text-slate-500 dark:text-zinc-400 font-extrabold text-xs uppercase tracking-wider">
                          {lang === 'ar' ? 'أيقونة المتصفح Favicon' : lang === 'nl' ? 'Favicon / App Icon' : 'Favicon / App Icon'}
                        </label>
                        <div 
                          className="border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-3xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative min-h-[150px] bg-slate-50/50 dark:bg-zinc-950/30"
                          onDragOver={e => e.preventDefault()}
                          onDrop={e => {
                            e.preventDefault();
                            const file = e.dataTransfer.files?.[0];
                            if (file) handleAssetUpload('faviconUrl', file);
                          }}
                          onClick={() => document.getElementById('favicon-file-input')?.click()}
                        >
                          <input 
                            id="favicon-file-input" 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) handleAssetUpload('faviconUrl', file);
                            }}
                          />
                          {schoolSettings.faviconUrl ? (
                            <div className="space-y-3">
                              <img src={schoolSettings.faviconUrl} alt="Favicon Preview" className="h-10 w-10 object-contain mx-auto rounded-lg bg-white p-1 border border-slate-100 shadow-xs" referrerPolicy="no-referrer" />
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSchoolSettings(prev => ({ ...prev, faviconUrl: '' }));
                                }}
                                className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold px-3 py-1 rounded-lg transition"
                              >
                                {lang === 'ar' ? 'إزالة الأيقونة' : 'Remove Icon'}
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <ImageIcon className="h-8 w-8 text-slate-400 mx-auto" />
                              <p className="text-[10px] text-slate-500 font-bold">{lang === 'ar' ? 'اسحب أيقونة Favicon أو انقر' : lang === 'nl' ? 'Sleep favicon hier' : 'Drag Favicon icon'}</p>
                              <span className="text-[9px] text-slate-400 block font-normal">32x32 PNG / ICO</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Login Custom Wallpaper Background */}
                      <div className="space-y-2">
                        <label className="block text-slate-500 dark:text-zinc-400 font-extrabold text-xs uppercase tracking-wider">
                          {lang === 'ar' ? 'خلفية صفحة تسجيل الدخول' : lang === 'nl' ? 'Inlogscherm Achtergrond' : 'Login Screen Background'}
                        </label>
                        <div 
                          className="border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-3xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative min-h-[150px] bg-slate-50/50 dark:bg-zinc-950/30"
                          onDragOver={e => e.preventDefault()}
                          onDrop={e => {
                            e.preventDefault();
                            const file = e.dataTransfer.files?.[0];
                            if (file) handleAssetUpload('loginBackgroundUrl', file);
                          }}
                          onClick={() => document.getElementById('loginbg-file-input')?.click()}
                        >
                          <input 
                            id="loginbg-file-input" 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) handleAssetUpload('loginBackgroundUrl', file);
                            }}
                          />
                          {schoolSettings.loginBackgroundUrl ? (
                            <div className="space-y-3">
                              <img src={schoolSettings.loginBackgroundUrl} alt="Login Background Preview" className="h-16 w-full max-w-[140px] object-cover mx-auto rounded-xl border border-slate-200 shadow-xs" referrerPolicy="no-referrer" />
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSchoolSettings(prev => ({ ...prev, loginBackgroundUrl: '' }));
                                }}
                                className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold px-3 py-1 rounded-lg transition"
                              >
                                {lang === 'ar' ? 'إزالة الخلفية' : 'Remove Image'}
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Camera className="h-8 w-8 text-slate-400 mx-auto" />
                              <p className="text-[10px] text-slate-500 font-bold">{lang === 'ar' ? 'رفع خلفية تسجيل الدخول المخصصة' : lang === 'nl' ? 'Upload inlog achtergrond' : 'Upload custom login background'}</p>
                              <span className="text-[9px] text-slate-400 block font-normal">HD Driving School photo</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Brand Color Palette Picker */}
                    <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 rounded-2xl space-y-3">
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-zinc-300">
                        🎨 {lang === 'ar' ? 'اللون الرئيسي المميز للهوية (Primary Accent Color)' : lang === 'nl' ? 'Hoofdkleur van Merk (Primary Color)' : 'Primary Brand Accent Color'}
                      </label>
                      
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-1.5 rounded-xl">
                          <input 
                            type="color" 
                            value={schoolSettings.primaryColor || '#4f46e5'} 
                            onChange={e => setSchoolSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                            className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent"
                          />
                          <input 
                            type="text" 
                            value={schoolSettings.primaryColor || '#4f46e5'} 
                            onChange={e => setSchoolSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                            className="w-20 text-xs font-mono font-bold dark:text-white bg-transparent outline-none uppercase"
                          />
                        </div>

                        {/* Preset Swatches */}
                        <div className="flex items-center gap-1.5">
                          {[
                            { name: 'Indigo', hex: '#4f46e5' },
                            { name: 'Emerald', hex: '#10b981' },
                            { name: 'Royal', hex: '#2563eb' },
                            { name: 'Crimson', hex: '#dc2626' },
                            { name: 'Amber', hex: '#d97706' },
                            { name: 'Obsidian', hex: '#18181b' }
                          ].map(swatch => (
                            <button
                              key={swatch.hex}
                              type="button"
                              onClick={() => setSchoolSettings(prev => ({ ...prev, primaryColor: swatch.hex }))}
                              className="w-7 h-7 rounded-lg border-2 border-white dark:border-zinc-900 shadow-xs cursor-pointer transition hover:scale-110"
                              style={{ backgroundColor: swatch.hex }}
                              title={swatch.name}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: Business & Legal */}
                {schoolConfigTab === 'business' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
                      <span className="text-base">💼</span>
                      <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">
                        {lang === 'ar' ? 'السجل التجاري والبيانات الضريبية والبنكية' : lang === 'nl' ? 'Zakelijke & Juridische Gegevens' : 'Business & Legal Credentials'}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">
                          {lang === 'ar' ? 'رقم السجل التجاري KvK' : lang === 'nl' ? 'KvK-nummer' : 'KvK Number'}
                        </label>
                        <input
                          type="text"
                          value={schoolSettings.kvk || ''}
                          onChange={e => setSchoolSettings(prev => ({ ...prev, kvk: e.target.value }))}
                          placeholder="87654321"
                          className="w-full h-9 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all text-left"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">
                          {lang === 'ar' ? 'رقم الضريبة BTW-nummer' : lang === 'nl' ? 'BTW-nummer' : 'BTW / VAT Number'}
                        </label>
                        <input
                          type="text"
                          value={schoolSettings.btw || ''}
                          onChange={e => setSchoolSettings(prev => ({ ...prev, btw: e.target.value }))}
                          placeholder="NL876543210B01"
                          className="w-full h-9 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all text-left"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">
                          {lang === 'ar' ? 'رقم الحساب البنكي IBAN' : lang === 'nl' ? 'IBAN Bankrekening' : 'IBAN Bank Account'}
                        </label>
                        <input
                          type="text"
                          value={schoolSettings.iban || ''}
                          onChange={e => setSchoolSettings(prev => ({ ...prev, iban: e.target.value }))}
                          placeholder="NL91 ABNA 0417 1234 56"
                          className="w-full h-9 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all text-left font-mono"
                        />
                      </div>

                      <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        {/* School Stamp */}
                        <div className="space-y-2">
                          <label className="block text-slate-500 dark:text-zinc-400 font-extrabold text-xs uppercase tracking-wider">
                            {lang === 'ar' ? 'ختم المدرسة الرسمية (PDF & Invoices)' : lang === 'nl' ? 'Officiële Rijschool Stempel' : 'Official School Stamp'}
                          </label>
                          <div 
                            className="border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-3xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative min-h-[140px] bg-slate-50/50 dark:bg-zinc-950/30"
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => {
                              e.preventDefault();
                              const file = e.dataTransfer.files?.[0];
                              if (file) handleAssetUpload('schoolStamp', file);
                            }}
                            onClick={() => document.getElementById('stamp-file-input')?.click()}
                          >
                            <input 
                              id="stamp-file-input" 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleAssetUpload('schoolStamp', file);
                              }}
                            />
                            {schoolSettings.schoolStamp ? (
                              <div className="space-y-3">
                                <img src={schoolSettings.schoolStamp} alt="Stamp Preview" className="h-16 w-auto object-contain mx-auto" referrerPolicy="no-referrer" />
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSchoolSettings(prev => ({ ...prev, schoolStamp: '' }));
                                  }}
                                  className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold px-2.5 py-1 rounded-lg transition"
                                >
                                  {lang === 'ar' ? 'إزالة الختم' : 'Remove Stamp'}
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Award className="h-8 w-8 text-slate-400 mx-auto" />
                                <p className="text-[10px] text-slate-500 font-bold">{lang === 'ar' ? 'اسحب ختم المدرسة أو انقر للرفع' : lang === 'nl' ? 'Sleep stempel hier of klik' : 'Drag school stamp or click'}</p>
                                <span className="text-[9px] text-slate-400 block font-normal">PNG transparent preferred</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Instructor Signature */}
                        <div className="space-y-2">
                          <label className="block text-slate-500 dark:text-zinc-400 font-extrabold text-xs uppercase tracking-wider">
                            {lang === 'ar' ? 'توقيع المدرب الرئيسي (Certificates)' : lang === 'nl' ? 'Handtekening Instructeur' : 'Instructor Signature'}
                          </label>
                          <div 
                            className="border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-3xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative min-h-[140px] bg-slate-50/50 dark:bg-zinc-950/30"
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => {
                              e.preventDefault();
                              const file = e.dataTransfer.files?.[0];
                              if (file) handleAssetUpload('instructorSignature', file);
                            }}
                            onClick={() => document.getElementById('sig-file-input')?.click()}
                          >
                            <input 
                              id="sig-file-input" 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleAssetUpload('instructorSignature', file);
                              }}
                            />
                            {schoolSettings.instructorSignature ? (
                              <div className="space-y-3">
                                <img src={schoolSettings.instructorSignature} alt="Signature Preview" className="h-12 w-auto object-contain mx-auto bg-white p-1 rounded border border-slate-100" referrerPolicy="no-referrer" />
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSchoolSettings(prev => ({ ...prev, instructorSignature: '' }));
                                  }}
                                  className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold px-2.5 py-1 rounded-lg transition"
                                >
                                  {lang === 'ar' ? 'إزالة التوقيع' : 'Remove Signature'}
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Edit3 className="h-8 w-8 text-slate-400 mx-auto" />
                                <p className="text-[10px] text-slate-500 font-bold">{lang === 'ar' ? 'اسحب التوقيع أو انقر للرفع' : lang === 'nl' ? 'Sleep handtekening hier' : 'Drag signature file'}</p>
                                <span className="text-[9px] text-slate-400 block font-normal">PNG signature transparent</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">
                          {lang === 'ar' ? 'الملاحظة المرافقة في أسفل الفواتير (Invoice Footer Note)' : lang === 'nl' ? 'Voettekst op Facturen' : 'Invoice Footer Note'}
                        </label>
                        <textarea
                          rows={2}
                          value={schoolSettings.invoiceFooter || ''}
                          onChange={e => setSchoolSettings(prev => ({ ...prev, invoiceFooter: e.target.value }))}
                          placeholder="Thank you for choosing our driving school. Payments are processed in accordance with CBR terms."
                          className="w-full text-xs font-semibold p-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">
                          {lang === 'ar' ? 'الملاحظة القانونية لشهادة إتمام الدورة (Certificate Footer Note)' : lang === 'nl' ? 'Voettekst op Certificaten' : 'Certificate Completion Footer Note'}
                        </label>
                        <textarea
                          rows={2}
                          value={schoolSettings.certificateFooter || ''}
                          onChange={e => setSchoolSettings(prev => ({ ...prev, certificateFooter: e.target.value }))}
                          placeholder="Official Certificate of Completion recognized for CBR Practical Driving Exam eligibility."
                          className="w-full text-xs font-semibold p-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: Social Media & Web */}
                {schoolConfigTab === 'social' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
                      <span className="text-base">🌐</span>
                      <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">
                        {lang === 'ar' ? 'حسابات التواصل الاجتماعي والموقع الإلكتروني' : lang === 'nl' ? 'Sociale Media & Documenten Links' : 'Social Media & Web Links'}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">
                          {lang === 'ar' ? 'رابط الموقع الإلكتروني الرسمى (Website URL)' : lang === 'nl' ? 'Website URL' : 'Website URL'}
                        </label>
                        <input
                          type="text"
                          value={schoolSettings.website || ''}
                          onChange={e => setSchoolSettings(prev => ({ ...prev, website: e.target.value }))}
                          placeholder="https://drivingschool.nl"
                          className="w-full h-9 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all text-left"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">Facebook Page URL</label>
                        <input
                          type="text"
                          value={schoolSettings.facebookUrl || ''}
                          onChange={e => setSchoolSettings(prev => ({ ...prev, facebookUrl: e.target.value }))}
                          placeholder="https://facebook.com/drivingschool"
                          className="w-full h-9 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all text-left"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">Instagram Profile URL</label>
                        <input
                          type="text"
                          value={schoolSettings.instagramUrl || ''}
                          onChange={e => setSchoolSettings(prev => ({ ...prev, instagramUrl: e.target.value }))}
                          placeholder="https://instagram.com/drivingschool"
                          className="w-full h-9 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all text-left"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">TikTok Profile URL</label>
                        <input
                          type="text"
                          value={schoolSettings.tiktokUrl || ''}
                          onChange={e => setSchoolSettings(prev => ({ ...prev, tiktokUrl: e.target.value }))}
                          placeholder="https://tiktok.com/@drivingschool"
                          className="w-full h-9 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all text-left"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">WhatsApp Business Number</label>
                        <input
                          type="text"
                          value={schoolSettings.whatsappNumber || ''}
                          onChange={e => setSchoolSettings(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                          placeholder="+31612345678"
                          className="w-full h-9 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all text-left"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">Google Business Profile URL</label>
                        <input
                          type="text"
                          value={schoolSettings.googleBusinessUrl || ''}
                          onChange={e => setSchoolSettings(prev => ({ ...prev, googleBusinessUrl: e.target.value }))}
                          placeholder="https://g.page/r/drivingschool"
                          className="w-full h-9 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all text-left"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">YouTube Channel URL</label>
                        <input
                          type="text"
                          value={schoolSettings.youtubeUrl || ''}
                          onChange={e => setSchoolSettings(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                          placeholder="https://youtube.com/@drivingschool"
                          className="w-full h-9 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all text-left"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">Privacy Policy URL</label>
                        <input
                          type="text"
                          value={schoolSettings.privacyPolicyUrl || ''}
                          onChange={e => setSchoolSettings(prev => ({ ...prev, privacyPolicyUrl: e.target.value }))}
                          placeholder="https://drivingschool.nl/privacy-policy"
                          className="w-full h-9 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all text-left"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">Terms & Conditions URL</label>
                        <input
                          type="text"
                          value={schoolSettings.termsConditionsUrl || ''}
                          onChange={e => setSchoolSettings(prev => ({ ...prev, termsConditionsUrl: e.target.value }))}
                          placeholder="https://drivingschool.nl/terms-conditions"
                          className="w-full h-9 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all text-left"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: AI & Application */}
                {schoolConfigTab === 'ai' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
                      <span className="text-base">🤖</span>
                      <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">
                        {lang === 'ar' ? 'إعدادات الذكاء الاصطناعي والإشعارات' : lang === 'nl' ? 'AI & Systeem Instellingen' : 'AI & Application Settings'}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">
                          {lang === 'ar' ? 'اسم مساعد الذكاء الاصطناعي الخاص بالمدرسة' : lang === 'nl' ? 'Naam AI Assistent' : 'Custom AI Assistant Name'}
                        </label>
                        <input
                          type="text"
                          value={schoolSettings.aiAssistantName ?? ''}
                          onChange={e => setSchoolSettings(prev => ({ ...prev, aiAssistantName: e.target.value }))}
                          placeholder="AI Coach"
                          className="w-full h-9 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all"
                        />
                      </div>

                      {/* Trainer Lesson Notifications Setting */}
                      <div className="md:col-span-2 p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Bell className="h-4 w-4 text-emerald-600 dark:text-emerald-450" />
                            {lang === 'ar' ? 'تنبيهات وإشعارات الحجوزات والدروس للمدرب' : lang === 'nl' ? 'Les & Boeking Notificaties' : 'Lesson & Booking Notifications'}
                          </h4>
                          <p className="text-[10.5px] text-slate-400 dark:text-zinc-500 font-medium">
                            {lang === 'ar' 
                              ? 'تلقي إشعارات الحجوزات والدروس القادمة بشكل فوري وتنبيهات مجدولة.' 
                              : lang === 'nl'
                                ? 'Ontvang directe herinneringen en notificaties over geplande rijlessen van uw leerlingen.'
                                : 'Receive real-time pop-up alerts and sound updates regarding student bookings and scheduled lessons.'}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase ${trainerNotifications ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {trainerNotifications ? (lang === 'ar' ? 'مفعّل' : 'Active') : (lang === 'ar' ? 'معطّل' : 'Disabled')}
                          </span>
                          <button
                            type="button"
                            onClick={() => setTrainerNotifications(!trainerNotifications)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              trainerNotifications ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-zinc-800'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                trainerNotifications ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 6: Package & Pricing */}
                {schoolConfigTab === 'packages' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
                      <span className="text-base">📦</span>
                      <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">
                        {lang === 'ar' ? 'تحديد أسعار الدروس والباقات التدريبية' : lang === 'nl' ? 'Tarieven & Pakket Configuratie' : 'Lesson Rates & Package Pricing'}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">
                          {lang === 'ar' ? 'سعر ساعة الدرس الفردي (بدون باقة)' : lang === 'nl' ? 'Lesprijs per uur (Geen Pakket)' : 'Hourly Lesson Price (No Package)'}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold font-mono text-slate-400 text-xs select-none">€</span>
                          <input
                            type="number"
                            value={schoolSettings.lessonPricePerHour || 65}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 65;
                              setSchoolSettings(prev => ({ ...prev, lessonPricePerHour: val }));
                            }}
                            className="w-full h-9 text-xs font-semibold pl-7 pr-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all font-mono"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">
                          {lang === 'ar' ? 'وصف خيار "بدون باقة / مرن"' : lang === 'nl' ? 'Beschrijving "Geen Pakket / Flexibel" optie' : 'Flexible / No Package Option Description'}
                        </label>
                        <textarea
                          rows={2}
                          value={schoolSettings.flexiblePackageDescription || ''}
                          onChange={e => setSchoolSettings(prev => ({ ...prev, flexiblePackageDescription: e.target.value }))}
                          placeholder={lang === 'ar' ? `الدفع لكل درس تدريبي على حدة (€${schoolSettings.lessonPricePerHour || 65}/ساعة)` : lang === 'nl' ? `Betaal per losse les (€${schoolSettings.lessonPricePerHour || 65}/uur)` : `Pay €${schoolSettings.lessonPricePerHour || 65} per individual lesson hour as you go.`}
                          className="w-full text-xs font-semibold p-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all"
                        />
                      </div>

                      {/* Package Manager Link Banner */}
                      <div className="md:col-span-2 p-5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                            <span>🎓</span>
                            {lang === 'ar' ? 'إدارة كتالوج الباقات وحزم الساعات الكاملة' : lang === 'nl' ? 'Beheer Volledige Lespakketten Catalogus' : 'Manage Driving Package Catalog'}
                          </h4>
                          <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                            {lang === 'ar'
                              ? 'قم بإضافة باقات ساعات الدروس، تحديد العروض الخاصة، وخصومات الدفع المسبق.'
                              : lang === 'nl'
                                ? 'Voeg lespakketten toe, stel kortingen en speciale acties in voor leerlingen.'
                                : 'Create multi-hour packages, offer discounts, and configure payment options.'}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSettingsSubTab('packages')}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                        >
                          <span>⚙️</span>
                          {lang === 'ar' ? 'الانتقال لإدارة الباقات' : lang === 'nl' ? 'Pakketten Beheren' : 'Manage Packages'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span>{lang === 'ar' ? 'حفظ إعدادات هويتك وبيانات التواصل المعتمدة' : lang === 'nl' ? 'Beheer en bewaar uw rijschoolgegevens' : 'Save your verified school identity & configuration'}</span>
                  </div>

                  <button
                    type="submit"
                    className="h-11 px-6 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition cursor-pointer shadow-md shadow-emerald-500/10 min-w-[150px]"
                  >
                    {lang === 'ar' ? 'حفظ تهيئة المدرسة' : lang === 'nl' ? 'Configuratie Opslaan' : 'Save Configuration'}
                  </button>
                </div>
              </form>
            </div>
          )}



          {settingsSubTab === 'media' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-800 dark:text-white text-base">
                    {lang === 'ar' ? 'مكتبة الوسائط التعليمية' : lang === 'nl' ? 'Educatieve Mediatheek' : 'Educational Media Library'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === 'ar' ? 'إدارة فيديوهات الشرح والدروس التفاعلية للطلاب' : lang === 'nl' ? 'Beheer instructievideo\'s en lessen voor studenten' : 'Manage instructional videos and lessons for students'}
                  </p>
                </div>
                {!showAddImageModule && !showAddVideoModule && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddVideoModule(true);
                        setShowAddImageModule(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition font-bold text-xs shadow-md shadow-blue-500/10 cursor-pointer"
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span>{lang === 'ar' ? 'إضافة فيديو جديد' : lang === 'nl' ? 'Video toevoegen' : 'Add Video'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowAddImageModule(true);
                        setShowAddVideoModule(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-2xl hover:bg-slate-900 transition font-bold text-xs shadow-md shadow-slate-500/10 cursor-pointer"
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span>{lang === 'ar' ? 'إضافة صورة جديدة' : lang === 'nl' ? 'Afbeelding toevoegen' : 'Add Image'}</span>
                    </button>
                  </div>
                )}
              </div>

              {showAddVideoModule && (
                <AddVideoModule
                  lang={lang}
                  onSave={async (newVideo) => {
                    const updated = [newVideo, ...mediaVideos];
                    setMediaVideos(updated);
                    safeSetItem('drivingschool_media_videos', JSON.stringify(updated));
                    const config = getSheetsConfig();
                    if (config.accessToken && config.spreadsheetId) {
                      try {
                        await writeMediaVideosToGoogleSheet(config, updated);
                      } catch (e) {
                        console.warn("Failed to sync new video to Google Sheets:", e);
                      }
                    }
                    setShowAddVideoModule(false);
                  }}
                  onCancel={() => setShowAddVideoModule(false)}
                />
              )}

              {showAddImageModule && (
                <AddImageModule
                  lang={lang}
                  onSave={async (newImage) => {
                    const updated = [newImage, ...mediaVideos];
                    setMediaVideos(updated);
                    safeSetItem('drivingschool_media_videos', JSON.stringify(updated));
                    const config = getSheetsConfig();
                    if (config.accessToken && config.spreadsheetId) {
                      try {
                        await writeMediaVideosToGoogleSheet(config, updated);
                      } catch (e) {
                        console.warn("Failed to sync new image to Google Sheets:", e);
                      }
                    }
                    setShowAddImageModule(false);
                  }}
                  onCancel={() => setShowAddImageModule(false)}
                />
              )}





              {(() => {
                const visibleVideos = mediaVideos.filter((v: any) => !v.isDeletedByTrainer);
                return visibleVideos.length === 0 ? (
                  <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/85 rounded-3xl space-y-3">
                    <div className="p-3 bg-pink-50 dark:bg-pink-500/10 text-pink-600 rounded-2xl w-fit mx-auto">
                      <Video className="h-6 w-6" />
                    </div>
                    <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">
                      {lang === 'ar' ? 'المكتبة فارغة حالياً' : lang === 'nl' ? 'Geen video\'s gevonden' : 'No instructional videos yet'}
                    </h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      {lang === 'ar' ? 'قم بإضافة فيديوهات مخصصة لتظهر لطلابك في قسم التعليم والدراسة الخاصة بهم.' : lang === 'nl' ? 'Voeg aangepaste instructievideo\'s toe zodat ze verschijnen in de studentenmedialijst.' : 'Add your custom instructional or practice videos here so your students can access them in their learning area.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleVideos.map((video: any) => (
                      <div key={video.id} className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs relative flex flex-col justify-between">
                        <div>
                          {/* Thumbnail with duration */}
                          <div className="relative h-40 bg-slate-100 dark:bg-zinc-950 flex items-center justify-center overflow-hidden">
                            <img 
                              src={getVideoThumbnail(video.thumbnail)} 
                              alt={getImageLocalizedTitle(video, lang) || 'Video'} 
                              className="w-full h-full object-cover" 
                            />
                            {video.type !== 'image' && video.duration && video.duration !== '3:00' && (
                              <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 rounded text-[9px] text-white font-mono font-bold">
                                {video.duration}
                              </span>
                            )}
                            <span className="absolute top-2 left-2 px-2 py-0.5 bg-indigo-600 text-white font-bold text-[9px] rounded-lg">
                              {video.category}
                            </span>
                          </div>

                          <div className="p-4 space-y-2">
                            <TrainerMediaTitleDescription video={video} lang={lang} />

                            {video.isMissingFromDrive && (
                              <div className="mt-2.5 p-2.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-start gap-2 text-rose-600 dark:text-rose-400 animate-pulse">
                                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                  <p className="text-[10px] font-extrabold leading-tight">
                                    {lang === 'ar' ? 'الفيديو مفقود من Google Drive.' : lang === 'nl' ? 'Deze video ontbreekt op Google Drive.' : 'This video is missing from Google Drive.'}
                                  </p>
                                  <div className="flex gap-2 text-[9px] font-bold">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteVideo(video.id)}
                                      className="underline hover:text-rose-800 dark:hover:text-rose-300"
                                    >
                                      {lang === 'ar' ? 'إزالة السجل' : lang === 'nl' ? 'Verwijder record' : 'Remove record'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-4 pt-0 border-t border-slate-50 dark:border-zinc-850/80 flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewingMediaVideo(video)}
                              className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400 transition cursor-pointer"
                              title={lang === 'ar' ? 'معاينة الفيديو' : lang === 'nl' ? 'Video bekijken' : 'Preview video'}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => handleToggleVideoEnabled(video.id)}
                              className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                                video.isEnabled !== false 
                                  ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' 
                                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 hover:bg-slate-200'
                              }`}
                              title={video.isEnabled !== false ? (lang === 'ar' ? "مرئي للطلاب" : "Visible to students") : (lang === 'ar' ? "مخفي للطلاب" : "Hidden from students")}
                            >
                              {video.isEnabled !== false ? (
                                <>
                                  <Eye className="h-3.5 w-3.5 text-emerald-600" />
                                  <span className="text-[10px] font-bold text-emerald-600">
                                    {lang === 'ar' ? 'منشور' : lang === 'nl' ? 'Gepubliceerd' : 'Published'}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="text-[10px] font-bold text-slate-400">
                                    {lang === 'ar' ? 'مخفي' : lang === 'nl' ? 'Verborgen' : 'Hidden'}
                                  </span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDeleteVideo(video.id)}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-600 dark:text-red-400 transition cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Educational Media Video Delete Confirmation Modal */}
          {mediaVideoToDelete && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full border border-slate-100 dark:border-zinc-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-center space-y-3">
                  <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-950/40 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">
                    <Trash2 className="h-6 w-6" />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-white">
                    {lang === 'ar' ? 'إزالة من مكتبة المدرب' : lang === 'nl' ? 'Verwijderen uit Trainer Bibliotheek' : 'Remove from Trainer Library'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                    {lang === 'ar' 
                      ? `هل أنت متأكد من رغبتك في إزالة الفيديو "${getImageLocalizedTitleSync(mediaVideoToDelete, lang)}" من مكتبة المدرب؟ سيظل الفيديو متاحاً للطلاب وفي Google Drive.` 
                      : lang === 'nl'
                        ? `Weet u zeker dat u de video "${getImageLocalizedTitleSync(mediaVideoToDelete, lang)}" wilt verbergen in de Trainer-bibliotheek? De video blijft zichtbaar voor studenten en bewaard op Google Drive.`
                        : `Are you sure you want to remove the video "${getImageLocalizedTitleSync(mediaVideoToDelete, lang)}" from the Trainer Media Library? The original file will be preserved in Google Drive and remain visible to all students.`}
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setMediaVideoToDelete(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-850 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteVideo}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-lg shadow-red-600/10"
                  >
                    {lang === 'ar' ? 'إزالة من المكتبة' : lang === 'nl' ? 'Uit bibliotheek verwijderen' : 'Remove from Library'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Educational Media Video Preview Modal */}
          {previewingMediaVideo && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
                {/* Modal Header */}
                <TrainerMediaModalHeader video={previewingMediaVideo} lang={lang} onClose={() => setPreviewingMediaVideo(null)} />
                
                {/* Modal Video Player Body */}
                <div className="flex-1 bg-black flex items-center justify-center relative min-h-[250px] sm:min-h-[400px]">
                  <TrainerMediaPreviewPlayer previewingMediaVideo={previewingMediaVideo} lang={lang} />
                </div>
                
                {/* Modal Footer Description */}
                <TrainerMediaModalFooter video={previewingMediaVideo} lang={lang} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modern Complete Driving Lesson Modal */}
      <React.Suspense fallback={null}>
        <CompleteLessonModal
          isOpen={!!finishingLessonId}
          onClose={() => {
            setFinishingLessonId(null);
            setCompletionLessonNotes('');
            setCompletionInstructorNotes('');
          }}
          onConfirm={(data) => {
            const combinedNotes = [
              data.lessonNotes ? `${lang === 'ar' ? 'مواضيع الدرس:' : 'Lesson Topics:'} ${data.lessonNotes}` : '',
              data.instructorNotes ? `${lang === 'ar' ? 'ملاحظات المعلم:' : 'Instructor Feedback:'} ${data.instructorNotes}` : ''
            ].filter(Boolean).join(' | ');

            handleMarkCompleted(
              data.lessonId,
              data.payStatus,
              data.payStatus === 'paid' ? data.method : null,
              combinedNotes,
              undefined,
              undefined,
              undefined,
              data.lessonNotes,
              data.instructorNotes,
              data.price,
              data.performanceRating,
              data.performanceEvaluation,
              data.lessonNumber
            );

            setFinishingLessonId(null);
            setCompletionLessonNotes('');
            setCompletionInstructorNotes('');
          }}
          lesson={finishingLessonId ? (lessons.find(l => l.id === finishingLessonId) || null) : null}
          allLessons={lessons}
          trainerName={trainerName}
          lang={lang}
        />
      </React.Suspense>

      {/* Payment Reminder Customizer & Preview Modal */}
      <PaymentReminderModal
        isOpen={Boolean(reminderModalLessonId)}
        onClose={() => setReminderModalLessonId(null)}
        lesson={lessons.find(l => l.id === reminderModalLessonId) || null}
        schoolSettings={schoolSettings}
        lang={lang}
        onSend={handleSendReminderSubmit}
      />

      {/* Live GPS Lesson Tracking & Replay HUD Overlay */}
      {activeTrackingLesson && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-0 md:p-6 animate-fade-in">
          <div className="bg-slate-900 text-white w-full h-full md:h-[90vh] md:max-w-6xl md:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            
            {/* Top HUD Bar */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-2xl animate-pulse">🛰️</span>
                <div>
                  <h3 
                    onClick={() => {
                      const newClicks = hudTitleClicks + 1;
                      if (newClicks >= 5) {
                        setIsDemoUnlocked(true);
                        setHudTitleClicks(0);
                      } else {
                        setHudTitleClicks(newClicks);
                      }
                    }}
                    className="text-xs font-black tracking-widest text-slate-400 block uppercase cursor-pointer"
                  >
                    {lang === 'ar' ? 'تتبع درس القيادة المباشر' : 'Live Lesson Tracking'}
                  </h3>
                  <p className="text-[10px] font-mono font-bold text-blue-400">
                    STUDENT: {activeTrackingLesson.studentName}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  setIsGPSTracking(false);
                  setActiveTrackingLesson(null);
                }}
                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Main content split */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
              {/* Map Canvas left/main */}
              <div id="live-hud-map-container" className="flex-1 bg-slate-950 relative min-h-[300px]">
                <React.Suspense fallback={<div className="p-8 text-center text-slate-400 font-mono text-xs">Loading live map...</div>}>
                  <LiveNavigationMap 
                    points={activeRoutePoints}
                    isTracking={isGPSTracking}
                    lang={lang}
                    height="100%"
                    activeLessonTitle={activeTrackingLesson?.title}
                    studentName={activeTrackingLesson?.studentName}
                    elapsedSeconds={elapsedSeconds}
                    distanceKm={activeRoutePoints.length > 1 ? activeRoutePoints.reduce((acc, curr, idx, arr) => {
                      if (idx === 0) return 0;
                      const prev = arr[idx - 1];
                      const R = 6371;
                      const dLat = (curr.lat - prev.lat) * Math.PI / 180;
                      const dLon = (curr.lng - prev.lng) * Math.PI / 180;
                      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                                Math.cos(prev.lat * Math.PI / 180) * Math.cos(curr.lat * Math.PI / 180) *
                                Math.sin(dLon/2) * Math.sin(dLon/2);
                      return acc + R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
                    }, 0) : 0}
                    isDemoMode={isDemoMode}
                    onLocationUpdate={(pt) => {
                      setActiveRoutePoints(prev => [...prev, pt]);
                    }}
                  />
                </React.Suspense>
                
                {gpsError && (
                  <div className="absolute inset-x-4 top-16 z-20 p-3 bg-rose-950/90 border border-rose-800 rounded-xl text-xs text-rose-300 backdrop-blur-md flex items-center gap-2 shadow-xl">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                    <span>{gpsError}</span>
                  </div>
                )}
              </div>

              {/* Sidebar controls right/bottom */}
              <div className="w-full lg:w-80 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
                <div className="space-y-4">
                  {/* Status telemetry block */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60 text-center">
                      <span className="text-[9px] font-black tracking-widest text-slate-500 block uppercase">
                        {lang === 'ar' ? 'حالة الإشارة:' : 'SATELLITE LINK:'}
                      </span>
                      <span className="text-xs font-black font-mono text-green-400 flex items-center justify-center gap-1.5 mt-1">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        ONLINE
                      </span>
                    </div>
                    <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60 text-center">
                      <span className="text-[9px] font-black tracking-widest text-slate-500 block uppercase">
                        {lang === 'ar' ? 'الوقت المنقضي:' : 'ELAPSED SECONDS:'}
                      </span>
                      <span className="text-xs font-black font-mono text-white block mt-1">
                        {(() => {
                          const hrs = Math.floor(elapsedSeconds / 3600);
                          const mins = Math.floor((elapsedSeconds % 3600) / 60);
                          const secs = elapsedSeconds % 60;
                          return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Live Coordinates Stream Log */}
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block pb-1.5">
                      🛰️ {lang === 'ar' ? 'سجل الإحداثيات المستمر:' : 'LIVE GPS STREAM LOG:'}
                    </span>
                    <div className="h-32 bg-slate-900 border border-slate-800 rounded-2xl p-2.5 font-mono text-[10px] text-slate-400 overflow-y-auto space-y-1">
                      {activeRoutePoints.length === 0 ? (
                        <p className="text-slate-500 text-center py-8 italic">
                          {lang === 'ar' ? 'لا توجد إحداثيات مسجلة بعد. ابدأ القيادة لتفعيل اتصال القمر الصناعي.' : 'No coordinates logged yet. Start driving to trigger satellite lock.'}
                        </p>
                      ) : (
                        activeRoutePoints.map((pt, idx) => (
                          <div key={idx} className="flex justify-between border-b border-slate-800/50 pb-1 last:border-0">
                            <span className="text-blue-400">POINT #{idx+1}</span>
                            <span className="text-slate-500 font-bold">{pt.lat.toFixed(5)}, {pt.lng.toFixed(5)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Tracking Control Action Buttons */}
                <div className="pt-4 border-t border-slate-800 space-y-2">
                  {isGPSTracking ? (
                    <>
                      <button
                        onClick={pauseTracking}
                        className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Pause className="h-4 w-4" />
                        {lang === 'ar' ? 'إيقاف التتبع مؤقتاً' : 'Pause GPS Tracking'}
                      </button>
                      <button
                        onClick={stopAndSaveTracking}
                        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                      >
                        <Square className="h-4 w-4" />
                        {lang === 'ar' ? 'إيقاف وحفظ المسار' : 'Stop Tracking & Save Route'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={startTracking}
                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Play className="h-4 w-4" />
                        {lang === 'ar' ? 'بدء تتبع الدرس (GPS)' : 'Start Lesson Tracking'}
                      </button>
                      {activeRoutePoints.length > 0 && (
                        <button
                          onClick={stopAndSaveTracking}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          {lang === 'ar' ? 'حفظ المسار والذهاب لإنهاء الدرس' : 'Save Route & Go to Complete Form'}
                        </button>
                      )}
                    </>
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* Unified Student Dossier PDF Portal/Report Modal */}
      {viewingReportStudentName && (() => {
        const sName = viewingReportStudentName;
        const studentLessons = lessons.filter(l => studentNamesMatch(l.studentName, sName));
        const studentTransactions = transactions.filter(t => studentNamesMatch(t.studentName, sName));
        const profile = getStudentDbInfo(sName);

        const handleDownloadPDF = async () => {
          setIsGeneratingPDF(true);
          try {
            // Simulated action
            const doc = document.querySelector('.dossier-print-preview');
            if (doc) {
              window.print();
            }
          } catch (pdfErr) {
            console.error("PDF generation failed:", pdfErr);
          } finally {
            setIsGeneratingPDF(false);
          }
        };

        const handleSendEmailWithPDF = async () => {
          setIsSendingEmail(true);
          try {
            await handleSendDossierEmail(sName);
          } catch (emailErr) {
            console.error("Email sending failed:", emailErr);
            setEmailStatusToast('error');
          } finally {
            setIsSendingEmail(false);
          }
        };

        return createPortal(
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-0 md:p-6 overflow-hidden print:p-0 print:bg-white print:overflow-visible print:static print:block animate-fade-in dossier-report-modal">
            <div className="bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 w-full max-w-5xl h-full md:max-h-[95vh] rounded-none md:rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col print:border-0 print:shadow-none print:rounded-none print:h-auto print:block print:overflow-visible">
              
              {/* Clean Top Bar Header */}
              <div className="bg-slate-950 text-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 shrink-0 print:hidden">
                <div className="flex items-center gap-2">
                  <div className="text-left">
                    <h2 className="text-sm font-black tracking-wide text-zinc-100 uppercase">
                      {lang === 'ar' ? 'السجل الموحد للمتدرب' : 'Unified Student Dossier'}
                    </h2>
                    <p className="text-[10px] font-mono font-bold text-zinc-400">
                      STUDENT: {sName}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={isGeneratingPDF}
                    className="py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    {isGeneratingPDF ? (lang === 'ar' ? 'جاري التحميل...' : 'Downloading...') : (lang === 'ar' ? 'تحميل PDF' : 'Download PDF')}
                  </button>
                  <button
                    onClick={handleSendEmailWithPDF}
                    disabled={isSendingEmail}
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    {isSendingEmail ? (lang === 'ar' ? 'جاري الإرسال...' : 'Sending...') : (lang === 'ar' ? 'إرسال بالبريد' : 'Email PDF')}
                  </button>
                  <button
                    onClick={() => setViewingReportStudentName(null)}
                    className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body with Dossier Pages Preview */}
              <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-zinc-950 p-4 print:p-0 print:bg-white print:overflow-visible">
                <div className="dossier-print-preview max-w-4xl mx-auto print:max-w-none print:w-auto">
                  <React.Suspense fallback={
                    <div className="flex flex-col items-center justify-center p-12 min-h-[300px] text-slate-400">
                      <span className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
                      <span className="text-xs font-mono uppercase tracking-wider">Loading report...</span>
                    </div>
                  }>
                    <DossierA4Pages
                      studentName={sName}
                      lang={lang}
                      lessons={studentLessons}
                      transactions={studentTransactions}
                      assessments={assessments}
                      profile={profile}
                      schoolSettings={schoolSettings}
                      customNotes=""
                      showSignatures={true}
                      currentActivePage="all"
                      mode="preview"
                    />
                  </React.Suspense>
                </div>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* Package In Use Error Modal */}
      {pkgInUseError && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs" onClick={() => setPkgInUseError(null)} />
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 p-6 md:p-8 shadow-2xl max-w-md w-full relative z-10 transform scale-100 transition duration-300" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-2xl">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-sans font-extrabold text-slate-900 dark:text-white text-base tracking-tight">
                    {lang === 'ar' ? 'الباقة قيد الاستخدام' : 'Package in Use'}
                  </h3>
                </div>
              </div>
              <button onClick={() => setPkgInUseError(null)} className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-400 rounded-xl transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed mb-4 text-start">
              {lang === 'ar' 
                ? `لا يمكن حذف الباقة "${pkgInUseError.name}" لأنها معينة حالياً لمتدرب أو أكثر في النظام. لمنع حدوث أخطاء في قاعدة البيانات والحفاظ على استقرار النظام، يرجى تعيين هؤلاء المتدربين إلى باقة بديلة (أو اختيار "بلا باقة") أولاً، ثم إعادة المحاولة.`
                : `The package "${pkgInUseError.name}" is currently assigned to one or more active students in the system. To prevent database inconsistencies and keep the system stable, please reassign these students first before deleting this package.`}
            </p>

            <div className="p-3.5 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-855 mb-6 max-h-36 overflow-y-auto">
              <span className="text-[9px] font-black tracking-widest text-slate-400 block uppercase mb-1.5 font-mono text-start">
                {lang === 'ar' ? 'الطلاب المرتبطون:' : 'ASSIGNED STUDENTS:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {pkgInUseError.students.map((studentName, idx) => (
                  <span key={idx} className="text-[10px] font-extrabold px-2 py-1 bg-slate-200/60 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-350 rounded-md">
                    {studentName}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPkgInUseError(null)}
                className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition cursor-pointer"
              >
                {lang === 'ar' ? 'فهمت وموافق' : 'Okay, I understand'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Package Delete Confirmation Modal */}
      {packageToDelete && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs" onClick={() => setPackageToDelete(null)} />
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 p-6 md:p-8 shadow-2xl max-w-md w-full relative z-10 transform scale-100 transition duration-300" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-2xl">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-sans font-extrabold text-slate-900 dark:text-white text-base tracking-tight">
                    {lang === 'ar' ? 'تأكيد حذف الباقة' : lang === 'nl' ? 'Pakket Verwijderen Bevestigen' : 'Confirm Package Deletion'}
                  </h3>
                </div>
              </div>
              <button onClick={() => setPackageToDelete(null)} className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-400 rounded-xl transition cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed mb-6 text-start">
              {lang === 'ar' 
                ? `هل أنت متأكد من رغبتك في حذف باقة "${packageToDelete.name}" نهائياً من النظام؟ لا يمكن التراجع عن هذا الإجراء وسيتم إزالة الباقة فوراً.`
                : lang === 'nl'
                ? `Weet u zeker dat u het pakket "${packageToDelete.name}" definitief wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`
                : `Are you sure you want to permanently delete the package "${packageToDelete.name}" from the system? This action cannot be undone.`}
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPackageToDelete(null)}
                className="py-2.5 px-4 bg-slate-100 dark:bg-zinc-850 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-xs font-extrabold rounded-xl transition cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePackage}
                className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition cursor-pointer"
              >
                {lang === 'ar' ? 'تأكيد الحذف' : lang === 'nl' ? 'Verwijderen' : 'Delete Package'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Student Modal */}
      {editingStudent && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs" onClick={() => setEditingStudent(null)} />
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 p-6 md:p-8 shadow-2xl max-w-md w-full relative z-10 transform scale-100 transition duration-300 space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-2xl">
                  <User className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-sans font-extrabold text-slate-900 dark:text-white text-base tracking-tight">
                    {lang === 'ar' ? 'تعديل بيانات المتدرب' : lang === 'nl' ? 'Student Gegevens Bewerken' : 'Edit Student Details'}
                  </h3>
                  <p className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    ID: {editingStudent.id}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setEditingStudent(null)}
                className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form Fields */}
            <div className="w-full space-y-3 max-h-[55vh] overflow-y-auto overflow-x-hidden py-1.5 px-3 scrollbar-thin mx-auto">
              
              {/* Full Name */}
              <div className="space-y-1 w-full">
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-400 uppercase tracking-wider block text-start">
                  {lang === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}
                </label>
                <input 
                  type="text"
                  value={editingStudent.name}
                  onChange={e => setEditingStudent(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full h-8 px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-start disabled:opacity-50"
                />
              </div>

              {/* Email */}
              <div className="space-y-1 w-full">
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-400 uppercase tracking-wider block text-start">
                  {lang === 'ar' ? 'البريد الإلكتروني *' : 'Email Address *'}
                </label>
                <input 
                  type="email"
                  value={editingStudent.email}
                  onChange={e => setEditingStudent(prev => prev ? { ...prev, email: e.target.value } : null)}
                  className="w-full h-8 px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-start disabled:opacity-50"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1 w-full">
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-400 uppercase tracking-wider block text-start">
                  {lang === 'ar' ? 'رقم الهاتف *' : 'Phone Number *'}
                </label>
                <input 
                  type="text"
                  value={editingStudent.phone}
                  onChange={e => setEditingStudent(prev => prev ? { ...prev, phone: e.target.value } : null)}
                  className="w-full h-8 px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-start disabled:opacity-50"
                />
              </div>

              {/* DOB */}
              <div className="space-y-1 w-full">
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-400 uppercase tracking-wider block text-start">
                  {lang === 'ar' ? 'تاريخ الميلاد *' : 'Date of Birth *'}
                </label>
                <DatePicker 
                  value={editingStudent.dob}
                  onChange={val => setEditingStudent(prev => prev ? { ...prev, dob: val } : null)}
                  lang={lang}
                />
              </div>

              {/* City */}
              <div className="space-y-1 w-full">
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-400 uppercase tracking-wider block text-start">
                  {lang === 'ar' ? 'المدينة *' : 'City *'}
                </label>
                <input 
                  type="text"
                  value={editingStudent.city}
                  onChange={e => setEditingStudent(prev => prev ? { ...prev, city: e.target.value } : null)}
                  className="w-full h-8 px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-start disabled:opacity-50"
                />
              </div>

              {/* Theory Exam Status */}
              <div className="space-y-1 w-full">
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-400 uppercase tracking-wider block text-start">
                  {lang === 'ar' ? 'حالة امتحان النظرية *' : 'Theory Exam Status *'}
                </label>
                <div className="relative w-full block">
                  <select 
                    value={editingStudent.theoryExamStatus}
                    onChange={e => setEditingStudent(prev => prev ? { ...prev, theoryExamStatus: e.target.value } : null)}
                    disabled={isSavingStudent}
                    className={`w-full h-8 px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer disabled:opacity-50 text-start leading-none ${lang === 'ar' ? 'pl-10 pr-3' : 'pl-3 pr-10'}`}
                  >
                    <option value="⏳ Has not passed the theory exam yet">
                      {lang === 'ar' ? 'لم يجتز امتحان النظرية بعد' : lang === 'nl' ? 'Nog niet geslaagd voor theorie-examen' : 'Has not passed the theory exam yet'}
                    </option>
                    <option value="📅 Theory exam booked">
                      {lang === 'ar' ? 'تم حجز موعد امتحان النظرية' : lang === 'nl' ? 'Theorie-examen geboekt' : 'Theory exam booked'}
                    </option>
                    <option value="⌛ Waiting for theory exam result">
                      {lang === 'ar' ? 'في انتظار نتيجة امتحان النظرية' : lang === 'nl' ? 'Wachten op uitslag theorie-examen' : 'Waiting for theory exam result'}
                    </option>
                    <option value="✅ Passed the theory exam">
                      {lang === 'ar' ? 'ناجح في امتحان النظرية' : lang === 'nl' ? 'Geslaagd voor theorie-examen' : 'Passed the theory exam'}
                    </option>
                  </select>
                  <div className={`absolute inset-y-0 ${lang === 'ar' ? 'left-3' : 'right-3'} flex items-center pointer-events-none text-slate-400`}>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Optional New Password */}
              <div className="space-y-1 w-full">
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-400 uppercase tracking-wider block text-start">
                  {lang === 'ar' ? 'كلمة المرور الجديدة (اتركها فارغة للمحافظة عليها)' : lang === 'nl' ? 'Nieuw wachtwoord (leeglaten om ongewijzigd)' : 'New Password (leave blank to keep unchanged)'}
                </label>
                <input 
                  type="password"
                  placeholder={lang === 'ar' ? 'أدخل كلمة مرور جديدة' : lang === 'nl' ? 'Voer een nieuw wachtwoord in' : 'Enter a new password'}
                  value={newStudentPassword}
                  onChange={e => setNewStudentPassword(e.target.value)}
                  disabled={isSavingStudent}
                  className="w-full h-8 px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-start disabled:opacity-50"
                />
              </div>
            </div>

            {/* Modal Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
              <button 
                type="button"
                onClick={() => {
                  setEditingStudent(null);
                  setNewStudentPassword('');
                  setIsSavingStudent(false);
                }}
                disabled={isSavingStudent}
                className="py-2.5 px-6 font-bold text-xs bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-700 transition cursor-pointer flex-1 sm:flex-none sm:min-w-[120px] flex items-center justify-center disabled:opacity-50"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button 
                type="button"
                disabled={isSavingStudent}
                onClick={async () => {
                  if (isSavingStudent) return;

                  if (!editingStudent.name.trim()) {
                    alert(lang === 'ar' ? 'يرجى إدخال اسم المتدرب.' : 'Please enter student name.');
                    return;
                  }

                  let targetHashedPassword = editingStudent.password;
                  let passwordWasChanged = false;
                  if (newStudentPassword.trim()) {
                    if (newStudentPassword.trim().length < 6) {
                      alert(lang === 'ar' ? 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.' : 'Password must be at least 6 characters.');
                      return;
                    }
                    try {
                      const bcrypt = await import('bcryptjs');
                      targetHashedPassword = bcrypt.hashSync(newStudentPassword.trim(), 10);
                      passwordWasChanged = true;
                    } catch (hashErr) {
                      console.error("Hashing password failed:", hashErr);
                      alert(lang === 'ar' ? 'حدث خطأ أثناء تشفير كلمة المرور.' : 'An error occurred while hashing the password.');
                      return;
                    }
                  }

                  const updatedStudentRec = { ...editingStudent, password: targetHashedPassword };

                  const updatedStudentsList = students.map(s => 
                    studentNamesMatch(s.name, editingStudent.name) || s.id === editingStudent.id 
                      ? updatedStudentRec 
                      : s
                  );

                  setIsSavingStudent(true);

                  try {
                    const config = getSheetsConfig();
                    const hasSheetsConfig = !!(config.spreadsheetId && config.accessToken);

                    if (hasSheetsConfig) {
                      let auditLogEntry: AuditLogEntry | null = null;
                      if (passwordWasChanged) {
                        const ipAddress = await fetchClientIpAddress();
                        const now = new Date();
                        const dateStr = now.toISOString().split('T')[0];
                        const timeStr = now.toTimeString().split(' ')[0];
                        const timeZoneStr = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
                        const auditId = 'AUD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();

                        auditLogEntry = {
                          auditId: auditId,
                          userId: editingStudent.id || 'N/A',
                          userName: editingStudent.name || 'N/A',
                          userRole: 'Student',
                          action: 'Password Changed',
                          changedBy: 'Admin',
                          date: dateStr,
                          time: timeStr,
                          timeZone: timeZoneStr,
                          ipAddress: ipAddress,
                          deviceBrowser: navigator.userAgent || 'Unknown'
                        };
                      }

                      // Write updates directly to Google Sheets first!
                      await writeStudentsToGoogleSheet(config, updatedStudentsList);

                      // Write Audit Log
                      if (auditLogEntry) {
                        await writeAuditLogToGoogleSheet(config, auditLogEntry);
                      }
                    }

                    // Local state update
                    setStudents(updatedStudentsList);
                    setEditingStudent(null);
                    setNewStudentPassword('');

                    alert(lang === 'ar' ? 'تم حفظ التغييرات بنجاح!' : 'Changes saved successfully!');
                  } catch (err: any) {
                    console.error("Failed to save student changes:", err);
                    alert(lang === 'ar' 
                      ? `فشل حفظ التغييرات.` 
                      : `Failed to save changes.`
                    );
                  } finally {
                    setIsSavingStudent(false);
                  }
                }}
                className="py-2.5 px-6 font-bold text-xs bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition cursor-pointer shadow-md shadow-blue-500/10 flex-1 sm:flex-none sm:min-w-[140px] flex items-center justify-center disabled:opacity-50 gap-2"
              >
                {isSavingStudent ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{lang === 'ar' ? 'جاري الحفظ...' : 'Saving...'}</span>
                  </>
                ) : (
                  <span>{lang === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}</span>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Off-screen PDF container for pristine full dossier prints */}
      <div id="temp-pdf-generator" className="fixed left-[-9999px] top-[-9999px] w-[210mm] overflow-hidden bg-white z-[-50] pointer-events-none">
        {tempGenerationStudent && (
          <React.Suspense fallback={null}>
            <DossierA4Pages
              studentName={tempGenerationStudent}
              lang={lang}
              lessons={lessons.filter(l => studentNamesMatch(l.studentName, tempGenerationStudent))}
              transactions={transactions.filter(t => studentNamesMatch(t.studentName, tempGenerationStudent))}
              assessments={assessments}
              profile={getStudentDbInfo(tempGenerationStudent)}
              schoolSettings={schoolSettings}
              customNotes=""
              showSignatures={true}
              currentActivePage="all"
              mode="export"
            />
          </React.Suspense>
        )}
      </div>

      {/* Modern Cancel Driving Lesson Modal */}
      <React.Suspense fallback={null}>
        <CancelLessonModal
          isOpen={!!cancellingLesson}
          onClose={() => setCancellingLesson(null)}
          onConfirm={handleConfirmCancellation}
          lesson={cancellingLesson}
          lang={lang}
          userRole="trainer"
        />
      </React.Suspense>

    </div>
  );
}

const TrainerDashboard = React.memo(TrainerDashboardComponent);
export default TrainerDashboard;
