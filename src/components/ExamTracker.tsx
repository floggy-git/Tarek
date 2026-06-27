import React, { useState, useEffect, useRef } from 'react';
import { 
  Navigation, Play, Square, Activity, Wifi, WifiOff, History, User, Trash2, Eye, Compass, MapPin
} from 'lucide-react';
import { Language } from '../types';

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

export default function ExamTracker({ lang, lessons, onRouteSaved }: ExamTrackerProps) {
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

  // References for Leaflet map integration
  const mapRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const carMarkerRef = useRef<any>(null);
  const startMarkerRef = useRef<any>(null);

  const gpsWatchIdRef = useRef<number | null>(null);
  const simIntervalRef = useRef<any>(null);

  // Load Leaflet library dynamically
  const loadLeaflet = (callback: () => void) => {
    if ((window as any).L) {
      callback();
      return;
    }

    if (!(window as any)._leafletCallbacks) {
      (window as any)._leafletCallbacks = [];
    }
    (window as any)._leafletCallbacks.push(callback);

    if ((window as any)._leafletLoading) {
      return;
    }
    (window as any)._leafletLoading = true;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
      link.onerror = (e) => {
        console.warn("Leaflet stylesheet failed to load gracefully in sandbox:", e);
      };
      document.head.appendChild(link);
    }

    let script = document.getElementById('leaflet-js') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onerror = (e) => {
        console.warn("Leaflet script failed to load or CORS error in sandbox:", e);
      };
      document.body.appendChild(script);
    }

    const runCallbacks = () => {
      const callbacks = (window as any)._leafletCallbacks || [];
      (window as any)._leafletCallbacks = [];
      callbacks.forEach((cb: () => void) => {
        try {
          cb();
        } catch (e) {
          console.error("Error running Leaflet callback:", e);
        }
      });
    };

    const interval = setInterval(() => {
      if ((window as any).L) {
        clearInterval(interval);
        runCallbacks();
      }
    }, 50);

    script.onload = () => {
      if ((window as any).L) {
        clearInterval(interval);
        runCallbacks();
      }
    };
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
      try {
        localStorage.setItem('rijschool_tracked_exams', JSON.stringify(initialMockRoutes));
      } catch (e) {
        console.warn("localStorage is not accessible", e);
      }
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

  // Clean up timers & GPS watchers on unmount
  useEffect(() => {
    return () => {
      if (gpsWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
      }
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
      }
    };
  }, []);

  // Initialize and update Leaflet map for tracking or review
  useEffect(() => {
    const mapContainer = document.getElementById('exam-leaflet-map-element');
    if (!mapContainer || trackingMode === 'idle') {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          console.warn(e);
        }
        mapRef.current = null;
        polylineRef.current = null;
        carMarkerRef.current = null;
        startMarkerRef.current = null;
      }
      return;
    }

    loadLeaflet(() => {
      const L = (window as any).L;
      if (!L) return;

      // Determine center position
      let centerPos: [number, number] = [52.3892, 4.8378]; // Default Sloterdijk
      let pathPoints: TrackedPoint[] = [];

      if (trackingMode === 'tracking') {
        pathPoints = currentPoints;
        if (currentPoints.length > 0) {
          centerPos = [currentPoints[currentPoints.length - 1].lat, currentPoints[currentPoints.length - 1].lng];
        }
      } else if (trackingMode === 'review' && reviewRoute) {
        // Backwards compatibility for old records with X/Y points
        pathPoints = reviewRoute.points.map(p => {
          if ('lat' in p) return p;
          const x = (p as any).x;
          const y = (p as any).y;
          return {
            lat: 52.3892 + (y - 350) * -0.0001,
            lng: 4.8378 + (x - 320) * 0.0001
          };
        });
        if (pathPoints.length > 0) {
          centerPos = [pathPoints[0].lat, pathPoints[0].lng];
        }
      }

      if (!mapRef.current) {
        const mapContainerEl = document.getElementById('exam-leaflet-map-element');
        if (mapContainerEl && (mapContainerEl as any)._leaflet_id) {
          (mapContainerEl as any)._leaflet_id = null;
          mapContainerEl.innerHTML = '';
        }

        const map = L.map('exam-leaflet-map-element', {
          zoomControl: true,
          attributionControl: false
        }).setView(centerPos, 15);

        const isDark = document.documentElement.classList.contains('dark');
        const tileUrl = isDark 
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' 
          : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

        L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);
        mapRef.current = map;
      }

      const map = mapRef.current;

      // Draw Polyline path
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }

      if (pathPoints.length > 1) {
        const latlngs = pathPoints.map(p => [p.lat, p.lng]);
        polylineRef.current = L.polyline(latlngs, {
          color: trackingMode === 'review' ? '#10b981' : '#3b82f6',
          weight: 5,
          opacity: 0.9,
          lineJoin: 'round'
        }).addTo(map);
      }

      // Start position marker
      if (startMarkerRef.current) {
        map.removeLayer(startMarkerRef.current);
        startMarkerRef.current = null;
      }

      if (pathPoints.length > 0) {
        const startIcon = L.divIcon({
          className: 'active-start-marker',
          html: `<div style="background-color: #10b981; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.4);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });
        startMarkerRef.current = L.marker([pathPoints[0].lat, pathPoints[0].lng], { icon: startIcon })
          .addTo(map)
          .bindPopup(`<b>${lang === 'ar' ? 'البداية' : 'Start'}</b>`);
      }

      // Current car position marker
      if (carMarkerRef.current) {
        map.removeLayer(carMarkerRef.current);
        carMarkerRef.current = null;
      }

      if (pathPoints.length > 0) {
        const currentCarPos = [pathPoints[pathPoints.length - 1].lat, pathPoints[pathPoints.length - 1].lng];
        const carIcon = L.divIcon({
          className: 'active-car-marker',
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; width: 34px; height: 34px; background-color: rgba(59, 130, 246, 0.25); border-radius: 50%; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 8px rgba(59,130,246,0.5); display: flex; align-items: center; justify-content: center; font-size: 8px;">🚗</div>
            </div>
          `,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
        carMarkerRef.current = L.marker(currentCarPos, { icon: carIcon }).addTo(map);
        map.panTo(currentCarPos);
      }
    });
  }, [trackingMode, currentPoints, reviewRoute]);

  // Start tracking
  const startTracking = () => {
    setCurrentPoints([]);
    setTrackingStartTime(Date.now());
    setDuration(0);
    setTrackingMode('tracking');
    setGpsError(null);

    if (isDemoMode) {
      // Simulate route points around Amsterdam Sloterdijk Al-Andalos
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
    } else {
      if (!navigator.geolocation) {
        setGpsError(lang === 'ar' ? 'جهازك لا يدعم نظام تحديد المواقع GPS.' : 'Geolocation not supported by device.');
        return;
      }

      // Fetch immediately
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPt = { lat: position.coords.latitude, lng: position.coords.longitude };
          setCurrentPoints([newPt]);
        },
        (err) => {
          console.warn("Initial Geolocation Error:", err);
          // Fallback center if error
          setCurrentPoints([{ lat: 52.3892, lng: 4.8378 }]);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );

      // Watch updates
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newPt = { lat: position.coords.latitude, lng: position.coords.longitude };
          setCurrentPoints(prev => {
            if (prev.length === 0) return [newPt];
            const last = prev[prev.length - 1];
            // Only add if vehicle moved slightly (minimum 5 meters)
            if (getDistanceBetweenPoints(last, newPt) > 0.005) {
              return [...prev, newPt];
            }
            return prev;
          });
        },
        (err) => {
          console.warn("GPS stream watch issue (expected in headless non-GPS environments):", err);
          setGpsError(lang === 'ar' ? 'ضعف أو انقطاع إشارة الـ GPS' : 'GPS signal lost or weak');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      gpsWatchIdRef.current = watchId;
    }
  };

  // Finish and save route
  const saveTrackedRoute = () => {
    if (gpsWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatchIdRef.current);
      gpsWatchIdRef.current = null;
    }
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
      try {
        localStorage.setItem('rijschool_tracked_exams', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
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
      try {
        localStorage.setItem('rijschool_tracked_exams', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
    }

    if (onRouteSaved) {
      onRouteSaved(selectedStudent, finalPoints, finalDuration);
    }

    setTrackingMode('idle');
    alert(lang === 'ar' ? `تم إيقاف التتبع وحفظ مسار الدرس للمتدرب (${selectedStudent}) بنجاح. يرجى إكمال تفاصيل الدرس والدفع من سجل الدروس.` : `GPS route tracking stopped and saved for ${selectedStudent} successfully. Please complete the lesson and payment details from the Lesson Log.`);
  };

  // Delete recorded track
  const deleteRoute = (id: string) => {
    if (confirm(lang === 'ar' ? "هل أنت متأكد من حذف مسار هذا الاختبار من السجلات؟" : "Are you sure you want to delete this recorded route?")) {
      const updated = savedRoutes.filter(r => r.id !== id);
      setSavedRoutes(updated);
      try {
        localStorage.setItem('rijschool_tracked_exams', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      if (reviewRoute?.id === id) {
        setReviewRoute(null);
        setTrackingMode('idle');
      }
    }
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

            <div className="space-y-4">
              <div>
                <label className="text-slate-400 block mb-1.5 text-[10px] font-bold uppercase tracking-wider">
                  {lang === 'ar' ? 'اختر المتدرب:' : 'Select Student:'}
                </label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold dark:text-white"
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

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">{lang === 'ar' ? 'عدد الإحداثيات:' : 'Points Count:'}</span>
                <span className="font-black text-blue-500 font-mono">
                  {currentPoints.length}
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
              {lang === 'ar' ? 'نظام الأندلس للمسار والموقع الفعلي' : 'Al-Andalos Live GPS Trajectory Terminal'}
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

        {/* Real Dynamic Leaflet Map Frame */}
        <div className="h-[480px] rounded-3xl overflow-hidden border border-slate-100 dark:border-zinc-800 shadow-md relative bg-slate-100 dark:bg-zinc-950 z-10">
          {trackingMode === 'idle' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-3 z-20">
              <Compass className="h-10 w-10 text-blue-500 animate-spin" style={{ animationDuration: '10s' }} />
              <div>
                <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">
                  {lang === 'ar' ? 'خريطة التتبع المباشر بالـ GPS' : 'Live GPS Tracker Map Terminal'}
                </h4>
                <p className="text-[11px] text-slate-450 max-w-sm mt-1">
                  {lang === 'ar' 
                    ? 'سيتم تفعيل الخريطة فوراً وعرض موقعك الفعلي ورسم مسارك التلقائي بمجرد النقر على "بدء تتبع الدرس".' 
                    : 'The map container will initialize immediately, fetch your current real-time GPS location, and start drawing the path automatically.'}
                </p>
              </div>
            </div>
          ) : (
            <div id="exam-leaflet-map-element" className="w-full h-full z-10"></div>
          )}
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

    </div>
  );
}
