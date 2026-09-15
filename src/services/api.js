import { MOVIES, CINEMAS, REGIONS, PROMOTIONS, VOUCHERS, SHOWTIME_SLOTS } from '../data/mockData';

const API_BASE = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8000';

async function request(path, options = {}, fallbackData = null) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[API Fallback] ${path} offline. Using mock data.`, err.message);
    return fallbackData;
  }
}

export const ApiService = {
  getMovies: async (status = null) => {
    const data = await request('/api/v1/catalogs/movies', {}, MOVIES);
    if (!status) return data;
    return data.filter(m => m.showingStatus === status);
  },

  getCinemas: async (regionId = null) => {
    const data = await request('/api/v1/catalogs/cinemas', {}, CINEMAS);
    if (!regionId || regionId === 1) return data;
    return data.filter(c => c.regionId === Number(regionId));
  },

  getRegions: async () => {
    return REGIONS;
  },

  getPromotions: async () => {
    return await request('/api/v1/marketings/promotions', {}, PROMOTIONS);
  },

  getVouchers: async () => {
    return VOUCHERS;
  },

  validateVoucher: async (code, totalAmount) => {
    const voucher = VOUCHERS.find(v => v.code.toUpperCase() === code.trim().toUpperCase());
    if (!voucher) {
      return { valid: false, message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn.' };
    }
    return {
      valid: true,
      voucher,
      discountAmount: voucher.discountValue,
      finalAmount: Math.max(0, totalAmount - voucher.discountValue)
    };
  },

  createBooking: async (bookingPayload) => {
    return await request('/api/v1/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingPayload)
    }, {
      success: true,
      bookingId: 'BK-' + Math.floor(100000 + Math.random() * 900000),
      ...bookingPayload
    });
  }
};