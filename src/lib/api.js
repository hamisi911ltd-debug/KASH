/* ============================================================
   Thin fetch wrapper for the KASH API (worker/src/index.js).
   Every call carries the signed-in user's bearer token; a 401 means
   the session is dead and the caller should sign out.
   ============================================================ */

export const API_BASE = "https://kash-api.glotech.workers.dev";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let payload = null;
  try {
    payload = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) throw new ApiError(payload?.error || `Request failed (${res.status})`, res.status);
  return payload;
}

export const api = {
  register: (body) => request("/api/auth/register", { method: "POST", body }),
  login: (body) => request("/api/auth/login", { method: "POST", body }),
  me: (token) => request("/api/me", { token }),
  sync: (token) => request("/api/sync", { token }),
  create: (token, collection, body) => request(`/api/${collection}`, { method: "POST", token, body }),
  update: (token, collection, id, body) => request(`/api/${collection}/${id}`, { method: "PUT", token, body }),
  patch: (token, collection, id, body) => request(`/api/${collection}/${id}`, { method: "PATCH", token, body }),
  remove: (token, collection, id) => request(`/api/${collection}/${id}`, { method: "DELETE", token }),
  updateCompany: (token, body) => request("/api/company", { method: "PATCH", token, body }),
};
