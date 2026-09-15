import React, { useState } from 'react';
import { X, Lock, Mail, User, Shield } from 'lucide-react';

export default function AuthModal({ initialTab = 'login', onClose, onLoginSuccess }) {
  const [tab, setTab] = useState(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = {
      email,
      fullName: fullName || email.split('@')[0],
      tier: 'VIP',
      loyaltyPoints: 12500
    };
    onLoginSuccess(user);
    onClose();
  };

  const handleQuickDemo = (role) => {
    let demoUser = {
      fullName: 'Khách hàng VIP',
      email: 'vip.customer@cinego.vn',
      tier: 'VIP',
      loyaltyPoints: 15400
    };
    if (role === 'vvip') {
      demoUser = {
        fullName: 'Hội viên Bạch Kim (Platinum)',
        email: 'vvip.member@cinego.vn',
        tier: 'VVIP',
        loyaltyPoints: 42000
      };
    } else if (role === 'admin') {
      demoUser = {
        fullName: 'Quản trị viên Hệ thống',
        email: 'admin@cinego.vn',
        tier: 'ADMIN',
        loyaltyPoints: 99999
      };
    }
    onLoginSuccess(demoUser);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="auth-modal-box" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 20, right: 20, color: 'var(--text-muted)' }}
        >
          <X size={20} />
        </button>

        <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: 18, textAlign: 'center' }}>
          Chào mừng đến CineGo
        </h3>

        <div className="auth-tabs">
          <div
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => setTab('login')}
          >
            Đăng nhập
          </div>
          <div
            className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => setTab('register')}
          >
            Đăng ký
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {tab === 'register' && (
            <div className="auth-form-group">
              <label className="auth-label">Họ và tên</label>
              <input
                type="text"
                required
                className="auth-input"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>
          )}

          <div className="auth-form-group">
            <label className="auth-label">Email tài khoản</label>
            <input
              type="email"
              required
              className="auth-input"
              placeholder="example@gmail.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-label">Mật khẩu</label>
            <input
              type="password"
              required
              className="auth-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }}>
            {tab === 'login' ? 'Đăng nhập ngay' : 'Tạo tài khoản'}
          </button>
        </form>

        {/* Demo Fast Logins */}
        <div className="auth-demo-accounts">
          <div className="auth-demo-title">Đăng nhập nhanh với tài khoản Demo:</div>
          <div className="auth-demo-btns">
            <button className="btn-demo-acc" onClick={() => handleQuickDemo('vip')}>
              VIP Member
            </button>
            <button className="btn-demo-acc" onClick={() => handleQuickDemo('vvip')}>
              Platinum VVIP
            </button>
            <button className="btn-demo-acc" onClick={() => handleQuickDemo('admin')}>
              Admin Root
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}