import React, { useEffect, useState, useRef } from "react";
import { X, RotateCw } from "lucide-react";

export default function TrailerModal({ isOpen, onClose, trailerUrl, videoUrl, title, movieTitle }) {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isVirtualLandscape, setIsVirtualLandscape] = useState(false);
  const hideTimerRef = useRef(null);

  const activeUrl = trailerUrl || videoUrl;
  const activeTitle = title || movieTitle || 'Phim';

  const resetHideTimer = () => {
    setIsHeaderVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setIsHeaderVisible(false);
    }, 2800);
  };

  // Tự động xoay ngang màn hình khi xem trên điện thoại di động
  useEffect(() => {
    if (!isOpen) {
      setIsVirtualLandscape(false);
      return;
    }

    const isMobile = window.innerWidth <= 768;
    const isPortrait = window.innerHeight > window.innerWidth;

    // 1. Thử khóa hướng màn hình xoay ngang (Screen Orientation API)
    const lockScreenOrientation = async () => {
      try {
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock("landscape");
        }
      } catch {
        // Fallback: nếu trình duyệt chặn lock orientation, tự động áp dụng chế độ xoay ngang CSS 16:9
        if (isMobile && isPortrait) {
          setIsVirtualLandscape(true);
        }
      }
    };

    lockScreenOrientation();

    // Mặc định tự động xoay ngang nếu mở trên điện thoại đang cầm dọc
    if (isMobile && isPortrait) {
      setIsVirtualLandscape(true);
    }

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    resetHideTimer();

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (screen.orientation && screen.orientation.unlock) {
        try { screen.orientation.unlock(); } catch {}
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen || !activeUrl) return null;

  // Đảm bảo activeUrl là URL embed dạng https://www.youtube.com/embed/... chất lượng 1080p
  let embedUrl = activeUrl;
  const match = activeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (match && match[1]) {
    embedUrl = `https://www.youtube.com/embed/${match[1]}?autoplay=1&vq=hd1080&hd=1&rel=0&modestbranding=1&controls=1`;
  } else if (!activeUrl.includes("vq=")) {
    embedUrl = activeUrl.includes("?") 
      ? `${activeUrl}&autoplay=1&vq=hd1080&hd=1&rel=0&modestbranding=1&controls=1` 
      : `${activeUrl}?autoplay=1&vq=hd1080&hd=1&rel=0&modestbranding=1&controls=1`;
  }

  const toggleRotate = (e) => {
    e.stopPropagation();
    setIsVirtualLandscape(prev => !prev);
    resetHideTimer();
  };

  return (
    <div className="trailer-modal-backdrop" onClick={onClose} onMouseMove={resetHideTimer}>
      <div 
        className={`trailer-modal-wrapper ${isVirtualLandscape ? "virtual-landscape" : ""}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className={`trailer-modal-topbar ${isHeaderVisible ? "visible" : "hidden"}`}
          onMouseEnter={() => {
            setIsHeaderVisible(true);
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
          }}
          onMouseLeave={resetHideTimer}
        >
          <div className="trailer-modal-title-wrap">
            <span className="trailer-badge">TRAILER CHÍNH THỨC</span>
            <h3 className="trailer-modal-title" title={activeTitle}>{activeTitle}</h3>
          </div>

          <div className="trailer-modal-actions">
            <button
              type="button"
              className="trailer-modal-rotate-btn"
              onClick={toggleRotate}
              title={isVirtualLandscape ? "Chuyển về màn hình dọc" : "Xoay ngang màn hình"}
            >
              <RotateCw size={15} />
              <span className="rotate-btn-text">{isVirtualLandscape ? "Màn dọc" : "Xoay ngang"}</span>
            </button>

            <button 
              type="button"
              className="trailer-modal-close-btn" 
              onClick={onClose} 
              title="Đóng Trailer (Phím Esc)"
            >
              <X size={17} />
              <span>Đóng</span>
            </button>
          </div>
        </div>

        <div className="trailer-modal-video-frame">
          <iframe
            src={embedUrl}
            title={`Trailer ${activeTitle}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="trailer-iframe"
          />
        </div>
      </div>
    </div>
  );
}
