import React, { useState, useEffect } from "react";
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
  AlertTriangle
} from "lucide-react";
import { MOVIES, CINEMAS, SHOWTIME_SLOTS } from "../data/mockData";
import TrailerModal from "../components/TrailerModal";

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

const ROLE_LABELS = {
  DIRECTOR: "Đạo diễn",
  LEAD: "Vai chính",
  SUPPORTING: "Vai phụ",
  CAMEO: "Khách mời"
};

export default function MovieDetailPage({ onOpenBooking }) {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("info");
  const [selectedDate, setSelectedDate] = useState("Hôm nay");
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  const movie = MOVIES.find((m) => m.id === id);

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

  const handleBookSlot = (cinema, slot) => {
    if (onOpenBooking) {
      onOpenBooking({
        movie,
        cinema,
        date: selectedDate,
        timeSlot: slot
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: movie.title,
          text: `Xem thông tin & lịch chiếu phim ${movie.title} tại cụm rạp CGV Cinema`,
          url: window.location.href
        });
      } catch (_err) {
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

  const sortedCasts = movie.casts ? [...movie.casts].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)) : [];

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

      {/* Hero Banner Section */}
      <section
        className="movie-detail-hero"
        style={{
          backgroundImage: `url(${movie.backdropUrl || movie.posterUrl})`
        }}
      >
        <div className="movie-detail-hero-backdrop-overlay" />

        <div className="movie-detail-hero-inner">
          {/* Left Poster */}
          <div className="movie-detail-poster-card">
            <img src={movie.posterUrl} alt={movie.title} className="movie-detail-poster-img" />
            {movie.trailerYoutubeUrl && (
              <button
                className="movie-detail-poster-play-btn"
                onClick={() => setIsTrailerOpen(true)}
                title="Bấm để phát Trailer"
              >
                <Play size={28} fill="#fff" />
              </button>
            )}
          </div>

          {/* Right Header Info */}
          <div className="movie-detail-header-info">
            <div className="movie-detail-badges-row">
              <span className={`movie-status-pill ${isNowShowing ? "status-now-showing" : "status-coming-soon"}`}>
                {isNowShowing ? (
                  <>
                    <span className="status-live-dot" />
                    Đang chiếu tại các rạp
                  </>
                ) : (
                  `Dự kiến khởi chiếu ${movie.releaseDate || "Sắp tới"}`
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

            {/* Meta specs row */}
            <div className="movie-detail-meta-specs">
              <span className="movie-detail-meta-item">
                <Clock size={16} />
                <strong>{movie.duration} phút</strong>
              </span>

              <span className="movie-detail-meta-item">
                <Calendar size={16} />
                Khởi chiếu: <strong>{movie.releaseDate}</strong>
              </span>

              {movie.language && (
                <span className="movie-detail-meta-item">
                  <Globe size={16} />
                  Ngôn ngữ: <strong>{movie.language}</strong>
                </span>
              )}

              {movie.subtitle && (
                <span className="movie-detail-meta-item">
                  <Subtitles size={16} />
                  Phụ đề: <strong>{movie.subtitle}</strong>
                </span>
              )}
            </div>

            {/* Genres Tag List */}
            {movie.genre && (
              <div className="movie-detail-genres-list">
                {movie.genre.map((g, idx) => (
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
                  Sắp khởi chiếu ({movie.releaseDate})
                </button>
              )}

              {movie.trailerYoutubeUrl && (
                <button
                  className="btn-detail-trailer"
                  onClick={() => setIsTrailerOpen(true)}
                >
                  <Play size={18} fill="#fff" />
                  Xem Trailer
                </button>
              )}

              <button className="btn-detail-trailer" onClick={handleShare} title="Chia sẻ phim">
                <Share2 size={18} />
                Chia sẻ
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Detail Navigation Tabs */}
      <nav className="movie-detail-nav-tabs">
        <div
          className={`movie-detail-nav-tab ${activeTab === "info" ? "active" : ""}`}
          onClick={() => scrollToSection("info")}
        >
          Thông tin phim
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
          {/* Section 1: Synopsis (Tóm tắt kịch bản từ db.txt) */}
          <section id="section-info" className="detail-section-card">
            <h3 className="detail-section-title">
              <Info size={20} />
              Tóm tắt nội dung kịch bản
            </h3>
            <p className="movie-synopsis-text">
              {movie.synopsis || "Thông tin nội dung kịch bản đang được cập nhật."}
            </p>
          </section>

          {/* Section 2: Movie Casts & Director (Dàn diễn viên từ db.txt movie_casts) */}
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

          {/* Section 3: Official Trailer (trailer_youtube_url từ db.txt) */}
          {movie.trailerYoutubeUrl && (
            <section id="section-trailer" className="detail-section-card">
              <h3 className="detail-section-title">
                <Video size={20} />
                Trailer chính thức
              </h3>
              <div className="inline-trailer-wrapper">
                <iframe
                  src={movie.trailerYoutubeUrl}
                  title={`Trailer ${movie.title}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="inline-trailer-iframe"
                />
              </div>
            </section>
          )}

          {/* Section 4: Showtimes Schedule (Suất chiếu từ db.txt showtimes) */}
          <section id="section-showtimes" className="detail-section-card">
            <h3 className="detail-section-title">
              <Calendar size={20} />
              Lịch chiếu tại các cụm rạp CGV
            </h3>

            {isNowShowing ? (
              <div className="movie-showtime-schedule">
                {/* Date Tabs */}
                <div className="schedule-date-pills">
                  {["Hôm nay", "Ngày mai", "Thứ 6 (18.09)", "Thứ 7 (19.09)", "Chủ nhật (20.09)"].map((d) => (
                    <button
                      key={d}
                      className={`schedule-date-pill ${selectedDate === d ? "active" : ""}`}
                      onClick={() => setSelectedDate(d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>

                {/* Showtimes by Cinema */}
                {CINEMAS.slice(0, 4).map((cinema) => (
                  <div key={cinema.id} className="schedule-cinema-card">
                    <div className="schedule-cinema-head">
                      <div>
                        <div className="schedule-cinema-name">{cinema.name}</div>
                        <div className="schedule-cinema-addr">
                          <MapPin size={13} color="var(--primary)" />
                          {cinema.address}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <span className="badge-outline">2D Phụ đề</span>
                      </div>
                    </div>

                    <div className="schedule-slots-group">
                      {SHOWTIME_SLOTS.map((slot) => (
                        <button
                          key={slot}
                          className="schedule-slot-btn"
                          onClick={() => handleBookSlot(cinema, slot)}
                          title="Bấm để chọn ghế và đặt vé"
                        >
                          <span>{slot}</span>
                          <span className="schedule-slot-format">2D</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "30px 20px", color: "#94a3b8" }}>
                <Calendar size={40} style={{ margin: "0 auto 12px", opacity: 0.6 }} />
                <p style={{ fontSize: "1.05rem", color: "#fff", marginBottom: 6 }}>
                  Phim dự kiến khởi chiếu vào ngày <strong>{movie.releaseDate}</strong>
                </p>
                <p style={{ fontSize: "0.88rem" }}>
                  Lịch chiếu chính thức sẽ được mở trước ngày khởi chiếu 3 ngày.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Right Sidebar: Specifications & Regulatory Info */}
        <aside className="movie-specs-sidebar">
          {/* Detailed Specs based on db.txt */}
          <div className="detail-section-card">
            <h4 className="detail-section-title" style={{ fontSize: "1.05rem", marginBottom: 14 }}>
              Thông tin kỹ thuật
            </h4>
            <div className="specs-list">
              <div className="spec-item">
                <span className="spec-label">Đạo diễn</span>
                <span className="spec-value">{movie.director || "Đang cập nhật"}</span>
              </div>

              <div className="spec-item">
                <span className="spec-label">Diễn viên chính</span>
                <span className="spec-value">{movie.cast || "Đang cập nhật"}</span>
              </div>

              <div className="spec-item">
                <span className="spec-label">Thể loại</span>
                <span className="spec-value">{movie.genre ? movie.genre.join(", ") : "Điện ảnh"}</span>
              </div>

              <div className="spec-item">
                <span className="spec-label">Thời lượng</span>
                <span className="spec-value">{movie.duration} phút</span>
              </div>

              <div className="spec-item">
                <span className="spec-label">Khởi chiếu</span>
                <span className="spec-value">{movie.releaseDate || "Đang cập nhật"}</span>
              </div>

              {movie.endDate && (
                <div className="spec-item">
                  <span className="spec-label">Kết thúc dự kiến</span>
                  <span className="spec-value">{movie.endDate}</span>
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

      {/* Trailer Modal Popup */}
      <TrailerModal
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        trailerUrl={movie.trailerYoutubeUrl}
        title={movie.title}
      />
    </div>
  );
}
