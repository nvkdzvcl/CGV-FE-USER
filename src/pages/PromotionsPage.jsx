import React, { useState, useEffect, useMemo } from 'react';
import { Gift, Copy, Check, Flame, Tag, Clock, AlertCircle } from 'lucide-react';
import { PROMOTIONS, VOUCHERS } from '../data/mockData';
import { ApiService } from '../services/api';

const CATEGORIES = [
  { id: 'ALL', label: 'Tất cả ưu đãi' },
  { id: 'Combo', label: 'Combo' },
  { id: 'Vé xem phim', label: 'Vé xem phim' },
  { id: 'Thành viên', label: 'Thành viên' },
  { id: 'Giảm giá', label: 'Giảm giá' },
];

function formatVnd(num) {
  return Number(num || 0).toLocaleString('vi-VN') + 'đ';
}

function formatExpiry(dateStr) {
  if (!dateStr) return 'Không giới hạn';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getDiscountLabel(promo) {
  if (!promo) return '';
  if (promo.discountType === 'PERCENTAGE' || promo.discountType === 'PERCENT') {
    return `-${promo.discountValue}%`;
  }
  return `-${formatVnd(promo.discountValue)}`;
}

export default function PromotionsPage() {
  const [copiedCode, setCopiedCode] = useState(null);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [promotions, setPromotions] = useState(PROMOTIONS);
  const [vouchers, setVouchers] = useState(VOUCHERS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    ApiService.getPromotions()
      .then(list => {
        const arr = Array.isArray(list) ? list : (list?.data || []);
        if (arr.length > 0) {
          setPromotions(arr);
          // Vouchers là promotions có code (mã giảm giá cụ thể)
          const withCode = arr.filter(p => p.code && p.code.trim() !== '');
          if (withCode.length > 0) setVouchers(withCode);
        }
      })
      .catch(err => console.warn('Promotions API fallback:', err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCopy = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Promo cards for grid (banner-style promotions)
  const filteredPromos = useMemo(() => {
    const list = activeCategory === 'ALL'
      ? promotions
      : promotions.filter(p => p.category === activeCategory || p.type === activeCategory);
    return list.slice(0, 12); // Max 12 cards
  }, [promotions, activeCategory]);

  // Featured banner promo (first one or hardcoded highlight)
  const featuredPromo = promotions.find(p => p.code === 'CGWED55') || promotions[0];

  return (
    <div className="promotions-page">
      <div className="page-with-sidebar">
        {/* Left Filter Sidebar */}
        <aside className="filter-sidebar">
          <div className="filter-group">
            <div className="filter-title">Hình thức ưu đãi</div>
            <div className="filter-nav-list">
              {CATEGORIES.map(cat => (
                <div
                  key={cat.id}
                  className={`filter-nav-item ${activeCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <Gift size={16} /> {cat.label}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Main Content */}
        <main>
          {/* Mobile Category Filter Bar */}
          <div className="mobile-promo-categories">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                className={`mobile-promo-chip ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <Gift size={14} />
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Mega Sale Banner */}
          {featuredPromo && (
            <div className="promo-mega-banner">
              <span className="badge-tag" style={{ marginBottom: 12 }}>
                <Flame size={12} /> Hot deal độc quyền
              </span>
              <h2 className="promo-mega-title">
                {featuredPromo.name || 'MEGA SALE THỨ 4'}
              </h2>
              <div className="promo-mega-sub">
                {featuredPromo.description || 'Đồng giá vé chỉ từ 55K trên toàn hệ thống CGV'}
              </div>
              {featuredPromo.code && (
                <button
                  className="btn-primary"
                  style={{ marginTop: 16 }}
                  onClick={() => handleCopy(featuredPromo.code)}
                >
                  {copiedCode === featuredPromo.code
                    ? `Đã sao chép mã ${featuredPromo.code}!`
                    : `Nhận mã ngay (${featuredPromo.code})`}
                </button>
              )}
            </div>
          )}

          {/* Ưu đãi nổi bật */}
          <div className="section-header">
            <div className="section-title">
              <Flame className="section-title-icon" size={22} />
              <span>
                Ưu đãi nổi bật
                {isLoading && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 8, fontWeight: 400 }}>Đang tải...</span>}
              </span>
            </div>
          </div>

          <div className="promo-grid">
            {filteredPromos.map((p, idx) => {
              const discLabel = getDiscountLabel(p);
              const imgSrc = p.image || p.bannerUrl || `https://images.unsplash.com/photo-148${idx + 1}549914827-2ee91cede3ba?w=600&q=80`;
              return (
                <div key={p.id || idx} className="promo-card">
                  <img
                    src={imgSrc}
                    alt={p.name || p.title}
                    className="promo-card-img"
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80'; }}
                  />
                  <div className="promo-card-body">
                    {discLabel && (
                      <div style={{ marginBottom: 8 }}>
                        <span className="badge-tag" style={{ background: 'rgba(231,26,15,0.2)', color: '#ff4d5a', border: '1px solid rgba(231,26,15,0.4)' }}>
                          {discLabel}
                        </span>
                      </div>
                    )}
                    <h4 className="promo-card-title">{p.name || p.title}</h4>
                    <p className="promo-card-desc">{p.description || p.desc}</p>

                    <div className="promo-card-footer">
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} />
                        Hạn: {formatExpiry(p.endDate || p.validTo)}
                      </span>
                      {p.code ? (
                        <button
                          className="btn-copy-code"
                          onClick={() => handleCopy(p.code)}
                          title={`Sao chép mã ${p.code}`}
                        >
                          {copiedCode === p.code ? <><Check size={13} /> Đã chép</> : <><Copy size={13} /> {p.code}</>}
                        </button>
                      ) : (
                        <button
                          className="badge-tag"
                          style={{ padding: '5px 10px', cursor: 'pointer' }}
                          onClick={() => alert(`Ưu đãi "${p.name || p.title}" đã được lưu vào ví thành viên!`)}
                        >
                          Lấy ưu đãi
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mã giảm giá section */}
          {vouchers.length > 0 && (
            <>
              <div className="section-header" style={{ marginTop: 32 }}>
                <div className="section-title">
                  <Tag className="section-title-icon" size={22} />
                  <span>Mã giảm giá của bạn</span>
                </div>
              </div>

              <div className="vouchers-list">
                {vouchers.map((v, idx) => {
                  const discLabel = getDiscountLabel(v);
                  return (
                    <div key={v.id || v.code || idx} className="voucher-item">
                      <div className="voucher-left">
                        <div className="voucher-tag">{discLabel || v.tag}</div>
                        <div>
                          <div className="voucher-title">{v.name || v.title}</div>
                          <div className="voucher-meta">
                            {v.description || v.desc}
                            {v.minOrderValue && Number(v.minOrderValue) > 0 && (
                              <span style={{ color: '#94a3b8' }}> • Đơn từ {formatVnd(v.minOrderValue)}</span>
                            )}
                            {' • '}Hạn dùng: {formatExpiry(v.endDate || v.validTo)}
                          </div>
                        </div>
                      </div>

                      <div className="voucher-right">
                        <span className="voucher-code-badge">{v.code}</span>
                        <button
                          className="btn-copy-code"
                          onClick={() => handleCopy(v.code)}
                        >
                          {copiedCode === v.code ? (
                            <><Check size={14} /> Đã chép</>
                          ) : (
                            <><Copy size={14} /> Sao chép</>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}


        </main>
      </div>
    </div>
  );
}