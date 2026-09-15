import React, { useState } from 'react';
import { Ticket, Search, Calendar, Film, MapPin, Clock } from 'lucide-react';
import { MOVIES, CINEMAS, SHOWTIME_SLOTS } from '../data/mockData';

export default function QuickBooking({ onSelectBooking }) {
  const [selectedMovieId, setSelectedMovieId] = useState(MOVIES[0]?.id || '');
  const [selectedCinemaId, setSelectedCinemaId] = useState(CINEMAS[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState('Hôm nay');
  const [selectedSlot, setSelectedSlot] = useState(SHOWTIME_SLOTS[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const movie = MOVIES.find(m => m.id === selectedMovieId);
    const cinema = CINEMAS.find(c => c.id === selectedCinemaId);
    if (onSelectBooking && movie && cinema) {
      onSelectBooking({
        movie,
        cinema,
        date: selectedDate,
        timeSlot: selectedSlot
      });
    }
  };

  return (
    <form className="quick-booking-container" onSubmit={handleSubmit}>
      <div className="quick-booking-label">
        <Ticket size={22} color="var(--primary)" />
        <div>
          <div>Đặt vé nhanh</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
            Chọn phim, rạp, suất chiếu
          </div>
        </div>
      </div>

      <div className="quick-booking-fields">
        {/* Phim */}
        <div className="qb-field">
          <label>Phim</label>
          <select value={selectedMovieId} onChange={(e) => setSelectedMovieId(e.target.value)}>
            {MOVIES.filter(m => m.showingStatus === 'NOW_SHOWING').map(m => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
        </div>

        {/* Rạp */}
        <div className="qb-field">
          <label>Rạp</label>
          <select value={selectedCinemaId} onChange={(e) => setSelectedCinemaId(e.target.value)}>
            {CINEMAS.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Ngày chiếu */}
        <div className="qb-field">
          <label>Ngày chiếu</label>
          <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
            <option value="Hôm nay">Hôm nay (15.09)</option>
            <option value="Ngày mai">Ngày mai (16.09)</option>
            <option value="Thứ 5">Thứ 5 (17.09)</option>
            <option value="Thứ 6">Thứ 6 (18.09)</option>
          </select>
        </div>

        {/* Suất chiếu */}
        <div className="qb-field">
          <label>Suất chiếu</label>
          <select value={selectedSlot} onChange={(e) => setSelectedSlot(e.target.value)}>
            {SHOWTIME_SLOTS.map(s => (
              <option key={s} value={s}>{s} (2D Vietsub)</option>
            ))}
          </select>
        </div>
      </div>

      <button type="submit" className="btn-qb-submit">
        <Search size={16} />
        Tìm kiếm
      </button>
    </form>
  );
}