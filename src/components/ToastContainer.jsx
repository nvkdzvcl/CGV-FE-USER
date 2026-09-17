/**
 * ToastContainer.jsx
 * Hiển thị danh sách toast notifications. Đặt một lần trong App.jsx.
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import toast from '../services/toastService';

const ICONS = {
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
};

function ToastItem({ id, type, message, duration }) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const hideTimer = setTimeout(() => triggerExit(), duration);
    return () => clearTimeout(hideTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  function triggerExit() {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      toast.dismiss(id);
    }, 350);
  }

  if (!visible) return null;

  return (
    <div className={`toast-item toast-${type} ${exiting ? 'toast-exit' : 'toast-enter'}`}>
      <span className="toast-icon">{ICONS[type]}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={triggerExit} aria-label="Đóng">
        <X size={14} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = toast.subscribe((event) => {
      if (event.action === 'ADD') {
        setToasts((prev) => [...prev, event.toast]);
      } else if (event.action === 'REMOVE') {
        setToasts((prev) => prev.filter((t) => t.id !== event.id));
      }
    });
    return unsubscribe;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} />
      ))}
    </div>
  );
}
