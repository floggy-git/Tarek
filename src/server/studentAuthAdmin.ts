import crypto from 'crypto';

type ServiceAccount = { client_email: string; private_key: string; project_id: string; token_uri?: string };
const tokenCache = new Map<string, { token: string; until: number }>();

async function serviceToken(scope: string): Promise<{ token: string; projectId: string }> {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('Firebase service account is not configured. Student deletion was cancelled.');
  const account = JSON.parse(raw) as ServiceAccount;
  const projectId = process.env.FIREBASE_PROJECT_ID || account.project_id;
  if (!account.client_email || !account.private_key || !projectId || account.project_id !== projectId) {
    throw new Error('Firebase service account project does not match the app.');
  }
  const cached = tokenCache.get(scope);
  if (cached && cached.until > Date.now()) return { token: cached.token, projectId };
  const now = Math.floor(Date.now() / 1000);
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const unsigned = encode({ alg: 'RS256', typ: 'JWT' }) + '.' + encode({
    iss: account.client_email,
    scope,
    aud: account.token_uri || 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  });
  const assertion = unsigned + '.' + crypto.sign('RSA-SHA256', Buffer.from(unsigned), account.private_key).toString('base64url');
  const tokenRes = await fetch(account.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion })
  });
  if (!tokenRes.ok) throw new Error('Firebase administrative authorization failed.');
  const token = (await tokenRes.json()).access_token;
  tokenCache.set(scope, { token, until: Date.now() + 45 * 60 * 1000 });
  return { token, projectId };
}

export async function deleteFirebaseStudentByEmail(email: string): Promise<'deleted' | 'missing'> {
  const { token, projectId } = await serviceToken('https://www.googleapis.com/auth/identitytoolkit');
  const call = async (path: string, body: object) => {
    const res = await fetch('https://identitytoolkit.googleapis.com/v1/' + path, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Firebase administration failed (${res.status}).`);
    return res.json();
  };
  const lookup = await call('accounts:lookup', { email: [email.toLowerCase()], targetProjectId: projectId });
  const matches = (lookup.users || []).filter((u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase());
  if (!matches.length) return 'missing';
  if (matches.length !== 1 || !matches[0].localId) throw new Error('Firebase account lookup is ambiguous.');
  await call(`projects/${encodeURIComponent(projectId)}/accounts:delete`, { localId: matches[0].localId });
  return 'deleted';
}

export async function createFirebaseStudent(email: string, name: string, password: string): Promise<void> {
  if (password.length < 6) throw new Error('Password must have at least six characters.');
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) throw new Error('Firebase API key is not configured.');
  const { token, projectId } = await serviceToken('https://www.googleapis.com/auth/identitytoolkit');
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/accounts?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.toLowerCase(), displayName: name, password, disabled: false })
  });
  if (!response.ok) throw new Error(`Firebase account creation failed (${response.status}). Check whether the email already has an account.`);
}

export async function resetFirebaseStudentPassword(email: string, password: string): Promise<void> {
  if (password.length < 6) throw new Error('Password must have at least six characters.');
  const { token, projectId } = await serviceToken('https://www.googleapis.com/auth/identitytoolkit');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const lookup = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup', {
    method: 'POST', headers, body: JSON.stringify({ email: [email.toLowerCase()], targetProjectId: projectId })
  });
  if (!lookup.ok) throw new Error('Firebase account lookup failed.');
  const users = (await lookup.json()).users || [];
  const match = users.filter((u: {email:string}) => u.email?.toLowerCase() === email.toLowerCase());
  if (match.length !== 1) throw new Error('Firebase account was not found uniquely.');
  const updated = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/accounts:update`, {
    method: 'POST', headers, body: JSON.stringify({ localId: match[0].localId, password })
  });
  if (!updated.ok) throw new Error('Firebase password update failed.');
}

export async function syncFirebaseStudent(oldEmail: string, newEmail: string, name: string, password?: string): Promise<void> {
  const { token, projectId } = await serviceToken('https://www.googleapis.com/auth/identitytoolkit');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const lookup = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup', {
    method: 'POST', headers, body: JSON.stringify({ email: [oldEmail.toLowerCase()], targetProjectId: projectId })
  });
  if (!lookup.ok) throw new Error('Firebase account lookup failed.');
  const matches = ((await lookup.json()).users || []).filter((u: {email:string}) => u.email?.toLowerCase() === oldEmail.toLowerCase());
  if (matches.length !== 1) throw new Error('Firebase account was not found uniquely.');
  const changes: Record<string,string> = { localId: matches[0].localId, email: newEmail.toLowerCase(), displayName: name };
  if (password) { if(password.length < 6)throw new Error('Password too short.');changes.password=password; }
  const result = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/accounts:update`, {
    method: 'POST', headers, body: JSON.stringify(changes)
  });
  if (!result.ok) throw new Error(`Firebase identity update failed (${result.status}).`);
}

export async function getSheetRows(range: string): Promise<string[][]> {
  const { token } = await serviceToken('https://www.googleapis.com/auth/spreadsheets');
  const id = process.env.GOOGLE_SPREADSHEET_ID || '1nKF40i125QY7MQMghOoOnyqjpHLFWKM12ZYIIGxW9Ck';
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/${encodeURIComponent(range)}`, {
    headers: { Authorization: `Bearer ${token}` }, cache: 'no-store'
  });
  if (!response.ok) throw new Error(`School sheet read failed (${response.status}).`);
  return (await response.json()).values || [];
}

export async function getSheetStudents(): Promise<string[][]> { return getSheetRows('Students!A1:L'); }

function deletedHash(email: string): string {
  const secret = process.env.SHEETS_WEBHOOK_SECRET;
  if (!secret) throw new Error('Permanent deletion registry is not configured.');
  return crypto.createHmac('sha256', secret).update(email.trim().toLowerCase()).digest('hex');
}

export async function wasStudentDeleted(email: string): Promise<boolean> {
  const hash = deletedHash(email);
  try {
    const rows = await getSheetRows('DeletedStudents!A1:A');
    return rows.some(r => r[0] === hash);
  } catch (err) {
    if (String(err).includes('(400)')) return false; // Tab has not yet been created.
    throw err;
  }
}

export async function recordDeletedStudent(email: string): Promise<void> {
  if (await wasStudentDeleted(email)) return;
  const { token } = await serviceToken('https://www.googleapis.com/auth/spreadsheets');
  const id = process.env.GOOGLE_SPREADSHEET_ID || '1nKF40i125QY7MQMghOoOnyqjpHLFWKM12ZYIIGxW9Ck';
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}?fields=sheets.properties.title`, { headers });
  if (!metaRes.ok) throw new Error('Could not inspect deletion registry.');
  const meta = await metaRes.json();
  if (!(meta.sheets || []).some((s: any) => s.properties?.title === 'DeletedStudents')) {
    const created = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}:batchUpdate`, {
      method: 'POST', headers, body: JSON.stringify({ requests: [{ addSheet: { properties: { title: 'DeletedStudents', hidden: true } } }] })
    });
    if (!created.ok) throw new Error('Could not create deletion registry.');
  }
  const append = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/${encodeURIComponent('DeletedStudents!A:A')}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: 'POST', headers, body: JSON.stringify({ values: [[deletedHash(email)]] })
  });
  if (!append.ok) throw new Error('Could not block future registration.');
}

export async function removeDeletedStudent(email: string): Promise<void> {
  const rows = await getSheetRows('DeletedStudents!A1:A');
  const index = rows.findIndex(r => r[0] === deletedHash(email));
  if (index < 0) return;
  const { token } = await serviceToken('https://www.googleapis.com/auth/spreadsheets');
  const id = process.env.GOOGLE_SPREADSHEET_ID || '1nKF40i125QY7MQMghOoOnyqjpHLFWKM12ZYIIGxW9Ck';
  const range = `DeletedStudents!A${index+1}`;
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/${encodeURIComponent(range)}:clear`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: '{}'
  });
  if (!response.ok) throw new Error('Could not restore deletion registry after failed account removal.');
}

export async function verifyStudentIdToken(idToken: string): Promise<string> {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey || !idToken) throw new Error('Firebase verification is not configured.');
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken })
  });
  if (!response.ok) throw new Error('Invalid Firebase session.');
  const user = (await response.json()).users?.[0];
  if (!user?.email || user.disabled) throw new Error('Firebase account is unavailable.');
  return String(user.email).toLowerCase();
}

export async function appendSheetStudent(row: unknown[]): Promise<void> {
  const { token } = await serviceToken('https://www.googleapis.com/auth/spreadsheets');
  const id = process.env.GOOGLE_SPREADSHEET_ID || '1nKF40i125QY7MQMghOoOnyqjpHLFWKM12ZYIIGxW9Ck';
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/${encodeURIComponent('Students!A:L')}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [row] })
  });
  if (!response.ok) throw new Error(`Students sheet write failed (${response.status}).`);
}

export function verifySheetRequest(secret: string, timestamp: string, signature: string, rawBody: string): boolean {
  if (!secret || !/^\d{13}$/.test(timestamp) || Math.abs(Date.now() - Number(timestamp)) > 300000 || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const actual = Buffer.from(signature, 'hex');
  const expected = crypto.createHmac('sha256', secret).update(timestamp + '.' + rawBody).digest();
  return crypto.timingSafeEqual(actual, expected);
}
