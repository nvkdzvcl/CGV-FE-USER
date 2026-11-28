import React from 'react';
import { Link } from 'react-router-dom';
import { Film } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div style={{ textAlign: 'center', padding: '96px 16px', color: 'var(--text-muted)' }}>
      <Film size={56} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
      <h1 style={{ color: '#fff', fontSize: '2rem', marginBottom: 8 }}>404 - Không tìm thấy trang</h1>
      <p style={{ marginBottom: 24 }}>Đường dẫn bạn truy cập không tồn tại hoặc đã bị thay đổi.</p>
      <Link to="/" className="btn-primary" style={{ display: 'inline-block' }}>
        Về trang chủ
      </Link>
    </div>
  );
}
