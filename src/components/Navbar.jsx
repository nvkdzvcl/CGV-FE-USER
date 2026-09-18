import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Search, Film, User, Crown, Lock, Share2, LogOut, Menu, X } from "lucide-react";

export default function Navbar({ onOpenAuth, currentUser, onLogout }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navContainerRef = useRef(null);
  const userMenuRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Close dropdown and mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Update sliding indicator position based on active NavLink on desktop
  useEffect(() => {
    if (navContainerRef.current) {
      const activeEl = navContainerRef.current.querySelector(".nav-link.active");
      if (activeEl) {
        setIndicatorStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
          opacity: 1
        });
      } else {
        setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
      }
    }
  }, [location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/movies?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const avatarLetter = currentUser?.fullName
    ? currentUser.fullName[0].toUpperCase()
    : currentUser?.email
      ? currentUser.email[0].toUpperCase()
      : "U";

  const tierLabel = currentUser?.membershipTier?.code || currentUser?.tier || "MEMBER";
  const points = currentUser?.total_spend_ytd ?? currentUser?.loyaltyPoints ?? 0;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand Logo */}
        <NavLink to="/" className="navbar-brand" onClick={() => setMobileMenuOpen(false)}>
          <div className="brand-icon">
            <Film size={22} />
          </div>
          <span>CGV</span>
        </NavLink>

        {/* Desktop Navigation Links with animated indicator */}
        <div className="navbar-links" ref={navContainerRef}>
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            Trang chủ
          </NavLink>
          <NavLink to="/movies" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            Phim
          </NavLink>
          <NavLink to="/cinemas" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            Rạp chiếu
          </NavLink>
          <NavLink to="/promotions" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            Ưu đãi
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            Thành viên
          </NavLink>

          {/* Smooth Sliding Underline */}
          <div
            className="nav-sliding-indicator"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              opacity: indicatorStyle.opacity
            }}
          />
        </div>

        {/* Desktop Right Actions */}
        <div className="navbar-actions">
          {/* Search */}
          <form className="search-box" onSubmit={handleSearchSubmit}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Tìm phim, diễn viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {currentUser ? (
            <div className="user-menu-wrapper" ref={userMenuRef}>
              <div
                className="user-badge"
                onClick={() => setUserMenuOpen((v) => !v)}
                title="Xem menu tài khoản"
              >
                <div className="user-avatar">{avatarLetter}</div>
                <div className="user-info">
                  <span className="user-name">
                    {currentUser.fullName || currentUser.email || "Thành viên"}
                  </span>
                  <span className="user-tier">
                    <Crown size={12} style={{ display: "inline", marginRight: 3 }} />
                    {tierLabel} • {Number(points).toLocaleString("vi-VN")} pts
                  </span>
                </div>
              </div>

              {userMenuOpen && (
                <div className="user-dropdown">
                  <div className="user-dropdown-header">
                    <div className="user-dropdown-name">
                      {currentUser.fullName || "Thành viên CGV"}
                    </div>
                    <div className="user-dropdown-email">{currentUser.email}</div>
                  </div>

                  <button
                    type="button"
                    className="user-dropdown-item"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate("/profile?tab=info");
                    }}
                  >
                    <User size={16} />
                    <span>Hồ sơ cá nhân</span>
                  </button>

                  <button
                    type="button"
                    className="user-dropdown-item"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate("/profile?tab=membership");
                    }}
                  >
                    <Crown size={16} />
                    <span>Hạng thành viên & Điểm</span>
                  </button>

                  <button
                    type="button"
                    className="user-dropdown-item"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate("/profile?tab=security");
                    }}
                  >
                    <Lock size={16} />
                    <span>Đổi mật khẩu</span>
                  </button>

                  <button
                    type="button"
                    className="user-dropdown-item"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate("/profile?tab=social");
                    }}
                  >
                    <Share2 size={16} />
                    <span>Tài khoản liên kết</span>
                  </button>

                  <button
                    type="button"
                    className="user-dropdown-item logout-item"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout();
                    }}
                  >
                    <LogOut size={16} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-btn-group">
              <button className="btn-nav-login" onClick={() => onOpenAuth("login")}>
                <User size={16} />
                Đăng nhập
              </button>
              <button className="btn-nav-register" onClick={() => onOpenAuth("register")}>
                Đăng ký
              </button>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="navbar-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="navbar-mobile-drawer">
          <form className="mobile-search-box" onSubmit={handleSearchSubmit}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Tìm phim, diễn viên, rạp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <div className="mobile-nav-links">
            <NavLink
              to="/"
              className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Trang chủ
            </NavLink>
            <NavLink
              to="/movies"
              className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Phim điện ảnh
            </NavLink>
            <NavLink
              to="/cinemas"
              className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Cụm rạp CGV
            </NavLink>
            <NavLink
              to="/promotions"
              className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Ưu đãi & Voucher
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Thành viên & Điểm
            </NavLink>
          </div>

          <div className="mobile-drawer-footer">
            {currentUser ? (
              <div className="mobile-user-section">
                <div className="mobile-user-badge">
                  <div className="user-avatar">{avatarLetter}</div>
                  <div className="user-info">
                    <span className="user-name">
                      {currentUser.fullName || currentUser.email}
                    </span>
                    <span className="user-tier">
                      <Crown size={12} style={{ display: "inline", marginRight: 3 }} />
                      {tierLabel} • {Number(points).toLocaleString("vi-VN")} pts
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-mobile-logout"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                >
                  <LogOut size={16} />
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="mobile-auth-group">
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: "100%" }}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth("login");
                  }}
                >
                  <User size={16} />
                  Đăng nhập
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: "100%" }}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth("register");
                  }}
                >
                  Đăng ký tài khoản
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
