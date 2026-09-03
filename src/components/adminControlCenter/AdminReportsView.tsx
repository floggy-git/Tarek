import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Users,
  Calendar,
  Wallet,
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { StudentRecord, Lesson, WalletTransaction, InvoiceRecord } from '../../types';
import { AdminLang, ADMIN_I18N } from './types';

interface AdminReportsViewProps {
  lang: AdminLang;
  students: StudentRecord[];
  lessons: Lesson[];
  transactions: WalletTransaction[];
  invoices: InvoiceRecord[];
}

export default function AdminReportsView({
  lang,
  students,
  lessons,
  transactions,
  invoices
}: AdminReportsViewProps) {
  const t = ADMIN_I18N[lang];

  // Aggregated stats
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'active').length;
  const cbrReadyCount = students.filter(s => (s.readiness ?? 0) >= 70).length;

  const totalLessons = lessons.length;
  const completedLessons = lessons.filter(l => l.status === 'completed').length;
  const cancelledLessons = lessons.filter(l => l.status === 'cancelled').length;

  const totalInvoiced = invoices.reduce((acc, i) => acc + (i.amount || 0), 0);
  const totalPaidInvoices = invoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + (i.amount || 0), 0);
  const totalWalletBalances = students.reduce((acc, s) => acc + (s.balance || 0), 0);

  const handleExportCSV = () => {
    const rows = [
      ['Student ID', 'Name', 'Email', 'Phone', 'City', 'Balance', 'Readiness', 'Status'],
      ...students.map(s => [
        s.studentId || s.id,
        s.name,
        s.email,
        s.phone || '',
        s.city || '',
        s.balance ?? 0,
        s.readiness ?? 0,
        s.status || 'active'
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `drivingschool_students_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const reportData = {
      exportTimestamp: new Date().toISOString(),
      summary: {
        totalStudents,
        activeStudents,
        cbrReadyCount,
        totalLessons,
        completedLessons,
        totalInvoiced,
        totalPaidInvoices,
        totalWalletBalances
      },
      students,
      lessons,
      invoices
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `administrative_dossier_report_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900/80 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart3 size={16} className="text-sky-600" />
            <span>{lang === 'ar' ? 'التقارير الإحصائية والملفات الشاملة' : 'Dossier Analytics & Business Reports'}</span>
          </h5>
          <p className="text-[11px] text-slate-500">
            {lang === 'ar'
              ? 'مؤشرات الأداء التراكمية، ومعدلات جاهزية CBR، والإيرادات وتصدير البيانات'
              : 'Cumulative KPI metrics, CBR readiness distributions, financial aggregates & exports'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-zinc-300 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={14} />
            <span>Export JSON Archive</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Students</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalStudents}</div>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">
            {activeStudents} Active • {cbrReadyCount} CBR Ready
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Lessons Executed</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalLessons}</div>
          <p className="text-[11px] text-blue-600 font-bold mt-1">
            {completedLessons} Completed • {cancelledLessons} Cancelled
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Invoiced</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            €{totalInvoiced.toFixed(2)}
          </div>
          <p className="text-[11px] text-emerald-600 font-bold mt-1 font-mono">
            €{totalPaidInvoices.toFixed(2)} Collected
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Student Wallets Total</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            €{totalWalletBalances.toFixed(2)}
          </div>
          <p className="text-[11px] text-amber-600 font-bold mt-1">
            Prepaid balance liability
          </p>
        </div>
      </div>
    </div>
  );
}
