import React, { useState } from 'react';
import {
  Calendar,
  Search,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  Save,
  X,
  Star,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Lesson, StudentRecord } from '../../types';
import { AdminLang, ADMIN_I18N } from './types';
import { recordAdminAuditLog } from '../../utils/adminAuditLogger';
import { syncLessonsFromSheet, writeLessonsToSheet } from '../../services/googleSheetsService';

interface AdminLessonsViewProps {
  lang: AdminLang;
  lessons: Lesson[];
  setLessons: React.Dispatch<React.SetStateAction<Lesson[]>>;
  students: StudentRecord[];
  spreadsheetId: string;
  onShowMessage: (msg: string, isError?: boolean) => void;
}

export default function AdminLessonsView({
  lang,
  lessons,
  setLessons,
  students,
  spreadsheetId,
  onShowMessage
}: AdminLessonsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isNewLesson, setIsNewLesson] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const t = ADMIN_I18N[lang];

  const filteredLessons = lessons.filter(ls => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (ls.studentName || '').toLowerCase().includes(q) ||
      (ls.trainerName || '').toLowerCase().includes(q) ||
      (ls.date || '').toLowerCase().includes(q) ||
      (ls.id || '').toLowerCase().includes(q) ||
      (ls.pickupLocation || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (filterStatus === 'upcoming') return ls.status === 'upcoming';
    if (filterStatus === 'completed') return ls.status === 'completed';
    if (filterStatus === 'cancelled') return ls.status === 'cancelled';
    return true;
  });

  const handleOpenEdit = (lesson: Lesson) => {
    setSelectedLesson({ ...lesson });
    setIsNewLesson(false);
  };

  const handleOpenNew = () => {
    const nextId = `LES-${Date.now().toString(36).toUpperCase()}`;
    const defaultStudent = students[0];
    setSelectedLesson({
      id: nextId,
      studentId: defaultStudent?.id || defaultStudent?.studentId || 'STD-000001',
      studentName: defaultStudent?.name || 'Student',
      trainerName: 'Samir El-Filali',
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      duration: '1.5h',
      price: 90,
      pickupLocation: 'Amsterdam Centraal',
      status: 'upcoming'
    });
    setIsNewLesson(true);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLesson) return;

    const prevLesson = lessons.find(l => l.id === selectedLesson.id);
    let updatedLessons: Lesson[];

    if (isNewLesson) {
      updatedLessons = [selectedLesson, ...lessons];
    } else {
      updatedLessons = lessons.map(l => (l.id === selectedLesson.id ? selectedLesson : l));
    }

    setLessons(updatedLessons);
    try {
      localStorage.setItem('drivingschool_lessons', JSON.stringify(updatedLessons));
    } catch (e) {
      console.error('Storage error:', e);
    }

    await recordAdminAuditLog({
      action: isNewLesson ? 'Lesson Scheduled' : 'Lesson Updated',
      targetRecord: `Lesson ID: ${selectedLesson.id} (${selectedLesson.studentName})`,
      previousValue: prevLesson ? `${prevLesson.date} ${prevLesson.time} - Status: ${prevLesson.status}` : 'None',
      newValue: `${selectedLesson.date} ${selectedLesson.time} - Status: ${selectedLesson.status}, Trainer: ${selectedLesson.trainerName}`,
      changedBy: 'Admin Control Center',
      studentId: selectedLesson.studentId,
      source: 'Admin Portal'
    });

    onShowMessage(
      lang === 'ar'
        ? `تم حفظ الدرس ${selectedLesson.id} بنجاح`
        : `Lesson ${selectedLesson.id} saved successfully.`
    );
    setSelectedLesson(null);
  };

  const handlePullFromSheet = async () => {
    setIsSyncing(true);
    try {
      const res = await syncLessonsFromSheet(spreadsheetId);
      if (res.success && res.data) {
        setLessons(res.data);
        localStorage.setItem('drivingschool_lessons', JSON.stringify(res.data));
        await recordAdminAuditLog({
          action: 'Lessons Synced from Sheet',
          targetRecord: 'Tab: Lessons',
          newValue: `${res.data.length} lessons imported`,
          source: 'Google Sheets'
        });
        onShowMessage(
          lang === 'ar'
            ? `تم جلب ${res.data.length} درس من Google Sheets`
            : `Pulled ${res.data.length} lessons from Google Sheets.`
        );
      } else {
        onShowMessage(res.error || 'Failed to sync lessons.', true);
      }
    } catch (err: any) {
      onShowMessage(err.message || 'Error syncing lessons.', true);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushToSheet = async () => {
    setIsSyncing(true);
    try {
      const res = await writeLessonsToSheet(spreadsheetId, lessons);
      if (res.success) {
        await recordAdminAuditLog({
          action: 'Lessons Pushed to Sheet',
          targetRecord: 'Tab: Lessons',
          newValue: `${lessons.length} lessons written`,
          source: 'Control Center'
        });
        onShowMessage(
          lang === 'ar'
            ? `تم تصدير ${lessons.length} درس إلى Google Sheets بنجاح`
            : `Pushed ${lessons.length} lessons to Google Sheets.`
        );
      } else {
        onShowMessage(res.error || 'Failed to write lessons.', true);
      }
    } catch (err: any) {
      onShowMessage(err.message || 'Error writing lessons.', true);
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
            <option value="all">{lang === 'ar' ? 'جميع الحالات' : 'All Status'}</option>
            <option value="upcoming">{lang === 'ar' ? 'قادم' : 'Upcoming'}</option>
            <option value="completed">{lang === 'ar' ? 'مكتمل' : 'Completed'}</option>
            <option value="cancelled">{lang === 'ar' ? 'ملغي' : 'Cancelled'}</option>
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

      {/* Lessons Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <table className="w-full text-start text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-850/60 text-slate-600 dark:text-zinc-400 font-bold">
              <th className="py-2.5 px-3 text-start">Lesson ID</th>
              <th className="py-2.5 px-3 text-start">{lang === 'ar' ? 'المتدرب' : 'Student'}</th>
              <th className="py-2.5 px-3 text-start">{lang === 'ar' ? 'المدرب' : 'Trainer'}</th>
              <th className="py-2.5 px-3 text-start">{lang === 'ar' ? 'التاريخ والوقت' : 'Date & Time'}</th>
              <th className="py-2.5 px-3 text-start">{lang === 'ar' ? 'المدة والموقع' : 'Duration & Location'}</th>
              <th className="py-2.5 px-3 text-start">{lang === 'ar' ? 'السعر' : 'Price'}</th>
              <th className="py-2.5 px-3 text-start">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
              <th className="py-2.5 px-3 text-end">{lang === 'ar' ? 'الإجراء' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-medium">
            {filteredLessons.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-zinc-500">
                  {lang === 'ar' ? 'لم يتم العثور على دروس' : 'No lessons found.'}
                </td>
              </tr>
            ) : (
              filteredLessons.map(ls => (
                <tr key={ls.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {ls.id}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                    {ls.studentName}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-zinc-300">
                    {ls.trainerName}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold">{ls.date}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{ls.time}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="text-slate-800 dark:text-zinc-200">{ls.duration}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{ls.pickupLocation}</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                    €{ls.price}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ls.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : ls.status === 'cancelled'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {ls.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-end">
                    <button
                      onClick={() => handleOpenEdit(ls)}
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

      {/* Edit / New Lesson Modal */}
      {selectedLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-850">
              <h5 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar size={16} className="text-emerald-600" />
                <span>
                  {isNewLesson
                    ? lang === 'ar'
                      ? 'جدولة درس جديد'
                      : 'Schedule New Lesson'
                    : `${lang === 'ar' ? 'تعديل الدرس' : 'Edit Lesson'}: ${selectedLesson.id}`}
                </span>
              </h5>
              <button
                onClick={() => setSelectedLesson(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Student</label>
                  <select
                    value={selectedLesson.studentId}
                    onChange={e => {
                      const st = students.find(s => (s.studentId || s.id) === e.target.value);
                      setSelectedLesson({
                        ...selectedLesson,
                        studentId: e.target.value,
                        studentName: st?.name || selectedLesson.studentName
                      });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                  >
                    {students.map(s => (
                      <option key={s.id || s.studentId} value={s.studentId || s.id}>
                        {s.name} ({s.studentId || s.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Trainer</label>
                  <input
                    type="text"
                    value={selectedLesson.trainerName}
                    onChange={e => setSelectedLesson({ ...selectedLesson, trainerName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={selectedLesson.date}
                    onChange={e => setSelectedLesson({ ...selectedLesson, date: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={selectedLesson.time}
                    onChange={e => setSelectedLesson({ ...selectedLesson, time: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Duration</label>
                  <select
                    value={selectedLesson.duration}
                    onChange={e => setSelectedLesson({ ...selectedLesson, duration: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                  >
                    <option value="1h">1.0 Hour</option>
                    <option value="1.5h">1.5 Hours</option>
                    <option value="2h">2.0 Hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Price (€)</label>
                  <input
                    type="number"
                    value={selectedLesson.price}
                    onChange={e => setSelectedLesson({ ...selectedLesson, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Pickup Location</label>
                <input
                  type="text"
                  value={selectedLesson.pickupLocation}
                  onChange={e => setSelectedLesson({ ...selectedLesson, pickupLocation: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Status</label>
                  <select
                    value={selectedLesson.status}
                    onChange={e => setSelectedLesson({ ...selectedLesson, status: e.target.value as any })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Rating (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={selectedLesson.rating || 5}
                    onChange={e => setSelectedLesson({ ...selectedLesson, rating: parseInt(e.target.value, 10) || 5 })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Instructor Notes & Feedback</label>
                <textarea
                  rows={2}
                  value={selectedLesson.notes || ''}
                  onChange={e => setSelectedLesson({ ...selectedLesson, notes: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLesson(null)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  {t.actions.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 cursor-pointer"
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
