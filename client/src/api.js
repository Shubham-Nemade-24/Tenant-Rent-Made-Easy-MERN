/**
 * Centralized API client.
 * Base URL comes from env (Vite exposes VITE_ prefixed vars).
 * In production both client and server live on the same origin,
 * so we default to "" (same-origin requests).
 */

const BASE = import.meta.env.VITE_API_URL || "";

function getToken() {
  return localStorage.getItem("auth_token") || "";
}

export function setToken(token) {
  localStorage.setItem("auth_token", token);
}

export function clearToken() {
  localStorage.removeItem("auth_token");
}

export function isAuthenticated() {
  return !!getToken();
}

async function request(path, options = {}) {
  const { method = "GET", body } = options;
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || "Something went wrong");
    err.status = res.status;
    throw err;
  }
  return data;
}

/* ── Auth ─────────────────────────────────────────────────────────────── */
export async function login(password) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: { password },
  });
  setToken(data.token);
  return data;
}

/* ── Months ───────────────────────────────────────────────────────────── */
export function fetchMonth(key) {
  return request(`/api/months/${key}`);
}

export function recordPayment(key, payload) {
  return request(`/api/months/${key}/payment`, {
    method: "POST",
    body: payload,
  });
}

export function deletePayment(key, payload) {
  return request(`/api/months/${key}/payment`, {
    method: "DELETE",
    body: payload,
  });
}

export function saveElectricity(key, readings) {
  return request(`/api/months/${key}/electricity`, {
    method: "POST",
    body: { readings },
  });
}

/* ── Rooms ────────────────────────────────────────────────────────────── */
export function updateRoom(roomNo, payload) {
  return request(`/api/rooms/${roomNo}`, {
    method: "PUT",
    body: payload,
  });
}
