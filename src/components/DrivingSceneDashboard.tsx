import React from 'react';

export interface RoadDashboardProps {
  speed: number;
  weather: 'clear' | 'rain' | 'fog' | 'night' | 'heavy_rain' | 'glossy_ice';
  hazard?: string;
  mirror?: 'clear' | 'tailgater';
  lang?: 'en' | 'nl' | 'ar';
}

const DrivingSceneDashboardComponent: React.FC<RoadDashboardProps> = ({ speed, weather, hazard, mirror, lang }) => {
  const isNight = weather === 'night';
  const isRaining = weather === 'rain' || weather === 'heavy_rain';
  
  // Speed needle rotation calculation (e.g. 0 km/h is -130 deg, 140 km/h is +130 deg)
  const maxSpeed = 160;
  const clampedSpeed = Math.min(Math.max(speed, 0), maxSpeed);
  const needleRotation = -130 + (clampedSpeed / maxSpeed) * 260;

  return (
    <>
      <defs>
        {/* Glow and textures for cockpit elements */}
        <filter id="neonIndicatorGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="dashboardTexture" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#18181b" />
          <stop offset="40%" stopColor="#09090b" />
          <stop offset="100%" stopColor="#020202" />
        </linearGradient>
        <linearGradient id="mirrorBezel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="mirrorGlassClear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bae6fd" />
          <stop offset="100%" stopColor="#7dd3fc" />
        </linearGradient>
        <linearGradient id="mirrorGlassDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>

      {/* ============================================================== */}
      {/* 1. TOP REAR-VIEW MIRROR (IMMERSIVE COCKPIT DETAIL) */}
      {/* ============================================================== */}
      <g transform="translate(280, 10)">
        {/* Outer casing */}
        <rect x="0" y="0" width="240" height="52" rx="14" fill="url(#mirrorBezel)" stroke="#020617" strokeWidth="2.5" />
        <rect x="3" y="3" width="234" height="46" rx="11" fill="none" stroke="#64748b" strokeWidth="1" />
        
        {/* Mirror Glass view with reflection */}
        <g clipPath="url(#mirrorClip)">
          {isNight ? (
            <rect x="4" y="4" width="232" height="44" fill="url(#mirrorGlassDark)" />
          ) : (
            <rect x="4" y="4" width="232" height="44" fill="url(#mirrorGlassClear)" />
          )}

          {/* Distant horizon inside reflection */}
          <line x1="4" y1="28" x2="236" y2="28" stroke="#334155" strokeWidth="1" opacity="0.4" />
          <polygon points="120,28 70,48 170,48" fill="#3f3f46" opacity="0.6" /> {/* Reflected asphalt road */}
          <line x1="120" y1="28" x2="120" y2="48" stroke="#ffffff" strokeWidth="1" strokeDasharray="3,3" opacity="0.7" />

          {mirror === 'tailgater' ? (
            /* CRITICAL SCENARIO HAZARD: TAILGATER CAR LOOMING IN REAR VIEW MIRROR (Case 117) */
            <g transform="translate(85, 12)">
              {/* Massive aggressive tailgater front grill and glowing windshield */}
              <ellipse cx="35" cy="24" rx="24" ry="4" fill="#000000" opacity="0.4" /> {/* Ground shadow */}
              <rect x="12" y="8" width="46" height="15" fill="#ef4444" rx="2" /> {/* Red tailgater body */}
              <rect x="18" y="10" width="34" height="6" fill="#1e293b" rx="1" /> {/* Windshield */}
              
              {/* Massive glaring headlights */}
              <circle cx="17" cy="17" r="5" fill="#ffffff" filter="url(#neonIndicatorGlow)" />
              <circle cx="53" cy="17" r="5" fill="#ffffff" filter="url(#neonIndicatorGlow)" />
              <circle cx="17" cy="17" r="2.5" fill="#fef08a" />
              <circle cx="53" cy="17" r="2.5" fill="#fef08a" />
              
              {/* Reflected driver avatar silhouette */}
              <circle cx="35" cy="12" r="2.5" fill="#09090b" />
            </g>
          ) : (
            /* Safe Following Distance: Very small distant car safely trailing behind */
            <g transform="translate(112, 28) scale(0.35)">
              <rect x="0" y="4" width="24" height="14" fill="#0284c7" rx="2" />
              <circle cx="4" cy="12" r="3" fill="#ffffff" filter="url(#neonIndicatorGlow)" />
              <circle cx="20" cy="12" r="3" fill="#ffffff" filter="url(#neonIndicatorGlow)" />
            </g>
          )}

          {/* Glare overlay on mirror */}
          <path d="M 4,4 L 100,4 L 30,48 L 4,4 Z" fill="#ffffff" opacity="0.15" />
        </g>
        
        {/* Support arm mount */}
        <rect x="110" y="-10" width="20" height="10" fill="#1e293b" stroke="#09090b" strokeWidth="1" />
      </g>

      <clipPath id="mirrorClip">
        <rect x="4" y="4" width="232" height="44" rx="10" />
      </clipPath>


      {/* ============================================================== */}
      {/* 2. WINDSHIELD WIPER BLADES & REFLECTIONS */}
      {/* ============================================================== */}
      {/* Subtle white glare curve across the entire glass cockpit area */}
      <path d="M 50,0 Q 400,280 750,0" stroke="#ffffff" strokeWidth="1.5" opacity="0.08" fill="none" pointerEvents="none" />
      
      {/* Dynamic Raindrop splatters (Case 108, 112) */}
      {isRaining && (
        <g opacity="0.65" pointerEvents="none">
          {/* Static splatters outside wiped sweep */}
          <circle cx="80" cy="80" r="1.5" fill="#ffffff" opacity="0.7" />
          <circle cx="110" cy="150" r="1" fill="#ffffff" opacity="0.5" />
          <circle cx="710" cy="100" r="2" fill="#ffffff" opacity="0.8" />
          <circle cx="680" cy="190" r="1.2" fill="#ffffff" opacity="0.6" />
          <circle cx="340" cy="60" r="1" fill="#ffffff" opacity="0.5" />
        </g>
      )}

      {/* Windshield Wipers parked or wiping */}
      {isRaining ? (
        /* Wipers actively clearing windshield (styled at dynamic sweep angle) */
        <g opacity="0.95" strokeLinecap="round" stroke="#1e293b">
          {/* Driver's side wiper */}
          <line x1="280" y1="365" x2="380" y2="210" strokeWidth="4" />
          <line x1="380" y1="210" x2="440" y2="120" strokeWidth="2.5" />
          {/* Passenger's side wiper */}
          <line x1="580" y1="365" x2="680" y2="240" strokeWidth="4" />
          <line x1="680" y1="240" x2="730" y2="170" strokeWidth="2.5" />
        </g>
      ) : (
        /* Parked neatly out of view at bottom base of windshield */
        <g opacity="0.9" strokeLinecap="round" stroke="#18181b">
          <line x1="180" y1="362" x2="440" y2="362" strokeWidth="4" />
          <line x1="520" y1="362" x2="760" y2="362" strokeWidth="4" />
        </g>
      )}


      {/* ============================================================== */}
      {/* 3. PREMIUM CARBON-LEATHER COCKPIT DASHBOARD CONSOLE */}
      {/* ============================================================== */}
      <g transform="translate(0, 360)">
        {/* Curved upper cowl of the dashboard leather casing */}
        <path d="M 0,10 Q 400,-15 800,10 L 800,90 L 0,90 Z" fill="url(#dashboardTexture)" stroke="#09090b" strokeWidth="2" />
        
        {/* Soft leather stitching line */}
        <path d="M 0,14 Q 400,-11 800,14" stroke="#27272a" strokeWidth="1" strokeDasharray="3,3" fill="none" />

        {/* ========================================== */}
        {/* Speedometer Cluster Gauge (Center-Left aligned for driver) */}
        {/* ========================================== */}
        <g transform="translate(180, 48)">
          {/* Beveled chromium outer dial casing */}
          <circle cx="0" cy="0" r="38" fill="#18181b" stroke="#3f3f46" strokeWidth="2.5" />
          {/* Inner dial plate */}
          <circle cx="0" cy="0" r="35" fill="#09090b" />
          
          {/* Dynamic glowing circular speed ring (color shifts based on speed limit) */}
          <circle 
            cx="0" 
            cy="0" 
            r="31" 
            fill="none" 
            stroke={speed > 100 ? '#ef4444' : speed > 50 ? '#f59e0b' : '#10b981'} 
            strokeWidth="1.5" 
            opacity="0.2" 
          />

          {/* Speed graduating tick marks (Perspective dials) */}
          {Array.from({ length: 9 }).map((_, i) => {
            const angle = -130 + i * 32.5;
            const x1 = Math.cos((angle * Math.PI) / 180) * 28;
            const y1 = Math.sin((angle * Math.PI) / 180) * 28;
            const x2 = Math.cos((angle * Math.PI) / 180) * 33;
            const y2 = Math.sin((angle * Math.PI) / 180) * 33;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#a1a1aa" strokeWidth="1" />;
          })}

          {/* Dials numerical labels */}
          <text x="-21" y="10" fill="#71717a" fontSize="6.5" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">30</text>
          <text x="-16" y="-16" fill="#cbd5e1" fontSize="6.5" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">50</text>
          <text x="0" y="-23" fill="#cbd5e1" fontSize="6.5" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">80</text>
          <text x="16" y="-16" fill="#fca5a5" fontSize="6.5" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">100</text>
          <text x="21" y="10" fill="#f87171" fontSize="6.5" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">120</text>

          {/* Speedometer glowing center hub */}
          <circle cx="0" cy="0" r="6" fill="#27272a" stroke="#18181b" strokeWidth="1" />
          <circle cx="0" cy="0" r="2.5" fill="#f43f5e" />

          {/* Dynamic Speed Pointer Needle (Rotated based on speed calculation) */}
          <g transform={`rotate(${needleRotation})`}>
            <line x1="0" y1="0" x2="30" y2="0" stroke="#f43f5e" strokeWidth="2.2" strokeLinecap="round" filter="url(#neonIndicatorGlow)" />
            <polygon points="30,-1 33,0 30,1" fill="#f43f5e" />
          </g>
        </g>


        {/* ========================================== */}
        {/* Central Infotainment & Dashboard Display */}
        {/* ========================================== */}
        <g transform="translate(345, 18)">
          {/* LCD digital screen cutout */}
          <rect x="0" y="0" width="110" height="60" rx="6" fill="#09090b" stroke="#27272a" strokeWidth="2" />
          
          {/* Central Lane-Assist HUD graphic */}
          <line x1="20" y1="52" x2="45" y2="12" stroke="#4b5563" strokeWidth="1.5" strokeDasharray="3,3" />
          <line x1="90" y1="52" x2="65" y2="12" stroke="#4b5563" strokeWidth="1.5" strokeDasharray="3,3" />
          {/* Safe ego car block in center of HUD */}
          <rect x="47" y="32" width="16" height="15" rx="3" fill="#3b82f6" opacity="0.6" stroke="#2563eb" strokeWidth="1" />
          {/* Hazard warning lines in HUD */}
          {speed > 100 && (
            <path d="M 40,40 L 70,40" stroke="#dc2626" strokeWidth="2" strokeDasharray="2,2" className="animate-pulse" />
          )}

          {/* ADAS Assist Status Icon */}
          <rect x="42" y="4" width="26" height="8" rx="2" fill="#1e293b" />
          <text x="55" y="10" fill="#38bdf8" fontSize="5.5" fontWeight="900" textAnchor="middle" fontFamily="monospace">ADAS</text>
        </g>


        {/* ========================================== */}
        {/* ACTIVE DASHBOARD GLOW INDICATORS (Visual triggers!) */}
        {/* ========================================== */}
        <g transform="translate(485, 30)">
          {/* Indicator 1: Dimlichten / Headlights Active (Always on, styled in green) */}
          <g transform="translate(0, 0)">
            <circle cx="8" cy="8" r="9" fill="#15803d" opacity="0.25" />
            <circle cx="8" cy="8" r="7.5" fill="none" stroke="#22c55e" strokeWidth="1" />
            <text x="8" y="11.5" fill="#22c55e" fontSize="9" fontWeight="900" textAnchor="middle" filter="url(#neonIndicatorGlow)">
              D
            </text>
          </g>

          {/* Indicator 2: High-intensity Tire Pressure Warnlamp (Case 123) */}
          {hazard === 'tire_warning_light' ? (
            <g transform="translate(35, 0)">
              <circle cx="8" cy="8" r="9" fill="#f59e0b" opacity="0.4" className="animate-pulse" />
              <circle cx="8" cy="8" r="7.5" fill="none" stroke="#fb923c" strokeWidth="1.5" />
              {/* Tire icon representation */}
              <path d="M 4,8 A 4,4 0 0 1 12,8" stroke="#facc15" strokeWidth="1.5" fill="none" filter="url(#neonIndicatorGlow)" />
              <text x="8" y="12" fill="#facc15" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">!</text>
            </g>
          ) : (
            /* Standby dark indicators */
            <g transform="translate(35, 0)" opacity="0.15">
              <circle cx="8" cy="8" r="7.5" fill="none" stroke="#71717a" strokeWidth="1" />
              <text x="8" y="12" fill="#71717a" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">!</text>
            </g>
          )}

          {/* Indicator 3: Frost / Black Ice Warning Lamp (Case 119) */}
          {weather === 'glossy_ice' ? (
            <g transform="translate(70, 0)">
              <circle cx="8" cy="8" r="9" fill="#2563eb" opacity="0.4" />
              <circle cx="8" cy="8" r="7.5" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
              <text x="8" y="11.5" fill="#60a5fa" fontSize="8.5" fontWeight="black" textAnchor="middle" filter="url(#neonIndicatorGlow)">
                ❄
              </text>
            </g>
          ) : (
            /* Standby dark */
            <g transform="translate(70, 0)" opacity="0.15">
              <circle cx="8" cy="8" r="7.5" fill="none" stroke="#71717a" strokeWidth="1" />
              <text x="8" y="11.5" fill="#71717a" fontSize="8.5" fontWeight="bold" textAnchor="middle">❄</text>
            </g>
          )}
        </g>
      </g>


      {/* ============================================================== */}
      {/* 4. DRIVER'S COCKPIT A-PILLARS / WINDSHIELD BOUNDS */}
      {/* ============================================================== */}
      {/* Left A-Pillar (Frame edge) */}
      <polygon points="0,0 24,0 54,370 0,370" fill="url(#apillarGradient)" stroke="#09090b" strokeWidth="1" />
      <line x1="24" y1="0" x2="54" y2="370" stroke="#3f3f46" strokeWidth="1" opacity="0.3" />

      {/* Right A-Pillar (Frame edge) */}
      <polygon points="800,0 776,0 746,370 800,370" fill="url(#apillarGradient)" stroke="#09090b" strokeWidth="1" />
      <line x1="776" y1="0" x2="746" y2="370" stroke="#3f3f46" strokeWidth="1" opacity="0.3" />

      <defs>
        {/* Soft linear shadows for deep 3D bevels on cockpit posts */}
        <linearGradient id="apillarGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="50%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
      </defs>
    </>
  );
};

export const DrivingSceneDashboard = React.memo(DrivingSceneDashboardComponent);
