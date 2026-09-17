import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Search, Film, User, Crown } from 'lucide-react';

export default function Navbar({ onOpenAuth, currentUser, onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/movies?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Lấy chữ cái đầu để hiển thị avatar
  const avatarLetter = currentUser?.fullName
    ? currentUser.fullName[0].toUpperCase()
    : currentUser?.email
      ? currentUser.email[0].toUpperCase()
      : 'U';

  // Tier label
  const tierLabel = currentUser?.membershipTier?.code || currentUser?.tier || 'MEMBER';

  // Loyalty points (total_spend_ytd hoặc loyaltyPoints fallback)
  const points = currentUser?.total_spend_ytd ?? currentUser?.loyaltyPoints ?? 0;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand Logo */}
        <NavLink to="/" className="navbar-brand">
          <div className="brand-icon">
            <Film size={22} />
          </div>
          <span>CineGo</span>
        </NavLink>

        {/* Navigation Links */}
        <div className="navbar-links">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Trang chủ
          </NavLink>
          <NavLink to="/movies" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Phim
          </NavLink>
          <NavLink to="/cinemas" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Rạp chiếu
          </NavLink>
          <NavLink to="/promotions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Ưu đãi
          </NavLink>
        </div>

        {/* Right Actions */}
        <div className="navbar-actions">
          {/* Search */}
          <form className="search-box" onSubmit={handleSearchSubmit}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Tìm phim, diễn viên, rạp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* User Auth */}
          {currentUser ? (
            <div className="user-badge" onClick={onLogout} title="Bấm để đăng xuất">
              <div className="user-avatar">{avatarLetter}</div>
              <div className="user-info">
                <span className="user-name">
                  {currentUser.fullName || currentUser.email || 'Thành viên'}
                </span>
                <span className="user-tier">
                  <Crown size={12} style={{ display: 'inline', marginRight: 3 }} />
                  {tierLabel} • {Number(points).toLocaleString('vi-VN')} pts
                </span>
              </div>
            </div>
          ) : (
            <div className="auth-btn-group">
              <button className="btn-nav-login" onClick={() => onOpenAuth('login')}>
                <User size={16} />
                Đăng nhập
              </button>
              <button className="btn-nav-register" onClick={() => onOpenAuth('register')}>
                Đăng ký
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}