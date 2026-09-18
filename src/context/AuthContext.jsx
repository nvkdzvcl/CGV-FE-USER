/**
 * AuthContext.jsx
 * Global authentication state. Cung cấp:
 *  - currentUser: thông tin user đang đăng nhập
 *  - tokens: { accessToken, refreshToken, expiresIn }
 *  - Các action: loginWithCredentials, loginWithTokens, logoutUser, updateUser
 */

import React, { createContext, useState, useCallback, useEffect } from 'react';
import { decodeJwtPayload } from '../services/authService';
import { saveTokens, getTokens, saveUser, getSavedUser, clearSession } from '../services/userService';
import {
  logout as apiLogout,
  refreshToken as apiRefreshToken,
  buildKeycloakLogoutUrl,
} from '../services/authService';
import toast from '../services/toastService';

export const AuthContext = createContext(null);

/**
 * Tạo đối tượng user từ data trả về API.
 * @param {object} userData - data từ API (UserResponse hoặc JWT claims)
 * @returns {object}
 */
function buildUserObject(userData) {
  return {
    id: userData.id || userData.sub,
    email: userData.email,
    fullName: userData.fullName || userData.name || userData.preferred_username || '',
    role: userData.role,
    membershipTier: userData.membershipTier || { code: 'MEMBER', name: 'Member' },
    total_spend_ytd: userData.total_spend_ytd || 0,
    // Hiển thị trên Navbar
    tier: userData.membershipTier?.code || 'MEMBER',
    loyaltyPoints: userData.total_spend_ytd || 0,
  };
}

export function AuthProvider({ children }) {
  // Khởi tạo state từ localStorage
  const [tokens, setTokens] = useState(() => getTokens());
  const [currentUser, setCurrentUser] = useState(() => getSavedUser());

  // Lưu tokens vào localStorage mỗi khi thay đổi
  useEffect(() => {
    if (tokens) {
      saveTokens(tokens);
    }
  }, [tokens]);

  // Lưu user vào localStorage mỗi khi thay đổi
  useEffect(() => {
    if (currentUser) {
      saveUser(currentUser);
    }
  }, [currentUser]);

  // ──────────────────────────────────────────────────
  // Auto refresh token trước khi hết hạn
  // ──────────────────────────────────────────────────
  useEffect(() => {
    if (!tokens?.accessToken || !tokens?.expiresIn) return;

    // Decode để tính thời gian còn lại
    const payload = decodeJwtPayload(tokens.accessToken);
    const expMs = (payload.exp || 0) * 1000;
    const nowMs = Date.now();
    const refreshAt = expMs - 60_000; // refresh 60s trước khi hết hạn

    if (refreshAt <= nowMs) {
      // Token đã gần hết / hết hạn → thử refresh ngay
      handleTokenRefresh();
      return;
    }

    const timer = setTimeout(handleTokenRefresh, refreshAt - nowMs);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens?.accessToken]);

  async function handleTokenRefresh() {
    if (!tokens?.refreshToken) return;
    try {
      const newTokens = await apiRefreshToken(tokens.refreshToken);
      setTokens(newTokens);
    } catch {
      // Refresh token hết hạn → buộc logout
      handleLogout(false);
    }
  }

  // ──────────────────────────────────────────────────
  // Actions
  // ──────────────────────────────────────────────────

  /**
   * Đăng nhập bằng tokens nhận được từ API (sau login / social callback).
   * @param {{ accessToken, refreshToken, expiresIn }} newTokens
   * @param {object|null} userData - nếu null, decode từ JWT
   */
  const loginWithTokens = useCallback((newTokens, userData = null) => {
    setTokens(newTokens);

    const user = userData
      ? buildUserObject(userData)
      : buildUserObject(decodeJwtPayload(newTokens.accessToken));

    setCurrentUser(user);
    saveUser(user);
    saveTokens(newTokens);
  }, []);

  /**
   * Cập nhật thông tin user (ví dụ sau khi nhập fullName từ social login).
   * @param {Partial<object>} updates
   */
  const updateUser = useCallback((updates) => {
    setCurrentUser((prev) => {
      const updated = prev ? { ...prev, ...updates } : { ...updates };
      saveUser(updated);
      return updated;
    });
  }, []);

  /**
   * Đăng xuất: revoke token trên server, xóa local session.
   * @param {boolean} [showToast=true]
   */
  const handleLogout = useCallback(async (showToast = true) => {
    const idToken = tokens?.idToken;
    try {
      if (tokens?.refreshToken) {
        await apiLogout(tokens.refreshToken);
      }
    } catch {
      // Bỏ qua lỗi logout server-side
    }
    clearSession();
    setTokens(null);
    setCurrentUser(null);
    if (showToast) {
      toast.success('Đã đăng xuất thành công!');
    }
    // Nếu có idToken (từ Social Login), chuyển hướng qua Keycloak với id_token_hint để logout sạch không bị hỏi xác nhận
    if (idToken) {
      window.location.href = buildKeycloakLogoutUrl(idToken);
    } else {
      window.location.href = '/';
    }
  }, [tokens]);

  const value = {
    currentUser,
    tokens,
    isAuthenticated: !!currentUser && !!tokens?.accessToken,
    loginWithTokens,
    updateUser,
    logoutUser: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
