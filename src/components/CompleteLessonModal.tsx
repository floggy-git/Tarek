import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Calendar, Clock, MapPin, User, Star, ThumbsUp, Activity, ClipboardCheck } from 'lucide-react';
import { Lesson, Language } from '../types';
import { getTrainerPhoto } from '../utils/studentPhoto';

interface CompleteLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    lessonId: string;
    payStatus: 'paid' | 'unpaid';
    method: 'wallet' | 'cash' | 'transfer' | 'card' | null;
    lessonNotes: string;
    instructorNotes: string;
    price: number;
    performanceRating?: number;
    performanceEvaluation?: 'excellent' | 'good' | 'needs_improvement';
    lessonNumber?: number;
  }) => void;
  lesson: Lesson | null;
  allLessons?: Lesson[];
  trainerName?: string;
  lang?: Language;
}

const PRESET_PRICES = [50, 55, 60, 65, 70, 75];

export const CompleteLessonModal: React.FC<CompleteLessonModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  lesson,
  allLessons = [],
  trainerName = 'Instructor',
  lang = 'ar',
}) => {
  const [price, setPrice] = useState<string>('50');
  const [payStatus, setPayStatus] = useState<'paid' | 'unpaid'>('paid');
  const [payMethod, setPayMethod] = useState<'wallet' | 'cash' | 'transfer' | 'card'>('cash');
  const [lessonNotes, setLessonNotes] = useState<string>('');
  const [instructorNotes, setInstructorNotes] = useState<string>('');
  const [performanceRating, setPerformanceRating] = useState<number>(5);

  // Auto-calculate the student's lesson number
  const lessonNumber = useMemo(() => {
    if (!lesson || !lesson.studentName) return 1;
    const targetName = lesson.studentName.trim().toLowerCase();
    
    // Count completed lessons for this student
    const completedCount = allLessons.filter(l => 
      l.studentName && 
      l.studentName.trim().toLowerCase() === targetName && 
      l.status === 'completed' &&
      l.id !== lesson.id
    ).length;

    return completedCount + 1;
  }, [lesson, allLessons]);

  useEffect(() => {
    if (lesson) {
      setPrice(lesson.price ? String(lesson.price) : '50');
      setPayStatus(lesson.payStatus === 'paid' ? 'paid' : 'unpaid');
      setPayMethod((lesson.payMethod as any) || 'cash');
      setLessonNotes(lesson.lessonNotes || '');
      setInstructorNotes(lesson.instructorNotes || '');
      setPerformanceRating(
        lesson.performanceRating || 
        (lesson.performanceEvaluation === 'excellent' ? 5 : lesson.performanceEvaluation === 'good' ? 3 : lesson.performanceEvaluation === 'needs_improvement' ? 1 : 5)
      );
    }
  }, [lesson]);

  if (!isOpen || !lesson) return null;

  const isRtl = lang === 'ar';
  const currentPriceNum = parseFloat(price) || 0;

  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const evaluationKey: 'excellent' | 'good' | 'needs_improvement' = 
      performanceRating === 5 ? 'excellent' : performanceRating === 3 ? 'good' : 'needs_improvement';

    onConfirm({
      lessonId: lesson.id,
      payStatus,
      method: payStatus === 'paid' ? payMethod : null,
      lessonNotes,
      instructorNotes,
      price: currentPriceNum,
      performanceRating,
      performanceEvaluation: evaluationKey,
      lessonNumber,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-xs overflow-y-auto"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white dark:bg-zinc-900 border border-[#e6ebf2] dark:border-zinc-800 rounded-[20px] shadow-xl max-w-xl w-full my-auto overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* 1. HEADER */}
          <div className="px-6 py-4.5 border-b border-[#e6ebf2] dark:border-zinc-800 flex items-center justify-between gap-4 bg-white dark:bg-zinc-900 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#e8f0fe] dark:bg-blue-950/60 flex items-center justify-center text-[#1f4e94] dark:text-blue-400 shrink-0">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1f4e94] dark:text-blue-400 block leading-tight">
                  {lang === 'ar' ? 'سير العمل' : lang === 'nl' ? 'LESSON WORKFLOW' : 'LESSON WORKFLOW'}
                </span>
                <h3 className="text-lg font-bold text-[#0f172a] dark:text-white mt-0.5 leading-tight">
                  {lang === 'ar'
                    ? 'إكمال الدرس'
                    : lang === 'nl'
                    ? 'Les Afronden'
                    : 'Complete Lesson'}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              type="button"
              className="p-2 text-[#64748b] dark:text-zinc-400 hover:text-[#0f172a] dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 2. SCROLLABLE CONTENT BODY */}
          <form onSubmit={handleFormSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 bg-[#f5f7fa] dark:bg-zinc-950/40">

            {/* 3. LESSON INFO CARD */}
            <div className="p-5 bg-white dark:bg-zinc-900 rounded-[16px] border border-[#e6ebf2] dark:border-zinc-800 shadow-2xs space-y-4">
              {/* Top Row: Badge + Student Name & Subtitle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#e6ebf2] dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-[#1f4e94] text-white text-xs font-bold rounded-[10px] tracking-wide uppercase shrink-0">
                    {lang === 'ar' ? `درس #${lessonNumber}` : lang === 'nl' ? `LESSON #${lessonNumber}` : `LESSON #${lessonNumber}`}
                  </span>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-[#0f172a] dark:text-white leading-tight">
                      {lesson.studentName}
                    </h4>
                    <span className="text-xs font-medium text-[#64748b] dark:text-zinc-400 block mt-0.5">
                      {lesson.type || (lang === 'ar' ? 'درس قيادة عملي' : lang === 'nl' ? 'Practical Lesson' : 'Practical Lesson')}
                    </span>
                  </div>
                </div>

                {/* Instructor Photo / Avatar */}
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center bg-[#f8fafc] dark:bg-zinc-800/60 px-3 py-1.5 rounded-xl border border-[#e6ebf2] dark:border-zinc-700/60">
                  <User className="w-3.5 h-3.5 text-[#64748b] dark:text-zinc-400" />
                  <span className="text-xs font-semibold text-[#0f172a] dark:text-zinc-200">
                    {trainerName}
                  </span>
                </div>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[#64748b] dark:text-zinc-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {lang === 'ar' ? 'التاريخ' : lang === 'nl' ? 'DATE' : 'DATE'}
                    </span>
                  </div>
                  <span className="font-bold text-[#0f172a] dark:text-zinc-100 block">{lesson.date}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[#64748b] dark:text-zinc-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {lang === 'ar' ? 'الوقت' : lang === 'nl' ? 'TIME' : 'TIME'}
                    </span>
                  </div>
                  <span className="font-bold text-[#0f172a] dark:text-zinc-100 block">{lesson.time}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[#64748b] dark:text-zinc-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {lang === 'ar' ? 'المدة' : lang === 'nl' ? 'DURATION' : 'DURATION'}
                    </span>
                  </div>
                  <span className="font-bold text-[#0f172a] dark:text-zinc-100 block">
                    {lesson.duration || 1} {lang === 'ar' ? 'ساعة' : lang === 'nl' ? 'Hour' : 'Hour'}
                  </span>
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-1.5 text-[#64748b] dark:text-zinc-400">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {lang === 'ar' ? 'الانطلاق' : lang === 'nl' ? 'PICKUP' : 'PICKUP'}
                    </span>
                  </div>
                  <span className="font-bold text-[#0f172a] dark:text-zinc-100 block truncate">
                    {lesson.pickupLocation || (lang === 'ar' ? 'المدرسة' : 'Maastricht Centraal Station')}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. PAYMENT SECTION */}
            <div className="p-5 bg-white dark:bg-zinc-900 rounded-[16px] border border-[#e6ebf2] dark:border-zinc-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#e6ebf2] dark:border-zinc-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] dark:text-zinc-400">
                  {lang === 'ar' ? 'الدفع والتسوية' : lang === 'nl' ? 'PAYMENT' : 'PAYMENT'}
                </span>
                <span className="text-base font-bold text-[#1f4e94] dark:text-blue-400">
                  €{currentPriceNum.toFixed(2)}
                </span>
              </div>

              {/* Select Lesson Fee */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#64748b] dark:text-zinc-400">
                  {lang === 'ar' ? 'اختر قيمة الحصة:' : lang === 'nl' ? 'Select Lesson Fee' : 'Select Lesson Fee'}
                </label>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESET_PRICES.map((preset) => {
                    const isSelected = currentPriceNum === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPrice(String(preset))}
                        className={`py-2 px-2.5 rounded-[12px] text-xs font-bold transition cursor-pointer flex items-center justify-center min-h-[40px] ${
                          isSelected
                            ? 'bg-[#1f4e94] text-white shadow-2xs'
                            : 'bg-white dark:bg-zinc-800 text-[#0f172a] dark:text-zinc-200 border border-[#e6ebf2] dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-750'
                        }`}
                      >
                        €{preset}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Amount */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-semibold text-[#64748b] dark:text-zinc-400">
                  {lang === 'ar' ? 'مبلغ مخصص' : lang === 'nl' ? 'Custom Amount' : 'Custom Amount'}
                </label>
                <div className="relative flex items-center bg-[#f8fafc] dark:bg-zinc-800/80 border border-[#e6ebf2] dark:border-zinc-700/80 focus-within:border-[#1f4e94] focus-within:ring-1 focus-within:ring-[#1f4e94]/20 rounded-[12px] overflow-hidden transition">
                  <div className="px-3.5 py-2.5 bg-[#e6ebf2]/60 dark:bg-zinc-700/50 text-[#64748b] dark:text-zinc-300 font-bold text-sm border-r rtl:border-r-0 rtl:border-l border-[#e6ebf2] dark:border-zinc-700 select-none">
                    €
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder={
                      lang === 'ar'
                        ? 'أدخل مبلغاً مخصصاً'
                        : lang === 'nl'
                        ? 'Enter custom price'
                        : 'Enter custom price'
                    }
                    className="w-full px-3 py-2 bg-transparent text-sm font-bold text-[#0f172a] dark:text-white focus:outline-none placeholder:text-[#94a3b8] dark:placeholder:text-zinc-500 placeholder:font-normal"
                  />
                </div>
              </div>

              {/* Payment Status */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-semibold text-[#64748b] dark:text-zinc-400">
                  {lang === 'ar' ? 'حالة التحصيل:' : lang === 'nl' ? 'Payment Status' : 'Payment Status'}
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-[#f1f5f9] dark:bg-zinc-800/80 rounded-[12px]">
                  <button
                    type="button"
                    onClick={() => setPayStatus('paid')}
                    className={`py-2 px-3 rounded-[10px] text-xs transition cursor-pointer flex items-center justify-center min-h-[38px] ${
                      payStatus === 'paid'
                        ? 'bg-white dark:bg-zinc-900 text-[#0f172a] dark:text-white font-bold shadow-2xs border border-[#e6ebf2] dark:border-zinc-700'
                        : 'text-[#64748b] dark:text-zinc-400 hover:text-[#0f172a] dark:hover:text-white font-medium'
                    }`}
                  >
                    <span>{lang === 'ar' ? 'مدفوع' : lang === 'nl' ? 'Paid' : 'Paid'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayStatus('unpaid')}
                    className={`py-2 px-3 rounded-[10px] text-xs transition cursor-pointer flex items-center justify-center min-h-[38px] ${
                      payStatus === 'unpaid'
                        ? 'bg-[#fef2f2] dark:bg-red-950/40 text-[#ef4444] font-bold border border-[#ef4444]/60 shadow-2xs'
                        : 'text-[#64748b] dark:text-zinc-400 hover:text-[#0f172a] dark:hover:text-white font-medium'
                    }`}
                  >
                    <span>{lang === 'ar' ? 'غير مدفوع' : lang === 'nl' ? 'Unpaid' : 'Unpaid'}</span>
                  </button>
                </div>
              </div>

              {/* Payment Method Selector (Only when Paid) */}
              {payStatus === 'paid' && (
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-semibold text-[#64748b] dark:text-zinc-400">
                    {lang === 'ar' ? 'طريقة الدفع:' : lang === 'nl' ? 'Payment Method' : 'Payment Method'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'cash', labelAr: 'نقداً', labelNl: 'Cash', labelEn: 'Cash' },
                      { id: 'wallet', labelAr: 'المحفظة', labelNl: 'Wallet', labelEn: 'Wallet' },
                      { id: 'transfer', labelAr: 'تحويل بنكي', labelNl: 'Bank Transfer', labelEn: 'Bank Transfer' },
                      { id: 'card', labelAr: 'بطاقة', labelNl: 'Card', labelEn: 'Card' },
                    ].map((m) => {
                      const isSelected = payMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPayMethod(m.id as any)}
                          className={`py-2 px-2.5 rounded-[10px] text-xs transition cursor-pointer text-center min-h-[36px] flex items-center justify-center ${
                            isSelected
                              ? 'bg-[#1f4e94] text-white font-bold shadow-2xs'
                              : 'bg-white dark:bg-zinc-800 text-[#0f172a] dark:text-zinc-200 border border-[#e6ebf2] dark:border-zinc-700/80 hover:bg-slate-50 font-medium'
                          }`}
                        >
                          {lang === 'ar' ? m.labelAr : lang === 'nl' ? m.labelNl : m.labelEn}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 5. LESSON EVALUATION SECTION */}
            <div className="p-5 bg-white dark:bg-zinc-900 rounded-[16px] border border-[#e6ebf2] dark:border-zinc-800 shadow-2xs space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] dark:text-zinc-400 block border-b border-[#e6ebf2] dark:border-zinc-800 pb-2">
                {lang === 'ar' ? 'تقييم الحصة والتقدم' : lang === 'nl' ? 'LESSON EVALUATION' : 'LESSON EVALUATION'}
              </span>

              {/* Session Performance */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#64748b] dark:text-zinc-400">
                  {lang === 'ar' ? 'تقييم أداء المتدرب:' : lang === 'nl' ? 'Session Performance' : 'Session Performance'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { score: 5, labelAr: 'ممتاز', labelNl: 'Excellent', labelEn: 'Excellent', icon: Star },
                    { score: 3, labelAr: 'جيد', labelNl: 'Good', labelEn: 'Good', icon: ThumbsUp },
                    { score: 1, labelAr: 'يحتاج تحسين', labelNl: 'Needs Improvement', labelEn: 'Needs Improvement', icon: Activity },
                  ].map((p) => {
                    const isSelected = performanceRating === p.score;
                    const IconComp = p.icon;
                    return (
                      <button
                        key={p.score}
                        type="button"
                        onClick={() => setPerformanceRating(p.score)}
                        className={`py-2.5 px-3 rounded-[12px] text-xs transition cursor-pointer text-center min-h-[42px] flex items-center justify-center gap-2 font-bold whitespace-nowrap ${
                          isSelected
                            ? 'bg-[#1f4e94] text-white shadow-2xs'
                            : 'bg-white dark:bg-zinc-800 text-[#0f172a] dark:text-zinc-200 border border-[#e6ebf2] dark:border-zinc-700 hover:bg-slate-50'
                        }`}
                      >
                        <IconComp className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#64748b]'}`} />
                        <span>{lang === 'ar' ? p.labelAr : lang === 'nl' ? p.labelNl : p.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Topics Covered */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#64748b] dark:text-zinc-400">
                  {lang === 'ar' ? 'مواضيع التدريب:' : lang === 'nl' ? 'Topics Covered' : 'Topics Covered'}
                </label>
                <textarea
                  rows={2}
                  value={lessonNotes}
                  onChange={(e) => setLessonNotes(e.target.value)}
                  placeholder={
                    lang === 'ar'
                      ? 'الركن المتوازي، التحكم بالقابض، الدوارات...'
                      : 'Parallel parking, clutch control, highway joining...'
                  }
                  className="w-full p-3.5 bg-white dark:bg-zinc-900 border border-[#e6ebf2] dark:border-zinc-700/80 focus:border-[#1f4e94] focus:ring-1 focus:ring-[#1f4e94]/20 rounded-[12px] text-xs text-[#0f172a] dark:text-white placeholder:text-[#94a3b8] dark:placeholder:text-zinc-500 transition resize-none leading-relaxed"
                />
              </div>

              {/* Instructor Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#64748b] dark:text-zinc-400">
                  {lang === 'ar' ? 'توجيهات المدرب:' : lang === 'nl' ? 'Instructor Notes' : 'Instructor Notes'}
                </label>
                <textarea
                  rows={2}
                  value={instructorNotes}
                  onChange={(e) => setInstructorNotes(e.target.value)}
                  placeholder={
                    lang === 'ar'
                      ? 'التركيز على المراقبة المبكرة في المرايا...'
                      : 'Focus on early mirror checks before lane switches...'
                  }
                  className="w-full p-3.5 bg-white dark:bg-zinc-900 border border-[#e6ebf2] dark:border-zinc-700/80 focus:border-[#1f4e94] focus:ring-1 focus:ring-[#1f4e94]/20 rounded-[12px] text-xs text-[#0f172a] dark:text-white placeholder:text-[#94a3b8] dark:placeholder:text-zinc-500 transition resize-none leading-relaxed"
                />
              </div>
            </div>

          </form>

          {/* 6. FOOTER ACTIONS */}
          <div className="px-6 py-4 border-t border-[#e6ebf2] dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-[#0f172a] dark:text-zinc-200 border border-[#e6ebf2] dark:border-zinc-700 rounded-[12px] text-xs font-bold transition cursor-pointer min-h-[42px] flex items-center justify-center"
            >
              {lang === 'ar' ? 'إلغاء' : lang === 'nl' ? 'Cancel' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={() => handleFormSubmit()}
              className="px-6 py-2.5 bg-[#1f4e94] hover:bg-[#183e78] text-white active:scale-[0.98] rounded-[12px] text-xs font-bold shadow-2xs transition flex items-center gap-2 cursor-pointer min-h-[42px]"
            >
              <Check className="h-4 w-4 stroke-[2.5]" />
              <span>
                {lang === 'ar'
                  ? `إكمال الدرس #${lessonNumber}`
                  : lang === 'nl'
                  ? `Complete Lesson #${lessonNumber}`
                  : `Complete Lesson #${lessonNumber}`}
              </span>
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CompleteLessonModal;
