import React from 'react';
import { Film, Shield, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="navbar-brand" style={{ marginBottom: 14 }}>
              <div className="brand-icon">
                <Film size={20} />
              </div>
              <span>CineGo</span>
            </div>
            <p>
              Hệ thống rạp chiếu phim kỹ thuật số tiêu chuẩn quốc tế. Mang đến trải nghiệm điện ảnh chân thực, màn chiếu khổng lồ IMAX, âm thanh vòm Dolby Atmos và hệ sinh thái ưu đãi độc quyền.
            </p>
            <div style={{ display: 'flex', gap: 12, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Phone size={14} /> 1900 6017
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Mail size={14} /> cskh@cinego.vn
              </span>
            </div>
          </div>

          <div className="footer-col">
            <h4>Khám phá</h4>
            <ul>
              <li><a href="/movies">Phim đang chiếu</a></li>
              <li><a href="/movies">Phim sắp chiếu</a></li>
              <li><a href="/cinemas">Cụm rạp toàn quốc</a></li>
              <li><a href="/promotions">Ưu đãi & Khuyến mãi</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Chính sách</h4>
            <ul>
              <li><a href="#!">Điều khoản sử dụng</a></li>
              <li><a href="#!">Chính sách bảo mật</a></li>
              <li><a href="#!">Quy định vé & Đổi trả</a></li>
              <li><a href="#!">Tiêu chuẩn độ tuổi (P, T13, T16, T18)</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Dịch vụ Doanh nghiệp</h4>
            <p>Thuê trọn phòng chiếu, tổ chức hội nghị, sự kiện ra mắt phim và bán vé số lượng lớn.</p>
            <a href="mailto:corporate@cinego.vn" className="badge-tag" style={{ padding: '8px 16px' }}>
              Liên hệ Thuê rạp sự kiện
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; 2026 CineGo Enterprise. Nền tảng đặt vé Microservices chuẩn CGV.</span>
          <span>Đồ án môn học Các Công nghệ Lập trình Hiện đại</span>
        </div>
      </div>
    </footer>
  );
}