import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, Home, Ticket, Clock, ShieldCheck, RefreshCw } from 'lucide-react';
import { ApiService } from '../services/api';
import { realtime } from '../services/realtimeService';
import { useAuth } from '../hooks/useAuth';
import QRCode from 'qrcode';

const VNPAY_ERROR_CODES = {
  '07': 'Trừ tiền thành công nhưng giao dịch bị nghi ngờ gian lận.',
  '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ Internet Banking tại ngân hàng.',
  '10': 'Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.',
  '11': 'Đã hết hạn chờ thanh toán. Xin vui lòng thực hiện lại giao dịch.',
  '12': 'Thẻ/Tài khoản của khách hàng bị khóa.',
  '13': 'Quý khách nhập sai mật khẩu xác thực giao dịch (OTP).',
  '24': 'Khách hàng đã bấm Hủy giao dịch thanh toán.',
  '51': 'Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
  '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày.',
  '75': 'Ngân hàng thanh toán đang bảo trì.',
  '79': 'Khách hàng nhập sai mật khẩu thanh toán quá số lần quy định.',
  '99': 'Lỗi không xác định từ cổng thanh toán VNPAY.'
};

export default function VnpayReturnPage() {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [bookingDetails, setBookingDetails] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [accessNotice, setAccessNotice] = useState('');

  useEffect(() => {
    if (bookingDetails?.status !== 'CONFIRMED' || !bookingDetails.bookingId) return;
    QRCode.toDataURL(`CGV_TICKET_${bookingDetails.bookingId}`, { width: 320, margin: 2 })
      .then(setQrDataUrl).catch(() => setQrDataUrl(''));
  }, [bookingDetails]);

  // Extract VNPAY query params
  const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');
  const vnp_TxnRef = searchParams.get('vnp_TxnRef'); // bookingId
  const vnp_Amount = searchParams.get('vnp_Amount'); // raw amount * 100
  const vnp_BankCode = searchParams.get('vnp_BankCode');
  const vnp_TransactionNo = searchParams.get('vnp_TransactionNo');
  const vnp_PayDate = searchParams.get('vnp_PayDate');

  const actualAmount = vnp_Amount ? Number(vnp_Amount) / 100 : 0;

  // Extract clean booking UUID from "CGV_<UUID>_<timestamp>" format
  const cleanBookingId = React.useMemo(() => {
    if (!vnp_TxnRef) return null;
    if (vnp_TxnRef.startsWith('CGV_')) {
      const parts = vnp_TxnRef.split('_');
      return parts[1] || vnp_TxnRef;
    }
    return vnp_TxnRef;
  }, [vnp_TxnRef]);

  useEffect(() => {
    let active = true;
    let pollTimer;
    async function verifyPayment() {
      setLoading(true);
      setAccessNotice('');
      try {
        if (!vnp_ResponseCode) {
          setErrorMsg('Không tìm thấy thông tin phản hồi từ cổng thanh toán VNPAY.');
          setIsSuccess(false);
          setLoading(false);
          return;
        }

        // Call backend verification
        const callbackResult = await ApiService.verifyVnpayCallback(window.location.search);

        if (vnp_ResponseCode === '00' && callbackResult !== false) {
          setAwaitingConfirmation(true);
          if (cleanBookingId && cleanBookingId.length === 36) {
            if (!currentUser?.id) {
              setAccessNotice('Đã đăng xuất. Đăng nhập lại đúng tài khoản rồi bấm Kiểm tra lại; không thanh toán lại trước khi biết kết quả.');
              return;
            }
            let attempts = 0;
            const pollBooking = async () => {
              if (!active) return;
              try {
                const booking = await ApiService.getBookingById(cleanBookingId);
                if (!active) return;
                if (booking.status === 'CONFIRMED' || booking.status === 'USED') {
                  setBookingDetails(booking);
                  setIsSuccess(true);
                  setAwaitingConfirmation(false);
                  return;
                }
                if (booking.status === 'CANCELLED' || booking.status === 'REFUNDED') {
                  setAwaitingConfirmation(false);
                  setErrorMsg('Đơn không được xác nhận. Vui lòng liên hệ hỗ trợ và cung cấp mã giao dịch để đối soát/hoàn tiền.');
                  return;
                }
              } catch (err) {
                console.warn('Chưa thể kiểm tra trạng thái đơn:', err);
                if (err.message?.includes('403') || err.message?.includes('quyền') || err.message?.includes('Access denied')) {
                  setAccessNotice('Không xem được đơn bằng tài khoản này. Đăng nhập đúng chủ đơn rồi kiểm tra lại.');
                  return;
                }
              }
              if (++attempts < 15) pollTimer = setTimeout(pollBooking, 2000);
            };
            await pollBooking();
          }
        } else {
          setIsSuccess(false);
          setErrorMsg(vnp_ResponseCode === '00'
            ? 'VNPay báo đã thanh toán nhưng đơn chưa cấp vé. Vui lòng giữ mã giao dịch và liên hệ hỗ trợ để đối soát/hoàn tiền; không đặt lại ngay.'
            : (VNPAY_ERROR_CODES[vnp_ResponseCode] || 'Giao dịch thanh toán không thành công.'));
        }
      } catch (err) {
        console.error('Error verifying VNPAY callback:', err);
        setIsSuccess(false);
        setErrorMsg(err.message || 'Lỗi kiểm tra chữ ký giao dịch.');
      } finally {
        setLoading(false);
      }
    }

    verifyPayment();

    // Lắng nghe realtime SSE từ booking-service: Ngay khi Kafka/Webhook commit, tự động hoàn tất
    const unsubscribe = cleanBookingId && cleanBookingId.length === 36
      ? realtime.subscribeToBookingPayment(
          cleanBookingId,
          (payload) => {
            console.log('[Realtime] Payment confirmed via backend SSE:', payload);
            if (payload?.status !== 'CONFIRMED') return;
            ApiService.getBookingById(cleanBookingId).then(booking => {
              if (!active || booking.status !== 'CONFIRMED') return;
              setBookingDetails(booking);
              setIsSuccess(true);
              setAwaitingConfirmation(false);
              setLoading(false);
            }).catch(() => {});
          },
          (payload) => {
            console.warn('[Realtime] Payment failed via backend SSE:', payload);
            setIsSuccess(false);
            setAwaitingConfirmation(false);
            setLoading(false);
            setErrorMsg(vnp_ResponseCode === '00'
              ? 'Giao dịch cần đối soát: chưa cấp vé. Giữ mã giao dịch và liên hệ hỗ trợ trước khi đặt lại.'
              : (payload?.reason || 'Thanh toán không thành công.'));
          }
        )
      : () => {};

    return () => {
      active = false;
      clearTimeout(pollTimer);
      unsubscribe();
    };
  }, [vnp_ResponseCode, vnp_TxnRef, cleanBookingId, currentUser?.id]);

  // Format VNPAY PayDate: YYYYMMDDHHmmss -> DD/MM/YYYY HH:mm
  const formatPayDate = (raw) => {
    if (!raw || raw.length < 14) return new Date().toLocaleString('vi-VN');
    const y = raw.substring(0, 4);
    const m = raw.substring(4, 6);
    const d = raw.substring(6, 8);
    const h = raw.substring(8, 10);
    const min = raw.substring(10, 12);
    return `${d}/${m}/${y} ${h}:${min}`;
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      background: 'radial-gradient(ellipse at top, rgba(229, 9, 20, 0.08) 0%, rgba(10, 10, 15, 1) 70%)'
    }}>
      <div style={{
        maxWidth: 580,
        width: '100%',
        background: 'rgba(22, 22, 30, 0.95)',
        border: `1px solid ${isSuccess ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
        borderRadius: 20,
        padding: '36px 30px',
        boxShadow: isSuccess
          ? '0 20px 50px rgba(16, 185, 129, 0.12)'
          : '0 20px 50px rgba(239, 68, 68, 0.12)',
        textAlign: 'center',
        backdropFilter: 'blur(16px)'
      }}>
        {loading ? (
          <div style={{ padding: '60px 20px' }}>
            <RefreshCw size={48} className="spin-animate" style={{ color: 'var(--primary)', margin: '0 auto 20px' }} />
            <h3 style={{ color: '#fff', marginBottom: 8, fontSize: '1.3rem' }}>Đang xác thực giao dịch...</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Vui lòng không tắt hoặc tải lại trang trong giây lát.
            </p>
          </div>
        ) : awaitingConfirmation ? (
          <div>
            <Clock size={48} style={{ color: '#f59e0b', margin: '0 auto 20px' }} />
            <h2 style={{ color: '#fff' }}>Đang xác nhận vé</h2>
            <p style={{ color: 'var(--text-secondary)' }}>{accessNotice || `VNPay đã trả kết quả; vé chỉ có hiệu lực khi đơn được xác nhận. Giữ mã đơn ${cleanBookingId} để tra soát. Vé sẽ được gửi tới email đã cung cấp sau khi xác nhận.`}</p>
            <button className="btn-secondary" onClick={() => window.location.reload()}>Kiểm tra lại</button>
          </div>
        ) : isSuccess ? (
          <div>
            {/* Success Icon */}
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid #10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: '#10b981'
            }}>
              <CheckCircle2 size={46} />
            </div>

            <h2 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 700, marginBottom: 8 }}>
              Vé Đã Xác Nhận!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 26 }}>
              Vé và mã QR được gửi tới email tài khoản. Giữ email để dùng lại nếu quên lưu ảnh.
            </p>

            {/* Receipt Box */}
            <div style={{
              background: 'rgba(15, 15, 20, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: '20px 22px',
              textAlign: 'left',
              marginBottom: 28,
              fontSize: '0.88rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Mã đơn đặt vé:</span>
                <strong style={{ color: 'var(--primary-hover)', fontFamily: 'monospace', fontSize: '0.92rem' }} title={cleanBookingId || vnp_TxnRef}>
                  {cleanBookingId ? (cleanBookingId.length > 18 ? cleanBookingId.substring(0, 18) + '...' : cleanBookingId) : 'N/A'}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Mã giao dịch VNPAY:</span>
                <strong style={{ color: '#fff' }}>{vnp_TransactionNo || 'VNPAY-ONLINE'}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Ngân hàng / Cổng:</span>
                <strong style={{ color: '#fff' }}>{vnp_BankCode || 'NCB VNPAY'}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Thời gian thanh toán:</span>
                <strong style={{ color: '#fff' }}>{formatPayDate(vnp_PayDate)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12 }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Tổng tiền đã thanh toán:</span>
                <strong style={{ color: '#10b981', fontSize: '1.15rem' }}>
                  {actualAmount.toLocaleString('vi-VN')} đ
                </strong>
              </div>
            </div>

            {/* Action Buttons */}
            {qrDataUrl && <div style={{ marginBottom: 20 }}><img src={qrDataUrl} width="180" height="180" alt="Mã QR vé đã xác nhận" /></div>}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              {qrDataUrl && <a className="btn-primary" href={qrDataUrl} download={`CGV-${cleanBookingId}.png`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', fontSize: '0.9rem' }}><Ticket size={18} />Tải ảnh QR</a>}

              <button
                className="btn-secondary"
                onClick={() => navigate('/')}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', fontSize: '0.9rem' }}
              >
                <Home size={18} />
                Về trang chủ
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Failed Icon */}
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '2px solid #ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: '#ef4444'
            }}>
              <XCircle size={46} />
            </div>

            <h2 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 700, marginBottom: 8 }}>
              Thanh Toán Thất Bại!
            </h2>
            <p style={{ color: '#fca5a5', fontSize: '0.92rem', marginBottom: 20 }}>
              {errorMsg}
            </p>

            <div style={{
              background: 'rgba(15, 15, 20, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: '16px 20px',
              textAlign: 'left',
              marginBottom: 28,
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Mã lỗi VNPAY:</span>
                <strong style={{ color: '#ef4444' }}>{vnp_ResponseCode || 'ERR_UNKNOWN'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Mã đơn đặt vé:</span>
                <span style={{ color: '#fff', fontFamily: 'monospace' }}>
                  {cleanBookingId || vnp_TxnRef || 'N/A'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                className="btn-primary"
                onClick={() => navigate('/movies')}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', fontSize: '0.9rem' }}
              >
                <ArrowRight size={18} />
                {vnp_ResponseCode === '00' ? 'Xem phim khác' : 'Đặt vé lại'}
              </button>

              <button
                className="btn-secondary"
                onClick={() => navigate('/')}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', fontSize: '0.9rem' }}
              >
                <Home size={18} />
                Về trang chủ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
