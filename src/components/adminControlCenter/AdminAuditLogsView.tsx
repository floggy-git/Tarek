import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  ArrowDownToLine,
  Download,
  Filter,
  RefreshCw,
  Lock,
  User,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { AuditLogEntry } from '../../types';
import { AdminLang, ADMIN_I18N } from './types';
import { getAdminAuditLogs } from '../../utils/adminAuditLogger';
import { syncAuditLogsFromSheet } from '../../services/googleSheetsService';

interface AdminAuditLogsViewProps {
  lang: AdminLang;
  spreadsheetId: string;
  onShowMessage: (msg: string, isError?: boolean) => void;
}

export default function AdminAuditLogsView({
  lang,
  spreadsheetId,
  onShowMessage
}: AdminAuditLogsViewProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [isSyncing, setIsSyncing] = useState(false);

  const t = ADMIN_I18N[lang];

  const loadLogs = () => {
    const local = getAdminAuditLogs();
    setLogs(local);
  };

  useEffect(() => {
    loadLogs();
    const handleUpdate = () => loadLogs();
    window.addEventListener('appAuditLogsUpdated', handleUpdate);
    return () => window.removeEventListener('appAuditLogsUpdated', handleUpdate);
  }, []);

  const filteredLogs = logs.filter(entry => {
    const q = searchQuery.toLowerCase();
    const matches =
      (entry.auditId || '').toLowerCase().includes(q) ||
      (entry.action || '').toLowerCase().includes(q) ||
      (entry.targetRecord || '').toLowerCase().includes(q) ||
      (entry.userName || '').toLowerCase().includes(q) ||
      (entry.changedBy || '').toLowerCase().includes(q);

    if (!matches) return false;
    if (filterAction !== 'all') {
      return (entry.action || '').toLowerCase().includes(filterAction.toLowerCase());
    }
    return true;
  });

  const handlePullFromSheet = async () => {
    setIsSyncing(true);
    try {
      const res = await syncAuditLogsFromSheet(spreadsheetId);
      if (res.success && res.data && res.data.length > 0) {
        setLogs(res.data);
        onShowMessage(
          lang === 'ar'
            ? `تم جلب ${res.data.length} سجل تدقيق من Google Sheets`
            : `Pulled ${res.data.length} audit entries from Google Sheets.`
        );
      } else {
        onShowMessage(res.error || 'No remote audit records found in sheet.', true);
      }
    } catch (err: any) {
      onShowMessage(err.message || 'Error syncing audit logs.', true);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ['Audit ID', 'Timestamp', 'Action', 'Target Record', 'Changed By', 'Source', 'Previous Value', 'New Value'],
      ...logs.map(l => [
        l.auditId,
        `${l.date} ${l.time}`,
        l.action,
        l.targetRecord || '',
        l.changedBy,
        l.source || 'Portal',
        `"${(l.previousValue || '').replace(/"/g, '""')}"`,
        `"${(l.newValue || '').replace(/"/g, '""')}"`
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-700 dark:text-zinc-300 font-medium"
          >
            <option value="all">All Actions</option>
            <option value="student">Student Actions</option>
            <option value="lesson">Lesson Actions</option>
            <option value="wallet">Wallet Actions</option>
            <option value="package">Package Actions</option>
            <option value="setting">Setting Actions</option>
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
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 dark:bg-zinc-700 dark:hover:bg-zinc-600 flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Security Privacy Notice */}
      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
        <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
        <span>
          {lang === 'ar'
            ? 'سجل التدقيق آمن ومطابق للمعايير: كلمات المرور والرموز السرية ومفاتيح OAuth مشفرة ومحجوبة تلقائياً.'
            : 'Audit Trail is sanitized & compliant: Passwords, tokens & private credentials are automatically redacted.'}
        </span>
      </div>

      {/* Audit Logs Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <table className="w-full text-start text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-850/60 text-slate-600 dark:text-zinc-400 font-bold">
              <th className="py-2.5 px-3 text-start">Audit ID</th>
              <th className="py-2.5 px-3 text-start">Timestamp</th>
              <th className="py-2.5 px-3 text-start">Action</th>
              <th className="py-2.5 px-3 text-start">Target Record</th>
              <th className="py-2.5 px-3 text-start">Changed By</th>
              <th className="py-2.5 px-3 text-start">Details / Delta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-medium">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-zinc-500">
                  {lang === 'ar' ? 'لا توجد سجلات تدقيق حالياً' : 'No audit records recorded yet.'}
                </td>
              </tr>
            ) : (
              filteredLogs.map(l => (
                <tr key={l.auditId} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition">
                  <td className="py-2 px-3 font-mono font-bold text-slate-700 dark:text-zinc-300 text-[11px]">
                    {l.auditId}
                  </td>
                  <td className="py-2 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                    {l.date} {l.time}
                  </td>
                  <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                    {l.action}
                  </td>
                  <td className="py-2 px-3 text-blue-600 dark:text-blue-400 font-medium max-w-xs truncate">
                    {l.targetRecord || '-'}
                  </td>
                  <td className="py-2 px-3 text-slate-600 dark:text-zinc-400">
                    {l.changedBy}
                  </td>
                  <td className="py-2 px-3 text-slate-600 dark:text-zinc-300 max-w-xs">
                    <div className="truncate text-[11px]">
                      {l.newValue ? (
                        <span>
                          <strong className="text-slate-800 dark:text-zinc-200">New:</strong> {l.newValue}
                        </span>
                      ) : (
                        l.previousValue || '-'
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
