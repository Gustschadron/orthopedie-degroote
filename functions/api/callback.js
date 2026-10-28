// GET /api/callback → wisselt code in voor token, controleert gebruiker, geeft token aan Decap
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookie = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)oauth_state=([^;]+)/)?.[1];

  // CSRF-controle
  if (!code || !state || state !== cookie) return reply(origin, 'error', { message: 'Ongeldige login-poging. Probeer opnieuw.' });

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'decap-oauth' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${origin}/api/callback`,
    }),
  });
  const data = await tokenRes.json();
  if (!data.access_token) return reply(origin, 'error', { message: 'GitHub gaf geen token terug.' });

  // Extra slot: enkel toegelaten GitHub-gebruikers (komma-gescheiden lijst in ALLOWED_USERS)
  if (env.ALLOWED_USERS) {
    const u = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${data.access_token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'decap-oauth' },
    }).then(r => r.json());
    const allowed = env.ALLOWED_USERS.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    if (!allowed.includes(String(u.login || '').toLowerCase())) {
      return reply(origin, 'error', { message: 'Dit GitHub-account heeft geen toegang.' });
    }
  }

  return reply(origin, 'success', { token: data.access_token, provider: 'github' });
}

function reply(origin, status, content) {
  const nonce = crypto.randomUUID();
  const msg = `authorization:github:${status}:${JSON.stringify(content)}`;
  const js = (v) => JSON.stringify(v).replace(/</g, '\\u003c');
  const body = `<!doctype html><meta charset="utf-8"><title>Inloggen…</title><p>Even geduld…</p>
<script nonce="${nonce}">
(function () {
  var origin = ${js(origin)}, msg = ${js(msg)};
  window.addEventListener('message', function (e) {
    if (e.origin !== origin) return;
    window.opener.postMessage(msg, origin);
    window.close();
  });
  window.opener.postMessage('authorizing:github', origin);
})();
</script>`;
  return new Response(body, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'`,
      'Cache-Control': 'no-store',
      'Set-Cookie': 'oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=0',
    },
  });
}
