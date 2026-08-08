const APP_NAME = 'LexiExtract Pro';
const COOKIE_NAME = '__Host-writing_archive_session';
const SESSION_SECONDS = 12 * 60 * 60;
const encoder = new TextEncoder();

function response(body, status, contentType, headers = {}) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'X-Frame-Options': 'DENY',
      ...headers,
    },
  });
}

function json(data, status = 200, headers = {}) {
  return response(JSON.stringify(data), status, 'application/json; charset=UTF-8', headers);
}

function base64UrlEncode(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function importHmacKey(secret, usage) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage],
  );
}

async function secureEqual(left, right) {
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(left)),
    crypto.subtle.digest('SHA-256', encoder.encode(right)),
  ]);
  return crypto.subtle.timingSafeEqual(leftHash, rightHash);
}

async function createSession(secret) {
  const payload = base64UrlEncode(encoder.encode(JSON.stringify({
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
  })));
  const key = await importHmacKey(secret, 'sign');
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)));
  return `${payload}.${base64UrlEncode(signature)}`;
}

async function isValidSession(token, secret) {
  if (!token || !secret) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  try {
    const key = await importHmacKey(secret, 'verify');
    const signature = base64UrlDecode(parts[1]);
    const valid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(parts[0]));
    if (!valid) return false;
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[0])));
    return Number.isFinite(payload.exp) && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function getCookie(request, name) {
  const cookie = request.headers.get('Cookie') || '';
  for (const part of cookie.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() === name) return part.slice(separator + 1).trim();
  }
  return '';
}

function loginPage() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${APP_NAME} · 访问验证</title>
  <style>
    *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:linear-gradient(135deg,#eef2ff,#f8fafc 55%,#ecfeff);font-family:Inter,system-ui,-apple-system,sans-serif;color:#111827}.card{width:min(100%,360px);padding:36px;background:#fff;border:1px solid #e5e7eb;border-radius:24px;box-shadow:0 24px 70px rgba(15,23,42,.14);text-align:center}.mark{width:58px;height:58px;margin:0 auto 16px;display:grid;place-items:center;border-radius:18px;background:#eff6ff;font-size:28px}h1{margin:0 0 8px;font-size:24px}p{margin:0 0 22px;color:#94a3b8;font-size:14px}input{width:100%;padding:13px 14px;border:1px solid #dbe3ee;border-radius:12px;font-size:18px;outline:none;text-align:center;letter-spacing:.12em}input:focus{border-color:#4f46e5;box-shadow:0 0 0 3px rgba(79,70,229,.12)}#error{min-height:24px;padding-top:5px;color:#ef4444;font-size:12px;line-height:19px}button{width:100%;padding:13px;border:0;border-radius:12px;background:linear-gradient(90deg,#2563eb,#4f46e5);color:#fff;font-size:14px;font-weight:700;cursor:pointer}button:disabled{opacity:.65;cursor:wait}
  </style>
</head>
<body>
  <main class="card">
    <div class="mark">✍️</div>
    <h1>${APP_NAME}</h1>
    <p>请输入访问码继续</p>
    <form id="login-form">
      <input id="access-code" type="password" inputmode="numeric" maxlength="32" autocomplete="current-password" aria-label="访问码" required autofocus>
      <div id="error" role="alert"></div>
      <button id="submit" type="submit">进入</button>
    </form>
  </main>
  <script>
    document.getElementById('login-form').addEventListener('submit', async function (event) {
      event.preventDefault();
      const button = document.getElementById('submit');
      const input = document.getElementById('access-code');
      const error = document.getElementById('error');
      button.disabled = true;
      button.textContent = '验证中...';
      error.textContent = '';
      try {
        const result = await fetch('/__access/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: input.value }),
        });
        if (!result.ok) throw new Error(result.status === 401 ? '访问码不正确' : '暂时无法验证，请稍后重试');
        location.replace('/');
      } catch (err) {
        error.textContent = err.message;
        input.select();
        button.disabled = false;
        button.textContent = '进入';
      }
    });
  </script>
</body>
</html>`;
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (url.pathname === '/__access/login' && request.method === 'POST') {
    if (!env.ACCESS_CODE || !env.SESSION_SECRET) {
      return json({ error: 'Access protection is not configured' }, 503);
    }
    const body = await request.json().catch(() => ({}));
    if (!(await secureEqual(String(body.code || ''), env.ACCESS_CODE))) {
      return json({ error: 'Invalid access code' }, 401);
    }
    const token = await createSession(env.SESSION_SECRET);
    return json({ success: true }, 200, {
      'Set-Cookie': `${COOKIE_NAME}=${token}; Max-Age=${SESSION_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Strict`,
    });
  }

  if (url.pathname === '/__access/logout' && request.method === 'POST') {
    return json({ success: true }, 200, {
      'Set-Cookie': `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict`,
    });
  }

  if (await isValidSession(getCookie(request, COOKIE_NAME), env.SESSION_SECRET)) {
    return context.next();
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return json({ error: 'Unauthorized' }, 401);
  }
  return response(loginPage(), 401, 'text/html; charset=UTF-8');
}
