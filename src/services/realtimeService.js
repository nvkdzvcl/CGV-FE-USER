// Realtime SSE & Broadcast Channel Bus for CGV System (User Frontend)
const CHANNEL_NAME = 'cgv_realtime_channel';
const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_GATEWAY_URL) || 'http://localhost:8000';

export const REALTIME_EVENTS = {
  MOVIE_STATUS_CHANGED: 'MOVIE_STATUS_CHANGED',
  CINEMA_STATUS_CHANGED: 'CINEMA_STATUS_CHANGED',
  ROOM_STATUS_CHANGED: 'ROOM_STATUS_CHANGED',
  SHOWTIME_CHANGED: 'SHOWTIME_CHANGED',
  PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  BOOKING_CREATED: 'BOOKING_CREATED'
};

class RealtimeService {
  constructor() {
    this.subscribers = new Set();
    this.channel = null;
    this.catalogEventSource = null;
    this.reconnectTimer = null;

    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          this.channel = new BroadcastChannel(CHANNEL_NAME);
          this.channel.onmessage = (event) => {
            if (event.data) {
              this.notify(event.data);
            }
          };
        }
      } catch (e) {
        console.warn('[Realtime] BroadcastChannel init error:', e);
      }

      window.addEventListener('storage', (e) => {
        if (e.key === 'cgv_realtime_event' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.notify(data);
          } catch (err) {}
        }
      });

      // Kết nối đến backend SSE để nhận realtime event từ server
      this.initCatalogSse();
    }
  }

  initCatalogSse() {
    if (typeof window === 'undefined') return;
    try {
      if (this.catalogEventSource) {
        this.catalogEventSource.close();
      }

      const sseUrl = `${API_BASE}/api/v1/catalogs/realtime/stream`;
      this.catalogEventSource = new EventSource(sseUrl);

      this.catalogEventSource.onopen = () => {
        console.log('%c[User Realtime] 🟢 Đã kết nối Catalog SSE Stream thành công:', 'color: #10b981; font-weight: bold; background: #064e3b; padding: 2px 6px; border-radius: 4px;', sseUrl);
      };

      const handleCatalogEvent = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          const type = parsed.type || e.type;
          if (type === 'CONNECTED') {
            console.log('[User Realtime] Handshake OK:', parsed.payload);
            return;
          }
          if (type === 'PING') return;
          console.log(`%c[User Realtime SSE] ⚡ Nhận sự kiện từ Server: ${type}`, 'color: #38bdf8; font-weight: bold;', parsed.payload || parsed);
          this.notify({
            type,
            payload: parsed.payload || parsed,
            timestamp: parsed.timestamp || Date.now(),
            source: 'BACKEND_CATALOG_SSE'
          });
        } catch (err) {
          // ignore
        }
      };

      this.catalogEventSource.onmessage = handleCatalogEvent;
      this.catalogEventSource.addEventListener('MOVIE_STATUS_CHANGED', handleCatalogEvent);
      this.catalogEventSource.addEventListener('CINEMA_STATUS_CHANGED', handleCatalogEvent);
      this.catalogEventSource.addEventListener('ROOM_STATUS_CHANGED', handleCatalogEvent);
      this.catalogEventSource.addEventListener('SHOWTIME_CHANGED', handleCatalogEvent);

      this.catalogEventSource.onerror = () => {
        console.warn('[User Realtime] ⚠️ Mất kết nối Catalog SSE, sẽ thử kết nối lại sau 5s...');
        this.catalogEventSource.close();
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.initCatalogSse(), 5000);
      };
    } catch (e) {
      console.warn('[Realtime] Catalog SSE connection failed:', e);
    }
  }

  /**
   * Lắng nghe xác nhận thanh toán realtime cho 1 đơn vé cụ thể
   * Khi webhook từ VNPay/MoMo/VietQR callback về backend -> backend bắn SSE -> client tự nhảy sang màn hình vé thành công
   */
  subscribeToBookingPayment(bookingId, onPaymentConfirmed, onPaymentFailed) {
    if (typeof window === 'undefined' || !bookingId) return () => {};

    try {
      const sseUrl = `${API_BASE}/api/v1/bookings/realtime/booking/${bookingId}`;
      const eventSource = new EventSource(sseUrl);

      eventSource.addEventListener('PAYMENT_CONFIRMED', (e) => {
        try {
          const data = JSON.parse(e.data);
          eventSource.close();
          if (onPaymentConfirmed) onPaymentConfirmed(data.payload || data);
        } catch (err) {
          console.error('[Realtime] Parse PAYMENT_CONFIRMED error:', err);
        }
      });

      eventSource.addEventListener('PAYMENT_FAILED', (e) => {
        try {
          const data = JSON.parse(e.data);
          eventSource.close();
          if (onPaymentFailed) onPaymentFailed(data.payload || data);
        } catch (err) {
          console.error('[Realtime] Parse PAYMENT_FAILED error:', err);
        }
      });

      eventSource.onerror = () => {
        // SSE error, fallback gracefully
      };

      return () => {
        try {
          eventSource.close();
        } catch (e) {}
      };
    } catch (err) {
      console.warn('[Realtime] subscribeToBookingPayment failed:', err);
      return () => {};
    }
  }

  notify(data) {
    this.subscribers.forEach(cb => {
      try {
        cb(data);
      } catch (err) {
        console.error('[Realtime] Error in subscriber callback:', err);
      }
    });
  }

  emit(type, payload = {}) {
    const message = {
      type,
      payload,
      timestamp: Date.now(),
      sender: 'FE-USER'
    };

    this.notify(message);

    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch (err) {}
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cgv_realtime_event', JSON.stringify(message));
      } catch (e) {}
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
}

export const realtime = new RealtimeService();
