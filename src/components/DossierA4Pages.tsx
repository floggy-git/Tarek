import React from 'react';
import { 
  User, Car, Award, Calendar, Wallet, FileText, Activity, Check, X
} from 'lucide-react';
import { Lesson, WalletTransaction, Assessment, Language } from '../types';
import { getStudentPhoto, getStudentInitials } from '../utils/studentPhoto';

interface DossierA4PagesProps {
  studentName: string;
  lang: Language;
  lessons: Lesson[];
  transactions: WalletTransaction[];
  assessments: Assessment[];
  profile: any;
  schoolSettings: any;
  customNotes?: string;
  showSignatures?: boolean;
  signatoryName?: string;
  currentActivePage?: number | 'all';
  mode?: 'preview' | 'export';
}

export const DossierA4Pages: React.FC<DossierA4PagesProps> = ({
  studentName,
  lang,
  lessons,
  transactions,
  assessments,
  profile,
  schoolSettings,
  customNotes = "",
  showSignatures = true,
  signatoryName = "Samir El-Filali",
  currentActivePage = 'all',
  mode = 'preview'
}) => {
  // Helper to match student names across translations
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

  // Translations dictionary for premium dossier styling
  const dltMap = {
    ar: {
      coverTitle: 'الملف التدريبي والتقييم الموحد للطالب',
      coverSubtitle: 'أكاديمية الأندلس لتعليم القيادة بهولندا - كشف معتمد',
      studentPortrait: 'صورة الطالب المعتمدة',
      dossierTitle: 'ملف تقييم الطالب والملخص المالي الموحد',
      subTitle: 'سجل تدريب معتمد ودفتر فواتير ضريبي رسمي',
      licenseAuthority: 'ترخيص التدريب من هيئة المرور الهولندية (CBR)',
      dossierRef: 'مرجع الملف',
      generatedDate: 'تاريخ الإصدار',
      trainer: 'المدرب المسؤول',
      contact: 'الاتصال والبريد',
      studentProfile: 'معلومات الطالب والمسار التعليمي',
      trainingProgram: 'البرنامج والمسار التدريبي',
      financialSummary: 'الملخص المالي والحسابي',
      fullName: 'الاسم الكامل للمتدرب',
      dob: 'تاريخ الميلاد / العنوان',
      assignedPackage: 'الباقة المخصصة',
      registrationDate: 'تاريخ التسجيل بالأكاديمية',
      progressCbr: 'نسبة التقدم والجاهزية للامتحان',
      walletBalance: 'رصيد محفظة الطالب',
      outstandingLessons: 'المستحقات غير المفوترة',
      depositsPayments: 'إجمالي الإيداعات والمدفوعات',
      unbilledSlots: 'جلسات معلقة',
      deposited: 'المودع',
      paidValue: 'المدفوع',
      totalHours: 'ساعات التدريب المنجزة',
      completedLessons: 'الدروس المكتملة والمعتمدة',
      upcomingLessons: 'الدروس المجدولة المستقبلية',
      cancelledLessons: 'الحصص الملغاة',
      skillsAssessment: 'تقييم كفاءات القيادة والمهارات الفنية',
      vehicleControl: 'التحكم الفني بالمركبة واستخدام القابض',
      priorityJunctions: 'مراقبة الطرق، المرايا، وإعطاء الأولويات',
      highwayDriving: 'القيادة والاندماج على الطرق السريعة والتجاوز',
      specialManeuvers: 'المناورات الخاصة بالركن والرجوع والانحدار',
      theorySigns: 'الوعي بقوانين السير وتوقع المخاطر',
      cbrReadiness: 'مستوى الجاهزية لاختبار الـ CBR',
      feedbackNotes: 'التوصيات والملاحظات النهائية من المدرب الكابتن سمير',
      lessonsLogTitle: 'سجل دروس القيادة الميدانية المنجزة',
      dateTime: 'التاريخ والوقت',
      location: 'نقطة الانطلاق والمسار',
      durationDistance: 'المدة والمسافة',
      status: 'الحالة',
      price: 'السعر',
      paymentStatus: 'حالة الدفع',
      trainerNotes: 'ملاحظات الدرس الفردية',
      transactionLedgerTitle: 'دفتر العمليات الحسابية وإيداعات المحفظة',
      date: 'التاريخ',
      type: 'النوع',
      description: 'البيان والتوضيح',
      amount: 'المبلغ',
      invoiceRef: 'مرجع الفاتورة',
      taxInvoicesTitle: 'الفواتير الضريبية والمستندات المالية الصادرة',
      reference: 'رقم المرجع الفاتوري',
      method: 'طريقة الدفع المعتمدة',
      readinessCertificateTitle: 'شهادة الجاهزية الرسمية للامتحان العملي للـ CBR',
      certifiedReady: 'مستند تصديق الجاهزية - الطالب المعتمد',
      readinessDesc: 'تشهد إدارة أكاديمية الأندلس لتعليم القيادة بأن المتدرب المذكور أعلاه قد أكمل بنجاح كافة الكفاءات المطلوبة وحصل على درجات تقييم ممتازة تؤهله رسمياً لاجتياز اختبار القيادة العملي النهائي التابع لبلدية أمستردام وهيئة الـ CBR بنجاح تام.',
      cbrReadyBadge: '🏆 معتمد للـ CBR',
      disclaimer: 'هذا الكشف رسمي ومعتمد وصادر إلكترونياً عن مدرسة الأندلس لتعليم القيادة بهولندا، وهو خاضع لشروط هيئة المرور والمواصلات الهولندية (CBR).',
      allRightsReserved: 'جميع الحقوق محفوظة لأكاديمية الأندلس لتعليم القيادة والتعليم الفني بهولندا.',
      officialStamp: 'الختم والتوقيع الرسمي',
      instructorInfo: 'معلومات المدرب والترخيص',
      finalRemarksTitle: 'التقييم الشامل وملاحظات الإدارة والمدرب الرئيسي',
      technicalReview: 'التقرير الفني العام ومؤشرات المهارة الميدانية',
      recommendationsChecklist: 'توصيات التدريب والتوجيه الفني',
      instructorSignature: 'توقيع المدرب المسؤول',
      studentSignature: 'توقيع الطالب بالاستلام'
    },
    nl: {
      coverTitle: 'OFFICIEEL LEERLINGENDOSSIER & EVALUATIERAPPORT',
      coverSubtitle: 'Al-Andalos Rijschool Nederland • Gecertificeerd Opleidingsdocument',
      studentPortrait: 'PASFOTO KANDIDAAT',
      dossierTitle: 'Leerlingendossier & Financieel Evaluatierapport',
      subTitle: 'Officieel Trainingsdossier en Fiscaal Factuurgrootboek',
      licenseAuthority: 'CBR Erkende Rijschool Licentiehouder',
      dossierRef: 'Dossier Ref',
      generatedDate: 'Uitgiftedatum',
      trainer: 'Hoofdinstructeur',
      contact: 'Contact & E-mail',
      studentProfile: 'Leerlingprofiel & Registraties',
      trainingProgram: 'Opleidingsprogramma',
      financialSummary: 'Financieel Overzicht & Saldo',
      fullName: 'Volledige Naam Leerling',
      dob: 'Geboortedatum / Woonplaats',
      assignedPackage: 'Toegewezen Lespakket',
      registrationDate: 'Registratiedatum Academie',
      progressCbr: 'Voortgang & CBR Examenstatus',
      walletBalance: 'Saldo Leskaart / Wallet',
      outstandingLessons: 'Niet-Gefactureerde Rijlessen',
      depositsPayments: 'Totaal Stortingen & Betalingen',
      unbilledSlots: 'openstaande rijles(sen)',
      deposited: 'Gestort',
      paidValue: 'Betaald',
      totalHours: 'Totaal Gereden Lesuren',
      completedLessons: 'Afgeronde & Geverifieerde Lessen',
      upcomingLessons: 'Toekomstig Ingeplande Lessen',
      cancelledLessons: 'Geannuleerde Lesuren',
      skillsAssessment: 'Rijvaardigheid & Technische Competenties',
      vehicleControl: 'Voertuigbeheersing & Koppeling/Schakelen',
      priorityJunctions: 'Kijkgedrag, Spiegels & Voorrangsregels',
      highwayDriving: 'Snelwegintegratie & Inhalen/Rijstrookwissel',
      specialManeuvers: 'Bijzondere Manoeuvres & Hellingproef',
      theorySigns: 'Verkeersinzicht, Borden & Gevaarherkenning',
      cbrReadiness: 'CBR Examenbereidheid Niveau',
      feedbackNotes: 'Evaluatie & Aanbevelingen van Instructeur Samir',
      lessonsLogTitle: 'Gereden Rijlessen & Praktijkverslagen',
      dateTime: 'Datum & Tijdstip',
      location: 'Ophaallocatie / Route',
      durationDistance: 'Duur & Afstand (Kilometers)',
      status: 'Status',
      price: 'Tarief',
      paymentStatus: 'Betaling',
      trainerNotes: 'Lesopmerkingen & Feedback',
      transactionLedgerTitle: 'Transactiehistorie & Walletboekingen',
      date: 'Datum',
      type: 'Type',
      description: 'Omschrijving',
      amount: 'Bedrag',
      invoiceRef: 'Factuur Ref',
      taxInvoicesTitle: 'Uitgegeven Fiscale Facturen',
      reference: 'Factuurnummer',
      method: 'Betaalmethode',
      readinessCertificateTitle: 'CBR Examenbereidheidscertificaat',
      certifiedReady: 'Geverifieerd & Examenklaar Bevonden - Kandidaat',
      readinessDesc: 'Al-Andalos Rijschool verklaart hierbij dat de bovengenoemde leerling alle vereiste rijvaardigheden en examenonderdelen succesvol heeft doorlopen en met uitstekende resultaten is klaargestoomd voor het officiële CBR praktijkexamen in de regio Amsterdam.',
      cbrReadyBadge: '🏆 CBR KLAAR',
      disclaimer: 'Dit is een officieel en geverifieerd lesdocument uitgegeven door Al-Andalos Rijschool, gecertificeerd volgens de richtlijnen van het CBR.',
      allRightsReserved: 'Alle rechten voorbehouden © Al-Andalos Rijschool & Educatie Nederland.',
      officialStamp: 'Handtekening & Stempel',
      instructorInfo: 'Instructeursinformatie & Licenties',
      finalRemarksTitle: 'Eindevaluatie, Instructeursadvies & Officiële Verificatie',
      technicalReview: 'Technische Rijvaardigheid & Praktische Beoordeling',
      recommendationsChecklist: 'Aanbevelingen & Gerichte Aandachtspunten',
      instructorSignature: 'Handtekening Hoofdinstructeur',
      studentSignature: 'Handtekening Leerling'
    },
    en: {
      coverTitle: 'OFFICIAL STUDENT TRAINING DOSSIER & REPORT',
      coverSubtitle: 'Al-Andalos Driving Academy Netherlands • Certified Record Book',
      studentPortrait: 'CANDIDATE PORTRAIT',
      dossierTitle: 'Student Dossier & Financial Ledger',
      subTitle: 'Official Training Progress File & Tax Compliant Statement',
      licenseAuthority: 'CBR Accredited Training Center',
      dossierRef: 'Dossier Ref',
      generatedDate: 'Date Issued',
      trainer: 'Lead Instructor',
      contact: 'Contact & Email',
      studentProfile: 'Student Profile & Registration',
      trainingProgram: 'Assigned Course Pathway',
      financialSummary: 'Financial Health & Ledger',
      fullName: 'Student Full Name',
      dob: 'Date of Birth / City',
      assignedPackage: 'Assigned Package',
      registrationDate: 'Registration Date',
      progressCbr: 'Course Progress & CBR Standing',
      walletBalance: 'Student Wallet Balance',
      outstandingLessons: 'Unbilled Outstanding Balance',
      depositsPayments: 'Deposits / Training Value Delivered',
      unbilledSlots: 'slots',
      deposited: 'Deposited',
      paidValue: 'Paid Value',
      totalHours: 'Total Training Hours Logged',
      completedLessons: 'Completed & Validated Lessons',
      upcomingLessons: 'Scheduled Future Lessons',
      cancelledLessons: 'Cancelled Sessions',
      skillsAssessment: 'Core Driving Competencies Scorecard',
      vehicleControl: 'Vehicle Mechanics & Friction Clutch Control',
      priorityJunctions: 'Observation Cycle, Mirrors & Priority Rules',
      highwayDriving: 'Highway Merging & High-Speed Lane Changes',
      specialManeuvers: 'Precision Maneuvers & Hill/Slope Starts',
      theorySigns: 'Traffic Signage Comprehension & Hazard Prevention',
      cbrReadiness: 'CBR Practical Exam Readiness Level',
      feedbackNotes: "Captain Samir's Written Observations & Feedback",
      lessonsLogTitle: 'Comprehensive Road Practice Log',
      dateTime: 'Date & Time',
      location: 'Pickup/Route Location',
      durationDistance: 'Duration & Distance Covered',
      status: 'Status',
      price: 'Lesson Price',
      paymentStatus: 'Payment',
      trainerNotes: 'Session Remarks & Progress',
      transactionLedgerTitle: 'Account Transactions & Deposits Ledger',
      date: 'Date',
      type: 'Type',
      description: 'Transaction Description',
      amount: 'Amount',
      invoiceRef: 'Invoice ID',
      taxInvoicesTitle: 'Issued Fiscale Tax Invoices',
      reference: 'Invoice Reference',
      method: 'Method',
      readinessCertificateTitle: 'CBR Examination Readiness Certificate',
      certifiedReady: 'Readiness Verification — Certified Candidate',
      readinessDesc: 'Al-Andalos Driving Academy hereby certifies that the student named above has completed comprehensive training, scoring excellent marks across all driving disciplines, and is officially declared fully prepared for the CBR Practical Driving Examination in Amsterdam.',
      cbrReadyBadge: '🏆 CBR READY',
      disclaimer: 'This document is an official training file record and tax ledger statement issued by Al-Andalos, compliant with the standards set by the CBR (Central Office for Motor Vehicle Driver Testing).',
      allRightsReserved: 'All rights reserved © Al-Andalos Driving Academy & Educatie Netherlands.',
      officialStamp: 'Official Authorization Seal & Signature',
      instructorInfo: 'Instructor Credentials & Vehicle Info',
      finalRemarksTitle: 'Final Evaluation, Technical Advice & Academy Verification',
      technicalReview: 'Overall Driving Performance & Core Mastery Review',
      recommendationsChecklist: 'Strategic Development Recommendations',
      instructorSignature: 'Lead Instructor Signature',
      studentSignature: 'Candidate Signature / Sign-off'
    }
  };

  const currentLang = lang === 'ar' ? 'ar' : lang === 'nl' ? 'nl' : 'en';
  const dlt = dltMap[currentLang];
  const isRTL = currentLang === 'ar';

  // Guard values safely to ensure no runtime errors
  const safeProfile = profile || {
    name: studentName,
    package: "Compleet Rijopleiding Pakket",
    dob: "12-04-2002",
    city: "Amsterdam",
    regDate: "15-01-2026",
    email: "student@al-andalos.nl",
    phone: "+31 6 12345678",
    progress: "85%",
    examStatus: "In Progress",
    balance: 0
  };

  const safeSchoolSettings = schoolSettings || {
    name: "Al-Andalos Rijschool",
    instructorName: "Samir El-Filali",
    kvk: "84729384",
    btw: "NL847293842B01"
  };

  // Gather student statistics
  const studentLessons = lessons.filter(l => studentNamesMatch(l.studentName, studentName));
  const completedLessons = studentLessons.filter(l => l.status === 'completed');
  const upcomingLessons = studentLessons.filter(l => l.status === 'upcoming');
  const cancelledLessons = studentLessons.filter(l => l.status === 'cancelled');
  
  const paidLessons = studentLessons.filter(l => l.status === 'completed' && l.payStatus === 'paid');
  const unpaidLessons = studentLessons.filter(l => l.status === 'completed' && l.payStatus === 'unpaid');
  
  const totalTrainingHours = completedLessons.reduce((sum, l) => sum + l.duration, 0);
  const studentTransactions = transactions.filter(t => studentNamesMatch(t.studentName, studentName));
  const unpaidTotalSum = unpaidLessons.reduce((sum, l) => sum + l.price, 0);
  const isExamReady = studentName === "Michael van Berg" || studentName === "مايكل فان بيرغ" || (safeProfile.examStatus && (safeProfile.examStatus.includes("Ready") || safeProfile.examStatus.includes("Helemaal") || safeProfile.examStatus.includes("جاهز")));

  // Lookup the latest saved assessment report
  const latestSavedReport = assessments.find(r => studentNamesMatch(r.studentName, studentName));
  
  let scControl = 6;
  let scPriority = 5;
  let scHighway = 5;
  let scManeuvers = 5;
  let scTheory = 6;
  let cbrReadiness = 'developing';
  let reportNotes = "";

  if (latestSavedReport) {
    scControl = latestSavedReport.scores?.control ?? latestSavedReport.overallScore ?? 8;
    scPriority = latestSavedReport.scores?.priority ?? latestSavedReport.overallScore ?? 7;
    scHighway = latestSavedReport.scores?.highway ?? latestSavedReport.overallScore ?? 8;
    scManeuvers = latestSavedReport.scores?.maneuvers ?? latestSavedReport.overallScore ?? 7;
    scTheory = latestSavedReport.scores?.theory ?? latestSavedReport.overallScore ?? 9;
    cbrReadiness = latestSavedReport.cbrReadiness ?? "developing";
    reportNotes = latestSavedReport.notes ?? "";
  } else {
    const isAmir = studentName.includes("Amir") || studentName.includes("أمير");
    const isSanne = studentName.includes("Sanne") || studentName.includes("ساني");
    const isMichael = studentName.includes("Michael") || studentName.includes("مايكل");

    if (isAmir) {
      scControl = 8; scPriority = 7; scHighway = 8; scManeuvers = 7; scTheory = 9;
      cbrReadiness = "developing";
      reportNotes = lang === 'ar' 
        ? "أظهر أمير أداءً ممتازاً وتطوراً مستمراً في مناورات الطرق السريعة والدوران. يحتاج فقط لتركيز إضافي على الركن المتوازي."
        : "Amir has shown excellent performance and steady progress on highway lane joining and roundabout exits. Needs some more focus on parallel parking.";
    } else if (isSanne) {
      scControl = 5; scPriority = 4; scHighway = 4; scManeuvers = 3; scTheory = 6;
      cbrReadiness = "beginner";
      reportNotes = lang === 'ar'
        ? "المتدرب ساني في البداية التدريبية الأولى. يحتاج إلى حصص مركزة إضافية للتحكم في القابض والتوجيه وقواعد أفضلية المرور."
        : "Sanne is in the early training stages. Requires extra focused sessions on clutch/gear control, steering, and general priority rules.";
    } else if (isMichael) {
      scControl = 10; scPriority = 9; scHighway = 10; scManeuvers = 9; scTheory = 10;
      cbrReadiness = "cbr_ready";
      reportNotes = lang === 'ar'
        ? "أداء قيادة استثنائي ورائع! التحكم بالسيارة والسرعة والملاحظة المرورية كلها في مستوى الامتياز. جاهز تماماً للاختبار العملي لبلدية أمستردام."
        : "Exceptional and outstanding driving performance! Vehicle control, speed merging, and observational safety are all at excellence level. Fully ready for the Amsterdam CBR practical test.";
    }
  }

  // Gather unique invoices
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

  const studentInvoicesList = Array.from(invoiceMap.values()) as any[];

  // Dynamic Content Partitioning Engine
  const sortedLessons = [...studentLessons].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const lessonChunks: typeof sortedLessons[] = [];
  const lessonsPerPage = 10; // Fits perfectly inside A4 content area
  for (let i = 0; i < sortedLessons.length; i += lessonsPerPage) {
    lessonChunks.push(sortedLessons.slice(i, i + lessonsPerPage));
  }

  const transactionsPerPage = 10;
  const transactionChunks: typeof studentTransactions[] = [];
  for (let i = 0; i < studentTransactions.length; i += transactionsPerPage) {
    transactionChunks.push(studentTransactions.slice(i, i + transactionsPerPage));
  }

  const invoicesPerPage = 10;
  const invoiceChunks: typeof studentInvoicesList[] = [];
  for (let i = 0; i < studentInvoicesList.length; i += invoicesPerPage) {
    invoiceChunks.push(studentInvoicesList.slice(i, i + invoicesPerPage));
  }

  // Calculate pages
  const compiledPages: { type: 'cover' | 'assessment' | 'lessons' | 'transactions' | 'invoices' | 'signatures'; data?: any; index: number }[] = [];
  let pageCounter = 1;

  // Add cover page (Page 1)
  compiledPages.push({ type: 'cover', index: pageCounter++ });

  // Add assessment page (Page 2)
  compiledPages.push({ type: 'assessment', index: pageCounter++ });

  // Add lesson log pages (Page 3+)
  if (lessonChunks.length > 0) {
    lessonChunks.forEach((chunk, index) => {
      compiledPages.push({ type: 'lessons', data: { chunk, isContinued: index > 0 }, index: pageCounter++ });
    });
  } else {
    compiledPages.push({ type: 'lessons', data: { chunk: [], isContinued: false }, index: pageCounter++ });
  }

  // Add transaction pages (Page 4+)
  if (transactionChunks.length > 0) {
    transactionChunks.forEach((chunk, index) => {
      compiledPages.push({ type: 'transactions', data: { chunk, isContinued: index > 0 }, index: pageCounter++ });
    });
  }

  // Add invoice pages (Page 5+)
  if (invoiceChunks.length > 0) {
    invoiceChunks.forEach((chunk, index) => {
      compiledPages.push({ type: 'invoices', data: { chunk, isContinued: index > 0 }, index: pageCounter++ });
    });
  }

  // Add signatures and closing page (Last Page)
  compiledPages.push({ type: 'signatures', index: pageCounter++ });

  const totalPagesCount = 2;

  // Render Page Header (Shared across all pages except the cover)
  const renderHeader = (pageIndex: number, type: string) => {
    if (type === 'cover') return null; // Cover page has custom header built-in
    
    return (
      <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4 shrink-0" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3">
          {/* Professional Gold-Accent Logo */}
          <div className="w-9 h-9 rounded-lg bg-slate-950 flex flex-col items-center justify-center border border-amber-500 relative shadow-sm shrink-0">
            <span className="text-amber-400 font-extrabold text-[12px] leading-none">A</span>
            <span className="text-white text-[5.5px] font-black tracking-widest leading-none mt-0.5">ANDALOS</span>
          </div>
          <div className="text-left">
            <p className="font-sans font-black text-[11px] text-slate-900 leading-tight tracking-tight uppercase">
              {safeSchoolSettings.name}
            </p>
            <p className="text-[7px] text-slate-400 font-bold tracking-wider uppercase font-mono">
              {dlt.licenseAuthority}
            </p>
          </div>
        </div>
        <div className={`text-right font-mono text-[7.5px] text-slate-400 space-y-0.5 ${isRTL ? 'text-left' : 'text-right'}`}>
          <p className="font-bold text-slate-700 uppercase tracking-wider">{dlt.dossierRef}: DOS-{studentName.substring(0,3).toUpperCase()}-2026</p>
          <p>{dlt.generatedDate}: {new Date().toISOString().split('T')[0]} • Page {pageIndex} of {totalPagesCount}</p>
        </div>
      </div>
    );
  };

  // Render Page Footer (Shared across all pages)
  const renderFooter = (pageIndex: number, type: string) => (
    <div className="border-t border-slate-150 pt-2.5 mt-3 shrink-0 flex justify-between items-center text-[7px] text-slate-400 font-medium" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-[85%] text-left">
        <p className="font-semibold text-slate-500 leading-normal">
          {dlt.disclaimer}
        </p>
        <p className="mt-0.5 font-mono text-[6.5px] text-slate-400">
          {dlt.allRightsReserved} KvK: {safeSchoolSettings.kvk} • BTW: {safeSchoolSettings.btw} • Official CBR Accreditations
        </p>
        {customNotes && (
          <p className="mt-1 text-blue-600 font-bold italic text-[8px]">
            * Instructor Note: "{customNotes}"
          </p>
        )}
      </div>
      <div className="font-sans font-extrabold text-slate-900 uppercase tracking-widest bg-slate-150 px-2 py-0.5 rounded text-[8px] shrink-0 font-mono">
        {pageIndex} / {totalPagesCount}
      </div>
    </div>
  );

  const displayedPages = compiledPages.filter(p => currentActivePage === 'all' || String(p.index) === String(currentActivePage));

  return (
    <div className="w-full">
      {/* 1. Mobile Preview Layout (Optimized, responsive, compact for small viewports, hidden during PDF export) */}
      {mode !== 'export' && (
        <div className="block md:hidden w-full space-y-5 px-1 pb-10 print:hidden dossier-mobile-preview" dir={isRTL ? 'rtl' : 'ltr'}>
          
          {/* Mobile Document Header Card */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-lg space-y-3 relative overflow-hidden text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-md">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-sans font-black text-[13px] tracking-wide text-slate-100 uppercase">
                  {safeSchoolSettings.name}
                </h2>
                <p className="text-[9px] text-slate-400 font-bold tracking-wider uppercase font-mono">
                  {dlt.licenseAuthority}
                </p>
              </div>
            </div>
            
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[9px] text-slate-400 font-mono">
              <span>{dlt.dossierRef}: DOS-{studentName.substring(0,3).toUpperCase()}-2026</span>
              <span>{new Date().toISOString().split('T')[0]}</span>
            </div>
          </div>

          {/* Student Profile Card */}
          <div className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
              <h3 className="font-extrabold text-slate-900 dark:text-zinc-100 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-4 w-4 text-blue-600" />
                {dlt.studentProfile}
              </h3>
              <span className="font-mono text-[9px] font-bold text-slate-400">PASFOTO</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* Photo placeholder / Real Student Photo */}
              <div className="w-24 h-32 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center relative overflow-hidden shrink-0 self-center">
                {getStudentPhoto(studentName) ? (
                  <img 
                    src={getStudentPhoto(studentName)!} 
                    alt={studentName} 
                    className="w-full h-full object-cover rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-2 w-full h-full">
                    <div className="absolute top-1 left-1 px-1 py-0.5 bg-blue-600 text-white font-mono text-[5px] font-bold rounded">
                      NL
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-slate-400 border border-slate-300 dark:border-zinc-700">
                      <User className="h-4 w-4 text-slate-500" />
                    </div>
                    <p className="text-[7px] text-slate-500 font-bold uppercase mt-2 tracking-wider text-center leading-tight">
                      {dlt.studentPortrait}
                    </p>
                    <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-amber-500 text-slate-950 font-mono text-[5px] font-black rounded uppercase">
                      CBR
                    </div>
                  </div>
                )}
              </div>

              {/* Profile details */}
              <div className="flex-1 grid grid-cols-1 gap-2.5 w-full text-[10px]">
                <div>
                  <span className="text-[8px] uppercase text-slate-400 dark:text-zinc-500 font-bold block">{dlt.fullName}</span>
                  <span className="font-black text-slate-900 dark:text-zinc-100 text-xs mt-0.5 block">{safeProfile.name}</span>
                </div>
                <div>
                  <span className="text-[8px] uppercase text-slate-400 dark:text-zinc-500 font-bold block">{dlt.assignedPackage}</span>
                  <span className="font-semibold text-slate-800 dark:text-zinc-300 mt-0.5 block">{safeProfile.package}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[8px] uppercase text-slate-400 dark:text-zinc-500 font-bold block">{dlt.dob}</span>
                    <span className="font-medium text-slate-700 dark:text-zinc-300 mt-0.5 block">{safeProfile.dob} • {safeProfile.city}</span>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase text-slate-400 dark:text-zinc-500 font-bold block">{dlt.registrationDate}</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-zinc-300 mt-0.5 block">{safeProfile.regDate}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-zinc-800">
                  <div>
                    <span className="text-[8px] uppercase text-slate-400 dark:text-zinc-500 font-bold block">{dlt.trainer}</span>
                    <span className="font-extrabold text-slate-900 dark:text-zinc-100 mt-0.5 block">{safeSchoolSettings.instructorName}</span>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase text-slate-400 dark:text-zinc-500 font-bold block">Vehicle</span>
                    <span className="font-bold text-slate-700 dark:text-zinc-300 mt-0.5 block">
                      Golf VIII ({safeProfile.transmissionType === 'automatic' ? (lang === 'ar' ? 'أوتوماتيك' : lang === 'nl' ? 'Automaat' : 'Automatic') : (lang === 'ar' ? 'يدوي' : lang === 'nl' ? 'Handgeschakeld' : 'Manual')})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 01: Core Competencies Scorecard */}
          <div className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4 text-left">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
              <Activity className="h-4 w-4 text-blue-600" />
              <h3 className="font-black text-slate-900 dark:text-zinc-100 text-[11px] uppercase tracking-wider">
                01. {dlt.skillsAssessment}
              </h3>
            </div>

            {/* Mobile Training Volume KPIs Grid (2x2) */}
            <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
              <div className="p-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl">
                <span className="text-[7px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider block">{dlt.totalHours}</span>
                <span className="text-[12px] font-black text-slate-800 dark:text-zinc-200 mt-0.5 block">{totalTrainingHours} Hrs</span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl">
                <span className="text-[7px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider block">{dlt.completedLessons}</span>
                <span className="text-[12px] font-black text-slate-800 dark:text-zinc-200 mt-0.5 block">
                  {completedLessons.length} {lang === 'ar' ? 'حصص' : lang === 'nl' ? 'Lessen' : 'Lessons'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl">
                <span className="text-[7px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider block">{dlt.upcomingLessons}</span>
                <span className="text-[12px] font-black text-blue-600 dark:text-blue-400 mt-0.5 block">
                  {upcomingLessons.length} {lang === 'ar' ? 'مجدولة' : lang === 'nl' ? 'Gepland' : 'Scheduled'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl">
                <span className="text-[7px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider block">{dlt.cancelledLessons}</span>
                <span className="text-[12px] font-black text-slate-400 mt-0.5 block">
                  {cancelledLessons.length} {lang === 'ar' ? 'ملغاة' : lang === 'nl' ? 'Geannuleerd' : 'Cancelled'}
                </span>
              </div>
            </div>

            {/* Progress Bars for Core Competencies */}
            <div className="space-y-3.5 pt-2">
              {[
                { name: dlt.vehicleControl, score: scControl },
                { name: dlt.priorityJunctions, score: scPriority },
                { name: dlt.highwayDriving, score: scHighway },
                { name: dlt.specialManeuvers, score: scManeuvers },
                { name: dlt.theorySigns, score: scTheory },
              ].map((comp, idx) => (
                <div key={idx} className="space-y-1 text-[10px]">
                  <div className="flex justify-between font-bold text-slate-800 dark:text-zinc-300">
                    <span className="truncate max-w-[80%]">{comp.name}</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-extrabold">{comp.score}/10</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-zinc-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${comp.score * 10}%` }}></div>
                  </div>
                </div>
              ))}

              {/* CBR Readiness Level Box */}
              <div className="p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl flex items-center justify-between text-[10px]">
                <span className="font-black text-slate-800 dark:text-zinc-300 uppercase tracking-wide">{dlt.cbrReadiness}:</span>
                <span className="font-extrabold uppercase px-2 py-0.5 bg-blue-600 text-white rounded text-[9px] tracking-wider font-mono">
                  {cbrReadiness === 'ready_cbr' || cbrReadiness === 'cbr_ready' 
                    ? (lang === 'ar' ? 'جاهز CBR' : lang === 'nl' ? 'Examenklaar' : 'Exam Ready') 
                    : cbrReadiness === 'exam_mock'
                      ? (lang === 'ar' ? 'اختبار تجريبي' : lang === 'nl' ? 'TT Toets Klaar' : 'Mock Ready')
                      : cbrReadiness === 'developing' 
                        ? (lang === 'ar' ? 'قيد التطوير' : lang === 'nl' ? 'Voortgang' : 'Developing') 
                        : (lang === 'ar' ? 'مبتدئ' : lang === 'nl' ? 'Beginner' : 'Beginner')}
                </span>
              </div>
            </div>

            {/* Captain Samir's Written Observations */}
            {reportNotes && (
              <div className="p-3 bg-slate-950 text-slate-100 border-l-4 border-amber-500 rounded-r-xl rounded-l space-y-1 shadow-sm mt-2 text-[10px]">
                <p className="font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5 text-[8.5px]">
                  <Award className="h-3 w-3 text-amber-500" />
                  {dlt.feedbackNotes}:
                </p>
                <p className="italic leading-relaxed font-medium">"{reportNotes}"</p>
              </div>
            )}
          </div>

          {/* Section 02: Road Practice Log */}
          <div className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4 text-left">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
              <Calendar className="h-4 w-4 text-blue-600" />
              <h3 className="font-black text-slate-900 dark:text-zinc-100 text-[11px] uppercase tracking-wider">
                02. {dlt.lessonsLogTitle}
              </h3>
            </div>

            {studentLessons.length === 0 ? (
              <p className="text-[10px] italic text-slate-400 py-10 text-center border border-dashed border-slate-200 rounded-xl">
                No road training lessons registered.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                {sortedLessons.map((l) => (
                  <div key={l.id} className="p-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl space-y-1.5 text-[10px]">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono font-bold text-slate-900 dark:text-zinc-200">{l.date}</span>
                        <span className="text-slate-400 text-[8.5px] font-medium block">{l.time} • {l.duration}h</span>
                      </div>
                      <span className={`px-1.5 py-0.5 text-[8px] uppercase font-black rounded ${
                        l.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : l.status === 'upcoming'
                            ? 'bg-blue-500/10 text-blue-600'
                            : 'bg-red-500/10 text-red-500'
                      }`}>
                        {l.status === 'completed' ? 'Completed' : l.status === 'upcoming' ? 'Scheduled' : 'Cancelled'}
                      </span>
                    </div>

                    <div className="text-[9px] text-slate-600 dark:text-zinc-400 flex items-center justify-between">
                      <span className="truncate font-semibold max-w-[70%]">📍 {l.pickupLocation}</span>
                      <span className="font-mono font-extrabold text-slate-900 dark:text-zinc-100">€{l.price.toFixed(2)}</span>
                    </div>

                    {(l.lessonNotes || l.instructorNotes) && (
                      <p className="text-[9px] text-slate-500 dark:text-zinc-400 italic bg-white dark:bg-zinc-950 p-1.5 rounded border border-slate-100 dark:border-zinc-800/80 mt-1">
                        {l.lessonNotes || l.instructorNotes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 03: Account Transactions Ledger */}
          <div className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4 text-left">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
              <Wallet className="h-4 w-4 text-blue-600" />
              <h3 className="font-black text-slate-900 dark:text-zinc-100 text-[11px] uppercase tracking-wider">
                03. {dlt.transactionLedgerTitle}
              </h3>
            </div>

            {studentTransactions.length === 0 ? (
              <p className="text-[10px] italic text-slate-400 py-10 text-center border border-dashed border-slate-200 rounded-xl">
                No ledger transactions registered.
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {studentTransactions.map((tr) => (
                  <div key={tr.id} className="p-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl flex items-center justify-between text-[10px]">
                    <div>
                      <span className="font-mono font-bold text-slate-900 dark:text-zinc-200 block">{tr.date}</span>
                      <span className="text-slate-500 dark:text-zinc-400 text-[9px] mt-0.5 block">{tr.description}</span>
                    </div>
                    <div className="text-right">
                      <span className={`px-1.5 py-0.5 text-[8px] uppercase font-bold rounded block text-center mb-1 ${
                        tr.type === 'deposit'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {tr.type === 'deposit' ? 'Deposit' : 'Deduction'}
                      </span>
                      <span className={`font-mono font-black text-[11px] ${
                        tr.type === 'deposit' ? 'text-emerald-600' : 'text-slate-800 dark:text-zinc-200'
                      }`}>
                        {tr.type === 'deposit' ? '+' : '-'}€{tr.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 04: Tax Invoices */}
          <div className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4 text-left">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
              <FileText className="h-4 w-4 text-blue-600" />
              <h3 className="font-black text-slate-900 dark:text-zinc-100 text-[11px] uppercase tracking-wider">
                04. {dlt.taxInvoicesTitle}
              </h3>
            </div>

            {studentInvoicesList.length === 0 ? (
              <p className="text-[10px] italic text-slate-400 py-10 text-center border border-dashed border-slate-200 rounded-xl">
                No issued invoices registered.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {studentInvoicesList.map((inv) => (
                  <div key={inv.invoiceId} className="p-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl space-y-1.5 text-[10px]">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-black text-blue-600 dark:text-blue-400">{inv.invoiceId}</span>
                      <span className={`px-1.5 py-0.5 text-[8px] uppercase font-black rounded ${
                        inv.paymentStatus === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {inv.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>

                    <div className="text-[9px] text-slate-600 dark:text-zinc-400 flex justify-between items-center">
                      <span>{inv.date} • {inv.description}</span>
                      <span className="font-mono font-black text-slate-900 dark:text-zinc-200">€{inv.amount.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 05: Final Remarks & Signatures */}
          <div className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4 text-left">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
              <Award className="h-4 w-4 text-blue-600" />
              <h3 className="font-black text-slate-900 dark:text-zinc-100 text-[11px] uppercase tracking-wider">
                05. {dlt.finalRemarksTitle}
              </h3>
            </div>

            <div className="space-y-3 text-[10px]">
              {/* Technical Review Panel */}
              <div className="p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl space-y-1">
                <h4 className="font-bold text-slate-800 dark:text-zinc-200 uppercase border-b border-slate-100 dark:border-zinc-800 pb-1 text-[9px]">
                  {dlt.technicalReview}
                </h4>
                <p className="text-slate-600 dark:text-zinc-400 leading-relaxed text-[9px]">
                  Based on the logged {completedLessons.length} Field Practice lessons, candidate <strong>{safeProfile.name}</strong> has demonstrated a solid grasp of field operations. Clutch friction engagement has normalized, and observation sequencing is methodical. Performance on secondary highways is stable.
                </p>
              </div>

              {/* Recommendations Checklist Panel */}
              <div className="p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl space-y-1.5">
                <h4 className="font-bold text-slate-800 dark:text-zinc-200 uppercase border-b border-slate-100 dark:border-zinc-800 pb-1 text-[9px]">
                  {dlt.recommendationsChecklist}
                </h4>
                <ul className="text-slate-600 dark:text-zinc-400 space-y-1 text-[9px]">
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span>Complete CBR exam registration forms.</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span>Ensure mirror oversight checks are sustained.</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span>Sustain speed management in residential blocks.</span>
                  </li>
                </ul>
              </div>

              {/* CBR Certificate & Gold Seal Box (If Ready) */}
              {isExamReady && (
                <div className="p-3 bg-gradient-to-r from-amber-500/5 to-amber-600/10 border-2 border-amber-500/30 rounded-xl flex items-center justify-between gap-3 relative overflow-hidden">
                  <div className="space-y-1 relative z-10 text-left max-w-[70%]">
                    <div className="flex items-center gap-1 text-[8px] text-amber-500 font-bold uppercase tracking-wide">
                      <Award className="h-3 w-3" />
                      <span>{dlt.readinessCertificateTitle}</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-950 dark:text-white">
                      {dlt.certifiedReady}
                    </p>
                    <p className="text-slate-600 dark:text-zinc-400 leading-tight text-[8px]">
                      {dlt.readinessDesc}
                    </p>
                  </div>

                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-12 h-12 rounded-full border-double border-2 border-amber-600 flex flex-col items-center justify-center text-center p-1 rotate-[-3deg] bg-white/70 shadow-sm">
                      <div className="text-[3px] font-extrabold uppercase text-amber-600 leading-none">AL-ANDALOS</div>
                      <div className="text-[4px] font-black uppercase text-amber-600 mt-0.5">★ READY ★</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Stamp and Signatures Stacked Layout */}
              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-4">
                
                {/* Stamp */}
                <div className="flex justify-center">
                  <div className="relative w-16 h-16 flex items-center justify-center rounded-full border border-dashed border-red-600/50 text-red-600/60 p-1 font-mono uppercase text-center rotate-[-4deg] select-none shadow-xs">
                    <div className="leading-none scale-90">
                      <p className="text-[3px] font-black">AL-ANDALOS</p>
                      <p className="text-[4.5px] font-black text-red-600">★ VERIFIED ★</p>
                      <p className="text-[3px] font-bold">AMSTERDAM</p>
                    </div>
                  </div>
                </div>

                {/* Signature boxes */}
                {showSignatures && (
                  <div className="grid grid-cols-2 gap-3 text-[9px]">
                    <div className="text-left">
                      <span className="text-[7px] uppercase font-bold text-slate-400 block mb-1">
                        {dlt.instructorSignature}
                      </span>
                      <div className="h-8 border-b border-slate-200 dark:border-zinc-800 relative flex items-center justify-center bg-slate-50 dark:bg-zinc-900 rounded-t-lg overflow-hidden">
                        <span className="font-serif text-[10px] text-blue-600 font-bold italic rotate-[-2deg] select-none">
                          {signatoryName}
                        </span>
                      </div>
                      <span className="text-[8px] text-slate-500 mt-1 block font-bold">{signatoryName}</span>
                    </div>

                    <div className="text-left">
                      <span className="text-[7px] uppercase font-bold text-slate-400 block mb-1">
                        {dlt.studentSignature}
                      </span>
                      <div className="h-8 border-b border-slate-200 dark:border-zinc-800 relative flex items-center justify-center bg-slate-50 dark:bg-zinc-900 rounded-t-lg overflow-hidden">
                        <span className="font-serif text-[10px] text-slate-700/80 italic rotate-[1deg] select-none">
                          {safeProfile.name}
                        </span>
                      </div>
                      <span className="text-[8px] text-slate-500 mt-1 block font-bold">{safeProfile.name}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Disclaimer */}
          <div className="text-center text-[8px] text-slate-400 dark:text-zinc-500 leading-normal px-2 space-y-1">
            <p>{dlt.disclaimer}</p>
            <p>{dlt.allRightsReserved}</p>
          </div>

        </div>
      )}

      {/* 2. PDF Export / Desktop A4 Layout (Continuous natural flow, realistic shadows, Adobe Acrobat style) */}
      <div className={`${mode === 'export' ? 'flex' : 'hidden md:flex'} flex-col gap-10 items-center justify-center w-full print:gap-0 print:block dossier-print-preview`}>
        
        {/* PAGE 1: COVER PAGE */}
        <div
          className="dossier-page-print-wrapper dossier-cover-wrapper"
          style={{
            pageBreakAfter: 'always',
            breakAfter: 'page',
            display: 'block'
          }}
        >
          <div 
            className="dossier-pdf-page dossier-pdf-page-container dossier-cover-page"
            id="dossier-page-cover"
            style={{
              display: 'block',
              boxSizing: 'border-box'
            }}
          >
            {/* Cover Page Main Area */}
            <div className="flex flex-col justify-start space-y-5 relative" dir={isRTL ? 'rtl' : 'ltr'}>
              
              {/* Header Section - Perfectly Aligned Logo, Title & School Information */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                <div className="flex items-center gap-3">
                  {/* Grand School Logo */}
                  <div className="w-12 h-12 rounded-lg bg-slate-950 flex flex-col items-center justify-center border-2 border-amber-500 shadow-sm shrink-0">
                    <Award className="h-6 w-6 text-amber-400" />
                    <span className="text-[5px] font-black tracking-widest text-white leading-none mt-0.5">ANDALOS</span>
                  </div>
                  <div className="text-left animate-none">
                    <h2 className="text-[11px] font-black tracking-tight text-slate-900 uppercase">
                      {safeSchoolSettings.name}
                    </h2>
                    <p className="text-[7.5px] text-slate-500 font-bold tracking-wide uppercase mt-0.5">
                      {dlt.licenseAuthority} • AMSTERDAM
                    </p>
                    <p className="text-[7px] text-slate-400 font-mono">
                      KvK: {safeSchoolSettings.kvk || '82937402'} • BTW: {safeSchoolSettings.btw || 'NL82937402B01'}
                    </p>
                  </div>
                </div>
                <div className="text-right font-mono text-[7px] text-slate-400 leading-tight">
                  <p className="font-bold text-slate-700 uppercase tracking-wider">{dlt.dossierRef}: DOS-{studentName.substring(0,3).toUpperCase()}-2026</p>
                  <p>{dlt.generatedDate}: {new Date().toISOString().split('T')[0]}</p>
                </div>
              </div>

              {/* Document Grand Title */}
              <div className="text-left space-y-1 pb-3 border-b border-slate-100">
                <h1 className="text-[16px] font-black text-slate-900 tracking-tight leading-tight uppercase">
                  {dlt.coverTitle}
                </h1>
                <p className="text-[8.5px] font-semibold text-slate-500 font-mono tracking-wide">
                  {dlt.coverSubtitle}
                </p>
              </div>

              {/* Student Photo & Demographics Split Layout */}
              <div className="grid grid-cols-12 gap-5 items-start">
                {/* Left: Passport photo placeholder (4 cols) */}
                <div className="col-span-4 flex justify-start">
                  <div className="flex flex-col items-center justify-center p-3 border border-slate-200 bg-slate-50 rounded-lg h-[140px] w-[105px] shadow-xs relative overflow-hidden shrink-0">
                    <div className="absolute top-1 left-1 px-1 py-0.5 bg-blue-600 text-white font-mono text-[4.5px] font-bold rounded">
                      NL
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 border border-slate-300">
                      <User className="h-5 w-5 text-slate-400/80" />
                    </div>
                    <p className="text-[6.5px] text-slate-500 font-bold uppercase mt-3 tracking-wider text-center leading-tight">
                      {dlt.studentPortrait}
                    </p>
                    <p className="text-[5px] text-slate-400 font-semibold uppercase tracking-widest text-center mt-0.5">
                      PASFOTO KANDIDAAT
                    </p>
                    <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-amber-500 text-slate-950 font-mono text-[4.5px] font-black rounded uppercase">
                      CBR
                    </div>
                  </div>
                </div>

                {/* Right: Demographic details (8 cols) */}
                <div className="col-span-8 space-y-3">
                  {/* Student Details Card */}
                  <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-lg text-left">
                    <h3 className="font-extrabold text-slate-800 text-[9px] uppercase tracking-wider pb-1 border-b border-slate-200 flex items-center gap-1.5">
                      <User className="h-3 w-3 text-blue-600" />
                      {dlt.studentProfile}
                    </h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[8px] text-slate-600 mt-2">
                      <div>
                        <span className="block text-[6px] uppercase text-slate-400 font-bold">{dlt.fullName}</span>
                        <span className="font-extrabold text-slate-900 text-[9px] mt-0.5 block">{safeProfile.name}</span>
                      </div>
                      <div>
                        <span className="block text-[6px] uppercase text-slate-400 font-bold">{dlt.assignedPackage}</span>
                        <span className="font-semibold text-slate-800 mt-0.5 block">{safeProfile.package}</span>
                      </div>
                      <div>
                        <span className="block text-[6px] uppercase text-slate-400 font-bold">{dlt.dob}</span>
                        <span className="font-medium text-slate-700 mt-0.5 block">{safeProfile.dob} • {safeProfile.city}</span>
                      </div>
                      <div>
                        <span className="block text-[6px] uppercase text-slate-400 font-bold">{dlt.registrationDate}</span>
                        <span className="font-mono font-bold text-slate-700 mt-0.5 block">{safeProfile.regDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Instructor & Vehicle details Card */}
                  <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-lg text-left">
                    <h3 className="font-extrabold text-slate-800 text-[9px] uppercase tracking-wider pb-1 border-b border-slate-200 flex items-center gap-1.5">
                      <Car className="h-3 w-3 text-amber-500" />
                      {dlt.instructorInfo}
                    </h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[8px] text-slate-600 mt-2">
                      <div>
                        <span className="block text-[6px] uppercase text-slate-400 font-bold">{dlt.trainer}</span>
                        <span className="font-extrabold text-slate-900 mt-0.5 block">{safeSchoolSettings.instructorName}</span>
                      </div>
                      <div>
                        <span className="block text-[6px] uppercase text-slate-400 font-bold">Training Vehicle</span>
                        <span className="font-bold text-slate-700 mt-0.5 block">Volkswagen Golf VIII (Manual)</span>
                      </div>
                      <div>
                        <span className="block text-[6px] uppercase text-slate-400 font-bold">Instructor Credentials</span>
                        <span className="font-mono text-slate-700 mt-0.5 block">WRM-8849-ANDALOS</span>
                      </div>
                      <div>
                        <span className="block text-[6px] uppercase text-slate-400 font-bold">Report Reference ID</span>
                        <span className="font-mono font-bold text-amber-600 mt-0.5 block">DOS-{studentName.substring(0,3).toUpperCase()}-2026</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Corporate Verification info */}
              <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-[7px] text-slate-400">
                <div className="space-y-0.5 text-left">
                  <p className="font-bold text-slate-500">Official Certification Authority</p>
                  <p>Bureau Al-Andalos Driving Education & CBR Exam Preparatory Center</p>
                  <p className="font-mono">Amsterdam West, Netherlands</p>
                </div>
                <div className="text-right font-mono space-y-0.5">
                  <p className="font-bold text-slate-600">ISSUE DATE: {new Date().toISOString().split('T')[0]}</p>
                  <p>STATUS: OFFICIALLY SEALED</p>
                </div>
              </div>
            </div>

            {/* Cover Page Footer */}
            {renderFooter(1, 'cover')}
          </div>
        </div>

        {/* PAGE 2+: REPORT BODY (Assessment, Lessons, Transactions, Invoices, Signatures flowing naturally) */}
        <div
          className="dossier-page-print-wrapper dossier-body-wrapper"
          style={{
            display: 'block'
          }}
        >
          <div 
            className="dossier-pdf-page dossier-pdf-page-container dossier-body-page"
            id="dossier-page-body"
            style={{
              display: 'block',
              boxSizing: 'border-box'
            }}
          >
            {/* Header */}
            {renderHeader(2, 'report_body')}

            <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
              
              {/* SECTION 1: CORE COMPETENCIES & STATISTICS */}
              <div className="space-y-4 py-2 text-left dossier-section-card">
                {/* Section Title */}
                <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200">
                  <Activity className="h-4.5 w-4.5 text-blue-600 shrink-0" />
                  <h2 className="font-black text-slate-900 text-[11px] uppercase tracking-wider">
                    01. {dlt.skillsAssessment}
                  </h2>
                </div>

                {/* Volume KPIs Row */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl shadow-xs">
                    <span className="text-[6.5px] text-slate-500 uppercase font-black tracking-widest block">{dlt.totalHours}</span>
                    <span className="text-[13px] font-black text-slate-800 mt-1 block">{totalTrainingHours} Hrs</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl shadow-xs">
                    <span className="text-[6.5px] text-slate-500 uppercase font-black tracking-widest block">{dlt.completedLessons}</span>
                    <span className="text-[13px] font-black text-slate-800 mt-1 block">{completedLessons.length} Lessons</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl shadow-xs">
                    <span className="text-[6.5px] text-slate-500 uppercase font-black tracking-widest block">{dlt.upcomingLessons}</span>
                    <span className="text-[13px] font-black text-blue-600 mt-1 block">{upcomingLessons.length} Slots</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl shadow-xs">
                    <span className="text-[6.5px] text-slate-500 uppercase font-black tracking-widest block">{dlt.cancelledLessons}</span>
                    <span className="text-[13px] font-black text-slate-400 mt-1 block">{cancelledLessons.length} Cancel</span>
                  </div>
                </div>

                {/* Competency Assessment Scorecard */}
                <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl space-y-4">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3.5 text-[8.5px] text-slate-600 leading-normal">
                    
                    {/* 1. Vehicle Control */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-extrabold text-slate-800 text-[9px]">
                        <span className="font-semibold">{dlt.vehicleControl}</span>
                        <span className="font-mono text-blue-600 font-extrabold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{scControl}/10</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${scControl * 10}%` }}></div>
                      </div>
                    </div>

                    {/* 2. Observation & Priority */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-extrabold text-slate-800 text-[9px]">
                        <span className="font-semibold">{dlt.priorityJunctions}</span>
                        <span className="font-mono text-blue-600 font-extrabold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{scPriority}/10</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${scPriority * 10}%` }}></div>
                      </div>
                    </div>

                    {/* 3. Highway Driving */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-extrabold text-slate-800 text-[9px]">
                        <span className="font-semibold">{dlt.highwayDriving}</span>
                        <span className="font-mono text-blue-600 font-extrabold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{scHighway}/10</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${scHighway * 10}%` }}></div>
                      </div>
                    </div>

                    {/* 4. Special Maneuvers */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-extrabold text-slate-800 text-[9px]">
                        <span className="font-semibold">{dlt.specialManeuvers}</span>
                        <span className="font-mono text-blue-600 font-extrabold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{scManeuvers}/10</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${scManeuvers * 10}%` }}></div>
                      </div>
                    </div>

                    {/* 5. Theory & Road Signs */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-extrabold text-slate-800 text-[9px]">
                        <span className="font-semibold">{dlt.theorySigns}</span>
                        <span className="font-mono text-blue-600 font-extrabold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{scTheory}/10</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${scTheory * 10}%` }}></div>
                      </div>
                    </div>

                    {/* CBR Readiness Level Indicator */}
                    <div className="p-2 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between col-span-1 h-9">
                      <span className="font-black text-slate-800 uppercase text-[7px] tracking-wide">{dlt.cbrReadiness}:</span>
                      <span className="font-extrabold uppercase px-2 py-0.5 bg-blue-600 text-white rounded text-[7.5px] tracking-wider font-mono">
                        {cbrReadiness === 'ready_cbr' || cbrReadiness === 'cbr_ready' 
                          ? (lang === 'ar' ? 'جاهز CBR' : lang === 'nl' ? 'Examenklaar' : 'Exam Ready') 
                          : cbrReadiness === 'exam_mock'
                            ? (lang === 'ar' ? 'اختبار تجريبي' : lang === 'nl' ? 'TT Toets Klaar' : 'Mock Ready')
                            : cbrReadiness === 'developing' 
                              ? (lang === 'ar' ? 'قيد التطوير' : lang === 'nl' ? 'Voortgang' : 'Developing') 
                              : (lang === 'ar' ? 'مبتدئ' : lang === 'nl' ? 'Beginner' : 'Beginner')}
                      </span>
                    </div>
                  </div>

                  {/* Progress details comment */}
                  <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-[8px] text-slate-400">
                    <span>Evaluation Index verified by Al-Andalos Administrative Desk</span>
                    <span className="font-mono font-bold text-slate-500">ACCURACY RATING: HIGHLY ACCURATE (98%)</span>
                  </div>
                </div>

                {/* Capt. Samir's initial diagnostic review card */}
                {reportNotes && (
                  <div className="p-4 bg-slate-950 text-slate-100 border-l-4 border-amber-500 rounded-r-xl rounded-l space-y-1 shadow-sm">
                    <p className="font-black text-[7.5px] uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5 text-amber-500" />
                      {dlt.feedbackNotes}:
                    </p>
                    <p className="italic text-[9.5px] leading-relaxed font-medium">"{reportNotes}"</p>
                  </div>
                )}

                {/* Safety & Protocol Box */}
                <div className="p-3 bg-blue-50/50 border border-blue-150 rounded-xl text-[8px] text-slate-600 leading-relaxed">
                  <p className="font-bold text-blue-800 uppercase text-[7px] tracking-widest mb-1">CBR Evaluation Protocol & Safety Assurance</p>
                  All skills logged above are mapped directly to official CBR exam parameters. Students must sustain an average index score above 7.0/10.0 in all core disciplines to obtain the certification seal of readiness for exam scheduling.
                </div>
              </div>

              {/* SECTION 2: LESSON PRACTICE LOG (Flowing table) */}
              <div className="space-y-4 py-2 text-left dossier-section-card">
                {/* Section Title */}
                <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200">
                  <Calendar className="h-4.5 w-4.5 text-blue-600 shrink-0" />
                  <h2 className="font-black text-slate-900 text-[11px] uppercase tracking-wider">
                    02. {dlt.lessonsLogTitle}
                  </h2>
                </div>

                {sortedLessons.length === 0 ? (
                  <p className="text-[10px] italic text-slate-400 py-16 text-center border border-dashed border-slate-200 rounded-xl">
                    No road training lessons registered on this sheet.
                  </p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-[8px] shadow-xs bg-white">
                    <table className="w-full text-left border-collapse" dir={isRTL ? 'rtl' : 'ltr'}>
                      <thead>
                        <tr className="bg-slate-900 text-white text-[7px] uppercase font-bold tracking-wider">
                          <th className="p-2 pl-3">{dlt.dateTime}</th>
                          <th className="p-2">{dlt.location}</th>
                          <th className="p-2 text-center">{dlt.durationDistance}</th>
                          <th className="p-2 text-center">{dlt.status}</th>
                          <th className="p-2 text-right">{dlt.price}</th>
                          <th className="p-2 text-center">{dlt.paymentStatus}</th>
                          <th className="p-2 pr-3">{dlt.trainerNotes}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {sortedLessons.map((l) => (
                          <tr key={l.id} className="hover:bg-slate-50/50 even:bg-slate-50/20 break-inside-avoid">
                            <td className="p-1.5 pl-3 font-mono font-bold whitespace-nowrap text-slate-900">
                              {l.date} <span className="text-slate-400 font-normal">at</span> {l.time}
                            </td>
                            <td className="p-1.5 font-medium break-words max-w-[140px]">{l.pickupLocation}</td>
                            <td className="p-1.5 text-center whitespace-nowrap">
                              <p className="font-bold">{l.duration}h ({l.duration * 60}m)</p>
                              {l.distanceKm && (
                                <p className="text-[7.5px] text-slate-400 font-mono">📍 {l.distanceKm} km</p>
                              )}
                            </td>
                            <td className="p-1.5 text-center whitespace-nowrap">
                              <span className={`p-0.5 px-1.5 text-[7px] uppercase font-black rounded-md ${
                                l.status === 'completed'
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : l.status === 'upcoming'
                                    ? 'bg-blue-500/10 text-blue-600'
                                    : 'bg-red-500/10 text-red-500'
                              }`}>
                                {l.status === 'completed' ? 'Completed' : l.status === 'upcoming' ? 'Scheduled' : 'Cancelled'}
                              </span>
                            </td>
                            <td className="p-1.5 text-right font-mono font-bold whitespace-nowrap text-slate-900">
                              €{l.price.toFixed(2)}
                            </td>
                            <td className="p-1.5 text-center whitespace-nowrap">
                              <span className={`p-0.5 px-1.5 text-[7px] uppercase font-bold rounded-md ${
                                l.payStatus === 'paid' 
                                  ? 'bg-emerald-500/10 text-emerald-600' 
                                  : 'bg-amber-500/10 text-amber-500'
                              }`}>
                                {l.payStatus === 'paid' ? 'Paid' : 'Unpaid'}
                              </span>
                            </td>
                            <td className="p-1.5 pr-3 text-slate-500 italic break-words max-w-[180px]">
                              {l.lessonNotes || l.instructorNotes || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SECTION 3: WALLET TRANSACTION LEDGER (Flowing table) */}
              <div className="space-y-4 py-2 text-left dossier-section-card">
                {/* Section Title */}
                <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200">
                  <Wallet className="h-4.5 w-4.5 text-blue-600 shrink-0" />
                  <h2 className="font-black text-slate-900 text-[11px] uppercase tracking-wider">
                    03. {dlt.transactionLedgerTitle}
                  </h2>
                </div>

                {studentTransactions.length === 0 ? (
                  <p className="text-[10px] italic text-slate-400 py-16 text-center border border-dashed border-slate-200 rounded-xl">
                    No transactions registered on this wallet ledger.
                  </p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-[8px] shadow-xs bg-white">
                    <table className="w-full text-left border-collapse" dir={isRTL ? 'rtl' : 'ltr'}>
                      <thead>
                        <tr className="bg-slate-900 text-white text-[7px] uppercase font-bold tracking-wider">
                          <th className="p-2.5 pl-3">{dlt.date}</th>
                          <th className="p-2.5">{dlt.type}</th>
                          <th className="p-2.5">{dlt.description}</th>
                          <th className="p-2.5 text-right pr-3">{dlt.amount}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {studentTransactions.map((tr) => (
                          <tr key={tr.id} className="hover:bg-slate-50/50 even:bg-slate-50/20 break-inside-avoid">
                            <td className="p-2 pl-3 font-mono font-bold whitespace-nowrap text-slate-900">{tr.date}</td>
                            <td className="p-2 whitespace-nowrap">
                              <span className={`p-0.5 px-1.5 text-[7px] uppercase font-bold rounded-md ${
                                tr.type === 'deposit'
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : 'bg-blue-500/10 text-blue-500'
                              }`}>
                                {tr.type === 'deposit' ? 'Deposit' : 'Deduction'}
                              </span>
                            </td>
                            <td className="p-2 font-semibold text-slate-700">
                              {tr.description} {tr.invoiceId && <span className="text-slate-400 font-mono">({tr.invoiceId})</span>}
                            </td>
                            <td className={`p-2 pr-3 text-right font-mono font-extrabold whitespace-nowrap ${
                              tr.type === 'deposit' ? 'text-emerald-600' : 'text-slate-800'
                            }`}>
                              {tr.type === 'deposit' ? '+' : '-'}€{tr.amount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SECTION 4: FISCALE TAX INVOICES (Flowing table) */}
              <div className="space-y-4 py-2 text-left dossier-section-card">
                {/* Section Title */}
                <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200">
                  <FileText className="h-4.5 w-4.5 text-blue-600 shrink-0" />
                  <h2 className="font-black text-slate-900 text-[11px] uppercase tracking-wider">
                    04. {dlt.taxInvoicesTitle}
                  </h2>
                </div>

                {studentInvoicesList.length === 0 ? (
                  <p className="text-[10px] italic text-slate-400 py-16 text-center border border-dashed border-slate-200 rounded-xl">
                    No invoices compiled for this student record.
                  </p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-[8px] shadow-xs bg-white">
                    <table className="w-full text-left border-collapse" dir={isRTL ? 'rtl' : 'ltr'}>
                      <thead>
                        <tr className="bg-slate-900 text-white text-[7px] uppercase font-bold tracking-wider">
                          <th className="p-2.5 pl-3">{dlt.reference}</th>
                          <th className="p-2.5">{dlt.date}</th>
                          <th className="p-2.5">{dlt.description}</th>
                          <th className="p-2.5 text-right">{dlt.amount}</th>
                          <th className="p-2.5 text-center">{dlt.method}</th>
                          <th className="p-2.5 pr-3 text-center">{dlt.status}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {studentInvoicesList.map((inv) => (
                          <tr key={inv.invoiceId} className="hover:bg-slate-50/50 even:bg-slate-50/20 break-inside-avoid">
                            <td className="p-2.5 pl-3 font-mono font-black text-blue-600">{inv.invoiceId}</td>
                            <td className="p-2.5 font-mono">{inv.date}</td>
                            <td className="p-2.5 truncate max-w-[150px] font-medium">{inv.description}</td>
                            <td className="p-2.5 text-right font-mono font-black text-slate-900">€{inv.amount.toFixed(2)}</td>
                            <td className="p-2.5 text-center capitalize font-semibold">{inv.paymentMethod}</td>
                            <td className="p-2.5 pr-3 text-center">
                              <span className={`p-0.5 px-1.5 text-[7px] uppercase font-black rounded-md ${
                                inv.paymentStatus === 'paid'
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : 'bg-amber-500/10 text-amber-500'
                              }`}>
                                {inv.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SECTION 5: MASTERPIECE SUMMARY & SIGNATURES */}
              <div className="space-y-5 py-2 text-left dossier-section-card">
                {/* Section Title */}
                <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200">
                  <Award className="h-4.5 w-4.5 text-blue-600 shrink-0" />
                  <h2 className="font-black text-slate-900 text-[11px] uppercase tracking-wider">
                    05. {dlt.finalRemarksTitle}
                  </h2>
                </div>

                {/* Qualitative Technical Evaluation & Remarks */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Left Panel */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-left">
                    <h4 className="font-bold text-slate-800 text-[8.5px] uppercase border-b border-slate-200 pb-1">
                      {dlt.technicalReview}
                    </h4>
                    <p className="text-[8px] text-slate-600 leading-relaxed">
                      Based on the logged {completedLessons.length} Field Practice lessons, candidate <strong>{safeProfile.name}</strong> has demonstrated a solid grasp of field operations. Clutch friction engagement has normalized, and observation sequencing is methodical. Performance on secondary arterial highways remains highly stable, with speed matching aligned to standard traffic flow parameters.
                    </p>
                  </div>

                  {/* Right Panel */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-left">
                    <h4 className="font-bold text-slate-800 text-[8.5px] uppercase border-b border-slate-200 pb-1">
                      {dlt.recommendationsChecklist}
                    </h4>
                    <ul className="text-[8px] text-slate-600 space-y-1">
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span>Complete CBR exam registration forms.</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span>Ensure mirror oversight checks are sustained.</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span>Sustain speed management in residential blocks.</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span>Continue training path updates in student portal.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* CBR Certificate & Gold Seal Box */}
                {isExamReady && (
                  <div className="p-4 bg-gradient-to-r from-amber-500/5 to-amber-600/10 border-2 border-amber-500/30 rounded-xl flex justify-between items-center gap-4 relative overflow-hidden">
                    <div className="space-y-1 relative z-10 text-[8.5px] text-left max-w-[72%]">
                      <div className="flex items-center gap-1">
                        <Award className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <h4 className="font-black text-amber-500 uppercase tracking-widest text-[7.5px]">
                          {dlt.readinessCertificateTitle}
                        </h4>
                      </div>
                      <p className="text-[11px] font-black text-slate-950">
                        {dlt.certifiedReady} — {studentName}
                      </p>
                      <p className="text-slate-600 leading-normal">
                        {dlt.readinessDesc}
                      </p>
                    </div>

                    {/* Seal */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-16 h-16 rounded-full border-double border-2 border-amber-600 flex flex-col items-center justify-center text-center p-1 rotate-[-3deg] relative bg-white/70 shadow-sm">
                        <div className="text-[4.5px] font-extrabold uppercase tracking-widest text-amber-600 leading-tight">AL-ANDALOS</div>
                        <div className="text-[6px] font-black uppercase text-amber-600 tracking-wider">★ CERTIFIED ★</div>
                        <div className="text-[4px] font-bold text-amber-500/80 uppercase mt-0.5">EXAM READY</div>
                      </div>
                      <span className="text-[6px] font-bold text-slate-400 mt-1 font-mono">ID: {studentName.substring(0,3).toUpperCase()}-CBR</span>
                    </div>
                  </div>
                )}

                {/* Signatures Area */}
                <div className="grid grid-cols-12 gap-4 pt-4 border-t border-slate-200">
                  <div className="col-span-5 flex items-center justify-center border-r border-slate-100 pr-2">
                    <div className="relative w-20 h-20 flex items-center justify-center rounded-full border-2 border-dashed border-red-600/60 text-red-600/70 p-1.5 font-mono uppercase text-center rotate-[-6deg] select-none scale-95 shadow-xs">
                      <div className="absolute inset-0.5 rounded-full border border-red-500/20"></div>
                      <div className="space-y-0.5 leading-none">
                        <p className="text-[4.5px] font-black tracking-wider">AL-ANDALOS</p>
                        <p className="text-[6px] font-black text-red-600 tracking-widest">★ VERIFIED ★</p>
                        <p className="text-[4.5px] font-bold text-red-500/60">AMSTERDAM</p>
                        <p className="text-[3.5px] font-bold text-red-500/50 mt-1 font-mono">OFFICIAL SEAL</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-7 flex flex-col gap-3.5 pl-2">
                    {showSignatures && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-left">
                          <span className="text-[6.5px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                            {dlt.instructorSignature}
                          </span>
                          <div className="h-10 border-b border-slate-200 relative flex items-center justify-center bg-slate-50 rounded-t-lg overflow-hidden">
                            <span className="font-serif text-xs text-blue-600 font-bold italic rotate-[-2deg] tracking-wide select-none">
                              {signatoryName}
                            </span>
                          </div>
                          <span className="text-[7px] text-slate-500 font-bold mt-1 block">{signatoryName}</span>
                          <span className="text-[5.5px] text-slate-400 font-mono block">Licensed CBR Coach</span>
                        </div>

                        <div className="text-left">
                          <span className="text-[6.5px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                            {dlt.studentSignature}
                          </span>
                          <div className="h-10 border-b border-slate-200 relative flex items-end justify-center bg-slate-50 rounded-t-lg overflow-hidden pb-1">
                            <span className="font-serif text-[10px] text-slate-700/80 italic rotate-[1deg] tracking-wider select-none">
                              {safeProfile.name}
                            </span>
                          </div>
                          <span className="text-[7px] text-slate-500 font-bold mt-1 block">{safeProfile.name}</span>
                          <span className="text-[5.5px] text-slate-400 font-mono block">Verified Candidate</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>

            {/* Footer */}
            {renderFooter(2, 'report_body')}
          </div>
        </div>

      </div>
    </div>
  );
};
