import React from 'react';
import { 
  Wallet, Landmark, ArrowUpRight, ArrowDownLeft, FileText, Download, 
  Info, ShieldCheck 
} from 'lucide-react';
import { TRANSLATIONS, Language, WalletTransaction, SchoolSettings, getSchoolName } from '../types';
import { getLocalTxDesc } from '../utils/translationHelper';
import { isRecordForStudent } from '../utils/identity';

interface StudentWalletProps {
  lang: Language;
  t: typeof TRANSLATIONS['en'];
  transactions: WalletTransaction[];
  setTransactions: (transactions: WalletTransaction[]) => void;
  currentUser: any;
  schoolSettings?: Partial<SchoolSettings> | null;
}

function StudentWalletComponent({ lang, t, transactions, currentUser, schoolSettings }: StudentWalletProps) {
  // Filter transactions using canonical Dual-Read (Student ID > Email > Name fallback)
  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(tx => isRecordForStudent(tx, currentUser));
  }, [transactions, currentUser]);

  // Math totals based on student's actual transactions
  const balance = React.useMemo(() => {
    return filteredTransactions.reduce((acc, curr) => {
      return curr.type === 'deposit' ? acc + curr.amount : acc - curr.amount;
    }, 0);
  }, [filteredTransactions]);

  const totalDeposited = React.useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'deposit')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredTransactions]);

  const totalSpent = React.useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'payment' || t.type === 'adjustment')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredTransactions]);

  // Sort transactions chronologically to calculate accurate previous and new balances
  const chronologicalTx = React.useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      const dateComp = a.date.localeCompare(b.date);
      if (dateComp !== 0) return dateComp;
      return a.id.localeCompare(b.id);
    });
  }, [filteredTransactions]);

  // Calculate cumulative balances at each point
  const runningBalances = React.useMemo(() => {
    const balances = new Map<string, { prev: number; post: number }>();
    let currentAccumulator = 0;
    chronologicalTx.forEach(tx => {
      const prev = currentAccumulator;
      if (tx.type === 'deposit') {
        currentAccumulator += tx.amount;
      } else {
        currentAccumulator -= tx.amount;
      }
      balances.set(tx.id, { prev, post: currentAccumulator });
    });
    return balances;
  }, [chronologicalTx]);

  // Professional premium digital invoice generator
  const triggerDownloadInvoice = (invoiceId: string, item: WalletTransaction) => {
    const { prev, post } = runningBalances.get(item.id) || { prev: 0, post: item.amount };
    
    // Load school settings dynamically from prop or fallback to localStorage
    const savedSettings = schoolSettings || (() => {
      try {
        const saved = localStorage.getItem('drivingschool_school_settings') || localStorage.getItem('al_andalos_school_settings');
        return saved ? JSON.parse(saved) : null;
      } catch (e) {
        console.error(e);
        return null;
      }
    })();

    const isAr = lang === 'ar';
    const isNl = lang === 'nl';
    
    const schoolName = savedSettings?.name || (isAr ? '[اسم المدرسة غير محدد]' : isNl ? '[Schoolnaam niet geconfigureerd]' : '[School Name not configured]');
    const instructorName = savedSettings?.instructorName || "";
    const schoolAddress = savedSettings?.address || "";
    const schoolKvk = savedSettings?.kvk || "";
    const schoolBtw = savedSettings?.btw || "";
    const schoolEmail = savedSettings?.email || "";
    const schoolPhone = savedSettings?.phone || "";
    const studentName = item.studentName || currentUser?.name || (isAr ? 'المتدرب' : 'Student');
    
    const displayAddress = schoolAddress || (isAr ? '[عنوان مدرسة القيادة غير محدد]' : isNl ? '[Adres niet geconfigureerd in Instellingen]' : '[Address not configured in Settings]');
    const displayKvk = schoolKvk || (isAr ? '[رقم السجل التجاري غير محدد]' : isNl ? '[KvK-nummer niet geconfigureerd in Instellingen]' : '[KvK not configured in Settings]');
    const displayBtw = schoolBtw || (isAr ? '[الرقم الضريبي غير محدد]' : isNl ? '[BTW-nummer niet geconfigureerd in Instellingen]' : '[BTW not configured in Settings]');
    const displayEmail = schoolEmail || (isAr ? '[البريد الإلكتروني غير محدد]' : isNl ? '[E-mailadres niet geconfigureerd in Instellingen]' : '[Email not configured in Settings]');
    const displayPhone = schoolPhone || (isAr ? '[رقم الهاتف غير محدد]' : isNl ? '[Telefoonnummer niet geconfigureerd in Instellingen]' : '[Phone not configured in Settings]');

    const labelInvoice = isAr ? 'فاتورة ضريبية رسمية' : isNl ? 'Officiële Factuur' : 'Official Tax Invoice';
    const labelPaidStatus = isAr ? 'مدفوعة بالكامل' : isNl ? 'Volledig Betaald' : 'Paid In Full';
    const labelIssuedBy = isAr ? 'صادرة عن مدرسة القيادة' : isNl ? 'Uitgegeven Door' : 'Issued By';
    const labelBillTo = isAr ? 'فاتورة إلى المتدرب' : isNl ? 'Gefactureerd Aan' : 'Bill To Candidate';
    const labelDateGen = isAr ? 'تاريخ المعاملة' : isNl ? 'Transactiedatum' : 'Transaction Date';
    const labelRef = isAr ? 'رقم مرجع الإيداع' : isNl ? 'Betalingsreferentie' : 'Deposit Reference';
    const labelDesc = isAr ? 'البيان وتفاصيل الإيداع' : isNl ? 'Omschrijving & Details' : 'Description & Deposit Details';
    const labelAmount = isAr ? 'مبلغ الإيداع (يورو)' : isNl ? 'Stortingsbedrag (EUR)' : 'Deposit Amount (EUR)';
    const labelPrevBal = isAr ? 'رصيد المحفظة السابق' : isNl ? 'Vorig Wallet Saldo' : 'Previous Wallet Balance';
    const labelDepAmt = isAr ? 'إجمالي الدفع المقبوض' : isNl ? 'Totaal Ontvangen' : 'Total Amount Received';
    const labelNewBal = isAr ? 'الرصيد المتاح حالياً' : isNl ? 'Nieuw Saldo' : 'New Available Balance';
    const labelThankYou = isAr 
      ? `🎖️ شكراً لاختياركم ${schoolName}! سلامتكم تبدأ بالتعليم المتميز.` 
      : isNl 
        ? `🎖️ Bedankt voor het kiezen van ${schoolName}! Rijveiligheid begint bij topklasse educatie.` 
        : `🎖️ Thank you for choosing ${schoolName}! Driving safety starts with premier elite education.`;
    const labelOfficialCBR = isAr 
      ? `هذا المستند يعتبر إيصالاً رسمياً معتمداً من نظام ${schoolName} لتعبئة المحفظة.` 
      : isNl 
        ? `Dit document dient als officieel stortingsbewijs van ${schoolName}.` 
        : `This document serves as an official deposit confirmation from ${schoolName}.`;
    const toBeConfigured = isAr ? 'قيد التهيئة' : isNl ? 'Nog te configureren' : 'To be configured';

    const invoiceHtml = `<!DOCTYPE html>
<html lang="${lang}" dir="${isAr ? 'rtl' : 'ltr'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceId} - ${schoolName}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        @page {
            size: A4 portrait;
            margin: 10mm 12mm;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        html, body {
            background-color: #ffffff;
            color: #0f172a;
            font-family: ${isAr ? '"Cairo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' : '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'};
            font-size: 12px;
            line-height: 1.45;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            width: 100%;
        }

        body {
            padding: 20px 24px;
        }

        .invoice-container {
            width: 100%;
            max-width: 760px;
            margin: 0 auto;
            background: #ffffff;
            position: relative;
        }

        .dir-ltr {
            direction: ltr;
            display: inline-block;
            unicode-bidi: isolate;
        }

        /* Driving road motif background watermark */
        .watermark-road {
            position: absolute;
            bottom: 60px;
            ${isAr ? 'left: 20px;' : 'right: 20px;'}
            width: 220px;
            height: 220px;
            opacity: 0.03;
            pointer-events: none;
            z-index: 0;
        }

        /* Top header section */
        .header-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 14px;
            margin-bottom: 20px;
            position: relative;
            z-index: 1;
        }

        .logo-area {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .logo-text-col {
            display: flex;
            flex-direction: column;
        }

        .logo-brand-text {
            font-size: 19px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: ${isAr ? 'normal' : '-0.02em'};
            line-height: 1.15;
        }

        .logo-subtitle {
            font-size: 10px;
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: ${isAr ? 'normal' : '0.12em'};
            margin-top: 2px;
        }

        .meta-area {
            text-align: ${isAr ? 'left' : 'right'};
        }

        .meta-title {
            font-size: 19px;
            font-weight: 900;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            line-height: 1.1;
            margin-bottom: 4px;
        }

        .meta-item {
            font-size: 11.5px;
            color: #475569;
            margin-bottom: 2px;
        }

        .meta-item strong {
            color: #0f172a;
        }

        .meta-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 3px 8px;
            background-color: #f0fdf4;
            color: #15803d;
            font-size: 9.5px;
            font-weight: 800;
            border-radius: 9999px;
            border: 1px solid #bbf7d0;
            text-transform: uppercase;
            margin-top: 4px;
        }

        .badge-dot {
            width: 5px;
            height: 5px;
            background-color: #16a34a;
            border-radius: 50%;
        }

        /* Billing Details - Clean Accounting Columns (No heavy UI cards) */
        .grid-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 20px;
            position: relative;
            z-index: 1;
        }

        .details-col {
            padding-bottom: 8px;
        }

        .details-col h3 {
            font-size: 10.5px;
            font-weight: 800;
            color: #1e3a8a;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            margin-bottom: 8px;
            padding-bottom: 4px;
            border-bottom: 1.5px solid #0f172a;
            text-align: ${isAr ? 'right' : 'left'};
        }

        .details-col p {
            font-size: 11.5px;
            line-height: 1.55;
            color: #334155;
            margin-bottom: 2px;
            text-align: ${isAr ? 'right' : 'left'};
        }

        .details-col .primary-text {
            font-size: 13.5px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 3px;
        }

        /* Table section */
        .invoice-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 18px;
            position: relative;
            z-index: 1;
        }

        .invoice-table th {
            background-color: #0f172a;
            color: #ffffff;
            font-size: 10.5px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 8px 12px;
        }

        .invoice-table th.col-desc {
            text-align: ${isAr ? 'right' : 'left'};
            width: 72%;
        }

        .invoice-table th.col-amount {
            text-align: ${isAr ? 'left' : 'right'};
            width: 28%;
        }

        .invoice-table td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 12px;
            color: #334155;
            vertical-align: top;
        }

        .invoice-table td.cell-desc {
            text-align: ${isAr ? 'right' : 'left'};
        }

        .invoice-table td.cell-amount {
            text-align: ${isAr ? 'left' : 'right'};
            font-family: monospace;
            font-weight: 800;
            font-size: 14px;
            color: #15803d;
            white-space: nowrap;
        }

        .sub-description {
            font-size: 10.5px;
            color: #64748b;
            line-height: 1.4;
            display: block;
            margin-top: 3px;
        }

        /* Summary breakdown */
        .summary-wrapper {
            display: flex;
            justify-content: ${isAr ? 'flex-start' : 'flex-end'};
            margin-bottom: 22px;
            position: relative;
            z-index: 1;
        }

        .summary-box {
            width: 290px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 12px 14px;
            background-color: #ffffff;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
            font-size: 11.5px;
            font-weight: 600;
            color: #475569;
        }

        .summary-row.accent-deposit {
            background-color: #f0fdf4;
            border: 1px solid #dcfce7;
            padding: 5px 8px;
            border-radius: 4px;
            color: #15803d;
        }

        .summary-row.total {
            border-top: 1.5px dashed #94a3b8;
            padding-top: 8px;
            margin-top: 8px;
            margin-bottom: 0;
            color: #0f172a;
            font-size: 13px;
            font-weight: 800;
        }

        .summary-row.total .price-tag {
            color: #1e3a8a;
            font-size: 16px;
            font-weight: 900;
        }

        /* Compliance & Stamps */
        .compliance-stamp-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding-top: 14px;
            border-top: 1px solid #cbd5e1;
            margin-bottom: 16px;
            position: relative;
            z-index: 1;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .stamp-box {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .stamp-seal {
            width: 56px;
            height: 56px;
            border: 2px solid #1e3a8a;
            outline: 1px solid #1e3a8a;
            outline-offset: -3px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #1e3a8a;
            font-size: 7px;
            font-weight: 900;
            text-align: center;
            transform: rotate(-6deg);
            line-height: 1.1;
            text-transform: uppercase;
            padding: 2px;
            background-color: rgba(30, 58, 138, 0.02);
        }

        .stamp-text {
            font-size: 9.5px;
            color: #475569;
            text-align: ${isAr ? 'right' : 'left'};
        }

        .signature-box {
            text-align: ${isAr ? 'left' : 'right'};
            display: flex;
            flex-direction: column;
            align-items: ${isAr ? 'flex-start' : 'flex-end'};
        }

        .signature-line {
            width: 140px;
            border-bottom: 1px solid #94a3b8;
            margin-top: 4px;
            margin-bottom: 3px;
        }

        .signature-title {
            font-size: 9px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
        }

        /* Footer */
        .footer {
            text-align: center;
            color: #64748b;
            font-size: 10px;
            line-height: 1.45;
            padding-top: 12px;
            border-top: 1px solid #f1f5f9;
            position: relative;
            z-index: 1;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .footer p {
            margin: 1.5px 0;
        }

        .footer-highlight {
            color: #1e3a8a;
            font-weight: 700;
        }

        @media print {
            @page {
                size: A4 portrait;
                margin: 8mm 10mm;
            }
            body {
                padding: 0 !important;
                margin: 0 !important;
                background: #ffffff !important;
            }
            .invoice-container {
                max-width: 100% !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
            }
        }
    </style>
</head>
<body>

    <div class="invoice-container">
        
        <!-- Road motif watermark -->
        <svg class="watermark-road" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="45" stroke="#1e3a8a" stroke-width="2" />
            <path d="M50 5 L50 95 M5 50 L95 50" stroke="#1e3a8a" stroke-width="1" stroke-dasharray="2 2" />
            <path d="M 15 50 Q 35 15 50 50 T 85 50" stroke="#1e3a8a" stroke-width="6" stroke-linecap="round" />
        </svg>

        <!-- Top header row -->
        <div class="header-row">
            <!-- School logo and branding -->
            <div class="logo-area">
                ${savedSettings?.logoUrl 
                  ? `<img src="${savedSettings.logoUrl}" alt="${schoolName} Logo" style="height: 44px; width: auto; object-fit: contain; display: block;" referrerPolicy="no-referrer" />` 
                  : `<img src="/logo.png" alt="${schoolName} Logo" style="height: 44px; width: auto; object-fit: contain; display: block;" onerror="this.style.display='none';" referrerPolicy="no-referrer" />`
                }
                <div class="logo-text-col">
                    <span class="logo-brand-text">${schoolName.toUpperCase()}</span>
                    <span class="logo-subtitle">${isAr ? 'مدرسة لتعليم القيادة' : isNl ? 'Rijschool' : 'Driving School'}</span>
                </div>
            </div>

            <!-- Invoice metadata -->
            <div class="meta-area">
                <h2 class="meta-title">${labelInvoice}</h2>
                <p class="meta-item">
                    <strong>${isAr ? 'رقم الفاتورة' : isNl ? 'Factuurnummer' : 'Invoice No'}:</strong> <span class="dir-ltr" style="color: #1e3a8a; font-family: monospace; font-weight: 800; font-size: 12px;">${invoiceId}</span>
                </p>
                <p class="meta-item">
                    <strong>${isAr ? 'تاريخ الفاتورة' : isNl ? 'Factuurdatum' : 'Invoice Date'}:</strong> <span class="dir-ltr" style="font-weight: 700;">${item.date}</span>
                </p>
                <div class="meta-badge">
                    <span class="badge-dot"></span>
                    ${labelPaidStatus}
                </div>
            </div>
        </div>

        <!-- Billing details grid - Clean Accounting Format -->
        <div class="grid-details">
            <div class="details-col">
                <h3>${labelIssuedBy}</h3>
                <p class="primary-text">${schoolName}</p>
                <p><strong>${isAr ? 'العنوان' : isNl ? 'Adres' : 'Address'}:</strong> ${displayAddress}</p>
                <p><strong>KvK:</strong> <span class="dir-ltr">${displayKvk}</span> &nbsp;•&nbsp; <strong>BTW:</strong> <span class="dir-ltr">${displayBtw}</span></p>
                <p><strong>${isAr ? 'البريد الإلكتروني' : isNl ? 'E-mail' : 'Email'}:</strong> <span class="dir-ltr">${displayEmail}</span></p>
                <p><strong>${isAr ? 'الهاتف' : isNl ? 'Telefoon' : 'Phone'}:</strong> <span class="dir-ltr">${displayPhone}</span></p>
            </div>
            <div class="details-col">
                <h3>${labelBillTo}</h3>
                <p class="primary-text">${studentName}</p>
                <p>${schoolName} ${isAr ? 'عضو بوابة المتدربين' : isNl ? 'Lid Student Portaal' : 'Student Portal Member'}</p>
                <p><strong>${isAr ? 'الحالة' : isNl ? 'Status' : 'Status'}:</strong> ${isAr ? 'نشط' : isNl ? 'Actief' : 'Active'}</p>
                <p><strong>${isAr ? 'تاريخ المعاملة' : 'Date'}:</strong> <span class="dir-ltr">${item.date}</span></p>
                <p><strong>${isAr ? 'طريقة الدفع' : 'Payment Method'}:</strong> iDEAL Direct</p>
                <p><strong>${isAr ? 'الرقم المرجعي' : 'Deposit Ref'}:</strong> <span class="dir-ltr" style="font-family: monospace; font-weight: bold; color: #1e3a8a;">${item.id}</span></p>
            </div>
        </div>

        <!-- Table section -->
        <table class="invoice-table">
            <thead>
                <tr>
                    <th class="col-desc">${labelDesc}</th>
                    <th class="col-amount">${labelAmount}</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="cell-desc">
                        <strong style="color: #0f172a; font-size: 13px;">${getLocalTxDesc(item, isAr ? 'ar' : isNl ? 'nl' : 'en')}</strong>
                        <span class="sub-description">
                            ${isAr 
                              ? 'تعبئة رصيد المحفظة التدريبية المعتمدة لدروس القيادة النظرية والعملية. معفاة من ضريبة القيمة المضافة (BTW) وفقاً للمادة 11 من قانون الضرائب الهولندي للتعليم المهني.' 
                              : isNl 
                                ? 'Gecertificeerd leskaarttegoed voor theorie- en praktijklessen. Vrijgesteld van BTW conform artikel 11 Wet OB (Beroepsonderwijs).' 
                                : 'Certified instruction ledger credit for practical and theory driving sessions. Exempt from BTW under Article 11-1-o of Dutch Tax Law (Vocational Education).'}
                        </span>
                    </td>
                    <td class="cell-amount">
                        <span class="dir-ltr">+ €${item.amount.toFixed(2)}</span>
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Summary calculations -->
        <div class="summary-wrapper">
            <div class="summary-box">
                <div class="summary-row">
                    <span>${labelPrevBal}</span>
                    <span class="dir-ltr" style="font-family: monospace; font-weight: 700; color: #475569;">€${prev.toFixed(2)}</span>
                </div>
                <div class="summary-row accent-deposit">
                    <span>${labelDepAmt}</span>
                    <span class="dir-ltr" style="font-family: monospace; font-weight: 800;">+ €${item.amount.toFixed(2)}</span>
                </div>
                <div class="summary-row total">
                    <span>${labelNewBal}</span>
                    <span class="price-tag dir-ltr">€${post.toFixed(2)}</span>
                </div>
            </div>
        </div>

        <!-- Stamp and Signature -->
        <div class="compliance-stamp-row">
            <div class="stamp-box">
                ${savedSettings?.schoolStamp ? `
                    <img src="${savedSettings.schoolStamp}" alt="Official School Stamp" style="max-height: 64px; max-width: 120px; object-fit: contain; transform: rotate(-3deg);" referrerPolicy="no-referrer" />
                ` : `
                    <div class="stamp-seal">
                        ${schoolName.split(' ')[0] || 'Official'}<br>${schoolName.split(' ')[1] || 'Rijschool'}<br>Approved
                    </div>
                `}
                <div class="stamp-text">
                    <p style="font-weight: 800; color: #0f172a; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.04em;">${schoolName.toUpperCase()} OFFICIAL SEAL</p>
                    <p style="font-size: 9.5px; color: #64748b;">Verified Transaction ID: <span class="dir-ltr">TX-${item.id.substring(0,6).toUpperCase()}</span></p>
                </div>
            </div>
            <div class="signature-box">
                ${savedSettings?.instructorSignature ? `
                    <img src="${savedSettings.instructorSignature}" alt="Instructor Signature" style="max-height: 44px; max-width: 130px; object-fit: contain; margin-bottom: 2px;" referrerPolicy="no-referrer" />
                ` : `
                    <div style="font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 700; font-style: italic; color: #1e3a8a; margin-bottom: 2px;">${instructorName}</div>
                `}
                <div class="signature-line"></div>
                <div class="signature-title">Authorized Driving Instructor</div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p class="footer-highlight">${labelThankYou}</p>
            <p>${labelOfficialCBR}</p>
            <p style="font-size: 9.5px; margin-top: 6px; opacity: 0.75; font-weight: 700;">
                ${schoolName} ${schoolAddress ? `&nbsp;•&nbsp; ${schoolAddress}` : ''}
            </p>
        </div>

    </div>

    <script>
        window.addEventListener('load', () => {
            setTimeout(() => {
                window.print();
            }, 400);
        });
    </script>
</body>
</html>`;

    const blob = new Blob([invoiceHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const printWin = window.open(url, '_blank');
    if (!printWin) {
      const element = document.createElement("a");
      element.href = url;
      element.download = `Invoice-${invoiceId}.html`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const currentSchoolName = getSchoolName(schoolSettings);
  
  const dynamicWalletPolicyDesc = React.useMemo(() => {
    if (schoolSettings?.name) {
      if (lang === 'ar') {
        return `تتم إدارة رصيد دروسك مباشرة من قبل ${currentSchoolName}. تتم معالجة الإيداعات، تكاليف الدروس، وتعديلات الرصيد بواسطة مدرسة القيادة.`;
      }
      if (lang === 'nl') {
        return `Je lesaldo wordt rechtstreeks beheerd door ${currentSchoolName}. Stortingen, leskosten en saldo-aanpassingen worden door de rijschool verwerkt.`;
      }
      return `Your lesson balance is managed directly by ${currentSchoolName}. Deposits, lesson charges, and balance adjustments are processed by the driving school.`;
    }
    return t.walletPolicyDesc;
  }, [lang, currentSchoolName, schoolSettings?.name, t.walletPolicyDesc]);

  return (
    <div className="space-y-6 pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">{t.wallet}</h1>
      </div>

      {/* Main Wallet Panel with Card Design */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Balance Card + School Balance Management Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="relative overflow-hidden p-6 rounded-3xl bg-[#0a1226] bg-linear-to-br from-[#060c1a] via-[#0b162e] to-[#122347] text-white shadow-xl border border-slate-700/60 dark:border-white/10">
            {/* Subtle ambient lighting for premium card depth */}
            <div className="absolute -top-16 -right-16 w-44 h-44 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-indigo-600/15 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex justify-between items-start">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {t.studentBalance}
                </h3>
              </div>
              <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20 text-white shadow-xs">
                <Wallet className="h-4 w-4 text-blue-200" />
              </div>
            </div>

            <div className="relative z-10 my-6 flex items-baseline">
              <span className="text-xs font-bold text-blue-300 mr-2.5 rtl:ml-2.5 rtl:mr-0 tracking-wider font-mono">EUR</span>
              <span className="text-4xl sm:text-[40px] font-black tracking-tight font-mono text-white drop-shadow-xs">€{balance}</span>
            </div>

            <div className="relative z-10 pt-4 border-t border-white/15 flex justify-between items-center text-[10px] font-medium">
              <div>
                <p className="uppercase text-[9px] font-bold text-slate-300 tracking-wider">
                  {t.totalDeposits}
                </p>
                <p className="font-bold text-emerald-400 font-mono text-sm mt-0.5">€{totalDeposited}</p>
              </div>
              <div className="h-7 w-px bg-white/15"></div>
              <div>
                <p className="uppercase text-[9px] font-bold text-slate-300 tracking-wider">
                  {t.totalCostsPaid}
                </p>
                <p className="font-bold text-blue-200 font-mono text-sm mt-0.5">€{totalSpent}</p>
              </div>
            </div>
          </div>

          {/* Balance & Security Information Box */}
          <div className="p-5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              {t.walletSafety}
            </h3>

            <div className="text-xs text-slate-650 dark:text-zinc-400 space-y-3 leading-relaxed">
              <p>
                {dynamicWalletPolicyDesc}
              </p>
              <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="text-[10px] font-medium leading-normal">
                  {t.walletWarningDesc}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Log of transactions */}
        <div className="lg:col-span-8 p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-blue-500" />
              {t.transactions}
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 rounded-md">
              {t.liveFeed}
            </span>
          </div>

          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 dark:text-zinc-550 text-xs">
                {t.noTransactions}
              </div>
            ) : (
              filteredTransactions.map(item => {
                const isDeposit = item.type === 'deposit';
                const isAdjustment = item.type === 'adjustment';
                const invoiceNum = item.invoiceId || `INV-2026-${Math.floor(100 + Math.random() * 900)}`;
                return (
                  <div key={item.id} className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl shrink-0 ${
                        isDeposit 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : isAdjustment
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      }`}>
                        {isDeposit ? <ArrowDownLeft className="h-4 w-4" /> : isAdjustment ? <Info className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">{getLocalTxDesc(item, lang)}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {item.date} • Code ID: {item.id} {item.trainerName ? `• ${item.trainerName}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/50">
                      <span className={`text-sm font-bold font-mono ${
                        isDeposit 
                          ? 'text-emerald-500' 
                          : isAdjustment
                            ? 'text-amber-500'
                            : 'text-slate-800 dark:text-zinc-200'
                      }`}>
                        {isDeposit ? '+' : '-'}€{item.amount}
                      </span>

                      <button
                        onClick={() => triggerDownloadInvoice(invoiceNum, item)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-650 dark:text-zinc-300 rounded-lg hover:border-blue-400 hover:text-blue-500 transition cursor-pointer"
                      >
                        <Download className="h-3 w-3" />
                        <span>{invoiceNum}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

const StudentWallet = React.memo(StudentWalletComponent);
export default StudentWallet;
