import * as auth from './functions/api/auth.js';
import * as callback from './functions/api/callback.js';

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (request.method === 'GET' && pathname === '/api/auth') return auth.onRequestGet({ request, env });
    if (request.method === 'GET' && pathname === '/api/callback') return callback.onRequestGet({ request, env });
    return env.ASSETS.fetch(request);
  },
};