import { AuditLogEntry } from '../types';
import { getSheetsConfig, writeAuditLogToGoogleSheet, fetchClientIpAddress } from './googleSheets';
import { safeSetItem } from './safeStorage';

const AUDIT_STORAGE_KEY = 'drivingschool_audit_logs';

/**
 * Strips out sensitive information (passwords, tokens, keys) from logged values.
 */
function sanitizeAuditValue(val?: string | null): string {
  if (!val) return '';
  let str = String(val);
  // Redact potential passwords, tokens, or hashes
  str = str.replace(/(password|token|secret|key|hash)["':=\s]+([^\s,;}{]+)/gi, '$1: [REDACTED]');
  return str.length > 200 ? str.substring(0, 197) + '...' : str;
}

export function getAdminAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to read audit logs from storage:', e);
  }
  return [];
}

export async function recordAdminAuditLog(params: {
  action: string;
  targetRecord?: string;
  previousValue?: string;
  newValue?: string;
  changedBy?: string;
  userId?: string;
  studentId?: string;
  userName?: string;
  userRole?: string;
  source?: string;
}): Promise<AuditLogEntry> {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0];
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Amsterdam';
  
  let ipAddress = 'Local / Client';
  try {
    ipAddress = await fetchClientIpAddress();
  } catch {
    ipAddress = 'Browser Client';
  }

  const deviceBrowser = typeof navigator !== 'undefined'
    ? `${navigator.platform || ''} - ${navigator.userAgent?.split(' ')[0] || 'Browser'}`
    : 'System Agent';

  const entry: AuditLogEntry = {
    auditId: `AUD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
    userId: params.userId || 'ADMIN-01',
    studentId: params.studentId,
    userName: params.userName || 'System Administrator',
    userRole: (params.userRole as any) || 'Admin',
    action: params.action,
    changedBy: params.changedBy || 'Admin Control Center',
    date: dateStr,
    time: timeStr,
    timeZone,
    ipAddress,
    deviceBrowser,
    targetRecord: params.targetRecord,
    previousValue: sanitizeAuditValue(params.previousValue),
    newValue: sanitizeAuditValue(params.newValue),
    source: params.source || 'Control Center'
  };

  // 1. Persist to local storage (keep last 500 entries)
  try {
    const existing = getAdminAuditLogs();
    const updated = [entry, ...existing].slice(0, 500);
    safeSetItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('appAuditLogsUpdated', { detail: entry }));
  } catch (e) {
    console.error('Failed to store audit log locally:', e);
  }

  // 2. Asynchronously append to Google Sheets AuditLogs tab if authorized
  try {
    const config = getSheetsConfig();
    if (config.spreadsheetId && config.accessToken) {
      writeAuditLogToGoogleSheet(config, entry).catch(err => {
        console.warn('Asynchronous Google Sheets audit append skipped/failed:', err?.message || err);
      });
    }
  } catch (e) {
    console.warn('Could not dispatch audit entry to Google Sheets:', e);
  }

  return entry;
}
