import { downloadPdf } from '../utils/downloadPdf';
import React from 'react';
import { 
  Wallet, Landmark, ArrowUpRight, ArrowDownLeft, FileText, Download, 
  Info, ShieldCheck 
} from 'lucide-react';
import { TRANSLATIONS, Language, WalletTransaction, SchoolSettings, getSchoolName } from '../types';
import { getLocalTxDesc } from '../utils/translationHelper';
import { isRecordForStudent } from '../utils/identity';
import { generateInvoicePDF } from '../utils/arabicPdfHelper';

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
  const triggerDownloadInvoice = (invoiceId: string, item: WalletTransaction) => downloadPdf(async () => {
    const settings = schoolSettings || (() => {
      try { return JSON.parse(localStorage.getItem('drivingschool_school_settings') || localStorage.getItem('al_andalos_school_settings') || '{}'); }
      catch { return {}; }
    })();
    return generateInvoicePDF({
      invoiceId, studentName: item.studentName || currentUser?.name || '',
      date: item.date, paymentStatus: 'paid', paymentMethod: '',
      billedLessons: [], description: getLocalTxDesc(item, lang),
      subtotal: item.amount, grandTotal: item.amount, vatAmount: 0, vatRate: 0,
    }, lang, settings);
  }, `Invoice-${invoiceId}.pdf`, lang);

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
