export type AdminControlTab =
  | 'dashboard'
  | 'students'
  | 'lessons'
  | 'payments'
  | 'invoices'
  | 'packages'
  | 'instructors'
  | 'notifications'
  | 'help'
  | 'settings'
  | 'media'
  | 'reports'
  | 'audit'
  | 'status';

export type AdminLang = 'ar' | 'nl' | 'en';

export const ADMIN_I18N: Record<AdminLang, {
  title: string;
  subtitle: string;
  calendarNotice: string;
  tabs: Record<AdminControlTab, string>;
  actions: {
    save: string;
    cancel: string;
    refresh: string;
    syncFromSheet: string;
    syncToSheet: string;
    search: string;
    filter: string;
    export: string;
    add: string;
    edit: string;
    delete: string;
    close: string;
  };
}> = {
  en: {
    title: 'Google Sheets Administration Control Center',
    subtitle: 'Authoritative Administrative Console • 8 Operational Tabs • Real-Time Synchronization',
    calendarNotice: 'Google Calendar: PERMANENTLY DISABLED (Mandated Safety Constraint)',
    tabs: {
      dashboard: 'Dashboard',
      students: 'Students',
      lessons: 'Lessons',
      payments: 'Payments & Wallet',
      invoices: 'Invoices',
      packages: 'Packages',
      instructors: 'Instructors',
      notifications: 'Notifications',
      help: 'Help & FAQs',
      settings: 'School Settings',
      media: 'Media Library',
      reports: 'Reports',
      audit: 'Audit Logs',
      status: 'System Status'
    },
    actions: {
      save: 'Save Changes',
      cancel: 'Cancel',
      refresh: 'Refresh Data',
      syncFromSheet: 'Pull from Sheet',
      syncToSheet: 'Push to Sheet',
      search: 'Search records...',
      filter: 'Filter',
      export: 'Export Data',
      add: 'Add New Record',
      edit: 'Edit',
      delete: 'Delete',
      close: 'Close Console'
    }
  },
  nl: {
    title: 'Google Sheets Administratief Controlecentrum',
    subtitle: 'Gezaghebbend Beheerderspaneel • 8 Operationele Tabbladen • Real-Time Synchronisatie',
    calendarNotice: 'Google Agenda: PERMANENT UITGESCHAKELD (Veiligheidsvereiste)',
    tabs: {
      dashboard: 'Dashboard',
      students: 'Leerlingen',
      lessons: 'Lessen',
      payments: 'Betalingen & Saldo',
      invoices: 'Facturen',
      packages: 'Lespakketten',
      instructors: 'Instructeurs',
      notifications: 'Meldingen',
      help: 'Hulp & Vragen',
      settings: 'Schoolinstellingen',
      media: 'Mediatheek',
      reports: 'Rapporten',
      audit: 'Auditlogboeken',
      status: 'Systeemstatus'
    },
    actions: {
      save: 'Wijzigingen Opslaan',
      cancel: 'Annuleren',
      refresh: 'Gegevens Vernieuwen',
      syncFromSheet: 'Ophalen uit Sheet',
      syncToSheet: 'Wegschrijven naar Sheet',
      search: 'Zoek records...',
      filter: 'Filteren',
      export: 'Gegevens Exporteren',
      add: 'Nieuw Record Toevoegen',
      edit: 'Bewerken',
      delete: 'Verwijderen',
      close: 'Console Sluiten'
    }
  },
  ar: {
    title: 'مركز التحكم الإداري المركزي عبر Google Sheets',
    subtitle: 'لوحة التحكم الإدارية المعتمدة • 8 تبويبات تشغيلية • مزامنة حية ثنائية الاتجاه',
    calendarNotice: 'تقويم Google: معطل تماماً وبشكل دائم (شرط أمان صارم)',
    tabs: {
      dashboard: 'لوحة التحكم العامة',
      students: 'الطلاب والمتدربون',
      lessons: 'الدروس والحجوزات',
      payments: 'المدفوعات والمحفظة',
      invoices: 'الفواتير والرسوم',
      packages: 'الباقات والأسعار',
      instructors: 'المدربون والجدول',
      notifications: 'الإشعارات والتنبيهات',
      help: 'المساعدة والأسئلة الشائعة',
      settings: 'إعدادات المدرسة',
      media: 'مكتبة الوسائط',
      reports: 'التقارير والإحصاءات',
      audit: 'سجل التدقيق الأمني',
      status: 'حالة النظام والاتصال'
    },
    actions: {
      save: 'حفظ التعديلات',
      cancel: 'إلغاء',
      refresh: 'تحديث البيانات',
      syncFromSheet: 'جلب من جدول البيانات',
      syncToSheet: 'تصدير إلى جدول البيانات',
      search: 'بحث في السجلات...',
      filter: 'تصفية',
      export: 'تصدير البيانات',
      add: 'إضافة سجل جديد',
      edit: 'تعديل',
      delete: 'حذف',
      close: 'إغلاق لوحة التحكم'
    }
  }
};
