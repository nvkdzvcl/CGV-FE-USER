import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, Play, Info } from "lucide-react";
import TrailerModal from "./TrailerModal";

const AGE_CONFIG = {
  T18: { label: "T18", className: "age-t18", name: "Phim cấm khán giả dưới 18 tuổi (18+)" },
  T16: { label: "T16", className: "age-t16", name: "Phim cấm khán giả dưới 16 tuổi (16+)" },
  T13: { label: "T13", className: "age-t13", name: "Phim cấm khán giả dưới 13 tuổi (13+)" },
  P: { label: "P", className: "age-p", name: "Phim dành cho mọi độ tuổi" },
  K: { label: "K", className: "age-k", name: "Dưới 13 tuổi có người lớn kèm" },
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

export default function MovieCard({ movie, onBookTicket }) {
  const navigate = useNavigate();
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);

  const isNowShowing = movie.showingStatus === "NOW_SHOWING";
  const ageKey = (movie.ageRating || "P").toUpperCase();
  const ageInfo = AGE_CONFIG[ageKey] || { label: ageKey, className: "age-p", name: "Độ tuổi" };

  const handleOpenTrailer = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (movie.trailerYoutubeUrl) {
      setIsTrailerModalOpen(true);
    } else {
      navigate(`/movies/${movie.id}`);
    }
  };

  const getMovieModes = (m) => {
    if (m?.supportedModes) {
      const modes = [];
      const supp = String(m.supportedModes).toUpperCase();
      if (supp.includes('SUBTITLED') || supp.includes('PHU_DE')) modes.push('Phụ đề');
      if (supp.includes('DUBBED') || supp.includes('LONG_TIENG')) modes.push('Lồng tiếng');
      if (supp.includes('VOICEOVER') || supp.includes('THUYET_MINH')) modes.push('Thuyết minh');
      if (modes.length > 0) return modes;
    }
    const modes = [];
    const sub = (m?.subtitle || '').toLowerCase();
    const lang = (m?.language || '').toLowerCase();
    if (sub.includes('phụ đề') || sub.includes('tiếng việt') || lang.includes('anh') || lang.includes('hàn') || lang.includes('nhật')) {
      modes.push('Phụ đề');
    }
    if (lang.includes('lồng tiếng') || sub.includes('lồng tiếng')) {
      modes.push('Lồng tiếng');
    }
    return modes.length > 0 ? modes : ['Phụ đề'];
  };

  const movieModes = getMovieModes(movie);

  const genreText = Array.isArray(movie?.genre)
    ? movie.genre.slice(0, 2).join(", ")
    : (typeof movie?.genre === "string" ? movie.genre : (movie?.genres || "Hành động"));

  return (
    <>
      <div className="movie-card">
        <div className="movie-poster-wrapper">
          <Link to={`/movies/${movie.id}`} className="movie-poster-clickable" title={`Xem chi tiết phim ${movie.title}`}>
            <img src={movie.posterUrl} alt={movie.title} className="movie-poster" loading="lazy" />

            {/* Hover overlay with quick play trailer button */}
            <div className="movie-poster-play-overlay">
              <button
                type="button"
                className="movie-play-icon-circle"
                onClick={handleOpenTrailer}
                title="Xem nhanh Trailer"
              >
                <Play size={22} fill="#fff" />
              </button>
              <span className="movie-play-overlay-text">Xem Trailer</span>
            </div>
          </Link>

          {/* Badges Overlay on Poster: Left is Status (always) + Featured (beside it), Right is Age Rating */}
          <div className="movie-poster-badges">
            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
              <span className={`movie-status-pill ${isNowShowing ? "status-now-showing" : "status-coming-soon"}`}>
                {isNowShowing ? (
                  <>
                    <span className="status-live-dot" />
                    Đang chiếu
                  </>
                ) : (
                  "Sắp chiếu"
                )}
              </span>
              {movie.isFeatured && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: '#fff',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    padding: '2px 7px',
                    borderRadius: 10,
                    boxShadow: '0 2px 6px rgba(245, 158, 11, 0.4)',
                    letterSpacing: '0.02em',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3
                  }}
                  title="Phim nổi bật CGV"
                >
                  ⭐ Nổi bật
                </span>
              )}
            </div>

            {movie.ageRating && (
              <span
                className={`movie-age-badge ${ageInfo.className}`}
                title={ageInfo.name}
              >
                {ageInfo.label}
              </span>
            )}
          </div>
        </div>

        <div className="movie-info">
          <h4 className="movie-title">
            <Link to={`/movies/${movie.id}`} className="movie-title-link" title={movie.title}>
              <span className="movie-title-text">{movie.title}</span>
            </Link>
          </h4>
          
          {/* Clean Typographic Sub-Info (No boxy clutter) */}
          <div className="movie-meta-line">
            <span className="movie-meta-genre">{genreText}</span>
            <span className="meta-dot">•</span>
            <span className="movie-meta-duration">
              <Clock size={12} /> {movie.durationMinutes || movie.duration || 120} phút
            </span>
          </div>

          {!isNowShowing && movie.releaseDate && (
            <div className="movie-release-banner">
              Khởi chiếu: <strong>{formatVnDate(movie.releaseDate)}</strong>
            </div>
          )}

          <div className="movie-sub-badges">
            {movieModes.map((mode, idx) => (
              <span key={idx} className={`movie-format-pill ${mode === 'Lồng tiếng' ? 'dubbed' : ''}`}>
                {mode}
              </span>
            ))}
            {movie.country && <span className="movie-country-text">{movie.country}</span>}
          </div>

          {isNowShowing ? (
            <div className="movie-card-actions-row">
              <button
                className="btn-book-ticket"
                onClick={() => onBookTicket && onBookTicket(movie)}
                style={{ flex: 1 }}
              >
                Đặt vé
              </button>
              <Link
                to={`/movies/${movie.id}`}
                className="btn-card-detail"
                title="Xem chi tiết, diễn viên & trailer"
              >
                <Info size={14} style={{ marginRight: 4 }} />
                Chi tiết
              </Link>
            </div>
          ) : (
            <div className="movie-card-actions-row">
              <button
                type="button"
                className="btn-card-trailer"
                onClick={handleOpenTrailer}
                title="Xem nhanh Trailer"
                style={{ flex: 1 }}
              >
                <Play size={13} fill="currentColor" />
                Trailer
              </button>
              <Link
                to={`/movies/${movie.id}`}
                className="btn-card-detail"
                title="Xem chi tiết phim"
                style={{ flex: 1 }}
              >
                <Info size={14} style={{ marginRight: 4 }} />
                Chi tiết
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Trailer Modal if triggered from poster */}
      <TrailerModal
        isOpen={isTrailerModalOpen}
        onClose={() => setIsTrailerModalOpen(false)}
        trailerUrl={movie.trailerYoutubeUrl}
        title={movie.title}
      />
    </>
  );
}
