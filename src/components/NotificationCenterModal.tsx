import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  CalendarX, 
  Award, 
  FileText, 
  MessageSquare, 
  Clock, 
  Trash2,
  Info
} from 'lucide-react';
import { 
  AppNotification, 
  getActiveNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification 
} from '../utils/notificationStore';
import { UserRole } from '../types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'nl' | 'en';
  currentUser: {
    role: UserRole | string;
    name?: string;
    email?: string;
    studentId?: string;
    id?: string;
  } | null;
  onNavigateToTab?: (tab: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  lang,
  currentUser,
  onNavigateToTab
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');

  const refreshNotifications = () => {
    if (!currentUser) return;
    const items = getActiveNotifications(
      currentUser.role,
      currentUser.email,
      currentUser.name,
      currentUser.studentId || currentUser.id
    );
    setNotifications(items);
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      refreshNotifications();
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (!isOpen || !currentUser) return;
    const handleUpdate = () => {
      refreshNotifications();
    };
    window.addEventListener('appNotificationsUpdated', handleUpdate);
    return () => {
      window.removeEventListener('appNotificationsUpdated', handleUpdate);
    };
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    if (!currentUser) return;
    markAllNotificationsAsRead(
      currentUser.role,
      currentUser.email,
      currentUser.name,
      currentUser.studentId || currentUser.id
    );
    refreshNotifications();
  };

  const handleItemClick = (notif: AppNotification) => {
    if (!notif.read) {
      markNotificationAsRead(notif.id);
      refreshNotifications();
    }
    // If it's instructor feedback or notes, navigate to profile or lessons if requested
    if (notif.type === 'instructor_feedback' || notif.type === 'instructor_note') {
      if (currentUser?.role === 'student' && onNavigateToTab) {
        onNavigateToTab('profile');
        onClose();
      }
    } else if (notif.type === 'lesson_completed' || notif.type === 'lesson_cancelled_by_trainer' || notif.type === 'lesson_cancelled_by_student') {
      if (onNavigateToTab) {
        onNavigateToTab(currentUser?.role === 'trainer' ? 'overview' : 'lessons');
        onClose();
      }
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatRelativeTime = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (lang === 'ar') {
      if (minutes < 2) return 'الآن';
      if (minutes < 60) return `منذ ${minutes} دقيقة`;
      if (hours < 24) return `منذ ${hours} ساعة`;
      if (days === 1) return 'أمس';
      return `منذ ${days} أيام`;
    } else if (lang === 'nl') {
      if (minutes < 2) return 'Zojuist';
      if (minutes < 60) return `${minutes} min geleden`;
      if (hours < 24) return `${hours} uur geleden`;
      if (days === 1) return 'Gisteren';
      return `${days} dagen geleden`;
    } else {
      if (minutes < 2) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days === 1) return 'Yesterday';
      return `${days}d ago`;
    }
  };

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'lesson_cancelled_by_student':
      case 'lesson_cancelled_by_trainer':
        return <CalendarX className="h-4 w-4 text-rose-500" />;
      case 'lesson_completed':
        return <Award className="h-4 w-4 text-emerald-500" />;
      case 'invoice_sent':
        return <FileText className="h-4 w-4 text-amber-500" />;
      case 'instructor_feedback':
      case 'instructor_note':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-slate-500" />;
    }
  };

  const getNotificationTitle = (n: AppNotification) => {
    if (lang === 'ar') return n.titleAr;
    if (lang === 'nl') return n.titleNl;
    return n.titleEn;
  };

  const getNotificationMessage = (n: AppNotification) => {
    if (lang === 'ar') return n.messageAr;
    if (lang === 'nl') return n.messageNl;
    return n.messageEn;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200" 
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] mt-12 sm:mt-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100/50 dark:border-blue-900/40">
              <Bell className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{lang === 'ar' ? 'مركز الإشعارات' : lang === 'nl' ? 'Notificaties' : 'Notifications'}</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white">
                    {unreadCount}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                {currentUser?.role === 'trainer'
                  ? (lang === 'ar' ? 'إشعارات الإلغاء والحجوزات (تحديثات نشطة)' : lang === 'nl' ? 'Annuleringen en boekingen' : 'Cancellations and bookings')
                  : (lang === 'ar' ? 'توجيهات المدرب وسجل التدريب الدائم' : lang === 'nl' ? 'Instructeur updates & leshistorie' : 'Instructor updates & lesson history')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-slate-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition flex items-center gap-1 cursor-pointer"
                title={lang === 'ar' ? 'تحديد الكل كمقروء' : lang === 'nl' ? 'Alles gelezen' : 'Mark all as read'}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{lang === 'ar' ? 'تحديد الكل كمقروء' : lang === 'nl' ? 'Alles gelezen' : 'Mark all read'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-zinc-950/40 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-xl font-bold transition text-xs ${
                activeFilter === 'all'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-zinc-700'
                  : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400'
              }`}
            >
              {lang === 'ar' ? 'الكل' : lang === 'nl' ? 'Alle' : 'All'} ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('unread')}
              className={`px-3 py-1 rounded-xl font-bold transition text-xs ${
                activeFilter === 'unread'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-zinc-700'
                  : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400'
              }`}
            >
              {lang === 'ar' ? 'غير مقروء' : lang === 'nl' ? 'Ongelezen' : 'Unread'} ({unreadCount})
            </button>
          </div>

          {currentUser?.role === 'trainer' && (
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{lang === 'ar' ? 'صلاحية 3 أيام للإلغاءات' : lang === 'nl' ? '3 dagen bewaartermijn' : '3-day notice retention'}</span>
            </span>
          )}
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 divide-y-0">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 text-slate-300 dark:text-zinc-600 flex items-center justify-center mx-auto">
                <Bell className="h-6 w-6 stroke-[1.5]" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-zinc-300">
                {lang === 'ar' ? 'لا توجد إشعارات حالياً' : lang === 'nl' ? 'Geen notificaties gevonden' : 'All caught up!'}
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                {currentUser?.role === 'trainer'
                  ? (lang === 'ar' ? 'ستظهر هنا إشعارات إلغاء وحجز الدروس عند قيام الطلاب بأي إجراء.' : lang === 'nl' ? 'Nieuwe annuleringen en boekingen van leerlingen verschijnen hier.' : 'New lesson cancellations and booking updates from students will appear here.')
                  : (lang === 'ar' ? 'ستظهر هنا توجيهات وملاحظات مدربك وتقييمات الدروس المكتملة بشكل دائم.' : lang === 'nl' ? 'Feedback, notities en voltooide lessen van je instructeur verschijnen hier.' : 'Instructor feedback, completed lesson summaries, and updates will appear here.')}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isUnread = !notif.read;
              const isCancellation = notif.type.includes('cancelled');

              return (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer relative group ${
                    isUnread
                      ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-900/50 shadow-xs'
                      : 'bg-white dark:bg-zinc-900/80 border-slate-100 dark:border-zinc-800 hover:border-slate-200 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isCancellation
                        ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40'
                        : notif.type === 'lesson_completed'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40'
                        : notif.type === 'invoice_sent'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40'
                        : 'bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40'
                    }`}>
                      {getNotificationIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 leading-tight truncate">
                          {getNotificationTitle(notif)}
                        </h4>
                        <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 shrink-0">
                          {formatRelativeTime(notif.timestamp)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-zinc-300 font-normal leading-relaxed">
                        {getNotificationMessage(notif)}
                      </p>

                      {/* Metadata badges if available */}
                      {notif.metadata && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                          {notif.metadata.date && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                              📅 {notif.metadata.date} {notif.metadata.time ? `• ${notif.metadata.time}` : ''}
                            </span>
                          )}
                          {notif.metadata.studentName && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                              👤 {notif.metadata.studentName}
                            </span>
                          )}
                          {notif.metadata.reason && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200/40 dark:border-rose-900/40">
                              {notif.metadata.reason}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action delete or unread dot */}
                    <div className="flex items-center gap-1 shrink-0 self-start">
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                          refreshNotifications();
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded-md transition"
                        title="Delete notification"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-800 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
          <Info className="h-3 w-3 text-blue-500 shrink-0" />
          <span>
            {currentUser?.role === 'trainer'
              ? (lang === 'ar' ? 'تُحفظ إشعارات إلغاء الطلاب لمدة 3 أيام تلقائياً للحفاظ على تنظيم القائمة.' : lang === 'nl' ? 'Annuleringsberichten blijven 3 dagen zichtbaar.' : 'Student cancellation notices are retained for 3 days.')
              : (lang === 'ar' ? 'ملاحظات وتوجيهات المدرب تظل محفوظة دائماً في ملفك الشخصي.' : lang === 'nl' ? 'Instructeur notities en historie blijven permanent bewaard in je profiel.' : 'Instructor feedback and notes are permanently preserved in your profile.')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenterModal;
