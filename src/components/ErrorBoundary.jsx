import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const errorContent = (
        <div style={{
          padding: '40px 24px',
          textAlign: 'center',
          color: '#fff',
          background: '#0d121f',
          borderRadius: 16,
          border: '1px solid rgba(239,68,68,0.3)',
          margin: '40px auto',
          maxWidth: 520,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
        }}>
          <AlertTriangle size={50} color="#ef4444" />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Đã xảy ra sự cố khi hiển thị giao diện</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.5, wordBreak: 'break-word' }}>
            {this.state.error?.message || 'Có lỗi phát sinh trong quá trình xử lý.'}
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              onClick={this.handleReset}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px' }}
            >
              <RefreshCw size={16} />
              <span>Thử lại</span>
            </button>
            {this.props.onReset && (
              <button
                onClick={this.props.onReset}
                className="btn-secondary"
                style={{ padding: '10px 20px' }}
              >
                Đóng
              </button>
            )}
          </div>
        </div>
      );

      if (this.props.onReset) {
        return (
          <div className="modal-backdrop" onClick={this.handleReset}>
            <div onClick={e => e.stopPropagation()}>
              {errorContent}
            </div>
          </div>
        );
      }

      return errorContent;
    }
    return this.props.children;
  }
}
