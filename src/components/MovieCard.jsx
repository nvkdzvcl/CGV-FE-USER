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
                <Play size={20} fill="#fff" />
              </button>
              <span className="movie-play-overlay-text">Chi tiết & Trailer</span>
            </div>
          </Link>

          {/* Badges Overlay on Poster: Left is Status, Right is Age Rating */}
          <div className="movie-poster-badges">
            <span className={`movie-status-pill ${isNowShowing ? "status-now-showing" : "status-coming-soon"}`}>
              {isNowShowing ? (
                <>
                  <span className="status-live-dot" />
                  Đang chiếu
                </>
              ) : (
                movie.releaseDate ? `Dự kiến ${movie.releaseDate}` : "Sắp chiếu"
              )}
            </span>

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
            {movie.ageRating && (
              <span className={`age-chip ${ageInfo.className}`} title={ageInfo.name}>
                {ageInfo.label}
              </span>
            )}
            <Link to={`/movies/${movie.id}`} className="movie-title-link" title={movie.title}>
              <span className="movie-title-text">{movie.title}</span>
            </Link>
          </h4>
          
          <div className="movie-stats">
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={13} /> {movie.duration} phút
            </span>
            <span className="movie-format-pill">2D Phụ đề</span>
          </div>

          <div className="movie-genres">
            {movie.genre?.slice(0, 2).map((g, i) => (
              <span key={i} className="badge-outline">{g}</span>
            ))}
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
            <Link
              to={`/movies/${movie.id}`}
              className="btn-book-ticket"
              style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <Play size={14} fill="#fff" />
              Xem chi tiết & Trailer
            </Link>
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
