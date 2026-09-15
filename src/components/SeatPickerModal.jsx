import React, { useState, useEffect } from 'react';
import { X, Clock, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { ApiService } from '../services/api';

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const SEATS_PER_ROW = 12;

// Initial Seat generation
function generateInitialSeats() {
  const map = {};
  ROWS.forEach((row, rIdx) => {
    for (let i = 1; i <= SEATS_PER_ROW; i++) {
      const id = `${row}${i}`;
      let type = 'normal';
      let price = 85000;

      if (rIdx >= 3 && rIdx <= 6) {
        type = 'vip';
        price = 105000;
      } else if (rIdx === 7) {
        type = 'sweetbox';
        price = 220000;
      }

      // Mock random booked and holding seats
      let status = 'available';
      if ((rIdx === 4 && (i === 5 || i === 6)) || (rIdx === 2 && i === 8)) {
        status = 'booked';
      } else if (rIdx === 5 && i === 7) {
        status = 'holding';
      }

      map[id] = { id, row, number: i, type, price, status };
    }
  });
  return map;
}

export default function SeatPickerModal({ bookingContext, onClose, onBookingSuccess }) {
  const [seats, setSeats] = useState(generateInitialSeats);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes (Holding Lock)
  const [couponCode, setCouponCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [couponMsg, setCouponMsg] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);

  // 10m Countdown Holding Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          alert('Hết thời gian giữ ghế (10 phút). Ghế đã tự động được nhả về hệ thống.');
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onClose]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleSeat = (id) => {
    const seat = seats[id];
    if (seat.status === 'booked' || seat.status === 'holding') return;

    if (selectedSeatIds.includes(id)) {
      setSelectedSeatIds(selectedSeatIds.filter(s => s !== id));
    } else {
      if (selectedSeatIds.length >= 8) {
        alert('Tối đa mỗi lượt đặt vé chọn không quá 8 ghế.');
        return;
      }
      setSelectedSeatIds([...selectedSeatIds, id]);
    }
  };

  // Price calculations
  const rawTotal = selectedSeatIds.reduce((sum, id) => sum + seats[id].price, 0);
  const discountAmount = appliedVoucher ? appliedVoucher.discountAmount : 0;
  const finalTotal = Math.max(0, rawTotal - discountAmount);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    const result = await ApiService.validateVoucher(couponCode, rawTotal);
    if (result.valid) {
      setAppliedVoucher(result);
      setCouponMsg(`Áp dụng thành công: -${result.discountAmount.toLocaleString('vi-VN')}đ`);
    } else {
      setCouponMsg(result.message);
    }
  };

  const handleCheckout = async () => {
    if (selectedSeatIds.length === 0) {
      alert('Vui lòng chọn ít nhất một ghế ngồi.');
      return;
    }
    setIsCheckingOut(true);
    const payload = {
      movieId: bookingContext.movie.id,
      cinemaId: bookingContext.cinema.id,
      date: bookingContext.date,
      timeSlot: bookingContext.timeSlot,
      seats: selectedSeatIds,
      totalAmount: finalTotal,
      voucherCode: appliedVoucher ? couponCode : null
    };

    const res = await ApiService.createBooking(payload);
    setIsCheckingOut(false);
    setSuccessOrder(res);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="seat-modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="seat-modal-header">
          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: 4 }}>
              {bookingContext.movie?.title}
            </h3>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {bookingContext.cinema?.name} • Suất {bookingContext.timeSlot} • {bookingContext.date}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="seat-holding-timer">
              <Clock size={14} />
              <span>Thời gian giữ ghế: {formatTime(timeLeft)}</span>
            </div>
            <button className="seat-modal-close" onClick={onClose}>
              <X size={22} />
            </button>
          </div>
        </div>

        {successOrder ? (
          <div style={{ padding: '60px 30px', textAlign: 'center' }}>
            <div style={{
              width: 70, height: 70, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)',
              border: '2px solid #10b981', color: '#10b981', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 20px'
            }}>
              <Check size={36} />
            </div>
            <h2 style={{ color: '#fff', marginBottom: 8 }}>Đặt vé thành công!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
              Mã đặt chỗ của bạn: <strong style={{ color: 'var(--primary-hover)' }}>{successOrder.bookingId}</strong>
            </p>
            <div style={{
              background: 'var(--bg-input)', padding: 18, borderRadius: 12, maxWidth: 450, margin: '0 auto 24px',
              textAlign: 'left', fontSize: '0.88rem', border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ marginBottom: 6 }}><strong>Rạp:</strong> {bookingContext.cinema?.name}</div>
              <div style={{ marginBottom: 6 }}><strong>Suất chiếu:</strong> {bookingContext.timeSlot} - {bookingContext.date}</div>
              <div style={{ marginBottom: 6 }}><strong>Ghế đã chọn:</strong> {selectedSeatIds.join(', ')}</div>
              <div><strong>Tổng tiền thanh toán:</strong> {finalTotal.toLocaleString('vi-VN')}đ</div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 24 }}>
              Mã vé QR đã được gửi về email và lưu vào tài khoản thành viên của bạn.
            </p>
            <button className="btn-primary" onClick={onClose}>
              Hoàn tất & Quay lại
            </button>
          </div>
        ) : (
          <>
            {/* Screen Arc */}
            <div className="screen-area">
              <div className="screen-curve"></div>
              <span className="screen-text">MÀN HÌNH CHIẾU</span>
            </div>

            {/* Seat Map */}
            <div className="seat-map-grid">
              {ROWS.map(row => (
                <div key={row} className="seat-row">
                  <span className="row-label">{row}</span>
                  {Array.from({ length: SEATS_PER_ROW }, (_, i) => i + 1).map(num => {
                    const id = `${row}${num}`;
                    const s = seats[id];
                    const isSelected = selectedSeatIds.includes(id);
                    return (
                      <div
                        key={id}
                        className={`seat-item ${s.type} ${s.status} ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleSeat(id)}
                        title={`Ghế ${id} (${s.type.toUpperCase()} - ${s.price.toLocaleString('vi-VN')}đ)`}
                      >
                        {num}
                      </div>
                    );
                  })}
                  <span className="row-label">{row}</span>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="seat-legend">
              <div className="legend-item">
                <div className="legend-box seat-item normal" style={{ cursor: 'default' }}></div>
                <span>Ghế thường (85K)</span>
              </div>
              <div className="legend-item">
                <div className="legend-box seat-item vip" style={{ cursor: 'default' }}></div>
                <span>Ghế VIP (105K)</span>
              </div>
              <div className="legend-item">
                <div className="legend-box seat-item sweetbox" style={{ cursor: 'default' }}></div>
                <span>Sweetbox Đôi (220K)</span>
              </div>
              <div className="legend-item">
                <div className="legend-box seat-item selected" style={{ cursor: 'default' }}></div>
                <span>Đang chọn</span>
              </div>
              <div className="legend-item">
                <div className="legend-box seat-item holding" style={{ cursor: 'default' }}></div>
                <span>Đang giữ chỗ</span>
              </div>
              <div className="legend-item">
                <div className="legend-box seat-item booked" style={{ cursor: 'default' }}></div>
                <span>Đã mua</span>
              </div>
            </div>

            {/* Checkout Bottom Bar */}
            <div className="booking-checkout-panel">
              <div className="checkout-info">
                <div className="checkout-seats-list">
                  {selectedSeatIds.length > 0
                    ? `Ghế đã chọn (${selectedSeatIds.length}): ${selectedSeatIds.join(', ')}`
                    : 'Chưa chọn ghế nào'}
                </div>
                <div className="checkout-total-price">
                  {finalTotal.toLocaleString('vi-VN')} đ
                  {appliedVoucher && (
                    <span style={{ fontSize: '0.8rem', color: '#10b981', marginLeft: 8, fontWeight: 500 }}>
                      (Đã giảm {appliedVoucher.discountAmount.toLocaleString('vi-VN')}đ)
                    </span>
                  )}
                </div>
              </div>

              {/* Voucher Input */}
              <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Mã voucher (CGWED55...)"
                  className="auth-input"
                  style={{ width: 170, padding: '7px 12px', fontSize: '0.82rem' }}
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                />
                <button type="submit" className="btn-secondary" style={{ padding: '7px 14px', fontSize: '0.82rem' }}>
                  Áp dụng
                </button>
              </form>

              {/* Submit Button */}
              <button
                className="btn-primary"
                disabled={selectedSeatIds.length === 0 || isCheckingOut}
                onClick={handleCheckout}
                style={{ opacity: selectedSeatIds.length === 0 ? 0.5 : 1 }}
              >
                {isCheckingOut ? 'Đang thanh toán...' : 'Thanh toán VNPay / MoMo'}
              </button>
            </div>

            {couponMsg && (
              <div style={{
                padding: '6px 28px 12px', fontSize: '0.78rem',
                color: appliedVoucher ? '#10b981' : '#f87171'
              }}>
                {couponMsg}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}