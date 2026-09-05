import crypto from 'crypto';

export type AuthenticatedRole = 'student' | 'trainer' | 'admin';

export interface AuthenticatedPrincipal {
  uid: string;
  role: AuthenticatedRole;
  studentId?: string;
  email?: string;
}

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function timingSafeEqualText(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

/**
 * Production authentication for sync infrastructure.
 * Browser-provided role/studentId headers are never treated as authentication.
 * A signed internal sync token is required and must be issued by the trusted
 * application server/authentication layer.
 */
export function authenticateSyncRequest(
  req: { headers: Record<string, any> },
  expectedSecret = process.env.SYNC_SERVER_SECRET || ''
): AuthenticatedPrincipal | null {
  if (!expectedSecret) return null;
  const header = String(req.headers.authorization || '');
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();

  // Internal HMAC token format: sync.<base64url-json>.<hex-hmac>
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'sync') return null;
  const payloadPart = parts[1];
  const signature = parts[2];
  const expected = crypto.createHmac('sha256', expectedSecret).update(`sync.${payloadPart}`).digest('hex');
  if (!timingSafeEqualText(signature, expected)) return null;

  const payload = decodeJwtPayload(`x.${payloadPart}.x`);
  if (!payload || typeof payload.uid !== 'string' || typeof payload.role !== 'string') return null;
  if (!['student', 'trainer', 'admin'].includes(payload.role)) return null;
  if (typeof payload.exp !== 'number' || payload.exp <= Math.floor(Date.now() / 1000)) return null;
  if (payload.studentId !== undefined && typeof payload.studentId !== 'string') return null;

  return {
    uid: payload.uid,
    role: payload.role as AuthenticatedRole,
    studentId: payload.studentId,
    email: typeof payload.email === 'string' ? payload.email : undefined
  };
}

export function principalCanAccessStudent(principal: AuthenticatedPrincipal, studentId: string): boolean {
  if (!studentId) return false;
  if (principal.role === 'admin' || principal.role === 'trainer') return true;
  return principal.role === 'student' && principal.studentId === studentId;
}

export function principalCanMutateEntity(
  principal: AuthenticatedPrincipal,
  entityType: string,
  entityId: string,
  studentId?: string
): boolean {
  if (principal.role === 'admin' || principal.role === 'trainer') return true;
  if (principal.role !== 'student') return false;
  if (entityType === 'STUDENT') return principal.studentId === entityId;
  return Boolean(studentId && principal.studentId === studentId);
}
