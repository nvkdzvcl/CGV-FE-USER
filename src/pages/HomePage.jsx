import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Play, Ticket, Star, ChevronRight, Sparkles } from 'lucide-react';
import QuickBooking from '../components/QuickBooking';
import MovieCard from '../components/MovieCard';
import { MOVIES, CINEMAS } from '../data/mockData';

export default function HomePage({ onOpenBooking }) {
  const [heroIdx, setHeroIdx] = useState(0);
  const heroMovies = MOVIES.filter(m => m.backdropUrl);
  const currentHero = heroMovies[heroIdx] || MOVIES[0];

  const nowShowing = MOVIES.filter(m => m.showingStatus === 'NOW_SHOWING');
  const comingSoon = MOVIES.filter(m => m.showingStatus === 'COMING_SOON');
  const topMovies = [...nowShowing].sort((a, b) => b.rating - a.rating).slice(0, 5);

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
      {/* Hero Section */}
      <section className="hero-section">
        <img
          src={currentHero.backdropUrl}
          alt={currentHero.title}
          className="hero-backdrop"
        />
        <div className="hero-overlay" />
        
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-tag">
              <Flame size={12} /> Phim đang chiếu
            </span>
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
            {currentHero.trailerUrl && (
              <a
                href={currentHero.trailerUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
              >
                <Play size={16} />
                Xem trailer
              </a>
            )}
          </div>
        </div>

        {/* Carousel indicators */}
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
              <Star className="section-title-icon" size={20} fill="var(--primary)" />
              <span>Top phim được yêu thích</span>
            </div>

            {topMovies.map((m, idx) => (
              <div
                key={m.id}
                className="top-movie-item"
                onClick={() => onOpenBooking({
                  movie: m,
                  cinema: CINEMAS[0],
                  date: 'Hôm nay',
                  timeSlot: '19:30'
                })}
              >
                <div className={`top-movie-rank rank-${idx + 1}`}>{idx + 1}</div>
                <img src={m.posterUrl} alt={m.title} className="top-movie-thumb" />
                <div className="top-movie-details">
                  <div className="top-movie-name">{m.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fbbf24', fontSize: '0.8rem', fontWeight: 700 }}>
                    <Star size={12} fill="#fbbf24" stroke="none" />
                    {m.rating}
                  </div>
                </div>
              </div>
            ))}

            {/* Special Promo Card */}
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
    </div>
  );
}