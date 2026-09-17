/**
 * useAuth.js
 * Custom hook để access AuthContext từ bất kỳ component nào.
 */

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * @returns {{
 *   currentUser: object|null,
 *   tokens: { accessToken: string, refreshToken: string, expiresIn: number }|null,
 *   isAuthenticated: boolean,
 *   loginWithTokens: (tokens: object, userData?: object) => void,
 *   updateUser: (updates: object) => void,
 *   logoutUser: (showToast?: boolean) => Promise<void>,
 * }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth phải được sử dụng trong AuthProvider');
  }
  return ctx;
}
