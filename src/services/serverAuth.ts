import crypto from 'crypto';

export type AuthenticatedRole = 'student' | 'trainer' | 'admin';

export interface AuthenticatedPrincipal {
  uid: string;
  role: AuthenticatedRole;
  studentId?: string;
  email?: string;
}

let certCache: { expiresAt: number; certs: Record<string, string> } | null = null;

function decodeJwtPart(part: string): Record<string, any> | null {
  try {
    return JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function timingSafeEqualText(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

async function getGoogleSecureTokenCerts(): Promise<Record<string, string>> {
  if (certCache && certCache.expiresAt > Date.now()) return certCache.certs;
  const response = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
  if (!response.ok) throw new Error(`Unable to retrieve Firebase signing certificates (${response.status}).`);
  const certs = await response.json() as Record<string, string>;
  const cacheControl = response.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const maxAgeMs = maxAgeMatch ? Number(maxAgeMatch[1]) * 1000 : 60 * 60 * 1000;
  certCache = { certs, expiresAt: Date.now() + Math.min(maxAgeMs, 24 * 60 * 60 * 1000) };
  return certs;
}

/**
 * Verify a Firebase Auth ID token on the server. The browser cannot choose its
 * own role/student scope: those values come only from verified token claims.
 * Custom claims supported by the application are role and studentId.
 */
export async function authenticateSyncRequest(
  req: { headers: Record<string, any> }
): Promise<AuthenticatedPrincipal | null> {
  const header = String(req.headers.authorization || '');
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const headerPart = decodeJwtPart(parts[0]);
  const payload = decodeJwtPart(parts[1]);
  if (!headerPart || !payload) return null;

  const alg = String(headerPart.alg || '');
  const kid = String(headerPart.kid || '');
  if (alg !== 'RS256' || !kid) return null;

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= now) return null;
  if (typeof payload.iat !== 'number' || payload.iat > now + 60) return null;
  if (typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 256) return null;

  const projectId = String(payload.aud || process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '').trim();
  if (!projectId || payload.iss !== `https://securetoken.google.com/${projectId}`) return null;

  try {
    const certs = await getGoogleSecureTokenCerts();
    const publicKey = certs[kid];
    if (!publicKey) return null;
    const verified = crypto.verify(
      'RSA-SHA256',
      Buffer.from(`${parts[0]}.${parts[1]}`),
      publicKey,
      Buffer.from(parts[2], 'base64url')
    );
    if (!verified) return null;
  } catch {
    return null;
  }

  const rawRole = payload.role ?? payload.userRole ?? payload['https://al-andalos/role'];
  const role: AuthenticatedRole = rawRole === 'admin' || rawRole === 'administrator' || rawRole === 'superadmin'
    ? 'admin'
    : rawRole === 'trainer' || rawRole === 'instructor'
      ? 'trainer'
      : 'student';

  const rawStudentId = payload.studentId ?? payload.student_id ?? payload['https://al-andalos/studentId'];
  const studentId = typeof rawStudentId === 'string' && rawStudentId.trim() ? rawStudentId.trim() : undefined;
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : undefined;

  return { uid: payload.sub, role, studentId, email };
}

export function principalCanAccessStudent(principal: AuthenticatedPrincipal, studentId: string): boolean {
  if (!studentId) return false;
  if (principal.role === 'admin' || principal.role === 'trainer') return true;
  return principal.role === 'student' && Boolean(principal.studentId) && principal.studentId === studentId;
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
