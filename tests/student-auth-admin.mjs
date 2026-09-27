import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { deleteFirebaseStudentByEmail, createFirebaseStudent, syncFirebaseStudent, wasStudentDeleted, verifySheetRequest } from '../src/server/studentAuthAdmin.ts';

test('signed spreadsheet request rejects tampering and stale timestamps', () => {
  const secret = 'test-secret';
  const time = String(Date.now());
  const body = JSON.stringify({ studentId: 'ST-000123' });
  const signature = crypto.createHmac('sha256', secret).update(`${time}.${body}`).digest('hex');
  assert.equal(verifySheetRequest(secret, time, signature, body), true);
  assert.equal(verifySheetRequest(secret, time, signature, body + ' '), false);
  assert.equal(verifySheetRequest(secret, String(Number(time) - 600000), signature, body), false);
});

test('Firebase deletion looks up email and deletes precisely that UID', async () => {
  const keys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const old = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const originalFetch = globalThis.fetch;
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
    client_email: 'test@example.iam.gserviceaccount.com',
    private_key: keys.privateKey.export({ type: 'pkcs8', format: 'pem' }),
    project_id: 'test-project'
  });
  const requests = [];
  globalThis.fetch = async (url, opts) => {
    requests.push({ url: String(url), body: opts.body });
    if (String(url).includes('oauth2.googleapis.com')) return new Response(JSON.stringify({ access_token: 'test-token' }), { status: 200 });
    if (String(url).endsWith('accounts:lookup')) return new Response(JSON.stringify({ users: [{ localId: 'firebase-uid-1', email: 'student@example.com' }] }), { status: 200 });
    if (String(url).endsWith('accounts:delete')) return new Response('{}', { status: 200 });
    throw new Error('Unexpected request');
  };
  try {
    assert.equal(await deleteFirebaseStudentByEmail('Student@Example.com'), 'deleted');
    assert.equal(JSON.parse(requests[1].body).email[0], 'student@example.com');
    assert.equal(JSON.parse(requests[2].body).localId, 'firebase-uid-1');
  } finally {
    globalThis.fetch = originalFetch;
    if (old === undefined) delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    else process.env.FIREBASE_SERVICE_ACCOUNT_JSON = old;
  }
});

test('Firebase create and edit keep passwords server side', async () => {
  const keys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const old = process.env.FIREBASE_SERVICE_ACCOUNT_JSON, oldKey = process.env.FIREBASE_WEB_API_KEY;
  const originalFetch = globalThis.fetch;
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({ client_email:'test@example.iam.gserviceaccount.com',private_key:keys.privateKey.export({type:'pkcs8',format:'pem'}),project_id:'test-project' });
  process.env.FIREBASE_WEB_API_KEY = 'test-key';
  const bodies=[];
  globalThis.fetch = async (url, opts) => {
    if(String(url).includes('oauth2.googleapis.com'))return new Response(JSON.stringify({access_token:'token'}),{status:200});
    bodies.push(JSON.parse(opts.body));
    if(String(url).includes('accounts:lookup'))return new Response(JSON.stringify({users:[{email:'old@example.com',localId:'uid-1'}]}),{status:200});
    return new Response('{}',{status:200});
  };
  try {
    await createFirebaseStudent('New@Example.com','New Student','sixchars');
    await syncFirebaseStudent('old@example.com','new@example.com','Renamed','newpassword');
    assert.equal(bodies[0].email,'new@example.com');
    assert.equal(bodies[0].password,'sixchars');
    assert.equal(bodies[2].localId,'uid-1');
    assert.equal(bodies[2].email,'new@example.com');
    assert.equal(bodies[2].password,'newpassword');
  } finally {
    globalThis.fetch=originalFetch;
    if(old===undefined)delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;else process.env.FIREBASE_SERVICE_ACCOUNT_JSON=old;
    if(oldKey===undefined)delete process.env.FIREBASE_WEB_API_KEY;else process.env.FIREBASE_WEB_API_KEY=oldKey;
  }
});

test('deleted email is checked by a salted digest before re-registration', async () => {
  const oldSecret=process.env.SHEETS_WEBHOOK_SECRET, old=process.env.FIREBASE_SERVICE_ACCOUNT_JSON, originalFetch=globalThis.fetch;
  const keys=crypto.generateKeyPairSync('rsa',{modulusLength:2048});
  process.env.SHEETS_WEBHOOK_SECRET='registration-tombstone-secret';
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON=JSON.stringify({client_email:'test@example.iam.gserviceaccount.com',private_key:keys.privateKey.export({type:'pkcs8',format:'pem'}),project_id:'test-project'});
  const hash=crypto.createHmac('sha256',process.env.SHEETS_WEBHOOK_SECRET).update('deleted@example.com').digest('hex');
  globalThis.fetch=async url => String(url).includes('oauth2.googleapis.com') ? new Response(JSON.stringify({access_token:'token'}),{status:200}) : new Response(JSON.stringify({values:[[hash]]}),{status:200});
  try {
    assert.equal(await wasStudentDeleted('Deleted@Example.com'),true);
    assert.equal(await wasStudentDeleted('other@example.com'),false);
  } finally {
    globalThis.fetch=originalFetch;
    if(oldSecret===undefined)delete process.env.SHEETS_WEBHOOK_SECRET;else process.env.SHEETS_WEBHOOK_SECRET=oldSecret;
    if(old===undefined)delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;else process.env.FIREBASE_SERVICE_ACCOUNT_JSON=old;
  }
});
