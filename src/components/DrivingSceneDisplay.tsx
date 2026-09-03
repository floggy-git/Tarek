import React from 'react';
import { DrivingSceneBg } from './DrivingSceneBg';
import { DrivingSceneVehicles } from './DrivingSceneVehicles';
import { DrivingSceneDashboard } from './DrivingSceneDashboard';
import { EXAM_QUESTIONS_POOL } from '../data/questionsBank';

interface DrivingSceneProps {
  questionId: number;
  lang?: 'en' | 'nl' | 'ar';
}

const DrivingSceneDisplayComponent: React.FC<DrivingSceneProps> = ({ questionId, lang = 'en' }) => {
  // Extract scene parameters based on questionId
  const getSceneParams = (id: number) => {
    switch (id) {
      // --- HAZARD PERCEPTION (101 - 125) ---
      case 101:
        return {
          speed: 50,
          roadType: 'residential' as const,
          weather: 'rain' as const,
          hazard: 'ball',
          mirror: 'clear' as const,
          rightSideCars: true,
          description: 'A ball rolls onto a wet residential street. Active braking required.'
        };
      case 102:
        return {
          speed: 100,
          roadType: 'highway' as const,
          weather: 'fog' as const,
          hazard: 'car_ahead_120m',
          mirror: 'clear' as const,
          description: 'Light fog on highway. Tailcar is 120m ahead. Release accelerator.'
        };
      case 103:
        return {
          speed: 30,
          roadType: 'woonerf' as const,
          weather: 'clear' as const,
          hazard: 'none',
          mirror: 'tailgater' as const,
          sign: 'G5',
          description: 'Entering a Woonerf at 30 km/h (limit is 15 km/h). Immediate brake!'
        };
      case 104:
        return {
          speed: 80,
          roadType: 'country' as const,
          weather: 'clear' as const,
          hazard: 'cyclist_and_oncoming',
          mirror: 'clear' as const,
          description: 'Cyclist in lane with oncoming traffic. Brake and wait.'
        };
      case 105:
        return {
          speed: 120,
          roadType: 'highway' as const,
          weather: 'clear' as const,
          hazard: 'matrix_70',
          mirror: 'clear' as const,
          description: 'Smooth traffic, but overhead matrix sign displays 70. Brake!'
        };
      case 106:
        return {
          speed: 50,
          roadType: 'urban' as const,
          weather: 'clear' as const,
          hazard: 'car_behind_shark_teeth',
          mirror: 'clear' as const,
          roadMarkings: 'shark_teeth',
          description: 'You are on a priority road. Car waiting behind shark teeth. Do nothing.'
        };
      case 107:
        return {
          speed: 50,
          roadType: 'urban' as const,
          weather: 'clear' as const,
          hazard: 'parked_cars_oncoming',
          mirror: 'clear' as const,
          rightSideCars: true,
          description: 'Road narrows due to parked cars. Oncoming car approaching. Brake!'
        };
      case 108:
        return {
          speed: 80,
          roadType: 'country' as const,
          weather: 'rain' as const,
          hazard: 'braking_truck_hazards',
          mirror: 'clear' as const,
          description: 'Truck ahead brakes suddenly with hazard lights flashing on wet road. Brake!'
        };
      case 109:
        return {
          speed: 30,
          roadType: 'residential' as const,
          weather: 'clear' as const,
          hazard: 'cyclist_headphones',
          mirror: 'clear' as const,
          description: 'Cyclist ahead swerving with headphones on. Release accelerator.'
        };
      case 110:
        return {
          speed: 50,
          roadType: 'urban' as const,
          weather: 'clear' as const,
          hazard: 'children_sidewalk_40m',
          mirror: 'clear' as const,
          sign: 'J12',
          description: 'School warning sign. Children playing on sidewalk. Brake!'
        };
      case 111:
        return {
          speed: 80,
          roadType: 'country' as const,
          weather: 'night' as const,
          hazard: 'pedestrian_berm',
          mirror: 'clear' as const,
          description: 'Dark night. Pedestrian walking on grass roadside under low beams. Brake!'
        };
      case 112:
        return {
          speed: 100,
          roadType: 'highway' as const,
          weather: 'heavy_rain' as const,
          hazard: 'water_spray_trucks',
          mirror: 'clear' as const,
          description: 'Heavy rain. Extreme spray from trucks reduces visibility below 50m. Brake!'
        };
      case 113:
        return {
          speed: 50,
          roadType: 'urban' as const,
          weather: 'clear' as const,
          hazard: 'roundabout_ahead',
          mirror: 'clear' as const,
          sign: 'D1',
          description: 'Approaching a roundabout with empty roads. Release accelerator to match speed.'
        };
      case 114:
        return {
          speed: 80,
          roadType: 'country' as const,
          weather: 'clear' as const,
          hazard: 'tractor_solid_line',
          mirror: 'tailgater' as const,
          description: 'Slow tractor ahead. Solid center line prevents overtaking. Brake!'
        };
      case 115:
        return {
          speed: 30,
          roadType: 'residential' as const,
          weather: 'clear' as const,
          hazard: 'garbage_truck_workers',
          mirror: 'clear' as const,
          description: 'Garbage truck stopped with hazard lights; sanitation workers active. Brake!'
        };
      case 116:
        return {
          speed: 100,
          roadType: 'highway' as const,
          weather: 'clear' as const,
          hazard: 'merging_car_blinker',
          mirror: 'clear' as const,
          description: 'Car on right has left blinker active and drifts close. Release accelerator.'
        };
      case 117:
        return {
          speed: 50,
          roadType: 'urban' as const,
          weather: 'clear' as const,
          hazard: 'pigeon_asphalt',
          mirror: 'tailgater' as const,
          description: 'Pigeon on the asphalt 15m ahead. Tailgater behind. Do nothing.'
        };
      case 118:
        return {
          speed: 50,
          roadType: 'urban' as const,
          weather: 'clear' as const,
          hazard: 'emergency_vehicle',
          mirror: 'clear' as const,
          description: 'Emergency vehicle with blue flashing lights approaching crossing. Brake!'
        };
      case 119:
        return {
          speed: 50,
          roadType: 'urban' as const,
          weather: 'glossy_ice' as const,
          hazard: 'black_ice',
          mirror: 'clear' as const,
          description: 'Winter temperature -2°C, glossy wet road indicates black ice. Brake!'
        };
      case 120:
        return {
          speed: 80,
          roadType: 'country' as const,
          weather: 'clear' as const,
          hazard: 'narrow_bridge_curve',
          mirror: 'clear' as const,
          sign: 'J8',
          description: 'Blind curve and narrow bridge warning ahead. Brake!'
        };
      case 121:
        return {
          speed: 50,
          roadType: 'urban' as const,
          weather: 'clear' as const,
          hazard: 'delivery_van_legs',
          mirror: 'clear' as const,
          rightSideCars: true,
          description: 'Delivery van with hazard lights; person\'s legs visible behind it. Brake!'
        };
      case 122:
        return {
          speed: 30,
          roadType: 'residential' as const,
          weather: 'clear' as const,
          hazard: 'loose_dog',
          mirror: 'clear' as const,
          description: 'Dog running loose without a leash on the right sidewalk. Release accelerator.'
        };
      case 123:
        return {
          speed: 100,
          roadType: 'highway' as const,
          weather: 'clear' as const,
          hazard: 'tire_warning_light',
          mirror: 'clear' as const,
          description: 'Tire pressure dashboard light activates. Release accelerator.'
        };
      case 124:
        return {
          speed: 50,
          roadType: 'urban' as const,
          weather: 'clear' as const,
          hazard: 'blind_pedestrian_cane',
          mirror: 'clear' as const,
          description: 'Elderly blind person with red-striped white cane preparing to cross. Brake!'
        };
      case 125:
        return {
          speed: 50,
          roadType: 'urban' as const,
          weather: 'clear' as const,
          hazard: 'open_door_cyclist',
          mirror: 'clear' as const,
          rightSideCars: true,
          description: 'Cyclist on right, parked car ahead with open door. Brake!'
        };

      // --- RULES & KNOWLEDGE SCENES (201 - 215) ---
      case 201:
        return { speed: 50, roadType: 'urban' as const, weather: 'night' as const, hazard: 'none', mirror: 'clear' as const, description: 'Alcohol blood limit for beginners.' };
      case 202:
        return { speed: 100, roadType: 'highway' as const, weather: 'clear' as const, hazard: 'none', mirror: 'clear' as const, sign: 'A1-100', description: 'Daytime highway speed limit in NL.' };
      case 203:
        return { speed: 80, roadType: 'country' as const, weather: 'fog' as const, hazard: 'none', mirror: 'clear' as const, description: 'Foggy provincial country road.' };
      case 204:
        return { speed: 100, roadType: 'highway' as const, weather: 'clear' as const, hazard: 'car_ahead_120m', mirror: 'clear' as const, description: 'Safe trailing distance rule.' };
      case 205:
        return { speed: 100, roadType: 'highway' as const, weather: 'clear' as const, hazard: 'none', mirror: 'clear' as const, sign: 'G1', description: 'Minimum highway speed technical rule.' };
      case 206:
        return { speed: 30, roadType: 'urban' as const, weather: 'clear' as const, hazard: 'none', mirror: 'clear' as const, sign: 'E1', description: 'Parking boundary from crossroads.' };
      case 207:
        return { speed: 40, roadType: 'urban' as const, weather: 'clear' as const, hazard: 'none', mirror: 'clear' as const, description: 'Safe vehicle towing length constraint.' };
      case 208:
        return { speed: 30, roadType: 'residential' as const, weather: 'clear' as const, hazard: 'cyclist_headphones', mirror: 'clear' as const, description: 'Cycling holding a mobile phone rule.' };
      case 209:
        return { speed: 50, roadType: 'urban' as const, weather: 'clear' as const, hazard: 'none', mirror: 'clear' as const, description: 'Broken bicycle lane markings guidelines.' };
      case 210:
        return { speed: 50, roadType: 'urban' as const, weather: 'clear' as const, hazard: 'none', mirror: 'clear' as const, description: 'Standard built-up area default speed.' };
      case 211:
        return { speed: 50, roadType: 'residential' as const, weather: 'clear' as const, hazard: 'none', mirror: 'clear' as const, description: 'Child safety seating rules.' };
      case 212:
        return { speed: 80, roadType: 'country' as const, weather: 'clear' as const, hazard: 'tractor_solid_line', mirror: 'clear' as const, description: 'Overtaking with solid lines restrictions.' };
      case 213:
        return { speed: 50, roadType: 'urban' as const, weather: 'clear' as const, hazard: 'none', mirror: 'clear' as const, description: 'Triangle placement parameters.' };
      case 214:
        return { speed: 50, roadType: 'country' as const, weather: 'heavy_rain' as const, hazard: 'none', mirror: 'clear' as const, description: 'Front fog lights legal parameters.' };
      case 215:
        return { speed: 80, roadType: 'highway' as const, weather: 'clear' as const, hazard: 'none', mirror: 'clear' as const, description: 'Temporary spare wheel limit.' };

      // --- INSIGHT & SITUATIONS SCENES (301 - 318) ---
      case 301:
        return { speed: 30, roadType: 'urban' as const, weather: 'clear' as const, hazard: 'none', mirror: 'clear' as const, sign: 'J25', description: 'Priority at equal crossroads.' };
      case 302:
        return { speed: 30, roadType: 'urban' as const, weather: 'clear' as const, hazard: 'none', mirror: 'clear' as const, sign: 'J24', description: 'Tram priority rule at equal intersections.' };
      case 303:
        return { speed: 30, roadType: 'urban' as const, weather: 'clear' as const, hazard: 'none', mirror: 'clear' as const, sign: 'J13', description: 'Yield to straight pedestrian when turning right.' };
      case 304:
        return { speed: 30, roadType: 'residential' as const, weather: 'clear' as const, hazard: 'roundabout_ahead', mirror: 'clear' as const, sign: 'D1', description: 'Roundabout bicycle right of way.' };
      case 305:
        return { speed: 35, roadType: 'urban' as const, weather: 'clear' as const, hazard: 'none', mirror: 'clear' as const, sign: 'B6', roadMarkings: 'shark_teeth', description: 'Sign B6 and shark teeth guidelines.' };
      case 306:
        return { speed: 30, roadType: 'country' as const, weather: 'clear' as const, hazard: 'none', mirror: 'clear' as const, description: 'Exiting unpaved sandweg to paved road.' };
      case 307:
        return { speed: 50, roadType: 'urban' as const, weather: 'clear' as const, hazard: 'none', mirror: 'clear' as const, description: 'Bus pulling out priority.' };
      case 308:
        return { speed: 50, roadType: 'urban' as const, weather: 'clear' as const, hazard: 'emergency_vehicle', mirror: 'clear' as const, description: 'Emergency vehicle flashing sirens.' };
      case 309:
        return { speed: 30, roadType: 'urban' as const, weather: 'clear' as const, hazard: 'none', mirror: 'clear' as const, description: 'Military convoy intersection crossing.' };
      case 310:
        return { speed: 30, roadType: 'urban' as const, weather: 'clear' as const, hazard: 'blind_pedestrian_cane', mirror: 'clear' as const, description: 'Blind pedestrian priority.' };
      case 311:
        return { speed: 15, roadType: 'residential' as const, weather: 'clear' as const, hazard: 'none', mirror: 'clear' as const, description: 'Exiting gateway special maneuver.' };
      case 312:
        return { speed: 30, roadType: 'urban' as const, weather: 'clear' as const, hazard: 'roundabout_ahead', mirror: 'clear' as const, sign: 'D1', description: 'Turbo roundabout priority flow.' };
      case 313:
        return { speed: 30, roadType: 'urban' as const, weather: 'clear' as const, hazard: 'none', mirror: 'clear' as const, description: 'Turning left against oncoming cyclists.' };
      case 314:
        return { speed: 50, roadType: 'urban' as const, weather: 'clear' as const, hazard: 'none', mirror: 'clear' as const, sign: 'B1', description: 'Priority road B1 rules.' };
      case 315:
        return { speed: 40, roadType: 'urban' as const, weather: 'clear' as const, hazard: 'none', mirror: 'clear' as const, sign: 'B1', description: 'Priority road funeral procession.' };
      case 316:
        return { speed: 15, roadType: 'woonerf' as const, weather: 'clear' as const, hazard: 'none', mirror: 'clear' as const, sign: 'G5', description: 'Woonerf zones living rules.' };
      case 317:
        return { speed: 30, roadType: 'urban' as const, weather: 'clear' as const, hazard: 'roundabout_ahead', mirror: 'clear' as const, description: 'Roundabout blinker guidelines.' };
      case 318:
        return { speed: 80, roadType: 'country' as const, weather: 'clear' as const, hazard: 'none', mirror: 'clear' as const, sign: 'C15', description: 'C15 pedestrian closure sign.' };

      // --- STATIC REVIEW DEFAULTS ---
      default:
        return { speed: 50, roadType: 'urban' as const, weather: 'clear' as const, hazard: 'none', mirror: 'clear' as const, description: 'Standard driving scene' };
    }
  };

  const params = getSceneParams(questionId);

  // Dynamically query questions bank to extract signCode
  const currentQuestion = EXAM_QUESTIONS_POOL.find(q => q.id === questionId);
  const signCode = currentQuestion?.signCode || params.sign;

  // Custom vector sign drawing centered at (0, 0)
  const renderVectorSign = (code: string) => {
    switch (code) {
      case 'A1-100':
        return (
          <g>
            <circle cx="0" cy="0" r="18" fill="#ffffff" stroke="#dc2626" strokeWidth="3.5" />
            <text x="0" y="4.5" fill="#000000" fontSize="11" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="-0.5">100</text>
          </g>
        );
      case 'A1-130':
        return (
          <g>
            <circle cx="0" cy="0" r="18" fill="#ffffff" stroke="#dc2626" strokeWidth="3.5" />
            <text x="0" y="4.5" fill="#000000" fontSize="11" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="-0.5">130</text>
          </g>
        );
      case 'B1':
        return (
          <g>
            <polygon points="0,-18 18,0 0,18 -18,0" fill="#ffffff" stroke="#1e293b" strokeWidth="0.8" />
            <polygon points="0,-14 14,0 0,14 -14,0" fill="#facc15" />
          </g>
        );
      case 'B6':
        return (
          <g>
            <polygon points="0,18 -18,-14 18,-14" fill="#ffffff" stroke="#dc2626" strokeWidth="3.5" />
          </g>
        );
      case 'D1':
        return (
          <g>
            <circle cx="0" cy="0" r="18" fill="#1d4ed8" stroke="#ffffff" strokeWidth="1" />
            <circle cx="0" cy="0" r="9" stroke="#ffffff" strokeWidth="2" fill="none" strokeDasharray="10,6" />
            <polygon points="8,0 11,-4 5,-2" fill="#ffffff" />
            <polygon points="-8,0 -11,4 -5,2" fill="#ffffff" />
          </g>
        );
      case 'E1':
        return (
          <g>
            <circle cx="0" cy="0" r="18" fill="#1d4ed8" stroke="#dc2626" strokeWidth="3.5" />
            <line x1="-12" y1="-12" x2="12" y2="12" stroke="#dc2626" strokeWidth="3.5" />
          </g>
        );
      case 'G1':
        return (
          <g>
            <rect x="-18" y="-16" width="36" height="32" rx="2" fill="#1d4ed8" stroke="#ffffff" strokeWidth="1" />
            <path d="M -8,11 Q -4,0 0,-4 L 0,-4 Q 4,0 8,11" stroke="#ffffff" strokeWidth="2.5" fill="none" />
            <rect x="-11" y="-5" width="22" height="3" fill="#ffffff" />
          </g>
        );
      case 'G5':
        return (
          <g>
            <rect x="-18" y="-18" width="36" height="36" rx="2" fill="#1d4ed8" stroke="#ffffff" strokeWidth="1" />
            <polygon points="-12,4 -6,-2 0,4 -12,4" fill="#ffffff" />
            <rect x="-12" y="4" width="12" height="8" fill="#ffffff" />
            <circle cx="8" cy="-4" r="2" fill="#ffffff" />
            <line x1="8" y1="-2" x2="8" y2="6" stroke="#ffffff" strokeWidth="1.5" />
          </g>
        );
      case 'J7':
        return (
          <g>
            <polygon points="0,-18 -18,14 18,14" fill="#ffffff" stroke="#dc2626" strokeWidth="3.5" />
            <path d="M -4,10 L -4,2 Q -4,-4 -1,-5" stroke="#1e293b" strokeWidth="2" fill="none" />
            <path d="M 4,10 L 4,2 Q 4,-4 1,-5" stroke="#1e293b" strokeWidth="2" fill="none" />
          </g>
        );
      case 'J8':
        return (
          <g>
            <polygon points="0,-18 -18,14 18,14" fill="#ffffff" stroke="#dc2626" strokeWidth="3.5" />
            <path d="M -4,10 L -4,-5" stroke="#1e293b" strokeWidth="2" fill="none" />
            <path d="M 4,10 L 4,4 L 0,-3" stroke="#1e293b" strokeWidth="2" fill="none" />
          </g>
        );
      case 'J12':
        return (
          <g>
            <polygon points="0,-18 -18,14 18,14" fill="#ffffff" stroke="#dc2626" strokeWidth="3.5" />
            <path d="M -6,10 C -6,6 -3,2 0,2 C 3,2 6,6 6,10" stroke="#1e293b" strokeWidth="1.5" fill="none" />
            <circle cx="0" cy="-1" r="2" fill="#1e293b" />
            <circle cx="5" cy="2" r="1.5" fill="#1e293b" />
          </g>
        );
      case 'J13':
        return (
          <g>
            <polygon points="0,-18 -18,14 18,14" fill="#ffffff" stroke="#dc2626" strokeWidth="3.5" />
            <line x1="-8" y1="10" x2="8" y2="10" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="2,1.5" />
            <circle cx="0" cy="-3" r="2.2" fill="#1e293b" />
            <path d="M -2,2 L 2,2 L 4,8 L 1,8 Z" fill="#1e293b" />
          </g>
        );
      case 'J24':
        return (
          <g>
            <polygon points="0,-18 -18,14 18,14" fill="#ffffff" stroke="#dc2626" strokeWidth="3.5" />
            <rect x="-9" y="0" width="18" height="9" fill="#1e293b" rx="1" />
            <circle cx="-5" cy="10" r="1.5" fill="#1e293b" />
            <circle cx="5" cy="10" r="1.5" fill="#1e293b" />
            <line x1="0" y1="0" x2="-4" y2="-6" stroke="#1e293b" strokeWidth="1" />
          </g>
        );
      case 'J25':
        return (
          <g>
            <polygon points="0,-18 -18,14 18,14" fill="#ffffff" stroke="#dc2626" strokeWidth="3.5" />
            <line x1="-6" y1="-3" x2="6" y2="9" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="6" y1="-3" x2="-6" y2="9" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        );
      case 'C15':
        return (
          <g>
            <circle cx="0" cy="0" r="18" fill="#ffffff" stroke="#dc2626" strokeWidth="3.5" />
            <circle cx="0" cy="-5" r="2" fill="#1e293b" />
            <line x1="0" y1="-3" x2="0" y2="4" stroke="#1e293b" strokeWidth="2.5" />
            <line x1="-3" y1="10" x2="0" y2="4" stroke="#1e293b" strokeWidth="2" />
            <line x1="3" y1="10" x2="0" y2="4" stroke="#1e293b" strokeWidth="2" />
            <line x1="-12" y1="-12" x2="12" y2="12" stroke="#dc2626" strokeWidth="3.5" />
          </g>
        );
      default:
        return (
          <g>
            <circle cx="0" cy="0" r="18" fill="#ffffff" stroke="#dc2626" strokeWidth="3.5" />
            <text x="0" y="4.5" fill="#000000" fontSize="11" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">?</text>
          </g>
        );
    }
  };

  return (
    <div className="w-full h-full min-h-[220px] relative select-none rounded-3xl overflow-hidden border border-slate-200/80 dark:border-zinc-800 bg-slate-950 flex flex-col font-sans shadow-lg">
      
      {/* 3D PERSPECTIVE VECTOR CANVAS */}
      <svg className="w-full h-full absolute inset-0" viewBox="0 0 800 450" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Layer 0: Definitions for reuse */}
        <defs>
          <linearGradient id="metalPoleGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>

        {/* Layer 1: Road & Surrounding Environments (Highway, Country, Urban, Residential, Woonerf) */}
        <DrivingSceneBg 
          roadType={params.roadType} 
          weather={params.weather} 
          roadMarkings={'roadMarkings' in params ? (params as any).roadMarkings : undefined} 
          hazard={params.hazard} 
        />

        {/* Layer 2: Highly Detailed Hazard Objects, Pedestrians and Vehicles */}
        <DrivingSceneVehicles 
          hazard={params.hazard} 
          weather={params.weather} 
        />

        {/* Layer 2.5: Physical Roadside Integrated Traffic Signpost (New!) */}
        {signCode && (
          <g id="roadside-signpost">
            {/* Ground Shadow for Pole */}
            <ellipse cx="610" cy="246" rx="5" ry="1.8" fill="#000000" opacity="0.35" />
            
            {/* Metal Signpost Pole */}
            <rect x="608" y="115" width="4" height="131" fill="url(#metalPoleGradient)" stroke="#334155" strokeWidth="0.8" />
            
            {/* Sign Bracket mounts */}
            <rect x="606" y="125" width="8" height="3" fill="#475569" />
            <rect x="606" y="145" width="8" height="3" fill="#475569" />
            
            {/* Vector traffic sign drawing centered at (610, 115) to keep it visible above dashboards */}
            <g transform="translate(610, 115)">
              {renderVectorSign(signCode)}
            </g>
          </g>
        )}

        {/* Layer 3: Cockpit Dashboard instruments, Mirror systems, and wipers */}
        <DrivingSceneDashboard 
          speed={params.speed} 
          weather={params.weather} 
          hazard={params.hazard} 
          mirror={params.mirror} 
          lang={lang} 
        />
      </svg>

      {/* COCKPIT TEXT HUD OVERLAY (Dutch Styled for Maximum Authentic Realism) */}
      <div className="absolute bottom-0 inset-x-0 h-11 bg-zinc-950/95 border-t border-zinc-800/80 backdrop-blur-md flex items-center justify-between px-4 z-20">
        
        {/* SPEED READOUT STATUS */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-zinc-900/90 px-2.5 py-1 rounded border border-zinc-800">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
            <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
              {lang === 'ar' ? "السرعة الحالية" : lang === 'nl' ? "SNELHEID" : "SPEED"}
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-xl font-black text-orange-400 leading-none tracking-tight">
              {params.speed}
            </span>
            <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">
              km/u
            </span>
          </div>
        </div>

        {/* CLIMATE & DIMLICHTS (Authentic Dutch decals) */}
        <div className="hidden sm:flex items-center gap-4 text-[10px] font-mono text-zinc-500">
          <div className="flex flex-col items-end leading-normal">
            <span className="text-zinc-400 font-extrabold uppercase">
              {params.weather === 'night' ? 'DIMLICHT IN' : 'DAGLICHT SENS.'}
            </span>
            <span>
              {params.weather === 'rain' || params.weather === 'heavy_rain' 
                ? 'REGENSENS. ACTIEF' 
                : params.weather === 'fog' 
                  ? 'MISTSENS. ACTIEF' 
                  : 'H. HELDER ZICHT'}
            </span>
          </div>
          <div className="h-6 w-px bg-zinc-800"></div>
          <div className="flex items-center gap-1.5 bg-zinc-900/80 px-2 py-1 rounded border border-zinc-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[9px] font-extrabold text-zinc-300 tracking-widest">CBR ASSIST</span>
          </div>
        </div>

        {/* STATUS & TIRE WARNING ALERTS */}
        <div className="flex items-center gap-3">
          {params.hazard === 'tire_warning_light' ? (
            <div className="flex items-center gap-2 bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/30 animate-pulse text-amber-500 shadow-sm">
              <span className="text-xs">⚠️</span>
              <span className="text-[9px] font-black font-mono uppercase tracking-wider">BANDENSPANNING LEK!</span>
            </div>
          ) : params.weather === 'glossy_ice' ? (
            <div className="flex items-center gap-2 bg-blue-500/15 px-2.5 py-1 rounded-full border border-blue-500/30 text-blue-400 shadow-sm">
              <span className="text-xs">❄️</span>
              <span className="text-[9px] font-black font-mono uppercase tracking-wider">GLADHEID GEVAAR (-2°C)</span>
            </div>
          ) : (
            <div className="text-right flex flex-col">
              <span className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest leading-none">PERSPECTIVE</span>
              <span className="text-[10px] text-zinc-300 font-bold truncate max-w-[130px] sm:max-w-[180px] mt-0.5">
                {lang === 'nl' ? 'Kijk goed vooruit!' : lang === 'ar' ? 'راقب الطريق بحذر!' : 'Observe road ahead!'}
              </span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export const DrivingSceneDisplay = React.memo(DrivingSceneDisplayComponent);
