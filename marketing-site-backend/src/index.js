const ALLOWED_TYPES = new Set(['enquiry', 'transport', 'ride', 'delivery', 'booking', 'handoff']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_MIN = 12;
const PASSWORD_MAX = 128;
const CHALLENGE_MINUTES = 10;
const SESSION_DAYS = 7;
const MAX_BODY_BYTES = 16 * 1024;
const COOKIE_NAME = '__Host-kash_session';
const GOOGLE_STATE_COOKIE = '__Host-kash_google_state';
const REQUEST_STATUSES = new Set(['received', 'reviewing', 'confirmed', 'in_progress', 'completed', 'cancelled']);
let accessKeysCache = null;
let accessKeysExpiry = 0;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const origin = request.headers.get('Origin');

    if (request.method === 'OPTIONS') {
      if (!originAllowed(origin, env)) return json({ error: { message: 'Origin not allowed.' } }, 403);
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (path.startsWith('/api/') && request.method !== 'GET' && !originAllowed(origin, env)) {
      return json({ error: { message: 'Request origin not allowed.' } }, 403);
    }

    try {
      if (request.method === 'POST' && path === '/api/requests') return await createRequest(request, env);
      if (request.method === 'POST' && path === '/api/auth/register') return await register(request, env);
      if (request.method === 'POST' && path === '/api/auth/verify') return await verifyEmail(request, env);
      if (request.method === 'POST' && path === '/api/auth/login') return await login(request, env);
      if (request.method === 'GET' && path === '/api/auth/google') return await startGoogleSignIn(request, env);
      if (request.method === 'GET' && path === '/api/auth/google/callback') return await completeGoogleSignIn(request, env);
      if (request.method === 'POST' && path === '/api/auth/logout') return await logout(request, env);
      if (request.method === 'POST' && path === '/api/auth/password-reset') return await requestPasswordReset(request, env);
      if (request.method === 'POST' && path === '/api/auth/password-reset/complete') return await completePasswordReset(request, env);
      if (request.method === 'GET' && path === '/api/account') return await getAccount(request, env);
      if (request.method === 'GET' && path === '/api/account/requests') return await getAccountRequests(request, env);
      if (request.method === 'GET' && path === '/api/account/reviews') return await getAccountReviews(request, env);
      if (request.method === 'POST' && /^\/api\/account\/requests\/[a-f\d-]{36}\/review$/i.test(path)) return await createAccountReview(request, env, path.split('/')[4]);
      if (request.method === 'GET' && path === '/api/reviews') return await getPublicReviews(request, env);
      if (request.method === 'GET' && path === '/api/staff/requests') return await getStaffRequests(request, env);
      if (request.method === 'PATCH' && /^\/api\/staff\/requests\/[a-f\d-]{36}$/i.test(path)) return await updateStaffRequest(request, env, path.split('/').pop());
      if (request.method === 'GET' && path === '/api/staff/reviews') return await getStaffReviews(request, env);
      if (request.method === 'PATCH' && /^\/api\/staff\/reviews\/[a-f\d-]{36}$/i.test(path)) return await updateStaffReview(request, env, path.split('/').pop());
      return withCors(json({ error: { message: 'Not found.' } }, 404), origin, env);
    } catch (error) {
      if (error instanceof ApiError) return withCors(json({ error: { message: error.message } }, error.status), origin, env);
      console.error('API request failed:', error instanceof Error ? error.message : 'Unknown error');
      return withCors(json({ error: { message: 'The request could not be completed. Please try again.' } }, 500), origin, env);
    }
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(env.DB.prepare('DELETE FROM rate_limits WHERE window_start < ?').bind(Math.floor(Date.now() / 1000) - 86400).run());
    ctx.waitUntil(env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(new Date().toISOString()).run());
    ctx.waitUntil(env.DB.prepare('DELETE FROM auth_challenges WHERE expires_at < ?').bind(new Date().toISOString()).run());
    ctx.waitUntil(env.DB.prepare(`DELETE FROM requests WHERE created_at < ?`).bind(new Date(Date.now() - 365 * 86400000).toISOString()).run());
  }
};

async function register(request, env) {
  const body = await readJson(request);
  const name = cleanText(body.name, 100);
  const email = cleanEmail(body.email);
  const password = validatePassword(body.password, email);
  if (!name || !email || password) return withCors(json({ error: { message: password || 'Enter a valid name and email address.' } }, 422), request.headers.get('Origin'), env);
  if (!(await allowed(env, request, 'register', email, 5, 3600))) return withCors(rateLimited(), request.headers.get('Origin'), env);

  const existing = await env.DB.prepare('SELECT id FROM customers WHERE email = ? COLLATE NOCASE').bind(email).first();
  if (existing) return withCors(json({ message: 'If this address can be registered, a verification code will be sent.' }), request.headers.get('Origin'), env);

  const salt = randomToken(16);
  const passwordHash = await hashPassword(body.password, salt, iterations(env));
  const code = randomDigits(6);
  const now = new Date();
  const challengeId = crypto.randomUUID();
  await env.DB.prepare('DELETE FROM auth_challenges WHERE email = ? AND purpose = ?').bind(email, 'verify').run();
  await env.DB.prepare(`INSERT INTO auth_challenges
    (id,email,purpose,name,password_hash,password_salt,code_hash,expires_at,created_at)
    VALUES (?,?,?,?,?,?,?,?,?)`).bind(
      challengeId, email, 'verify', name, passwordHash, salt,
      await hashCode(code, env), new Date(now.getTime() + CHALLENGE_MINUTES * 60000).toISOString(), now.toISOString()
    ).run();
  try {
    await sendCode(env, email, code, 'Verify your KASH account');
  } catch (error) {
    await env.DB.prepare('DELETE FROM auth_challenges WHERE id = ?').bind(challengeId).run();
    throw error;
  }
  return withCors(json({ message: 'A verification code was sent if the email can receive messages.' }, 202), request.headers.get('Origin'), env);
}

async function verifyEmail(request, env) {
  const body = await readJson(request);
  const email = cleanEmail(body.email);
  const code = cleanCode(body.code);
  if (!email || !code) return withCors(json({ error: { message: 'Enter your email and six-digit verification code.' } }, 422), request.headers.get('Origin'), env);
  if (!(await allowed(env, request, 'verify', email, 8, 900))) return withCors(rateLimited(), request.headers.get('Origin'), env);

  const challenge = await env.DB.prepare(`SELECT * FROM auth_challenges
    WHERE email = ? COLLATE NOCASE AND purpose = 'verify' ORDER BY created_at DESC LIMIT 1`).bind(email).first();
  if (!challenge || Date.parse(challenge.expires_at) < Date.now() || challenge.attempts >= 5) {
    return withCors(json({ error: { message: 'That code is invalid or expired. Request a new one.' } }, 422), request.headers.get('Origin'), env);
  }
  if (!(await equalHash(challenge.code_hash, await hashCode(code, env)))) {
    await env.DB.prepare('UPDATE auth_challenges SET attempts = attempts + 1 WHERE id = ?').bind(challenge.id).run();
    return withCors(json({ error: { message: 'That code is invalid or expired. Request a new one.' } }, 422), request.headers.get('Origin'), env);
  }

  const now = new Date().toISOString();
  const customerId = crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO customers (id,name,email,password_hash,password_salt,verified_at,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?)`).bind(customerId, challenge.name, email, challenge.password_hash, challenge.password_salt, now, now, now),
    env.DB.prepare('DELETE FROM auth_challenges WHERE email = ? AND purpose = ?').bind(email, 'verify')
  ]);
  return withCors(await createSession(env, customerId), request.headers.get('Origin'), env);
}

async function login(request, env) {
  const body = await readJson(request);
  const email = cleanEmail(body.email);
  if (!email || typeof body.password !== 'string' || body.password.length > PASSWORD_MAX) {
    return withCors(json({ error: { message: 'Email or password is incorrect.' } }, 401), request.headers.get('Origin'), env);
  }
  if (!(await allowed(env, request, 'login', email, 8, 900))) return withCors(rateLimited(), request.headers.get('Origin'), env);
  const customer = await env.DB.prepare('SELECT * FROM customers WHERE email = ? COLLATE NOCASE').bind(email).first();
  const candidate = customer ? await hashPassword(body.password, customer.password_salt, iterations(env)) : await hashPassword(body.password, 'invalid-user-salt', iterations(env));
  if (!customer || !(await equalHash(customer.password_hash, candidate))) {
    return withCors(json({ error: { message: 'Email or password is incorrect.' } }, 401), request.headers.get('Origin'), env);
  }
  return withCors(await createSession(env, customer.id), request.headers.get('Origin'), env);
}

async function startGoogleSignIn(request, env) {
  const siteOrigin = secureSiteOrigin(env);
  const clientId = requiredSecret(env, 'GOOGLE_CLIENT_ID');
  requiredSecret(env, 'GOOGLE_CLIENT_SECRET');
  if (!(await allowed(env, request, 'google_start', '', 20, 3600))) return withCors(rateLimited(), request.headers.get('Origin'), env);

  const state = randomToken(32);
  const verifier = randomToken(32);
  const challenge = base64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
  const redirectUri = new URL('/api/auth/google/callback', siteOrigin).toString();
  const authorization = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authorization.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256'
  }).toString();

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorization.toString(),
      'Cache-Control': 'no-store',
      'Set-Cookie': `${GOOGLE_STATE_COOKIE}=${state}.${verifier}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
    }
  });
}

async function completeGoogleSignIn(request, env) {
  const siteOrigin = secureSiteOrigin(env);
  const clientId = requiredSecret(env, 'GOOGLE_CLIENT_ID');
  const clientSecret = requiredSecret(env, 'GOOGLE_CLIENT_SECRET');
  const url = new URL(request.url);
  const [cookieState, verifier] = cookie(request, GOOGLE_STATE_COOKIE).split('.');
  const state = url.searchParams.get('state') || '';
  const code = url.searchParams.get('code') || '';
  if (url.searchParams.has('error') || !state || !cookieState || !verifier || !code ||
      state.length !== 43 || cookieState.length !== 43 || verifier.length !== 43 || code.length > 2048 ||
      !(await equalHash(state, cookieState))) {
    return googleLoginFailure(siteOrigin);
  }

  const redirectUri = new URL('/api/auth/google/callback', siteOrigin).toString();
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: verifier
    })
  });
  if (!tokenResponse.ok) {
    console.error('Google token exchange failed:', tokenResponse.status);
    return googleLoginFailure(siteOrigin);
  }
  const tokens = await tokenResponse.json();
  if (typeof tokens.access_token !== 'string' || tokens.access_token.length > 4096) return googleLoginFailure(siteOrigin);

  const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` }
  });
  if (!profileResponse.ok) {
    console.error('Google profile request failed:', profileResponse.status);
    return googleLoginFailure(siteOrigin);
  }
  const profile = await profileResponse.json();
  const email = cleanEmail(profile.email);
  if (!email || profile.email_verified !== true || typeof profile.sub !== 'string' || !profile.sub) {
    return googleLoginFailure(siteOrigin);
  }

  let customer = await env.DB.prepare('SELECT id FROM customers WHERE email = ? COLLATE NOCASE').bind(email).first();
  if (!customer) {
    const now = new Date().toISOString();
    const name = cleanText(profile.name, 100) || email.split('@')[0];
    const salt = randomToken(16);
    const passwordHash = await hashPassword(randomToken(32), salt, iterations(env));
    await env.DB.prepare(`INSERT OR IGNORE INTO customers
      (id,name,email,password_hash,password_salt,verified_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)`)
      .bind(crypto.randomUUID(), name, email, passwordHash, salt, now, now, now).run();
    customer = await env.DB.prepare('SELECT id FROM customers WHERE email = ? COLLATE NOCASE').bind(email).first();
  }
  if (!customer) throw new Error('Google account could not be linked to a customer record.');

  const session = await createSession(env, customer.id);
  const headers = new Headers({
    Location: `${siteOrigin}/#/account/dashboard`,
    'Cache-Control': 'no-store'
  });
  headers.append('Set-Cookie', clearGoogleStateCookie());
  headers.append('Set-Cookie', session.headers.get('Set-Cookie'));
  return new Response(null, { status: 303, headers });
}

function googleLoginFailure(siteOrigin) {
  const headers = new Headers({
    Location: `${siteOrigin}/#/account/login?google_error=1`,
    'Cache-Control': 'no-store',
    'Set-Cookie': clearGoogleStateCookie()
  });
  return new Response(null, { status: 303, headers });
}

async function requestPasswordReset(request, env) {
  const body = await readJson(request);
  const email = cleanEmail(body.email);
  if (!email) return withCors(json({ error: { message: 'Enter a valid email address.' } }, 422), request.headers.get('Origin'), env);
  if (!(await allowed(env, request, 'reset', email, 5, 3600))) return withCors(rateLimited(), request.headers.get('Origin'), env);
  const customer = await env.DB.prepare('SELECT id FROM customers WHERE email = ? COLLATE NOCASE').bind(email).first();
  if (customer) {
    const code = randomDigits(6);
    const now = new Date();
    const challengeId = crypto.randomUUID();
    await env.DB.prepare('DELETE FROM auth_challenges WHERE email = ? AND purpose = ?').bind(email, 'reset').run();
    await env.DB.prepare(`INSERT INTO auth_challenges (id,email,purpose,code_hash,expires_at,created_at)
      VALUES (?,?,?,?,?,?)`).bind(
      challengeId, email, 'reset', await hashCode(code, env),
      new Date(now.getTime() + CHALLENGE_MINUTES * 60000).toISOString(), now.toISOString()
    ).run();
    try {
      await sendCode(env, email, code, 'Reset your KASH password');
    } catch (error) {
      await env.DB.prepare('DELETE FROM auth_challenges WHERE id = ?').bind(challengeId).run();
      throw error;
    }
  }
  return withCors(json({ message: 'If an account exists for that address, a reset code has been sent.' }), request.headers.get('Origin'), env);
}

async function completePasswordReset(request, env) {
  const body = await readJson(request);
  const email = cleanEmail(body.email);
  const code = cleanCode(body.code);
  const passwordError = validatePassword(body.password, email);
  if (!email || !code || passwordError) return withCors(json({ error: { message: passwordError || 'Enter a valid email and six-digit code.' } }, 422), request.headers.get('Origin'), env);
  if (!(await allowed(env, request, 'reset_verify', email, 8, 900))) return withCors(rateLimited(), request.headers.get('Origin'), env);
  const challenge = await env.DB.prepare(`SELECT * FROM auth_challenges
    WHERE email = ? COLLATE NOCASE AND purpose = 'reset' ORDER BY created_at DESC LIMIT 1`).bind(email).first();
  if (!challenge || Date.parse(challenge.expires_at) < Date.now() || challenge.attempts >= 5) {
    return withCors(json({ error: { message: 'That code is invalid or expired. Request a new one.' } }, 422), request.headers.get('Origin'), env);
  }
  if (!(await equalHash(challenge.code_hash, await hashCode(code, env)))) {
    await env.DB.prepare('UPDATE auth_challenges SET attempts = attempts + 1 WHERE id = ?').bind(challenge.id).run();
    return withCors(json({ error: { message: 'That code is invalid or expired. Request a new one.' } }, 422), request.headers.get('Origin'), env);
  }

  const salt = randomToken(16);
  const passwordHash = await hashPassword(body.password, salt, iterations(env));
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare('UPDATE customers SET password_hash = ?, password_salt = ?, updated_at = ? WHERE email = ? COLLATE NOCASE')
      .bind(passwordHash, salt, now, email),
    env.DB.prepare('DELETE FROM auth_challenges WHERE email = ? AND purpose = ?').bind(email, 'reset'),
    env.DB.prepare('DELETE FROM sessions WHERE customer_id = (SELECT id FROM customers WHERE email = ? COLLATE NOCASE)').bind(email)
  ]);
  return withCors(json({ message: 'Password updated. Sign in with your new password.' }), request.headers.get('Origin'), env);
}

async function logout(request, env) {
  const token = cookie(request, COOKIE_NAME);
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
  return withCors(json({ message: 'Signed out.' }, 200, { 'Set-Cookie': clearCookie() }), request.headers.get('Origin'), env);
}

async function getAccount(request, env) {
  const customer = await authenticatedCustomer(request, env);
  if (!customer) return withCors(unauthorized(), request.headers.get('Origin'), env);
  return withCors(json({ customer: { id: customer.id, name: customer.name, email: customer.email, verifiedAt: customer.verified_at } }), request.headers.get('Origin'), env);
}

async function getAccountRequests(request, env) {
  const customer = await authenticatedCustomer(request, env);
  if (!customer) return withCors(unauthorized(), request.headers.get('Origin'), env);
  const result = await env.DB.prepare(`SELECT id,type,status,created_at,updated_at
    FROM requests WHERE customer_id = ? ORDER BY created_at DESC LIMIT 100`).bind(customer.id).all();
  return withCors(json({ requests: result.results || [] }), request.headers.get('Origin'), env);
}

async function getAccountReviews(request, env) {
  const customer = await authenticatedCustomer(request, env);
  if (!customer) return withCors(unauthorized(), request.headers.get('Origin'), env);
  const result = await env.DB.prepare(`SELECT r.id,r.type,r.created_at,v.id AS review_id,v.rating,v.body AS review_body,v.status AS review_status
    FROM requests r LEFT JOIN reviews v ON v.request_id = r.id
    WHERE r.customer_id = ? AND r.status = 'completed'
    ORDER BY r.updated_at DESC LIMIT 100`).bind(customer.id).all();
  return withCors(json({ requests: result.results || [] }), request.headers.get('Origin'), env);
}

async function createAccountReview(request, env, requestId) {
  const customer = await authenticatedCustomer(request, env);
  if (!customer) return withCors(unauthorized(), request.headers.get('Origin'), env);
  const body = await readJson(request);
  const rating = body.rating;
  const review = typeof body.review === 'string' ? body.review.trim() : '';
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || review.length < 10 || review.length > 1000) {
    return withCors(json({ error: { message: 'Choose a 1–5 star rating and write a review between 10 and 1,000 characters.' } }, 422), request.headers.get('Origin'), env);
  }
  if (!(await allowed(env, request, 'review', customer.id, 5, 3600))) return withCors(rateLimited(), request.headers.get('Origin'), env);
  const completedRequest = await env.DB.prepare(`SELECT id FROM requests
    WHERE id = ? AND customer_id = ? AND status = 'completed'`).bind(requestId, customer.id).first();
  if (!completedRequest) return withCors(json({ error: { message: 'Reviews are available only for your completed KASH requests.' } }, 404), request.headers.get('Origin'), env);
  const result = await env.DB.prepare(`INSERT INTO reviews (id,request_id,customer_id,rating,body,status,created_at,updated_at)
    VALUES (?,?,?,?,?,'pending',?,?) ON CONFLICT(request_id) DO NOTHING`)
    .bind(crypto.randomUUID(), requestId, customer.id, rating, review, new Date().toISOString(), new Date().toISOString()).run();
  if (!result.meta.changes) return withCors(json({ error: { message: 'A review has already been submitted for this request.' } }, 409), request.headers.get('Origin'), env);
  return withCors(json({ message: 'Thank you. Your review was sent to KASH for approval before it appears on the website.' }, 201), request.headers.get('Origin'), env);
}

async function getPublicReviews(request, env) {
  const result = await env.DB.prepare(`SELECT v.rating,v.body,v.created_at
    FROM reviews v JOIN requests r ON r.id = v.request_id
    WHERE v.status = 'approved' AND r.status = 'completed'
    ORDER BY v.created_at DESC LIMIT 12`).all();
  return withCors(json({ reviews: result.results || [] }), request.headers.get('Origin'), env);
}

async function getStaffRequests(request, env) {
  const actor = await authenticatedStaff(request, env);
  if (!actor) return withCors(json({ error: { message: 'Staff access is required.' } }, 403), request.headers.get('Origin'), env);
  const url = new URL(request.url);
  const status = url.searchParams.get('status') || '';
  if (status && !REQUEST_STATUSES.has(status)) return withCors(json({ error: { message: 'Choose a valid request status.' } }, 422), request.headers.get('Origin'), env);
  const result = status
    ? await env.DB.prepare(`SELECT id,customer_id,type,payload_json,status,created_at,updated_at
        FROM requests WHERE status = ? ORDER BY created_at DESC LIMIT 100`).bind(status).all()
    : await env.DB.prepare(`SELECT id,customer_id,type,payload_json,status,created_at,updated_at
        FROM requests ORDER BY created_at DESC LIMIT 100`).all();
  return withCors(json({ requests: result.results || [] }), request.headers.get('Origin'), env);
}

async function getStaffReviews(request, env) {
  const actor = await authenticatedStaff(request, env);
  if (!actor) return withCors(json({ error: { message: 'Staff access is required.' } }, 403), request.headers.get('Origin'), env);
  const result = await env.DB.prepare(`SELECT v.id,v.rating,v.body,v.status,v.created_at,r.type,r.id AS request_id
    FROM reviews v JOIN requests r ON r.id = v.request_id
    ORDER BY CASE v.status WHEN 'pending' THEN 0 ELSE 1 END, v.created_at DESC LIMIT 100`).all();
  return withCors(json({ reviews: result.results || [] }), request.headers.get('Origin'), env);
}

async function updateStaffReview(request, env, reviewId) {
  const actor = await authenticatedStaff(request, env);
  if (!actor) return withCors(json({ error: { message: 'Staff access is required.' } }, 403), request.headers.get('Origin'), env);
  const body = await readJson(request);
  if (!['approved', 'rejected'].includes(body.status)) return withCors(json({ error: { message: 'Choose approve or reject for this review.' } }, 422), request.headers.get('Origin'), env);
  const now = new Date().toISOString();
  const result = await env.DB.prepare(`UPDATE reviews SET status = ?, updated_at = ?
    WHERE id = ?`).bind(body.status, now, reviewId).run();
  if (!result.meta.changes) return withCors(json({ error: { message: 'Review not found.' } }, 404), request.headers.get('Origin'), env);
  return withCors(json({ id: reviewId, status: body.status, updated_at: now }), request.headers.get('Origin'), env);
}

async function updateStaffRequest(request, env, requestId) {
  const actor = await authenticatedStaff(request, env);
  if (!actor) return withCors(json({ error: { message: 'Staff access is required.' } }, 403), request.headers.get('Origin'), env);
  const body = await readJson(request);
  if (!REQUEST_STATUSES.has(body.status)) return withCors(json({ error: { message: 'Choose a valid request status.' } }, 422), request.headers.get('Origin'), env);
  const existing = await env.DB.prepare('SELECT status FROM requests WHERE id = ?').bind(requestId).first();
  if (!existing) return withCors(json({ error: { message: 'Request not found.' } }, 404), request.headers.get('Origin'), env);
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare('UPDATE requests SET status = ?, updated_at = ? WHERE id = ?').bind(body.status, now, requestId),
    env.DB.prepare(`INSERT INTO request_events (id,request_id,actor_email,previous_status,new_status,created_at)
      VALUES (?,?,?,?,?,?)`).bind(crypto.randomUUID(), requestId, actor.email, existing.status, body.status, now)
  ]);
  return withCors(json({ id: requestId, status: body.status, updated_at: now }), request.headers.get('Origin'), env);
}

async function authenticatedStaff(request, env) {
  const team = (env.ACCESS_TEAM_DOMAIN || '').trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const audience = (env.ACCESS_AUD || '').trim();
  const allowlist = (env.STAFF_EMAILS || '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean);
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!team || !audience || !allowlist.length || !token) return null;
  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
  if (!encodedHeader || !encodedPayload || !encodedSignature) return null;
  let header, claims;
  try {
    header = JSON.parse(new TextDecoder().decode(base64UrlBytes(encodedHeader)));
    claims = JSON.parse(new TextDecoder().decode(base64UrlBytes(encodedPayload)));
  } catch (_error) { return null; }
  if (header.alg !== 'RS256' || typeof header.kid !== 'string') return null;
  if (claims.iss !== `https://${team}` || !audienceMatches(claims.aud, audience) || !Number.isFinite(claims.exp) || claims.exp <= Date.now() / 1000) return null;
  const email = typeof claims.email === 'string' ? claims.email.toLowerCase() : '';
  if (!email || claims.email_verified === false || claims.email_verified === 'false' || !allowlist.includes(email)) return null;
  const keys = await accessKeys(env);
  const jwk = keys.find((key) => key.kid === header.kid);
  if (!jwk) return null;
  try {
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const signature = base64UrlBytes(encodedSignature);
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`));
    return valid ? { email } : null;
  } catch (_error) { return null; }
}

async function accessKeys(env) {
  if (accessKeysCache && accessKeysExpiry > Date.now()) return accessKeysCache;
  const team = (env.ACCESS_TEAM_DOMAIN || '').trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
  if (!team) return [];
  const response = await fetch(`https://${team}/cdn-cgi/access/certs`);
  if (!response.ok) throw new Error(`Cloudflare Access key service returned ${response.status}.`);
  const body = await response.json();
  accessKeysCache = Array.isArray(body.keys) ? body.keys : [];
  accessKeysExpiry = Date.now() + 5 * 60 * 1000;
  return accessKeysCache;
}

async function createRequest(request, env) {
  const body = await readJson(request);
  if (!ALLOWED_TYPES.has(body.type) || !validPayload(body.data) || !validRequest(body.type, body.data)) {
    return withCors(json({ error: { message: 'Check the request details and try again.' } }, 422), request.headers.get('Origin'), env);
  }
  if (!(await allowed(env, request, 'request', '', 10, 3600))) return withCors(rateLimited(), request.headers.get('Origin'), env);
  const sessionCustomer = await authenticatedCustomer(request, env);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO requests (id,customer_id,type,payload_json,created_at,updated_at)
    VALUES (?,?,?,?,?,?)`).bind(id, sessionCustomer ? sessionCustomer.id : null, body.type, JSON.stringify(body.data), now, now).run();
  return withCors(json({ id, status: 'received' }, 201), request.headers.get('Origin'), env);
}

async function authenticatedCustomer(request, env) {
  const token = cookie(request, COOKIE_NAME);
  if (!token) return null;
  return env.DB.prepare(`SELECT c.id,c.name,c.email,c.verified_at FROM sessions s
    JOIN customers c ON c.id = s.customer_id
    WHERE s.token_hash = ? AND s.expires_at > ?`).bind(await sha256(token), new Date().toISOString()).first();
}

async function createSession(env, customerId) {
  const token = randomToken(32);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DAYS * 86400000).toISOString();
  await env.DB.prepare('INSERT INTO sessions (token_hash,customer_id,expires_at,created_at) VALUES (?,?,?,?)')
    .bind(await sha256(token), customerId, expiresAt, now.toISOString()).run();
  return json({ message: 'Signed in.' }, 200, { 'Set-Cookie': `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}` });
}

async function sendCode(env, email, code, subject) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) throw new Error('Transactional email is not configured.');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [email],
      subject,
      text: `Your KASH verification code is ${code}. It expires in ${CHALLENGE_MINUTES} minutes. If you did not request this, you can ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:28px;color:#14213a"><img src="${escapeHtml(env.SITE_ORIGIN)}/images/fallback/logo.webp" width="140" alt="KASH General Suppliers"><h1 style="font-size:22px">Your verification code</h1><p>Enter this code on the KASH website. It expires in ${CHALLENGE_MINUTES} minutes.</p><p style="font-size:32px;letter-spacing:8px;font-weight:bold">${code}</p><p>If you did not request this code, you can ignore this email.</p></div>`
    })
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}.`);
}

async function allowed(env, request, action, subject, maximum, seconds) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const fingerprint = `${action}:${ip}:${subject}`;
  const scopeHash = await hmac(requiredSecret(env, 'RATE_LIMIT_SECRET'), fingerprint);
  const windowStart = Math.floor(Date.now() / (seconds * 1000)) * seconds;
  const row = await env.DB.prepare(`INSERT INTO rate_limits(scope_hash,window_start,hits) VALUES(?,?,1)
    ON CONFLICT(scope_hash,window_start) DO UPDATE SET hits=hits+1 RETURNING hits`)
    .bind(scopeHash, windowStart).first();
  return !!row && row.hits <= maximum;
}

function validPayload(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const serialized = JSON.stringify(data);
  if (serialized.length > 12000) return false;
  const walk = (value, depth) => {
    if (depth > 4) return false;
    if (typeof value === 'string') return value.length <= 2000;
    if (typeof value === 'number') return Number.isFinite(value);
    if (typeof value === 'boolean' || value === null) return true;
    if (Array.isArray(value)) return value.length <= 30 && value.every((item) => walk(item, depth + 1));
    if (typeof value === 'object') return Object.entries(value).length <= 40 && Object.entries(value).every(([key, item]) => key.length <= 80 && walk(item, depth + 1));
    return false;
  };
  return walk(data, 0);
}

async function readJson(request) {
  if (!(request.headers.get('Content-Type') || '').toLowerCase().startsWith('application/json')) {
    throw new ApiError('Send the request as JSON.', 415);
  }
  const length = Number(request.headers.get('Content-Length') || 0);
  if (length > MAX_BODY_BYTES) throw new ApiError('Request is too large.', 413);
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new ApiError('Request is too large.', 413);
  try {
    const body = JSON.parse(text);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ApiError('Send a valid JSON object.', 400);
    return body;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Send a valid JSON request.', 400);
  }
}

function validRequest(type, data) {
  const name = cleanText(data.name, 100);
  const phone = typeof data.phone === 'string' ? data.phone.replace(/\D/g, '') : '';
  if (!name || phone.length < 9 || phone.length > 15) return false;
  if (data.email && !cleanEmail(data.email)) return false;
  if (type === 'enquiry') return !!cleanText(data.service, 100);
  if (type === 'transport') return !!cleanText(data.from, 200) && !!cleanText(data.to, 200);
  if (type === 'ride') return !!cleanText(data.pickup, 200);
  if (type === 'delivery') return !!cleanText(data.pickup, 200) && !!cleanText(data.dropoff, 200);
  if (type === 'booking') {
    return !!cleanText(data.property, 150) && validDate(data.checkin) && validDate(data.checkout) && data.checkout > data.checkin;
  }
  return type === 'handoff' && !!cleanText(data.topic, 400);
}

function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function validatePassword(password, email) {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN) return `Use a password with at least ${PASSWORD_MIN} characters.`;
  if (password.length > PASSWORD_MAX) return `Password must be no more than ${PASSWORD_MAX} characters.`;
  if (/^\s|\s$/.test(password)) return 'Password cannot start or end with a space.';
  if (email && password.toLowerCase().includes(email.split('@')[0].toLowerCase())) return 'Do not include your email name in your password.';
  if (/^(.)\1+$/.test(password) || /^(password|qwerty|letmein|welcome|admin|123456)/i.test(password)) return 'Choose a less common password.';
  return '';
}

function cleanText(value, max) { return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max) : ''; }
function cleanEmail(value) {
  if (typeof value !== 'string') return '';
  const email = value.trim().toLowerCase();
  return email.length <= 254 && EMAIL_RE.test(email) ? email : '';
}
function cleanCode(value) { return typeof value === 'string' && /^\d{6}$/.test(value.trim()) ? value.trim() : ''; }
function secureSiteOrigin(env) {
  try {
    const site = new URL(env.SITE_ORIGIN);
    if (site.protocol === 'https:' && site.origin === env.SITE_ORIGIN.replace(/\/+$/, '')) return site.origin;
  } catch (_error) {}
  throw new ApiError('Google sign-in requires a valid HTTPS site origin.', 503);
}
function audienceMatches(value, expected) { return Array.isArray(value) ? value.includes(expected) : value === expected; }
function base64Url(bytes) { return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function base64UrlBytes(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const decoded = atob(normalized + '='.repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(decoded, (char) => char.charCodeAt(0));
}
function iterations(env) {
  const value = Number(env.PASSWORD_ITERATIONS || 310000);
  return Number.isInteger(value) && value >= 310000 && value <= 600000 ? value : 310000;
}
function randomToken(bytes) {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...data)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function randomDigits(length) {
  const data = new Uint32Array(1);
  crypto.getRandomValues(data);
  return String(data[0] % (10 ** length)).padStart(length, '0');
}
async function hashPassword(password, salt, count) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password.normalize('NFKC')), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: count }, material, 256);
  return toHex(new Uint8Array(bits));
}
async function hashCode(code, env) { return hmac(requiredSecret(env, 'OTP_PEPPER'), code); }
function requiredSecret(env, name) {
  const secret = env[name];
  if (typeof secret !== 'string' || secret.length < 32) {
    throw new ApiError('The service is not configured yet. Please try again later.', 503);
  }
  return secret;
}
async function sha256(value) { return toHex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))); }
async function hmac(secret, value) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return toHex(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))));
}
async function equalHash(a, b) {
  const left = new TextEncoder().encode(a || ''), right = new TextEncoder().encode(b || '');
  if (left.length !== right.length) return false;
  let result = 0;
  for (let i = 0; i < left.length; i++) result |= left[i] ^ right[i];
  return result === 0;
}
function toHex(bytes) { return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(''); }
function escapeHtml(value) { return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
function cookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  const match = header.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : '';
}
function clearCookie() { return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`; }
function clearGoogleStateCookie() { return `${GOOGLE_STATE_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`; }
function originAllowed(origin, env) {
  if (!origin || !env.SITE_ORIGIN) return false;
  try { return new URL(origin).origin === new URL(env.SITE_ORIGIN).origin; }
  catch (_error) { return false; }
}
function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
}
function withCors(response, origin, env) {
  if (!originAllowed(origin, env)) return response;
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders(origin)).forEach(([name, value]) => headers.set(name, value));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
function json(body, status = 200, extraHeaders = {}) {
  const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extraHeaders });
  return new Response(JSON.stringify(body), { status, headers });
}
function rateLimited() { return json({ error: { message: 'Too many attempts. Please wait and try again.' } }, 429, { 'Retry-After': '60' }); }
function unauthorized() { return json({ error: { message: 'Please sign in to continue.' } }, 401); }
class ApiError extends Error {
  constructor(message, status){ super(message); this.status = status; }
}
