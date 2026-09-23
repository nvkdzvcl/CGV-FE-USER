import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SeatPickerModal from './components/SeatPickerModal';
import MovieScheduleModal from './components/MovieScheduleModal';
import AuthModal from './components/AuthModal';
import ToastContainer from './components/ToastContainer';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { ApiService } from './services/api';

import HomePage from './pages/HomePage';
import MoviesPage from './pages/MoviesPage';
import CinemasPage from './pages/CinemasPage';
import PromotionsPage from './pages/PromotionsPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import ProfilePage from './pages/ProfilePage';
import MovieDetailPage from './pages/MovieDetailPage';
import VnpayReturnPage from './pages/VnpayReturnPage';

// ─────────────────────────────────────────────
// Inner App (cần phải nằm bên trong AuthProvider)
// ─────────────────────────────────────────────
function AppContent() {
  const { currentUser, logoutUser } = useAuth();
  const [authModal, setAuthModal] = useState({ isOpen: false, tab: 'login' });
  const [scheduleMovie, setScheduleMovie] = useState(null);
  const [bookingContext, setBookingContext] = useState(null);

  // Tự động rollback / hủy đơn vé đang chờ nếu người dùng back về từ cổng thanh toán VNPay
  useEffect(() => {
    const checkAndRollbackAbandonedCheckout = () => {
      const activeCheckoutStr = sessionStorage.getItem('cgv_active_checkout');
      if (activeCheckoutStr) {
        if (!window.location.pathname.includes('/vnpay-return')) {
          try {
            const checkout = JSON.parse(activeCheckoutStr);
            sessionStorage.removeItem('cgv_active_checkout');
            if (checkout?.bookingId) {
              console.log('Phát hiện người dùng rời cổng thanh toán VNPay, tự động hủy đơn và giải phóng ghế:', checkout.bookingId);
              ApiService.cancelBooking(checkout.bookingId).catch(err => {
                console.warn('Lỗi rollback booking dang dở:', err);
              });
            }
          } catch (e) {
            sessionStorage.removeItem('cgv_active_checkout');
          }
        }
      }
    };

    window.addEventListener('pageshow', checkAndRollbackAbandonedCheckout);
    window.addEventListener('focus', checkAndRollbackAbandonedCheckout);
    checkAndRollbackAbandonedCheckout();

    return () => {
      window.removeEventListener('pageshow', checkAndRollbackAbandonedCheckout);
      window.removeEventListener('focus', checkAndRollbackAbandonedCheckout);
    };
  }, []);

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
    // Nếu đã có suất chiếu thật từ QuickBooking hoặc MovieScheduleModal, mở thẳng màn hình chọn ghế
    if (context?.showtimeId || context?.showtime?.id) {
      setBookingContext(context);
      return;
    }
    // Nếu chưa chọn suất, mở Lịch chiếu chuẩn CGV (chọn ngày, rạp gần tôi, suất chiếu)
    if (context?.movie) {
      setScheduleMovie(context.movie);
      return;
    }
    if (!currentUser) {
      handleOpenAuth('login');
      return;
    }
    setBookingContext(context);
  };

  const handleSelectShowtime = (ctx) => {
    setScheduleMovie(null);
    setBookingContext(ctx);
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
          <Route path="/movies/:id" element={<MovieDetailPage onOpenBooking={handleOpenBooking} />} />
          <Route path="/cinemas" element={<CinemasPage onOpenBooking={handleOpenBooking} />} />
          <Route path="/promotions" element={<PromotionsPage />} />
          {/* OAuth callback route - xử lý redirect từ Keycloak */}
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
          {/* VNPAY payment return route */}
          <Route path="/payment/vnpay-return" element={<VnpayReturnPage />} />
          {/* User profile route */}
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </main>

      <Footer />

      {/* 1. Modal Lịch chiếu chuẩn CGV (Chọn ngày, chọn khu vực, rạp gần tôi) */}
      {scheduleMovie && (
        <MovieScheduleModal
          movie={scheduleMovie}
          onClose={() => setScheduleMovie(null)}
          onSelectShowtime={handleSelectShowtime}
        />
      )}

      {/* 2. Modal Chọn ghế Realtime & Thanh toán */}
      {bookingContext && (
        <ErrorBoundary onReset={handleCloseBooking}>
          <SeatPickerModal
            bookingContext={bookingContext}
            onClose={handleCloseBooking}
            onOpenAuth={handleOpenAuth}
            onBookingSuccess={(res) => console.log('Booking successful:', res)}
          />
        </ErrorBoundary>
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
      <ErrorBoundary>
        {/* AuthProvider quản lý global auth state */}
        <AuthProvider>
          <AppContent />
          {/* ToastContainer phải trong Router để có thể navigate */}
          <ToastContainer />
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}