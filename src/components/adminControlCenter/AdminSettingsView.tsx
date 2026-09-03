import React, { useState } from 'react';
import {
  Settings,
  Building,
  CreditCard,
  Car,
  Bot,
  Save,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  FileCheck
} from 'lucide-react';
import { SchoolSettings } from '../../types';
import { AdminLang, ADMIN_I18N } from './types';
import { recordAdminAuditLog } from '../../utils/adminAuditLogger';
import { syncSchoolSettingsFromSheet, writeSchoolSettingsToSheet } from '../../services/googleSheetsService';

interface AdminSettingsViewProps {
  lang: AdminLang;
  schoolSettings: Partial<SchoolSettings> | null;
  setSchoolSettings: React.Dispatch<React.SetStateAction<Partial<SchoolSettings> | null>>;
  spreadsheetId: string;
  onShowMessage: (msg: string, isError?: boolean) => void;
}

export default function AdminSettingsView({
  lang,
  schoolSettings,
  setSchoolSettings,
  spreadsheetId,
  onShowMessage
}: AdminSettingsViewProps) {
  const [formData, setFormData] = useState<Partial<SchoolSettings>>({
    name: schoolSettings?.name || 'Al-Andalos Rijschool',
    shortName: schoolSettings?.shortName || 'Al-Andalos',
    slogan: schoolSettings?.slogan || 'Professional Driving Education in Amsterdam & Zaandam',
    phone: schoolSettings?.phone || '+31 6 12345678',
    email: schoolSettings?.email || 'info@alandalos.nl',
    website: schoolSettings?.website || 'https://alandalos-rijschool.nl',
    address: schoolSettings?.address || 'Hoogoorddreef 9',
    city: schoolSettings?.city || 'Amsterdam',
    postalCode: schoolSettings?.postalCode || '1101 BA',
    country: schoolSettings?.country || 'Nederland',
    kvk: schoolSettings?.kvk || '12345678',
    btw: schoolSettings?.btw || 'NL123456789B01',
    iban: schoolSettings?.iban || 'NL91 INGB 0001 2345 67',
    primaryVehicle: schoolSettings?.primaryVehicle || 'Volkswagen Golf VIII 2.0 TDI',
    transmissionType: schoolSettings?.transmissionType || 'Manual & Automatic',
    licenseAuthority: schoolSettings?.licenseAuthority || 'CBR Authorized Driving School',
    lessonPricePerHour: schoolSettings?.lessonPricePerHour || 65,
    aiAssistantName: schoolSettings?.aiAssistantName || 'Andalos AI Driving Coach',
    aiCoachEnabled: schoolSettings?.aiCoachEnabled !== false,
    aiSystemInstructions: schoolSettings?.aiSystemInstructions || 'Assist students strictly with official Dutch CBR driving theory, traffic rules, priority situations, and practical driving exam preparation.',
    notificationsEnabled: schoolSettings?.notificationsEnabled !== false
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const t = ADMIN_I18N[lang];

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchoolSettings(formData);
    try {
      localStorage.setItem('drivingschool_settings', JSON.stringify(formData));
    } catch (e) {
      console.error('Storage error:', e);
    }

    await recordAdminAuditLog({
      action: 'School Configuration Updated',
      targetRecord: `School: ${formData.name}`,
      previousValue: `KVK: ${schoolSettings?.kvk || 'None'}, IBAN: ${schoolSettings?.iban || 'None'}`,
      newValue: `Phone: ${formData.phone}, Price: €${formData.lessonPricePerHour}/h, AI Coach: ${formData.aiCoachEnabled}`,
      changedBy: 'Admin Control Center',
      source: 'Admin Portal'
    });

    onShowMessage(
      lang === 'ar'
        ? 'تم حفظ إعدادات وبيانات المدرسة بنجاح'
        : 'School settings and configuration saved successfully.'
    );
  };

  const handlePullFromSheet = async () => {
    setIsSyncing(true);
    try {
      const res = await syncSchoolSettingsFromSheet(spreadsheetId);
      if (res.success && res.data) {
        setFormData(res.data);
        setSchoolSettings(res.data);
        localStorage.setItem('drivingschool_settings', JSON.stringify(res.data));
        await recordAdminAuditLog({
          action: 'School Settings Synced from Sheet',
          targetRecord: 'Tab: SchoolSettings',
          newValue: 'Full configuration refreshed',
          source: 'Google Sheets'
        });
        onShowMessage(
          lang === 'ar'
            ? 'تم جلب إعدادات المدرسة من Google Sheets بنجاح'
            : 'Pulled school configuration from Google Sheets.'
        );
      } else {
        onShowMessage(res.error || 'Failed to sync school settings.', true);
      }
    } catch (err: any) {
      onShowMessage(err.message || 'Error syncing settings.', true);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushToSheet = async () => {
    setIsSyncing(true);
    try {
      const res = await writeSchoolSettingsToSheet(spreadsheetId, formData as SchoolSettings);
      if (res.success) {
        await recordAdminAuditLog({
          action: 'School Settings Pushed to Sheet',
          targetRecord: 'Tab: SchoolSettings',
          newValue: 'Settings written to sheet',
          source: 'Control Center'
        });
        onShowMessage(
          lang === 'ar'
            ? 'تم تصدير إعدادات المدرسة إلى Google Sheets بنجاح'
            : 'Pushed school settings to Google Sheets.'
        );
      } else {
        onShowMessage(res.error || 'Failed to write settings.', true);
      }
    } catch (err: any) {
      onShowMessage(err.message || 'Error writing settings.', true);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900/80 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800">
        <div>
          <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Settings size={16} className="text-slate-600 dark:text-zinc-400" />
            <span>{lang === 'ar' ? 'إعدادات وبيانات المدرسة المركزية' : 'School Profile & Global Configuration'}</span>
          </h5>
          <p className="text-[11px] text-slate-500">
            {lang === 'ar'
              ? 'تعديل بيانات الكيان القانوني، KVK، BTW، والبنك، وسياسات الذكاء الاصطناعي'
              : 'Legal school credentials, banking identifiers, lesson pricing & AI Coach policies'}
          </p>
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
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
        {/* General & Legal Information */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3">
          <h6 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
            <Building size={15} className="text-blue-600" />
            <span>Legal School Identity & Contact Details</span>
          </h6>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Official Name</label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Short Name</label>
              <input
                type="text"
                value={formData.shortName || ''}
                onChange={e => setFormData({ ...formData, shortName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Slogan / Tagline</label>
              <input
                type="text"
                value={formData.slogan || ''}
                onChange={e => setFormData({ ...formData, slogan: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Website</label>
              <input
                type="text"
                value={formData.website || ''}
                onChange={e => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Address</label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">City</label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Postal Code</label>
              <input
                type="text"
                value={formData.postalCode || ''}
                onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Country</label>
              <input
                type="text"
                value={formData.country || ''}
                onChange={e => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
              />
            </div>
          </div>
        </div>

        {/* Banking & Legal Registration */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3">
          <h6 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
            <CreditCard size={15} className="text-emerald-600" />
            <span>Commercial Registration, VAT & Banking Identifiers</span>
          </h6>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Kamer van Koophandel (KVK)</label>
              <input
                type="text"
                value={formData.kvk || ''}
                onChange={e => setFormData({ ...formData, kvk: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">BTW / VAT ID</label>
              <input
                type="text"
                value={formData.btw || ''}
                onChange={e => setFormData({ ...formData, btw: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">IBAN Bank Account</label>
              <input
                type="text"
                value={formData.iban || ''}
                onChange={e => setFormData({ ...formData, iban: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* AI Driving Coach Configuration */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
            <h6 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
              <Bot size={15} className="text-purple-600" />
              <span>AI Driving Coach Operational Guidelines</span>
            </h6>

            <label className="flex items-center gap-2 font-bold text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={formData.aiCoachEnabled !== false}
                onChange={e => setFormData({ ...formData, aiCoachEnabled: e.target.checked })}
                className="accent-purple-600 rounded"
              />
              <span>{formData.aiCoachEnabled !== false ? 'AI Coach Active' : 'AI Disabled'}</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Assistant Persona Name</label>
              <input
                type="text"
                value={formData.aiAssistantName || ''}
                onChange={e => setFormData({ ...formData, aiAssistantName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Base Lesson Rate (€/h)</label>
              <input
                type="number"
                value={formData.lessonPricePerHour || 65}
                onChange={e => setFormData({ ...formData, lessonPricePerHour: parseFloat(e.target.value) || 65 })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">AI System Instructions & Curriculum Boundaries</label>
            <textarea
              rows={2}
              value={formData.aiSystemInstructions || ''}
              onChange={e => setFormData({ ...formData, aiSystemInstructions: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Save size={14} />
            <span>{t.actions.save}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
