/**
 * toastService.js
 * Lightweight event-bus cho toast notifications.
 * Không cần thư viện ngoài. Components subscribe/emit qua EventEmitter đơn giản.
 */

const listeners = new Set();

let toastIdCounter = 0;

/**
 * @typedef {'success'|'error'|'warning'|'info'} ToastType
 * @typedef {{ id: number, type: ToastType, message: string, duration?: number }} Toast
 */

/**
 * Phát sự kiện toast mới.
 * @param {ToastType} type
 * @param {string} message
 * @param {number} [duration=4000]
 */
function emit(type, message, duration = 4000) {
  const toast = { id: ++toastIdCounter, type, message, duration };
  listeners.forEach((fn) => fn({ action: 'ADD', toast }));
}

/**
 * Yêu cầu xóa toast theo id.
 * @param {number} id
 */
function dismiss(id) {
  listeners.forEach((fn) => fn({ action: 'REMOVE', id }));
}

/**
 * Đăng ký lắng nghe sự kiện toast.
 * @param {(event: { action: string, toast?: Toast, id?: number }) => void} fn
 * @returns {() => void} unsubscribe
 */
function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const toast = {
  success: (msg, duration) => emit('success', msg, duration),
  error: (msg, duration) => emit('error', msg, duration),
  warning: (msg, duration) => emit('warning', msg, duration),
  info: (msg, duration) => emit('info', msg, duration),
  dismiss,
  subscribe,
};

export default toast;
