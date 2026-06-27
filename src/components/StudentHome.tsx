import { useState, useEffect, useRef } from 'react';
import { 
  Compass, Calendar, Wallet, CheckCircle, Flame, Trophy, Play, Pause, RotateCcw, 
  Map, Sparkles, Navigation, UserCheck, AlertTriangle, ChevronRight, MessageSquare 
} from 'lucide-react';
import { TRANSLATIONS, Language, Lesson, WalletTransaction } from '../types';

interface StudentHomeProps {
  lang: Language;
  t: typeof TRANSLATIONS['en'];
  lessons: Lesson[];
  transactions: WalletTransaction[];
  setActiveTab: (tab: string) => void;
  isOffline: boolean;
  selectedReplayLessonId?: string;
  setSelectedReplayLessonId?: (id: string) => void;
}

export default function StudentHome({ 
  lang, t, lessons, transactions, setActiveTab, isOffline,
  selectedReplayLessonId, setSelectedReplayLessonId 
}: StudentHomeProps) {
  // Find next upcoming lesson
  const upcomingLessonsList = lessons.filter(l => l.status === 'upcoming');
  const nextLesson = upcomingLessonsList.length > 0 ? upcomingLessonsList[0] : null;

  // Counts
  const completedCount = lessons.filter(l => l.status === 'completed').length;
  const upcomingCount = upcomingLessonsList.length;

  // Total completed hours (assuming 1H or 2H per lesson)
  const completedHours = lessons
    .filter(l => l.status === 'completed')
    .reduce((sum, current) => sum + current.duration, 0);

  // Calculate wallet balance
  const currentBalance = transactions.reduce((acc, curr) => {
    return curr.type === 'deposit' ? acc + curr.amount : acc - curr.amount;
  }, 0);

  // Stats
  const progressPercentage = Math.min(Math.round((completedHours / 40) * 100), 100); // 40 hours target
  const examReadinessScore = Math.min(30 + completedCount * 12 + (completedHours * 1.5), 98); // dynamic calculation

  // Driving Route Replay Simulation State
  const [isPlaying, setIsPlaying] = useState(false);
  const [replayProgress, setReplayProgress] = useState(0); // 0 to 100
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedLessonIdForMap, setSelectedLessonIdForMap] = useState<string>(
    selectedReplayLessonId || nextLesson?.id || lessons.filter(l => l.status === 'completed')[0]?.id || (lessons[0]?.id || '')
  );

  useEffect(() => {
    if (selectedReplayLessonId) {
      setSelectedLessonIdForMap(selectedReplayLessonId);
    }
  }, [selectedReplayLessonId]);

  const selectedLessonForMap = lessons.find(l => l.id === selectedLessonIdForMap) || nextLesson;

  // Define real driving route paths in Amsterdam / Sloterdijk area for beautiful live OSM rendering
  const defaultRoute: { lat: number; lng: number; timestamp?: number }[] = (selectedLessonForMap?.routePoints && selectedLessonForMap.routePoints.length > 0)
    ? selectedLessonForMap.routePoints
    : [
        { lat: 52.3892, lng: 4.8378 }, // Amsterdam Sloterdijk Station
        { lat: 52.3920, lng: 4.8450 },
        { lat: 52.3950, lng: 4.8500 },
        { lat: 52.3900, lng: 4.8600 },
        { lat: 52.3830, lng: 4.8520 },
        { lat: 52.3892, lng: 4.8378 }  // Return to Sloterdijk
      ];

  // Helper: Haversine formula to compute exact coordinate-to-coordinate distance
  const getHaversineDistance = (p1: {lat: number; lng: number}, p2: {lat: number; lng: number}) => {
    const R = 6371; // Earth's radius in km
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLng = (p2.lng - p1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // distance in km
  };

  // Calculate total route length
  const totalRouteDistance = selectedLessonForMap?.distanceKm !== undefined
    ? selectedLessonForMap.distanceKm
    : defaultRoute.reduce((sum, curr, idx) => {
        if (idx === 0) return 0;
        return sum + getHaversineDistance(defaultRoute[idx - 1], curr);
      }, 0);

  // Stats: distance covered, speed, and time
  const currentDistanceCovered = totalRouteDistance * (replayProgress / 100);
  const estimatedDurationMinutes = selectedLessonForMap?.elapsedTime
    ? selectedLessonForMap.elapsedTime
    : `${Math.round((totalRouteDistance / 45) * 60)} mins`;
  const averageDrivingSpeed = 45; // km/h

  // Load Leaflet assets dynamically to bypass React 19 / NPM dependency conflicts completely!
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

  const mapRef = useRef<any>(null);
  const carMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);

  // Initialize Map
  useEffect(() => {
    let active = true;
    loadLeaflet(() => {
      if (!active) return;
      const L = (window as any).L;
      if (!L) return;

      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          console.warn("Map removal error:", e);
        }
        mapRef.current = null;
      }

      // Check if element exists in DOM
      const mapContainer = document.getElementById('leaflet-map-element');
      if (!mapContainer) return;

      if ((mapContainer as any)._leaflet_id) {
        (mapContainer as any)._leaflet_id = null;
        mapContainer.innerHTML = '';
      }

      const map = L.map('leaflet-map-element', {
        zoomControl: false,
        attributionControl: false
      }).setView([defaultRoute[0].lat, defaultRoute[0].lng], 14);

      // Dark theme support matching Tesla/Uber aesthetic
      const isDark = document.documentElement.classList.contains('dark');
      const tileUrl = isDark 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' 
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      L.tileLayer(tileUrl, {
        maxZoom: 19
      }).addTo(map);

      mapRef.current = map;

      if (defaultRoute && defaultRoute.length > 0) {
        const latlngs = defaultRoute.map((p: any) => [p.lat, p.lng]);
        
        // Draw polyline
        const polyline = L.polyline(latlngs, {
          color: '#3b82f6', // brilliant driving blue
          weight: 4,
          opacity: 0.85,
          lineJoin: 'round'
        }).addTo(map);

        polylineRef.current = polyline;

        // Auto zoom-fit to the route polyline
        map.fitBounds(polyline.getBounds(), { padding: [25, 25] });

        // Standard dynamic styled green start node
        const startIcon = L.divIcon({
          className: 'custom-map-icon-start',
          html: `<div style="background-color: #10b981; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.4);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });
        L.marker(latlngs[0], { icon: startIcon }).addTo(map).bindPopup("<b>Start Location</b>");

        // Standard dynamic styled red end node
        const endIcon = L.divIcon({
          className: 'custom-map-icon-end',
          html: `<div style="background-color: #ef4444; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.4);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });
        L.marker(latlngs[latlngs.length - 1], { icon: endIcon }).addTo(map).bindPopup("<b>End Destination</b>");

        // Custom animated car node symbol
        const carIcon = L.divIcon({
          className: 'custom-map-icon-car',
          html: `<div style="background-color: #2563eb; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.5); font-size: 15px;">🚙</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const carMarker = L.marker(latlngs[0], { icon: carIcon }).addTo(map);
        carMarkerRef.current = carMarker;
      }
    });

    return () => {
      active = false;
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          console.warn("Map teardown error:", e);
        }
        mapRef.current = null;
      }
    };
  }, [selectedLessonIdForMap, lessons]);

  useEffect(() => {
    setIsPlaying(false);
    setReplayProgress(0);
  }, [selectedLessonIdForMap]);

  // Handle Car Position Updates
  useEffect(() => {
    if (!carMarkerRef.current || !defaultRoute || defaultRoute.length === 0) return;
    
    const pathLength = defaultRoute.length;
    const exactIndex = (replayProgress / 100) * (pathLength - 1);
    const startIndex = Math.floor(exactIndex);
    const endIndex = Math.min(startIndex + 1, pathLength - 1);
    const ratio = exactIndex - startIndex;

    const startPoint = defaultRoute[startIndex];
    const endPoint = defaultRoute[endIndex];

    const currentLat = startPoint.lat + (endPoint.lat - startPoint.lat) * ratio;
    const currentLng = startPoint.lng + (endPoint.lng - startPoint.lng) * ratio;

    carMarkerRef.current.setLatLng([currentLat, currentLng]);

    // Keep the camera tracking/panning on the moving car during active replay
    if (isPlaying && mapRef.current) {
      mapRef.current.panTo([currentLat, currentLng], { animate: true, duration: 0.1 });
    }
  }, [replayProgress, isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setReplayProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return prev + 1; // smoother incremental progression
        });
      }, 150);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const handleReset = () => {
    setIsPlaying(false);
    setReplayProgress(0);
    if (carMarkerRef.current && defaultRoute.length > 0) {
      carMarkerRef.current.setLatLng([defaultRoute[0].lat, defaultRoute[0].lng]);
      if (mapRef.current) {
        mapRef.current.setView([defaultRoute[0].lat, defaultRoute[0].lng], 14);
      }
    }
  };

  // Build authentic Google Maps routing link for the student
  const originLat = defaultRoute[0].lat;
  const originLng = defaultRoute[0].lng;
  const destLat = defaultRoute[defaultRoute.length - 1].lat;
  const destLng = defaultRoute[defaultRoute.length - 1].lng;
  const waypointsStr = defaultRoute.slice(1, -1).map(p => `${p.lat},${p.lng}`).join('%7C');
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&waypoints=${waypointsStr}&travelmode=driving`;

  // Badges count
  const earnedBadges = 2; // Hardcoded initial unlocked badge value

  return (
    <div className="space-y-6 pb-20">
      
      {/* Offline sync banner if offline */}
      {isOffline && (
        <div id="offline-banner" className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30 text-xs shadow-lg animate-pulse" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <span>{t.offlineMsg}</span>
        </div>
      )}

      {/* Top Greeting Card */}
      <div 
        id="dashboard-header"
        className="relative overflow-hidden p-6 rounded-3xl bg-linear-to-r from-blue-700 via-indigo-800 to-blue-950 text-white shadow-2xl border border-indigo-500/30"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md text-blue-200 border border-white/10 mb-3">
              <Sparkles className="h-3 ml-1" />
              Al-Andalos Elite Rijschool
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {t.welcomeBack} <span className="bg-linear-to-r from-blue-200 to-white bg-clip-text text-transparent">Amir Al-Hassan</span>
            </h1>
            <p className="text-sm font-medium text-blue-100/85 mt-1.5">{t.readyToDrive}</p>
          </div>
          
          <div className="flex bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl p-3 items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/30 text-blue-300">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-blue-200 uppercase tracking-widest leading-none">Instructeur</p>
              <h3 className="text-sm font-bold mt-0.5">Samir El-Filali</h3>
              <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                {t.online}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Highlights Metrics Cards Grid */}
      <div 
        id="quick-stats-grid"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Metric 1 */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm hover:translate-y-[-2px] transition duration-300">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-semibold">{t.upcomingLessons}</span>
            <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2 dark:text-white">{upcomingCount} <span className="text-xs font-normal text-slate-400">{t.lessons.toLowerCase()}</span></p>
        </div>

        {/* Metric 2 */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm hover:translate-y-[-2px] transition duration-300">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-semibold">{t.completedLessons}</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2 dark:text-white">{completedCount} <span className="text-xs font-normal text-slate-400">{t.lessons.toLowerCase()}</span></p>
        </div>

        {/* Metric 3 */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm hover:translate-y-[-2px] transition duration-300">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-semibold">{t.balance}</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2 text-indigo-600 dark:text-indigo-400 font-mono">€{currentBalance}</p>
        </div>

        {/* Metric 4 */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm hover:translate-y-[-2px] transition duration-300">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-semibold">{t.achievements.split('&')[0]}</span>
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <Trophy className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2 dark:text-white">{earnedBadges} <span className="text-xs font-normal text-slate-400">/ 4</span></p>
        </div>
      </div>

      {/* Primary Section: Active Route & Next Lesson Split */}
      <div 
        id="dashboard-analytics-split"
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Next Lesson Details */}
        <div className="lg:col-span-4 p-5 bg-linear-to-b from-slate-50 to-white dark:from-zinc-900 dark:to-zinc-950 border border-slate-100 dark:border-zinc-800/85 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600"></span>
              {t.nextLesson}
            </h2>

            {nextLesson ? (
              <div className="space-y-4">
                <div className="p-3 bg-white dark:bg-zinc-900/40 rounded-2xl border border-slate-100 dark:border-zinc-800/40">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">{t.date}</p>
                  <p className="font-bold text-slate-800 dark:text-zinc-200 text-sm mt-0.5">
                    {new Date(nextLesson.date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : lang === 'nl' ? 'nl-NL' : 'en-US', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white dark:bg-zinc-900/40 rounded-2xl border border-slate-100 dark:border-zinc-800/40">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">{t.selectTime}</p>
                    <p className="font-bold text-slate-800 dark:text-zinc-200 sm:text-base text-sm mt-0.5">{nextLesson.time}</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-zinc-900/40 rounded-2xl border border-slate-100 dark:border-zinc-800/40">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">{t.duration}</p>
                    <p className="font-bold text-slate-800 dark:text-zinc-200 sm:text-base text-sm mt-0.5">
                      {nextLesson.duration} {nextLesson.duration === 1 ? t.oneHour : t.twoHours}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-zinc-900/40 rounded-2xl border border-slate-100 dark:border-zinc-800/40">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">{t.pickupLocation}</p>
                  <p className="font-bold text-slate-800 dark:text-zinc-200 text-xs mt-0.5 break-all">{nextLesson.pickupLocation}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400 dark:text-zinc-500">{t.noLessonsBooked}</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800">
            <button 
              id="goto-lessons-tab-btn"
              onClick={() => setActiveTab('lessons')}
              className="w-full flex justify-between items-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <span>{t.bookLesson}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Live Driving Route Map Replay */}
        <div id="route-replay-container" className="lg:col-span-8 p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/85 rounded-3xl shadow-sm flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Map className="h-4 w-4 text-blue-500" />
                {t.drivingRoutePreview}
              </h2>
              <p className="text-xs text-slate-400">{t.interactiveLiveReplay}</p>
            </div>

            {/* Lesson select dropdown */}
            <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 dark:bg-zinc-950 p-1.5 px-2.5 rounded-xl border border-slate-100 dark:border-zinc-900/60 shadow-xs">
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider">
                {lang === 'ar' ? 'مسار الدرس:' : lang === 'nl' ? 'Rijles Route:' : 'Lesson Route:'}
              </span>
              <select
                value={selectedLessonIdForMap}
                onChange={(e) => setSelectedLessonIdForMap(e.target.value)}
                className="text-xs font-bold text-slate-700 dark:text-zinc-300 bg-transparent border-none focus:outline-hidden cursor-pointer"
              >
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id} className="bg-white dark:bg-zinc-900 text-xs text-slate-800 dark:text-zinc-200">
                    {lesson.date} ({lesson.time}) - {lesson.pickupLocation.substring(0, 18)}... [{lesson.status === 'completed' ? (lang === 'ar' ? 'مكتملة' : 'Completed') : (lang === 'ar' ? 'قادمة' : 'Upcoming')}]
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="play-replay-btn"
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-xs font-semibold cursor-pointer transition-colors duration-200"
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {isPlaying ? t.pauseReplay : t.startReplay}
              </button>
              <button
                id="reset-replay-btn"
                onClick={handleReset}
                className="p-1.5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg cursor-pointer transition-colors duration-200"
                title={t.resetReplay}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Leaflet Dynamic OpenStreetMap Container */}
          <div className="relative h-64 w-full rounded-2xl overflow-hidden border border-slate-100 dark:border-zinc-800/80 bg-slate-100 dark:bg-black z-10">
            <div id="leaflet-map-element" className="h-full w-full z-10"></div>
            
            {/* Live Replay Progress bar overlayed at bottom */}
            <div className="absolute bottom-3 left-3 right-3 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-200/50 dark:border-zinc-800/80 flex items-center gap-3 z-30 shadow-md">
              <Navigation className="h-4 w-4 text-blue-500 animate-pulse shrink-0" />
              <div className="flex-1">
                <div className="h-1.5 w-full bg-slate-200 dark:bg-zinc-800 rounded-full">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-150" style={{ width: `${replayProgress}%` }}></div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-zinc-400 shrink-0">{replayProgress}%</span>
            </div>
          </div>

          {/* Map Telemetry Details panel */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800/40 text-center">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{lang === 'ar' ? 'المسافة المغطاة' : lang === 'nl' ? 'Gereden Afstand' : 'Distance'}</p>
              <p className="text-sm font-extrabold text-slate-800 dark:text-white mt-1">
                {currentDistanceCovered.toFixed(2)} / {totalRouteDistance.toFixed(2)} km
              </p>
            </div>
            
            <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800/40 text-center">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{lang === 'ar' ? 'مدة الدرس' : lang === 'nl' ? 'Lesduur' : 'Duration'}</p>
              <p className="text-sm font-extrabold text-slate-800 dark:text-white mt-1">
                {selectedLessonForMap?.elapsedTime ? selectedLessonForMap.elapsedTime : `~ ${estimatedDurationMinutes}`}
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800/40 text-center">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{lang === 'ar' ? 'متوسط السرعة' : lang === 'nl' ? 'Gem. Snelheid' : 'Avg Speed'}</p>
              <p className="text-sm font-extrabold text-slate-800 dark:text-white mt-1">
                {averageDrivingSpeed} km/h
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800/40 text-center">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{lang === 'ar' ? 'نقاط المسار' : lang === 'nl' ? 'Routepunten' : 'Recorded Points'}</p>
              <p className="text-sm font-extrabold text-slate-800 dark:text-white mt-1">
                {defaultRoute.length} GPS pts
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sleek Progress Gauges Grid */}
      <div 
        id="dashboard-progress-meters"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Driving Goals meter */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/85 rounded-3xl shadow-sm flex flex-col md:flex-row items-center gap-6">
          <div className="relative shrink-0 flex items-center justify-center">
            {/* Circle SVG Progress */}
            <svg className="w-28 h-28 transform -rotate-90">
              <circle cx="56" cy="56" r="48" stroke="#f1f5f9" strokeWidth="8" fill="transparent" className="dark:stroke-zinc-800" />
              <circle 
                cx="56" cy="56" r="48" 
                stroke="#3b82f6" strokeWidth="8" fill="transparent" 
                strokeDasharray={2 * Math.PI * 48}
                strokeDashoffset={2 * Math.PI * 48 * (1 - progressPercentage / 100)}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-xl font-extrabold text-slate-800 dark:text-white">{progressPercentage}%</span>
              <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">Target Pass</span>
            </div>
          </div>

          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">{t.progress}</h3>
            <p className="text-xs text-slate-400 max-w-xs">
              Dutch core driver licenses require 40 verified hours training. You successfully accomplished <span className="font-bold text-blue-500">{completedHours} hours</span> log!
            </p>
            <div className="flex gap-4 mt-2 justify-center md:justify-start">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{t.completedHrs}</p>
                <p className="text-base font-extrabold text-slate-700 dark:text-zinc-200">{completedHours}h</p>
              </div>
              <div className="w-px bg-slate-100 dark:bg-zinc-800"></div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Remaining</p>
                <p className="text-base font-extrabold text-slate-700 dark:text-zinc-200">{Math.max(0, 40 - completedHours)}h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Readiness Exam Meter */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/85 rounded-3xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              {t.examReadiness}
            </h3>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-500/10">
              High Probability Pass
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-end">
              <span className="text-2xl font-black text-slate-800 dark:text-white">{examReadinessScore}%</span>
              <span className="text-xs text-slate-400 font-semibold">Exam Benchmark: 80%</span>
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-linear-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-1000" style={{ width: `${examReadinessScore}%` }}></div>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Al-Andalos exams incorporate theory verification + practical observation. You performed stellar maneuvers on your last lesson (Sloterdijk Roundabout)!
          </p>
        </div>
      </div>

      {/* Floating Interactive Shortcuts */}
      <div 
        id="dashboard-shortcuts"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <button 
          id="shortcut-ai-coach" 
          onClick={() => setActiveTab('learning')}
          className="p-4 bg-linear-to-r from-indigo-950/80 to-blue-900/80 border border-indigo-500/30 rounded-2xl flex items-center justify-between text-left cursor-pointer group hover:border-indigo-500/60 transition"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t.aiCoachShortcut}</h4>
              <p className="text-xs text-indigo-200">{t.aiTrainerChatDesc.substring(0, 48)}...</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-indigo-400 group-hover:translate-x-1 transition" />
        </button>

        <button 
          id="shortcut-wallet" 
          onClick={() => setActiveTab('wallet')}
          className="p-4 bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80 rounded-2xl flex items-center justify-between text-left cursor-pointer group hover:border-slate-300 dark:hover:border-zinc-700 transition"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">{t.wallet}</h4>
              <p className="text-xs text-slate-400">Check balance and download invoices</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition" />
        </button>
      </div>

    </div>
  );
}
