import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  BookOpen, Video, Compass, HelpCircle, MessageSquare, Send, 
  CheckCircle, Play, ChevronRight, Bookmark, Award, AlertCircle,
  Search, X, RotateCcw, ArrowRight, ArrowLeft, Check, Info, AlertTriangle, Navigation,
  Image as ImageIcon, User, Camera, ShieldAlert, Clock, RefreshCw, Bot
} from 'lucide-react';
import { TRANSLATIONS, Language, AIMessage, SchoolSettings, StudentRecord, isStudentAiSuspended, getSchoolName, getSchoolShortName, getAiAssistantName } from '../types';
import { THEORY_LESSONS, INSTRUCTIONAL_VIDEOS, ROAD_SIGNS, DEFAULT_VIDEO_THUMBNAIL } from '../data';
import { DRIVING_LIBRARY } from '../data/drivingLibrary';
import { getDutchSignUrl } from '../utils/signUtils';
import { useImageLocalizedText } from '../utils/imageTranslation';
import { getLocalVideoBlobUrl, getVideoThumbnail, getRealVideoFileDuration } from '../utils/localVideoStore';
import { DrivingSceneDisplay } from './DrivingSceneDisplay';
import { 
  loadStudentAiConversation, 
  saveStudentAiConversation, 
  pruneExpiredAiConversations, 
  getStableStudentId 
} from '../utils/aiCoachStorage';
import { isRecordForStudent } from '../utils/identity';

interface StudentLearningProps {
  lang: Language;
  t: typeof TRANSLATIONS['en'];
  mediaVideos?: any[];
  initialSubTab?: 'theory' | 'videos' | 'images' | 'signs' | 'quiz' | 'coaching';
  setInitialSubTab?: (tab: 'theory' | 'videos' | 'images' | 'signs' | 'quiz' | 'coaching') => void;
  currentUser?: any;
  setCurrentUser?: (user: any) => void;
  students?: any[];
  setStudents?: (students: any[]) => void;
  lessons?: any[];
  transactions?: any[];
  badges?: any[];
  schoolSettings?: Partial<SchoolSettings> | null;
}

function TrafficSignDisplay({ sign, size = "md" }: { sign: any; size?: "sm" | "md" | "lg" | "xl" }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [sign?.code]);
  
  const sizeClasses = {
    sm: "h-12 w-12 min-w-12",
    md: "h-16 w-16 min-w-16",
    lg: "h-20 w-20 min-w-20",
    xl: "h-32 w-32 min-w-32"
  };

  const imgUrl = sign?.code ? getDutchSignUrl(sign.code) : null;

  if (!hasError && imgUrl) {
    return (
      <div className={`relative ${sizeClasses[size]} flex items-center justify-center bg-white dark:bg-zinc-950 p-1.5 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-xs shrink-0 overflow-hidden`}>
        <img 
          src={imgUrl} 
          alt={sign.code || "Traffic Sign"} 
          referrerPolicy="no-referrer"
          className="h-full w-full object-contain animate-fade-in"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  // High-fidelity fallback representation to simulate real Dutch road signs when offline or loading
  const code = sign?.code || "";
  const shape = sign?.shape || "";
  const visualText = sign?.visualText || "";

  // Render authentic vector signs based on shape classes
  let fallbackContent = null;

  if (shape.startsWith("circle-red") || code.startsWith("A1") || code.startsWith("C")) {
    fallbackContent = (
      <div className="relative w-full h-full rounded-full bg-white border-[5px] border-red-600 flex items-center justify-center shadow-sm">
        <span className="text-[15px] md:text-[18px] font-black text-black leading-none select-none">
          {visualText || code.replace("A1-", "") || "!"}
        </span>
      </div>
    );
  } else if (shape === "diamond-priority" || code === "B1") {
    fallbackContent = (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="w-[72%] h-[72%] rotate-45 bg-amber-400 border-[4px] border-white outline outline-[2px] outline-slate-800/80 shadow-xs flex items-center justify-center" />
      </div>
    );
  } else if (shape === "triangle-inverted" || code === "B6") {
    fallbackContent = (
      <svg viewBox="0 0 100 100" className="w-full h-full text-white fill-current stroke-red-600 stroke-[10] overflow-visible drop-shadow-sm">
        <polygon points="12,15 88,15 50,85" />
      </svg>
    );
  } else if (shape.startsWith("triangle-danger") || shape.startsWith("triangle-priority") || code.startsWith("J")) {
    fallbackContent = (
      <svg viewBox="0 0 100 100" className="w-[95%] h-[95%] text-white fill-current stroke-red-600 stroke-[11] overflow-visible drop-shadow-sm">
        <polygon points="50,12 88,82 12,82" />
        <line x1="50" y1="36" x2="50" y2="58" stroke="black" strokeWidth="8" strokeLinecap="round" />
        <circle cx="50" cy="71" r="5.5" fill="black" />
      </svg>
    );
  } else if (shape.startsWith("square-blue") || code.startsWith("E") || code.startsWith("G") || code.startsWith("H")) {
    fallbackContent = (
      <div className="relative w-full h-full rounded-xl bg-blue-600 border-2 border-blue-700 flex flex-col items-center justify-center text-white shadow-xs">
        <span className="text-[14px] md:text-[16px] font-extrabold tracking-tight select-none">
          {visualText || code.substring(0, 2)}
        </span>
      </div>
    );
  } else if (shape.startsWith("circle-blue") || code.startsWith("D")) {
    fallbackContent = (
      <div className="relative w-full h-full rounded-full bg-blue-600 border-2 border-blue-700 flex items-center justify-center text-white shadow-xs">
        <svg viewBox="0 0 100 100" className="w-[60%] h-[60%] fill-white">
          <path d="M50,15 L80,50 L60,50 L60,85 L40,85 L40,50 L20,50 Z" transform="rotate(90 50 50)" />
        </svg>
      </div>
    );
  } else {
    // General elegant minimalist fallback
    fallbackContent = (
      <div className="relative w-full h-full rounded-2xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80 flex items-center justify-center font-black text-blue-600 dark:text-blue-400">
        <span className="text-xs tracking-tight">{code}</span>
      </div>
    );
  }

  return (
    <div className={`relative ${sizeClasses[size]} shrink-0 transition-transform duration-200`}>
      {fallbackContent}
    </div>
  );
}

// Sub-component for dynamically localized Image Card
function ImageCardItem({
  img,
  lang,
  onSelect
}: {
  key?: string;
  img: any;
  lang: Language;
  onSelect: (img: any) => void;
}) {
  const localizedTitle = useImageLocalizedText(img, lang, true);
  const localizedDesc = useImageLocalizedText(img, lang, false);

  return (
    <div 
      className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-xs hover:translate-y-[-1px] transition cursor-pointer flex flex-col h-full"
      onClick={() => onSelect(img)}
    >
      <div className="relative h-44 w-full bg-slate-100 dark:bg-zinc-950 overflow-hidden group">
        <img 
          src={img.url || undefined} 
          alt={localizedTitle || 'Educational Image'} 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-black/60 rounded text-[9px] text-white font-bold uppercase tracking-wider">
          {img.category || 'General'}
        </span>
      </div>

      <div className={`p-4 space-y-1.5 flex-1 flex flex-col justify-between ${lang === 'ar' ? 'text-right' : 'text-left'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-2">
            {localizedTitle}
          </h3>
          {localizedDesc && (
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2 mt-1">
              {localizedDesc}
            </p>
          )}
        </div>
        <p className="text-[10px] text-slate-400 mt-2 font-medium">
          {lang === 'ar' ? 'درس تعليمي متميز' : lang === 'nl' ? 'Rijles Master Class' : 'Driving Master Class'}
        </p>
      </div>
    </div>
  );
}

// Sub-component for dynamically localized Video Card
function VideoCardItem({
  video,
  lang,
  isPlaying,
  onPlay
}: {
  key?: string;
  video: any;
  lang: Language;
  isPlaying: boolean;
  onPlay: () => void;
}) {
  const localizedTitle = useImageLocalizedText(video, lang, true);
  const localizedDesc = useImageLocalizedText(video, lang, false);

  const rawUrl = video.url || video.videoUrl || video.embedUrl || '';
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string>(rawUrl);

  useEffect(() => {
    let isMounted = true;
    if (video.id && (video.sourceType === 'UPLOAD_FILE' || video.provider === 'local' || rawUrl.startsWith('blob:'))) {
      getLocalVideoBlobUrl(video.id).then((localBlobUrl) => {
        if (isMounted && localBlobUrl) {
          setResolvedVideoUrl(localBlobUrl);
        }
      });
    } else {
      setResolvedVideoUrl(rawUrl);
    }
    return () => { isMounted = false; };
  }, [video.id, rawUrl, video.sourceType, video.provider]);

  const driveId = video.driveFileId ||
    (rawUrl.includes('/file/d/') ? rawUrl.split('/file/d/')[1]?.split('/')[0]?.split('?')[0] : '') ||
    (rawUrl.includes('lh3.googleusercontent.com/d/') ? rawUrl.split('lh3.googleusercontent.com/d/')[1]?.split('?')[0] : '');

  let embedUrl = rawUrl;
  let isYouTubeOrVimeo = false;

  if (rawUrl.includes('youtube.com/watch?v=')) {
    const videoId = rawUrl.split('watch?v=')[1]?.split('&')[0];
    if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0`;
    isYouTubeOrVimeo = true;
  } else if (rawUrl.includes('youtu.be/')) {
    const videoId = rawUrl.split('youtu.be/')[1]?.split('?')[0];
    if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0`;
    isYouTubeOrVimeo = true;
  } else if (rawUrl.includes('vimeo.com/') && !rawUrl.includes('player.vimeo.com')) {
    const match = rawUrl.match(/vimeo\.com\/(\d+)/);
    if (match?.[1]) embedUrl = `https://player.vimeo.com/video/${match[1]}`;
    isYouTubeOrVimeo = true;
  } else if (embedUrl.includes('youtube.com/embed') || embedUrl.includes('player.vimeo.com')) {
    isYouTubeOrVimeo = true;
  }

  const isDirectVideo = !isYouTubeOrVimeo;
  const directVideoSrc = driveId ? `https://lh3.googleusercontent.com/d/${driveId}` : resolvedVideoUrl;

  const isRtl = lang === 'ar';

  const thumbnailSrc = getVideoThumbnail(video.thumbnail);

  const [dynamicDuration, setDynamicDuration] = useState<string>('');

  useEffect(() => {
    if (video.duration && video.duration !== '3:00') {
      setDynamicDuration(video.duration);
      return;
    }
    if (!resolvedVideoUrl || isYouTubeOrVimeo) {
      setDynamicDuration('');
      return;
    }
    let isMounted = true;
    getRealVideoFileDuration(resolvedVideoUrl).then((dur) => {
      if (isMounted && dur) setDynamicDuration(dur);
    });
    return () => { isMounted = false; };
  }, [video.duration, resolvedVideoUrl, isYouTubeOrVimeo]);

  const displayDuration = (video.duration && video.duration !== '3:00') ? video.duration : dynamicDuration;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-xs hover:translate-y-[-1px] transition flex flex-col h-full">
      <div className="relative h-44 w-full bg-slate-100 dark:bg-zinc-950 overflow-hidden">
        {isPlaying ? (
          isDirectVideo ? (
            <video
              src={directVideoSrc}
              className="w-full h-full object-contain bg-black"
              controls
              autoPlay
              playsInline
              preload="metadata"
              controlsList="nodownload"
            />
          ) : (
            <iframe
              src={embedUrl}
              className="w-full h-full border-0"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              title={localizedTitle || 'Video'}
            />
          )
        ) : (
          <>
            <img 
              src={thumbnailSrc} 
              alt={localizedTitle || 'Video'} 
              className="w-full h-full object-cover brightness-90"
            />
            <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
              <button
                type="button"
                onClick={onPlay}
                className="p-3.5 bg-blue-600/90 text-white rounded-full hover:scale-105 transition shadow-lg cursor-pointer"
              >
                <Play className="h-5 w-5 fill-current ml-0.5" />
              </button>
            </div>
            {displayDuration ? (
              <span className="absolute bottom-2.5 right-2.5 px-2 py-1 bg-black/60 rounded text-[10px] text-white font-mono font-bold">
                {displayDuration}
              </span>
            ) : null}
            {video.category && (
              <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-black/60 rounded text-[9px] text-white font-bold uppercase tracking-wider">
                {video.category}
              </span>
            )}
          </>
        )}
      </div>

      <div className={`p-4 space-y-1.5 flex-1 flex flex-col justify-between ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-2">
            {localizedTitle}
          </h3>
          {localizedDesc && (
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2 mt-1">
              {localizedDesc}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-component for dynamically localized Lightbox Viewer
function ImageLightboxViewer({
  img,
  lang,
  onClose
}: {
  img: any;
  lang: Language;
  onClose: () => void;
}) {
  const localizedTitle = useImageLocalizedText(img, lang, true);
  const localizedDesc = useImageLocalizedText(img, lang, false);

  return (
    <div 
      className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-6 z-50 animate-fade-in select-none overflow-hidden"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div className="w-full max-w-6xl flex items-center justify-between gap-4 py-2 px-1 text-white z-10" onClick={e => e.stopPropagation()}>
        <div className={`flex items-center gap-2.5 min-w-0 ${lang === 'ar' ? 'flex-row-reverse text-right' : 'flex-row text-left'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <span className="text-[10px] sm:text-xs font-black text-blue-400 bg-blue-500/20 border border-blue-500/30 px-3 py-1 rounded-full uppercase tracking-wider shrink-0">
            {img.category || 'General'}
          </span>
          <h3 className="text-sm sm:text-base font-bold text-white truncate">
            {localizedTitle}
          </h3>
        </div>
        
        <button
          type="button"
          onClick={onClose}
          className="p-2.5 bg-zinc-800/80 hover:bg-zinc-700 text-white rounded-full transition cursor-pointer shrink-0 border border-zinc-700/60 shadow-lg"
          title="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* High-Resolution Full Original Image Area */}
      <div 
        className="flex-1 relative w-full max-w-6xl my-2 flex items-center justify-center overflow-hidden min-h-0"
        onClick={e => e.stopPropagation()}
      >
        <img 
          src={img.url || img.thumbnail || undefined} 
          alt={localizedTitle || 'Educational Image'} 
          className="max-w-full max-h-full object-contain rounded-xl shadow-2xl transition-transform duration-200"
          style={{ imageRendering: 'high-quality' }}
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Bottom Bar Details */}
      {localizedDesc && (
        <div className="w-full max-w-6xl z-10" onClick={e => e.stopPropagation()}>
          <div className={`p-4 bg-zinc-900/90 border border-zinc-800/90 rounded-2xl text-xs sm:text-sm text-zinc-200 leading-relaxed max-h-32 overflow-y-auto ${lang === 'ar' ? 'text-right' : 'text-left'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {localizedDesc}
          </div>
        </div>
      )}
    </div>
  );
}

function StudentLearningComponent({ 
  lang, t, mediaVideos, initialSubTab, setInitialSubTab,
  currentUser, setCurrentUser, students, setStudents,
  lessons, transactions, badges, schoolSettings 
}: StudentLearningProps) {
  const [activeSubTab, setActiveSubTab] = useState<'theory' | 'videos' | 'images' | 'signs' | 'quiz' | 'coaching'>(
    initialSubTab === ('exam' as any) || initialSubTab === ('progression' as any) ? 'theory' : (initialSubTab || 'theory')
  );

  const aiAssistantName = getAiAssistantName(schoolSettings);
  const schoolShortName = getSchoolShortName(schoolSettings);
  const schoolFullName = getSchoolName(schoolSettings);

  // Live timer tick for real-time suspension countdown (only runs when student is on coaching tab and suspended)
  const [currentTime, setCurrentTime] = useState(Date.now());
  const isSuspended = isStudentAiSuspended(currentUser).isSuspended;

  useEffect(() => {
    if (activeSubTab !== 'coaching' || !isSuspended) {
      return;
    }
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeSubTab, isSuspended]);

  const aiStatus = useMemo(() => {
    return isStudentAiSuspended(currentUser);
  }, [currentUser, currentTime]);

  const formatRemainingTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab === ('exam' as any) || initialSubTab === ('progression' as any) ? 'theory' : initialSubTab);
    }
  }, [initialSubTab]);

  const handleSubTabChange = (tab: 'theory' | 'videos' | 'images' | 'signs' | 'quiz' | 'coaching') => {
    setActiveSubTab(tab);
    if (setInitialSubTab) {
      setInitialSubTab(tab);
    }
  };

  const [selectedDetailedImage, setSelectedDetailedImage] = useState<any | null>(null);

  // Compute merged instructional videos list dynamically
  const customVideos = React.useMemo(() => {
    if (mediaVideos) return mediaVideos;
    try {
      const saved = localStorage.getItem('drivingschool_media_videos') || localStorage.getItem('al_andalos_media_videos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [mediaVideos]);

  const enabledCustomVideos = React.useMemo(() => {
    return customVideos.filter((v: any) => {
      const isImg = v.type === 'image' || (!v.duration && v.url && (v.url.includes('.png') || v.url.includes('.jpg') || v.url.includes('.jpeg') || v.url.includes('.webp') || v.url.includes('images.unsplash.com') || v.url.startsWith('data:image/')));
      return v.isEnabled !== false && !v.isMissingFromDrive && !v.isDeletedByTrainer && !isImg;
    });
  }, [customVideos]);

  const formattedCustomVideos = React.useMemo(() => {
    return enabledCustomVideos.map((v: any, index: number) => {
      let embedUrl = v.embedUrl || v.url || v.videoUrl || '';
      if (embedUrl) {
        if (embedUrl.includes('youtube.com/watch?v=')) {
          const videoId = embedUrl.split('watch?v=')[1]?.split('&')[0];
          if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0`;
        } else if (embedUrl.includes('youtu.be/')) {
          const videoId = embedUrl.split('youtu.be/')[1]?.split('?')[0];
          if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0`;
        } else if (embedUrl.includes('vimeo.com/') && !embedUrl.includes('player.vimeo.com')) {
          const match = embedUrl.match(/vimeo\.com\/(\d+)/);
          if (match?.[1]) embedUrl = `https://player.vimeo.com/video/${match[1]}`;
        }
      }

      const rawTitle = (v.originalTitle || v.rawTitle || v.title || v.titleAr || v.titleEn || v.titleNl || '').trim();
      const rawDesc = (v.originalDescription || v.rawDesc || v.description || v.descriptionAr || v.descriptionEn || v.descriptionNl || '').trim();

      return {
        ...v,
        id: v.id || `custom-vid-${rawTitle || index}`,
        rawObj: v,
        rawTitle,
        rawDesc,
        originalTitle: v.originalTitle || rawTitle,
        originalDescription: v.originalDescription || rawDesc,
        title: v.title || rawTitle,
        description: v.description || rawDesc,
        titleEn: v.titleEn,
        titleNl: v.titleNl,
        titleAr: v.titleAr,
        descriptionEn: v.descriptionEn,
        descriptionNl: v.descriptionNl,
        descriptionAr: v.descriptionAr,
        duration: (v.duration && v.duration !== '3:00') ? v.duration : '',
        url: embedUrl || v.url,
        category: v.category || 'General',
        thumbnail: v.thumbnail || DEFAULT_VIDEO_THUMBNAIL
      };
    });
  }, [enabledCustomVideos]);

  const allVideos = React.useMemo(() => {
    return [...formattedCustomVideos, ...INSTRUCTIONAL_VIDEOS];
  }, [formattedCustomVideos]);

  // Extract enabled custom educational images
  const enabledCustomImages = React.useMemo(() => {
    return customVideos.filter((v: any) => {
      const isImg = v.type === 'image' || (!v.duration && v.url && (v.url.includes('.png') || v.url.includes('.jpg') || v.url.includes('.jpeg') || v.url.includes('.webp') || v.url.includes('images.unsplash.com') || v.url.startsWith('data:image/')));
      return v.isEnabled !== false && !v.isMissingFromDrive && !v.isDeletedByTrainer && isImg;
    });
  }, [customVideos]);

  const allImages = React.useMemo(() => {
    return enabledCustomImages.map((v: any, index: number) => {
      const rawTitle = (v.originalTitle || v.rawTitle || v.title || v.titleAr || v.titleEn || v.titleNl || '').trim();
      const rawDesc = (v.originalDescription || v.rawDesc || v.description || v.descriptionAr || v.descriptionEn || v.descriptionNl || '').trim();
      return {
        ...v,
        id: v.id || `custom-img-${rawTitle || index}`,
        rawObj: v,
        rawTitle,
        rawDesc,
        originalTitle: v.originalTitle || rawTitle,
        originalDescription: v.originalDescription || rawDesc,
        title: v.title || rawTitle,
        description: v.description || rawDesc,
        titleEn: v.titleEn,
        titleNl: v.titleNl,
        titleAr: v.titleAr,
        descriptionEn: v.descriptionEn,
        descriptionNl: v.descriptionNl,
        descriptionAr: v.descriptionAr,
        url: v.url || '',
        thumbnail: v.thumbnail || v.url || DEFAULT_VIDEO_THUMBNAIL,
        category: v.category || 'General'
      };
    });
  }, [enabledCustomImages]);

  // Theory Category Filter
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'priority' | 'signs' | 'speed'>('all');
  const [selectedLibraryModule, setSelectedLibraryModule] = useState<any | null>(null);
  const filteredTheory = React.useMemo(() => {
    return selectedCategory === 'all' 
      ? THEORY_LESSONS 
      : THEORY_LESSONS.filter(item => item.category === selectedCategory);
  }, [selectedCategory]);

  // Dynamic Sign Categorization to map exactly to the 7 Dutch Categories
  const getSignDisplayCategory = (sign: any): 'danger' | 'priority' | 'prohibitory' | 'mandatory' | 'information' | 'parking' | 'highway' => {
    const code = sign.code || '';
    if (code.startsWith('J')) return 'danger';
    if (code.startsWith('B')) return 'priority';
    if (code.startsWith('C') || code.startsWith('A')) return 'prohibitory';
    if (code.startsWith('D')) return 'mandatory';
    if (code.startsWith('E')) return 'parking';
    if (code.startsWith('G')) return 'highway';
    return 'information';
  };

  // Road Signs Filter & Search
  const [selectedSignType, setSelectedSignType] = useState<'all' | 'danger' | 'priority' | 'prohibitory' | 'mandatory' | 'information' | 'parking' | 'highway'>('all');
  const [signSearchQuery, setSignSearchQuery] = useState('');
  const [selectedDetailedSign, setSelectedDetailedSign] = useState<any | null>(null);

  const filteredSigns = React.useMemo(() => {
    const query = signSearchQuery.trim().toLowerCase();
    return ROAD_SIGNS.filter(sign => {
      const cat = getSignDisplayCategory(sign);
      const matchesCategory = selectedSignType === 'all' || cat === selectedSignType;
      
      const matchesSearch = !query || 
        (sign.code || '').toLowerCase().includes(query) ||
        (sign.nameEn || '').toLowerCase().includes(query) ||
        (sign.nameNl || '').toLowerCase().includes(query) ||
        (sign.nameAr || '').toLowerCase().includes(query) ||
        (sign.descriptionEn || '').toLowerCase().includes(query) ||
        (sign.descriptionNl || '').toLowerCase().includes(query) ||
        (sign.descriptionAr || '').toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [selectedSignType, signSearchQuery]);

  // Infinite Signs Quiz Mode
  interface SignQuizOption {
    textEn: string;
    textNl: string;
    textAr: string;
    isCorrect: boolean;
    signCode: string;
  }
  interface SignQuizQuestion {
    sign: any;
    options: SignQuizOption[];
  }

  const generateNewQuizQuestion = (): SignQuizQuestion => {
    const randomIndex = Math.floor(Math.random() * ROAD_SIGNS.length);
    const correctSign = ROAD_SIGNS[randomIndex];
    
    const distractors: any[] = [];
    while (distractors.length < 3) {
      const dIndex = Math.floor(Math.random() * ROAD_SIGNS.length);
      const candidate = ROAD_SIGNS[dIndex];
      if (candidate.id !== correctSign.id && !distractors.some(d => d.id === candidate.id)) {
        distractors.push(candidate);
      }
    }

    const allOptions: SignQuizOption[] = [
      {
        textEn: correctSign.nameEn,
        textNl: correctSign.nameNl,
        textAr: correctSign.nameAr,
        isCorrect: true,
        signCode: correctSign.code
      },
      ...distractors.map(d => ({
        textEn: d.nameEn,
        textNl: d.nameNl,
        textAr: d.nameAr,
        isCorrect: false,
        signCode: d.code
      }))
    ];

    const shuffled = allOptions.sort(() => Math.random() - 0.5);

    return {
      sign: correctSign,
      options: shuffled
    };
  };

  const [currentQuizQuestion, setCurrentQuizQuestion] = useState<SignQuizQuestion | null>(null);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [hasAnsweredQuiz, setHasAnsweredQuiz] = useState(false);
  const [quizTotalAttempted, setQuizTotalAttempted] = useState(0);
  const [quizTotalCorrect, setQuizTotalCorrect] = useState(0);

  const handleSelectQuizOption = (optIndex: number) => {
    if (hasAnsweredQuiz) return;
    setSelectedQuizOption(optIndex);
    setHasAnsweredQuiz(true);
    setQuizTotalAttempted(prev => prev + 1);
    if (currentQuizQuestion?.options[optIndex].isCorrect) {
      setQuizTotalCorrect(prev => prev + 1);
    }
  };

  const handleNextQuizQuestion = () => {
    setCurrentQuizQuestion(generateNewQuizQuestion());
    setSelectedQuizOption(null);
    setHasAnsweredQuiz(false);
  };

  useEffect(() => {
    if (activeSubTab === 'quiz' && !currentQuizQuestion) {
      setCurrentQuizQuestion(generateNewQuizQuestion());
    }
  }, [activeSubTab, currentQuizQuestion]);

  // Video playback simulation
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  // Stop video playback whenever student changes language or switches subtab
  useEffect(() => {
    setPlayingVideoId(null);
  }, [activeSubTab, lang]);

  // Custom Al-Andalos practice tests state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [testResult, setTestResult] = useState<string | null>(null);
  const mTests = [
    {
      id: 1,
      questionEn: "On an intersection without traffic lights or signs, which vehicle has the right of way?",
      questionNl: "Wie heeft op een gelijkwaardig kruispunt zonder borden of lichten voorrang?",
      questionAr: "في تقاطع متساوي الكفاءة خالٍ من الإشارات الضوئية أو اللوحات، لمن تكون الأولوية؟",
      optionsEn: ["A. Vehicle from the left", "B. Vehicle from the right", "C. The fastest moving vehicle"],
      optionsNl: ["A. Verkeer van links", "B. Verkeer van rechts", "C. Het snelste voertuig"],
      optionsAr: ["أ. المركبات القادمة من اليسار", "ب. المركبات القادمة من اليمين", "ج. المركبة الأسرع حركةً"],
      correct: 1,
      correctDescriptionEn: "Correct! The base Dutch priority law dictates that traffic from the right always has right of way on equivalent crossings.",
      correctDescriptionNl: "Correct! Verkeer van rechts heeft altijd voorrang op gelijkwaardige kruispunten.",
      correctDescriptionAr: "صحيح! ينص قانون المرور الهولندي الأساسي على أن حركة المرور القادمة من اليمين لها الأسبقية دائماً."
    },
    {
      id: 2,
      questionEn: "What do white triangles (shark teeth markings) on the road surface mean?",
      questionNl: "Wat betekenen de witte driehoeken (haaientanden) op de weg?",
      questionAr: "ما الذي تعنيه المثلثات البيضاء الأرضية (أسنان القرش)؟",
      optionsEn: ["A. You have priority", "B. Beware of sharp objects", "C. You must yield priority to crossing traffic"],
      optionsNl: ["A. U heeft voorrang", "B. Pas op voor scherpe objecten", "C. U moet voorrang verlenen aan kruisend verkeer"],
      optionsAr: ["أ. لك حق الأولوية", "ب. احذر من الأجسام الحادة على الطريق", "ج. يجب عليك إعطاء الأولوية لحركة المرور العابرة"],
      correct: 2,
      correctDescriptionEn: "Correct! Shark teeth (Haaientanden) require you to yield to crossing traffic.",
      correctDescriptionNl: "Correct! Haaientanden betekenen dat u voorrang moet verlenen.",
      correctDescriptionAr: "صحيح! علامات أسنان القرش تلزمك بالتوقف وإعطاء الأولوية للمرور العابر."
    }
  ];

  const handleSelectAnswer = (qId: number, optIndex: number) => {
    setSelectedAnswers(prev => ({ ...prev, [qId]: optIndex }));
  };

  const checkPracticeTest = () => {
    let score = 0;
    mTests.forEach(q => {
      if (selectedAnswers[q.id] === q.correct) {
        score++;
      }
    });
    setTestResult(`You scored ${score} out of ${mTests.length}!`);
  };

  // AI Driving Coach Initial Greeting Helper
  const getInitialGreetingText = (l: Language): string => {
    if (l === 'ar') return "مرحباً بك! كيف يمكنني مساعدتك اليوم في أسئلة القيادة وقواعد المرور في هولندا؟";
    if (l === 'nl') return "Welkom! Hoe kan ik je vandaag helpen met je vragen over autorijden en verkeersregels in Nederland?";
    return "Welcome! How can I help you today with your driving and traffic rule questions in the Netherlands?";
  };

  const createInitialMessage = (l: Language): AIMessage => ({
    id: 'm-ai-welcome',
    sender: 'ai',
    text: getInitialGreetingText(l),
    timestamp: new Date()
  });

  // Helper to parse and render formatted chat messages cleanly without markdown noise or visible asterisks
  const renderFormattedChatMessage = (rawText: string, isAI: boolean) => {
    if (!rawText) return null;
    const lines = rawText.split('\n');

    return (
      <div className="space-y-1.5 leading-relaxed text-xs">
        {lines.map((line, lineIdx) => {
          let cleanLine = line.trim();
          if (!cleanLine) {
            return <div key={lineIdx} className="h-1" />;
          }

          // Remove markdown headers (###, ####, etc.)
          cleanLine = cleanLine.replace(/^#{1,6}\s+/, '');

          // Remove leading bullet symbols (*, -, •)
          if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ') || cleanLine.startsWith('• ')) {
            cleanLine = cleanLine.replace(/^[-*•]\s+/, '');
          }

          // Check if the line is a numbered item (e.g., 1-, 2-, 1., 2:)
          const numberedMatch = cleanLine.match(/^(\d+)[\-\.\:]\s*(.+)$/);

          // Inline parser for bold and parenthetical Dutch terms
          const parseInline = (textStr: string) => {
            const parts: React.ReactNode[] = [];
            // Match **bold** or parenthetical terms like (Voorrang van rechts)
            const regex = /(\*\*[^*]+\*\*|\([A-Za-z0-9\s\-–\']+\))/g;
            let lastIdx = 0;
            let match;

            while ((match = regex.exec(textStr)) !== null) {
              if (match.index > lastIdx) {
                const textChunk = textStr.substring(lastIdx, match.index).replace(/\*/g, '');
                if (textChunk) parts.push(textChunk);
              }
              const token = match[0];
              if (token.startsWith('**') && token.endsWith('**')) {
                const boldInner = token.slice(2, -2).trim().replace(/\*/g, '');
                parts.push(
                  <strong 
                    key={`b-${lineIdx}-${match.index}`} 
                    className={isAI ? "font-bold text-slate-900 dark:text-white" : "font-bold text-white underline underline-offset-2"}
                  >
                    {boldInner}
                  </strong>
                );
              } else if (token.startsWith('(') && token.endsWith(')')) {
                parts.push(
                  <strong 
                    key={`p-${lineIdx}-${match.index}`} 
                    className={isAI ? "font-bold text-slate-900 dark:text-white" : "font-bold text-white"}
                  >
                    {token.replace(/\*/g, '')}
                  </strong>
                );
              }
              lastIdx = regex.lastIndex;
            }

            if (lastIdx < textStr.length) {
              const remaining = textStr.substring(lastIdx).replace(/\*/g, '');
              if (remaining) parts.push(remaining);
            }

            return parts.length > 0 ? parts : textStr.replace(/\*/g, '');
          };

          if (numberedMatch) {
            const num = numberedMatch[1];
            const content = numberedMatch[2];
            return (
              <div key={lineIdx} className="flex items-start gap-2 pt-0.5">
                <span className={`font-bold shrink-0 font-mono text-[11px] mt-0.5 ${
                  isAI ? 'text-blue-600 dark:text-blue-400' : 'text-blue-200'
                }`}>
                  {num}-
                </span>
                <span className="flex-1">
                  {parseInline(content)}
                </span>
              </div>
            );
          }

          return (
            <p key={lineIdx} className="leading-relaxed">
              {parseInline(cleanLine)}
            </p>
          );
        })}
      </div>
    );
  };

  // AI Driving Coach State - Persistent for each student with 48h retention
  const currentStudentId = useMemo(() => getStableStudentId(currentUser), [currentUser]);

  const [messages, setMessages] = useState<AIMessage[]>(() => {
    pruneExpiredAiConversations();
    const studentId = getStableStudentId(currentUser);
    const saved = loadStudentAiConversation(studentId);
    if (saved && saved.length > 0) {
      return saved;
    }
    return [createInitialMessage(lang)];
  });
  const [inputValue, setInputValue] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore student-specific active conversation when student identity changes or on mount
  useEffect(() => {
    pruneExpiredAiConversations();
    if (currentStudentId && currentStudentId !== 'ST-GUEST') {
      const saved = loadStudentAiConversation(currentStudentId);
      if (saved && saved.length > 0) {
        setMessages(saved);
      } else {
        setMessages([createInitialMessage(lang)]);
      }
    }
  }, [currentStudentId]);

  // Persist conversation and refresh 48-hour retention timer whenever messages update
  useEffect(() => {
    if (messages.length > 0 && currentStudentId && currentStudentId !== 'ST-GUEST') {
      saveStudentAiConversation(currentStudentId, messages);
    }
  }, [messages, currentStudentId]);

  // If conversation has only the welcome message, sync its language when student changes app language
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 'm-ai-welcome') {
        return [createInitialMessage(lang)];
      }
      return prev;
    });
  }, [lang]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (activeSubTab === 'coaching') return; // Do not show notifications if already in chat view
    if (messages.length > 1) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.sender === 'ai') {
        const text = lang === 'ar'
          ? `💬 رسالة جديدة من ${aiAssistantName}: ${lastMsg.text.slice(0, 40)}...`
          : lang === 'nl'
          ? `💬 Nieuw bericht van ${aiAssistantName}: ${lastMsg.text.slice(0, 40)}...`
          : `💬 New message from ${aiAssistantName}: ${lastMsg.text.slice(0, 40)}...`;
        
        if ((window as any).triggerNotification) {
          (window as any).triggerNotification(text);
        }
      }
    }
  }, [messages.length, lang, activeSubTab, aiAssistantName]);

  const optimizeImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const rawResult = typeof reader.result === 'string' ? reader.result : '';
        if (!rawResult) {
          resolve('');
          return;
        }

        const img = new Image();
        img.onload = () => {
          try {
            // Target max dimension around 1400px (preserves full resolution for signs & markings while dropping 95% of payload)
            const MAX_DIM = 1440;
            let width = img.width;
            let height = img.height;

            if (width > MAX_DIM || height > MAX_DIM) {
              if (width > height) {
                height = Math.round((height * MAX_DIM) / width);
                width = MAX_DIM;
              } else {
                width = Math.round((width * MAX_DIM) / height);
                height = MAX_DIM;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(rawResult);
              return;
            }

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            // Compress to JPEG at 0.82 quality to eliminate heavy EXIF and reduce payload
            const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
            resolve(optimizedDataUrl);
          } catch {
            resolve(rawResult);
          }
        };
        img.onerror = () => resolve(rawResult);
        img.src = rawResult;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert(lang === 'ar' ? 'يرجى اختيار ملف صورة صالح.' : 'Please select a valid image file.');
      return;
    }
    const optimized = await optimizeImageFile(file);
    if (optimized) {
      setAttachedImage(optimized);
    }
  };

  const sendMessageWithText = async (textToSend: string, imageToSend?: string | null) => {
    const trimmed = textToSend.trim();
    const currentImg = imageToSend !== undefined ? imageToSend : attachedImage;
    if ((!trimmed && !currentImg) || loading || aiStatus.isSuspended) return;

    const userMsg: AIMessage = {
      id: `m-usr-${Date.now()}`,
      sender: 'user',
      text: trimmed || (lang === 'ar' ? 'تحليل الصورة المرفقة' : lang === 'nl' ? 'Bijgevoegde afbeelding analyseren' : 'Analyze attached image'),
      image: currentImg || undefined,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setAttachedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setLoading(true);

    try {
      const studentId = currentUser?.studentId || currentUser?.id || 'ST-GUEST';
      const studentLessons = (lessons || []).filter(l => isRecordForStudent(l, currentUser));
      const studentTransactions = (transactions || []).filter(tx => isRecordForStudent(tx, currentUser));
      const studentBadges = (badges || []).filter(b => b.studentId ? isRecordForStudent(b, currentUser) : false);
      const pkgName = currentUser?.packageName || currentUser?.packageSelection || currentUser?.currentPackage || (lang === 'ar' ? 'بلا باقة' : lang === 'nl' ? 'Geen Pakket' : 'No Package');
      const matchHours = pkgName.match(/(\d+)\s*(?:hours|hour|h|ساعة|uur)/i);
      const pkgHours = currentUser?.packageHours || currentUser?.targetHours || currentUser?.totalHours || (matchHours ? parseInt(matchHours[1], 10) : 0);
      const balance = studentTransactions.reduce((acc, curr) => curr.type === 'deposit' ? acc + curr.amount : acc - curr.amount, 0);

      const payload = JSON.stringify({
        message: userMsg.text,
        image: userMsg.image,
        lang: lang,
        studentId: studentId,
        schoolSettings: schoolSettings || undefined,
        history: messages.slice(-10).map(m => ({ sender: m.sender, text: m.text })),
        studentData: currentUser ? {
          id: studentId,
          studentId: studentId,
          name: currentUser.name,
          email: currentUser.email,
          phone: currentUser.phone,
          packageSelection: pkgName,
          currentPackage: pkgName,
          packageName: pkgName,
          packageHours: pkgHours,
          targetHours: pkgHours,
          transmissionType: currentUser.transmissionType,
          city: currentUser.city,
          lessons: studentLessons,
          transactions: studentTransactions,
          badges: studentBadges,
          walletBalance: balance
        } : null
      });

      // Call our secure server-side proxy
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: payload
      });

      let replyText = "";
      let isWarning = false;
      let isSuspended = false;
      let suspendedUntil: string | null = null;
      let suspensionTier = 0;
      let warningCount = 0;

      if (response.ok) {
        const data = await response.json();
        replyText = data.reply;
        isWarning = !!data.warning;
        isSuspended = !!data.suspended;
        suspendedUntil = data.suspendedUntil || null;
        suspensionTier = data.suspensionTier || 0;
        warningCount = data.warningCount || 0;

        // Synchronize student AI state if updated
        if (currentUser && setCurrentUser && (isWarning || isSuspended || warningCount > 0)) {
          const updatedUser = {
            ...currentUser,
            aiWarningCount: warningCount,
            aiSuspendedUntil: suspendedUntil,
            aiSuspensionTier: suspensionTier
          };
          setCurrentUser(updatedUser);

          if (students && setStudents) {
            setStudents(students.map(s => (s.id === updatedUser.id || s.studentId === updatedUser.studentId) ? updatedUser : s));
          }
        }
      } else {
        // Fallback response if response status not OK
        replyText = lang === 'ar'
          ? "لا أستطيع التحقق من هذه المعلومة بشكل موثوق الآن. حاول السؤال مرة أخرى أو تحقق من المصدر الرسمي."
          : lang === 'nl'
          ? "Ik kan deze informatie op dit moment niet betrouwbaar verifiëren. Probeer het opnieuw of raadpleeg de officiële bron."
          : "I cannot reliably verify this information right now. Please try asking again or consult the official regulations.";
      }

      const resMsg: AIMessage = {
        id: `m-ai-${Date.now()}`,
        sender: 'ai',
        text: replyText || (lang === 'ar' ? "عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى." : "Sorry, I am facing connectivity issues, please try again later."),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, resMsg]);
    } catch (err) {
      console.error("Local chat fetch error:", err);
      // Fallback response if offline or fetch failed
      let textSim = "I cannot reliably verify this information right now. Please try asking again or consult the official regulations.";
      if (lang === 'ar') {
        textSim = "لا أستطيع التحقق من هذه المعلومة بشكل موثوق الآن. حاول السؤال مرة أخرى أو تحقق من المصدر الرسمي.";
      } else if (lang === 'nl') {
        textSim = "Ik kan deze informatie op dit moment niet betrouwbaar verifiëren. Probeer het opnieuw of raadpleeg de officiële bron.";
      }
      setMessages(prev => [...prev, {
        id: `m-ai-${Date.now()}`,
        sender: 'ai',
        text: textSim,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessageWithText(inputValue);
  };

  return (
    <div className="space-y-6 pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Top Section */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">{t.learning}</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          {lang === 'ar' 
            ? "أدوات متميزة لاجتياز امتحان القيادة الهولندي بنجاح" 
            : lang === 'nl' 
              ? "Hoogwaardige tools om foutloos te slagen voor je Nederlandse rijexamen" 
              : "High-fidelity tools to pass your Dutch driving exam flawlessly"}
        </p>
      </div>

      {/* Segment switcher tabs matching premium Tesla style */}
      <div className="flex bg-slate-100/80 dark:bg-zinc-900/80 p-1 rounded-xl overflow-x-auto no-scrollbar scroll-smooth gap-1 border border-slate-200/40 dark:border-zinc-800/40 flex-nowrap shrink-0" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <button
          onClick={() => handleSubTabChange('theory')}
          className={`px-4 py-2.5 whitespace-nowrap text-xs font-semibold rounded-lg transition-all duration-150 shrink-0 cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'theory'
              ? 'bg-white dark:bg-zinc-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/50 dark:border-zinc-700/50 font-bold'
              : 'text-slate-500 hover:text-slate-850 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-white/40 dark:hover:bg-zinc-800/10'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>{t.theoryLessons}</span>
        </button>

        <button
          onClick={() => handleSubTabChange('videos')}
          className={`px-4 py-2.5 whitespace-nowrap text-xs font-semibold rounded-lg transition-all duration-150 shrink-0 cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'videos'
              ? 'bg-white dark:bg-zinc-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/50 dark:border-zinc-700/50 font-bold'
              : 'text-slate-500 hover:text-slate-850 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-white/40 dark:hover:bg-zinc-800/10'
          }`}
        >
          <Video className="h-3.5 w-3.5" />
          <span>{t.videos}</span>
        </button>

        <button
          onClick={() => handleSubTabChange('images')}
          className={`px-4 py-2.5 whitespace-nowrap text-xs font-semibold rounded-lg transition-all duration-150 shrink-0 cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'images'
              ? 'bg-white dark:bg-zinc-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/50 dark:border-zinc-700/50 font-bold'
              : 'text-slate-500 hover:text-slate-850 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-white/40 dark:hover:bg-zinc-800/10'
          }`}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          <span>{lang === 'ar' ? 'الصور التعليمية' : lang === 'nl' ? 'Afbeeldingen' : 'Images'}</span>
        </button>

        <button
          onClick={() => handleSubTabChange('signs')}
          className={`px-4 py-2.5 whitespace-nowrap text-xs font-semibold rounded-lg transition-all duration-150 shrink-0 cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'signs'
              ? 'bg-white dark:bg-zinc-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/50 dark:border-zinc-700/50 font-bold'
              : 'text-slate-500 hover:text-slate-850 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-white/40 dark:hover:bg-zinc-800/10'
          }`}
        >
          <Compass className="h-3.5 w-3.5" />
          <span>{t.roadSigns}</span>
        </button>

        <button
          onClick={() => handleSubTabChange('quiz')}
          className={`px-4 py-2.5 whitespace-nowrap text-xs font-semibold rounded-lg transition-all duration-150 shrink-0 cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'quiz'
              ? 'bg-white dark:bg-zinc-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/50 dark:border-zinc-700/50 font-bold'
              : 'text-slate-500 hover:text-slate-850 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-white/40 dark:hover:bg-zinc-800/10'
          }`}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>{lang === 'ar' ? "اختبار الإشارات" : lang === 'nl' ? "Borden Quiz" : "Signs Quiz"}</span>
        </button>

        <button
          id="coaching-tab-selector"
          onClick={() => handleSubTabChange('coaching')}
          className={`px-4 py-2.5 whitespace-nowrap text-xs font-semibold rounded-lg transition-all duration-150 shrink-0 cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'coaching'
              ? 'bg-white dark:bg-zinc-800 text-slate-950 dark:text-white shadow-xs border border-blue-500/20 font-bold'
              : 'text-slate-500 hover:text-slate-850 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-white/40 dark:hover:bg-zinc-800/10'
          }`}
        >
          <Bot className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span>{aiAssistantName}</span>
        </button>
      </div>

      {/* Render Sub Tabs content with stunning layouts */}
      {activeSubTab === 'theory' && (
        <div id="theory-tab-view" className="space-y-8 animate-fade-in">
          {/* Official Dutch Driving Reference Library Grid */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-blue-600 animate-pulse" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                {lang === 'ar' ? `مكتبة ${getSchoolShortName(schoolSettings)}` : `${getSchoolShortName(schoolSettings)} Mediatheek`}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-normal">
              {lang === 'ar' ? 'تصفح المواضيع الرسمية الـ 12 المعتمدة في امتحانات النظرية مع أرقام المواد القانونية لعام 1990.' : lang === 'nl' ? 'Blader door de 12 officiële examencategorieën volgens het RVV 1990.' : 'Browse the 12 official exam subject categories with real Dutch RVV 1990 legal article references.'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {DRIVING_LIBRARY.map(module => {
                return (
                  <button
                    key={module.id}
                    onClick={() => setSelectedLibraryModule(module)}
                    className="p-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-xs hover:border-blue-500 hover:shadow-md transition text-left cursor-pointer flex flex-col justify-between h-40 group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 h-24 w-24 bg-blue-500/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400 w-max">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 dark:text-zinc-100 text-xs md:text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {lang === 'ar' ? module.titleAr : lang === 'nl' ? module.titleNl : module.titleEn}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium font-mono">
                        {lang === 'ar' ? `الموضوع ${module.id}` : lang === 'nl' ? `Thema ${module.id}` : `Theme ${module.id}`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Library Module Detail Modal */}
          {selectedLibraryModule && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-6 animate-scale-up relative">
                <button
                  onClick={() => setSelectedLibraryModule(null)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-full hover:bg-slate-50 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="flex items-start gap-4 pr-8">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-2xl text-blue-600">
                    <Compass className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-500/10 px-2.5 py-1 rounded-full">
                      {lang === 'ar' ? 'الفئة' : lang === 'nl' ? 'Categorie' : 'Category'} {selectedLibraryModule.id}
                    </span>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mt-2">
                      {lang === 'ar' ? selectedLibraryModule.titleAr : lang === 'nl' ? selectedLibraryModule.titleNl : selectedLibraryModule.titleEn}
                    </h3>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-900 text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-normal">
                  <p className="font-semibold text-slate-700 dark:text-zinc-100 mb-1">
                    {lang === 'ar' ? 'الملخص القانوني:' : lang === 'nl' ? 'Wettelijke Samenvatting:' : 'Legal Summary:'}
                  </p>
                  {lang === 'ar' ? selectedLibraryModule.summaryAr : lang === 'nl' ? selectedLibraryModule.summaryNl : selectedLibraryModule.summaryEn}
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider">
                    {lang === 'ar' ? 'القواعد واللوائح الأساسية:' : lang === 'nl' ? 'Belangrijkste Verkeersregels:' : 'Key Traffic Regulations:'}
                  </h4>
                  <div className="space-y-3">
                    {((lang === 'ar' ? selectedLibraryModule.rulesAr : lang === 'nl' ? selectedLibraryModule.rulesNl : selectedLibraryModule.rulesEn) || []).map((rule: string, idx: number) => (
                      <div key={idx} className="p-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl shadow-2xs flex items-start gap-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-xs font-black">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-slate-700 dark:text-zinc-300 font-normal leading-relaxed">
                          {rule}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
                  <button
                    onClick={() => setSelectedLibraryModule(null)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {lang === 'ar' ? 'إغلاق المرجع' : lang === 'nl' ? 'Sluiten' : 'Close Reference'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-slate-100 dark:border-zinc-800 pt-6" />

          {/* Quick Category Filter for Theory Lessons */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider">
              {lang === 'ar' ? 'دروس القراءة السريعة:' : lang === 'nl' ? 'Snelcursus Lessen:' : 'Quick-Read Lessons:'}
            </h3>
            <div className="flex bg-slate-50 dark:bg-zinc-950 p-1.5 border border-slate-100 dark:border-zinc-900 rounded-xl gap-2 w-max max-w-full overflow-x-auto no-scrollbar">
              {(['all', 'priority', 'signs', 'speed'] as const).map(cat => {
                let label = "";
                if (cat === 'all') label = lang === 'ar' ? "الكل" : lang === 'nl' ? "Alles" : "All";
                else if (cat === 'priority') label = lang === 'ar' ? "الأولوية" : lang === 'nl' ? "Voorrang" : "Priority";
                else if (cat === 'signs') label = lang === 'ar' ? "الإشارات" : lang === 'nl' ? "Borden" : "Signs";
                else if (cat === 'speed') label = lang === 'ar' ? "السرعة" : lang === 'nl' ? "Snelheid" : "Speed";
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-300'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Theory Cards */}
            <div className="space-y-4">
              {filteredTheory.map(theory => (
                <div key={theory.id} className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="p-1 px-2 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                      {theory.category === 'priority' 
                        ? (lang === 'ar' ? 'أولوية' : lang === 'nl' ? 'Voorrang' : 'Priority')
                        : theory.category === 'signs'
                          ? (lang === 'ar' ? 'إشارات' : lang === 'nl' ? 'Borden' : 'Signs')
                          : theory.category === 'speed'
                            ? (lang === 'ar' ? 'سرعة' : lang === 'nl' ? 'Snelheid' : 'Speed')
                            : theory.category}
                    </span>
                    <button className="text-slate-300 hover:text-blue-500 transition cursor-pointer">
                      <Bookmark className="h-4 w-4" />
                    </button>
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">
                    {lang === 'ar' ? theory.titleAr : lang === 'nl' ? theory.titleNl : theory.titleEn}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal dark:text-zinc-400">
                    {lang === 'ar' ? theory.contentAr : lang === 'nl' ? theory.contentNl : theory.contentEn}
                  </p>
                </div>
              ))}
            </div>

            {/* Dutch Al-Andalos Practice mock test */}
            <div className="p-5 bg-white dark:bg-zinc-900 border border-indigo-500/10 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-indigo-500 animate-pulse" />
                <h3 className="font-bold text-slate-800 dark:text-white text-base">{t.examPrep}</h3>
              </div>
              <p className="text-xs text-slate-400">
                {lang === 'ar' 
                  ? "تحاكي الاختبارات التجريبية امتحانات النظرية الفعلية المحددة بوقت في هولندا." 
                  : lang === 'nl' 
                    ? "Oefentoetsen simuleren echte tijdgebonden theorie-examens in Nederland." 
                    : "Practice tests simulate actual timed theory examinations in the Netherlands."}
              </p>

              <div className="space-y-5">
                {mTests.map(q => (
                  <div key={q.id} className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                      {lang === 'ar' ? q.questionAr : lang === 'nl' ? q.questionNl : q.questionEn}
                    </p>
                    <div className="space-y-2">
                      {(lang === 'ar' ? q.optionsAr : lang === 'nl' ? q.optionsNl : q.optionsEn).map((opt, i) => {
                        const isSelected = selectedAnswers[q.id] === i;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSelectAnswer(q.id, i)}
                            className={`w-full text-left p-3 rounded-lg text-xs font-semibold border transition ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                                : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-indigo-400'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {selectedAnswers[q.id] !== undefined && (
                      <div className={`p-2.5 rounded-lg text-[11px] font-medium flex items-start gap-1.5 ${
                        selectedAnswers[q.id] === q.correct
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>
                          {selectedAnswers[q.id] === q.correct 
                            ? (lang === 'ar' ? q.correctDescriptionAr : lang === 'nl' ? q.correctDescriptionNl : q.correctDescriptionEn)
                            : (lang === 'ar' 
                                ? 'للأسف، الإجابة غير صحيحة. يرجى مراجعة المادة وقوانين السير لمعرفة القاعدة المرورية المتبعة.' 
                                : lang === 'nl' 
                                  ? 'Onjuist antwoord. Probeer de Nederlandse wet- en regelgeving te raadplegen.' 
                                  : 'Incorrect entry. Try looking up Dutch state regulations.')
                          }
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  onClick={checkPracticeTest}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  {lang === 'ar' ? 'تأكيد إجابات الامتحان' : lang === 'nl' ? 'Bevestig Examenantwoorden' : 'Confirm Exam Answers'}
                </button>
                {testResult && (
                  <span className="text-xs font-bold text-indigo-600 dark:text-zinc-200">{testResult}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'videos' && (
        <div id="videos-tab-view" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allVideos.map(video => (
            <VideoCardItem
              key={video.id}
              video={video}
              lang={lang}
              isPlaying={playingVideoId === video.id}
              onPlay={() => setPlayingVideoId(video.id)}
            />
          ))}
        </div>
      )}

      {activeSubTab === 'images' && (
        <div id="images-tab-view" className="space-y-6">
          {allImages.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl p-8 shadow-xs">
              <ImageIcon className="h-10 w-10 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400">
                {lang === 'ar' ? 'لا توجد صور تعليمية متاحة حالياً.' : lang === 'nl' ? 'Er zijn momenteel geen educatieve afbeeldingen beschikbaar.' : 'No educational images available at this time.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {allImages.map(img => (
                <ImageCardItem
                  key={img.id}
                  img={img}
                  lang={lang}
                  onSelect={setSelectedDetailedImage}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'signs' && (
        <div id="signs-tab-view" className="space-y-6">
          {/* Header Description */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 p-5 rounded-3xl shadow-xs">
            <h2 className="text-base font-black text-slate-800 dark:text-white">
              {lang === 'ar' ? `دليل شواخص المرور الهولندية - ${getSchoolShortName(schoolSettings)}` : `${getSchoolShortName(schoolSettings)} Verkeersborden Encyclopedie`}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'ar' 
                ? "تصفح وابحث في دليل شواخص المرور الشامل لجميع الفئات السبعة المعتمدة في امتحانات النظرية."
                : lang === 'nl'
                  ? "Ontdek en zoek in de officiële verkeersborden verdeeld over 7 categorieën inclusief gedetailleerde examentips."
                  : "Explore and search through the official Dutch road signs divided into 7 core categories with expert exam study tips."}
            </p>
          </div>

          {/* Search and Category Filters */}
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={lang === 'ar' ? "بحث..." : lang === 'nl' ? "Zoeken..." : "Search..."}
                value={signSearchQuery}
                onChange={(e) => setSignSearchQuery(e.target.value)}
                className="w-full h-8 pl-11 pr-11 text-xs font-semibold bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {signSearchQuery && (
                <button
                  onClick={() => setSignSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Horizontal 7-Category Filter Switcher */}
            <div className="flex bg-slate-50 dark:bg-zinc-950 p-1 border border-slate-100 dark:border-zinc-900 rounded-2xl gap-1.5 overflow-x-auto no-scrollbar">
              {(['all', 'danger', 'priority', 'prohibitory', 'mandatory', 'information', 'parking', 'highway'] as const).map(type => {
                const isActive = selectedSignType === type;
                let label = type.toUpperCase();
                if (type === 'all') label = lang === 'ar' ? "الكل" : lang === 'nl' ? "Alle" : "All";
                else if (type === 'danger') label = lang === 'ar' ? "تحذير" : lang === 'nl' ? "Waarschuwing" : "Warning";
                else if (type === 'priority') label = lang === 'ar' ? "أسبقية" : lang === 'nl' ? "Voorrang" : "Priority";
                else if (type === 'prohibitory') label = lang === 'ar' ? "منع" : lang === 'nl' ? "Verbod" : "Prohibition";
                else if (type === 'mandatory') label = lang === 'ar' ? "إلزام" : lang === 'nl' ? "Gebod" : "Mandatory";
                else if (type === 'information') label = lang === 'ar' ? "إرشاد" : lang === 'nl' ? "Informatie" : "Info";
                else if (type === 'parking') label = lang === 'ar' ? "مواقف" : lang === 'nl' ? "Parkeren" : "Parking";
                else if (type === 'highway') label = lang === 'ar' ? "طرق سريعة" : lang === 'nl' ? "Snelweg" : "Highway";

                return (
                  <button
                    key={type}
                    onClick={() => setSelectedSignType(type)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-900'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Signs Grid */}
          {filteredSigns.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSigns.map(sign => (
                <div
                  key={sign.id}
                  onClick={() => setSelectedDetailedSign(sign)}
                  className="p-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl flex items-start gap-4 hover:border-blue-500/40 hover:-translate-y-0.5 transition cursor-pointer shadow-xs"
                >
                  <TrafficSignDisplay sign={sign} size="md" />
                  <div className="space-y-1 text-xs flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[10px] text-blue-500 dark:text-blue-400 font-extrabold bg-blue-500/10 dark:bg-blue-500/5 px-1.5 py-0.5 rounded">
                        {sign.code}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                        {getSignDisplayCategory(sign)}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-xs line-clamp-1">
                      {lang === 'ar' ? sign.nameAr : lang === 'nl' ? sign.nameNl : sign.nameEn}
                    </h4>
                    <p className="text-slate-400 font-normal line-clamp-2 leading-relaxed text-[11px] dark:text-zinc-500">
                      {lang === 'ar' ? sign.descriptionAr : lang === 'nl' ? sign.descriptionNl : sign.descriptionEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800/60">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700 dark:text-white">
                {lang === 'ar' ? "لم يتم العثور على أي شواخص" : lang === 'nl' ? "Geen verkeersborden gevonden" : "No traffic signs found"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'ar' ? "حاول تغيير كلمة البحث أو فلتر الفئات لتصفح المزيد." : lang === 'nl' ? "Probeer een andere zoekterm of categorie filter." : "Try adjusting your search query or choosing another category filter."}
              </p>
            </div>
          )}

          {/* Premium Detailed Comparison & Study Modal */}
          {selectedDetailedSign && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 max-w-2xl w-full overflow-hidden shadow-2xl relative my-8">
                {/* Modal Close Button */}
                <button
                  onClick={() => setSelectedDetailedSign(null)}
                  className="absolute right-4 top-4 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full text-slate-500 dark:text-zinc-400 transition z-10 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Modal Header */}
                <div className="p-6 bg-linear-to-r from-blue-50 to-indigo-50/30 dark:from-zinc-950 dark:to-zinc-900 border-b border-slate-100 dark:border-zinc-800/80 flex flex-col items-center text-center space-y-4">
                  <div className="p-2 bg-white dark:bg-zinc-950 rounded-2xl shadow-sm border border-slate-100/50 dark:border-zinc-800">
                    <TrafficSignDisplay sign={selectedDetailedSign} size="xl" />
                  </div>
                  <div>
                    <span className="font-mono text-xs text-blue-600 dark:text-blue-400 font-extrabold bg-blue-600/10 px-2.5 py-1 rounded-full uppercase">
                      {selectedDetailedSign.code} — {getSignDisplayCategory(selectedDetailedSign)}
                    </span>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white mt-2">
                      {lang === 'ar' ? selectedDetailedSign.nameAr : lang === 'nl' ? selectedDetailedSign.nameNl : selectedDetailedSign.nameEn}
                    </h3>
                  </div>
                </div>

                {/* Multilingual Side-by-Side Comparison Area */}
                <div className="p-6 space-y-6 max-h-[350px] overflow-y-auto no-scrollbar">
                  {/* Grid for 3 Languages */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Nederlands Column */}
                    <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/60 rounded-2xl space-y-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded">NL</span>
                        <h5 className="text-xs font-bold text-slate-800 dark:text-white">Nederlands</h5>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">{selectedDetailedSign.nameNl}</p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed font-normal">{selectedDetailedSign.descriptionNl}</p>
                    </div>

                    {/* English Column */}
                    <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/60 rounded-2xl space-y-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded">EN</span>
                        <h5 className="text-xs font-bold text-slate-800 dark:text-white">English</h5>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">{selectedDetailedSign.nameEn}</p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed font-normal">{selectedDetailedSign.descriptionEn}</p>
                    </div>

                    {/* Arabic Column */}
                    <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/60 rounded-2xl space-y-2 text-right" dir="rtl">
                      <div className="flex items-center gap-1.5 justify-end">
                        <h5 className="text-xs font-bold text-slate-800 dark:text-white">العربية</h5>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded">AR</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">{selectedDetailedSign.nameAr}</p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed font-normal">{selectedDetailedSign.descriptionAr}</p>
                    </div>
                  </div>

                  {/* Practical Driving Advice Section (Only if present in dataset) */}
                  {Boolean((lang === 'ar' ? selectedDetailedSign.practicalAdviceAr : lang === 'nl' ? selectedDetailedSign.practicalAdviceNl : selectedDetailedSign.practicalAdviceEn) || selectedDetailedSign.practicalAdviceEn) && (
                    <div className="p-4 border border-blue-500/20 bg-blue-500/5 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <Navigation className="h-4.5 w-4.5 shrink-0" />
                        <h4 className="text-xs font-bold uppercase tracking-wider">
                          {lang === 'ar' ? "نصائح القيادة العملية" : lang === 'nl' ? "Praktisch Rijadvies" : "Practical Driving Advice"}
                        </h4>
                      </div>
                      <p className="text-[11px] leading-relaxed font-normal text-slate-600 dark:text-zinc-300">
                        {lang === 'ar' ? (selectedDetailedSign.practicalAdviceAr || selectedDetailedSign.practicalAdviceEn) : lang === 'nl' ? (selectedDetailedSign.practicalAdviceNl || selectedDetailedSign.practicalAdviceEn) : selectedDetailedSign.practicalAdviceEn}
                      </p>
                    </div>
                  )}

                  {/* Theory Exam Tips Section (Only if present in dataset) */}
                  {Boolean((lang === 'ar' ? selectedDetailedSign.examTipsAr : lang === 'nl' ? selectedDetailedSign.examTipsNl : selectedDetailedSign.examTipsEn) || selectedDetailedSign.examTipsEn) && (
                    <div className="p-4 border border-amber-500/20 bg-amber-500/5 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <Award className="h-4.5 w-4.5 shrink-0" />
                        <h4 className="text-xs font-bold uppercase tracking-wider">
                          {lang === 'ar' ? "أسرار الامتحان النظري الخاص بهذه الشاخصة" : lang === 'nl' ? "CBR Theorie Examentip" : "Sign Theory Exam Tip"}
                        </h4>
                      </div>
                      <p className="text-[11px] leading-relaxed font-normal text-slate-600 dark:text-zinc-300">
                        {lang === 'ar' ? (selectedDetailedSign.examTipsAr || selectedDetailedSign.examTipsEn) : lang === 'nl' ? (selectedDetailedSign.examTipsNl || selectedDetailedSign.examTipsEn) : selectedDetailedSign.examTipsEn}
                      </p>
                    </div>
                  )}

                  {/* Common Student Mistakes Section (Only if present in dataset) */}
                  {Boolean((lang === 'ar' ? selectedDetailedSign.commonMistakesAr : lang === 'nl' ? selectedDetailedSign.commonMistakesNl : selectedDetailedSign.commonMistakesEn) || selectedDetailedSign.commonMistakesEn) && (
                    <div className="p-4 border border-rose-500/20 bg-rose-500/5 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                        <h4 className="text-xs font-bold uppercase tracking-wider">
                          {lang === 'ar' ? "أخطاء شائعة في الاختبار" : lang === 'nl' ? "Veelgemaakte Fouten" : "Common Exam Mistakes"}
                        </h4>
                      </div>
                      <p className="text-[11px] leading-relaxed font-normal text-slate-600 dark:text-zinc-300">
                        {lang === 'ar' ? (selectedDetailedSign.commonMistakesAr || selectedDetailedSign.commonMistakesEn) : lang === 'nl' ? (selectedDetailedSign.commonMistakesNl || selectedDetailedSign.commonMistakesEn) : selectedDetailedSign.commonMistakesEn}
                      </p>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-slate-50 dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-800/80 flex justify-end">
                  <button
                    onClick={() => setSelectedDetailedSign(null)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    {lang === 'ar' ? "إغلاق نافذة المذاكرة" : lang === 'nl' ? "Sluit Studievenster" : "Close Study Window"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* INFINITE PRACTICE QUIZ MODE */}
      {activeSubTab === 'quiz' && currentQuizQuestion && (
        <div id="quiz-tab-view" className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 p-5 rounded-3xl shadow-xs">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-black text-slate-800 dark:text-white">
                  {lang === 'ar' ? "اختبار تحديد الشواخص المرورية" : lang === 'nl' ? "Verkeersborden Kennis Quiz" : "Traffic Signs Practice Quiz"}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'ar' ? "اختبر معلوماتك في شواخص السير الهولندية بشكل عشوائي وغير محدود." : lang === 'nl' ? "Test je bordenkennis met willekeurige vragen en directe feedback." : "Train your knowledge of Dutch road signs with infinite random questions."}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black rounded-full">
                  {lang === 'ar' ? `النتيجة: ${quizTotalCorrect} / ${quizTotalAttempted}` : lang === 'nl' ? `Score: ${quizTotalCorrect} / ${quizTotalAttempted}` : `Score: ${quizTotalCorrect} / ${quizTotalAttempted}`}
                </span>
                {quizTotalAttempted > 0 && (
                  <p className="text-[10px] text-slate-400 mt-1 font-bold">
                    {Math.round((quizTotalCorrect / quizTotalAttempted) * 100)}% {lang === 'ar' ? "نسبة النجاح" : lang === 'nl' ? "geslaagd" : "accuracy"}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left side: Sign display card */}
            <div className="lg:col-span-5 p-8 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl shadow-xs flex flex-col items-center justify-center space-y-6">
              <span className="text-[10px] font-mono font-extrabold uppercase bg-slate-100 dark:bg-zinc-950 px-2 py-1 rounded text-slate-500">
                {lang === 'ar' ? "ما هو معنى هذا الشاخص؟" : lang === 'nl' ? "Wat betekent dit bord?" : "Identify This Road Sign"}
              </span>
              <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100/50 dark:border-zinc-800 shadow-xs">
                <TrafficSignDisplay sign={currentQuizQuestion.sign} size="xl" />
              </div>
              <span className="font-mono text-sm font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">
                Code: {currentQuizQuestion.sign.code}
              </span>
            </div>

            {/* Right side: Options and results */}
            <div className="lg:col-span-7 space-y-4">
              <div className="space-y-3">
                {currentQuizQuestion.options.map((opt, i) => {
                  const isSelected = selectedQuizOption === i;
                  const isCorrect = opt.isCorrect;
                  const showSuccess = hasAnsweredQuiz && isCorrect;
                  const showDanger = hasAnsweredQuiz && isSelected && !isCorrect;

                  return (
                    <button
                      key={i}
                      disabled={hasAnsweredQuiz}
                      onClick={() => handleSelectQuizOption(i)}
                      className={`w-full text-left p-4 rounded-2xl text-xs font-bold border transition duration-150 flex items-center justify-between ${
                        showSuccess
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-400 shadow-xs'
                          : showDanger
                            ? 'bg-red-500/10 border-red-500 text-red-800 dark:text-red-400'
                            : isSelected
                              ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                              : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:border-blue-400'
                      }`}
                    >
                      <span className="flex-1 pr-4">
                        {lang === 'ar' ? opt.textAr : lang === 'nl' ? opt.textNl : opt.textEn}
                      </span>
                      {showSuccess && <Check className="h-4 w-4 text-emerald-500 shrink-0" />}
                      {showDanger && <X className="h-4 w-4 text-red-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanations & Next Button */}
              {hasAnsweredQuiz && (
                <div className="p-5 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/60 rounded-3xl space-y-4">
                  <div className="flex gap-2.5 items-start">
                    <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                        {lang === 'ar' ? "التفسير التعليمي للشاخصة" : lang === 'nl' ? "Onderwijskundige Uitleg" : "Educational Explanation"}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium leading-relaxed">
                        {lang === 'ar' ? currentQuizQuestion.sign.descriptionAr : lang === 'nl' ? currentQuizQuestion.sign.descriptionNl : currentQuizQuestion.sign.descriptionEn}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleNextQuizQuestion}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{lang === 'ar' ? "السؤال التالي" : lang === 'nl' ? "Volgende Vraag" : "Next Question"}</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'coaching' && (
        <div 
          id="coaching-chatbot-view" 
          className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl md:rounded-3xl shadow-xs overflow-hidden flex flex-col h-[560px] md:h-[620px] transition-colors"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          {/* Header: Clean, modern minimal header with Apple/modern banking aesthetics */}
          <div className="px-4 py-3 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 ${
                aiStatus.isSuspended 
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-400' 
                  : 'bg-blue-50 dark:bg-blue-950/60 border-blue-100 dark:border-blue-900/60 text-blue-600 dark:text-blue-400'
              }`}>
                {aiStatus.isSuspended ? <ShieldAlert className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  {aiAssistantName}
                </h3>
              </div>
            </div>

            {!aiStatus.isSuspended && (
              <button
                type="button"
                onClick={() => {
                  setMessages([createInitialMessage(lang)]);
                  setAttachedImage(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-850 dark:text-zinc-400 dark:hover:text-white px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition flex items-center gap-1.5 cursor-pointer"
                title={lang === 'ar' ? 'محادثة جديدة' : lang === 'nl' ? 'Nieuw gesprek' : 'New chat'}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {lang === 'ar' ? 'محادثة جديدة' : lang === 'nl' ? 'Nieuw gesprek' : 'New chat'}
                </span>
              </button>
            )}
          </div>

          {/* Hidden file input for multimodal questions */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageFileChange}
            accept="image/*"
            className="hidden"
          />

          {aiStatus.isSuspended ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-2xs">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-bold font-mono">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {aiStatus.tier === 2 
                      ? (lang === 'ar' ? 'تعليق لمدة 48 ساعة' : lang === 'nl' ? '48-uur opschorting' : '48-Hour Suspension') 
                      : (lang === 'ar' ? 'تعليق لمدة 24 ساعة' : lang === 'nl' ? '24-uur opschorting' : '24-Hour Suspension')}
                  </span>
                </div>
                <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {lang === 'ar' ? 'تم تعليق خدمة المساعد الذكي مؤقتاً' : lang === 'nl' ? `${aiAssistantName} Tijdelijk Opgeschort` : `${aiAssistantName} Temporarily Suspended`}
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-medium">
                  {lang === 'ar'
                    ? 'تم تعليق خدمة المساعد الذكي بعد تكرار الاستفسارات الخارجة عن نطاق تدريب القيادة وقواعد المرور الهولندية. يُرجى الانتظار حتى انتهاء فترة التعليق أو التواصل مع إدارة المدرسة.'
                    : lang === 'nl'
                    ? `De ${aiAssistantName} is tijdelijk geblokkeerd wegens herhaalde off-topic vragen buiten de Nederlandse verkeersregels en rijopleiding.`
                    : `The ${aiAssistantName} has been temporarily suspended due to repeated off-topic inquiries outside Dutch traffic rules and driving education.`}
                </p>
              </div>

              {/* Real-time Countdown Box */}
              <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 w-full max-w-xs space-y-1 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {lang === 'ar' ? 'الوقت المتبقي لرفع التعليق' : lang === 'nl' ? 'Resterende tijd tot ontgrendeling' : 'Time Remaining'}
                </span>
                <div className="text-2xl md:text-3xl font-black font-mono text-amber-600 dark:text-amber-400 tracking-wider">
                  {formatRemainingTime(aiStatus.remainingSeconds)}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Conversation Area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 no-scrollbar">
                {messages.map((msg) => {
                  const isAI = msg.sender === 'ai';
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex gap-2.5 ${isAI ? 'justify-start' : 'justify-end'}`}
                    >
                      {isAI && (
                        <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                          <Bot className="h-3.5 w-3.5" />
                        </div>
                      )}
                      <div className={`max-w-[85%] md:max-w-[78%] p-3.5 rounded-2xl text-xs leading-relaxed space-y-2 ${
                        isAI
                          ? 'bg-slate-100/90 dark:bg-zinc-800/90 border border-slate-200/60 dark:border-zinc-700/60 text-slate-850 dark:text-zinc-100 rounded-tl-xs rtl:rounded-tl-2xl rtl:rounded-tr-xs shadow-2xs'
                          : 'bg-blue-600 text-white rounded-tr-xs rtl:rounded-tr-2xl rtl:rounded-tl-xs shadow-xs font-normal'
                      }`}>
                        {msg.image && (
                          <div className="rounded-lg overflow-hidden border border-white/20 dark:border-zinc-700/60 max-h-48 max-w-xs bg-black/10">
                            <img src={msg.image} alt="Uploaded" className="w-full h-auto object-cover" />
                          </div>
                        )}
                        {renderFormattedChatMessage(msg.text, isAI)}
                        <span className={`block text-[9px] font-mono text-right rtl:text-left ${
                          isAI ? 'text-slate-400 dark:text-zinc-500' : 'text-blue-200'
                        }`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex gap-2.5 justify-start">
                    <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <div className="p-3.5 bg-slate-100/90 dark:bg-zinc-800/90 border border-slate-200/60 dark:border-zinc-700/60 rounded-2xl rounded-tl-xs rtl:rounded-tl-2xl rtl:rounded-tr-xs shadow-2xs flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce shrink-0" style={{ animationDelay: '0ms' }}></span>
                        <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce shrink-0" style={{ animationDelay: '150ms' }}></span>
                        <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce shrink-0" style={{ animationDelay: '300ms' }}></span>
                      </div>
                      {messages.length > 0 && messages[messages.length - 1]?.image && (
                        <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                          {lang === 'ar' ? 'أحلل الصورة...' : lang === 'nl' ? 'Afbeelding analyseren...' : 'Analyzing image...'}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div ref={chatBottomRef}></div>
              </div>

              {/* Quick Questions Suggestion Chips */}
              {!loading && (
                <div className="px-4 py-2 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {[
                    {
                      label: lang === 'ar' ? 'من له الأسبقية؟' : lang === 'nl' ? 'Wie heeft voorrang?' : 'Who has priority?',
                      query: lang === 'ar' ? 'من له الأسبقية؟' : lang === 'nl' ? 'Wie heeft voorrang?' : 'Who has priority?'
                    },
                    {
                      label: lang === 'ar' ? 'معنى الشاخصة' : lang === 'nl' ? 'Betekenis verkeersbord' : 'Sign meaning',
                      query: lang === 'ar' ? 'ما معنى هذه الشاخصة؟' : lang === 'nl' ? 'Wat betekent dit verkeersbord?' : 'What does this road sign mean?'
                    },
                    {
                      label: lang === 'ar' ? 'قاعدة مرورية' : lang === 'nl' ? 'Verkeersregel' : 'Traffic rule',
                      query: lang === 'ar' ? 'اشرح لي قاعدة مرورية هامة' : lang === 'nl' ? 'Leg een belangrijke verkeersregel uit' : 'Explain an important traffic rule'
                    },
                    {
                      label: lang === 'ar' ? 'التحضير لدرسي' : lang === 'nl' ? 'Les voorbereiden' : 'Prepare for lesson',
                      query: lang === 'ar' ? 'كيف أستعد لدرسي القادم؟' : lang === 'nl' ? 'Hoe bereid ik me voor op mijn volgende les?' : 'How do I prepare for my next driving lesson?'
                    }
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => sendMessageWithText(item.query)}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50/70 dark:bg-zinc-800/70 dark:hover:bg-zinc-800 text-[11px] font-semibold text-slate-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl border border-slate-200/70 hover:border-blue-200 dark:border-zinc-700/60 whitespace-nowrap transition cursor-pointer shrink-0 shadow-2xs"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Attached Image Preview Chip */}
              {attachedImage && (
                <div className="px-4 py-2 bg-slate-50 dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-800 flex items-center gap-2">
                  <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-blue-200 dark:border-blue-800 shrink-0">
                    <img src={attachedImage} alt="Attachment" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-slate-700 dark:text-zinc-200 truncate">
                      {lang === 'ar' ? 'صورة مرفقة للتحليل' : lang === 'nl' ? 'Bijgevoegde afbeelding' : 'Attached image for analysis'}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {lang === 'ar' ? 'اضغط إرسال أو اسأل عنها' : lang === 'nl' ? 'Klik op verzenden of stel een vraag' : 'Click send or ask about it'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachedImage(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                    title={lang === 'ar' ? 'إلغاء المرفق' : 'Remove attachment'}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Input Form */}
              <div className="p-3 md:p-4 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="h-8 w-8 md:h-9 md:w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:text-zinc-400 dark:hover:text-blue-400 dark:hover:bg-zinc-800 transition cursor-pointer shrink-0"
                    title={lang === 'ar' ? 'إرفاق صورة شاخصة أو تقاطع' : lang === 'nl' ? 'Afbeelding toevoegen' : 'Attach image'}
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  <input
                    type="text"
                    placeholder={lang === 'ar' ? 'اسألني عن القيادة...' : lang === 'nl' ? 'Stel een vraag over autorijden...' : 'Ask me about driving...'}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={loading}
                    className="flex-1 bg-transparent px-2 py-2 text-xs md:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 outline-none border-none"
                  />
                  <button
                    type="submit"
                    disabled={(!inputValue.trim() && !attachedImage) || loading}
                    className="h-8 w-8 md:h-9 md:w-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-xl flex items-center justify-center transition-colors shrink-0 cursor-pointer shadow-xs"
                    title={lang === 'ar' ? 'إرسال' : lang === 'nl' ? 'Versturen' : 'Send'}
                  >
                    <Send className="h-3.5 w-3.5 rtl:rotate-180" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}

      {selectedDetailedImage && (
        <ImageLightboxViewer
          img={selectedDetailedImage}
          lang={lang}
          onClose={() => setSelectedDetailedImage(null)}
        />
      )}

    </div>
  );
}

const StudentLearning = React.memo(StudentLearningComponent);
export default StudentLearning;
