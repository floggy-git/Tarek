import React, { useState } from 'react';
import {
  Receipt,
  Search,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  ExternalLink,
  CheckCircle2,
  Clock,
  Ban,
  X,
  Save,
  FileText
} from 'lucide-react';
import { InvoiceRecord, StudentRecord } from '../../types';
import { AdminLang, ADMIN_I18N } from './types';
import { recordAdminAuditLog } from '../../utils/adminAuditLogger';
import { syncInvoicesFromSheet, writeInvoicesToSheet } from '../../services/googleSheetsService';

interface AdminInvoicesViewProps {
  lang: AdminLang;
  invoices: InvoiceRecord[];
  setInvoices: React.Dispatch<React.SetStateAction<InvoiceRecord[]>>;
  students: StudentRecord[];
  spreadsheetId: string;
  onShowMessage: (msg: string, isError?: boolean) => void;
}

export default function AdminInvoicesView({
  lang,
  invoices,
  setInvoices,
  students,
  spreadsheetId,
  onShowMessage
}: AdminInvoicesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // New Invoice State
  const [targetStudentId, setTargetStudentId] = useState<string>(students[0]?.studentId || students[0]?.id || '');
  const [invoiceAmount, setInvoiceAmount] = useState<number>(150);
  const [invoiceDesc, setInvoiceDesc] = useState<string>('Driving Lessons Package Invoice');

  const t = ADMIN_I18N[lang];

  const filteredInvoices = invoices.filter(inv => {
    const q = searchQuery.toLowerCase();
    const matches =
      (inv.studentName || '').toLowerCase().includes(q) ||
      (inv.studentEmail || '').toLowerCase().includes(q) ||
      (inv.id || '').toLowerCase().includes(q) ||
      (inv.description || '').toLowerCase().includes(q);

    if (!matches) return false;
    if (filterStatus === 'paid') return inv.status === 'paid';
    if (filterStatus === 'unpaid') return inv.status === 'unpaid';
    return true;
  });

  const handleToggleStatus = async (invoice: InvoiceRecord) => {
    const newStatus: 'paid' | 'unpaid' = invoice.status === 'paid' ? 'unpaid' : 'paid';
    const updatedInvoices = invoices.map(inv =>
      inv.id === invoice.id ? { ...inv, status: newStatus } : inv
    );

    setInvoices(updatedInvoices);
    try {
      localStorage.setItem('drivingschool_invoices', JSON.stringify(updatedInvoices));
    } catch (e) {
      console.error('Storage error:', e);
    }

    await recordAdminAuditLog({
      action: 'Invoice Status Changed',
      targetRecord: `Invoice ID: ${invoice.id} (${invoice.studentName})`,
      previousValue: `Status: ${invoice.status}`,
      newValue: `Status: ${newStatus}`,
      changedBy: 'Admin Control Center',
      studentId: invoice.studentId,
      source: 'Admin Portal'
    });

    onShowMessage(
      lang === 'ar'
        ? `تم تغيير حالة الفاتورة ${invoice.id} إلى ${newStatus}`
        : `Invoice ${invoice.id} marked as ${newStatus}.`
    );
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => (s.studentId || s.id) === targetStudentId);
    if (!student) {
      onShowMessage('Select a student.', true);
      return;
    }

    const newInv: InvoiceRecord = {
      id: `INV-${Date.now().toString(36).toUpperCase()}`,
      studentId: student.studentId || student.id,
      studentName: student.name,
      studentEmail: student.email,
      amount: invoiceAmount,
      date: new Date().toISOString().split('T')[0],
      description: invoiceDesc,
      status: 'unpaid'
    };

    const updated = [newInv, ...invoices];
    setInvoices(updated);
    try {
      localStorage.setItem('drivingschool_invoices', JSON.stringify(updated));
    } catch (e) {
      console.error('Storage error:', e);
    }

    await recordAdminAuditLog({
      action: 'Invoice Created',
      targetRecord: `Invoice: ${newInv.id} for ${student.name}`,
      previousValue: 'None',
      newValue: `Amount: €${newInv.amount}, Status: unpaid`,
      changedBy: 'Admin Control Center',
      studentId: student.studentId || student.id,
      source: 'Admin Portal'
    });

    onShowMessage(
      lang === 'ar'
        ? `تم إصدار الفاتورة ${newInv.id} بمبلغ €${newInv.amount}`
        : `Invoice ${newInv.id} created for €${newInv.amount}.`
    );
    setShowCreateModal(false);
  };

  const handlePullFromSheet = async () => {
    setIsSyncing(true);
    try {
      const res = await syncInvoicesFromSheet(spreadsheetId);
      if (res.success && res.data) {
        setInvoices(res.data);
        localStorage.setItem('drivingschool_invoices', JSON.stringify(res.data));
        await recordAdminAuditLog({
          action: 'Invoices Synced from Sheet',
          targetRecord: 'Tab: Invoices',
          newValue: `${res.data.length} invoices imported`,
          source: 'Google Sheets'
        });
        onShowMessage(
          lang === 'ar'
            ? `تم جلب ${res.data.length} فاتورة من Google Sheets`
            : `Pulled ${res.data.length} invoices from Google Sheets.`
        );
      } else {
        onShowMessage(res.error || 'Failed to sync invoices.', true);
      }
    } catch (err: any) {
      onShowMessage(err.message || 'Error syncing invoices.', true);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushToSheet = async () => {
    setIsSyncing(true);
    try {
      const res = await writeInvoicesToSheet(spreadsheetId, invoices);
      if (res.success) {
        await recordAdminAuditLog({
          action: 'Invoices Pushed to Sheet',
          targetRecord: 'Tab: Invoices',
          newValue: `${invoices.length} invoices written`,
          source: 'Control Center'
        });
        onShowMessage(
          lang === 'ar'
            ? `تم تصدير ${invoices.length} فاتورة إلى Google Sheets بنجاح`
            : `Pushed ${invoices.length} invoices to Google Sheets.`
        );
      } else {
        onShowMessage(res.error || 'Failed to write invoices.', true);
      }
    } catch (err: any) {
      onShowMessage(err.message || 'Error writing invoices.', true);
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
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-700 dark:text-zinc-300 font-medium"
          >
            <option value="all">{lang === 'ar' ? 'جميع الفواتير' : 'All Invoices'}</option>
            <option value="paid">{lang === 'ar' ? 'مدفوعة' : 'Paid'}</option>
            <option value="unpaid">{lang === 'ar' ? 'غير مدفوعة' : 'Unpaid'}</option>
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
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>{lang === 'ar' ? 'إصدار فاتورة جديدة' : 'New Invoice'}</span>
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <table className="w-full text-start text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-850/60 text-slate-600 dark:text-zinc-400 font-bold">
              <th className="py-2.5 px-3 text-start">Invoice ID</th>
              <th className="py-2.5 px-3 text-start">{lang === 'ar' ? 'المتدرب' : 'Student'}</th>
              <th className="py-2.5 px-3 text-start">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
              <th className="py-2.5 px-3 text-start">{lang === 'ar' ? 'المبلغ' : 'Amount'}</th>
              <th className="py-2.5 px-3 text-start">{lang === 'ar' ? 'الوصف' : 'Description'}</th>
              <th className="py-2.5 px-3 text-start">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
              <th className="py-2.5 px-3 text-end">{lang === 'ar' ? 'الإجراء' : 'Action'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-medium">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-zinc-500">
                  {lang === 'ar' ? 'لم يتم العثور على فواتير' : 'No invoices found.'}
                </td>
              </tr>
            ) : (
              filteredInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {inv.id}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-900 dark:text-white">{inv.studentName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{inv.studentEmail}</div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-300">
                    {inv.date}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                    €{inv.amount.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-zinc-300 max-w-xs truncate">
                    {inv.description}
                  </td>
                  <td className="py-2.5 px-3">
                    <button
                      onClick={() => handleToggleStatus(inv)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                        inv.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-200'
                      }`}
                    >
                      {inv.status === 'paid' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                      <span>{inv.status}</span>
                    </button>
                  </td>
                  <td className="py-2.5 px-3 text-end">
                    {inv.drivePdfUrl ? (
                      <a
                        href={inv.drivePdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-bold"
                      >
                        <FileText size={12} />
                        <span>Drive PDF</span>
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-850">
              <h5 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt size={16} className="text-indigo-600" />
                <span>{lang === 'ar' ? 'إصدار فاتورة جديدة' : 'Generate New Invoice'}</span>
              </h5>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Student</label>
                <select
                  value={targetStudentId}
                  onChange={e => setTargetStudentId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-medium"
                >
                  {students.map(s => (
                    <option key={s.id || s.studentId} value={s.studentId || s.id}>
                      {s.name} ({s.studentId || s.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Amount (€)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={invoiceAmount}
                  onChange={e => setInvoiceAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Invoice Description</label>
                <textarea
                  rows={2}
                  required
                  value={invoiceDesc}
                  onChange={e => setInvoiceDesc(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  {t.actions.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Save size={13} />
                  <span>{lang === 'ar' ? 'إصدار الفاتورة' : 'Create Invoice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
