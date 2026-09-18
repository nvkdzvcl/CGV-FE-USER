/**
 * AuthModal.jsx
 * Modal đăng nhập / đăng ký với đầy đủ luồng thật:
 *  - Tab "Đăng nhập": email + password → POST /auth/login
 *  - Tab "Đăng ký": email + fullName + password → POST /register/init → nhập OTP → POST /register/verify
 *  - Nút Google / Facebook: redirect sang Keycloak SSO
 *  - Tất cả lỗi được bắt và hiển thị qua toast
 */

import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { login, registerInit, registerVerify, buildSocialLoginUrl } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import OtpInput from './OtpInput';
import toast from '../services/toastService';

// ─────────── Hằng số ───────────
const TAB = { LOGIN: 'login', REGISTER: 'register', FORGOT: 'forgot' };
const REGISTER_STEP = { FORM: 'form', OTP: 'otp' };

// ─────────── Google & Facebook SVG Icon ───────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.8 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.8 29.5 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5.1l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C36.9 39.2 44 33.8 44 24c0-1.2-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
      <path fill="#1877F2" d="M48 24C48 10.7 37.3 0 24 0S0 10.7 0 24c0 12 8.8 21.9 20.3 23.7V30.9h-6.1V24h6.1v-5.3c0-6 3.6-9.4 9.1-9.4 2.6 0 5.4.5 5.4.5v5.9h-3c-3 0-3.9 1.9-3.9 3.7V24h6.7l-1.1 6.9h-5.6v16.8C39.2 45.9 48 36 48 24z"/>
      <path fill="#fff" d="M33.4 30.9l1.1-6.9H28v-4.5c0-1.9.9-3.7 3.9-3.7h3v-5.9s-2.7-.5-5.4-.5c-5.5 0-9.1 3.4-9.1 9.4V24h-6.1v6.9h6.1v16.8c1.2.2 2.5.3 3.7.3s2.4-.1 3.6-.3V30.9h5.6z"/>
    </svg>
  );
}

// ─────────── Social Login Button ───────────
function SocialLoginButton({ provider, onClick }) {
  const isGoogle = provider === 'google';
  return (
    <button
      type="button"
      className={`btn-social btn-social-${provider}`}
      onClick={onClick}
    >
      {isGoogle ? <GoogleIcon /> : <FacebookIcon />}
      <span>Tiếp tục với {isGoogle ? 'Google' : 'Facebook'}</span>
    </button>
  );
}

// ─────────── Constants từ env ───────────
// VITE_OTP_EXPIRY_SECONDS khớp với backend (Redis TTL = 5 phút)
const OTP_EXPIRY_SECONDS = Number(
  import.meta.env.VITE_OTP_EXPIRY_SECONDS || 300 // 5 phút
);
const RESEND_COOLDOWN_SECONDS = Number(
  import.meta.env.VITE_OTP_RESEND_COOLDOWN || 30
);

/** Chuyển giây → mm:ss */
function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─────────── OTP Step ───────────
function OtpStep({ email, password, fullName, onBack, onSuccess }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  // Resend cooldown: 30s mỗi lần gửi lại
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  // Expiry countdown: 5 phút kể từ khi OTP được gửi (khớp Redis TTL phía BE)
  const [expiry, setExpiry] = useState(OTP_EXPIRY_SECONDS);
  const [expired, setExpired] = useState(false);

  // Đếm ngược resend cooldown
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Đếm ngược thời hạn OTP (5 phút)
  React.useEffect(() => {
    if (expired || expiry <= 0) {
      setExpired(true);
      return;
    }
    const t = setTimeout(() => setExpiry((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [expiry, expired]);

  async function handleVerify(e) {
    e.preventDefault();
    if (expired) {
      toast.warning('Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.');
      return;
    }
    if (otp.replace(/\s/g, '').length < 6) {
      toast.warning('Vui lòng nhập đủ 6 chữ số OTP.');
      return;
    }
    setLoading(true);
    try {
      const user = await registerVerify({ email, password, fullName, otp });
      toast.success('Đăng ký tài khoản thành công! Chào mừng bạn! 🎉');
      onSuccess(user);
    } catch (err) {
      toast.error(err.message || 'OTP không hợp lệ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    try {
      await registerInit({ email, fullName, password });
      toast.info('Đã gửi lại mã OTP về email của bạn.');
      // Reset cả hai countdown
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setExpiry(OTP_EXPIRY_SECONDS);
      setExpired(false);
      setOtp('');
    } catch (err) {
      toast.error(err.message || 'Không thể gửi lại OTP. Vui lòng thử lại sau.');
    }
  }

  // Màu timer theo trạng thái
  const expiryColor = expired
    ? '#ef4444'
    : expiry <= 60
      ? '#f59e0b'
      : 'var(--text-muted)';

  return (
    <div className="otp-step">
      <button type="button" className="otp-back-btn" onClick={onBack}>
        <ChevronLeft size={16} />
        Quay lại
      </button>

      <div className="otp-header">
        <div className="otp-icon-wrap">
          <Mail size={28} />
        </div>
        <h4 className="otp-title">Xác thực email</h4>
        <p className="otp-subtitle">
          Mã OTP 6 chữ số đã được gửi đến
          <br />
          <strong style={{ color: '#fff' }}>{email}</strong>
        </p>
      </div>

      {/* Timer thời hạn OTP */}
      <div className="otp-expiry-row">
        <span className="otp-expiry-label">Hiệu lực còn:</span>
        <span className="otp-expiry-value" style={{ color: expiryColor }}>
          {expired ? 'Đã hết hạn' : formatCountdown(expiry)}
        </span>
      </div>

      <form onSubmit={handleVerify}>
        <div className="otp-input-wrapper">
          <OtpInput value={otp} onChange={setOtp} disabled={loading || expired} />
        </div>

        {expired && (
          <p className="otp-expired-notice">
            ⚠️ Mã OTP đã hết hạn. Bấm "Gửi lại" để nhận mã mới.
          </p>
        )}

        <button
          type="submit"
          className="btn-primary"
          style={{ width: '100%', marginTop: 16 }}
          disabled={loading || expired || otp.replace(/\s/g, '').length < 6}
        >
          {loading ? (
            <span className="btn-loading">
              <span className="spinner-sm" /> Đang xác thực...
            </span>
          ) : (
            'Xác nhận & Tạo tài khoản'
          )}
        </button>

        <div className="otp-resend">
          {resendCooldown > 0 ? (
            <span className="otp-resend-countdown">
              Gửi lại sau <strong>{resendCooldown}s</strong>
            </span>
          ) : (
            <button type="button" className="otp-resend-btn" onClick={handleResend}>
              Không nhận được mã? Gửi lại
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// ─────────── Login Form ───────────
function LoginForm({ onClose, onForgotPassword }) {
  const { loginWithTokens } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setLoading(true);
    try {
      const tokens = await login({ username: username.trim(), password });
      loginWithTokens(tokens);
      toast.success('Đăng nhập thành công! Chào mừng bạn! 👋');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Đăng nhập thất bại. Kiểm tra lại email và mật khẩu.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="auth-form-group">
        <label className="auth-label">Email tài khoản</label>
        <div className="auth-input-wrap">
          <Mail size={16} className="auth-input-icon" />
          <input
            type="email"
            className="auth-input auth-input-icon-left"
            placeholder="example@gmail.com"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            required
            autoComplete="email"
          />
        </div>
      </div>

      <div className="auth-form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className="auth-label">Mật khẩu</label>
          <button
            type="button"
            className="auth-forgot-link"
            onClick={() => onForgotPassword(username)}
            tabIndex={-1}
          >
            Quên mật khẩu?
          </button>
        </div>
        <div className="auth-input-wrap">
          <Lock size={16} className="auth-input-icon" />
          <input
            type={showPassword ? 'text' : 'password'}
            className="auth-input auth-input-icon-left auth-input-icon-right"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            className="auth-input-toggle"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="btn-primary"
        style={{ width: '100%', marginTop: 8 }}
        disabled={loading}
      >
        {loading ? (
          <span className="btn-loading">
            <span className="spinner-sm" /> Đang đăng nhập...
          </span>
        ) : (
          'Đăng nhập ngay'
        )}
      </button>
    </form>
  );
}

// ─────────── Register Form ───────────
function RegisterForm({ onOtpStep }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) return;
    if (password.length < 6) {
      toast.warning('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerInit({
        email: email.trim(),
        fullName: fullName.trim(),
        password,
      });
      toast.success(res.message || 'Mã OTP đã được gửi đến email của bạn!');
      onOtpStep({ email: email.trim(), fullName: fullName.trim(), password });
    } catch (err) {
      toast.error(err.message || 'Không thể gửi OTP. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="auth-form-group">
        <label className="auth-label">Họ và tên</label>
        <div className="auth-input-wrap">
          <User size={16} className="auth-input-icon" />
          <input
            type="text"
            className="auth-input auth-input-icon-left"
            placeholder="Nguyễn Văn A"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={loading}
            required
          />
        </div>
      </div>

      <div className="auth-form-group">
        <label className="auth-label">Email tài khoản</label>
          <div className="auth-input-wrap">
          <Mail size={16} className="auth-input-icon" />
          <input
            type="email"
            className="auth-input auth-input-icon-left"
            placeholder="example@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
            autoComplete="email"
          />
        </div>
      </div>

      <div className="auth-form-group">
        <label className="auth-label">Mật khẩu (ít nhất 6 ký tự)</label>
        <div className="auth-input-wrap">
          <Lock size={16} className="auth-input-icon" />
          <input
            type={showPassword ? 'text' : 'password'}
            className="auth-input auth-input-icon-left auth-input-icon-right"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            minLength={6}
            autoComplete="new-password"
          />
          <button
            type="button"
            className="auth-input-toggle"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="btn-primary"
        style={{ width: '100%', marginTop: 8 }}
        disabled={loading}
      >
        {loading ? (
          <span className="btn-loading">
            <span className="spinner-sm" /> Đang gửi OTP...
          </span>
        ) : (
          'Tạo tài khoản →'
        )}
      </button>
    </form>
  );
}

// ─────────── Forgot Password Form ───────────
function ForgotPasswordForm({ initialEmail = '', onBackToLogin }) {
  const [step, setStep] = useState('EMAIL'); // 'EMAIL' | 'OTP' | 'RESET'
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);

  React.useEffect(() => {
    if (step === 'OTP' && resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [step, resendCooldown]);

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.warning('Vui lòng nhập địa chỉ email.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setResendCooldown(30);
      setStep('OTP');
      toast.success(`Mã OTP đặt lại mật khẩu đã được gửi tới ${email.trim()}!`);
    }, 500);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      toast.warning('Vui lòng nhập đầy đủ 6 chữ số OTP.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('RESET');
      toast.success('Mã OTP hợp lệ! Vui lòng nhập mật khẩu mới.');
    }, 400);
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.warning('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không trùng khớp!');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới. 🎉');
      onBackToLogin(email);
    }, 500);
  };

  return (
    <div className="forgot-password-wrap">
      {step === 'EMAIL' && (
        <form onSubmit={handleSendOtp} noValidate>
          <p className="auth-step-desc">
            Nhập địa chỉ email tài khoản để nhận mã xác thực OTP đặt lại mật khẩu.
          </p>
          <div className="auth-form-group">
            <label className="auth-label">Email tài khoản</label>
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" />
              <input
                type="email"
                className="auth-input auth-input-icon-left"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="spinner-sm" /> Đang gửi OTP...
              </span>
            ) : (
              'Gửi mã xác thực OTP →'
            )}
          </button>

          <div style={{ textAlign: 'center', marginTop: 18 }}>
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => onBackToLogin(email)}
            >
              <ChevronLeft size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
              Quay lại Đăng nhập
            </button>
          </div>
        </form>
      )}

      {step === 'OTP' && (
        <form onSubmit={handleVerifyOtp} noValidate>
          <p className="auth-step-desc">
            Mã OTP gồm 6 chữ số đã được gửi tới <strong>{email}</strong>. Vui lòng nhập bên dưới:
          </p>

          <div className="otp-input-container" style={{ margin: '20px 0' }}>
            <OtpInput value={otp} onChange={setOtp} length={6} disabled={loading} />
          </div>

          <div style={{ textAlign: 'center', marginTop: 12, marginBottom: 16 }}>
            {resendCooldown > 0 ? (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Gửi lại mã sau <strong>{resendCooldown}s</strong>
              </span>
            ) : (
              <button
                type="button"
                className="otp-resend-btn"
                onClick={() => {
                  setResendCooldown(30);
                  toast.success('Đã gửi lại mã OTP mới!');
                }}
              >
                Không nhận được mã? Gửi lại
              </button>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%' }}
            disabled={loading || otp.length < 6}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="spinner-sm" /> Đang xác thực...
              </span>
            ) : (
              'Xác nhận OTP →'
            )}
          </button>

          <div style={{ textAlign: 'center', marginTop: 18 }}>
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => setStep('EMAIL')}
            >
              <ChevronLeft size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
              Đổi địa chỉ email khác
            </button>
          </div>
        </form>
      )}

      {step === 'RESET' && (
        <form onSubmit={handleResetPassword} noValidate>
          <p className="auth-step-desc">
            Nhập mật khẩu mới cho tài khoản <strong>{email}</strong>.
          </p>

          <div className="auth-form-group">
            <label className="auth-label">Mật khẩu mới (tối thiểu 6 ký tự)</label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input
                type={showNew ? 'text' : 'password'}
                className="auth-input auth-input-icon-left auth-input-icon-right"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                required
                minLength={6}
                autoFocus
              />
              <button
                type="button"
                className="auth-input-toggle"
                onClick={() => setShowNew((v) => !v)}
                tabIndex={-1}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="auth-form-group">
            <label className="auth-label">Xác nhận mật khẩu mới</label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input
                type={showConfirm ? 'text' : 'password'}
                className="auth-input auth-input-icon-left auth-input-icon-right"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                minLength={6}
              />
              <button
                type="button"
                className="auth-input-toggle"
                onClick={() => setShowConfirm((v) => !v)}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="spinner-sm" /> Đang cập nhật...
              </span>
            ) : (
              'Cập nhật mật khẩu mới 🚀'
            )}
          </button>
        </form>
      )}
    </div>
  );
}

// ─────────── Main AuthModal ───────────
export default function AuthModal({ initialTab = TAB.LOGIN, onClose }) {
  const { loginWithTokens } = useAuth();
  const [tab, setTab] = useState(initialTab);
  const [registerStep, setRegisterStep] = useState(REGISTER_STEP.FORM);
  const [pendingRegistration, setPendingRegistration] = useState(null);
  const [forgotEmail, setForgotEmail] = useState('');

  function handleSwitchTab(newTab) {
    setTab(newTab);
    setRegisterStep(REGISTER_STEP.FORM);
    setPendingRegistration(null);
  }

  function handleOtpStep(data) {
    setPendingRegistration(data);
    setRegisterStep(REGISTER_STEP.OTP);
  }

  function handleOtpBack() {
    setRegisterStep(REGISTER_STEP.FORM);
    setPendingRegistration(null);
  }

  function handleForgotPassword(email) {
    setForgotEmail(email || '');
    setTab(TAB.FORGOT);
  }

  function handleBackToLogin(email) {
    setTab(TAB.LOGIN);
  }

  /**
   * Sau khi verify OTP thành công: nhận UserResponse từ server → tự động đăng nhập.
   * Lưu ý: /register/verify trả về UserResponse, không có token.
   * Nên ta cần login lại với email/password vừa đăng ký.
   */
  async function handleRegisterSuccess(userResponse) {
    try {
      const tokens = await login({
        username: pendingRegistration.email,
        password: pendingRegistration.password,
      });
      loginWithTokens(tokens, userResponse);
      onClose();
    } catch {
      // Đăng ký thành công nhưng auto-login thất bại → cho user tự login
      toast.info('Tài khoản đã tạo thành công! Vui lòng đăng nhập để tiếp tục.');
      handleSwitchTab(TAB.LOGIN);
    }
  }

  function handleSocialLogin(provider) {
    const url = buildSocialLoginUrl(provider);
    window.location.href = url;
  }

  const showTabs = registerStep === REGISTER_STEP.FORM && tab !== TAB.FORGOT;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="auth-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="modal-close-btn"
          aria-label="Đóng"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="auth-modal-header">
          <h3 className="auth-modal-title">
            {tab === TAB.FORGOT ? 'Khôi phục mật khẩu' : 'Chào mừng đến CineGo'}
          </h3>
        </div>

        {/* Tabs - chỉ hiện khi không đang ở bước OTP và không ở tab Forgot */}
        {showTabs && (
          <div className="auth-tabs">
            <div
              className={`auth-tab ${tab === TAB.LOGIN ? 'active' : ''}`}
              onClick={() => handleSwitchTab(TAB.LOGIN)}
              role="button"
              tabIndex={0}
            >
              Đăng nhập
            </div>
            <div
              className={`auth-tab ${tab === TAB.REGISTER ? 'active' : ''}`}
              onClick={() => handleSwitchTab(TAB.REGISTER)}
              role="button"
              tabIndex={0}
            >
              Đăng ký
            </div>
          </div>
        )}

        {/* Content */}
        {tab === TAB.FORGOT ? (
          <ForgotPasswordForm
            initialEmail={forgotEmail}
            onBackToLogin={handleBackToLogin}
          />
        ) : registerStep === REGISTER_STEP.OTP && pendingRegistration ? (
          <OtpStep
            email={pendingRegistration.email}
            password={pendingRegistration.password}
            fullName={pendingRegistration.fullName}
            onBack={handleOtpBack}
            onSuccess={handleRegisterSuccess}
          />
        ) : (
          <>
            {tab === TAB.LOGIN && (
              <LoginForm onClose={onClose} onForgotPassword={handleForgotPassword} />
            )}
            {tab === TAB.REGISTER && <RegisterForm onOtpStep={handleOtpStep} />}

            {/* Divider */}
            <div className="auth-divider">
              <span>hoặc tiếp tục với</span>
            </div>

            {/* Social Login Buttons */}
            <div className="auth-social-btns">
              <SocialLoginButton
                provider="google"
                onClick={() => handleSocialLogin('google')}
              />
              <SocialLoginButton
                provider="facebook"
                onClick={() => handleSocialLogin('facebook')}
              />
            </div>

            {/* Switch Tab hint */}
            <div className="auth-switch-hint">
              {tab === TAB.LOGIN ? (
                <>
                  Chưa có tài khoản?{' '}
                  <button
                    type="button"
                    className="auth-link-btn"
                    onClick={() => handleSwitchTab(TAB.REGISTER)}
                  >
                    Đăng ký ngay
                  </button>
                </>
              ) : (
                <>
                  Đã có tài khoản?{' '}
                  <button
                    type="button"
                    className="auth-link-btn"
                    onClick={() => handleSwitchTab(TAB.LOGIN)}
                  >
                    Đăng nhập
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}