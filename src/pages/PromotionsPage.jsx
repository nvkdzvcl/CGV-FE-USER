import React, { useState } from 'react';
import { Gift, Copy, Check, Crown, Flame, Sparkles } from 'lucide-react';
import { PROMOTIONS, VOUCHERS, MEMBERSHIP_TIERS } from '../data/mockData';

export default function PromotionsPage() {
  const [copiedCode, setCopiedCode] = useState(null);
  const [activeCategory, setActiveCategory] = useState('ALL');

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const filteredPromos = activeCategory === 'ALL'
    ? PROMOTIONS
    : PROMOTIONS.filter(p => p.category === activeCategory);

  return (
    <div className="promotions-page">
      <div className="page-with-sidebar">
        {/* Left Filter Sidebar */}
        <aside className="filter-sidebar">
          <div className="filter-group">
            <div className="filter-title">Hình thức ưu đãi</div>
            <div className="filter-nav-list">
              {['ALL', 'Combo', 'Vé xem phim', 'Thành viên', 'Giảm giá', 'Quà tặng'].map(cat => (
                <div
                  key={cat}
                  className={`filter-nav-item ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  <Gift size={16} /> {cat === 'ALL' ? 'Tất cả ưu đãi' : cat}
                </div>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-title">Áp dụng tại</div>
            {['Toàn hệ thống', 'TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng'].map((loc, idx) => (
              <label key={loc} className="filter-checkbox-label">
                <input type="checkbox" defaultChecked={idx === 0} />
                {loc}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <div className="filter-title">Sắp xếp theo</div>
            <label className="filter-radio-label">
              <input type="radio" name="promo-sort" defaultChecked />
              Mới nhất
            </label>
            <label className="filter-radio-label">
              <input type="radio" name="promo-sort" />
              Sắp hết hạn
            </label>
            <label className="filter-radio-label">
              <input type="radio" name="promo-sort" />
              Phổ biến nhất
            </label>
          </div>
        </aside>

        {/* Right Main Content */}
        <main>
          {/* Mega Sale Banner */}
          <div className="promo-mega-banner">
            <span className="badge-tag" style={{ marginBottom: 12 }}>
              <Flame size={12} /> Hot deal độc quyền
            </span>
            <h2 className="promo-mega-title">MEGA SALE THỨ 4</h2>
            <div className="promo-mega-sub">Đồng giá vé chỉ từ 55K trên toàn hệ thống CGV</div>
            <p className="promo-mega-desc">
              Săn ưu đãi giữa tuần với giá vé siêu tốt, áp dụng cho tất cả các suất chiếu 2D tiêu chuẩn từ sáng đến tối.
            </p>
            <button className="btn-primary" onClick={() => handleCopy('CGWED55')}>
              {copiedCode === 'CGWED55' ? 'Đã sao chép mã CGWED55!' : 'Nhận mã ngay (CGWED55)'}
            </button>
          </div>

          {/* Ưu đãi nổi bật */}
          <div className="section-header">
            <div className="section-title">
              <Flame className="section-title-icon" size={22} />
              <span>Ưu đãi nổi bật</span>
            </div>
          </div>

          <div className="promo-grid">
            {filteredPromos.map(p => (
              <div key={p.id} className="promo-card">
                <img src={p.image} alt={p.title} className="promo-card-img" />
                <div className="promo-card-body">
                  <div style={{ marginBottom: 8 }}>
                    <span className="badge-tag">{p.discountPill}</span>
                  </div>
                  <h4 className="promo-card-title">{p.title}</h4>
                  <p className="promo-card-desc">{p.desc}</p>
                  
                  <div className="promo-card-footer">
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Hạn: {p.validTo}
                    </span>
                    <button
                      className="badge-tag"
                      style={{ padding: '6px 12px', cursor: 'pointer' }}
                      onClick={() => alert(`Đã lưu ưu đãi "${p.title}" vào ví thành viên của bạn!`)}
                    >
                      Lấy ưu đãi
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mã giảm giá của bạn */}
          <div className="section-header" style={{ marginTop: 24 }}>
            <div className="section-title">
              <Gift className="section-title-icon" size={22} />
              <span>Mã giảm giá độc quyền</span>
            </div>
          </div>

          <div className="vouchers-list">
            {VOUCHERS.map(v => (
              <div key={v.id} className="voucher-item">
                <div className="voucher-left">
                  <div className="voucher-tag">{v.tag}</div>
                  <div>
                    <div className="voucher-title">{v.title}</div>
                    <div className="voucher-meta">{v.desc} • Hạn dùng: {v.validTo}</div>
                  </div>
                </div>

                <div className="voucher-right">
                  <span className="voucher-code-badge">{v.code}</span>
                  <button
                    className="btn-copy-code"
                    onClick={() => handleCopy(v.code)}
                  >
                    {copiedCode === v.code ? (
                      <>
                        <Check size={14} /> Đã chép
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Sao chép
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quyền lợi thành viên */}
          <div className="section-header" style={{ marginTop: 36 }}>
            <div className="section-title">
              <Crown className="section-title-icon" size={22} color="var(--accent-gold)" />
              <span>Quyền lợi cấp bậc thành viên</span>
            </div>
          </div>

          <div className="tiers-grid">
            {MEMBERSHIP_TIERS.map(tier => (
              <div key={tier.id} className={`tier-card ${tier.colorClass}`}>
                <div className="tier-header">
                  <div className="tier-icon-circle">
                    <Crown size={22} />
                  </div>
                  <div>
                    <div className="tier-name">{tier.name}</div>
                    <div className="tier-sub">{tier.sub}</div>
                  </div>
                </div>

                <ul className="tier-benefits">
                  {tier.benefits.map((b, i) => (
                    <li key={i}>
                      <Check size={16} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}