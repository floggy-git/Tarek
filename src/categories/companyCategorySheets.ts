import type { CategorySubscription } from './types';
import { isDrivingCategory } from '../utils/companyCategoryAccess';
import type { GoogleSheetsConfig } from '../utils/googleSheets';

export const COMPANY_CATEGORY_SHEET = 'CompanyCategories';
export function parseCompanyCategoryRows(rows: unknown[][]): CategorySubscription[] {
  const headers = (rows[0] || []).map(h => String(h).trim().toLowerCase());
  return rows.slice(1).flatMap(row => {
    const get = (name: string) => String(row[headers.indexOf(name)] ?? '').trim();
    const code = get('category').toUpperCase();
    if (!isDrivingCategory(code)) return [];
    const status = get('status').toLowerCase();
    return [{ category: code, status: ['active','pending','expired'].includes(status) ? status as CategorySubscription['status'] : 'inactive', startsAt: get('starts at'), endsAt: get('ends at'), lessonPricePerHour: Number(get('hourly rate').replace(',', '.')), planId: get('plan'), notes: get('notes') }];
  });
}

// Read-only by design: ordinary app settings saves must not grant company add-ons.
export async function loadCompanyCategorySubscriptions(config: GoogleSheetsConfig, signal?: AbortSignal): Promise<CategorySubscription[]> {
  const headers: HeadersInit = {};
  const query = new URLSearchParams({ valueRenderOption: 'UNFORMATTED_VALUE', dateTimeRenderOption: 'FORMATTED_STRING' });
  if (config.accessToken) headers.Authorization = `Bearer ${config.accessToken}`;
  else if (config.apiKey) query.set('key', config.apiKey);
  else {
    const webAppUrl = (import.meta as any).env?.VITE_GOOGLE_SHEETS_WEB_APP_URL;
    if (!webAppUrl || !/^https:\/\/script\.google\.com\//.test(webAppUrl)) throw new Error('Company categories require the school Google Sheets connection.');
    const url = new URL(webAppUrl);
    url.searchParams.set('action', 'getCompanyCategories');
    const result = await fetch(url, { signal, cache: 'no-store' });
    if (!result.ok) throw new Error('Company category gateway unavailable.');
    const body = await result.json();
    if (!body.success || !Array.isArray(body.data?.categorySubscriptions)) throw new Error('Company category gateway is not configured.');
    return body.data.categorySubscriptions;
  }
  const range = encodeURIComponent(`${COMPANY_CATEGORY_SHEET}!A1:H20`);
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${range}?${query}`, { headers, signal, cache: 'no-store' });
  if (!response.ok) throw new Error(`Company categories could not be refreshed (${response.status}).`);
  const data = await response.json();
  return parseCompanyCategoryRows(data.values || []);
}
