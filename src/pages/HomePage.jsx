import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Play, Ticket, ChevronRight, ChevronLeft, Sparkles, Clock, Info, Trophy } from 'lucide-react';
import TrailerModal from '../components/TrailerModal';
import QuickBooking from '../components/QuickBooking';
import MovieCard from '../components/MovieCard';
import { MOVIES, CINEMAS } from '../data/mockData';

export default function HomePage({ onOpenBooking }) {
  const [heroIdx, setHeroIdx] = useState(0);
  const [heroTrailerOpen, setHeroTrailerOpen] = useState(false);
  const heroMovies = MOVIES.filter(m => m.backdropUrl);
  const currentHero = heroMovies[heroIdx] || MOVIES[0];

  const nowShowing = MOVIES.filter(m => m.showingStatus === 'NOW_SHOWING');
  const comingSoon = MOVIES.filter(m => m.showingStatus === 'COMING_SOON');
  const topMovies = nowShowing.slice(0, 5);

  const autoPlayRef = useRef(null);

  // Auto-play slide transition every 5 seconds
  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setHeroIdx(prev => (prev + 1) % heroMovies.length);
    }, 5000);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [heroMovies.length]);

  const handlePrevSlide = () => {
    setHeroIdx(prev => (prev - 1 + heroMovies.length) % heroMovies.length);
  };

  const handleNextSlide = () => {
    setHeroIdx(prev => (prev + 1) % heroMovies.length);
  };

  const handleHeroBook = () => {
    onOpenBooking({
      movie: currentHero,
      cinema: CINEMAS[0],
      date: 'Hôm nay',
      timeSlot: '19:30'
    });
  };

  return (
    <div className="home-page">
      {/* Hero Section with Cinematic Transition */}
      <section
        className="hero-section"
        onMouseEnter={() => autoPlayRef.current && clearInterval(autoPlayRef.current)}
        onMouseLeave={() => {
          autoPlayRef.current = setInterval(() => {
            setHeroIdx(prev => (prev + 1) % heroMovies.length);
          }, 5000);
        }}
      >
        <img
          key={currentHero.id + '-backdrop'}
          src={currentHero.backdropUrl}
          alt={currentHero.title}
          className="hero-backdrop hero-backdrop-transition"
        />
        <div className="hero-overlay" />
        
        <div key={currentHero.id + '-content'} className="hero-content hero-content-transition">
          <div className="hero-badge" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="movie-status-pill status-now-showing" style={{ fontSize: '0.8rem', padding: '5px 12px' }}>
              <span className="status-live-dot" />
              Phim đang chiếu
            </span>
            {currentHero.ageRating && (
              <span className={`movie-age-badge age-${currentHero.ageRating.toLowerCase()}`} style={{ height: 26, minWidth: 36 }}>
                {currentHero.ageRating}
              </span>
            )}
          </div>

          <h1 className="hero-title">{currentHero.title}</h1>
          <div className="hero-subtitle">{currentHero.originalTitle}</div>
          <p className="hero-synopsis">{currentHero.synopsis}</p>

          <div className="hero-meta">
            <span className="badge-outline">Khởi chiếu: {currentHero.releaseDate}</span>
            <span className="badge-outline">{currentHero.duration} phút</span>
            {currentHero.genre?.map((g, i) => (
              <span key={i} className="badge-outline">{g}</span>
            ))}
          </div>

          <div className="hero-actions">
            <button className="btn-primary" onClick={handleHeroBook}>
              <Ticket size={16} />
              Đặt vé ngay
            </button>
            <Link to={`/movies/${currentHero.id}`} className="btn-secondary" style={{ textDecoration: "none" }}>
              <Info size={16} />
              Chi tiết phim
            </Link>
            {currentHero.trailerYoutubeUrl && (
              <button
                type="button"
                className="btn-secondary"
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
              className={`hero-dot ${i === heroIdx ? 'active' : ''}`}
              onClick={() => setHeroIdx(i)}
            />
          ))}
        </div>
      </section>

      {/* Quick Booking Bar */}
      <QuickBooking onSelectBooking={onOpenBooking} />

      {/* Phim đang chiếu Section */}
      <section style={{ marginBottom: 48 }}>
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
          {nowShowing.map(movie => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onBookTicket={(m) => onOpenBooking({
                movie: m,
                cinema: CINEMAS[0],
                date: 'Hôm nay',
                timeSlot: '19:30'
              })}
            />
          ))}
        </div>
      </section>

      {/* 2-Column Section: Phim sắp chiếu & Top BXH */}
      <div className="home-columns-grid">
        <div>
          <div className="section-header">
            <div className="section-title">
              <Sparkles className="section-title-icon" size={22} />
              <span>Phim sắp chiếu</span>
            </div>
            <Link to="/movies?status=soon" className="section-view-all">
              Xem tất cả <ChevronRight size={16} />
            </Link>
          </div>

          <div className="movie-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}>
            {comingSoon.map(movie => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onBookTicket={(m) => onOpenBooking({
                  movie: m,
                  cinema: CINEMAS[0],
                  date: 'Dự kiến',
                  timeSlot: '18:00'
                })}
              />
            ))}
          </div>
        </div>

        {/* Right Sidebar Leaderboard */}
        <div>
          <div className="top-movies-panel">
            <div className="section-title" style={{ fontSize: '1.15rem', marginBottom: 16 }}>
              <Trophy className="section-title-icon" size={20} />
              <span>Top phim được yêu thích</span>
            </div>

            {topMovies.map((m, idx) => (
              <div key={m.id} className="top-movie-item">
                <div className={`top-movie-rank rank-${idx + 1}`}>{idx + 1}</div>
                <Link to={`/movies/${m.id}`}>
                  <img src={m.posterUrl} alt={m.title} className="top-movie-thumb" />
                </Link>
                <div className="top-movie-details" style={{ flex: 1 }}>
                  <Link to={`/movies/${m.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="top-movie-name">
                      {m.ageRating && (
                        <span className={`age-chip age-${m.ageRating.toLowerCase()}`} style={{ marginRight: 4 }}>
                          {m.ageRating}
                        </span>
                      )}
                      {m.title}
                    </div>
                  </Link>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: "0.78rem" }}>
                      <Clock size={11} />
                      <span>{m.duration} phút</span>
                      <span>•</span>
                      <span>{m.genre?.[0] || "Phim"}</span>
                    </div>
                    <button
                      type="button"
                      className="btn-book-ticket"
                      style={{ width: "auto", padding: "3px 10px", fontSize: "0.75rem", borderRadius: "4px" }}
                      onClick={() => onOpenBooking({
                        movie: m,
                        cinema: CINEMAS[0],
                        date: "Hôm nay",
                        timeSlot: "19:30"
                      })}
                    >
                      Đặt vé
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="special-promo-card">
              <div className="special-promo-title">Ưu đãi đặc biệt</div>
              <div className="special-promo-desc">Combo bắp nước giảm đến 50%</div>
              <Link to="/promotions" className="btn-primary" style={{ width: '100%', fontSize: '0.85rem', padding: '8px 14px' }}>
                Xem ngay
              </Link>
            </div>
          </div>
        </div>
      </div>
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