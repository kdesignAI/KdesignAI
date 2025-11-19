import React from 'react';

export const SolarisLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="brand-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFD93D" />
        <stop offset="50%" stopColor="#FF4B4B" />
        <stop offset="100%" stopColor="#2E86AB" />
      </linearGradient>
    </defs>
    
    {/* Circuit connections (Rays) */}
    <path d="M50 20 V10" stroke="url(#brand-grad)" strokeWidth="6" strokeLinecap="round" />
    <path d="M50 90 V80" stroke="url(#brand-grad)" strokeWidth="6" strokeLinecap="round" />
    <path d="M20 50 H10" stroke="url(#brand-grad)" strokeWidth="6" strokeLinecap="round" />
    <path d="M90 50 H80" stroke="url(#brand-grad)" strokeWidth="6" strokeLinecap="round" />
    
    <path d="M28 28 L21 21" stroke="url(#brand-grad)" strokeWidth="6" strokeLinecap="round" />
    <path d="M72 72 L79 79" stroke="url(#brand-grad)" strokeWidth="6" strokeLinecap="round" />
    <path d="M72 28 L79 21" stroke="url(#brand-grad)" strokeWidth="6" strokeLinecap="round" />
    <path d="M28 72 L21 79" stroke="url(#brand-grad)" strokeWidth="6" strokeLinecap="round" />

    {/* Nodes */}
    <circle cx="50" cy="10" r="4" fill="#2E86AB" />
    <circle cx="50" cy="90" r="4" fill="#2E86AB" />
    <circle cx="10" cy="50" r="4" fill="#2E86AB" />
    <circle cx="90" cy="50" r="4" fill="#2E86AB" />
    
    <circle cx="21" cy="21" r="4" fill="#FF4B4B" />
    <circle cx="79" cy="79" r="4" fill="#FF4B4B" />
    <circle cx="79" cy="21" r="4" fill="#FFD93D" />
    <circle cx="21" cy="79" r="4" fill="#FFD93D" />

    {/* Central Sun Core */}
    <circle cx="50" cy="50" r="22" fill="url(#brand-grad)" />
    <circle cx="50" cy="50" r="16" stroke="white" strokeWidth="2" strokeOpacity="0.4" />
  </svg>
);