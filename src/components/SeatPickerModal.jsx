import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { X, Clock, Check, Tag, ChevronDown, ChevronUp, Ticket, Gift, AlertCircle, Info } from 'lucide-react';
import { ApiService } from '../services/api';
import { realtime, REALTIME_EVENTS } from '../services/realtimeService';
import { useSeatSocket } from '../hooks/useSeatSocket';
import { useAuth } from '../hooks/useAuth';

const DEFAULT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const DEFAULT_COLS = 10;

function formatVnd(num) {
  return Number(num || 0).toLocaleString('vi-VN') + 'đ';
}

function generateDefaultSeats(basePrice = 85000, surcharges = {}, rows = DEFAULT_ROWS, cols = DEFAULT_COLS) {
  const map = {};
  const vipSurcharge = Number(surcharges?.VIP ?? 15000);
  const sweetboxSurcharge = Number(surcharges?.SWEETBOX ?? 30000);

  rows.forEach(row => {
    for (let num = 1; num <= cols; num++) {
      const id = `${row}${num}`;
      let type = 'normal';
      let price = basePrice;

      if (['D', 'E', 'F', 'G'].includes(row)) {
        type = 'vip';
        price = basePrice + vipSurcharge;
      } else if (row === 'H') {
        type = 'sweetbox';
        price = basePrice * 2 + sweetboxSurcharge;
      }

      map[id] = {
        id,
        dbId: null,
        row,
        number: num,
        type,
        price,
        status: 'available'
      };
    }
  });
  return map;
}

export default function SeatPickerModal({ bookingContext, onClose, onBookingSuccess, onOpenAuth, seatReleaseRef }) {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.id;
  const [activeShowtime, setActiveShowtime] = useState(bookingContext?.showtime || null);
  const showtimeId = activeShowtime?.id || bookingContext?.showtime?.id || bookingContext?.showtimeId;
  const [pendingCheckout, setPendingCheckout] = useState(null);
  const pendingCheckoutRef = useRef(null);
  const [checkoutLoading, setCheckoutLoading] = useState(true);
  const [checkoutError, setCheckoutError] = useState('');

  // Base price from showtime
  const basePrice = Number(
    activeShowtime?.basePrice || bookingContext?.showtime?.basePrice || bookingContext?.basePrice || 85000
  );

  const [gridRows, setGridRows] = useState(DEFAULT_ROWS);
  const [seatsPerRow, setSeatsPerRow] = useState(DEFAULT_COLS);

  const [seatTypeSurcharges, setSeatTypeSurcharges] = useState({
    NORMAL: 0,
    VIP: 15000,
    SWEETBOX: 30000
  });

  const [seats, setSeats] = useState(() => generateDefaultSeats(basePrice, { NORMAL: 0, VIP: 15000, SWEETBOX: 30000 }, DEFAULT_ROWS, DEFAULT_COLS));
  const [isLoadingSeats, setIsLoadingSeats] = useState(true);
  const [seatLoadError, setSeatLoadError] = useState(null);
  const [seatLoadRetry, setSeatLoadRetry] = useState(0);
  const [isMaintenanceRoom, setIsMaintenanceRoom] = useState(false);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);

  useEffect(() => {
    if (showtimeId) localStorage.removeItem(`cgv_selected_seats_${showtimeId}`);
    setSelectedSeatIds([]);
  }, [showtimeId]);
  const previousAccountRef = useRef(currentUser?.id);
  useEffect(() => {
    if (previousAccountRef.current && previousAccountRef.current !== currentUser?.id) {
      setSelectedSeatIds([]);
      setSeatLoadRetry(attempt => attempt + 1);
    }
    previousAccountRef.current = currentUser?.id;
  }, [currentUser?.id]);
  const [timeLeft, setTimeLeft] = useState(240); // Phase 1: 4 phút (240s) giữ ghế
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const [idleCountdown, setIdleCountdown] = useState(15);
  const lastActivityRef = React.useRef(Date.now());

  // ─── Voucher state ───
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [checkoutNotice, setCheckoutNotice] = useState(null);

  useEffect(() => {
    if (!currentUser?.id || !showtimeId) {
      setPendingCheckout(null);
      setCheckoutLoading(false);
      return;
    }
    let active = true;
    pendingCheckoutRef.current = null;
    setPendingCheckout(null);
    setCheckoutError('');
    const checkBooking = async () => {
      try {
        const booking = await ApiService.getMyPendingBooking(showtimeId);
        if (!active) return;
        const previous = pendingCheckoutRef.current;
        if (previous && !booking) {
          setCheckoutNotice({ showtimeId, bookingId: previous.bookingId, status: 'ENDED' });
          setSeatLoadRetry(attempt => attempt + 1);
        }
        pendingCheckoutRef.current = booking;
        setPendingCheckout(booking);
        setCheckoutError('');
      } catch (err) {
        if (active) setCheckoutError('Không kiểm tra được đơn chờ thanh toán. Vui lòng thử lại trước khi chọn ghế.');
      } finally {
        if (active) setCheckoutLoading(false);
      }
    };
    setCheckoutLoading(true);
    checkBooking();
    const timer = setInterval(checkBooking, 30000);
    return () => { active = false; clearInterval(timer); };
  }, [currentUser?.id, showtimeId]);

  const userTier = useMemo(() => {
    const raw = currentUser?.membershipTier?.code
      || currentUser?.membershipTier
      || currentUser?.membership_tier
      || currentUser?.tier
      || 'MEMBER';
    const str = typeof raw === 'string' ? raw : (raw?.code || 'MEMBER');
    return String(str).toUpperCase();
  }, [currentUser]);

  // Dynamic price calculation directly from selected seats
  const normalPrice = basePrice;
  const vipPrice = basePrice + (seatTypeSurcharges.VIP ?? 15000);
  const sweetboxPrice = basePrice * 2 + (seatTypeSurcharges.SWEETBOX ?? 30000);

  const rawTotal = useMemo(() => {
    return selectedSeatIds.reduce((sum, id) => {
      const seatPrice = seats[id]?.price || normalPrice;
      return sum + seatPrice;
    }, 0);
  }, [selectedSeatIds, seats, normalPrice]);

  // Dynamic discount calculation
  const calcVoucherDiscount = useCallback((promo, total) => {
    if (!promo || total <= 0) return 0;
    const minVal = Number(promo.minOrderValue || 0);
    if (minVal > 0 && total < minVal) return 0;

    let disc = 0;
    const isPercent = promo.discountType === 'PERCENTAGE' || promo.discountType === 'PERCENT';
    if (isPercent) {
      disc = (total * Number(promo.discountValue)) / 100;
      if (promo.maxDiscountAmount && disc > Number(promo.maxDiscountAmount)) {
        disc = Number(promo.maxDiscountAmount);
      }
    } else {
      disc = Number(promo.discountValue || 0);
    }
    return Math.min(disc, total);
  }, []);

  const discountAmount = appliedVoucher ? appliedVoucher.discountAmount : 0;
  const finalTotal = Math.max(0, rawTotal - discountAmount);

  // 1. Fetch dynamic seat types from API
  useEffect(() => {
    ApiService.getSeatTypes()
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        if (list.length > 0) {
          const map = {};
          list.forEach(st => {
            map[st.name] = Number(st.surcharge || 0);
          });
          setSeatTypeSurcharges(prev => ({ ...prev, ...map }));
        }
      })
      .catch(() => {});
  }, []);

  // Update seat prices if surcharges or basePrice change
  useEffect(() => {
    setSeats(prev => {
      const updated = { ...prev };
      let changed = false;
      const vipSurcharge = Number(seatTypeSurcharges?.VIP ?? 15000);
      const sweetboxSurcharge = Number(seatTypeSurcharges?.SWEETBOX ?? 30000);

      Object.keys(updated).forEach(id => {
        const s = updated[id];
        let newPrice = basePrice;
        if (s.type === 'vip') newPrice = basePrice + vipSurcharge;
        else if (s.type === 'sweetbox') newPrice = basePrice * 2 + sweetboxSurcharge;

        if (s.price !== newPrice) {
          updated[id] = { ...s, price: newPrice };
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  }, [basePrice, seatTypeSurcharges]);

  // 2. Resolve real showtime if ID is not UUID
  useEffect(() => {
    const isUuid = showtimeId && showtimeId.length === 36;
    if (!isUuid && bookingContext?.movie?.id) {
      ApiService.getShowtimes({ movieId: bookingContext.movie.id })
        .then(showtimes => {
          if (Array.isArray(showtimes) && showtimes.length > 0) {
            const cinemaId = bookingContext?.cinema?.id;
            const matched = showtimes.find(st => (st.roomResponse?.cinemaResponse?.id || st.cinemaId) === cinemaId) || showtimes[0];
            setActiveShowtime(matched);
          }
        })
        .catch(err => console.error('Lỗi khi tải suất chiếu thật:', err));
    }
  }, [bookingContext, showtimeId]);

  // 3. Load active promotions filtered by user tier & total amount from API
  useEffect(() => {
    ApiService.getAvailableVouchers(rawTotal, userTier)
      .then(list => {
        if (Array.isArray(list)) {
          setAvailableVouchers(list);
        }
      })
      .catch(err => console.warn('Lỗi tải voucher khả dụng:', err));
  }, [rawTotal, userTier, currentUser]);

  // Realtime WebSocket for seat lock events
  const handleSocketSeatEvent = useCallback((event) => {
    if (!event?.seatIds || !Array.isArray(event.seatIds)) return;
    setSeats(prevSeats => {
      const updated = { ...prevSeats };
      let changed = false;
      event.seatIds.forEach(targetId => {
        const seatKey = Object.keys(updated).find(k => updated[k]?.dbId === targetId || k === targetId);
        if (!seatKey || !updated[seatKey]) return;
        if (event.type === 'LOCK') {
          const isMyLock = event.userId === currentUserId;
          if (!isMyLock && !selectedSeatIds.includes(seatKey)) {
            updated[seatKey] = { ...updated[seatKey], status: 'holding' };
            changed = true;
          }
        } else if (event.type === 'RELEASE') {
          if (updated[seatKey].status === 'holding') {
            updated[seatKey] = { ...updated[seatKey], status: 'available' };
            changed = true;
          }
        } else if (event.type === 'BOOKED') {
          updated[seatKey] = { ...updated[seatKey], status: 'booked' };
          changed = true;
        }
      });
      return changed ? updated : prevSeats;
    });
  }, [currentUserId, selectedSeatIds]);

  const { isConnected: isSocketConnected } = useSeatSocket(showtimeId, handleSocketSeatEvent);

  // Kiểm tra trạng thái bảo trì của phòng chiếu & rạp
  useEffect(() => {
    const roomStatus = activeShowtime?.roomResponse?.status || bookingContext?.room?.status;
    const cinemaStatus = activeShowtime?.roomResponse?.cinemaResponse?.status || bookingContext?.cinema?.status;
    if (roomStatus === 'MAINTENANCE' || (cinemaStatus && cinemaStatus !== 'ACTIVE')) {
      setIsMaintenanceRoom(true);
    } else {
      setIsMaintenanceRoom(false);
    }
  }, [activeShowtime, bookingContext]);

  // Ưu tiên roomId trực tiếp từ bookingContext hoặc showtime
  const currentRoomId = bookingContext?.roomId
    || bookingContext?.showtime?.roomId
    || activeShowtime?.roomId
    || activeShowtime?.roomResponse?.id
    || bookingContext?.showtime?.roomResponse?.id;

  // Lắng nghe realtime sự kiện phòng chuyển sang bảo trì kỹ thuật đột xuất
  useEffect(() => {
    if (!currentRoomId) return;
    const unsubscribe = realtime.subscribe((event) => {
      if (event?.type === REALTIME_EVENTS.ROOM_STATUS_CHANGED) {
        if (event.payload?.roomId === currentRoomId && event.payload?.status === 'MAINTENANCE') {
          setIsMaintenanceRoom(true);
        } else if (event.payload?.roomId === currentRoomId && event.payload?.status === 'ACTIVE') {
          setIsMaintenanceRoom(false);
        }
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentRoomId]);

  // 4. Resolve roomId & Load real seats from DB by roomId with API-driven prices
  useEffect(() => {
    let isMounted = true;
    setSeatLoadError(null);
    setIsLoadingSeats(true);
    if (!currentRoomId && showtimeId && showtimeId.length === 36) {
      ApiService.getShowtimeById(showtimeId)
        .then(st => {
          if (!isMounted) return;
          if (st) setActiveShowtime(st);
          else throw new Error('Không tìm thấy suất chiếu.');
        })
        .catch(err => {
          if (!isMounted) return;
          console.warn('Không thể tải chi tiết showtime:', err);
          setSeatLoadError(err.message);
          setIsLoadingSeats(false);
        });
      return () => { isMounted = false; };
    }

    if (!currentRoomId) {
      setSeatLoadError('Không xác định được phòng chiếu.');
      setIsLoadingSeats(false);
      return;
    }

    if (!showtimeId || showtimeId.length !== 36) {
      setSeatLoadError('Chưa xác định được suất chiếu hợp lệ.');
      setIsLoadingSeats(false);
      return;
    }

    Promise.all([
      ApiService.getSeatsByRoomId(currentRoomId),
      ApiService.getBookedSeats(showtimeId),
      ApiService.getActiveSeatLocks(showtimeId)
    ]).then(([seatsRes, bookedRes, locksRes]) => {
      if (!isMounted) return;

      const roomSeats = Array.isArray(seatsRes) ? seatsRes : (seatsRes?.data || []);

      if (roomSeats.length === 0) {
        throw new Error('Phòng chiếu chưa có dữ liệu ghế.');
      }

      if (!Array.isArray(bookedRes) || !Array.isArray(locksRes)) {
        throw new Error('Máy chủ không trả trạng thái ghế hợp lệ.');
      }
      const rawBooked = bookedRes;
      const bookedSet = new Set(rawBooked.map(String));
      setSelectedSeatIds(current => current.filter(id => {
        const seat = roomSeats.find(item => `${item.rowChar}${item.seatNumber}` === id);
        return seat && seat.isActive !== false && !bookedSet.has(String(seat.id));
      }));

      const rawLocks = locksRes;
      const locksSet = new Set(rawLocks.map(String));

      // Trích xuất hàng và số cột chuẩn xác trực tiếp từ Database BE
      const rowsFound = Array.from(new Set(roomSeats.map(s => s.rowChar).filter(Boolean))).sort();
      const maxColFound = Math.max(...roomSeats.map(s => Number(s.seatNumber) || 0), 10);
      if (rowsFound.length > 0) setGridRows(rowsFound);
      if (maxColFound > 0) setSeatsPerRow(maxColFound);

      const vipSurcharge = Number(seatTypeSurcharges.VIP ?? 15000);
      const sweetboxSurcharge = Number(seatTypeSurcharges.SWEETBOX ?? 30000);

      setSeats(() => {
        const updated = {};
        roomSeats.forEach(s => {
          const row = s.rowChar;
          const num = s.seatNumber;
          const id = `${row}${num}`;
          let type = 'normal';
          let price = basePrice;

          if (s.seatTypeName === 'VIP') {
            type = 'vip';
            price = basePrice + vipSurcharge;
          } else if (s.seatTypeName === 'SWEETBOX') {
            type = 'sweetbox';
            price = basePrice * 2 + sweetboxSurcharge;
          }

          let currentStatus = 'available';
          const sIdStr = String(s.id);
          if (bookedSet.has(sIdStr) || s.isActive === false) {
            currentStatus = 'booked';
          } else if (locksSet.has(sIdStr)) {
            if (!selectedSeatIdsRef.current.includes(id)) {
              currentStatus = 'holding';
            }
          }

          updated[id] = {
            id,
            dbId: s.id,
            row,
            number: num,
            type,
            price,
            status: currentStatus
          };
        });
        return updated;
      });
    }).catch(err => {
      console.error('Lỗi khi tải sơ đồ ghế:', err);
      if (isMounted) setSeatLoadError(err.message);
    }).finally(() => {
      if (isMounted) setIsLoadingSeats(false);
    });

    return () => {
      isMounted = false;
    };
  }, [activeShowtime, bookingContext, basePrice, seatTypeSurcharges, showtimeId, seatLoadRetry]);

  const selectedSeatIdsRef = useRef(selectedSeatIds);
  const seatsRef = useRef(seats);
  const showtimeIdRef = useRef(showtimeId);
  const successOrderRef = useRef(successOrder);

  useEffect(() => {
    selectedSeatIdsRef.current = selectedSeatIds;
    seatsRef.current = seats;
    showtimeIdRef.current = showtimeId;
    successOrderRef.current = successOrder;
    pendingCheckoutRef.current = pendingCheckout;
  }, [selectedSeatIds, seats, showtimeId, successOrder, pendingCheckout]);

  useEffect(() => {
    if (!seatReleaseRef) return;
    seatReleaseRef.current = async () => {
      if (pendingCheckoutRef.current) return;
      const dbIds = selectedSeatIdsRef.current.map(id => seatsRef.current[id]?.dbId).filter(Boolean);
      if (!dbIds.length) return;
      await ApiService.releaseSeats(showtimeIdRef.current, dbIds, AbortSignal.timeout(3000));
      selectedSeatIdsRef.current = [];
    };
    return () => { seatReleaseRef.current = null; };
  }, [seatReleaseRef]);

  // Giải phóng toàn bộ ghế ngay lập tức khi người dùng thoát hoặc đóng màn hình
  useEffect(() => {
    return () => {
      // Nếu đang chuyển hướng sang VNPay thì KHÔNG release ghế
      if (pendingCheckoutRef.current) return;

      if (!successOrderRef.current && selectedSeatIdsRef.current.length > 0 && showtimeIdRef.current && showtimeIdRef.current.length === 36) {
        const dbIds = selectedSeatIdsRef.current
          .map(id => seatsRef.current[id]?.dbId)
          .filter(id => id && id.length === 36);
        if (dbIds.length > 0) {
          ApiService.releaseSeats(showtimeIdRef.current, dbIds).catch(() => {});
        }
      }
    };
  }, []);

  const handleCloseModal = useCallback(() => {
    const hasActiveCheckout = Boolean(pendingCheckout);
    if (showtimeId) {
      localStorage.removeItem(`cgv_selected_seats_${showtimeId}`);
    }
    if (selectedSeatIds.length > 0 && !successOrder && !hasActiveCheckout && showtimeId && showtimeId.length === 36) {
      const dbIds = selectedSeatIds.map(id => seats[id]?.dbId).filter(id => id && id.length === 36);
      if (dbIds.length > 0) ApiService.releaseSeats(showtimeId, dbIds).catch(() => {});
    }
    onClose();
  }, [selectedSeatIds, successOrder, showtimeId, seats, onClose, pendingCheckout]);

  // ─── User Activity & Heartbeat / Idle Monitor ───
  const resetUserActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showIdleWarning) {
      setShowIdleWarning(false);
      setIdleCountdown(15);
    }
  }, [showIdleWarning]);

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    const handleEvent = () => resetUserActivity();
    events.forEach(e => window.addEventListener(e, handleEvent, { passive: true }));
    return () => {
      events.forEach(e => window.removeEventListener(e, handleEvent));
    };
  }, [resetUserActivity]);

  // Idle check timer: cảnh báo 15s nếu đứng yên 75s
  useEffect(() => {
    if (selectedSeatIds.length === 0 || isCheckingOut || successOrder || pendingCheckout) {
      if (showIdleWarning) setShowIdleWarning(false);
      return;
    }

    const idleTimer = setInterval(() => {
      if (!showIdleWarning) {
        const idleSecs = (Date.now() - lastActivityRef.current) / 1000;
        if (idleSecs >= 75) {
          setShowIdleWarning(true);
          setIdleCountdown(15);
        }
      } else {
        setIdleCountdown(prev => {
          if (prev <= 1) {
            clearInterval(idleTimer);
            setShowIdleWarning(false);
            const dbIds = selectedSeatIds.map(id => seats[id]?.dbId).filter(id => id && id.length === 36);
            if (dbIds.length > 0 && showtimeId && showtimeId.length === 36) {
              ApiService.releaseSeats(showtimeId, dbIds).catch(() => {});
              ApiService.reportExpiredLock(showtimeId).catch(() => {});
            }
            alert('Bạn không có thao tác nào trong hơn 1 phút. Ghế đã được tự động giải phóng để nhường cho khán giả khác.');
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(idleTimer);
  }, [selectedSeatIds, isCheckingOut, successOrder, pendingCheckout, showIdleWarning, seats, showtimeId, onClose]);

  // Countdown timer Phase 1 (4 minutes - 240s)
  useEffect(() => {
    if (pendingCheckout) return;
    if (selectedSeatIds.length === 0) {
      setTimeLeft(240);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          alert('Hết thời gian giữ ghế (4 phút). Ghế đã tự động được nhả về hệ thống.');
          if (selectedSeatIds.length > 0 && showtimeId && showtimeId.length === 36) {
            const dbIds = selectedSeatIds.map(id => seats[id]?.dbId).filter(id => id && id.length === 36);
            if (dbIds.length > 0) {
              ApiService.releaseSeats(showtimeId, dbIds).catch(() => {});
              ApiService.reportExpiredLock(showtimeId).catch(() => {});
            }
          }
          handleCloseModal();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [handleCloseModal, selectedSeatIds, showtimeId, seats, pendingCheckout]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Re-calculate applied voucher if rawTotal changes
  useEffect(() => {
    if (selectedVoucher && rawTotal > 0) {
      const disc = calcVoucherDiscount(selectedVoucher, rawTotal);
      if (disc > 0) {
        setAppliedVoucher({ discountAmount: disc, voucher: selectedVoucher });
        setCouponMsg('');
      } else {
        // Voucher is no longer valid for new total
        const minVal = Number(selectedVoucher.minOrderValue || 0);
        setAppliedVoucher(null);
        if (minVal > rawTotal) {
          setCouponMsg(`Mã ${selectedVoucher.code} yêu cầu đơn từ ${formatVnd(minVal)} (còn thiếu ${formatVnd(minVal - rawTotal)}).`);
        }
      }
    } else if (rawTotal === 0) {
      setAppliedVoucher(null);
      setCouponMsg('');
    }
  }, [rawTotal, selectedVoucher, calcVoucherDiscount]);

  // ─── Seat click handler ───
  const toggleSeat = async (id) => {
    if (!currentUser) {
      onOpenAuth?.('login');
      return;
    }
    if (checkoutLoading || checkoutError) return;
    if (pendingCheckout) {
      alert('Ghế của đơn cũ đang chờ VNPay. Hãy tiếp tục hoặc đối soát đơn cũ, không chọn lại ghế.');
      return;
    }
    if (isLoadingSeats || seatLoadError) return;
    if (isMaintenanceRoom) {
      alert('Phòng chiếu này hiện đang được bảo trì kỹ thuật. Quý khách vui lòng chọn phòng khác!');
      return;
    }

    resetUserActivity();

    const seat = seats[id];
    if (!seat || !seat.dbId) {
      alert('Sơ đồ ghế đang được đồng bộ từ phòng chiếu máy chủ. Vui lòng thử lại sau giây lát!');
      return;
    }
    const isSelected = selectedSeatIds.includes(id);

    // Nếu ghế chưa chọn: kiểm tra xem ghế đã bị người khác mua hoặc giữ chưa
    if (!isSelected) {
      if (seat.status === 'booked') return;
      if (seat.status === 'holding') return;
    }

    const seatDbId = seat.dbId;

    if (isSelected) {
      // 1. Bỏ chọn ghế ngay lập tức trên UI
      setSelectedSeatIds(prev => prev.filter(s => s !== id));
      setSeats(prev => {
        if (!prev[id]) return prev;
        return {
          ...prev,
          [id]: { ...prev[id], status: 'available' }
        };
      });

      // 2. Gửi request giải phóng ghế xuống backend Redis
      if (showtimeId && showtimeId.length === 36 && seatDbId && seatDbId.length === 36) {
        ApiService.releaseSeats(showtimeId, [seatDbId]).catch(err => {
          console.warn('Lỗi khi release ghế:', err);
        });
      }
    } else {
      if (selectedSeatIds.length >= 8) {
        alert('Mỗi tài khoản chỉ được chọn tối đa 8 ghế trong một suất chiếu!');
        return;
      }

      // Tạm thời chọn ghế trên giao diện
      setSelectedSeatIds(prev => [...prev, id]);

      // Gọi API lock ghế lên Redis BE
      if (showtimeId && showtimeId.length === 36 && seatDbId && seatDbId.length === 36) {
        try {
          const lockRes = await ApiService.lockSeats(showtimeId, [seatDbId]);
          if (lockRes?.data?.expiresAt || lockRes?.expiresAt) {
            const expTime = lockRes?.data?.expiresAt || lockRes?.expiresAt;
            const remaining = Math.max(10, Math.floor((new Date(expTime).getTime() - Date.now()) / 1000));
            setTimeLeft(remaining);
          }
        } catch (err) {
          console.warn('Lỗi khi lock ghế:', err);
          // Hủy chọn nếu lock thất bại (ví dụ: ghế vừa bị người khác chọn hoặc user bị cool-down)
          setSelectedSeatIds(prev => prev.filter(s => s !== id));
          setSeats(prev => {
            if (!prev[id]) return prev;
            return {
              ...prev,
              [id]: { ...prev[id], status: 'available' }
            };
          });
          alert(err.message || 'Không thể giữ ghế này lúc này. Vui lòng chọn ghế khác!');
        }
      }
    }
  };

  const handleSelectVoucher = (voucher) => {
    if (rawTotal === 0) {
      setCouponMsg('Vui lòng chọn ít nhất 1 ghế trước khi áp dụng mã giảm giá.');
      return;
    }
    if (!currentUser && voucher.applicableTier && voucher.applicableTier !== 'ALL') {
      setCouponMsg(`Mã '${voucher.code}' chỉ dành cho thành viên CGV. Vui lòng đăng nhập tài khoản để sử dụng!`);
      return;
    }
    const minVal = Number(voucher.minOrderValue || 0);
    if (minVal > 0 && rawTotal < minVal) {
      setCouponMsg(`Đơn tối thiểu ${formatVnd(minVal)} để dùng mã này (còn thiếu ${formatVnd(minVal - rawTotal)}).`);
      return;
    }
    const disc = calcVoucherDiscount(voucher, rawTotal);
    setSelectedVoucher(voucher);
    setAppliedVoucher({ discountAmount: disc, voucher });
    setCouponCode(voucher.code || '');
    setCouponMsg('');
    setIsVoucherOpen(false);
  };

  const handleApplyCouponManual = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    if (rawTotal === 0) {
      setCouponMsg('Vui lòng chọn ghế trước khi áp dụng mã giảm giá.');
      return;
    }
    const result = await ApiService.validateVoucher(couponCode, rawTotal, userTier);
    if (result.valid) {
      setAppliedVoucher(result);
      setSelectedVoucher(result.voucher);
      setCouponMsg('');
      setIsVoucherOpen(false);
    } else {
      setAppliedVoucher(null);
      setSelectedVoucher(null);
      setCouponMsg(result.message);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setSelectedVoucher(null);
    setCouponCode('');
    setCouponMsg('');
  };

  // ─── Checkout & VNPay Payment Flow ───
  const resumeActiveCheckout = async () => {
    setIsCheckingOut(true);
    try {
      const booking = await ApiService.getMyPendingBooking(showtimeId);
      pendingCheckoutRef.current = booking;
      setPendingCheckout(booking);
      setCheckoutError('');
      if (!booking) {
        return false;
      }
      if (booking.status !== 'PAYMENT_PENDING' || !booking.paymentDeadline || Date.parse(booking.paymentDeadline) <= Date.now()) {
        throw new Error('Đơn trước đã hết hạn hoặc không còn chờ thanh toán. Kiểm tra trạng thái giao dịch, không đặt lại cùng ghế.');
      }
      try {
        await ApiService.getPaymentStatus(booking.bookingId);
        throw new Error('Đơn đã có giao dịch VNPay. Vui lòng kiểm tra kết quả trong lịch sử vé hoặc liên hệ hỗ trợ.');
      } catch (error) {
        if (error.status !== 404) throw error;
      }
      const url = await ApiService.createVnpayPaymentUrl(booking.bookingId, booking.finalAmount);
      if (!url?.startsWith('http')) throw new Error('Không lấy được đường dẫn thanh toán.');
      window.location.href = url;
    } catch (err) {
      setCheckoutError(err.message || 'Không kiểm tra được đơn chờ thanh toán. Vui lòng tải lại trang.');
      alert(err.message || 'Không thể tiếp tục đơn đang thanh toán. Vui lòng liên hệ hỗ trợ.');
    } finally {
      setIsCheckingOut(false);
    }
    return true;
  };

  const handleCheckout = () => {
    if (!currentUser) {
      onOpenAuth?.('login');
      return;
    }
    if (checkoutLoading || checkoutError) return;
    if (pendingCheckout) {
      resumeActiveCheckout();
      return;
    }
    if (isMaintenanceRoom) {
      alert('Phòng chiếu này hiện đang được bảo trì kỹ thuật, tạm ngưng nhận đặt vé. Quý khách vui lòng chọn phòng hoặc suất chiếu khác!');
      return;
    }

    if (selectedSeatIds.length === 0) {
      alert('Vui lòng chọn ít nhất một ghế ngồi.');
      return;
    }

    proceedCheckout();
  };

  const proceedCheckout = async () => {
    if (await resumeActiveCheckout()) return;
    const targetShowtimeId = showtimeId;
    if (!targetShowtimeId || targetShowtimeId.length !== 36) {
      alert('Chưa có thông tin suất chiếu hợp lệ (UUID). Vui lòng chọn lại suất chiếu!');
      return;
    }

    let seatDbIds = selectedSeatIds.map(id => seats[id]?.dbId).filter(Boolean);
    if (seatDbIds.length < selectedSeatIds.length) {
      const currentRoomId = activeShowtime?.roomResponse?.id || activeShowtime?.roomId
        || bookingContext?.showtime?.roomResponse?.id || bookingContext?.showtime?.roomId
        || bookingContext?.roomId;

      if (currentRoomId) {
        try {
          const res = await ApiService.getSeatsByRoomId(currentRoomId);
          const roomSeats = Array.isArray(res) ? res : (res?.data || []);
          const idToDbId = {};
          roomSeats.forEach(s => {
            idToDbId[`${s.rowChar}${s.seatNumber}`] = s.id;
          });
          seatDbIds = selectedSeatIds.map(id => idToDbId[id] || seats[id]?.dbId).filter(Boolean);
        } catch {
          // ignore
        }
      }
    }

    if (seatDbIds.length === 0) {
      alert('Sơ đồ ghế đang được đồng bộ với máy chủ rạp. Vui lòng thử lại sau 1-2 giây!');
      return;
    }

    setIsCheckingOut(true);
    let createdBookingId = null;
    try {
      const bookingPayload = {
        showtimeId: targetShowtimeId,
        seatIds: seatDbIds,
        promotionId: appliedVoucher?.voucher?.id || null
      };

      const bookingRes = await ApiService.createBooking(bookingPayload);
      const realBookingId = bookingRes?.id || bookingRes?.bookingId;
      if (!realBookingId) throw new Error('Không nhận được mã đặt vé từ máy chủ.');
      const amountToPay = bookingRes?.finalAmount || finalTotal;
      createdBookingId = realBookingId;

      // 2. Tạo link thanh toán VNPay
      const vnpayUrl = await ApiService.createVnpayPaymentUrl(realBookingId, amountToPay);

      if (vnpayUrl && typeof vnpayUrl === 'string' && vnpayUrl.startsWith('http')) {
        pendingCheckoutRef.current = bookingRes;
        localStorage.removeItem(`cgv_selected_seats_${targetShowtimeId}`);
        window.location.href = vnpayUrl;
        return;
      }

      throw new Error('Không nhận được URL VNPay. Kiểm tra trạng thái giao dịch trước khi thử lại.');
    } catch (err) {
      console.error('Checkout error:', err);
      alert(createdBookingId
        ? 'Đơn đã được tạo nhưng chưa rõ kết quả tạo giao dịch. Kiểm tra lịch sử vé trước khi thao tác tiếp.'
        : (err.message || 'Không thể tạo đơn đặt vé lúc này. Vui lòng thử lại.'));
    } finally {
      setIsCheckingOut(false);
    }
  };

  const movieTitle = bookingContext?.movie?.title || bookingContext?.movie?.movieTitle || 'CGV Cinema';
  const cinemaName = bookingContext?.cinema?.name || bookingContext?.cinema?.cinemaName || 'CGV Cinema';
  const ageRating = bookingContext?.movie?.ageRating;

  return (
    <div className="modal-backdrop seat-booking-backdrop" onClick={handleCloseModal}>
      <div className="seat-modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="seat-modal-header">
          <div className="seat-modal-info">
            <h3 className="seat-modal-movie-title">
              {ageRating && (
                <span className={`age-chip age-${String(ageRating).toLowerCase()}`}>
                  {ageRating}
                </span>
              )}
              <span className="movie-title-text" title={movieTitle}>{movieTitle}</span>
            </h3>
            <div className="seat-modal-subtitle">
              {cinemaName} • Suất {bookingContext?.timeSlot || ''} • {bookingContext?.date || ''}
            </div>
          </div>

          <div className="seat-modal-actions">
            {pendingCheckout ? (
              <div className="seat-holding-timer" title="Đơn cần kiểm tra trạng thái trên máy chủ">
                <Clock size={13} />
                <span>Đơn VNPay</span>
              </div>
            ) : (
              <div className="seat-holding-timer" title="Thời gian giữ ghế tạm">
                <Clock size={13} />
                <span>{formatTimer(timeLeft)}</span>
              </div>
            )}
            <button
              className="seat-modal-close"
              onClick={handleCloseModal}
              title="Đóng cửa sổ"
              aria-label="Đóng"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Age warning notice */}
        {!successOrder && (ageRating === 'T18' || ageRating === 'T16') && (
          <div className="seat-age-alert" style={{
            background: ageRating === 'T18' ? 'rgba(220,38,38,0.15)' : 'rgba(234,88,12,0.15)',
            border: `1px solid ${ageRating === 'T18' ? 'rgba(220,38,38,0.4)' : 'rgba(234,88,12,0.4)'}`,
            color: ageRating === 'T18' ? '#fca5a5' : '#fdba74',
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>
              Phim dành cho khán giả từ đủ {ageRating === 'T18' ? '18' : '16'} tuổi trở lên. Mang CCCD khi vào rạp.
            </span>
          </div>
        )}

        {successOrder ? (
          <div style={{ padding: '60px 30px', textAlign: 'center' }}>
            <div style={{
              width: 70, height: 70, borderRadius: '50%',
              background: 'rgba(16,185,129,0.2)', border: '2px solid #10b981',
              color: '#10b981', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 20px'
            }}>
              <Check size={36} />
            </div>
            <h2 style={{ color: '#fff', marginBottom: 8 }}>Đặt vé thành công!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
              Mã đặt chỗ: <strong style={{ color: 'var(--primary-hover)' }}>{successOrder.id || successOrder.bookingId}</strong>
            </p>
            <div style={{
              background: 'var(--bg-input)', padding: 18, borderRadius: 12,
              maxWidth: 420, margin: '0 auto 24px',
              textAlign: 'left', fontSize: '0.88rem', border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ marginBottom: 6 }}><strong>Rạp:</strong> {cinemaName}</div>
              <div style={{ marginBottom: 6 }}><strong>Suất chiếu:</strong> {bookingContext?.timeSlot} — {bookingContext?.date}</div>
              <div style={{ marginBottom: 6 }}><strong>Ghế đã chọn:</strong> {selectedSeatIds.join(', ')}</div>
              <div><strong>Tổng thanh toán:</strong> {formatVnd(finalTotal)}</div>
            </div>
            <button className="btn-primary" onClick={onClose}>Hoàn tất & Quay lại</button>
          </div>
        ) : (
          <>
            {/* Screen Arc */}
            <div className="screen-area">
              <div className="screen-curve" />
              <span className="screen-text">MÀN HÌNH CHIẾU</span>
            </div>

            {isMaintenanceRoom && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.18), rgba(185, 28, 28, 0.28))',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                borderRadius: 12,
                padding: '14px 20px',
                margin: '10px auto 20px',
                maxWidth: 620,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                fontSize: '0.9rem',
                fontWeight: 500,
                boxShadow: '0 4px 16px rgba(239, 68, 68, 0.25)'
              }}>
                <AlertCircle size={26} style={{ color: '#ef4444', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, color: '#fee2e2', fontSize: '0.95rem' }}>Phòng chiếu đang bảo trì kỹ thuật!</div>
                  <div style={{ fontSize: '0.82rem', marginTop: 3, opacity: 0.9 }}>
                    Phòng chiếu này đang tạm ngừng phục vụ để kiểm tra, bảo trì hệ thống ghế và âm thanh. Quý khách vui lòng chọn suất chiếu hoặc phòng khác.
                  </div>
                </div>
              </div>
            )}

            {/* Seat Map - Always visible */}
            <div className="seats-container" style={{ position: 'relative' }}>
              {seatLoadError && !isLoadingSeats && (
                <div role="alert" style={{ padding: 24, color: '#fca5a5' }}>
                  Không tải được trạng thái ghế: {seatLoadError}
                  <button type="button" onClick={() => setSeatLoadRetry(value => value + 1)}>Thử lại</button>
                </div>
              )}
              {isLoadingSeats && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 10,
                  backgroundColor: 'rgba(15, 23, 42, 0.72)',
                  backdropFilter: 'blur(3px)',
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  color: '#e2e8f0',
                  minHeight: 220
                }}>
                  <div className="spin-animate" style={{ fontSize: '1.6rem', color: '#e11d48' }}>⟳</div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.02em' }}>
                    Đang đồng bộ sơ đồ phòng chiếu & kiểm tra ghế...
                  </span>
                </div>
              )}
              <div 
                className="seat-map-grid"
                style={isLoadingSeats || seatLoadError ? { opacity: 0.25, pointerEvents: 'none', filter: 'grayscale(0.8)' } : { transition: 'opacity 0.25s ease, filter 0.25s ease' }}
              >
                {gridRows.map(row => {
                  const isSweetboxRow = row === 'H';
                  return (
                    <div key={row} className={`seat-row ${isSweetboxRow ? 'sweetbox-row' : ''}`}>
                      <span className="row-label">{row}</span>
                      {Array.from({ length: seatsPerRow }, (_, i) => i + 1).map(num => {
                        const id = `${row}${num}`;
                        const s = seats[id];
                        const isSelected = selectedSeatIds.includes(id);
                        if (!s) {
                          return <div key={id} className="seat-item normal disabled" style={{ opacity: 0.2 }}>{num}</div>;
                        }
                        const isSweetbox = s.type === 'sweetbox' || isSweetboxRow;
                        const pairClass = isSweetbox ? (num % 2 === 1 ? 'sweetbox-left' : 'sweetbox-right') : '';

                        return (
                          <div
                            key={id}
                            className={`seat-item ${s.type || 'normal'} ${isSelected ? 'selected' : (s.status || 'available')} ${pairClass}`}
                            onClick={() => toggleSeat(id)}
                            title={`Ghế ${id} — ${(s.type || 'NORMAL').toUpperCase()} — ${formatVnd(s.price)}`}
                          >
                            {num}
                          </div>
                        );
                      })}
                      <span className="row-label">{row}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Legend from API: 2 Clean Rows for Prices and Statuses */}
            <div className="seat-legend">
              <div className="legend-row">
                <div className="legend-item">
                  <div className="legend-box seat-item normal" style={{ cursor: 'default' }} />
                  <span className="legend-label">Thường <strong className="legend-price">({formatVnd(normalPrice)})</strong></span>
                </div>
                <div className="legend-item">
                  <div className="legend-box seat-item vip" style={{ cursor: 'default' }} />
                  <span className="legend-label">VIP <strong className="legend-price">({formatVnd(vipPrice)})</strong></span>
                </div>
                <div className="legend-item">
                  <div className="legend-box seat-item sweetbox single" style={{ cursor: 'default' }} />
                  <span className="legend-label">Sweetbox <strong className="legend-price">({formatVnd(sweetboxPrice)})</strong></span>
                </div>
              </div>

              <div className="legend-row status-row">
                <div className="legend-item">
                  <div className="legend-box seat-item selected" style={{ cursor: 'default' }} />
                  <span className="legend-label">Đang chọn</span>
                </div>
                <div className="legend-item">
                  <div className="legend-box seat-item holding" style={{ cursor: 'default' }} />
                  <span className="legend-label">Đang giữ</span>
                </div>
                <div className="legend-item">
                  <div className="legend-box seat-item booked" style={{ cursor: 'default' }} />
                  <span className="legend-label">Đã mua</span>
                </div>
              </div>
            </div>

            {/* ─── Bottom Checkout & Voucher Panel ─── */}
            <div className="booking-checkout-panel">
              {/* Left: Seat info & Dynamic Breakdown */}
              <div className="checkout-info">
                <div className="checkout-seats-list">
                  {pendingCheckout ? `Kiểm tra đơn VNPay: ${pendingCheckout.bookingId}` : selectedSeatIds.length > 0
                    ? `Ghế (${selectedSeatIds.length}): ${selectedSeatIds.join(', ')}`
                    : 'Chưa chọn ghế nào'}
                </div>
                {checkoutError && <div role="alert" style={{ color: '#fbbf24', fontSize: '0.82rem' }}>
                  {checkoutError} <button type="button" onClick={() => window.location.reload()} style={{ color: 'inherit' }}>Tải lại trang để kiểm tra đơn</button>
                </div>}
                {checkoutNotice?.showtimeId === showtimeId && (
                  <div role="alert" style={{ color: '#fbbf24', fontSize: '0.82rem' }}>
                    {checkoutNotice.status === 'ENDED'
                      ? `Đơn ${checkoutNotice.bookingId} đã hủy/hoàn. Đã tải lại ghế; nếu đã mở VNPay hoặc thấy trừ tiền, giữ mã đơn để đối soát trước khi mua lại.`
                      : `Đơn ${checkoutNotice.bookingId} đã xác nhận. Vé thuộc đơn cũ; không thanh toán lại cùng ghế.`}
                  </div>
                )}

                <div className="checkout-breakdown-desktop" style={{ marginTop: 4, fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    <span>Giá gốc:</span>
                    <span style={{ fontWeight: 600 }}>{formatVnd(pendingCheckout ? pendingCheckout.finalAmount : rawTotal)}</span>
                  </div>
                  {appliedVoucher && (
                    <div style={{ color: '#10b981', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                      <span>Giảm giá ({appliedVoucher.voucher?.code}):</span>
                      <span style={{ fontWeight: 700 }}>-{formatVnd(discountAmount)}</span>
                    </div>
                  )}
                  <div style={{
                    color: '#fff', fontWeight: 800, fontSize: '1.08rem',
                    display: 'flex', justifyContent: 'space-between', gap: 16,
                    borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 4, marginTop: 2
                  }}>
                    <span>Thành tiền:</span>
                    <span style={{ color: appliedVoucher ? '#10b981' : '#fff' }}>{formatVnd(pendingCheckout ? pendingCheckout.finalAmount : finalTotal)}</span>
                  </div>
                </div>

                {/* Mobile Compact Total */}
                <div className="checkout-mobile-total">
                  <span className="checkout-mobile-label">Tổng:</span>
                  <span className={`checkout-mobile-val ${appliedVoucher ? 'has-discount' : ''}`}>
                    {formatVnd(pendingCheckout ? pendingCheckout.finalAmount : finalTotal)}
                  </span>
                  {appliedVoucher && (
                    <span className="checkout-mobile-discount">(-{formatVnd(discountAmount)})</span>
                  )}
                </div>
              </div>

              {/* Center: Flexible Voucher Section */}
              <div className="checkout-voucher-section" style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
                {!appliedVoucher ? (
                  <div>
                    <button
                      type="button"
                      className="checkout-voucher-btn"
                      onClick={() => setIsVoucherOpen(v => !v)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.18)',
                        borderRadius: 8, padding: '8px 12px',
                        color: '#fff', cursor: 'pointer',
                        fontSize: '0.82rem', width: '100%',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                        <Tag size={15} color="#f59e0b" />
                        Chọn mã giảm giá
                      </span>
                      {isVoucherOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>

                    {/* Voucher Dropdown with conditions & flexible hints */}
                    {isVoucherOpen && (
                      <>
                        <div
                          style={{ position: 'fixed', inset: 0, zIndex: 125, background: 'rgba(0,0,0,0.45)' }}
                          onClick={() => setIsVoucherOpen(false)}
                        />
                        <div className="voucher-dropdown-popup">
                          <div style={{
                            padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)',
                            fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: 'rgba(255,255,255,0.02)'
                          }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Gift size={15} color="#f59e0b" />
                              <span>Mã giảm giá khả dụng ({availableVouchers.length})</span>
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{
                                fontSize: '0.7rem', color: '#60a5fa', background: 'rgba(59,130,246,0.15)',
                                padding: '2px 8px', borderRadius: 10, fontWeight: 700
                              }}>
                                Hạng: {userTier}
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsVoucherOpen(false)}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', padding: 2 }}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>

                        {availableVouchers.length === 0 ? (
                          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                            <Gift size={28} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
                            <div>Không có voucher nào phù hợp với hạng {userTier} lúc này</div>
                          </div>
                        ) : (
                          availableVouchers.map((v, idx) => {
                            const minVal = Number(v.minOrderValue || 0);
                            const isEligible = rawTotal >= minVal && rawTotal > 0;
                            const previewSaving = calcVoucherDiscount(v, rawTotal);
                            const missingAmount = minVal - rawTotal;

                            return (
                              <div
                                key={v.id || v.code || idx}
                                onClick={() => {
                                  if (isEligible) {
                                    handleSelectVoucher(v);
                                  } else if (rawTotal === 0) {
                                    setCouponMsg('Vui lòng chọn ghế trước để kích hoạt ưu đãi này.');
                                  } else {
                                    setCouponMsg(`Cần thêm ${formatVnd(missingAmount)} để đủ điều kiện áp dụng mã ${v.code}.`);
                                  }
                                }}
                                style={{
                                  padding: '12px 16px',
                                  borderBottom: idx < availableVouchers.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                                  cursor: isEligible ? 'pointer' : 'default',
                                  background: isEligible ? 'rgba(255,255,255,0.02)' : 'transparent',
                                  opacity: isEligible ? 1 : 0.65,
                                  transition: 'background 0.15s'
                                }}
                                onMouseEnter={e => isEligible && (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                                onMouseLeave={e => (e.currentTarget.style.background = isEligible ? 'rgba(255,255,255,0.02)' : 'transparent')}
                              >
                                {/* Top Line: Code badge + Discount Pill */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <code style={{
                                      fontSize: '0.8rem', color: isEligible ? '#60a5fa' : '#94a3b8',
                                      background: isEligible ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.06)',
                                      padding: '2px 8px', borderRadius: 4, fontWeight: 800,
                                      letterSpacing: '0.04em'
                                    }}>
                                      {v.code}
                                    </code>
                                    {v.applicableTier && v.applicableTier !== 'ALL' && (
                                      <span style={{ fontSize: '0.68rem', color: '#fbbf24', background: 'rgba(245,158,11,0.15)', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                                        {v.applicableTier}
                                      </span>
                                    )}
                                  </div>

                                  <span style={{
                                    background: isEligible ? 'rgba(16,185,129,0.18)' : 'rgba(245,158,11,0.15)',
                                    color: isEligible ? '#10b981' : '#fbbf24',
                                    border: `1px solid ${isEligible ? 'rgba(16,185,129,0.35)' : 'rgba(245,158,11,0.3)'}`,
                                    borderRadius: 4, padding: '2px 8px', fontSize: '0.74rem', fontWeight: 800,
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {v.discountType === 'PERCENT' || v.discountType === 'PERCENTAGE'
                                      ? `-${v.discountValue}%`
                                      : `-${formatVnd(v.discountValue)}`}
                                  </span>
                                </div>

                                {/* Title */}
                                <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.86rem', lineHeight: 1.35, marginBottom: 4 }}>
                                  {v.name || v.title}
                                </div>

                                {/* Description */}
                                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 8 }}>
                                  {v.description || v.desc}
                                </div>

                                {/* Condition & Eligibility Alert */}
                                <div style={{
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                  fontSize: '0.74rem', paddingTop: 6, borderTop: '1px dashed rgba(255,255,255,0.06)'
                                }}>
                                  <span style={{ color: '#94a3b8' }}>
                                    {minVal > 0 ? `Đơn tối thiểu: ${formatVnd(minVal)}` : 'Mọi đơn hàng'}
                                  </span>

                                  {isEligible ? (
                                    <span style={{ color: '#10b981', fontWeight: 700 }}>
                                      ✓ Tiết kiệm {formatVnd(previewSaving)}
                                    </span>
                                  ) : rawTotal > 0 ? (
                                    <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                                      Thiếu {formatVnd(missingAmount)}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#64748b' }}>
                                      Chọn ghế để dùng
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}

                        {/* Manual Voucher Input inside dropdown */}
                        <form onSubmit={handleApplyCouponManual} style={{
                          padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)',
                          display: 'flex', gap: 8, background: '#111520'
                        }}>
                          <input
                            type="text"
                            placeholder="Nhập mã ưu đãi khác..."
                            className="auth-input"
                            style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem' }}
                            value={couponCode}
                            onChange={e => setCouponCode(e.target.value)}
                          />
                          <button type="submit" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                            Áp dụng
                          </button>
                        </form>
                      </div>
                      </>
                    )}
                  </div>
                ) : (
                  /* Applied Voucher Chip */
                  <div className="checkout-applied-chip" style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'rgba(16,185,129,0.12)',
                    border: '1px solid rgba(16,185,129,0.4)',
                    borderRadius: 8, padding: '8px 12px',
                    fontSize: '0.82rem'
                  }}>
                    <Gift size={15} color="#10b981" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#10b981', fontWeight: 700 }}>
                        {appliedVoucher.voucher?.code}: {appliedVoucher.voucher?.name || 'Voucher giảm giá'}
                      </div>
                      <div style={{ color: '#6ee7b7', fontSize: '0.74rem' }}>
                        Đã giảm {formatVnd(discountAmount)}
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveVoucher}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 3 }}
                      title="Gỡ bỏ mã này"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}

                {couponMsg && (
                  <div style={{ fontSize: '0.76rem', color: '#f87171', padding: '0 2px' }}>
                    {couponMsg}
                  </div>
                )}
              </div>

              {/* Right: Submit Button */}
              <button
                className="btn-primary checkout-submit-btn"
                disabled={(!pendingCheckout && selectedSeatIds.length === 0) || isCheckingOut || checkoutLoading || !!checkoutError || (!pendingCheckout && isMaintenanceRoom) || isLoadingSeats || !!seatLoadError}
                onClick={handleCheckout}
                style={{
                  opacity: ((!pendingCheckout && selectedSeatIds.length === 0) || isMaintenanceRoom) ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', gap: 8,
                  whiteSpace: 'nowrap', padding: '12px 22px', fontSize: '0.92rem',
                  cursor: isMaintenanceRoom ? 'not-allowed' : 'pointer'
                }}
              >
                <Ticket size={16} />
                {isMaintenanceRoom ? 'Phòng đang bảo trì' : (isCheckingOut || checkoutLoading ? 'Đang kiểm tra đơn...' : pendingCheckout ? 'Tiếp tục đơn cũ' : 'Thanh toán VNPay')}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Idle Warning Overlay */}
      {showIdleWarning && (
        <div className="idle-warning-overlay" onClick={resetUserActivity}>
          <div className="idle-warning-box" onClick={e => e.stopPropagation()}>
            <div className="idle-warning-icon">
              <AlertCircle size={32} />
            </div>
            <div className="idle-warning-title">Bạn còn đang ở đó không?</div>
            <div className="idle-warning-desc">
              Bạn chưa có thao tác nào trong hơn 1 phút. Ghế của bạn sẽ tự động được giải phóng để nhường cho khán giả khác sau:
            </div>
            <div className="idle-countdown-badge">
              {idleCountdown}s
            </div>
            <button
              type="button"
              className="idle-continue-btn"
              onClick={resetUserActivity}
            >
              Tôi vẫn đang chọn ghế
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
