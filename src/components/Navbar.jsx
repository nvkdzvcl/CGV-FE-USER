import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Search, Film, User, LogIn, Crown, Sparkles, Check } from 'lucide-react';

export default function Navbar({ onOpenAuth, currentUser, onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/movies?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

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
          {/* Live Search */}
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
              <div className="user-avatar">
                {currentUser.fullName ? currentUser.fullName[0].toUpperCase() : 'U'}
              </div>
              <div className="user-info">
                <span className="user-name">{currentUser.fullName}</span>
                <span className="user-tier">
                  <Crown size={12} style={{ display: 'inline', marginRight: 3 }} />
                  {currentUser.tier || 'MEMBER'} • {currentUser.loyaltyPoints || 0} pts
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