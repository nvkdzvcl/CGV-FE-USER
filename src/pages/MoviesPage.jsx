import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Film, Filter, X, Flame } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import { MOVIES, CINEMAS } from '../data/mockData';

const ALL_GENRES = [
  'Hành động', 'Phiêu lưu', 'Kinh dị', 'Tâm lý', 'Hài hước',
  'Tình cảm', 'Hoạt hình', 'Khoa học viễn tưởng', 'Gia đình'
];
const ALL_COUNTRIES = ['Việt Nam', 'Mỹ', 'Hàn Quốc', 'Nhật Bản'];

export default function MoviesPage({ onOpenBooking }) {
  const [searchParams] = useSearchParams();
  const searchQ = searchParams.get('q') || '';
  const initialStatus = searchParams.get('status') === 'soon' ? 'COMING_SOON' : 'ALL';

  const [activeTab, setActiveTab] = useState(initialStatus);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const filteredMovies = useMemo(() => {
    return MOVIES.filter(m => {
      // Search term
      if (searchQ && !m.title.toLowerCase().includes(searchQ.toLowerCase())) {
        return false;
      }
      // Status
      if (activeTab === 'NOW_SHOWING' && m.showingStatus !== 'NOW_SHOWING') return false;
      if (activeTab === 'COMING_SOON' && m.showingStatus !== 'COMING_SOON') return false;
      // Genres
      if (selectedGenres.length > 0) {
        const hasGenre = selectedGenres.some(g => m.genre?.includes(g));
        if (!hasGenre) return false;
      }
      // Country
      if (selectedCountry !== 'ALL' && m.country !== selectedCountry) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0; // default order
    });
  }, [searchQ, activeTab, selectedGenres, selectedCountry, sortBy]);

  return (
    <div className="movies-page">
      <div className="page-with-sidebar">
        {/* Left Filter Sidebar */}
        <aside className="filter-sidebar">
          <div className="filter-group">
            <div className="filter-title">Trạng thái</div>
            <div className="filter-nav-list">
              <div
                className={`filter-nav-item ${activeTab === 'ALL' ? 'active' : ''}`}
                onClick={() => setActiveTab('ALL')}
              >
                <Film size={16} /> Tất cả phim
              </div>
              <div
                className={`filter-nav-item ${activeTab === 'NOW_SHOWING' ? 'active' : ''}`}
                onClick={() => setActiveTab('NOW_SHOWING')}
              >
                <Flame size={16} /> Phim đang chiếu
              </div>
              <div
                className={`filter-nav-item ${activeTab === 'COMING_SOON' ? 'active' : ''}`}
                onClick={() => setActiveTab('COMING_SOON')}
              >
                <Film size={16} /> Phim sắp chiếu
              </div>
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-title">Thể loại</div>
            {ALL_GENRES.map(g => (
              <label key={g} className="filter-checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedGenres.includes(g)}
                  onChange={() => toggleGenre(g)}
                />
                {g}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <div className="filter-title">Quốc gia</div>
            <label className="filter-radio-label">
              <input
                type="radio"
                name="country"
                checked={selectedCountry === 'ALL'}
                onChange={() => setSelectedCountry('ALL')}
              />
              Tất cả quốc gia
            </label>
            {ALL_COUNTRIES.map(c => (
              <label key={c} className="filter-radio-label">
                <input
                  type="radio"
                  name="country"
                  checked={selectedCountry === c}
                  onChange={() => setSelectedCountry(c)}
                />
                {c}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <div className="filter-title">Sắp xếp theo</div>
            <label className="filter-radio-label">
              <input
                type="radio"
                name="sort"
                checked={sortBy === 'newest'}
                onChange={() => setSortBy('newest')}
              />
              Mới nhất
            </label>
            <label className="filter-radio-label">
              <input
                type="radio"
                name="sort"
                checked={sortBy === 'rating'}
                onChange={() => setSortBy('rating')}
              />
              Đánh giá cao nhất
            </label>
          </div>
        </aside>

        {/* Right Content */}
        <main>
          <div className="movies-header">
            <h2 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: 12 }}>
              {searchQ ? `Kết quả tìm kiếm cho "${searchQ}"` : 'Danh mục phim điện ảnh'}
            </h2>

            {/* Active Filters */}
            {(selectedGenres.length > 0 || selectedCountry !== 'ALL' || searchQ) && (
              <div className="active-filters-bar">
                {selectedGenres.map(g => (
                  <span key={g} className="active-filter-pill">
                    {g} <X size={12} style={{ cursor: 'pointer' }} onClick={() => toggleGenre(g)} />
                  </span>
                ))}
                {selectedCountry !== 'ALL' && (
                  <span className="active-filter-pill">
                    {selectedCountry} <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSelectedCountry('ALL')} />
                  </span>
                )}
                <span
                  className="btn-clear-filters"
                  onClick={() => { setSelectedGenres([]); setSelectedCountry('ALL'); }}
                >
                  Xóa tất cả bộ lọc
                </span>
              </div>
            )}
          </div>

          {filteredMovies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <Film size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>Không tìm thấy phim phù hợp với bộ lọc hiện tại.</p>
            </div>
          ) : (
            <div className="movies-grid-full">
              {filteredMovies.map(movie => (
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
          )}
        </main>
      </div>
    </div>
  );
}