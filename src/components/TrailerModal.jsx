import React, { useEffect } from "react";
import { X } from "lucide-react";

export default function TrailerModal({ isOpen, onClose, trailerUrl, title }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !trailerUrl) return null;

  // Đảm bảo trailerUrl là URL embed dạng https://www.youtube.com/embed/...
  let embedUrl = trailerUrl;
  if (trailerUrl.includes("watch?v=")) {
    const videoId = trailerUrl.split("watch?v=")[1]?.split("&")[0];
    embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  } else if (!trailerUrl.includes("autoplay=")) {
    embedUrl = trailerUrl.includes("?") ? `${trailerUrl}&autoplay=1&rel=0` : `${trailerUrl}?autoplay=1&rel=0`;
  }

  return (
    <div className="trailer-modal-backdrop" onClick={onClose}>
      <div className="trailer-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="trailer-modal-header">
          <h3 className="trailer-modal-title">Trailer: {title}</h3>
          <button className="trailer-modal-close" onClick={onClose} title="Đóng Trailer (Esc)">
            <X size={20} />
          </button>
        </div>
        <div className="trailer-modal-body">
          <iframe
            src={embedUrl}
            title={`Trailer ${title}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="trailer-iframe"
          />
        </div>
      </div>
    </div>
  );
}
