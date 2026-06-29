import React from 'react';
import { 
  Wallet, Landmark, ArrowUpRight, ArrowDownLeft, FileText, Download, 
  Info, ShieldCheck 
} from 'lucide-react';
import { TRANSLATIONS, Language, WalletTransaction } from '../types';

interface StudentWalletProps {
  lang: Language;
  t: typeof TRANSLATIONS['en'];
  transactions: WalletTransaction[];
  setTransactions: (transactions: WalletTransaction[]) => void;
  currentUser: any;
}

export default function StudentWallet({ lang, t, transactions, currentUser }: StudentWalletProps) {
  // Filter transactions to show only those belonging to the logged-in student
  const studentName = currentUser?.name || "Amir Al-Hassan";
  const filteredTransactions = transactions.filter(
    tx => !tx.studentName || tx.studentName === studentName
  );

  // Math totals based on student's actual transactions
  const balance = filteredTransactions.reduce((acc, curr) => {
    return curr.type === 'deposit' ? acc + curr.amount : acc - curr.amount;
  }, 0);

  const totalDeposited = filteredTransactions
    .filter(t => t.type === 'deposit')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalSpent = filteredTransactions
    .filter(t => t.type === 'payment' || t.type === 'adjustment')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Sort transactions chronologically to calculate accurate previous and new balances
  const chronologicalTx = [...filteredTransactions].sort((a, b) => {
    const dateComp = a.date.localeCompare(b.date);
    if (dateComp !== 0) return dateComp;
    return a.id.localeCompare(b.id);
  });

  // Calculate cumulative balances at each point
  const runningBalances = new Map<string, { prev: number; post: number }>();
  let currentAccumulator = 0;
  chronologicalTx.forEach(tx => {
    const prev = currentAccumulator;
    if (tx.type === 'deposit') {
      currentAccumulator += tx.amount;
    } else {
      currentAccumulator -= tx.amount;
    }
    runningBalances.set(tx.id, { prev, post: currentAccumulator });
  });

  // Professional premium digital invoice generator
  const triggerDownloadInvoice = (invoiceId: string, item: WalletTransaction) => {
    const { prev, post } = runningBalances.get(item.id) || { prev: 0, post: item.amount };
    
    const isAr = lang === 'ar';
    const isNl = lang === 'nl';
    
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
    const labelThankYou = isAr ? '🎖️ شكراً لاختياركم مدرسة الأندلس لتعليم القيادة! سلامتكم تبدأ بالتعليم المتميز.' : isNl ? '🎖️ Bedankt voor het kiezen van Al-Andalos Elite Rijschool! Rijveiligheid begint bij topklasse educatie.' : '🎖️ Thank you for choosing Al-Andalos Elite Rijschool! Driving safety starts with premier elite education.';
    const labelOfficialCBR = isAr ? 'هذا المستند يعتبر إيصالاً رسمياً معتمداً من نظام مدرسة الأندلس لتعبئة المحفظة.' : isNl ? 'Dit document dient als officieel CBR-gecertificeerd stortingsbewijs van Al-Andalos.' : 'This document serves as an official CBR-certified deposit confirmation from the Al-Andalos system.';
    const toBeConfigured = isAr ? 'قيد التهيئة' : isNl ? 'Nog te configureren' : 'To be configured';

    const invoiceHtml = `<!DOCTYPE html>
<html lang="${lang}" dir="${isAr ? 'rtl' : 'ltr'}">
<head>
    <meta charset="UTF-8">
    <title>Invoice ${invoiceId} - Al-Andalos Elite Rijschool</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Cairo:wght@400;600;700;800;900&display=swap');
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: ${isAr ? '"Cairo", sans-serif' : '"Inter", sans-serif'};
            color: #0f172a;
            background-color: #f8fafc;
            padding: 40px 24px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        /* Ambient grid pattern background to feel premium on desktop screen */
        .page-bg {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #f8fafc;
            background-image: radial-gradient(#e2e8f0 1.2px, transparent 1.2px);
            background-size: 24px 24px;
            z-index: -10;
        }

        .action-bar {
            max-width: 850px;
            margin: 0 auto 24px auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(255, 255, 255, 0.9);
            padding: 16px 28px;
            border-radius: 20px;
            border: 1px solid #e2e8f0;
            backdrop-filter: blur(12px);
            box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.04);
        }

        .badge-info {
            font-size: 13px;
            color: #475569;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .badge-spark {
            background-color: #dbeafe;
            color: #1e40af;
            padding: 3px 8px;
            border-radius: 8px;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 11px 22px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            text-decoration: none;
            border: none;
        }

        .btn-primary {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: #ffffff;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }

        .btn-primary:hover {
            background: linear-gradient(135deg, #1d4ed8, #1e40af);
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(37, 99, 235, 0.25);
        }

        .btn-secondary {
            background-color: #ffffff;
            color: #334155;
            border: 1px solid #cbd5e1;
        }

        .btn-secondary:hover {
            background-color: #f1f5f9;
            transform: translateY(-1px);
        }

        .invoice-container {
            max-width: 850px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 28px;
            box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.08);
            border: 1px solid #e2e8f0;
            overflow: hidden;
            position: relative;
        }

        /* Distinctive branding header bar */
        .header-stripe {
            height: 12px;
            background: linear-gradient(90deg, #1e3a8a 0%, #3b82f6 50%, #0284c7 100%);
        }

        .invoice-body {
            padding: 56px;
            position: relative;
        }

        /* Subtle driving-line road watermark behind the invoice */
        .watermark-road {
            position: absolute;
            bottom: 5%;
            right: 5%;
            width: 280px;
            height: 280px;
            opacity: 0.025;
            pointer-events: none;
            z-index: 1;
        }

        .flex-between {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 24px;
        }

        .logo-area {
            display: flex;
            align-items: center;
            gap: 18px;
            text-align: left;
        }
        
        html[dir="rtl"] .logo-area {
            text-align: right;
            flex-direction: row-reverse;
        }

        .logo-text-col {
            display: flex;
            flex-direction: column;
            line-height: 1;
        }

        .logo-brand-row {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .logo-brand-text {
            font-size: 26px;
            font-weight: 950;
            color: #0f172a;
            letter-spacing: -0.04em;
        }

        .logo-subtitle {
            font-size: 10px;
            font-weight: 800;
            color: #475569;
            letter-spacing: 0.24em;
            margin-top: 5px;
            text-transform: uppercase;
        }

        .meta-area {
            text-align: ${isAr ? 'left' : 'right'};
        }

        .meta-title {
            font-size: 32px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: -0.03em;
            text-transform: uppercase;
            line-height: 1.1;
        }

        .meta-subtitle {
            font-size: 13px;
            font-weight: 700;
            color: #64748b;
            margin-top: 6px;
        }

        .meta-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            background-color: #f0fdf4;
            color: #15803d;
            font-size: 11px;
            font-weight: 800;
            border-radius: 9999px;
            margin-top: 10px;
            border: 1px solid #bbf7d0;
            text-transform: uppercase;
            letter-spacing: 0.06em;
        }

        .badge-dot {
            width: 6px;
            height: 6px;
            background-color: #16a34a;
            border-radius: 50%;
        }

        /* Modern Details grid card style */
        .grid-details {
            display: grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: 32px;
            margin-top: 48px;
            background-color: #f8fafc;
            border-radius: 20px;
            padding: 28px;
            border: 1px solid #f1f5f9;
            position: relative;
            z-index: 2;
        }

        html[dir="rtl"] .grid-details {
            grid-template-columns: 0.9fr 1.1fr;
        }

        .details-box h3 {
            font-size: 11px;
            font-weight: 900;
            color: #1e3a8a;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 12px;
            padding-bottom: 6px;
            border-bottom: 1px solid #e2e8f0;
        }

        .details-box p {
            font-size: 13px;
            line-height: 1.6;
            margin: 3px 0;
            font-weight: 500;
            color: #334155;
        }

        .details-box .primary-text {
            font-weight: 800;
            color: #0f172a;
            font-size: 15px;
            margin-bottom: 6px;
        }

        /* Professional table elements */
        .invoice-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 44px;
            position: relative;
            z-index: 2;
        }

        .invoice-table th {
            text-align: ${isAr ? 'right' : 'left'};
            padding: 16px 20px;
            background-color: #0f172a;
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }

        .invoice-table th:first-child {
            border-top-left-radius: 12px;
            border-bottom-left-radius: 12px;
        }

        .invoice-table th:last-child {
            border-top-right-radius: 12px;
            border-bottom-right-radius: 12px;
        }

        .invoice-table td {
            padding: 24px 20px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 14px;
            color: #334155;
            font-weight: 500;
            line-height: 1.6;
        }

        .invoice-table td.amount-cell {
            text-align: ${isAr ? 'left' : 'right'};
            font-family: monospace;
            font-weight: 800;
            font-size: 18px;
            color: #0f172a;
        }

        .invoice-table th.amount-cell {
            text-align: ${isAr ? 'left' : 'right'};
        }

        .sub-description {
            font-size: 12px;
            color: #64748b;
            display: block;
            margin-top: 5px;
            line-height: 1.5;
        }

        /* Balance summary calculations cards */
        .summary-wrapper {
            display: flex;
            justify-content: flex-end;
            margin-top: 36px;
            position: relative;
            z-index: 2;
        }

        .summary-box {
            width: 360px;
            background-color: #ffffff;
            border-radius: 20px;
            padding: 24px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.02);
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 14px;
            font-size: 13px;
            font-weight: 600;
            color: #475569;
        }

        .summary-row.accent-deposit {
            color: #15803d;
            background-color: #f0fdf4;
            padding: 8px 12px;
            border-radius: 10px;
            border: 1px solid #dcfce7;
        }

        .summary-row.total {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 2px dashed #cbd5e1;
            color: #0f172a;
            font-size: 15px;
            font-weight: 800;
        }

        .summary-row.total .price-tag {
            color: #1d4ed8;
            font-size: 22px;
            font-weight: 900;
        }

        /* Official seal and signature line */
        .compliance-stamp-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 56px;
            padding-top: 32px;
            border-top: 1px solid #e2e8f0;
            position: relative;
            z-index: 2;
        }

        .stamp-box {
            display: flex;
            align-items: center;
            gap: 14px;
            opacity: 0.85;
        }

        .stamp-seal {
            width: 54px;
            height: 54px;
            border: 2px dashed #1d4ed8;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #1d4ed8;
            font-size: 10px;
            font-weight: 900;
            text-align: center;
            transform: rotate(-8deg);
            line-height: 1.1;
            text-transform: uppercase;
        }

        .stamp-text {
            font-size: 11px;
            color: #475569;
            font-weight: 600;
        }

        .signature-box {
            text-align: ${isAr ? 'left' : 'right'};
        }

        .signature-line {
            width: 180px;
            height: 1px;
            background-color: #cbd5e1;
            margin-bottom: 8px;
        }

        .signature-font {
            font-family: 'Georgia', serif;
            font-style: italic;
            font-size: 15px;
            color: #1e3a8a;
            font-weight: bold;
            margin-bottom: 4px;
        }

        .signature-title {
            font-size: 10px;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .footer {
            margin-top: 56px;
            text-align: center;
            color: #64748b;
            font-size: 11px;
            font-weight: 600;
            line-height: 1.7;
            position: relative;
            z-index: 2;
        }

        .footer p {
            margin: 4px 0;
        }

        .footer-highlight {
            color: #1d4ed8;
            font-weight: 700;
        }

        /* High-quality print configurations */
        @media print {
            body {
                background-color: #ffffff;
                padding: 0;
            }
            .page-bg {
                display: none;
            }
            .invoice-container {
                border: none;
                box-shadow: none;
                border-radius: 0;
                max-width: 100%;
            }
            .action-bar {
                display: none;
            }
            .invoice-body {
                padding: 40px;
            }
            .watermark-road {
                opacity: 0.015;
            }
        }
    </style>
</head>
<body>

    <div class="page-bg"></div>

    <div class="action-bar" dir="${isAr ? 'rtl' : 'ltr'}">
        <span class="badge-info">
            <span class="badge-spark">PDF</span>
            ${isAr ? 'اختر "حفظ بتنسيق PDF" لطباعة أو تنزيل الفاتورة المعتمدة.' : isNl ? 'Selecteer "Opslaan als PDF" om uw officiële factuur op te slaan.' : 'Select "Save as PDF" to download or print your official invoice.'}
        </span>
        <div style="display: flex; gap: 10px;">
            <button onclick="window.print()" class="btn btn-primary">
                ${isAr ? 'طباعة وحفظ كـ PDF' : isNl ? 'Afdrukken & PDF Opslaan' : 'Print & Save as PDF'}
            </button>
            <button onclick="window.close()" class="btn btn-secondary">
                ${isAr ? 'إغلاق' : isNl ? 'Sluiten' : 'Close'}
            </button>
        </div>
    </div>

    <div class="invoice-container">
        <div class="header-stripe"></div>
        <div class="invoice-body">
            
            <!-- Road motif background watermark -->
            <svg class="watermark-road" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="45" stroke="#1d4ed8" stroke-width="2" />
                <path d="M50 5 L50 95 M5 50 L95 50" stroke="#1d4ed8" stroke-width="1" stroke-dasharray="2 2" />
                <path d="M 15 50 Q 35 15 50 50 T 85 50" stroke="#1d4ed8" stroke-width="6" stroke-linecap="round" />
            </svg>
            
            <div class="flex-between">
                <!-- 1. School logo and branding -->
                <div class="logo-area">
                    <img src="/logo.png" alt="Al-Andalos Rijschool Logo" style="height: 64px; width: auto; object-fit: contain; display: block;" onerror="this.style.display='none'; document.getElementById('logo-fallback').style.display='block';" referrerPolicy="no-referrer" />
                    <div id="logo-fallback" class="logo-text-col" style="display: none;">
                        <div class="logo-brand-row">
                            <span class="logo-brand-text">AL-ANDALOS</span>
                        </div>
                        <span class="logo-subtitle">${isAr ? 'مدرسة النخبة لتعليم القيادة' : 'Elite Rijschool BV'}</span>
                    </div>
                </div>

                <!-- Invoice metadata & status -->
                <div class="meta-area">
                    <h2 class="meta-title">${labelInvoice}</h2>
                    <p class="meta-subtitle">
                        Invoice No: <span style="color: #0f172a; font-family: monospace; font-weight: 800; font-size: 15px;">${invoiceId}</span>
                    </p>
                    <div class="meta-badge">
                        <span class="badge-dot"></span>
                        ${labelPaidStatus}
                    </div>
                </div>
            </div>

            <!-- Details Panel with corporate specifications -->
            <div class="grid-details">
                <div class="details-box">
                    <h3>${labelIssuedBy}</h3>
                    <p class="primary-text">Al-Andalos Rijschool</p>
                    <p><strong>CBR Registration:</strong> ${toBeConfigured}</p>
                    <p><strong>Address:</strong> ${toBeConfigured}</p>
                    <p><strong>KvK:</strong> ${toBeConfigured} &nbsp;•&nbsp; <strong>BTW:</strong> ${toBeConfigured}</p>
                    <p><strong>Email:</strong> ${toBeConfigured}</p>
                    <p><strong>Phone:</strong> ${toBeConfigured}</p>
                </div>
                <div class="details-box">
                    <h3>${labelBillTo}</h3>
                    <!-- 2. Student name -->
                    <p class="primary-text">${studentName}</p>
                    <p>Al-Andalos Student Portal Member</p>
                    <p><strong>Status:</strong> Active CBR Training</p>
                    <!-- 6. Date and time -->
                    <p><strong>${isAr ? 'تاريخ ووقت المعاملة' : 'Date & Time'}:</strong> ${item.date} 15:46 CET</p>
                    <p><strong>${isAr ? 'طريقة الدفع المقبولة' : 'Payment Method'}:</strong> iDEAL Direct Rabobank</p>
                    <p><strong>${isAr ? 'الرقم المرجعي' : 'Deposit Ref'}:</strong> <span style="font-family: monospace; font-weight: bold; color: #1e3a8a;">${item.id}</span></p>
                </div>
            </div>

            <!-- Table section with Deposit and Rates -->
            <table class="invoice-table">
                <thead>
                    <tr>
                        <th style="width: 65%;">${labelDesc}</th>
                        <th class="amount-cell" style="width: 35%;">${labelAmount}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <!-- 3. Deposit amount description -->
                            <strong style="color: #0f172a; display: block; margin-bottom: 6px; font-size: 15px;">${item.description}</strong>
                            <span class="sub-description">
                                ${isAr 
                                  ? 'تعبئة رصيد المحفظة التدريبية المعتمدة لدروس القيادة النظرية والعملية. معفاة من ضريبة القيمة المضافة (BTW) وفقاً للمادة 11 من قانون الضرائب الهولندي للتعليم المهني.' 
                                  : isNl 
                                    ? 'Gecertificeerd leskaarttegoed voor theorie- en praktijklessen. Vrijgesteld van BTW conform artikel 11 Wet OB (Beroepsonderwijs).' 
                                    : 'Certified instruction ledger credit for practical and theory driving sessions. Exempt from BTW under Article 11-1-o of Dutch Tax Law (Vocational Education).'}
                            </span>
                        </td>
                        <!-- 3. Deposit amount (Formatted) -->
                        <td class="amount-cell" style="color: #16a34a; font-weight: 900;">+ €${item.amount.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            <!-- Previous & New Balance breakdown calculations -->
            <div class="summary-wrapper">
                <div class="summary-box">
                    <div class="summary-row">
                        <!-- 4. Previous wallet balance -->
                        <span>${labelPrevBal}</span>
                        <span style="font-family: monospace; font-weight: 700; font-size: 14px; color: #475569;">€${prev.toFixed(2)}</span>
                    </div>
                    <div class="summary-row accent-deposit">
                        <!-- 3. Deposit amount -->
                        <span>${labelDepAmt}</span>
                        <span style="font-family: monospace; font-weight: 800; font-size: 14px;">+ €${item.amount.toFixed(2)}</span>
                    </div>
                    <div class="summary-row total">
                        <!-- 5. New wallet balance -->
                        <span>${labelNewBal}</span>
                        <span class="price-tag font-mono">€${post.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <!-- Professional validation seal & stamp -->
            <div class="compliance-stamp-row">
                <div class="stamp-box">
                    <div class="stamp-seal">
                        Al-Andalos<br>Approved<br>CBR-NL
                    </div>
                    <div class="stamp-text">
                        <p style="font-weight: 800; color: #0f172a; margin-bottom: 2px;">CBR COMPLIANCE VERIFIED</p>
                        <p style="font-size: 10px; color: #64748b;">Secure Blockchain Ledger ID: AA-${item.id.substring(0,6).toUpperCase()}</p>
                    </div>
                </div>
                <div class="signature-box">
                    <div class="signature-font">S. Al-Andalosi</div>
                    <div class="signature-line"></div>
                    <div class="signature-title">Authorized Driving Registrar</div>
                </div>
            </div>

            <!-- Professional corporate footer -->
            <div class="footer">
                <p class="footer-highlight">${labelThankYou}</p>
                <p>${labelOfficialCBR}</p>
                <p style="font-size: 10px; margin-top: 16px; opacity: 0.75; font-weight: 700;">
                    Al-Andalos Rijschool &nbsp;•&nbsp; ${toBeConfigured}
                </p>
            </div>

        </div>
    </div>

    <script>
        window.addEventListener('DOMContentLoaded', () => {
            // Short timeout to guarantee page CSS styles are fully rendered before print dialog opens
            setTimeout(() => {
                window.print();
            }, 600);
        });
    </script>
</body>
</html>`;

    const element = document.createElement("a");
    const file = new Blob([invoiceHtml], { type: 'text/html;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Invoice-${invoiceId}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    alert(lang === 'ar' 
      ? 'تم إصدار وتحميل الفاتورة الضريبية الرسمية لعملية الإيداع بنجاح! يمكنك الآن فتح الملف لحفظه كملف PDF متميز.' 
      : lang === 'nl'
        ? 'Officiële stortingsfactuur met succes gegenereerd en gedownload! Open het bestand om het op te slaan als een premium PDF.'
        : 'Official professional deposit invoice generated and downloaded successfully! Open the file to save it directly as a premium vector PDF.'
    );
  };

  return (
    <div className="space-y-6 pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">{t.wallet}</h1>
        <p className="text-xs text-slate-400 mt-0.5">Secure, European standards iDEAL driving education bank transactions</p>
      </div>

      {/* Main Wallet Panel with Card Design */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Dynamic Card + Escrow Notice (Read-only Policy) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="relative overflow-hidden p-6 rounded-3xl bg-linear-to-br from-slate-900 via-indigo-950 to-blue-950 text-white shadow-xl border border-white/5">
            <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl"></div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest leading-none">Dutch Licensed Escrow</p>
            <h3 className="text-sm font-semibold mt-1">Al-Andalos Student Balance</h3>

            <div className="my-8">
              <span className="text-[11px] text-indigo-300 mr-2">EUR</span>
              <span className="text-4xl font-extrabold tracking-tight font-mono">€{balance}</span>
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
              <div>
                <p className="uppercase text-[9px]">Total Deposits</p>
                <p className="font-bold text-emerald-400 font-mono text-sm">€{totalDeposited}</p>
              </div>
              <div className="h-6 w-px bg-white/10"></div>
              <div>
                <p className="uppercase text-[9px]">Total Costs paid</p>
                <p className="font-bold text-indigo-300 font-mono text-sm">€{totalSpent}</p>
              </div>
            </div>
          </div>

          {/* Read-Only Policy Escrow Information Box */}
          <div className="p-5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              {lang === 'ar' ? 'أمان المحفظة والضمان' : lang === 'nl' ? 'Escrow & Beveiliging' : 'Escrow Policy & Safety'}
            </h3>

            <div className="text-xs text-slate-650 dark:text-zinc-400 space-y-3 leading-relaxed">
              <p>
                {lang === 'ar'
                  ? 'رصيد محفظتك التدريبية يخضع لقوانين السير والتدريب المهني في هولندا. تتم إدارة المعاملات يدوياً وإلكترونياً بشكل حصري بواسطة مدرب المدرسة المعتمد.'
                  : lang === 'nl'
                    ? 'Het saldo op jouw leskaart-wallet wordt beheerd volgens de officiële CBR- en RVV-richtlijnen. Transacties en lesafschrijvingen worden uitsluitend beheerd door de rijinstructeur.'
                    : 'Your driving instruction balance is protected by Al-Andalos Escrow policy. Deposit confirmations, lesson deductions, and adjustments are managed exclusively by certified driving school trainers.'}
              </p>
              <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="text-[10px] font-medium leading-normal">
                  {lang === 'ar'
                    ? 'لا يمكن للطالب إضافة أو إزالة الأموال بنفسه. لتعبئة الرصيد أو مراجعة الدروس، يرجى التنسيق مع المدرب الميداني سمير.'
                    : lang === 'nl'
                      ? 'Als leerling kun je zelf geen gelden handmatig overboeken of opnemen. Neem contact op met Samir om een betaling of herinnering te verwerken.'
                      : 'Students cannot edit, add, or deduct funds directly. To credit your wallet or clarify deductions, please coordinate directly with Instructor Samir.'}
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
            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 rounded-md">Live feed</span>
          </div>

          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 dark:text-zinc-550 text-xs">
                {lang === 'ar' ? 'لا يوجد معاملات مالية مسجلة لهذه المحفظة حالياً.' : 'No transactions recorded for this wallet yet.'}
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
                        <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">{item.description}</h4>
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
