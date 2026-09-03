import React, { useState } from 'react';
import {
  Wallet,
  Search,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  User,
  X,
  Save,
  CheckCircle2
} from 'lucide-react';
import { WalletTransaction, StudentRecord } from '../../types';
import { AdminLang, ADMIN_I18N } from './types';
import { recordAdminAuditLog } from '../../utils/adminAuditLogger';
import { syncWalletFromSheet, writeWalletToSheet } from '../../services/googleSheetsService';

interface AdminPaymentsViewProps {
  lang: AdminLang;
  transactions: WalletTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<WalletTransaction[]>>;
  students: StudentRecord[];
  setStudents: React.Dispatch<React.SetStateAction<StudentRecord[]>>;
  spreadsheetId: string;
  onShowMessage: (msg: string, isError?: boolean) => void;
}

export default function AdminPaymentsView({
  lang,
  transactions,
  setTransactions,
  students,
  setStudents,
  spreadsheetId,
  onShowMessage
}: AdminPaymentsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Adjustment Form State
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.studentId || students[0]?.id || '');
  const [adjustAmount, setAdjustAmount] = useState<number>(50);
  const [adjustType, setAdjustType] = useState<'deposit' | 'payment' | 'adjustment'>('deposit');
  const [adjustDescription, setAdjustDescription] = useState<string>('Administrative manual balance adjustment');

  const t = ADMIN_I18N[lang];

  const filteredTransactions = transactions.filter(tx => {
    const q = searchQuery.toLowerCase();
    const matches =
      (tx.studentName || '').toLowerCase().includes(q) ||
      (tx.studentId || '').toLowerCase().includes(q) ||
      (tx.description || '').toLowerCase().includes(q) ||
      (tx.id || '').toLowerCase().includes(q);

    if (!matches) return false;
    if (filterType === 'deposit') return tx.type === 'deposit';
    if (filterType === 'payment') return tx.type === 'payment';
    return true;
  });

  const handleApplyAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetStudent = students.find(s => (s.studentId || s.id) === selectedStudentId);
    if (!targetStudent) {
      onShowMessage('Please select a student.', true);
      return;
    }

    const previousBalance = targetStudent.balance ?? 0;
    const isCredit = adjustType === 'deposit';
    const finalAmount = Math.abs(adjustAmount);
    const newBalance = isCredit ? previousBalance + finalAmount : previousBalance - finalAmount;

    // 1. Create Transaction
    const newTx: WalletTransaction = {
      id: `TX-${Date.now().toString(36).toUpperCase()}`,
      studentId: targetStudent.studentId || targetStudent.id,
      studentName: targetStudent.name,
      date: new Date().toISOString().split('T')[0],
      type: adjustType === 'deposit' ? 'deposit' : 'payment',
      amount: finalAmount,
      description: adjustDescription
    };

    const updatedTransactions = [newTx, ...transactions];
    setTransactions(updatedTransactions);
    try {
      localStorage.setItem('drivingschool_transactions', JSON.stringify(updatedTransactions));
    } catch (e) {
      console.error('Storage error:', e);
    }

    // 2. Update Student Balance
    const updatedStudents = students.map(s =>
      (s.studentId || s.id) === selectedStudentId ? { ...s, balance: newBalance } : s
    );
    setStudents(updatedStudents);
    try {
      localStorage.setItem('drivingschool_students', JSON.stringify(updatedStudents));
    } catch (e) {
      console.error('Storage error:', e);
    }

    // 3. Record Audit Log
    await recordAdminAuditLog({
      action: 'Wallet Balance Adjusted',
      targetRecord: `Student: ${targetStudent.name} (${targetStudent.studentId || targetStudent.id})`,
      previousValue: `€${previousBalance.toFixed(2)}`,
      newValue: `€${newBalance.toFixed(2)} (${isCredit ? '+' : '-'}€${finalAmount.toFixed(2)}: ${adjustDescription})`,
      changedBy: 'Admin Control Center',
      studentId: targetStudent.studentId || targetStudent.id,
      source: 'Admin Portal'
    });

    onShowMessage(
      lang === 'ar'
        ? `تم تعديل رصيد المتدرب ${targetStudent.name} بنجاح إلى €${newBalance.toFixed(2)}`
        : `Adjusted balance for ${targetStudent.name} to €${newBalance.toFixed(2)}.`
    );
    setShowAdjustmentModal(false);
  };

  const handlePullFromSheet = async () => {
    setIsSyncing(true);
    try {
      const res = await syncWalletFromSheet(spreadsheetId);
      if (res.success && res.data) {
        setTransactions(res.data);
        localStorage.setItem('drivingschool_transactions', JSON.stringify(res.data));
        await recordAdminAuditLog({
          action: 'Wallet Transactions Synced from Sheet',
          targetRecord: 'Tab: Wallet',
          newValue: `${res.data.length} transactions imported`,
          source: 'Google Sheets'
        });
        onShowMessage(
          lang === 'ar'
            ? `تم جلب ${res.data.length} حركة محفظة من Google Sheets`
            : `Pulled ${res.data.length} transactions from Google Sheets.`
        );
      } else {
        onShowMessage(res.error || 'Failed to sync wallet.', true);
      }
    } catch (err: any) {
      onShowMessage(err.message || 'Error syncing wallet.', true);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushToSheet = async () => {
    setIsSyncing(true);
    try {
      const res = await writeWalletToSheet(spreadsheetId, transactions);
      if (res.success) {
        await recordAdminAuditLog({
          action: 'Wallet Transactions Pushed to Sheet',
          targetRecord: 'Tab: Wallet',
          newValue: `${transactions.length} transactions written`,
          source: 'Control Center'
        });
        onShowMessage(
          lang === 'ar'
            ? `تم تصدير ${transactions.length} حركة محفظة إلى Google Sheets بنجاح`
            : `Pushed ${transactions.length} transactions to Google Sheets.`
        );
      } else {
        onShowMessage(res.error || 'Failed to write wallet.', true);
      }
    } catch (err: any) {
      onShowMessage(err.message || 'Error writing wallet.', true);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900/80 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input
              type="text"
              placeholder={t.actions.search}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-700 dark:text-zinc-300 font-medium"
          >
            <option value="all">{lang === 'ar' ? 'جميع الحركات' : 'All Types'}</option>
            <option value="deposit">{lang === 'ar' ? 'إيداعات (+)' : 'Deposits (+)'}</option>
            <option value="payment">{lang === 'ar' ? 'مدفوعات / خصومات (-)' : 'Payments (-)'}</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePullFromSheet}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-zinc-300 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <ArrowDownToLine size={14} />
            <span>{t.actions.syncFromSheet}</span>
          </button>

          <button
            onClick={handlePushToSheet}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <ArrowUpFromLine size={14} />
            <span>{t.actions.syncToSheet}</span>
          </button>

          <button
            onClick={() => setShowAdjustmentModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 flex items-center gap-1.5 cursor-pointer"
          >
            <DollarSign size={14} />
            <span>{lang === 'ar' ? 'تعديل رصيد محفظة' : 'Adjust Balance'}</span>
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <table className="w-full text-start text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-850/60 text-slate-600 dark:text-zinc-400 font-bold">
              <th className="py-2.5 px-3 text-start">Transaction ID</th>
              <th className="py-2.5 px-3 text-start">{lang === 'ar' ? 'المتدرب' : 'Student'}</th>
              <th className="py-2.5 px-3 text-start">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
              <th className="py-2.5 px-3 text-start">{lang === 'ar' ? 'النوع' : 'Type'}</th>
              <th className="py-2.5 px-3 text-start">{lang === 'ar' ? 'المبلغ' : 'Amount'}</th>
              <th className="py-2.5 px-3 text-start">{lang === 'ar' ? 'البيان / الوصف' : 'Description'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-medium">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-zinc-500">
                  {lang === 'ar' ? 'لم يتم العثور على حركات مالية' : 'No transactions found.'}
                </td>
              </tr>
            ) : (
              filteredTransactions.map(tx => {
                const isDeposit = tx.type === 'deposit';
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {tx.id}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">{tx.studentName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{tx.studentId}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-300">
                      {tx.date}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isDeposit
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {isDeposit ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                        <span>{tx.type}</span>
                      </span>
                    </td>
                    <td
                      className={`py-2.5 px-3 font-mono font-bold ${
                        isDeposit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isDeposit ? '+' : '-'}€{tx.amount.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-zinc-300 max-w-xs truncate">
                      {tx.description}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Adjust Balance Modal */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-850">
              <h5 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet size={16} className="text-amber-500" />
                <span>{lang === 'ar' ? 'تعديل رصيد محفظة متدرب' : 'Manual Wallet Balance Adjustment'}</span>
              </h5>
              <button
                onClick={() => setShowAdjustmentModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleApplyAdjustment} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Select Student</label>
                <select
                  value={selectedStudentId}
                  onChange={e => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-medium"
                >
                  {students.map(s => (
                    <option key={s.id || s.studentId} value={s.studentId || s.id}>
                      {s.name} (Current Balance: €{(s.balance ?? 0).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Adjustment Type</label>
                  <select
                    value={adjustType}
                    onChange={e => setAdjustType(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-bold"
                  >
                    <option value="deposit">Credit / Add (+)</option>
                    <option value="payment">Debit / Deduct (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Amount (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={adjustAmount}
                    onChange={e => setAdjustAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Reason / Description</label>
                <textarea
                  rows={2}
                  required
                  value={adjustDescription}
                  onChange={e => setAdjustDescription(e.target.value)}
                  placeholder="e.g. Bank transfer payment received, manual goodwill adjustment..."
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  {t.actions.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Save size={13} />
                  <span>{lang === 'ar' ? 'تطبيق التعديل والتدقيق' : 'Apply Adjustment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
