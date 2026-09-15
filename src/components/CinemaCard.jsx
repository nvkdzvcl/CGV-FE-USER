import React from 'react';
import { Star, MapPin, Navigation } from 'lucide-react';

export default function CinemaCard({ cinema, onSelectCinema, isSelected }) {
  return (
    <div className={`cinema-card ${isSelected ? 'selected' : ''}`}>
      <img src={cinema.image} alt={cinema.name} className="cinema-card-img" loading="lazy" />
      <div className="cinema-card-body">
        <h4 className="cinema-card-name">{cinema.name}</h4>
        
        <div className="cinema-card-info">
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fbbf24', fontWeight: 700 }}>
            <Star size={13} fill="#fbbf24" stroke="none" />
            {cinema.rating} ({cinema.reviews})
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Navigation size={12} color="var(--primary)" />
            {cinema.distance}
          </span>
        </div>

        <div className="cinema-card-tags">
          {cinema.facilities?.slice(0, 3).map((f, i) => (
            <span key={i} className="badge-outline">{f}</span>
          ))}
        </div>

        <button
          className="btn-primary"
          style={{ width: '100%', fontSize: '0.85rem', padding: '8px 12px' }}
          onClick={() => onSelectCinema && onSelectCinema(cinema)}
        >
          Xem suất chiếu
        </button>
      </div>
    </div>
  );
}