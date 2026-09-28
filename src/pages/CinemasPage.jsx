import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Navigation,
  Star,
  Clock,
  Calendar,
  Film,
  LocateFixed,
  Globe,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Search,
  X,
  Info
} from 'lucide-react';
import CinemaCard from '../components/CinemaCard';
import CgvAuraLoader from '../components/CgvAuraLoader';
import { CINEMAS, REGIONS, MOVIES } from '../data/mockData';
import { ApiService } from '../services/api';

const ALL_FACILITIES = ['IMAX', '4DX', 'Dolby Atmos', 'Ghế đôi', 'Bãi đỗ xe'];

// Helper to generate next 7 days starting from today
function generateNextDays(count = 7) {
  const days = [];
  const now = new Date();
  const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    let label = '';
    if (i === 0) {
      label = `Hôm nay (${day}/${month})`;
    } else if (i === 1) {
      label = `Ngày mai (${day}/${month})`;
    } else {
      label = `${dayNames[d.getDay()]} (${day}/${month})`;
    }

    days.push({
      dateStr,
      label,
      dayNumber: day,
      dayOfWeek: i === 0 ? 'Hôm nay' : (i === 1 ? 'Ngày mai' : dayNames[d.getDay()])
    });
  }
  return days;
}

function normalizeFormat(fmt) {
  if (!fmt) return '2D';
  const upper = fmt.toString().toUpperCase().trim();
  if (upper === 'FOUR_D' || upper === 'FOUR_DX' || upper === '4DX' || upper.includes('4D')) return '4DX';
  if (upper === 'IMAX' || upper.includes('IMAX')) return 'IMAX';
  if (upper === 'THREE_D' || upper === '3D') return '3D';
  if (upper === 'SCREENX' || upper.includes('SCREEN')) return 'SCREENX';
  return '2D';
}

function formatTime(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Ho_Chi_Minh'
    });
  } catch (e) {
    return isoString;
  }
}

function getViewingModeLabel(mode, slot) {
  const m = String(mode || '').toUpperCase();
  if (m === 'DUBBED' || m === 'LONG_TIENG') return 'Lồng tiếng';
  if (m === 'VOICEOVER' || m === 'THUYET_MINH') return 'Thuyết minh';
  if (m === 'SUBTITLED' || m === 'PHU_DE') return 'Phụ đề';
  if (String(slot?.language || '').toLowerCase().includes('lồng')) return 'Lồng tiếng';
  return 'Phụ đề';
}

function getFacilitiesArray(facilities) {
  if (Array.isArray(facilities)) {
    return facilities.map(f => typeof f === 'object' ? (f?.amenity || f?.name || '') : String(f)).filter(Boolean);
  }
  if (typeof facilities === 'string' && facilities.trim()) {
    return facilities.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

function formatDistance(c) {
  if (!c) return '';
  if (typeof c.distance === 'number') return `${c.distance.toFixed(1)} km`;
  if (c.distanceInKm) return `${Number(c.distanceInKm).toFixed(1)} km`;
  if (typeof c.distance === 'string' && c.distance.trim()) {
    return c.distance.includes('km') ? c.distance : `${c.distance} km`;
  }
  return '';
}

export default function CinemasPage({ onOpenBooking }) {
  const dateOptions = useMemo(() => generateNextDays(7), []);
  const [activeDateObj, setActiveDateObj] = useState(dateOptions[0]);

  const [cinemas, setCinemas] = useState(CINEMAS);
  const [regions, setRegions] = useState(REGIONS);
  const [selectedRegionId, setSelectedRegionId] = useState(2); // TP.HCM
  const [selectedCinema, setSelectedCinema] = useState(CINEMAS[0]);

  // Sidebar filters
  const [selectedFacilities, setSelectedFacilities] = useState(ALL_FACILITIES);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [cinemaPage, setCinemaPage] = useState(1);
  const cinemaPageSize = 8;

  const [isLocating, setIsLocating] = useState(false);
  const [isNearbyActive, setIsNearbyActive] = useState(false);

  // Real schedule from API
  const [scheduleData, setScheduleData] = useState(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);

  // 1. Fetch initial cinemas & regions
  const loadCinemas = () => {
    ApiService.getCinemas().then(res => {
      const list = Array.isArray(res) ? res : (res?.data || []);
      if (list.length > 0) {
        setCinemas(list);
        setSelectedCinema(prev => {
          if (!prev) {
            return list.find(c => c.regionId === 2 || c.region?.id === 2) || list[0];
          }
          const updated = list.find(c => c.id === prev.id);
          return updated || prev;
        });
      }
    }).catch(e => console.warn('Using fallback cinemas:', e.message));
  };

  useEffect(() => {
    loadCinemas();

    ApiService.getRegions().then(res => {
      const list = Array.isArray(res) ? res : (res?.data || []);
      if (list.length > 0) {
        setRegions(list);
      }
    }).catch(e => console.warn('Using fallback regions:', e.message));

    const handleCinemaUpdate = () => {
      loadCinemas();
    };

    window.addEventListener('cgv_realtime_cinema_updated', handleCinemaUpdate);
    window.addEventListener('cgv_realtime_showtime_updated', handleCinemaUpdate);
    return () => {
      window.removeEventListener('cgv_realtime_cinema_updated', handleCinemaUpdate);
      window.removeEventListener('cgv_realtime_showtime_updated', handleCinemaUpdate);
    };
  }, []);

  // 2. Fetch real schedule whenever selected cinema or active date changes
  useEffect(() => {
    if (!selectedCinema?.id) return;

    let isMounted = true;
    setIsLoadingSchedule(true);

    ApiService.getCinemaSchedules(selectedCinema.id, activeDateObj.dateStr)
      .then((res) => {
        if (!isMounted) return;
        setScheduleData(res || null);
      })
      .catch((err) => {
        console.warn('Failed to load cinema schedule:', err);
        if (isMounted) setScheduleData(null);
      })
      .finally(() => {
        if (isMounted) setIsLoadingSchedule(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCinema?.id, activeDateObj.dateStr]);

  // Toggle facility filter
  const handleToggleFacility = (fac) => {
    setSelectedFacilities(prev =>
      prev.includes(fac) ? prev.filter(f => f !== fac) : [...prev, fac]
    );
  };

  // GPS Locate
  const handleFindNearby = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const nearby = await ApiService.getCinemasNearby(latitude, longitude);
          if (Array.isArray(nearby) && nearby.length > 0) {
            setCinemas(nearby);
            setSelectedCinema(nearby[0]);
            setIsNearbyActive(true);
          }
        } catch (err) {
          console.warn('GPS Nearby API call failed:', err);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        alert('Không thể lấy vị trí hiện tại. Vui lòng cho phép quyền truy cập vị trí trong trình duyệt.');
      },
      { timeout: 10000 }
    );
  };

  useEffect(() => {
    setCinemaPage(1);
  }, [searchKeyword, selectedRegionId, selectedFacilities, isNearbyActive]);

  // Filter and sort cinemas list
  const filteredCinemas = useMemo(() => {
    let list = [...cinemas];

    // Keyword search
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase().trim();
      list = list.filter(c =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q))
      );
    }

    // Region filter
    if (!isNearbyActive && selectedRegionId !== 'all') {
      list = list.filter(c => c.regionId === Number(selectedRegionId) || c.region?.id === Number(selectedRegionId));
    }

    // Facility filter (if facilities exist on cinema object)
    if (selectedFacilities.length > 0) {
      list = list.filter(c => {
        const facs = getFacilitiesArray(c.facilities || c.amenities);
        if (facs.length === 0) return true;
        // Check if cinema has at least one of the selected facilities
        return selectedFacilities.some(fac =>
          facs.some(cf => cf.toLowerCase().includes(String(fac).toLowerCase()))
        );
      });
    }

    return list;
  }, [cinemas, searchKeyword, isNearbyActive, selectedRegionId, selectedFacilities]);

  const totalCinemaPages = Math.max(1, Math.ceil(filteredCinemas.length / cinemaPageSize));
  const paginatedCinemas = useMemo(() => {
    const start = (cinemaPage - 1) * cinemaPageSize;
    return filteredCinemas.slice(start, start + cinemaPageSize);
  }, [filteredCinemas, cinemaPage, cinemaPageSize]);

  const heroCinema = selectedCinema || filteredCinemas[0] || CINEMAS[0];
  const heroFacilities = useMemo(() => {
    const list = getFacilitiesArray(heroCinema?.facilities || heroCinema?.amenities);
    return list.length > 0 ? list : ['2D / 3D', 'Dolby Atmos', 'Ghế Sweetbox', 'Bãi đỗ xe'];
  }, [heroCinema]);
  const heroImg = heroCinema?.image || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=80';

  // Handle slot click
  const handleSlotClick = (movie, slot) => {
    if (!onOpenBooking) return;
    onOpenBooking({
      movie: {
        id: movie.movieId || movie.id,
        title: movie.movieTitle || movie.title,
        posterUrl: movie.posterUrl,
        durationMinutes: movie.durationMinutes,
        ageRating: movie.ageRating,
        language: movie.language
      },
      cinema: selectedCinema,
      date: activeDateObj.label,
      dateIso: activeDateObj.dateStr,
      timeSlot: formatTime(slot.startTime),
      showtimeId: slot.showtimeId || slot.id,
      roomId: slot.roomId,
      roomName: slot.roomName,
      format: normalizeFormat(slot.format),
      viewingMode: getViewingModeLabel(slot.viewingMode, slot),
      basePrice: slot.basePrice
    });
  };

  const moviesList = scheduleData?.movies || [];

  return (
    <div className="cinemas-page">
      <div className="page-with-sidebar">
        {/* Left Filter Sidebar */}
        <aside className="filter-sidebar">
          {/* GPS Quick Locate */}
          <div style={{ marginBottom: 18 }}>
            <button
              type="button"
              className="btn-primary"
              onClick={handleFindNearby}
              disabled={isLocating}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '11px 14px',
                fontSize: '0.88rem'
              }}
            >
              <LocateFixed size={16} className={isLocating ? 'spin-animate' : ''} />
              {isLocating ? 'Đang định vị...' : 'Tìm rạp gần tôi (GPS)'}
            </button>
          </div>

          {/* Region filter */}
          <div className="filter-group">
            <div className="filter-title">Khu vực rạp</div>
            <div className="filter-nav-list">
              <div
                className={`filter-nav-item ${!isNearbyActive && selectedRegionId === 'all' ? 'active' : ''}`}
                onClick={() => {
                  setIsNearbyActive(false);
                  setSelectedRegionId('all');
                }}
              >
                <MapPin size={16} /> Tất cả khu vực
              </div>
              {regions.map(r => (
                <div
                  key={r.id}
                  className={`filter-nav-item ${!isNearbyActive && selectedRegionId === r.id ? 'active' : ''}`}
                  onClick={() => {
                    setIsNearbyActive(false);
                    setSelectedRegionId(r.id);
                    const inRegion = cinemas.find(c => c.regionId === r.id || c.region?.id === r.id);
                    if (inRegion) setSelectedCinema(inRegion);
                  }}
                >
                  <MapPin size={16} /> {r.name}
                </div>
              ))}
            </div>
          </div>

          {/* Facilities Filter */}
          <div className="filter-group">
            <div className="filter-title">Tiện ích rạp</div>
            {ALL_FACILITIES.map(f => (
              <label key={f} className="filter-checkbox-label" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedFacilities.includes(f)}
                  onChange={() => handleToggleFacility(f)}
                />
                {f}
              </label>
            ))}
          </div>

        </aside>

        {/* Right Main Content */}
        <main>
          {/* Mobile Fast Filter Bar (Regions & Cinema Switcher) */}
          <div className="mobile-cinemas-bar">
            <div className="mobile-bar-label">
              <MapPin size={15} color="#e71a0f" />
              <span>Khu vực rạp chiếu:</span>
            </div>
            <div className="mobile-region-chips">
              <button
                type="button"
                className={`mobile-region-chip ${isNearbyActive ? 'active' : ''}`}
                onClick={handleFindNearby}
                disabled={isLocating}
              >
                <LocateFixed size={13} className={isLocating ? 'spin-animate' : ''} />
                {isLocating ? 'Định vị...' : 'Gần tôi'}
              </button>
              <button
                type="button"
                className={`mobile-region-chip ${!isNearbyActive && selectedRegionId === 'all' ? 'active' : ''}`}
                onClick={() => {
                  setIsNearbyActive(false);
                  setSelectedRegionId('all');
                }}
              >
                Tất cả
              </button>
              {regions.map(r => (
                <button
                  key={r.id}
                  type="button"
                  className={`mobile-region-chip ${!isNearbyActive && selectedRegionId === r.id ? 'active' : ''}`}
                  onClick={() => {
                    setIsNearbyActive(false);
                    setSelectedRegionId(r.id);
                    const inRegion = cinemas.find(c => c.regionId === r.id || c.region?.id === r.id);
                    if (inRegion) setSelectedCinema(inRegion);
                  }}
                >
                  {r.name}
                </button>
              ))}
            </div>

            {/* Mobile Cinema Dropdown */}
            <div className="mobile-cinema-picker">
              <select
                className="mobile-cinema-dropdown"
                value={selectedCinema?.id || ''}
                onChange={(e) => {
                  const target = cinemas.find(c => String(c.id) === e.target.value);
                  if (target) setSelectedCinema(target);
                }}
              >
                {filteredCinemas.map(c => {
                  const dist = formatDistance(c);
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} {dist ? `(${dist})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Cinema Hero Spotlight */}
          <div className="cinema-hero">
            <img src={heroImg} alt={heroCinema?.name || 'CGV Cinema'} className="cinema-hero-img" />
            <div className="cinema-hero-overlay">
              <span className="badge-tag" style={{ width: 'fit-content', marginBottom: 10 }}>
                Rạp nổi bật
              </span>
              <h2 className="cinema-hero-title">{heroCinema?.name || 'CGV Cinemas'}</h2>
              <div className="cinema-hero-addr">
                <MapPin size={18} color="#e71a0f" style={{ flexShrink: 0 }} />
                <span>{heroCinema?.address || 'Hệ thống rạp chiếu CGV toàn quốc'}</span>
              </div>

              <div className="cinema-hero-facilities">
                {heroFacilities.map((f, i) => (
                  <span key={i} className="badge-outline">{f}</span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    setSelectedCinema(heroCinema);
                    const scheduleEl = document.getElementById('cinema-schedule-block');
                    if (scheduleEl) scheduleEl.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Calendar size={16} />
                  Xem lịch chiếu
                </button>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(heroCinema?.address || '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                >
                  <Navigation size={16} />
                  Chỉ đường
                </a>
              </div>
            </div>
          </div>

          {/* Rạp chiếu tại khu vực & Ô tìm kiếm rạp */}
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div className="section-title" style={{ margin: 0 }}>
              <Navigation className="section-title-icon" size={22} />
              <span>Rạp chiếu tại khu vực ({filteredCinemas.length})</span>
            </div>

            {/* Quick search input */}
            <div style={{ position: 'relative', width: 280, maxWidth: '100%' }}>
              <Search size={15} style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: '#94a3b8'
              }} />
              <input
                type="text"
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                placeholder="Tìm tên cụm rạp, địa chỉ, quận..."
                style={{
                  width: '100%',
                  padding: '8px 32px 8px 34px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 20,
                  color: '#fff',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              />
              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => setSearchKeyword('')}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {filteredCinemas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <MapPin size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>Không tìm thấy rạp chiếu nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          ) : (
            <>
              <div className="cinemas-list-grid">
                {paginatedCinemas.map(c => (
                  <CinemaCard
                    key={c.id}
                    cinema={c}
                    isSelected={selectedCinema?.id === c.id}
                    onSelectCinema={(cin) => {
                      setSelectedCinema(cin);
                      const scheduleEl = document.getElementById('cinema-schedule-block');
                      if (scheduleEl) scheduleEl.scrollIntoView({ behavior: 'smooth' });
                    }}
                  />
                ))}
              </div>

              {totalCinemaPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 20,
                  marginBottom: 28,
                  padding: '12px 18px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 12,
                  flexWrap: 'wrap',
                  gap: 12
                }}>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    Hiển thị <strong style={{ color: '#fff' }}>{(cinemaPage - 1) * cinemaPageSize + 1}</strong> - <strong style={{ color: '#fff' }}>{Math.min(cinemaPage * cinemaPageSize, filteredCinemas.length)}</strong> trên tổng số <strong style={{ color: '#fff' }}>{filteredCinemas.length}</strong> rạp
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={cinemaPage <= 1}
                      onClick={() => setCinemaPage(p => Math.max(1, p - 1))}
                      style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                    >
                      <ChevronLeft size={15} /> Trước
                    </button>

                    {Array.from({ length: totalCinemaPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCinemaPage(p)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 6,
                          border: '1px solid',
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: cinemaPage === p ? 'var(--primary, #e71a0f)' : 'rgba(255, 255, 255, 0.06)',
                          borderColor: cinemaPage === p ? 'var(--primary, #e71a0f)' : 'rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          fontWeight: cinemaPage === p ? 700 : 500
                        }}
                      >
                        {p}
                      </button>
                    ))}

                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={cinemaPage >= totalCinemaPages}
                      onClick={() => setCinemaPage(p => Math.min(totalCinemaPages, p + 1))}
                      style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                    >
                      Sau <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <section className="schedule-section" id="cinema-schedule-block">
            <div className="schedule-cinema-header">
              <div>
                <h3 style={{ fontSize: '1.45rem', color: '#fff', marginBottom: 6, fontWeight: 800 }}>
                  Lịch chiếu tại {selectedCinema?.name || 'CGV Cinemas'}
                </h3>
                <div style={{ fontSize: '0.9rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={15} color="#e71a0f" />
                  {selectedCinema?.address || 'Hệ thống rạp chiếu CGV'}
                </div>
              </div>
            </div>

            {/* Dynamic 7-day Date Tabs */}
            <div className="date-tabs">
              {dateOptions.map(d => (
                <div
                  key={d.dateStr}
                  className={`date-tab ${activeDateObj.dateStr === d.dateStr ? 'active' : ''}`}
                  onClick={() => setActiveDateObj(d)}
                >
                  <Calendar size={14} />
                  {d.label}
                </div>
              ))}
            </div>

            {/* Schedule Body */}
            {isLoadingSchedule ? (
              <div style={{ padding: '60px 20px', display: 'flex', justifyContent: 'center' }}>
                <CgvAuraLoader
                  size="lg"
                  text={`Đang quét lịch chiếu rạp ${selectedCinema?.name || 'CGV'}...`}
                />
              </div>
            ) : moviesList.length === 0 ? (
              <div className="schedule-empty-box">
                <Film size={42} style={{ opacity: 0.35 }} />
                <h4>Rạp chưa có lịch chiếu cho {activeDateObj.label}</h4>
                <p>
                  Hiện rạp <strong>{selectedCinema?.name}</strong> chưa mở bán suất chiếu cho ngày này. Vui lòng chọn ngày khác hoặc tham khảo các rạp khác gần bạn.
                </p>
                {dateOptions[1] && (
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ marginTop: 8 }}
                    onClick={() => setActiveDateObj(dateOptions[1])}
                  >
                    Xem lịch chiếu {dateOptions[1].label} →
                  </button>
                )}
              </div>
            ) : (
              <div className="schedule-movies-list">
                {moviesList.map(movie => {
                  const slots = movie.showtimes || [];
                  const ageRating = movie.ageRating || 'P';
                  const ageClass = `age-${ageRating.toLowerCase()}`;
                  const modes = movie.supportedModes
                    ? movie.supportedModes.split(',')
                    : ['SUBTITLED'];

                  return (
                    <div key={movie.movieId} className="schedule-movie-row">
                      {/* Movie Meta Information */}
                      <div className="schedule-movie-meta">
                        <img
                          src={movie.posterUrl}
                          alt={movie.movieTitle}
                          className="schedule-movie-thumb"
                          loading="lazy"
                        />
                        <div className="schedule-movie-details">
                          <h4 className="schedule-movie-title">{movie.movieTitle}</h4>
                          
                          <div className="schedule-movie-info-pills">
                            <span className={`age-chip ${ageClass}`}>{ageRating}</span>
                            <span className="schedule-movie-duration-pill">
                              <Clock size={13} />
                              {movie.durationMinutes || 94} phút
                            </span>
                            {movie.language && (
                              <span className="schedule-movie-lang-pill">
                                <Globe size={11} />
                                {movie.language}
                              </span>
                            )}
                          </div>

                          {/* Supported Viewing Modes Pills */}
                          <div className="schedule-movie-modes-pills">
                            {modes.map((m, idx) => {
                              const isDub = m.toUpperCase().includes('DUB');
                              return (
                                <span
                                  key={idx}
                                  className={`mode-badge-tag ${isDub ? 'dub' : 'sub'}`}
                                >
                                  {isDub ? 'Lồng tiếng' : 'Phụ đề'}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Showtime Slots */}
                      <div className="schedule-slots-group">
                        <div className="schedule-slots-grid">
                          {slots.map(slot => {
                            const fmt = normalizeFormat(slot.format);
                            const fmtClass = `format-${fmt.toLowerCase()}`;
                            const modeLabel = getViewingModeLabel(slot.viewingMode, slot);
                            const isDubbed = modeLabel === 'Lồng tiếng';

                            return (
                              <button
                                key={slot.showtimeId}
                                className="schedule-slot-btn"
                                onClick={() => handleSlotClick(movie, slot)}
                                title={`Bấm để đặt ghế phòng ${slot.roomName || 'Chiếu'}`}
                              >
                                <div className="schedule-slot-time">
                                  {formatTime(slot.startTime)}
                                </div>

                                <div className="schedule-slot-tags">
                                  <span className={`slot-format-badge ${fmtClass}`}>
                                    {fmt}
                                  </span>
                                  <span className={`slot-sub-badge ${isDubbed ? 'mode-dubbed' : 'mode-sub'}`}>
                                    {modeLabel}
                                  </span>
                                </div>

                                <div className="schedule-slot-seats">
                                  <span className="seat-avail-dot" />
                                  <span>{slot.availableSeats ?? 80} ghế trống</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}