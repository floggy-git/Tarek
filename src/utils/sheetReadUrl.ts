/** Read canonical cell values while keeping existing date/time formatting. */
export function sheetReadUrl(input: string): string {
  const url = new URL(input);
  if (url.hostname === 'sheets.googleapis.com' && (url.pathname.includes('/values/') || url.pathname.endsWith('/values:batchGet'))) {
    url.searchParams.set('valueRenderOption', 'UNFORMATTED_VALUE');
    url.searchParams.set('dateTimeRenderOption', 'FORMATTED_STRING');
  }
  return url.toString();
}

/** Keep zero and false as textual cells, matching the existing Sheets parsers. */
export function sheetReadResponse<T>(data: T): T {
  if (!data || typeof data !== 'object') return data;
  const body = data as any;
  if (Array.isArray(body.values)) return { ...body, values: body.values.map((row: unknown[]) => row.map(value => typeof value === 'number' || typeof value === 'boolean' ? String(value) : value)) };
  if (Array.isArray(body.valueRanges)) return { ...body, valueRanges: body.valueRanges.map(sheetReadResponse) };
  return data;
}
