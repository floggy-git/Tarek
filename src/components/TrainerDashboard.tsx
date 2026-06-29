import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, Calendar, Wallet, FileText, Settings, Sparkles, PlusCircle, 
  CheckCircle, Mail, DollarSign, Send, BookOpen, Clock, Trash2, Search, 
  BellRing, Award, ShieldAlert, CheckSquare, RefreshCw, Save, Coins, Check, AlertCircle,
  Download, Star, Printer, Play, Pause, Navigation, Activity, Wifi, WifiOff,
  MapPin, Map as MapIcon, ExternalLink, User, Car, X
} from 'lucide-react';
import { TRANSLATIONS, Language, Lesson, WalletTransaction, TrainerSchedule, Assessment } from '../types';
import { sendAppEmail } from '../utils/emailService';
import ExamTracker from './ExamTracker';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { toPng } from 'html-to-image';
import { DossierA4Pages } from './DossierA4Pages';
import { getStudentPhoto, getStudentInitials } from '../utils/studentPhoto';

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
    licenseAuthority: "Under Al-Andalos license authority, Amsterdam Sloterdijk area",
    loggedPayments: "Quick Deposit",
    manualDeposit: "Record Manual Student Cash Deposit",
    studentLabel: "Select Student",
    amountLabel: "Amount",
    amountPlaceholder: "e.g. 130",
    creditStudent: "Credit Student Wallet",
    issueInvoice: "Issue Custom Invoice bill",
    billRecipient: "Bill Recipient",
    billAmount: "Bill Amount",
    billDesc: "Bill Description",
    descPlaceholder: "e.g. Extra night training package",
    sendInvoice: "Send Invoice Out",
    allLessonsLog: "All Lessons Log Database",
    totalEntries: "Total entries",
    quickMark: "Quick-Mark Complete",
    searchNames: "Search registered names...",
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
    rotaPersistedAlert: "Schedule Rota settings successfully persisted in escrow!",
    certifiedAlert: "marked as officially Exam Ready for practical driving tests!",
    lessonCompletedSuccess: "Rijles succesvol opgeslagen in het leerlingdossier!",
    homeTab: "Overview",
    lessonsTab: "Lessons",
    studentsTab: "Students",
    scheduleTab: "Schedule",
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
    licenseAuthority: "تحت إشراف وترخيص مدرسة الأندلس للقيادة - فرع سلوتردايك",
    loggedPayments: "إيداع مبلغ مالي (شحن رصيد)",
    manualDeposit: "تسجيل مبلغ شحن نقدي يدوي للمتدرب",
    studentLabel: "اختر المتدرب",
    amountLabel: "المبلغ (€)",
    amountPlaceholder: "مثال: 130",
    creditStudent: "إيداع وتحديث محفظة المتدرب",
    issueInvoice: "إصدار فاتورة ضريبية جديدة",
    billRecipient: "المستلم (المتدرب)",
    billAmount: "قيمة الفاتورة (€)",
    billDesc: "تفاصيل وبيان الفاتورة",
    descPlaceholder: "مثال: درس تدريبي ليلي إضافي",
    sendInvoice: "إصدار وإرسال الفاتورة",
    allLessonsLog: "قاعدة بيانات سجل الدروس الشاملة",
    totalEntries: "إجمالي الدروس المسجلة",
    quickMark: "تحديد سريع كمكتمل",
    searchNames: "البحث في أسماء المتدربين...",
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
    lessonCompletedAlert: "تم تسجيل الدرس التدريبي بنجاح بنظام الأندلس!",
    reminderSentAlert: "تم إرسال إشعار تذكير شحن الرصيد بنجاح!",
    balanceLoggedAlert: "تم شحن الرصيد المالي وإضافته للمحفظة بنجاح!",
    invoiceDispatchedAlert: "تم إصدار الفاتورة الضريبية الرسمية وإرسالها للمتدرب!",
    rotaPersistedAlert: "تم حفظ واعتماد أوقات وجدول العمل وتحديث بيانات الحجز التلقائي بنجاح!",
    certifiedAlert: "تم منحه شهادة الجاهزية الرسمية لخوض امتحان القيادة بنجاح!",
    lessonCompletedSuccess: "تم تحديث سجل المتدرب وحفظ تفاصيل الدرس بنجاح!",
    homeTab: "الرئيسية",
    lessonsTab: "الدروس",
    studentsTab: "المتدربون",
    scheduleTab: "الجدول",
    previewTitle: "معاينة مباشرة لما يظهر للمتدرب",
    previewDesc: "هكذا ستظهر أوقات وطبيعة توفرك للمتدربين عند قيامهم بحجز درس جديد في تطبيقاتهم.",
    invoicesTab: "الفواتير",
    reportsTab: "التقييمات",
    invoiceTitle: "منظومة فواتير الدروس العملية",
    reportsTitle: "أرشيف تقارير وتقييم متدربي الأندلس",
  },
  nl: {
    trainerSuite: "INSTRUCTEURS PORTAAL",
    trainerDashboard: "Instructeurs Portaal",
    welcomeTrainer: "Welkom, Samir El-Filali. Beheer hier je werkrooster en bekijk actieve leerlingdossiers.",
    lessonsToday: "Lessen Vandaag Uitgevoerd",
    hoursLogged: "Geregistreerde Uren",
    outstandingInvoices: "Openstaande Facturen",
    avgRating: "Gemiddelde voorrangsscore: 4.9/5 sterren",
    unpaid: "openstaand",
    remindersPrepared: "2 automatische betalingsherinneringen klaargezet",
    licenseAuthority: "Onder licentietoezicht van Al-Andalos Rijschool Amsterdam Sloterdijk",
    loggedPayments: "Geld Storten",
    manualDeposit: "Handmatige Contante Betaling Registreren",
    studentLabel: "Selecteer Leerling",
    amountLabel: "Bedrag (€)",
    amountPlaceholder: "bijv. 130",
    creditStudent: "Waardeer Portemonnee Op",
    issueInvoice: "Nieuwe Factuur Aanmaken",
    billRecipient: "Ontvanger (Leerling)",
    billAmount: "Factuurbedrag (€)",
    billDesc: "Factuur Omschrijving",
    descPlaceholder: "bijv. Extra nachttraining pakket",
    sendInvoice: "Verstuur Factuur",
    allLessonsLog: "Volledige Lessen Database Log",
    totalEntries: "Totaal aantal ritten",
    quickMark: "Snel Afronden",
    searchNames: "Zoek leerlingen op naam...",
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
    scheduleTab: "Rooster",
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

// Sub-component to render interactive route previews within completed lesson cards
const CardMapPreview = ({ points, lessonId }: { points: { lat: number, lng: number }[], lessonId: string }) => {
  const mapId = `map-preview-${lessonId}`;
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const container = document.getElementById(mapId);
      if (!container) return;
      
      const L = (window as any).L;
      if (!L) return;
      
      if ((container as any)._leaflet_id) {
        (container as any)._leaflet_id = null;
        container.innerHTML = '';
      }
      
      const center = points.length > 0 ? [points[0].lat, points[0].lng] : [52.3892, 4.8378];
      const map = L.map(mapId, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
        dragging: true
      }).setView(center, 13);
      
      const isDark = document.documentElement.classList.contains('dark');
      const tileUrl = isDark 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' 
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        
      L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);
      
      const latlngs = points.map(p => [p.lat, p.lng]);
      L.polyline(latlngs, {
        color: '#2563eb',
        weight: 4,
        opacity: 0.8
      }).addTo(map);
      
      if (points.length > 0) {
        // Start Pin (Green)
        L.circleMarker([points[0].lat, points[0].lng], {
          radius: 5,
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 1
        }).addTo(map);
        
        // End Pin (Red)
        L.circleMarker([points[points.length - 1].lat, points[points.length - 1].lng], {
          radius: 5,
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 1
        }).addTo(map);
      }
      
      try {
        const bounds = L.latLngBounds(latlngs);
        map.fitBounds(bounds, { padding: [10, 10] });
      } catch (e) {
        // Fallback
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [points, mapId]);
  
  return (
    <div id={mapId} className="w-full h-36 rounded-xl overflow-hidden mt-3 border border-slate-150 dark:border-zinc-800 z-10" />
  );
};

export default function TrainerDashboard({ 
  lang, t, lessons, setLessons, transactions, setTransactions, schedule, setSchedule, assessments, setAssessments 
}: TrainerDashboardProps) {
  
  // Helper to match student names across translations (Arabic and English/Dutch)
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

  // Helper to dynamically calculate wallet balance for a student from the central transactions state
  const getStudentBalance = (studentName: string) => {
    return transactions
      .filter(tx => studentNamesMatch(tx.studentName, studentName))
      .reduce((acc, curr) => {
        return curr.type === 'deposit' ? acc + curr.amount : acc - curr.amount;
      }, 0);
  };

  const [activeTab, setActiveTab] = useState<'home' | 'lessons' | 'students' | 'tracker' | 'invoices' | 'reports' | 'schedule'>('home');
  const [financeSubTab, setFinanceSubTab] = useState<'deposit' | 'invoice'>('invoice');

  // Search filter
  const [searchInput, setSearchInput] = useState('');

  // Form states
  const [logNotes, setLogNotes] = useState('');
  const [logDuration, setLogDuration] = useState<1 | 2>(1);
  const [logStudent, setLogStudent] = useState('Amir Al-Hassan');
  const [logPrice, setLogPrice] = useState(65);

  const [depositStudentName, setDepositStudentName] = useState('Amir Al-Hassan');
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
  const [schoolSettings, setSchoolSettings] = useState({
    name: "Al-Andalus Driving School",
    instructorName: "Samir El-Filali",
    phone: "+31 6 9876 5432",
    email: "samir@al-andalos.nl",
    address: "Sloterdijk Area, Amsterdam, NL",
    logoUrl: "", // Optional custom logo image URL
    kvk: "78945612",
    btw: "NL888899999B01",
    licenseAuthority: "Onder licentietoezicht van Al-Andalos Rijschool Amsterdam Sloterdijk",
  });

  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [emailStatusToast, setEmailStatusToast] = useState<'success' | 'error' | null>(null);

  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [tempGenerationStudent, setTempGenerationStudent] = useState<string | null>(null);

  const generateUnifiedStudentDossierPDF = async (studentName: string): Promise<jsPDF | null> => {
    setIsGeneratingPDF(true);
    let isTemp = false;
    const isDark = document.documentElement.classList.contains('dark');
    try {
      // Always render off-screen temporarily using the dedicated export container.
      // This is viewport-independent, scroll-independent, doesn't crop, and guarantees pristine A4 quality on both mobile and desktop.
      isTemp = true;
      setTempGenerationStudent(studentName);
      
      // Temporarily switch off dark mode so all colors render as professional high-contrast light mode for the PDF
      if (isDark) {
        document.documentElement.classList.remove('dark');
      }

      // Allow React a moment to mount and render the hidden A4 pages with the light class
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const targetContainer = document.getElementById('temp-pdf-generator') as HTMLElement;

      if (!targetContainer) {
        throw new Error("Target container for PDF generation not found");
      }

      // Find all page elements with class .dossier-pdf-page
      const pageElements = Array.from(targetContainer.querySelectorAll('.dossier-pdf-page')) as HTMLElement[];
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

        // Capture with html-to-image toPng with high ratio for pristine print quality
        // We use cacheBust and skipFonts to prevent empty canvas, CORS errors, and secure swift rendering.
        const imgData = await toPng(pageEl, {
          quality: 1.0,
          pixelRatio: 2.5, // Crisp retina-grade resolution for high fidelity printing
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

        const widthPx = pageEl.offsetWidth || 1;
        const heightPx = pageEl.offsetHeight || 1;
        const heightMm = (heightPx / widthPx) * 210;

        if (heightMm <= 305) {
          if (i > 0) {
            doc.addPage('a4', 'portrait');
          }
          // Add image to cover the entire A4 page (210mm x 297mm)
          doc.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
        } else {
          // Dynamic height: slice the image vertically into multiple A4 pages
          let remainingHeight = heightMm;
          let currentOffset = 0;
          let isFirstSlice = true;

          while (remainingHeight > 0) {
            if (i > 0 || !isFirstSlice) {
              doc.addPage('a4', 'portrait');
            }
            isFirstSlice = false;

            // Draw image offset by currentOffset. Width is 210, height is heightMm to maintain aspect ratio.
            doc.addImage(imgData, 'PNG', 0, -currentOffset, 210, heightMm, undefined, 'FAST');
            
            remainingHeight -= 297;
            currentOffset += 297;
          }
        }
      }

      // Clean up temp generation
      if (isTemp) {
        setTempGenerationStudent(null);
      }
      
      // Restore dark mode if it was active
      if (isDark) {
        document.documentElement.classList.add('dark');
      }

      return doc;
    } catch (err) {
      console.error("Failed to generate PDF using html-to-image approach:", err);
      if (isTemp) {
        setTempGenerationStudent(null);
      }
      if (isDark) {
        document.documentElement.classList.add('dark');
      }
      return null;
    } finally {
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
          currentReportObservs = "Excellent performance and steady progress on highway lane joining and roundabout exits. Needs some more focus on parallel parking.";
        } else if (isSanne) {
          currentScoreControl = 9; currentScorePriority = 8; currentScoreHighway = 9; currentScoreManeuvers = 8; currentScoreTheory = 10;
          currentCbrReadiness = "cbr_ready";
          currentReportObservs = "Outstanding tactical road overview. Highly analytical driving. 100% prepared for CBR exam.";
        } else if (isMichael) {
          currentScoreControl = 9; currentScorePriority = 9; currentScoreHighway = 10; currentScoreManeuvers = 9; currentScoreTheory = 10;
          currentCbrReadiness = "cbr_ready";
          currentReportObservs = "Perfect control and priority understanding. Zero interventions required over last 4 sessions.";
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
      } else {
        setEmailStatusToast('error');
      }
    } catch (err) {
      console.error("Failed sending dossier email:", err);
      setEmailStatusToast('error');
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
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [assessmentDate, setAssessmentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [assessmentTime, setAssessmentTime] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [historyFilterStudent, setHistoryFilterStudent] = useState<string>('all');
  const [isSyncingSheets, setIsSyncingSheets] = useState<boolean>(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState<boolean>(false);

  // Completed Lessons Archive States
  const [completedLessonStudentFilter, setCompletedLessonStudentFilter] = useState<string>('all');
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
      const response = await fetch(`${webAppUrl}?action=getTrainerDashboard&trainerEmail=samir@al-andalos.nl`);
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
            price: b.price || 65,
            pickupLocation: b.pickup || "Amsterdam",
            status: b.status || "completed",
            payStatus: b.payStatus || (b.bookingId === 'l3' || b.bookingId === 'l4' ? 'paid' : 'unpaid'),
            trainerNotes: b.trainerNotes || b.feedback || localLesson?.trainerNotes || "",
            lessonNotes: b.lessonNotes || localLesson?.lessonNotes || "",
            instructorNotes: b.instructorNotes || localLesson?.instructorNotes || "",
            routePoints: b.routePoints || localLesson?.routePoints,
            distanceKm: b.distanceKm || localLesson?.distanceKm,
            elapsedTime: b.elapsedTime || localLesson?.elapsedTime
          };
        });

        // Resolve GPS routes asynchronously for all completed lessons if possible
        const updatedWithRoutes = await Promise.all(sheetsLessonsList.map(async (les) => {
          if (les.status === 'completed' && (!les.routePoints || les.routePoints.length === 0)) {
            try {
              const routeRes = await fetch(`${webAppUrl}?action=getRoute&bookingId=${les.id}`);
              const routeResult = await routeRes.json();
              if (routeResult.success && routeResult.data && routeResult.data.points && routeResult.data.points.length > 0) {
                return {
                  ...les,
                  routePoints: routeResult.data.points,
                  distanceKm: Number((routeResult.data.points.length * 0.15).toFixed(2)),
                  elapsedTime: les.elapsedTime || `${Math.floor(routeResult.data.points.length * 0.5)}m`
                };
              }
            } catch (e) {
              console.warn(`Failed to fetch route for booking ${les.id}:`, e);
            }
          }
          return les;
        }));

        // Merge sheets lessons with any active/local non-completed ones
        const nonCompletedLessons = lessons.filter(l => l.status !== 'completed');
        const completedFromSheets = updatedWithRoutes.filter(l => l.status === 'completed');
        
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

  const loadLeaflet = (callback: () => void) => {
    if ((window as any).L) {
      callback();
      return;
    }

    if (!(window as any)._leafletCallbacks) {
      (window as any)._leafletCallbacks = [];
    }
    (window as any)._leafletCallbacks.push(callback);

    if ((window as any)._leafletLoading) {
      return;
    }
    (window as any)._leafletLoading = true;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
      link.onerror = (e) => {
        console.warn("Leaflet stylesheet failed to load gracefully in sandbox:", e);
      };
      document.head.appendChild(link);
    }

    let script = document.getElementById('leaflet-js') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onerror = (e) => {
        console.warn("Leaflet script failed to load or CORS error in sandbox:", e);
      };
      document.body.appendChild(script);
    }

    const runCallbacks = () => {
      const callbacks = (window as any)._leafletCallbacks || [];
      (window as any)._leafletCallbacks = [];
      callbacks.forEach((cb: () => void) => {
        try {
          cb();
        } catch (e) {
          console.error("Error running Leaflet callback:", e);
        }
      });
    };

    const interval = setInterval(() => {
      if ((window as any).L) {
        clearInterval(interval);
        runCallbacks();
      }
    }, 50);

    script.onload = () => {
      if ((window as any).L) {
        clearInterval(interval);
        runCallbacks();
      }
    };
  };

  const activeMapRef = React.useRef<any>(null);
  const activePolylineRef = React.useRef<any>(null);
  const activeMarkersRef = React.useRef<any[]>([]);
  const activeCarMarkerRef = React.useRef<any>(null);

  // Initialize and Teardown Map
  React.useEffect(() => {
    if (!activeTrackingLesson) {
      if (activeMapRef.current) {
        try {
          activeMapRef.current.remove();
        } catch (e) {
          console.warn("Map removal error:", e);
        }
        activeMapRef.current = null;
      }
      return;
    }

    let active = true;
    loadLeaflet(() => {
      if (!active) return;
      const L = (window as any).L;
      if (!L) return;

      if (activeMapRef.current) {
        try {
          activeMapRef.current.remove();
        } catch (e) {
          console.warn("Map removal error:", e);
        }
        activeMapRef.current = null;
      }

      const mapContainer = document.getElementById('active-lesson-tracking-map');
      if (!mapContainer) return;

      if ((mapContainer as any)._leaflet_id) {
        (mapContainer as any)._leaflet_id = null;
        mapContainer.innerHTML = '';
      }

      const currentPos = activeRoutePoints.length > 0 
        ? [activeRoutePoints[activeRoutePoints.length - 1].lat, activeRoutePoints[activeRoutePoints.length - 1].lng]
        : [52.3892, 4.8378];

      const map = L.map('active-lesson-tracking-map', {
        zoomControl: true,
        attributionControl: false
      }).setView(currentPos, 15);

      const isDark = document.documentElement.classList.contains('dark');
      const tileUrl = isDark 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' 
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);
      activeMapRef.current = map;

      const updateMapRoute = () => {
        if (!activeMapRef.current) return;
        const currentMap = activeMapRef.current;

        if (activePolylineRef.current) {
          currentMap.removeLayer(activePolylineRef.current);
          activePolylineRef.current = null;
        }

        activeMarkersRef.current.forEach(m => currentMap.removeLayer(m));
        activeMarkersRef.current = [];

        if (activeCarMarkerRef.current) {
          currentMap.removeLayer(activeCarMarkerRef.current);
          activeCarMarkerRef.current = null;
        }

        if (activeRoutePoints.length === 0) return;

        const latlngs = activeRoutePoints.map(p => [p.lat, p.lng]);

        const polyline = L.polyline(latlngs, {
          color: '#3b82f6',
          weight: 5,
          opacity: 0.9,
          lineJoin: 'round'
        }).addTo(currentMap);
        activePolylineRef.current = polyline;

        const startIcon = L.divIcon({
          className: 'active-start-marker',
          html: `<div style="background-color: #10b981; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.4);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });
        const startMarker = L.marker(latlngs[0], { icon: startIcon }).addTo(currentMap).bindPopup("<b>Lesson Started</b>");
        activeMarkersRef.current.push(startMarker);

        const currentCarPos = latlngs[latlngs.length - 1];
        const carIcon = L.divIcon({
          className: 'active-car-marker',
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; width: 34px; height: 34px; background-color: rgba(59, 130, 246, 0.25); border-radius: 50%; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 8px rgba(59,130,246,0.5); display: flex; align-items: center; justify-content: center; font-size: 8px;">🚗</div>
            </div>
          `,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
        const carMarker = L.marker(currentCarPos, { icon: carIcon }).addTo(currentMap);
        activeCarMarkerRef.current = carMarker;

        currentMap.panTo(currentCarPos);
      };

      updateMapRoute();
    });

    return () => {
      active = false;
    };
  }, [activeTrackingLesson]);

  // Effect to update map polylines dynamically when activeRoutePoints changes
  React.useEffect(() => {
    if (!activeTrackingLesson || !activeMapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const currentMap = activeMapRef.current;

    if (activePolylineRef.current) {
      currentMap.removeLayer(activePolylineRef.current);
      activePolylineRef.current = null;
    }

    if (activeCarMarkerRef.current) {
      currentMap.removeLayer(activeCarMarkerRef.current);
      activeCarMarkerRef.current = null;
    }

    if (activeRoutePoints.length === 0) return;

    const latlngs = activeRoutePoints.map(p => [p.lat, p.lng]);

    const polyline = L.polyline(latlngs, {
      color: '#3b82f6',
      weight: 5,
      opacity: 0.9,
      lineJoin: 'round'
    }).addTo(currentMap);
    activePolylineRef.current = polyline;

    const currentCarPos = latlngs[latlngs.length - 1];
    const carIcon = L.divIcon({
      className: 'active-car-marker',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 34px; height: 34px; background-color: rgba(59, 130, 246, 0.25); border-radius: 50%; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 8px rgba(59,130,246,0.5); display: flex; align-items: center; justify-content: center; font-size: 8px;">🚗</div>
        </div>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
    const carMarker = L.marker(currentCarPos, { icon: carIcon }).addTo(currentMap);
    activeCarMarkerRef.current = carMarker;

    currentMap.panTo(currentCarPos);
  }, [activeRoutePoints]);

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
      if (gpsWatchIdRef.current !== null) navigator.geolocation.clearWatch(gpsWatchIdRef.current);
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
    } else {
      if (!navigator.geolocation) {
        setGpsError(lang === 'ar' ? 'جهازك أو متصفحك لا يدعم نظام تحديد المواقع GPS.' : 'Geolocation is not supported by your browser/device.');
        setIsGPSTracking(false);
        return;
      }

      const geoOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      const successHandler = (position: GeolocationPosition) => {
        const { latitude, longitude } = position.coords;
        const newPoint = { 
          lat: Number(latitude.toFixed(6)), 
          lng: Number(longitude.toFixed(6)),
          timestamp: Date.now()
        };

        setActiveRoutePoints(prev => {
          if (prev.length === 0) return [newPoint];
          const lastPt = prev[prev.length - 1];
          // Use Euclidean distance as a fast high-performance threshold for point density filter
          const distance = Math.sqrt(Math.pow(lastPt.lat - newPoint.lat, 2) + Math.pow(lastPt.lng - newPoint.lng, 2));
          if (distance > 0.00005) {
            return [...prev, newPoint];
          }
          return prev;
        });
      };

      const errorHandler = (err: GeolocationPositionError) => {
        console.warn("GPS Tracking Error (expected in headless environments):", err);
        let errorMsg = lang === 'ar' ? 'حدث خطأ أثناء تحديد موقع GPS.' : 'Failed to obtain GPS coordinates.';
        if (err.code === err.PERMISSION_DENIED) {
          errorMsg = lang === 'ar' 
            ? 'تم رفض إذن تحديد الموقع GPS. يرجى تفعيل الإذن من إعدادات الهاتف لتتبع المسار.' 
            : 'GPS permission denied. Please allow location access in your device settings to track the driving route.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errorMsg = lang === 'ar' ? 'إشارة الـ GPS ضعيفة أو غير متوفرة حالياً.' : 'GPS signal is weak or unavailable.';
        } else if (err.code === err.TIMEOUT) {
          errorMsg = lang === 'ar' ? 'انتهت مهلة البحث عن إشارة GPS.' : 'GPS tracking request timed out.';
        }
        setGpsError(errorMsg);
        setIsGPSTracking(false);
        if (gpsWatchIdRef.current !== null) {
          navigator.geolocation.clearWatch(gpsWatchIdRef.current);
          gpsWatchIdRef.current = null;
        }
      };

      gpsWatchIdRef.current = navigator.geolocation.watchPosition(successHandler, errorHandler, geoOptions);
    }
  };

  const pauseTracking = () => {
    setIsGPSTracking(false);
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    if (gpsWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatchIdRef.current);
      gpsWatchIdRef.current = null;
    }
  };

  // Sync Invoice selected lessons when selectedStudent or lessons or billedLessonIds change
  React.useEffect(() => {
    const studentUnbilledCompleted = lessons.filter(l => 
      l.studentName === selectedInvoiceStudent && 
      l.status === 'completed' && 
      !billedLessonIds.includes(l.id)
    );
    setSelectedInvoiceLessonIds(studentUnbilledCompleted.map(l => l.id));
    setDraftInvoiceId(`INV-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  }, [selectedInvoiceStudent, billedLessonIds, lessons]);

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
        ? "المتدرب يبدي نضجًا كاملاً وهدوءًا متميزًا على الطرق السريعة وطرق السير المزدحمة. تمكن من الركن الموازي ومناورة الرجوع للخلف بدقة ٢ سم فقط عن الرصيف. جاهز ومؤهل تماماً لخوض الامتحان الرسمي الميداني لدى الأندلس."
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
    const newTx: WalletTransaction = {
      id: `tx-billing-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: invoicePaymentStatus === 'paid' ? 'deposit' : 'payment',
      amount: grandTotal,
      description: lang === 'ar' 
        ? `الفاتورة ${draftInvoiceId}: فوترة عدد ${billedLessons.length} حصص` + (customAdjustmentLabel ? ` + رسوم إضافية: ${customAdjustmentLabel}` : '')
        : `Invoice ${draftInvoiceId}: ${billedLessons.length} lessons billed` + (customAdjustmentLabel ? ` + Extra: ${customAdjustmentLabel}` : ''),
      invoiceId: draftInvoiceId,
      studentName: selectedInvoiceStudent
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

    setInvoiceDispatchedOverlay(true);
    setCustomAdjustmentLabel('');
    setCustomAdjustmentPrice('');
  };

  const handleViewAndSendReport = async () => {
    const avgScore = parseFloat(((scoreControl + scorePriority + scoreHighway + scoreManeuvers + scoreTheory) / 5).toFixed(1));
    const todayDate = new Date().toISOString().split('T')[0];
    const todayTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    const newAssessment: Assessment = {
      id: `ASS-${Date.now()}`,
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
      status: 'synced'
    };

    // 1. Save locally to assessments log
    setAssessments([newAssessment, ...assessments]);
    setReportSuccessToast(true);
    setTimeout(() => {
      setReportSuccessToast(false);
    }, 4500);

    // 2. Allow instructor to preview it
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
    instructorNotes?: string
  ) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    // Check if wallet payment is chosen and whether the student has sufficient balance
    if (payStatus === 'paid' && method === 'wallet') {
      const studentBalance = transactions
        .filter(tx => !tx.studentName || tx.studentName === lesson.studentName)
        .reduce((acc, curr) => {
          return curr.type === 'deposit' ? acc + curr.amount : acc - curr.amount;
        }, 0);

      if (studentBalance < lesson.price) {
        alert(
          lang === 'ar'
            ? `فشلت العملية: رصيد محفظة المتدرب ${lesson.studentName} غير كافٍ (€${studentBalance}) لدفع قيمة الدرس (€${lesson.price}). يرجى شحن الرصيد أولاً لتفادي الرصيد السالب.`
            : lang === 'nl'
              ? `Fout: Student ${lesson.studentName} heeft onvoldoende saldo (€${studentBalance}) om deze les (€${lesson.price}) via de wallet te betalen. Waardeer eerst het saldo op om een negatief saldo te voorkomen.`
              : `Operation failed: Student ${lesson.studentName} has insufficient wallet balance (€${studentBalance}) to pay for this lesson (€${lesson.price}). Please deposit funds first to prevent a negative balance.`
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
          trainerNotes: notes,
          lessonNotes: lessonNotes || l.lessonNotes,
          instructorNotes: instructorNotes || l.instructorNotes,
          payStatus: payStatus || 'unpaid',
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

      if (method === 'wallet') {
        const newPaymentTx: WalletTransaction = {
          id: `tx-pay-${Date.now()}`,
          date: dateStr,
          type: 'payment',
          amount: lesson.price,
          description: txDesc,
          studentName: lesson.studentName,
          trainerName: "Instructeur Samir"
        };
        setTransactions([newPaymentTx, ...transactions]);
      } else {
        // Direct cash/bank/card payment: log both deposit and payment with net 0 effect on user wallet
        const depositTxId = `tx-dep-${Date.now()}`;
        const paymentTxId = `tx-pay-${Date.now() + 1}`;
        
        const depDesc = lang === 'ar'
          ? `إيداع فوري للدرس (${lesson.date}) - طريقة الدفع: ${methodLabelAr}`
          : `Direct deposit for lesson (${lesson.date}) - Method: ${methodLabelEn}`;

        const newDepositTx: WalletTransaction = {
          id: depositTxId,
          date: dateStr,
          type: 'deposit',
          amount: lesson.price,
          description: depDesc,
          studentName: lesson.studentName,
          trainerName: "Instructeur Samir"
        };

        const newPaymentTx: WalletTransaction = {
          id: paymentTxId,
          date: dateStr,
          type: 'payment',
          amount: lesson.price,
          description: txDesc,
          studentName: lesson.studentName,
          trainerName: "Instructeur Samir"
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
      price: lesson.price,
      notes: notes
    });

    alert(lang === 'ar' ? 'تم تحديث سجل الدرس وتوثيق العملية بنجاح!' : 'Lesson recorded successfully!');
  };

  // Add manual balance deposit or deduction (with negative balance protection)
  const handleAddDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(depositAmount);
    if (isNaN(amountVal) || amountVal <= 0) return;

    // Calculate current student balance to check for sufficient funds on deductions
    const currentStudentBalance = transactions
      .filter(tx => !tx.studentName || tx.studentName === depositStudentName)
      .reduce((acc, curr) => {
        return curr.type === 'deposit' ? acc + curr.amount : acc - curr.amount;
      }, 0);

    const isDeduction = walletOperation === 'payment' || walletOperation === 'adjustment';

    if (isDeduction && currentStudentBalance < amountVal) {
      alert(
        lang === 'ar'
          ? `فشلت العملية: رصيد محفظة المتدرب ${depositStudentName} غير كافٍ (€${currentStudentBalance}). لا يمكن خصم €${amountVal} لتفادي الرصيد السالب.`
          : lang === 'nl'
            ? `Fout: Student ${depositStudentName} heeft onvoldoende saldo (€${currentStudentBalance}). Het afschrijven van €${amountVal} is niet toegestaan om een negatief saldo te voorkomen.`
            : `Error: Student ${depositStudentName} has insufficient wallet balance (€${currentStudentBalance}). Deducting €${amountVal} is not permitted to prevent a negative balance.`
      );
      return;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    
    let descriptionStr = "";
    if (walletOperation === 'deposit') {
      descriptionStr = lang === 'ar'
        ? `إيداع نقدي يدوي بواسطة المدرب لحساب المتدرب: ${depositStudentName}`
        : `Manual Cash Deposit by Instructor Samir into ${depositStudentName}'s Account`;
    } else if (walletOperation === 'payment') {
      descriptionStr = lang === 'ar'
        ? `خصم تكلفة درس تدريبي للمتدرب: ${depositStudentName}`
        : `Driving Lesson Cost Deduction for ${depositStudentName}`;
    } else {
      descriptionStr = lang === 'ar'
        ? `تعديل رصيد المحفظة يدوياً للمتدرب: ${depositStudentName}`
        : `Manual Wallet Balance Adjustment for ${depositStudentName}`;
    }

    const newTx: WalletTransaction = {
      id: `tx-manual-${Date.now()}`,
      date: dateStr,
      type: walletOperation,
      amount: amountVal,
      description: descriptionStr,
      studentName: depositStudentName,
      trainerName: "Instructeur Samir"
    };

    const updatedTransactions = [newTx, ...transactions];
    setTransactions(updatedTransactions);

    // Calculate new simulated balance
    const updatedBalance = walletOperation === 'deposit' 
      ? currentStudentBalance + amountVal 
      : currentStudentBalance - amountVal;

    // Send deposit/payment confirmation email to student's inbox
    sendAppEmail(depositStudentName, walletOperation === 'deposit' ? 'deposit' : 'invoice', {
      amount: amountVal,
      paymentMethod: lang === 'ar' ? "إيداع يدوي / تعديل بواسطة المدرب" : "Manual Escrow Adjustment by Instructor Samir",
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
    const invId = `INV-CUSTOM-${Math.floor(1000 + Math.random() * 9000)}`;
    const vatPercent = billVatRate;
    const vatAmount = amt * (vatPercent / 100);
    const grandTotal = amt + vatAmount;

    const newTx: WalletTransaction = {
      id: `tx-bill-${Date.now()}`,
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

  // Filter student registries
  const defaultNames = ["Amir Al-Hassan", "أمير الحسن", "Sanne de Jong", "ساني دي يونغ", "Michael van Berg", "مايكل فان بيرغ"];
  const dynamicStudents: any[] = [];
  
  lessons.forEach(l => {
    if (l.studentName && !defaultNames.some(dn => studentNamesMatch(dn, l.studentName)) && !dynamicStudents.some(ds => studentNamesMatch(ds.name, l.studentName))) {
      dynamicStudents.push({
        name: l.studentName,
        progress: "10%",
        balance: getStudentBalance(l.studentName),
        examStatus: lang === 'ar' ? "مسجل حديثاً" : lang === 'nl' ? "Nieuw geregistreerd" : "Newly Registered"
      });
    }
  });

  const studentsList = [
    { 
      name: lang === 'ar' ? "أمير الحسن" : "Amir Al-Hassan", 
      progress: "85%", 
      balance: getStudentBalance("Amir Al-Hassan"), 
      examStatus: lang === 'ar' ? "حاصل على شهادة امتحان النظرية" : lang === 'nl' ? "Theorie Gecertificeerd" : "Theory Certified" 
    },
    { 
      name: lang === 'ar' ? "ساني دي يونغ" : "Sanne de Jong", 
      progress: "40%", 
      balance: getStudentBalance("Sanne de Jong"), 
      examStatus: lang === 'ar' ? "في انتظار الامتحان النظري" : lang === 'nl' ? "In afwachting van theorie" : "Pending Theory" 
    },
    { 
      name: lang === 'ar' ? "مايكل فان بيرغ" : "Michael van Berg", 
      progress: "95%", 
      balance: getStudentBalance("Michael van Berg"), 
      examStatus: lang === 'ar' ? "جاهز تماماً لامتحان القيادة العملي الأندلس!" : lang === 'nl' ? "Helemaal klaar voor praktijkexamen Al-Andalos!" : "Ready for practical driving exam!" 
    },
    ...dynamicStudents
  ];

  const getStudentDbInfo = (name?: string) => {
    const safeName = typeof name === 'string' ? name : '';
    const isAmir = safeName === "Amir Al-Hassan" || safeName === "أمير الحسن" || safeName.includes("أمير") || safeName.includes("Amir");
    const isSanne = safeName === "Sanne de Jong" || safeName === "ساني دي يونغ" || safeName.includes("ساني") || safeName.includes("Sanne");
    const isMichael = safeName === "Michael van Berg" || safeName === "مايكل فان بيرغ" || safeName.includes("مايكل") || safeName.includes("Michael");
    
    if (isAmir) {
      return {
        name: lang === 'ar' ? "أمير الحسن" : "Amir Al-Hassan",
        email: "amir@al-andalos.nl",
        phone: "+31 6 1234 5678",
        city: "Amsterdam",
        dob: "2005-08-15",
        package: "Optimal Progress (20h)",
        regDate: "2026-06-01",
        progress: "85%",
        balance: getStudentBalance("Amir Al-Hassan"),
        examStatus: lang === 'ar' ? "حاصل على شهادة امتحان النظرية" : "Theory Certified"
      };
    } else if (isSanne) {
      return {
        name: lang === 'ar' ? "ساني دي يونغ" : "Sanne de Jong",
        email: "sanne.dejong@al-andalos.nl",
        phone: "+31 6 2345 6789",
        city: "Rotterdam",
        dob: "2004-11-22",
        package: "Basic Driving (10h)",
        regDate: "2026-06-10",
        progress: "40%",
        balance: getStudentBalance("Sanne de Jong"),
        examStatus: lang === 'ar' ? "في انتظار الامتحان النظري" : "Pending Theory"
      };
    } else if (isMichael) {
      return {
        name: lang === 'ar' ? "مايكل فان بيرغ" : "Michael van Berg",
        email: "michael.vanberg@outlook.com",
        phone: "+31 6 3456 7890",
        city: "Utrecht",
        dob: "2003-04-05",
        package: "Express Course (15h)",
        regDate: "2026-05-20",
        progress: "95%",
        balance: getStudentBalance("Michael van Berg"),
        examStatus: lang === 'ar' ? "جاهز تماماً للامتحان العملي" : "Ready for practical driving exam!"
      };
    } else {
      // Dynamic fallback looking up lessons/transactions state registers
      const studentLss = lessons.filter(l => studentNamesMatch(l.studentName, safeName));
      const firstLesson = studentLss.length > 0 ? studentLss[studentLss.length - 1] : null; // earliest
      
      const deducedCity = firstLesson 
        ? (firstLesson.pickupLocation.includes("Amsterdam") ? "Amsterdam" : firstLesson.pickupLocation.includes("Rotterdam") ? "Rotterdam" : firstLesson.pickupLocation.includes("Utrecht") ? "Utrecht" : "Amsterdam")
        : "Amsterdam";
      const regDate = firstLesson ? firstLesson.date : new Date().toISOString().split('T')[0];
      
      return {
        name: safeName,
        email: `${safeName.toLowerCase().replace(/[\s-_]/g, '.')}@al-andalos.nl`,
        phone: "+31 6 8888 9999",
        city: deducedCity,
        dob: "2004-10-10",
        package: "Standard Comfort (15h)",
        regDate: regDate,
        progress: "50%",
        balance: getStudentBalance(safeName),
        examStatus: lang === 'ar' ? "قيد التدريب الفعلي" : "In Active Training"
      };
    }
  };

  const filteredStudents = studentsList.filter(s => 
    s.name.toLowerCase().includes(searchInput.toLowerCase())
  );

  return (
    <div id="trainer-dashboard-root" className="space-y-6 pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Top Banner layout */}
      <div className="p-6 bg-linear-to-r from-slate-900 via-slate-950 to-zinc-950 text-white rounded-3xl border border-zinc-900 shadow-md flex justify-between items-center transition-all">
        <div>
          <span className="p-1 px-2.5 rounded-full text-[9px] font-black tracking-widest bg-blue-600/30 text-blue-300 border border-blue-500/10">
            {lt.trainerSuite}
          </span>
          <h1 className="text-xl font-extrabold mt-1.5 flex items-center gap-1.5">
            {t.trainerDashboard}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">{lt.welcomeTrainer}</p>
        </div>
        
        <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-mono font-bold shrink-0">Samir EP-14</span>
      </div>

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
                {lessons.filter(l => l.status === 'completed').length} {lang === 'ar' ? 'حصص' : 'Completed'}
              </p>
              <p className="text-xs text-slate-400 font-medium">{lt.licenseAuthority}</p>
            </div>

            <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl shadow-xs space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{lt.hoursLogged}</span>
              <p className="text-3xl font-black text-blue-600 dark:text-blue-400">
                {lessons.filter(l => l.status === 'completed').reduce((acc, curr) => acc + curr.duration, 0)} {lang === 'ar' ? 'ساعات منجزة' : 'hours logged'}
              </p>
              <p className="text-xs text-slate-400 font-medium">{lt.avgRating}</p>
            </div>

            {/* Paid Card badge */}
            <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl shadow-xs space-y-1">
              <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {lang === 'ar' ? 'الإيرادات المدفوعة' : lang === 'nl' ? 'Betaalde Omzet' : 'Paid Revenue'}
              </span>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                €{lessons.filter(l => l.status === 'completed' && l.payStatus === 'paid').reduce((acc, curr) => acc + curr.price, 0)}
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
                €{lessons.filter(l => l.status === 'completed' && (l.payStatus || 'unpaid') === 'unpaid').reduce((acc, curr) => acc + curr.price, 0)}
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
                {lessons.filter(l => l.status === 'upcoming' || l.status === 'active').length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 text-center bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-900">
                    {lang === 'ar' ? 'لا توجد حصص نشطة أو مجدولة لليوم.' : 'No active or upcoming lessons for today.'}
                  </p>
                ) : (
                  lessons.filter(l => l.status === 'upcoming' || l.status === 'active').map(item => (
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
                        {item.status === 'upcoming' && (
                          <button
                            onClick={() => {
                              setFinishingLessonId(item.id);
                            }}
                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer text-center transition flex items-center justify-center"
                          >
                            {lang === 'ar' ? 'إنهاء الدرس' : 'Finish Lesson'}
                          </button>
                        )}
                        {item.status === 'active' && (
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
                            onClick={() => {
                              const updated = lessons.filter(l => l.id !== item.id);
                              setLessons(updated);
                              
                              // Send beautiful cancellation email to student
                              sendAppEmail(item.studentName, 'cancellation', {
                                date: item.date,
                                time: item.time,
                                price: item.price
                              });
                              
                              alert(lang === 'ar' ? 'تم إلغاء الدرس وحذفه بنجاح.' : 'Lesson cancelled.');
                            }}
                            className="flex-1 py-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-lg text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/20 transition flex items-center justify-center cursor-pointer"
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

                  <form onSubmit={handleBillSubmit} className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-slate-500 block mb-1 text-[11px] font-bold uppercase tracking-wider">{lt.billRecipient}</label>
                        <select
                          value={billStudent}
                          onChange={(e) => setBillStudent(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-xl dark:text-white text-xs font-bold"
                        >
                          {studentsList.map(s => (
                            <option key={s.name} value={s.name}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-500 block mb-1 text-[11px] font-bold uppercase tracking-wider">{lang === 'ar' ? 'المبلغ (قبل الضريبة)' : 'Amount (Excl. VAT)'}</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-3 text-xs text-slate-450 font-black">€</span>
                            <input
                              type="number"
                              placeholder="e.g. 150"
                              required
                              value={billAmount}
                              onChange={(e) => setBillAmount(e.target.value)}
                              className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-xl text-xs font-black dark:text-white focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-slate-500 block mb-1 text-[11px] font-bold uppercase tracking-wider">{lang === 'ar' ? 'نسبة الضريبة (BTW)' : 'VAT Rate'}</label>
                          <select
                            value={billVatRate}
                            onChange={(e) => setBillVatRate(Number(e.target.value) as 0 | 9 | 21)}
                            className="w-full p-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-xl dark:text-white text-xs font-bold"
                          >
                            <option value={21}>21% ({lang === 'ar' ? 'قياسي هولندي' : 'Standard BTW'})</option>
                            <option value={9}>9% ({lang === 'ar' ? 'مخفض هولندي' : 'Reduced BTW'})</option>
                            <option value={0}>0% ({lang === 'ar' ? 'معفى' : 'Exempted'})</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-500 block mb-1 text-[11px] font-bold uppercase tracking-wider">{lt.billDesc}</label>
                        <input
                          type="text"
                          placeholder={lt.descPlaceholder}
                          required
                          value={billDesc}
                          onChange={(e) => setBillDesc(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-xl dark:text-white text-xs font-medium"
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
                        : 'Manage student escrow wallet: Deposit funds, deduct lesson costs, or apply manual balance adjustments with real-time student synchronization.'}
                    </p>
                  </div>

                  {depositSuccess && (
                    <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold animate-pulse flex items-center gap-1.5">
                      <Check className="h-4 w-4" />
                      {lang === 'ar' ? 'تمت معالجة المعاملة المالية وإرسال الإشعار بنجاح!' : 'Financial operation processed & notification dispatched!'}
                    </div>
                  )}

                  <form onSubmit={handleAddDepositSubmit} className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-slate-500 block mb-1 text-[11px] font-bold uppercase tracking-wider">{lt.studentLabel}</label>
                        <select
                          value={depositStudentName}
                          onChange={(e) => setDepositStudentName(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-xl dark:text-white text-xs font-bold"
                        >
                          {studentsList.map(s => (
                            <option key={s.name} value={s.name}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Quick presets (€50, €100, €250, €500) */}
                      <div>
                        <label className="text-slate-500 block mb-1.5 text-[11px] font-bold uppercase tracking-wider">
                          {lang === 'ar' ? 'اختر قيمة سريعة (€)' : 'Quick Preset Amount (€)'}
                        </label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[50, 100, 250, 500].map(preset => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setDepositAmount(preset.toString())}
                              className={`py-1.5 rounded-lg border text-xs font-mono font-bold transition duration-155 cursor-pointer ${
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
                        <label className="text-slate-500 block mb-1 text-[11px] font-bold uppercase tracking-wider">{lt.amountLabel}</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-3 text-xs text-slate-450 font-black">€</span>
                          <input
                            type="number"
                            placeholder="e.g. 200"
                            required
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-xl text-xs font-black dark:text-white focus:ring-1 focus:ring-indigo-500"
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

        </div>
      )}

      {activeTab === 'lessons' && (
        <div id="trainer-lessons-view" className="space-y-6 animate-fade-in">
          {/* Header Card with Stats and Filter */}
          <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-150/60 dark:border-zinc-800">
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-800 dark:text-white text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  {lang === 'ar' ? 'أرشيف الدروس المكتملة والموثقة' : lang === 'nl' ? 'Archief Voltooide Rijlessen' : 'Completed Lessons Archive'}
                </h3>
                <p className="text-xs text-slate-500 font-medium dark:text-zinc-400">
                  {lang === 'ar' 
                    ? 'قاعدة بيانات السجلات المكتملة، مسارات GPS التدريبية، والتقييمات الموثقة من Google Sheets.' 
                    : lang === 'nl'
                      ? 'Volledig overzicht van afgeronde ritten, inclusief GPS tracks, betalingsstatus en instructeursfeedback.'
                      : 'Comprehensive registry of concluded driving sessions, GPS tracks, payment logs, and trainer feedback.'}
                </p>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={triggerSheetsLoad}
                  disabled={isLoadingSheets}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-800 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  title="Reload from Google Sheets"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingSheets ? 'animate-spin' : ''}`} />
                  {isLoadingSheets 
                    ? (lang === 'ar' ? 'جاري التحميل...' : 'Loading...') 
                    : (lang === 'ar' ? 'تحديث البيانات' : lang === 'nl' ? 'Vernieuwen' : 'Sync Sheets')}
                </button>
                <span className="px-2.5 py-1 text-xs bg-blue-50 dark:bg-blue-950/25 text-blue-600 dark:text-blue-400 rounded-xl font-mono font-black border border-blue-100/40">
                  {lang === 'ar' ? 'المدخلات المكتملة:' : 'Concluded:'} {lessons.filter(l => l.status === 'completed').length}
                </span>
              </div>
            </div>

            {/* Filter and Loading status bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <span className="text-xs font-extrabold text-slate-550 dark:text-zinc-400 whitespace-nowrap flex items-center gap-1">
                  <Search className="h-3.5 w-3.5" />
                  {lang === 'ar' ? 'تصفية حسب الطالب:' : lang === 'nl' ? 'Filter leerling:' : 'Filter Student:'}
                </span>
                <select
                  value={completedLessonStudentFilter}
                  onChange={(e) => setCompletedLessonStudentFilter(e.target.value)}
                  className="p-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-200 min-w-[200px] focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="all">{lang === 'ar' ? 'جميع الطلاب' : lang === 'nl' ? 'Alle Leerlingen' : 'All Students'}</option>
                  {Array.from(new Set([
                    ...studentsList.map(s => s.name),
                    ...lessons.map(l => l.studentName)
                  ])).filter(Boolean).map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {isLoadingSheets && (
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2 animate-pulse bg-blue-500/5 px-3 py-1 rounded-lg">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping"></div>
                  {lang === 'ar' ? 'جاري سحب بيانات الحصص الحية من Google Sheets...' : 'Retrieving official completed lessons from Google Sheets...'}
                </div>
              )}
              {sheetsLoadSuccess === true && !isLoadingSheets && (
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-500/5 px-3 py-1 rounded-lg">
                  <Check className="h-3.5 w-3.5" />
                  {lang === 'ar' ? 'تمت المزامنة بنجاح مع Google Sheets' : 'Successfully synchronized with Google Sheets live'}
                </div>
              )}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lessons
              .filter(l => l.status === 'completed')
              .filter(l => completedLessonStudentFilter === 'all' || l.studentName === completedLessonStudentFilter)
              .length === 0 ? (
                <div className="col-span-1 md:col-span-2 p-12 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl text-center space-y-3">
                  <div className="h-12 w-12 bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 rounded-full flex items-center justify-center mx-auto">
                    <Activity className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                    {lang === 'ar' ? 'لا توجد حصص مكتملة مطابقة' : 'No Concluded Lessons Found'}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    {lang === 'ar' 
                      ? 'لم نجد أي حصص تدريبية مكتملة مطابقة لمعايير البحث الحالية.' 
                      : 'No completed driving sessions were found in the database matching your active filters.'}
                  </p>
                </div>
              ) : (
                lessons
                  .filter(l => l.status === 'completed')
                  .filter(l => completedLessonStudentFilter === 'all' || l.studentName === completedLessonStudentFilter)
                  .map(item => {
                    // Check if route points exist
                    const hasRoute = item.routePoints && item.routePoints.length > 0;
                    
                    // Generate Google Maps URL
                    const origin = hasRoute ? item.routePoints![0] : null;
                    const destination = hasRoute ? item.routePoints![item.routePoints!.length - 1] : null;
                    const waypointsList = hasRoute ? item.routePoints!.slice(1, -1) : [];
                    
                    // Downsample waypoints to avoid URL limit
                    const step = Math.max(1, Math.floor(waypointsList.length / 8));
                    const downsampled = [];
                    for (let i = 0; i < waypointsList.length; i += step) {
                      downsampled.push(waypointsList[i]);
                      if (downsampled.length >= 8) break;
                    }
                    const waypointsParam = downsampled.map(p => `${p.lat},${p.lng}`).join('|');
                    const googleMapsUrl = hasRoute 
                      ? `https://www.google.com/maps/dir/?api=1&origin=${origin!.lat},${origin!.lng}&destination=${destination!.lat},${destination!.lng}${waypointsParam ? `&waypoints=${encodeURIComponent(waypointsParam)}` : ''}&travelmode=driving`
                      : '';

                    const isPaid = (item.payStatus || (item.id === 'l3' || item.id === 'l4' ? 'paid' : 'unpaid')) === 'paid';

                    return (
                      <div 
                        key={item.id} 
                        className="p-5 bg-white dark:bg-zinc-900 border border-slate-150/85 dark:border-zinc-800/80 rounded-2xl shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between space-y-4"
                      >
                        {/* Card Header */}
                        <div className="flex justify-between items-start">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                {lang === 'ar' ? 'مكتملة' : 'completed'}
                              </span>
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                                isPaid ? 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-600 dark:text-rose-450'
                              }`}>
                                {isPaid ? (lang === 'ar' ? 'مدفوعة' : 'PAID') : (lang === 'ar' ? 'غير مدفوعة' : 'UNPAID')}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-slate-400">
                                #{item.id}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-1">
                              <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-300">
                                <User className="h-4 w-4" />
                              </div>
                              <div>
                                <h4 className="font-extrabold text-slate-800 dark:text-white text-sm leading-tight">{item.studentName}</h4>
                                <p className="text-[10px] text-slate-400 font-medium">
                                  {lang === 'ar' ? 'المدرب: ' : 'Trainer: '} {item.trainerName || 'Samir'}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-black text-slate-900 dark:text-white font-mono block">€{item.price}</span>
                            <span className="text-[10px] text-slate-400 font-semibold block">{item.duration} {lang === 'ar' ? 'ساعة' : 'Hour(s)'}</span>
                          </div>
                        </div>

                        {/* Session details list */}
                        <div className="space-y-2 text-xs pt-2 border-t border-slate-100 dark:border-zinc-800/60">
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="space-y-0.5">
                              <span className="text-slate-400 font-semibold block">{lang === 'ar' ? 'التاريخ والوقت:' : 'Date & Time:'}</span>
                              <span className="font-bold text-slate-700 dark:text-zinc-200 flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                {item.date} @ {item.time}
                              </span>
                            </div>

                            <div className="space-y-0.5">
                              <span className="text-slate-400 font-semibold block">{lang === 'ar' ? 'عنوان الالتقاء:' : 'Pickup Location:'}</span>
                              <span className="font-bold text-slate-700 dark:text-zinc-200 flex items-center gap-1 truncate" title={item.pickupLocation}>
                                <MapPin className="h-3 w-3 text-slate-400" />
                                {item.pickupLocation}
                              </span>
                            </div>
                          </div>

                          {/* Render GPS Metrics if available */}
                          {hasRoute && (
                            <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-zinc-950 p-2 rounded-xl text-[10px] border border-slate-100/60 dark:border-zinc-800/40">
                              <div>
                                <span className="text-slate-400 font-medium block">{lang === 'ar' ? 'المسافة:' : 'Distance:'}</span>
                                <span className="font-black text-slate-700 dark:text-zinc-200">{item.distanceKm || '12.5'} km</span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-medium block">{lang === 'ar' ? 'الوقت المستغرق:' : 'Elapsed Time:'}</span>
                                <span className="font-black text-slate-700 dark:text-zinc-200">{item.elapsedTime || '52m'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-medium block">{lang === 'ar' ? 'مسار GPS:' : 'GPS Route:'}</span>
                                <span className="font-black text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                                  <Activity className="h-2.5 w-2.5" />
                                  {item.routePoints!.length} pts
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Notes */}
                          {item.lessonNotes && (
                            <div className="text-[11px] bg-slate-50 dark:bg-zinc-950/60 p-2.5 rounded-xl text-slate-600 dark:text-zinc-300 border border-slate-100/65 dark:border-zinc-800/40">
                              <strong className="text-slate-700 dark:text-white font-bold">{lang === 'ar' ? 'مواضيع الدرس:' : 'Lesson Topics:'}</strong>
                              <p className="mt-0.5 leading-relaxed font-medium text-[11px]">{item.lessonNotes}</p>
                            </div>
                          )}

                          {item.instructorNotes && (
                            <div className="text-[11px] bg-blue-50/40 dark:bg-blue-950/15 p-2.5 rounded-xl text-blue-700 dark:text-blue-300 border border-blue-100/30 dark:border-blue-900/10">
                              <strong className="text-blue-800 dark:text-blue-200 font-bold">{lang === 'ar' ? 'ملاحظات المدرب والتقييم:' : 'Instructor Feedback:'}</strong>
                              <p className="mt-0.5 leading-relaxed font-medium text-[11px]">{item.instructorNotes}</p>
                            </div>
                          )}

                          {item.trainerNotes && !item.instructorNotes && (
                            <div className="text-[11px] bg-blue-50/40 dark:bg-blue-950/15 p-2.5 rounded-xl text-blue-700 dark:text-blue-300 border border-blue-100/30 dark:border-blue-900/10">
                              <strong className="text-blue-800 dark:text-blue-200 font-bold">{lang === 'ar' ? 'ملاحظات المدرب والتقييم:' : 'Instructor Feedback:'}</strong>
                              <p className="mt-0.5 leading-relaxed font-medium text-[11px]">{item.trainerNotes}</p>
                            </div>
                          )}
                        </div>

                        {/* Card Footer Actions */}
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800/60">
                          {/* Map Preview Expanded */}
                          {hasRoute && activeMapPreviewId === item.id && (
                            <CardMapPreview points={item.routePoints!} lessonId={item.id} />
                          )}

                          <div className="flex gap-2">
                            {hasRoute && (
                              <>
                                <a 
                                  href={googleMapsUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-[11px] font-bold rounded-xl cursor-pointer transition flex items-center justify-center gap-1 shadow-xs hover:shadow-sm"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  {lang === 'ar' ? 'عرض المسار على Google Maps' : 'View Google Maps Route'}
                                </a>

                                <button
                                  type="button"
                                  onClick={() => setActiveMapPreviewId(activeMapPreviewId === item.id ? null : item.id)}
                                  className="px-3 bg-slate-50 dark:bg-zinc-850 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 text-[11px] font-bold rounded-xl border border-slate-200 dark:border-zinc-800 transition flex items-center justify-center cursor-pointer"
                                  title={activeMapPreviewId === item.id ? "Close Map Preview" : "Show Map Preview"}
                                >
                                  <MapIcon className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}

                            {!isPaid && (
                              <button
                                type="button"
                                onClick={() => {
                                  setReminderModalLessonId(item.id);
                                  setReminderPaymentLink(`https://rijschool-andalus.nl/pay/${item.id}`);
                                  setReminderCustomNotes(
                                    lang === 'ar' 
                                      ? 'نرجو منكم مراجعة وتصفية مستحقات هذا الدرس التدريبي عبر الرابط المرفق لضمان استمرار حجز الدروس القادمة.' 
                                      : lang === 'nl' 
                                        ? 'Gelieve deze openstaande rijles betaling te voldoen via de bijgevoegde link. Bedankt!' 
                                        : 'Please check and settle the outstanding amount for this lesson using the link.'
                                  );
                                }}
                                className={`py-2 text-white text-[11px] font-bold rounded-xl cursor-pointer transition flex items-center justify-center gap-1 shadow-xs ${
                                  hasRoute ? 'px-3 bg-amber-500 hover:bg-amber-600' : 'flex-1 bg-amber-500 hover:bg-amber-600'
                                }`}
                              >
                                <Mail className="h-3.5 w-3.5" />
                                {!hasRoute && (lang === 'ar' ? 'إرسال تذكير بالدفع' : 'Send Payment Reminder')}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
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
              const isHighProgress = progressVal >= 80;
              
              return (
                <div 
                  key={student.name} 
                  className="p-6 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-zinc-700 transition duration-300 shadow-xs"
                >
                  <div className="space-y-3">
                    {/* Card Header: Avatar & Name */}
                    <div className="flex items-center gap-3">
                      {getStudentPhoto(student.name) ? (
                        <img 
                          src={getStudentPhoto(student.name)!} 
                          alt={student.name} 
                          className="h-10 w-10 rounded-full object-cover border border-blue-500/15 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-500/10 shrink-0">
                          {getStudentInitials(student.name)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 dark:text-zinc-200 text-sm truncate">{student.name}</h4>
                        <p className="text-[10px] text-slate-400 truncate">{details.email}</p>
                      </div>
                    </div>

                    {/* Progress with bar */}
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-450">{lt.drivingProgression}</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{student.progress}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${progressVal}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Meta information row */}
                    <div className="grid grid-cols-2 gap-2 pt-1.5 text-[10px] border-t border-slate-200/50 dark:border-zinc-900">
                      <div>
                        <span className="text-slate-400 block uppercase tracking-wider text-[8px]">{lang === 'ar' ? 'الباقة:' : 'PACKAGE'}</span>
                        <span className="font-bold text-slate-700 dark:text-zinc-300 truncate block" title={details.package}>{details.package}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block uppercase tracking-wider text-[8px]">{lang === 'ar' ? 'المحفظة:' : 'WALLET'}</span>
                        <span className={`font-mono font-bold block ${details.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                          €{details.balance.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="pt-1 flex items-center justify-between text-[10px]">
                      <span className="text-slate-450">{lang === 'ar' ? 'الحالة:' : 'Status:'}</span>
                      <span className={`p-0.5 px-2 rounded-full font-bold uppercase text-[9px] ${
                        isHighProgress 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {student.examStatus}
                      </span>
                    </div>
                  </div>

                  {/* Premium Action Buttons Toolbar */}
                  <div className="pt-3 border-t border-slate-150 dark:border-zinc-800/60 mt-2 flex items-center justify-between gap-1.5 flex-row">
                    <button
                      onClick={() => setViewingReportStudentName(student.name)}
                      className="flex-1 py-2 px-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-850 dark:text-zinc-200 rounded-lg text-[10px] font-extrabold uppercase transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border border-slate-200/40 dark:border-zinc-700/30"
                      title={lang === 'ar' ? 'عرض التقرير والسجل' : 'View Report'}
                    >
                      <FileText className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      <span>{lang === 'ar' ? 'عرض' : 'View'}</span>
                    </button>

                    <button
                      onClick={async () => {
                        try {
                          const pdf = await generateUnifiedStudentDossierPDF(student.name);
                          if (pdf) {
                            pdf.save(`Al_Andalos_Dossier_${student.name.replace(/[\s]+/g, '_')}.pdf`);
                          }
                        } catch (error) {
                          console.error("Direct PDF download failed:", error);
                        }
                      }}
                      className="flex-1 py-2 px-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/25 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-extrabold uppercase transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border border-blue-200/40 dark:border-blue-800/20"
                      title={lang === 'ar' ? 'تحميل ملف PDF' : 'Download PDF'}
                    >
                      <Download className="h-3.5 w-3.5 shrink-0" />
                      <span>{lang === 'ar' ? 'تحميل' : 'PDF'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setViewingReportStudentName(student.name);
                        const startTime = Date.now();
                        const checkAndPrint = () => {
                          const pages = document.querySelectorAll('.dossier-pdf-page');
                          if (pages.length > 0) {
                            // Let the DOM fully layout and render the light-theme switches
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
                      className="flex-1 py-2 px-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-850 dark:text-zinc-200 rounded-lg text-[10px] font-extrabold uppercase transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border border-slate-200/40 dark:border-zinc-700/30"
                      title={lang === 'ar' ? 'طباعة التقرير' : 'Print'}
                    >
                      <Printer className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400 shrink-0" />
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
                            await handleSendDossierEmail(student.name, undefined, base64Data);
                          }
                        } catch (error) {
                          console.error("Direct Send email failed:", error);
                          setEmailStatusToast('error');
                          setIsSendingEmail(false);
                        }
                      }}
                      className="flex-1 py-2 px-1 bg-amber-500/10 hover:bg-amber-500/15 dark:bg-amber-500/5 dark:hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-extrabold uppercase transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border border-amber-500/20 dark:border-amber-500/10"
                      title={lang === 'ar' ? 'إرسال التقرير بالبريد' : 'Send Report'}
                    >
                      <Send className="h-3.5 w-3.5 shrink-0 text-amber-500" />
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
      )}

      {activeTab === 'invoices' && (
        <div id="trainer-invoices-view" className="space-y-6 animate-in fade-in duration-300">
          {/* Success Overlay Dialog */}
          {invoiceDispatchedOverlay && latestIssuedInvoice && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-lg w-full border border-slate-100 dark:border-zinc-800 shadow-2xl">
                <div className="text-center space-y-3">
                  <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2">
                    <CheckCircle className="h-6 w-6 stroke-[2.5]" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {lang === 'ar' ? 'تم إصدار وإرسال الفاتورة بنجاح!' : 'Invoice Dispatched Successfully!'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {lang === 'ar' 
                      ? `تم تسجيل الفاتورة الضريبية رقم ${latestIssuedInvoice.invoiceId} وإشعار المتدرب ${latestIssuedInvoice.studentName} بالبريد الإلكتروني ومزامنته بـ Wallet.`
                      : `Tax Invoice ${latestIssuedInvoice.invoiceId} compiled and dispatched to ${latestIssuedInvoice.studentName}'s portal.`}
                  </p>
                </div>

                <div className="mt-5 p-4 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-900 text-xs text-slate-600 dark:text-zinc-300 space-y-2.5">
                  <div className="flex justify-between font-bold">
                    <span>{lang === 'ar' ? 'رقم الفاتورة:' : 'Invoice No:'}</span>
                    <span className="font-mono text-blue-600">{latestIssuedInvoice.invoiceId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{lang === 'ar' ? 'التاريخ:' : 'Date:'}</span>
                    <span>{latestIssuedInvoice.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{lang === 'ar' ? 'عدد الدروس المفوترة:' : 'Lessons Billed:'}</span>
                    <span className="font-bold">{latestIssuedInvoice.billedLessons.length}</span>
                  </div>
                  <div className="border-t border-dashed border-slate-200 dark:border-zinc-800 pt-2 flex justify-between font-black text-slate-800 dark:text-white">
                    <span>{lang === 'ar' ? `المجموع النهائي (شامل الـ ${latestIssuedInvoice.vatRate}%):` : `Grand Total (inc. VAT ${latestIssuedInvoice.vatRate}%):`}</span>
                    <span className="text-blue-600">€{latestIssuedInvoice.grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <button
                    onClick={() => {
                      alert(lang === 'ar' ? 'جاري تجهيز نسخة الطباعة للتحميل...' : 'Rendering print friendly layout for download...');
                    }}
                    className="flex-1 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-250 rounded-xl text-xs font-bold hover:bg-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {lang === 'ar' ? 'تحميل PDF الكابتن' : 'PDF Copy'}
                  </button>
                  <button
                    onClick={() => setInvoiceDispatchedOverlay(false)}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {lang === 'ar' ? 'متابعة العمل' : 'Done, return'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl space-y-4">
            <div className="flex items-start gap-2.5 pb-2 border-b border-slate-100 dark:border-zinc-800">
              <div className="p-1 px-2.5 rounded-lg bg-blue-500/10 text-blue-500 font-mono text-[10px] uppercase font-bold">
                {lang === 'ar' ? 'نظام المحاسبة الضريبي' : 'Tax Invoicing Core'}
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-white text-base">
                  {lt.invoiceTitle}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'ar' 
                    ? 'إعداد الكشوفات وإرسال الفواتير للمتدربين استناداً إلى الدروس المنجزة المسجلة بالنظام ومزامنتها بالمحفظة المالية.'
                    : 'Select completed lessons, specify additions and dispatch professional invoices on demand.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Form Config Left Panel */}
              <form onSubmit={handleSendDetailedInvoice} className="lg:col-span-7 space-y-5">
                
                {/* 1. Recipient dropdown */}
                <div className="space-y-1.5 text-xs font-semibold">
                  <label className="text-slate-450 block">{lt.studentLabel}</label>
                  <select
                    value={selectedInvoiceStudent}
                    onChange={(e) => {
                      setSelectedInvoiceStudent(e.target.value);
                      setSelectedInvoiceLessonIds([]);
                    }}
                    className="w-full p-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-xl dark:text-white text-xs font-medium"
                  >
                    {studentsList.map(s => (
                      <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* 1.5 VAT & Payment Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-semibold">
                  <div className="space-y-1.5">
                    <label className="text-slate-450 block">
                      {lang === 'ar' ? 'نسبة الضريبة (BTW):' : 'VAT / BTW Rate:'}
                    </label>
                    <select
                      value={selectedVatRate}
                      onChange={(e) => setSelectedVatRate(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-xl dark:text-white text-xs font-semibold"
                    >
                      <option value={21}>21% ({lang === 'ar' ? 'القياسي' : 'Standard'})</option>
                      <option value={9}>9% ({lang === 'ar' ? 'المخفض' : 'Reduced'})</option>
                      <option value={0}>0% ({lang === 'ar' ? 'معفى' : 'Exempt'})</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-450 block">
                      {lang === 'ar' ? 'طريقة الدفع:' : 'Payment Method:'}
                    </label>
                    <select
                      value={invoicePaymentMethod}
                      onChange={(e) => setInvoicePaymentMethod(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-xl dark:text-white text-xs font-semibold"
                    >
                      <option value="wallet">{lang === 'ar' ? 'المحفظة الرقمية' : 'Digital Wallet'}</option>
                      <option value="cash">{lang === 'ar' ? 'نقداً (كاش)' : 'Cash Payment'}</option>
                      <option value="transfer">{lang === 'ar' ? 'تحويل بنكي iDEAL' : 'Bank Transfer'}</option>
                      <option value="card">{lang === 'ar' ? 'بطاقة الائتمان' : 'Credit Card'}</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-450 block">
                      {lang === 'ar' ? 'حالة السداد:' : 'Payment Status:'}
                    </label>
                    <select
                      value={invoicePaymentStatus}
                      onChange={(e) => setInvoicePaymentStatus(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-xl dark:text-white text-xs font-semibold"
                    >
                      <option value="paid">{lang === 'ar' ? 'مدفوعة بالكامل' : 'Paid'}</option>
                      <option value="unpaid">{lang === 'ar' ? 'غير مدفوعة (مستحقة)' : 'Unpaid (Pending)'}</option>
                    </select>
                  </div>
                </div>

                {/* 2. Lessons logs with checkbox selection */}
                <div className="space-y-2.5 text-xs">
                  <label className="text-slate-450 font-semibold block">
                    {lang === 'ar' ? 'اختر الدروس المكتملة لتضمينها في هذه الفاتورة:' : 'Select completed lessons to bill in this invoice:'}
                  </label>
                  
                  {lessons.filter(l => l.studentName === selectedInvoiceStudent && l.status === 'completed' && !billedLessonIds.includes(l.id)).length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-amber-300/40 bg-amber-500/10 text-amber-500 text-xs">
                      {lang === 'ar' 
                        ? 'مكتمل الفوترة! لا توجد دروس عملية غير مفوترة لهذا الطالب حالياً. وسيتم تضمين الإضافات المخصصة المدرجة أدناه فقط في الفاتورة.'
                        : 'No pending completed lessons found for this student. You can specify custom additions below to bill independently.'}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1 no-scrollbar">
                      {lessons
                        .filter(l => l.studentName === selectedInvoiceStudent && l.status === 'completed' && !billedLessonIds.includes(l.id))
                        .map(item => {
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
                              className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                                isChecked 
                                  ? 'bg-blue-600/10 border-blue-500/30' 
                                  : 'bg-slate-50 dark:bg-zinc-950 border-slate-100 dark:border-zinc-900'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  readOnly
                                  className="h-4 w-4 text-blue-600 border-slate-300 dark:border-zinc-800 rounded-sm"
                                />
                                <div>
                                  <p className="font-bold text-slate-800 dark:text-zinc-200 text-xs">{item.date} {lang === 'ar' ? 'في' : 'at'} {item.time}</p>
                                  <p className="text-[10px] text-slate-400">{lt.pickupLabel || "Pickup"}: {item.pickupLocation}</p>
                                </div>
                              </div>
                              <div className="text-right font-mono font-bold">
                                <p className="text-xs text-slate-700 dark:text-zinc-200">€{item.price}</p>
                                <p className="text-[9px] text-slate-400">{item.duration}h {lang === 'ar' ? 'ساعة' : lt.durationLabel || "hrs"}</p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* 3. Extra additions inputs */}
                <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-900 space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
                    <PlusCircle className="h-3.5 w-3.5" />
                    {lang === 'ar' ? 'إضافة رسوم أو خدمات مخصصة (اختياري):' : 'Add custom charge adjustments (optional):'}
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="col-span-2">
                      <label className="text-slate-450 block mb-0.5">{lang === 'ar' ? 'بيان الخدمة' : 'Description'}</label>
                      <input
                        type="text"
                        placeholder="e.g. Al-Andalos Theory Book & Practice Portal"
                        value={customAdjustmentLabel}
                        onChange={(e) => setCustomAdjustmentLabel(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-slate-450 block mb-0.5">{lang === 'ar' ? 'السعر (€)' : 'Price (€)'}</label>
                      <input
                        type="number"
                        placeholder="e.g. 45"
                        value={customAdjustmentPrice}
                        onChange={(e) => setCustomAdjustmentPrice(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {lang === 'ar' ? 'إصدار وإرسال الفاتورة الرسمية للمتدرب' : 'Compile & Send Tax Invoice'}
                </button>
              </form>

              {/* Live Preview Panel Right Side */}
              <div className="lg:col-span-5 space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block pl-1">
                  {lang === 'ar' ? 'معاينة حية للفاتورة الضريبية:' : 'Live invoice receipt preview:'}
                </span>

                <div className="p-5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl relative shadow-sm text-xs font-medium space-y-4">
                  
                  {/* Watermark logo */}
                  <div className="absolute top-2 right-2 opacity-10 rotate-12 select-none font-black text-[28px] text-blue-600 hidden dark:block">
                    AL-ANDALUS
                  </div>

                  {/* Receipt Header */}
                  <div className="flex justify-between items-start pb-3 border-b border-slate-200 dark:border-zinc-800">
                    <div className="space-y-0.5">
                      <h4 className="font-mono text-xs font-black tracking-tighter text-slate-800 dark:text-white uppercase">
                        Al-Andalus Auto
                      </h4>
                      <p className="text-[9px] text-slate-400">{lang === 'ar' ? 'أمستردام سلوترديك' : 'Amsterdam Sloterdijk'}</p>
                      <p className="text-[9px] text-slate-400 font-mono">KvK: {lang === 'ar' ? 'قيد التهيئة' : lang === 'nl' ? 'Nog te configureren' : 'To be configured'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">{draftInvoiceId}</p>
                      <p className="text-[9.5px] text-slate-400 font-mono font-bold">{new Date().toISOString().split('T')[0]}</p>
                    </div>
                  </div>

                  {/* School & Trainer Information */}
                  <div className="grid grid-cols-2 gap-2 text-[9px] pb-2 border-b border-slate-200 dark:border-zinc-800 text-slate-400">
                    <div>
                      <span className="font-bold block text-slate-500 dark:text-zinc-350">{lang === 'ar' ? 'المدرسة:' : 'School:'}</span>
                      <p>Al-Andalus Auto</p>
                      <p>Amsterdam, NL</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold block text-slate-500 dark:text-zinc-350">{lang === 'ar' ? 'المدرب:' : 'Trainer:'}</span>
                      <p>Samir El-Filali</p>
                      <p>samir@al-andalos.nl</p>
                    </div>
                  </div>

                  {/* Client Info from database */}
                  {(() => {
                    const client = getStudentDbInfo(selectedInvoiceStudent);
                    return (
                      <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-200 dark:border-zinc-800 text-[9.5px] text-slate-550 dark:text-zinc-400">
                        <div>
                          <span className="text-[9px] uppercase tracking-widest text-slate-400 block">{lang === 'ar' ? 'العميل المستلم' : 'Recipient Client'}</span>
                          <p className="font-bold text-slate-800 dark:text-zinc-200 text-xs">{client.name}</p>
                          <p>{client.email}</p>
                          <p>{client.phone}</p>
                        </div>
                        <div className="text-right self-end">
                          <p><span className="text-slate-400">{lang === 'ar' ? 'المدينة:' : 'City:'}</span> {client.city}</p>
                          <p><span className="text-slate-400 font-mono">{lang === 'ar' ? 'الباقة:' : 'Package:'}</span> {client.package}</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Items list table */}
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 block">{lang === 'ar' ? 'العناصر والخدمات المدرجة' : 'Billed driving components'}</span>
                    
                    {selectedInvoiceLessonIds.length === 0 && !customAdjustmentPrice ? (
                      <p className="text-[10px] text-slate-400 italic text-center py-2">
                        {lang === 'ar' ? '(لا توجد عناصر مختارة حالياً)' : '(No invoiced items selected)'}
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
                        
                        {/* Completed lessons selected */}
                        {lessons
                          .filter(l => selectedInvoiceLessonIds.includes(l.id))
                          .map((l, index) => (
                            <div key={l.id} className="flex justify-between text-[11px] text-slate-650 dark:text-zinc-350">
                              <span>
                                {index + 1}. {lang === 'ar' ? 'درس قيادة عملي' : 'Practical road slot'} 
                                <span className="text-[10px] font-mono font-bold block ml-3">{l.date} - {l.time} ({l.pickupLocation})</span>
                              </span>
                              <span className="font-mono font-semibold">€{l.price.toFixed(2)}</span>
                            </div>
                          ))}

                        {/* Custom Adjustment adjustment pricing if set */}
                        {customAdjustmentPrice && (
                          <div className="flex justify-between text-[11.5px] font-bold text-slate-750 dark:text-zinc-300 border-t border-slate-100 dark:border-zinc-900 pt-1.5">
                            <span>
                              ★ {customAdjustmentLabel || (lang === 'ar' ? 'رسوم/إضافات مخصصة' : 'Custom Addition')}
                            </span>
                            <span className="font-mono text-blue-600">€{(parseFloat(customAdjustmentPrice) || 0).toFixed(2)}</span>
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
                      <div className="border-t border-slate-200 dark:border-zinc-800/80 pt-3 space-y-1">
                        <div className="flex justify-between text-slate-500 text-[10.5px]">
                          <span>{lang === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                          <span className="font-mono">€{finalSubtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 text-[10.5px]">
                          <span>
                            {lang === 'ar' 
                              ? `ضريبة القيمة المضافة (BTW ${selectedVatRate}%):` 
                              : `VAT / BTW (${selectedVatRate}%):`}
                          </span>
                          <span className="font-mono">€{vatAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-extrabold text-slate-805 dark:text-white text-xs pt-1">
                          <span>{lang === 'ar' ? 'الإجمالي النهائي المطلوب:' : 'Total Amount Due:'}</span>
                          <span className="font-mono text-blue-600">€{grandTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Payment Info inside preview */}
                  <div className="grid grid-cols-2 gap-2 text-[9.5px] border-t border-slate-200 dark:border-zinc-800 pt-2 text-slate-550 dark:text-zinc-400">
                    <div>
                      <span className="text-slate-400 block text-[9px]">{lang === 'ar' ? 'طريقة السداد:' : 'Payment Method:'}</span>
                      <span className="font-bold text-slate-750 dark:text-zinc-300">
                        {invoicePaymentMethod === 'wallet' && (lang === 'ar' ? 'المحفظة الرقمية' : 'Digital Wallet')}
                        {invoicePaymentMethod === 'cash' && (lang === 'ar' ? 'نقداً (كاش)' : 'Cash')}
                        {invoicePaymentMethod === 'transfer' && (lang === 'ar' ? 'تحويل iDEAL' : 'Bank Transfer')}
                        {invoicePaymentMethod === 'card' && (lang === 'ar' ? 'بطاقة الائتمان' : 'Credit Card')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[9px]">{lang === 'ar' ? 'حالة السداد:' : 'Payment Status:'}</span>
                      <span className={`font-black uppercase inline-block px-1.5 py-0.5 rounded text-[8px] ${
                        invoicePaymentStatus === 'paid' 
                          ? 'bg-emerald-500/15 text-emerald-600' 
                          : 'bg-rose-500/15 text-rose-600'
                      }`}>
                        {invoicePaymentStatus === 'paid' ? (lang === 'ar' ? 'مدفوعة' : 'PAID') : (lang === 'ar' ? 'غير مدفوعة' : 'UNPAID')}
                      </span>
                    </div>
                  </div>

                  {/* Footnote notes */}
                  <div className="border-t border-dashed border-slate-200 dark:border-zinc-800 pt-3 text-center text-[9px] text-slate-450 dark:text-zinc-500">
                    <p>{lang === 'ar' ? 'مدرسة الأندلس لتعليم القيادة © 2026' : 'Al-Andalus Driving School © 2026'}</p>
                    <p className="mt-0.5">{lang === 'ar' ? 'نشكر ثقتكم بنا دائمًا!' : 'Thank you for choosing Al-Andalus!'}</p>
                  </div>

                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div id="trainer-reports-view" className="space-y-6 animate-in fade-in duration-300">
          
          {reportSuccessToast && (
            <div className="p-4 bg-emerald-600 border border-emerald-500 text-white rounded-2xl flex items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 stroke-[3]" />
                <span className="text-xs font-bold">
                  {lang === 'ar' 
                    ? 'تم تسجيل وإرسال تقرير التقييم الفني للمتدرب بنظام الإشعار الفوري وعبر البريد الإلكتروني!' 
                    : 'Performance assessment evaluation compiled and dispatched successfully via email portal!'}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-white/20 rounded-md font-bold text-white uppercase tracking-widest">Sent On-Demand</span>
            </div>
          )}

          <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl space-y-4">
            <div className="flex items-start gap-2.5 pb-2 border-b border-slate-100 dark:border-zinc-800">
              <div className="p-1 px-2.5 rounded-lg bg-indigo-500/10 font-mono text-[10px] uppercase font-bold text-indigo-500">
                {lang === 'ar' ? 'بوابة التقارير والأداء' : 'Assessment Hub'}
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-white text-base">
                  {lt.reportsTitle}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'ar' 
                    ? 'إعداد ملفات تطور مستويات المتدربين واعتمادات جاهزيتهم للاختبارات الرسمية وإرسالها بناء على الطلب.'
                    : 'Evaluate driving indicators, write professional feedback and dispatch assessments on demand.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Form Config Left Panel */}
              <div className="lg:col-span-7 space-y-5">
                
                {/* Select Student for Report */}
                <div className="space-y-1.5 text-xs font-semibold">
                  <label className="text-slate-450 block">{lang === 'ar' ? "اختر المتدرب:" : "Select Student:"}</label>
                  <select
                    value={selectedReportStudent}
                    onChange={(e) => {
                      setSelectedReportStudent(e.target.value);
                    }}
                    className="w-full p-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-800 rounded-xl dark:text-white text-xs font-medium"
                  >
                    {studentsList.map(s => (
                      <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Driving Competencies Indicators Buttons Row */}
                <div className="space-y-5 pt-1 bg-slate-50/55 dark:bg-zinc-950/40 p-4 rounded-2xl border border-slate-100 dark:border-zinc-900">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {lang === 'ar' ? 'تقييم كفاءة القيادة التفصيلية (انقر للاختيار السريع):' : 'Detailed Driving Indicators (Tap score to update):'}
                  </h4>

                  {/* Indicator 1: Mechanics */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] font-semibold text-slate-650 dark:text-zinc-350">
                      <span>{lang === 'ar' ? 'التحكم الفني بالمركبة (ثبات، قابض، ومكيف تروس)' : 'Vehicle Operation & Clutch Control'}</span>
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-md font-mono font-bold text-xs">{scoreControl}/10</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setScoreControl(val)}
                          className={`flex-1 min-w-[26px] py-1.5 rounded-lg text-[10.5px] font-bold font-mono transition cursor-pointer border ${
                            scoreControl === val
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-slate-100/60 hover:bg-slate-200/60 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-slate-650 dark:text-zinc-400 border-slate-200 dark:border-zinc-800/80'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Indicator 2: Priority */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] font-semibold text-slate-650 dark:text-zinc-350">
                      <span>{lang === 'ar' ? 'مراقبة الطريق وإعطاء الأولويات (مركبات ومرايا عمياء)' : 'Observer Cycles & Priority Rules'}</span>
                      <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-md font-mono font-bold text-xs">{scorePriority}/10</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setScorePriority(val)}
                          className={`flex-1 min-w-[26px] py-1.5 rounded-lg text-[10.5px] font-bold font-mono transition cursor-pointer border ${
                            scorePriority === val
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-slate-100/60 hover:bg-slate-200/60 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-slate-650 dark:text-zinc-400 border-slate-200 dark:border-zinc-800/80'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Indicator 3: Highways */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] font-semibold text-slate-650 dark:text-zinc-350">
                      <span>{lang === 'ar' ? 'القيادة والاندماج على الطرق السريعة (تجاوز وتوافق مسارات)' : 'Highway Integration & lane overtaking'}</span>
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-md font-mono font-bold text-xs">{scoreHighway}/10</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setScoreHighway(val)}
                          className={`flex-1 min-w-[26px] py-1.5 rounded-lg text-[10.5px] font-bold font-mono transition cursor-pointer border ${
                            scoreHighway === val
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-slate-100/60 hover:bg-slate-200/60 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-slate-650 dark:text-zinc-400 border-slate-200 dark:border-zinc-800/80'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Indicator 4: Maneuvers */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] font-semibold text-slate-650 dark:text-zinc-350">
                      <span>{lang === 'ar' ? 'المناورات الخاصة بالركن والرجوع (الركن، الالتفاف، الانحدار)' : 'Special Maneuvers & Hill Starts'}</span>
                      <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-md font-mono font-bold text-xs">{scoreManeuvers}/10</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setScoreManeuvers(val)}
                          className={`flex-1 min-w-[26px] py-1.5 rounded-lg text-[10.5px] font-bold font-mono transition cursor-pointer border ${
                            scoreManeuvers === val
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-slate-100/60 hover:bg-slate-200/60 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-slate-650 dark:text-zinc-400 border-slate-200 dark:border-zinc-800/80'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Indicator 5: Theory Awareness */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] font-semibold text-slate-650 dark:text-zinc-350">
                      <span>{lang === 'ar' ? 'الوعي بقوانين السير وإشارات المرور وتوقع المخاطر' : 'Traffic Signages & Hazard Awareness'}</span>
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-md font-mono font-bold text-xs">{scoreTheory}/10</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setScoreTheory(val)}
                          className={`flex-1 min-w-[26px] py-1.5 rounded-lg text-[10.5px] font-bold font-mono transition cursor-pointer border ${
                            scoreTheory === val
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-slate-100/60 hover:bg-slate-200/60 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-slate-650 dark:text-zinc-400 border-slate-200 dark:border-zinc-800/80'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Exam Readiness card selector */}
                <div className="space-y-2 text-xs font-semibold">
                  <label className="text-slate-450 block">{lang === 'ar' ? 'الجاهزية للاختبار:' : 'Exam Readiness Status:'}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'beginner', label_en: 'Beginner', label_ar: 'مبتدئ', color: 'red' },
                      { key: 'developing', label_en: 'Developing', label_ar: 'متوسط', color: 'amber' },
                      { key: 'exam_mock', label_en: 'Mock Ready', label_ar: 'اختبار تجريبي', color: 'blue' },
                      { key: 'ready_cbr', label_en: 'Exam Ready (CBR)', label_ar: 'جاهز تماماً (CBR)', color: 'emerald' },
                    ].map(item => {
                      const isSelected = cbrReadiness === item.key;
                      let activeColorClass = "";
                      if (item.color === 'red') activeColorClass = 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-500/30';
                      if (item.color === 'amber') activeColorClass = 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-500/30';
                      if (item.color === 'blue') activeColorClass = 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-500/30';
                      if (item.color === 'emerald') activeColorClass = 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold';

                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setCbrReadiness(item.key)}
                          className={`p-3 rounded-xl border text-center transition cursor-pointer text-xs ${
                            isSelected
                              ? `${activeColorClass} ring-2 ring-blue-500/10`
                              : 'bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-150 dark:border-zinc-800'
                          }`}
                        >
                          <p className="font-bold text-[10.5px]">{lang === 'ar' ? item.label_ar : item.label_en}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Trainer Feedback Comments */}
                <div className="space-y-1.5 text-xs font-semibold">
                  <label className="text-slate-450 block">{lang === 'ar' ? "ملاحظات وتوصيات المدرب (تدرج بالتقرير):" : "Captain Samir's Recommendations & Observations:"}</label>
                  <textarea
                    rows={4}
                    value={reportObservs}
                    onChange={(e) => setReportObservs(e.target.value)}
                    placeholder={lang === 'ar' ? "مثال: أظهر تحكماً ممتازاً بعزم القابض..." : "e.g. Exhibited superb clutch friction management..."}
                    className="w-full p-3 bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-800 rounded-xl dark:text-white text-xs leading-relaxed"
                  />
                  <p className="text-[10px] text-slate-400/80 font-medium">
                    {lang === 'ar'
                      ? "* ستتم كتابة هذه التوصيات في أسفل ملف التقييم النهائي للطالب والملخص المالي."
                      : "* These notes will be appended to the bottom of the student's official PDF report."}
                  </p>
                </div>

                {/* SINGLE PRIMARY ACTION BUTTON */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleViewAndSendReport}
                    disabled={isSendingEmail}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/60 text-white font-extrabold text-sm rounded-xl cursor-pointer shadow-md hover:shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                  >
                    {isSendingEmail ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Award className="h-4 w-4" />
                    )}
                    <span>
                      {isSendingEmail 
                        ? (lang === 'ar' ? 'جاري توليد وإرسال الملف...' : 'Generating & Dispatching Report...') 
                        : (lang === 'ar' ? 'عرض وإرسال تقرير الطالب الموحد' : 'View & Send Student Report')}
                    </span>
                  </button>
                </div>
              </div>

              {/* Assessment Preview Right Side */}
              <div className="lg:col-span-12 xl:col-span-5 space-y-3 lg:w-full">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block pl-1">
                  {lang === 'ar' ? 'معاينة بطاقة تقييم الأداء الميداني للمتدرب:' : 'Live assessment report layout:'}
                </span>

                <div className="p-5 bg-linear-to-b from-slate-900 via-slate-950 to-zinc-950 text-white border border-zinc-800 rounded-2xl relative shadow-md space-y-4">
                  
                  {/* Watermark badge */}
                  <div className="absolute top-4 right-4 text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest font-mono">
                    Al-Andalos Approved
                  </div>

                  {/* Assessment Card Header */}
                  <div>
                    <span className="p-1 px-2.5 rounded-full text-[8.5px] font-bold tracking-wider bg-indigo-600/30 text-indigo-300 border border-indigo-500/10">
                      AL-ANDALUS PERFORMANCE FILE
                    </span>
                    <h4 className="text-sm font-black text-white mt-1.5 flex items-center gap-1">
                      {lang === 'ar' ? 'ملف تقييم القيادة العملي' : 'Driving Performance Log'}
                    </h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">{lang === 'ar' ? 'المدرب: كابتن سمير الفيلالي' : 'Coach: Samir El-Filali'}</p>
                  </div>

                  {/* Aggregated Score block */}
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-zinc-400">{lang === 'ar' ? 'المعدل العام للأداء:' : 'Overall Competency:'}</span>
                      <p className="text-lg font-black text-white flex items-baseline gap-1">
                        {((scoreControl + scorePriority + scoreHighway + scoreManeuvers + scoreTheory) / 5).toFixed(1)} 
                        <span className="text-xs text-zinc-500 font-sans font-medium">/ 10</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-zinc-400 block">{lang === 'ar' ? 'النتيجة والاستحقاق:' : 'Exam Readiness:'}</span>
                      <span className={`text-[10.5px] font-bold px-2.5 py-1 rounded-md block mt-1 uppercase ${
                        cbrReadiness === 'beginner' 
                          ? 'bg-red-500/20 text-red-400' 
                          : cbrReadiness === 'developing' 
                            ? 'bg-amber-500/20 text-amber-400' 
                            : cbrReadiness === 'exam_mock' 
                              ? 'bg-blue-500/20 text-blue-400' 
                              : 'bg-emerald-500/20 text-emerald-400 font-black'
                      }`}>
                        {cbrReadiness === 'beginner' 
                          ? (lang === 'ar' ? 'مبتدئ' : 'Beginner') 
                          : cbrReadiness === 'developing' 
                            ? (lang === 'ar' ? 'متوسط' : 'Developing') 
                            : cbrReadiness === 'exam_mock' 
                              ? (lang === 'ar' ? 'اختبار تجريبي' : 'Mock Eligible') 
                              : (lang === 'ar' ? 'جاهز للامتحان!' : 'Exam Ready!')}
                      </span>
                    </div>
                  </div>

                  {/* Skills Mini Chart bars list */}
                  <div className="space-y-2 text-[11px] font-medium text-zinc-300">
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span>{lang === 'ar' ? 'الميكانيكا وعزم القابض' : 'Mechanics Control'}</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${scoreControl * 10}%` }}></div>
                        </div>
                        <span className="font-bold text-white">{scoreControl}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10.5px]">
                      <span>{lang === 'ar' ? 'المراقبة وإعطاء الأولوية (الأولويات)' : 'Priority Observation'}</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${scorePriority * 10}%` }}></div>
                        </div>
                        <span className="font-bold text-white">{scorePriority}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10.5px]">
                      <span>{lang === 'ar' ? 'توافق الطرق والسرعة' : 'Highway Confidence'}</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${scoreHighway * 10}%` }}></div>
                        </div>
                        <span className="font-bold text-white">{scoreHighway}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10.5px]">
                      <span>{lang === 'ar' ? 'المناورات والاستعداد للركن الموازي' : 'Special Maneuvers'}</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${scoreManeuvers * 10}%` }}></div>
                        </div>
                        <span className="font-bold text-white">{scoreManeuvers}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10.5px]">
                      <span>{lang === 'ar' ? 'الوعي بقوانين السير وقواعد المرور' : 'Regulations Awareness'}</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${scoreTheory * 10}%` }}></div>
                        </div>
                        <span className="font-bold text-white">{scoreTheory}</span>
                      </div>
                    </div>
                  </div>

                  {/* Comments Preview text Block */}
                  <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-zinc-400 block">{lang === 'ar' ? 'التقرير الفني للمدرب:' : 'Instructor Evaluation Dossier:'}</span>
                    <p className="text-[10px] text-zinc-350 leading-relaxed font-sans">{reportObservs || '...'}</p>
                  </div>

                  {/* Card Stamp */}
                  <div className="border-t border-zinc-800/80 pt-3 flex justify-between items-center text-[9px] text-zinc-400 font-mono">
                    <p>{selectedReportStudent}</p>
                    <p className="font-black italic text-zinc-300 uppercase">{lang === 'ar' ? 'بوابة كابتن سمير الفيلالي' : 'Samir EP-14 Approved'}</p>
                  </div>

                </div>

              </div>

            </div>
          </div>

          {/* Historical Logs Archive Grid */}
          <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl space-y-4">
            
            {/* Header with Filter and Sync */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-indigo-500 animate-pulse" />
                <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                  {lang === 'ar' ? 'سجل تقارير تقييم الطلاب:' : 'Historical Sent Assessments Logs:'}
                </h4>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Filter Selector */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 font-medium">{lang === 'ar' ? "تصفية حسب المتدرب:" : "Filter Student:"}</span>
                  <select
                    value={historyFilterStudent}
                    onChange={(e) => setHistoryFilterStudent(e.target.value)}
                    className="p-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg dark:text-white text-xs font-semibold"
                  >
                    <option value="all">{lang === 'ar' ? "كل المتدربين" : "All Students"}</option>
                    {studentsList.map(s => (
                      <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Sheets Sync Button */}
                <button
                  onClick={handleSyncToSheets}
                  disabled={isSyncingSheets}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isSyncingSheets 
                      ? 'bg-zinc-100 dark:bg-zinc-850 text-zinc-400' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                  }`}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`} />
                  {isSyncingSheets 
                    ? (lang === 'ar' ? "جاري المزامنة..." : "Syncing to Sheets...") 
                    : (lang === 'ar' ? "مزامنة مع Google Sheets" : "Sync with Google Sheets")}
                </button>
              </div>
            </div>

            {/* Sync success toast inline */}
            {syncSuccessToast && (
              <div className="p-3.5 bg-emerald-600 border border-emerald-500 text-white rounded-xl flex items-center justify-between gap-4 animate-in fade-in duration-300">
                <div className="flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 stroke-[3]" />
                  <span className="text-xs font-bold">
                    {lang === 'ar' 
                      ? 'تم بنجاح مزامنة جميع تقارير التقييمات المعلقة مع مستندات Google Sheets!' 
                      : 'Successfully exported and synchronized all pending evaluations to Google Sheets!'}
                  </span>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 bg-white/20 rounded font-bold text-white uppercase tracking-widest">Synced</span>
              </div>
            )}

            {/* Evaluations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
              {[...assessments]
                .filter(a => historyFilterStudent === 'all' || studentNamesMatch(a.studentName, historyFilterStudent))
                .sort((a, b) => {
                  const dateTimeA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
                  const dateTimeB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
                  return dateTimeB - dateTimeA;
                })
                .length === 0 ? (
                  <div className="col-span-full py-12 text-center text-slate-400 dark:text-zinc-500 italic">
                    {lang === 'ar' ? 'لا توجد تقارير تقييم مسجلة لهذا الطالب.' : 'No evaluation history recorded for this student.'}
                  </div>
                ) : (
                  [...assessments]
                    .filter(a => historyFilterStudent === 'all' || studentNamesMatch(a.studentName, historyFilterStudent))
                    .sort((a, b) => {
                      const dateTimeA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
                      const dateTimeB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
                      return dateTimeB - dateTimeA;
                    })
                    .map((rep) => (
                      <div key={rep.id} className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl w-full space-y-3 shadow-xs relative overflow-hidden">
                        
                        {/* Sheets Sync status indicator */}
                        <div className="absolute top-4 right-4 flex items-center gap-1.5">
                          <span className={`p-1 px-2 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                            rep.status === 'synced' 
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10' 
                              : 'bg-amber-500/10 text-amber-500 border border-amber-500/10'
                          }`}>
                            {rep.status === 'synced' 
                              ? (lang === 'ar' ? 'مزامَن' : 'Synced') 
                              : (lang === 'ar' ? 'معلّق' : 'Pending')}
                          </span>
                        </div>

                        <div className="flex justify-between items-start pr-16">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 text-[8.5px] font-bold font-mono">
                                {rep.id}
                              </span>
                              {rep.lessonId && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[8.5px] font-bold">
                                  {lang === 'ar' ? `درس #${rep.lessonId.replace('lesson-', '').substring(0, 4)}` : `Lesson #${rep.lessonId.replace('lesson-', '').substring(0, 4)}`}
                                </span>
                              )}
                            </div>
                            <h5 className="font-extrabold text-slate-800 dark:text-zinc-200 mt-1">{rep.studentName}</h5>
                            <p className="text-[9.5px] text-slate-400 mt-0.5">
                              {lang === 'ar' ? `بواسطة: ${rep.trainerName}` : `Trainer: ${rep.trainerName}`}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <span className="font-mono text-xs font-black text-rose-500 bg-rose-500/10 border border-rose-500/10 rounded-md p-1 px-1.5 leading-none block">
                              {rep.overallScore} / 10
                            </span>
                            <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded block mt-1 uppercase text-center ${
                              rep.cbrReadiness === 'beginner' 
                                ? 'bg-red-500/10 text-red-500' 
                                : rep.cbrReadiness === 'developing' 
                                  ? 'bg-amber-500/10 text-amber-500' 
                                  : rep.cbrReadiness === 'exam_mock' 
                                    ? 'bg-blue-500/10 text-blue-500' 
                                    : 'bg-emerald-500/10 text-emerald-500 font-black'
                            }`}>
                              {rep.cbrReadiness === 'beginner' 
                                ? (lang === 'ar' ? 'مبتدئ' : 'Beginner') 
                                : rep.cbrReadiness === 'developing' 
                                  ? (lang === 'ar' ? 'متوسط' : 'Developing') 
                                  : rep.cbrReadiness === 'exam_mock' 
                                    ? (lang === 'ar' ? 'اختبار تجريبي' : 'Mock Eligible') 
                                    : (lang === 'ar' ? 'جاهز للامتحان!' : 'Exam Ready!')}
                            </span>
                          </div>
                        </div>

                        {/* Individual skills list inside each card */}
                        <div className="grid grid-cols-5 gap-1 p-1.5 bg-slate-100/40 dark:bg-zinc-900/40 rounded-xl border border-slate-200/30 dark:border-zinc-800/40 text-center text-[8px]">
                          <div>
                            <span className="text-slate-400 block truncate">{lang === 'ar' ? 'التحكم' : 'Control'}</span>
                            <span className="font-extrabold text-slate-700 dark:text-zinc-200 font-mono text-[9.5px]">{rep.scores?.control ?? 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block truncate">{lang === 'ar' ? 'المراقبة' : 'Priority'}</span>
                            <span className="font-extrabold text-slate-700 dark:text-zinc-200 font-mono text-[9.5px]">{rep.scores?.priority ?? 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block truncate">{lang === 'ar' ? 'السريع' : 'Highway'}</span>
                            <span className="font-extrabold text-slate-700 dark:text-zinc-200 font-mono text-[9.5px]">{rep.scores?.highway ?? 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block truncate">{lang === 'ar' ? 'المناورات' : 'Maneuver'}</span>
                            <span className="font-extrabold text-slate-700 dark:text-zinc-200 font-mono text-[9.5px]">{rep.scores?.maneuvers ?? 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block truncate">{lang === 'ar' ? 'قوانين' : 'Theory'}</span>
                            <span className="font-extrabold text-slate-700 dark:text-zinc-200 font-mono text-[9.5px]">{rep.scores?.theory ?? 'N/A'}</span>
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 italic line-clamp-3 leading-relaxed bg-white dark:bg-zinc-900/40 p-2 rounded-lg border border-slate-100 dark:border-zinc-900/65">
                          "{rep.notes || (lang === 'ar' ? 'لا توجد تعليقات فنية.' : 'No comments logged.')}"
                        </p>

                        <div className="flex gap-2 pt-2 border-t border-slate-200/55 dark:border-zinc-850 items-center justify-between text-[10px] text-slate-400">
                          <span className="font-mono">{rep.date} {rep.time ? `@ ${rep.time}` : ''}</span>
                          <button
                            onClick={() => {
                              alert(lang === 'ar' ? `جاري تنزيل التقرير المعتمد للمتدرب ${rep.studentName} بصيغة PDF` : `Re-downloading assessment file for ${rep.studentName}...`);
                            }}
                            className="text-indigo-500 hover:underline cursor-pointer transition flex items-center gap-1 font-bold"
                          >
                            <Download className="h-3 w-3" />
                            {lang === 'ar' ? 'تحميل PDF' : 'Download PDF'}
                          </button>
                        </div>
                      </div>
                    ))
                )}
            </div>
          </div>

        </div>
      )}

      {activeTab === 'schedule' && (
        <div id="trainer-schedule-view" className="space-y-6">
          
          {/* Main settings card with high design quality */}
          <div className="p-6 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/85 rounded-3xl shadow-md space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800/80">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-xl">
                    <Settings className="h-5 w-5" />
                  </div>
                  <h3 className="font-extrabold text-slate-800 dark:text-white text-base">
                    {lt.workingScheduleSettings}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1 pl-1">
                  {lt.scheduleDesc}
                </p>
              </div>

              <span className="text-[10px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold bg-amber-500/10 text-amber-500 border border-amber-500/10 self-start md:self-auto">
                <Sparkles className="h-3 w-3" />
                {lang === 'ar' ? 'حفظ تلقائي للمخطط' : 'Verified Rota Rules'}
              </span>
            </div>

            <div className="space-y-6 text-xs font-medium">
              
              {/* Days active checkboxes */}
              <div className="space-y-2.5">
                <label className="text-slate-400 dark:text-zinc-400 font-extrabold uppercase tracking-wider block flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
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
                        onClick={() => toggleWorkingDay(day)}
                        className={`p-3 rounded-2xl border text-center font-bold flex flex-col justify-between items-center transition-all duration-200 cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10'
                            : 'bg-slate-50 dark:bg-zinc-950 border-slate-150 dark:border-zinc-800/60 text-slate-500 hover:border-slate-350 dark:hover:border-zinc-700'
                        }`}
                      >
                        <span className="text-xs">{localizedDayName}</span>
                        <div className="mt-2.5">
                          {isActive ? (
                            <span className="p-1 rounded-full bg-white/20 text-white block">
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="h-5 w-5 rounded-full border border-dashed border-slate-300 dark:border-zinc-800 block" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hours range inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 block space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <label className="text-slate-700 dark:text-zinc-200 font-extrabold">{lt.startHrs}</label>
                  </div>
                  <input
                    type="time"
                    value={schedule.startTime}
                    onChange={(e) => setSchedule({ ...schedule, startTime: e.target.value })}
                    className="w-full p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl font-bold dark:text-white text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-400 font-medium">
                    {lang === 'ar' ? 'ساعة بداية استقبال طلبات حجز المتدربين' : 'Earliest slot available for scheduling.'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 block space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-indigo-500" />
                    <label className="text-slate-700 dark:text-zinc-200 font-extrabold">{lt.endHrs}</label>
                  </div>
                  <input
                    type="time"
                    value={schedule.endTime}
                    onChange={(e) => setSchedule({ ...schedule, endTime: e.target.value })}
                    className="w-full p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl font-bold dark:text-white text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-400 font-medium">
                    {lang === 'ar' ? 'ساعة انتهاء العمل ونهاية الدروس العملية' : 'Latest slot available for training flights.'}
                  </p>
                </div>
              </div>

              {/* Custom rates per hour */}
              <div className="p-5 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <Coins className="h-4 w-4 text-amber-500" />
                    <label className="text-slate-700 dark:text-zinc-200 font-semibold text-xs">{lt.hourlyRate}</label>
                  </div>
                  
                  {/* Presets badges */}
                  <div className="flex gap-1.5">
                    {[55, 65, 75].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setSchedule({ ...schedule, lessonPricePerHour: preset })}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition ${
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

                <div className="relative max-w-sm">
                  <span className="absolute left-3.5 top-3.5 font-bold font-mono text-slate-400">€</span>
                  <input
                    type="number"
                    value={schedule.lessonPricePerHour}
                    onChange={(e) => setSchedule({ ...schedule, lessonPricePerHour: parseFloat(e.target.value) || 65 })}
                    className="w-full pl-8 pr-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl font-bold dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden text-xs"
                  />
                </div>
              </div>

              {/* Persist button */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    alert(lt.rotaPersistedAlert);
                  }}
                  className="w-full sm:w-auto py-3.5 px-8 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {lt.persistRota}
                </button>
              </div>

            </div>
          </div>

          {/* Visual card for booking preview */}
          <div className="p-5 bg-slate-100/60 dark:bg-zinc-950/40 border border-dashed border-slate-200 dark:border-zinc-800/80 rounded-3xl space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-slate-700 dark:text-zinc-300 text-xs">
                  {lt.previewTitle}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {lt.previewDesc}
                </p>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900/60 rounded-2xl border border-slate-100 dark:border-zinc-800/65 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <p className="font-bold text-slate-750 dark:text-zinc-200">{lang === 'ar' ? 'أوقات العمل المتاحة للحجز' : 'Active Schedule Summary'}</p>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {schedule.workingDays.length > 0 
                    ? schedule.workingDays.map(d => DAY_NAMES[lang][DAY_KEYS.indexOf(d)]).join(', ')
                    : (lang === 'ar' ? 'جاهزية الفترات معطلة بالكامل' : 'No working days configured')}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center font-mono">
                  <p className="text-[10px] text-slate-400 font-sans">{lang === 'ar' ? 'الفترة الزمنية' : 'Hours'}</p>
                  <p className="font-bold text-slate-800 dark:text-zinc-200">{schedule.startTime} - {schedule.endTime}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-400">{lang === 'ar' ? 'سعر الدرس / ساعة' : 'Rate'}</p>
                  <p className="font-bold text-blue-600 font-mono">€{schedule.lessonPricePerHour}/{lang === 'ar' ? 'س' : 'hr'}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Lesson Complete & Payment Flow Modal Overlay */}
      {finishingLessonId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-lg w-full border border-slate-100 dark:border-zinc-800 shadow-2xl space-y-5">
            
            {/* Modal Title */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                {lang === 'ar' ? 'إنهاء الدرس وتعبئة سجل الدرس' : 'Complete Lesson & Record'}
              </h3>
              <button 
                onClick={() => {
                  setFinishingLessonId(null);
                  setCompletionLessonNotes('');
                  setCompletionInstructorNotes('');
                }}
                className="p-1 px-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-800 rounded-lg text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {(() => {
                const currentFinishingLesson = lessons.find(l => l.id === finishingLessonId);
                const hasRoute = currentFinishingLesson?.routePoints && currentFinishingLesson.routePoints.length > 0;
                if (hasRoute) {
                  return (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/35 rounded-2xl flex items-center gap-2.5 text-xs text-blue-700 dark:text-blue-400">
                      <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                      <span>
                        {lang === 'ar' 
                          ? `تم الكشف عن مسار GPS مسجل لهذا الدرس (${currentFinishingLesson?.distanceKm || 0} كم - مدة ${currentFinishingLesson?.elapsedTime || ''}). سيتم ربطه تلقائياً.`
                          : `Recorded GPS route detected for this lesson (${currentFinishingLesson?.distanceKm || 0} km - duration ${currentFinishingLesson?.elapsedTime || ''}). It will be attached automatically.`}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Payment Status: Paid / Unpaid */}
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  {lang === 'ar' ? 'حالة الدفع:' : 'PAYMENT STATUS:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCompletionPayStatus('paid')}
                    className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      completionPayStatus === 'paid'
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-500'
                        : 'bg-slate-50 dark:bg-zinc-800 text-slate-500 border-transparent hover:bg-slate-100'
                    }`}
                  >
                    {lang === 'ar' ? 'مدفوع' : 'Paid'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompletionPayStatus('unpaid')}
                    className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      completionPayStatus === 'unpaid'
                        ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border-rose-500'
                        : 'bg-slate-50 dark:bg-zinc-800 text-slate-500 border-transparent hover:bg-slate-100'
                    }`}
                  >
                    {lang === 'ar' ? 'غير مدفوع' : 'Unpaid'}
                  </button>
                </div>
              </div>

              {/* Payment Method (if status is Paid) */}
              {completionPayStatus === 'paid' && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="block text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    {lang === 'ar' ? 'طريقة الدفع:' : 'PAYMENT METHOD:'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCompletionPayMethod('wallet')}
                      className={`p-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        completionPayMethod === 'wallet'
                          ? 'bg-indigo-50 dark:bg-zinc-850 text-indigo-600 dark:text-indigo-450 border-indigo-500'
                          : 'bg-slate-50 dark:bg-zinc-800/40 text-slate-600 dark:text-zinc-400 border-transparent hover:bg-slate-100'
                      }`}
                    >
                      {lang === 'ar' ? 'المحفظة' : 'Wallet Payment'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompletionPayMethod('cash')}
                      className={`p-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        completionPayMethod === 'cash'
                          ? 'bg-amber-50 dark:bg-zinc-850 text-amber-600 dark:text-amber-450 border-amber-500'
                          : 'bg-slate-50 dark:bg-zinc-800/40 text-slate-600 dark:text-zinc-400 border-transparent hover:bg-slate-100'
                      }`}
                    >
                      {lang === 'ar' ? 'كاش' : 'Cash'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompletionPayMethod('transfer')}
                      className={`p-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        completionPayMethod === 'transfer'
                          ? 'bg-blue-50 dark:bg-zinc-850 text-blue-600 dark:text-blue-450 border-blue-500'
                          : 'bg-slate-50 dark:bg-zinc-800/40 text-slate-600 dark:text-zinc-400 border-transparent hover:bg-slate-100'
                      }`}
                    >
                      {lang === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompletionPayMethod('card')}
                      className={`p-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        completionPayMethod === 'card'
                          ? 'bg-emerald-50 dark:bg-zinc-850 text-emerald-600 dark:text-emerald-450 border-emerald-500'
                          : 'bg-slate-50 dark:bg-zinc-800/40 text-slate-600 dark:text-zinc-400 border-transparent hover:bg-slate-100'
                      }`}
                    >
                      {lang === 'ar' ? 'بطاقة' : 'Card'}
                    </button>
                  </div>
                </div>
              )}

              {/* Lesson Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  {lang === 'ar' ? 'ملاحظات الدرس (مواضيع التدريب):' : 'LESSON NOTES (TRAINING TOPICS):'}
                </label>
                <textarea
                  value={completionLessonNotes}
                  onChange={(e) => setCompletionLessonNotes(e.target.value)}
                  placeholder={lang === 'ar' ? 'أمثلة: ركن السيارة، التحكم بالمنعطفات، إلخ...' : 'e.g., Roundabouts, parallel parking, highway entry...'}
                  className="w-full p-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 h-16 resize-none"
                />
              </div>

              {/* Instructor Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  {lang === 'ar' ? 'ملاحظات المعلم (نصائح للمتدرب):' : 'INSTRUCTOR NOTES (FEEDBACK FOR STUDENT):'}
                </label>
                <textarea
                  value={completionInstructorNotes}
                  onChange={(e) => setCompletionInstructorNotes(e.target.value)}
                  placeholder={lang === 'ar' ? 'أمثلة: حافظ على مسافة الأمان، تحسين تبديل السرعات...' : 'e.g., Pay more attention to the right side priority, smooth braking...'}
                  className="w-full p-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 h-16 resize-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setFinishingLessonId(null);
                  setCompletionLessonNotes('');
                  setCompletionInstructorNotes('');
                }}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-750 text-slate-600 dark:text-zinc-300 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  // Save Notes combined or separately
                  const combinedNotes = [
                    completionLessonNotes ? `${lang === 'ar' ? 'مواضيع الدرس:' : 'Lesson Topics:'} ${completionLessonNotes}` : '',
                    completionInstructorNotes ? `${lang === 'ar' ? 'ملاحظات المعلم:' : 'Instructor Feedback:'} ${completionInstructorNotes}` : ''
                  ].filter(Boolean).join(' | ');

                  handleMarkCompleted(
                    finishingLessonId,
                    completionPayStatus,
                    completionPayStatus === 'paid' ? completionPayMethod : null,
                    combinedNotes,
                    undefined,
                    undefined,
                    undefined,
                    completionLessonNotes,
                    completionInstructorNotes
                  );

                  // Reset inputs
                  setCompletionLessonNotes('');
                  setCompletionInstructorNotes('');
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
              >
                {lang === 'ar' ? 'إكمال الدرس وتسجيله' : 'Complete Lesson'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Payment Reminder Customizer Modal Overlay */}
      {reminderModalLessonId && (
        (() => {
          const reminderTarget = lessons.find(l => l.id === reminderModalLessonId);
          if (!reminderTarget) return null;
          
          return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in text-slate-800 dark:text-zinc-100">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-2xl w-full border border-slate-100 dark:border-zinc-800 shadow-2xl space-y-5 my-8">
                
                {/* Modal Title */}
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-xl">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-850 dark:text-white text-base">
                        {lang === 'ar' ? 'إرسال تذكير وإشعار بالدفع المستحق' : lang === 'nl' ? 'Stuur Betalingsherinnering via E-mail' : 'Send Payment Reminder via Email'}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {lang === 'ar' ? 'مدرسة الأندلس لتعليم قيادة السيارات بأسلوب راقٍ' : lang === 'nl' ? 'Luxe rijlessen bij Al-Andalus' : 'Premium driving instruction Al-Andalus'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setReminderModalLessonId(null);
                    }}
                    className="p-1 px-2.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition text-sm font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Info summary */}
                <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-400 font-bold uppercase text-[9px]">{lang === 'ar' ? 'اسم المتدرب' : lang === 'nl' ? 'Student Naam' : 'Student Name'}</p>
                      <p className="font-black text-slate-700 dark:text-zinc-200">{reminderTarget.studentName}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase text-[9px]">{lang === 'ar' ? 'المبلغ المستحق' : lang === 'nl' ? 'Openstaand Bedrag' : 'Outstanding Price'}</p>
                      <p className="font-black text-rose-500 font-mono text-sm">€{reminderTarget.price}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase text-[9px]">{lang === 'ar' ? 'تاريخ وتوقيت الدرس' : lang === 'nl' ? 'Rijles Datum' : 'Lesson Date/Time'}</p>
                      <p className="font-bold text-slate-600 dark:text-zinc-300 font-mono">{reminderTarget.date} ({reminderTarget.time})</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase text-[9px]">{lang === 'ar' ? 'عنوان ونقطة الإلتقاء' : lang === 'nl' ? 'Ophaallocatie' : 'Pickup Address'}</p>
                      <p className="font-bold text-slate-600 dark:text-zinc-300 truncate">{reminderTarget.pickupLocation}</p>
                    </div>
                  </div>
                </div>

                {/* Form Elements */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-zinc-300 flex items-center gap-1">
                      <span>🔗</span>
                      {lang === 'ar' ? 'رابط الدفع الإلكتروني المخصص (iDEAL / بطاقة الدفع):' : lang === 'nl' ? 'Beveiligde iDEAL Betaallink:' : 'Secure iDEAL Payment Link:'}
                    </label>
                    <input
                      type="text"
                      value={reminderPaymentLink}
                      onChange={(e) => setReminderPaymentLink(e.target.value)}
                      placeholder="https://..."
                      className="w-full p-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono font-bold dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-zinc-300 flex items-center gap-1">
                      <span>✍️</span>
                      {lang === 'ar' ? 'أضف ملاحظة أو رسالة مخصصة قبل الإرسال:' : lang === 'nl' ? 'Persoonlijke opmerking toevoegen:' : 'Add a custom note or payment message:'}
                    </label>
                    <textarea
                      rows={2}
                      value={reminderCustomNotes}
                      onChange={(e) => setReminderCustomNotes(e.target.value)}
                      placeholder={lang === 'ar' ? 'اكتب ملاحظتك للمتدرب هنا...' : 'Write your comment here...'}
                      className="w-full p-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs dark:text-white leading-relaxed resize-none"
                    />
                  </div>
                </div>

                {/* Beautiful Official Email Preview Box */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-zinc-400 block pb-1 flex items-center gap-1">
                    <span>👁️</span>
                    {lang === 'ar' ? 'معاينة التصميم الراقي للبريد الإلكتروني ومحتوى الرسالة:' : lang === 'nl' ? 'Live E-mail Voorbeeld (Luxe layout):' : 'Live Official Email Preview (Premium layout):'}
                  </span>

                  <div className="border border-slate-200 dark:border-zinc-850 rounded-2xl overflow-hidden bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-slate-100 max-h-60 overflow-y-auto">
                    {/* Email Headers */}
                    <div className="p-3 bg-slate-100/75 dark:bg-zinc-900 border-b border-slate-200/50 dark:border-zinc-800 text-[11px] space-y-1 text-slate-450 dark:text-zinc-400 font-medium">
                      <p><span className="font-bold">{lang === 'ar' ? 'من:' : 'From:'}</span> <span className="text-indigo-600 dark:text-indigo-400 font-bold">billing@rijschool-andalus.nl</span> ({lang === 'ar' ? 'إرسال آلي وتوثيق مالي' : 'Automated Billing Portal'})</p>
                      <p><span className="font-bold">{lang === 'ar' ? 'إلى:' : 'To:'}</span> <span className="font-bold text-slate-650 dark:text-zinc-300">{reminderTarget.studentName}</span></p>
                      <p className="font-bold"><span className="font-bold">{lang === 'ar' ? 'العنوان:' : 'Subject:'}</span> 🔔 {lang === 'ar' ? `تذكير هام بدفع مستحقات درس القيادة المنتهي - مدرسة الأندلس لتعليم القيادة` : lang === 'nl' ? `Belangrijke Herinnering: Rijles openstaande betaling - Al-Andalus` : `Important Reminder: Settle Driving Lesson Payment - Al-Andalus Driving School`}</p>
                    </div>

                    {/* Email Content Canvas */}
                    <div className="p-5 bg-white dark:bg-zinc-900 mx-auto max-w-xl my-4 rounded-xl shadow-xs border border-slate-100 dark:border-zinc-850 space-y-4">
                      {/* Brand Logo/Header */}
                      <div className="flex items-center justify-between border-b border-amber-500/10 pb-3" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                        <div className="flex items-center gap-2">
                          <span className="p-1 px-2.5 bg-gradient-to-tr from-amber-500 to-indigo-600 text-white rounded-lg text-sm font-black tracking-widest shadow-xs">A</span>
                          <div>
                            <p className="text-xs font-black tracking-tight text-slate-850 dark:text-white uppercase">
                              {lang === 'ar' ? 'مدرسة الأندلس' : 'Al-Andalus'}
                            </p>
                            <p className="text-[9px] text-slate-400 font-mono">
                              {lang === 'ar' ? 'بوابة المعالجة المالية الفورية' : 'E-billing & Secure Rota Escrow'}
                            </p>
                          </div>
                        </div>
                        <span className="text-[9px] bg-amber-500/15 text-amber-600 font-bold px-2 py-0.5 rounded-full uppercase">
                          {lang === 'ar' ? 'حسابات القيادة' : 'Lesson Invoice'}
                        </span>
                      </div>

                      {/* Email Body Text */}
                      <div className="space-y-3 text-xs leading-relaxed" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                        <h4 className="font-black text-slate-805 dark:text-white text-xs">
                          {lang === 'ar' ? `عزيزنا المتدرب ${reminderTarget.studentName}،` : `Beste ${reminderTarget.studentName},`}
                        </h4>
                        
                        <p className="text-slate-600 dark:text-zinc-300 font-medium">
                          {lang === 'ar' 
                            ? `نذكركم بلطف بوجود مستحقات مالية معلقة لقاء درس القيادة العملي الذي تم إنجازه بنجاح مع الكابتن سمير:`
                            : `Hierbij herinneren we u vriendelijk aan de openstaande betaling voor uw voltooide rijles met rijinstructeur Samir:`}
                        </p>

                        {/* Bill Box */}
                        <div className="p-3 bg-amber-500/5 dark:bg-amber-500/10 border-l-2 border-amber-500 rounded-r-lg space-y-1.5 text-[11px] font-medium text-slate-750 dark:text-zinc-300">
                          <p><span className="font-bold">{lang === 'ar' ? 'تاريخ الدرس:' : 'Datum les:'}</span> {reminderTarget.date}</p>
                          <p><span className="font-bold">{lang === 'ar' ? 'توقيت الدرس:' : 'Tijdstip:'}</span> {reminderTarget.time}</p>
                          <p><span className="font-bold">{lang === 'ar' ? 'مكان اللقاء والتحميل:' : 'Ophaallocatie:'}</span> {reminderTarget.pickupLocation}</p>
                          <p className="text-rose-600 dark:text-rose-450 font-extrabold">{lang === 'ar' ? 'رسوم الدرس:' : 'Bedrag:'} €{reminderTarget.price}</p>
                        </div>

                        {/* Custom comments box */}
                        {reminderCustomNotes.trim() && (
                          <div className="p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-xl space-y-1">
                            <span className="text-[10px] uppercase font-black tracking-wide text-slate-400">
                              {lang === 'ar' ? 'ملاحظة من إدارة مدرسة الأندلس:' : 'Opmerking van rijschool beheerder:'}
                            </span>
                            <p className="italic font-bold text-slate-600 dark:text-zinc-350">
                              "{reminderCustomNotes}"
                            </p>
                          </div>
                        )}

                        <p className="text-slate-500 text-[11px] font-medium leading-relaxed">
                          {lang === 'ar' 
                            ? 'نأمل منكم التكرم بالنقر على خيار الدفع الإلكتروني المرفق لتسوية الفاتورة فورياً عبر بوابة الدفع الآمنة، لضمان استمرارية الحجز التلقائي للحصص وحفظ مكانكم.'
                            : 'Om te betalen kunt u eenvoudig gebruikmaken van de onderstaande iDEAL betaallink. Hiermee wordt uw saldo direct bijgewerkt.'}
                        </p>

                        {/* Settle button inside email */}
                        <div className="text-center py-2 space-y-1">
                          <a
                            href="#"
                            onClick={(e) => e.preventDefault()}
                            className="inline-flex items-center gap-1.5 py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold text-xs shadow-md transition"
                          >
                            {lang === 'ar' ? `سداد رسوم الدرس عبر بوابة الدفع الآمنة (€${reminderTarget.price})` : `Nu Betalen (€${reminderTarget.price})`}
                          </a>
                          {reminderPaymentLink && (
                            <p className="text-[10px] text-zinc-400 font-mono mt-1 w-full truncate max-w-sm mx-auto">{reminderPaymentLink}</p>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 text-[10px] text-slate-400 text-center space-y-1 font-medium">
                          <p className="font-bold text-slate-600 dark:text-zinc-300">
                            {lang === 'ar' ? 'مدرسة الأندلس لتعليم قيادة السيارات بجمهورية هولندا' : 'Al-Andalus Rijschool Nederland'}
                          </p>
                          <p>© 2026 Al-Andalus. All rights reserved.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit action panel */}
                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-between gap-3 text-xs font-bold">
                  <button
                    onClick={() => {
                      setReminderModalLessonId(null);
                    }}
                    className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 rounded-xl text-slate-500 dark:text-zinc-350 cursor-pointer transition"
                  >
                    {lang === 'ar' ? 'إلغاء وتراجع' : 'Annuleren'}
                  </button>

                  <button
                    onClick={() => {
                      // Perform dispatch!
                      const updated = lessons.map(l => {
                        if (l.id === reminderModalLessonId) {
                          return {
                            ...l,
                            reminderSent: true,
                            reminderLink: reminderPaymentLink,
                            reminderNotes: reminderCustomNotes
                          };
                        }
                        return l;
                      });
                      setLessons(updated);

                      // Trigger toast
                      setReminderSuccessToast(true);
                      setTimeout(() => {
                        setReminderSuccessToast(false);
                      }, 4000);

                      // Close modal
                      setReminderModalLessonId(null);
                    }}
                    className="flex-1 max-w-xs py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 rounded-xl shadow-md cursor-pointer transition flex items-center justify-center gap-1.5"
                  >
                    🚀
                    {lang === 'ar' ? 'إرسال تذكير الدفع للمتدرب عبر البريد' : lang === 'nl' ? 'Herinnering Versturen' : 'Dispatch Email Reminder'}
                  </button>
                </div>

              </div>
            </div>
          );
        })()
      )}

      {/* Redesigned Premium Invoice Receipt Dialog */}
      {latestBillReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-zinc-800 animate-scaleUp">
            
            {/* Header Badge */}
            <div className="bg-slate-900 text-white p-5 text-center relative border-b-4 border-amber-500">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 block mb-1">
                {lang === 'ar' ? 'مدرسة الأندلس لتعليم القيادة' : 'Al-Andalos Driving Academy'}
              </span>
              <h3 className="text-sm font-black tracking-wider text-white">TAX INVOICE / فاتورة ضريبية رسمية</h3>
              
              <button
                onClick={() => setLatestBillReceipt(null)}
                className="absolute top-4 right-4 p-1 px-2 text-xs font-bold text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition"
              >
                ✕
              </button>
            </div>

            {/* Content Receipt body */}
            <div className="p-6 space-y-4 text-xs dark:text-zinc-300">
              <div className="flex justify-between items-center bg-slate-50 dark:bg-zinc-900 p-3 rounded-2xl border border-slate-105/50 dark:border-zinc-800">
                <div>
                  <p className="text-[10px] text-slate-450 uppercase">{lang === 'ar' ? 'رقم الفاتورة' : 'Invoice ID'}</p>
                  <p className="font-mono font-black text-slate-800 dark:text-white mt-0.5">{latestBillReceipt.invoiceId}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-450 uppercase">{lang === 'ar' ? 'تاريخ الإصدار' : 'Issue Date'}</p>
                  <p className="font-mono font-bold text-slate-700 dark:text-zinc-300 mt-0.5">{latestBillReceipt.date}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between border-b border-dashed border-slate-100 dark:border-zinc-850 pb-1.5">
                  <span className="text-slate-450 font-medium">{lang === 'ar' ? 'المستلم الكرام:' : 'Bill Recipient:'}</span>
                  <span className="font-black text-slate-800 dark:text-white">{latestBillReceipt.studentName}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-100 dark:border-zinc-850 pb-1.5">
                  <span className="text-slate-450 font-medium">{lang === 'ar' ? 'بريد المتدرب المعتمد:' : 'Recipient Email:'}</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">floggyc77@gmail.com</span>
                </div>
                <div className="space-y-1 py-1">
                  <span className="text-slate-450 font-medium block">{lang === 'ar' ? 'بيان الخدمة والوصف:' : 'Service Details:'}</span>
                  <p className="p-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl font-semibold text-slate-700 dark:text-zinc-300 italic border border-slate-100 dark:border-zinc-850">
                    "{latestBillReceipt.description}"
                  </p>
                </div>
              </div>

              {/* Financial Calculation breakdown */}
              <div className="p-4 bg-amber-50/20 dark:bg-zinc-900/50 rounded-2xl border border-amber-500/10 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-555">{lang === 'ar' ? 'المبلغ قبل الضريبة (Subtotal):' : 'Amount before tax:'}</span>
                  <span className="font-mono font-bold">€{latestBillReceipt.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-amber-600 dark:text-amber-500">
                  <span>{lang === 'ar' ? `ضريبة القيمة المضافة (BTW ${latestBillReceipt.vatRate}%):` : `VAT BTW (${latestBillReceipt.vatRate}%):`}</span>
                  <span className="font-mono font-bold">+€{latestBillReceipt.vatAmount.toFixed(2)}</span>
                </div>
                <div className="h-px bg-slate-100 dark:bg-zinc-800 my-1"></div>
                <div className="flex justify-between text-sm font-black text-slate-800 dark:text-white">
                  <span>{lang === 'ar' ? 'المجموع شامل الضريبة (Totaal Incl.):' : 'Grand Total BTW Incl:'}</span>
                  <span className="font-mono text-base text-blue-600 dark:text-blue-400">€{latestBillReceipt.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Delivery notification feedback */}
              <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <span className="text-lg animate-bounce">📧</span>
                <p className="text-[10px] leading-relaxed font-bold">
                  {lang === 'ar' 
                    ? 'تم إرسال نسخة رسمية منسقة من هذه الفاتورة الضريبية شاملة BTW إلى بريد المتدرب بنجاح!' 
                    : 'A beautifully formatted tax invoice receipt was successfully generated and dispatched to student inbox.'}
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="bg-slate-50 dark:bg-zinc-900 p-4 border-t border-slate-100 dark:border-zinc-800 flex gap-3 text-xs font-bold">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-250 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                {lang === 'ar' ? 'طباعة / حفظ PDF' : 'Print Invoice'}
              </button>
              <button
                onClick={() => setLatestBillReceipt(null)}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition cursor-pointer"
              >
                {lang === 'ar' ? 'إغلاق الفاتورة' : 'Close Invoice'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Al-Andalos Live GPS Lesson Tracking & Replay HUD Overlay */}
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
                        setIsDemoUnlocked(!isDemoUnlocked);
                        setIsDemoMode(!isDemoUnlocked);
                        setHudTitleClicks(0);
                        alert(`Developer Options: Demo Mode ${!isDemoUnlocked ? 'ENABLED (Simulated office route)' : 'DISABLED (Using real GPS location)'}`);
                      } else {
                        setHudTitleClicks(newClicks);
                      }
                    }}
                    className="font-black text-sm md:text-base text-white tracking-wide uppercase flex items-center gap-1.5 select-none cursor-pointer"
                    title="Click 5 times for developer options"
                  >
                    {lang === 'ar' ? 'تتبع المسار المباشر لمدارس الأندلس' : 'Al-Andalos Live GPS Track HUD'}
                    <span className="px-1.5 py-0.5 text-[8px] font-black rounded-sm bg-blue-500 text-white animate-pulse">
                      LIVE
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {lang === 'ar' 
                      ? `المتدرب: ${activeTrackingLesson.studentName} | الدرس: ${activeTrackingLesson.time}`
                      : `Student: ${activeTrackingLesson.studentName} | Slot: ${activeTrackingLesson.time}`}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                {/* Simulated Mode Indicator Toggle */}
                {isDemoUnlocked && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-1.5 px-3 flex items-center gap-2">
                    <div className="text-left">
                      <span className="text-[8px] block font-bold text-slate-400 uppercase tracking-widest leading-none">
                        {lang === 'ar' ? 'نمط المحاكاة' : 'DEMO MODE'}
                      </span>
                      <span className="text-[9px] text-slate-300 font-medium">
                        {isDemoMode ? (lang === 'ar' ? 'نشط (مكتب)' : 'Simulated (Office)') : (lang === 'ar' ? 'موقف GPS حقيقي' : 'Real-time GPS')}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (isGPSTracking) {
                          alert(lang === 'ar' 
                            ? 'يرجى إيقاف التتبع مؤقتاً قبل تغيير نمط التتبع.' 
                            : 'Please pause tracking before changing mode.');
                          return;
                        }
                        setIsDemoMode(!isDemoMode);
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        isDemoMode ? 'bg-blue-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          isDemoMode ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                )}

                <button 
                  onClick={() => {
                    if (isGPSTracking) {
                      if (!confirm(lang === 'ar' 
                        ? 'تنبيه: التتبع نشط حالياً. هل أنت متأكد من إغلاق نافذة التتبع؟ سيتم إيقاف التسجيل.' 
                        : 'Warning: GPS tracking is currently active. Are you sure you want to exit? Recording will be stopped.')) {
                        return;
                      }
                    }
                    pauseTracking();
                    setActiveTrackingLesson(null);
                    setActiveRoutePoints([]);
                  }}
                  className="p-1 px-2.5 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-400 rounded-lg text-xs cursor-pointer transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {gpsError && (
              <div className="p-3 bg-rose-950 text-rose-300 border-b border-rose-900 text-xs flex items-center gap-2 font-semibold">
                <ShieldAlert className="h-4 w-4 shrink-0 animate-bounce" />
                <span>{gpsError}</span>
              </div>
            )}

            {/* Main Content Pane */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
              
              {/* Map Canvas Frame */}
              <div className="flex-1 h-64 md:h-full relative bg-slate-950">
                <div id="active-lesson-tracking-map" className="w-full h-full z-10"></div>
                
                {/* Floating GPS Status Overlay */}
                <div className="absolute top-4 left-4 z-20 p-2.5 bg-slate-950/90 backdrop-blur-xs rounded-xl border border-slate-800 text-[10px] font-mono space-y-1 shadow-xl">
                  <div className="flex items-center gap-1.5">
                    <Activity className={`h-3 w-3 ${isGPSTracking ? 'text-green-500 animate-pulse' : 'text-slate-500'}`} />
                    <span>STATUS: <strong className={isGPSTracking ? 'text-green-400' : 'text-slate-400'}>{isGPSTracking ? 'RECORDING' : 'IDLE'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isDemoMode ? (
                      <>
                        <Wifi className="h-3 w-3 text-cyan-400" />
                        <span>SIGNAL: <strong className="text-cyan-400">SIMULATED</strong></span>
                      </>
                    ) : isGPSTracking ? (
                      <>
                        <Wifi className="h-3 w-3 text-emerald-400 animate-ping" />
                        <span>SIGNAL: <strong className="text-emerald-400">HIGH PRECISION</strong></span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3 w-3 text-slate-500" />
                        <span>SIGNAL: <strong className="text-slate-500">STANDBY</strong></span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* HUD Control Dock */}
              <div className="w-full md:w-80 bg-slate-950/40 md:bg-slate-950 border-t md:border-t-0 md:border-l border-slate-800 p-4 md:p-6 flex flex-col justify-between shrink-0 overflow-y-auto">
                
                <div className="space-y-5">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">
                      {lang === 'ar' ? 'تفاصيل الدرس النشط' : 'ACTIVE LESSON PROFILE'}
                    </span>
                    <div className="mt-2 bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">{lang === 'ar' ? 'المتدرب:' : 'Student:'}</span>
                        <span className="font-bold text-white">{activeTrackingLesson.studentName}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">{lang === 'ar' ? 'نقطة الانطلاق:' : 'Pickup Location:'}</span>
                        <span className="font-bold text-slate-200 truncate max-w-[150px]" title={activeTrackingLesson.pickupLocation}>
                          {activeTrackingLesson.pickupLocation}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">{lang === 'ar' ? 'المدة:' : 'Duration:'}</span>
                        <span className="font-bold text-slate-200">{activeTrackingLesson.duration} hour(s)</span>
                      </div>
                    </div>
                  </div>

                  {/* Telemetry Metrics Grid */}
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">
                      📈 {lang === 'ar' ? 'القياسات والمسار الحركي' : 'LIVE TELEMETRY'}
                    </span>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-center">
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">{lang === 'ar' ? 'نقاط المسار' : 'COORDINATES'}</span>
                        <span className="text-base font-black text-blue-400 font-mono mt-0.5 block">{activeRoutePoints.length}</span>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-center">
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">{lang === 'ar' ? 'المسافة الفعلية' : 'REAL DISTANCE'}</span>
                        <span className="text-base font-black text-emerald-400 font-mono mt-0.5 block">
                          {(() => {
                            const getHaversineDistance = (p1: {lat: number; lng: number}, p2: {lat: number; lng: number}) => {
                              const R = 6371;
                              const dLat = (p2.lat - p1.lat) * Math.PI / 180;
                              const dLng = (p2.lng - p1.lng) * Math.PI / 180;
                              const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * Math.sin(dLng/2) * Math.sin(dLng/2);
                              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                              return R * c;
                            };
                            let dist = 0;
                            for (let i = 1; i < activeRoutePoints.length; i++) {
                              dist += getHaversineDistance(activeRoutePoints[i - 1], activeRoutePoints[i]);
                            }
                            return dist.toFixed(2);
                          })()} km
                        </span>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-center col-span-2">
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">{lang === 'ar' ? 'مدة التدريب المباشر' : 'ELAPSED DURATION'}</span>
                        <span className="text-base font-black text-amber-400 font-mono mt-0.5 block">
                          {(() => {
                            const hrs = Math.floor(elapsedSeconds / 3600);
                            const mins = Math.floor((elapsedSeconds % 3600) / 60);
                            const secs = elapsedSeconds % 60;
                            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                          })()}
                        </span>
                      </div>
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

                {/* Tracking Control Action Button */}
                <div className="pt-4 border-t border-slate-800">
                  {isGPSTracking ? (
                    <button
                      onClick={pauseTracking}
                      className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Pause className="h-4 w-4" />
                      {lang === 'ar' ? 'إيقاف التتبع مؤقتاً' : 'Pause GPS Tracking'}
                    </button>
                  ) : (
                    <button
                      onClick={startTracking}
                      className="w-full py-3 bg-green-600 hover:bg-green-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      {lang === 'ar' ? 'بدء تتبع نظام تحديد المواقع' : 'Start GPS Tracking'}
                    </button>
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* Al-Andalos Premium Student Dossier Report Modal Overlay */}
      {viewingReportStudentName && (() => {
        const sName = viewingReportStudentName;
        const profile = getStudentDbInfo(sName);
        const studentLessons = lessons.filter(l => studentNamesMatch(l.studentName, sName));
        const studentTransactions = transactions.filter(t => studentNamesMatch(t.studentName, sName));
        
        // Calculate invoices
        const invoiceMap = new Map<string, any>();
        studentTransactions.forEach(t => {
          if (t.invoiceId && !invoiceMap.has(t.invoiceId)) {
            invoiceMap.set(t.invoiceId, {
              invoiceId: t.invoiceId,
              date: t.date,
              description: t.description,
              amount: t.amount,
              paymentMethod: 'Wallet Balance',
              paymentStatus: 'paid'
            });
          }
        });
        studentLessons.forEach(l => {
          if (l.invoiceId) {
            const existing = invoiceMap.get(l.invoiceId);
            if (!existing) {
              invoiceMap.set(l.invoiceId, {
                invoiceId: l.invoiceId,
                date: l.date,
                description: lang === 'ar' ? `درس عملي في ${l.pickupLocation}` : `Road Lesson in ${l.pickupLocation}`,
                amount: l.price,
                paymentMethod: (l as any).payMethod || 'Direct Wallet Debit',
                paymentStatus: l.payStatus || 'unpaid'
              });
            } else {
              existing.amount += l.price;
              if (l.payStatus === 'unpaid') {
                existing.paymentStatus = 'unpaid';
              }
            }
          }
        });
        const studentInvoicesList = Array.from(invoiceMap.values());

        const lessonPagesCount = Math.max(1, Math.ceil(studentLessons.length / 9));
        const transactionPagesCount = Math.ceil(studentTransactions.length / 8);
        const invoicePagesCount = Math.ceil(studentInvoicesList.length / 8);
        const totalPagesCalculated = 1 + lessonPagesCount + transactionPagesCount + invoicePagesCount + 1;

        const handleDownloadPDF = async () => {
          setIsGeneratingPDF(true);
          try {
            const pdf = await generateUnifiedStudentDossierPDF(sName);
            if (pdf) {
              pdf.save(`Al_Andalos_Dossier_${sName.replace(/[\s]+/g, '_')}.pdf`);
            }
          } catch (error) {
            console.error("PDF generation failed:", error);
          } finally {
            setIsGeneratingPDF(false);
          }
        };

        const handleSendEmailWithPDF = async () => {
          setIsSendingEmail(true);
          setEmailStatusToast(null);
          try {
            const pdf = await generateUnifiedStudentDossierPDF(sName);
            if (pdf) {
              const fullUri = pdf.output('datauristring');
              const base64Data = fullUri.split(',')[1];
              await handleSendDossierEmail(sName, undefined, base64Data);
            }
          } catch (error) {
            console.error("Email PDF send failed:", error);
            setEmailStatusToast('error');
            setIsSendingEmail(false);
          }
        };

        return createPortal(
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-0 md:p-6 overflow-hidden print:p-0 print:bg-white print:overflow-visible print:static print:block animate-fade-in dossier-report-modal">
            <div className="bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 w-full max-w-5xl h-full md:max-h-[95vh] rounded-none md:rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col print:border-0 print:shadow-none print:rounded-none print:h-auto print:block print:overflow-visible">
              
              {/* Clean Top Bar Header */}
              <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 shrink-0 print:hidden">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 shadow-md">
                    <Award className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-sans font-black text-sm tracking-wider text-slate-100 uppercase leading-none">
                      {lang === 'ar' ? 'تقرير وتقييم ملف الطالب' : 'Student Report & Dossier'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium font-mono mt-1">
                      {profile.name} • ID: {profile.name.substring(0,3).toUpperCase()}-2026
                    </p>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleSendEmailWithPDF}
                    disabled={isSendingEmail || isGeneratingPDF}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-40 cursor-pointer"
                  >
                    <Send className={`h-3.5 w-3.5 ${isSendingEmail ? 'animate-bounce' : ''}`} />
                    {isSendingEmail ? (lang === 'ar' ? 'جاري الإرسال...' : 'Sending...') : (lang === 'ar' ? 'إرسال بالبريد' : 'Send via Email')}
                  </button>

                  <button
                    onClick={handleDownloadPDF}
                    disabled={isSendingEmail || isGeneratingPDF}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-40 cursor-pointer"
                  >
                    <Download className={`h-3.5 w-3.5 ${isGeneratingPDF ? 'animate-spin' : ''}`} />
                    {isGeneratingPDF ? (lang === 'ar' ? 'جاري التحميل...' : 'Downloading...') : (lang === 'ar' ? 'تحميل PDF' : 'Download PDF')}
                  </button>

                  <button
                    onClick={() => {
                      const pages = document.querySelectorAll('.dossier-pdf-page');
                      if (pages.length > 0) {
                        window.print();
                      } else {
                        setTimeout(() => window.print(), 200);
                      }
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold uppercase tracking-wider rounded-lg transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    {lang === 'ar' ? 'طباعة' : 'Print'}
                  </button>

                  <button
                    onClick={() => setViewingReportStudentName(null)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition flex items-center justify-center border border-slate-700 cursor-pointer"
                    title={lang === 'ar' ? 'إغلاق' : 'Close'}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Stacked Sheets Canvas */}
              <div className="flex-1 bg-slate-100 dark:bg-zinc-900 p-4 md:p-8 overflow-y-auto flex flex-col items-center justify-start print:bg-white print:p-0 print:overflow-visible print:max-h-none h-full print:h-auto print:block print-container-wrapper">
                <div className="w-full max-w-4xl space-y-4">
                  {emailStatusToast && (
                    <div className={`p-3 border text-[10px] font-extrabold rounded-xl flex items-center gap-2 print:hidden animate-fade-in ${
                      emailStatusToast === 'success' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                    }`}>
                      {emailStatusToast === 'success' ? (
                        <>
                          <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                          <span>{lang === 'ar' ? 'تم إرسال تقرير PDF المعتمد بنجاح للطالب.' : 'Success: Official PDF report generated and successfully sent to candidate.'}</span>
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 shrink-0 text-rose-500" />
                          <span>{lang === 'ar' ? 'فشل في إنشاء أو إرسال تقرير PDF.' : 'Error: Failed to compile report PDF or deliver email.'}</span>
                        </>
                      )}
                    </div>
                  )}

                  <div className="w-full flex justify-center">
                    <DossierA4Pages
                      studentName={sName}
                      lang={lang}
                      lessons={lessons}
                      transactions={transactions}
                      assessments={assessments}
                      profile={profile}
                      schoolSettings={schoolSettings}
                      customNotes=""
                      showSignatures={true}
                      signatoryName={schoolSettings.instructorName}
                      currentActivePage="all"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>,
          document.body
        );
      })()}

      {tempGenerationStudent && (
        <div id="temp-pdf-generator" className="pointer-events-none" style={{ width: '210mm', opacity: 1, position: 'fixed', left: '-9999mm', top: 0, zIndex: -1000 }}>
          <DossierA4Pages
            studentName={tempGenerationStudent}
            lang={lang}
            lessons={lessons}
            transactions={transactions}
            assessments={assessments}
            profile={getStudentDbInfo(tempGenerationStudent)}
            schoolSettings={schoolSettings}
            customNotes=""
            showSignatures={true}
            signatoryName={schoolSettings.instructorName}
            currentActivePage="all"
            mode="export"
          />
        </div>
      )}

    </div>
  );
}
