/**
 * ProfilePage.jsx
 * Trang xem và quản lý hồ sơ người dùng CGV Cinema:
 *  - Thông tin cá nhân & Cho phép sửa (Họ tên, SĐT, Ngày sinh, Giới tính, Địa chỉ)
 *  - Hạng thành viên (Membership Tier), Thẻ CGV 3D ảo, Điểm tích lũy, Thanh tiến trình thăng hạng
 *  - Chuyển nhanh hạng thẻ (MEMBER, VIP, VVIP) để test giao diện
 *  - Đổi mật khẩu bảo mật (Mật khẩu cũ, Mật khẩu mới, Xác nhận mật khẩu)
 *  - Quản lý tài khoản mạng xã hội liên kết (Google, Facebook)
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  User,
  Crown,
  Lock,
  Share2,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Ticket,
  CreditCard,
  ScanLine,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ApiService } from '../services/api';
import toast from '../services/toastService';
import TicketDetailModal from '../components/TicketDetailModal';
import '../styles/profile.css';

// SVG Icons cho Social Login
function GoogleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.8 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.8 29.5 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5.1l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C36.9 39.2 44 33.8 44 24c0-1.2-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
      <path fill="#1877F2" d="M48 24C48 10.7 37.3 0 24 0S0 10.7 0 24c0 12 8.8 21.9 20.3 23.7V30.9h-6.1V24h6.1v-5.3c0-6 3.6-9.4 9.1-9.4 2.6 0 5.4.5 5.4.5v5.9h-3c-3 0-3.9 1.9-3.9 3.7V24h6.7l-1.1 6.9h-5.6v16.8C39.2 45.9 48 36 48 24z"/>
      <path fill="#fff" d="M33.4 30.9l1.1-6.9H28v-4.5c0-1.9.9-3.7 3.9-3.7h3v-5.9s-2.7-.5-5.4-.5c-5.5 0-9.1 3.4-9.1 9.4V24h-6.1v6.9h6.1v16.8c1.2.2 2.5.3 3.7.3s2.4-.1 3.6-.3V30.9h5.6z"/>
    </svg>
  );
}

const TABS = {
  INFO: 'info',
  MEMBERSHIP: 'membership',
  BOOKINGS: 'bookings',
  SECURITY: 'security',
  SOCIAL: 'social',
};

// Dữ liệu người dùng mẫu chuẩn (Mock data cho test)
const DEFAULT_MOCK_PROFILE = {
  id: 'cgv-usr-2026-huy',
  fullName: 'Lê Hữu Huy',
  email: 'lhhuy.2005@gmail.com',
  phone: '0987 654 321',
  birthDate: '2005-11-21',
  gender: 'MALE',
  address: 'Quận 1, TP. Hồ Chí Minh',
  role: 'USER',
  tier: 'VIP',
  membershipTier: { code: 'VIP', name: 'VIP Member' },
  total_spend_ytd: 5450000,
  loyaltyPoints: 381500,
  connectedAccounts: {
    google: true,
    facebook: false,
  },
};

// Lấy profile ban đầu (kết hợp mock và currentUser nếu có)
function getInitialProfile(currentUser) {
  let saved = null;
  try {
    const raw = localStorage.getItem('cgv_mock_profile');
    if (raw) saved = JSON.parse(raw);
  } catch {
    // Bỏ qua lỗi parse
  }

  const base = {
    ...DEFAULT_MOCK_PROFILE,
    ...(saved || {}),
    ...(currentUser || {}),
  };

  return {
    ...base,
    fullName: currentUser?.fullName || saved?.fullName || DEFAULT_MOCK_PROFILE.fullName,
    email: currentUser?.email || saved?.email || DEFAULT_MOCK_PROFILE.email,
    phone: currentUser?.phone || saved?.phone || DEFAULT_MOCK_PROFILE.phone,
    birthDate: currentUser?.birthDate || saved?.birthDate || DEFAULT_MOCK_PROFILE.birthDate,
    gender: currentUser?.gender || saved?.gender || DEFAULT_MOCK_PROFILE.gender,
    address: currentUser?.address || saved?.address || DEFAULT_MOCK_PROFILE.address,
    tier: (currentUser?.membershipTier?.code || currentUser?.tier || saved?.tier || DEFAULT_MOCK_PROFILE.tier).toUpperCase(),
    total_spend_ytd: Number(currentUser?.total_spend_ytd ?? saved?.total_spend_ytd ?? DEFAULT_MOCK_PROFILE.total_spend_ytd),
    loyaltyPoints: Number(currentUser?.loyaltyPoints ?? saved?.loyaltyPoints ?? DEFAULT_MOCK_PROFILE.loyaltyPoints),
    connectedAccounts: {
      ...DEFAULT_MOCK_PROFILE.connectedAccounts,
      ...(saved?.connectedAccounts || {}),
      ...(currentUser?.connectedAccounts || {}),
    },
  };
}

export default function ProfilePage() {
  const { currentUser, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab hiện tại
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(urlTab || TABS.INFO);

  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab, activeTab]);

  // Profile Data State
  const [profile, setProfile] = useState(() => getInitialProfile(currentUser));

  // State Form Thông tin cá nhân
  const [infoForm, setInfoForm] = useState({
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    birthDate: profile.birthDate,
    gender: profile.gender,
    address: profile.address,
  });
  const [infoLoading, setInfoLoading] = useState(false);

  // State Form Đổi mật khẩu
  const [pwdForm, setPwdForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  // State Lịch sử vé đã đặt
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [selectedTicketModal, setSelectedTicketModal] = useState(null);
  const [bookingFilterStatus, setBookingFilterStatus] = useState('CONFIRMED');

  const fetchBookings = async () => {
    setBookingsLoading(true);
    try {
      const res = await ApiService.getMyBookings(0, 30);
      const list = Array.isArray(res) ? res : (res?.data || []);

      // Tự động làm giàu thông tin suất chiếu từ catalog nếu các trường đang rỗng
      const enrichedList = await Promise.all(
        list.map(async (b) => {
          let enriched = { ...b };
          if (b.showtimeId && (!b.movieTitle || !b.showtimeStart || !b.cinemaName)) {
            try {
              const sRes = await ApiService.getShowtimeById(b.showtimeId);
              const s = sRes?.data || sRes;
              if (s) {
                enriched.movieTitle = enriched.movieTitle || s.movieTitle || s.movie?.title;
                enriched.cinemaName = enriched.cinemaName || s.roomResponse?.cinemaResponse?.name;
                enriched.cinemaAddress = enriched.cinemaAddress || s.roomResponse?.cinemaResponse?.address;
                enriched.roomName = enriched.roomName || s.roomResponse?.name;
                enriched.showtimeStart = enriched.showtimeStart || s.startTime;
              }
            } catch (err) {
              console.warn('Lỗi làm giàu showtime cho booking:', b.bookingId, err);
            }
          }
          return enriched;
        })
      );

      setBookings(enrichedList);
    } catch (err) {
      console.warn('Could not load user bookings:', err.message);
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === TABS.BOOKINGS) {
      fetchBookings();
    }
  }, [activeTab]);

  const handlePayPendingBooking = async (booking) => {
    try {
      const paymentUrl = await ApiService.createVnpayPaymentUrl(booking.bookingId, booking.finalAmount);
      if (paymentUrl && paymentUrl.startsWith('http')) {
        window.location.href = paymentUrl;
      } else {
        toast.warning('Không thể tạo liên kết thanh toán lúc này.');
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi tạo liên kết thanh toán VNPAY');
    }
  };

  const handleCancelPendingBooking = async (bookingId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn đặt vé này và trả lại ghế?')) return;
    try {
      await ApiService.cancelBooking(bookingId);
      toast.success('Đã hủy đơn đặt vé thành công!');
      fetchBookings();
    } catch (err) {
      toast.error(err.message || 'Không thể hủy đơn đặt vé.');
    }
  };

  // Khi currentUser thay đổi từ auth context (đăng nhập/đăng xuất)
  useEffect(() => {
    const updated = getInitialProfile(currentUser);
    setProfile(updated);
    setInfoForm({
      fullName: updated.fullName,
      email: updated.email,
      phone: updated.phone,
      birthDate: updated.birthDate,
      gender: updated.gender,
      address: updated.address,
    });
  }, [currentUser]);

  // Đổi tab
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  // ── Xử lý Chuyển đổi nhanh Hạng thẻ (Mock Test Switcher) ──
  const handleSwitchTier = (newTier) => {
    let newSpend = 1200000;
    let newPoints = 60000;
    if (newTier === 'VIP') {
      newSpend = 5450000;
      newPoints = 381500;
    } else if (newTier === 'VVIP') {
      newSpend = 12500000;
      newPoints = 1250000;
    }

    const updated = {
      ...profile,
      tier: newTier,
      membershipTier: { code: newTier, name: `${newTier} Member` },
      total_spend_ytd: newSpend,
      loyaltyPoints: newPoints,
    };

    setProfile(updated);
    try {
      localStorage.setItem('cgv_mock_profile', JSON.stringify(updated));
    } catch {
      // ignore
    }
    updateUser(updated);
    toast.info(`Đã chuyển đổi xem trước hạng: ${newTier}`);
  };

  // ── Xử lý Khôi phục dữ liệu mẫu ban đầu ──
  const handleResetMockData = () => {
    if (window.confirm('Khôi phục lại dữ liệu hồ sơ mẫu chuẩn (Lê Hữu Huy - VIP)?')) {
      try {
        localStorage.removeItem('cgv_mock_profile');
      } catch {
        // ignore
      }
      const reset = { ...DEFAULT_MOCK_PROFILE };
      setProfile(reset);
      setInfoForm({
        fullName: reset.fullName,
        email: reset.email,
        phone: reset.phone,
        birthDate: reset.birthDate,
        gender: reset.gender,
        address: reset.address,
      });
      updateUser(reset);
      toast.success('Đã khôi phục dữ liệu hồ sơ mẫu ban đầu!');
    }
  };

  // ── Xử lý Lưu thông tin cá nhân ──
  const handleSaveInfo = (e) => {
    e.preventDefault();
    if (!infoForm.fullName.trim()) {
      toast.warning('Vui lòng không để trống họ và tên.');
      return;
    }

    setInfoLoading(true);
    setTimeout(() => {
      const updated = {
        ...profile,
        fullName: infoForm.fullName.trim(),
        phone: infoForm.phone,
        birthDate: infoForm.birthDate,
        gender: infoForm.gender,
        address: infoForm.address,
      };

      setProfile(updated);
      try {
        localStorage.setItem('cgv_mock_profile', JSON.stringify(updated));
      } catch {
        // ignore
      }
      updateUser(updated);
      setInfoLoading(false);
      toast.success('Cập nhật hồ sơ cá nhân thành công! 🎉');
    }, 300);
  };

  // ── Xử lý Đổi mật khẩu ──
  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!pwdForm.oldPassword) {
      toast.warning('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (!pwdForm.newPassword || pwdForm.newPassword.length < 6) {
      toast.warning('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast.error('Mật khẩu xác nhận không trùng khớp!');
      return;
    }
    if (pwdForm.oldPassword === pwdForm.newPassword) {
      toast.warning('Mật khẩu mới không được trùng với mật khẩu cũ.');
      return;
    }

    setPwdLoading(true);
    setTimeout(() => {
      setPwdLoading(false);
      setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Đổi mật khẩu thành công! Mật khẩu mới đã có hiệu lực. 🔒');
    }, 450);
  };

  // ── Xử lý Liên kết mạng xã hội (Mock) ──
  const handleToggleSocial = (provider) => {
    const isCurrentlyConnected = profile.connectedAccounts?.[provider];
    if (isCurrentlyConnected) {
      if (window.confirm(`Bạn có chắc chắn muốn hủy liên kết tài khoản ${provider.toUpperCase()}?`)) {
        const updatedAccounts = { ...profile.connectedAccounts, [provider]: false };
        const updated = { ...profile, connectedAccounts: updatedAccounts };
        setProfile(updated);
        try {
          localStorage.setItem('cgv_mock_profile', JSON.stringify(updated));
        } catch {}
        updateUser(updated);
        toast.info(`Đã hủy liên kết tài khoản ${provider.toUpperCase()}.`);
      }
    } else {
      const updatedAccounts = { ...profile.connectedAccounts, [provider]: true };
      const updated = { ...profile, connectedAccounts: updatedAccounts };
      setProfile(updated);
      try {
        localStorage.setItem('cgv_mock_profile', JSON.stringify(updated));
      } catch {}
      updateUser(updated);
      toast.success(`Đã kết nối tài khoản ${provider.toUpperCase()} thành công! 🎉`);
    }
  };

  // Avatar chữ cái
  const avatarLetter = (infoForm.fullName || profile.fullName || 'C')
    .trim()
    .charAt(0)
    .toUpperCase();

  // Tier info tính toán
  const currentTier = (profile.tier || 'MEMBER').toUpperCase();
  const spendYTD = Number(profile.total_spend_ytd || 0);
  const nextTierTarget = currentTier === 'MEMBER' ? 4000000 : currentTier === 'VIP' ? 8000000 : 12000000;
  const progressPercent = Math.min(Math.round((spendYTD / nextTierTarget) * 100), 100);
  const points = Number(profile.loyaltyPoints || 0);

  return (
    <div className="profile-container">
      {/* ── Mock Test Info Banner ── */}
      <div className="profile-mock-banner">
        <div className="profile-mock-text">
          <Sparkles size={18} style={{ color: '#c084fc' }} />
          <span>
            Đang hiển thị hồ sơ mẫu: <strong>{profile.fullName}</strong> ({profile.email})
          </span>
          <span className="profile-mock-badge">Mock Mode</span>
        </div>

        <div className="profile-mock-controls">
          <div className="tier-switcher" title="Chuyển nhanh hạng thành viên để test giao diện thẻ 3D">
            <button
              type="button"
              className={`tier-btn ${currentTier === 'MEMBER' ? 'active member' : ''}`}
              onClick={() => handleSwitchTier('MEMBER')}
            >
              MEMBER
            </button>
            <button
              type="button"
              className={`tier-btn ${currentTier === 'VIP' ? 'active vip' : ''}`}
              onClick={() => handleSwitchTier('VIP')}
            >
              VIP
            </button>
            <button
              type="button"
              className={`tier-btn ${currentTier === 'VVIP' ? 'active vvip' : ''}`}
              onClick={() => handleSwitchTier('VVIP')}
            >
              VVIP
            </button>
          </div>

          <button
            type="button"
            className="btn-reset-mock"
            onClick={handleResetMockData}
            title="Khôi phục dữ liệu mẫu ban đầu"
          >
            <RotateCcw size={13} style={{ display: 'inline', marginRight: 4 }} />
            Khôi phục
          </button>
        </div>
      </div>

      {/* ── Banner Header Hồ Sơ ── */}
      <section className="profile-hero">
        <div className="profile-hero-left">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">
              <span>{avatarLetter}</span>
            </div>
            <button
              type="button"
              className="profile-avatar-badge"
              title="Đổi ảnh đại diện"
              onClick={() => toast.info('Chức năng tải ảnh đại diện sẽ sớm được tích hợp!')}
            >
              <Camera size={14} />
            </button>
          </div>

          <div className="profile-hero-info">
            <h2>
              {infoForm.fullName || profile.fullName || 'Thành viên CGV'}
              <span className={`profile-tier-badge ${currentTier === 'VIP' ? 'tier-vip' : currentTier === 'VVIP' ? 'tier-vvip' : ''}`}>
                <Crown size={12} /> {currentTier}
              </span>
            </h2>
            <p>{profile.email}</p>
          </div>
        </div>

        <div className="profile-hero-stats">
          <div className="profile-stat-box">
            <div className="stat-label">Điểm CGV Points</div>
            <div className="stat-value gold">
              <Sparkles size={16} style={{ display: 'inline', marginRight: 4 }} />
              {points.toLocaleString('vi-VN')} pts
            </div>
          </div>
          <div className="profile-stat-box">
            <div className="stat-label">Chi tiêu năm nay (YTD)</div>
            <div className="stat-value">
              {spendYTD.toLocaleString('vi-VN')} ₫
            </div>
          </div>
        </div>
      </section>

      {/* ── Layout Thân Trang: Sidebar Tabs & Main Content ── */}
      <div className="profile-layout">
        {/* Sidebar Tabs */}
        <aside className="profile-nav-sidebar">
          <button
            type="button"
            className={`profile-nav-btn ${activeTab === TABS.INFO ? 'active' : ''}`}
            onClick={() => handleTabChange(TABS.INFO)}
          >
            <User size={18} />
            Thông tin tài khoản
          </button>
          <button
            type="button"
            className={`profile-nav-btn ${activeTab === TABS.MEMBERSHIP ? 'active' : ''}`}
            onClick={() => handleTabChange(TABS.MEMBERSHIP)}
          >
            <Crown size={18} />
            Hạng thành viên & Điểm
          </button>
          <button
            type="button"
            className={`profile-nav-btn ${activeTab === TABS.BOOKINGS ? 'active' : ''}`}
            onClick={() => handleTabChange(TABS.BOOKINGS)}
          >
            <Ticket size={18} />
            Vé của tôi (Lịch sử)
          </button>
          <button
            type="button"
            className={`profile-nav-btn ${activeTab === TABS.SECURITY ? 'active' : ''}`}
            onClick={() => handleTabChange(TABS.SECURITY)}
          >
            <Lock size={18} />
            Bảo mật & Đổi mật khẩu
          </button>
          <button
            type="button"
            className={`profile-nav-btn ${activeTab === TABS.SOCIAL ? 'active' : ''}`}
            onClick={() => handleTabChange(TABS.SOCIAL)}
          >
            <Share2 size={18} />
            Tài khoản liên kết
          </button>
        </aside>

        {/* Nội dung chính theo Tab */}
        <main className="profile-card">
          {/* ──────── TAB 1: THÔNG TIN CÁ NHÂN ──────── */}
          {activeTab === TABS.INFO && (
            <div>
              <div className="profile-card-header">
                <h3>
                  <User size={22} className="text-primary" /> Thông tin cá nhân
                </h3>
                <p>Quản lý họ tên, số điện thoại và thông tin liên hệ của bạn tại CGV Cinemas</p>
              </div>

              <form onSubmit={handleSaveInfo}>
                <div className="profile-form-grid">
                  {/* Họ và tên */}
                  <div className="auth-form-group">
                    <label className="auth-label">Họ và tên</label>
                    <div className="auth-input-wrap">
                      <User size={16} className="auth-input-icon" />
                      <input
                        type="text"
                        className="auth-input auth-input-icon-left"
                        value={infoForm.fullName}
                        onChange={(e) => setInfoForm({ ...infoForm, fullName: e.target.value })}
                        placeholder="Nhập họ và tên..."
                        required
                      />
                    </div>
                  </div>

                  {/* Email (Read-only) */}
                  <div className="auth-form-group">
                    <label className="auth-label">
                      Email tài khoản
                      <span className="field-hint-badge">
                        <CheckCircle2 size={11} style={{ display: 'inline', marginRight: 3 }} />
                        Đã xác thực
                      </span>
                    </label>
                    <div className="auth-input-wrap">
                      <Mail size={16} className="auth-input-icon" />
                      <input
                        type="email"
                        className="auth-input auth-input-icon-left profile-field-readonly"
                        value={infoForm.email}
                        readOnly
                        title="Email định danh duy nhất không thể thay đổi"
                      />
                    </div>
                  </div>

                  {/* Số điện thoại */}
                  <div className="auth-form-group">
                    <label className="auth-label">Số điện thoại nhận vé</label>
                    <div className="auth-input-wrap">
                      <Phone size={16} className="auth-input-icon" />
                      <input
                        type="tel"
                        className="auth-input auth-input-icon-left"
                        value={infoForm.phone}
                        onChange={(e) => setInfoForm({ ...infoForm, phone: e.target.value })}
                        placeholder="0912 345 678"
                      />
                    </div>
                  </div>

                  {/* Ngày sinh */}
                  <div className="auth-form-group">
                    <label className="auth-label">Ngày sinh (nhận quà sinh nhật)</label>
                    <div className="auth-input-wrap">
                      <Calendar size={16} className="auth-input-icon" />
                      <input
                        type="date"
                        className="auth-input auth-input-icon-left"
                        value={infoForm.birthDate}
                        onChange={(e) => setInfoForm({ ...infoForm, birthDate: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Giới tính */}
                  <div className="auth-form-group">
                    <label className="auth-label">Giới tính</label>
                    <select
                      className="auth-input"
                      value={infoForm.gender}
                      onChange={(e) => setInfoForm({ ...infoForm, gender: e.target.value })}
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>

                  {/* Địa chỉ */}
                  <div className="auth-form-group">
                    <label className="auth-label">Tỉnh / Thành phố sinh sống</label>
                    <div className="auth-input-wrap">
                      <MapPin size={16} className="auth-input-icon" />
                      <input
                        type="text"
                        className="auth-input auth-input-icon-left"
                        value={infoForm.address}
                        onChange={(e) => setInfoForm({ ...infoForm, address: e.target.value })}
                        placeholder="TP. Hồ Chí Minh, Hà Nội, Đà Nẵng..."
                      />
                    </div>
                  </div>
                </div>

                <div className="profile-actions">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={infoLoading}
                    style={{ minWidth: 160 }}
                  >
                    {infoLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ──────── TAB 2: HẠNG THÀNH VIÊN & ĐIỂM ──────── */}
          {activeTab === TABS.MEMBERSHIP && (
            <div>
              <div className="profile-card-header">
                <h3>
                  <Crown size={22} className="text-primary" /> Hạng thẻ & Quyền lợi CGV
                </h3>
                <p>Tích lũy chi tiêu vé phim và bắp nước để thăng hạng và nhận các ưu đãi độc quyền</p>
              </div>

              {/* Thẻ thành viên 3D ảo */}
              <div className="virtual-card-wrapper">
                <div className={`virtual-card ${currentTier === 'VIP' ? 'tier-vip' : currentTier === 'VVIP' ? 'tier-vvip' : ''}`}>
                  <div className="virtual-card-top">
                    <span className="virtual-card-logo">CGV CINEMAS</span>
                    <div className="virtual-card-chip" />
                  </div>

                  <div className="virtual-card-number">
                    9928 •••• •••• {String(profile.id || '2026').substring(0, 4).toUpperCase()}
                  </div>

                  <div className="virtual-card-bottom">
                    <div className="virtual-card-holder">
                      <span className="virtual-card-label">Chủ thẻ</span>
                      <span className="virtual-card-name">
                        {infoForm.fullName || profile.fullName || 'QUÝ KHÁCH HÀNG'}
                      </span>
                    </div>
                    <span className="virtual-card-badge">
                      {currentTier} MEMBER
                    </span>
                  </div>
                </div>
              </div>

              {/* Tiến trình thăng hạng */}
              <div className="tier-progress-card">
                <div className="tier-progress-header">
                  <span style={{ fontWeight: 700, color: '#fff' }}>
                    Tiến độ thăng hạng {currentTier === 'MEMBER' ? 'VIP' : 'VVIP'}
                  </span>
                  <span style={{ color: '#fbbf24', fontWeight: 800 }}>
                    {progressPercent}%
                  </span>
                </div>
                <div className="tier-progress-bar">
                  <div className="tier-progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>
                <div className="tier-progress-info">
                  <span>Đã chi tiêu: {spendYTD.toLocaleString('vi-VN')} ₫</span>
                  <span>Mục tiêu: {nextTierTarget.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>

              {/* Bảng quyền lợi */}
              <h4 style={{ color: '#fff', margin: '24px 0 12px', fontSize: '1.05rem' }}>
                Bảng so sánh quyền lợi các hạng thẻ
              </h4>
              <table className="benefits-table">
                <thead>
                  <tr>
                    <th>Quyền lợi</th>
                    <th style={currentTier === 'MEMBER' ? { color: '#ff2b54', fontWeight: 800 } : {}}>MEMBER</th>
                    <th style={currentTier === 'VIP' ? { color: '#fbbf24', fontWeight: 800 } : {}}>VIP</th>
                    <th style={currentTier === 'VVIP' ? { color: '#c084fc', fontWeight: 800 } : {}}>VVIP</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Tỷ lệ tích điểm CGV Points</td>
                    <td>5% chi tiêu</td>
                    <td style={{ color: '#fbbf24', fontWeight: 700 }}>7% chi tiêu</td>
                    <td style={{ color: '#c084fc', fontWeight: 700 }}>10% chi tiêu</td>
                  </tr>
                  <tr>
                    <td>Vé phim miễn phí sinh nhật</td>
                    <td>1 Vé 2D</td>
                    <td>2 Vé 2D</td>
                    <td>4 Vé 2D / 3D VIP</td>
                  </tr>
                  <tr>
                    <td>Bắp nước ngày sinh nhật</td>
                    <td>1 Bắp ngọt</td>
                    <td>1 Combo bắp nước lớn</td>
                    <td>Combo bắp nước Premium</td>
                  </tr>
                  <tr>
                    <td>Ưu tiên phòng chờ & xếp hàng vé</td>
                    <td>—</td>
                    <td>Có</td>
                    <td>Ưu tiên đặc biệt</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* ──────── TAB 2.5: VÉ CỦA TÔI (LỊCH SỬ ĐẶT VÉ) ──────── */}
          {activeTab === TABS.BOOKINGS && (
            <div>
              <div className="profile-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>
                    <Ticket size={22} className="text-primary" /> Lịch sử đặt vé & Vé của tôi
                  </h3>
                  <p>Quản lý các vé xem phim đã đặt, tiếp tục thanh toán hoặc hủy vé chờ</p>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={fetchBookings}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: '0.85rem' }}
                >
                  <RotateCcw size={15} /> Làm mới
                </button>
              </div>

              {/* Filter Tabs: Mặc định chỉ hiển thị vé đã thanh toán */}
              <div style={{ display: 'flex', gap: 10, margin: '14px 0 18px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
                <button
                  type="button"
                  onClick={() => setBookingFilterStatus('CONFIRMED')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 20,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    background: bookingFilterStatus === 'CONFIRMED' ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                    color: bookingFilterStatus === 'CONFIRMED' ? '#fff' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🎟️ Vé đã thanh toán ({bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'SUCCESS').length})
                </button>
                <button
                  type="button"
                  onClick={() => setBookingFilterStatus('ALL')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 20,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    background: bookingFilterStatus === 'ALL' ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                    color: bookingFilterStatus === 'ALL' ? '#fff' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  📜 Tất cả lịch sử ({bookings.length})
                </button>
              </div>

              {(() => {
                const displayedBookings = bookingFilterStatus === 'CONFIRMED'
                  ? bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'SUCCESS')
                  : bookings;

                if (bookingsLoading) {
                  return (
                    <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-secondary)' }}>
                      <RotateCcw size={32} className="spin-animate" style={{ margin: '0 auto 12px' }} />
                      <p>Đang tải danh sách vé của bạn...</p>
                    </div>
                  );
                }

                if (displayedBookings.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--border-subtle)', borderRadius: 14 }}>
                      <Ticket size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 14px' }} />
                      <h4 style={{ color: '#fff', marginBottom: 8 }}>
                        {bookingFilterStatus === 'CONFIRMED' ? 'Bạn chưa có vé đã thanh toán nào' : 'Chưa có lịch sử giao dịch'}
                      </h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 20 }}>
                        Hãy khám phá ngay các tựa phim bom tấn đang chiếu tại CGV và trải nghiệm điện ảnh đỉnh cao!
                      </p>
                      <a href="/movies" className="btn-primary" style={{ display: 'inline-flex', padding: '10px 22px', fontSize: '0.88rem' }}>
                        Khám phá phim ngay
                      </a>
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {displayedBookings.map(b => {
                      const isPending = b.status === 'PAYMENT_PENDING';
                      const isConfirmed = b.status === 'CONFIRMED' || b.status === 'SUCCESS';
                      const isCancelled = b.status === 'CANCELLED';
                      const isExpired = b.status === 'EXPIRED';

                      const statusBg = isConfirmed
                        ? 'rgba(16, 185, 129, 0.15)'
                        : isPending
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)';
                      const statusColor = isConfirmed
                        ? '#10b981'
                        : isPending
                        ? '#f59e0b'
                        : '#ef4444';
                      const statusText = isConfirmed
                        ? '✓ ĐÃ THANH TOÁN'
                        : isPending
                        ? '⏳ CHỜ THANH TOÁN'
                        : isCancelled
                        ? '✕ ĐÃ HỦY'
                        : '✕ HẾT HẠN';

                      return (
                        <div
                          key={b.bookingId}
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: `1px solid ${isPending ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-subtle)'}`,
                            borderRadius: 12,
                            padding: '18px 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginRight: 8 }}>MÃ ĐƠN:</span>
                              <strong style={{ color: 'var(--primary-hover)', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                                {b.bookingId}
                              </strong>
                            </div>
                            <span
                              style={{
                                background: statusBg,
                                color: statusColor,
                                padding: '4px 10px',
                                borderRadius: 6,
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                letterSpacing: '0.5px'
                              }}
                            >
                              {statusText}
                            </span>
                          </div>

                          {/* Thông tin phim & rạp */}
                          {(b.movieTitle || b.cinemaName) && (
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}>
                              {b.movieTitle && (
                                <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#fff', marginBottom: 2 }}>
                                  {b.movieTitle}
                                </div>
                              )}
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {b.cinemaName || ''}
                                {b.roomName ? ` • ${b.roomName}` : ''}
                                {b.showtimeStart ? ` • ${new Date(b.showtimeStart).toLocaleString('vi-VN')}` : ''}
                              </div>
                            </div>
                          )}

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, fontSize: '0.86rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                            <div>
                              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Số lượng ghế:</span>
                              <strong style={{ color: '#fff', fontSize: '0.92rem' }}>
                                {(b.seatLabels?.length || b.seatIds?.length || 0)} ghế
                                {b.seatLabels && b.seatLabels.length > 0 && (
                                  <span style={{ color: '#e71a0f', marginLeft: 6, fontWeight: 700 }}>
                                    ({b.seatLabels.join(', ')})
                                  </span>
                                )}
                              </strong>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Tổng thanh toán:</span>
                              <strong style={{ color: '#fff', fontSize: '1rem' }}>
                                {(b.finalAmount || b.totalBaseAmount || 0).toLocaleString('vi-VN')} đ
                              </strong>
                            </div>
                            {b.discountAmount > 0 && (
                              <div>
                                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Đã giảm:</span>
                                <strong style={{ color: '#10b981' }}>
                                  -{Number(b.discountAmount).toLocaleString('vi-VN')} đ
                                </strong>
                              </div>
                            )}
                          </div>

                          {/* Actions: CHỈ VÉ ĐÃ THANH TOÁN MỚI CÓ MÃ VẠCH SOÁT VÉ */}
                          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center', paddingTop: 8, borderTop: '1px dashed rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
                            {isConfirmed && (
                              <button
                                type="button"
                                className="btn-primary"
                                onClick={() => setSelectedTicketModal(b)}
                                style={{ padding: '8px 16px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 7, fontWeight: 700 }}
                              >
                                <ScanLine size={16} /> Xem vé & Mã vạch soát vé
                              </button>
                            )}

                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  onClick={() => handleCancelPendingBooking(b.bookingId)}
                                  style={{ padding: '7px 14px', fontSize: '0.82rem', color: '#f87171' }}
                                >
                                  Hủy vé
                                </button>
                                <button
                                  type="button"
                                  className="btn-primary"
                                  onClick={() => handlePayPendingBooking(b)}
                                  style={{ padding: '7px 18px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}
                                >
                                  <CreditCard size={15} /> Thanh toán qua VNPAY
                                </button>
                              </>
                            )}

                            {isCancelled && (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                Đã hủy • Ghế đã được nhả về hệ thống
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ──────── TAB 3: BẢO MẬT & ĐỔI MẬT KHẨU ──────── */}
          {activeTab === TABS.SECURITY && (
            <div>
              <div className="profile-card-header">
                <h3>
                  <Lock size={22} className="text-primary" /> Đổi mật khẩu đăng nhập
                </h3>
                <p>Để đảm bảo an toàn tài khoản, vui lòng nhập mật khẩu hiện tại trước khi tạo mật khẩu mới</p>
              </div>

              <div className="security-section">
                <div className="security-tip">
                  <ShieldCheck size={24} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong>Mẹo bảo mật:</strong> Mật khẩu nên có ít nhất 6 ký tự, kết hợp chữ cái, chữ số và ký tự đặc biệt để tài khoản an toàn tuyệt đối.
                  </div>
                </div>

                <form onSubmit={handleChangePassword}>
                  <div className="auth-form-group" style={{ marginBottom: 18 }}>
                    <label className="auth-label">Mật khẩu hiện tại (mật khẩu cũ)</label>
                    <div className="auth-input-wrap">
                      <Lock size={16} className="auth-input-icon" />
                      <input
                        type={showOld ? 'text' : 'password'}
                        className="auth-input auth-input-icon-left auth-input-icon-right"
                        placeholder="Nhập mật khẩu đang dùng..."
                        value={pwdForm.oldPassword}
                        onChange={(e) => setPwdForm({ ...pwdForm, oldPassword: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        className="auth-input-toggle"
                        onClick={() => setShowOld((v) => !v)}
                        tabIndex={-1}
                      >
                        {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="auth-form-group" style={{ marginBottom: 18 }}>
                    <label className="auth-label">Mật khẩu mới (tối thiểu 6 ký tự)</label>
                    <div className="auth-input-wrap">
                      <Lock size={16} className="auth-input-icon" />
                      <input
                        type={showNew ? 'text' : 'password'}
                        className="auth-input auth-input-icon-left auth-input-icon-right"
                        placeholder="Nhập mật khẩu mới..."
                        value={pwdForm.newPassword}
                        onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                        required
                        minLength={6}
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

                  <div className="auth-form-group" style={{ marginBottom: 24 }}>
                    <label className="auth-label">Xác nhận mật khẩu mới</label>
                    <div className="auth-input-wrap">
                      <Lock size={16} className="auth-input-icon" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        className="auth-input auth-input-icon-left auth-input-icon-right"
                        placeholder="Nhập lại mật khẩu mới..."
                        value={pwdForm.confirmPassword}
                        onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
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

                  <div className="profile-actions">
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={pwdLoading}
                      style={{ minWidth: 160 }}
                    >
                      {pwdLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ──────── TAB 4: TÀI KHOẢN LIÊN KẾT ──────── */}
          {activeTab === TABS.SOCIAL && (
            <div>
              <div className="profile-card-header">
                <h3>
                  <Share2 size={22} className="text-primary" /> Tài khoản mạng xã hội liên kết
                </h3>
                <p>
                  Liên kết tài khoản Google hoặc Facebook để đăng nhập nhanh chỉ với 1 cú nhấp chuột mà không cần gõ mật khẩu
                </p>
              </div>

              <div className="social-connect-list">
                {/* Google */}
                <div className="social-connect-item">
                  <div className="social-connect-left">
                    <div className="social-connect-icon">
                      <GoogleIcon />
                    </div>
                    <div className="social-connect-info">
                      <h4>Google</h4>
                      <p>
                        {profile.connectedAccounts?.google
                          ? `Đã liên kết với email: ${profile.email}`
                          : 'Chưa liên kết tài khoản Google'}
                      </p>
                    </div>
                  </div>

                  <div className="social-connect-actions">
                    <span className={`social-status-badge ${profile.connectedAccounts?.google ? 'connected' : 'unconnected'}`}>
                      {profile.connectedAccounts?.google ? 'Đã liên kết' : 'Chưa liên kết'}
                    </span>
                    <button
                      type="button"
                      className={`btn-connect ${profile.connectedAccounts?.google ? 'btn-connect-outline' : 'btn-connect-primary'}`}
                      onClick={() => handleToggleSocial('google')}
                    >
                      {profile.connectedAccounts?.google ? 'Hủy liên kết' : 'Liên kết ngay'}
                    </button>
                  </div>
                </div>

                {/* Facebook */}
                <div className="social-connect-item">
                  <div className="social-connect-left">
                    <div className="social-connect-icon">
                      <FacebookIcon />
                    </div>
                    <div className="social-connect-info">
                      <h4>Facebook</h4>
                      <p>
                        {profile.connectedAccounts?.facebook
                          ? 'Đã liên kết với trang cá nhân Facebook'
                          : 'Đăng nhập nhanh hơn với tài khoản Facebook cá nhân'}
                      </p>
                    </div>
                  </div>

                  <div className="social-connect-actions">
                    <span className={`social-status-badge ${profile.connectedAccounts?.facebook ? 'connected' : 'unconnected'}`}>
                      {profile.connectedAccounts?.facebook ? 'Đã liên kết' : 'Chưa liên kết'}
                    </span>
                    <button
                      type="button"
                      className={`btn-connect ${profile.connectedAccounts?.facebook ? 'btn-connect-outline' : 'btn-connect-primary'}`}
                      onClick={() => handleToggleSocial('facebook')}
                    >
                      {profile.connectedAccounts?.facebook ? 'Hủy liên kết' : 'Liên kết Facebook'}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 24, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                💡 <strong>Lưu ý:</strong> Hệ thống sử dụng địa chỉ Email định danh duy nhất. Khi bạn đăng nhập bằng Google hay Facebook có cùng Email, tất cả đều được gom chung vào hồ sơ thành viên CGV này.
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Ticket Detail Modal with Barcode & Print Receipt */}
      {selectedTicketModal && (
        <TicketDetailModal
          booking={selectedTicketModal}
          onClose={() => setSelectedTicketModal(null)}
        />
      )}
    </div>
  );
}

