import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  AlertTriangle,
  Send,
  Car,
  CloudRain,
  User,
  Calendar,
  UserX,
  HelpCircle,
  Trash2,
  Stethoscope,
  Briefcase
} from 'lucide-react';
import { Lesson, Language } from '../types';

interface CancelLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (cancellationData: {
    reason: string;
    notes?: string;
    notifyStudent: boolean;
  }) => void;
  lesson: Lesson | null;
  lang?: Language;
  userRole?: 'student' | 'trainer';
}

interface CancellationReasonOption {
  id: string;
  labelAr: string;
  labelNl: string;
  labelEn: string;
  icon: React.ElementType;
}

const TRAINER_REASON_OPTIONS: CancellationReasonOption[] = [
  {
    id: 'emergency',
    labelAr: 'ظروف طارئة للمدرب',
    labelNl: 'Noodomstandigheden instructeur',
    labelEn: 'Emergency Circumstances',
    icon: User,
  },
  {
    id: 'weather',
    labelAr: 'الأحوال الجوية السيئة',
    labelNl: 'Slechte weersomstandigheden',
    labelEn: 'Weather Conditions',
    icon: CloudRain,
  },
  {
    id: 'car_breakdown',
    labelAr: 'عطل أو صيانة للسيارة',
    labelNl: 'Autopech of onderhoud',
    labelEn: 'Car Breakdown / Maintenance',
    icon: Car,
  },
  {
    id: 'schedule_change',
    labelAr: 'تغيير في جدول المواعيد',
    labelNl: 'Wijziging in rooster',
    labelEn: 'Schedule Change',
    icon: Calendar,
  },
  {
    id: 'student_absence',
    labelAr: 'تغيب أو اعتذار المتدرب',
    labelNl: 'Afwezigheid van leerling',
    labelEn: 'Student Absence',
    icon: UserX,
  },
  {
    id: 'other',
    labelAr: 'أسباب تنظيمية أخرى',
    labelNl: 'Andere redenen',
    labelEn: 'Other Reasons',
    icon: HelpCircle,
  },
];

const STUDENT_REASON_OPTIONS: CancellationReasonOption[] = [
  {
    id: 'emergency',
    labelAr: 'ظروف طارئة',
    labelNl: 'Noodsituatie',
    labelEn: 'Emergency Circumstances',
    icon: AlertTriangle,
  },
  {
    id: 'health',
    labelAr: 'مرض أو ظرف صحي',
    labelNl: 'Ziekte of gezondheid',
    labelEn: 'Illness / Health',
    icon: Stethoscope,
  },
  {
    id: 'work_study',
    labelAr: 'تعارض مع العمل أو الدراسة',
    labelNl: 'Werk of studie verplichting',
    labelEn: 'Work or Study Conflict',
    icon: Briefcase,
  },
  {
    id: 'schedule_change',
    labelAr: 'تغيير في الجدول والمواعيد',
    labelNl: 'Wijziging in planning',
    labelEn: 'Schedule Change',
    icon: Calendar,
  },
  {
    id: 'travel_weather',
    labelAr: 'صعوبة في المواصلات أو الطقس',
    labelNl: 'Reis- of weersomstandigheden',
    labelEn: 'Travel or Weather',
    icon: CloudRain,
  },
  {
    id: 'other',
    labelAr: 'أسباب أخرى',
    labelNl: 'Andere reden',
    labelEn: 'Other Reasons',
    icon: HelpCircle,
  },
];

export const CancelLessonModal: React.FC<CancelLessonModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  lesson,
  lang = 'ar',
  userRole = 'student'
}) => {
  const [selectedReasonId, setSelectedReasonId] = useState<string>('emergency');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [notifyOtherParty, setNotifyOtherParty] = useState<boolean>(true);

  if (!isOpen || !lesson) return null;

  const isRtl = lang === 'ar';
  const isStudent = userRole === 'student';
  const reasonOptions = isStudent ? STUDENT_REASON_OPTIONS : TRAINER_REASON_OPTIONS;

  const getReasonLabel = (opt: CancellationReasonOption) => {
    return lang === 'ar' ? opt.labelAr : lang === 'nl' ? opt.labelNl : opt.labelEn;
  };

  const handleConfirmSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const currentReasonObj = reasonOptions.find((r) => r.id === selectedReasonId);
    const reasonText = currentReasonObj ? getReasonLabel(currentReasonObj) : (isStudent ? 'إلغاء من قبل المتدرب' : 'إلغاء من قبل المدرب');
    const trimmedNotes = customNotes.trim();

    onConfirm({
      reason: reasonText,
      notes: trimmedNotes || undefined,
      notifyStudent: notifyOtherParty,
    });

    setCustomNotes('');
    setSelectedReasonId('emergency');
    setNotifyOtherParty(true);
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-xs overflow-y-auto"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Modal Outer Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white dark:bg-zinc-900 border border-[#e6ecf2] dark:border-zinc-800 rounded-[24px] shadow-2xl max-w-lg w-full my-auto overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* 1. MODAL HEADER */}
          <div className="px-6 py-4 border-b border-[#e6ecf2] dark:border-zinc-800 flex items-center justify-between gap-4 bg-white dark:bg-zinc-900 shrink-0">
            <button
              onClick={onClose}
              type="button"
              className="p-2 text-[#64748b] dark:text-zinc-400 hover:text-[#0f172a] dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center flex-1">
              <h3 className="text-base sm:text-lg font-bold text-[#0f172a] dark:text-white leading-tight">
                {lang === 'ar'
                  ? 'إلغاء درس القيادة'
                  : lang === 'nl'
                  ? 'Rijles Annuleren'
                  : 'Cancel Driving Lesson'}
              </h3>
              <p className="text-xs text-[#64748b] dark:text-zinc-400 mt-0.5 font-medium">
                {isStudent
                  ? `${lesson.trainerName || (lang === 'ar' ? 'المدرب' : lang === 'nl' ? 'Instructeur' : 'Instructor')} • ${lesson.date} (${lesson.time || '12:00'})`
                  : `${lesson.studentName || 'Student'} • ${lesson.date} (${lesson.time || '12:00'})`}
              </p>
            </div>

            <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/50 text-[#e63946] border border-rose-200/60 dark:border-rose-900/60 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 stroke-[2]" />
            </div>
          </div>

          {/* 2. SCROLLABLE CONTENT BODY */}
          <form
            onSubmit={handleConfirmSubmit}
            className="p-5 sm:p-6 space-y-4.5 overflow-y-auto flex-1 bg-white dark:bg-zinc-900"
          >
            {/* Confirmation Alert Box */}
            <div className="p-4 bg-[#fef2f2] dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 rounded-[16px] flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[#e63946] dark:text-rose-400">
                  {lang === 'ar'
                    ? 'هل أنت متأكد من إلغاء هذا الدرس؟'
                    : lang === 'nl'
                    ? 'Weet je zeker dat je deze les wilt annuleren?'
                    : 'Are you sure you want to cancel this lesson?'}
                </p>
                <p className="text-xs text-[#e63946]/80 dark:text-rose-300/80 mt-0.5 font-medium">
                  {lang === 'ar'
                    ? 'سيتم إشعار الطرف الآخر وتحديث جدول المواعيد.'
                    : lang === 'nl'
                    ? 'Er wordt een melding verzonden en het rooster wordt bijgewerkt.'
                    : 'A notification will be sent and the schedule updated.'}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/80 dark:bg-rose-900/40 text-[#e63946] flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>

            {/* Reason Selection Grid */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#64748b] dark:text-zinc-400 text-center sm:text-start">
                {lang === 'ar'
                  ? 'سبب الإلغاء'
                  : lang === 'nl'
                  ? 'Reden van annulering'
                  : 'Reason for Cancellation'}
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {reasonOptions.map((opt) => {
                  const isSelected = selectedReasonId === opt.id;
                  const IconComp = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedReasonId(opt.id)}
                      className={`p-3 rounded-[14px] text-xs font-semibold transition cursor-pointer flex flex-col items-center justify-center gap-2 min-h-[72px] text-center border ${
                        isSelected
                          ? 'bg-[#f8fafc] dark:bg-zinc-800 text-[#0f172a] dark:text-white border-[#1f4e94] dark:border-blue-500 shadow-2xs ring-1 ring-[#1f4e94]/20'
                          : 'bg-[#f8fafc]/60 dark:bg-zinc-800/40 text-[#64748b] dark:text-zinc-300 border-[#e6ecf2] dark:border-zinc-800 hover:bg-[#f8fafc] dark:hover:bg-zinc-800'
                      }`}
                    >
                      <IconComp
                        className={`w-5 h-5 ${
                          isSelected ? 'text-[#1f4e94] dark:text-blue-400' : 'text-[#64748b]'
                        }`}
                      />
                      <span className="leading-tight">{getReasonLabel(opt)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Additional Details Textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#64748b] dark:text-zinc-400">
                {lang === 'ar'
                  ? 'تفاصيل إضافية (اختياري)'
                  : lang === 'nl'
                  ? 'Aanvullende details (optioneel)'
                  : 'Additional Details (optional)'}
              </label>
              <textarea
                rows={3}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder={
                  lang === 'ar'
                    ? 'اكتب سبب الإلغاء أو أي تفاصيل إضافية...'
                    : lang === 'nl'
                    ? 'Schrijf hier de reden of aanvullende details...'
                    : 'Write cancellation reason or additional details...'
                }
                className="w-full p-3.5 bg-[#f8fafc]/60 dark:bg-zinc-800/50 border border-[#e6ecf2] dark:border-zinc-700/80 focus:border-[#1f4e94] focus:ring-1 focus:ring-[#1f4e94]/20 rounded-[14px] text-xs text-[#0f172a] dark:text-white placeholder:text-[#94a3b8] dark:placeholder:text-zinc-500 transition resize-none leading-relaxed"
              />
            </div>

            {/* Notify Toggle Box (Student vs Trainer aware) */}
            <div className="p-3.5 bg-[#f8fafc] dark:bg-zinc-800/60 rounded-[16px] border border-[#e6ecf2] dark:border-zinc-700/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1f4e94]/10 dark:bg-blue-950/60 text-[#1f4e94] dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#0f172a] dark:text-white block">
                    {isStudent
                      ? (lang === 'ar' ? 'إبلاغ المدرب' : lang === 'nl' ? 'Informeer instructeur' : 'Notify Instructor')
                      : (lang === 'ar' ? 'إبلاغ المتدرب' : lang === 'nl' ? 'Informeer leerling' : 'Notify Student')}
                  </span>
                  <span className="text-[11px] text-[#64748b] dark:text-zinc-400 leading-tight block">
                    {isStudent
                      ? (lang === 'ar' ? 'سيتم إرسال إشعار فوري لمدربك بتفاصيل الإلغاء.' : lang === 'nl' ? 'Directe melding wordt verzonden naar je instructeur.' : 'Instant notification will be sent to your instructor.')
                      : (lang === 'ar' ? 'سيتم إرسال إشعار فوري للمتدرب بتفاصيل الإلغاء.' : lang === 'nl' ? 'Directe melding wordt verzonden naar de leerling.' : 'Instant notification will be sent to the student.')}
                  </span>
                </div>
              </div>

              {/* Custom Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={notifyOtherParty}
                onClick={() => setNotifyOtherParty(!notifyOtherParty)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifyOtherParty ? 'bg-[#1f4e94]' : 'bg-slate-300 dark:bg-zinc-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    notifyOtherParty
                      ? isRtl
                        ? '-translate-x-5'
                        : 'translate-x-5'
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </form>

          {/* 3. FOOTER ACTIONS */}
          <div className="px-6 py-4 border-t border-[#e6ecf2] dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center sm:justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-[#f1f5f9] dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-[#0f172a] dark:text-zinc-200 rounded-[12px] text-xs font-bold transition cursor-pointer min-h-[42px] min-w-[100px] text-center"
            >
              {lang === 'ar' ? 'الرجوع' : lang === 'nl' ? 'Ga Terug' : 'Go Back'}
            </button>

            <button
              type="button"
              onClick={() => handleConfirmSubmit()}
              className="px-6 py-2.5 bg-[#e63946] hover:bg-[#d62839] active:scale-[0.98] text-white rounded-[12px] text-xs font-bold shadow-md shadow-rose-600/15 transition flex items-center justify-center gap-2 cursor-pointer min-h-[42px]"
            >
              <Trash2 className="h-4 w-4 stroke-[2.2]" />
              <span>
                {lang === 'ar'
                  ? 'إلغاء الدرس'
                  : lang === 'nl'
                  ? 'Les Annuleren'
                  : 'Cancel Lesson'}
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CancelLessonModal;
