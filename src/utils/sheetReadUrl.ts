/** Read canonical cell values while keeping existing date/time formatting. */
export function sheetReadUrl(input: string): string {
  const url = new URL(input);
  if (url.hostname === 'sheets.googleapis.com' && (url.pathname.includes('/values/') || url.pathname.endsWith('/values:batchGet'))) {
    url.searchParams.set('valueRenderOption', 'UNFORMATTED_VALUE');
    url.searchParams.set('dateTimeRenderOption', 'FORMATTED_STRING');
  }
  return url.toString();
}
