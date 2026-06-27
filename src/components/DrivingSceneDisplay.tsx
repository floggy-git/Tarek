import React from 'react';

interface DrivingSceneProps {
  questionId: number;
  lang?: 'en' | 'nl' | 'ar';
}

export const DrivingSceneDisplay: React.FC<DrivingSceneProps> = ({ questionId, lang = 'en' }) => {
  // Extract scene parameters based on questionId
  const getSceneParams = (id: number) => {
    switch (id) {
      // --- HAZARD PERCEPTION (101 - 125) ---
      case 101:
        return {
          speed: 50,
          roadType: 'residential',
          weather: 'rain',
          hazard: 'ball',
          mirror: 'clear',
          rightSideCars: true,
          description: 'A ball rolls onto a wet residential street. Active braking required.'
        };
      case 102:
        return {
          speed: 100,
          roadType: 'highway',
          weather: 'fog',
          hazard: 'car_ahead_120m',
          mirror: 'clear',
          description: 'Light fog on highway. Tailcar is 120m ahead. Release accelerator.'
        };
      case 103:
        return {
          speed: 30,
          roadType: 'woonerf',
          weather: 'clear',
          hazard: 'none',
          mirror: 'tailgater',
          sign: 'G5',
          description: 'Entering a Woonerf at 30 km/h (limit is 15 km/h). Immediate brake!'
        };
      case 104:
        return {
          speed: 80,
          roadType: 'country',
          weather: 'clear',
          hazard: 'cyclist_and_oncoming',
          mirror: 'clear',
          description: 'Cyclist in lane with oncoming traffic. Brake and wait.'
        };
      case 105:
        return {
          speed: 120,
          roadType: 'highway',
          weather: 'clear',
          hazard: 'matrix_70',
          mirror: 'clear',
          description: 'Smooth traffic, but overhead matrix sign displays 70. Brake!'
        };
      case 106:
        return {
          speed: 50,
          roadType: 'urban',
          weather: 'clear',
          hazard: 'car_behind_shark_teeth',
          mirror: 'clear',
          roadMarkings: 'shark_teeth',
          description: 'You are on a priority road. Car waiting behind shark teeth. Do nothing.'
        };
      case 107:
        return {
          speed: 50,
          roadType: 'urban',
          weather: 'clear',
          hazard: 'parked_cars_oncoming',
          mirror: 'clear',
          rightSideCars: true,
          description: 'Road narrows due to parked cars. Oncoming car approaching. Brake!'
        };
      case 108:
        return {
          speed: 80,
          roadType: 'country',
          weather: 'rain',
          hazard: 'braking_truck_hazards',
          mirror: 'clear',
          description: 'Truck ahead brakes suddenly with hazard lights flashing on wet road. Brake!'
        };
      case 109:
        return {
          speed: 30,
          roadType: 'residential',
          weather: 'clear',
          hazard: 'cyclist_headphones',
          mirror: 'clear',
          description: 'Cyclist ahead swerving with headphones on. Release accelerator.'
        };
      case 110:
        return {
          speed: 50,
          roadType: 'urban',
          weather: 'clear',
          hazard: 'children_sidewalk_40m',
          mirror: 'clear',
          sign: 'J12',
          description: 'School warning sign. Children playing on sidewalk. Brake!'
        };
      case 111:
        return {
          speed: 80,
          roadType: 'country',
          weather: 'night',
          hazard: 'pedestrian_berm',
          mirror: 'clear',
          description: 'Dark night. Pedestrian walking on grass roadside under low beams. Brake!'
        };
      case 112:
        return {
          speed: 100,
          roadType: 'highway',
          weather: 'heavy_rain',
          hazard: 'water_spray_trucks',
          mirror: 'clear',
          description: 'Heavy rain. Extreme spray from trucks reduces visibility below 50m. Brake!'
        };
      case 113:
        return {
          speed: 50,
          roadType: 'urban',
          weather: 'clear',
          hazard: 'roundabout_ahead',
          mirror: 'clear',
          sign: 'D1',
          description: 'Approaching a roundabout with empty roads. Release accelerator to match speed.'
        };
      case 114:
        return {
          speed: 80,
          roadType: 'country',
          weather: 'clear',
          hazard: 'tractor_solid_line',
          mirror: 'tailgater',
          description: 'Slow tractor ahead. Solid center line prevents overtaking. Brake!'
        };
      case 115:
        return {
          speed: 30,
          roadType: 'residential',
          weather: 'clear',
          hazard: 'garbage_truck_workers',
          mirror: 'clear',
          description: 'Garbage truck stopped with hazard lights; sanitation workers active. Brake!'
        };
      case 116:
        return {
          speed: 100,
          roadType: 'highway',
          weather: 'clear',
          hazard: 'merging_car_blinker',
          mirror: 'clear',
          description: 'Car on right has left blinker active and drifts close. Release accelerator.'
        };
      case 117:
        return {
          speed: 50,
          roadType: 'urban',
          weather: 'clear',
          hazard: 'pigeon_asphalt',
          mirror: 'tailgater',
          description: 'Pigeon on the asphalt 15m ahead. Tailgater behind. Do nothing.'
        };
      case 118:
        return {
          speed: 50,
          roadType: 'urban',
          weather: 'clear',
          hazard: 'emergency_vehicle',
          mirror: 'clear',
          description: 'Emergency vehicle with blue flashing lights approaching crossing. Brake!'
        };
      case 119:
        return {
          speed: 50,
          roadType: 'urban',
          weather: 'glossy_ice',
          hazard: 'black_ice',
          mirror: 'clear',
          description: 'Winter temperature -2°C, glossy wet road indicates black ice. Brake!'
        };
      case 120:
        return {
          speed: 80,
          roadType: 'country',
          weather: 'clear',
          hazard: 'narrow_bridge_curve',
          mirror: 'clear',
          sign: 'J7',
          description: 'Blind curve and narrow bridge warning ahead. Brake!'
        };
      case 121:
        return {
          speed: 50,
          roadType: 'urban',
          weather: 'clear',
          hazard: 'delivery_van_legs',
          mirror: 'clear',
          rightSideCars: true,
          description: 'Delivery van with hazard lights; person\'s legs visible behind it. Brake!'
        };
      case 122:
        return {
          speed: 30,
          roadType: 'residential',
          weather: 'clear',
          hazard: 'loose_dog',
          mirror: 'clear',
          description: 'Dog running loose without a leash on the right sidewalk. Release accelerator.'
        };
      case 123:
        return {
          speed: 100,
          roadType: 'highway',
          weather: 'clear',
          hazard: 'tire_warning_light',
          mirror: 'clear',
          description: 'Tire pressure dashboard light activates. Release accelerator.'
        };
      case 124:
        return {
          speed: 50,
          roadType: 'urban',
          weather: 'clear',
          hazard: 'blind_pedestrian_cane',
          mirror: 'clear',
          description: 'Elderly blind person with red-striped white cane preparing to cross. Brake!'
        };
      case 125:
        return {
          speed: 50,
          roadType: 'urban',
          weather: 'clear',
          hazard: 'open_door_cyclist',
          mirror: 'clear',
          rightSideCars: true,
          description: 'Cyclist on right, parked car ahead with open door. Brake!'
        };

      // --- RULES & KNOWLEDGE SCENES (STATIC FALLBACKS FOR QUESTION THEMES) ---
      case 202:
        return { speed: 100, roadType: 'highway', weather: 'clear', hazard: 'none', mirror: 'clear', sign: 'A1-100', description: 'Daytime highway limit in NL' };
      case 203:
        return { speed: 80, roadType: 'country', weather: 'fog', hazard: 'none', mirror: 'clear', description: 'Foggy country road' };
      case 205:
        return { speed: 50, roadType: 'urban', weather: 'clear', hazard: 'none', mirror: 'clear', description: 'Urban priority intersection' };
      case 208:
        return { speed: 130, roadType: 'highway', weather: 'night', hazard: 'none', mirror: 'clear', sign: 'A1-130', description: 'Nighttime speed on highway' };
      case 210:
        return { speed: 80, roadType: 'country', weather: 'clear', hazard: 'none', mirror: 'clear', description: 'Provincial road priority' };
      case 211:
        return { speed: 50, roadType: 'urban', weather: 'clear', hazard: 'none', mirror: 'clear', sign: 'B1', description: 'Priority road' };

      // --- STATIC REVIEW DEFAULTS ---
      default:
        // Attempt to determine by number patterns
        if (id >= 100 && id < 200) {
          return { speed: 50, roadType: 'urban', weather: 'clear', hazard: 'none', mirror: 'clear', description: 'Standard driving scene' };
        }
        return { speed: 50, roadType: 'urban', weather: 'clear', hazard: 'none', mirror: 'clear', description: 'Standard driving scene' };
    }
  };

  const params = getSceneParams(questionId);

  // Define SVG renderers for roads, hazards, dashboards, etc.
  return (
    <div className="w-full h-full min-h-[220px] relative select-none rounded-3xl overflow-hidden border border-slate-200/80 dark:border-zinc-800 bg-slate-900 flex flex-col font-sans">
      
      {/* 3D PERSPECTIVE CANVAS (SVG) */}
      <svg className="w-full h-full absolute inset-0" viewBox="0 0 800 450" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Gradients */}
          <linearGradient id="skyClear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#bae6fd" />
          </linearGradient>
          <linearGradient id="skyRain" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
          <linearGradient id="skyFog" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#f1f5f9" />
          </linearGradient>
          <linearGradient id="skyNight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#020617" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          
          <linearGradient id="asphaltDry" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4b5563" />
            <stop offset="100%" stopColor="#1f2937" />
          </linearGradient>
          <linearGradient id="asphaltWet" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>
          <linearGradient id="asphaltGlossy" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4b5563" />
            <stop offset="40%" stopColor="#9ca3af" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>

          <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#166534" />
          </linearGradient>
          
          {/* Glow Filters */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="matrixGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. BACKGROUND / SKY */}
        {params.weather === 'rain' || params.weather === 'heavy_rain' ? (
          <rect width="800" height="260" fill="url(#skyRain)" />
        ) : params.weather === 'fog' ? (
          <rect width="800" height="260" fill="url(#skyFog)" />
        ) : params.weather === 'night' ? (
          <rect width="800" height="260" fill="url(#skyNight)" />
        ) : (
          <rect width="800" height="260" fill="url(#skyClear)" />
        )}

        {/* SUN or MOON */}
        {params.weather === 'clear' && (
          <circle cx="700" cy="70" r="30" fill="#fef08a" opacity="0.8" filter="url(#glow)" />
        )}
        {params.weather === 'night' && (
          <circle cx="700" cy="70" r="15" fill="#f1f5f9" opacity="0.9" />
        )}

        {/* 2. ENVIRONMENT / SURROUNDINGS (Perspective side panels) */}
        {params.roadType === 'highway' ? (
          <>
            {/* Left highway verge */}
            <path d="M 0,260 L 320,220 L 330,220 L 0,280 Z" fill="#475569" />
            {/* Guardrail Left */}
            <line x1="0" y1="250" x2="330" y2="220" stroke="#94a3b8" strokeWidth="4" />
            <line x1="0" y1="253" x2="330" y2="221" stroke="#475569" strokeWidth="1" />
            {/* Right highway verge */}
            <path d="M 800,260 L 480,220 L 470,220 L 800,280 Z" fill="#475569" />
            {/* Guardrail Right */}
            <line x1="800" y1="250" x2="470" y2="220" stroke="#94a3b8" strokeWidth="4" />
            <line x1="800" y1="253" x2="470" y2="221" stroke="#475569" strokeWidth="1" />
          </>
        ) : params.roadType === 'country' ? (
          <>
            {/* Grass Verges */}
            <path d="M 0,210 L 330,210 L 400,260 L 0,380 Z" fill="url(#grass)" />
            <path d="M 800,210 L 470,210 L 400,260 L 800,380 Z" fill="url(#grass)" />
            {/* Small trees/bushes on country road sides */}
            <circle cx="80" cy="190" r="35" fill="#15803d" opacity="0.85" />
            <circle cx="60" cy="200" r="25" fill="#166534" opacity="0.9" />
            <circle cx="720" cy="190" r="35" fill="#15803d" opacity="0.85" />
            <circle cx="740" cy="200" r="25" fill="#166534" opacity="0.9" />
            
            {/* Country fences (Perspective) */}
            <line x1="40" y1="210" x2="320" y2="210" stroke="#78350f" strokeWidth="2" />
            <line x1="760" y1="210" x2="480" y2="210" stroke="#78350f" strokeWidth="2" />
          </>
        ) : (
          <>
            {/* Urban / Residential Houses & Sidewalks */}
            <path d="M 0,260 L 340,210 L 0,180 Z" fill="#1e293b" opacity="0.1" />
            <path d="M 800,260 L 460,210 L 800,180 Z" fill="#1e293b" opacity="0.1" />
            
            {/* Sidewalk bricks Left & Right */}
            <path d="M 0,260 L 330,210 L 350,210 L 0,290 Z" fill="#94a3b8" />
            <path d="M 800,260 L 470,210 L 450,210 L 800,290 Z" fill="#94a3b8" />
            {/* Sidewalk border lines */}
            <line x1="0" y1="260" x2="330" y2="210" stroke="#475569" strokeWidth="3" />
            <line x1="800" y1="260" x2="470" y2="210" stroke="#475569" strokeWidth="3" />

            {/* Geometric Townhouses (Left side) */}
            <rect x="0" y="80" width="100" height="140" fill="#991b1b" opacity="0.9" />
            <polygon points="0,80 50,40 100,80" fill="#7f1d1d" />
            <rect x="20" y="100" width="20" height="25" fill="#bae6fd" />
            <rect x="60" y="100" width="20" height="25" fill="#bae6fd" />
            <rect x="35" y="165" width="30" height="55" fill="#451a03" />

            <rect x="110" y="100" width="120" height="115" fill="#1e3a8a" opacity="0.9" />
            <rect x="130" y="120" width="30" height="30" fill="#fef08a" />
            <rect x="180" y="120" width="30" height="30" fill="#bae6fd" />

            {/* Geometric Townhouses (Right side) */}
            <rect x="680" y="90" width="120" height="130" fill="#155e75" opacity="0.9" />
            <polygon points="680,90 740,55 800,90" fill="#0e7490" />
            <rect x="710" y="120" width="25" height="30" fill="#bae6fd" />
            <rect x="755" y="120" width="25" height="30" fill="#bae6fd" />
          </>
        )}

        {/* 3. ROAD SURFACE (Asphalt stretching to a horizon) */}
        {params.weather === 'glossy_ice' ? (
          <path d="M 0,380 L 350,210 L 450,210 L 800,380 Z" fill="url(#asphaltGlossy)" />
        ) : params.weather === 'rain' || params.weather === 'heavy_rain' ? (
          <path d="M 0,380 L 350,210 L 450,210 L 800,380 Z" fill="url(#asphaltWet)" />
        ) : (
          <path d="M 0,380 L 350,210 L 450,210 L 800,380 Z" fill="url(#asphaltDry)" />
        )}

        {/* ROAD MARKINGS (Center lane lines in perspective) */}
        {params.hazard === 'tractor_solid_line' ? (
          // Solid white center line (unbroken, prevents overtaking!)
          <path d="M 398,210 L 402,210 L 404,380 L 396,380 Z" fill="#ffffff" />
        ) : params.roadType === 'highway' ? (
          // Highway: multiple lanes
          <>
            <path d="M 399,210 L 401,210 L 402,380 L 398,380 Z" fill="#ffffff" opacity="0.6" />
            {/* Lane dividers (Dashed) */}
            <line x1="375" y1="210" x2="330" y2="380" stroke="#ffffff" strokeWidth="2" strokeDasharray="10,15" opacity="0.7" />
            <line x1="425" y1="210" x2="470" y2="380" stroke="#ffffff" strokeWidth="2" strokeDasharray="10,15" opacity="0.7" />
          </>
        ) : (
          // Standard dashed center line
          <path d="M 399,210 L 401,210 L 402,380 L 398,380 Z" fill="#ffffff" strokeDasharray="25,20" opacity="0.8" />
        )}

        {/* SHARK TEETH (Haaientanden) (E.g. question 106) */}
        {params.roadMarkings === 'shark_teeth' && (
          <g opacity="0.9">
            {/* Perspective white triangles on the crossing road (right side) */}
            <polygon points="460,225 470,223 465,220" fill="#ffffff" />
            <polygon points="480,232 492,230 486,225" fill="#ffffff" />
            <polygon points="505,241 520,238 512,231" fill="#ffffff" />
            <polygon points="540,253 560,249 550,240" fill="#ffffff" />
            <polygon points="585,270 610,264 597,252" fill="#ffffff" />
            {/* Give way thick line */}
            <line x1="450" y1="220" x2="620" y2="250" stroke="#ffffff" strokeWidth="2" opacity="0.5" />
          </g>
        )}

        {/* ROUNDABOUT CENTER CIRCLE (For roundabout scenes) */}
        {params.hazard === 'roundabout_ahead' && (
          <g>
            {/* Perspective green island */}
            <ellipse cx="400" cy="215" rx="45" ry="12" fill="#166534" stroke="#ffffff" strokeWidth="2" />
            {/* Small blue roundabout D1 sign in center */}
            <rect x="394" y="190" width="12" height="15" fill="#475569" />
            <circle cx="400" cy="188" r="9" fill="#1d4ed8" stroke="#ffffff" strokeWidth="1" />
            <path d="M 397,188 A 3,3 0 0 1 403,188" stroke="#ffffff" strokeWidth="1.5" fill="none" />
            <polygon points="403,188 405,189 403,191" fill="#ffffff" />
          </g>
        )}

        {/* 4. PARKED CARS ON THE RIGHT (Narrowing the lane) */}
        {params.rightSideCars && (
          <g opacity="0.95">
            {/* Closest parked car (rear view) */}
            <rect x="490" y="240" width="80" height="55" rx="8" fill="#475569" />
            <rect x="500" y="245" width="60" height="22" rx="4" fill="#1e293b" /> {/* Back window */}
            <rect x="495" y="278" width="15" height="8" rx="2" fill="#ef4444" /> {/* Brake light left */}
            <rect x="550" y="278" width="15" height="8" rx="2" fill="#ef4444" /> {/* Brake light right */}
            <rect x="518" y="276" width="24" height="10" fill="#f59e0b" /> {/* License plate */}
            <circle cx="505" cy="296" r="8" fill="#111827" /> {/* Left tire */}
            <circle cx="555" cy="296" r="8" fill="#111827" /> {/* Right tire */}
            
            {/* Open Door if specified (case 125) */}
            {params.hazard === 'open_door_cyclist' && (
              <g>
                {/* Angled polygon for open door */}
                <polygon points="490,245 440,240 440,285 490,290" fill="#334155" stroke="#1e293b" strokeWidth="2" />
                <rect x="445" y="248" width="25" height="15" fill="#1e293b" opacity="0.8" /> {/* Door window */}
                <line x1="440" y1="265" x2="455" y2="265" stroke="#ffffff" strokeWidth="2" /> {/* Handle */}
              </g>
            )}

            {/* Second parked car further ahead */}
            <rect x="460" y="215" width="45" height="32" rx="4" fill="#b91c1c" />
            <rect x="466" y="218" width="33" height="12" rx="2" fill="#1e293b" />
            <circle cx="470" cy="247" r="5" fill="#111827" />
            <circle cx="495" cy="247" r="5" fill="#111827" />
          </g>
        )}

        {/* 5. ACTIVE HAZARDS / OBSTACLES (Rendered based on case) */}
        
        {/* BALL HAZARD (Case 101) */}
        {params.hazard === 'ball' && (
          <g filter="url(#glow)" className="animate-bounce">
            <circle cx="395" cy="290" r="14" fill="#ffffff" stroke="#000000" strokeWidth="2" />
            {/* Hexagon/soccer ball patches */}
            <path d="M 395,276 L 395,283 M 395,290 L 391,295 M 395,290 L 399,295" stroke="#000000" strokeWidth="2" />
            <circle cx="395" cy="290" r="4" fill="#000000" />
            {/* Shadow */}
            <ellipse cx="395" cy="308" rx="12" ry="3" fill="#000000" opacity="0.4" />
          </g>
        )}

        {/* CYCLIST (Case 104, 109, 125) */}
        {(params.hazard === 'cyclist_and_oncoming' || params.hazard === 'cyclist_headphones' || params.hazard === 'open_door_cyclist') && (
          <g transform={`translate(${params.hazard === 'open_door_cyclist' ? '330, 240' : params.hazard === 'cyclist_headphones' ? '375, 240' : '405, 230'}) scale(${params.hazard === 'open_door_cyclist' ? '1.1' : '0.9'})`} className="animate-pulse">
            {/* Bicycle rear view */}
            <line x1="20" y1="10" x2="20" y2="50" stroke="#0f172a" strokeWidth="3" /> {/* Frame */}
            <circle cx="20" cy="45" r="8" fill="#1e293b" stroke="#ffffff" strokeWidth="1" /> {/* Tire */}
            <rect x="14" y="15" width="12" height="6" fill="#f59e0b" /> {/* Reflector */}
            {/* Rider Silhouette */}
            <circle cx="20" cy="-5" r="8" fill="#0284c7" /> {/* Head */}
            {/* Headphones (Case 109) */}
            {params.hazard === 'cyclist_headphones' && (
              <path d="M 10,-5 A 10,10 0 0 1 30,-5" stroke="#ef4444" strokeWidth="3" fill="none" />
            )}
            <rect x="10" y="5" width="20" height="22" rx="4" fill="#0284c7" /> {/* Torso */}
            <rect x="6" y="8" width="5" height="15" rx="1" fill="#0369a1" /> {/* Arm L */}
            <rect x="29" y="8" width="5" height="15" rx="1" fill="#0369a1" /> {/* Arm R */}
            {/* Shadow */}
            <ellipse cx="20" cy="55" rx="15" ry="3" fill="#000000" opacity="0.3" />
          </g>
        )}

        {/* ONCOMING CAR (Case 104, 107, 118) */}
        {(params.hazard === 'cyclist_and_oncoming' || params.hazard === 'parked_cars_oncoming' || params.hazard === 'emergency_vehicle') && (
          <g transform="translate(325, 205) scale(0.6)" opacity="0.95">
            {/* Red oncoming car */}
            <rect x="0" y="10" width="60" height="36" rx="6" fill={params.hazard === 'emergency_vehicle' ? '#dc2626' : '#b91c1c'} />
            <rect x="6" y="14" width="48" height="14" rx="2" fill="#bae6fd" /> {/* Windshield */}
            {/* Bright glowing headlights (yellow white) */}
            <circle cx="10" cy="35" r="8" fill="#fef08a" filter="url(#glow)" />
            <circle cx="50" cy="35" r="8" fill="#fef08a" filter="url(#glow)" />
            <circle cx="10" cy="35" r="4" fill="#ffffff" />
            <circle cx="50" cy="35" r="4" fill="#ffffff" />
            <rect x="18" y="32" width="24" height="8" fill="#ffffff" /> {/* Plate */}
            <circle cx="12" cy="48" r="5" fill="#111827" /> {/* Tires */}
            <circle cx="48" cy="48" r="5" fill="#111827" />
            
            {/* Flashing Blue Sirens (Case 118 emergency vehicle) */}
            {params.hazard === 'emergency_vehicle' && (
              <g className="animate-ping">
                <rect x="22" y="0" width="16" height="10" fill="#3b82f6" rx="2" />
                <circle cx="30" cy="-2" r="14" fill="#60a5fa" opacity="0.7" filter="url(#glow)" />
              </g>
            )}
          </g>
        )}

        {/* CAR AHEAD (Case 102, 116) */}
        {(params.hazard === 'car_ahead_120m' || params.hazard === 'merging_car_blinker') && (
          <g transform={params.hazard === 'merging_car_blinker' ? 'translate(440, 220) scale(0.95)' : 'translate(385, 210) scale(0.45)'}>
            {/* Rear view of grey passenger car */}
            <rect x="0" y="10" width="60" height="40" rx="6" fill="#64748b" />
            <rect x="8" y="15" width="44" height="14" rx="2" fill="#1e293b" /> {/* Window */}
            <rect x="4" y="36" width="12" height="6" fill="#b91c1c" /> {/* Left tail light */}
            <rect x="44" y="36" width="12" height="6" fill="#b91c1c" /> {/* Right tail light */}
            
            {/* Left Blinker flashing for merging car (Case 116) */}
            {params.hazard === 'merging_car_blinker' && (
              <circle cx="4" cy="39" r="6" fill="#f59e0b" className="animate-pulse" filter="url(#glow)" />
            )}
            
            <rect x="22" y="35" width="16" height="8" fill="#f59e0b" /> {/* License plate */}
            <circle cx="12" cy="50" r="6" fill="#111827" /> {/* Tires */}
            <circle cx="48" cy="50" r="6" fill="#111827" />
          </g>
        )}

        {/* OVERHEAD MATRIX BOARD (Case 105) */}
        {params.hazard === 'matrix_70' && (
          <g>
            {/* Portal Gantry Frame */}
            <rect x="150" y="40" width="500" height="15" fill="#475569" />
            <rect x="180" y="55" width="15" height="170" fill="#64748b" />
            <rect x="600" y="55" width="15" height="170" fill="#64748b" />
            
            {/* Glowing Matrix Display */}
            <rect x="340" y="15" width="120" height="65" rx="5" fill="#020617" stroke="#334155" strokeWidth="4" />
            <circle cx="400" cy="48" r="24" stroke="#ef4444" strokeWidth="5" fill="none" /> {/* Red circle limit */}
            <text x="400" y="56" fill="#f97316" fontSize="24" fontWeight="900" textAnchor="middle" filter="url(#matrixGlow)" fontFamily="monospace">70</text>
          </g>
        )}

        {/* TRACTOR (Case 114) */}
        {params.hazard === 'tractor_solid_line' && (
          <g transform="translate(375, 215) scale(0.9)" className="animate-pulse">
            {/* Rear of Green Agricultural Tractor */}
            <rect x="10" y="0" width="40" height="35" fill="#166534" rx="2" /> {/* Cabin */}
            <rect x="14" y="4" width="32" height="16" fill="#bae6fd" /> {/* Rear window */}
            <rect x="2" y="20" width="12" height="35" fill="#111827" rx="3" /> {/* Big left tire */}
            <rect x="46" y="20" width="12" height="35" fill="#111827" rx="3" /> {/* Big right tire */}
            <rect x="14" y="30" width="32" height="20" fill="#14532d" /> {/* Body */}
            <rect x="18" y="42" width="8" height="6" fill="#ef4444" /> {/* Left lights */}
            <rect x="34" y="42" width="8" height="6" fill="#ef4444" /> {/* Right lights */}
            <polygon points="30,10 32,5 34,10" fill="#f59e0b" /> {/* Triangle warning sign */}
            {/* Exhause pipe with subtle smoke puff */}
            <line x1="42" y1="0" x2="42" y2="-12" stroke="#475569" strokeWidth="2" />
            <circle cx="44" cy="-16" r="4" fill="#94a3b8" opacity="0.3" />
          </g>
        )}

        {/* TRUCK BRAKING (Case 108) */}
        {params.hazard === 'braking_truck_hazards' && (
          <g transform="translate(365, 205) scale(1.15)">
            {/* Back of large shipping truck */}
            <rect x="0" y="0" width="70" height="65" rx="2" fill="#1e3a8a" /> {/* Blue cargo box */}
            <rect x="4" y="65" width="14" height="12" fill="#111827" /> {/* Left tire */}
            <rect x="52" y="65" width="14" height="12" fill="#111827" /> {/* Right tire */}
            {/* Active red glowing brake lights */}
            <rect x="4" y="56" width="16" height="8" fill="#ef4444" filter="url(#glow)" />
            <rect x="50" y="56" width="16" height="8" fill="#ef4444" filter="url(#glow)" />
            {/* Glowing amber hazard indicators flashing */}
            <circle cx="4" cy="50" r="5" fill="#f59e0b" className="animate-ping" filter="url(#glow)" />
            <circle cx="66" cy="50" r="5" fill="#f59e0b" className="animate-ping" filter="url(#glow)" />
            
            {/* Warning triangle */}
            <polygon points="35,20 20,45 50,45" stroke="#ef4444" strokeWidth="3" fill="none" />
          </g>
        )}

        {/* SANITATION / GARBAGE TRUCK & WORKERS (Case 115) */}
        {params.hazard === 'garbage_truck_workers' && (
          <g>
            {/* Orange sanitation truck back */}
            <g transform="translate(365, 200) scale(1.1)">
              <rect x="0" y="0" width="70" height="70" fill="#ea580c" rx="4" />
              {/* Back loading hopper */}
              <rect x="10" y="20" width="50" height="45" fill="#4b5563" />
              {/* Flashers flashing */}
              <circle cx="8" cy="8" r="6" fill="#f59e0b" className="animate-ping" filter="url(#glow)" />
              <circle cx="62" cy="8" r="6" fill="#f59e0b" className="animate-ping" filter="url(#glow)" />
              {/* Brake lights */}
              <rect x="4" y="58" width="12" height="6" fill="#ef4444" />
              <rect x="54" y="58" width="12" height="6" fill="#ef4444" />
            </g>
            {/* Worker silhouette on left moving trash bin */}
            <g transform="translate(330, 240) scale(0.8)">
              <circle cx="20" cy="10" r="7" fill="#ea580c" /> {/* Helmet / Head */}
              <rect x="12" y="18" width="16" height="25" fill="#ea580c" /> {/* Orange safety vest */}
              <line x1="12" y1="18" x2="0" y2="30" stroke="#ea580c" strokeWidth="4" /> {/* Arm */}
              {/* Wheelie garbage bin */}
              <rect x="-10" y="25" width="18" height="28" fill="#374151" rx="2" stroke="#111827" />
              <circle cx="-6" cy="53" r="3" fill="#111827" />
            </g>
          </g>
        )}

        {/* CHILDREN SIDEWALK (Case 110) */}
        {params.hazard === 'children_sidewalk_40m' && (
          <g transform="translate(250, 195)" className="animate-bounce">
            {/* Little girl and boy playing on left sidewalk */}
            <circle cx="20" cy="12" r="5" fill="#ec4899" />
            <polygon points="15,35 20,18 25,35" fill="#db2777" /> {/* Dress */}
            <circle cx="35" cy="14" r="5" fill="#0284c7" />
            <rect x="30" y="20" width="10" height="15" fill="#0369a1" /> {/* Pants */}
          </g>
        )}

        {/* PEDESTRIAN IN BERM (Case 111) */}
        {params.hazard === 'pedestrian_berm' && (
          <g transform="translate(480, 215) scale(0.9)" opacity="0.8">
            {/* Silhouette walking in dark grass roadside */}
            <circle cx="20" cy="10" r="6" fill="#f1f5f9" />
            <rect x="12" y="18" width="16" height="26" rx="2" fill="#475569" />
            <line x1="15" y1="44" x2="15" y2="58" stroke="#334155" strokeWidth="4" />
            <line x1="25" y1="44" x2="21" y2="58" stroke="#334155" strokeWidth="4" />
          </g>
        )}

        {/* LOOSE DOG ON SIDEWALK (Case 122) */}
        {params.hazard === 'loose_dog' && (
          <g transform="translate(540, 240) scale(1.1)">
            {/* Small dog running on the right side */}
            <rect x="10" y="20" width="24" height="12" rx="3" fill="#78350f" /> {/* Torso */}
            <circle cx="34" cy="16" r="6" fill="#78350f" /> {/* Head */}
            <rect x="32" y="10" width="3" height="6" fill="#92400e" /> {/* Ear */}
            <line x1="14" y1="32" x2="14" y2="40" stroke="#78350f" strokeWidth="3" /> {/* Legs */}
            <line x1="28" y1="32" x2="28" y2="40" stroke="#78350f" strokeWidth="3" />
            <path d="M 10,22 Q 2,15 5,10" stroke="#78350f" strokeWidth="2.5" fill="none" /> {/* Tail */}
          </g>
        )}

        {/* BLIND PEDESTRIAN CANE (Case 124) */}
        {params.hazard === 'blind_pedestrian_cane' && (
          <g transform="translate(260, 225) scale(1.15)">
            {/* Elderly person silhouette */}
            <circle cx="20" cy="10" r="5" fill="#475569" />
            <rect x="14" y="16" width="12" height="24" rx="2" fill="#334155" />
            {/* White cane with red stripes */}
            <line x1="22" y1="24" x2="38" y2="44" stroke="#ffffff" strokeWidth="2" />
            <line x1="32" y1="34" x2="35" y2="38" stroke="#ef4444" strokeWidth="2.5" /> {/* Red stripe */}
            <line x1="16" y1="40" x2="16" y2="52" stroke="#1e293b" strokeWidth="3" />
            <line x1="22" y1="40" x2="22" y2="52" stroke="#1e293b" strokeWidth="3" />
          </g>
        )}

        {/* HEAVY SPRAY FROM TRUCK (Case 112) */}
        {params.hazard === 'water_spray_trucks' && (
          <g opacity="0.9">
            {/* Large semi-truck fading in fog/spray ahead */}
            <rect x="360" y="180" width="80" height="50" rx="3" fill="#cbd5e1" opacity="0.4" />
            {/* Huge water spray mist polygons */}
            <ellipse cx="400" cy="225" rx="140" ry="25" fill="#f1f5f9" opacity="0.65" filter="url(#glow)" />
            <ellipse cx="370" cy="230" rx="80" ry="18" fill="#e2e8f0" opacity="0.5" filter="url(#glow)" />
            <ellipse cx="430" cy="230" rx="80" ry="18" fill="#e2e8f0" opacity="0.5" filter="url(#glow)" />
          </g>
        )}

        {/* 6. ENVIRONMENTAL OVERLAYS (Rain / Fog / Night) */}
        
        {/* FOG OVERLAY (case 102, 203) */}
        {(params.weather === 'fog' || params.weather === 'heavy_rain') && (
          // Giant soft white-grey radial gradient to simulate thick fog hiding background
          <rect width="800" height="260" fill="url(#skyFog)" opacity={params.weather === 'heavy_rain' ? '0.4' : '0.82'} />
        )}

        {/* RAIN OVERLAY (case 101, 108, 112) */}
        {(params.weather === 'rain' || params.weather === 'heavy_rain') && (
          <g opacity="0.75">
            {/* Rain streaks */}
            <line x1="50" y1="10" x2="40" y2="100" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.5" />
            <line x1="180" y1="30" x2="170" y2="120" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.4" />
            <line x1="290" y1="50" x2="280" y2="180" stroke="#cbd5e1" strokeWidth="2" opacity="0.6" />
            <line x1="420" y1="10" x2="410" y2="150" stroke="#cbd5e1" strokeWidth="2" opacity="0.5" />
            <line x1="560" y1="40" x2="550" y2="140" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.4" />
            <line x1="680" y1="20" x2="670" y2="110" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.5" />
            <line x1="740" y1="60" x2="730" y2="190" stroke="#cbd5e1" strokeWidth="2.5" opacity="0.6" className="animate-pulse" />
          </g>
        )}

        {/* 7. REAR-VIEW MIRROR (Top Center - Critical visual cue!) */}
        <g filter="url(#glow)">
          {/* Mirror housing */}
          <rect x="280" y="10" width="240" height="50" rx="25" fill="#1e293b" stroke="#475569" strokeWidth="3" />
          {/* Mirror glass reflection */}
          <rect x="286" y="15" width="228" height="40" rx="20" fill="#bae6fd" opacity="0.9" />
          
          {/* Reflection Content */}
          {params.mirror === 'tailgater' ? (
            <g transform="translate(370, 18) scale(1.1)">
              {/* Headlights and windshield of tailgating car extremely close! */}
              <rect x="10" y="5" width="40" height="24" rx="4" fill="#ef4444" />
              <rect x="14" y="8" width="32" height="10" rx="2" fill="#1e293b" /> {/* Windshield */}
              <circle cx="15" cy="22" r="6" fill="#fef08a" filter="url(#glow)" /> {/* Glowing lights */}
              <circle cx="45" cy="22" r="6" fill="#fef08a" filter="url(#glow)" />
              <text x="30" y="16" fill="#ffffff" fontSize="5" fontWeight="900" textAnchor="middle">CBR</text>
            </g>
          ) : (
            <g transform="translate(390, 22) scale(0.6)">
              {/* Clear road / tiny car far away */}
              <rect x="15" y="8" width="20" height="12" rx="2" fill="#475569" />
              <circle cx="18" cy="16" r="3" fill="#fef08a" />
              <circle cx="32" cy="16" r="3" fill="#fef08a" />
              <line x1="-150" y1="35" x2="350" y2="35" stroke="#475569" strokeWidth="1" opacity="0.3" />
            </g>
          )}
        </g>

        {/* 8. SPEED SIGN DISPLAY ROADSIDE (Case 103, 110, 120, etc.) */}
        {params.sign && (
          <g transform="translate(680, 210) scale(1.2)">
            {/* Pole */}
            <rect x="19" y="10" width="3" height="90" fill="#94a3b8" />
            {params.sign === 'G5' ? (
              // Woonerf G5 blue sign
              <g>
                <rect x="5" y="-12" width="30" height="25" rx="3" fill="#1d4ed8" stroke="#ffffff" strokeWidth="1.5" />
                <path d="M 12,-4 L 12,8" stroke="#ffffff" strokeWidth="1.5" /> {/* Simple house icon outline */}
                <polygon points="9,-4 15,-10 21,-4" stroke="#ffffff" strokeWidth="1.5" fill="none" />
                <circle cx="25" cy="2" r="2.5" fill="#f97316" /> {/* Child playing */}
              </g>
            ) : params.sign === 'J12' ? (
              // J12 Children Crossing (Red Triangle)
              <g>
                <polygon points="20,-15 5,12 35,12" fill="#ffffff" stroke="#ef4444" strokeWidth="3.5" />
                {/* Two tiny black dots representing running kids */}
                <circle cx="18" cy="5" r="2" fill="#000000" />
                <circle cx="23" cy="7" r="1.5" fill="#000000" />
              </g>
            ) : params.sign === 'J7' ? (
              // J7 Road narrowing (Red Triangle)
              <g>
                <polygon points="20,-15 5,12 35,12" fill="#ffffff" stroke="#ef4444" strokeWidth="3.5" />
                <line x1="16" y1="8" x2="16" y2="-4" stroke="#000000" strokeWidth="2.5" />
                <path d="M 24,8 L 24,2 L 21,-1 L 21,-4" stroke="#000000" strokeWidth="2.5" fill="none" />
              </g>
            ) : params.sign === 'D1' ? (
              // D1 Roundabout ahead blue circle
              <g>
                <circle cx="20" cy="0" r="14" fill="#1d4ed8" stroke="#ffffff" strokeWidth="2" />
                <circle cx="20" cy="0" r="8" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3,3" fill="none" />
              </g>
            ) : params.sign === 'B1' ? (
              // B1 Yellow diamond priority
              <g>
                <polygon points="20,-10 32,2 20,14 8,2" fill="#eab308" stroke="#ffffff" strokeWidth="2.5" />
                <polygon points="20,-6 28,2 20,10 12,2" fill="#facc15" />
              </g>
            ) : params.sign.startsWith('A1-') ? (
              // Speed limit circle (A1-100 or A1-130)
              <g>
                <circle cx="20" cy="0" r="14" fill="#ffffff" stroke="#ef4444" strokeWidth="3.5" />
                <text x="20" y="4" fill="#000000" fontSize="12" fontWeight="900" textAnchor="middle" fontFamily="monospace">
                  {params.sign.split('-')[1]}
                </text>
              </g>
            ) : null}
          </g>
        )}

        {/* 9. WINDSHIELD WIPER PATH & RAINDROPS SWEEP */}
        {(params.weather === 'rain' || params.weather === 'heavy_rain') && (
          <g opacity="0.15">
            {/* Wiped arcs - where windshield is clean */}
            <path d="M 150,380 A 300,300 0 0,1 650,380 Z" fill="#93c5fd" opacity="0.3" />
            <line x1="400" y1="380" x2="250" y2="120" stroke="#000000" strokeWidth="5" /> {/* Left Wiper arm */}
            <line x1="500" y1="380" x2="350" y2="120" stroke="#000000" strokeWidth="5" /> {/* Right Wiper arm */}
          </g>
        )}

        {/* 10. FRONT CAR WINDSHIELD PILLARS FRAME (IMMERSIVE INTERIOR) */}
        <g>
          {/* Left A-Pillar */}
          <polygon points="0,0 60,0 120,380 0,380" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
          {/* Right A-Pillar */}
          <polygon points="800,0 740,0 680,380 800,380" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
          {/* Top windshield trim */}
          <rect x="0" y="0" width="800" height="20" fill="#1e293b" />
          {/* Dashboard top trim */}
          <path d="M 0,378 L 800,378 L 800,450 L 0,450 Z" fill="#0f172a" />
        </g>
      </svg>

      {/* 11. DASHBOARD OVERLAY CONTROLS (HTML overlaid on dashboard area) */}
      <div className="absolute bottom-0 left-0 right-0 h-[72px] bg-gradient-to-t from-black via-zinc-950 to-zinc-900 border-t border-zinc-800/80 flex items-center justify-between px-6 text-white select-none z-10">
        
        {/* DRIVER'S COCKPIT INSTRUMENT: SPEEDOMETER */}
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full border-2 border-zinc-700 bg-black flex items-center justify-center">
            {/* Speedometer ticks (Visual) */}
            <div className="absolute inset-1 rounded-full border border-dashed border-zinc-800 opacity-60"></div>
            {/* Pointer (Needle) rotated dynamically based on speed */}
            <div 
              className="absolute w-1 h-5 bg-orange-500 origin-bottom rounded-full"
              style={{ 
                transform: `rotate(${Math.min(params.speed * 1.8 - 90, 150)}deg)`,
                bottom: '50%'
              }}
            ></div>
            <div className="absolute w-2 h-2 rounded-full bg-zinc-400 z-10"></div>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-xl font-black text-orange-400 leading-none tracking-tight">
              {params.speed}
            </span>
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              km/u (Speed)
            </span>
          </div>
        </div>

        {/* CLIMATE & STATUS INDICATORS (Dutch labels for realism) */}
        <div className="hidden sm:flex items-center gap-4 text-[10px] font-mono text-zinc-500">
          <div className="flex flex-col items-end">
            <span className="text-zinc-400 font-bold uppercase">{params.weather === 'night' ? 'DIMLICHT IN' : 'DAGLICHT'}</span>
            <span>{params.weather === 'rain' || params.weather === 'heavy_rain' ? 'REGENSENS.' : params.weather === 'fog' ? 'MISTSENS.' : 'H. HELDER'}</span>
          </div>
          <div className="h-6 w-px bg-zinc-800"></div>
          <div className="flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[9px] font-extrabold text-zinc-300">CBR COCKPIT</span>
          </div>
        </div>

        {/* TIRE WARNING LIGHT OR STATUS (Case 123) */}
        <div className="flex items-center gap-3">
          {params.hazard === 'tire_warning_light' ? (
            <div className="flex items-center gap-2 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 animate-pulse text-amber-500">
              <span className="text-xs">⚠️</span>
              <span className="text-[9px] font-extrabold font-mono uppercase tracking-wider">BANDENSPANNING!</span>
            </div>
          ) : params.weather === 'glossy_ice' ? (
            <div className="flex items-center gap-2 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 text-blue-400">
              <span className="text-xs">❄️</span>
              <span className="text-[9px] font-extrabold font-mono uppercase tracking-wider">GLADHEID (-2°C)</span>
            </div>
          ) : (
            <div className="text-right flex flex-col">
              <span className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest">DRIVERS PERSPECTIVE</span>
              <span className="text-[10px] text-zinc-300 font-semibold truncate max-w-[150px] sm:max-w-[200px]">
                {lang === 'nl' ? 'Kijk goed vooruit!' : lang === 'ar' ? 'راقب الطريق بحذر!' : 'Observe road situations!'}
              </span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
