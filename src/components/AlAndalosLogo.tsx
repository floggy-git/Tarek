import React, { useState } from 'react';

interface AlAndalosLogoProps {
  className?: string;
  iconOnly?: boolean;
  light?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function AlAndalosLogo({ 
  className = '', 
  iconOnly = false, 
  light = false,
  size = 'md' 
}: AlAndalosLogoProps) {
  const [imageError, setImageError] = useState(false);
  
  // Set dimensions based on size
  const logoHeightClass = {
    sm: 'h-8 md:h-9',
    md: 'h-11 md:h-12',
    lg: 'h-16 md:h-18',
    xl: 'h-24 md:h-26',
  }[size];

  const primaryColor = '#1d4ed8'; // Royal blue
  const textColor = light ? '#ffffff' : '#0f172a';
  const subtextColor = light ? '#bfdbfe' : '#475569';

  return (
    <div className={`inline-flex items-center gap-3 font-sans select-none ${className}`}>
      {!imageError ? (
        <img 
          src="/logo.png" 
          alt="Al-Andalos Rijschool Logo" 
          className={`${logoHeightClass} w-auto object-contain shrink-0`}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
        />
      ) : (
        /* Dynamic Vector Steering Wheel & Road Icon Fallback if image not uploaded */
        <svg 
          width={size === 'sm' ? 36 : size === 'md' ? 48 : size === 'lg' ? 64 : 96} 
          height={size === 'sm' ? 36 : size === 'md' ? 48 : size === 'lg' ? 64 : 96} 
          viewBox="0 0 120 120" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 drop-shadow-sm"
        >
          <defs>
            <linearGradient id="wheelGrad" x1="10" y1="10" x2="110" y2="110" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1e40af" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="roadGrad" x1="45" y1="65" x2="100" y2="110" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="diamondGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>

          {/* Steering Wheel Outer Ring */}
          <circle cx="45" cy="45" r="38" stroke="url(#wheelGrad)" strokeWidth="6.5" fill="none" />
          <circle cx="45" cy="45" r="33" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.3" fill="none" />

          {/* Central Hub */}
          <circle cx="45" cy="45" r="8" fill="url(#wheelGrad)" />
          <circle cx="45" cy="45" r="4" fill="#ffffff" />

          {/* Steering Wheel Spokes */}
          <path d="M 14 41 C 25 43 32 44 37 45" stroke="url(#wheelGrad)" strokeWidth="5.5" strokeLinecap="round" />
          <path d="M 76 41 C 65 43 58 44 53 45" stroke="url(#wheelGrad)" strokeWidth="5.5" strokeLinecap="round" />
          <path d="M 45 76 C 45 65 45 58 45 53" stroke="url(#wheelGrad)" strokeWidth="5.5" strokeLinecap="round" />

          {/* Highway Road Winding Out */}
          <path d="M 44 76 Q 54 84 62 80 T 80 88 T 104 100" stroke="url(#roadGrad)" strokeWidth="14" strokeLinecap="round" fill="none" />
          <path d="M 44 76 Q 54 84 62 80 T 80 88 T 104 100" stroke="#0f172a" strokeWidth="11" strokeLinecap="round" fill="none" opacity="0.15" />
          <path d="M 44 76 Q 54 84 62 80 T 80 88 T 104 100" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="4 4" strokeLinecap="round" fill="none" />
        </svg>
      )}

      {/* Brand Text Columns (Al-Andalos Rijschool) - Always show if not iconOnly and imageError occurred, or if we want brand text alongside logo */}
      {!iconOnly && (imageError || size !== 'sm') && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-center gap-1">
            <span 
              className="font-sans font-black tracking-tight text-xl md:text-2xl"
              style={{ color: textColor, letterSpacing: '-0.03em' }}
            >
              AL-ANDA
            </span>
            
            <div className="relative w-5 h-5 md:w-6 md:h-6 shrink-0 mx-0.5">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
                <path d="M12 2L22 12L12 22L2 12L12 2Z" fill="url(#diamondGrad)" />
                <path d="M8 10L12 14L16 10" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <span 
              className="font-sans font-black tracking-tight text-xl md:text-2xl"
              style={{ color: textColor, letterSpacing: '-0.03em' }}
            >
              OS
            </span>
          </div>

          <div 
            className="font-mono text-[9px] md:text-[10px] font-extrabold tracking-[0.22em] mt-1 text-left"
            style={{ color: subtextColor }}
          >
            RIJSCHOOL
          </div>
        </div>
      )}
    </div>
  );
}
