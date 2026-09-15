import React, { useState } from 'react';
import { MapPin, Navigation, Star, Clock, Calendar, Film } from 'lucide-react';
import CinemaCard from '../components/CinemaCard';
import { CINEMAS, REGIONS, MOVIES, SHOWTIME_SLOTS } from '../data/mockData';

export default function CinemasPage({ onOpenBooking }) {
  const [selectedRegionId, setSelectedRegionId] = useState(2); // TP.HCM
  const [selectedCinema, setSelectedCinema] = useState(CINEMAS[0]);
  const [activeDateTab, setActiveDateTab] = useState('Hôm nay');

  const filteredCinemas = selectedRegionId === 1
    ? CINEMAS
    : CINEMAS.filter(c => c.regionId === selectedRegionId);

  const heroCinema = CINEMAS[0];
  const nowShowingMovies = MOVIES.filter(m => m.showingStatus === 'NOW_SHOWING');

  const handleSelectShowtime = (movie, timeSlot) => {
    onOpenBooking({
      movie,
      cinema: selectedCinema,
      date: activeDateTab,
      timeSlot
    });
  };

  return (
    <div className="cinemas-page">
      <div className="page-with-sidebar">
        {/* Left Filter Sidebar */}
        <aside className="filter-sidebar">
          <div className="filter-group">
            <div className="filter-title">Khu vực rạp</div>
            <div className="filter-nav-list">
              {REGIONS.map(r => (
                <div
                  key={r.id}
                  className={`filter-nav-item ${selectedRegionId === r.id ? 'active' : ''}`}
                  onClick={() => setSelectedRegionId(r.id)}
                >
                  <MapPin size={16} /> {r.name}
                </div>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-title">Tiện ích rạp</div>
            {['IMAX', '4DX', 'Dolby Atmos', 'Ghế đôi', 'Bãi đỗ xe', 'Đặt vé online'].map(f => (
              <label key={f} className="filter-checkbox-label">
                <input type="checkbox" defaultChecked />
                {f}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <div className="filter-title">Sắp xếp theo</div>
            <label className="filter-radio-label">
              <input type="radio" name="cin-sort" defaultChecked />
              Gần bạn nhất
            </label>
            <label className="filter-radio-label">
              <input type="radio" name="cin-sort" />
              Đánh giá cao nhất
            </label>
            <label className="filter-radio-label">
              <input type="radio" name="cin-sort" />
              Nhiều suất chiếu
            </label>
          </div>
        </aside>

        {/* Right Main Content */}
        <main>
          {/* Cinema Hero Spotlight */}
          <div className="cinema-hero">
            <img src={heroCinema.image} alt={heroCinema.name} className="cinema-hero-img" />
            <div className="cinema-hero-overlay">
              <span className="badge-tag" style={{ width: 'fit-content', marginBottom: 8 }}>
                Rạp nổi bật
              </span>
              <h2 className="cinema-hero-title">{heroCinema.name}</h2>
              <div className="cinema-hero-addr">
                <MapPin size={16} color="var(--primary)" />
                {heroCinema.address}
              </div>

              <div className="cinema-hero-facilities">
                {heroCinema.facilities.map((f, i) => (
                  <span key={i} className="badge-outline">{f}</span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  className="btn-primary"
                  onClick={() => setSelectedCinema(heroCinema)}
                >
                  <Calendar size={16} />
                  Xem lịch chiếu
                </button>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(heroCinema.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                >
                  <Navigation size={16} />
                  Chỉ đường
                </a>
              </div>
            </div>
          </div>

          {/* Rạp gần bạn */}
          <div className="section-header">
            <div className="section-title">
              <Navigation className="section-title-icon" size={22} />
              <span>Rạp chiếu tại khu vực ({filteredCinemas.length})</span>
            </div>
          </div>

          <div className="cinemas-list-grid">
            {filteredCinemas.map(c => (
              <CinemaCard
                key={c.id}
                cinema={c}
                isSelected={selectedCinema.id === c.id}
                onSelectCinema={(cin) => setSelectedCinema(cin)}
              />
            ))}
          </div>

          {/* Lịch chiếu theo rạp */}
          <section className="schedule-section">
            <div className="schedule-cinema-header">
              <div>
                <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: 4 }}>
                  Lịch chiếu tại {selectedCinema.name}
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {selectedCinema.address}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {selectedCinema.facilities.map((f, i) => (
                  <span key={i} className="badge-outline">{f}</span>
                ))}
              </div>
            </div>

            {/* Date Tabs */}
            <div className="date-tabs">
              {['Hôm nay', 'Ngày mai', 'Thứ 5 (17.09)', 'Thứ 6 (18.09)', 'Thứ 7 (19.09)'].map(d => (
                <div
                  key={d}
                  className={`date-tab ${activeDateTab === d ? 'active' : ''}`}
                  onClick={() => setActiveDateTab(d)}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Movie Schedule List */}
            {nowShowingMovies.map(movie => (
              <div key={movie.id} className="schedule-movie-row">
                <div className="schedule-movie-meta">
                  <img src={movie.posterUrl} alt={movie.title} className="schedule-movie-thumb" />
                  <div>
                    <h4 className="schedule-movie-title">{movie.title}</h4>
                    <div className="schedule-movie-duration">{movie.duration} phút • {movie.ageRating}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {movie.language}
                    </div>
                  </div>
                </div>

                <div className="schedule-slots">
                  {SHOWTIME_SLOTS.map(slot => (
                    <button
                      key={slot}
                      className="slot-btn"
                      onClick={() => handleSelectShowtime(movie, slot)}
                      title="Bấm để chọn ghế"
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}