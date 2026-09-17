/**
 * userService.js
 * Tất cả API calls liên quan đến thông tin người dùng (profile, membership, v.v.)
 */

const API_BASE = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8000';
const USER_BASE = `${API_BASE}/api/v1/users`;

// ───────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────

async function userRequest(url, options = {}, accessToken = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const serverMessage =
      json?.message || json?.error || `Lỗi máy chủ (${response.status})`;
    throw new Error(serverMessage);
  }

  return json;
}

// ───────────────────────────────────────────────
// User APIs
// ───────────────────────────────────────────────

/**
 * Lấy thông tin profile người dùng hiện tại.
 * @param {string} accessToken
 * @returns {Promise<{ id, email, fullName, role, membershipTier, total_spend_ytd }>}
 */
export async function getMyProfile(accessToken) {
  const res = await userRequest(`${USER_BASE}/me`, {}, accessToken);
  return res.data;
}

/**
 * Cập nhật thông tin profile người dùng (fullName, v.v.)
 * @param {string} accessToken
 * @param {{ fullName?: string }} payload
 * @returns {Promise<any>}
 */
export async function updateProfile(accessToken, payload) {
  const res = await userRequest(
    `${USER_BASE}/me`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    accessToken
  );
  return res.data;
}

// ───────────────────────────────────────────────
// Local Storage Helpers (persist user session)
// ───────────────────────────────────────────────

const STORAGE_KEY_TOKENS = 'cgv_auth_tokens';
const STORAGE_KEY_USER = 'cgv_user';

/**
 * Lưu tokens vào localStorage.
 * @param {{ accessToken: string, refreshToken?: string, expiresIn?: number }} tokens
 */
export function saveTokens(tokens) {
  localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(tokens));
}

/**
 * Lấy tokens từ localStorage.
 * @returns {{ accessToken: string, refreshToken?: string, expiresIn?: number } | null}
 */
export function getTokens() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TOKENS);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Lưu user info vào localStorage.
 * @param {object} user
 */
export function saveUser(user) {
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
}

/**
 * Lấy user info từ localStorage.
 * @returns {object | null}
 */
export function getSavedUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Xóa toàn bộ session khỏi localStorage.
 */
export function clearSession() {
  localStorage.removeItem(STORAGE_KEY_TOKENS);
  localStorage.removeItem(STORAGE_KEY_USER);
  // backward-compat với key cũ
  localStorage.removeItem('cinego_user');
}
