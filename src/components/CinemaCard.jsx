import React, { useMemo } from 'react';
import { Star, MapPin, Navigation } from 'lucide-react';

function getFacilitiesArray(facilities) {
  if (Array.isArray(facilities)) {
    return facilities.map(f => typeof f === 'object' ? (f?.amenity || f?.name || '') : String(f)).filter(Boolean);
  }
  if (typeof facilities === 'string' && facilities.trim()) {
    return facilities.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

export default function CinemaCard({ cinema, onSelectCinema, isSelected }) {
  const cinemaImg = cinema.image || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80';
  const facilitiesList = useMemo(() => {
    const list = getFacilitiesArray(cinema.facilities || cinema.amenities);
    return list.length > 0 ? list : ['2D / 3D', 'Dolby Atmos', 'Ghế Sweetbox'];
  }, [cinema]);

  const distStr = typeof cinema.distance === 'number'
    ? `${cinema.distance.toFixed(1)} km`
    : (cinema.distanceInKm ? `${Number(cinema.distanceInKm).toFixed(1)} km` : (typeof cinema.distance === 'string' ? (cinema.distance.includes('km') ? cinema.distance : `${cinema.distance} km`) : ''));

  return (
    <div className={`cinema-card ${isSelected ? 'selected' : ''}`}>
      <img src={cinemaImg} alt={cinema.name} className="cinema-card-img" loading="lazy" />
      <div className="cinema-card-body">
        <h4 className="cinema-card-name">{cinema.name}</h4>
        
        <div className="cinema-card-info">
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fbbf24', fontWeight: 700 }}>
            <Star size={13} fill="#fbbf24" stroke="none" />
            {cinema.rating || '4.8'} ({cinema.reviews || '2.4k'})
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Navigation size={12} color="var(--primary)" />
            {distStr || cinema.regionName || 'CGV Cinema'}
          </span>
        </div>

        <div className="cinema-card-tags">
          {facilitiesList.slice(0, 3).map((f, i) => (
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