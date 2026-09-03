import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Zap, Clock, Activity, SignalHigh, Car, Navigation, AlertTriangle, Crosshair, CheckCircle2 } from 'lucide-react';

export interface GPSPoint {
  lat: number;
  lng: number;
  timestamp?: number;
  speed?: number; // km/h
  heading?: number; // degrees 0-360
  accuracy?: number;
}

interface LiveNavigationMapProps {
  points?: GPSPoint[];
  isTracking: boolean;
  lang?: 'en' | 'ar' | 'nl';
  height?: string;
  className?: string;
  activeLessonTitle?: string;
  studentName?: string;
  elapsedSeconds?: number;
  distanceKm?: number;
  showTelemetry?: boolean;
  onRecenter?: () => void;
  isDemoMode?: boolean;
  onLocationUpdate?: (point: GPSPoint) => void;
}

const T_MAP = {
  en: {
    waitingForLesson: "Waiting for driving lesson to begin",
    waitingForGPS: "Searching for high-accuracy GPS signal...",
    trackingActive: "Live location tracking active",
    startPoint: "Start",
    currentLocation: "Current Position",
    gpsUnavailable: "Unable to get your location",
    permissionDenied: "Please allow location access to enable lesson tracking",
    recenter: "Recenter on Location",
    speed: "SPEED",
    distance: "DISTANCE",
    duration: "DURATION",
    accuracy: "Accuracy",
    meters: "m"
  },
  ar: {
    waitingForLesson: "بانتظار بدء درس القيادة",
    waitingForGPS: "جاري البحث عن إشارة GPS عالية الدقة...",
    trackingActive: "جارٍ تتبع موقعك",
    startPoint: "نقطة الانطلاق",
    currentLocation: "موقعك الحالي",
    gpsUnavailable: "تعذر الحصول على موقعك",
    permissionDenied: "يرجى السماح بالوصول إلى الموقع لتفعيل تتبع الدرس",
    recenter: "إعادة التوسيط على موقعك",
    speed: "السرعة",
    distance: "المسافة",
    duration: "المدة",
    accuracy: "الدقة",
    meters: "متر"
  },
  nl: {
    waitingForLesson: "Wachten tot de rijles begint",
    waitingForGPS: "Zoeken naar nauwkeurig GPS-signaal...",
    trackingActive: "Je locatie wordt live gevolgd",
    startPoint: "Startpunt",
    currentLocation: "Huidige Positie",
    gpsUnavailable: "Kan je locatie niet ophalen",
    permissionDenied: "Geef locatietoegang om de les te volgen",
    recenter: "Centreren op locatie",
    speed: "SNELHEID",
    distance: "AFSTAND",
    duration: "DUUR",
    accuracy: "Nauwkeurigheid",
    meters: "m"
  }
};

// Math Helper Functions
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

// Calculate Bearing between two GPS points
export function calculateBearing(startLat: number, startLng: number, endLat: number, endLng: number): number {
  const dLng = toRad(endLng - startLng);
  const lat1 = toRad(startLat);
  const lat2 = toRad(endLat);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(dLng);
  let brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

// Calculate Haversine distance in KM
export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of earth in KM
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Coordinate validator
function isValidCoords(lat?: number, lng?: number): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  if (lat === 0 && lng === 0) return false;
  return true;
}

// Format seconds into HH:MM:SS or MM:SS
function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Clean Voyager map style for stable legibility
function getCleanUberMapStyle() {
  return {
    version: 8 as const,
    sources: {
      'clean-navigation-tiles': {
        type: 'raster' as const,
        tiles: [
          'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
          'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
          'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        ],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap'
      }
    },
    layers: [
      {
        id: 'clean-navigation-layer',
        type: 'raster' as const,
        source: 'clean-navigation-tiles',
        minzoom: 0,
        maxzoom: 20
      }
    ]
  };
}

export const LiveNavigationMap: React.FC<LiveNavigationMapProps> = ({
  points = [],
  isTracking,
  lang = 'en',
  height = '100%',
  className = '',
  elapsedSeconds = 0,
  distanceKm = 0,
  showTelemetry = false,
  onLocationUpdate,
}) => {
  const t = T_MAP[lang] || T_MAP.en;
  const isRtl = lang === 'ar';
  const containerRef = useRef<HTMLDivElement>(null);

  // Map Instance & Persistent Marker Refs
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const vehicleMarkerRef = useRef<maplibregl.Marker | null>(null);
  const startMarkerRef = useRef<maplibregl.Marker | null>(null);
  const vehicleRotateElementRef = useRef<HTMLDivElement | null>(null);
  const headingArrowElementRef = useRef<SVGPathElement | null>(null);

  // Device GPS State Refs
  const watchIdRef = useRef<number | null>(null);
  const startPointRef = useRef<GPSPoint | null>(null);
  const lastLoggedPointRef = useRef<GPSPoint | null>(null);
  const hasFirstFixRef = useRef<boolean>(false);
  const currentHeadingRotationRef = useRef<number>(0);

  // State
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'searching' | 'active' | 'error'>('idle');
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [isAutoFollow, setIsAutoFollow] = useState<boolean>(true);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [hasStartPoint, setHasStartPoint] = useState<boolean>(false);

  // Reference for stable callback
  const onLocationUpdateRef = useRef(onLocationUpdate);
  useEffect(() => {
    onLocationUpdateRef.current = onLocationUpdate;
  }, [onLocationUpdate]);

  // Create or retrieve persistent GREEN START POINT MARKER (Fixed at original GPS position)
  const ensureStartMarker = useCallback((map: maplibregl.Map, lng: number, lat: number) => {
    if (startMarkerRef.current) {
      try {
        startMarkerRef.current.addTo(map);
        startMarkerRef.current.setLngLat([lng, lat]);
      } catch (e) {
        console.warn("Start marker re-attach warning:", e);
      }
      return startMarkerRef.current;
    }

    const startDiv = document.createElement('div');
    startDiv.className = 'live-start-point-marker';
    startDiv.style.cssText = `
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 50;
      filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.35));
    `;

    // Localized Start badge pill
    const startPill = document.createElement('div');
    startPill.style.cssText = `
      padding: 2px 7px;
      background: #16a34a;
      color: #ffffff;
      font-size: 10px;
      font-weight: 800;
      border-radius: 9999px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
      border: 1.5px solid #ffffff;
      margin-bottom: 2px;
      white-space: nowrap;
      letter-spacing: 0.02em;
    `;
    startPill.textContent = t.startPoint;
    startDiv.appendChild(startPill);

    // Green circular marker dot with white border & outer ring
    const dotContainer = document.createElement('div');
    dotContainer.style.cssText = `
      position: relative;
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const haloRing = document.createElement('div');
    haloRing.style.cssText = `
      position: absolute;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: rgba(22, 163, 74, 0.25);
      border: 1px solid rgba(22, 163, 74, 0.5);
    `;
    dotContainer.appendChild(haloRing);

    const solidDot = document.createElement('div');
    solidDot.style.cssText = `
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #16a34a;
      border: 2.5px solid #ffffff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      z-index: 2;
    `;
    dotContainer.appendChild(solidDot);

    startDiv.appendChild(dotContainer);

    const marker = new maplibregl.Marker({
      element: startDiv,
      anchor: 'bottom',
      rotationAlignment: 'viewport'
    })
      .setLngLat([lng, lat])
      .addTo(map);

    startMarkerRef.current = marker;
    return marker;
  }, [t.startPoint]);

  // Create or retrieve persistent high-contrast BLUE LIVE LOCATION MARKER
  const ensureVehicleMarker = useCallback((map: maplibregl.Map, initLng: number, initLat: number) => {
    if (vehicleMarkerRef.current) {
      try {
        vehicleMarkerRef.current.addTo(map);
        vehicleMarkerRef.current.setLngLat([initLng, initLat]);
      } catch (e) {
        console.warn("Marker re-attach warning:", e);
      }
      return vehicleMarkerRef.current;
    }

    // Outer container for MapLibre positioning
    const markerOuterDiv = document.createElement('div');
    markerOuterDiv.className = 'live-blue-location-marker-outer';
    markerOuterDiv.style.cssText = `
      position: relative;
      width: 52px;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 60;
    `;

    // Radar pulse ring
    const pulseRing = document.createElement('div');
    pulseRing.className = 'live-marker-pulse-ring';
    pulseRing.style.cssText = `
      position: absolute;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: rgba(37, 99, 235, 0.22);
      border: 1.5px solid rgba(59, 130, 246, 0.4);
      pointer-events: none;
    `;
    markerOuterDiv.appendChild(pulseRing);

    // Inner rotation container for heading orientation
    const rotatorDiv = document.createElement('div');
    rotatorDiv.className = 'live-marker-inner-rotator';
    rotatorDiv.style.cssText = `
      position: relative;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      transform-origin: center center;
      filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.4));
      will-change: transform;
    `;

    rotatorDiv.innerHTML = `
      <svg width="38" height="38" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Directional Pointer Arrow (Heading Cone) -->
        <path id="live-marker-heading-cone" d="M20 2 L27 16 L20 12.5 L13 16 Z" fill="#2563eb" stroke="#ffffff" stroke-width="1.5" opacity="0.95" />
        <!-- High-Contrast Outer White Ring -->
        <circle cx="20" cy="20" r="12" fill="#2563eb" stroke="#ffffff" stroke-width="3" />
        <!-- Pure White Center Core -->
        <circle cx="20" cy="20" r="4.5" fill="#ffffff" />
      </svg>
    `;

    markerOuterDiv.appendChild(rotatorDiv);
    vehicleRotateElementRef.current = rotatorDiv;
    headingArrowElementRef.current = rotatorDiv.querySelector('#live-marker-heading-cone');

    const marker = new maplibregl.Marker({
      element: markerOuterDiv,
      rotationAlignment: 'viewport',
      anchor: 'center'
    })
      .setLngLat([initLng, initLat])
      .addTo(map);

    vehicleMarkerRef.current = marker;
    return marker;
  }, []);

  // Update Route Polyline LineString on Map
  const updateRouteLine = useCallback((map: maplibregl.Map, routeCoords: [number, number][]) => {
    const source = map.getSource('active-route-source') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routeCoords
        }
      });
    }
  }, []);

  // Center or follow map smoothly
  const centerMapOnLocation = useCallback((lng: number, lat: number, instant = false) => {
    if (!mapInstanceRef.current || !isValidCoords(lat, lng)) return;
    const map = mapInstanceRef.current;
    if (instant) {
      map.jumpTo({ center: [lng, lat], zoom: 17 });
    } else {
      map.easeTo({
        center: [lng, lat],
        zoom: Math.max(map.getZoom(), 16.5),
        duration: 500,
        animate: true
      });
    }
  }, []);

  // Manual recenter button handler
  const handleRecenterClick = () => {
    setIsAutoFollow(true);
    if (liveCoords && isValidCoords(liveCoords.lat, liveCoords.lng)) {
      centerMapOnLocation(liveCoords.lng, liveCoords.lat, false);
    } else if (points.length > 0) {
      const last = points[points.length - 1];
      if (isValidCoords(last.lat, last.lng)) {
        centerMapOnLocation(last.lng, last.lat, false);
      }
    }
  };

  // 1. Initialize MapLibre Map
  useEffect(() => {
    if (!containerRef.current) return;

    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (e) {
        console.warn("Map cleanup warning:", e);
      }
      mapInstanceRef.current = null;
    }

    // Determine initial center
    const validPassedPoints = points.filter(p => isValidCoords(p.lat, p.lng));
    const initLat = validPassedPoints.length > 0 ? validPassedPoints[validPassedPoints.length - 1].lat : 50.8514; // Default Maastricht/NL
    const initLng = validPassedPoints.length > 0 ? validPassedPoints[validPassedPoints.length - 1].lng : 5.6910;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: getCleanUberMapStyle() as any,
      center: [initLng, initLat],
      zoom: validPassedPoints.length > 0 ? 16.5 : 15,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    map.on('load', () => {
      setIsMapReady(true);

      // Route Polyline Source & Layer
      const coordinates = validPassedPoints.map(p => [p.lng, p.lat] as [number, number]);
      if (!map.getSource('active-route-source')) {
        map.addSource('active-route-source', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coordinates
            }
          }
        });

        // Route casing (dark blue outline for contrast)
        map.addLayer({
          id: 'active-route-casing',
          type: 'line',
          source: 'active-route-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#1d4ed8',
            'line-width': 8,
            'line-opacity': 0.7
          }
        });

        // Main high-visibility route line
        map.addLayer({
          id: 'active-route-layer',
          type: 'line',
          source: 'active-route-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 5,
            'line-opacity': 0.95
          }
        });
      }

      // If initial points exist, place start marker at the first point
      if (validPassedPoints.length > 0) {
        ensureStartMarker(map, validPassedPoints[0].lng, validPassedPoints[0].lat);
        startPointRef.current = validPassedPoints[0];
        setHasStartPoint(true);
      }

      // Initialize live location marker
      ensureVehicleMarker(map, initLng, initLat);
    });

    // Detach auto-follow if user manually moves, drags, or zooms map
    map.on('movestart', (e) => {
      if (e.originalEvent) {
        setIsAutoFollow(false);
      }
    });

    return () => {
      if (startMarkerRef.current) {
        try {
          startMarkerRef.current.remove();
        } catch (e) {
          // ignore
        }
        startMarkerRef.current = null;
      }
      if (vehicleMarkerRef.current) {
        try {
          vehicleMarkerRef.current.remove();
        } catch (e) {
          // ignore
        }
        vehicleMarkerRef.current = null;
        vehicleRotateElementRef.current = null;
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // ignore
        }
        mapInstanceRef.current = null;
      }
    };
  }, [ensureVehicleMarker, ensureStartMarker]);

  // 2. Real Live GPS Location Watcher (navigator.geolocation.watchPosition)
  useEffect(() => {
    if (!isTracking) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setGpsStatus('idle');
      return;
    }

    // Reset session tracking flags on start
    hasFirstFixRef.current = false;
    startPointRef.current = null;
    lastLoggedPointRef.current = null;
    setHasStartPoint(false);

    if (startMarkerRef.current) {
      try {
        startMarkerRef.current.remove();
      } catch (e) {
        // ignore
      }
      startMarkerRef.current = null;
    }

    if (!('geolocation' in navigator)) {
      setGpsStatus('error');
      setGpsErrorMsg(t.gpsUnavailable);
      return;
    }

    setGpsStatus('searching');
    setGpsErrorMsg(null);

    const geoOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 1000
    };

    const handleSuccess = (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy, speed, heading } = pos.coords;

      // Validate coordinates
      if (!isValidCoords(latitude, longitude)) {
        return;
      }

      // Filter out extreme inaccurate anomalies (> 150 meters)
      if (typeof accuracy === 'number' && accuracy > 150) {
        setGpsAccuracy(accuracy);
        return;
      }

      setGpsAccuracy(accuracy ?? null);
      setGpsStatus('active');
      setGpsErrorMsg(null);
      setLiveCoords({ lat: latitude, lng: longitude });

      const prev = lastLoggedPointRef.current;
      let calculatedHeading = typeof heading === 'number' && !isNaN(heading) && heading >= 0 ? heading : 0;
      let calculatedSpeed = typeof speed === 'number' && !isNaN(speed) && speed > 0 ? Math.round(speed * 3.6) : 0;

      // Distance calculation from previous point
      let distMeters = 0;
      if (prev && isValidCoords(prev.lat, prev.lng)) {
        distMeters = calculateHaversineDistance(prev.lat, prev.lng, latitude, longitude) * 1000;

        // Discard physically impossible GPS jumps (> 300 meters in a single watch update)
        if (distMeters > 300 && (accuracy || 0) > 30) {
          return;
        }

        // Derive heading if not reported by hardware and moved >= 2 meters
        if (distMeters >= 2) {
          if (!heading || heading < 0) {
            calculatedHeading = calculateBearing(prev.lat, prev.lng, latitude, longitude);
          }
        } else {
          // If stopped, keep previous heading
          calculatedHeading = prev.heading ?? 0;
        }

        // Derive speed if not provided
        if (!calculatedSpeed && prev.timestamp) {
          const timeSec = (pos.timestamp - prev.timestamp) / 1000;
          if (timeSec > 0 && distMeters > 0) {
            calculatedSpeed = Math.min(Math.round((distMeters / timeSec) * 3.6), 140);
          }
        }
      }

      setCurrentSpeed(calculatedSpeed);

      const newPoint: GPSPoint = {
        lat: Number(latitude.toFixed(6)),
        lng: Number(longitude.toFixed(6)),
        timestamp: pos.timestamp || Date.now(),
        speed: calculatedSpeed,
        heading: Math.round(calculatedHeading),
        accuracy: Math.round(accuracy || 0)
      };

      // Set and permanently retain START_POINT on FIRST valid GPS fix
      if (!startPointRef.current) {
        startPointRef.current = newPoint;
        setHasStartPoint(true);
        if (mapInstanceRef.current) {
          ensureStartMarker(mapInstanceRef.current, longitude, latitude);
        }
      }

      // Only add to route trail if moved at least 2 meters or if it's the very first point
      if (!prev || distMeters >= 2) {
        lastLoggedPointRef.current = newPoint;
        if (onLocationUpdateRef.current) {
          onLocationUpdateRef.current(newPoint);
        }
      }

      // Update Map Marker Directly (High Performance 60fps)
      if (mapInstanceRef.current) {
        const map = mapInstanceRef.current;

        // Ensure START marker is visible at starting location
        if (startPointRef.current) {
          ensureStartMarker(map, startPointRef.current.lng, startPointRef.current.lat);
        }

        // Update LIVE BLUE LOCATION marker
        const marker = ensureVehicleMarker(map, longitude, latitude);
        marker.setLngLat([longitude, latitude]);

        // Rotate inner heading element with shortest angular path
        if (vehicleRotateElementRef.current) {
          const targetHeading = Math.round(calculatedHeading);
          const currentDeg = currentHeadingRotationRef.current;
          let diff = (targetHeading - (currentDeg % 360) + 540) % 360 - 180;
          currentHeadingRotationRef.current = currentDeg + diff;
          vehicleRotateElementRef.current.style.transform = `rotate(${currentHeadingRotationRef.current}deg)`;
        }

        // Camera follow (Google Maps navigation style)
        if (!hasFirstFixRef.current) {
          hasFirstFixRef.current = true;
          map.jumpTo({ center: [longitude, latitude], zoom: 17 });
        } else if (isAutoFollow) {
          map.easeTo({
            center: [longitude, latitude],
            zoom: Math.max(map.getZoom(), 16.5),
            duration: 450,
            animate: true
          });
        }
      }
    };

    const handleError = (err: GeolocationPositionError) => {
      console.warn("Live Geolocation Watcher Notice:", err.message);
      if (err.code === err.PERMISSION_DENIED) {
        setGpsStatus('error');
        setGpsErrorMsg(t.permissionDenied);
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        setGpsStatus('error');
        setGpsErrorMsg(t.gpsUnavailable);
      } else if (err.code === err.TIMEOUT) {
        // Keep searching silently
        setGpsStatus('searching');
      }
    };

    // Start watchPosition
    try {
      watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, geoOptions);
    } catch (e) {
      console.warn("Geolocation watchPosition threw:", e);
      setGpsStatus('error');
      setGpsErrorMsg(t.gpsUnavailable);
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isTracking, ensureVehicleMarker, ensureStartMarker, isAutoFollow, t.gpsUnavailable, t.permissionDenied]);

  // 3. Update Map Route Polyline when `points` prop changes (from history or live feed)
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const validPts = points.filter(p => isValidCoords(p.lat, p.lng));
    if (validPts.length === 0) return;

    const coords = validPts.map(p => [p.lng, p.lat] as [number, number]);
    updateRouteLine(map, coords);

    // Keep start marker at first point
    if (validPts.length > 0 && !startPointRef.current) {
      startPointRef.current = validPts[0];
      ensureStartMarker(map, validPts[0].lng, validPts[0].lat);
      setHasStartPoint(true);
    }

    // If not tracking (e.g. reviewing historical route), position marker at latest point
    if (!isTracking) {
      const latest = validPts[validPts.length - 1];
      const marker = ensureVehicleMarker(map, latest.lng, latest.lat);
      marker.setLngLat([latest.lng, latest.lat]);

      if (typeof latest.heading === 'number' && vehicleRotateElementRef.current) {
        vehicleRotateElementRef.current.style.transform = `rotate(${latest.heading}deg)`;
      }

      if (validPts.length > 1) {
        const bounds = coords.reduce(
          (b, coord) => b.extend(coord as [number, number]),
          new maplibregl.LngLatBounds(coords[0], coords[0])
        );
        map.fitBounds(bounds, { padding: 40, maxZoom: 16 });
      } else {
        map.setCenter([latest.lng, latest.lat]);
      }
    }
  }, [points, isMapReady, isTracking, ensureVehicleMarker, ensureStartMarker, updateRouteLine]);

  // Status computation
  const isGpsWeak = gpsAccuracy !== null && gpsAccuracy > 45;
  const isPreLessonStandby = !isTracking && points.length === 0;

  return (
    <div 
      className={`relative w-full rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 font-sans text-slate-900 dark:text-white select-none ${className}`}
      style={{ height }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Map Canvas Container */}
      <div ref={containerRef} className="w-full h-full z-0 bg-slate-200 dark:bg-slate-900" />

      {/* 1. TOP STATUS BADGE & MARKER LEGEND */}
      <div className="absolute top-4 inset-x-4 z-20 flex flex-col items-center gap-2 pointer-events-none">
        {isPreLessonStandby && (
          <div className="pointer-events-auto flex items-center gap-2.5 px-4 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
            <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Car className="h-3 w-3" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-wide">
              {t.waitingForLesson}
            </span>
          </div>
        )}

        {isTracking && gpsStatus === 'active' && !gpsErrorMsg && (
          <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600/95 text-white backdrop-blur-md rounded-full shadow-lg text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-300">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              <span>{t.trackingActive}</span>
              {gpsAccuracy !== null && (
                <span className="text-[10px] bg-emerald-700/80 px-2 py-0.5 rounded-full font-mono font-medium">
                  ±{Math.round(gpsAccuracy)}{t.meters}
                </span>
              )}
            </div>

            {/* Marker Legend Pill: Start Point vs Current Position */}
            {hasStartPoint && (
              <div className="flex items-center gap-3 px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full border border-slate-200/80 dark:border-slate-800/80 shadow-xs text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 border border-white shadow-xs"></span>
                  <span>{t.startPoint}</span>
                </div>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600 border border-white shadow-xs"></span>
                  <span>{t.currentLocation}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {isTracking && gpsStatus === 'searching' && (
          <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 bg-blue-600/95 text-white backdrop-blur-md rounded-full shadow-md text-xs font-medium animate-pulse">
            <SignalHigh className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '3s' }} />
            <span>{t.waitingForGPS}</span>
          </div>
        )}
      </div>

      {/* 2. ERROR / PERMISSION BANNER */}
      {gpsErrorMsg && (
        <div className="absolute top-16 inset-x-4 z-20 flex justify-center pointer-events-none">
          <div className="pointer-events-auto max-w-md w-full p-3 bg-rose-950/90 border border-rose-800 text-rose-200 backdrop-blur-xl rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in zoom-in-95 duration-200">
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
            <span className="leading-snug flex-1">{gpsErrorMsg}</span>
          </div>
        </div>
      )}

      {/* 3. FLOATING RECENTER BUTTON */}
      {isTracking && !isAutoFollow && (
        <div className={`absolute bottom-5 ${isRtl ? 'left-5' : 'right-5'} z-20`}>
          <button
            type="button"
            onClick={handleRecenterClick}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl text-xs font-bold cursor-pointer transition-all hover:scale-105 active:scale-95 border border-blue-400/40 backdrop-blur-md"
            title={t.recenter}
          >
            <Crosshair className="h-4 w-4" />
            <span>{t.recenter}</span>
          </button>
        </div>
      )}

      {/* 4. OPTIONAL TELEMETRY OVERLAY */}
      {showTelemetry && isTracking && (
        <div className={`absolute top-4 ${isRtl ? 'right-4' : 'left-4'} z-10 flex items-center gap-2 pointer-events-none`}>
          <div className="pointer-events-auto flex items-center gap-3 px-3.5 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-semibold">
            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <Zap className="h-3.5 w-3.5" />
              <span>{currentSpeed} km/h</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Activity className="h-3.5 w-3.5" />
              <span>{distanceKm.toFixed(1)} km</span>
            </div>
            <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatDuration(elapsedSeconds)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveNavigationMap;
