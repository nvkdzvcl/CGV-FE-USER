import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SeatPickerModal from './components/SeatPickerModal';
import AuthModal from './components/AuthModal';

import HomePage from './pages/HomePage';
import MoviesPage from './pages/MoviesPage';
import CinemasPage from './pages/CinemasPage';
import PromotionsPage from './pages/PromotionsPage';

// Animated Route Container
function AnimatedRoutes({ onOpenBooking }) {
  const location = useLocation();

  // Smooth scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div key={location.pathname} className="page-transition-wrapper">
      <Routes location={location}>
        <Route path="/" element={<HomePage onOpenBooking={onOpenBooking} />} />
        <Route path="/movies" element={<MoviesPage onOpenBooking={onOpenBooking} />} />
        <Route path="/cinemas" element={<CinemasPage onOpenBooking={onOpenBooking} />} />
        <Route path="/promotions" element={<PromotionsPage />} />
      </Routes>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('cgv_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [authModal, setAuthModal] = useState({ isOpen: false, tab: 'login' });
  const [bookingContext, setBookingContext] = useState(null);

  const handleOpenAuth = (tab = 'login') => {
    setAuthModal({ isOpen: true, tab });
  };

  const handleCloseAuth = () => {
    setAuthModal({ isOpen: false, tab: 'login' });
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('cgv_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất tài khoản?')) {
      setCurrentUser(null);
      localStorage.removeItem('cgv_user');
    }
  };

  const handleOpenBooking = (context) => {
    setBookingContext(context);
  };

  const handleCloseBooking = () => {
    setBookingContext(null);
  };

  return (
    <Router>
      <div className="app-container">
        <Navbar
          currentUser={currentUser}
          onOpenAuth={handleOpenAuth}
          onLogout={handleLogout}
        />

        <main className="main-content">
          <AnimatedRoutes onOpenBooking={handleOpenBooking} />
        </main>

        <Footer />

        {/* Seat Selection & Booking Modal */}
        {bookingContext && (
          <SeatPickerModal
            bookingContext={bookingContext}
            onClose={handleCloseBooking}
            onBookingSuccess={(res) => console.log('Booking successful:', res)}
          />
        )}

        {/* Login / Register Modal */}
        {authModal.isOpen && (
          <AuthModal
            initialTab={authModal.tab}
            onClose={handleCloseAuth}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </div>
    </Router>
  );
}