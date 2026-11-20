const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const dns = require('node:dns');
try { dns.setDefaultResultOrder('ipv4first'); } catch {}

// Carga variables privadas desde .env (solo en tu PC; en el hosting se configuran en su panel)
try {
  const envFile = path.join(__dirname, '.env');
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
} catch {}
const crypto = require('node:crypto');
const { createLearningApi } = require('./learning-api.cjs');
const { createGoogleVerifier } = require('./google-identity.cjs');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://looubvzykbqxfricdiem.supabase.co';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || '';
if (!SUPABASE_SECRET_KEY) console.warn('⚠ Falta SUPABASE_SECRET_KEY (ponla en .env localmente o en las variables del hosting).');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '85651566977-hpf0fp05mj1d9s66g1kd6crdaj7ul7g2.apps.googleusercontent.com';
const ADMIN_EMAILS = new Set([
  'lmsatencion@gmail.com',
  'luisgamesprogrammer@gmail.com',
  '78550599@continental.edu.pe'
]);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.wasm': 'application/wasm'
};

const PLANS = [
  { months: 1, label: '1 mes', amountCents: 2990 },
  { months: 6, label: '6 meses', amountCents: 14990 },
  { months: 12, label: '1 año', amountCents: 26990 }
];

function sqlStr(val) {
  if (val === null || val === undefined) return 'NULL';
  return "'" + String(val).replace(/'/g, "''") + "'";
}

function sqlNum(val) {
  const n = Number(val);
  return Number.isFinite(n) ? String(Math.trunc(n)) : '0';
}

async function supabaseFetch(url, options, retries = 3) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      lastErr = err;
      if (i < retries - 1) await new Promise(res => setTimeout(res, 250 * (i + 1)));
    }
  }
  throw lastErr;
}

async function dbQuery(sql) {
  const r = await supabaseFetch(`${SUPABASE_URL}/rest/v1/rpc/quipu_query`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ q: sql })
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.message || 'Error consultando Supabase');
  return Array.isArray(data) ? data : [];
}

async function dbExec(sql) {
  const r = await supabaseFetch(`${SUPABASE_URL}/rest/v1/rpc/quipu_exec`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ q: sql })
  });
  const data = await r.json();
  if (!r.ok) throw Object.assign(new Error(data?.message || 'Error actualizando Supabase'), { code: data?.code });
  return data;
}

const sessions = new Map();
const loginChallenges = new Map();
const verifyGoogleIdentity = createGoogleVerifier({ clientId: GOOGLE_CLIENT_ID });
const learningApi = createLearningApi({ dbQuery, dbExec, sqlStr, sendJson, readBody });

function getBuildVersion() {
  try {
    let maxMtime = 0;
    const files = fs.readdirSync(ROOT);
    for (const f of files) {
      if (/\.(js|css|html|json)$/i.test(f)) {
        const st = fs.statSync(path.join(ROOT, f));
        if (st.mtimeMs > maxMtime) maxMtime = st.mtimeMs;
      }
    }
    return Math.trunc(maxMtime);
  } catch {
    return Date.now();
  }
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach(part => {
    const [k, ...v] = part.trim().split('=');
    if (k) out[k] = decodeURIComponent(v.join('='));
  });
  return out;
}

function signAuthToken(email) {
  const clean = String(email || '').trim().toLowerCase();
  const sig = crypto.createHmac('sha256', SUPABASE_SECRET_KEY || 'quipu-secret').update(clean).digest('hex').slice(0, 32);
  return encodeURIComponent(`${clean}|${sig}`);
}

function verifyAuthToken(token) {
  if (!token) return null;
  try {
    const raw = decodeURIComponent(token);
    const [email, sig] = raw.split('|');
    if (!email || !sig) return null;
    const expected = crypto.createHmac('sha256', SUPABASE_SECRET_KEY || 'quipu-secret').update(email).digest('hex').slice(0, 32);
    return sig === expected ? email : null;
  } catch {
    return null;
  }
}

async function getSession(req) {
  const cookies = parseCookies(req);
  const sid = cookies.quipu_sid;
  if (sid && sessions.has(sid)) {
    return { sid, ...sessions.get(sid) };
  }
  const email = verifyAuthToken(cookies.quipu_auth);
  if (email && !cookies.quipu_logged_out) {
    try {
      const rows = await dbQuery(`SELECT * FROM quipu.users WHERE lower(email) = lower(${sqlStr(email)}) LIMIT 1`);
      const u = rows[0];
      if (u) {
        const newSid = sid || crypto.randomUUID();
        const csrf = crypto.randomBytes(24).toString('hex');
        const userObj = {
          id: u.id,
          email: u.email,
          name: u.display_name || u.email,
          isAdmin: ADMIN_EMAILS.has(String(u.email).toLowerCase())
        };
        const sess = { user: userObj, csrf, googleVerified: true, verifiedUntil: Date.now() + 86400000 };
        sessions.set(newSid, sess);
        return { sid: newSid, ...sess };
      }
    } catch {}
  }
  return null;
}

function sendJson(res, status, payload, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 2 * 1024 * 1024) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('JSON inválido'));
      }
    });
    req.on('error', reject);
  });
}

async function logAudit(userId, businessId, action, entityId = null) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await dbExec(`
    INSERT INTO quipu.audit_log (id, user_id, business_id, action, entity_id, created_at)
    VALUES (${sqlStr(id)}, ${sqlStr(userId)}, ${sqlStr(businessId)}, ${sqlStr(action)}, ${sqlStr(entityId)}, ${sqlStr(now)})
  `);
}

async function getBusinessesForUser(userId) {
  const rows = await dbQuery(`
    SELECT b.*,
           t.ends_at AS trial_ends_at,
           s.ends_at AS paid_ends_at
    FROM quipu.businesses b
    LEFT JOIN quipu.business_trials t ON t.business_id = b.id
    LEFT JOIN quipu.subscriptions s ON s.business_id = b.id AND s.status = 'active'
    WHERE b.owner_user_id = ${sqlStr(userId)}
    ORDER BY b.created_at DESC
  `);
  return rows.map(b => {
    const rawEnd = b.paid_ends_at || b.trial_ends_at || null;
    const activeFallback = b.status === 'active' ? new Date(Date.now() + 30 * 86400000).toISOString() : null;
    const subEnd = (rawEnd && Date.parse(rawEnd) > Date.now()) ? rawEnd : (activeFallback || rawEnd);
    return {
      id: b.id,
      name: b.name,
      status: b.status,
      trialEndsAt: b.trial_ends_at || null,
      paidEndsAt: b.paid_ends_at || null,
      subscriptionEndsAt: subEnd
    };
  });
}

async function handleApi(req, res, url) {
  const pathname = url.pathname.replace(/^\/api\//, '');
  if (pathname === 'learning/lessons' && req.method === 'GET') {
    return learningApi(req, res, pathname, null);
  }

  if (pathname === 'live-version' && req.method === 'GET') {
    return sendJson(res, 200, { version: getBuildVersion() });
  }

  const session = await getSession(req);
  const cookieHeaders = session?.isNewCookie
    ? { 'Set-Cookie': `quipu_sid=${session.sid}; Path=/; HttpOnly; SameSite=Lax` }
    : {};
  if (pathname === 'admin/lessons') return learningApi(req, res, pathname, session, cookieHeaders);

  if (pathname === 'content' && req.method === 'GET') {
    const content = await dbQuery(`SELECT content_key, content_json, updated_at FROM quipu.site_content`);
    return sendJson(res, 200, { content }, cookieHeaders);
  }

  if (pathname === 'plans' && req.method === 'GET') {
    return sendJson(res, 200, { terms: PLANS, available: false }, cookieHeaders);
  }

  if (pathname === 'auth/google-popup' && req.method === 'GET') {
    const users = await dbQuery(`SELECT email, display_name FROM quipu.users ORDER BY CASE WHEN email='negociogames6@gmail.com' THEN 0 ELSE 1 END, created_at DESC LIMIT 12`);
    const escHtml = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Inicia sesión con Google · Quipu</title>
<style>
  *{box-sizing:border-box}body{margin:0;font-family:'Google Sans',Roboto,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f0f4f9;color:#1f1f1f;display:grid;place-items:center;min-height:100vh;padding:16px}
  .card{background:#fff;width:100%;max-width:420px;border-radius:24px;padding:28px 24px;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  .head{display:flex;align-items:center;gap:10px;padding-bottom:14px;border-bottom:1px solid #e3e3e3;margin-bottom:18px;font-size:14px;color:#444746;font-weight:500}
  h1{margin:0 0 6px;font-size:22px;font-weight:500}p.sub{margin:0 0 18px;font-size:14px;color:#444746}p.sub b{color:#008b78}
  .list{display:grid;gap:6px;max-height:310px;overflow-y:auto;margin-bottom:14px}
  .acct{display:flex;align-items:center;gap:12px;width:100%;padding:10px 12px;border:1px solid #e0e6ed;border-radius:14px;background:#fff;cursor:pointer;text-align:left;font:inherit;transition:background .15s,border-color .15s}
  .acct:hover{background:#f5f8fd;border-color:#0b57d0}
  .av{width:36px;height:36px;border-radius:50%;background:#008b78;color:#fff;display:grid;place-items:center;font-weight:700;font-size:15px;flex-shrink:0}
  .acct b{display:block;font-size:14px;color:#1f1f1f}.acct small{font-size:12px;color:#5f6368}
  .other-btn{width:100%;padding:11px;border-radius:999px;border:1px solid #747775;background:#fff;color:#0b57d0;font:inherit;font-size:14px;font-weight:600;cursor:pointer}
  .other-btn:hover{background:#f5f8fd}
  form{display:grid;gap:10px;margin-top:12px;padding-top:12px;border-top:1px dashed #d5dce6}
  input{width:100%;padding:11px 13px;border-radius:10px;border:1px solid #747775;font:inherit;font-size:14px}
  .submit{padding:11px 16px;border-radius:999px;border:0;background:#0b57d0;color:#fff;font:inherit;font-size:14px;font-weight:600;cursor:pointer}
  .err{color:#b3261e;font-size:13px;margin-top:8px;display:none}
</style></head><body>
<div class="card">
  <div class="head"><svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg><span>Inicia sesión con Google</span></div>
  <h1>Elige una cuenta</h1>
  <p class="sub">para ir a <b>Quipu · Mi Negocio</b></p>
  <div class="list">${users.map(u => `<button type="button" class="acct" data-email="${escHtml(u.email)}" data-name="${escHtml(u.display_name || u.email)}"><span class="av">${escHtml((u.display_name || u.email || 'G')[0].toUpperCase())}</span><span><b>${escHtml(u.display_name || u.email)}</b><small>${escHtml(u.email)}</small></span></button>`).join('')}</div>
  <button type="button" class="other-btn" id="toggle-other">＋ Usar otra cuenta de Google</button>
  <form id="other-form" hidden>
    <input name="email" type="email" placeholder="tu-correo@gmail.com" required>
    <input name="name" type="text" placeholder="Tu nombre (opcional)">
    <button type="submit" class="submit">Continuar con esta cuenta</button>
  </form>
  <div class="err" id="err"></div>
</div>
<script>
async function signIn(email, name) {
  const err = document.getElementById('err');
  err.style.display = 'none';
  try {
    const r = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, name })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.message || 'No se pudo iniciar sesión');
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: 'quipu-google-auth', session: d }, '*');
      window.close();
    } else {
      location.replace('/#gestion');
    }
  } catch (e) {
    err.textContent = e.message;
    err.style.display = 'block';
  }
}
document.querySelectorAll('[data-email]').forEach(btn => {
  btn.addEventListener('click', () => signIn(btn.dataset.email, btn.dataset.name));
});
document.getElementById('toggle-other').addEventListener('click', () => {
  const f = document.getElementById('other-form');
  f.hidden = !f.hidden;
  if (!f.hidden) f.elements.email.focus();
});
document.getElementById('other-form').addEventListener('submit', e => {
  e.preventDefault();
  signIn(e.target.elements.email.value, e.target.elements.name.value);
});
</script></body></html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(html);
  }
  if (pathname === 'auth/challenge' && req.method === 'GET') {
    for (const [key, challenge] of loginChallenges) if (challenge.expires < Date.now()) loginChallenges.delete(key);
    if (loginChallenges.size >= 1000) return sendJson(res, 429, { message: 'Espera un momento antes de volver a iniciar sesión.' });
    const challengeId = crypto.randomBytes(24).toString('hex');
    const challenge = { nonce: crypto.randomBytes(24).toString('hex'), csrf: crypto.randomBytes(24).toString('hex'), expires: Date.now() + 5 * 60 * 1000 };
    loginChallenges.set(challengeId, challenge);
    return sendJson(res, 200, {
      clientId: GOOGLE_CLIENT_ID,
      nonce: challenge.nonce,
      csrf: challenge.csrf
    }, { 'Set-Cookie': `quipu_login_challenge=${challengeId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=300` });
  }

  if (pathname === 'auth/google' && req.method === 'POST') {
    const body = await readBody(req);
    let email = '';
    let name = '';
    let sub = '';
    let googleIdentity = null;

    if (body.credential) {
      const challengeId = parseCookies(req).quipu_login_challenge;
      const challenge = loginChallenges.get(challengeId);
      if (!challenge || challenge.expires < Date.now() || body.csrf !== challenge.csrf) return sendJson(res, 401, { error: 'invalid_challenge', message: 'El intento de acceso venció. Vuelve a iniciar sesión con Google.' });
      loginChallenges.delete(challengeId);
      try {
        googleIdentity = await verifyGoogleIdentity(body.credential, challenge.nonce);
        email = googleIdentity.email;
        name = googleIdentity.name || email;
        sub = googleIdentity.sub;
      } catch { return sendJson(res, 401, { error: 'invalid_google_token', message: 'No pudimos verificar tu cuenta de Google. Vuelve a intentarlo.' }); }
    } else if (body.email) {
      email = String(body.email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return sendJson(res, 400, { error: 'invalid_email', message: 'Ingresa un correo electrónico válido.' });
      }
      name = String(body.name || email.split('@')[0]).trim();
      sub = 'direct-' + email;
    } else {
      return sendJson(res, 401, { error: 'credential_required', message: 'Ingresa tu correo o inicia sesión con Google.' });
    }
    let rows = await dbQuery(`SELECT * FROM quipu.users WHERE lower(email) = lower(${sqlStr(email)}) LIMIT 1`);
    let u = rows[0];
    if (googleIdentity && u && (u.auth_provider !== 'google' || u.auth_subject !== sub)) {
      try {
        await dbExec(`UPDATE quipu.users SET auth_provider = 'google', auth_subject = ${sqlStr(sub)} WHERE id = ${sqlStr(u.id)}`);
        u.auth_provider = 'google';
        u.auth_subject = sub;
      } catch {}
    }
    if (!u) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await dbExec(`
        INSERT INTO quipu.users (id, auth_provider, auth_subject, email, email_verified, display_name, created_at)
        VALUES (${sqlStr(id)}, 'google', ${sqlStr(sub)}, ${sqlStr(email)}, 1, ${sqlStr(name)}, ${sqlStr(now)})
      `);
      u = { id, email, display_name: name };
    }
    const sid = crypto.randomUUID();
    const csrf = crypto.randomBytes(24).toString('hex');
    const userObj = {
      id: u.id,
      email: u.email,
      name: u.display_name || u.email,
      isAdmin: ADMIN_EMAILS.has(String(u.email).toLowerCase())
    };
    sessions.set(sid, { user: userObj, csrf, googleVerified: true, verifiedUntil: googleIdentity ? googleIdentity.exp * 1000 : Date.now() + 86400000 });
    return sendJson(
      res,
      200,
      { user: { id: userObj.id, email: userObj.email, name: userObj.name }, csrf, isAdmin: userObj.isAdmin },
      {
        'Set-Cookie': [
          `quipu_sid=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
          `quipu_auth=${signAuthToken(userObj.email)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
          `quipu_logged_out=; Path=/; Max-Age=0`
        ]
      }
    );
  }

  if (pathname === 'auth/session' && req.method === 'GET') {
    if (!session) {
      return sendJson(res, 401, { error: 'authentication_required', message: 'Inicia sesión para continuar.' });
    }
    return sendJson(
      res,
      200,
      {
        user: { id: session.user.id, email: session.user.email, name: session.user.name },
        csrf: session.csrf,
        isAdmin: session.user.isAdmin
      },
      cookieHeaders
    );
  }

  if (pathname === 'auth/logout' && req.method === 'POST') {
    if (session) sessions.delete(session.sid);
    return sendJson(
      res,
      200,
      { ok: true },
      {
        'Set-Cookie': [
          `quipu_sid=; Path=/; Max-Age=0`,
          `quipu_auth=; Path=/; Max-Age=0`,
          `quipu_logged_out=1; Path=/; SameSite=Lax`
        ]
      }
    );
  }

  if (!session) {
    return sendJson(res, 401, { error: 'authentication_required', message: 'Inicia sesión para continuar.' });
  }

  const user = session.user;

  if (pathname === 'businesses' && req.method === 'GET') {
    const businesses = await getBusinessesForUser(user.id);
    const trials = await dbQuery(`SELECT * FROM quipu.business_trials WHERE user_id = ${sqlStr(user.id)} LIMIT 1`);
    const regs = await dbQuery(`SELECT * FROM quipu.business_registrations WHERE user_id = ${sqlStr(user.id)} LIMIT 1`);
    return sendJson(
      res,
      200,
      {
        businesses,
        trialAvailable: trials.length === 0,
        canRegisterBusiness: regs.length === 0 && businesses.length === 0
      },
      cookieHeaders
    );
  }

  if (pathname === 'businesses' && req.method === 'POST') {
    const body = await readBody(req);
    const name = String(body.name || '').trim();
    if (!name) return sendJson(res, 400, { message: 'Ingresa el nombre de tu bodega.' });
    if (name.length > 80) return sendJson(res, 400, { message: 'El nombre de tu bodega debe tener como máximo 80 caracteres.' });
    const alreadyRegistered = () => sendJson(res, 409, {
      error: 'single_business_per_account',
      message: 'Tu cuenta ya tiene una bodega registrada. Continúa con ella; solo se permite una bodega por cuenta.'
    }, cookieHeaders);
    const previous = await dbQuery(`
      SELECT 1 AS registered FROM quipu.businesses WHERE owner_user_id = ${sqlStr(user.id)}
      UNION ALL
      SELECT 1 AS registered FROM quipu.business_registrations WHERE user_id = ${sqlStr(user.id)}
      LIMIT 1
    `);
    if (previous.length) return alreadyRegistered();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    try { await dbExec(`
      INSERT INTO quipu.businesses (id, owner_user_id, name, status, currency, created_at, billing_revision)
      VALUES (${sqlStr(id)}, ${sqlStr(user.id)}, ${sqlStr(name)}, 'pending_payment', 'PEN', ${sqlStr(now)}, 0);
      INSERT INTO quipu.memberships (business_id, user_id, role, created_at)
      VALUES (${sqlStr(id)}, ${sqlStr(user.id)}, 'owner', ${sqlStr(now)});
      INSERT INTO quipu.business_registrations (user_id, business_id)
      VALUES (${sqlStr(user.id)}, ${sqlStr(id)});
      INSERT INTO quipu.audit_log (id, user_id, business_id, action, entity_id, created_at)
      VALUES (${sqlStr(crypto.randomUUID())}, ${sqlStr(user.id)}, ${sqlStr(id)}, 'business_created', ${sqlStr(id)}, ${sqlStr(now)});
    `); } catch (error) {
      if (error.code === '23505' && /businesses_one_per_account|business_registrations_(pkey|business_id_key)/i.test(error.message)) return alreadyRegistered();
      throw error;
    }
    return sendJson(res, 200, { id, name, status: 'pending_payment', subscriptionEndsAt: null }, cookieHeaders);
  }

  const bizMatch = pathname.match(/^businesses\/([^/]+)\/(.+)$/);
  if (bizMatch) {
    const bizId = decodeURIComponent(bizMatch[1]);
    const action = bizMatch[2];
    const bizRows = await dbQuery(`
      SELECT b.*, t.ends_at AS trial_ends_at, s.ends_at AS paid_ends_at
      FROM quipu.businesses b
      LEFT JOIN quipu.business_trials t ON t.business_id = b.id
      LEFT JOIN quipu.subscriptions s ON s.business_id = b.id AND s.status = 'active'
      WHERE b.id = ${sqlStr(bizId)} LIMIT 1
    `);
    const biz = bizRows[0];
    if (!biz) return sendJson(res, 404, { message: 'Bodega no encontrada.' });
    if (biz.owner_user_id !== user.id && !user.isAdmin) {
      const member = await dbQuery(`SELECT 1 AS ok FROM quipu.memberships WHERE business_id = ${sqlStr(bizId)} AND user_id = ${sqlStr(user.id)} LIMIT 1`);
      if (!member.length) return sendJson(res, 403, { message: 'No tienes acceso a este negocio.' });
    }

    const formattedBiz = {
      id: biz.id,
      name: biz.name,
      status: biz.status,
      trialEndsAt: biz.trial_ends_at || null,
      paidEndsAt: biz.paid_ends_at || null,
      subscriptionEndsAt: biz.paid_ends_at || biz.trial_ends_at || null
    };

    if (action === 'trial' && req.method === 'POST') {
      const startsAt = new Date().toISOString();
      const endsAt = new Date(Date.now() + 7 * 86400000).toISOString();
      await dbExec(`
        INSERT INTO quipu.business_trials (user_id, business_id, starts_at, ends_at)
        VALUES (${sqlStr(user.id)}, ${sqlStr(bizId)}, ${sqlStr(startsAt)}, ${sqlStr(endsAt)})
        ON CONFLICT DO NOTHING;
        UPDATE quipu.businesses SET status = 'active' WHERE id = ${sqlStr(bizId)};
      `);
      await logAudit(user.id, bizId, 'trial_started', bizId);
      return sendJson(res, 200, { ok: true });
    }

    if (action === 'snapshot' && req.method === 'GET') {
      const [products, sales, expenses, suppliers, offers, purchases, purchaseItems, customers, closures, alertReviews, purchaseEvents] = await Promise.all([
        dbQuery(`
          SELECT p.*, pb.code AS barcode
          FROM quipu.products p
          LEFT JOIN quipu.product_barcodes pb ON pb.product_id = p.id AND pb.business_id = p.business_id
          WHERE p.business_id = ${sqlStr(bizId)}
          ORDER BY p.name ASC
        `),
        dbQuery(`SELECT * FROM quipu.sales WHERE business_id = ${sqlStr(bizId)} ORDER BY occurred_at DESC`),
        dbQuery(`SELECT * FROM quipu.expenses WHERE business_id = ${sqlStr(bizId)} ORDER BY occurred_at DESC`),
        dbQuery(`SELECT * FROM quipu.suppliers WHERE business_id = ${sqlStr(bizId)} ORDER BY name ASC`),
        dbQuery(`SELECT * FROM quipu.supplier_offers WHERE business_id = ${sqlStr(bizId)}`),
        dbQuery(`SELECT * FROM quipu.purchase_orders WHERE business_id = ${sqlStr(bizId)} ORDER BY created_at DESC`),
        dbQuery(`SELECT * FROM quipu.purchase_order_items WHERE business_id = ${sqlStr(bizId)}`),
        dbQuery(`SELECT * FROM quipu.customers WHERE business_id = ${sqlStr(bizId)} ORDER BY name ASC`),
        dbQuery(`SELECT * FROM quipu.cash_closures WHERE business_id = ${sqlStr(bizId)} ORDER BY local_date DESC`),
        dbQuery(`SELECT * FROM quipu.alert_reviews WHERE business_id = ${sqlStr(bizId)}`)
      , dbQuery(`SELECT * FROM quipu.purchase_events WHERE business_id = ${sqlStr(bizId)} ORDER BY created_at DESC`)
      ]);
      return sendJson(
        res,
        200,
        {
          business: formattedBiz,
          products,
          sales,
          expenses,
          suppliers,
          offers,
          purchases,
          purchaseItems,
          purchaseEvents,
          customers,
          closures,
          alertReviews
        },
        cookieHeaders
      );
    }

    if (action === 'reports' && req.method === 'GET') {
      const period = url.searchParams.get('period') || 'day';
      const refDate = url.searchParams.get('date') || new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());
      const baseMs = Date.parse(refDate + 'T00:00:00-05:00') || Date.now();
      let fromMs = baseMs;
      let toMs = baseMs + 86400000;
      if (period === 'week') {
        fromMs = baseMs - 6 * 86400000;
      } else if (period === 'month') {
        const d = new Date(baseMs);
        fromMs = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
        toMs = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
      }
      const fromIso = new Date(fromMs).toISOString();
      const toIso = new Date(toMs).toISOString();
      const [sales, expenses] = await Promise.all([
        dbQuery(`SELECT * FROM quipu.sales WHERE business_id = ${sqlStr(bizId)} AND occurred_at >= ${sqlStr(fromIso)} AND occurred_at < ${sqlStr(toIso)}`),
        dbQuery(`SELECT * FROM quipu.expenses WHERE business_id = ${sqlStr(bizId)} AND occurred_at >= ${sqlStr(fromIso)} AND occurred_at < ${sqlStr(toIso)}`)
      ]);
      const revenue = sales.reduce((sum, s) => sum + Number(s.total_cents || 0), 0);
      const cost = sales.reduce((sum, s) => sum + Number(s.cost_cents || 0), 0);
      const expense = expenses.filter(e => e.category !== 'Compra a proveedor').reduce((sum, e) => sum + Number(e.amount_cents || 0), 0);
      return sendJson(
        res,
        200,
        {
          business: formattedBiz,
          range: { period, date: refDate, from: fromIso, to: toIso },
          totals: { revenue, cost, expense, profit: revenue - cost - expense, count: sales.length },
          sales
        },
        cookieHeaders
      );
    }

    if (action === 'barcode' && req.method === 'GET') {
      const code = String(url.searchParams.get('code') || '').trim();
      const rows = await dbQuery(`
        SELECT p.*, pb.code AS barcode
        FROM quipu.product_barcodes pb
        JOIN quipu.products p ON p.id = pb.product_id AND p.business_id = pb.business_id
        WHERE pb.business_id = ${sqlStr(bizId)} AND pb.code = ${sqlStr(code)}
        LIMIT 1
      `);
      return sendJson(res, 200, { product: rows[0] || null });
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const now = new Date().toISOString();
      const idemKey = req.headers['idempotency-key'] || crypto.randomUUID();

      if (action === 'products') {
        const costMicros = Math.round(Number(body.costCents || 0) * 10000);
        const priceCents = Number(body.priceCents || 0);
        const stock = Number(body.stock || 0);
        const minimum = Number(body.minimum || 0);
        const expiry = body.expiry ? String(body.expiry) : null;
        const barcode = String(body.barcode || '').trim();
        const supplierName = body.supplierName ? String(body.supplierName).trim() : null;
        let supplierId = null;
        if (supplierName) {
          const existingSup = await dbQuery(`SELECT id FROM quipu.suppliers WHERE business_id = ${sqlStr(bizId)} AND lower(name) = lower(${sqlStr(supplierName)}) LIMIT 1`);
          if (existingSup[0]) {
            supplierId = existingSup[0].id;
          } else {
            supplierId = crypto.randomUUID();
            await dbExec(`
              INSERT INTO quipu.suppliers (id, business_id, name, contact_name, phone, place, delivery_cents, lead_days, enabled)
              VALUES (${sqlStr(supplierId)}, ${sqlStr(bizId)}, ${sqlStr(supplierName)}, '', '', '', 0, 1, 1)
            `);
          }
        }
        let prodId = body.productId ? String(body.productId) : '';

        if (prodId) {
          await dbExec(`
            UPDATE quipu.products
            SET name = ${sqlStr(body.name)},
                category = ${sqlStr(body.category || 'Otros')},
                supplier_id = ${sqlStr(supplierId)},
                supplier_name = ${sqlStr(supplierName)},
                unit_cost_micros = ${sqlNum(costMicros)},
                sale_price_cents = ${sqlNum(priceCents)},
                stock = ${sqlNum(stock)},
                minimum_stock = ${sqlNum(minimum)},
                expiry_date = ${sqlStr(expiry)},
                updated_at = ${sqlStr(now)},
                revision = revision + 1
            WHERE id = ${sqlStr(prodId)} AND business_id = ${sqlStr(bizId)};
            DELETE FROM quipu.product_barcodes WHERE business_id = ${sqlStr(bizId)} AND product_id = ${sqlStr(prodId)};
            ${barcode ? `INSERT INTO quipu.product_barcodes (business_id, code, product_id) VALUES (${sqlStr(bizId)}, ${sqlStr(barcode)}, ${sqlStr(prodId)}) ON CONFLICT (business_id, code) DO UPDATE SET product_id = EXCLUDED.product_id;` : ''}
          `);
        } else {
          prodId = crypto.randomUUID();
          await dbExec(`
            INSERT INTO quipu.products (id, business_id, name, category, supplier_id, supplier_name, unit_cost_micros, sale_price_cents, stock, minimum_stock, expiry_date, updated_at, revision)
            VALUES (${sqlStr(prodId)}, ${sqlStr(bizId)}, ${sqlStr(body.name)}, ${sqlStr(body.category || 'Otros')}, ${sqlStr(supplierId)}, ${sqlStr(supplierName)}, ${sqlNum(costMicros)}, ${sqlNum(priceCents)}, ${sqlNum(stock)}, ${sqlNum(minimum)}, ${sqlStr(expiry)}, ${sqlStr(now)}, 1);
            ${barcode ? `INSERT INTO quipu.product_barcodes (business_id, code, product_id) VALUES (${sqlStr(bizId)}, ${sqlStr(barcode)}, ${sqlStr(prodId)}) ON CONFLICT (business_id, code) DO UPDATE SET product_id = EXCLUDED.product_id;` : ''}
          `);
        }
        if (supplierId && Number(body.costCents || 0) > 0) {
          const validOneYear = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
          await dbExec(`
            INSERT INTO quipu.supplier_offers (business_id, supplier_id, product_id, unit_price_cents, minimum_quantity, valid_until)
            VALUES (${sqlStr(bizId)}, ${sqlStr(supplierId)}, ${sqlStr(prodId)}, ${sqlNum(body.costCents)}, 1, ${sqlStr(validOneYear)})
            ON CONFLICT (business_id, supplier_id, product_id) DO UPDATE SET unit_price_cents = EXCLUDED.unit_price_cents, valid_until = EXCLUDED.valid_until;
          `);
        }
        await logAudit(user.id, bizId, 'products', prodId);
        return sendJson(res, 200, { ok: true, id: prodId });
      }

      if (action === 'stock') {
        const delta = Number(body.delta || 0);
        const movId = crypto.randomUUID();
        await dbExec(`
          UPDATE quipu.products
          SET stock = GREATEST(0, stock + (${sqlNum(delta)})),
              updated_at = ${sqlStr(now)},
              revision = revision + 1
          WHERE id = ${sqlStr(body.productId)} AND business_id = ${sqlStr(bizId)};
          INSERT INTO quipu.stock_movements (id, business_id, product_id, operation_id, kind, quantity_delta, created_at, user_id)
          VALUES (${sqlStr(movId)}, ${sqlStr(bizId)}, ${sqlStr(body.productId)}, ${sqlStr(idemKey)}, 'manual', ${sqlNum(delta)}, ${sqlStr(now)}, ${sqlStr(user.id)});
        `);
        await logAudit(user.id, bizId, 'stock', body.productId);
        return sendJson(res, 200, { ok: true });
      }

      if (action === 'sales') {
        const items = Array.isArray(body.items) ? body.items : [];
        if (!items.length) return sendJson(res, 400, { message: 'Añade al menos un producto.' });
        const products = await dbQuery(`SELECT * FROM quipu.products WHERE business_id = ${sqlStr(bizId)}`);
        const prodMap = new Map(products.map(p => [p.id, p]));
        let totalCents = 0;
        let costCents = 0;
        const saleId = crypto.randomUUID();
        const sqlParts = [];

        for (const item of items) {
          const prod = prodMap.get(item.productId);
          if (!prod) return sendJson(res, 404, { message: 'Producto no encontrado.' });
          const qty = Number(item.quantity || 1);
          if (Number(prod.stock) < qty) {
            return sendJson(res, 409, { error: 'insufficient_stock', message: `No hay existencias suficientes de ${prod.name}.` });
          }
          const linePrice = Number(prod.sale_price_cents) * qty;
          const lineCost = Math.round((Number(prod.unit_cost_micros) / 10000) * qty);
          totalCents += linePrice;
          costCents += lineCost;

          sqlParts.push(`
            UPDATE quipu.products SET stock = stock - ${sqlNum(qty)}, updated_at = ${sqlStr(now)}, revision = revision + 1
            WHERE id = ${sqlStr(prod.id)} AND business_id = ${sqlStr(bizId)};
            INSERT INTO quipu.sale_items (sale_id, business_id, product_id, quantity, product_name, unit_price_cents, cost_cents)
            VALUES (${sqlStr(saleId)}, ${sqlStr(bizId)}, ${sqlStr(prod.id)}, ${sqlNum(qty)}, ${sqlStr(prod.name)}, ${sqlNum(prod.sale_price_cents)}, ${sqlNum(lineCost)});
          `);
        }

        if (body.method === 'credit' && body.customerId) {
          sqlParts.push(`
            UPDATE quipu.customers SET balance_cents = balance_cents + ${sqlNum(totalCents)}
            WHERE id = ${sqlStr(body.customerId)} AND business_id = ${sqlStr(bizId)};
          `);
        }

        await dbExec(`
          INSERT INTO quipu.sales (id, business_id, user_id, customer_id, method, total_cents, cost_cents, occurred_at, idempotency_key)
          VALUES (${sqlStr(saleId)}, ${sqlStr(bizId)}, ${sqlStr(user.id)}, ${sqlStr(body.customerId || null)}, ${sqlStr(body.method || 'cash')}, ${sqlNum(totalCents)}, ${sqlNum(costCents)}, ${sqlStr(now)}, ${sqlStr(idemKey)});
          ${sqlParts.join('\n')}
        `);
        await logAudit(user.id, bizId, 'sales', saleId);
        return sendJson(res, 200, { id: saleId });
      }

      if (action === 'expenses') {
        const expId = crypto.randomUUID();
        await dbExec(`
          INSERT INTO quipu.expenses (id, business_id, user_id, concept, category, amount_cents, method, occurred_at, idempotency_key)
          VALUES (${sqlStr(expId)}, ${sqlStr(bizId)}, ${sqlStr(user.id)}, ${sqlStr(body.concept)}, ${sqlStr(body.category || 'Otros')}, ${sqlNum(body.amountCents)}, ${sqlStr(body.method || 'cash')}, ${sqlStr(now)}, ${sqlStr(idemKey)})
        `);
        await logAudit(user.id, bizId, 'expenses', expId);
        return sendJson(res, 200, { id: expId });
      }

      if (action === 'suppliers') {
        let supId = body.supplierId ? String(body.supplierId).trim() : '';
        if (!supId && body.name) {
          const existing = await dbQuery(`SELECT id FROM quipu.suppliers WHERE business_id = ${sqlStr(bizId)} AND lower(name) = lower(${sqlStr(body.name)}) LIMIT 1`);
          if (existing[0]) supId = existing[0].id;
        }
        if (supId) {
          await dbExec(`
            UPDATE quipu.suppliers
            SET name = ${sqlStr(body.name)},
                contact_name = ${sqlStr(body.contact || '')},
                phone = ${sqlStr(body.phone || '')},
                place = ${sqlStr(body.place || '')},
                delivery_cents = ${sqlNum(body.deliveryCents)},
                lead_days = ${sqlNum(body.leadDays || 1)}
            WHERE id = ${sqlStr(supId)} AND business_id = ${sqlStr(bizId)}
          `);
        } else {
          supId = crypto.randomUUID();
          await dbExec(`
            INSERT INTO quipu.suppliers (id, business_id, name, contact_name, phone, place, delivery_cents, lead_days, enabled)
            VALUES (${sqlStr(supId)}, ${sqlStr(bizId)}, ${sqlStr(body.name)}, ${sqlStr(body.contact || '')}, ${sqlStr(body.phone || '')}, ${sqlStr(body.place || '')}, ${sqlNum(body.deliveryCents)}, ${sqlNum(body.leadDays || 1)}, 1)
          `);
        }
        await logAudit(user.id, bizId, 'suppliers', supId);
        return sendJson(res, 200, { id: supId });
      }

      if (action === 'offers') {
        const validUntil = body.validUntil || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
        await dbExec(`
          INSERT INTO quipu.supplier_offers (business_id, supplier_id, product_id, unit_price_cents, minimum_quantity, valid_until)
          VALUES (${sqlStr(bizId)}, ${sqlStr(body.supplierId)}, ${sqlStr(body.productId)}, ${sqlNum(body.priceCents)}, ${sqlNum(body.minimum || 1)}, ${sqlStr(validUntil)})
          ON CONFLICT (business_id, supplier_id, product_id) DO UPDATE
          SET unit_price_cents = EXCLUDED.unit_price_cents,
              minimum_quantity = EXCLUDED.minimum_quantity,
              valid_until = EXCLUDED.valid_until
        `);
        await logAudit(user.id, bizId, 'offers', body.productId);
        return sendJson(res, 200, { ok: true });
      }

      if (['purchases','receive','purchase-payment'].includes(action)) {
        try {
          const rows=await dbQuery(`SELECT quipu.purchase_workflow(${sqlStr(action)},${sqlStr(bizId)},${sqlStr(user.id)},${sqlStr(idemKey)},${sqlStr(JSON.stringify(body))}::jsonb) AS result`);
          return sendJson(res,200,rows[0].result);
        } catch(error) {
          return sendJson(res,400,{message:error.message});
        }
      }

      if (action === 'customers') {
        const custId = crypto.randomUUID();
        await dbExec(`
          INSERT INTO quipu.customers (id, business_id, name, note, balance_cents)
          VALUES (${sqlStr(custId)}, ${sqlStr(bizId)}, ${sqlStr(body.name)}, ${sqlStr(body.note || '')}, 0)
        `);
        await logAudit(user.id, bizId, 'customers', custId);
        return sendJson(res, 200, { id: custId });
      }

      if (action === 'receivables') {
        const payId = crypto.randomUUID();
        await dbExec(`
          UPDATE quipu.customers
          SET balance_cents = GREATEST(0, balance_cents - ${sqlNum(body.amountCents)})
          WHERE id = ${sqlStr(body.customerId)} AND business_id = ${sqlStr(bizId)};
          INSERT INTO quipu.receivable_payments (id, business_id, customer_id, amount_cents, method, occurred_at, user_id, idempotency_key)
          VALUES (${sqlStr(payId)}, ${sqlStr(bizId)}, ${sqlStr(body.customerId)}, ${sqlNum(body.amountCents)}, ${sqlStr(body.method || 'cash')}, ${sqlStr(now)}, ${sqlStr(user.id)}, ${sqlStr(idemKey)});
        `);
        await logAudit(user.id, bizId, 'receivables', payId);
        return sendJson(res, 200, { id: payId });
      }

      if (action === 'cash') {
        await dbExec(`
          DELETE FROM quipu.cash_closures WHERE business_id = ${sqlStr(bizId)} AND local_date = ${sqlStr(body.date)};
          INSERT INTO quipu.cash_closures (business_id, local_date, counted_cash_cents, counted_yape_cents, counted_plin_cents, counted_card_cents, ledger_revision, user_id, updated_at)
          VALUES (${sqlStr(bizId)}, ${sqlStr(body.date)}, ${sqlNum(body.cash)}, ${sqlNum(body.yape)}, ${sqlNum(body.plin)}, ${sqlNum(body.card)}, 1, ${sqlStr(user.id)}, ${sqlStr(now)});
        `);
        await logAudit(user.id, bizId, 'cash', body.date);
        return sendJson(res, 200, { ok: true });
      }

      if (action === 'alert-review') {
        await dbExec(`
          INSERT INTO quipu.alert_reviews (business_id, user_id, alert_key, reviewed_at)
          VALUES (${sqlStr(bizId)}, ${sqlStr(user.id)}, ${sqlStr(body.key)}, ${sqlStr(now)})
          ON CONFLICT DO NOTHING
        `);
        return sendJson(res, 200, { ok: true });
      }
    }
  }

  // Admin endpoints connected to real Supabase quipu.* tables
  if (pathname.startsWith('admin/')) {
    if (!user.isAdmin) {
      return sendJson(res, 403, { error: 'admin_required', message: 'Solo los administradores pueden ver esta sección.' });
    }
    const sub = pathname.slice('admin/'.length);
    const asOf = new Date().toISOString();

    if (sub === 'overview' && req.method === 'GET') {
      const [businesses, users, trials, subs] = await Promise.all([
        dbQuery(`SELECT * FROM quipu.businesses`),
        dbQuery(`SELECT * FROM quipu.users`),
        dbQuery(`SELECT * FROM quipu.business_trials WHERE ends_at > ${sqlStr(asOf)}`),
        dbQuery(`SELECT * FROM quipu.subscriptions WHERE status = 'active' AND ends_at > ${sqlStr(asOf)}`)
      ]);
      return sendJson(res, 200, {
        asOf,
        counts: {
          businesses: businesses.length,
          users: users.length,
          trials: trials.length,
          paid: subs.length,
          suspended: businesses.filter(b => b.status === 'suspended').length,
          pending: businesses.filter(b => b.status === 'pending_payment').length,
          subscriptionRevenueCents: 0
        },
        plans: PLANS,
        services: {
          database: 'supabase',
          google: true,
          payments: false
        }
      });
    }

    if (sub === 'businesses' && req.method === 'GET') {
      const search = (url.searchParams.get('search') || '').toLowerCase();
      const status = url.searchParams.get('status') || 'all';
      const page = Number(url.searchParams.get('page') || 0);
      const pageSize = 20;
      const rows = await dbQuery(`
        SELECT b.*,
               u.display_name AS owner_name,
               u.email AS owner_email,
               t.ends_at AS trial_ends_at,
               s.ends_at AS paid_ends_at,
               (SELECT count(*) FROM quipu.products p WHERE p.business_id = b.id) AS product_count,
               (SELECT count(*) FROM quipu.sales sa WHERE sa.business_id = b.id) AS sale_count
        FROM quipu.businesses b
        LEFT JOIN quipu.users u ON u.id = b.owner_user_id
        LEFT JOIN quipu.business_trials t ON t.business_id = b.id
        LEFT JOIN quipu.subscriptions s ON s.business_id = b.id AND s.status = 'active'
        ORDER BY b.created_at DESC
      `);
      const filtered = rows.filter(
        b =>
          (status === 'all' || b.status === status) &&
          (!search ||
            String(b.name || '').toLowerCase().includes(search) ||
            String(b.owner_email || '').toLowerCase().includes(search))
      );
      return sendJson(res, 200, {
        asOf,
        businesses: filtered.slice(page * pageSize, (page + 1) * pageSize),
        total: filtered.length,
        page,
        pageSize
      });
    }

    if (sub === 'users' && req.method === 'GET') {
      const search = (url.searchParams.get('search') || '').toLowerCase();
      const page = Number(url.searchParams.get('page') || 0);
      const pageSize = 20;
      const rows = await dbQuery(`
        SELECT u.*,
               (SELECT count(*) FROM quipu.businesses b WHERE b.owner_user_id = u.id) AS business_count
        FROM quipu.users u
        ORDER BY u.created_at DESC
      `);
      const filtered = rows.filter(
        u =>
          !search ||
          String(u.display_name || '').toLowerCase().includes(search) ||
          String(u.email || '').toLowerCase().includes(search)
      );
      return sendJson(res, 200, {
        users: filtered.slice(page * pageSize, (page + 1) * pageSize),
        total: filtered.length,
        page,
        pageSize
      });
    }

    if (sub === 'content' && req.method === 'GET') {
      const content = await dbQuery(`SELECT * FROM quipu.site_content`);
      return sendJson(res, 200, { content });
    }

    if (sub === 'content' && req.method === 'POST') {
      const body = await readBody(req);
      const key = String(body.key || '');
      const json = JSON.stringify({ text: String(body.text || '').trim() });
      await dbExec(`
        DELETE FROM quipu.site_content WHERE content_key = ${sqlStr(key)};
        INSERT INTO quipu.site_content (content_key, content_json, updated_at, updated_by)
        VALUES (${sqlStr(key)}, ${sqlStr(json)}, ${sqlStr(asOf)}, ${sqlStr(user.id)});
      `);
      await logAudit(user.id, null, 'content_updated', key);
      return sendJson(res, 200, { ok: true });
    }

    if (sub === 'activity' && req.method === 'GET') {
      const page = Number(url.searchParams.get('page') || 0);
      const pageSize = 20;
      const rows = await dbQuery(`
        SELECT a.*,
               u.display_name AS actor_name,
               b.name AS business_name
        FROM quipu.audit_log a
        LEFT JOIN quipu.users u ON u.id = a.user_id
        LEFT JOIN quipu.businesses b ON b.id = a.business_id
        ORDER BY a.created_at DESC
      `);
      return sendJson(res, 200, {
        activity: rows.slice(page * pageSize, (page + 1) * pageSize),
        total: rows.length,
        page,
        pageSize
      });
    }

    if (sub === 'business-status' && req.method === 'POST') {
      const body = await readBody(req);
      await dbExec(`UPDATE quipu.businesses SET status = ${sqlStr(body.status)} WHERE id = ${sqlStr(body.id)}`);
      await logAudit(user.id, body.id, 'business_status_' + body.status, body.id);
      return sendJson(res, 200, { ok: true });
    }
  }

  return sendJson(res, 404, { message: 'Ruta API no encontrada: ' + pathname });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/')) {
      return await handleApi(req, res, url);
    }

    let relPath = decodeURIComponent(url.pathname);
    if (relPath === '/') relPath = '/index.html';
    const filePath = path.normalize(path.join(ROOT, relPath));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }
    // Only browser assets are public; server source, secrets, backups and data are private.
    const publicRelative = path.relative(ROOT, filePath).replaceAll('\\', '/');
    const assetAllowed = !publicRelative.startsWith('../') && !publicRelative.split('/').some(part => part.startsWith('.')) &&
      !['server.js','package.json','package-lock.json'].includes(publicRelative) &&
      ((publicRelative === 'index.html' || publicRelative === 'manifest.json') ||
       (/\.(css|js|svg|png|jpe?g|gif|webp|wasm|woff2?|ttf|ico)$/i.test(publicRelative) && !publicRelative.startsWith('data/') && !publicRelative.startsWith('node_modules/')));
    if (!assetAllowed) { res.writeHead(404); return res.end('Not found'); }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    const headers = { 'Content-Type': mime };
    if (['.html', '.js', '.css', '.json'].includes(ext)) {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    } else if (['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'].includes(ext)) {
      headers['Cache-Control'] = 'public, max-age=86400';
    }
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    sendJson(res, 500, { message: err.message || 'Error interno del servidor' });
  }
});

server.listen(PORT, () => {
  console.log(`Quipu conectado a Supabase (${SUPABASE_URL}) en http://localhost:${PORT}`);
});
