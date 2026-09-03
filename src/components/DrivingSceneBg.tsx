import React from 'react';

export interface RoadBgProps {
  roadType: 'residential' | 'highway' | 'country' | 'woonerf' | 'urban';
  weather: 'clear' | 'rain' | 'fog' | 'night' | 'heavy_rain' | 'glossy_ice';
  roadMarkings?: string;
  hazard?: string;
}

const DrivingSceneBgComponent: React.FC<RoadBgProps> = ({ roadType, weather, roadMarkings, hazard }) => {
  const isNight = weather === 'night';
  const isOvercast = weather === 'rain' || weather === 'heavy_rain' || weather === 'fog';

  return (
    <>
      {/* 1. ATMOSPHERIC SKY BACKGROUND WITH PHOTO-LIKE DEPTH */}
      {isNight ? (
        <rect width="800" height="260" fill="url(#skyNightGradient)" />
      ) : isOvercast ? (
        <rect width="800" height="260" fill={weather === 'fog' ? 'url(#skyFogGradient)' : 'url(#skyRainGradient)'} />
      ) : (
        <rect width="800" height="260" fill="url(#skyClearGradient)" />
      )}

      {/* CLOUDS OR SUN/MOON CELESTIAL ELEMENTS */}
      {!isNight && !isOvercast && (
        <g opacity="0.9">
          {/* Glowing Sun with lens flare disks */}
          <circle cx="680" cy="75" r="32" fill="url(#sunGlow)" filter="url(#sceneGlow)" />
          <circle cx="680" cy="75" r="10" fill="#ffffff" />
          {/* Subtle camera lens flares */}
          <circle cx="560" cy="120" r="15" fill="#ffffff" opacity="0.1" />
          <circle cx="480" cy="150" r="8" fill="#38bdf8" opacity="0.08" />
          <circle cx="380" cy="190" r="24" fill="#fb923c" opacity="0.05" />
          
          {/* Beautiful layered puffy clouds */}
          <path d="M 120,80 Q 140,60 170,70 Q 190,55 220,70 Q 240,80 230,100 L 110,100 Z" fill="#ffffff" opacity="0.25" filter="url(#cloudBlur)" />
          <path d="M 350,90 Q 370,75 390,85 Q 410,70 430,85 Q 450,90 440,105 L 340,105 Z" fill="#ffffff" opacity="0.18" filter="url(#cloudBlur)" />
        </g>
      )}

      {isNight && (
        <g opacity="0.85">
          {/* Soft glowing Moon */}
          <circle cx="680" cy="75" r="16" fill="#f1f5f9" filter="url(#sceneGlow)" />
          <circle cx="674" cy="71" r="14" fill="#020617" /> {/* Crescent effect */}
          {/* Distant stars */}
          <circle cx="120" cy="45" r="1" fill="#ffffff" opacity="0.8" />
          <circle cx="280" cy="65" r="1.5" fill="#ffffff" opacity="0.9" />
          <circle cx="410" cy="35" r="0.8" fill="#ffffff" opacity="0.5" />
          <circle cx="530" cy="80" r="1.2" fill="#ffffff" opacity="0.7" />
        </g>
      )}

      {/* 2. PERSPECTIVE SIDE PANELS & LANDSCAPE */}
      {roadType === 'highway' ? (
        <>
          {/* Grass borders along the highway */}
          <path d="M 0,260 L 320,210 L 330,210 L 0,285 Z" fill="url(#grassDarkGradient)" />
          <path d="M 800,260 L 480,210 L 470,210 L 800,285 Z" fill="url(#grassDarkGradient)" />
          
          {/* Highway Sound Barrier Panel (Geluidsscherm) on the left */}
          <path d="M 0,250 L 320,208 L 320,165 L 0,185 Z" fill="url(#barrierGradient)" stroke="#1e293b" strokeWidth="1" />
          {/* Structural posts for sound barrier */}
          {Array.from({ length: 7 }).map((_, i) => {
            const ratio = i / 6;
            const x = ratio * 320;
            const y1 = 250 - ratio * (250 - 208);
            const y2 = 185 - ratio * (185 - 165);
            return <line key={i} x1={x} y1={y1} x2={x} y2={y2} stroke="#475569" strokeWidth={3 - ratio * 2} />;
          })}

          {/* Highway Guardrails (Geleiderail) on left and right */}
          <path d="M 0,255 L 325,210" stroke="#94a3b8" strokeWidth="5" />
          <path d="M 0,258 L 325,211" stroke="#475569" strokeWidth="2" />
          <path d="M 800,255 L 475,210" stroke="#94a3b8" strokeWidth="5" />
          <path d="M 800,258 L 475,211" stroke="#475569" strokeWidth="2" />
          {/* Guardrail posts sinking into distance */}
          {[0, 40, 90, 150, 220, 300].map((x, i) => (
            <line key={`gp-l-${i}`} x1={x} y1={255 - (x/325)*45} x2={x} y2={255 - (x/325)*45 + 12} stroke="#334155" strokeWidth="3" />
          ))}
          {[800, 760, 710, 650, 580, 500].map((x, i) => (
            <line key={`gp-r-${i}`} x1={x} y1={255 - ((800-x)/325)*45} x2={x} y2={255 - ((800-x)/325)*45 + 12} stroke="#334155" strokeWidth="3" />
          ))}

          {/* Blue Highway Sign (Blue Drip Gantry) far left */}
          <g transform="translate(45, 120) scale(0.7)">
            <rect x="0" y="0" width="85" height="55" rx="3" fill="#1d4ed8" stroke="#ffffff" strokeWidth="1.5" />
            <path d="M 15,15 L 25,5 L 35,15" stroke="#ffffff" strokeWidth="2" fill="none" />
            <line x1="25" y1="5" x2="25" y2="25" stroke="#ffffff" strokeWidth="2" />
            <text x="42" y="45" fill="#ffffff" fontSize="10" fontWeight="900" fontFamily="sans-serif">Utrecht</text>
            <text x="42" y="32" fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="sans-serif">Maastricht</text>
            {/* Sign posts */}
            <line x1="15" y1="55" x2="15" y2="120" stroke="#475569" strokeWidth="3" />
            <line x1="70" y1="55" x2="70" y2="120" stroke="#475569" strokeWidth="3" />
          </g>
        </>
      ) : roadType === 'country' ? (
        <>
          {/* Rich green polder fields */}
          <path d="M 0,210 L 330,210 L 400,260 L 0,380 Z" fill="url(#grassLighterGradient)" />
          <path d="M 800,210 L 470,210 L 400,260 L 800,380 Z" fill="url(#grassLighterGradient)" />

          {/* Perspective Wooden Fence lines */}
          <g opacity="0.8">
            <line x1="20" y1="210" x2="325" y2="210" stroke="#78350f" strokeWidth="2" />
            <line x1="10" y1="216" x2="325" y2="211" stroke="#78350f" strokeWidth="1.5" />
            {[10, 45, 95, 160, 240, 320].map((x, i) => (
              <line key={`f-l-${i}`} x1={x} y1={210} x2={x} y2={228 - (x/320)*12} stroke="#5c2c06" strokeWidth={4 - (x/320)*2} />
            ))}
            
            <line x1="780" y1="210" x2="475" y2="210" stroke="#78350f" strokeWidth="2" />
            <line x1="790" y1="216" x2="475" y2="211" stroke="#78350f" strokeWidth="1.5" />
            {[790, 755, 705, 640, 560, 480].map((x, i) => (
              <line key={`f-r-${i}`} x1={x} y1={210} x2={x} y2={228 - ((800-x)/320)*12} stroke="#5c2c06" strokeWidth={4 - ((800-x)/320)*2} />
            ))}
          </g>

          {/* Beautiful detailed Dutch Windmill in the far left polder background */}
          <g transform="translate(95, 140) scale(0.6)" opacity="0.85">
            <polygon points="20,80 32,35 48,35 60,80" fill="#475569" stroke="#334155" strokeWidth="1" />
            <path d="M 30,35 Q 40,20 50,35 Z" fill="#b91c1c" /> {/* Mill cap */}
            <circle cx="40" cy="40" r="3" fill="#ffffff" />
            {/* Spinning blades (visualizing wind) */}
            <line x1="40" y1="40" x2="10" y2="20" stroke="#f8fafc" strokeWidth="2" />
            <line x1="40" y1="40" x2="70" y2="60" stroke="#f8fafc" strokeWidth="2" />
            <line x1="40" y1="40" x2="20" y2="70" stroke="#f8fafc" strokeWidth="2" />
            <line x1="40" y1="40" x2="60" y2="10" stroke="#f8fafc" strokeWidth="2" />
          </g>

          {/* High-quality leafy trees in perspective */}
          <g opacity="0.95">
            {/* Tree far right */}
            <rect x="735" y="150" width="10" height="60" fill="#451a03" />
            <circle cx="740" cy="140" r="28" fill="#15803d" />
            <circle cx="755" cy="130" r="22" fill="#166534" />
            <circle cx="725" cy="145" r="20" fill="#22c55e" opacity="0.8" />

            {/* Tree far left */}
            <rect x="55" y="150" width="10" height="60" fill="#451a03" />
            <circle cx="60" cy="140" r="28" fill="#15803d" />
            <circle cx="45" cy="130" r="22" fill="#166534" />
            <circle cx="75" cy="145" r="20" fill="#22c55e" opacity="0.8" />
          </g>
        </>
      ) : (
        <>
          {/* 3. URBAN / RESIDENTIAL TOWNHOUSES & BRICK ARCHITECTURE */}
          {/* Textured Sidewalk Bricks Left & Right */}
          <path d="M 0,260 L 330,210 L 350,210 L 0,290 Z" fill="url(#sidewalkLeft)" />
          <path d="M 800,260 L 470,210 L 450,210 L 800,290 Z" fill="url(#sidewalkRight)" />
          {/* Concrete curbs with perspective depth */}
          <polygon points="0,260 330,210 331,213 0,265" fill="#475569" />
          <polygon points="800,260 470,210 469,213 800,265" fill="#475569" />

          {/* Realistic Row Houses on the Left Side */}
          <g>
            {/* House 1: Red Brick Classic */}
            <rect x="0" y="70" width="110" height="150" fill="url(#brickRed)" />
            <polygon points="0,70 55,30 110,70" fill="#374151" stroke="#1f2937" strokeWidth="1" /> {/* Tiled roof */}
            {/* Windows */}
            <rect x="15" y="90" width="28" height="35" rx="1" fill="#bae6fd" stroke="#ffffff" strokeWidth="2" />
            <rect x="65" y="90" width="28" height="35" rx="1" fill="#bae6fd" stroke="#ffffff" strokeWidth="2" />
            {isNight && <rect x="17" y="92" width="24" height="31" fill="#fef08a" opacity="0.6" />}
            {isNight && <rect x="67" y="92" width="24" height="31" fill="#fef08a" opacity="0.6" />}
            <rect x="15" y="150" width="28" height="35" rx="1" fill="#bae6fd" stroke="#ffffff" strokeWidth="2" />
            {/* Front door */}
            <rect x="65" y="145" width="28" height="55" fill="#5c2c06" stroke="#1e293b" strokeWidth="1" />
            <circle cx="70" cy="172" r="2" fill="#fbbf24" />

            {/* House 2: Blue-Grey Modern townhome */}
            <rect x="110" y="90" width="115" height="128" fill="url(#brickBlue)" />
            <rect x="125" y="110" width="30" height="40" rx="1" fill="#f8fafc" stroke="#334155" strokeWidth="2" />
            <rect x="175" y="110" width="30" height="40" rx="1" fill="#bae6fd" stroke="#334155" strokeWidth="2" />
            <rect x="150" y="170" width="30" height="48" fill="#7f1d1d" stroke="#1e293b" strokeWidth="1.5" />
          </g>

          {/* Realistic Row Houses on the Right Side */}
          <g>
            {/* House 3: Sandstone classic Dutch gable house */}
            <rect x="690" y="80" width="110" height="138" fill="url(#brickSand)" />
            {/* Iconic Dutch stepped or bell gable facade */}
            <path d="M 690,80 L 710,80 L 710,55 L 730,55 L 730,35 L 760,35 L 760,55 L 780,55 L 780,80 L 800,80 Z" fill="url(#brickSand)" stroke="#78350f" strokeWidth="1" />
            <rect x="715" y="110" width="28" height="35" rx="1" fill="#bae6fd" stroke="#ffffff" strokeWidth="2" />
            <rect x="755" y="110" width="28" height="35" rx="1" fill="#bae6fd" stroke="#ffffff" strokeWidth="2" />
            {isNight && <rect x="717" y="112" width="24" height="31" fill="#fef08a" opacity="0.75" />}
          </g>

          {/* Clean urban streetlight far right */}
          <g opacity="0.9">
            <line x1="680" y1="210" x2="680" y2="100" stroke="#64748b" strokeWidth="3" />
            <path d="M 680,100 C 680,85 695,85 700,90" stroke="#64748b" strokeWidth="3" fill="none" />
            {/* Streetlight glow at night */}
            {isNight ? (
              <g>
                <circle cx="700" cy="92" r="8" fill="#fef08a" filter="url(#sceneGlow)" />
                <polygon points="700,92 630,220 770,220" fill="url(#streetlightGlow)" opacity="0.25" />
              </g>
            ) : (
              <circle cx="700" cy="92" r="4" fill="#cbd5e1" />
            )}
          </g>
        </>
      )}

      {/* 4. EXQUISITE ROAD SURFACE WITH DEPTH */}
      {weather === 'glossy_ice' ? (
        <path d="M 0,380 L 350,210 L 450,210 L 800,380 Z" fill="url(#asphaltGlossyGradient)" />
      ) : weather === 'rain' || weather === 'heavy_rain' ? (
        <path d="M 0,380 L 350,210 L 450,210 L 800,380 Z" fill="url(#asphaltWetGradient)" />
      ) : (
        <path d="M 0,380 L 350,210 L 450,210 L 800,380 Z" fill="url(#asphaltDryGradient)" />
      )}

      {/* DETAILED DUTCH RED BICYCLE LANE (Fietspad) ON THE RIGHT (for urban/residential) */}
      {(roadType === 'urban' || roadType === 'residential' || roadType === 'woonerf') && (
        <g>
          {/* Red/orange asphalt path in 3D perspective */}
          <path d="M 525,210 L 535,210 L 780,380 L 710,380 Z" fill="url(#fietspadGradient)" opacity="0.85" />
          {/* Crisp white separator line (dashed) */}
          <line x1="525" y1="210" x2="710" y2="380" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="6,8" opacity="0.8" />
          
          {/* White bicycle icon painted on road in perspective */}
          <g transform="translate(620, 280) scale(0.65)" opacity="0.85">
            <circle cx="20" cy="20" r="4" stroke="#ffffff" strokeWidth="1.5" fill="none" />
            <circle cx="35" cy="20" r="4" stroke="#ffffff" strokeWidth="1.5" fill="none" />
            <line x1="20" y1="20" x2="28" y2="10" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="35" y1="20" x2="28" y2="10" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="28" y1="10" x2="22" y2="10" stroke="#ffffff" strokeWidth="1.5" />
          </g>
        </g>
      )}

      {/* 5. ACCURATE ROAD MARKINGS */}
      {roadMarkings === 'shark_teeth' && (
        <g opacity="0.95" filter="drop-shadow(0px 1px 1px rgba(0,0,0,0.3))">
          {/* Perspective white triangles on intersecting road (Shark Teeth / Haaientanden) */}
          <polygon points="460,225 468,223 464,220" fill="#ffffff" />
          <polygon points="475,231 487,229 481,224" fill="#ffffff" />
          <polygon points="495,239 510,236 502,230" fill="#ffffff" />
          <polygon points="525,251 545,247 535,239" fill="#ffffff" />
          <polygon points="565,268 590,262 577,251" fill="#ffffff" />
          <polygon points="620,290 655,283 635,268" fill="#ffffff" />
          {/* Broad white line behind the teeth */}
          <line x1="450" y1="220" x2="650" y2="280" stroke="#ffffff" strokeWidth="2.5" opacity="0.6" />
        </g>
      )}

      {/* ROAD LANE SEPARATORS AND WHITE LINES */}
      {hazard === 'tractor_solid_line' ? (
        /* Solid center line preventing overtaking */
        <path d="M 398,210 L 402,210 L 404,380 L 396,380 Z" fill="#ffffff" />
      ) : roadType === 'highway' ? (
        <>
          {/* Multiple lanes on highway */}
          <path d="M 399,210 L 401,210 L 402,380 L 398,380 Z" fill="#ffffff" opacity="0.75" />
          {/* Dashed separators for three lanes */}
          <line x1="375" y1="210" x2="290" y2="380" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="14,16" opacity="0.75" />
          <line x1="425" y1="210" x2="510" y2="380" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="14,16" opacity="0.75" />
        </>
      ) : (
        /* Standard dashed center separator */
        <path d="M 399,210 L 401,210 L 402,380 L 398,380 Z" fill="#ffffff" strokeDasharray="30,22" opacity="0.85" />
      )}

      {/* ROUNDABOUT DECORATION IN BACKGROUND (D1 roundabout) */}
      {hazard === 'roundabout_ahead' && (
        <g>
          {/* Concrete center island in perspective */}
          <ellipse cx="400" cy="216" rx="50" ry="14" fill="#475569" stroke="#ffffff" strokeWidth="1.5" />
          {/* Green lawn in center island */}
          <ellipse cx="400" cy="216" rx="42" ry="11" fill="url(#grassLighterGradient)" />
          {/* Small blue Roundabout sign D1 on post */}
          <rect x="394" y="190" width="12" height="15" fill="#64748b" />
          <circle cx="400" cy="188" r="9" fill="#1d4ed8" stroke="#ffffff" strokeWidth="1.2" />
          {/* Curved arrow graphic inside D1 sign */}
          <path d="M 397,188 A 3,3 0 1 1 403,188" stroke="#ffffff" strokeWidth="1.5" fill="none" />
          <polygon points="402,187 405,189 402,191" fill="#ffffff" />
        </g>
      )}

      {/* DEFINITIONS OF ALL UNIQUE ATMOSPHERIC GRADIENTS */}
      <defs>
        {/* Sky Gradients with beautiful photo-realistic sunrise/sunset and clear shifts */}
        <linearGradient id="skyClearGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e3a8a" /> {/* Deep upper sky */}
          <stop offset="50%" stopColor="#38bdf8" /> {/* Mid daylight sky */}
          <stop offset="100%" stopColor="#bae6fd" /> {/* Horizon haze */}
        </linearGradient>
        <linearGradient id="skyRainGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="60%" stopColor="#475569" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="skyFogGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="70%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#f1f5f9" />
        </linearGradient>
        <linearGradient id="skyNightGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#020617" />
          <stop offset="40%" stopColor="#0b1329" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>

        {/* Sun Glow */}
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="30%" stopColor="#fef08a" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>

        {/* Asphalt Gradients */}
        <linearGradient id="asphaltDryGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4b5563" />
          <stop offset="100%" stopColor="#18181b" />
        </linearGradient>
        <linearGradient id="asphaltWetGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#27272a" />
          {/* Shiny water film reflections */}
          <stop offset="60%" stopColor="#3f3f46" />
          <stop offset="100%" stopColor="#09090b" />
        </linearGradient>
        <linearGradient id="asphaltGlossyGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3f3f46" />
          {/* Frosty reflective sheen */}
          <stop offset="30%" stopColor="#71717a" stopOpacity="0.6" />
          <stop offset="70%" stopColor="#a1a1aa" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#09090b" />
        </linearGradient>

        {/* Landscape Gradients */}
        <linearGradient id="grassDarkGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14532d" />
          <stop offset="100%" stopColor="#052e16" />
        </linearGradient>
        <linearGradient id="grassLighterGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#15803d" />
          <stop offset="100%" stopColor="#14532d" />
        </linearGradient>

        {/* Highway barrier */}
        <linearGradient id="barrierGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>

        {/* Fietspad Dutch red-orange asphalt */}
        <linearGradient id="fietspadGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#7c2d12" />
        </linearGradient>

        {/* Sidewalk Gradients */}
        <linearGradient id="sidewalkLeft" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a1a1aa" />
          <stop offset="100%" stopColor="#71717a" />
        </linearGradient>
        <linearGradient id="sidewalkRight" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a1a1aa" />
          <stop offset="100%" stopColor="#71717a" />
        </linearGradient>

        {/* Row House Textures / Bricks */}
        <linearGradient id="brickRed" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b91c1c" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>
        <linearGradient id="brickBlue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id="brickSand" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>

        {/* Streetlight light cone */}
        <linearGradient id="streetlightGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="1" />
          <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
        </linearGradient>

        {/* Soft blur filters for high-quality depth */}
        <filter id="sceneGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="cloudBlur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
    </>
  );
};

export const DrivingSceneBg = React.memo(DrivingSceneBgComponent);
