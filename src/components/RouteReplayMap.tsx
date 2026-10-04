import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import '../utils/maplibreSetup';
import 'maplibre-gl/dist/maplibre-gl.css';
import { distanceMeters, matchRoadRoute, nearestForwardSegment, remainingMeters, type RoutePoint } from '../utils/routeGeometry';

type Lang = 'ar' | 'nl' | 'en';
const copy = {
  ar: { title: 'قيادة المسار المسجل', waiting: 'جارٍ تحديد موقعك…', permission: 'اسمح بالوصول إلى الموقع لبدء التوجيه', start: 'اتجه إلى بداية المسار', go: 'تابع المسار المسجل', left: 'انعطف يساراً', right: 'انعطف يميناً', off: 'خرجت عن المسار؛ عد إلى الخط الأزرق', done: 'وصلت إلى نهاية المسار', remaining: 'المتبقي', toStart: 'الاتجاهات إلى نقطة البداية', center: 'موقعي', close: 'إغلاق', raw: 'تعذرت مطابقة الطريق؛ يُعرض مسار GPS الأصلي' },
  nl: { title: 'Opgenomen route volgen', waiting: 'Locatie bepalen…', permission: 'Sta locatietoegang toe voor begeleiding', start: 'Rijd naar het begin van de route', go: 'Volg de opgenomen route', left: 'Sla linksaf', right: 'Sla rechtsaf', off: 'Van de route af; keer terug naar de blauwe lijn', done: 'Einde van de route bereikt', remaining: 'Resterend', toStart: 'Navigeer naar startpunt', center: 'Mijn locatie', close: 'Sluiten', raw: 'Wegmatching niet beschikbaar; originele GPS-route zichtbaar' },
  en: { title: 'Follow recorded route', waiting: 'Locating you…', permission: 'Allow location access for guidance', start: 'Drive to the route start', go: 'Follow the recorded route', left: 'Turn left', right: 'Turn right', off: 'Off route; return to the blue line', done: 'End of route reached', remaining: 'Remaining', toStart: 'Directions to start', center: 'My location', close: 'Close', raw: 'Road matching unavailable; showing original GPS trace' }
};

function instruction(route: RoutePoint[], index: number, lang: Lang) {
  if (index + 2 >= route.length) return copy[lang].go;
  const angle = (a: RoutePoint, b: RoutePoint) => Math.atan2((b.lng - a.lng) * Math.cos(a.lat * Math.PI / 180), b.lat - a.lat) * 180 / Math.PI;
  const next = Math.min(route.length - 1, index + 6);
  let turn = angle(route[index + 1], route[next]) - angle(route[Math.max(0, index - 2)], route[index + 1]);
  turn = ((turn + 540) % 360) - 180;
  return turn > 45 ? copy[lang].right : turn < -45 ? copy[lang].left : copy[lang].go;
}

export default function RouteReplayMap({ points, lang, onClose }: { points: RoutePoint[]; lang: Lang; onClose: () => void }) {
  const t = copy[lang] || copy.en;
  const holder = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const progressRef = useRef(0);
  const routeRef = useRef<RoutePoint[]>(points);
  const [route, setRoute] = useState<RoutePoint[]>(points);
  const [matched, setMatched] = useState(false);
  const [position, setPosition] = useState<RoutePoint | null>(null);
  const [error, setError] = useState('');
  const [hint, setHint] = useState(t.waiting);
  const [remaining, setRemaining] = useState(0);
  const [follow, setFollow] = useState(true);
  const followRef = useRef(true);
  followRef.current = follow;

  useEffect(() => {
    const controller = new AbortController();
    matchRoadRoute(points, controller.signal).then(road => {
      if (road) { routeRef.current = road; setRoute(road); setMatched(true); }
    }).catch(() => {});
    return () => controller.abort();
  }, [points]);

  useEffect(() => {
    if (!holder.current || !route.length) return;
    const map = new maplibregl.Map({ container: holder.current, style: 'https://tiles.openfreemap.org/styles/positron', center: [route[0].lng, route[0].lat], zoom: 15.5, maxZoom: 18, attributionControl: { compact: false } });
    mapRef.current = map;
    map.on('load', () => {
      map.addSource('replay', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: route.map(p => [p.lng, p.lat]) } } });
      map.addLayer({ id: 'replay-border', type: 'line', source: 'replay', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': 9 } });
      map.addLayer({ id: 'replay-line', type: 'line', source: 'replay', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#2563eb', 'line-width': 5 } });
      new maplibregl.Marker({ color: '#059669' }).setLngLat([route[0].lng, route[0].lat]).addTo(map);
      new maplibregl.Marker({ color: '#dc2626' }).setLngLat([route[route.length - 1].lng, route[route.length - 1].lat]).addTo(map);
      const bounds = new maplibregl.LngLatBounds();
      route.forEach(p => bounds.extend([p.lng, p.lat]));
      map.fitBounds(bounds, { padding: 55, maxZoom: 15.5 });
    });
    map.on('movestart', e => { if (e.originalEvent) setFollow(false); });
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(holder.current);
    return () => { observer.disconnect(); markerRef.current?.remove(); markerRef.current = null; mapRef.current = null; map.remove(); };
  }, [route]);

  useEffect(() => {
    if (!navigator.geolocation) { setError(t.permission); return; }
    const watch = navigator.geolocation.watchPosition(pos => {
      const raw = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (!Number.isFinite(raw.lat) || !Number.isFinite(raw.lng) || pos.coords.accuracy > 70) return;
      setPosition(raw); setError('');
      const current = routeRef.current;
      if (current.length < 2) return;
      const startDistance = distanceMeters(raw, current[0]);
      const closest = nearestForwardSegment(current, raw, Math.max(0, progressRef.current - 3));
      if (startDistance > 75 && progressRef.current === 0) {
        setHint(t.start); setRemaining(Math.round(startDistance));
      } else if (closest.distance > Math.max(35, pos.coords.accuracy * 1.5)) {
        setHint(t.off); setRemaining(Math.round(remainingMeters(current, progressRef.current, 0)));
      } else {
        progressRef.current = Math.max(progressRef.current, closest.index);
        const meters = Math.round(remainingMeters(current, progressRef.current, closest.index < progressRef.current ? 0 : closest.fraction));
        setRemaining(meters);
        setHint(meters < 25 ? t.done : instruction(current, progressRef.current, lang));
      }
      const map = mapRef.current;
      if (map) {
        const display = closest.distance < Math.min(25, Math.max(12, pos.coords.accuracy)) ? closest.point : raw;
        if (!markerRef.current) markerRef.current = new maplibregl.Marker({ color: '#2563eb' }).setLngLat([display.lng, display.lat]).addTo(map);
        else markerRef.current.setLngLat([display.lng, display.lat]);
        if (followRef.current) map.easeTo({ center: [display.lng, display.lat], zoom: 16, duration: 600 });
      }
    }, () => setError(t.permission), { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 });
    return () => navigator.geolocation.clearWatch(watch);
  }, [lang, t, points]);

  return <div className="fixed inset-0 z-[100] bg-slate-950/90 flex flex-col" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
    <header className="flex items-center justify-between gap-3 p-3 bg-slate-950 text-white"><strong>{t.title}</strong><button type="button" onClick={onClose} className="rounded-lg bg-slate-800 px-4 py-2">{t.close}</button></header>
    <div className="relative flex-1 min-h-0"><div ref={holder} className="absolute inset-0" />
      <div className="absolute top-3 inset-x-3 z-10 flex justify-center pointer-events-none"><div className="max-w-md rounded-2xl bg-white/95 text-slate-900 p-4 shadow-xl text-center font-bold">{error || hint}<div className="text-sm text-blue-700 mt-1">{t.remaining}: {remaining >= 1000 ? `${(remaining / 1000).toFixed(1)} km` : `${remaining} m`}</div>{!matched && <div className="text-[11px] font-normal text-amber-800 mt-1">{t.raw}</div>}</div></div>
      <div className="absolute bottom-8 inset-x-3 z-10 flex justify-center gap-2"><button type="button" className="bg-white text-slate-900 px-4 py-3 rounded-xl shadow-lg font-semibold" onClick={() => { setFollow(true); if (position) mapRef.current?.easeTo({ center: [position.lng, position.lat], zoom: 16 }); }}>{t.center}</button><a className="bg-blue-600 text-white px-4 py-3 rounded-xl shadow-lg font-semibold" href={`https://www.google.com/maps/dir/?api=1&destination=${points[0].lat},${points[0].lng}&travelmode=driving&dir_action=navigate`} target="_blank" rel="noopener noreferrer">{t.toStart}</a></div>
    </div>
  </div>;
}
