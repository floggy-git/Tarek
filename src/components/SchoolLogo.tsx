import React, { useState } from 'react';
import { SchoolSettings, getSchoolName, getSchoolShortName } from '../types';

interface SchoolLogoProps {
  className?: string;
  iconOnly?: boolean;
  light?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  schoolSettings?: Partial<SchoolSettings> | null;
  customLogoUrl?: string;
  customSchoolName?: string;
}

export default function SchoolLogo({ 
  className = '', 
  iconOnly = false, 
  light = false,
  size = 'md',
  schoolSettings,
  customLogoUrl,
  customSchoolName
}: SchoolLogoProps) {
  const [imageError, setImageError] = useState(false);
  
  const logoHeightClass = {
    sm: 'h-8 md:h-9',
    md: 'h-11 md:h-13',
    lg: 'h-16 md:h-18',
    xl: 'h-24 md:h-26',
  }[size];

  const logoImgSrc = customLogoUrl || schoolSettings?.logoUrl || "";
  const fullName = customSchoolName || getSchoolName(schoolSettings);
  const shortName = getSchoolShortName(schoolSettings);

  const textColor = light ? '#ffffff' : '#0f172a';
  const subtextColor = light ? '#bfdbfe' : '#475569';

  return (
    <div className={`inline-flex items-center gap-3 font-sans select-none ${className}`}>
      {logoImgSrc && !imageError ? (
        <img 
          src={logoImgSrc} 
          alt={`${fullName} Logo`} 
          className={`${logoHeightClass} w-auto object-contain shrink-0 rounded-lg`}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
        />
      ) : (
        /* Fallback Dynamic Vector Shield Icon if Image fails to load or not provided */
        <svg 
          className={`${logoHeightClass} aspect-square shrink-0 filter drop-shadow-md`} 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="schoolShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-primary, #2563eb)" />
              <stop offset="100%" stopColor="var(--color-primary-hover, #1d4ed8)" />
            </linearGradient>
            <linearGradient id="schoolSteerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
          </defs>
          <path 
            d="M50 8 L85 24 V50 C85 70 70 88 50 94 C30 88 15 70 15 50 V24 L50 8 Z" 
            fill="url(#schoolShieldGrad)" 
            stroke={light ? '#ffffff' : '#1e3a8a'} 
            strokeWidth="3"
          />
          <circle cx="50" cy="46" r="22" stroke="url(#schoolSteerGrad)" strokeWidth="5.5" fill="none" />
          <circle cx="50" cy="46" r="6" fill="#ffffff" />
          <line x1="50" y1="24" x2="50" y2="40" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="31" y1="57" x2="45" y2="49" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="69" y1="57" x2="55" y2="49" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      )}

      {/* Brand Text Columns - Dynamically populated */}
      {!iconOnly && (
        <div className="flex flex-col justify-center leading-none">
          <span 
            className="font-sans font-black tracking-tight text-sm sm:text-base md:text-lg uppercase whitespace-nowrap"
            style={{ color: textColor, letterSpacing: '-0.02em' }}
          >
            {shortName || fullName || 'DRIVING SCHOOL'}
          </span>

          <span 
            className="font-sans text-[9px] sm:text-[10px] font-normal tracking-wide mt-0.5 text-left rtl:text-right uppercase whitespace-nowrap opacity-60"
            style={{ color: subtextColor }}
          >
            {schoolSettings?.slogan || schoolSettings?.city || 'RIJSCHOOL'}
          </span>
        </div>
      )}
    </div>
  );
}
