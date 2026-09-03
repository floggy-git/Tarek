import React, { useState } from 'react';
import {
  Bell,
  Send,
  Users,
  User,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  AlertCircle,
  Radio,
  Clock
} from 'lucide-react';
import { StudentRecord } from '../../types';
import { AdminLang, ADMIN_I18N } from './types';
import { recordAdminAuditLog } from '../../utils/adminAuditLogger';
import { addAppNotification } from '../../utils/notificationStore';
import { syncNotificationsFromSheet, writeNotificationsToSheet } from '../../services/googleSheetsService';

interface AdminNotificationsViewProps {
  lang: AdminLang;
  students: StudentRecord[];
  spreadsheetId: string;
  onShowMessage: (msg: string, isError?: boolean) => void;
}

export default function AdminNotificationsView({
  lang,
  students,
  spreadsheetId,
  onShowMessage
}: AdminNotificationsViewProps) {
  const [targetType, setTargetType] = useState<'all' | 'specific' | 'trainers'>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.studentId || students[0]?.id || '');
  const [notificationCategory, setNotificationCategory] = useState<'system' | 'booking' | 'payment' | 'exam'>('system');
  const [titleInput, setTitleInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const t = ADMIN_I18N[lang];

  const handleDispatchNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim() || !messageInput.trim()) {
      onShowMessage(lang === 'ar' ? 'يرجى كتابة العنوان والرسالة' : 'Title and message are required.', true);
      return;
    }

    setIsSending(true);
    try {
      let recipientRole: 'student' | 'trainer' | 'all' = 'all';
      let targetStudent: StudentRecord | undefined;

      if (targetType === 'specific') {
        recipientRole = 'student';
        targetStudent = students.find(s => (s.studentId || s.id) === selectedStudentId);
      } else if (targetType === 'trainers') {
        recipientRole = 'trainer';
      }

      // 1. Dispatch into in-app store
      addAppNotification({
        title: titleInput,
        message: messageInput,
        type: notificationCategory,
        recipientRole,
        targetStudentId: targetStudent ? targetStudent.studentId || targetStudent.id : undefined,
        recipientEmail: targetStudent ? targetStudent.email : undefined
      });

      // 2. Audit log
      await recordAdminAuditLog({
        action: 'Notification Dispatched',
        targetRecord: `Target: ${targetType === 'specific' ? targetStudent?.name : targetType}`,
        newValue: `${titleInput}: ${messageInput.substring(0, 60)}...`,
        changedBy: 'Admin Control Center',
        studentId: targetStudent?.studentId || targetStudent?.id,
        source: 'Admin Portal'
      });

      onShowMessage(
        lang === 'ar'
          ? 'تم إرسال الإشعار بنجاح وحفظه في النظام'
          : 'Notification dispatched and recorded successfully.'
      );

      setTitleInput('');
      setMessageInput('');
    } catch (err: any) {
      onShowMessage(err.message || 'Error dispatching notification.', true);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900/80 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Bell size={16} className="text-rose-600" />
            <span>{lang === 'ar' ? 'مركز إرسال وتوجيه الإشعارات' : 'Notification Dispatcher'}</span>
          </h5>
          <p className="text-[11px] text-slate-500">
            {lang === 'ar'
              ? 'إرسال تنبيهات الدروس، تذكيرات الدفع، وإعلانات CBR إلى التطبيق وجدول البيانات'
              : 'Broadcast announcements, lesson reminders & CBR updates to students and instructors'}
          </p>
        </div>
      </div>

      {/* Dispatch Form Card */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 max-w-2xl">
        <form onSubmit={handleDispatchNotification} className="space-y-4 text-xs">
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-500">Target Audience</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetType('all')}
                className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${
                  targetType === 'all'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300'
                    : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400'
                }`}
              >
                All Students
              </button>

              <button
                type="button"
                onClick={() => setTargetType('specific')}
                className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${
                  targetType === 'specific'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300'
                    : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400'
                }`}
              >
                Specific Student
              </button>

              <button
                type="button"
                onClick={() => setTargetType('trainers')}
                className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${
                  targetType === 'trainers'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300'
                    : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400'
                }`}
              >
                Instructors Only
              </button>
            </div>
          </div>

          {targetType === 'specific' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Select Student</label>
              <select
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-medium"
              >
                {students.map(s => (
                  <option key={s.id || s.studentId} value={s.studentId || s.id}>
                    {s.name} ({s.studentId || s.id}) - {s.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Notification Category</label>
              <select
                value={notificationCategory}
                onChange={e => setNotificationCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
              >
                <option value="system">General Announcement</option>
                <option value="booking">Lesson Booking / Schedule</option>
                <option value="payment">Payment & Wallet Reminder</option>
                <option value="exam">CBR Exam Readiness Alert</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Schedule Update / Payment Due"
                value={titleInput}
                onChange={e => setTitleInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Message Content</label>
            <textarea
              rows={3}
              required
              placeholder="Write the message text that will be shown in the notification center..."
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSending}
              className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Send size={14} />
              <span>{lang === 'ar' ? 'إرسال الإشعار فوراً' : 'Dispatch Notification'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
