import React, { useState, useEffect } from 'react';
import { Mail, X, ArrowLeft, ArrowRight, Phone, MessageSquare, Globe, AlertCircle } from 'lucide-react';
import { Lesson, SchoolSettings } from '../types';
import { formatDisplayLessonNumber } from '../services/googleCalendarService';

interface PaymentReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson | null;
  schoolSettings?: SchoolSettings;
  lang: 'ar' | 'nl' | 'en';
  onSend: (lessonId: string, paymentLink: string, customNotes: string) => Promise<void> | void;
}

export const PaymentReminderModal: React.FC<PaymentReminderModalProps> = ({
  isOpen,
  onClose,
  lesson,
  schoolSettings,
  lang,
  onSend
}) => {
  const [paymentLink, setPaymentLink] = useState<string>('');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [activeView, setActiveView] = useState<'preview' | 'edit'>('preview');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [logoError, setLogoError] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync state when lesson changes
  useEffect(() => {
    if (lesson) {
      setPaymentLink(lesson.reminderLink || '');
      setCustomNotes(lesson.reminderNotes || '');
      setActiveView(lesson.reminderLink ? 'preview' : 'edit');
      setLogoError(false);
      setValidationError(null);
    }
  }, [lesson]);

  if (!isOpen || !lesson) return null;

  const isRtl = lang === 'ar';
  const schoolName = schoolSettings?.name?.trim() || (lang === 'ar' ? 'مدرسة القيادة' : lang === 'nl' ? 'Rijschool' : 'Driving School');
  const primaryColor = schoolSettings?.primaryColor || '#1f4e94';
  
  const displayLessonId = lesson.id.toUpperCase().startsWith('LES-')
    ? lesson.id.toUpperCase()
    : lesson.id.startsWith('l')
      ? `LES-00000${lesson.id.replace(/\D/g, '') || lesson.id}`
      : `${lesson.id}`;

  const hasPhone = Boolean(schoolSettings?.phone && schoolSettings.phone.trim());
  const hasWhatsapp = Boolean(schoolSettings?.whatsappNumber && schoolSettings.whatsappNumber.trim());
  const hasEmail = Boolean(schoolSettings?.email && schoolSettings.email.trim());
  const hasWebsite = Boolean(schoolSettings?.website && schoolSettings.website.trim());
  const hasAddress = Boolean(schoolSettings?.address && schoolSettings.address.trim());
  const hasCity = Boolean(schoolSettings?.city && schoolSettings.city.trim());
  const hasPostalCode = Boolean(schoolSettings?.postalCode && schoolSettings.postalCode.trim());
  const hasKvk = Boolean(schoolSettings?.kvk && schoolSettings.kvk.trim());

  const fullAddressParts = [
    schoolSettings?.address?.trim(),
    schoolSettings?.postalCode?.trim(),
    schoolSettings?.city?.trim()
  ].filter(Boolean);
  const fullAddress = fullAddressParts.join(', ');

  // Localized copy without any emojis
  const t = {
    modalTitle: lang === 'ar' ? 'تذكير بالدفع' : lang === 'nl' ? 'Betalingsherinnering' : 'Payment Reminder',
    modalSubtitle: lang === 'ar' 
      ? 'معاينة وإرسال رسالة تذكير احترافية للطالب' 
      : lang === 'nl' 
        ? 'Bekijk en verstuur een professionele herinnering naar de student' 
        : 'Preview and send a professional reminder to the student',
    tabPreview: lang === 'ar' ? 'معاينة الرسالة' : lang === 'nl' ? 'E-mail Voorbeeld' : 'Email Preview',
    tabEdit: lang === 'ar' ? 'تعديل البيانات' : lang === 'nl' ? 'Gegevens Aanpassen' : 'Edit Details',
    
    // Header & Meta
    fromLabel: lang === 'ar' ? 'من:' : lang === 'nl' ? 'Van:' : 'From:',
    toLabel: lang === 'ar' ? 'إلى:' : lang === 'nl' ? 'Aan:' : 'To:',
    subjectLabel: lang === 'ar' ? 'الموضوع:' : lang === 'nl' ? 'Onderwerp:' : 'Subject:',
    subjectText: lang === 'ar' 
      ? `تذكير بمستحقات درس القيادة - ${schoolName}` 
      : lang === 'nl' 
        ? `Betalingsherinnering rijles - ${schoolName}` 
        : `Driving Lesson Payment Reminder - ${schoolName}`,
    
    // Friendly Greeting & Message
    greeting: lang === 'ar' 
      ? `مرحباً ${lesson.studentName || 'بك'}،` 
      : lang === 'nl' 
        ? `Beste ${lesson.studentName || 'student'},` 
        : `Hello ${lesson.studentName || 'there'},`,
    subgreeting: lang === 'ar' 
      ? 'نتمنى أن تكون بخير.' 
      : lang === 'nl' 
        ? 'We hopen dat alles goed met je gaat.' 
        : 'We hope you are doing well.',
    introText: lang === 'ar'
      ? 'نود أن نذكرك بلطف بأن رسوم درس القيادة الموضح أدناه ما زالت غير مسددة. يمكنك سداد المبلغ بسهولة عبر الضغط على زر الدفع أدناه.'
      : lang === 'nl'
        ? 'Hierbij willen we je er vriendelijk aan herinneren dat het lesgeld voor de onderstaande rijles nog openstaat. Je kunt het bedrag eenvoudig voldoen via de onderstaande betaalknop.'
        : 'We would like to kindly remind you that the payment for the driving lesson shown below is still outstanding. You can easily settle the amount using the payment button below.',
    
    // Lesson Details Card
    cardTitle: lang === 'ar' ? 'تفاصيل الدرس' : lang === 'nl' ? 'Lesdetails' : 'Lesson Details',
    lessonNumLabel: lang === 'ar' ? 'رقم الدرس' : lang === 'nl' ? 'Lesnummer' : 'Lesson Ref',
    dateLabel: lang === 'ar' ? 'تاريخ الدرس' : lang === 'nl' ? 'Datum' : 'Date',
    timeLabel: lang === 'ar' ? 'وقت الدرس' : lang === 'nl' ? 'Tijdstip' : 'Time',
    pickupLabel: lang === 'ar' ? 'مكان الالتقاء' : lang === 'nl' ? 'Ophaallocatie' : 'Pickup Location',
    amountLabel: lang === 'ar' ? 'المبلغ المستحق' : lang === 'nl' ? 'Openstaand bedrag' : 'Amount Due',
    
    // Payment Button (Larger Primary CTA)
    payNow: lang === 'ar' ? 'دفع الآن' : lang === 'nl' ? 'Nu betalen' : 'Pay Now',
    
    // Friendly closing
    friendlyClosing: lang === 'ar'
      ? 'شكراً لاختيارك مدرستنا وثقتك بنا، ونتطلع لرؤيتك في درسك القادم.'
      : lang === 'nl'
        ? 'Hartelijk dank voor je vertrouwen in onze rijschool. We kijken ernaar uit je bij de volgende les te zien.'
        : 'Thank you for choosing our driving school and for your trust. We look forward to seeing you at your next lesson.',
    
    // Trainer note
    trainerNoteTitle: lang === 'ar' ? 'رسالة من مدربك' : lang === 'nl' ? 'Bericht van je instructeur' : 'Message from your instructor',
    trainerNoteLabel: lang === 'ar' ? 'رسالة من مدربك (اختياري)' : lang === 'nl' ? 'Bericht van je instructeur (optioneel)' : 'Message from your instructor (optional)',
    trainerNotePlaceholder: lang === 'ar' ? 'اكتب ملاحظة أو رسالة قصيرة للطالب تظهر داخل صندوق أنيق...' : lang === 'nl' ? 'Schrijf een korte opmerking voor de student...' : 'Write a short note for the student...',
    
    // Help & Contact
    helpTitle: lang === 'ar' ? 'تحتاج إلى مساعدة؟' : lang === 'nl' ? 'Hulp nodig?' : 'Need help?',
    contactUs: lang === 'ar' ? 'تواصل معنا:' : lang === 'nl' ? 'Neem contact met ons op:' : 'Contact us:',
    phoneLabel: lang === 'ar' ? 'الهاتف' : lang === 'nl' ? 'Telefoon' : 'Phone',
    whatsappLabel: lang === 'ar' ? 'واتساب' : lang === 'nl' ? 'WhatsApp' : 'WhatsApp',
    emailLabel: lang === 'ar' ? 'البريد الإلكتروني' : lang === 'nl' ? 'E-mail' : 'Email',
    websiteLabel: lang === 'ar' ? 'الموقع الإلكتروني' : lang === 'nl' ? 'Website' : 'Website',
    
    // Form Labels
    paymentLinkLabel: lang === 'ar' ? 'رابط الدفع الإلكتروني (يدوي):' : lang === 'nl' ? 'Betaallink (handmatig invoeren):' : 'Payment Link (manual entry):',
    paymentLinkHelp: lang === 'ar' 
      ? 'أدخل رابط الدفع المخصص (مثل iDEAL أو رابط بوابة الدفع). لن يظهر الرابط كنص عادي في البريد، بل سيرتبط بزر "دفع الآن" البارز.' 
      : lang === 'nl' 
        ? 'Voer de handmatige betaallink in. De link wordt niet als tekst getoond, maar uitsluitend gekoppeld aan de grote betaalknop.' 
        : 'Enter the manual payment link. The link will not appear as raw text, only as the link behind the prominent Pay Now button.',
    paymentLinkPlaceholder: 'https://...',
    
    // Validation messages
    valMissingLink: lang === 'ar'
      ? 'يرجى إدخال رابط الدفع يدويًا قبل إرسال الرسالة.'
      : lang === 'nl'
        ? 'Voer eerst handmatig de betaallink in voordat u de e-mail verzendt.'
        : 'Please enter the payment link manually before sending the email.',
    
    // Actions
    btnSend: lang === 'ar' ? 'إرسال البريد' : lang === 'nl' ? 'E-mail verzenden' : 'Send Email',
    btnBackToEdit: lang === 'ar' ? 'العودة للتعديل' : lang === 'nl' ? 'Gegevens aanpassen' : 'Back to Edit',
    btnPreview: lang === 'ar' ? 'معاينة الرسالة' : lang === 'nl' ? 'Bekijk voorbeeld' : 'Preview Email',
    btnCancel: lang === 'ar' ? 'إلغاء' : lang === 'nl' ? 'Annuleren' : 'Cancel',
    sending: lang === 'ar' ? 'جاري الإرسال...' : lang === 'nl' ? 'Verzenden...' : 'Sending...',
    noLinkNotice: lang === 'ar' ? 'يرجى إدخال رابط الدفع لتفعيل زر الدفع قبل الإرسال.' : lang === 'nl' ? 'Voer eerst de betaallink in om de betaalknop te activeren.' : 'Please enter the payment link to activate the payment button.'
  };

  const handleSendClick = async () => {
    // 1. Validate Payment Link (Must be entered manually)
    const trimmedLink = paymentLink.trim();
    if (!trimmedLink) {
      setValidationError(t.valMissingLink);
      setActiveView('edit');
      return;
    }

    setValidationError(null);
    setIsSending(true);

    try {
      await onSend(lesson.id, trimmedLink, customNotes.trim());
      onClose();
    } catch (err) {
      console.error('Failed to dispatch payment reminder:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[94vh]"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e8f0fe] dark:bg-blue-950/60 text-[#1f4e94] dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
              <Mail className="h-5 w-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                {t.modalTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                {t.modalSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher Tabs */}
            <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setValidationError(null);
                  setActiveView('preview');
                }}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activeView === 'preview'
                    ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.tabPreview}
              </button>
              <button
                type="button"
                onClick={() => setActiveView('edit')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activeView === 'edit'
                    ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.tabEdit}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title={t.btnCancel}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Validation Error Banner if present */}
        {validationError && (
          <div className="px-4 py-3 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/60 flex items-center gap-2.5 text-rose-700 dark:text-rose-300 text-xs font-semibold shrink-0 animate-fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Modal Scrollable Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-slate-50/50 dark:bg-zinc-950/40">
          
          {/* EDIT VIEW */}
          {activeView === 'edit' && (
            <div className="space-y-4 max-w-xl mx-auto animate-fade-in">
              
              {/* Quick Summary of Student & Lesson */}
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block font-medium">{lang === 'ar' ? 'المتدرب' : lang === 'nl' ? 'Student' : 'Student'}</span>
                  <span className="font-bold text-slate-800 dark:text-zinc-100">{lesson.studentName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block font-medium">{t.amountLabel}</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">€{lesson.price}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block font-medium">{t.dateLabel}</span>
                  <span className="font-medium text-slate-700 dark:text-zinc-300 font-mono">{lesson.date} ({lesson.time})</span>
                </div>
              </div>

              {/* Manual Payment Link Input */}
              <div className="space-y-1.5 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
                <label className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">
                  {t.paymentLinkLabel} <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-normal">
                  {t.paymentLinkHelp}
                </p>
                <input
                  type="url"
                  value={paymentLink}
                  onChange={(e) => {
                    setPaymentLink(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder={t.paymentLinkPlaceholder}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border rounded-xl text-xs font-mono dark:text-white focus:outline-hidden focus:ring-2 transition ${
                    validationError ? 'border-rose-400 ring-rose-300' : 'border-slate-200 dark:border-zinc-800 focus:ring-slate-400'
                  }`}
                  dir="ltr"
                  autoFocus
                />
              </div>

              {/* Instructor Custom Note Input */}
              <div className="space-y-1.5 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
                <label className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">
                  {t.trainerNoteLabel}
                </label>
                <textarea
                  rows={3}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder={t.trainerNotePlaceholder}
                  className="w-full p-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-slate-400 transition leading-relaxed resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setValidationError(null);
                    setActiveView('preview');
                  }}
                  className="px-5 py-2.5 bg-[#1f4e94] hover:bg-[#183e78] text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  <span>{t.btnPreview}</span>
                  {isRtl ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {/* PREVIEW VIEW (The WYSIWYG Real Email Message) */}
          {activeView === 'preview' && (
            <div className="space-y-3 max-w-xl mx-auto animate-fade-in">
              
              {/* Simulated Email Client Frame */}
              <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm overflow-hidden text-slate-800 dark:text-zinc-100">
                
                {/* Email Meta Info Bar */}
                <div className="p-3.5 bg-slate-50/80 dark:bg-zinc-950/80 border-b border-slate-100 dark:border-zinc-800 text-[11px] space-y-1 text-slate-500 dark:text-zinc-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700 dark:text-zinc-300">{t.fromLabel}</span>
                    <span className="text-slate-900 dark:text-zinc-100 font-semibold">{schoolName}</span>
                    {hasEmail && <span className="text-slate-400 font-mono text-[10px]" dir="ltr">&lt;{schoolSettings?.email}&gt;</span>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700 dark:text-zinc-300">{t.toLabel}</span>
                    <span className="text-slate-900 dark:text-zinc-100 font-semibold">{lesson.studentName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-0.5 border-t border-slate-200/50 dark:border-zinc-800/50">
                    <span className="font-semibold text-slate-700 dark:text-zinc-300">{t.subjectLabel}</span>
                    <span className="text-slate-900 dark:text-zinc-100 font-bold">{t.subjectText}</span>
                  </div>
                </div>

                {/* Email Core Body Canvas */}
                <div className="p-6 sm:p-8 space-y-6 text-sm leading-relaxed">
                  
                  {/* Clean School Header (Dynamic Data Only) */}
                  <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                      {schoolSettings?.logoUrl && !logoError ? (
                        <img
                          src={schoolSettings.logoUrl}
                          alt={schoolName}
                          onError={() => setLogoError(true)}
                          className="h-10 w-auto max-w-[140px] object-contain shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                          {schoolName}
                        </span>
                      )}
                    </div>

                    {(hasPhone || hasEmail) && (
                      <div className="text-[11px] text-slate-400 dark:text-zinc-400 text-end font-medium">
                        {hasPhone && <p dir="ltr">{schoolSettings?.phone}</p>}
                        {hasEmail && <p dir="ltr">{schoolSettings?.email}</p>}
                      </div>
                    )}
                  </div>

                  {/* Greeting & Introductory Message (Friendly and Human) */}
                  <div className="space-y-2 text-slate-700 dark:text-zinc-200">
                    <p className="font-bold text-slate-900 dark:text-white text-base">
                      {t.greeting}
                    </p>
                    <p className="text-slate-600 dark:text-zinc-300 text-xs sm:text-sm leading-relaxed">
                      {t.subgreeting}
                    </p>
                    <p className="text-slate-600 dark:text-zinc-300 text-xs sm:text-sm leading-relaxed pt-0.5">
                      {t.introText}
                    </p>
                  </div>

                  {/* Single Minimal Lesson Details Card */}
                  <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-zinc-700/60 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-zinc-700/60 pb-2.5">
                      <h5 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                        {t.cardTitle}
                      </h5>
                      <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                        {formatDisplayLessonNumber(lesson, undefined, lang)}
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-zinc-400 font-medium">{t.dateLabel}</span>
                        <span className="font-semibold text-slate-800 dark:text-zinc-200 font-mono">{lesson.date}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-zinc-400 font-medium">{t.timeLabel}</span>
                        <span className="font-semibold text-slate-800 dark:text-zinc-200 font-mono">{lesson.time}</span>
                      </div>
                      {lesson.pickupLocation && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500 dark:text-zinc-400 font-medium shrink-0">{t.pickupLabel}</span>
                          <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate max-w-[240px]">{lesson.pickupLocation}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/60 dark:border-zinc-700/60">
                        <span className="text-slate-900 dark:text-white font-bold text-xs">{t.amountLabel}</span>
                        <span className="font-extrabold text-slate-900 dark:text-white font-mono text-lg">€{lesson.price}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Button (Significantly Larger Primary CTA - Full Width, No raw URL) */}
                  <div className="pt-2">
                    {paymentLink.trim() ? (
                      <a
                        href={paymentLink.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full block py-4 sm:py-4.5 px-6 rounded-xl font-bold text-base sm:text-lg text-white shadow-sm hover:opacity-95 transition text-center tracking-wide min-h-[52px] cursor-pointer"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {t.payNow}
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveView('edit')}
                        className="w-full block py-4 sm:py-4.5 px-6 rounded-xl font-bold text-base sm:text-lg text-white shadow-sm hover:opacity-95 transition text-center tracking-wide min-h-[52px] cursor-pointer"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {t.payNow}
                      </button>
                    )}
                    
                    {!paymentLink.trim() && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 text-center font-medium">
                        {t.noLinkNotice}
                      </p>
                    )}
                  </div>

                  {/* Friendly Closing Note */}
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed text-center max-w-md mx-auto">
                    {t.friendlyClosing}
                  </p>

                  {/* Instructor's Personal Message (Conditional - Completely hidden if empty) */}
                  {customNotes.trim() && (
                    <div className="bg-slate-50 dark:bg-zinc-800/40 rounded-xl p-4 border-s-2 border-slate-300 dark:border-zinc-600 space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                        {t.trainerNoteTitle}
                      </span>
                      <p className="text-xs text-slate-700 dark:text-zinc-200 leading-relaxed font-medium italic">
                        "{customNotes.trim()}"
                      </p>
                    </div>
                  )}

                  {/* Help & Contact Section (Dynamic Data Only - Hidden if missing) */}
                  {(hasPhone || hasWhatsapp || hasEmail || hasWebsite) && (
                    <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-2 text-center text-xs">
                      <p className="font-semibold text-slate-700 dark:text-zinc-300">
                        {t.helpTitle} <span className="font-normal text-slate-500 dark:text-zinc-400">{t.contactUs}</span>
                      </p>
                      
                      <div className="flex flex-wrap items-center justify-center gap-3 text-slate-600 dark:text-zinc-400 font-medium">
                        {hasPhone && (
                          <a href={`tel:${schoolSettings!.phone.replace(/\s+/g, '')}`} className="hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span dir="ltr">{schoolSettings!.phone}</span>
                          </a>
                        )}
                        {hasWhatsapp && (
                          <a href={`https://wa.me/${schoolSettings!.whatsappNumber!.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>{t.whatsappLabel}</span>
                          </a>
                        )}
                        {hasEmail && (
                          <a href={`mailto:${schoolSettings!.email}`} className="hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{schoolSettings!.email}</span>
                          </a>
                        )}
                        {hasWebsite && (
                          <a href={schoolSettings!.website!.startsWith('http') ? schoolSettings!.website : `https://${schoolSettings!.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            <span dir="ltr">{schoolSettings!.website}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Email Footer (Dynamic Data Only) */}
                  <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 text-center text-[11px] text-slate-400 dark:text-zinc-500 space-y-1 font-medium">
                    <p className="font-semibold text-slate-600 dark:text-zinc-400">
                      {schoolName}
                    </p>
                    {fullAddress && (
                      <p>{fullAddress}</p>
                    )}
                    {hasKvk && (
                      <p>KvK: {schoolSettings!.kvk}</p>
                    )}
                    <p className="text-[10px] text-slate-400 dark:text-zinc-600 pt-1">
                      &copy; {new Date().getFullYear()} {schoolName}. All rights reserved.
                    </p>
                  </div>

                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Actions Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            {t.btnCancel}
          </button>

          <div className="flex items-center gap-2">
            {activeView === 'preview' ? (
              <button
                type="button"
                onClick={() => setActiveView('edit')}
                className="px-4 py-2.5 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {t.btnBackToEdit}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setValidationError(null);
                  setActiveView('preview');
                }}
                className="px-4 py-2.5 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {t.btnPreview}
              </button>
            )}

            <button
              type="button"
              onClick={handleSendClick}
              disabled={isSending}
              className="px-6 py-2.5 bg-[#1f4e94] hover:bg-[#183e78] text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isSending ? (
                <span>{t.sending}</span>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  <span>{t.btnSend}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
