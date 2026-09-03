import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  Check
} from 'lucide-react';
import { StudentRecord, DrivePackage } from '../../types';
import { AdminLang, ADMIN_I18N } from './types';
import { recordAdminAuditLog } from '../../utils/adminAuditLogger';
import { syncStudentsFromSheet, writeStudentsToSheet } from '../../services/googleSheetsService';
import bcrypt from 'bcryptjs';

interface AdminStudentsViewProps {
  lang: AdminLang;
  students: StudentRecord[];
  setStudents: React.Dispatch<React.SetStateAction<StudentRecord[]>>;
  packages: DrivePackage[];
  spreadsheetId: string;
  onShowMessage: (msg: string, isError?: boolean) => void;
}

export default function AdminStudentsView({
  lang,
  students,
  setStudents,
  packages,
  spreadsheetId,
  onShowMessage
}: AdminStudentsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [isNewStudent, setIsNewStudent] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);

  const t = ADMIN_I18N[lang];

  // Filtered student list
  const filteredStudents = students.filter(st => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (st.name || '').toLowerCase().includes(q) ||
      (st.email || '').toLowerCase().includes(q) ||
      (st.phone || '').toLowerCase().includes(q) ||
      (st.id || st.studentId || '').toLowerCase().includes(q) ||
      (st.city || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (filterStatus === 'active') return st.status === 'active';
    if (filterStatus === 'inactive') return st.status === 'inactive' || st.status === 'suspended';
    if (filterStatus === 'ready') return (st.readiness ?? 0) >= 70;
    return true;
  });

  const handleOpenEdit = (student: StudentRecord) => {
    setSelectedStudent({ ...student });
    setIsNewStudent(false);
    setNewPasswordInput('');
    setPasswordResetSuccess(false);
  };

  const handleOpenNew = () => {
    const nextId = `STD-${String(students.length + 1).padStart(6, '0')}`;
    setSelectedStudent({
      id: nextId,
      studentId: nextId,
      name: '',
      email: '',
      phone: '',
      dob: '2002-01-01',
      city: 'Amsterdam',
      currentPackage: packages[0]?.name || 'Optimal Progress',
      balance: 0,
      readiness: 0,
      status: 'active',
      theoryExamStatus: 'Passed'
    });
    setIsNewStudent(true);
    setNewPasswordInput('');
    setPasswordResetSuccess(false);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    if (!selectedStudent.name || !selectedStudent.email) {
      onShowMessage(lang === 'ar' ? 'يرجى إدخال اسم الطالب وبريده الإلكتروني' : 'Name and email are required.', true);
      return;
    }

    const prevStudent = students.find(s => s.id === selectedStudent.id);
    let updatedStudent = { ...selectedStudent };

    // If new password is provided, securely hash it with bcrypt before persisting
    if (newPasswordInput.trim()) {
      try {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(newPasswordInput.trim(), salt);
        updatedStudent.password = hash;
        setPasswordResetSuccess(true);
      } catch (err) {
        console.error('Password hash error:', err);
      }
    }

    let nextStudentsList: StudentRecord[];
    if (isNewStudent) {
      nextStudentsList = [updatedStudent, ...students];
    } else {
      nextStudentsList = students.map(s => (s.id === updatedStudent.id ? updatedStudent : s));
    }

    setStudents(nextStudentsList);
    try {
      localStorage.setItem('drivingschool_students', JSON.stringify(nextStudentsList));
    } catch (e) {
      console.error('Storage error:', e);
    }

    // Record in Audit Log
    await recordAdminAuditLog({
      action: isNewStudent ? 'Student Created' : 'Student Updated',
      targetRecord: `Student ID: ${updatedStudent.id} (${updatedStudent.name})`,
      previousValue: prevStudent ? `Status: ${prevStudent.status}, Balance: €${prevStudent.balance}` : 'None',
      newValue: `Status: ${updatedStudent.status}, Balance: €${updatedStudent.balance}, Readiness: ${updatedStudent.readiness}%${newPasswordInput ? ', Password Reset' : ''}`,
      changedBy: 'Admin Control Center',
      studentId: updatedStudent.id,
      source: 'Admin Portal'
    });

    onShowMessage(
      lang === 'ar'
        ? `تم حفظ بيانات المتدرب ${updatedStudent.name} بنجاح`
        : `Student ${updatedStudent.name} saved successfully.`
    );
    setSelectedStudent(null);
  };

  const handlePullFromSheet = async () => {
    setIsSyncing(true);
    try {
      const res = await syncStudentsFromSheet(spreadsheetId);
      if (res.success && res.data) {
        setStudents(res.data);
        localStorage.setItem('drivingschool_students', JSON.stringify(res.data));
        await recordAdminAuditLog({
          action: 'Students Synced from Sheet',
          targetRecord: 'Tab: Students',
          newValue: `${res.data.length} records imported`,
          source: 'Google Sheets'
        });
        onShowMessage(
          lang === 'ar'
            ? `تم جلب ${res.data.length} سجل متدرب من Google Sheets`
            : `Pulled ${res.data.length} student records from Google Sheets.`
        );
      } else {
        onShowMessage(res.error || 'Failed to sync students.', true);
      }
    } catch (err: any) {
      onShowMessage(err.message || 'Error syncing students.', true);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushToSheet = async () => {
    setIsSyncing(true);
    try {
      const res = await writeStudentsToSheet(spreadsheetId, students);
      if (res.success) {
        await recordAdminAuditLog({
          action: 'Students Pushed to Sheet',
          targetRecord: 'Tab: Students',
          newValue: `${students.length} records written`,
          source: 'Control Center'
        });
        onShowMessage(
          lang === 'ar'
            ? `تم تصدير ${students.length} متدرب إلى Google Sheets بنجاح`
            : `Pushed ${students.length} students to Google Sheets.`
        );
      } else {
        onShowMessage(res.error || 'Failed to write students.', true);
      }
    } catch (err: any) {
      onShowMessage(err.message || 'Error writing students.', true);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
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
            <option value="all">{lang === 'ar' ? 'جميع الحالات' : 'All Status'}</option>
            <option value="active">{lang === 'ar' ? 'نشط فقط' : 'Active Only'}</option>
            <option value="inactive">{lang === 'ar' ? 'غير نشط' : 'Inactive'}</option>
            <option value="ready">{lang === 'ar' ? 'جاهز لـ CBR (>=70%)' : 'CBR Ready (>=70%)'}</option>
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
            onClick={handleOpenNew}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>{t.actions.add}</span>
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <table className="w-full text-start text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-850/60 text-slate-600 dark:text-zinc-400 font-bold">
              <th className="py-2.5 px-3 text-start">Student ID</th>
              <th className="py-2.5 px-3 text-start">{lang === 'ar' ? 'الاسم والبريد' : 'Name & Email'}</th>
              <th className="py-2.5 px-3 text-start">{lang === 'ar' ? 'الهاتف والمدينة' : 'Phone & City'}</th>
              <th className="py-2.5 px-3 text-start">{lang === 'ar' ? 'الباقة الحالية' : 'Package'}</th>
              <th className="py-2.5 px-3 text-start">{lang === 'ar' ? 'الرصيد' : 'Balance'}</th>
              <th className="py-2.5 px-3 text-start">{lang === 'ar' ? 'جاهزية CBR' : 'CBR Ready'}</th>
              <th className="py-2.5 px-3 text-start">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
              <th className="py-2.5 px-3 text-end">{lang === 'ar' ? 'الإجراء' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-medium">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-zinc-500">
                  {lang === 'ar' ? 'لم يتم العثور على طلاب مطابقين' : 'No students found.'}
                </td>
              </tr>
            ) : (
              filteredStudents.map(st => (
                <tr key={st.id || st.studentId} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {st.studentId || st.id}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-900 dark:text-white">{st.name}</div>
                    <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">{st.email}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="text-slate-800 dark:text-zinc-200">{st.phone || '-'}</div>
                    <div className="text-[10px] text-slate-400">{st.city || '-'}</div>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-zinc-300">
                    {st.currentPackage || '-'}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                    €{(st.balance ?? 0).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 bg-slate-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${
                            (st.readiness ?? 0) >= 75
                              ? 'bg-emerald-500'
                              : (st.readiness ?? 0) >= 50
                              ? 'bg-blue-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(st.readiness ?? 0, 100)}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] font-bold">{st.readiness ?? 0}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        st.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {st.status || 'active'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-end">
                    <button
                      onClick={() => handleOpenEdit(st)}
                      className="px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {t.actions.edit}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit / New Student Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-850">
              <h5 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Users size={16} className="text-blue-600" />
                <span>
                  {isNewStudent
                    ? lang === 'ar'
                      ? 'إضافة متدرب جديد'
                      : 'Add New Student Record'
                    : `${lang === 'ar' ? 'تعديل بيانات المتدرب' : 'Edit Student'}: ${selectedStudent.name}`}
                </span>
              </h5>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-4 space-y-3 text-xs max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Student ID (Immutable)</label>
                  <input
                    type="text"
                    disabled
                    value={selectedStudent.id || selectedStudent.studentId}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 font-mono font-bold text-slate-600 dark:text-zinc-300"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Status</label>
                  <select
                    value={selectedStudent.status || 'active'}
                    onChange={e => setSelectedStudent({ ...selectedStudent, status: e.target.value as any })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={selectedStudent.name}
                    onChange={e => setSelectedStudent({ ...selectedStudent, name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={selectedStudent.email}
                    onChange={e => setSelectedStudent({ ...selectedStudent, email: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Phone</label>
                  <input
                    type="text"
                    value={selectedStudent.phone || ''}
                    onChange={e => setSelectedStudent({ ...selectedStudent, phone: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">City</label>
                  <input
                    type="text"
                    value={selectedStudent.city || ''}
                    onChange={e => setSelectedStudent({ ...selectedStudent, city: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Current Package</label>
                  <select
                    value={selectedStudent.currentPackage || ''}
                    onChange={e => setSelectedStudent({ ...selectedStudent, currentPackage: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                  >
                    {packages.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.hours}h - €{p.price})
                      </option>
                    ))}
                    <option value="Custom Plan">Custom Plan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Wallet Balance (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={selectedStudent.balance ?? 0}
                    onChange={e => setSelectedStudent({ ...selectedStudent, balance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    CBR Exam Readiness ({selectedStudent.readiness ?? 0}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedStudent.readiness ?? 0}
                    onChange={e => setSelectedStudent({ ...selectedStudent, readiness: parseInt(e.target.value, 10) || 0 })}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Theory Exam Status</label>
                  <select
                    value={selectedStudent.theoryExamStatus || 'Passed'}
                    onChange={e => setSelectedStudent({ ...selectedStudent, theoryExamStatus: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                  >
                    <option value="Passed">Passed (Geslaagd)</option>
                    <option value="Scheduled">Scheduled (Ingepland)</option>
                    <option value="Not Passed">Not Passed (Niet gehaald)</option>
                  </select>
                </div>
              </div>

              {/* Safe Password Reset Box */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 space-y-2">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-200 font-bold">
                  <KeyRound size={14} className="text-amber-500" />
                  <span>{lang === 'ar' ? 'إعادة تعيين كلمة المرور الآمنة' : 'Secure Password Reset'}</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {lang === 'ar'
                    ? 'سيتم تشفير كلمة المرور فوراً بـ bcrypt دون كشفها في السجلات أو التبويبات.'
                    : 'The password is encrypted immediately with bcrypt; credentials remain private.'}
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    placeholder={lang === 'ar' ? 'أدخل كلمة مرور جديدة (اختياري)...' : 'Enter new password (optional)...'}
                    value={newPasswordInput}
                    onChange={e => setNewPasswordInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs"
                  />
                  {passwordResetSuccess && (
                    <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1">
                      <Check size={13} />
                      {lang === 'ar' ? 'تم الضبط' : 'Reset'}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  {t.actions.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Save size={13} />
                  <span>{t.actions.save}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
