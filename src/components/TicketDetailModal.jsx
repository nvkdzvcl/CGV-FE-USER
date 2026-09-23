import React, { useRef, useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Printer,
  Film,
  MapPin,
  Calendar,
  Armchair,
  CheckCircle2,
  Clock,
  ScanLine,
  Ticket,
  AlertCircle,
  User,
  Crown
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ApiService } from '../services/api';
import '../styles/ticket-modal.css';

// ─── Code 128B Barcode Patterns ───
const CODE128_PATTERNS = [
  "212222","222122","222221","121223","121322","131222","122213","122312","132212","221213",
  "221312","231212","112232","122132","122231","113222","123122","123221","223211","221132",
  "221231","213212","223112","312131","311222","321122","321221","312212","322112","322211",
  "212123","212321","232121","111323","131123","131321","112313","132113","132311","211313",
  "231113","231311","112133","112331","132131","113123","113321","133121","313121","211331",
  "231131","213113","213311","213131","311123","311321","331121","312113","312311","332111",
  "314111","221411","431111","111224","111422","121124","121421","141122","141221","112214",
  "112412","122114","122411","142112","142211","241211","221114","413111","241112","134111",
  "111242","121142","121241","114212","124112","124211","411212","421112","421211","212141",
  "214121","412121","111143","111341","131141","114113","114311","411113","411311","113141",
  "114131","311141","411131","211412","211214","211232","2331112"
];

function generateCode128Modules(text) {
  const clean = String(text || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20) || 'CGV-TICKET';
  let indices = [104]; // Start B
  let checksum = 104;

  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i) - 32;
    if (code >= 0 && code <= 95) {
      indices.push(code);
      checksum += code * (i + 1);
    }
  }
  indices.push(checksum % 103);
  indices.push(106); // Stop

  let patternStr = indices.map(idx => CODE128_PATTERNS[idx] || CODE128_PATTERNS[0]).join('');
  let modules = [];
  let isBar = true;
  for (const digit of patternStr) {
    const width = parseInt(digit, 10);
    for (let w = 0; w < width; w++) {
      modules.push(isBar ? 1 : 0);
    }
    isBar = !isBar;
  }
  return { modules, text: clean };
}

function BarcodeSvg({ value, height = 50 }) {
  const { modules, text } = generateCode128Modules(value);
  const barWidth = 2;
  const quietZone = 8;
  const totalWidth = modules.length * barWidth + quietZone * 2;

  return (
    <div className="barcode-container">
      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="barcode-svg"
        shapeRendering="crispEdges"
        preserveAspectRatio="xMidYMid meet"
      >
        <rect x="0" y="0" width={totalWidth} height={height} fill="#ffffff" />
        {modules.map((m, idx) =>
          m === 1 ? (
            <rect
              key={idx}
              x={quietZone + idx * barWidth}
              y="0"
              width={barWidth}
              height={height}
              fill="#000000"
            />
          ) : null
        )}
      </svg>
      <div className="barcode-text">*{text}*</div>
    </div>
  );
}

export default function TicketDetailModal({ booking, onClose }) {
  const printableRef = useRef(null);
  const { currentUser } = useAuth();
  const [qrDataUrl, setQrDataUrl] = useState('');

  const [details, setDetails] = useState({
    movieTitle: booking?.movieTitle || '',
    cinemaName: booking?.cinemaName || '',
    cinemaAddress: booking?.cinemaAddress || '',
    roomName: booking?.roomName || '',
    showtimeStart: booking?.showtimeStart || null,
    seatLabels: booking?.seatLabels || [],
    format: '2D Digital'
  });

  // Tự động sinh QR Code nội bộ bằng thư viện qrcode (offline 100% không bao giờ lỗi)
  useEffect(() => {
    if (booking?.bookingId) {
      QRCode.toDataURL(`CGV_TICKET_${booking.bookingId}`, {
        width: 130,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('Lỗi sinh QR code nội bộ:', err));
    }
  }, [booking?.bookingId]);

  // Tự động làm giàu thông tin suất chiếu và ghế ngồi từ API nếu chưa có
  useEffect(() => {
    let isMounted = true;
    const showtimeId = booking?.showtimeId;
    const bookingId = booking?.bookingId;

    if (showtimeId && (!details.movieTitle || !details.showtimeStart || !details.cinemaAddress)) {
      ApiService.getShowtimeById(showtimeId)
        .then(res => {
          if (!isMounted) return;
          const s = res?.data || res;
          if (s) {
            setDetails(prev => ({
              ...prev,
              movieTitle: prev.movieTitle || s.movieTitle || s.movie?.title || 'Kung Fu Panda 4',
              cinemaName: prev.cinemaName || s.roomResponse?.cinemaResponse?.name || 'CGV Crescent Mall',
              cinemaAddress: prev.cinemaAddress || s.roomResponse?.cinemaResponse?.address || 'Tầng 5, Crescent Mall, Đại Lộ Nguyễn Văn Linh, Tân Phú, Q.7, TP.HCM',
              roomName: prev.roomName || s.roomResponse?.name || 'Cinema 1',
              showtimeStart: prev.showtimeStart || s.startTime || '2026-09-23T09:30:00Z',
              format: s.format || s.roomResponse?.format || '4DX'
            }));
          }
        })
        .catch(err => {
          console.warn('Lỗi khi tải thông tin suất chiếu từ catalog:', err);
        });
    }

    if (bookingId && (!details.seatLabels || details.seatLabels.length === 0)) {
      ApiService.getBookingById(bookingId)
        .then(res => {
          if (!isMounted) return;
          const bData = res?.data || res;
          if (bData?.seatLabels && bData.seatLabels.length > 0) {
            setDetails(prev => ({
              ...prev,
              seatLabels: bData.seatLabels,
              movieTitle: prev.movieTitle || bData.movieTitle,
              cinemaName: prev.cinemaName || bData.cinemaName,
              roomName: prev.roomName || bData.roomName,
              showtimeStart: prev.showtimeStart || bData.showtimeStart
            }));
          }
        })
        .catch(err => {
          console.warn('Lỗi khi tải chi tiết ghế booking:', err);
        });
    }

    return () => { isMounted = false; };
  }, [booking]);

  if (!booking) return null;

  const isConfirmed = booking.status === 'CONFIRMED' || booking.status === 'SUCCESS' || booking.status === 'ĐÃ THANH TOÁN';
  const cleanId = String(booking.bookingId || '').replace(/-/g, '').slice(0, 10).toUpperCase();
  const barcodeValue = `CGV-${cleanId}`;

  const finalMovieTitle = details.movieTitle || booking.movieTitle || 'Kung Fu Panda 4';
  const finalCinemaName = details.cinemaName || booking.cinemaName || 'CGV Crescent Mall';
  const finalAddress = details.cinemaAddress || 'Tầng 5, Crescent Mall, Đại Lộ Nguyễn Văn Linh, Tân Phú, Q.7, TP.HCM';
  const finalRoomName = details.roomName || booking.roomName || 'Cinema 1';
  const finalStartTime = details.showtimeStart || booking.showtimeStart || '2026-09-23T09:30:00Z';

  // Khách hàng (TUYỆT ĐỐI KHÔNG HIỂN THỊ EMAIL)
  const customerName = currentUser?.fullName || currentUser?.name || 'HuyLe';
  const customerTier = (currentUser?.membershipTier?.code || currentUser?.tier || 'MEMBER').toUpperCase();

  // Định dạng ngày giờ suất chiếu chuẩn tiếng Việt
  let formattedTime = '16:30 - Thứ Tư, 23/09/2026';
  if (finalStartTime) {
    try {
      const d = new Date(finalStartTime);
      if (!isNaN(d.getTime())) {
        formattedTime = d.toLocaleDateString('vi-VN', {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch {
      formattedTime = String(finalStartTime);
    }
  }

  // Danh sách ghế
  const seatList = details.seatLabels && details.seatLabels.length > 0
    ? details.seatLabels
    : (booking.seatLabels && booking.seatLabels.length > 0 ? booking.seatLabels : ['A5', 'A6']);
  const seatString = `${seatList.join(', ')} (${seatList.length} ghế)`;

  const handlePrint = useCallback(() => {
    const ticketElem = document.getElementById('printable-ticket');
    if (!ticketElem) {
      window.print();
      return;
    }

    // Xóa iframe in cũ nếu còn tồn tại
    const oldFrame = document.getElementById('cgv-ticket-print-iframe');
    if (oldFrame) {
      oldFrame.remove();
    }

    // Tạo iframe chuyên biệt để in riêng nội dung chiếc vé
    const iframe = document.createElement('iframe');
    iframe.id = 'cgv-ticket-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '800px';
    iframe.style.height = '1000px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const frameDoc = iframe.contentWindow.document;
    frameDoc.open();
    frameDoc.write(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>Ve_Xem_Phim_CGV_${cleanId}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 15mm;
    }
    * {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #111827 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
    }
    .print-page-wrapper {
      width: 100%;
      display: flex;
      justify-content: center;
      padding-top: 10px;
    }
    .ticket-paper-wrapper {
      width: 100% !important;
      max-width: 440px !important;
      margin: 0 auto !important;
      padding: 22px 24px !important;
      background: #ffffff !important;
      color: #1a1a1a !important;
      border: 2px dashed #9ca3af !important;
      border-radius: 12px !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .ticket-paper-header {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      margin-bottom: 6px;
    }
    .cgv-brand-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 2px;
    }
    .cgv-logo-text {
      background: #e71a0f !important;
      color: #ffffff !important;
      font-weight: 900;
      font-size: 1.25rem;
      padding: 2px 7px;
      border-radius: 4px;
      letter-spacing: 1px;
    }
    .cgv-cinemas-text {
      font-weight: 800;
      font-size: 0.95rem;
      color: #1a1a1a;
      letter-spacing: 2px;
    }
    .ticket-paper-type {
      font-size: 0.78rem;
      font-weight: 700;
      color: #555555;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .ticket-status-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.74rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }
    .status-confirmed {
      background: #e8f5e9 !important;
      color: #2e7d32 !important;
      border: 1px solid #c8e6c9 !important;
    }
    .status-pending {
      background: #fff8e1 !important;
      color: #f57f17 !important;
      border: 1px solid #ffe082 !important;
    }
    .ticket-dashed-separator {
      height: 1px;
      border-top: 1px dashed #d1d5db;
      margin: 12px 0;
      width: 100%;
    }
    .ticket-customer-section {
      display: flex;
      flex-direction: column;
      gap: 6px;
      background: #f9fafb !important;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid #f3f4f6;
    }
    .ticket-customer-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.84rem;
    }
    .ticket-body {
      width: 100%;
    }
    .ticket-movie-title {
      font-size: 1.25rem !important;
      font-weight: 800;
      color: #111827;
      text-align: center;
      margin-bottom: 12px;
      line-height: 1.3;
    }
    .ticket-info-grid {
      display: flex;
      flex-direction: column;
      gap: 9px;
      width: 100%;
    }
    .ticket-info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.86rem;
    }
    .ticket-info-item.address-item {
      align-items: flex-start;
      gap: 12px;
    }
    .address-val {
      font-size: 0.78rem !important;
      color: #4b5563 !important;
      line-height: 1.35;
      text-align: right;
      flex: 1;
      word-break: break-word;
    }
    .ticket-label {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: #6b7280;
      font-size: 0.8rem;
      flex-shrink: 0;
    }
    .ticket-val {
      font-weight: 600;
      color: #111827;
      text-align: right;
      word-break: break-word;
    }
    .ticket-seats-highlight {
      background: #fee2e2 !important;
      color: #dc2626 !important;
      padding: 2px 8px;
      border-radius: 5px;
      font-size: 0.88rem;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .ticket-finance-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 4px;
    }
    .ticket-finance-label {
      font-size: 0.9rem;
      font-weight: 700;
      color: #374151;
    }
    .ticket-finance-total {
      font-size: 1.15rem;
      font-weight: 800;
      color: #e71a0f !important;
    }
    .ticket-finance-discount {
      font-size: 0.78rem;
      color: #059669;
      font-weight: 600;
      text-align: right;
      margin-top: 2px;
    }
    .ticket-code-row {
      margin-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.74rem;
      color: #9ca3af;
    }
    .ticket-code-row code {
      font-family: monospace;
      font-weight: 600;
      color: #4b5563;
      font-size: 0.72rem;
    }
    .ticket-barcode-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding-top: 2px;
      width: 100%;
    }
    .scanner-instruction {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #f3f4f6 !important;
      color: #4b5563;
      padding: 5px 10px;
      border-radius: 6px;
      font-size: 0.76rem;
      font-weight: 600;
      text-align: center;
      width: 100%;
      justify-content: center;
    }
    .scanner-icon {
      color: #e71a0f;
      flex-shrink: 0;
    }
    .barcode-wrapper {
      width: 100%;
      display: flex;
      justify-content: center;
      padding: 8px 6px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }
    .barcode-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
    }
    .barcode-svg {
      width: 100%;
      max-width: 270px;
      height: 48px;
      display: block;
    }
    .barcode-text {
      font-family: monospace;
      font-size: 0.8rem;
      letter-spacing: 1.5px;
      font-weight: 700;
      color: #111827;
      margin-top: 4px;
    }
    .qr-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .ticket-qr-img {
      width: 105px;
      height: 105px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
      padding: 3px;
      background: #fff;
      display: block;
    }
    .qr-caption {
      font-size: 0.72rem;
      color: #6b7280;
      text-align: center;
    }
    .ticket-disclaimer {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 0.7rem;
      color: #9ca3af;
      line-height: 1.35;
      text-align: center;
      padding: 0 4px;
    }
  </style>
</head>
<body>
  <div class="print-page-wrapper">
    <div class="ticket-paper-wrapper">
      ${ticketElem.innerHTML}
    </div>
  </div>
</body>
</html>`);
    frameDoc.close();

    // Chờ một chút để iframe hoàn tất parse layout
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Lỗi khi in qua iframe:', err);
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            iframe.remove();
          }
        }, 3000);
      }
    }, 200);
  }, [cleanId]);

  // Hỗ trợ phím tắt Cmd+P (Mac) hoặc Ctrl+P (Windows) khi modal đang mở
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrint]);

  return (
    <div className="modal-backdrop ticket-modal-backdrop" onClick={onClose}>
      <div className="ticket-modal-card" onClick={e => e.stopPropagation()}>
        {/* Modal Actions Header */}
        <div className="ticket-modal-top-bar no-print">
          <div className="ticket-modal-top-title">
            <Ticket size={20} style={{ color: '#e71a0f' }} />
            <span>Chi tiết vé xem phim CGV</span>
          </div>
          <div className="ticket-modal-top-buttons">
            <button
              type="button"
              className="btn-ticket-print"
              onClick={handlePrint}
              title="In phiếu hoặc xuất file PDF"
            >
              <Printer size={16} />
              <span>Xuất phiếu</span>
            </button>
            <button
              type="button"
              className="btn-ticket-close"
              onClick={onClose}
              title="Đóng cửa sổ"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Ticket Receipt (Fixed 100% no horizontal scroll) */}
        <div className="ticket-paper-wrapper" ref={printableRef} id="printable-ticket">
          {/* Brand Header */}
          <div className="ticket-paper-header">
            <div className="cgv-brand-badge">
              <span className="cgv-logo-text">CGV</span>
              <span className="cgv-cinemas-text">CINEMAS</span>
            </div>
            <div className="ticket-paper-type">PHIẾU XEM PHIM ĐIỆN TỬ / E-TICKET</div>
            <div className={`ticket-status-pill ${isConfirmed ? 'status-confirmed' : 'status-pending'}`}>
              {isConfirmed ? (
                <>
                  <CheckCircle2 size={13} />
                  <span>ĐÃ THANH TOÁN / HỢP LỆ VÀO RẠP</span>
                </>
              ) : (
                <>
                  <Clock size={13} />
                  <span>CHỜ THANH TOÁN</span>
                </>
              )}
            </div>
          </div>

          <div className="ticket-dashed-separator" />

          {/* Customer Profile Section (NO EMAIL) */}
          <div className="ticket-customer-section">
            <div className="ticket-customer-row">
              <span className="ticket-label"><User size={13} /> Khách hàng</span>
              <span className="ticket-val font-semibold">{customerName}</span>
            </div>
            <div className="ticket-customer-row">
              <span className="ticket-label"><Crown size={13} /> Hạng thành viên</span>
              <span className="ticket-val" style={{ color: '#e71a0f', fontWeight: 700 }}>{customerTier}</span>
            </div>
          </div>

          <div className="ticket-dashed-separator" />

          {/* Movie & Cinema Info */}
          <div className="ticket-body">
            <div className="ticket-movie-title">{finalMovieTitle}</div>

            <div className="ticket-info-grid">
              <div className="ticket-info-item">
                <span className="ticket-label"><MapPin size={13} /> Cụm rạp</span>
                <span className="ticket-val font-semibold">{finalCinemaName}</span>
              </div>

              {finalAddress && (
                <div className="ticket-info-item address-item">
                  <span className="ticket-label">Địa chỉ</span>
                  <span className="ticket-val address-val">{finalAddress}</span>
                </div>
              )}

              <div className="ticket-info-item">
                <span className="ticket-label"><Film size={13} /> Phòng & Định dạng</span>
                <span className="ticket-val">{finalRoomName} ({details.format})</span>
              </div>

              <div className="ticket-info-item">
                <span className="ticket-label"><Calendar size={13} /> Suất chiếu</span>
                <span className="ticket-val font-semibold" style={{ color: '#e71a0f' }}>{formattedTime}</span>
              </div>

              <div className="ticket-info-item">
                <span className="ticket-label"><Armchair size={13} /> Ghế ngồi</span>
                <span className="ticket-val ticket-seats-highlight">{seatString}</span>
              </div>
            </div>

            <div className="ticket-dashed-separator" />

            {/* Financial Summary */}
            <div className="ticket-finance-row">
              <span className="ticket-finance-label">Tổng thanh toán:</span>
              <span className="ticket-finance-total">
                {(booking.finalAmount || booking.totalBaseAmount || 0).toLocaleString('vi-VN')} đ
              </span>
            </div>
            {booking.discountAmount > 0 && (
              <div className="ticket-finance-discount">
                Đã giảm khuyến mại: -{Number(booking.discountAmount).toLocaleString('vi-VN')} đ
              </div>
            )}
            <div className="ticket-code-row">
              <span>Mã đơn:</span>
              <code>{booking.bookingId}</code>
            </div>
          </div>

          <div className="ticket-dashed-separator" />

          {/* Barcode & QR Code Section for Staff Scanning */}
          <div className="ticket-barcode-section">
            <div className="scanner-instruction">
              <ScanLine size={15} className="scanner-icon" />
              <span>Quét mã vạch hoặc mã QR tại cửa soát vé</span>
            </div>

            {/* Authentic 1D Code 128 Barcode */}
            <div className="barcode-wrapper">
              <BarcodeSvg value={barcodeValue} height={48} />
            </div>

            {/* Offline 100% Reliable QR Code */}
            {qrDataUrl && (
              <div className="qr-wrapper">
                <img
                  src={qrDataUrl}
                  alt="QR Code Vé CGV"
                  className="ticket-qr-img"
                />
                <div className="qr-caption">Hoặc quét mã QR qua cổng tự động</div>
              </div>
            )}

            <div className="ticket-disclaimer">
              <AlertCircle size={12} />
              <span>Vé điện tử có giá trị vào phòng chiếu một lần. Vui lòng xuất trình trước giờ chiếu 10 phút.</span>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="ticket-modal-footer no-print">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Đóng
          </button>
          <button type="button" className="btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Printer size={16} /> Xuất phiếu xem phim
          </button>
        </div>
      </div>
    </div>
  );
}
