/**
 * SocialSyncModal.jsx
 * Modal hiện ra sau khi đăng nhập Google/Facebook thành công.
 * Nếu user chưa có fullName trong JWT, yêu cầu nhập.
 * Sau khi submit, gọi updateUser để cập nhật state.
 */

import React, { useState } from 'react';
import { User, X, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from '../services/toastService';

import { socialSync, removeVietnameseDiacritics } from '../services/authService';

/**
 * @param {{ accessToken: string, onSuccess?: (user: any) => void, onClose: () => void }} props
 */
export default function SocialSyncModal({ accessToken, onSuccess, onClose }) {
  const { currentUser, updateUser } = useAuth();
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const name = fullName.trim();
    if (!name || name.length < 2) {
      toast.warning('Vui lòng nhập họ và tên hợp lệ (ít nhất 2 ký tự).');
      return;
    }

    setLoading(true);
    try {
      const cleanName = removeVietnameseDiacritics(name);
      // Gọi backend để lưu fullName vào DB cho tài khoản này
      const updatedUser = await socialSync(accessToken, cleanName);

      // Cập nhật auth state trong frontend
      updateUser({
        ...currentUser,
        fullName: updatedUser?.fullName || cleanName,
      });

      toast.success(`Chào mừng, ${updatedUser?.fullName || cleanName}! Đăng nhập thành công! 🎉`);
      if (onSuccess) {
        onSuccess(updatedUser);
      } else {
        onClose();
      }
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="auth-modal-box social-sync-modal" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="modal-close-btn"
          aria-label="Đóng"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="social-sync-header">
          <div className="social-sync-icon-wrap">
            <Sparkles size={28} className="social-sync-icon" />
          </div>
          <h3 className="social-sync-title">Hoàn tất hồ sơ</h3>
          <p className="social-sync-subtitle">
            Cho chúng tôi biết tên bạn để trải nghiệm tốt hơn nhé!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="social-sync-form">
          <div className="auth-form-group">
            <label className="auth-label">
              <User size={14} style={{ display: 'inline', marginRight: 4 }} />
              Họ và tên của bạn
            </label>
            <input
              type="text"
              className="auth-input"
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="spinner-sm" />
                Đang lưu...
              </span>
            ) : (
              'Hoàn tất & Vào hệ thống 🚀'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
