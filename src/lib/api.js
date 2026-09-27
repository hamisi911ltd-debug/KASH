/* ============================================================
   Thin fetch wrapper for the KASH API (worker/src/index.js).
   Every call carries the signed-in user's bearer token; a 401 means
   the session is dead and the caller should sign out.
   ============================================================ */

/* Overridable at build time (VITE_API_BASE) so the same codebase can be
   built twice - once against the shared demo backend, once against a
   separate, empty backend for a real/clean deployment - without
   forking any code. */
export const API_BASE = import.meta.env?.VITE_API_BASE || "https://kash-api.glotech.workers.dev";

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

/** A raw binary upload - unlike `request()`, the body is the file itself,
    not JSON, so this can't go through the same helper. */
async function uploadImage(token, file, division) {
  const qs = division ? `?division=${encodeURIComponent(division)}` : "";
  const res = await fetch(`${API_BASE}/api/uploads${qs}`, {
    method: "POST",
    headers: { "Content-Type": file.type, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: file,
  });
  let payload = null;
  try {
    payload = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) throw new ApiError(payload?.error || `Upload failed (${res.status})`, res.status);
  return payload; // { url, key }
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
  approve: (token, collection, id, decision, note) =>
    request(`/api/${collection}/${id}/approve`, { method: "POST", token, body: { decision, note } }),
  updateCompany: (token, body) => request("/api/company", { method: "PATCH", token, body }),
  uploadImage,
  deleteImage: (token, key) => request(`/api/uploads/${key}`, { method: "DELETE", token }),
};
