import type { CategorySubscription, DrivingCategory } from '../categories';
import { DRIVING_CATEGORY_ORDER } from '../categories';
import type { SchoolSettings } from '../types';

export const BASE_DRIVING_CATEGORY: DrivingCategory = 'B';
export function isDrivingCategory(value: unknown): value is DrivingCategory {
  return typeof value === 'string' && DRIVING_CATEGORY_ORDER.includes(value as DrivingCategory);
}
export function normalizeDrivingCategory(value: unknown): DrivingCategory {
  const code = String(value || '').trim().toUpperCase();
  return isDrivingCategory(code) ? code : 'B';
}
export function parseCategoryList(value: unknown): DrivingCategory[] {
  if (Array.isArray(value)) return [...new Set(value.map(v => String(v).trim().toUpperCase()).filter(isDrivingCategory))];
  const raw = String(value || '').trim();
  try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parseCategoryList(parsed); } catch { /* CSV is also supported. */ }
  return parseCategoryList(raw.split(/[,|\n;]/));
}
export function parseCategorySubscriptions(value: unknown): CategorySubscription[] {
  try {
    const rows = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(rows) ? rows.filter(r => r && isDrivingCategory(r.category) && ['active','inactive','pending','expired'].includes(r.status)) : [];
  } catch { return []; }
}
export function isSubscriptionActive(subscription: CategorySubscription, now = new Date()): boolean {
  // Date-only subscription boundaries follow the school's Netherlands calendar.
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const start = subscription.startsAt || '';
  const end = subscription.endsAt || '';
  const validDate = (value: string) => !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value);
  return subscription.status === 'active' && validDate(start) && validDate(end) && (!start || start <= today) && (!end || end >= today) && (!start || !end || start <= end);
}
export function getEnabledDrivingCategories(settings?: Partial<SchoolSettings> | null, now = new Date()): DrivingCategory[] {
  const subscriptions = parseCategorySubscriptions(settings?.categorySubscriptions);
  // Once a subscription register exists it is authoritative, including expired/disabled rows.
  const enabled = subscriptions.filter(s => isSubscriptionActive(s, now) && subscriptions.filter(other => other.category === s.category).length === 1).map(s => s.category);
  return DRIVING_CATEGORY_ORDER.filter(code => code === 'B' || enabled.includes(code));
}
export function isDrivingCategoryEnabled(settings: Partial<SchoolSettings> | null | undefined, category?: unknown): boolean {
  if (category && !isDrivingCategory(String(category).trim().toUpperCase())) return false;
  return getEnabledDrivingCategories(settings).includes(normalizeDrivingCategory(category));
}
export function categoryHourlyRate(settings: Partial<SchoolSettings> | null | undefined, category: DrivingCategory, baseRate = 65): number {
  if (category === 'B') return Number(settings?.lessonPricePerHour) || baseRate;
  const subscription = parseCategorySubscriptions(settings?.categorySubscriptions).find(s => s.category === category && isSubscriptionActive(s));
  return Number(subscription?.lessonPricePerHour) > 0 ? Number(subscription!.lessonPricePerHour) : 0;
}
