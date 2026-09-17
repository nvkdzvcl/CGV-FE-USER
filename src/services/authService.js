/**
 * authService.js
 * Tất cả API calls liên quan đến xác thực: login, register, OTP, social sync, refresh, logout.
 */

const API_BASE = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8000';
const AUTH_BASE = `${API_BASE}/api/v1/auth`;

// ───────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────

/**
 * Thực hiện một API request và ném lỗi có cấu trúc từ server.
 * @param {string} url
 * @param {RequestInit} options
 * @returns {Promise<any>} data từ response body
 */
async function authRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    // Lấy message từ server nếu có, ngược lại fallback
    const serverMessage =
      json?.message ||
      json?.error ||
      `Lỗi máy chủ (${response.status})`;
    throw new Error(serverMessage);
  }

  return json;
}

// ───────────────────────────────────────────────
// Auth APIs
// ───────────────────────────────────────────────

/**
 * Đăng nhập bằng email + password.
 * @param {{ username: string, password: string }} credentials
 * @returns {Promise<{ accessToken, refreshToken, expiresIn, authenticated }>}
 */
export async function login(credentials) {
  const res = await authRequest(`${AUTH_BASE}/login`, {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  return res.data; // { accessToken, refreshToken, expiresIn, authenticated }
}

/**
 * Bước 1 đăng ký: gửi OTP về email.
 * @param {{ email: string, fullName: string, password: string }} payload
 * @returns {Promise<{ message: string }>}
 */
export async function registerInit(payload) {
  const res = await authRequest(`${AUTH_BASE}/register/init`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return { message: res.message };
}

/**
 * Bước 2 đăng ký: xác thực OTP và tạo tài khoản.
 * @param {{ email: string, fullName: string, password: string, otp: string }} payload
 * @returns {Promise<{ id, email, fullName, role, membershipTier }>}
 */
export async function registerVerify(payload) {
  const res = await authRequest(`${AUTH_BASE}/register/verify`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data; // UserResponse
}

/**
 * Đồng bộ user từ social login (Google/Facebook) về DB local.
 * @param {string} accessToken - JWT access token từ Keycloak
 * @param {string} [fullName] - Họ và tên tùy chỉnh do user nhập
 * @returns {Promise<any>} UserResponse từ server
 */
export async function socialSync(accessToken, fullName) {
  const res = await authRequest(`${AUTH_BASE}/social-sync`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: fullName ? JSON.stringify({ fullName }) : undefined,
  });
  return res.data;
}

/**
 * Refresh access token.
 * @param {string} refreshToken
 * @returns {Promise<{ accessToken, refreshToken, expiresIn, authenticated }>}
 */
export async function refreshToken(refreshTokenValue) {
  const res = await authRequest(`${AUTH_BASE}/refresh`, {
    method: 'POST',
    body: JSON.stringify({ refreshToken: refreshTokenValue }),
  });
  return res.data;
}

/**
 * Logout: revoke token trên Keycloak.
 * @param {string} refreshTokenValue
 * @returns {Promise<void>}
 */
export async function logout(refreshTokenValue) {
  await authRequest(`${AUTH_BASE}/logout`, {
    method: 'POST',
    body: JSON.stringify({ refreshToken: refreshTokenValue }),
  });
}

// ───────────────────────────────────────────────
// Keycloak Social Login URLs
// ───────────────────────────────────────────────

export function buildSocialLoginUrl(provider) {
  const keycloakBase =
    import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8180';
  const realm = import.meta.env.VITE_KEYCLOAK_REALM || 'cgv-realm';
  const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'CGV_App';

  const redirectUri = encodeURIComponent(
    `${window.location.origin}/oauth/callback`
  );
  const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);
  return (
    `${keycloakBase}/realms/${realm}/protocol/openid-connect/auth` +
    `?client_id=${clientId}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=id_token+token` +
    `&scope=openid+profile+email` +
    `&kc_idp_hint=${provider}` +
    `&nonce=${nonce}` +
    `&prompt=login`
  );
}

/**
 * URL để đăng xuất sạch session của Keycloak trên trình duyệt.
 * Nếu có idToken (id_token_hint), Keycloak sẽ logout ngay lập tức mà KHÔNG hỏi xác nhận.
 * @param {string} [idToken]
 */
export function buildKeycloakLogoutUrl(idToken) {
  const keycloakBase =
    import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8180';
  const realm = import.meta.env.VITE_KEYCLOAK_REALM || 'cgv-realm';
  const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'CGV_App';
  const redirectUri = encodeURIComponent(window.location.origin);
  let url = `${keycloakBase}/realms/${realm}/protocol/openid-connect/logout?client_id=${clientId}&post_logout_redirect_uri=${redirectUri}`;
  if (idToken) {
    url += `&id_token_hint=${encodeURIComponent(idToken)}`;
  }
  return url;
}

/**
 * Parse fragment (#...) trong URL để lấy access_token, id_token, refresh_token, etc.
 * Keycloak trả về implicit flow tokens trong URL fragment.
 * @param {string} hash - window.location.hash
 * @returns {{ accessToken?: string, idToken?: string, refreshToken?: string, expiresIn?: number, error?: string }}
 */
export function parseOAuthFragment(hash) {
  if (!hash || hash.length < 2) return {};
  const params = new URLSearchParams(hash.substring(1)); // bỏ dấu #
  return {
    accessToken: params.get('access_token') || undefined,
    idToken: params.get('id_token') || undefined,
    refreshToken: params.get('refresh_token') || undefined,
    expiresIn: params.get('expires_in')
      ? Number(params.get('expires_in'))
      : undefined,
    error: params.get('error') || undefined,
    errorDescription: params.get('error_description') || undefined,
  };
}

/**
 * Chuyển tiếng Việt có dấu thành không dấu.
 * @param {string} str
 * @returns {string}
 */
export function removeVietnameseDiacritics(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim();
}

/**
 * Giải mã JWT payload hỗ trợ UTF-8 (không bị lỗi ký tự Latin-1 như atob thuần).
 * @param {string} token
 * @returns {Record<string, any>}
 */
export function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder('utf-8').decode(bytes));
  } catch {
    return {};
  }
}
