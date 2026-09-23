/**
 * OAuthCallbackPage.jsx
 * Trang xử lý callback sau khi Keycloak redirect về sau social login.
 *
 * Luồng:
 * 1. Parse URL fragment để lấy access_token (implicit flow)
 * 2. Gọi POST /auth/social-sync với Bearer token để sync user vào DB local
 * 3. Decode JWT để lấy thông tin user
 * 4. Nếu user chưa có fullName → hiện SocialSyncModal
 * 5. Ngược lại → redirect về trang chủ với toast chào mừng
 */

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import {
  parseOAuthFragment,
  exchangeCodeForTokens,
  decodeJwtPayload,
  socialSync,
  removeVietnameseDiacritics,
} from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import SocialSyncModal from '../components/SocialSyncModal';
import toast from '../services/toastService';

// Trạng thái xử lý callback
const STATUS = {
  LOADING: 'loading',
  NEED_NAME: 'need_name',
  ERROR: 'error',
  DONE: 'done',
};

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const { loginWithTokens } = useAuth();
  const [status, setStatus] = useState(STATUS.LOADING);
  const [errorMessage, setErrorMessage] = useState('');
  const [userAccessToken, setUserAccessToken] = useState('');
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;
    handleCallback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCallback() {
    // 1. Kiểm tra Authorization Code trong query params (?code=...&error=...)
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    const queryError = searchParams.get('error');
    const queryErrorDesc = searchParams.get('error_description');

    if (queryError) {
      const msg = queryErrorDesc
        ? decodeURIComponent(queryErrorDesc.replace(/\+/g, ' '))
        : 'Đăng nhập mạng xã hội thất bại.';
      setErrorMessage(msg);
      setStatus(STATUS.ERROR);
      toast.error(msg);
      return;
    }

    let tokens = null;

    if (code) {
      try {
        tokens = await exchangeCodeForTokens(code);
      } catch (exErr) {
        console.error('Exchange code error:', exErr);
        setErrorMessage('Không thể xác thực mã đăng nhập từ Google. Vui lòng thử lại: ' + exErr.message);
        setStatus(STATUS.ERROR);
        toast.error(exErr.message);
        return;
      }
    } else {
      // Fallback: Parse fragment từ URL (#access_token=...&id_token=...&expires_in=...)
      const frag = parseOAuthFragment(window.location.hash);
      if (frag.error) {
        const msg = frag.errorDescription
          ? decodeURIComponent(frag.errorDescription.replace(/\+/g, ' '))
          : 'Đăng nhập xã hội thất bại.';
        setErrorMessage(msg);
        setStatus(STATUS.ERROR);
        toast.error(msg);
        return;
      }

      if (frag.accessToken) {
        tokens = {
          accessToken: frag.accessToken,
          idToken: frag.idToken || null,
          refreshToken: frag.refreshToken || null,
          expiresIn: frag.expiresIn || 300,
        };
      }
    }

    if (!tokens || !tokens.accessToken) {
      setErrorMessage('Không nhận được token từ nhà cung cấp. Vui lòng thử lại.');
      setStatus(STATUS.ERROR);
      return;
    }

    try {
      // Xóa query param / fragment khỏi URL (bảo mật - không để code/token lộ trong history)
      window.history.replaceState({}, document.title, window.location.pathname);

      const accessToken = tokens.accessToken;

      // Decode JWT để lấy thông tin claim cơ bản
      const claims = decodeJwtPayload(accessToken);

      // Gọi social-sync để tạo/lấy user trong DB local
      let userData = null;
      try {
        userData = await socialSync(accessToken);
      } catch (syncErr) {
        console.warn('socialSync warning:', syncErr.message);
      }

      const savedFullName = userData?.fullName || claims?.name || '';

      // Lưu tokens (gồm cả accessToken và refreshToken) + tạo user object
      loginWithTokens(tokens, {
        id: userData?.id || claims.sub,
        email: userData?.email || claims.email || '',
        fullName: savedFullName,
        role: 'USER',
        membershipTier: userData?.membershipTier || { code: 'MEMBER', name: 'Member' },
      });

      // Kiểm tra xem tài khoản này đã có họ và tên lưu trong DB chưa
      const hasSavedName = !!(savedFullName && savedFullName.trim().length > 0);
      if (!hasSavedName) {
        setUserAccessToken(accessToken);
        setStatus(STATUS.NEED_NAME);
      } else {
        toast.success(`Đăng nhập thành công! Chào mừng, ${savedFullName}! 🎉`);
        setStatus(STATUS.DONE);
        navigate('/', { replace: true });
      }
    } catch (err) {
      const msg = err.message || 'Có lỗi xảy ra trong quá trình đồng bộ tài khoản.';
      setErrorMessage(msg);
      setStatus(STATUS.ERROR);
      toast.error(msg);
    }
  }

  function handleSyncModalClose() {
    navigate('/', { replace: true });
  }

  // ── Render ──
  if (status === STATUS.LOADING) {
    return (
      <div className="oauth-callback-screen">
        <div className="oauth-callback-card">
          <Loader2 size={48} className="oauth-spinner" />
          <h3 className="oauth-callback-title">Đang xử lý đăng nhập...</h3>
          <p className="oauth-callback-subtitle">
            Vui lòng đợi trong giây lát, chúng tôi đang đồng bộ tài khoản của bạn.
          </p>
        </div>
      </div>
    );
  }

  if (status === STATUS.ERROR) {
    return (
      <div className="oauth-callback-screen">
        <div className="oauth-callback-card oauth-callback-error">
          <AlertCircle size={48} className="oauth-error-icon" />
          <h3 className="oauth-callback-title">Đăng nhập thất bại</h3>
          <p className="oauth-callback-subtitle">{errorMessage}</p>
          <button
            className="btn-primary"
            style={{ marginTop: 24 }}
            onClick={() => navigate('/', { replace: true })}
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (status === STATUS.NEED_NAME) {
    return (
      <>
        <div className="oauth-callback-screen">
          <div className="oauth-callback-card">
            <Loader2 size={32} className="oauth-spinner" style={{ opacity: 0.3 }} />
            <p className="oauth-callback-subtitle">Đã kết nối tài khoản thành công. Vui lòng thiết lập họ và tên.</p>
          </div>
        </div>
        <SocialSyncModal
          accessToken={userAccessToken}
          onSuccess={() => {
            setStatus(STATUS.DONE);
            navigate('/', { replace: true });
          }}
          onClose={handleSyncModalClose}
        />
      </>
    );
  }

  return null; // STATUS.DONE - đã navigate
}
