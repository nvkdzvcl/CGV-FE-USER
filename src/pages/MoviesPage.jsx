import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Film, Flame, RotateCcw, X, SlidersHorizontal } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import { MOVIES, CINEMAS } from '../data/mockData';
import { ApiService } from '../services/api';

const ALL_GENRES = [
  'Hành động', 'Phiêu lưu', 'Kinh dị', 'Tâm lý', 'Hài hước',
  'Tình cảm', 'Hoạt hình', 'Khoa học viễn tưởng', 'Gia đình'
];
const ALL_COUNTRIES = ['Việt Nam', 'Mỹ', 'Hàn Quốc', 'Nhật Bản'];
const ALL_AGE_RATINGS = [
  { code: 'ALL', label: 'Tất cả độ tuổi' },
  { code: 'P', label: 'P — Phổ biến mọi lứa tuổi', chipClass: 'age-p' },
  { code: 'T13', label: 'T13 — Khán giả từ 13+ tuổi', chipClass: 'age-t13' },
  { code: 'T16', label: 'T16 — Khán giả từ 16+ tuổi', chipClass: 'age-t16' },
  { code: 'T18', label: 'T18 — Khán giả từ 18+ tuổi', chipClass: 'age-t18' },
];

export default function MoviesPage({ onOpenBooking }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQ = searchParams.get('q') || '';
  const initialStatus = searchParams.get('status') === 'soon' ? 'COMING_SOON' : 'ALL';

  const [movieList, setMovieList] = useState(MOVIES);
  const [activeTab, setActiveTab] = useState(initialStatus);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('ALL');
  const [selectedAge, setSelectedAge] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    ApiService.getMovies().then(res => {
      if (Array.isArray(res) && res.length > 0) {
        setMovieList(res);
      }
    }).catch(e => console.warn('Using fallback movies in MoviesPage:', e.message));
  }, []);

  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const clearAllFilters = () => {
    setSelectedGenres([]);
    setSelectedCountry('ALL');
    setSelectedAge('ALL');
    if (searchQ) {
      setSearchParams({});
    }
  };

  const hasActiveFilters = selectedGenres.length > 0 || selectedCountry !== 'ALL' || selectedAge !== 'ALL' || Boolean(searchQ);
  const selectedAgeConfig = ALL_AGE_RATINGS.find(a => a.code === selectedAge);

  const filteredMovies = useMemo(() => {
    return movieList.filter(m => {
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
      // Age Rating
      if (selectedAge !== 'ALL' && m.ageRating !== selectedAge) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === 'duration-desc') return (b.durationMinutes || b.duration || 0) - (a.durationMinutes || a.duration || 0);
      if (sortBy === 'duration-asc') return (a.durationMinutes || a.duration || 0) - (b.durationMinutes || b.duration || 0);
      return 0; // default newest
    });
  }, [searchQ, activeTab, selectedGenres, selectedCountry, selectedAge, sortBy]);

  return (
    <div className="movies-page">
      <div className="page-with-sidebar">
        {/* Left Filter Sidebar */}
        <aside className={`filter-sidebar ${mobileFilterOpen ? "mobile-open" : ""}`}>
          <div className="mobile-filter-header">
            <span style={{ fontWeight: 700, color: "#fff" }}>Bộ lọc tìm kiếm</span>
            <button type="button" className="btn-mobile-filter-close" onClick={() => setMobileFilterOpen(false)}><X size={18} /></button>
          </div>
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
            <div className="filter-title">Độ tuổi (Phân loại)</div>
            {ALL_AGE_RATINGS.map(item => (
              <label key={item.code} className="filter-radio-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="radio"
                  name="ageRating"
                  checked={selectedAge === item.code}
                  onChange={() => setSelectedAge(item.code)}
                />
                {item.chipClass && (
                  <span className={`age-chip ${item.chipClass}`} style={{ fontSize: '0.65rem', padding: '0 5px' }}>
                    {item.code}
                  </span>
                )}
                <span>{item.label}</span>
              </label>
            ))}
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
                checked={sortBy === 'duration-desc'}
                onChange={() => setSortBy('duration-desc')}
              />
              Thời lượng (Dài nhất)
            </label>
            <label className="filter-radio-label">
              <input
                type="radio"
                name="sort"
                checked={sortBy === 'duration-asc'}
                onChange={() => setSortBy('duration-asc')}
              />
              Thời lượng (Ngắn nhất)
            </label>
          </div>
        </aside>

        {/* Right Content */}
        <main>
          <div className="movies-header">
            <div className="movies-header-top">
              <div className="movies-title-group">
                <h2 className="movies-title">
                  {searchQ ? `Kết quả tìm kiếm cho "${searchQ}"` : 'Danh mục phim điện ảnh'}
                </h2>
                <span className="movies-count-badge">({filteredMovies.length} phim)</span>
              </div>

              <button
                type="button"
                className="btn-mobile-filter-toggle"
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              >
                <SlidersHorizontal size={16} />
                <span>Bộ lọc {hasActiveFilters ? "(Đang chọn)" : ""}</span>
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  className="btn-clear-all-filters"
                  onClick={clearAllFilters}
                  title="Đặt lại toàn bộ bộ lọc"
                >
                  <RotateCcw size={13} />
                  <span>Xóa bộ lọc</span>
                </button>
              )}
            </div>

            {/* Active Filter Chips Bar */}
            {hasActiveFilters && (
              <div className="active-filters-bar">
                <span className="active-filter-label">Đang lọc:</span>

                {selectedAge !== 'ALL' && (
                  <span className="active-filter-chip">
                    <span>Độ tuổi:</span>
                    {selectedAgeConfig?.chipClass && (
                      <span className={`age-chip ${selectedAgeConfig.chipClass}`} style={{ margin: '0 2px' }}>
                        {selectedAge}
                      </span>
                    )}
                    <button
                      type="button"
                      className="active-filter-chip-remove"
                      onClick={() => setSelectedAge('ALL')}
                      title="Bỏ lọc độ tuổi"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {selectedCountry !== 'ALL' && (
                  <span className="active-filter-chip">
                    <span>Quốc gia: {selectedCountry}</span>
                    <button
                      type="button"
                      className="active-filter-chip-remove"
                      onClick={() => setSelectedCountry('ALL')}
                      title="Bỏ lọc quốc gia"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {selectedGenres.map(g => (
                  <span key={g} className="active-filter-chip">
                    <span>{g}</span>
                    <button
                      type="button"
                      className="active-filter-chip-remove"
                      onClick={() => toggleGenre(g)}
                      title={`Bỏ lọc thể loại ${g}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
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