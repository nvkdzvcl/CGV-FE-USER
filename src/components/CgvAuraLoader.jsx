import React from 'react';
import '../styles/aura-loader.css';

/**
 * Super Saiyan CGV Aura Loader
 * Inspired by Dragon Ball Super Saiyan golden fiery ki aura.
 *
 * @param {'sm' | 'md' | 'lg'} size - 'sm' for inline/dropdowns, 'md' for cards/modals, 'lg' for full pages
 * @param {string} text - Optional status message below the logo
 * @param {object} style - Extra styles for the container
 */
export default function CgvAuraLoader({ size = 'md', text = 'Đang tải dữ liệu...', style = {} }) {
  return (
    <div className={`cgv-aura-container size-${size}`} style={style}>
      <div className="cgv-aura-wrapper">
        <div className="cgv-aura-ring-outer" />
        <div className="cgv-aura-ring-inner" />
        <div className="cgv-aura-core-glow" />
        <div className="cgv-aura-sparks" />
        <div className="cgv-aura-logo-box">
          <span className="cgv-aura-logo">CGV</span>
        </div>
      </div>
      {text && <div className="cgv-aura-text">{text}</div>}
    </div>
  );
}
