// Public school preferences shown in SchoolConfigPanel. Mail passwords stay out of Sheets feeds.
export const EXTRA_SCHOOL_FIELDS = {
  themeId: 'string', appIconUrl: 'string', coverImageUrl: 'string', kvkDetails: 'string',
  defaultLessonDuration: 'number', cancellationPolicy: 'string', bookingRules: 'string',
  minAdvanceNoticeHours: 'number', cancellationDeadlineHours: 'number',
  smtpHost: 'string', smtpPort: 'string', smtpUser: 'string', smtpEncryption: 'string',
  smtpSenderName: 'string', replyToEmail: 'string', emailSignature: 'string',
  enableBookingEmails: 'boolean', enableCancelEmails: 'boolean',
  enableInvoiceEmails: 'boolean', enableReminderEmails: 'boolean', aiEnforceStrictBoundary: 'boolean'
} as const;

export function parseExtraSchoolFields(headers: unknown[], row: unknown[]) {
  const result: Record<string, string | number | boolean> = {};
  for (const [key, type] of Object.entries(EXTRA_SCHOOL_FIELDS)) {
    const index = headers.findIndex(h => String(h).trim().toLowerCase() === key.toLowerCase());
    if (index < 0 || row[index] === undefined || row[index] === '') continue;
    const value = row[index];
    if (type === 'boolean') result[key] = !['false', '0'].includes(String(value).toLowerCase());
    else if (type === 'number') { const n = Number(value); if (Number.isFinite(n)) result[key] = n; }
    else result[key] = String(value);
  }
  return result;
}

export function schoolColumnName(index: number) {
  let name = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + (n - 1) % 26) + name;
  return name;
}

// Address fields by canonical key so changing a display language or column order cannot misroute writes.
export function schoolSettingsCellUpdates(existingHeaders: unknown[], fields: Record<string, unknown>) {
  const headers = existingHeaders.map(h => String(h).trim());
  const data: { range: string; values: unknown[][] }[] = [];
  for (const [key, value] of Object.entries(fields)) {
    if (key === 'smtpPass' || value === undefined || value === null) continue;
    let index = headers.findIndex(h => h.toLowerCase() === key.toLowerCase());
    if (index < 0) {
      index = headers.length; headers.push(key);
      data.push({ range: `SchoolSettings!${schoolColumnName(index)}1`, values: [[key]] });
    }
    data.push({ range: `SchoolSettings!${schoolColumnName(index)}2`, values: [[value]] });
  }
  return { data, columnCount: headers.length };
}
