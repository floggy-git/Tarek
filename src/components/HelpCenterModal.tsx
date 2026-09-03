import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Question, 
  MagnifyingGlass, 
  CaretDown, 
  CaretUp,
  CalendarCheck,
  CreditCard,
  User,
  Bell,
  ChatCircleText,
  Wrench,
  SquaresFour
} from '@phosphor-icons/react';
import { 
  Phone as LucidePhone, 
  MessageCircle as LucideMessageCircle, 
  Mail as LucideMail 
} from 'lucide-react';
import { Language, SchoolSettings, HelpFaqItem, getSchoolName } from '../types';
import { getSheetsConfig, loadHelpItemsFromGoogleSheet, getDefaultHelpFaqItems } from '../utils/googleSheets';

interface HelpCenterModalProps {
  lang: Language;
  schoolSettings: Partial<SchoolSettings> | null;
  onClose: () => void;
}

export default function HelpCenterModal({
  lang,
  schoolSettings,
  onClose
}: HelpCenterModalProps) {
  const isRtl = lang === 'ar';

  const [faqItems, setFaqItems] = useState<HelpFaqItem[]>(() => getDefaultHelpFaqItems());
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Auto-fetch questions from Google Sheets 'Help & Support' tab
  useEffect(() => {
    let isMounted = true;
    const config = getSheetsConfig();

    if (config.spreadsheetId && (config.apiKey || config.accessToken)) {
      setIsLoading(true);
      loadHelpItemsFromGoogleSheet(config)
        .then(items => {
          if (isMounted && items && items.length > 0) {
            setFaqItems(items);
          }
        })
        .catch(err => {
          console.warn("Could not fetch FAQ items from Google Sheets, using defaults:", err);
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Category definitions with localized labels and icons
  const categories = useMemo(() => [
    {
      id: 'ALL',
      label: isRtl ? 'الكل' : lang === 'nl' ? 'Alles' : 'All',
      icon: SquaresFour
    },
    {
      id: 'Bookings & Lessons',
      label: isRtl ? 'الحجوزات والدروس' : lang === 'nl' ? 'Lessen & Boekingen' : 'Bookings & Lessons',
      icon: CalendarCheck
    },
    {
      id: 'Payments & Packages',
      label: isRtl ? 'المدفوعات والباقات' : lang === 'nl' ? 'Betalingen & Pakketten' : 'Payments & Packages',
      icon: CreditCard
    },
    {
      id: 'Account & Profile',
      label: isRtl ? 'الحساب والملف الشخصي' : lang === 'nl' ? 'Account & Profiel' : 'Account & Profile',
      icon: User
    },
    {
      id: 'Notifications',
      label: isRtl ? 'الإشعارات' : lang === 'nl' ? 'Meldingen' : 'Notifications',
      icon: Bell
    },
    {
      id: 'Frequently Asked Questions',
      label: isRtl ? 'الأسئلة الشائعة' : lang === 'nl' ? 'Veelgestelde Vragen' : 'FAQ',
      icon: ChatCircleText
    },
    {
      id: 'Technical Issues',
      label: isRtl ? 'المشاكل التقنية' : lang === 'nl' ? 'Technische Vragen' : 'Technical Issues',
      icon: Wrench
    }
  ], [isRtl, lang]);

  // Helper to get localized question text
  const getQuestionText = (item: HelpFaqItem): string => {
    if (lang === 'ar') return item.questionAr || item.questionEn || item.questionNl;
    if (lang === 'nl') return item.questionNl || item.questionEn || item.questionAr;
    return item.questionEn || item.questionNl || item.questionAr;
  };

  // Helper to get localized answer text
  const getAnswerText = (item: HelpFaqItem): string => {
    if (lang === 'ar') return item.answerAr || item.answerEn || item.answerNl;
    if (lang === 'nl') return item.answerNl || item.answerEn || item.answerAr;
    return item.answerEn || item.answerNl || item.answerAr;
  };

  // Helper to get category localized label
  const getCategoryLabel = (catKey: string): string => {
    const match = categories.find(c => c.id.toLowerCase() === catKey.toLowerCase());
    if (match && match.id !== 'ALL') return match.label;
    return catKey;
  };

  // Filtered FAQ items based on selectedCategory and searchQuery
  const filteredFaqs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return faqItems
      .filter(item => item.active !== false)
      .filter(item => {
        // Category filter
        if (selectedCategory !== 'ALL') {
          const itemCat = (item.category || '').toLowerCase();
          const targetCat = selectedCategory.toLowerCase();
          if (itemCat !== targetCat && !itemCat.includes(targetCat) && !targetCat.includes(itemCat)) {
            return false;
          }
        }

        // Search query filter
        if (query) {
          const qAr = (item.questionAr || '').toLowerCase();
          const aAr = (item.answerAr || '').toLowerCase();
          const qNl = (item.questionNl || '').toLowerCase();
          const aNl = (item.answerNl || '').toLowerCase();
          const qEn = (item.questionEn || '').toLowerCase();
          const aEn = (item.answerEn || '').toLowerCase();
          const cat = (item.category || '').toLowerCase();

          return (
            qAr.includes(query) ||
            aAr.includes(query) ||
            qNl.includes(query) ||
            aNl.includes(query) ||
            qEn.includes(query) ||
            aEn.includes(query) ||
            cat.includes(query)
          );
        }

        return true;
      })
      .sort((a, b) => a.order - b.order);
  }, [faqItems, selectedCategory, searchQuery]);

  // Toggle item expansion
  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in" 
      dir={isRtl ? 'rtl' : 'ltr'}
      id="help-support-modal-backdrop"
    >
      <div 
        className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full border border-slate-200/80 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden animate-scale-up"
        id="help-support-modal-card"
      >
        {/* Modal Top Header (Sticky) */}
        <div className="flex items-center justify-between p-4 sm:p-5 pb-3 sm:pb-4 border-b border-slate-100 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
              <Question size={22} weight="bold" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                {isRtl ? 'مركز المساعدة والدعم' : lang === 'nl' ? 'Help & Support Center' : 'Help & Support Center'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                {getSchoolName(schoolSettings)}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
            aria-label={isRtl ? 'إغلاق' : 'Close'}
            id="close-help-modal-btn"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Section 1: Search Field & Category Chips (Sticky directly below header) */}
        <div className="p-4 sm:p-5 pb-3 shrink-0 bg-white dark:bg-zinc-900 space-y-2.5 border-b border-slate-100 dark:border-zinc-800/80 z-10">
          {/* Prominent Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400 dark:text-zinc-500">
              <MagnifyingGlass size={16} weight="bold" />
            </div>
            <input
              type="text"
              id="help-faq-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isRtl 
                  ? 'اكتب سؤالك أو ابحث عن موضوع...' 
                  : lang === 'nl' 
                  ? 'Typ je vraag of zoek naar een onderwerp...' 
                  : 'Type your question or search for a topic...'
              }
              className="w-full ps-10 pe-9 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200/90 dark:border-zinc-800 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
                aria-label="Clear search"
              >
                <X size={14} weight="bold" />
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-0.5">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const IconComponent = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                  }`}
                >
                  <IconComponent size={13} weight={isSelected ? 'fill' : 'bold'} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 overscroll-contain" id="help-modal-scrollable-body">
          
          {/* Section 2: FAQ Accordion Results (Immediately below category chips) */}
          <div className="space-y-2.5" id="faq-accordion-list">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((item) => {
                const isExpanded = Boolean(expandedIds[item.id]);
                const qText = getQuestionText(item);
                const aText = getAnswerText(item);

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200/80 dark:border-zinc-800/90 bg-slate-50/70 dark:bg-zinc-950/60 overflow-hidden transition-all duration-200"
                  >
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.id)}
                      className="w-full flex items-center justify-between p-3.5 text-start cursor-pointer hover:bg-slate-100/60 dark:hover:bg-zinc-900/60 transition-colors gap-3"
                      aria-expanded={isExpanded}
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 leading-snug block">
                          {qText}
                        </span>
                      </div>
                      <div className="p-1 rounded-lg bg-white dark:bg-zinc-800 text-slate-400 dark:text-zinc-400 shrink-0 border border-slate-200/60 dark:border-zinc-700/60">
                        {isExpanded ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 pt-1 text-xs text-slate-600 dark:text-zinc-300 border-t border-slate-100 dark:border-zinc-800/80 leading-relaxed bg-white/70 dark:bg-zinc-900/70">
                        <p className="whitespace-pre-line text-[11.5px]">{aText}</p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/70 dark:border-zinc-800/70 text-center space-y-1.5">
                <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  {isRtl ? 'لم يتم العثور على نتائج مطابقة' : lang === 'nl' ? 'Geen overeenkomende vragen gevonden' : 'No matching questions found'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  {isRtl 
                    ? 'يمكنك التواصل مباشرة مع فريق المدرسة عبر خيارات الاتصال أدناه.' 
                    : lang === 'nl' 
                    ? 'Je kunt direct contact opnemen met de rijschool via de onderstaande opties.' 
                    : 'You can reach out directly to the driving school team using the options below.'}
                </p>
              </div>
            )}
          </div>

          {/* Divider between Help Center & Contact Options */}
          <div className="pt-2">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200/80 dark:border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white dark:bg-zinc-900 px-3 text-[10.5px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                  {isRtl ? 'أو تواصل معنا' : lang === 'nl' ? 'Of neem contact op' : 'Or contact us'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Existing Contact Options (Preserved Exactly) */}
          <div className="space-y-3">
            {/* Instruction Banner Above Contact Buttons */}
            <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium leading-relaxed">
              {isRtl 
                ? 'لم تجد ما تبحث عنه؟ تواصل معنا للحصول على مساعدة إضافية:' 
                : lang === 'nl' 
                ? 'Niet gevonden wat je zocht? Neem contact met ons op voor verdere hulp:' 
                : "Didn't find what you're looking for? Contact us if you need further assistance:"}
            </p>

            {/* 📞 Phone Action */}
            {Boolean(schoolSettings?.phone && schoolSettings.phone.trim()) && (
              <a
                href={`tel:${schoolSettings!.phone.replace(/\s+/g, '')}`}
                className="group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950/70 dark:hover:bg-zinc-800/90 border border-slate-200/70 dark:border-zinc-800 transition-all duration-200 cursor-pointer active:scale-[0.98] shadow-2xs"
                id="contact-phone-link"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <LucidePhone className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {isRtl ? 'اتصال هاتفي مباشر' : lang === 'nl' ? 'Telefonisch contact' : 'Direct Phone Call'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 truncate mt-0.5" dir="ltr">
                      {schoolSettings!.phone}
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60 text-blue-600 dark:text-blue-400 text-xs font-bold group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors shrink-0">
                  {isRtl ? 'اتصال' : lang === 'nl' ? 'Bellen' : 'Call'}
                </div>
              </a>
            )}

            {/* 💬 WhatsApp Action */}
            {Boolean(schoolSettings?.whatsappNumber && schoolSettings.whatsappNumber.trim()) && (
              <a
                href={`https://wa.me/${schoolSettings!.whatsappNumber.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-emerald-50/60 hover:bg-emerald-100/70 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-900/40 transition-all duration-200 cursor-pointer active:scale-[0.98] shadow-2xs"
                id="contact-whatsapp-link"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <LucideMessageCircle className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {isRtl ? 'مراسلة عبر واتساب' : lang === 'nl' ? 'WhatsApp Business' : 'WhatsApp Chat'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 truncate mt-0.5" dir="ltr">
                      {schoolSettings!.whatsappNumber}
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-emerald-600 text-white text-xs font-bold group-hover:bg-emerald-700 transition-colors shrink-0 shadow-2xs">
                  {isRtl ? 'مراسلة' : lang === 'nl' ? 'Chatten' : 'Chat'}
                </div>
              </a>
            )}

            {/* ✉️ Email Action */}
            {Boolean(schoolSettings?.email && schoolSettings.email.trim()) && (
              <a
                href={`mailto:${schoolSettings!.email}`}
                className="group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950/70 dark:hover:bg-zinc-800/90 border border-slate-200/70 dark:border-zinc-800 transition-all duration-200 cursor-pointer active:scale-[0.98] shadow-2xs"
                id="contact-email-link"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <LucideMail className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {isRtl ? 'إرسال بريد إلكتروني' : lang === 'nl' ? 'E-mail sturen' : 'Send Email'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5" dir="ltr">
                      {schoolSettings!.email}
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-colors shrink-0">
                  {isRtl ? 'إرسال' : lang === 'nl' ? 'Mailen' : 'Email'}
                </div>
              </a>
            )}

            {/* Fallback if no contact detail is configured */}
            {!schoolSettings?.phone && !schoolSettings?.whatsappNumber && !schoolSettings?.email && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-center text-xs text-amber-700 dark:text-amber-400 font-medium">
                {isRtl ? 'لم يتم تحديد معلومات الاتصال بمدرسة السياقة بعد.' : 'No contact channels are currently configured by the school.'}
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Footer (Sticky) */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900">
          <button
            onClick={onClose}
            id="close-help-modal-footer-btn"
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-900 dark:text-white rounded-2xl text-xs font-bold cursor-pointer transition active:scale-[0.98]"
          >
            {isRtl ? 'إغلاق' : lang === 'nl' ? 'Sluiten' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
