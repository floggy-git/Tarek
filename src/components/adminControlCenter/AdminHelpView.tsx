import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Search,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  Edit2,
  CheckCircle2,
  X,
  Save,
  Globe
} from 'lucide-react';
import { HelpFaqItem } from '../../types';
import { AdminLang, ADMIN_I18N } from './types';
import { recordAdminAuditLog } from '../../utils/adminAuditLogger';
import { syncHelpItemsFromSheet, syncHelpItemsToSheet } from '../../services/googleSheetsService';

interface AdminHelpViewProps {
  lang: AdminLang;
  spreadsheetId: string;
  onShowMessage: (msg: string, isError?: boolean) => void;
}

const DEFAULT_FAQS: HelpFaqItem[] = [
  {
    id: 'FAQ-001',
    category: 'Lessons',
    questionAr: 'كم تبلغ مدة درس القيادة الفعلي؟',
    answerAr: 'مدة الدرس العملي القياسي هي 60 أو 90 دقيقة من التدريب المكثف على الطرقات.',
    questionNl: 'Hoe lang duurt een standaard rijles?',
    answerNl: 'Een standaard praktijkles duurt 60 of 90 minuten intensieve begeleiding op de openbare weg.',
    questionEn: 'How long is a standard driving lesson?',
    answerEn: 'A standard practical lesson lasts 60 or 90 minutes of intensive on-road training.',
    active: true,
    order: 1
  },
  {
    id: 'FAQ-002',
    category: 'CBR Exam',
    questionAr: 'متى يمكنني التقدم لاختبار القيادة العملي CBR؟',
    answerAr: 'بمجرد اجتياز اختبار النظرية وتحقيق نسبة جاهزية لا تقل عن 70% في تقييم المدرب.',
    questionNl: 'Wanneer kan ik het CBR praktijkexamen aanvragen?',
    answerNl: 'Zodra je theoriecertificaat is behaald en je minimaal 70% examengereedheid hebt bereikt.',
    questionEn: 'When can I apply for the CBR practical exam?',
    answerEn: 'As soon as your theory certificate is passed and you achieve at least 70% exam readiness.',
    active: true,
    order: 2
  }
];

export default function AdminHelpView({
  lang,
  spreadsheetId,
  onShowMessage
}: AdminHelpViewProps) {
  const [faqs, setFaqs] = useState<HelpFaqItem[]>(() => {
    try {
      const raw = localStorage.getItem('drivingschool_faqs');
      if (raw) return JSON.parse(raw);
    } catch {}
    return DEFAULT_FAQS;
  });

  const [selectedFaq, setSelectedFaq] = useState<HelpFaqItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const t = ADMIN_I18N[lang];

  useEffect(() => {
    try {
      localStorage.setItem('drivingschool_faqs', JSON.stringify(faqs));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }, [faqs]);

  const filtered = faqs.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      item.questionAr.toLowerCase().includes(q) ||
      item.questionNl.toLowerCase().includes(q) ||
      item.questionEn.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const handleOpenEdit = (item: HelpFaqItem) => {
    setSelectedFaq({ ...item });
    setIsNew(false);
  };

  const handleOpenNew = () => {
    const nextNum = faqs.length + 1;
    setSelectedFaq({
      id: `FAQ-${String(nextNum).padStart(3, '0')}`,
      category: 'General',
      questionAr: '',
      answerAr: '',
      questionNl: '',
      answerNl: '',
      questionEn: '',
      answerEn: '',
      active: true,
      order: nextNum
    });
    setIsNew(true);
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFaq) return;

    let updated: HelpFaqItem[];
    if (isNew) {
      updated = [...faqs, selectedFaq].sort((a, b) => a.order - b.order);
    } else {
      updated = faqs.map(f => (f.id === selectedFaq.id ? selectedFaq : f)).sort((a, b) => a.order - b.order);
    }

    setFaqs(updated);

    await recordAdminAuditLog({
      action: isNew ? 'FAQ Created' : 'FAQ Updated',
      targetRecord: `FAQ ID: ${selectedFaq.id} (${selectedFaq.category})`,
      newValue: `${selectedFaq.questionEn || selectedFaq.questionAr || selectedFaq.questionNl}`,
      changedBy: 'Admin Control Center',
      source: 'Admin Portal'
    });

    onShowMessage(
      lang === 'ar' ? 'تم حفظ السؤال الشائع بنجاح' : 'FAQ item saved successfully.'
    );
    setSelectedFaq(null);
  };

  const handlePullFromSheet = async () => {
    setIsSyncing(true);
    try {
      const res = await syncHelpItemsFromSheet(spreadsheetId);
      if (res.success && res.data && res.data.length > 0) {
        setFaqs(res.data);
        await recordAdminAuditLog({
          action: 'FAQs Synced from Sheet',
          targetRecord: 'Tab: Help & Support',
          newValue: `${res.data.length} FAQs imported`,
          source: 'Google Sheets'
        });
        onShowMessage(
          lang === 'ar'
            ? `تم جلب ${res.data.length} سؤال من Google Sheets`
            : `Pulled ${res.data.length} FAQs from Google Sheets.`
        );
      } else {
        onShowMessage(res.error || 'No FAQ items found in sheet.', true);
      }
    } catch (err: any) {
      onShowMessage(err.message || 'Error syncing FAQs.', true);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushToSheet = async () => {
    setIsSyncing(true);
    try {
      const res = await syncHelpItemsToSheet(spreadsheetId, faqs);
      if (res.success) {
        await recordAdminAuditLog({
          action: 'FAQs Pushed to Sheet',
          targetRecord: 'Tab: Help & Support',
          newValue: `${faqs.length} FAQs written`,
          source: 'Control Center'
        });
        onShowMessage(
          lang === 'ar'
            ? `تم تصدير ${faqs.length} سؤال إلى Google Sheets بنجاح`
            : `Pushed ${faqs.length} FAQs to Google Sheets.`
        );
      } else {
        onShowMessage(res.error || 'Failed to write FAQs.', true);
      }
    } catch (err: any) {
      onShowMessage(err.message || 'Error writing FAQs.', true);
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
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>{lang === 'ar' ? 'إضافة سؤال شائع' : 'Add FAQ'}</span>
          </button>
        </div>
      </div>

      {/* FAQs List */}
      <div className="space-y-3">
        {filtered.map(item => (
          <div
            key={item.id}
            className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-purple-600 dark:text-purple-400">
                  {item.id}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                  {item.category}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {item.active ? 'Active' : 'Disabled'}
                </span>
              </div>

              <button
                onClick={() => handleOpenEdit(item)}
                className="px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <Edit2 size={12} />
                <span>{t.actions.edit}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-850 border border-slate-100 dark:border-zinc-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">English</span>
                <p className="font-bold text-slate-800 dark:text-zinc-200 mt-1">{item.questionEn}</p>
                <p className="text-[11px] text-slate-500 mt-1">{item.answerEn}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-850 border border-slate-100 dark:border-zinc-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Nederlands</span>
                <p className="font-bold text-slate-800 dark:text-zinc-200 mt-1">{item.questionNl}</p>
                <p className="text-[11px] text-slate-500 mt-1">{item.answerNl}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-850 border border-slate-100 dark:border-zinc-800" dir="rtl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">العربية</span>
                <p className="font-bold text-slate-800 dark:text-zinc-200 mt-1">{item.questionAr}</p>
                <p className="text-[11px] text-slate-500 mt-1">{item.answerAr}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / New Modal */}
      {selectedFaq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 w-full max-w-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-850">
              <h5 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle size={16} className="text-purple-600" />
                <span>{isNew ? 'Add Multilingual FAQ' : `Edit FAQ: ${selectedFaq.id}`}</span>
              </h5>
              <button
                onClick={() => setSelectedFaq(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveFaq} className="p-4 space-y-3 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={selectedFaq.category}
                    onChange={e => setSelectedFaq({ ...selectedFaq, category: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={selectedFaq.order}
                    onChange={e => setSelectedFaq({ ...selectedFaq, order: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <label className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={selectedFaq.active}
                      onChange={e => setSelectedFaq({ ...selectedFaq, active: e.target.checked })}
                      className="accent-purple-600 rounded"
                    />
                    <span>Active Status</span>
                  </label>
                </div>
              </div>

              {/* English */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-850 space-y-2 border border-slate-200 dark:border-zinc-800">
                <span className="font-bold text-[11px] text-blue-600">English (EN)</span>
                <input
                  type="text"
                  placeholder="Question in English..."
                  value={selectedFaq.questionEn}
                  onChange={e => setSelectedFaq({ ...selectedFaq, questionEn: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700"
                />
                <textarea
                  rows={2}
                  placeholder="Answer in English..."
                  value={selectedFaq.answerEn}
                  onChange={e => setSelectedFaq({ ...selectedFaq, answerEn: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs"
                />
              </div>

              {/* Dutch */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-850 space-y-2 border border-slate-200 dark:border-zinc-800">
                <span className="font-bold text-[11px] text-amber-600">Nederlands (NL)</span>
                <input
                  type="text"
                  placeholder="Vraag in het Nederlands..."
                  value={selectedFaq.questionNl}
                  onChange={e => setSelectedFaq({ ...selectedFaq, questionNl: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700"
                />
                <textarea
                  rows={2}
                  placeholder="Antwoord in het Nederlands..."
                  value={selectedFaq.answerNl}
                  onChange={e => setSelectedFaq({ ...selectedFaq, answerNl: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs"
                />
              </div>

              {/* Arabic */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-850 space-y-2 border border-slate-200 dark:border-zinc-800" dir="rtl">
                <span className="font-bold text-[11px] text-emerald-600">العربية (AR)</span>
                <input
                  type="text"
                  placeholder="السؤال بالعربية..."
                  value={selectedFaq.questionAr}
                  onChange={e => setSelectedFaq({ ...selectedFaq, questionAr: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700"
                />
                <textarea
                  rows={2}
                  placeholder="الإجابة بالعربية..."
                  value={selectedFaq.answerAr}
                  onChange={e => setSelectedFaq({ ...selectedFaq, answerAr: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFaq(null)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  {t.actions.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-1.5 cursor-pointer"
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
