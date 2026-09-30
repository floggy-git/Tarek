import type { RoutePoint } from './routeGeometry';

export function encodeRoute(points?: RoutePoint[]): string {
  if (!points?.length) return '';
  const step = Math.max(1, Math.ceil(points.length / 1200));
  return JSON.stringify(points.filter((_, index) => index === 0 || index === points.length - 1 || index % step === 0)
    .map(p => [Number(p.lat.toFixed(6)), Number(p.lng.toFixed(6)), p.timestamp || 0]));
}

export function decodeRoute(value: unknown): RoutePoint[] | undefined {
  if (typeof value !== 'string' || !value) return undefined;
  try {
    const data = JSON.parse(value);
    if (!Array.isArray(data)) return undefined;
    return data.filter(p => Array.isArray(p) && p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]) && Math.abs(p[0]) <= 90 && Math.abs(p[1]) <= 180)
      .map(p => ({ lat: p[0], lng: p[1], timestamp: p[2] || undefined }));
  } catch { return undefined; }
}
