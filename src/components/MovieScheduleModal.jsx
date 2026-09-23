import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Calendar, MapPin, Navigation, Clock, Film, ChevronRight, Loader2, Sparkles, Volume2, Globe } from 'lucide-react';
import { ApiService } from '../services/api';
import CgvAuraLoader from './CgvAuraLoader';
import '../styles/schedule-modal.css';

// 14 ngày tới bắt đầu từ ngày hiện tại
function generateDates() {
  const dates = [];
  const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const today = new Date();

  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dateNum = String(d.getDate()).padStart(2, '0');
    const dayIndex = d.getDay();

    dates.push({
      iso: `${year}-${month}-${dateNum}`,
      dayNum: dateNum,
      month: `Th ${month}`,
      dayName: i === 0 ? 'Hôm nay' : daysOfWeek[dayIndex],
      isToday: i === 0
    });
  }
  return dates;
}

export default function MovieScheduleModal({ movie, onClose, onSelectShowtime }) {
  const dates = generateDates();
  const [selectedDate, setSelectedDate] = useState(dates[0].iso);
  const [regions, setRegions] = useState([]);
  const [cinemasMap, setCinemasMap] = useState({});
  const [selectedRegionId, setSelectedRegionId] = useState('all');
  const [isNearMeActive, setIsNearMeActive] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  
  // Bộ lọc suất chiếu: Định dạng (2D/IMAX/4DX) & Hình thức (Phụ đề/Lồng tiếng)
  const [selectedFormat, setSelectedFormat] = useState('ALL');
  const [selectedAudioMode, setSelectedAudioMode] = useState('ALL'); // ALL, SUBTITLE, DUBBED

  const [loading, setLoading] = useState(false);
  const [cinemasWithShowtimes, setCinemasWithShowtimes] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Tải các Khu vực THỰC SỰ CÓ SUẤT CHIẾU của phim và thông tin Rạp
  useEffect(() => {
    if (!movie?.id) return;

    // Lấy toàn bộ suất chiếu của phim này để trích xuất CHÍNH XÁC các Khu vực CÓ SUẤT CHIẾU
    ApiService.getShowtimes({ movieId: movie.id })
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        const regMap = {};
        list.forEach(st => {
          const c = st.roomResponse?.cinemaResponse;
          const regId = c?.region?.id || c?.regionId;
          const regName = c?.region?.name || c?.regionName;
          if (regId && regName) {
            regMap[regId] = { id: regId, name: regName, slug: c?.region?.slug || `region-${regId}` };
          }
        });
        const activeRegions = Object.values(regMap);
        if (activeRegions.length > 0) {
          setRegions(activeRegions);
        }
      })
      .catch(() => {});

    ApiService.getCinemas()
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        const map = {};
        list.forEach(c => {
          map[c.id] = c;
        });
        setCinemasMap(map);
      })
      .catch(() => {});
  }, [movie?.id]);

  // Đảm bảo nếu region đang chọn không có trong danh sách khả dụng thì reset về 'all'
  useEffect(() => {
    if (selectedRegionId !== 'all' && regions.length > 0) {
      const exists = regions.some(r => String(r.id) === String(selectedRegionId));
      if (!exists) {
        setSelectedRegionId('all');
      }
    }
  }, [regions, selectedRegionId]);

  // 2. Tải lịch chiếu theo phim từ API chuyên biệt getMovieSchedule
  const fetchShowtimes = useCallback(async () => {
    if (!movie?.id) return;
    setLoading(true);
    setErrorMsg('');

    try {
      // Ưu tiên gọi API movie-schedule vừa tạo
      const scheduleRes = await ApiService.getMovieSchedule(movie.id, {
        date: selectedDate,
        regionId: (!isNearMeActive && selectedRegionId !== 'all') ? selectedRegionId : null,
        lat: (isNearMeActive && userLocation) ? userLocation.lat : null,
        lon: (isNearMeActive && userLocation) ? userLocation.lon : null,
        radiusKm: 35
      });

      if (scheduleRes) {
        if (Array.isArray(scheduleRes.availableRegions) && scheduleRes.availableRegions.length > 0) {
          setRegions(scheduleRes.availableRegions);
        }

        if (Array.isArray(scheduleRes.cinemas)) {
          const enriched = scheduleRes.cinemas.map(c => ({
            cinemaId: c.cinemaId,
            cinemaName: c.cinemaName,
            address: c.address || cinemasMap[c.cinemaId]?.address || 'TTTM CGV Cinemas, Việt Nam',
            regionId: c.regionId,
            regionName: c.regionName,
            distanceInKm: c.distanceInKm,
            showtimes: (c.showtimes || []).map(st => ({
              ...st,
              id: st.showtimeId,
              showtimeId: st.showtimeId,
              roomId: st.roomId,
              roomName: st.roomName
            }))
          }));
          setCinemasWithShowtimes(enriched);
          return;
        }
      }

      // Fallback: gọi getShowtimes và nhóm theo cụm rạp
      const allShowtimes = await ApiService.getShowtimes({
        movieId: movie.id,
        date: selectedDate
      });
      const showtimeList = Array.isArray(allShowtimes) ? allShowtimes : (allShowtimes?.data || []);

      const cinemaGroups = {};
      showtimeList.forEach(st => {
        const cId = st.roomResponse?.cinemaResponse?.id || st.cinemaId;
        if (!cId) return;
        const cInfo = st.roomResponse?.cinemaResponse;
        const cinemaObj = cinemasMap[cId];
        if (!cinemaGroups[cId]) {
          cinemaGroups[cId] = {
            cinemaId: cId,
            cinemaName: cInfo?.name || st.cinemaName || cinemaObj?.name || 'CGV Cinema',
            address: cInfo?.address || cinemaObj?.address || 'Hệ thống rạp CGV Cinemas',
            regionId: cInfo?.regionId || cinemaObj?.regionId,
            showtimes: []
          };
        }
        cinemaGroups[cId].showtimes.push({
          showtimeId: st.id,
          id: st.id,
          roomId: st.roomResponse?.id || st.roomId,
          roomName: st.roomResponse?.name || st.roomName,
          startTime: st.startTime,
          endTime: st.endTime,
          format: st.format || st.roomResponse?.format || '2D',
          language: st.language || 'Tiếng Anh',
          subtitleLanguage: st.subtitleLanguage || 'Phụ đề Tiếng Việt',
          basePrice: st.basePrice || 110000,
          availableSeats: st.availableSeats ?? 80
        });
      });

      let grouped = Object.values(cinemaGroups);
      if (selectedRegionId !== 'all') {
        grouped = grouped.filter(c => String(c.regionId) === String(selectedRegionId));
      }
      setCinemasWithShowtimes(grouped);
    } catch (err) {
      console.error('Lỗi khi tải lịch chiếu:', err);
      setErrorMsg('Không thể tải lịch chiếu cho ngày đã chọn.');
    } finally {
      setLoading(false);
    }
  }, [movie, selectedDate, isNearMeActive, userLocation, selectedRegionId, cinemasMap]);

  useEffect(() => {
    fetchShowtimes();
  }, [fetchShowtimes]);

  // Bật/tắt "Rạp gần tôi"
  const handleToggleNearMe = () => {
    if (isNearMeActive) {
      setIsNearMeActive(false);
      return;
    }

    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude
        });
        setIsNearMeActive(true);
        setSelectedRegionId('all');
      },
      (err) => {
        console.warn('Geolocation fallback:', err);
        setUserLocation({ lat: 10.7769, lon: 106.7009 });
        setIsNearMeActive(true);
        setSelectedRegionId('all');
      },
      { timeout: 8000 }
    );
  };

  // Format giờ từ ISO UTC sang VN Time (HH:mm)
  const formatTimeSlot = (timeStr) => {
    if (!timeStr) return '';
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return timeStr;
    }
  };

  // Chuẩn hóa định dạng chuẩn (2D, 3D, IMAX, 4DX, SCREENX)
  const normalizeFormat = (fmt) => {
    if (!fmt) return '2D';
    const s = String(fmt).toUpperCase();
    if (s === '4D' || s === 'FOUR_D') return '4DX';
    if (s === 'TWO_D') return '2D';
    if (s === 'THREE_D') return '3D';
    return s;
  };

  // Lọc showtime theo định dạng chuẩn (2D/3D/IMAX/4DX) và chế độ âm thanh/phụ đề
  const filterShowtimes = (list) => {
    return list.filter(st => {
      // 1. Lọc định dạng chuẩn
      if (selectedFormat !== 'ALL') {
        const fmt = normalizeFormat(st.format);
        if (fmt !== selectedFormat) return false;
      }

      // 2. Lọc chế độ: Phụ đề vs Lồng tiếng
      if (selectedAudioMode !== 'ALL') {
        const isDubbed = st.viewingMode === 'DUBBED' ||
          (st.language || '').toLowerCase().includes('lồng') ||
          (st.subtitleLanguage || '').toLowerCase().includes('lồng') ||
          ((st.language || '').toLowerCase().includes('việt') && ((st.subtitleLanguage || '').toLowerCase().includes('không') || !(st.subtitleLanguage || '').toLowerCase().includes('phụ đề')));
        if (selectedAudioMode === 'DUBBED' && !isDubbed) return false;
        if (selectedAudioMode === 'SUBTITLE' && isDubbed) return false;
      }

      return true;
    });
  };

  const visibleCinemas = useMemo(() => {
    return cinemasWithShowtimes.map(c => ({
      ...c,
      matchingSlots: filterShowtimes(c.showtimes || [])
    })).filter(c => c.matchingSlots.length > 0);
  }, [cinemasWithShowtimes, selectedFormat, selectedAudioMode]);

  return (
    <div className="schedule-modal-backdrop" onClick={onClose}>
      <div className="schedule-modal-container" onClick={e => e.stopPropagation()}>
        
        {/* 1. Header: Thông tin phim */}
        <div className="schedule-modal-hero">
          <div className="schedule-movie-info">
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="schedule-movie-poster"
            />
            <div className="schedule-movie-meta">
              <div className="schedule-movie-title-wrap">
                {movie.ageRating && (
                  <span className={`age-chip age-${movie.ageRating.toLowerCase()}`}>
                    {movie.ageRating}
                  </span>
                )}
                <h3 style={{ margin: 0 }}>{movie.title}</h3>
              </div>
              <div className="schedule-movie-tags">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <Clock size={12} color="var(--primary)" />
                  {movie.durationMinutes || movie.duration || 120} phút
                </span>
                <span>•</span>
                <span>Bản gốc: {movie.language || 'Tiếng Anh'}</span>
                <span>•</span>
                <span>{movie.subtitle || 'Phụ đề Tiếng Việt'}</span>
              </div>
            </div>
          </div>
          <button className="schedule-close-btn" onClick={onClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* 2. Nội dung cuộn */}
        <div className="schedule-modal-body">

          {/* Ribbon chọn ngày chuẩn CGV */}
          <div className="schedule-date-section">
            <div className="schedule-section-label">
              <Calendar size={16} color="var(--primary)" />
              <span>Lịch chiếu phim</span>
            </div>
            <div className="schedule-date-ribbon">
              {dates.map(d => {
                const isSelected = selectedDate === d.iso;
                return (
                  <div
                    key={d.iso}
                    className={`schedule-date-card ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedDate(d.iso)}
                  >
                    <span className="date-day-name">{d.dayName}</span>
                    <span className="date-day-num">{d.dayNum}</span>
                    <span className="date-month">{d.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Thanh công cụ lọc: Rạp gần tôi, Khu vực, Định dạng & Hình thức */}
          <div className="schedule-filter-bar">
            {/* Hàng 1: Rạp gần tôi + Khu vực */}
            <div className="schedule-filter-row">
              <div className="schedule-region-pills">
                <button
                  type="button"
                  className={`btn-near-me ${isNearMeActive ? 'active' : ''}`}
                  onClick={handleToggleNearMe}
                >
                  <Navigation size={14} className={isNearMeActive ? 'animate-spin' : ''} />
                  <span>📍 Rạp gần tôi</span>
                </button>

                <button
                  type="button"
                  className={`schedule-pill ${!isNearMeActive && selectedRegionId === 'all' ? 'active' : ''}`}
                  onClick={() => { setIsNearMeActive(false); setSelectedRegionId('all'); }}
                >
                  Toàn hệ thống
                </button>

                {regions.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    className={`schedule-pill ${!isNearMeActive && String(selectedRegionId) === String(r.id) ? 'active' : ''}`}
                    onClick={() => { setIsNearMeActive(false); setSelectedRegionId(r.id); }}
                  >
                    {r.name}
                  </button>
                ))}
              </div>

              {/* Bộ lọc Định dạng & Phụ đề / Lồng tiếng */}
              <div className="schedule-filter-options">
                {/* Formats */}
                <div className="schedule-format-pills">
                  {['ALL', '2D', '3D', 'IMAX', '4DX'].map(fmt => (
                    <button
                      key={fmt}
                      type="button"
                      className={`format-pill ${selectedFormat === fmt ? 'active' : ''}`}
                      onClick={() => setSelectedFormat(fmt)}
                    >
                      {fmt === 'ALL' ? 'Tất cả format' : fmt}
                    </button>
                  ))}
                </div>

                {/* Subtitle / Dubbed */}
                <div className="schedule-format-pills">
                  {[
                    { id: 'ALL', label: 'Tất cả chế độ' },
                    { id: 'SUBTITLE', label: 'Phụ đề' },
                    { id: 'DUBBED', label: 'Lồng tiếng' }
                  ].map(mode => (
                    <button
                      key={mode.id}
                      type="button"
                      className={`format-pill mode-pill ${selectedAudioMode === mode.id ? 'active' : ''}`}
                      onClick={() => setSelectedAudioMode(mode.id)}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Danh sách Cụm rạp & Suất chiếu */}
          <div className="schedule-cinema-list">
            {loading ? (
              <div className="schedule-empty-state" style={{ padding: '50px 20px' }}>
                <CgvAuraLoader size="md" text="Đang tải danh sách suất chiếu từ hệ thống CGV..." />
              </div>
            ) : errorMsg ? (
              <div className="schedule-empty-state">
                <p style={{ color: '#f87171' }}>{errorMsg}</p>
              </div>
            ) : cinemasWithShowtimes.length === 0 ? (
              <div className="schedule-empty-state">
                <Clock size={44} style={{ opacity: 0.4 }} />
                <h4>Không có suất chiếu cho ngày đã chọn</h4>
                <p style={{ fontSize: '0.86rem' }}>
                  Vui lòng chọn ngày chiếu khác hoặc đổi khu vực rạp lân cận.
                </p>
              </div>
            ) : visibleCinemas.length === 0 ? (
              <div className="schedule-empty-state">
                <Clock size={44} style={{ opacity: 0.4 }} />
                <h4>Không có suất chiếu phù hợp với bộ lọc</h4>
                <p style={{ fontSize: '0.86rem' }}>
                  Không tìm thấy suất chiếu nào với định dạng {selectedFormat !== 'ALL' ? selectedFormat : ''} {selectedAudioMode !== 'ALL' ? (selectedAudioMode === 'DUBBED' ? 'Lồng tiếng' : 'Phụ đề') : ''}.
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: '8px 18px', fontSize: '0.85rem', marginTop: 10 }}
                  onClick={() => { setSelectedFormat('ALL'); setSelectedAudioMode('ALL'); }}
                >
                  Xem tất cả suất chiếu
                </button>
              </div>
            ) : (
              visibleCinemas.map(cinema => {
                const slots = cinema.matchingSlots;

                return (
                  <div key={cinema.cinemaId || cinema.id} className="schedule-cinema-card">
                    {/* Header rạp: Tiêu đề & Địa chỉ sang trọng, tinh tế */}
                    <div className="schedule-cinema-header">
                      <div className="schedule-cinema-info-block">
                        <div className="schedule-cinema-title-row">
                          <h4 className="schedule-cinema-name">
                            <span>{cinema.cinemaName || cinema.name}</span>
                          </h4>
                          {cinema.distanceInKm != null && (
                            <span className="distance-badge">
                              📍 Cách bạn {cinema.distanceInKm.toFixed(1)} km
                            </span>
                          )}
                        </div>
                        
                        <div className="schedule-cinema-address-line">
                          <MapPin size={14} className="address-pin-icon" />
                          <span className="address-text">{cinema.address}</span>
                        </div>
                      </div>
                    </div>

                    {/* Grid các suất chiếu chuẩn đẹp */}
                    <div className="schedule-slots-grid">
                      {slots.map(slot => {
                        const timeStr = formatTimeSlot(slot.startTime);
                        const formatLabel = normalizeFormat(slot.format);
                        const isDubbed = slot.viewingMode === 'DUBBED' ||
                          (slot.language || '').toLowerCase().includes('lồng') ||
                          (slot.subtitleLanguage || '').toLowerCase().includes('lồng') ||
                          ((slot.language || '').toLowerCase().includes('việt') && ((slot.subtitleLanguage || '').toLowerCase().includes('không') || !(slot.subtitleLanguage || '').toLowerCase().includes('phụ đề')));
                        const subLabel = isDubbed ? 'Lồng tiếng' : 'Phụ đề';

                        return (
                          <button
                            key={slot.showtimeId || slot.id}
                            type="button"
                            className="schedule-slot-btn"
                            onClick={() => onSelectShowtime({
                              movie,
                              cinema: {
                                id: cinema.cinemaId || cinema.id,
                                name: cinema.cinemaName || cinema.name,
                                address: cinema.address
                              },
                              showtime: slot,
                              showtimeId: slot.showtimeId || slot.id,
                              roomId: slot.roomId,
                              date: selectedDate,
                              timeSlot: timeStr
                            })}
                          >
                            <span className="schedule-slot-time">{timeStr}</span>
                            <div className="schedule-slot-tags">
                              <span className={`slot-format-badge format-${formatLabel.toLowerCase()}`}>{formatLabel}</span>
                              <span className={`slot-sub-badge mode-${isDubbed ? 'dubbed' : 'sub'}`}>{subLabel}</span>
                            </div>
                            <span className="schedule-slot-seats">
                              <span className="seat-avail-dot" />
                              {slot.availableSeats != null ? `${slot.availableSeats} ghế trống` : 'Còn vé'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
