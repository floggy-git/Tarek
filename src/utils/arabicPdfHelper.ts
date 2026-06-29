import { jsPDF } from 'jspdf';
// @ts-ignore
import * as reshaperNamespace from 'arabic-persian-reshaper';
// @ts-ignore
import reshaperDefault from 'arabic-persian-reshaper';
import { Lesson, WalletTransaction, Assessment, Language } from '../types';

/**
 * Shapes Arabic text and reverses Arabic runs so they render correctly Right-to-Left
 * in jsPDF (which renders characters Left-to-Right).
 * It preserves Latin text, numbers, and punctuation in their correct order.
 */
export function prepareArabicForJsPDF(text: string): string {
  if (!text) return '';
  try {
    const shaper = (reshaperNamespace as any).ArabicShaper || 
                   (reshaperDefault as any)?.ArabicShaper || 
                   (reshaperNamespace as any).default?.ArabicShaper;
    
    if (!shaper || typeof shaper.convertArabic !== 'function') {
      console.warn("ArabicShaper.convertArabic is not available");
      return text;
    }
    
    // 1. Shape the Arabic text using arabic-persian-reshaper
    const shaped = shaper.convertArabic(text);

    // 2. Identify runs of Arabic characters and reverse them
    // Range includes standard Arabic, Arabic Presentation Forms A and B, Persian, etc.
    const arabicRegex = /[\u0600-\u06FF\uFE70-\uFEFC\uFB50-\uFDFD]+/g;

    let result = '';
    let lastIndex = 0;
    let match;

    while ((match = arabicRegex.exec(shaped)) !== null) {
      // Add the non-Arabic part before the match
      result += shaped.substring(lastIndex, match.index);

      // Reverse the Arabic character run
      const reversedArabic = match[0].split('').reverse().join('');
      result += reversedArabic;

      lastIndex = arabicRegex.lastIndex;
    }

    result += shaped.substring(lastIndex);
    return result;
  } catch (err) {
    console.warn("Failed to shape Arabic text:", err);
    return text;
  }
}

// Global cache to avoid fetching fonts multiple times
let cachedCairoBase64: string | null = null;
let cachedInterBase64: string | null = null;

const fetchFontAsBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch font from ${url}`);
  }
  const buffer = await response.arrayBuffer();
  
  // Safe base64 conversion that won't exceed call stack size
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * Lazy loads Cairo and Inter fonts from local paths and fallback static CDN URLs and embeds them in the jsPDF document.
 */
export async function embedFonts(doc: jsPDF): Promise<void> {
  // 1. Load Cairo/Arabic font
  if (!cachedCairoBase64) {
    const cairoUrls = [
      '/fonts/Cairo-Regular.ttf', // Local pre-downloaded font
      'https://cdn.jsdelivr.net/gh/googlefonts/cairo@master/fonts/ttf/Cairo-Regular.ttf',
      'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/almarai/Almarai-Regular.ttf' // Bulletproof fallback
    ];
    for (const url of cairoUrls) {
      try {
        cachedCairoBase64 = await fetchFontAsBase64(url);
        if (cachedCairoBase64) break;
      } catch (err) {
        console.warn(`Failed to fetch Arabic font from ${url}:`, err);
      }
    }
  }

  // 2. Load Inter/Latin font
  if (!cachedInterBase64) {
    const interUrls = [
      '/fonts/Inter-Regular.ttf', // Local pre-downloaded font
      'https://cdn.jsdelivr.net/gh/rsms/inter@v3.19.3/docs/font-files/Inter-Regular.ttf',
      'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/roboto/static/Roboto-Regular.ttf' // Bulletproof fallback
    ];
    for (const url of interUrls) {
      try {
        cachedInterBase64 = await fetchFontAsBase64(url);
        if (cachedInterBase64) break;
      } catch (err) {
        console.warn(`Failed to fetch Latin font from ${url}:`, err);
      }
    }
  }

  try {
    if (cachedCairoBase64) {
      doc.addFileToVFS('Cairo-Regular.ttf', cachedCairoBase64);
      doc.addFont('Cairo-Regular.ttf', 'Cairo', 'normal');
    }
    if (cachedInterBase64) {
      doc.addFileToVFS('Inter-Regular.ttf', cachedInterBase64);
      doc.addFont('Inter-Regular.ttf', 'Inter', 'normal');
    }
  } catch (err) {
    console.error("Font embedding failed, falling back to system fonts:", err);
  }
}

/**
 * Generates a fully searchable, high-fidelity vector PDF with embedded fonts for Al-Andalus student dossier.
 */
export async function generateSelectableDossierPDF(
  studentName: string,
  lang: Language,
  lessons: Lesson[],
  transactions: WalletTransaction[],
  assessments: Assessment[],
  profile: any,
  schoolSettings: any
): Promise<jsPDF> {
  // Initialize jsPDF document (A4 portrait)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  // Embed the fonts
  await embedFonts(doc);

  // Set default font to Cairo (supports Arabic + Latin + Dutch) or Inter
  const hasArabic = lang === 'ar';
  const primaryFont = hasArabic ? 'Cairo' : 'Inter';
  doc.setFont(primaryFont, 'normal');

  // Filter lessons and transactions
  const clean = (n: string) => n.toLowerCase().trim().replace(/[\s-_]/g, '');
  const sNameClean = clean(studentName);
  
  const studentLessons = lessons.filter(l => clean(l.studentName) === sNameClean);
  const completedLessons = studentLessons.filter(l => l.status === 'completed');
  const studentTransactions = transactions.filter(t => clean(t.studentName) === sNameClean);
  const totalHours = completedLessons.reduce((sum, l) => sum + l.duration, 0);

  const assessment = assessments.find(a => clean(a.studentName) === sNameClean) || {
    scores: { control: 8, priority: 7, highway: 8, maneuvers: 7, theory: 9 },
    cbrReadiness: 'developing',
    notes: 'Steady progress. Highly focused on lane safety and priority crossings.'
  };

  const isRtl = lang === 'ar';

  const tMap = {
    ar: {
      header: 'أكاديمية الأندلس لتعليم القيادة بهولندا',
      subtitle: 'الملف التدريبي والتقييم الموحد للطالب',
      ref: 'مرجع الملف',
      date: 'تاريخ الإصدار',
      studentName: 'اسم الطالب',
      studentId: 'رقم الطالب',
      package: 'الباقة المخصصة',
      hours: 'ساعات التدريب المنجزة',
      lessonsCount: 'الدروس المكتملة',
      balance: 'رصيد المحفظة',
      cbr: 'مؤشر جاهزية الـ CBR',
      competencies: 'تقييم كفاءة القيادة والمهارات الميدانية',
      control: 'التحكم الفني بالمركبة واستخدام القابض',
      priority: 'قواعد الأسبقية ومراقبة الطرق',
      highway: 'القيادة على الطرق السريعة والتجاوز',
      maneuvers: 'المناورات الخاصة والاصطفاف',
      theory: 'الوعي بقوانين السير وتوقع المخاطر',
      notesHeader: 'ملاحظات وتوجيهات الكابتن سمير الفيلالي:',
      signatureSection: 'التوقيع والاعتماد',
      instructorSig: 'توقيع المدرب المسؤول',
      studentSig: 'توقيع الطالب المتدرب',
      lessonsLog: 'سجل دروس القيادة الميدانية المنجزة',
      transLedger: 'دفتر العمليات الحسابية وإيداعات المحفظة',
      dateCol: 'التاريخ والوقت',
      locCol: 'نقطة الانطلاق',
      durCol: 'المدة',
      statusCol: 'الحالة',
      priceCol: 'السعر',
      paymentCol: 'الدفع',
      amountCol: 'المبلغ',
      methodCol: 'طريقة الدفع',
      descCol: 'الوصف'
    },
    en: {
      header: 'Al-Andalus Driving Academy Netherlands',
      subtitle: 'Unified Training Dossier & Assessment',
      ref: 'Dossier Ref',
      date: 'Date of Issue',
      studentName: 'Candidate Name',
      studentId: 'Student ID',
      package: 'Assigned Package',
      hours: 'Completed Training Hours',
      lessonsCount: 'Completed Lessons',
      balance: 'Wallet Balance',
      cbr: 'CBR Exam Readiness',
      competencies: 'Field Competencies & Technical Skills',
      control: 'Vehicle Control & Clutch Operation',
      priority: 'Priority Rules & Intersection Observations',
      highway: 'Highway Merging & Speed Lane Control',
      maneuvers: 'Special Maneuvers & Precise Parking',
      theory: 'Traffic Laws & Road Risk Anticipation',
      notesHeader: 'Instructor Samir El-Filali Final Feedback:',
      signatureSection: 'Signatures & Verification',
      instructorSig: 'Instructor Signature',
      studentSig: 'Candidate Signature',
      lessonsLog: 'Official Field Training Lessons Log',
      transLedger: 'Financial Statement & Wallet Ledger',
      dateCol: 'Date & Time',
      locCol: 'Location / Route',
      durCol: 'Duration',
      statusCol: 'Status',
      priceCol: 'Price',
      paymentCol: 'Payment',
      amountCol: 'Amount',
      methodCol: 'Method',
      descCol: 'Description'
    },
    nl: {
      header: 'Al-Andalus Rijopleidingen Nederland',
      subtitle: 'Geïntegreerd Trainingsdossier & Beoordeling',
      ref: 'Dossier Referentie',
      date: 'Datum van Uitgifte',
      studentName: 'Naam Kandidaat',
      studentId: 'Student ID',
      package: 'Toegewezen Pakket',
      hours: 'Gevolgde Lesuren',
      lessonsCount: 'Voltooide Lessen',
      balance: 'Portemonnee Saldo',
      cbr: 'CBR Examen Readiness',
      competencies: 'Praktische Rijvaardigheden & Competenties',
      control: 'Voertuigbeheersing & Koppelinggebruik',
      priority: 'Voorrangsregels & Kruispunt Observaties',
      highway: 'Snelweg Invoegen & Snelheidsbeheersing',
      maneuvers: 'Bijzondere Verrichtingen & Parkeren',
      theory: 'Verkeersregels & Gevaarherkenning',
      notesHeader: 'Eindoordeel Instructeur Samir El-Filali:',
      signatureSection: 'Handtekeningen & Verificatie',
      instructorSig: 'Handtekening Instructeur',
      studentSig: 'Handtekening Kandidaat',
      lessonsLog: 'Officieel Lessenoverzicht Praktijk',
      transLedger: 'Financieel Overzicht & Wallet Logboeken',
      dateCol: 'Datum & Tijd',
      locCol: 'Startlocatie / Route',
      durCol: 'Duur',
      statusCol: 'Status',
      priceCol: 'Prijs',
      paymentCol: 'Betaling',
      amountCol: 'Bedrag',
      methodCol: 'Methode',
      descCol: 'Beschrijving'
    }
  };

  const labels = tMap[lang] || tMap['en'];

  // Safe text drawing helper with RTL alignment and shaping
  const drawText = (txt: string, x: number, y: number, align: 'left' | 'right' | 'center' = 'left') => {
    const formatted = isRtl ? prepareArabicForJsPDF(txt) : txt;
    doc.text(formatted, x, y, { align: isRtl ? (align === 'left' ? 'right' : align === 'right' ? 'left' : 'center') : align });
  };

  // PAGE 1: COVER PAGE AND ASSESSMENTS
  // Draw header block
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, 210, 42, 'F');
  
  doc.setFillColor(217, 119, 6); // Amber-600 gold border line
  doc.rect(0, 42, 210, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  drawText(labels.header, 105, 18, 'center');

  doc.setFontSize(12);
  doc.setTextColor(156, 163, 175);
  drawText(labels.subtitle, 105, 28, 'center');

  // Reset text color
  doc.setTextColor(15, 23, 42);

  // General Metadata info
  doc.setFontSize(10);
  doc.setFont(primaryFont, 'normal');
  
  const issueDate = new Date().toISOString().split('T')[0];
  const dossierId = `DOS-${studentName.substring(0, 3).toUpperCase()}-2026`;

  // Draw 2 column student profile card
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.rect(15, 52, 180, 52, 'FD');

  doc.setFontSize(11);
  doc.setTextColor(30, 64, 175); // Blue-800
  drawText(`${labels.studentName}: ${studentName}`, 22, 62, 'left');
  
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  drawText(`${labels.studentId}: STU-${studentName.substring(0,3).toUpperCase()}-2026`, 22, 70, 'left');
  drawText(`${labels.package}: ${profile?.package || 'Optimal Progress (20h)'}`, 22, 78, 'left');
  drawText(`${labels.ref}: ${dossierId}`, 22, 86, 'left');
  drawText(`${labels.date}: ${issueDate}`, 22, 94, 'left');

  // Column 2 of general info
  drawText(`${labels.hours}: ${totalHours}h`, 115, 70, 'left');
  drawText(`${labels.lessonsCount}: ${completedLessons.length}`, 115, 78, 'left');
  drawText(`${labels.balance}: €${(profile?.balance ?? 0).toFixed(2)}`, 115, 86, 'left');
  
  const cbrStatus = assessment.cbrReadiness === 'ready_cbr' 
    ? (isRtl ? 'جاهز للامتحان (CBR READY)' : 'Examenklaar (CBR READY)')
    : (isRtl ? 'قيد التطور والتحضير' : 'In opleiding (DEVELOPING)');
  drawText(`${labels.cbr}: ${cbrStatus}`, 115, 94, 'left');

  // Competencies Section
  doc.setFontSize(12);
  doc.setTextColor(30, 64, 175);
  drawText(labels.competencies, 15, 114, 'left');

  doc.setLineWidth(0.3);
  doc.setDrawColor(203, 213, 225);
  doc.line(15, 116, 195, 116);

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);

  const compList = [
    { label: labels.control, score: assessment.scores?.control ?? 8 },
    { label: labels.priority, score: assessment.scores?.priority ?? 7 },
    { label: labels.highway, score: assessment.scores?.highway ?? 8 },
    { label: labels.maneuvers, score: assessment.scores?.maneuvers ?? 7 },
    { label: labels.theory, score: assessment.scores?.theory ?? 9 },
  ];

  let currentY = 126;
  compList.forEach((comp) => {
    drawText(comp.label, 15, currentY, 'left');
    
    // Draw visual rating bar
    doc.setFillColor(241, 245, 249);
    doc.rect(130, currentY - 3.5, 45, 4, 'F');
    
    doc.setFillColor(30, 64, 175);
    doc.rect(130, currentY - 3.5, (comp.score / 10) * 45, 4, 'F');

    drawText(`${comp.score}/10`, 182, currentY, 'left');
    currentY += 10;
  });

  // Notes Block
  doc.setDrawColor(253, 230, 138); // Yellow-200
  doc.setFillColor(255, 251, 235); // Yellow-50
  doc.rect(15, currentY + 2, 180, 24, 'FD');

  doc.setTextColor(146, 64, 14); // Yellow-800
  doc.setFontSize(10);
  drawText(labels.notesHeader, 20, currentY + 8, 'left');
  
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  
  // Wrap and limit final observations notes
  const notesText = assessment.notes || 'Outstanding performance and high readiness for CBR exam.';
  const splitNotes = doc.splitTextToSize(notesText, 170);
  let notesY = currentY + 14;
  splitNotes.slice(0, 2).forEach((line: string) => {
    drawText(line, 20, notesY, 'left');
    notesY += 5;
  });

  // Signature Block
  const sigY = currentY + 36;
  doc.setDrawColor(226, 232, 240);
  doc.line(15, sigY, 195, sigY);

  doc.setFontSize(11);
  doc.setTextColor(30, 64, 175);
  drawText(labels.signatureSection, 15, sigY + 6, 'left');

  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  
  // Instructor signature
  drawText(labels.instructorSig, 25, sigY + 14, 'left');
  doc.setFont(primaryFont, 'normal');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  drawText(schoolSettings?.instructorName || "Samir El-Filali", 25, sigY + 24, 'left');
  
  // Student signature
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  drawText(labels.studentSig, 125, sigY + 14, 'left');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  drawText(studentName, 125, sigY + 24, 'left');

  // PAGE 2: FIELD LESSONS LOG
  doc.addPage('a4', 'portrait');
  doc.setFont(primaryFont, 'normal');

  // Draw Header block
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 25, 'F');
  doc.setFillColor(217, 119, 6);
  doc.rect(0, 25, 210, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  drawText(labels.lessonsLog, 15, 15, 'left');
  drawText(`${labels.studentName}: ${studentName}`, 195, 15, 'right');

  doc.setTextColor(15, 23, 42);
  
  // Draw Table of lessons
  let tableY = 38;
  doc.setFillColor(241, 245, 249);
  doc.rect(15, tableY, 180, 8, 'F');
  
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  
  // Table headers
  drawText(labels.dateCol, 20, tableY + 5, 'left');
  drawText(labels.locCol, 60, tableY + 5, 'left');
  drawText(labels.durCol, 125, tableY + 5, 'left');
  drawText(labels.statusCol, 150, tableY + 5, 'left');
  drawText(labels.priceCol, 175, tableY + 5, 'left');

  doc.setDrawColor(226, 232, 240);
  doc.line(15, tableY + 8, 195, tableY + 8);
  
  tableY += 8;
  doc.setTextColor(15, 23, 42);

  // Paginated lessons (show up to 15 completed lessons)
  const listLessons = studentLessons.slice(0, 15);
  listLessons.forEach((les) => {
    drawText(`${les.date} ${les.time}`, 20, tableY + 6, 'left');
    drawText(les.pickupLocation, 60, tableY + 6, 'left');
    drawText(`${les.duration}h`, 125, tableY + 6, 'left');
    
    const statusTxt = les.status === 'completed' 
      ? (isRtl ? 'مكتمل' : 'Voltooid') 
      : (les.status === 'upcoming' || les.status === 'active') 
        ? (isRtl ? 'مجدول' : 'Gepland') 
        : (isRtl ? 'ملغي' : 'Geannuleerd');
    drawText(statusTxt, 150, tableY + 6, 'left');
    drawText(`€${les.price}`, 175, tableY + 6, 'left');

    doc.line(15, tableY + 9, 195, tableY + 9);
    tableY += 9;
  });

  // PAGE 3: FINANCIAL LEDGER
  doc.addPage('a4', 'portrait');
  doc.setFont(primaryFont, 'normal');

  // Draw Header block
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 25, 'F');
  doc.setFillColor(217, 119, 6);
  doc.rect(0, 25, 210, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  drawText(labels.transLedger, 15, 15, 'left');
  drawText(`${labels.studentName}: ${studentName}`, 195, 15, 'right');

  doc.setTextColor(15, 23, 42);

  // Draw Table of transactions
  let transY = 38;
  doc.setFillColor(241, 245, 249);
  doc.rect(15, transY, 180, 8, 'F');
  
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  // Headers
  drawText(labels.dateCol, 20, transY + 5, 'left');
  drawText(labels.descCol, 55, transY + 5, 'left');
  drawText(labels.methodCol, 125, transY + 5, 'left');
  drawText(labels.amountCol, 155, transY + 5, 'left');
  drawText(labels.statusCol, 175, transY + 5, 'left');

  doc.line(15, transY + 8, 195, transY + 8);
  transY += 8;
  doc.setTextColor(15, 23, 42);

  const listTrans = studentTransactions.slice(0, 15);
  listTrans.forEach((t) => {
    drawText(t.date, 20, transY + 6, 'left');
    
    // Description text translation or shaping
    const desc = isRtl ? (t.type === 'deposit' ? 'إيداع رصيد بالمحفظة' : 'اقتطاع حصة قيادة') : t.description;
    drawText(desc, 55, transY + 6, 'left');
    
    const isIdeal = t.description.toLowerCase().includes('ideal');
    const isCash = t.description.toLowerCase().includes('cash');
    const method = isIdeal ? 'iDEAL' : isCash ? (isRtl ? 'كاش' : 'Cash') : (isRtl ? 'بطاقة' : 'Card');
    drawText(method, 125, transY + 6, 'left');
    
    const prefix = t.type === 'deposit' ? '+' : '-';
    drawText(`${prefix}€${t.amount}`, 155, transY + 6, 'left');
    
    const stat = isRtl ? 'معتمد' : 'Voldaan';
    drawText(stat, 175, transY + 6, 'left');

    doc.line(15, transY + 9, 195, transY + 9);
    transY += 9;
  });

  return doc;
}
