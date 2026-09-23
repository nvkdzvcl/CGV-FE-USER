import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Flame,
  Play,
  Ticket,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Clock,
  Info,
  Trophy,
  Gift,
  ArrowRight
} from "lucide-react";
import TrailerModal from "../components/TrailerModal";
import QuickBooking from "../components/QuickBooking";
import MovieCard from "../components/MovieCard";
import { MOVIES, CINEMAS } from "../data/mockData";
import { ApiService } from "../services/api";

export default function HomePage({ onOpenBooking }) {
  const [allMovies, setAllMovies] = useState(MOVIES);
  const [heroIdx, setHeroIdx] = useState(0);
  const [heroTrailerOpen, setHeroTrailerOpen] = useState(false);

  useEffect(() => {
    ApiService.getMovies()
      .then(res => {
        if (Array.isArray(res) && res.length > 0) {
          setAllMovies(res);
        }
      })
      .catch(err => console.warn('Could not load real movies from API:', err.message));
  }, []);

  const nowShowing = allMovies.filter((m) => m.showingStatus === "NOW_SHOWING");
  const comingSoon = allMovies.filter((m) => m.showingStatus === "COMING_SOON");

  // Phim nổi bật (isFeatured) do Admin cấu hình
  const featuredMovies = allMovies.filter((m) => m.isFeatured === true);

  // Hero banner ưu tiên phim nổi bật
  const heroCandidates = featuredMovies.length > 0 ? featuredMovies : allMovies;
  const heroMovies = heroCandidates.filter((m) => m.backdropUrl || m.posterUrl);
  const currentHero = heroMovies[heroIdx] || allMovies[0] || {};

  // Bảng xếp hạng phim xem nhiều: Ưu tiên hiển thị phim có isFeatured = true
  const topMovies = featuredMovies.length > 0
    ? [...featuredMovies, ...nowShowing.filter(m => !m.isFeatured)].slice(0, 5)
    : nowShowing.slice(0, 5);

  const autoPlayRef = useRef(null);

  useEffect(() => {
    if (heroMovies.length === 0) return;
    autoPlayRef.current = setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % heroMovies.length);
    }, 5000);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [heroMovies.length]);

  const handlePrevSlide = () => {
    if (heroMovies.length === 0) return;
    setHeroIdx((prev) => (prev - 1 + heroMovies.length) % heroMovies.length);
  };

  const handleNextSlide = () => {
    if (heroMovies.length === 0) return;
    setHeroIdx((prev) => (prev + 1) % heroMovies.length);
  };

  const handleHeroBook = () => {
    onOpenBooking({
      movie: currentHero
    });
  };

  return (
    <div className="home-page">
      {/* Hero Carousel Banner */}
      <section className="hero-section">
        <img
          src={currentHero.backdropUrl || currentHero.posterUrl}
          alt={currentHero.title}
          className="hero-backdrop"
        />
        <div className="hero-overlay" />

        <div className="hero-content">
          <div className="hero-badge" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="movie-status-pill status-now-showing">
              <span className="status-live-dot" />
              Phim đang chiếu
            </span>
            {currentHero.ageRating && (
              <span
                className={`movie-age-badge age-${currentHero.ageRating.toLowerCase()}`}
                style={{ height: 26, minWidth: 36 }}
              >
                {currentHero.ageRating}
              </span>
            )}
          </div>

          <h1 className="hero-title">{currentHero.title}</h1>
          <div className="hero-subtitle">{currentHero.originalTitle}</div>
          <p className="hero-synopsis">{currentHero.synopsis}</p>

          <div className="hero-meta">
            <span className="badge-outline">Khởi chiếu: {currentHero.releaseDate}</span>
            <span className="badge-outline">{currentHero.durationMinutes || currentHero.duration || 120} phút</span>
            {currentHero.genre?.map((g, i) => (
              <span key={i} className="badge-outline">
                {g}
              </span>
            ))}
          </div>

          <div className="hero-actions">
            <button className="btn-primary btn-hero-book" onClick={handleHeroBook}>
              <Ticket size={16} />
              Đặt vé ngay
            </button>
            <Link to={`/movies/${currentHero.id}`} className="btn-secondary btn-hero-detail" style={{ textDecoration: "none" }}>
              <Info size={16} />
              Chi tiết phim
            </Link>
            {currentHero.trailerYoutubeUrl && (
              <button
                type="button"
                className="btn-secondary btn-hero-trailer"
                onClick={() => setHeroTrailerOpen(true)}
              >
                <Play size={16} fill="#fff" />
                Xem trailer
              </button>
            )}
          </div>
        </div>

        {/* Carousel Prev / Next Arrow controls */}
        <button className="hero-nav-arrow prev" onClick={handlePrevSlide} title="Phim trước">
          <ChevronLeft size={22} />
        </button>
        <button className="hero-nav-arrow next" onClick={handleNextSlide} title="Phim kế tiếp">
          <ChevronRight size={22} />
        </button>

        {/* Carousel Dots indicator */}
        <div className="hero-dots">
          {heroMovies.map((_, i) => (
            <div
              key={i}
              className={`hero-dot ${i === heroIdx ? "active" : ""}`}
              onClick={() => setHeroIdx(i)}
            />
          ))}
        </div>
      </section>

      {/* Quick Booking Bar */}
      <QuickBooking onSelectBooking={onOpenBooking} />

      {/* Section 1: Phim đang chiếu (Full Width) */}
      <section style={{ marginBottom: 54 }}>
        <div className="section-header">
          <div className="section-title">
            <Flame className="section-title-icon" size={24} />
            <span>Phim đang chiếu</span>
          </div>
          <Link to="/movies?status=now" className="section-view-all">
            Xem tất cả <ChevronRight size={16} />
          </Link>
        </div>

        <div className="movie-grid">
          {nowShowing.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onBookTicket={(m) => onOpenBooking({ movie: m })}
            />
          ))}
        </div>
      </section>

      {/* Section 2: Phim nổi bật (Full Width Showcase) */}
      <section className="leaderboard-section">
        <div className="leaderboard-header">
          <div className="section-title">
            <Sparkles className="section-title-icon" size={24} color="#f59e0b" />
            <span>Phim nổi bật</span>
          </div>
          <span className="leaderboard-subtitle">Được tuyển chọn & xem nhiều nhất</span>
        </div>

        <div className="leaderboard-grid">
          {topMovies.map((m, idx) => (
            <div key={m.id} className="leaderboard-card">
              <span className={`leaderboard-rank-badge rank-${idx + 1}-badge`}>
                {idx + 1}
              </span>

              <div className="leaderboard-poster-wrap">
                <Link to={`/movies/${m.id}`}>
                  <img src={m.posterUrl} alt={m.title} className="leaderboard-poster" loading="lazy" />
                </Link>
                {m.ageRating && (
                  <span
                    className={`movie-age-badge age-${m.ageRating.toLowerCase()}`}
                    style={{ position: "absolute", top: 10, right: 10, zIndex: 3 }}
                  >
                    {m.ageRating}
                  </span>
                )}
              </div>

              <div className="leaderboard-body">
                <Link to={`/movies/${m.id}`} style={{ textDecoration: "none" }}>
                  <h4 className="leaderboard-title">{m.title}</h4>
                </Link>

                <div className="leaderboard-meta">
                  <Clock size={12} />
                  <span>{m.durationMinutes || m.duration || 120} phút</span>
                  {m.language && (
                    <>
                      <span>•</span>
                      <span>{m.language}</span>
                    </>
                  )}
                </div>

                {m.supportedModes && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', margin: '4px 0 8px 0' }}>
                    {m.supportedModes.includes('DUBBED') && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                        Lồng tiếng
                      </span>
                    )}
                    {m.supportedModes.includes('SUBTITLED') && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                        Phụ đề
                      </span>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  className="btn-book-ticket"
                  style={{ padding: "8px 12px", fontSize: "0.82rem", marginTop: "auto" }}
                  onClick={() => onOpenBooking({ movie: m })}
                >
                  Đặt vé
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Phim sắp chiếu (Full Width - Không còn bị ép hẹp) */}
      <section style={{ marginBottom: 54 }}>
        <div className="section-header">
          <div className="section-title">
            <Sparkles className="section-title-icon" size={24} />
            <span>Phim sắp chiếu</span>
          </div>
          <Link to="/movies?status=soon" className="section-view-all">
            Xem tất cả <ChevronRight size={16} />
          </Link>
        </div>

        <div className="movie-grid">
          {comingSoon.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onBookTicket={(m) => onOpenBooking({ movie: m })}
            />
          ))}
        </div>
      </section>

      {/* Section 4: Banner Ưu đãi & Khuyến mãi (Full Width) */}
      <section className="promo-showcase-card">
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div className="promo-icon-circle">
            <Gift size={32} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#fff", marginBottom: 6 }}>
              Ưu đãi thành viên CGV Cinema — Giảm tới 50%
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "0.92rem", margin: 0 }}>
              Nhận voucher bắp nước miễn phí và tích lũy điểm thưởng không giới hạn cho mọi giao dịch đặt vé trực tuyến.
            </p>
          </div>
        </div>
        <Link to="/promotions" className="btn-primary" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
          Xem ưu đãi ngay
          <ArrowRight size={16} />
        </Link>
      </section>

      {/* Trailer Modal for Hero Banner */}
      <TrailerModal
        isOpen={heroTrailerOpen}
        onClose={() => setHeroTrailerOpen(false)}
        trailerUrl={currentHero.trailerYoutubeUrl}
        title={currentHero.title}
      />
    </div>
  );
}
