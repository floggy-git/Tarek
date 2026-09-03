import React from 'react';

export interface RoadVehiclesProps {
  hazard: string;
  weather: 'clear' | 'rain' | 'fog' | 'night' | 'heavy_rain' | 'glossy_ice';
}

const DrivingSceneVehiclesComponent: React.FC<RoadVehiclesProps> = ({ hazard, weather }) => {
  const isNight = weather === 'night';
  const isOvercast = weather === 'rain' || weather === 'heavy_rain' || weather === 'fog';

  return (
    <>
      {/* SHADOW / GLOW DEFINITIONS FOR VEHICLES */}
      <defs>
        <filter id="headlightGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="15" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="brakeLightGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="headlightBeam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.85" />
          <stop offset="40%" stopColor="#fef08a" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* --- 1. SOCCER BALL HAZARD (101) --- */}
      {hazard === 'ball' && (
        <g transform="translate(395, 290)" className="animate-bounce">
          {/* Real 3D-shaded soccer ball */}
          <ellipse cx="0" cy="18" rx="14" ry="4" fill="#000000" opacity="0.35" /> {/* Drop shadow */}
          <circle cx="0" cy="0" r="14" fill="url(#ballGradient)" stroke="#18181b" strokeWidth="1.5" />
          {/* Classic soccer pentagon design */}
          <polygon points="0,-4 -4,2 4,2" fill="#18181b" />
          <polygon points="0,-14 -3,-9 3,-9" fill="#18181b" />
          <polygon points="-11,-4 -13,2 -8,0" fill="#18181b" />
          <polygon points="11,-4 13,2 8,0" fill="#18181b" />
          <polygon points="-7,11 -1,8 -3,14" fill="#18181b" />
          <polygon points="7,11 1,8 3,14" fill="#18181b" />
          {/* Stitching lines */}
          <line x1="0" y1="-4" x2="0" y2="-9" stroke="#18181b" strokeWidth="1" />
          <line x1="-4" y1="2" x2="-8" y2="0" stroke="#18181b" strokeWidth="1" />
          <line x1="4" y1="2" x2="8" y2="0" stroke="#18181b" strokeWidth="1" />
          <line x1="-1" y1="8" x2="-4" y2="2" stroke="#18181b" strokeWidth="1" />
          <line x1="1" y1="8" x2="4" y2="2" stroke="#18181b" strokeWidth="1" />
          
          <defs>
            <radialGradient id="ballGradient" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="75%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </radialGradient>
          </defs>
        </g>
      )}

      {/* --- 2. HIGH-QUALITY CYCLIST (104, 109, 125) --- */}
      {(hazard === 'cyclist_and_oncoming' || hazard === 'cyclist_headphones' || hazard === 'open_door_cyclist') && (
        <g 
          transform={
            hazard === 'open_door_cyclist' 
              ? 'translate(310, 245) scale(1.15)' 
              : hazard === 'cyclist_headphones' 
                ? 'translate(370, 235) scale(1.05)' 
                : 'translate(410, 220) scale(0.9)'
          }
        >
          {/* Rider & bicycle from rear perspective */}
          <ellipse cx="20" cy="54" rx="14" ry="3" fill="#000000" opacity="0.3" /> {/* Shadow */}
          
          {/* Wheels, Spokes and Frame */}
          <line x1="20" y1="18" x2="20" y2="48" stroke="#1f2937" strokeWidth="3" /> {/* Frame tube */}
          <circle cx="20" cy="46" r="10" fill="none" stroke="#111827" strokeWidth="3" /> {/* Rear tire */}
          <circle cx="20" cy="46" r="8" fill="none" stroke="#e2e8f0" strokeWidth="1" opacity="0.5" /> {/* Rim */}
          <circle cx="20" cy="46" r="2" fill="#475569" /> {/* Hub */}
          <rect x="14" y="24" width="12" height="6" fill="#ea580c" rx="1" /> {/* Rear amber reflector */}

          {/* Rider Silhouette */}
          <rect x="10" y="5" width="20" height="25" rx="5" fill="#0284c7" /> {/* Blue athletic jacket */}
          <circle cx="20" cy="-6" r="7.5" fill="#fbcfe8" /> {/* Head */}
          
          {/* Safety Helmet */}
          <path d="M 12,-11 Q 20,-18 28,-11 Q 28,-7 20,-7 Q 12,-7 12,-11 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
          {/* Helmet strap */}
          <line x1="15" y1="-7" x2="20" y2="-1" stroke="#1e293b" strokeWidth="1" />
          <line x1="25" y1="-7" x2="20" y2="-1" stroke="#1e293b" strokeWidth="1" />

          {/* Hands and handlebars */}
          <line x1="8" y1="12" x2="32" y2="12" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" /> {/* Handlebars */}
          <circle cx="8" cy="12" r="2" fill="#1e293b" />
          <circle cx="32" cy="12" r="2" fill="#1e293b" />

          {/* Over-ear headphones (Case 109 - critical visual cue!) */}
          {hazard === 'cyclist_headphones' && (
            <g>
              <path d="M 11,-8 A 9,9 0 0 1 29,-8" stroke="#ef4444" strokeWidth="3" fill="none" /> {/* Headband */}
              <rect x="10" y="-8" width="3" height="6" rx="1.5" fill="#ef4444" filter="url(#brakeLightGlow)" /> {/* Left ear cup */}
              <rect x="27" y="-8" width="3" height="6" rx="1.5" fill="#ef4444" filter="url(#brakeLightGlow)" /> {/* Right ear cup */}
            </g>
          )}

          {/* Legs pedaling */}
          <line x1="14" y1="30" x2="11" y2="42" stroke="#0369a1" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="26" y1="30" x2="29" y2="38" stroke="#0369a1" strokeWidth="4.5" strokeLinecap="round" />
        </g>
      )}

      {/* --- 3. HIGH-FIDELITY ONCOMING CAR (104, 107, 118) --- */}
      {(hazard === 'cyclist_and_oncoming' || hazard === 'parked_cars_oncoming' || hazard === 'emergency_vehicle') && (
        <g 
          transform={
            hazard === 'emergency_vehicle'
              ? 'translate(315, 202) scale(0.7)'
              : hazard === 'parked_cars_oncoming'
                ? 'translate(340, 204) scale(0.65)'
                : 'translate(325, 205) scale(0.6)'
          }
        >
          {/* Realistic oncoming vehicle front view */}
          <ellipse cx="30" cy="48" rx="28" ry="6" fill="#000000" opacity="0.4" /> {/* Ground Shadow */}
          
          {/* Car body panels */}
          <rect x="0" y="12" width="60" height="34" rx="10" fill={hazard === 'emergency_vehicle' ? '#ffffff' : '#b91c1c'} stroke="#1e293b" strokeWidth="1" />
          {/* Cab pillars & roof */}
          <path d="M 8,14 L 14,0 L 46,0 L 52,14 Z" fill={hazard === 'emergency_vehicle' ? '#ffffff' : '#991b1b'} stroke="#1e293b" strokeWidth="1" />
          <rect x="12" y="2" width="36" height="12" fill="#1e293b" rx="2" /> {/* Windshield */}
          
          {/* Front Grill & Emblem */}
          <rect x="16" y="28" width="28" height="10" rx="3" fill="#111827" stroke="#4b5563" strokeWidth="1" />
          <circle cx="30" cy="33" r="3" fill="#cbd5e1" /> {/* Logo */}

          {/* Under-chassis wheels */}
          <rect x="5" y="40" width="10" height="9" fill="#18181b" rx="2" />
          <rect x="45" y="40" width="10" height="9" fill="#18181b" rx="2" />

          {/* Xenon Headlights glowing with cones */}
          <g>
            {/* Radial light beams stretching onto road */}
            <polygon points="8,34 -80,240 60,240" fill="url(#headlightBeam)" opacity="0.3" style={{ mixBlendMode: 'screen' }} />
            <polygon points="52,34 0,240 140,240" fill="url(#headlightBeam)" opacity="0.3" style={{ mixBlendMode: 'screen' }} />

            {/* Glowing headlight circles */}
            <circle cx="8" cy="30" r="7" fill="#fef08a" filter="url(#headlightGlow)" />
            <circle cx="52" cy="30" r="7" fill="#fef08a" filter="url(#headlightGlow)" />
            <circle cx="8" cy="30" r="3" fill="#ffffff" />
            <circle cx="52" cy="30" r="3" fill="#ffffff" />
          </g>

          {/* Dutch front license plate */}
          <rect x="22" y="40" width="16" height="5" fill="#fbbf24" stroke="#111827" strokeWidth="0.8" rx="0.5" />

          {/* Flashing Blue LED bar for Emergency Vehicle (Case 118) */}
          {hazard === 'emergency_vehicle' && (
            <g>
              {/* Roof light bar casing */}
              <rect x="16" y="-5" width="28" height="5" fill="#334155" rx="1" />
              {/* Flashing blue and red sirens */}
              <rect x="18" y="-5" width="10" height="4" fill="#3b82f6" className="animate-pulse" filter="url(#headlightGlow)" />
              <rect x="32" y="-5" width="10" height="4" fill="#ef4444" className="animate-pulse" filter="url(#headlightGlow)" />
              {/* Immersive blue flash over the windshield */}
              <circle cx="30" cy="-3" r="45" fill="#3b82f6" opacity="0.1" className="animate-ping" pointerEvents="none" />
              {/* Dutch Politie / Ambulance decals */}
              <path d="M 5,20 L 15,12 L 25,20" stroke="#3b82f6" strokeWidth="2.5" fill="none" />
              <path d="M 55,20 L 45,12 L 35,20" stroke="#dc2626" strokeWidth="2.5" fill="none" />
            </g>
          )}
        </g>
      )}

      {/* --- 4. CAR AHEAD (102, 116) --- */}
      {(hazard === 'car_ahead_120m' || hazard === 'merging_car_blinker') && (
        <g 
          transform={
            hazard === 'merging_car_blinker' 
              ? 'translate(440, 218) scale(0.95)' 
              : 'translate(382, 210) scale(0.45)'
          }
        >
          {/* Detailed vehicle rear view */}
          <ellipse cx="30" cy="46" rx="26" ry="5" fill="#000000" opacity="0.4" /> {/* Ground Shadow */}
          
          {/* Metal Body Chassis */}
          <rect x="0" y="8" width="60" height="34" rx="8" fill="#4b5563" stroke="#1f2937" strokeWidth="1" />
          <path d="M 8,10 L 14,0 L 46,0 L 52,10 Z" fill="#3f4f6e" stroke="#1f2937" strokeWidth="1" /> {/* Roof/Windshield */}
          <rect x="11" y="2" width="38" height="8" fill="#18181b" rx="1" /> {/* Glass Rear Window */}

          {/* Underbody tires */}
          <rect x="6" y="38" width="10" height="10" fill="#18181b" rx="2" />
          <rect x="44" y="38" width="10" height="10" fill="#18181b" rx="2" />
          {/* Exhaust tip */}
          <circle cx="18" cy="41" r="2.5" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />

          {/* High-mount center brake light */}
          <rect x="24" y="0.5" width="12" height="1.5" fill="#b91c1c" />

          {/* Detailed Rear LED Taillights */}
          <g>
            <rect x="2" y="26" width="12" height="6" rx="1" fill="#991b1b" stroke="#111827" strokeWidth="0.8" />
            <rect x="46" y="26" width="12" height="6" rx="1" fill="#991b1b" stroke="#111827" strokeWidth="0.8" />
            
            {/* Glowing tail bulbs */}
            <circle cx="5" cy="29" r="2.5" fill="#ef4444" />
            <circle cx="55" cy="29" r="2.5" fill="#ef4444" />
          </g>

          {/* Left Blinker Flashing for Merging Car (Case 116) */}
          {hazard === 'merging_car_blinker' && (
            <g>
              <circle cx="3" cy="29" r="5" fill="#f59e0b" className="animate-ping" filter="url(#headlightGlow)" />
              <circle cx="3" cy="29" r="3" fill="#fb923c" />
            </g>
          )}

          {/* Yellow Dutch License Plate */}
          <rect x="21" y="31" width="18" height="6" fill="#facc15" stroke="#111827" strokeWidth="0.8" rx="1" />
          <text x="30" y="36" fill="#000000" fontSize="5" fontWeight="900" textAnchor="middle" fontFamily="monospace">CBR-GP</text>
        </g>
      )}

      {/* --- 5. OVERHEAD METAL TRUSS GANTRY & MATRIX BOARD (105) --- */}
      {hazard === 'matrix_70' && (
        <g>
          {/* Professional Gantry Support Frame */}
          <rect x="120" y="30" width="560" height="12" fill="#475569" stroke="#1e293b" strokeWidth="1" />
          <line x1="120" y1="36" x2="680" y2="36" stroke="#94a3b8" strokeWidth="1" />
          {/* Lattice structural cross bars */}
          {Array.from({ length: 15 }).map((_, i) => (
            <line key={i} x1={150 + i * 35} y1="30" x2="165 + i * 35" y2="42" stroke="#64748b" strokeWidth="1.5" />
          ))}

          {/* Steel columns */}
          <rect x="140" y="42" width="12" height="180" fill="#64748b" />
          <rect x="144" y="42" width="4" height="180" fill="#94a3b8" />
          <rect x="640" y="42" width="12" height="180" fill="#64748b" />
          
          {/* Glowing matrix box over our lane */}
          <rect x="330" y="10" width="140" height="75" rx="8" fill="#09090b" stroke="#334155" strokeWidth="3" />
          {/* Red outer glow circle */}
          <circle cx="400" cy="47" r="26" stroke="#dc2626" strokeWidth="6" fill="none" filter="url(#brakeLightGlow)" />
          {/* Pixelated LED number '70' */}
          <text x="400" y="56" fill="#fb923c" fontSize="28" fontWeight="900" textAnchor="middle" fontFamily="monospace" filter="url(#headlightGlow)">
            70
          </text>
        </g>
      )}

      {/* --- 6. DETAILED TRACTOR (114) --- */}
      {hazard === 'tractor_solid_line' && (
        <g transform="translate(375, 215) scale(0.95)">
          {/* Highly realistic green farming tractor rear view */}
          <ellipse cx="25" cy="45" rx="25" ry="5" fill="#000000" opacity="0.45" /> {/* Ground shadow */}

          {/* Heavy tread tires */}
          <rect x="-2" y="16" width="11" height="34" fill="#09090b" rx="3" /> {/* Left tire */}
          <rect x="41" y="16" width="11" height="34" fill="#09090b" rx="3" /> {/* Right tire */}
          {/* Tread details */}
          {Array.from({ length: 6 }).map((_, i) => (
            <g key={i}>
              <line x1="-2" y1="18 + i*5" x2="4" y2="21 + i*5" stroke="#27272a" strokeWidth="2" />
              <line x1="41" y1="18 + i*5" x2="47" y2="21 + i*5" stroke="#27272a" strokeWidth="2" />
            </g>
          ))}

          {/* Yellow Rims */}
          <rect x="9" y="22" width="2" height="22" fill="#eab308" />
          <rect x="39" y="22" width="2" height="22" fill="#eab308" />

          {/* Driver's glass cab */}
          <rect x="12" y="-12" width="26" height="30" fill="#bae6fd" opacity="0.6" stroke="#166534" strokeWidth="2" rx="2" />
          <rect x="18" y="-6" width="14" height="12" fill="#052e16" rx="2" /> {/* Driver silhouette */}

          {/* Tractor Engine & Mudguards */}
          <rect x="6" y="18" width="38" height="24" fill="#15803d" stroke="#14532d" strokeWidth="1" /> {/* Main body */}
          <path d="M 4,14 L 11,18 L 6,18 Z" fill="#14532d" /> {/* Left mudguard */}
          <path d="M 46,14 L 39,18 L 44,18 Z" fill="#14532d" /> {/* Right mudguard */}

          {/* Lights & Warning Triangle (Langzaam verkeer) */}
          <polygon points="25,23 18,33 32,33" stroke="#ea580c" strokeWidth="3" fill="none" />
          <polygon points="25,25 20,32 30,32" fill="#f97316" />
          
          <rect x="9" y="34" width="7" height="4" fill="#ef4444" rx="0.5" /> {/* Taillight left */}
          <rect x="34" y="34" width="7" height="4" fill="#ef4444" rx="0.5" /> {/* Taillight right */}

          {/* Exhaust chimney blowing smoke */}
          <line x1="36" y1="-12" x2="36" y2="-22" stroke="#4b5563" strokeWidth="2" />
          <circle cx="37" cy="-26" r="3.5" fill="#cbd5e1" opacity="0.3" className="animate-pulse" />
          <circle cx="39" cy="-31" r="5" fill="#cbd5e1" opacity="0.15" />

          {/* Rotating Amber Warning Beacon (Rotating Light - critical safety) */}
          <g>
            <rect x="15" y="-16" width="3" height="4" fill="#4b5563" />
            <circle cx="16.5" cy="-18" r="4.5" fill="#fb923c" filter="url(#headlightGlow)" />
            <circle cx="16.5" cy="-18" r="2.5" fill="#ffffff" />
            {/* Beam sweeps */}
            <polygon points="16,-18 -30,-45 -10,-45" fill="#fef08a" opacity="0.2" className="animate-pulse" />
            <polygon points="17,-18 60,-45 40,-45" fill="#fef08a" opacity="0.2" className="animate-pulse" />
          </g>
        </g>
      )}

      {/* --- 7. BLUE TRUCK WITH SUDDEN BRAKES AND HAZARDS (108) --- */}
      {hazard === 'braking_truck_hazards' && (
        <g transform="translate(365, 202) scale(1.15)">
          {/* Heavy Rear of Cargo Truck */}
          <ellipse cx="35" cy="68" rx="34" ry="5" fill="#000000" opacity="0.5" /> {/* Shadow */}

          {/* Rear tires */}
          <rect x="5" y="56" width="12" height="15" fill="#09090b" rx="2" />
          <rect x="53" y="56" width="12" height="15" fill="#09090b" rx="2" />

          {/* Large Cargo Container Box */}
          <rect x="0" y="0" width="70" height="58" fill="#1e3a8a" stroke="#172554" strokeWidth="2" rx="3" />
          {/* Metal reinforcing ridges */}
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={i} x1="10 + i*10" y1="2" x2="10 + i*10" y2="56" stroke="#1d4ed8" strokeWidth="1.5" />
          ))}

          {/* Reflective Warning Contour Stripes (Dutch standard) */}
          <rect x="2" y="2" width="66" height="54" fill="none" stroke="#fb923c" strokeWidth="1.5" strokeDasharray="8,6" opacity="0.6" />

          {/* License plate & Mudguard flap */}
          <rect x="18" y="58" width="34" height="6" fill="#18181b" />
          <rect x="26" y="59" width="18" height="4" fill="#fbbf24" stroke="#111827" strokeWidth="0.5" />

          {/* Sudden Braking Red LED lightbars */}
          <g>
            <rect x="4" y="50" width="16" height="6" fill="#dc2626" rx="1" filter="url(#brakeLightGlow)" />
            <rect x="50" y="50" width="16" height="6" fill="#dc2626" rx="1" filter="url(#brakeLightGlow)" />
            {/* Core bright light */}
            <rect x="7" y="51" width="10" height="4" fill="#fca5a5" />
            <rect x="53" y="51" width="10" height="4" fill="#fca5a5" />
          </g>

          {/* Active Flashing Amber Hazards */}
          <g>
            <circle cx="4" cy="44" r="5" fill="#f59e0b" className="animate-ping" filter="url(#headlightGlow)" />
            <circle cx="66" cy="44" r="5" fill="#f59e0b" className="animate-ping" filter="url(#headlightGlow)" />
            <circle cx="4" cy="44" r="3" fill="#fb923c" />
            <circle cx="66" cy="44" r="3" fill="#fb923c" />
          </g>
        </g>
      )}

      {/* --- 8. DETAILED SANITATION VEHICLE & WORKERS (115) --- */}
      {hazard === 'garbage_truck_workers' && (
        <g>
          {/* Large orange Dutch Vuilniswagen */}
          <g transform="translate(365, 200) scale(1.1)">
            <ellipse cx="35" cy="71" rx="32" ry="4" fill="#000000" opacity="0.45" /> {/* Ground shadow */}

            <rect x="0" y="0" width="70" height="68" fill="#ea580c" stroke="#c2410c" strokeWidth="2" rx="4" />
            <rect x="8" y="58" width="12" height="15" fill="#18181b" />
            <rect x="50" y="58" width="12" height="15" fill="#18181b" />

            {/* Rear loading hopper mechanism */}
            <rect x="12" y="24" width="46" height="38" fill="#3f3f46" stroke="#27272a" strokeWidth="1" />
            <line x1="12" y1="40" x2="58" y2="40" stroke="#18181b" strokeWidth="2" />

            {/* Chevron safety markings (Rood/Wit) */}
            {Array.from({ length: 4 }).map((_, i) => (
              <g key={i}>
                <polygon points={`2,${5 + i*12} 8,${5 + i*12} 2,${12 + i*12}`} fill="#ffffff" />
                <polygon points={`2,${5 + i*12} 2,${12 + i*12} 8,${12 + i*12}`} fill="#ef4444" />
                <polygon points={`68,${5 + i*12} 62,${5 + i*12} 68,${12 + i*12}`} fill="#ffffff" />
                <polygon points={`68,${5 + i*12} 68,${12 + i*12} 62,${12 + i*12}`} fill="#ef4444" />
              </g>
            ))}

            {/* Glowing amber hazard indicators */}
            <circle cx="6" cy="6" r="6" fill="#f59e0b" className="animate-ping" filter="url(#headlightGlow)" />
            <circle cx="64" cy="6" r="6" fill="#f59e0b" className="animate-ping" filter="url(#headlightGlow)" />
            <circle cx="6" cy="6" r="3" fill="#ffffff" />
            <circle cx="64" cy="6" r="3" fill="#ffffff" />

            <rect x="4" y="52" width="10" height="4" fill="#ef4444" />
            <rect x="56" y="52" width="10" height="4" fill="#ef4444" />
          </g>

          {/* Sanitation crew member in reflective gear rolling wheelie bin */}
          <g transform="translate(325, 238) scale(0.8)">
            <ellipse cx="20" cy="55" rx="12" ry="2.5" fill="#000000" opacity="0.3" />
            
            {/* Sanitation worker silhouette with safety vest */}
            <circle cx="20" cy="10" r="6.5" fill="#fbcfe8" />
            <rect x="20" y="4" width="1" height="4" fill="#1e293b" /> {/* Neck */}
            <rect x="17" y="-2" width="6" height="3" fill="#ea580c" /> {/* Cap */}
            
            <rect x="11" y="17" width="18" height="28" rx="2" fill="#ea580c" /> {/* Orange suit */}
            {/* Reflective silver stripes */}
            <rect x="11" y="22" width="18" height="3" fill="#cbd5e1" />
            <rect x="11" y="32" width="18" height="3" fill="#cbd5e1" />
            
            {/* Arms pulling bin */}
            <line x1="12" y1="20" x2="-2" y2="28" stroke="#ea580c" strokeWidth="4" strokeLinecap="round" />
            
            {/* Wheelie waste bin */}
            <rect x="-12" y="24" width="20" height="32" fill="#1f2937" rx="3" stroke="#111827" strokeWidth="1" />
            <circle cx="-10" cy="54" r="3.5" fill="#111827" />
          </g>
        </g>
      )}

      {/* --- 9. CHILDREN PLAYING ON PAVEMENT (110) --- */}
      {hazard === 'children_sidewalk_40m' && (
        <g transform="translate(240, 196) scale(0.95)" className="animate-bounce">
          {/* Two children playing near sidewalk */}
          {/* Shadow */}
          <ellipse cx="20" cy="40" rx="15" ry="3" fill="#000000" opacity="0.25" />
          
          {/* Girl in pink dress */}
          <circle cx="15" cy="14" r="4.5" fill="#fed7aa" />
          <polygon points="10,36 15,20 20,36" fill="#ec4899" /> {/* Dress */}
          
          {/* Boy in blue shirt */}
          <circle cx="28" cy="16" r="4.5" fill="#fed7aa" />
          <rect x="23" y="21" width="10" height="12" fill="#0284c7" rx="1" />
          <rect x="24" y="33" width="8" height="5" fill="#1e293b" /> {/* Pants */}
        </g>
      )}

      {/* --- 10. PEDESTRIAN IN DARK GRASS BERM (111) --- */}
      {hazard === 'pedestrian_berm' && (
        <g transform="translate(485, 215) scale(0.9)" opacity="0.85">
          {/* Silhouette illuminated by beams */}
          <ellipse cx="20" cy="56" rx="10" ry="2" fill="#000000" opacity="0.4" />
          <circle cx="20" cy="10" r="5.5" fill="#fbcfe8" />
          <rect x="13" y="16" width="14" height="28" rx="3" fill="#334155" /> {/* Dark jacket */}
          <line x1="16" y1="44" x2="16" y2="56" stroke="#111827" strokeWidth="3" />
          <line x1="24" y1="44" x2="22" y2="56" stroke="#111827" strokeWidth="3" />
        </g>
      )}

      {/* --- 11. DETAILED LOOSE DOG ON SIDEWALK (122) --- */}
      {hazard === 'loose_dog' && (
        <g transform="translate(545, 240) scale(1.1)" className="animate-pulse">
          {/* Detailed Golden Retriever-like dog */}
          <ellipse cx="22" cy="36" rx="14" ry="2.5" fill="#000000" opacity="0.3" /> {/* Shadow */}
          
          <rect x="10" y="18" width="26" height="13" rx="4" fill="#d97706" /> {/* Torso */}
          <circle cx="34" cy="14" r="7" fill="#d97706" /> {/* Head */}
          <polygon points="32,10 30,16 34,16" fill="#b45309" /> {/* Floppy ear */}
          <rect x="38" y="12" width="5" height="3" fill="#d97706" rx="1" /> {/* Muzzle */}
          <circle cx="42" cy="13" r="1" fill="#000000" /> {/* Nose */}

          {/* Legs */}
          <line x1="14" y1="30" x2="13" y2="36" stroke="#b45309" strokeWidth="3" />
          <line x1="18" y1="30" x2="19" y2="36" stroke="#b45309" strokeWidth="3" />
          <line x1="28" y1="30" x2="27" y2="36" stroke="#b45309" strokeWidth="3" />
          <line x1="32" y1="30" x2="33" y2="36" stroke="#b45309" strokeWidth="3" />

          {/* Tail */}
          <path d="M 10,20 Q 3,12 6,8" stroke="#d97706" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      )}

      {/* --- 12. BLIND PEDESTRIAN AT CROSSING (124) --- */}
      {hazard === 'blind_pedestrian_cane' && (
        <g transform="translate(255, 222) scale(1.15)">
          {/* Detailed silhouette of an elderly person */}
          <ellipse cx="20" cy="56" rx="12" ry="2.5" fill="#000000" opacity="0.3" />
          
          <circle cx="20" cy="8" r="5" fill="#fbcfe8" />
          <rect x="17" y="1" width="6" height="3" rx="1" fill="#64748b" /> {/* Flat cap */}
          <rect x="13" y="14" width="14" height="28" rx="2" fill="#475569" stroke="#334155" strokeWidth="1" /> {/* Tweed coat */}
          
          {/* White cane with red reflective stripes */}
          <line x1="21" y1="22" x2="38" y2="52" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="30" y1="38" x2="34" y2="44" stroke="#dc2626" strokeWidth="2" /> {/* Red warning stripe */}
          
          {/* Legs */}
          <line x1="16" y1="42" x2="16" y2="56" stroke="#1e293b" strokeWidth="3.5" />
          <line x1="22" y1="42" x2="22" y2="56" stroke="#1e293b" strokeWidth="3.5" />
        </g>
      )}

      {/* --- 13. HEAVY WATER SPRAY / MIST FROM SEMI-TRUCK (112) --- */}
      {hazard === 'water_spray_trucks' && (
        <g>
          {/* Distant semi-truck emerging from mist */}
          <g transform="translate(365, 185) scale(0.9)" opacity="0.35">
            <rect x="0" y="0" width="80" height="52" fill="#cbd5e1" stroke="#94a3b8" />
            <circle cx="15" cy="52" r="8" fill="#1e293b" />
            <circle cx="65" cy="52" r="8" fill="#1e293b" />
          </g>
          {/* Heavy layered water spray clouds in 3D perspective */}
          <g opacity="0.75" className="animate-pulse">
            <ellipse cx="400" cy="225" rx="150" ry="28" fill="url(#sprayGlow)" filter="url(#headlightGlow)" />
            <ellipse cx="360" cy="230" rx="90" ry="20" fill="url(#sprayGlow)" filter="url(#headlightGlow)" />
            <ellipse cx="440" cy="230" rx="90" ry="20" fill="url(#sprayGlow)" filter="url(#headlightGlow)" />
          </g>
          <defs>
            <radialGradient id="sprayGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f1f5f9" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#e2e8f0" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>
        </g>
      )}

      {/* --- 14. PIGEON ON ASPHALT (117) --- */}
      {hazard === 'pigeon_asphalt' && (
        <g transform="translate(390, 275) scale(1.1)">
          {/* Detailed realistic bird vector */}
          <ellipse cx="14" cy="18" rx="6" ry="1.5" fill="#000000" opacity="0.3" /> {/* Shadow */}
          
          {/* Pigeon Body */}
          <ellipse cx="14" cy="10" rx="10" ry="7" fill="#64748b" /> {/* Slate grey body */}
          <ellipse cx="8" cy="8" rx="8" ry="4" fill="#475569" transform="rotate(-15 8 8)" /> {/* Wing fold */}
          
          {/* Head & Neck */}
          <circle cx="21" cy="4" r="5" fill="#475569" />
          {/* Iridescent neck stripe */}
          <path d="M 18,5 A 4,4 0 0 0 21,9" stroke="#10b981" strokeWidth="2" fill="none" />
          
          <polygon points="24,3 29,4 25,6" fill="#f59e0b" /> {/* Orange bill */}
          <circle cx="22" cy="3" r="0.8" fill="#f97316" /> {/* Eye */}
          
          {/* Pink thin legs */}
          <line x1="12" y1="16" x2="11" y2="19" stroke="#f43f5e" strokeWidth="1.2" />
          <line x1="15" y1="16" x2="16" y2="19" stroke="#f43f5e" strokeWidth="1.2" />
        </g>
      )}

      {/* --- 15. COZY PARKED DELIVERY VAN WITH HIND LEGS GESTURE (121) --- */}
      {hazard === 'delivery_van_legs' && (
        <g>
          {/* Delivery Van parked on right */}
          <g transform="translate(485, 230) scale(1.1)">
            <ellipse cx="40" cy="56" rx="35" ry="4" fill="#000000" opacity="0.45" /> {/* Shadow */}

            {/* Van rear view */}
            <rect x="5" y="0" width="70" height="52" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" rx="3" />
            <rect x="15" y="52" width="12" height="6" fill="#111827" />
            <rect x="53" y="52" width="12" height="6" fill="#111827" />

            {/* Open rear doors */}
            <g opacity="0.95">
              {/* Left door open outward */}
              <polygon points="5,5 5,48 -15,42 -15,10" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
              {/* Right door open outward */}
              <polygon points="75,5 75,48 95,42 95,10" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
              {/* Dark internal hollow cargo space */}
              <rect x="6" y="6" width="68" height="42" fill="#09090b" />
            </g>

            {/* Glowing amber warning hazards */}
            <circle cx="8" cy="46" r="4.5" fill="#f59e0b" className="animate-ping" filter="url(#headlightGlow)" />
            <circle cx="72" cy="46" r="4.5" fill="#f59e0b" className="animate-ping" filter="url(#headlightGlow)" />
            <circle cx="8" cy="46" r="2.5" fill="#ffffff" />
            <circle cx="72" cy="46" r="2.5" fill="#ffffff" />
          </g>

          {/* Delivery worker's legs visible standing behind the dark cargo floor */}
          <g transform="translate(522, 280)">
            <rect x="0" y="0" width="6" height="15" fill="#1e3a8a" rx="1" /> {/* Blue jeans left */}
            <rect x="8" y="0" width="6" height="15" fill="#1e3a8a" rx="1" /> {/* Blue jeans right */}
            <rect x="-1" y="14" width="8" height="3" fill="#111827" rx="1" /> {/* Safety boots */}
            <rect x="7" y="14" width="8" height="3" fill="#111827" rx="1" />
          </g>
        </g>
      )}

      {/* --- 16. NARROW STONE BRIDGE & RED BOCHТBAKEN WARNING BOARDS (120) --- */}
      {hazard === 'narrow_bridge_curve' && (
        <g>
          {/* Stone bridge visual parapet arches on sides */}
          <path d="M 0,260 L 315,210 L 315,180 L 0,220 Z" fill="url(#stoneGradient)" stroke="#1c1917" strokeWidth="1" />
          <path d="M 800,260 L 485,210 L 485,180 L 800,220 Z" fill="url(#stoneGradient)" stroke="#1c1917" strokeWidth="1" />
          
          {/* Detailed Red-White warning chevrons (Bochtbaak / J7 Curve guide) on the curb */}
          <g transform="translate(300, 185) scale(0.8)">
            <rect x="0" y="0" width="15" height="30" fill="#ef4444" stroke="#111827" strokeWidth="1" />
            <polygon points="0,5 10,0 15,5 5,10" fill="#ffffff" />
            <polygon points="0,15 10,10 15,15 5,20" fill="#ffffff" />
            <polygon points="0,25 10,20 15,25 5,30" fill="#ffffff" />
          </g>
          <g transform="translate(480, 185) scale(0.8)">
            <rect x="0" y="0" width="15" height="30" fill="#ef4444" stroke="#111827" strokeWidth="1" />
            <polygon points="15,5 5,0 0,5 10,10" fill="#ffffff" />
            <polygon points="15,15 5,10 0,15 10,20" fill="#ffffff" />
            <polygon points="15,25 5,20 0,25 10,30" fill="#ffffff" />
          </g>

          <defs>
            <linearGradient id="stoneGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#78716c" />
              <stop offset="100%" stopColor="#44403c" />
            </linearGradient>
          </defs>
        </g>
      )}
    </>
  );
};

export const DrivingSceneVehicles = React.memo(DrivingSceneVehiclesComponent);
