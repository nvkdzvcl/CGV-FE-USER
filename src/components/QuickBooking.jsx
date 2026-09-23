import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Ticket, Search, Calendar, Film, MapPin, Clock, ChevronDown, Check } from 'lucide-react';
import { ApiService } from '../services/api';

// Format time string to HH:mm
function formatTime(isoStr) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return isoStr;
  }
}

// Chuẩn hóa định dạng chuẩn (2D, 3D, IMAX, 4DX, SCREENX)
function normalizeFormat(fmt) {
  if (!fmt) return '2D';
  const s = String(fmt).toUpperCase();
  if (s === '4D' || s === 'FOUR_D') return '4DX';
  if (s === 'TWO_D') return '2D';
  if (s === 'THREE_D') return '3D';
  return s;
}

// Format ISO date (YYYY-MM-DD) to friendly Vietnamese label
function formatFriendlyDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const targetDate = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.round((targetDate - today) / (1000 * 60 * 60 * 24));
  const dayPadded = String(d).padStart(2, '0');
  const monthPadded = String(m).padStart(2, '0');

  if (diffDays === 0) return `Hôm nay (${dayPadded}.${monthPadded})`;
  if (diffDays === 1) return `Ngày mai (${dayPadded}.${monthPadded})`;

  const daysOfWeek = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return `${daysOfWeek[targetDate.getDay()]} (${dayPadded}.${monthPadded})`;
}

export default function QuickBooking({ onSelectBooking }) {
  // 1. Movies & Elasticsearch search state
  const [allMovies, setAllMovies] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isMovieDropdownOpen, setIsMovieDropdownOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);

  // 2. Global cinemas map for detailed address fallback
  const [allCinemasMap, setAllCinemasMap] = useState({});

  // 3. Movie showtimes loaded from DB
  const [movieShowtimes, setMovieShowtimes] = useState([]);
  const [isLoadingShowtimes, setIsLoadingShowtimes] = useState(false);

  // 4. Selections
  const [selectedCinemaId, setSelectedCinemaId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedShowtimeId, setSelectedShowtimeId] = useState('');

  const dropdownRef = useRef(null);

  // Tải danh sách phim Đang Chiếu và toàn bộ Rạp trên toàn hệ thống
  useEffect(() => {
    ApiService.getMovies('NOW_SHOWING').then(res => {
      const list = Array.isArray(res) ? res : (res?.data || []);
      if (list.length > 0) {
        setAllMovies(list);
        setSelectedMovie(list[0]);
        setSearchKeyword(list[0].title);
      }
    }).catch(err => console.warn('Lỗi tải danh sách phim ban đầu:', err));

    ApiService.getCinemas().then(res => {
      const list = Array.isArray(res) ? res : (res?.data || []);
      const map = {};
      list.forEach(c => {
        map[c.id] = c;
      });
      setAllCinemasMap(map);
    }).catch(() => {});
  }, []);

  // Tìm kiếm mờ phim qua Elasticsearch (Fuzzy Search & Full-Text)
  useEffect(() => {
    if (!searchKeyword.trim()) {
      setSearchResults(allMovies);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      ApiService.searchMovies(searchKeyword)
        .then(res => {
          const results = Array.isArray(res) ? res : (res?.data || []);
          setSearchResults(results);
        })
        .catch(err => {
          console.warn('Elasticsearch fallback to local filtering:', err);
          setSearchResults(
            allMovies.filter(m => m.title.toLowerCase().includes(searchKeyword.toLowerCase()))
          );
        })
        .finally(() => setIsSearching(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [searchKeyword, allMovies]);

  // Đóng dropdown tìm kiếm phim khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsMovieDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Khi chọn phim, tải toàn bộ suất chiếu thật của phim đó từ Database
  useEffect(() => {
    if (!selectedMovie?.id) return;

    setIsLoadingShowtimes(true);
    ApiService.getShowtimes({ movieId: selectedMovie.id })
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        setMovieShowtimes(list);
      })
      .catch(err => {
        console.error('Lỗi khi tải suất chiếu cho phim:', err);
        setMovieShowtimes([]);
      })
      .finally(() => setIsLoadingShowtimes(false));
  }, [selectedMovie]);

  // 1. Danh sách các RẠP CÓ SUẤT CHIẾU cho phim đã chọn (Kèm địa chỉ)
  const availableCinemas = useMemo(() => {
    if (!movieShowtimes || movieShowtimes.length === 0) return [];

    const cinemaMap = {};
    movieShowtimes.forEach(st => {
      const cId = st.roomResponse?.cinemaResponse?.id || st.cinemaId;
      if (!cId) return;

      if (!cinemaMap[cId]) {
        const cInfo = st.roomResponse?.cinemaResponse || allCinemasMap[cId];
        cinemaMap[cId] = {
          id: cId,
          name: cInfo?.name || st.cinemaName || 'CGV Cinema',
          address: cInfo?.address || allCinemasMap[cId]?.address || 'Hệ thống rạp CGV Cinemas'
        };
      }
    });

    return Object.values(cinemaMap);
  }, [movieShowtimes, allCinemasMap]);

  // Tự động chọn rạp đầu tiên khi danh sách rạp khả dụng thay đổi
  useEffect(() => {
    if (availableCinemas.length > 0) {
      if (!availableCinemas.some(c => c.id === selectedCinemaId)) {
        setSelectedCinemaId(availableCinemas[0].id);
      }
    } else {
      setSelectedCinemaId('');
    }
  }, [availableCinemas, selectedCinemaId]);

  const currentSelectedCinema = useMemo(() => {
    return availableCinemas.find(c => c.id === selectedCinemaId) || null;
  }, [availableCinemas, selectedCinemaId]);

  // 2. Danh sách các NGÀY CHIẾU THỰC TẾ của phim tại rạp đã chọn
  const availableDates = useMemo(() => {
    if (!selectedCinemaId || !movieShowtimes || movieShowtimes.length === 0) return [];

    const dateSet = new Set();
    movieShowtimes.forEach(st => {
      const cId = st.roomResponse?.cinemaResponse?.id || st.cinemaId;
      if (cId === selectedCinemaId && st.showDate) {
        // st.showDate có thể là Instant UTC hoặc chuỗi ngày
        const iso = st.showDate.substring(0, 10);
        dateSet.add(iso);
      }
    });

    return Array.from(dateSet).sort().map(iso => ({
      iso,
      label: formatFriendlyDate(iso)
    }));
  }, [movieShowtimes, selectedCinemaId]);

  // Tự động chọn ngày đầu tiên khả dụng
  useEffect(() => {
    if (availableDates.length > 0) {
      if (!availableDates.some(d => d.iso === selectedDate)) {
        setSelectedDate(availableDates[0].iso);
      }
    } else {
      setSelectedDate('');
    }
  }, [availableDates, selectedDate]);

  // 3. Danh sách các SUẤT CHIẾU THỰC TẾ tương ứng (kèm Định dạng format và Chế độ)
  const availableSlots = useMemo(() => {
    if (!selectedCinemaId || !selectedDate || !movieShowtimes || movieShowtimes.length === 0) return [];

    return movieShowtimes
      .filter(st => {
        const cId = st.roomResponse?.cinemaResponse?.id || st.cinemaId;
        const dateMatch = st.showDate && st.showDate.substring(0, 10) === selectedDate;
        return cId === selectedCinemaId && dateMatch;
      })
      .map(st => {
        const timeStr = formatTime(st.startTime);
        const formatStr = normalizeFormat(st.format || st.roomResponse?.format);
        const subStr = st.subtitleLanguage?.toLowerCase().includes('phụ đề')
          ? 'Vietsub'
          : (st.language?.toLowerCase().includes('tiếng việt') ? 'Lồng tiếng' : 'Vietsub');

        const seatInfo = st.availableSeats != null ? ` - Còn ${st.availableSeats} ghế` : '';

        return {
          ...st,
          timeStr,
          formatStr,
          subStr,
          label: `${timeStr} (${formatStr} ${subStr})${seatInfo}`
        };
      })
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [movieShowtimes, selectedCinemaId, selectedDate]);

  // Tự động chọn suất chiếu đầu tiên
  useEffect(() => {
    if (availableSlots.length > 0) {
      if (!availableSlots.some(s => s.id === selectedShowtimeId)) {
        setSelectedShowtimeId(availableSlots[0].id);
      }
    } else {
      setSelectedShowtimeId('');
    }
  }, [availableSlots, selectedShowtimeId]);

  const currentSelectedSlot = useMemo(() => {
    return availableSlots.find(s => s.id === selectedShowtimeId) || null;
  }, [availableSlots, selectedShowtimeId]);

  // Bấm nút "Tìm kiếm" -> Bay thẳng vào trang/modal đặt chỗ tương ứng
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedMovie) {
      alert('Vui lòng chọn một bộ phim.');
      return;
    }

    if (!currentSelectedCinema) {
      alert('Phim hiện chưa có cụm rạp nào có lịch chiếu.');
      return;
    }

    if (!currentSelectedSlot) {
      alert('Vui lòng chọn suất chiếu hợp lệ.');
      return;
    }

    const roomId = currentSelectedSlot.roomResponse?.id || currentSelectedSlot.roomId;

    if (onSelectBooking) {
      onSelectBooking({
        movie: selectedMovie,
        cinema: currentSelectedCinema,
        showtime: currentSelectedSlot,
        showtimeId: currentSelectedSlot.id,
        roomId: roomId,
        date: selectedDate,
        timeSlot: currentSelectedSlot.timeStr
      });
    }
  };

  return (
    <form className="quick-booking-container" onSubmit={handleSubmit}>
      {/* 1. Nhãn Đặt Vé Nhanh */}
      <div className="quick-booking-label">
        <Ticket size={22} color="var(--primary)" />
        <div>
          <div>Đặt vé nhanh</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
            Chọn phim, rạp, suất chiếu
          </div>
        </div>
      </div>

      <div className="quick-booking-fields">
        {/* 2. Ô TÌM KIẾM PHIM VỚI ELASTICSEARCH */}
        <div className="qb-field" ref={dropdownRef}>
          <label>
            <span>Phim</span>
            {isSearching && <span style={{ color: 'var(--primary)', fontSize: '0.65rem' }}>Đang tìm...</span>}
          </label>
          <div className="qb-search-wrapper">
            <input
              type="text"
              className="qb-search-input"
              placeholder="Gõ tìm tên phim..."
              value={searchKeyword}
              onFocus={() => setIsMovieDropdownOpen(true)}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setIsMovieDropdownOpen(true);
              }}
            />
            <ChevronDown size={14} className="qb-search-icon" />
          </div>

          {/* Popup Dropdown danh sách phim từ Elasticsearch */}
          {isMovieDropdownOpen && (
            <div className="qb-search-dropdown">
              {searchResults.length === 0 ? (
                <div style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Không tìm thấy phim phù hợp
                </div>
              ) : (
                searchResults.map(m => (
                  <div
                    key={m.id}
                    className={`qb-search-item ${selectedMovie?.id === m.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedMovie(m);
                      setSearchKeyword(m.title);
                      setIsMovieDropdownOpen(false);
                    }}
                  >
                    <img src={m.posterUrl} alt={m.title} className="qb-item-thumb" />
                    <div className="qb-item-info">
                      <div className="qb-item-title">{m.title}</div>
                      <div className="qb-item-sub">
                        {m.ageRating && (
                          <span className={`age-chip age-${m.ageRating.toLowerCase()}`} style={{ fontSize: '0.65rem', padding: '1px 4px' }}>
                            {m.ageRating}
                          </span>
                        )}
                        <span>{m.durationMinutes || m.duration || 120} phút</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 3. COMBOBOX RẠP (KÈM HIỂN THỊ ĐỊA CHỈ RÕ RÀNG KHI CHỌN) */}
        <div className="qb-field">
          <label>Rạp</label>
          <select
            value={selectedCinemaId}
            onChange={(e) => setSelectedCinemaId(e.target.value)}
            disabled={availableCinemas.length === 0}
          >
            {availableCinemas.length === 0 ? (
              <option value="">{isLoadingShowtimes ? 'Đang tải rạp...' : 'Không có rạp chiếu'}</option>
            ) : (
              availableCinemas.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))
            )}
          </select>
          {/* HIỂN THỊ ĐỊA CHỈ NỔI BẬT KHI CHỌN */}
          {currentSelectedCinema?.address && (
            <div className="qb-address-tip" title={currentSelectedCinema.address}>
              <MapPin size={11} color="var(--primary)" style={{ flexShrink: 0 }} />
              <span>{currentSelectedCinema.address}</span>
            </div>
          )}
        </div>

        {/* 4. COMBOBOX NGÀY CHIẾU (CHỈ HIỆN CÁC NGÀY CÓ SUẤT CHIẾU THẬT) */}
        <div className="qb-field">
          <label>Ngày chiếu</label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            disabled={availableDates.length === 0}
          >
            {availableDates.length === 0 ? (
              <option value="">Chưa có lịch chiếu</option>
            ) : (
              availableDates.map(d => (
                <option key={d.iso} value={d.iso}>
                  {d.label}
                </option>
              ))
            )}
          </select>
        </div>

        {/* 5. COMBOBOX SUẤT CHIẾU (HIỂN THỊ GIỜ CHIẾU, FORMAT 2D/IMAX & PHỤ ĐỀ) */}
        <div className="qb-field">
          <label>Suất chiếu</label>
          <select
            value={selectedShowtimeId}
            onChange={(e) => setSelectedShowtimeId(e.target.value)}
            disabled={availableSlots.length === 0}
          >
            {availableSlots.length === 0 ? (
              <option value="">Hết suất chiếu</option>
            ) : (
              availableSlots.map(s => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* 6. NÚT TÌM KIẾM -> BAY THẲNG VÀO CHỌN GHẾ */}
      <button
        type="submit"
        className="btn-qb-submit"
        disabled={!currentSelectedSlot}
        style={{ opacity: currentSelectedSlot ? 1 : 0.6 }}
      >
        <Search size={16} />
        Tìm kiếm
      </button>
    </form>
  );
}