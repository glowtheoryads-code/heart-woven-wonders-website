import React from 'react';

export const GoldCrestOrnament: React.FC<{ className?: string; flipped?: boolean }> = ({ className = 'w-16 h-16', flipped = false }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} text-[#d4af37] ${flipped ? 'scale-x-[-1]' : ''} transition-transform duration-500`}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10,50 C25,40 35,25 45,10 C46,25 55,35 70,38 C55,42 48,52 46,65 C40,52 30,45 10,50 Z"
        opacity="0.85"
      />
      <circle cx="45" cy="40" r="3.5" fill="#ffd700" />
      <path
        d="M20,60 C32,58 40,68 45,85 C42,70 52,65 65,65 C52,60 48,50 45,45 C42,55 35,58 20,60 Z"
        opacity="0.65"
      />
      <path
        d="M5,50 Q45,50 45,95 Q45,50 85,50"
        stroke="#ffd700"
        strokeWidth="1.2"
        fill="none"
        opacity="0.75"
      />
      <circle cx="85" cy="50" r="2" fill="#ffd700" />
      <circle cx="5" cy="50" r="2" fill="#ffd700" />
    </svg>
  );
};

export const FiligreeDivider: React.FC<{ className?: string }> = ({ className = 'w-48 h-6' }) => {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#d4af37]/60 to-[#ffd700]" />
      <div className="flex items-center gap-1.5 text-[#ffd700]">
        <span className="text-[10px]">✦</span>
        <div className="w-2 h-2 rotate-45 border border-[#d4af37] bg-[#220d3b]" />
        <span className="text-[10px]">✦</span>
      </div>
      <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#d4af37]/60 to-[#ffd700]" />
    </div>
  );
};
