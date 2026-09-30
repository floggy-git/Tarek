export type RoutePoint = { lat: number; lng: number; timestamp?: number; accuracy?: number };

export function distanceMeters(a: RoutePoint, b: RoutePoint): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 12742000 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function nearestForwardSegment(route: RoutePoint[], location: RoutePoint, from = 0) {
  let best = { index: Math.min(from, Math.max(0, route.length - 2)), fraction: 0, distance: Infinity, point: route[0] || location };
  const latScale = 111320;
  const lngScale = latScale * Math.cos(location.lat * Math.PI / 180);
  for (let i = Math.max(0, from); i < route.length - 1; i++) {
    const a = route[i], b = route[i + 1];
    const ax = (a.lng - location.lng) * lngScale, ay = (a.lat - location.lat) * latScale;
    const dx = (b.lng - a.lng) * lngScale, dy = (b.lat - a.lat) * latScale;
    const fraction = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)));
    const point = { lat: a.lat + (b.lat - a.lat) * fraction, lng: a.lng + (b.lng - a.lng) * fraction };
    const distance = distanceMeters(location, point);
    if (distance < best.distance) best = { index: i, fraction, distance, point };
  }
  return best;
}

export function remainingMeters(route: RoutePoint[], index: number, fraction: number): number {
  if (route.length < 2) return 0;
  let total = distanceMeters(route[index], route[index + 1]) * (1 - fraction);
  for (let i = index + 1; i < route.length - 1; i++) total += distanceMeters(route[i], route[i + 1]);
  return total;
}

// A matched road trace is only used when OSRM can confidently match one continuous
// route. The original GPS points remain the record and the fallback display.
export async function matchRoadRoute(points: RoutePoint[], signal?: AbortSignal): Promise<RoutePoint[] | null> {
  const valid = points.filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180);
  if (valid.length < 2) return null;
  // Keep the request small; retain first and last samples. No direct routing
  // between sparse endpoints, which could invent a route the trainer never drove.
  const stride = Math.max(1, Math.ceil(valid.length / 70));
  const sample = valid.filter((_, i) => i === 0 || i === valid.length - 1 || i % stride === 0);
  const coordinates = sample.map(p => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(';');
  const response = await fetch(`https://router.project-osrm.org/match/v1/driving/${coordinates}?overview=full&geometries=geojson&tidy=true`, { signal });
  if (!response.ok) return null;
  const result = await response.json();
  if (result.code !== 'Ok' || result.matchings?.length !== 1 || result.tracepoints?.some((p: unknown) => !p)) return null;
  const geometry = result.matchings[0]?.geometry?.coordinates;
  if (!Array.isArray(geometry) || geometry.length < 2) return null;
  const matched = geometry.map((p: number[]) => ({ lng: p[0], lat: p[1] }));
  if (matched.some((p: RoutePoint) => !Number.isFinite(p.lat) || !Number.isFinite(p.lng))) return null;
  if (distanceMeters(sample[0], matched[0]) > 50 || distanceMeters(sample[sample.length - 1], matched[matched.length - 1]) > 50) return null;
  return matched;
}
