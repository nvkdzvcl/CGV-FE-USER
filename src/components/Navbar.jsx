import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Search, Film, User, Crown, Lock, Share2, LogOut, Menu, X, Loader2, Ticket } from "lucide-react";
import { ApiService } from "../services/api";
import CgvAuraLoader from "./CgvAuraLoader";

export default function Navbar({ onOpenAuth, currentUser, onLogout }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navContainerRef = useRef(null);
  const userMenuRef = useRef(null);
  const searchBoxRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Debounced search qua Elasticsearch API
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    setIsSearching(true);
    setIsSearchOpen(true);

    const timer = setTimeout(() => {
      ApiService.searchMovies(searchQuery.trim())
        .then(res => {
          const results = Array.isArray(res) ? res : (res?.data || []);
          setSearchResults(results);
        })
        .catch(err => {
          console.warn('Navbar search error:', err);
          setSearchResults([]);
        })
        .finally(() => setIsSearching(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) {
        setIsSearchOpen(false);
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
          <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive && !location.search.includes('tab=bookings') ? "active" : ""}`}>
            Thành viên
          </NavLink>
          {currentUser && (
            <NavLink
              to="/profile?tab=bookings"
              className={({ isActive }) => `nav-link ${location.search.includes('tab=bookings') ? "active" : ""}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Ticket size={16} style={{ color: 'var(--primary)' }} />
              <span>Vé của tôi</span>
            </NavLink>
          )}

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
          {/* Search with Elasticsearch Live Dropdown */}
          <div className="search-box-wrapper" ref={searchBoxRef}>
            <form className="search-box" onSubmit={handleSearchSubmit}>
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Tìm phim, diễn viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim() && searchResults.length > 0) setIsSearchOpen(true);
                }}
              />
              {isSearching && <Loader2 size={14} className="search-spinner animate-spin" />}
              {searchQuery && !isSearching && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => { setSearchQuery(''); setSearchResults([]); setIsSearchOpen(false); }}
                  title="Xóa tìm kiếm"
                >
                  <X size={14} />
                </button>
              )}
            </form>

            {/* Live Search Popup */}
            {isSearchOpen && searchQuery.trim() && (
              <div className="navbar-search-dropdown">
                <div className="search-dropdown-header">
                  <span>Kết quả cho "{searchQuery}"</span>
                  <span className="search-count">{searchResults.length} phim</span>
                </div>
                {isSearching ? (
                  <div className="search-loading-state" style={{ padding: '20px 10px', display: 'flex', justifyContent: 'center' }}>
                    <CgvAuraLoader size="sm" text="Đang tìm kiếm..." />
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="search-empty-state">
                    <Film size={24} style={{ opacity: 0.4, marginBottom: 6 }} />
                    <p>Không tìm thấy phim phù hợp.</p>
                  </div>
                ) : (
                  <div className="search-results-list">
                    {searchResults.slice(0, 5).map((m) => (
                      <div
                        key={m.id}
                        className="search-result-item"
                        onClick={() => {
                          navigate(`/movies/${m.id}`);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                      >
                        <img
                          src={m.posterUrl}
                          alt={m.title}
                          className="search-result-thumb"
                        />
                        <div className="search-result-info">
                          <div className="search-result-title">{m.title}</div>
                          <div className="search-result-sub">
                            {m.ageRating && (
                              <span className={`age-chip age-${m.ageRating.toLowerCase()}`} style={{ fontSize: '0.65rem', padding: '0 4px' }}>
                                {m.ageRating}
                              </span>
                            )}
                            <span>{m.durationMinutes || m.duration || 120} phút</span>
                            {m.genre && <span>• {Array.isArray(m.genre) ? m.genre.slice(0, 2).join(', ') : m.genre}</span>}
                          </div>
                        </div>
                      </div>
                    ))}

                    <div
                      className="search-dropdown-footer"
                      onClick={() => {
                        navigate(`/movies?q=${encodeURIComponent(searchQuery.trim())}`);
                        setIsSearchOpen(false);
                      }}
                    >
                      Xem tất cả kết quả cho "{searchQuery}" →
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {currentUser && (
            <button
              type="button"
              className="quick-tickets-btn"
              onClick={() => navigate("/profile?tab=bookings")}
              title="Xem nhanh vé của tôi"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(231, 26, 15, 0.12)',
                border: '1px solid rgba(231, 26, 15, 0.35)',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginRight: 6
              }}
            >
              <Ticket size={15} style={{ color: '#e71a0f' }} />
              <span>Vé của tôi</span>
            </button>
          )}

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
                      navigate("/profile?tab=bookings");
                    }}
                    style={{ background: 'rgba(231, 26, 15, 0.08)', fontWeight: 600 }}
                  >
                    <Ticket size={16} style={{ color: '#e71a0f' }} />
                    <span style={{ color: '#fff' }}>Vé của tôi (Lịch sử)</span>
                  </button>

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
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="Xóa tìm kiếm"
              >
                <X size={16} />
              </button>
            )}
          </form>

          {/* Live Mobile Search Results */}
          {searchQuery.trim() && searchResults.length > 0 && (
            <div className="mobile-search-dropdown-list" style={{ marginBottom: 16, background: '#121622', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
              {searchResults.slice(0, 4).map((m) => (
                <div
                  key={m.id}
                  className="search-result-item"
                  style={{ padding: '8px 12px', display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => {
                    navigate(`/movies/${m.id}`);
                    setMobileMenuOpen(false);
                    setSearchQuery('');
                  }}
                >
                  <img src={m.posterUrl} alt={m.title} style={{ width: 36, height: 48, objectFit: 'cover', borderRadius: 4 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.74rem' }}>{m.durationMinutes || 120} phút</div>
                  </div>
                </div>
              ))}
            </div>
          )}

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
