// GET /api/auth  → stuurt de popup naar GitHub (OAuth start)
export async function onRequestGet({ request, env }) {
  if (!env.GITHUB_CLIENT_ID) return new Response('GITHUB_CLIENT_ID ontbreekt', { status: 500 });
  const origin = new URL(request.url).origin;
  const state = crypto.randomUUID();

  const gh = new URL('https://github.com/login/oauth/authorize');
  gh.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  gh.searchParams.set('redirect_uri', `${origin}/api/callback`);
  gh.searchParams.set('scope', env.GITHUB_SCOPE || 'repo'); // 'public_repo' als de repo publiek is
  gh.searchParams.set('state', state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: gh.toString(),
      'Set-Cookie': `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=600`,
      'Cache-Control': 'no-store',
    },
  });
}
