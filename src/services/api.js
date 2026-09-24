import { MOVIES, CINEMAS, REGIONS, PROMOTIONS, VOUCHERS, SHOWTIME_SLOTS } from '../data/mockData';
import { getTokens, saveTokens, clearSession } from './userService';
import { refreshToken } from './authService';

const API_BASE = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8000';

function getSessionId() {
  let sId = localStorage.getItem('cgv_session_id');
  if (!sId) {
    sId = 'sess-' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('cgv_session_id', sId);
  }
  return sId;
}

// Token refresh mutex and queue
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

async function doFetch(path, options, token) {
  const userId = token ? (getTokens()?.user?.id || getSessionId()) : getSessionId();
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    return await fetch(`${API_BASE}${path}`, {
      signal: options.signal || controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
        ...authHeaders,
        ...(options.headers || {})
      },
      ...options
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Base HTTP request handler with automatic token injection, automatic 401 refresh token,
 * error handling, and mock fallback
 */
async function request(path, options = {}, fallbackData = null) {
  try {
    const tokens = getTokens();
    let res = await doFetch(path, options, tokens?.accessToken);

    // Xử lý 401: Tự động refresh token khi token hết hạn
    if (res.status === 401) {
      if (tokens?.refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const newTokens = await refreshToken(tokens.refreshToken);
            const merged = {
              ...tokens,
              ...newTokens,
              refreshToken: newTokens.refreshToken || tokens.refreshToken,
            };
            saveTokens(merged);
            window.dispatchEvent(new CustomEvent('cgv_tokens_updated', { detail: merged }));
            processQueue(null, merged.accessToken);
            // Thử lại request ban đầu với token mới vừa được cấp
            res = await doFetch(path, options, merged.accessToken);
          } catch (refreshErr) {
            console.warn('[Auto-RefreshToken] Refresh thất bại, phiên đã hết hạn:', refreshErr.message);
            processQueue(refreshErr, null);
            clearSession();
            window.dispatchEvent(new CustomEvent('cgv_session_expired'));
            // Nếu là endpoint công khai hoặc bán công khai (như giữ ghế, rạp, phim), thử lại dạng guest
            if (path.includes('/catalogs/') || path.includes('/seat-locks') || path.includes('/marketings/')) {
              res = await doFetch(path, options, null);
            } else {
              throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            }
          } finally {
            isRefreshing = false;
          }
        } else {
          // Nếu đang có 1 request khác tiến hành refresh, đợi và lấy token mới
          try {
            const newAccessToken = await new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            });
            // Thử lại request ban đầu với access token mới nhận từ queue
            res = await doFetch(path, options, newAccessToken);
          } catch (qErr) {
            if (path.includes('/catalogs/') || path.includes('/seat-locks') || path.includes('/marketings/')) {
              res = await doFetch(path, options, null);
            } else {
              throw qErr;
            }
          }
        }
      } else {
        // Không có refresh token, xóa session lỗi thời và nếu là public endpoint thì retry không có auth header
        clearSession();
        window.dispatchEvent(new CustomEvent('cgv_session_expired'));
        if (path.includes('/catalogs/') || path.includes('/seat-locks') || path.includes('/marketings/')) {
          res = await doFetch(path, options, null);
        }
      }
    }

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errMsg = json?.message || `HTTP ${res.status}`;
      throw new Error(errMsg);
    }

    return json?.data !== undefined ? json.data : json;
  } catch (err) {
    if (fallbackData !== null) {
      console.warn(`[API Fallback] ${path} -> using fallback data:`, err.message);
      return typeof fallbackData === 'function' ? fallbackData() : fallbackData;
    }
    throw err;
  }
}

export const ApiService = {
  // ─────────────────────────────────────────────
  // 1. CATALOG: MOVIES
  // ─────────────────────────────────────────────

  getMovies: async (status = null) => {
    const data = await request(
      '/api/v1/catalogs/movies?page=0&size=50&sort=releaseDate,desc',
      {},
      MOVIES
    );
    const movieList = Array.isArray(data) ? data : (data?.data || MOVIES);
    if (!status) return movieList;
    return movieList.filter(m => m.showingStatus === status);
  },

  getMovieById: async (id) => {
    return await request(
      `/api/v1/catalogs/movies/${id}`,
      {},
      MOVIES.find(m => m.id === id || m.id === Number(id)) || MOVIES[0]
    );
  },

  getMovieCasts: async (movieId) => {
    const data = await request(
      `/api/v1/catalogs/movie-casts/movie/${movieId}`,
      {},
      []
    );
    return Array.isArray(data) ? data : (data?.data || []);
  },

  searchMovies: async (keyword) => {
    if (!keyword?.trim()) return [];
    return await request(
      `/api/v1/catalogs/movies/search?keyword=${encodeURIComponent(keyword)}`,
      {},
      MOVIES.filter(m => m.title.toLowerCase().includes(keyword.toLowerCase()))
    );
  },

  // ─────────────────────────────────────────────
  // 2. CATALOG: CINEMAS & REGIONS & NEARBY GPS
  // ─────────────────────────────────────────────

  getCinemas: async (regionId = null) => {
    const data = await request(
      '/api/v1/catalogs/cinemas?page=0&size=50',
      {},
      CINEMAS
    );
    const cinemaList = Array.isArray(data) ? data : (data?.data || CINEMAS);
    if (!regionId || regionId === 1) return cinemaList;
    return cinemaList.filter(c => c.regionId === Number(regionId) || c.region?.id === Number(regionId));
  },

  getRegions: async () => {
    const data = await request('/api/v1/catalogs/regions', {}, REGIONS);
    return Array.isArray(data) ? data : (data?.data || REGIONS);
  },

  getCinemasNearby: async (lat, lon, radiusKm = 25) => {
    return await request(
      `/api/v1/catalogs/cinemas/nearby?lat=${lat}&lon=${lon}&radiusKm=${radiusKm}`,
      {},
      CINEMAS.map(c => ({ ...c, distanceKm: 1.5 }))
    );
  },

  getMovieSchedule: async (movieId, { date = null, regionId = null, lat = null, lon = null, radiusKm = 30 } = {}) => {
    const params = new URLSearchParams();
    params.append('movieId', movieId);
    if (date) params.append('date', date);
    if (regionId && regionId !== 'all') params.append('regionId', regionId);
    if (lat != null && lon != null) {
      params.append('lat', lat);
      params.append('lon', lon);
      if (radiusKm) params.append('radiusKm', radiusKm);
    }
    return await request(`/api/v1/catalogs/showtimes/movie-schedule?${params.toString()}`, {}, null);
  },

  getCinemasNearbyForMovie: async (movieId, lat, lon, date = null, radiusKm = 30) => {
    const dateParam = date ? `&date=${date}` : '';
    return await request(
      `/api/v1/catalogs/showtimes/nearby?movieId=${movieId}&lat=${lat}&lon=${lon}&radiusKm=${radiusKm}${dateParam}`,
      {},
      null
    );
  },

  getCinemaSchedules: async (cinemaId, date = null) => {
    const dateParam = date ? `?date=${date}` : '';
    return await request(
      `/api/v1/catalogs/cinemas/${cinemaId}/schedule${dateParam}`,
      {},
      null
    );
  },

  // ─────────────────────────────────────────────
  // 3. CATALOG: SHOWTIMES, SEATS & SEAT TYPES
  // ─────────────────────────────────────────────

  getShowtimes: async (filter = {}) => {
    const params = new URLSearchParams();
    if (filter.movieId) params.append('movieId', filter.movieId);
    if (filter.cinemaId) params.append('cinemaId', filter.cinemaId);
    if (filter.date) params.append('date', filter.date);
    params.append('page', '0');
    params.append('size', '50');

    const data = await request(`/api/v1/catalogs/showtimes?${params.toString()}`, {}, []);
    return Array.isArray(data) ? data : (data?.data || []);
  },

  getShowtimeById: async (showtimeId) => {
    return await request(`/api/v1/catalogs/showtimes/${showtimeId}`);
  },

  getSeatsByRoomId: async (roomId) => {
    const data = await request(`/api/v1/catalogs/seats/room/${roomId}?page=0&size=150`, {}, null);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data?.data)) return data.data.data;
    if (Array.isArray(data?.data?.items)) return data.data.items;
    return [];
  },

  getSeatTypes: async () => {
    const data = await request('/api/v1/catalogs/seat-types?page=0&size=20', {}, null);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data?.data)) return data.data.data;
    if (Array.isArray(data?.data?.items)) return data.data.items;
    return [];
  },

  // ─────────────────────────────────────────────
  // 4. MARKETING: PROMOTIONS & VOUCHERS
  // ─────────────────────────────────────────────

  getPromotions: async () => {
    const data = await request('/api/v1/marketings/promotions/active', {}, PROMOTIONS);
    const list = Array.isArray(data) ? data : (data?.data || PROMOTIONS);
    return list.length > 0 ? list : PROMOTIONS;
  },

  getAvailableVouchers: async (totalAmount = 0, tier = 'MEMBER') => {
    try {
      const data = await request(
        `/api/v1/marketings/promotions/available?totalAmount=${totalAmount}&tier=${encodeURIComponent(tier)}`,
        {},
        null
      );
      const list = Array.isArray(data) ? data : (data?.data || []);
      return list;
    } catch {
      // fallback
    }

    // Fallback: Lọc từ PROMOTIONS theo hạng thành viên và tổng tiền đơn hàng
    const userTier = String(typeof tier === 'string' ? tier : (tier?.code || 'MEMBER')).toUpperCase();
    const tierLevels = { ALL: 0, MEMBER: 1, SILVER: 2, GOLD: 3, VIP: 3, PLATINUM: 4, VVIP: 4 };
    const userLevel = tierLevels[userTier] ?? 1;

    return PROMOTIONS.filter(p => {
      if (!p.code || p.isActive === false) return false;
      const requiredTier = (p.applicableTier || p.tier || 'ALL').toUpperCase();
      const requiredLevel = tierLevels[requiredTier] ?? 0;
      if (userLevel < requiredLevel) return false;
      if (totalAmount > 0 && p.minOrderValue && totalAmount < p.minOrderValue) return false;
      return true;
    });
  },

  validateVoucher: async (code, totalAmount, userTierParam = 'MEMBER') => {
    try {
      const activePromos = await ApiService.getPromotions();
      const codeUpper = code.trim().toUpperCase();
      let promo = activePromos.find(p => (p.code || '').toUpperCase() === codeUpper);

      if (!promo) {
        // Fallback to local VOUCHERS list
        promo = VOUCHERS.find(v => (v.code || '').toUpperCase() === codeUpper);
      }

      if (!promo) {
        return { valid: false, message: 'Mã khuyến mãi không tồn tại hoặc đã hết hạn.' };
      }

      // Check membership tier
      const userTier = String(typeof userTierParam === 'string' ? userTierParam : (userTierParam?.code || 'MEMBER')).toUpperCase();
      const tierLevels = { ALL: 0, MEMBER: 1, SILVER: 2, GOLD: 3, VIP: 3, PLATINUM: 4, VVIP: 4 };
      const userLevel = tierLevels[userTier] ?? 1;
      const requiredTier = (promo.applicableTier || promo.tier || 'ALL').toUpperCase();
      const requiredLevel = tierLevels[requiredTier] ?? 0;

      if (userLevel < requiredLevel) {
        return {
          valid: false,
          message: `Mã ưu đãi này chỉ dành cho khách hàng từ hạng ${requiredTier} trở lên.`
        };
      }

      // Check min order value
      const minVal = Number(promo.minOrderValue || 0);
      if (minVal > 0 && totalAmount < minVal) {
        return {
          valid: false,
          message: `Đơn hàng tối thiểu phải từ ${minVal.toLocaleString('vi-VN')}đ để áp dụng mã này.`
        };
      }

      let discount = 0;
      const isPercent = promo.discountType === 'PERCENTAGE' || promo.discountType === 'PERCENT';
      if (isPercent) {
        discount = (totalAmount * Number(promo.discountValue)) / 100;
        if (promo.maxDiscountAmount && discount > Number(promo.maxDiscountAmount)) {
          discount = Number(promo.maxDiscountAmount);
        }
      } else {
        discount = Number(promo.discountValue || 0);
      }

      discount = Math.min(discount, totalAmount);

      return {
        valid: true,
        voucher: promo,
        discountAmount: discount,
        finalAmount: Math.max(0, totalAmount - discount)
      };
    } catch (err) {
      return { valid: false, message: 'Không thể xác thực mã giảm giá lúc này.' };
    }
  },

  // ─────────────────────────────────────────────
  // 5. BOOKING & SEAT LOCKS
  // ─────────────────────────────────────────────

  getActiveSeatLocks: async (showtimeId) => {
    return await request(`/api/v1/bookings/seat-locks/${showtimeId}`, {}, []);
  },

  getBookedSeats: async (showtimeId) => {
    return await request(`/api/v1/bookings/seat-locks/booked/${showtimeId}`, {}, []);
  },

  lockSeats: async (showtimeId, seatIds) => {
    return await request('/api/v1/bookings/seat-locks', {
      method: 'POST',
      body: JSON.stringify({ showtimeId, seatIds })
    });
  },

  releaseSeats: async (showtimeId, seatIds) => {
    return await request('/api/v1/bookings/seat-locks', {
      method: 'DELETE',
      body: JSON.stringify({ showtimeId, seatIds })
    });
  },

  reportExpiredLock: async (showtimeId) => {
    return await request(`/api/v1/bookings/seat-locks/report-expired?showtimeId=${showtimeId}`, {
      method: 'POST'
    }).catch(() => {});
  },

  createBooking: async (bookingPayload) => {
    // bookingPayload: { showtimeId, seatIds, promotionId }
    return await request('/api/v1/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingPayload)
    });
  },

  getMyBookings: async (page = 0, size = 10, filter = {}) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    params.append('sort', 'createdAt,desc');
    if (filter.status) params.append('status', filter.status);

    return await request(`/api/v1/bookings/my-bookings?${params.toString()}`, {}, {
      currentPage: 0,
      totalPages: 0,
      pageSize: size,
      totalElements: 0,
      data: []
    });
  },

  getBookingById: async (bookingId) => {
    return await request(`/api/v1/bookings/${bookingId}`);
  },

  cancelBooking: async (bookingId) => {
    return await request(`/api/v1/bookings/${bookingId}/cancel`, {
      method: 'PUT'
    });
  },

  // ─────────────────────────────────────────────
  // 6. PAYMENT: VNPAY GATEWAY
  // ─────────────────────────────────────────────

  createVnpayPaymentUrl: async (bookingId, amount) => {
    return await request(
      `/api/v1/payments/vnpay/create-url?bookingId=${bookingId}&amount=${amount}`,
      { method: 'POST' }
    );
  },

  verifyVnpayCallback: async (queryString) => {
    const cleanQuery = queryString.startsWith('?') ? queryString.substring(1) : queryString;
    return await request(`/api/v1/payments/vnpay-callback?${cleanQuery}`, {
      method: 'GET'
    });
  },

  getPaymentStatus: async (bookingId) => {
    return await request(`/api/v1/payments/booking/${bookingId}`);
  }
};