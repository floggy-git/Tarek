import React, { useState, useEffect, useRef } from 'react';
import { 
  Navigation, Play, Square, Activity, Wifi, WifiOff, History, User, Trash2, Eye, Compass, MapPin, AlertTriangle
} from 'lucide-react';
import { Language } from '../types';
import { safeSetItem } from '../utils/safeStorage';
import LiveNavigationMap from './LiveNavigationMap';

interface TrackedPoint {
  lat: number;
  lng: number;
}

interface PerformanceMarker {
  lat: number;
  lng: number;
  type: 'success' | 'warning' | 'severe';
  title: string;
  note: string;
  timestamp: string;
}

interface SavedExamRoute {
  id: string;
  studentName: string;
  routeName: string;
  date: string;
  time: string;
  durationSeconds: number;
  points: TrackedPoint[];
  markers: PerformanceMarker[];
  result: 'pass' | 'fail';
  notes: string;
  maxSpeed: number;
}

interface ExamTrackerProps {
  lang: Language;
  lessons?: any[];
  onRouteSaved?: (studentName: string, points: TrackedPoint[], durationSeconds: number) => void;
}

// Haversine helper to calculate distance between two lat/lng coordinates in km
const getDistanceBetweenPoints = (pt1: TrackedPoint, pt2: TrackedPoint): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (pt2.lat - pt1.lat) * Math.PI / 180;
  const dLng = (pt2.lng - pt1.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(pt1.lat * Math.PI / 180) * Math.cos(pt2.lat * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Cumulative distance helper
const calculateTotalDistance = (points: TrackedPoint[]): number => {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += getDistanceBetweenPoints(points[i], points[i + 1]);
  }
  return total;
};

function ExamTrackerComponent({ lang, lessons, onRouteSaved }: ExamTrackerProps) {
  // Get student names from the passed lessons list
  const activeLessons = lessons || [];
  const activeStudents = activeLessons.map(l => l.studentName);
  const uniqueStudents = Array.from(new Set(activeStudents)).filter(Boolean);

  // Setup fallback students list if none passed
  const fallbackStudents = [
    { name: lang === 'ar' ? "أمير الحسن" : "Amir Al-Hassan" },
    { name: lang === 'ar' ? "ساني دي يونغ" : "Sanne de Jong" },
    { name: lang === 'ar' ? "مايكل فان بيرغ" : "Michael van Berg" },
  ];

  const students = uniqueStudents.length > 0 
    ? uniqueStudents.map(name => ({ name }))
    : fallbackStudents;

  const [selectedStudent, setSelectedStudent] = useState(students[0].name);
  const [trackingMode, setTrackingMode] = useState<'idle' | 'tracking' | 'review'>('idle');
  
  // Tracking telemetry state
  const [currentPoints, setCurrentPoints] = useState<TrackedPoint[]>([]);
  const [trackingStartTime, setTrackingStartTime] = useState<number | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [gpsError, setGpsError] = useState<string | null>(null);
  
  // Hidden developer mode state (Hidden Simulation Mode)
  const [clickCount, setClickCount] = useState<number>(0);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // History state loaded from localStorage
  const [savedRoutes, setSavedRoutes] = useState<SavedExamRoute[]>([]);
  const [reviewRoute, setReviewRoute] = useState<SavedExamRoute | null>(null);
  const [routeToDelete, setRouteToDelete] = useState<string | null>(null);

  // References for Leaflet map integration
  const mapRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const carMarkerRef = useRef<any>(null);
  const startMarkerRef = useRef<any>(null);

  const gpsWatchIdRef = useRef<number | null>(null);
  const simIntervalRef = useRef<any>(null);

  // Load Leaflet library
  const loadLeaflet = (callback: () => void) => {
    callback();
  };

  // Seed default history or load from local storage
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem('rijschool_tracked_exams');
    } catch (e) {
      console.warn("localStorage is not accessible", e);
    }
    if (saved) {
      try {
        setSavedRoutes(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved routes", e);
      }
    } else {
      // Seed initial mockup route around Sloterdijk Station
      const initialMockRoutes: SavedExamRoute[] = [
        {
          id: 'exam-mock-1',
          studentName: lang === 'ar' ? "أمير الحسن" : "Amir Al-Hassan",
          routeName: lang === 'ar' ? "مسار تتبع الدرس المباشر" : "Live Trajectory Lesson",
          date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
          time: "11:30",
          durationSeconds: 1250,
          points: [
            { lat: 52.3892, lng: 4.8378 },
            { lat: 52.3880, lng: 4.8410 },
            { lat: 52.3860, lng: 4.8450 },
            { lat: 52.3840, lng: 4.8490 },
            { lat: 52.3820, lng: 4.8510 }
          ],
          markers: [],
          result: 'pass',
          notes: lang === 'ar' ? "أداء ممتاز وانضباط تام بقوانين السير." : "Flawless lesson tracked with smooth braking and optimal highway speed.",
          maxSpeed: 48
        }
      ];
      setSavedRoutes(initialMockRoutes);
      safeSetItem('rijschool_tracked_exams', JSON.stringify(initialMockRoutes));
    }
  }, [lang]);

  // Telemetry duration timer
  useEffect(() => {
    let interval: any = null;
    if (trackingMode === 'tracking' && trackingStartTime) {
      interval = setInterval(() => {
        setDuration(Math.floor((Date.now() - trackingStartTime) / 1000));
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [trackingMode, trackingStartTime]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
      }
    };
  }, []);

  // Start tracking
  const startTracking = () => {
    setCurrentPoints([]);
    setTrackingStartTime(Date.now());
    setDuration(0);
    setTrackingMode('tracking');
    setGpsError(null);

    if (isDemoMode) {
      // Simulate route points for CBR exam simulation
      const demoPoints: TrackedPoint[] = [
        { lat: 52.3892, lng: 4.8378 },
        { lat: 52.3881, lng: 4.8415 },
        { lat: 52.3865, lng: 4.8445 },
        { lat: 52.3842, lng: 4.8488 },
        { lat: 52.3815, lng: 4.8515 },
        { lat: 52.3795, lng: 4.8505 },
        { lat: 52.3812, lng: 4.8458 },
        { lat: 52.3835, lng: 4.8402 },
        { lat: 52.3862, lng: 4.8361 },
        { lat: 52.3892, lng: 4.8378 }
      ];

      let idx = 0;
      setCurrentPoints([demoPoints[0]]);
      simIntervalRef.current = setInterval(() => {
        idx++;
        if (idx < demoPoints.length) {
          setCurrentPoints(prev => [...prev, demoPoints[idx]]);
        } else {
          clearInterval(simIntervalRef.current);
          simIntervalRef.current = null;
        }
      }, 3000);
    }
  };

  // Finish and save route
  const saveTrackedRoute = () => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }

    let finalPoints = currentPoints;
    let finalDuration = duration;

    if (currentPoints.length < 2 && isDemoMode) {
      // populate full mock path if simulation did not finish
      finalPoints = [
        { lat: 52.3892, lng: 4.8378 },
        { lat: 52.3881, lng: 4.8415 },
        { lat: 52.3865, lng: 4.8445 },
        { lat: 52.3842, lng: 4.8488 },
        { lat: 52.3815, lng: 4.8515 }
      ];
      finalDuration = duration || 450;
      const newRoute: SavedExamRoute = {
        id: `exam-${Date.now()}`,
        studentName: selectedStudent,
        routeName: lang === 'ar' ? "مسار تتبع الدرس المباشر" : "Live Trajectory Lesson",
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        durationSeconds: finalDuration,
        points: finalPoints,
        markers: [],
        result: 'pass',
        notes: lang === 'ar' ? "درس تدريبي تم تتبعه بنجاح عن طريق نظام الـ GPS المباشر." : "Successfully tracked driving session with real-time GPS logging.",
        maxSpeed: 45
      };

      const updated = [newRoute, ...savedRoutes];
      setSavedRoutes(updated);
      safeSetItem('rijschool_tracked_exams', JSON.stringify(updated));
    } else if (currentPoints.length >= 1) {
      const newRoute: SavedExamRoute = {
        id: `exam-${Date.now()}`,
        studentName: selectedStudent,
        routeName: lang === 'ar' ? "مسار تتبع الدرس المباشر" : "Live Trajectory Lesson",
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        durationSeconds: finalDuration,
        points: finalPoints,
        markers: [],
        result: 'pass',
        notes: lang === 'ar' ? "درس تدريبي تم تتبعه بنجاح عن طريق نظام الـ GPS المباشر." : "Successfully tracked driving session with real-time GPS logging.",
        maxSpeed: Math.floor(35 + Math.random() * 20)
      };

      const updated = [newRoute, ...savedRoutes];
      setSavedRoutes(updated);
      safeSetItem('rijschool_tracked_exams', JSON.stringify(updated));
    }

    if (onRouteSaved) {
      onRouteSaved(selectedStudent, finalPoints, finalDuration);
    }

    setTrackingMode('idle');
    alert(lang === 'ar' ? `تم إيقاف التتبع وحفظ مسار الدرس للمتدرب (${selectedStudent}) بنجاح. يرجى إكمال تفاصيل الدرس والدفع من سجل الدروس.` : `GPS route tracking stopped and saved for ${selectedStudent} successfully. Please complete the lesson and payment details from the Lesson Log.`);
  };

  // Delete recorded track - open custom warning modal instead of native confirm
  const deleteRoute = (id: string) => {
    setRouteToDelete(id);
  };

  const handleDeleteConfirm = () => {
    if (!routeToDelete) return;
    const updated = savedRoutes.filter(r => r.id !== routeToDelete);
    setSavedRoutes(updated);
    safeSetItem('rijschool_tracked_exams', JSON.stringify(updated));
    if (reviewRoute?.id === routeToDelete) {
      setReviewRoute(null);
      setTrackingMode('idle');
    }
    setRouteToDelete(null);
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Hidden Easter Egg toggler for Demo simulation
  const handleEasterEggClick = () => {
    const newCount = clickCount + 1;
    if (newCount >= 5) {
      setIsDemoMode(!isDemoMode);
      setClickCount(0);
      alert(`Simulation Mode ${!isDemoMode ? 'ENABLED (Simulated office route)' : 'DISABLED (Using real GPS location)'}`);
    } else {
      setClickCount(newCount);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn font-sans" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Sidebar Controls Column */}
      <div className="lg:col-span-4 space-y-6">
        
        {trackingMode === 'idle' && (
          <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
              <span className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
                <Navigation className="h-5 w-5 animate-pulse" />
              </span>
              <div>
                <h3 
                  onClick={handleEasterEggClick}
                  className="font-extrabold text-slate-800 dark:text-white text-sm select-none cursor-pointer"
                  title="Click 5 times for hidden simulation mode"
                >
                  {lang === 'ar' ? 'تتبع مسار نظام الـ GPS الفعلي' : 'Real-time GPS Route Tracker'}
                </h3>
                <p className="text-[11px] text-slate-450 dark:text-zinc-400 mt-0.5">
                  {lang === 'ar' ? 'تتبع فوري ومستمر لموقع المركبة الفعلي أثناء القيادة.' : 'Track absolute GPS trajectory path of the driving session live.'}
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 block mb-1.5">
                  {lang === 'ar' ? 'اختر المتدرب:' : 'Select Student:'}
                </label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full h-8 px-3 py-1 text-xs font-semibold bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  {students.map((std, idx) => (
                    <option key={idx} value={std.name}>{std.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={startTracking}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black cursor-pointer transition flex items-center justify-center gap-2 shadow-md shadow-blue-500/10"
              >
                <Play className="h-4 w-4 fill-white" />
                {lang === 'ar' ? 'بدء تتبع الدرس' : 'Start Tracking'}
              </button>
            </div>
          </div>
        )}

        {/* SIMPLIFIED Live GPS tracking HUD */}
        {trackingMode === 'tracking' && (
          <div className="p-5 bg-white dark:bg-zinc-900 border-2 border-blue-500/30 rounded-3xl shadow-lg space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
                <h3 className="font-extrabold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                  {lang === 'ar' ? 'تتبع GPS مباشر نشط' : 'Active GPS Tracking'}
                </h3>
              </div>
              <span className="text-xs font-mono font-black text-blue-500 bg-blue-500/10 px-2.5 py-0.5 rounded-md animate-pulse">
                {formatDuration(duration)}
              </span>
            </div>

            {/* Error banner */}
            {gpsError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border border-rose-100 dark:border-rose-900/30 rounded-xl text-[10px] font-bold flex items-center gap-1.5 leading-relaxed">
                <WifiOff className="h-4 w-4 shrink-0 animate-bounce" />
                <span>{gpsError}</span>
              </div>
            )}

            {/* Tracking details */}
            <div className="p-3.5 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">{lang === 'ar' ? 'حالة الإشارة:' : 'GPS Status:'}</span>
                <span className="font-mono font-black text-green-500 flex items-center gap-1">
                  <Activity className="h-3 w-3 animate-ping" />
                  {isDemoMode ? (lang === 'ar' ? 'محاكاة نشطة' : 'SIMULATED') : (lang === 'ar' ? 'اتصال قوي' : 'LIVE / HIGH PRECISION')}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">{lang === 'ar' ? 'المسافة المقطوعة:' : 'Distance:'}</span>
                <span className="font-black text-slate-800 dark:text-white font-mono">
                  {calculateTotalDistance(currentPoints).toFixed(2)} km
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">{lang === 'ar' ? 'المدة الزمنية:' : 'Duration:'}</span>
                <span className="font-black text-slate-850 dark:text-white font-mono">
                  {formatDuration(duration)}
                </span>
              </div>
            </div>

            <button
              onClick={saveTrackedRoute}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              <Square className="h-3.5 w-3.5 fill-white" />
              {lang === 'ar' ? 'إيقاف التتبع وحفظ المسار' : 'Stop Tracking & Save Route'}
            </button>
          </div>
        )}

        {/* Review HUD */}
        {trackingMode === 'review' && reviewRoute && (
          <div className="p-5 bg-white dark:bg-zinc-900 border border-blue-100 dark:border-zinc-800 rounded-3xl shadow-lg space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-blue-500/15 text-blue-600 rounded-xl">
                  <Compass className="h-5 w-5 animate-spin" style={{ animationDuration: '6s' }} />
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-white text-xs">
                    {lang === 'ar' ? 'مراجعة وتدريب مسار الطريق' : 'Route History Review'}
                  </h3>
                  <p className="text-[10px] text-slate-450">
                    {lang === 'ar' ? `المتدرب: ${reviewRoute.studentName}` : `Student: ${reviewRoute.studentName}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setReviewRoute(null);
                  setTrackingMode('idle');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-full bg-slate-50 dark:bg-zinc-950 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-center text-xs font-bold">
                <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800/50">
                  <span className="text-[9px] text-slate-400 block uppercase tracking-wider">{lang === 'ar' ? 'المدة' : 'Duration'}</span>
                  <span className="text-sm font-black text-slate-800 dark:text-white mt-1 block font-mono">{formatDuration(reviewRoute.durationSeconds)}</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800/50">
                  <span className="text-[9px] text-slate-400 block uppercase tracking-wider">{lang === 'ar' ? 'أعلى سرعة' : 'Max Speed'}</span>
                  <span className="text-sm font-black text-slate-850 dark:text-white mt-1 block font-mono">{reviewRoute.maxSpeed || 45} km/h</span>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/20 dark:bg-blue-950/10 rounded-2xl border border-blue-500/10 text-[11px] leading-relaxed text-slate-600 dark:text-zinc-300">
                <strong>📝 {lang === 'ar' ? 'تقرير التقييم:' : 'Evaluation Dossier Notes:'}</strong>
                <p className="mt-1 italic font-medium">"{reviewRoute.notes}"</p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Main Map Column */}
      <div className="lg:col-span-8 flex flex-col space-y-4">
        
        <div className="p-4 bg-slate-900 text-white rounded-3xl flex justify-between items-center shadow-xs">
          <div>
            <h2 className="font-extrabold text-sm tracking-wide uppercase flex items-center gap-1.5">
              <span>🗺️</span>
              {lang === 'ar' ? 'تتبع درس القيادة المباشر' : 'Live Lesson Tracking'}
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {trackingMode === 'tracking' 
                ? (lang === 'ar' ? `جاري تتبع مسار المتدرب ${selectedStudent} حالياً` : `Currently streaming live trajectory coordinates of ${selectedStudent}`)
                : trackingMode === 'review' 
                  ? (lang === 'ar' ? `عرض مجريات مسار الدرس المؤرشف` : `Rendering historic route path replay`)
                  : (lang === 'ar' ? 'جاهز للتتبع. اختر متدرباً وابدأ الدرس.' : 'Status: Ready. Please select a student and begin tracking.')}
            </p>
          </div>
        </div>

        {/* Real Dynamic Live Navigation Map Frame */}
        <div className="h-[460px] lg:h-[480px] rounded-3xl overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-lg relative bg-slate-100 dark:bg-slate-900 z-10">
          <LiveNavigationMap 
            points={
              trackingMode === 'tracking' 
                ? currentPoints 
                : trackingMode === 'review' && reviewRoute 
                  ? reviewRoute.points.map(p => ('lat' in p ? p : { lat: 52.3892 + ((p as any).y - 350) * -0.0001, lng: 4.8378 + ((p as any).x - 320) * 0.0001 }))
                  : []
            }
            isTracking={trackingMode === 'tracking'}
            lang={lang}
            height="100%"
            studentName={selectedStudent || 'Student'}
            activeLessonTitle={trackingMode === 'review' && reviewRoute ? reviewRoute.title : 'Driving Exam Track'}
            elapsedSeconds={duration}
            showTelemetry={false}
            onLocationUpdate={(pt) => {
              setCurrentPoints(prev => {
                if (prev.length === 0) return [pt];
                const last = prev[prev.length - 1];
                if (getDistanceBetweenPoints(last, pt) >= 0.002) {
                  return [...prev, pt];
                }
                return prev;
              });
            }}
          />
        </div>

        {/* Recorded Exams History Archive */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-800">
            <h3 className="font-extrabold text-slate-850 dark:text-white text-sm flex items-center gap-2">
              <History className="h-4 w-4 text-blue-500" />
              {lang === 'ar' ? 'سجل أرشيف مسارات القيادة الموثقة' : 'Recorded Lesson Trajectories Archive'}
            </h3>
            <span className="px-2.5 py-0.5 text-[9px] bg-slate-100 dark:bg-zinc-800 text-slate-550 rounded-full font-mono font-bold">
              {savedRoutes.length} {lang === 'ar' ? 'سجلات' : 'records'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedRoutes.map((route) => (
              <div 
                key={route.id} 
                className={`p-4 rounded-2xl border transition duration-150 space-y-3 relative overflow-hidden ${
                  reviewRoute?.id === route.id 
                    ? 'bg-blue-50/50 dark:bg-blue-950/10 border-blue-400 dark:border-blue-900/40 shadow-sm' 
                    : 'bg-slate-50 dark:bg-zinc-950/50 border-slate-100 dark:border-zinc-850 hover:border-slate-200 dark:hover:border-zinc-850'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      GPS TRACK
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">{route.date}</span>
                  </div>
                  <button 
                    onClick={() => deleteRoute(route.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-900 cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="font-black text-slate-850 dark:text-white flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    {route.studentName}
                  </p>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                    🛣️ {route.routeName || (lang === 'ar' ? "مسار مخصص" : "Custom Route")}
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium line-clamp-2">
                    "{route.notes}"
                  </p>
                </div>

                <div className="flex gap-4 text-[10px] font-bold text-slate-450 border-t border-slate-100 dark:border-zinc-850/50 pt-2 flex-wrap font-mono">
                  <span>⏱️ {formatDuration(route.durationSeconds)}</span>
                  <span>⚡ MAX SPEED: {route.maxSpeed || 45} km/h</span>
                  <span className="text-blue-600 dark:text-blue-400">📍 {route.points.length} coordinates</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setReviewRoute(route);
                    setTrackingMode('review');
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
                    reviewRoute?.id === route.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Eye className="h-4 w-4" />
                  {lang === 'ar' ? 'عرض مسار الدرس والمراجعة' : 'Display Route & Review'}
                </button>
              </div>
            ))}

            {savedRoutes.length === 0 && (
              <div className="col-span-2 text-center py-8 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-dashed border-slate-100 dark:border-zinc-900">
                <Compass className="h-8 w-8 text-slate-300 mx-auto mb-2 animate-spin" style={{ animationDuration: '12s' }} />
                <p className="text-xs text-slate-400 font-bold">{lang === 'ar' ? 'لا توجد مسارات قيادة مسجلة بعد.' : 'No driving tracks recorded yet.'}</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Beautiful Custom Deletion Warning Modal */}
      {routeToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl shrink-0">
                <AlertTriangle className="h-6 w-6 stroke-[2]" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                  <span>{lang === 'ar' ? '⚠️ تحذير: حذف مسار القيادة' : '⚠️ Warning: Delete Driving Route'}</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-bold leading-relaxed">
                  {lang === 'ar' 
                    ? 'هل أنت متأكد من حذف مسار هذا الدرس العملي نهائياً من السجلات؟ لا يمكن التراجع عن هذا الإجراء لكي يبقى التطبيق نظيفاً.'
                    : 'Are you sure you want to permanently delete this driving track? This action cannot be undone, to keep the application clean.'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 dark:border-zinc-850/60">
              <button
                type="button"
                onClick={() => setRouteToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900 transition cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-500/10 transition cursor-pointer"
              >
                {lang === 'ar' ? 'نعم، احذف السجل' : 'Yes, Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const ExamTracker = React.memo(ExamTrackerComponent);
export default ExamTracker;
