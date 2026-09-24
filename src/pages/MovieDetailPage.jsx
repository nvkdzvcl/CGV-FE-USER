import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Clock,
  Calendar,
  Globe,
  Subtitles,
  Film,
  Play,
  Ticket,
  ChevronRight,
  Info,
  Users,
  Video,
  MapPin,
  Share2,
  AlertTriangle,
  Layers,
  Volume2
} from "lucide-react";
import { MOVIES, CINEMAS } from "../data/mockData";
import { ApiService } from "../services/api";
import TrailerModal from "../components/TrailerModal";
import CgvAuraLoader from "../components/CgvAuraLoader";

const AGE_CONFIG = {
  T18: {
    label: "T18",
    className: "age-t18",
    name: "Phim cấm khán giả dưới 18 tuổi (18+)",
    desc: "Khán giả từ 18 tuổi trở lên. Vui lòng mang CCCD/giấy tờ tùy thân khi xem phim."
  },
  T16: {
    label: "T16",
    className: "age-t16",
    name: "Phim cấm khán giả dưới 16 tuổi (16+)",
    desc: "Khán giả từ 16 tuổi trở lên. Rạp sẽ kiểm tra giấy tờ tùy thân tại cổng soát vé."
  },
  T13: {
    label: "T13",
    className: "age-t13",
    name: "Phim cấm khán giả dưới 13 tuổi (13+)",
    desc: "Phù hợp khán giả từ 13 tuổi trở lên."
  },
  P: {
    label: "P",
    className: "age-p",
    name: "Phim dành cho mọi độ tuổi",
    desc: "Phim được phép phổ biến rộng rãi cho mọi đối tượng khán giả."
  },
  K: {
    label: "K",
    className: "age-k",
    name: "Dưới 13 tuổi có người lớn kèm",
    desc: "Khán giả dưới 13 tuổi có thể xem khi có cha mẹ hoặc người giám hộ đi kèm."
  }
};

const formatVnDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
};

const ROLE_LABELS = {
  DIRECTOR: "Đạo diễn",
  LEAD: "Vai chính",
  SUPPORTING: "Vai phụ",
  CAMEO: "Khách mời"
};

// Chuẩn hóa link YouTube sang link nhúng phân giải cao 1080p
function getYouTubeEmbedUrl(url) {
  if (!url) return '';
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}?vq=hd1080&hd=1&rel=0&modestbranding=1`;
  }
  if (url.includes('/embed/')) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}vq=hd1080&hd=1&rel=0&modestbranding=1`;
  }
  return url;
}

function generateNextDays(count = 7) {
  const days = [];
  const now = new Date();
  const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    let label = '';
    if (i === 0) {
      label = `Hôm nay (${day}.${month})`;
    } else if (i === 1) {
      label = `Ngày mai (${day}.${month})`;
    } else {
      label = `${dayNames[d.getDay()]} (${day}.${month})`;
    }

    days.push({
      dateStr,
      label,
      dayNumber: day,
      dayName: i === 0 ? 'Hôm nay' : (i === 1 ? 'Ngày mai' : dayNames[d.getDay()])
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
  } catch {
    return isoString;
  }
}

function getViewingModeLabel(mode, slot) {
  if (mode === 'DUBBED' || mode === 'LONG_TIENG') return 'Lồng tiếng';
  if (mode === 'VOICEOVER' || mode === 'THUYET_MINH') return 'Thuyết minh';
  if (mode === 'SUBTITLED' || mode === 'PHU_DE') return 'Phụ đề';
  if (slot?.language?.toLowerCase().includes('lồng')) return 'Lồng tiếng';
  return 'Phụ đề';
}

export default function MovieDetailPage({ onOpenBooking }) {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("info");
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  // 7 ngày chiếu động
  const dateOptions = useMemo(() => generateNextDays(7), []);
  const [selectedDateObj, setSelectedDateObj] = useState(dateOptions[0]);

  // Bộ lọc format & mode
  const [selectedFormat, setSelectedFormat] = useState('ALL');
  const [selectedMode, setSelectedMode] = useState('ALL'); // 'ALL' | 'SUBTITLED' | 'DUBBED'

  const [movie, setMovie] = useState(() => MOVIES.find((m) => m.id === id || m.id === Number(id)) || null);
  const [casts, setCasts] = useState([]);
  const [scheduleData, setScheduleData] = useState(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [isLoadingMovie, setIsLoadingMovie] = useState(() => !MOVIES.some((m) => m.id === id || m.id === Number(id)));

  // Lọc danh sách cụm rạp & suất chiếu theo Format & Viewing Mode
  const filteredCinemas = useMemo(() => {
    const list = scheduleData?.cinemas || [];
    if (list.length === 0) return [];

    return list.map(c => {
      const validSlots = (c.showtimes || []).filter(st => {
        // Lọc format
        if (selectedFormat !== 'ALL') {
          const fmt = normalizeFormat(st.format);
          if (fmt !== selectedFormat) return false;
        }
        // Lọc viewing mode
        if (selectedMode !== 'ALL') {
          const modeLabel = getViewingModeLabel(st.viewingMode, st);
          if (selectedMode === 'DUBBED' && modeLabel !== 'Lồng tiếng') return false;
          if (selectedMode === 'SUBTITLED' && modeLabel !== 'Phụ đề') return false;
        }
        return true;
      });

      return { ...c, showtimes: validSlots };
    }).filter(c => c.showtimes.length > 0);
  }, [scheduleData, selectedFormat, selectedMode]);

  const sortedCasts = useMemo(() => {
    const list = (casts && casts.length > 0) ? casts : (movie?.casts || []);
    return [...list].sort((a, b) => {
      const roleWeight = (role) => (role === 'DIRECTOR' ? 0 : role === 'LEAD' ? 1 : 2);
      const diff = roleWeight(a.roleType) - roleWeight(b.roleType);
      if (diff !== 0) return diff;
      return (a.displayOrder || 0) - (b.displayOrder || 0);
    });
  }, [casts, movie?.casts]);

  // 1. Tải chi tiết phim (đã tích hợp đầy đủ danh sách diễn viên & đạo diễn trong 1 API duy nhất)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsLoadingMovie(true);
    ApiService.getMovieById(id)
      .then(res => {
        if (res) {
          setMovie(res);
          if (res.casts && res.casts.length > 0) {
            setCasts(res.casts);
          }
        }
      })
      .catch(err => console.warn('Lỗi tải chi tiết phim từ backend:', err.message))
      .finally(() => {
        setIsLoadingMovie(false);
      });
  }, [id]);

  // 2. Tải lịch chiếu thật của phim này từ Backend
  useEffect(() => {
    if (!movie?.id) return;
    let isMounted = true;
    setIsLoadingSchedule(true);

    ApiService.getMovieSchedule(movie.id, { date: selectedDateObj.dateStr })
      .then(res => {
        if (isMounted) setScheduleData(res || null);
      })
      .catch(err => {
        console.warn('Lỗi tải lịch chiếu theo phim:', err.message);
        if (isMounted) setScheduleData(null);
      })
      .finally(() => {
        if (isMounted) setIsLoadingSchedule(false);
      });

    return () => { isMounted = false; };
  }, [movie?.id, selectedDateObj.dateStr]);

  if (isLoadingMovie && !movie) {
    return (
      <div className="movie-detail-container" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CgvAuraLoader text="Đang đồng bộ dữ liệu phim..." />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="movie-detail-container" style={{ textAlign: "center", padding: "100px 20px" }}>
        <Film size={64} style={{ color: "var(--primary)", marginBottom: 16 }} />
        <h2 style={{ fontSize: "1.8rem", color: "#fff", marginBottom: 10 }}>Không tìm thấy phim</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
          Phim bạn đang tìm kiếm không tồn tại hoặc đã ngừng công chiếu.
        </p>
        <Link to="/movies" className="btn-detail-book" style={{ textDecoration: "none" }}>
          Quay lại danh mục phim
        </Link>
      </div>
    );
  }

  const isNowShowing = movie.showingStatus === "NOW_SHOWING";
  const ageKey = (movie.ageRating || "P").toUpperCase();
  const ageInfo = AGE_CONFIG[ageKey] || {
    label: ageKey,
    className: "age-p",
    name: "Phân loại độ tuổi",
    desc: "Vui lòng xem quy định tại rạp."
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: movie.title,
          text: `Xem thông tin & lịch chiếu phim ${movie.title} tại cụm rạp CGV Cinema`,
          url: window.location.href
        });
      } catch {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Đã sao chép liên kết phim vào clipboard!");
    }
  };

  const scrollToSection = (tabKey) => {
    setActiveTab(tabKey);
    const elem = document.getElementById(`section-${tabKey}`);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const embedTrailerUrl = getYouTubeEmbedUrl(movie.trailerYoutubeUrl || movie.trailerUrl);

  const handleSlotClick = (cinema, slot) => {
    onOpenBooking({
      movie,
      cinema: {
        id: cinema.cinemaId || cinema.id,
        name: cinema.cinemaName || cinema.name,
        address: cinema.address
      },
      showtime: slot,
      showtimeId: slot.showtimeId || slot.id,
      roomId: slot.roomId,
      date: selectedDateObj.label,
      dateIso: selectedDateObj.dateStr,
      timeSlot: formatTime(slot.startTime),
      format: normalizeFormat(slot.format),
      viewingMode: getViewingModeLabel(slot.viewingMode, slot),
      basePrice: slot.basePrice || 85000
    });
  };

  return (
    <div className="movie-detail-container">
      {/* Breadcrumb Navigation */}
      <div className="movie-detail-breadcrumbs">
        <Link to="/">Trang chủ</Link>
        <ChevronRight size={14} />
        <Link to="/movies">Phim điện ảnh</Link>
        <ChevronRight size={14} />
        <span className="current">{movie.title}</span>
      </div>

      {/* Hero Header Section */}
      <div
        className="movie-detail-hero"
        style={{
          backgroundImage: `url(${movie.backdropUrl || movie.posterUrl})`
        }}
      >
        <div className="movie-detail-hero-backdrop-overlay" />

        <div className="movie-detail-hero-inner">
          {/* Left Column: Poster & Quick Action */}
          <div className="movie-detail-poster-card">
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="movie-detail-poster-img"
              loading="eager"
            />
            {embedTrailerUrl && (
              <button
                type="button"
                className="movie-detail-poster-play-btn"
                onClick={() => setIsTrailerOpen(true)}
                title="Xem nhanh Trailer HD"
              >
                <Play size={28} fill="#fff" />
              </button>
            )}
          </div>

          {/* Right Column: Header Info */}
          <div className="movie-detail-header-info">
            <div className="movie-detail-badges-row">
              <span className={`movie-status-pill ${isNowShowing ? "status-now-showing" : "status-coming-soon"}`}>
                {isNowShowing ? (
                  <>
                    <span className="status-live-dot" />
                    Đang chiếu tại các rạp
                  </>
                ) : (
                  movie.releaseDate ? `Khởi chiếu: ${formatVnDate(movie.releaseDate)}` : "Sắp chiếu"
                )}
              </span>

              {movie.ageRating && (
                <span className={`movie-age-badge ${ageInfo.className}`} title={ageInfo.name}>
                  {ageInfo.label} • {ageInfo.name}
                </span>
              )}
            </div>

            <h1 className="movie-detail-title-viet">{movie.title}</h1>
            {movie.originalTitle && (
              <h2 className="movie-detail-title-original">{movie.originalTitle}</h2>
            )}

            {/* Meta Specs Row */}
            <div className="movie-detail-meta-specs">
              <span className="movie-detail-meta-item">
                <Clock size={16} />
                <strong>{movie.durationMinutes || movie.duration || 120} phút</strong>
              </span>

              <span className="movie-detail-meta-item">
                <Calendar size={16} />
                Khởi chiếu: <strong>{formatVnDate(movie.releaseDate) || "Đang cập nhật"}</strong>
              </span>

              {movie.language && (
                <span className="movie-detail-meta-item">
                  <Globe size={16} />
                  Ngôn ngữ gốc: <strong>{movie.language}</strong>
                </span>
              )}

              {movie.subtitle && (
                <span className="movie-detail-meta-item">
                  <Subtitles size={16} />
                  Phụ đề: <strong>{movie.subtitle}</strong>
                </span>
              )}

              {movie.supportedModes && (
                <span className="movie-detail-meta-item">
                  <Film size={16} />
                  Chế độ chiếu:{' '}
                  {movie.supportedModes.split(',').map((mode, i) => (
                    <strong key={i} className={`mode-badge-inline mode-${mode.trim().toLowerCase()}`}>
                      {mode.trim() === 'SUBTITLED' ? 'Phụ đề' : mode.trim() === 'DUBBED' ? 'Lồng tiếng' : 'Thuyết minh'}
                    </strong>
                  ))}
                </span>
              )}
            </div>

            {/* Genres Tag List */}
            {movie.genre && (
              <div className="movie-detail-genres-list">
                {(Array.isArray(movie.genre) ? movie.genre : [movie.genre]).map((g, idx) => (
                  <span key={idx} className="genre-tag-pill">
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="movie-detail-actions">
              {isNowShowing ? (
                <button
                  className="btn-detail-book"
                  onClick={() => scrollToSection("showtimes")}
                >
                  <Ticket size={18} />
                  Đặt vé ngay
                </button>
              ) : (
                <button
                  className="btn-detail-book"
                  style={{ background: "#333b4d" }}
                  onClick={() => alert("Phim sắp khởi chiếu. Bạn có thể theo dõi fanpage CGV để nhận lịch chiếu sớm nhất!")}
                >
                  <Calendar size={18} />
                  Sắp khởi chiếu {movie.releaseDate ? `(${formatVnDate(movie.releaseDate)})` : ""}
                </button>
              )}

              {embedTrailerUrl && (
                <button
                  className="btn-detail-trailer"
                  onClick={() => setIsTrailerOpen(true)}
                >
                  <Play size={18} fill="#fff" />
                  Xem Trailer HD
                </button>
              )}

              <button className="btn-detail-share" onClick={handleShare} title="Chia sẻ phim này">
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Nav Tabs */}
      <nav className="movie-detail-nav-bar">
        <div
          className={`movie-detail-nav-tab ${activeTab === "info" ? "active" : ""}`}
          onClick={() => scrollToSection("info")}
        >
          Thông tin chi tiết
        </div>
        <div
          className={`movie-detail-nav-tab ${activeTab === "casts" ? "active" : ""}`}
          onClick={() => scrollToSection("casts")}
        >
          Diễn viên & Đạo diễn ({sortedCasts.length})
        </div>
        <div
          className={`movie-detail-nav-tab ${activeTab === "trailer" ? "active" : ""}`}
          onClick={() => scrollToSection("trailer")}
        >
          Trailer chính thức
        </div>
        {isNowShowing && (
          <div
            className={`movie-detail-nav-tab ${activeTab === "showtimes" ? "active" : ""}`}
            onClick={() => scrollToSection("showtimes")}
          >
            Lịch chiếu & Đặt vé
          </div>
        )}
      </nav>

      {/* Main Content Layout */}
      <div className="movie-detail-main">
        {/* Left Primary Column */}
        <div className="movie-detail-primary">
          {/* Section 1: Synopsis */}
          <section id="section-info" className="detail-section-card">
            <h3 className="detail-section-title">
              <Info size={20} />
              Tóm tắt nội dung kịch bản
            </h3>
            <p className="movie-synopsis-text">
              {movie.synopsis || "Thông tin nội dung kịch bản đang được cập nhật."}
            </p>
          </section>

          {/* Section 2: Movie Casts & Director */}
          <section id="section-casts" className="detail-section-card">
            <h3 className="detail-section-title">
              <Users size={20} />
              Dàn diễn viên & Đạo diễn
            </h3>

            {sortedCasts.length > 0 ? (
              <div className="movie-casts-grid">
                {sortedCasts.map((cast) => (
                  <div key={cast.id} className="movie-cast-item">
                    <div className="movie-cast-avatar-wrapper">
                      <img
                        src={cast.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop"}
                        alt={cast.actorName}
                        className="movie-cast-avatar"
                        loading="lazy"
                      />
                    </div>
                    <div className="movie-cast-name">{cast.actorName}</div>
                    <div className="movie-cast-character">{cast.characterName || "Vai diễn"}</div>
                    {cast.roleType && (
                      <span className="movie-cast-role-badge">
                        {ROLE_LABELS[cast.roleType] || cast.roleType}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#94a3b8" }}>Thông tin dàn diễn viên đang được cập nhật.</p>
            )}
          </section>

          {/* Section 3: Official Trailer with 1080p Embed */}
          {embedTrailerUrl && (
            <section id="section-trailer" className="detail-section-card">
              <h3 className="detail-section-title">
                <Video size={20} />
                Trailer chính thức (Full HD 1080p)
              </h3>
              <div className="inline-trailer-wrapper" style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 12, overflow: 'hidden', background: '#000' }}>
                <iframe
                  src={embedTrailerUrl}
                  title={`Trailer ${movie.title}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none'
                  }}
                />
              </div>
            </section>
          )}

          {/* Section 4: Showtimes Schedule — Real API + Responsive Grid */}
          <section id="section-showtimes" className="detail-section-card">
            <h3 className="detail-section-title">
              <Calendar size={20} />
              Lịch chiếu tại các cụm rạp CGV
            </h3>

            {isNowShowing ? (
              <div className="movie-showtime-schedule">
                {/* 1. Dynamic Date Tabs */}
                <div className="schedule-date-pills" style={{ overflowX: 'auto', paddingBottom: 8 }}>
                  {dateOptions.map((d) => (
                    <button
                      key={d.dateStr}
                      className={`schedule-date-pill ${selectedDateObj.dateStr === d.dateStr ? "active" : ""}`}
                      onClick={() => setSelectedDateObj(d)}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                {/* 2. Format & Mode Filter Bar */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '16px 0 20px 0', alignItems: 'center' }}>
                  {/* Format Pills */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Định dạng:</span>
                    {['ALL', '2D', '3D', 'IMAX', '4DX'].map(fmt => (
                      <button
                        key={fmt}
                        type="button"
                        className={`format-pill ${selectedFormat === fmt ? 'active' : ''}`}
                        onClick={() => setSelectedFormat(fmt)}
                        style={{
                          padding: '4px 10px', fontSize: '0.75rem', borderRadius: 6,
                          border: selectedFormat === fmt ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                          background: selectedFormat === fmt ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                          color: '#fff', cursor: 'pointer', fontWeight: 700
                        }}
                      >
                        {fmt === 'ALL' ? 'Tất cả' : fmt}
                      </button>
                    ))}
                  </div>

                  {/* Viewing Mode Pills (Text only, no emoji) */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 'auto' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Hình thức:</span>
                    {[
                      { id: 'ALL', label: 'Tất cả' },
                      { id: 'SUBTITLED', label: 'Phụ đề' },
                      { id: 'DUBBED', label: 'Lồng tiếng' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setSelectedMode(mode.id)}
                        style={{
                          padding: '4px 10px', fontSize: '0.75rem', borderRadius: 6,
                          border: selectedMode === mode.id ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                          background: selectedMode === mode.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.05)',
                          color: selectedMode === mode.id ? '#38bdf8' : '#cbd5e1', cursor: 'pointer', fontWeight: 600
                        }}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Schedule Content */}
                {isLoadingSchedule ? (
                  <div style={{ padding: '50px 20px', display: 'flex', justifyContent: 'center' }}>
                    <CgvAuraLoader size="md" text="Đang tải lịch chiếu từ hệ thống CGV..." />
                  </div>
                ) : filteredCinemas.length === 0 ? (
                  <div className="schedule-empty-box" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Film size={36} style={{ opacity: 0.35, margin: '0 auto 10px' }} />
                    <h4 style={{ color: '#fff', marginBottom: 6 }}>Không có suất chiếu phù hợp</h4>
                    <p style={{ fontSize: '0.86rem' }}>
                      Vui lòng thử chọn ngày chiếu khác hoặc thay đổi bộ lọc định dạng / hình thức.
                    </p>
                  </div>
                ) : (
                  filteredCinemas.map((cinema) => (
                    <div key={cinema.cinemaId || cinema.id} className="schedule-cinema-card" style={{ marginBottom: 20 }}>
                      <div className="schedule-cinema-head" style={{ marginBottom: 14 }}>
                        <div>
                          <div className="schedule-cinema-name" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                            {cinema.cinemaName || cinema.name}
                          </div>
                          <div className="schedule-cinema-addr" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <MapPin size={13} color="var(--primary)" />
                            {cinema.address}
                          </div>
                        </div>
                      </div>

                      {/* Responsive Grid of Showtime Slots */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                        gap: 10
                      }}>
                        {cinema.showtimes.map((slot) => {
                          const fmt = normalizeFormat(slot.format);
                          const modeLabel = getViewingModeLabel(slot.viewingMode, slot);
                          const isDub = modeLabel === 'Lồng tiếng';

                          return (
                            <button
                              key={slot.showtimeId || slot.id}
                              type="button"
                              onClick={() => handleSlotClick(cinema, slot)}
                              style={{
                                background: '#131826',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: 10,
                                padding: '10px 8px',
                                color: '#fff',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 4,
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.borderColor = 'var(--primary)';
                                e.currentTarget.style.background = 'rgba(231, 26, 15, 0.12)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.background = '#131826';
                                e.currentTarget.style.transform = 'none';
                              }}
                            >
                              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                                {formatTime(slot.startTime)}
                              </span>

                              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                <span style={{
                                  fontSize: '0.68rem', fontWeight: 700, padding: '1px 5px',
                                  borderRadius: 4, background: 'rgba(255,255,255,0.1)', color: '#cbd5e1'
                                }}>
                                  {fmt}
                                </span>
                                <span style={{
                                  fontSize: '0.68rem', fontWeight: 600, padding: '1px 5px',
                                  borderRadius: 4,
                                  background: isDub ? 'rgba(245, 158, 11, 0.16)' : 'rgba(59, 130, 246, 0.16)',
                                  color: isDub ? '#fbbf24' : '#60a5fa'
                                }}>
                                  {modeLabel}
                                </span>
                              </div>

                              <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>
                                {slot.availableSeats != null ? `${slot.availableSeats} ghế` : 'Còn vé'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div style={{ padding: '30px 0', textAlign: 'center', color: '#94a3b8' }}>
                <p>Phim hiện chưa mở bán suất chiếu chính thức.</p>
              </div>
            )}
          </section>
        </div>

        {/* Right Sidebar Specs */}
        <aside className="movie-detail-sidebar">
          {/* Movie Specs Card */}
          <div className="detail-section-card">
            <h3 className="detail-section-title">
              <Film size={20} />
              Thông số kĩ thuật
            </h3>

            <div className="movie-specs-list">
              <div className="spec-item">
                <span className="spec-label">Đạo diễn</span>
                <span className="spec-value">
                  {sortedCasts.find(c => c.roleType === 'DIRECTOR')?.actorName || movie.director || "Đang cập nhật"}
                </span>
              </div>

              <div className="spec-item">
                <span className="spec-label">Diễn viên chính</span>
                <span className="spec-value">
                  {sortedCasts.filter(c => c.roleType === 'LEAD').map(c => c.actorName).join(", ") || movie.cast || "Đang cập nhật"}
                </span>
              </div>

              <div className="spec-item">
                <span className="spec-label">Thể loại</span>
                <span className="spec-value">{Array.isArray(movie.genre) ? movie.genre.join(", ") : (movie.genre || "Điện ảnh")}</span>
              </div>

              <div className="spec-item">
                <span className="spec-label">Thời lượng</span>
                <span className="spec-value">{movie.durationMinutes || movie.duration || 120} phút</span>
              </div>

              <div className="spec-item">
                <span className="spec-label">Khởi chiếu</span>
                <span className="spec-value">{formatVnDate(movie.releaseDate) || "Đang cập nhật"}</span>
              </div>

              {movie.endDate && (
                <div className="spec-item">
                  <span className="spec-label">Kết thúc dự kiến</span>
                  <span className="spec-value">{formatVnDate(movie.endDate)}</span>
                </div>
              )}

              <div className="spec-item">
                <span className="spec-label">Ngôn ngữ gốc</span>
                <span className="spec-value">{movie.language || "Tiếng Anh"}</span>
              </div>

              <div className="spec-item">
                <span className="spec-label">Phụ đề</span>
                <span className="spec-value">{movie.subtitle || "Tiếng Việt"}</span>
              </div>

              {movie.supportedModes && (
                <div className="spec-item">
                  <span className="spec-label">Chế độ xem</span>
                  <span className="spec-value">
                    {movie.supportedModes.split(',').map((mode, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-block',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 4,
                          marginRight: 4,
                          background: mode.trim() === 'DUBBED' ? 'rgba(245, 158, 11, 0.16)' : 'rgba(59, 130, 246, 0.16)',
                          color: mode.trim() === 'DUBBED' ? '#fbbf24' : '#60a5fa'
                        }}
                      >
                        {mode.trim() === 'DUBBED' ? 'Lồng tiếng' : mode.trim() === 'SUBTITLED' ? 'Phụ đề' : 'Thuyết minh'}
                      </span>
                    ))}
                  </span>
                </div>
              )}

              {movie.country && (
                <div className="spec-item">
                  <span className="spec-label">Quốc gia</span>
                  <span className="spec-value">{movie.country}</span>
                </div>
              )}
            </div>
          </div>

          {/* Age Rating Warning Notice */}
          <div className="age-rating-guide-box">
            <span className={`age-chip ${ageInfo.className}`}>{ageInfo.label}</span>
            <div className="age-rating-guide-text">
              <strong style={{ color: "#fff", display: "block", marginBottom: 4 }}>
                {ageInfo.name}
              </strong>
              {ageInfo.desc}
            </div>
          </div>

          {/* Cinema Policy Guide */}
          <div className="detail-section-card" style={{ padding: 18 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8, color: "#f59e0b" }}>
              <AlertTriangle size={18} />
              <strong style={{ fontSize: "0.9rem" }}>Lưu ý khi xem phim</strong>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.82rem", color: "#94a3b8", lineHeight: 1.6 }}>
              <li>Vui lòng đến trước giờ chiếu ít nhất 15 phút để nhận vé.</li>
              <li>Không mang thức ăn, nước uống từ ngoài vào rạp chiếu.</li>
              <li>Xuất trình giấy tờ tùy thân có dán ảnh để xác minh độ tuổi quy định.</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* Trailer Modal Popup (1080p) */}
      {isTrailerOpen && embedTrailerUrl && (
        <TrailerModal
          isOpen={isTrailerOpen}
          onClose={() => setIsTrailerOpen(false)}
          videoUrl={embedTrailerUrl}
          movieTitle={movie.title}
        />
      )}
    </div>
  );
}
