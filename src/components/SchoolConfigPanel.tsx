import React, { useState } from 'react';
import { 
  Settings, Building, DollarSign, Mail, Palette, Globe, Bot, Package, 
  Upload, ImageIcon, Save, Check, Shield, Clock, AlertTriangle, Calendar,
  FileText, ArrowRight, RefreshCw, CheckCircle2, ExternalLink, Palmtree,
  Server, Send, Bell, ShieldCheck, Car
} from 'lucide-react';
import { SchoolSettings, Language, TrainerSchedule } from '../types';
import { BUILTIN_THEMES, getTheme, applyThemeToDocument, ThemeDefinition } from '../themes';

interface SchoolConfigPanelProps {
  schoolSettings: SchoolSettings;
  setSchoolSettings: React.Dispatch<React.SetStateAction<SchoolSettings>>;
  lang: Language;
  trainerSchedule?: TrainerSchedule;
  setTrainerSchedule?: React.Dispatch<React.SetStateAction<TrainerSchedule>>;
  setSettingsSubTab: (tab: 'rota' | 'packages' | 'school' | 'media') => void;
  handleSaveSchoolSettings: (e: React.FormEvent) => void;
  handleAssetUpload: (key: keyof SchoolSettings, file: File) => void;
  trainerPhoto: string | null;
  trainerName: string;
  handleRemoveTrainerPhoto: () => void;
  initialTab?: 'info' | 'business' | 'email' | 'branding' | 'social' | 'ai';
}

export const SchoolConfigPanel: React.FC<SchoolConfigPanelProps> = ({
  schoolSettings,
  setSchoolSettings,
  lang,
  trainerSchedule,
  setSettingsSubTab,
  handleSaveSchoolSettings,
  handleAssetUpload,
  trainerPhoto,
  trainerName,
  handleRemoveTrainerPhoto,
  initialTab
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'business' | 'email' | 'branding' | 'social' | 'ai'>(
    initialTab || 'info'
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const activeTheme = getTheme(schoolSettings.themeId);

  const handleSelectTheme = (themeId: 'classic-blue' | 'emerald' | 'graphite' | 'sunset') => {
    const selected = BUILTIN_THEMES[themeId];
    setSchoolSettings(prev => ({
      ...prev,
      themeId: themeId,
      primaryColor: selected.primary,
      secondaryColor: selected.secondary,
      accentColor: selected.accent
    }));
    applyThemeToDocument(themeId, selected.primary, selected.secondary, selected.accent);
  };

  const handleSaveWithNotification = (e: React.FormEvent) => {
    handleSaveSchoolSettings(e);
    // Apply theme immediately
    applyThemeToDocument(schoolSettings.themeId, schoolSettings.primaryColor, schoolSettings.secondaryColor, schoolSettings.accentColor);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <form onSubmit={handleSaveWithNotification} className="p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-sm space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-zinc-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-600/20">
                <Settings className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  {lang === 'ar' ? 'إعدادات المدرسة' : lang === 'nl' ? 'School Instellingen' : 'School Settings'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
                  {lang === 'ar' 
                    ? 'إدارة كافة معلومات وإعدادات مدرسة القيادة الخاصة بك والهوية البصرية والقوانين.'
                    : lang === 'nl'
                      ? 'Beheer al uw schoolgegevens, branding, contactgegevens en bedrijfsinstellingen.'
                      : 'Manage your driving school information, branding, contact details, and business settings.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-fade-in bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                {lang === 'ar' ? 'تم حفظ التغييرات!' : lang === 'nl' ? 'Opgeslagen!' : 'Saved successfully!'}
              </span>
            )}
            <button
              type="submit"
              className="h-11 px-6 font-extrabold text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition cursor-pointer shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              <span>{lang === 'ar' ? 'حفظ كافة التغييرات' : lang === 'nl' ? 'Alle Wijzigingen Opslaan' : 'Save All Settings'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-100 dark:border-zinc-800">
          {[
            { id: 'info', icon: Building, labelEn: 'School Information', labelNl: 'School Informatie', labelAr: 'معلومات المدرسة' },
            { id: 'business', icon: DollarSign, labelEn: 'Business Information', labelNl: 'Bedrijfsinstellingen', labelAr: 'إعدادات العمل والدروس' },
            { id: 'email', icon: Mail, labelEn: 'Email Settings', labelNl: 'E-mail Instellingen', labelAr: 'إعدادات البريد' },
            { id: 'branding', icon: Palette, labelEn: 'Branding & Theme', labelNl: 'Branding & Thema', labelAr: 'الهوية البصرية والسمات' },
            { id: 'social', icon: Globe, labelEn: 'Social & Legal', labelNl: 'Sociale Media & Links', labelAr: 'التواصل والقوانين' },
            { id: 'ai', icon: Bot, labelEn: 'AI Settings', labelNl: 'AI Instellingen', labelAr: 'إعدادات الذكاء الاصطناعي' },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{lang === 'ar' ? tab.labelAr : lang === 'nl' ? tab.labelNl : tab.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: School Information */}
        {activeTab === 'info' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
              <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">
                {lang === 'ar' ? 'معلومات الهوية وبيانات التواصل الرسمية للمدرسة' : lang === 'nl' ? 'School Informatie & Contactgegevens' : 'School Information & Contact Credentials'}
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-semibold">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5">
                  {lang === 'ar' ? 'اسم مدرسة القيادة' : lang === 'nl' ? 'School Naam' : 'School Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={schoolSettings.name || ''}
                  onChange={e => setSchoolSettings(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Driving School"
                  className="w-full h-10 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5">
                  {lang === 'ar' ? 'الاسم المختصر / العلامة' : lang === 'nl' ? 'Korte Naam / Merknaam' : 'Short Name / Brand Abbreviation'}
                </label>
                <input
                  type="text"
                  value={schoolSettings.shortName || ''}
                  onChange={e => setSchoolSettings(prev => ({ ...prev, shortName: e.target.value }))}
                  placeholder="Royal Drive"
                  className="w-full h-10 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5">
                  {lang === 'ar' ? 'الشعار اللفظي / Slogan' : lang === 'nl' ? 'Slogan / Tagline' : 'School Slogan / Tagline'}
                </label>
                <input
                  type="text"
                  value={schoolSettings.slogan || ''}
                  onChange={e => setSchoolSettings(prev => ({ ...prev, slogan: e.target.value }))}
                  placeholder="Your Fast Track to CBR Success"
                  className="w-full h-10 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all"
                />
              </div>

              {/* Contact Information */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5">
                  {lang === 'ar' ? 'البريد الإلكتروني الرسمي' : lang === 'nl' ? 'E-mailadres' : 'Official Contact Email'} *
                </label>
                <input
                  type="email"
                  required
                  value={schoolSettings.email || ''}
                  onChange={e => setSchoolSettings(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="info@drivingschool.nl"
                  className="w-full h-10 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5">
                  {lang === 'ar' ? 'رقم الهاتف / الجوال' : lang === 'nl' ? 'Telefoonnummer' : 'Phone Number'} *
                </label>
                <input
                  type="text"
                  required
                  value={schoolSettings.phone || ''}
                  onChange={e => setSchoolSettings(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+31 6 1234 5678"
                  className="w-full h-10 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5">
                  {lang === 'ar' ? 'رابط الموقع الإلكتروني' : lang === 'nl' ? 'Website URL' : 'Website URL'}
                </label>
                <input
                  type="text"
                  value={schoolSettings.website || ''}
                  onChange={e => setSchoolSettings(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://drivingschool.nl"
                  className="w-full h-10 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5">
                  {lang === 'ar' ? 'عنوان الشارع والرقم' : lang === 'nl' ? 'Adres & Huisnummer' : 'Street Address'}
                </label>
                <input
                  type="text"
                  value={schoolSettings.address || ''}
                  onChange={e => setSchoolSettings(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Main Street 42"
                  className="w-full h-10 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5">
                    {lang === 'ar' ? 'الرمز البريدي' : lang === 'nl' ? 'Postcode' : 'Postal Code'}
                  </label>
                  <input
                    type="text"
                    value={schoolSettings.postalCode || ''}
                    onChange={e => setSchoolSettings(prev => ({ ...prev, postalCode: e.target.value }))}
                    placeholder="3511 AA"
                    className="w-full h-10 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all text-left"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5">
                    {lang === 'ar' ? 'المدينة' : lang === 'nl' ? 'Stad' : 'City'}
                  </label>
                  <input
                    type="text"
                    value={schoolSettings.city || ''}
                    onChange={e => setSchoolSettings(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Utrecht"
                    className="w-full h-10 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5">
                    {lang === 'ar' ? 'الدولة' : lang === 'nl' ? 'Land' : 'Country'}
                  </label>
                  <input
                    type="text"
                    value={schoolSettings.country || 'Netherlands'}
                    onChange={e => setSchoolSettings(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="Netherlands"
                    className="w-full h-10 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all"
                  />
                </div>
              </div>

              {/* Legal & Registration Numbers */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5">
                    {lang === 'ar' ? 'رقم السجل التجاري KvK' : lang === 'nl' ? 'KvK-nummer' : 'KvK Number'}
                  </label>
                  <input
                    type="text"
                    value={schoolSettings.kvk || ''}
                    onChange={e => setSchoolSettings(prev => ({ ...prev, kvk: e.target.value }))}
                    placeholder="87654321"
                    className="w-full h-10 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5">
                    {lang === 'ar' ? 'رقم الضريبة BTW' : lang === 'nl' ? 'BTW-nummer' : 'BTW / VAT Number'}
                  </label>
                  <input
                    type="text"
                    value={schoolSettings.btw || ''}
                    onChange={e => setSchoolSettings(prev => ({ ...prev, btw: e.target.value }))}
                    placeholder="NL876543210B01"
                    className="w-full h-10 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5">
                    {lang === 'ar' ? 'الحساب البنكي (IBAN)' : lang === 'nl' ? 'IBAN Bankrekening' : 'Bank Account (IBAN)'}
                  </label>
                  <input
                    type="text"
                    value={schoolSettings.iban || ''}
                    onChange={e => setSchoolSettings(prev => ({ ...prev, iban: e.target.value }))}
                    placeholder="NL91 ABNA 0417 1234 56"
                    className="w-full h-10 text-xs font-semibold px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all font-mono"
                  />
                </div>
              </div>

              {/* Chamber of Commerce Information */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5">
                  {lang === 'ar' ? 'معلومات الغرفة التجارية وسلطات الترخيص (Chamber of Commerce Info)' : lang === 'nl' ? 'Kamer van Koophandel & CBR Licentie Informatie' : 'Chamber of Commerce & CBR Registry Information'}
                </label>
                <textarea
                  rows={2}
                  value={schoolSettings.kvkDetails || ''}
                  onChange={e => setSchoolSettings(prev => ({ ...prev, kvkDetails: e.target.value }))}
                  placeholder="Registered with Kamer van Koophandel Utrecht - Regional CBR Authority Code 4410"
                  className="w-full text-xs font-semibold p-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Business Settings */}
        {activeTab === 'business' && (
          <div className="space-y-6 animate-fade-in">
            {/* Training Vehicle Settings */}
            <div className="p-4 bg-slate-50/70 dark:bg-zinc-950/50 border border-slate-200/80 dark:border-zinc-800 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80 dark:border-zinc-800">
                <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h4 className="font-extrabold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                  {lang === 'ar' ? 'مركبة التدريب الأساسية (Training Vehicle Details)' : lang === 'nl' ? 'Lesvoertuig Instellingen' : 'Training Vehicle Details'}
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    {lang === 'ar' ? 'مركبة التدريب الأساسية (Primary Training Vehicle)' : lang === 'nl' ? 'Hoofd Lesvoertuig' : 'Primary Training Vehicle'}
                  </label>
                  <input
                    type="text"
                    value={schoolSettings.primaryVehicle || ''}
                    onChange={e => setSchoolSettings(prev => ({ ...prev, primaryVehicle: e.target.value }))}
                    placeholder="e.g. Golf VIII, Toyota Yaris, BMW 1 Series"
                    className="w-full h-10 text-xs font-semibold px-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {lang === 'ar' ? 'تظهر هذه المركبة تلقائياً في تقارير التقييم والملفات الرسمية.' : 'Appears automatically on evaluation reports and student dossiers.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    {lang === 'ar' ? 'نوع ناقل الحركة (Transmission Type)' : lang === 'nl' ? 'Transmissie Type' : 'Transmission Type'}
                  </label>
                  <select
                    value={schoolSettings.transmissionType || 'manual'}
                    onChange={e => setSchoolSettings(prev => ({ ...prev, transmissionType: e.target.value }))}
                    className="w-full h-10 text-xs font-semibold px-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all cursor-pointer"
                  >
                    <option value="manual">{lang === 'ar' ? 'يدوي (Manual)' : lang === 'nl' ? 'Handgeschakeld (Manual)' : 'Manual'}</option>
                    <option value="automatic">{lang === 'ar' ? 'أوتوماتيك (Automatic)' : lang === 'nl' ? 'Automaat (Automatic)' : 'Automatic'}</option>
                    <option value="both">{lang === 'ar' ? 'يدوي وأوتوماتيك (Manual & Automatic)' : lang === 'nl' ? 'Handgeschakeld & Automaat' : 'Manual & Automatic'}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">
                {lang === 'ar' ? 'إعدادات أسعار الدروس والمدة وسياسات الحجز والإلغاء' : lang === 'nl' ? 'Lesduur, Tarieven, Annulering & Boekingsregels' : 'Lesson Duration, Rates, Cancellation & Booking Rules'}
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold">
              {/* Default Lesson Duration */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                  {lang === 'ar' ? 'مدة الدرس الافتراضية (Default Lesson Duration)' : lang === 'nl' ? 'Standaard Lesduur' : 'Default Lesson Duration'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 1, label: '1 Hour' },
                    { value: 1.5, label: '1.5 Hours' },
                    { value: 2, label: '2 Hours' },
                  ].map(dur => (
                    <button
                      key={dur.value}
                      type="button"
                      onClick={() => setSchoolSettings(prev => ({ ...prev, defaultLessonDuration: dur.value }))}
                      className={`h-11 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        (schoolSettings.defaultLessonDuration || 1) === dur.value
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100'
                      }`}
                    >
                      <Clock className="h-4 w-4" />
                      <span>{dur.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Lesson Price */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  {lang === 'ar' ? 'سعر الساعة الافتراضي للدرس (€/ساعة)' : lang === 'nl' ? 'Standaard Lesprijs per uur (€)' : 'Default Lesson Hourly Rate (€)'} *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold font-mono text-slate-400 text-sm">€</span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={schoolSettings.lessonPricePerHour || 65}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 65;
                      setSchoolSettings(prev => ({ ...prev, lessonPricePerHour: val }));
                    }}
                    className="w-full h-11 pl-8 pr-3 text-sm font-bold bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all font-mono"
                  />
                </div>
                <p className="text-[10.5px] text-slate-400 mt-1">
                  {lang === 'ar' ? 'يتم تطبيق هذا السعر تلقائياً في حاسبة الحجوزات والفواتير.' : 'This rate automatically updates booking calculators and invoicing.'}
                </p>
              </div>

              {/* Cancellation Policy */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  {lang === 'ar' ? 'سياسة إلغاء الدروس (Cancellation Policy)' : lang === 'nl' ? 'Annuleringsbeleid' : 'Cancellation Policy'}
                </label>
                <textarea
                  rows={3}
                  value={schoolSettings.cancellationPolicy || ''}
                  onChange={e => setSchoolSettings(prev => ({ ...prev, cancellationPolicy: e.target.value }))}
                  placeholder="Free cancellation up to 24 hours prior to scheduled lesson time. Cancellations under 24 hours may incur full lesson rate."
                  className="w-full text-xs font-semibold p-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all"
                />
              </div>

              {/* Booking Rules */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  {lang === 'ar' ? 'قواعد وتعليمات الحجز (Booking Rules)' : lang === 'nl' ? 'Boekingsregels' : 'Booking Rules & Advance Limits'}
                </label>
                <textarea
                  rows={3}
                  value={schoolSettings.bookingRules || ''}
                  onChange={e => setSchoolSettings(prev => ({ ...prev, bookingRules: e.target.value }))}
                  placeholder="Lessons can be scheduled up to 60 days in advance. Minimum booking notice is 12 hours."
                  className="w-full text-xs font-semibold p-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all"
                />
              </div>

              {/* Dynamic Booking Policy Settings */}
              <div className="md:col-span-2 p-5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-zinc-800">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                      {lang === 'ar' ? 'سياسة الحجز والإلغاء (Booking Policy)' : lang === 'nl' ? 'Boekingsbeleid & Annulering' : 'Booking Policy'}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {lang === 'ar'
                        ? 'التحكم الديناميكي في حدود مهلة الحجز والإلغاء المتاحة للطلاب'
                        : lang === 'nl'
                          ? 'Instellen van dynamische boekings- en annuleringstermijnen voor leerlingen'
                          : 'Configure advance booking requirements and online cancellation limits for students'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 1. Minimum Advance Booking Time */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                      {lang === 'ar' ? 'حد الحجز المسبق الأدنى (Minimum Advance Booking Time)' : lang === 'nl' ? 'Minimale Boekingstijd van tevoren' : 'Minimum Advance Booking Time'}
                    </label>
                    <p className="text-[10.5px] text-slate-400">
                      {lang === 'ar'
                        ? 'يحدد عدد الساعات المطلوبة قبل موعد الدرس لمنع الحجوزات المتأخرة.'
                        : 'Determines how many hours before a lesson a student is allowed to make a new booking.'}
                    </p>

                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {[1, 2, 4, 6, 8, 12, 24].map((hours) => {
                        const currentVal = schoolSettings.minAdvanceNoticeHours ?? 12;
                        const isSelected = currentVal === hours;
                        return (
                          <button
                            key={hours}
                            type="button"
                            onClick={() => setSchoolSettings(prev => ({ ...prev, minAdvanceNoticeHours: hours }))}
                            className={`py-2 px-1 text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100'
                            }`}
                          >
                            {hours}h
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2 pt-1.5">
                      <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                        {lang === 'ar' ? 'قيمة مخصصة (ساعات):' : 'Custom value (hours):'}
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="168"
                        value={schoolSettings.minAdvanceNoticeHours ?? 12}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setSchoolSettings(prev => ({ ...prev, minAdvanceNoticeHours: val }));
                        }}
                        className="w-24 h-9 px-3 text-xs font-bold font-mono bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* 2. Cancellation Deadline */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                      {lang === 'ar' ? 'المهلة النهائية للإلغاء (Cancellation Deadline)' : lang === 'nl' ? 'Annuleringstermijn' : 'Cancellation Deadline'}
                    </label>
                    <p className="text-[10.5px] text-slate-400">
                      {lang === 'ar'
                        ? 'يحدد كم ساعة قبل الدرس يُسمح للطالب بالإلغاء عبر الإنترنت.'
                        : 'Determines how long before the lesson a student may cancel online.'}
                    </p>

                    <div className="grid grid-cols-5 gap-1.5 pt-1">
                      {[2, 6, 12, 24, 48].map((hours) => {
                        const currentVal = schoolSettings.cancellationDeadlineHours ?? 24;
                        const isSelected = currentVal === hours;
                        return (
                          <button
                            key={hours}
                            type="button"
                            onClick={() => setSchoolSettings(prev => ({ ...prev, cancellationDeadlineHours: hours }))}
                            className={`py-2 px-1 text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100'
                            }`}
                          >
                            {hours}h
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2 pt-1.5">
                      <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                        {lang === 'ar' ? 'قيمة مخصصة (ساعات):' : 'Custom value (hours):'}
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="168"
                        value={schoolSettings.cancellationDeadlineHours ?? 24}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setSchoolSettings(prev => ({ ...prev, cancellationDeadlineHours: val }));
                        }}
                        className="w-24 h-9 px-3 text-xs font-bold font-mono bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Working Hours & Vacation Settings Overview */}
              <div className="md:col-span-2 p-5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                        {lang === 'ar' ? 'ساعات العمل الرسمية وإجازة المدرب' : lang === 'nl' ? 'Werktijden & Vakantie Status' : 'Operating Working Hours & Vacation Status'}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {lang === 'ar' ? 'ساعات العمل وأيام التدريـب النشطة المحددة في الجدول.' : 'Active schedule working days and instructor vacation mode.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSettingsSubTab('rota')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'تعديل جدول الساعات والإجازات' : lang === 'nl' ? 'Werktijden & Vakantie Beheren' : 'Manage Schedule & Rota'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Working Days & Hours</span>
                    <p className="text-xs font-extrabold text-slate-800 dark:text-white">
                      {trainerSchedule?.workingDays?.join(', ') || 'Monday, Tuesday, Wednesday, Thursday, Friday'}
                    </p>
                    <p className="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold">
                      {trainerSchedule?.startTime || '08:00'} - {trainerSchedule?.endTime || '18:00'}
                    </p>
                  </div>

                  <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <Palmtree className="h-3 w-3 text-amber-500" /> Vacation Mode
                    </span>
                    <p className="text-xs font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                      {trainerSchedule?.vacationMode?.enabled ? (
                        <span className="text-amber-600 font-bold">● Active Vacation Mode</span>
                      ) : (
                        <span className="text-emerald-600 font-bold">● Regular School Operations</span>
                      )}
                    </p>
                    {trainerSchedule?.vacationMode?.enabled && (
                      <p className="text-[11px] text-slate-500 font-medium">
                        {trainerSchedule.vacationMode.startDate} to {trainerSchedule.vacationMode.endDate}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Email Settings */}
        {activeTab === 'email' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">
                    {lang === 'ar' ? 'إعدادات البريد الإلكتروني والإشعارات' : lang === 'nl' ? 'E-mail Instellingen' : 'Email & Notification Settings'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                    {lang === 'ar' ? 'إعداد إعدادات البريد الإلكتروني للمدرسة والإشعارات التلقائية.' : lang === 'nl' ? 'Configureer de e-mailinstellingen en automatische meldingen van je rijschool.' : 'Configure your school’s email settings and automatic notifications.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Server Details Grid */}
            <div className="bg-slate-50/70 dark:bg-zinc-950/50 p-4 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 space-y-4">
              <h5 className="text-xs font-black text-slate-700 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Server className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                {lang === 'ar' ? 'خادم البريد الصادر (SMTP)' : lang === 'nl' ? 'Uitgaande E-mailserver (SMTP)' : 'Outgoing Mail Server (SMTP)'}
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5">
                    {lang === 'ar' ? 'عنوان الخادم (SMTP Host)' : lang === 'nl' ? 'SMTP Server Host' : 'SMTP Server Hostname'}
                  </label>
                  <input
                    type="text"
                    value={schoolSettings.smtpHost || ''}
                    onChange={e => setSchoolSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                    placeholder="smtp.gmail.com"
                    className="w-full h-10 text-xs font-semibold px-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all font-mono text-left"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5">
                    {lang === 'ar' ? 'المنفذ (Port)' : lang === 'nl' ? 'Poort' : 'Port'}
                  </label>
                  <input
                    type="text"
                    value={schoolSettings.smtpPort || ''}
                    onChange={e => setSchoolSettings(prev => ({ ...prev, smtpPort: e.target.value }))}
                    placeholder="587"
                    className="w-full h-10 text-xs font-semibold px-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all font-mono text-left"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5">
                    {lang === 'ar' ? 'اسم المستخدم / البريد الإلكتروني' : lang === 'nl' ? 'Gebruikersnaam / E-mailadres' : 'Username / Sender Email'}
                  </label>
                  <input
                    type="text"
                    value={schoolSettings.smtpUser || ''}
                    onChange={e => setSchoolSettings(prev => ({ ...prev, smtpUser: e.target.value }))}
                    placeholder="notifications@drivingschool.com"
                    className="w-full h-10 text-xs font-semibold px-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all text-left"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5">
                    {lang === 'ar' ? 'كلمة المرور' : lang === 'nl' ? 'Wachtwoord' : 'Password'}
                  </label>
                  <input
                    type="password"
                    value={schoolSettings.smtpPass || ''}
                    onChange={e => setSchoolSettings(prev => ({ ...prev, smtpPass: e.target.value }))}
                    placeholder="••••••••••••••••"
                    className="w-full h-10 text-xs font-semibold px-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all font-mono text-left"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5">
                    {lang === 'ar' ? 'تشفير الحماية' : lang === 'nl' ? 'Beveiligingsversleuteling' : 'Security Encryption'}
                  </label>
                  <select
                    value={schoolSettings.smtpEncryption || 'tls'}
                    onChange={e => setSchoolSettings(prev => ({ ...prev, smtpEncryption: e.target.value as any }))}
                    className="w-full h-10 text-xs font-semibold px-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all"
                  >
                    <option value="tls">STARTTLS (Port 587)</option>
                    <option value="ssl">SSL / TLS (Port 465)</option>
                    <option value="none">None / Plain (Port 25)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Sender Metadata & Signature */}
            <div className="bg-slate-50/70 dark:bg-zinc-950/50 p-4 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 space-y-4">
              <h5 className="text-xs font-black text-slate-700 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                {lang === 'ar' ? 'هوية المرسل والتوقيع' : lang === 'nl' ? 'Afzender Identiteit & Handtekening' : 'Sender Identity & Signature'}
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5">
                    {lang === 'ar' ? 'اسم المرسل الظاهر' : lang === 'nl' ? 'Weergavenaam afzender' : 'Sender Display Name'}
                  </label>
                  <input
                    type="text"
                    value={schoolSettings.smtpSenderName || ''}
                    onChange={e => setSchoolSettings(prev => ({ ...prev, smtpSenderName: e.target.value }))}
                    placeholder="Driving School Netherlands"
                    className="w-full h-10 text-xs font-semibold px-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5">
                    {lang === 'ar' ? 'بريد الرد (Reply-To)' : lang === 'nl' ? 'Antwoord-aan E-mailadres' : 'Reply-To Email Address'}
                  </label>
                  <input
                    type="email"
                    value={schoolSettings.replyToEmail || ''}
                    onChange={e => setSchoolSettings(prev => ({ ...prev, replyToEmail: e.target.value }))}
                    placeholder="support@drivingschool.nl"
                    className="w-full h-10 text-xs font-semibold px-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all text-left"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5">
                    {lang === 'ar' ? 'التوقيع الرسمي للرسائل' : lang === 'nl' ? 'Officiële E-mailhandtekening' : 'Official Email Signature'}
                  </label>
                  <textarea
                    rows={3}
                    value={schoolSettings.emailSignature || ''}
                    onChange={e => setSchoolSettings(prev => ({ ...prev, emailSignature: e.target.value }))}
                    placeholder="Kind regards,\nDriving School Team\nCBR Licensed Instructors"
                    className="w-full text-xs font-semibold p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Notification Triggers & Automated Email Controls */}
            <div className="bg-slate-50/70 dark:bg-zinc-950/50 p-4 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 space-y-4">
              <h5 className="text-xs font-black text-slate-700 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Bell className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                {lang === 'ar' ? 'الإشعارات البريدية التلقائية' : lang === 'nl' ? 'Automatische E-mailmeldingen' : 'Automatic Email Notifications'}
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 cursor-pointer hover:border-blue-500/50 transition">
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200">
                    {lang === 'ar' ? 'تأكيد حجز الدروس الجديدة' : lang === 'nl' ? 'Nieuwe lesboekingsbevestigingen' : 'Lesson Booking Confirmations'}
                  </span>
                  <input
                    type="checkbox"
                    checked={schoolSettings.enableBookingEmails !== false}
                    onChange={e => setSchoolSettings(prev => ({ ...prev, enableBookingEmails: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 cursor-pointer hover:border-blue-500/50 transition">
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200">
                    {lang === 'ar' ? 'إشعارات إلغاء وإعادة جدولة الدروس' : lang === 'nl' ? 'Lesannulerings- en wijzigingsmeldingen' : 'Cancellation & Reschedule Notices'}
                  </span>
                  <input
                    type="checkbox"
                    checked={schoolSettings.enableCancelEmails !== false}
                    onChange={e => setSchoolSettings(prev => ({ ...prev, enableCancelEmails: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 cursor-pointer hover:border-blue-500/50 transition">
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200">
                    {lang === 'ar' ? 'الفواتير وإيصالات الدفع' : lang === 'nl' ? 'Facturen & Betalingsbewijzen' : 'Invoices & Payment Receipts'}
                  </span>
                  <input
                    type="checkbox"
                    checked={schoolSettings.enableInvoiceEmails !== false}
                    onChange={e => setSchoolSettings(prev => ({ ...prev, enableInvoiceEmails: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 cursor-pointer hover:border-blue-500/50 transition">
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200">
                    {lang === 'ar' ? 'تذكيرات مواعيد الدروس' : lang === 'nl' ? 'Lesherinneringen' : 'Upcoming Lesson Reminders'}
                  </span>
                  <input
                    type="checkbox"
                    checked={schoolSettings.enableReminderEmails !== false}
                    onChange={e => setSchoolSettings(prev => ({ ...prev, enableReminderEmails: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>

            {/* Test Connection Banner */}
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <Send className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <h6 className="text-xs font-extrabold text-blue-900 dark:text-blue-200">
                    {lang === 'ar' ? 'اختبار اتصال البريد الإلكتروني' : lang === 'nl' ? 'E-mail Verbindingstest' : 'Email Connection Test'}
                  </h6>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300 font-medium mt-0.5">
                    {lang === 'ar' ? 'احفظ إعدادات البريد الإلكتروني للاستخدام المستقبلي.' : lang === 'nl' ? 'Sla je e-mailinstellingen op voor toekomstig gebruik.' : 'Save your email settings for future use.'}
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-blue-200/60 dark:border-blue-900/60 text-blue-800 dark:text-blue-200 text-[11px] font-bold shrink-0">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>{lang === 'ar' ? 'خدمة البريد الإلكتروني غير متصلة حالياً.' : lang === 'nl' ? 'E-maildienst is nog niet verbonden.' : 'Email service is not connected yet.'}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Branding & Theme Manager */}
        {activeTab === 'branding' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
              <Palette className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">
                {lang === 'ar' ? 'نظام إدارة السمات والألوان والهوية البصرية الشامل' : lang === 'nl' ? 'Dedicated Theme Manager & Branding System' : 'Dedicated Theme Manager & Branding Hub'}
              </h4>
            </div>

            {/* Logo & Icons Asset Uploader */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Logo */}
              <div className="space-y-2">
                <label className="block text-slate-600 dark:text-zinc-300 font-extrabold text-xs uppercase tracking-wider">
                  {lang === 'ar' ? 'شعار المدرسة الرئيسي' : lang === 'nl' ? 'Rijschool Logo' : 'Official School Logo'}
                </label>
                <div 
                  className="border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-3xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative min-h-[140px] bg-slate-50/50 dark:bg-zinc-950/30"
                  onClick={() => document.getElementById('logo-file-input')?.click()}
                >
                  <input 
                    id="logo-file-input" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleAssetUpload('logoUrl', file);
                    }}
                  />
                  {schoolSettings.logoUrl ? (
                    <div className="space-y-2">
                      <img src={schoolSettings.logoUrl} alt="Logo Preview" className="h-16 w-auto object-contain mx-auto rounded-lg bg-white p-1 border border-slate-200 shadow-xs" referrerPolicy="no-referrer" />
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSchoolSettings(prev => ({ ...prev, logoUrl: '' }));
                        }}
                        className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-600 font-bold px-3 py-1 rounded-lg transition"
                      >
                        Remove Logo
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-7 w-7 text-slate-400 mx-auto" />
                      <p className="text-[11px] text-slate-600 font-bold">Drag logo or click to upload</p>
                      <span className="text-[9px] text-slate-400 block font-normal">PNG, SVG, JPG up to 5MB</span>
                    </div>
                  )}
                </div>
              </div>

              {/* App Icon */}
              <div className="space-y-2">
                <label className="block text-slate-600 dark:text-zinc-300 font-extrabold text-xs uppercase tracking-wider">
                  {lang === 'ar' ? 'أيقونة التطبيق App Icon' : lang === 'nl' ? 'App Icon & Favicon' : 'App Icon & Favicon'}
                </label>
                <div 
                  className="border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-3xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative min-h-[140px] bg-slate-50/50 dark:bg-zinc-950/30"
                  onClick={() => document.getElementById('appicon-file-input')?.click()}
                >
                  <input 
                    id="appicon-file-input" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleAssetUpload('appIconUrl', file);
                    }}
                  />
                  {schoolSettings.appIconUrl || schoolSettings.faviconUrl ? (
                    <div className="space-y-2">
                      <img src={schoolSettings.appIconUrl || schoolSettings.faviconUrl} alt="App Icon Preview" className="h-12 w-12 object-contain mx-auto rounded-xl bg-white p-1 border border-slate-200 shadow-xs" referrerPolicy="no-referrer" />
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSchoolSettings(prev => ({ ...prev, appIconUrl: '', faviconUrl: '' }));
                        }}
                        className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-600 font-bold px-3 py-1 rounded-lg transition"
                      >
                        Remove Icon
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <ImageIcon className="h-7 w-7 text-slate-400 mx-auto" />
                      <p className="text-[11px] text-slate-600 font-bold">Upload App Icon</p>
                      <span className="text-[9px] text-slate-400 block font-normal">Square PNG 512x512</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Primary Color Palette */}
              <div className="space-y-2">
                <label className="block text-slate-600 dark:text-zinc-300 font-extrabold text-xs uppercase tracking-wider">
                  {lang === 'ar' ? 'تخصيص الألوان يدويًا' : lang === 'nl' ? 'Aangepaste Kleuren' : 'Custom Color Palette Overrides'}
                </label>
                <div className="p-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-3 min-h-[140px] flex flex-col justify-center">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-zinc-300">Primary:</span>
                    <input
                      type="color"
                      value={schoolSettings.primaryColor || '#2563eb'}
                      onChange={e => {
                        const col = e.target.value;
                        setSchoolSettings(prev => ({ ...prev, primaryColor: col }));
                        applyThemeToDocument(schoolSettings.themeId, col, schoolSettings.secondaryColor, schoolSettings.accentColor);
                      }}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-zinc-300">Secondary:</span>
                    <input
                      type="color"
                      value={schoolSettings.secondaryColor || '#0284c7'}
                      onChange={e => {
                        const col = e.target.value;
                        setSchoolSettings(prev => ({ ...prev, secondaryColor: col }));
                        applyThemeToDocument(schoolSettings.themeId, schoolSettings.primaryColor, col, schoolSettings.accentColor);
                      }}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-zinc-300">Accent:</span>
                    <input
                      type="color"
                      value={schoolSettings.accentColor || '#f59e0b'}
                      onChange={e => {
                        const col = e.target.value;
                        setSchoolSettings(prev => ({ ...prev, accentColor: col }));
                        applyThemeToDocument(schoolSettings.themeId, schoolSettings.primaryColor, schoolSettings.secondaryColor, col);
                      }}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Dedicated Built-in Theme Selector (4 Built-in Themes) */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                    <Palette className="h-4 w-4 text-blue-600" />
                    {lang === 'ar' ? 'اختر إحدى السمات المدمجة الأربع (Built-in Themes)' : lang === 'nl' ? 'Kies uit 4 Ingebouwde Thema\'s' : 'Select Built-in System Theme (4 Presets)'}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {lang === 'ar'
                      ? 'تغيير السمة يحدّث الهيدر، الشريط الجانبي، الأزرار، البطاقات، مؤشرات التقدم، الأيقونات، الروابط، الاستمارات، والرسوم البيانية فوراً.'
                      : 'Selecting a theme instantly updates headers, sidebars, buttons, cards, progress bars, links, forms, and charts without reloading.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.values(BUILTIN_THEMES).map((theme: ThemeDefinition) => {
                  const isSelected = (schoolSettings.themeId || 'classic-blue') === theme.id;
                  return (
                    <div
                      key={theme.id}
                      onClick={() => handleSelectTheme(theme.id)}
                      className={`p-4 rounded-3xl border-2 transition-all cursor-pointer relative space-y-3 flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-600 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 shadow-md ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-slate-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      {/* Active Badge */}
                      {isSelected && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                          <Check className="h-3 w-3" /> Active
                        </span>
                      )}

                      <div className="space-y-2">
                        {/* Gradient Bar */}
                        <div className={`h-12 w-full rounded-2xl bg-gradient-to-r ${theme.previewGradient} shadow-sm flex items-center justify-center text-white font-extrabold text-xs tracking-wide`}>
                          {theme.id === 'classic-blue' && 'Blue Classic'}
                          {theme.id === 'emerald' && 'Emerald Green'}
                          {theme.id === 'graphite' && 'Graphite Corporate'}
                          {theme.id === 'sunset' && 'Sunset Orange'}
                        </div>

                        <div>
                          <h5 className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {lang === 'ar' ? theme.nameAr : lang === 'nl' ? theme.nameNl : theme.nameEn}
                          </h5>
                          <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 font-medium line-clamp-2 mt-0.5">
                            {lang === 'ar' ? theme.descriptionAr : lang === 'nl' ? theme.descriptionNl : theme.descriptionEn}
                          </p>
                        </div>
                      </div>

                      {/* Swatch Strip */}
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                          <span>Colors:</span>
                          <span className="font-mono">{theme.primary}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full border border-white dark:border-zinc-800 shadow-xs" style={{ backgroundColor: theme.primary }} title="Primary" />
                          <span className="w-5 h-5 rounded-full border border-white dark:border-zinc-800 shadow-xs" style={{ backgroundColor: theme.secondary }} title="Secondary" />
                          <span className="w-5 h-5 rounded-full border border-white dark:border-zinc-800 shadow-xs" style={{ backgroundColor: theme.accent }} title="Accent" />
                          <span className="w-5 h-5 rounded-full border border-white dark:border-zinc-800 shadow-xs" style={{ backgroundColor: theme.button }} title="Button" />
                          <span className="w-5 h-5 rounded-full border border-white dark:border-zinc-800 shadow-xs" style={{ backgroundColor: theme.success }} title="Success" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Real-time Theme Visual Showcase Widget */}
            <div className="p-5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-zinc-800">
                <h5 className="font-extrabold text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <span>⚡</span>
                  {lang === 'ar' ? 'معاينة فورية لعناصر الواجهة بالسمة النشطة' : lang === 'nl' ? 'Live Interface Voorbeeld met Actief Thema' : 'Live Interface Preview with Active Theme'}
                </h5>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Theme: {activeTheme.nameEn}</span>
              </div>

              {/* Sample Header & Sidebar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Header Widget */}
                <div className="p-3 rounded-2xl border shadow-xs space-y-2" style={{ backgroundColor: activeTheme.card, borderColor: activeTheme.border }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase" style={{ color: activeTheme.primary }}>Header Preview</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: activeTheme.button }}>Active</span>
                  </div>
                  <div className="h-8 rounded-xl flex items-center justify-between px-3 text-white font-extrabold text-xs" style={{ backgroundColor: activeTheme.primary }}>
                    <span>{schoolSettings.name || 'Driving School'}</span>
                    <span className="text-[10px] font-mono opacity-90">€{schoolSettings.lessonPricePerHour || 65}/hr</span>
                  </div>
                </div>

                {/* Card & Button Widget */}
                <div className="p-3 rounded-2xl border shadow-xs space-y-2" style={{ backgroundColor: activeTheme.card, borderColor: activeTheme.border }}>
                  <span className="text-[10px] font-bold uppercase" style={{ color: activeTheme.primary }}>Card & Button Preview</span>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Practical Lesson</span>
                    <button type="button" className="px-3 py-1 text-[11px] font-bold text-white rounded-lg shadow-xs" style={{ backgroundColor: activeTheme.button }}>
                      Book Now
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Badges */}
                <div className="p-3 rounded-2xl border shadow-xs space-y-2" style={{ backgroundColor: activeTheme.card, borderColor: activeTheme.border }}>
                  <span className="text-[10px] font-bold uppercase" style={{ color: activeTheme.primary }}>Progress & Badges</span>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-600 dark:text-zinc-300">
                      <span>CBR Exam Readiness</span>
                      <span style={{ color: activeTheme.primary }}>85%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: '85%', backgroundColor: activeTheme.primary }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Social Media & Legal */}
        {activeTab === 'social' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
              <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">
                {lang === 'ar' ? 'حسابات التواصل الاجتماعي والروابط القانونية' : lang === 'nl' ? 'Sociale Media & Documenten Links' : 'Social Media & Legal Policy Links'}
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5">Facebook Page URL</label>
                <input
                  type="text"
                  value={schoolSettings.facebookUrl || ''}
                  onChange={e => setSchoolSettings(prev => ({ ...prev, facebookUrl: e.target.value }))}
                  placeholder="https://facebook.com/drivingschool"
                  className="w-full h-10 text-xs font-semibold px-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5">Instagram Profile URL</label>
                <input
                  type="text"
                  value={schoolSettings.instagramUrl || ''}
                  onChange={e => setSchoolSettings(prev => ({ ...prev, instagramUrl: e.target.value }))}
                  placeholder="https://instagram.com/drivingschool"
                  className="w-full h-10 text-xs font-semibold px-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5">WhatsApp Business Number</label>
                <input
                  type="text"
                  value={schoolSettings.whatsappNumber || ''}
                  onChange={e => setSchoolSettings(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                  placeholder="+31612345678"
                  className="w-full h-10 text-xs font-semibold px-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5">Privacy Policy URL</label>
                <input
                  type="text"
                  value={schoolSettings.privacyPolicyUrl || ''}
                  onChange={e => setSchoolSettings(prev => ({ ...prev, privacyPolicyUrl: e.target.value }))}
                  placeholder="https://drivingschool.nl/privacy-policy"
                  className="w-full h-10 text-xs font-semibold px-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5">Terms & Conditions URL</label>
                <input
                  type="text"
                  value={schoolSettings.termsConditionsUrl || ''}
                  onChange={e => setSchoolSettings(prev => ({ ...prev, termsConditionsUrl: e.target.value }))}
                  placeholder="https://drivingschool.nl/terms-conditions"
                  className="w-full h-10 text-xs font-semibold px-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all text-left"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: AI Settings */}
        {activeTab === 'ai' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
              <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">
                {lang === 'ar' ? 'إعدادات الذكاء الاصطناعي' : lang === 'nl' ? 'AI Coach Instellingen' : 'AI Assistant Settings'}
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-semibold">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5">
                  {lang === 'ar' ? 'اسم مساعد الذكاء الاصطناعي الخاص بالمدرسة' : lang === 'nl' ? 'Naam AI Assistent' : 'Custom AI Assistant Name'}
                </label>
                <input
                  type="text"
                  value={schoolSettings.aiAssistantName ?? ''}
                  onChange={e => setSchoolSettings(prev => ({ ...prev, aiAssistantName: e.target.value }))}
                  placeholder="AI Coach"
                  className="w-full h-10 text-xs font-semibold px-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Action Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            {lang === 'ar' ? 'احفظ الإعدادات لتطبيق التغييرات في النظام.' : lang === 'nl' ? 'Sla instellingen op om wijzigingen toe te passen.' : 'Save your settings to apply changes system-wide.'}
          </p>
          <button
            type="submit"
            className="h-10 px-6 font-extrabold text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition cursor-pointer shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
          >
            <Save className="h-4 w-4" />
            <span>{lang === 'ar' ? 'حفظ التغييرات' : lang === 'nl' ? 'Opslaan' : 'Save Changes'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};
export default SchoolConfigPanel;
