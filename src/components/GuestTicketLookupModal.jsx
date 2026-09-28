import React, { useState, useEffect } from 'react';
import { X, Search, Phone, Mail, Ticket, Clock, CheckCircle2, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { ApiService } from '../services/api';
import TicketDetailModal from './TicketDetailModal';

export default function GuestTicketLookupModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('online'); // 'online' | 'recent'
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Load recent bookings from localStorage
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = JSON.parse(localStorage.getItem('cgv_guest_bookings') || '[]');
        setRecentBookings(saved);
      } catch {
        setRecentBookings([]);
      }
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!phone.trim() && !email.trim() && !bookingId.trim()) {
      setError('Vui lòng nhập Số điện thoại, Email hoặc Mã đơn vé.');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const payload = {};
      if (phone.trim()) payload.phone = phone.trim();
      if (email.trim()) payload.email = email.trim();
      if (bookingId.trim()) payload.bookingId = bookingId.trim();

      const res = await ApiService.lookupGuestBookings(payload);
      const list = Array.isArray(res) ? res : (res?.data || []);
      setResults(list);
      if (list.length === 0) {
        setError('Không tìm thấy đơn vé nào khớp với thông tin đã nhập.');
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi tra cứu vé. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return <span style={{ padding: '2px 8px', borderRadius: 4, background: '#065f46', color: '#34d399', fontSize: '0.75rem', fontWeight: 600 }}>ĐÃ XÁC NHẬN</span>;
      case 'USED':
        return <span style={{ padding: '2px 8px', borderRadius: 4, background: '#1e3a8a', color: '#60a5fa', fontSize: '0.75rem', fontWeight: 600 }}>ĐÃ SOÁT VÉ</span>;
      case 'PAYMENT_PENDING':
        return <span style={{ padding: '2px 8px', borderRadius: 4, background: '#78350f', color: '#fbbf24', fontSize: '0.75rem', fontWeight: 600 }}>CHỜ THANH TOÁN</span>;
      case 'CANCELLED':
        return <span style={{ padding: '2px 8px', borderRadius: 4, background: '#7f1d1d', color: '#f87171', fontSize: '0.75rem', fontWeight: 600 }}>ĐÃ HỦY</span>;
      case 'REFUNDED':
        return <span style={{ padding: '2px 8px', borderRadius: 4, background: '#4c1d95', color: '#c084fc', fontSize: '0.75rem', fontWeight: 600 }}>ĐÃ HOÀN TIỀN</span>;
      default:
        return <span style={{ padding: '2px 8px', borderRadius: 4, background: '#374151', color: '#9ca3af', fontSize: '0.75rem' }}>{status}</span>;
    }
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', padding: 16 }}>
        <div
          className="guest-lookup-modal"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: 16,
            width: '100%',
            maxWidth: 620,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
          }}
        >
          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(231,26,15,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ticket size={20} color="#e71a0f" />
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.15rem', fontWeight: 700 }}>Tra cứu vé xem phim</h3>
                <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.8rem' }}>Kiểm tra thông tin vé đặt trực tuyến hoặc tại quầy</p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: 6, borderRadius: 8 }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #27272a', padding: '0 24px' }}>
            <button
              onClick={() => setActiveTab('online')}
              style={{
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'online' ? '2px solid #e71a0f' : '2px solid transparent',
                color: activeTab === 'online' ? '#fff' : '#71717a',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Tìm kiếm trực tuyến
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              style={{
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'recent' ? '2px solid #e71a0f' : '2px solid transparent',
                color: activeTab === 'recent' ? '#fff' : '#71717a',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Vé vừa đặt trên máy này ({recentBookings.length})
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
            {activeTab === 'online' ? (
              <div>
                <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', color: '#d4d4d8', fontSize: '0.8rem', marginBottom: 6, fontWeight: 500 }}>
                        Số điện thoại
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Phone size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                        <input
                          type="tel"
                          placeholder="0912345678"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px 10px 36px',
                            background: '#09090b',
                            border: '1px solid #3f3f46',
                            borderRadius: 8,
                            color: '#fff',
                            fontSize: '0.875rem'
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#d4d4d8', fontSize: '0.8rem', marginBottom: 6, fontWeight: 500 }}>
                        Email liên hệ
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                        <input
                          type="email"
                          placeholder="example@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px 10px 36px',
                            background: '#09090b',
                            border: '1px solid #3f3f46',
                            borderRadius: 8,
                            color: '#fff',
                            fontSize: '0.875rem'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', color: '#d4d4d8', fontSize: '0.8rem', marginBottom: 6, fontWeight: 500 }}>
                      Hoặc Mã đơn vé (UUID)
                    </label>
                    <input
                      type="text"
                      placeholder="VD: 550e8400-e29b-41d4-a716-446655440000"
                      value={bookingId}
                      onChange={(e) => setBookingId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: '#09090b',
                        border: '1px solid #3f3f46',
                        borderRadius: 8,
                        color: '#fff',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      marginTop: 6,
                      padding: '12px',
                      background: '#e71a0f',
                      border: 'none',
                      borderRadius: 8,
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    {loading ? <RefreshCw size={16} className="spinner" /> : <Search size={16} />}
                    <span>{loading ? 'Đang tìm kiếm...' : 'Tra cứu vé'}</span>
                  </button>
                </form>

                {error && (
                  <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Results list */}
                {results.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <h4 style={{ color: '#fff', fontSize: '0.9rem', marginBottom: 12, fontWeight: 600 }}>
                      Tìm thấy {results.length} đơn vé:
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {results.map((b) => (
                        <div
                          key={b.bookingId || b.id}
                          onClick={() => setSelectedTicket(b)}
                          style={{
                            padding: 14,
                            background: '#27272a',
                            borderRadius: 10,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            border: '1px solid #3f3f46',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div>
                            <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
                              {b.movieTitle || 'CGV Cinema Movie'}
                            </div>
                            <div style={{ color: '#a1a1aa', fontSize: '0.8rem', marginTop: 3 }}>
                              {b.cinemaName} • Phòng {b.roomName} • Ghế: {(b.seatLabels || []).join(', ') || 'Ghế đã chọn'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                              {getStatusBadge(b.status)}
                              <span style={{ color: '#e71a0f', fontWeight: 700, fontSize: '0.85rem' }}>
                                {Number(b.finalAmount || 0).toLocaleString('vi-VN')}đ
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38bdf8', fontSize: '0.8rem', fontWeight: 600 }}>
                            <span>Xem vé</span>
                            <ArrowRight size={14} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {recentBookings.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: '#71717a' }}>
                    <Ticket size={40} style={{ opacity: 0.3, marginBottom: 10 }} />
                    <p>Chưa có vé nào được đặt trên trình duyệt này.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {recentBookings.map((b, idx) => (
                      <div
                        key={b.bookingId || idx}
                        onClick={async () => {
                          try {
                            const detail = await ApiService.getBookingById(b.bookingId);
                            setSelectedTicket(detail);
                          } catch {
                            setSelectedTicket(b);
                          }
                        }}
                        style={{
                          padding: 14,
                          background: '#27272a',
                          borderRadius: 10,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          border: '1px solid #3f3f46'
                        }}
                      >
                        <div>
                          <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
                            {b.movieTitle || 'Vé xem phim'}
                          </div>
                          <div style={{ color: '#a1a1aa', fontSize: '0.8rem', marginTop: 3 }}>
                            Mã vé: <span style={{ fontFamily: 'monospace' }}>{b.bookingId}</span>
                          </div>
                          <div style={{ color: '#71717a', fontSize: '0.75rem', marginTop: 3 }}>
                            Người nhận: {b.guestName} ({b.guestPhone})
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38bdf8', fontSize: '0.8rem', fontWeight: 600 }}>
                          <span>Xem chi tiết</span>
                          <ArrowRight size={14} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          booking={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </>
  );
}
