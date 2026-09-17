import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SeatPickerModal from './components/SeatPickerModal';
import AuthModal from './components/AuthModal';
import ToastContainer from './components/ToastContainer';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';

import HomePage from './pages/HomePage';
import MoviesPage from './pages/MoviesPage';
import CinemasPage from './pages/CinemasPage';
import PromotionsPage from './pages/PromotionsPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';

// ─────────────────────────────────────────────
// Inner App (cần phải nằm bên trong AuthProvider)
// ─────────────────────────────────────────────
function AppContent() {
  const { currentUser, logoutUser } = useAuth();
  const [authModal, setAuthModal] = useState({ isOpen: false, tab: 'login' });
  const [bookingContext, setBookingContext] = useState(null);

  const handleOpenAuth = (tab = 'login') => {
    setAuthModal({ isOpen: true, tab });
  };

  const handleCloseAuth = () => {
    setAuthModal({ isOpen: false, tab: 'login' });
  };

  const handleLogout = async () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất tài khoản?')) {
      await logoutUser();
    }
  };

  const handleOpenBooking = (context) => {
    if (!currentUser) {
      handleOpenAuth('login');
      return;
    }
    setBookingContext(context);
  };

  const handleCloseBooking = () => {
    setBookingContext(null);
  };

  return (
    <div className="app-container">
      <Navbar
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage onOpenBooking={handleOpenBooking} />} />
          <Route path="/movies" element={<MoviesPage onOpenBooking={handleOpenBooking} />} />
          <Route path="/cinemas" element={<CinemasPage onOpenBooking={handleOpenBooking} />} />
          <Route path="/promotions" element={<PromotionsPage />} />
          {/* OAuth callback route - xử lý redirect từ Keycloak */}
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        </Routes>
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
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Root App với Providers
// ─────────────────────────────────────────────
export default function App() {
  return (
    <Router>
      {/* AuthProvider quản lý global auth state */}
      <AuthProvider>
        <AppContent />
        {/* ToastContainer phải trong Router để có thể navigate */}
        <ToastContainer />
      </AuthProvider>
    </Router>
  );
}