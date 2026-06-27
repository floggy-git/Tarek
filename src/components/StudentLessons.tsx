import React, { useState } from 'react';
import { 
  Calendar, Clock, Check, Plus, Landmark, Navigation, MapPin, 
  Sparkles, CheckCircle2, ChevronRight, CalendarCheck, Flame, Info,
  ChevronLeft, Sunrise, Sunset, Sun
} from 'lucide-react';
import { TRANSLATIONS, Language, Lesson, WalletTransaction } from '../types';
import { sendAppEmail } from '../utils/emailService';

interface StudentLessonsProps {
  lang: Language;
  t: typeof TRANSLATIONS['en'];
  lessons: Lesson[];
  setLessons: (lessons: Lesson[]) => void;
  transactions: WalletTransaction[];
  setTransactions: (transactions: WalletTransaction[]) => void;
  isOffline: boolean;
  setParentActiveTab: (tab: string) => void;
  setSelectedReplayLessonId: (id: string) => void;
}

export default function StudentLessons({ 
  lang, t, lessons, setLessons, transactions, setTransactions, isOffline,
  setParentActiveTab, setSelectedReplayLessonId
}: StudentLessonsProps) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [isBooking, setIsBooking] = useState(false);

  // Booking Form State
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [duration, setDuration] = useState<1 | 2>(1);
  const [pickup, setPickup] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [googleCalendarAdded, setGoogleCalendarAdded] = useState(false);

  // Custom Calendar Navigation
  const [displayedMonth, setDisplayedMonth] = useState(5); // June 2026 (0-indexed 5)
  const [displayedYear, setDisplayedYear] = useState(2026);

  // Constants
  const LESSON_PRICE_PER_HOUR = 65;
  const computedPrice = duration * LESSON_PRICE_PER_HOUR;

  // Filter lessons based on status
  const filteredLessons = lessons.filter(l => l.status === activeTab);

  // Helper for available days simulation
  // Only future weekdays (Mon-Fri) are considered available. Weekends are disabled in our premium app logic
  const getDayStatus = (dateStr: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const day = date.getDay();
    if (day === 0 || day === 6) {
      return 'unavailable'; // Weekend
    }
    return 'available';
  };

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTimeSlot || !pickup) return;

    // Check if weekday
    if (getDayStatus(selectedDate) === 'unavailable') {
      alert(lang === 'ar' ? 'عذراً، الدروس العملية غير متاحة خلال عطل نهاية الأسبوع (السبت والأحد). يرجى اختيار يوم عمل.' : lang === 'nl' ? 'Weekenddagen zijn helaas niet beschikbaar voor training.' : 'Weekends are unavailable for lessons.');
      return;
    }

    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      studentName: "Amir Al-Hassan",
      trainerName: "Instructeur Samir",
      date: selectedDate,
      time: selectedTimeSlot,
      duration: duration,
      price: computedPrice,
      pickupLocation: pickup,
      status: 'upcoming',
      routePoints: [
        { lat: 52.3731, lng: 4.8926 },
        { lat: 52.3800, lng: 4.9000 },
        { lat: 52.3731, lng: 4.8926 }
      ]
    };

    // Deduct from wallet transactions
    const transactionId = `trans-${Date.now()}`;
    const newTransaction: WalletTransaction = {
      id: transactionId,
      date: new Date().toISOString().split('T')[0],
      type: 'payment',
      amount: computedPrice,
      description: `Rijles Boeking - ${selectedDate} at ${selectedTimeSlot}`
    };

    setLessons([newLesson, ...lessons]);
    setTransactions([newTransaction, ...transactions]);
    setBookingSuccess(true);

    // Dispatch beautiful booking email
    sendAppEmail("Amir Al-Hassan", 'booking', {
      date: selectedDate,
      time: selectedTimeSlot,
      duration: duration,
      pickupLocation: pickup,
      price: computedPrice
    });
  };

  const handleResetBooking = () => {
    setIsBooking(false);
    setSelectedDate('');
    setSelectedTimeSlot('');
    setDuration(1);
    setPickup('');
    setBookingSuccess(false);
    setGoogleCalendarAdded(false);
  };

  // Helper for highlighting date availability visually
  const currentDaysList = [
    { label: "Today", value: "2026-06-23", status: "unavailable", wday: "TU" },
    { label: "Wed", value: "2026-06-24", status: "available", wday: "WE" },
    { label: "Thu", value: "2026-06-25", status: "available", wday: "TH" },
    { label: "Fri", value: "2026-06-26", status: "available", wday: "FR" },
    { label: "Sat", value: "2026-06-27", status: "unavailable", wday: "SA" },
    { label: "Sun", value: "2026-06-28", status: "unavailable", wday: "SU" },
    { label: "Mon", value: "2026-06-29", status: "available", wday: "MO" },
  ];

  const timeSlots = ["09:00", "11:00", "14:00", "16:00"];

  return (
    <div className="space-y-6 pb-20">
      
      {/* Top Banner Control */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">{t.lessons}</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage existing bookings or claim a slot with Samir</p>
        </div>

        {!isBooking && (
          <button
            id="start-booking-flow"
            onClick={() => setIsBooking(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{t.bookLesson}</span>
          </button>
        )}
      </div>

      {isBooking ? (
        <div id="booking-container-card" className="p-6 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl shadow-xl space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="flex justify-between items-center">
            <h2 className="text-base font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-wider">{t.bookLessonHeader}</h2>
            <button 
              id="exit-booking-btn"
              onClick={handleResetBooking}
              className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 rounded-lg text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {!bookingSuccess ? (
            <form onSubmit={handleBookSubmit} className="space-y-6">
              {/* Custom High-Fidelity Month Calendar */}
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-zinc-950 p-3 rounded-2xl border border-slate-100/10 dark:border-zinc-850/50">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.selectDate}</label>
                    <span className="text-sm font-black text-slate-800 dark:text-white mt-1">
                      {selectedDate ? (
                        <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping shrink-0" />
                          {selectedDate}
                        </span>
                      ) : (
                        <span className="text-amber-500 text-xs font-bold">{lang === 'ar' ? 'الرجاء اختيار تاريخ الدرس' : lang === 'nl' ? 'Kies een datum' : 'Pick a Date'}</span>
                      )}
                    </span>
                  </div>
                  
                  {/* Calendar Month Navigation Header */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (displayedYear === 2026 && displayedMonth <= 5) return;
                        if (displayedMonth === 0) {
                          setDisplayedMonth(11);
                          setDisplayedYear(prev => prev - 1);
                        } else {
                          setDisplayedMonth(prev => prev - 1);
                        }
                      }}
                      disabled={displayedYear === 2026 && displayedMonth <= 5}
                      className="p-1.5 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-30 border border-slate-100 dark:border-zinc-805/40 cursor-pointer flex items-center justify-center transition"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-black text-slate-700 dark:text-zinc-200 min-w-[100px] text-center font-mono">
                      {
                        lang === 'ar' ? `${["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"][displayedMonth]} ${displayedYear}`
                        : lang === 'nl' ? `${["Januari", "Februari", "Maart", "April", "Mei", "Juni", "Juli", "Augustus", "September", "Oktober", "November", "December"][displayedMonth]} ${displayedYear}`
                        : `${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][displayedMonth]} ${displayedYear}`
                      }
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (displayedMonth === 11) {
                          setDisplayedMonth(0);
                          setDisplayedYear(prev => prev + 1);
                        } else {
                          setDisplayedMonth(prev => prev + 1);
                        }
                      }}
                      className="p-1.5 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-100 dark:border-zinc-805/40 cursor-pointer flex items-center justify-center transition"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Weekdays Grid Headers */}
                <div className="grid grid-cols-7 gap-1 text-center font-mono font-extrabold text-[10px] text-slate-450 dark:text-zinc-500 tracking-wider">
                  {(lang === 'ar' ? ['إثن', 'ثلا', 'أرب', 'خميس', 'جمع', 'سبت', 'أحد'] : lang === 'nl' ? ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']).map(wd => (
                    <div key={wd} className="py-1 uppercase">{wd}</div>
                  ))}
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 gap-1.5 border border-slate-100 dark:border-zinc-800 p-2.5 rounded-2xl bg-white dark:bg-zinc-950/20">
                  {/* Render Blanks */}
                  {Array.from({ length: (new Date(displayedYear, displayedMonth, 1).getDay() === 0 ? 6 : new Date(displayedYear, displayedMonth, 1).getDay() - 1) }).map((_, i) => (
                    <div key={`blank-${i}`} className="p-2 opacity-0 select-none pointer-events-none" />
                  ))}

                  {/* Render Month Days */}
                  {Array.from({ length: new Date(displayedYear, displayedMonth + 1, 0).getDate() }).map((_, i) => {
                    const dayNum = i + 1;
                    const dateObj = new Date(displayedYear, displayedMonth, dayNum);
                    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    
                    // Since simulation is on 2026-06-23, past is strictly before 2026-06-24 for booking
                    const isPast = dateObj < new Date(2026, 5, 24); 
                    const dateString = `${displayedYear}-${String(displayedMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const isSelected = selectedDate === dateString;
                    const isToday = dateString === '2026-06-23';

                    let btnClass = "";
                    if (isPast) {
                      btnClass = "bg-slate-50 dark:bg-zinc-900/10 text-slate-300 dark:text-zinc-750 cursor-not-allowed border-transparent line-through opacity-30 text-xs";
                    } else if (isWeekend) {
                      btnClass = "bg-red-500/5 dark:bg-red-950/5 border-transparent text-red-400 dark:text-red-500/40 cursor-not-allowed text-xs relative overflow-hidden";
                    } else if (isSelected) {
                      btnClass = "bg-blue-600 border-blue-600 text-white font-extrabold shadow-md shadow-blue-500/20 scale-102 z-10 text-xs";
                    } else if (isToday) {
                      btnClass = "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-500 font-extrabold hover:bg-amber-500/20 text-xs";
                    } else {
                      btnClass = "bg-white dark:bg-zinc-900 border-slate-100/70 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-blue-500 hover:bg-blue-50/10 cursor-pointer text-xs font-bold";
                    }

                    return (
                      <button
                        key={`day-${dayNum}`}
                        type="button"
                        disabled={isPast || isWeekend}
                        onClick={() => setSelectedDate(dateString)}
                        className={`h-11 rounded-xl border flex flex-col items-center justify-center transition-all duration-150 ${btnClass}`}
                        title={isWeekend ? (lang === 'ar' ? 'عطلة - مغلق' : 'Weekend - Closed') : dateString}
                      >
                        <span className="text-xs font-black">{dayNum}</span>
                        {isToday && (
                          <span className="text-[7px] uppercase font-bold text-amber-500 tracking-tighter block leading-none mt-0.5 whitespace-nowrap">
                            {lang === 'ar' ? 'اليوم' : 'Today'}
                          </span>
                        )}
                        {isWeekend && (
                          <span className="text-[7px] uppercase font-semibold text-red-400/80 dark:text-red-550 tracking-tighter block leading-none mt-0.5 whitespace-nowrap">
                            {lang === 'ar' ? 'عطلة' : 'Closed'}
                          </span>
                        )}
                        {!isPast && !isWeekend && !isToday && !isSelected && (
                          <span className="text-[7px] uppercase font-bold text-blue-500/70 tracking-tighter block leading-none mt-0.5 whitespace-nowrap">
                            {lang === 'ar' ? 'متاح' : 'Free'}
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-[7px] uppercase font-black text-white tracking-tighter block leading-none mt-0.5 whitespace-nowrap">
                            {lang === 'ar' ? 'محدد' : 'Selected'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {/* Visual Legend */}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center items-center py-2 px-3 bg-slate-50 dark:bg-zinc-950 text-[9px] font-bold text-slate-400 dark:text-zinc-500 rounded-xl" dir="ltr">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-white dark:bg-zinc-900 border border-slate-200" />
                    <span>Free Day</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-red-400/20 border border-red-500/10" />
                    <span>Weekend (No Lessons)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span>Today</span>
                  </div>
                </div>
                
                <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                  <Info className="h-3 w-3 inline shrink-0 text-blue-500" />
                  <span>{lang === 'ar' ? 'ساعات التدريب المتاحة: الإثنين إلى الجمعة، من 08:00 صباحاً حتى 18:00 مساءً.' : 'Available working days: Monday through Friday, 08:00 - 18:00.'}</span>
                </p>
              </div>

              {/* Enhanced Interactive Categorized Time Selector */}
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 dark:text-zinc-400 uppercase tracking-wider block flex items-center justify-between">
                  <span>{t.selectTime}</span>
                  {selectedTimeSlot ? (
                    <span className="text-blue-600 dark:text-blue-400 font-mono tracking-tight font-black bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-lg border border-blue-500/10 text-xs">
                      {selectedTimeSlot}
                    </span>
                  ) : (
                    <span className="text-amber-500 normal-case font-bold">{lang === 'ar' ? 'الرجاء اختيار التوقيت' : lang === 'nl' ? 'Kies een tijdstip' : 'Please select a slot'}</span>
                  )}
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {[
                    { time: "08:00", p: "morning", tag: "Early Bird", tagNl: "Vroege vogel", tagAr: "صباحي مبكر" },
                    { time: "09:30", p: "morning", tag: "Most Request", tagNl: "Populair", tagAr: "مفضل جداً" },
                    { time: "11:00", p: "morning", tag: "Standard", tagNl: "Standaard", tagAr: "قياسي" },
                    { time: "12:30", p: "afternoon", tag: "Lunch Slot", tagNl: "Lunchpauze", tagAr: "فترة الغداء" },
                    { time: "14:00", p: "afternoon", tag: "Most Request", tagNl: "Populair", tagAr: "مفضل جداً" },
                    { time: "15:30", p: "afternoon", tag: "Standard", tagNl: "Standaard", tagAr: "قياسي" },
                    { time: "17:00", p: "evening", tag: "Sunset Drive", tagNl: "Late Avond", tagAr: "مسائي مميز" }
                  ].map(slot => {
                    const isSelected = selectedTimeSlot === slot.time;
                    const isMorning = slot.p === 'morning';
                    const isAfternoon = slot.p === 'afternoon';
                    
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => setSelectedTimeSlot(slot.time)}
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/10 scale-[1.01] ring-2 ring-blue-500/50'
                            : 'bg-slate-50 dark:bg-zinc-950 border-slate-100 dark:border-zinc-900 text-slate-700 dark:text-zinc-300 hover:border-blue-400 hover:bg-slate-100/50 dark:hover:bg-zinc-900/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg shrink-0 ${
                            isSelected 
                              ? 'bg-white/20 text-white' 
                              : isMorning 
                                ? 'bg-amber-500/10 text-amber-500' 
                                : isAfternoon 
                                  ? 'bg-orange-500/10 text-orange-400' 
                                  : 'bg-indigo-505/10 text-indigo-400'
                          }`}>
                            {isMorning ? (
                              <Sunrise className="h-4 w-4" />
                            ) : isAfternoon ? (
                              <Sun className="h-4 w-4" />
                            ) : (
                              <Sunset className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black font-mono tracking-tight leading-none mb-0.5">
                              {slot.time}
                            </span>
                            <span className={`text-[9px] font-bold leading-none ${isSelected ? 'text-white/80' : 'text-slate-400 dark:text-zinc-500'}`}>
                              {lang === 'ar' ? slot.tagAr : lang === 'nl' ? slot.tagNl : slot.tag}
                            </span>
                          </div>
                        </div>

                        {isSelected ? (
                          <div className="h-5 w-5 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0">
                            <Check className="h-3 w-3 font-semibold" />
                          </div>
                        ) : (
                          <span className="text-[10px] font-semibold text-blue-500 dark:text-blue-400">{lang === 'ar' ? 'اختر' : 'Book'}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration Segmented Picker */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{t.duration}</label>
                <div className="flex bg-slate-100/80 dark:bg-zinc-950 p-1 rounded-xl border border-slate-200/40 dark:border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setDuration(1)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                      duration === 1 
                        ? 'bg-white dark:bg-zinc-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/50 dark:border-zinc-700/50 font-bold' 
                        : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-white/40 dark:hover:bg-zinc-800/10'
                    }`}
                  >
                    {t.oneHour}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuration(2)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                      duration === 2 
                        ? 'bg-white dark:bg-zinc-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/50 dark:border-zinc-700/50 font-bold' 
                        : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-white/40 dark:hover:bg-zinc-800/10'
                    }`}
                  >
                    {t.twoHours}
                  </button>
                </div>
              </div>

              {/* Pickup Address */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{t.pickupLocation}</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amsterdam Sloterdijk, or home address..."
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/80 rounded-xl text-xs font-medium focus:ring-1 focus:ring-blue-500 dark:text-white"
                  />
                </div>
              </div>

              {/* Instant Automatic Pricing Display */}
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-500/10 rounded-2xl flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">{t.price} Breakdown</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{duration} Hour x €{LESSON_PRICE_PER_HOUR}/Hour rate</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-blue-600 dark:text-blue-400">€{computedPrice}</p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-lg tracking-wider pointer-events-auto"
              >
                {t.confirmBooking}
              </button>

            </form>
          ) : (
            <div className="text-center py-8 space-y-6">
              <div className="inline-flex p-4 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full">
                <CheckCircle2 className="h-10 w-10 animate-scale" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black dark:text-zinc-100">{t.bookingSuccess}</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">{t.emailSent}</p>
              </div>

              {/* Add to Calendars & Email Mock Triggers */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl max-w-sm mx-auto space-y-3 text-left">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500 flex items-center gap-1.5 justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                  Calendar Synchronizer
                </h4>
                
                <button
                  type="button"
                  onClick={() => setGoogleCalendarAdded(true)}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                    googleCalendarAdded 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                      : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 hover:border-blue-400 dark:text-zinc-200 cursor-pointer'
                  }`}
                >
                  <CalendarCheck className="h-3.5 w-3.5" />
                  {googleCalendarAdded ? 'Successfully synced with Google Calendar!' : t.addToCalendar}
                </button>

                <div className="flex gap-2">
                  <div className="flex-1 p-2 bg-slate-100 dark:bg-zinc-900 rounded-lg text-center text-[10px] text-slate-500 font-bold">
                    {t.studentCalendar}
                  </div>
                  <div className="flex-1 p-2 bg-slate-100 dark:bg-zinc-900 rounded-lg text-center text-[10px] text-slate-500 font-bold">
                    {t.trainerCalendar}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleResetBooking}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Go back to Lessons
                </button>
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Tabs Filter Selector */}
          <div className="flex bg-slate-100/80 dark:bg-zinc-900/80 p-1 rounded-xl max-w-md border border-slate-200/40 dark:border-zinc-800/40" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {(['upcoming', 'completed', 'cancelled'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  activeTab === tab
                    ? 'bg-white dark:bg-zinc-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/50 dark:border-zinc-700/50 font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-white/40 dark:hover:bg-zinc-800/10'
                }`}
              >
                {tab === 'upcoming' ? t.upcomingLessons : tab === 'completed' ? t.completedLessons : t.cancelled}
              </button>
            ))}
          </div>

          {/* List display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {filteredLessons.length > 0 ? (
              filteredLessons.map(lessonItem => (
                <div 
                  key={lessonItem.id} 
                  className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-xs space-y-4 hover:translate-y-[-1px] transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="p-1 px-2 text-[10px] font-bold rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        {lessonItem.duration} {lessonItem.duration === 1 ? t.oneHour : t.twoHours}
                      </span>
                      <h4 className="font-bold text-slate-800 dark:text-white mt-2 text-sm">
                        {lessonItem.trainerName}
                      </h4>
                    </div>
                    <span className="text-base font-extrabold text-slate-700 dark:text-zinc-200">
                      €{lessonItem.price}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 py-2 border-t border-b border-dashed border-slate-100 dark:border-zinc-800 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">{t.date}</p>
                      <p className="font-bold text-slate-700 dark:text-zinc-300">{lessonItem.date}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">{t.selectTime}</p>
                      <p className="font-bold text-slate-700 dark:text-zinc-300">{lessonItem.time}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase">{t.pickupLocation}</p>
                    <p className="text-xs font-medium text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                      {lessonItem.pickupLocation}
                    </p>
                  </div>

                  {lessonItem.trainerNotes && (
                    <div className="p-3 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-xl">
                      <p className="text-[10px] text-blue-500 font-extrabold uppercase mb-1">Feedback Instructeur</p>
                      <p className="text-xs text-slate-500 font-medium italic">"{lessonItem.trainerNotes}"</p>
                    </div>
                  )}

                  {lessonItem.status === 'completed' && (
                    <button
                      onClick={() => {
                        setSelectedReplayLessonId(lessonItem.id);
                        setParentActiveTab('home');
                      }}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      {lang === 'ar' ? 'إعادة تشغيل مسار الدرس' : 'Replay Driving Route'}
                    </button>
                  )}

                  {lessonItem.status === 'completed' && !lessonItem.reviewed && (
                    <button
                      onClick={() => {
                        alert(lang === 'ar' ? 'شكراً لك! تم تسجيل تقييمك وملاحظاتك حول أداء المدرب بنجاح.' : 'Feedback submitted correctly! Thank you.');
                        lessonItem.reviewed = true;
                        setLessons([...lessons]);
                      }}
                      className="w-full py-2 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-xs font-bold rounded-lg hover:border-blue-400 border border-transparent transition cursor-pointer mt-2"
                    >
                      Rate Samir's Instruction
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-1 md:col-span-2 text-center py-12 bg-white dark:bg-zinc-900/40 rounded-3xl border border-slate-100 dark:border-zinc-800/80">
                <Calendar className="h-8 w-8 text-slate-400 mx-auto opacity-60 mb-2" />
                <p className="text-xs text-slate-400">{t.noLessonsBooked} for this criteria.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
