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

  // Mock Invoice download generator
  const triggerDownloadInvoice = (invoiceId: string, item: WalletTransaction) => {
    const invoiceContent = `
========================================
       AL-ANDALOS RIJSCHOOL BV
   Driving Education Excellence Europe
========================================
Invoice ID:  ${invoiceId}
Dated:       ${item.date}
Recipient:   ${studentName}

Description: ${item.description}
Rate/Price:  €${item.amount}
VAT (21%):   Calculated inclusive
Status:      PAID IN FULL  [✓]

Thank you for choosing Al-Andalos!
For inquiries: info@al-andalos-rijschool.nl
========================================
    `;

    const element = document.createElement("a");
    const file = new Blob([invoiceContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${invoiceId}-AlAndalos.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    alert(lang === 'ar' ? 'تم تنزيل الفاتورة الضريبية الرسمية وتصديرها بنجاح كملف نصي (TXT)!' : 'Invoice downloaded successfully in clean TXT format!');
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
