import React from 'react';
import { Star, Clock } from 'lucide-react';

export default function MovieCard({ movie, onBookTicket }) {
  const isNowShowing = movie.showingStatus === 'NOW_SHOWING';

  return (
    <div className="movie-card">
      <div className="movie-poster-wrapper">
        <img src={movie.posterUrl} alt={movie.title} className="movie-poster" loading="lazy" />
        <div className="movie-badge-status">
          <span className={isNowShowing ? 'badge-tag' : 'badge-outline'}>
            {isNowShowing ? 'Đang chiếu' : `Dự kiến ${movie.releaseDate || ''}`}
          </span>
        </div>
      </div>

      <div className="movie-info">
        <h4 className="movie-title" title={movie.title}>{movie.title}</h4>
        
        <div className="movie-stats">
          <span className="movie-rating">
            <Star size={13} fill="#fbbf24" stroke="none" />
            {movie.rating} <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({movie.votes})</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock size={12} /> {movie.duration}m
          </span>
        </div>

        <div className="movie-genres">
          {movie.genre?.slice(0, 2).map((g, i) => (
            <span key={i} className="badge-outline">{g}</span>
          ))}
        </div>

        <button
          className="btn-book-ticket"
          onClick={() => onBookTicket && onBookTicket(movie)}
        >
          {isNowShowing ? 'Đặt vé' : 'Xem chi tiết'}
        </button>
      </div>
    </div>
  );
}