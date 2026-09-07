const express = require('express');
const crypto = require('crypto');

let certCache = null;

function decode(part) {
  try { return JSON.parse(Buffer.from(part, 'base64url').toString('utf8')); } catch { return null; }
}

async function getCerts() {
  if (certCache && certCache.expiresAt > Date.now()) return certCache.certs;
  const response = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
  if (!response.ok) throw new Error(`Firebase certificate request failed (${response.status})`);
  const certs = await response.json();
  const cacheControl = response.headers.get('cache-control') || '';
  const match = cacheControl.match(/max-age=(\d+)/i);
  const maxAge = match ? Number(match[1]) * 1000 : 3600000;
  certCache = { certs, expiresAt: Date.now() + Math.min(maxAge, 86400000) };
  return certs;
}

async function authenticate(req) {
  const authorization = String(req.headers.authorization || '');
  const queryToken = req.query && typeof req.query.access_token === 'string' ? req.query.access_token : '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : queryToken.trim();
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const header = decode(parts[0]);
  const payload = decode(parts[1]);
  if (!header || !payload || header.alg !== 'RS256' || !header.kid) return null;

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= now) return null;
  if (typeof payload.iat !== 'number' || payload.iat > now + 60) return null;
  if (typeof payload.sub !== 'string' || !payload.sub) return null;

  const projectId = String(payload.aud || process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '').trim();
  if (!projectId || payload.iss !== `https://securetoken.google.com/${projectId}`) return null;

  try {
    const certs = await getCerts();
    const publicKey = certs[header.kid];
    if (!publicKey) return null;
    if (!crypto.verify('RSA-SHA256', Buffer.from(`${parts[0]}.${parts[1]}`), publicKey, Buffer.from(parts[2], 'base64url'))) return null;
  } catch {
    return null;
  }

  const rawRole = payload.role ?? payload.userRole ?? payload['https://al-andalos/role'];
  const role = rawRole === 'admin' || rawRole === 'administrator' || rawRole === 'superadmin'
    ? 'admin'
    : rawRole === 'trainer' || rawRole === 'instructor'
      ? 'trainer'
      : 'student';
  const rawStudentId = payload.studentId ?? payload.student_id ?? payload['https://al-andalos/studentId'];
  const studentId = typeof rawStudentId === 'string' && rawStudentId.trim() ? rawStudentId.trim() : undefined;
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : undefined;
  return { uid: payload.sub, role, studentId, email };
}

const READ_WRITE_ENTITIES = new Set([
  'STUDENT', 'LESSON', 'SETTING', 'PACKAGE', 'MEDIA',
  'TRANSACTION', 'WALLET', 'INVOICE', 'NOTIFICATION', 'HELP'
]);
const STUDENT_MUTABLE_ENTITIES = new Set([
  'STUDENT', 'LESSON', 'NOTIFICATION'
]);
const TRAINER_MUTABLE_ENTITIES = new Set([
  'STUDENT', 'LESSON', 'NOTIFICATION', 'TRANSACTION', 'WALLET', 'INVOICE'
]);
const DANGEROUS_ACTIONS = new Set(['DELETE']);
const DANGEROUS_ENTITIES = new Set(['STUDENT', 'PACKAGE', 'SETTING', 'MEDIA', 'TRANSACTION', 'WALLET', 'INVOICE']);

function canMutate(principal, delta) {
  const entityType = String(delta.entityType || '').toUpperCase();
  const action = String(delta.action || 'UPDATE').toUpperCase();
  if (!READ_WRITE_ENTITIES.has(entityType)) return false;
  if (!['CREATE', 'UPDATE', 'DELETE'].includes(action)) return false;

  // Destructive operations are never accepted through the generic sync endpoint.
  // They must go through dedicated server-side workflows with explicit authorization.
  if (DANGEROUS_ACTIONS.has(action) || (DANGEROUS_ENTITIES.has(entityType) && action === 'CREATE')) {
    return principal.role === 'admin' && Boolean(delta.confirmationToken) && typeof delta.confirmationToken === 'string';
  }

  if (principal.role === 'admin') return true;

  if (principal.role === 'trainer') {
    return TRAINER_MUTABLE_ENTITIES.has(entityType) && action !== 'CREATE';
  }

  if (principal.role !== 'student' || !principal.studentId) return false;
  if (!STUDENT_MUTABLE_ENTITIES.has(entityType)) return false;
  if (action === 'CREATE') return false;
  if (entityType === 'STUDENT') return principal.studentId === String(delta.entityId);
  return principal.studentId === String(delta.studentId || '');
}

function filterDeltas(principal, deltas) {
  if (principal.role !== 'student') return deltas;
  if (!principal.studentId) return [];
  return deltas.filter((delta) => {
    const target = delta.studentId || (delta.entityType === 'STUDENT' ? delta.entityId : '');
    return target === principal.studentId;
  });
}

const originalGet = express.application.get;
const originalPost = express.application.post;

function wrapRoute(original, method) {
  return function patchedRoute(path, ...handlers) {
    if (typeof path !== 'string' || !path.startsWith('/api/sync/')) return original.call(this, path, ...handlers);
    const routeName = path.slice('/api/sync/'.length).split('/')[0];
    if (routeName === 'webhooks') return original.call(this, path, ...handlers);
    const index = handlers.length - 1;
    const handler = handlers[index];
    if (typeof handler !== 'function') return original.call(this, path, ...handlers);

    handlers[index] = async function securedSyncRoute(req, res, next) {
      let principal;
      try { principal = await authenticate(req); } catch { principal = null; }
      if (!principal) return res.status(401).json({ success: false, error: 'Unauthorized: valid Firebase authentication required' });
      if (routeName === 'stream' && principal.role === 'student' && !principal.studentId) {
        return res.status(403).json({ success: false, error: 'Forbidden: authenticated student scope is missing' });
      }

      if (routeName === 'stream') {
        Object.defineProperty(req, 'query', {
          configurable: true,
          enumerable: true,
          writable: true,
          value: { ...req.query, role: principal.role, studentId: principal.studentId }
        });
      }

      if (routeName === 'patch') {
        const delta = req.body;
        if (!delta || !delta.entityType || !delta.entityId || !canMutate(principal, delta)) {
          return res.status(403).json({ success: false, error: 'Forbidden: operation is outside the authenticated permission boundary' });
        }
        if (principal.role === 'student') delta.studentId = principal.studentId;
      }

      if (routeName === 'deltas') {
        const originalJson = res.json.bind(res);
        res.json = (body) => {
          if (body && Array.isArray(body.deltas)) {
            const deltas = filterDeltas(principal, body.deltas);
            return originalJson({ ...body, count: deltas.length, deltas });
          }
          return originalJson(body);
        };
      }

      return handler(req, res, next);
    };
    return original.call(this, path, ...handlers);
  };
}

express.application.get = wrapRoute(originalGet, 'GET');
express.application.post = wrapRoute(originalPost, 'POST');
