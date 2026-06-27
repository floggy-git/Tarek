import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, Video, Compass, HelpCircle, MessageSquare, Send, Sparkles, 
  CheckCircle, Play, ChevronRight, Bookmark, Award, AlertCircle,
  Search, X, RotateCcw, ArrowRight, ArrowLeft, Check, Info, AlertTriangle,
  TrendingUp, Activity
} from 'lucide-react';
import { TRANSLATIONS, Language, AIMessage } from '../types';
import { THEORY_LESSONS, INSTRUCTIONAL_VIDEOS, ROAD_SIGNS } from '../data';
import { EXAM_QUESTIONS_POOL } from '../data/questionsBank';
import { DRIVING_LIBRARY } from '../data/drivingLibrary';
import { getDutchSignUrl } from '../utils/signUtils';
import { DrivingSceneDisplay } from './DrivingSceneDisplay';

interface StudentLearningProps {
  lang: Language;
  t: typeof TRANSLATIONS['en'];
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

export default function StudentLearning({ lang, t }: StudentLearningProps) {
  const [activeSubTab, setActiveSubTab] = useState<'theory' | 'videos' | 'signs' | 'quiz' | 'exam' | 'coaching' | 'progression'>('theory');

  // Interactive progression history tracked automatically
  const [examHistory, setExamHistory] = useState<any[]>(() => [
    {
      id: 1,
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-US', { month: 'short', day: 'numeric' }),
      difficulty: 'beginner',
      score: 13,
      total: 15,
      hazardCorrect: 4,
      hazardTotal: 5,
      rulesCorrect: 4,
      rulesTotal: 5,
      signsCorrect: 5,
      signsTotal: 5,
      isPassed: true,
      weakTopics: [],
      suggestedSigns: []
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-US', { month: 'short', day: 'numeric' }),
      difficulty: 'intermediate',
      score: 18,
      total: 25,
      hazardCorrect: 6,
      hazardTotal: 8,
      rulesCorrect: 5,
      rulesTotal: 8,
      signsCorrect: 7,
      signsTotal: 9,
      isPassed: false,
      weakTopics: ['Highway & Motorway Driving', 'Environmental Zones'],
      suggestedSigns: ['A1-100', 'B6']
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-US', { month: 'short', day: 'numeric' }),
      difficulty: 'advanced',
      score: 28,
      total: 40,
      hazardCorrect: 8,
      hazardTotal: 12,
      rulesCorrect: 10,
      rulesTotal: 14,
      signsCorrect: 10,
      signsTotal: 14,
      isPassed: false,
      weakTopics: ['Tram Situations', 'Bicycle Infrastructure'],
      suggestedSigns: ['C15', 'J22']
    }
  ]);

  // Theory Category Filter
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'priority' | 'signs' | 'speed'>('all');
  const [selectedLibraryModule, setSelectedLibraryModule] = useState<any | null>(null);
  const filteredTheory = selectedCategory === 'all' 
    ? THEORY_LESSONS 
    : THEORY_LESSONS.filter(item => item.category === selectedCategory);

  // Dynamic Sign Categorization to map exactly to the 7 Dutch / Al-Andalos Categories
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

  const filteredSigns = ROAD_SIGNS.filter(sign => {
    const cat = getSignDisplayCategory(sign);
    const matchesCategory = selectedSignType === 'all' || cat === selectedSignType;
    
    const query = signSearchQuery.trim().toLowerCase();
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

  // Timed Exam Prep Mode - dynamically assembled from the extensive pool of real Dutch / Al-Andalos questions
  const [examDifficulty, setExamDifficulty] = useState<'beginner' | 'intermediate' | 'advanced' | 'cbr'>('beginner');
  const [hazardCount, setHazardCount] = useState(5);
  const [rulesCount, setRulesCount] = useState(5);
  const [signsCount, setSignsCount] = useState(5);
  const [hazardTimerLimit, setHazardTimerLimit] = useState<number | null>(null);

  const [examQuestions, setExamQuestions] = useState<any[]>(() => {
    const hazards = EXAM_QUESTIONS_POOL.filter(q => q.type === 'hazard').slice(0, 5);
    const rules = EXAM_QUESTIONS_POOL.filter(q => q.type === 'rules').slice(0, 5);
    const signs = EXAM_QUESTIONS_POOL.filter(q => q.type === 'signs').slice(0, 5);
    return [...hazards, ...rules, ...signs].map((q, idx) => ({ ...q, originalId: q.id, id: idx }));
  });

  const EXAM_QUESTIONS = examQuestions;

  const [examInProgress, setExamInProgress] = useState(false);
  const [currentExamQuestionIndex, setCurrentExamQuestionIndex] = useState(0);
  const [examAnswers, setExamAnswers] = useState<Record<number, number>>({});
  const [examTimeLeft, setExamTimeLeft] = useState(900); // 15 mins
  const [examCompleted, setExamCompleted] = useState(false);
  const [hazardTimer, setHazardTimer] = useState<number | null>(null);

  // Overall Exam Timer Hook
  useEffect(() => {
    let timerId: any;
    if (examInProgress && !examCompleted) {
      timerId = setInterval(() => {
        setExamTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerId);
            handleFinishExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [examInProgress, examCompleted]);

  // Hazard Question individual timer hook based on difficulty
  useEffect(() => {
    let hazardInterval: any;
    const isHazardQuestion = examInProgress && !examCompleted && currentExamQuestionIndex < hazardCount;
    
    if (isHazardQuestion && hazardTimerLimit !== null) {
      if (hazardTimer === null) {
        setHazardTimer(hazardTimerLimit);
      } else if (hazardTimer > 0) {
        hazardInterval = setInterval(() => {
          setHazardTimer(prev => (prev !== null ? prev - 1 : null));
        }, 1000);
      } else if (hazardTimer === 0) {
        // Auto-advance
        setExamAnswers(prev => ({ ...prev, [currentExamQuestionIndex]: -1 })); // marked unanswered
        if (currentExamQuestionIndex < examQuestions.length - 1) {
          setCurrentExamQuestionIndex(prev => prev + 1);
          setHazardTimer(hazardTimerLimit);
        } else {
          handleFinishExam();
        }
      }
    } else {
      setHazardTimer(null);
    }
    return () => clearInterval(hazardInterval);
  }, [examInProgress, examCompleted, currentExamQuestionIndex, hazardTimer, hazardCount, hazardTimerLimit, examQuestions.length]);

  const handleStartExam = () => {
    let hCount = 5;
    let rCount = 5;
    let sCount = 5;
    let hTimerLimit: number | null = 8;
    let totalTime = 900; // 15 mins

    if (examDifficulty === 'beginner') {
      hCount = 5;
      rCount = 5;
      sCount = 5;
      hTimerLimit = null; // No timer
      totalTime = 1500; // 25 mins
    } else if (examDifficulty === 'intermediate') {
      hCount = 8;
      rCount = 8;
      sCount = 9;
      hTimerLimit = 12; // 12 seconds
      totalTime = 1200; // 20 mins
    } else if (examDifficulty === 'advanced') {
      hCount = 12;
      rCount = 14;
      sCount = 14;
      hTimerLimit = 8; // 8 seconds
      totalTime = 900; // 15 mins
    } else if (examDifficulty === 'cbr') {
      hCount = 25;
      rCount = 12;
      sCount = 28;
      hTimerLimit = 8; // 8 seconds
      totalTime = 1800; // 30 mins
    }

    setHazardCount(hCount);
    setRulesCount(rCount);
    setSignsCount(sCount);
    setHazardTimerLimit(hTimerLimit);

    const pool = [...EXAM_QUESTIONS_POOL];
    const rawHazards = pool.filter(q => q.type === 'hazard');
    const rawRules = pool.filter(q => q.type === 'rules');
    const rawSigns = pool.filter(q => q.type === 'signs');

    let idxCounter = 0;
    // Helper to extract randomized subsets with safety padding
    const extractSubset = (arr: any[], count: number) => {
      let result: any[] = [];
      const shuffled = [...arr].sort(() => 0.5 - Math.random());
      for (let i = 0; i < count; i++) {
        const item = shuffled[i % shuffled.length];
        result.push({ ...item, originalId: item.id, id: idxCounter++ });
      }
      return result;
    };

    const hazards = extractSubset(rawHazards, hCount);
    const rules = extractSubset(rawRules, rCount);
    const signs = extractSubset(rawSigns, sCount);

    const selected = [...hazards, ...rules, ...signs];
    setExamQuestions(selected);

    setExamInProgress(true);
    setCurrentExamQuestionIndex(0);
    setExamAnswers({});
    setExamTimeLeft(totalTime);
    setExamCompleted(false);
    setHazardTimer(hTimerLimit);
  };

  const handleSelectExamAnswer = (optIndex: number) => {
    setExamAnswers(prev => ({ ...prev, [currentExamQuestionIndex]: optIndex }));
    
    // Rapid-fire hazard questions advance automatically as soon as clicked (if there's a timer)
    if (currentExamQuestionIndex < hazardCount && hazardTimerLimit !== null) {
      if (currentExamQuestionIndex < examQuestions.length - 1) {
        setCurrentExamQuestionIndex(prev => prev + 1);
        setHazardTimer(hazardTimerLimit);
      } else {
        handleFinishExam();
      }
    }
  };

  const handleFinishExam = () => {
    setExamCompleted(true);
    setExamInProgress(false);
    setHazardTimer(null);

    // Compute detailed stats for the current finished exam session
    let correctCount = 0;
    let hazardCorrect = 0;
    let rulesCorrect = 0;
    let signsCorrect = 0;

    examQuestions.forEach((q, idx) => {
      const userAnswer = examAnswers[idx];
      if (userAnswer === q.correct) {
        correctCount++;
        if (q.type === 'hazard') hazardCorrect++;
        else if (q.type === 'rules') rulesCorrect++;
        else if (q.type === 'signs') signsCorrect++;
      }
    });

    const isPassed = examDifficulty === 'beginner'
      ? correctCount >= 12
      : examDifficulty === 'intermediate'
        ? correctCount >= 20
        : examDifficulty === 'advanced'
          ? correctCount >= 32
          : (hazardCorrect >= 13 && rulesCorrect >= 10 && signsCorrect >= 25);

    // Identify weak topics and suggested signs from incorrect answers
    const weakTopicsSet = new Set<string>();
    const suggestedSignsSet = new Set<string>();

    examQuestions.forEach((q, idx) => {
      const userAnswer = examAnswers[idx];
      if (userAnswer !== q.correct) {
        if (q.type === 'hazard') {
          weakTopicsSet.add('Residential Home Zones (Woonerf)');
          weakTopicsSet.add('Parking & Stopping Regulations');
        } else if (q.type === 'rules') {
          weakTopicsSet.add('Highway & Motorway Driving');
          weakTopicsSet.add('Environmental Zones');
        } else if (q.type === 'signs') {
          weakTopicsSet.add('Priority & Right-of-Way');
          weakTopicsSet.add('Bicycle Infrastructure');
          weakTopicsSet.add('Tram Situations');
        }

        if (q.signCode) {
          suggestedSignsSet.add(q.signCode);
        }
      }
    });

    const sessionResult = {
      id: Date.now(),
      timestamp: new Date().toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      difficulty: examDifficulty,
      score: correctCount,
      total: examQuestions.length,
      hazardCorrect,
      hazardTotal: hazardCount,
      rulesCorrect,
      rulesTotal: rulesCount,
      signsCorrect,
      signsTotal: signsCount,
      isPassed,
      weakTopics: Array.from(weakTopicsSet).slice(0, 3),
      suggestedSigns: Array.from(suggestedSignsSet).slice(0, 4)
    };

    setExamHistory(prev => [sessionResult, ...prev]);
  };

  // Video playback simulation
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

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

  // AI Driving Coach State
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: "m0",
      sender: "ai",
      text: lang === 'ar' ? "مرحباً بك! أنا مدرب القيادة الذكي لمدرسة الأندلس. تفضل بسؤالي عن قوانين المرور الهولندية، امتحانات الأندلس النظرية، أو قواعد الأسبقية والأولوية (Voorrang)." : lang === 'nl' ? "Hallo! Ik ben jouw Al-Andalos AI-Rijcoach. Vraag me alles over Al-Andalos priority-regels, borden of theorie-examens." : "Hello! I am your Al-Andalos AI Driving Coach. Ask me any traffic rule questions, theory exam prep, or priority laws.",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMsg: AIMessage = {
      id: `m-usr-${Date.now()}`,
      sender: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      // Call our secure server-side proxy
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMsg.text,
          lang: lang
        })
      });

      let replyText = "";
      if (response.ok) {
        const data = await response.json();
        replyText = data.reply;
      } else {
        // Fallback premium simulator response if response status not OK
        replyText = lang === 'ar'
          ? "مفهوم تماماً. تنص المادة 15 من لائحة قواعد وأنظمة المرور الهولندية (RVV 1990) على وجوب إعطاء الأولوية للمركبات القادمة من اليمين عند تقاطعات الطرق المتساوية. ويُرجى الانتباه دائماً لشواخص \"أسنان القرش\" (Haaientanden) المرسومة على الإسفلت المخصصة لتحديد الأولوية."
          : lang === 'nl'
          ? "Begrepen. Volgens RVV 1990 artikel 15 moeten bestuurders op een gelijkwaardig kruispunt voorrang verlenen aan bestuurders van rechts. Bestudeer de haaientanden nader."
          : "Understood. Our Al-Andalos practice systems indicate that according to Dutch Traffic Laws Article 15, drivers must give way to drivers from the right. Please study the shark teeth priority markings.";
      }

      const resMsg: AIMessage = {
        id: `m-ai-${Date.now()}`,
        sender: 'ai',
        text: replyText || "Sorry, I am facing connectivity issues, please try again later.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, resMsg]);
    } catch (err) {
      console.error("Local chat fetch error:", err);
      // Fallback premium simulator response if offline or fetch failed
      let textSim = "Understood. Our Al-Andalos practice systems indicate that according to Dutch Traffic Laws Article 15, drivers must give way to drivers from the right. Please study the shark teeth priority markings.";
      if (lang === 'ar') {
        textSim = "مفهوم تماماً. تنص المادة 15 من لائحة قواعد وأنظمة المرور الهولندية (RVV 1990) على وجوب إعطاء الأولوية للمركبات القادمة من اليمين عند تقاطعات الطرق المتساوية. ويُرجى الانتباه دائماً لشواخص \"أسنان القرش\" (Haaientanden) المرسومة على الإسفلت المخصصة لتحديد الأولوية.";
      } else if (lang === 'nl') {
        textSim = "Begrepen. Volgens RVV 1990 artikel 15 moeten bestuurders op een gelijkwaardig kruispunt voorrang verlenen aan bestuurders van rechts. Bestudeer de haaientanden nader.";
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

  return (
    <div className="space-y-6 pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Top Section */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">{t.learning}</h1>
        <p className="text-xs text-slate-400 mt-0.5">High fidelity tools to pass your Dutch driving exam flawlessly</p>
      </div>

      {/* Segment switcher tabs matching premium Tesla style */}
      <div className="flex bg-slate-100/80 dark:bg-zinc-900/80 p-1 rounded-xl overflow-x-auto no-scrollbar scroll-smooth gap-1 border border-slate-200/40 dark:border-zinc-800/40 flex-nowrap shrink-0" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <button
          onClick={() => setActiveSubTab('theory')}
          className={`px-4 py-2.5 whitespace-nowrap text-xs font-semibold rounded-lg transition-all duration-150 shrink-0 cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'theory'
              ? 'bg-white dark:bg-zinc-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/50 dark:border-zinc-700/50 font-bold'
              : 'text-slate-500 hover:text-slate-850 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-white/40 dark:hover:bg-zinc-800/10'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>{t.theoryLessons.split('&')[0]}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('videos')}
          className={`px-4 py-2.5 whitespace-nowrap text-xs font-semibold rounded-lg transition-all duration-150 shrink-0 cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'videos'
              ? 'bg-white dark:bg-zinc-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/50 dark:border-zinc-700/50 font-bold'
              : 'text-slate-500 hover:text-slate-850 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-white/40 dark:hover:bg-zinc-800/10'
          }`}
        >
          <Video className="h-3.5 w-3.5" />
          <span>{t.videos.split(' ')[1]}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('signs')}
          className={`px-4 py-2.5 whitespace-nowrap text-xs font-semibold rounded-lg transition-all duration-150 shrink-0 cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'signs'
              ? 'bg-white dark:bg-zinc-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/50 dark:border-zinc-700/50 font-bold'
              : 'text-slate-500 hover:text-slate-850 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-white/40 dark:hover:bg-zinc-800/10'
          }`}
        >
          <Compass className="h-3.5 w-3.5" />
          <span>{t.roadSigns.split(' ')[1]}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('quiz')}
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
          onClick={() => setActiveSubTab('exam')}
          className={`px-4 py-2.5 whitespace-nowrap text-xs font-semibold rounded-lg transition-all duration-150 shrink-0 cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'exam'
              ? 'bg-white dark:bg-zinc-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/50 dark:border-zinc-700/50 font-bold'
              : 'text-slate-500 hover:text-slate-850 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-white/40 dark:hover:bg-zinc-800/10'
          }`}
        >
          <Award className="h-3.5 w-3.5" />
          <span>{lang === 'ar' ? "الامتحان التجريبي" : lang === 'nl' ? "Proefexamen" : "Mock Exam"}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('progression')}
          className={`px-4 py-2.5 whitespace-nowrap text-xs font-semibold rounded-lg transition-all duration-150 shrink-0 cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'progression'
              ? 'bg-white dark:bg-zinc-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/50 dark:border-zinc-700/50 font-bold'
              : 'text-slate-500 hover:text-slate-850 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-white/40 dark:hover:bg-zinc-800/10'
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          <span>{lang === 'ar' ? "التقدم والتحليل" : lang === 'nl' ? "Mijn Voortgang" : "My Progress"}</span>
        </button>

        <button
          id="coaching-tab-selector"
          onClick={() => setActiveSubTab('coaching')}
          className={`px-4 py-2.5 whitespace-nowrap text-xs font-semibold rounded-lg transition-all duration-150 shrink-0 cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'coaching'
              ? 'bg-white dark:bg-zinc-800 text-slate-950 dark:text-white shadow-xs border border-indigo-500/20 font-bold'
              : 'text-slate-500 hover:text-slate-850 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-white/40 dark:hover:bg-zinc-800/10'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-blue-500" />
          <span>AI Coach</span>
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
                {lang === 'ar' ? 'المكتبة المرجعية الشاملة لقواعد السير الهولندية الأندلس' : lang === 'nl' ? 'Uitgebreide Nederlandse Verkeersregels Bibliotheek (Al-Andalos)' : 'Comprehensive Dutch Traffic Rules Reference Library (Al-Andalos)'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-normal">
              {lang === 'ar' ? 'تصفح المواضيع الرسمية الـ 12 المعتمدة في امتحانات الأندلس مع أرقام المواد القانونية لعام 1990.' : lang === 'nl' ? 'Blader door de 12 officiële examencategorieën volgens het RVV 1990.' : 'Browse the 12 official exam subject categories with real Dutch RVV 1990 legal article references.'}
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
                      Category {selectedLibraryModule.id}
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
              {(['all', 'priority', 'signs', 'speed'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-300'
                  }`}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Theory Cards */}
            <div className="space-y-4">
              {filteredTheory.map(theory => (
                <div key={theory.id} className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="p-1 px-2 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">{theory.category}</span>
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
              <p className="text-xs text-slate-400">Practice tests simulate actual timed theory examinations in the Netherlands.</p>

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
                            : (lang === 'ar' ? 'للأسف، الإجابة غير صحيحة. يرجى مراجعة المادة وقوانين السير لمعرفة القاعدة المرورية المتبعة.' : 'Incorrect entry. Try looking up Dutch state regulations.')
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
                  Confirm Exam Answers
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
          {INSTRUCTIONAL_VIDEOS.map(video => {
            const isPlaying = playingVideoId === video.id;
            return (
              <div key={video.id} className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-xs hover:translate-y-[-1px] transition">
                <div className="relative h-44 w-full bg-slate-100">
                  {isPlaying ? (
                    <iframe
                      src={video.url}
                      className="w-full h-full"
                      allowFullScreen
                      title={video.titleEn}
                    />
                  ) : (
                    <>
                      <img 
                        src={video.thumbnail} 
                        alt={video.titleEn} 
                        className="w-full h-full object-cover brightness-90"
                      />
                      <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                        <button
                          onClick={() => setPlayingVideoId(video.id)}
                          className="p-3.5 bg-blue-600/90 text-white rounded-full hover:scale-105 transition shadow-lg cursor-pointer"
                        >
                          <Play className="h-5 w-5 fill-current ml-0.5" />
                        </button>
                      </div>
                      <span className="absolute bottom-2.5 right-2.5 px-2 py-1 bg-black/60 rounded text-[10px] text-white font-mono font-bold">
                        {video.duration}
                      </span>
                    </>
                  )}
                </div>

                <div className="p-4 space-y-1">
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-2">
                    {lang === 'ar' ? video.titleAr : lang === 'nl' ? video.titleNl : video.titleEn}
                  </h3>
                  <p className="text-[10px] text-slate-400">Instructeur Samir Master Class</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeSubTab === 'signs' && (
        <div id="signs-tab-view" className="space-y-6">
          {/* Header Description */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 p-5 rounded-3xl shadow-xs">
            <h2 className="text-base font-black text-slate-800 dark:text-white">
              {lang === 'ar' ? "دليل شواخص المرور الهولندية - الأندلس" : lang === 'nl' ? "Al-Andalos Verkeersborden Encyclopedie" : "Al-Andalos Traffic Signs Encyclopedia"}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'ar' 
                ? "تصفح وابحث في دليل شواخص المرور الشامل لجميع الفئات السبعة المعتمدة في امتحانات الأندلس."
                : lang === 'nl'
                  ? "Ontdek en zoek in de officiële verkeersborden verdeeld over 7 categorieën inclusief gedetailleerde Al-Andalos examentips."
                  : "Explore and search through the official Dutch road signs divided into 7 core Al-Andalos categories with expert exam study tips."}
            </p>
          </div>

          {/* Search and Category Filters */}
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={lang === 'ar' ? "ابحث عن شاخصة باسمها، رمزها أو كودها (مثال: B1, J16)..." : lang === 'nl' ? "Zoek op bordcode of trefwoord (bijv. E1, parkeren)..." : "Search by sign code or keyword (e.g. A1, speed limit)..."}
                value={signSearchQuery}
                onChange={(e) => setSignSearchQuery(e.target.value)}
                className="w-full pl-11 pr-11 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400"
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

                  {/* Al-Andalos Expert Exam Secret Tips Section */}
                  <div className="p-4 border border-amber-500/20 bg-amber-500/5 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <Award className="h-4.5 w-4.5 shrink-0" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">
                        {lang === 'ar' ? "أسرار ونقاط امتحان الأندلس النظري" : lang === 'nl' ? "Al-Andalos Examen Toppers & Geheimen" : "Al-Andalos Theory Exam Study Secret"}
                      </h4>
                    </div>
                    <div className="text-[11px] leading-relaxed font-normal text-slate-600 dark:text-zinc-300 space-y-2">
                      {getSignDisplayCategory(selectedDetailedSign) === 'danger' && (
                        <p>
                          {lang === 'ar' 
                            ? "⚠️ في امتحانات الأندلس لإدراك المخاطر، عند رؤية شاخصة تحذيرية حمراء (J-series) في منطقة سكنية، تذكر أن الأسبقية دائماً تكون لليمين. ويجب عليك تهيئة قدمك على المكابح أو رفعها عن البنزين ('gas los') تحسباً لأي طارئ." 
                            : lang === 'nl'
                              ? "⚠️ Al-Andalos Examentip: Waarschuwingsborden (J-serie) vereisen direct verhoogde alertheid. Laat in gevaarsherkenningsvragen vaak uw gas los ('gas loslaten') of bereid u voor om te remmen."
                              : "⚠️ Al-Andalos Exam Secret: Warning signs (J-series) demand heightened defensive driving. In hazard perception tests, remember to release the accelerator ('gas loslaten') immediately upon encountering a warning sign."}
                        </p>
                      )}
                      {getSignDisplayCategory(selectedDetailedSign) === 'priority' && (
                        <p>
                          {lang === 'ar'
                            ? "⭐ قاعدة الأولوية: الشاخصة B1 تمنحك الأولوية على التقاطعات القادمة. انتبه لعلامات أسنان القرش ('haaientanden') على الإسفلت، فهي تلزمك بإعطاء الأحقية للمرور العابر لكنها لا تلزمك بالتوقف التام والكامل كشاخصة STOP."
                            : lang === 'nl'
                              ? "⭐ Al-Andalos Examentip: Voorrangswegen (B1) gelden tot het einde-bord. Haaientanden verplichten u voorrang te verlenen, maar u hoeft niet volledig te stoppen als er geen kruisend verkeer is (in tegenstelling tot een STOP-bord)."
                              : "⭐ Al-Andalos Exam Secret: Priority roads (B1) apply until you pass the 'End' sign. Note that 'shark teeth' ('haaientanden') on the asphalt mean you must yield, but do NOT require a complete stop if the intersection is clear."}
                        </p>
                      )}
                      {getSignDisplayCategory(selectedDetailedSign) === 'prohibitory' && (
                        <p>
                          {lang === 'ar'
                            ? "🚫 قواعد المنع: الشواخص المستديرة ذات الإطار الأحمر تحدد المنع. تسري القواعد من موضع الشاخصة تماماً. وإذا كانت الكلمة مكتوبة داخل مربع 'ZONE' فإن المنع ينطبق على الحي بأكمله حتى تظهر شاخصة نهاية المنطقة."
                            : lang === 'nl'
                              ? "🚫 Al-Andalos Examentip: Verbodsborden zijn rond met een rode rand. De regel geldt direct vanaf de positie van het bord, tenzij het om een 'ZONE'-bord gaat, dan geldt het verbod in de hele wijk tot het einde-bord."
                              : "🚫 Al-Andalos Exam Secret: Prohibitory signs are round with a red border. Regulations apply from the exact location of the sign, unless enclosed in a 'ZONE' design, which covers the entire neighborhood."}
                        </p>
                      )}
                      {getSignDisplayCategory(selectedDetailedSign) === 'mandatory' && (
                        <p>
                          {lang === 'ar'
                            ? "🔵 الشواخص الإلزامية: الشواخص الزرقاء الدائرية تلزمك باتجاه سير معين. في امتحان الأندلس، القيادة في اتجاه مخالف لاتجاه السهم أو السير على ممر إلزام لفئات أخرى (مثل ممر الدراجات) تؤدي للرسوب المباشر."
                            : lang === 'nl'
                              ? "🔵 Al-Andalos Examentip: Gebodsborden verplichten een bepaalde rijrichting of weggedeelte. Het negeren van de verplichte rijrichting (pijlen) leidt op het praktijkexamen tot direct zakken."
                              : "🔵 Al-Andalos Exam Secret: Mandatory blue circular signs dictate driving directions. Ignoring a mandatory direction arrow or driving on a closed path (like a dedicated moped track) leads to an instant practical exam fail."}
                        </p>
                      )}
                      {getSignDisplayCategory(selectedDetailedSign) === 'parking' && (
                        <p>
                          {lang === 'ar'
                            ? "🅿️ الوقوف والتوقف: ميز بدقة متناهية بين 'ممنوع ركن السيارات' E1 (يسمح بالتنزيل والتحميل السريع) و'ممنوع التوقف التام' E2 (لا يسمح بالوقوف لثانية واحدة). يركز الامتحان على هذه الجزئية بكثرة."
                            : lang === 'nl'
                              ? "🅿️ Al-Andalos Examentip: Ken het cruciale verschil tussen een parkeerverbod E1 (kort stilstaan voor laden/lossen en in/uitstappen mag) en een stilstandsverbod E2 (absoluut verboden stil te staan, ook niet voor 1 seconde)."
                              : "🅿️ Al-Andalos Exam Secret: Learn the exact difference between No Parking E1 (allows passenger drop/load) and No Stopping E2 (strictly forbidden to halt even for one second). This is a highly tested topic on the rules exam."}
                        </p>
                      )}
                      {getSignDisplayCategory(selectedDetailedSign) === 'highway' && (
                        <p>
                          {lang === 'ar'
                            ? "🛣️ الطرق السريعة: الحد الأدنى للسرعة على الأوتوستراد (Autosnelweg) هو 60 كم/ساعة والحد الأقصى الافتراضي نهاراً هو 100 كم/ساعة بدقة متناهية. تذكر مسافات الأمان وقاعدة الثانيتين دائماً."
                            : lang === 'nl'
                              ? "🛣️ Al-Andalos Examentip: De minimumsnelheid op de autosnelweg G1 is 60 km/u en de standaard maximumsnelheid overdag is 100 km/u. Houd altijd rekening met de 2-secondenregel voor voldoende volgafstand."
                              : "🛣️ Al-Andalos Exam Secret: The minimum speed on motorways (G1) is 60 km/h, and the daytime maximum speed limit is strictly 100 km/h (06:00 - 19:00). Always practice the safe 2-second following distance rule."}
                        </p>
                      )}
                      {getSignDisplayCategory(selectedDetailedSign) === 'information' && (
                        <p>
                          {lang === 'ar'
                            ? "ℹ️ الشواخص الإرشادية: تدلك على مناطق محددة مثل بداية المنطقة السكنية المبنية (Bebouwde kom - H1) التي تحدد السرعة تلقائياً بـ 50 كم/ساعة وتمنح الأحقية للقادمين من اليمين."
                            : lang === 'nl'
                              ? "ℹ️ Al-Andalos Examentip: Informatieborden zoals de bebouwde kom (H1) wijzigen automatisch uw maximumsnelheid naar 50 km/u en herstellen de voorrang van rechts-regels op gelijkwaardige kruispunten."
                              : "ℹ️ Al-Andalos Exam Secret: Informative signs guide boundaries. Entering a built-up area (bebouwde kom - H1) automatically enforces a 50 km/h default speed limit and restores priority from the right on intersections."}
                        </p>
                      )}
                    </div>
                  </div>
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
                  {lang === 'ar' ? "اختبر معلوماتك في شواخص السير الهولندية مع الأندلس بشكل عشوائي وغير محدود." : lang === 'nl' ? "Test je bordenkennis met willekeurige vragen en directe Al-Andalos feedback." : "Train your knowledge of Dutch road signs with infinite random questions."}
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

      {/* FULL TIMED AL-ANDALOS MOCK EXAM SIMULATOR */}
      {activeSubTab === 'exam' && (
        <div id="exam-tab-view" className="space-y-6">
          {/* STAGE 1: NOT STARTED */}
          {!examInProgress && !examCompleted && (
            <div className="p-8 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl shadow-xs text-center max-w-2xl mx-auto space-y-6">
              <div className="h-16 w-16 bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                <Award className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-black text-slate-800 dark:text-white">
                  {lang === 'ar' ? "محاكي امتحان الأندلس النظري المتكامل" : lang === 'nl' ? "Al-Andalos Proefexamen Simulator" : "Al-Andalos Theory Mock Exam Simulator"}
                </h2>
                <p className="text-xs text-slate-400">
                  {lang === 'ar' 
                    ? "يقيس هذا الاختبار جاهزيتك للامتحان الحقيقي بنسبة 100%. ويتضمن 15 سؤالاً تغطي إدراك المخاطر السريع وقواعد المرور والتقاطعات." 
                    : lang === 'nl' 
                      ? "Test je theoriekennis onder tijdsdruk. 15 realistische vragen inclusief 8-seconden gevaarsherkenning." 
                      : "Simulate a real Dutch Al-Andalos theory exam with a timer. 15 questions covering rapid-fire hazard perception, rules, and priority."}
                </p>
              </div>

              {/* Exam Rules/Structure */}
              <div className="grid grid-cols-3 gap-3 text-center border-y border-slate-100 dark:border-zinc-800/80 py-4 text-xs">
                <div className="space-y-1">
                  <p className="text-slate-400 font-bold">{lang === 'ar' ? "الأسئلة" : lang === 'nl' ? "Vragen" : "Questions"}</p>
                  <p className="font-extrabold text-slate-800 dark:text-white">15</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 font-bold">{lang === 'ar' ? "الوقت الإجمالي" : lang === 'nl' ? "Tijd" : "Time"}</p>
                  <p className="font-extrabold text-slate-800 dark:text-white">15 Min</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 font-bold">{lang === 'ar' ? "حد النجاح" : lang === 'nl' ? "Slaaglimiet" : "Pass Limit"}</p>
                  <p className="font-extrabold text-emerald-600 dark:text-emerald-400">12 / 15</p>
                </div>
              </div>

              {/* Warnings */}
              <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-[11px] leading-relaxed text-amber-700 dark:text-amber-400 text-left flex gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  <strong>{lang === 'ar' ? "انتبه لقسم إدراك المخاطر:" : lang === 'nl' ? "Let op gevaarsherkenning:" : "Hazard Perception Alert:"}</strong>{" "}
                  {lang === 'ar'
                    ? "الأسئلة الخمسة الأولى لها عداد ثوانٍ (8 ثوانٍ لكل سؤال) وسينتقل الاختبار تلقائياً بعد الاختيار أو انتهاء الوقت لحماية نظام المحاكاة السريع."
                    : lang === 'nl'
                      ? "Voor de eerste 5 vragen heb je slechts 8 seconden per vraag om een keuze te maken. De test gaat direct door!"
                      : "The first 5 questions have an individual 8-second countdown. Making a selection or letting the timer hit 0 automatically advances."}
                </span>
              </div>

              {/* Interactive Difficulty Selector */}
              <div className="space-y-3 text-left">
                <p className="text-xs font-bold text-slate-700 dark:text-zinc-200 uppercase tracking-wider">
                  {lang === 'ar' ? 'حدد مستوى صعوبة الامتحان:' : lang === 'nl' ? 'Selecteer Proefexamen Niveau:' : 'Select Mock Exam Difficulty:'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Beginner */}
                  <button
                    type="button"
                    onClick={() => setExamDifficulty('beginner')}
                    className={`p-4 rounded-2xl text-left border transition cursor-pointer relative overflow-hidden flex flex-col justify-between h-28 ${
                      examDifficulty === 'beginner'
                        ? 'bg-blue-500/5 border-blue-500 ring-2 ring-blue-500/20 dark:bg-blue-950/20'
                        : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-xs text-slate-800 dark:text-white">
                          {lang === 'ar' ? 'مبتدئ' : lang === 'nl' ? 'Beginner' : 'Beginner'}
                        </span>
                        {examDifficulty === 'beginner' && (
                          <span className="h-2 w-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-normal mt-1 leading-relaxed">
                        {lang === 'ar' ? '15 سؤالاً. بدون عداد ثوانٍ للأسئلة السريعة. مثالي للتعلم.' : lang === 'nl' ? '15 vragen. Geen gevaren timer. Ideaal om te leren.' : '15 questions. No hazard timer. Perfect for learning.'}
                      </p>
                    </div>
                    <span className="text-[9px] font-mono font-bold bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-md w-max mt-2">
                      {lang === 'ar' ? '25 دقيقة' : lang === 'nl' ? '25 min' : '25 mins'}
                    </span>
                  </button>

                  {/* Intermediate */}
                  <button
                    type="button"
                    onClick={() => setExamDifficulty('intermediate')}
                    className={`p-4 rounded-2xl text-left border transition cursor-pointer relative overflow-hidden flex flex-col justify-between h-28 ${
                      examDifficulty === 'intermediate'
                        ? 'bg-amber-500/5 border-amber-500 ring-2 ring-amber-500/20 dark:bg-amber-950/20'
                        : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-xs text-slate-800 dark:text-white">
                          {lang === 'ar' ? 'متوسط' : lang === 'nl' ? 'Gemiddeld' : 'Intermediate'}
                        </span>
                        {examDifficulty === 'intermediate' && (
                          <span className="h-2 w-2 rounded-full bg-amber-500" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-normal mt-1 leading-relaxed">
                        {lang === 'ar' ? '25 سؤالاً. عداد 12 ثانية لإدراك المخاطر.' : lang === 'nl' ? '25 vragen. 12s gevaren timer.' : '25 questions. 12s hazard timer.'}
                      </p>
                    </div>
                    <span className="text-[9px] font-mono font-bold bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-md w-max mt-2">
                      {lang === 'ar' ? '20 دقيقة' : lang === 'nl' ? '20 min' : '20 mins'}
                    </span>
                  </button>

                  {/* Advanced */}
                  <button
                    type="button"
                    onClick={() => setExamDifficulty('advanced')}
                    className={`p-4 rounded-2xl text-left border transition cursor-pointer relative overflow-hidden flex flex-col justify-between h-28 ${
                      examDifficulty === 'advanced'
                        ? 'bg-orange-500/5 border-orange-500 ring-2 ring-orange-500/20 dark:bg-orange-950/20'
                        : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-xs text-slate-800 dark:text-white">
                          {lang === 'ar' ? 'متقدم' : lang === 'nl' ? 'Gevorderd' : 'Advanced'}
                        </span>
                        {examDifficulty === 'advanced' && (
                          <span className="h-2 w-2 rounded-full bg-orange-500" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-normal mt-1 leading-relaxed">
                        {lang === 'ar' ? '40 سؤالاً. عداد 8 ثوانٍ لإدراك المخاطر.' : lang === 'nl' ? '40 vragen. 8s gevaren timer.' : '40 questions. 8s hazard timer.'}
                      </p>
                    </div>
                    <span className="text-[9px] font-mono font-bold bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded-md w-max mt-2">
                      {lang === 'ar' ? '15 دقيقة' : lang === 'nl' ? '15 min' : '15 mins'}
                    </span>
                  </button>

                  {/* Al-Andalos Official Simulation */}
                  <button
                    type="button"
                    onClick={() => setExamDifficulty('cbr')}
                    className={`p-4 rounded-2xl text-left border transition cursor-pointer relative overflow-hidden flex flex-col justify-between h-28 ${
                      examDifficulty === 'cbr'
                        ? 'bg-rose-500/5 border-rose-500 ring-2 ring-rose-500/20 dark:bg-rose-950/20'
                        : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-xs text-slate-800 dark:text-white">
                          {lang === 'ar' ? 'محاكاة الأندلس الرسمية' : lang === 'nl' ? 'Officiële Al-Andalos Simulatie' : 'Official Al-Andalos Simulation'}
                        </span>
                        {examDifficulty === 'cbr' && (
                          <span className="h-2 w-2 rounded-full bg-rose-500" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-normal mt-1 leading-relaxed">
                        {lang === 'ar' ? '65 سؤالاً كاملاً (25 إدراك مخاطر، 12 قواعد، 28 رؤية وإدراك). طقس حقيقي وضغوطات زمنية.' : lang === 'nl' ? '65 vragen (25 gevaar, 12 regels, 28 inzicht). Exacte exameneisen.' : '65 questions (25 hazard, 12 rules, 28 insight). Authentic exam requirements.'}
                      </p>
                    </div>
                    <span className="text-[9px] font-mono font-bold bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded-md w-max mt-2">
                      {lang === 'ar' ? '30 دقيقة' : lang === 'nl' ? '30 min' : '30 mins'}
                    </span>
                  </button>
                </div>
              </div>

              <button
                onClick={handleStartExam}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl text-xs transition shadow-md cursor-pointer"
              >
                {lang === 'ar' ? "بدء الامتحان التجريبي الآن" : lang === 'nl' ? "Start Proefexamen Nu" : "Start Mock Exam Now"}
              </button>
            </div>
          )}

          {/* STAGE 2: IN PROGRESS */}
          {examInProgress && (
            <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
              {/* Exam Header Status Bar */}
              <div className="p-4 bg-slate-50 dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-800 dark:text-white">
                    {lang === 'ar' ? `السؤال ${currentExamQuestionIndex + 1} من ${examQuestions.length}` : lang === 'nl' ? `Vraag ${currentExamQuestionIndex + 1} van ${examQuestions.length}` : `Question ${currentExamQuestionIndex + 1} of ${examQuestions.length}`}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600">
                    {currentExamQuestionIndex < hazardCount 
                      ? (lang === 'ar' ? "إدراك المخاطر" : lang === 'nl' ? "Gevaarsherkenning" : "Hazard Perception")
                      : currentExamQuestionIndex < (hazardCount + rulesCount)
                        ? (lang === 'ar' ? "قوانين السير" : lang === 'nl' ? "Verkeersregels" : "Traffic Rules")
                        : (lang === 'ar' ? "أولوية وشواخص" : lang === 'nl' ? "Voorrang & Borden" : "Priority & Signs")
                    }
                  </span>
                </div>

                {/* Main countdown timer */}
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{lang === 'ar' ? "الوقت المتبقي" : lang === 'nl' ? "Tijd over" : "Time Left"}</p>
                    <p className="font-mono text-xs font-extrabold text-slate-800 dark:text-white">
                      {Math.floor(examTimeLeft / 60)}:{(examTimeLeft % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Hazard Perception glowing progress bar */}
              {currentExamQuestionIndex < hazardCount && hazardTimer !== null && hazardTimerLimit !== null && (
                <div className="h-1 bg-slate-100 dark:bg-zinc-950 relative overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      hazardTimer > (hazardTimerLimit / 2)
                        ? 'bg-emerald-500'
                        : hazardTimer > 2
                          ? 'bg-amber-500 animate-pulse'
                          : 'bg-red-500 animate-ping'
                    }`}
                    style={{ width: `${(hazardTimer / hazardTimerLimit) * 100}%` }}
                  ></div>
                </div>
              )}

              {/* Question Body */}
              <div className="p-6 space-y-6">
                {/* ticking notice for hazard perception */}
                {currentExamQuestionIndex < hazardCount && hazardTimer !== null && hazardTimerLimit !== null && (
                  <div className="flex justify-between items-center text-xs p-3 bg-red-500/5 border border-red-500/10 rounded-2xl">
                    <span className="text-red-500 font-extrabold flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>{lang === 'ar' ? "عداد الثواني السريع نشط!" : lang === 'nl' ? "Snelle gevaarsherkenning teller actief!" : "Rapid hazard perception countdown active!"}</span>
                    </span>
                    <span className="font-mono bg-red-500 text-white font-black px-2.5 py-0.5 rounded-full text-xs">
                      {hazardTimer}s
                    </span>
                  </div>
                )}

                {/* Real-life traffic scene image and/or vector traffic signs in a responsive adaptive grid */}
                {(examQuestions[currentExamQuestionIndex]?.image || examQuestions[currentExamQuestionIndex]?.signCode) && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Traffic scene photo */}
                    {examQuestions[currentExamQuestionIndex]?.image && (
                      <div className={`rounded-3xl overflow-hidden border border-slate-100 dark:border-zinc-800/60 shadow-inner relative min-h-[220px] ${
                        examQuestions[currentExamQuestionIndex]?.signCode ? 'md:col-span-8 h-56 md:h-72' : 'md:col-span-12 h-60 md:h-72'
                      }`}>
                        <DrivingSceneDisplay 
                          questionId={examQuestions[currentExamQuestionIndex]?.originalId ?? examQuestions[currentExamQuestionIndex]?.id} 
                          lang={lang} 
                        />
                      </div>
                    )}

                    {/* Dutch vector traffic sign */}
                    {examQuestions[currentExamQuestionIndex]?.signCode && (
                      <div className={`flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-zinc-950 rounded-3xl border border-slate-100 dark:border-zinc-800/60 shadow-xs animate-fade-in min-h-[160px] ${
                        examQuestions[currentExamQuestionIndex]?.image ? 'md:col-span-4 h-56 md:h-72' : 'md:col-span-12 h-48'
                      }`}>
                        <TrafficSignDisplay sign={{ code: examQuestions[currentExamQuestionIndex].signCode }} size="xl" />
                        <span className="font-mono text-[9px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full uppercase mt-2 select-none">
                          Bord {examQuestions[currentExamQuestionIndex].signCode}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Prompt Text */}
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white leading-relaxed">
                  {lang === 'ar' 
                    ? examQuestions[currentExamQuestionIndex]?.titleAr 
                    : lang === 'nl' 
                      ? examQuestions[currentExamQuestionIndex]?.titleNl 
                      : examQuestions[currentExamQuestionIndex]?.titleEn}
                </h3>

                {/* Option Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  {(lang === 'ar' 
                    ? examQuestions[currentExamQuestionIndex]?.optionsAr 
                    : lang === 'nl' 
                      ? examQuestions[currentExamQuestionIndex]?.optionsNl 
                      : examQuestions[currentExamQuestionIndex]?.optionsEn || []).map((opt, i) => {
                    const isSelected = examAnswers[currentExamQuestionIndex] === i;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectExamAnswer(i)}
                        className={`p-4 rounded-2xl text-xs font-bold border transition duration-150 flex items-center justify-center text-center cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:border-blue-400'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Footer for non-hazard (or non-timed hazard) questions */}
              {((hazardTimerLimit === null) || (currentExamQuestionIndex >= hazardCount)) && (
                <div className="p-4 bg-slate-50 dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-800/80 flex justify-between items-center">
                  <button
                    onClick={() => setCurrentExamQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentExamQuestionIndex === 0 || (hazardTimerLimit !== null && currentExamQuestionIndex === hazardCount)}
                    className="px-4 py-2.5 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-900 disabled:opacity-50 transition cursor-pointer"
                  >
                    {lang === 'ar' ? "السابق" : lang === 'nl' ? "Vorige" : "Back"}
                  </button>

                  {currentExamQuestionIndex < examQuestions.length - 1 ? (
                    <button
                      onClick={() => {
                        if (examAnswers[currentExamQuestionIndex] === undefined) {
                          setExamAnswers(prev => ({ ...prev, [currentExamQuestionIndex]: -1 }));
                        }
                        setCurrentExamQuestionIndex(prev => prev + 1);
                      }}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      {lang === 'ar' ? "التالي" : lang === 'nl' ? "Volgende" : "Next"}
                    </button>
                  ) : (
                    <button
                      onClick={handleFinishExam}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition shadow-md cursor-pointer"
                    >
                      {lang === 'ar' ? "إنهاء وتقديم الامتحان" : lang === 'nl' ? "Beëindig Examen" : "Finish & Submit Exam"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STAGE 3: EXAM COMPLETED / RESULTS */}
          {examCompleted && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Scorecard Summary Card */}
              {(() => {
                let correctCount = 0;
                let hazardCorrect = 0;
                let rulesCorrect = 0;
                let signsCorrect = 0;

                examQuestions.forEach((q, idx) => {
                  const userAnswer = examAnswers[idx];
                  if (userAnswer === q.correct) {
                    correctCount++;
                    if (q.type === 'hazard') hazardCorrect++;
                    else if (q.type === 'rules') rulesCorrect++;
                    else if (q.type === 'signs') signsCorrect++;
                  }
                });

                const isPassed = examDifficulty === 'beginner'
                  ? correctCount >= 12
                  : examDifficulty === 'intermediate'
                    ? correctCount >= 20
                    : examDifficulty === 'advanced'
                      ? correctCount >= 32
                      : (hazardCorrect >= 13 && rulesCorrect >= 10 && signsCorrect >= 25);

                return (
                  <>
                    <div className="p-8 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl shadow-xs text-center space-y-6">
                      <div className="space-y-2">
                        <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-inner ${
                          isPassed
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-600 border border-red-500/20'
                        }`}>
                          {isPassed 
                            ? (lang === 'ar' ? "تهانينا! لقد نجحت" : lang === 'nl' ? "Gefeliciteerd! Geslaagd" : "Congratulations! Passed")
                            : (lang === 'ar' ? "للأسف، لم تنجح" : lang === 'nl' ? "Gezakt. Probeer opnieuw" : "Failed. Try Again")
                          }
                        </span>
                        <h2 className="text-3xl font-black text-slate-800 dark:text-white">
                          {correctCount} / {examQuestions.length}
                        </h2>
                        <p className="text-xs text-slate-400">
                          {lang === 'ar' ? "النتيجة النهائية للمحاكاة الرسمية" : lang === 'nl' ? "Eindresultaat van uw theorie proefexamen" : "Official simulation scorecard results"}
                        </p>
                      </div>

                      {/* Section breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/50 rounded-2xl space-y-1">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{lang === 'ar' ? "إدراك المخاطر" : lang === 'nl' ? "Gevaarsherkenning" : "Hazard Perception"}</p>
                          <p className="font-extrabold text-xs text-slate-800 dark:text-white">{hazardCorrect} / {hazardCount}</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/50 rounded-2xl space-y-1">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{lang === 'ar' ? "قوانين السير" : lang === 'nl' ? "Verkeersregels" : "Traffic Rules"}</p>
                          <p className="font-extrabold text-xs text-slate-800 dark:text-white">{rulesCorrect} / {rulesCount}</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/50 rounded-2xl space-y-1">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{lang === 'ar' ? "التقاطعات والشواخص" : lang === 'nl' ? "Voorrang & Borden" : "Priority & Signs"}</p>
                          <p className="font-extrabold text-xs text-slate-800 dark:text-white">{signsCorrect} / {signsCount}</p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={handleStartExam}
                          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black shadow-md transition cursor-pointer"
                        >
                          {lang === 'ar' ? "إعادة المحاكاة بامتحان جديد" : lang === 'nl' ? "Herstart Proefexamen" : "Restart New Simulated Exam"}
                        </button>
                      </div>
                    </div>

                    {/* Scorecard Detailed Question Review */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-slate-800 dark:text-white px-1">
                        {lang === 'ar' ? "مراجعة تفصيلية للأخطاء والإجابات" : lang === 'nl' ? "Gedetailleerde Foutenanalyse" : "Detailed Error & Response Analysis"}
                      </h3>

                      <div className="space-y-4">
                        {examQuestions.map((q, idx) => {
                          const userAnswer = examAnswers[idx];
                          const isCorrect = userAnswer === q.correct;

                          return (
                            <div
                              key={q.id}
                              className={`p-5 bg-white dark:bg-zinc-900 border rounded-3xl shadow-xs space-y-3 ${
                                isCorrect
                                  ? 'border-emerald-500/15 bg-emerald-500/[0.01]'
                                  : 'border-red-500/15 bg-red-500/[0.01]'
                              }`}
                            >
                              {/* Header question detail */}
                              <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1 flex-1">
                                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-zinc-950 px-2 py-0.5 rounded">
                                    Q{idx + 1} — {q.type.toUpperCase()}
                                  </span>
                                  <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-relaxed">
                                    {lang === 'ar' ? q.titleAr : lang === 'nl' ? q.titleNl : q.titleEn}
                                  </h4>
                                </div>
                                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full shrink-0 ${
                                  isCorrect
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                                }`}>
                                  {isCorrect ? (lang === 'ar' ? "صحيحة" : lang === 'nl' ? "Correct" : "Correct") : (lang === 'ar' ? "خاطئة" : lang === 'nl' ? "Fout" : "Incorrect")}
                                </span>
                              </div>

                              {/* Visual Cue (Image and/or Vector Sign) for Scorecard Review */}
                              {(q.image || q.signCode) && (
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                  {q.image && (
                                    <div className={`h-48 md:h-56 bg-slate-50 dark:bg-zinc-950 rounded-2xl overflow-hidden border border-slate-100 dark:border-zinc-800/60 shadow-inner ${
                                      q.signCode ? 'md:col-span-8' : 'md:col-span-12'
                                    }`}>
                                      <DrivingSceneDisplay 
                                        questionId={q.originalId ?? q.id} 
                                        lang={lang} 
                                      />
                                    </div>
                                  )}
                                  {q.signCode && (
                                    <div className={`flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800/60 shadow-xs ${
                                      q.image ? 'md:col-span-4' : 'md:col-span-12'
                                    }`}>
                                      <TrafficSignDisplay sign={{ code: q.signCode }} size="lg" />
                                      <span className="font-mono text-[9px] text-blue-500 font-extrabold mt-1 select-none">Bord {q.signCode}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Answer display compared */}
                              <div className="text-[11px] space-y-1 bg-slate-50 dark:bg-zinc-950 p-3 rounded-2xl border border-slate-100/50 dark:border-zinc-800/80">
                                <p className="text-slate-500">
                                  <strong>{lang === 'ar' ? "إجابتك:" : lang === 'nl' ? "Uw antwoord:" : "Your Answer:"}</strong>{" "}
                                  <span className={isCorrect ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-red-500 font-bold'}>
                                    {userAnswer !== undefined && userAnswer !== -1
                                      ? (lang === 'ar' ? q.optionsAr[userAnswer] : lang === 'nl' ? q.optionsNl[userAnswer] : q.optionsEn[userAnswer])
                                      : (lang === 'ar' ? "لم تتم الإجابة (انتهى الوقت)" : lang === 'nl' ? "Niet beantwoord (tijd om)" : "Unanswered (Time out)")
                                    }
                                  </span>
                                </p>
                                {!isCorrect && (
                                  <p className="text-slate-500">
                                    <strong>{lang === 'ar' ? "الإجابة الصحيحة:" : lang === 'nl' ? "Correcte antwoord:" : "Correct Answer:"}</strong>{" "}
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                      {lang === 'ar' ? q.optionsAr[q.correct] : lang === 'nl' ? q.optionsNl[q.correct] : q.optionsEn[q.correct]}
                                    </span>
                                  </p>
                                )}
                              </div>

                              {/* Educational explanation detail */}
                              <div className="flex gap-2 p-3 bg-blue-500/5 border border-blue-500/10 rounded-2xl text-[11px] leading-relaxed">
                                <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                  <p className="font-extrabold text-blue-600 dark:text-blue-400">{lang === 'ar' ? "التعليل المروري والقانوني:" : lang === 'nl' ? "Verkeersrechtelijke uitleg:" : "Traffic Regulation Rule:"}</p>
                                  <p className="text-slate-600 dark:text-zinc-300 font-medium">
                                    {lang === 'ar' ? q.descriptionAr : lang === 'nl' ? q.descriptionNl : q.descriptionEn}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'progression' && (
        <div className="space-y-6 animate-fade-in animate-duration-300" id="student-progression-view">
          {/* Header Dashboard Banner */}
          <div className="p-6 bg-gradient-to-r from-blue-900 via-indigo-950 to-zinc-950 text-white rounded-3xl shadow-md relative overflow-hidden border border-indigo-500/10">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-1/4 translate-x-1/4 scale-150">
              <TrendingUp className="h-96 w-96 text-white animate-pulse" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="text-[10px] uppercase tracking-wider bg-blue-500/30 text-blue-200 px-3 py-1 rounded-full font-black">
                  {lang === 'nl' ? "PRESTATIE DIAGNOSTIEK" : lang === 'ar' ? "التشخيص والأداء" : "PERFORMANCE DIAGNOSTICS"}
                </span>
                <h2 className="text-2xl font-black mt-2 leading-tight">
                  {lang === 'nl' ? "Uw Al-Andalos Theorie Snelheid & Kwaliteit" : lang === 'ar' ? "أدائك وجاهزيتك للامتحان الرسمي" : "Your Al-Andalos Exam Analytics"}
                </h2>
                <p className="text-xs text-blue-200/80 mt-1 max-w-lg">
                  {lang === 'nl' ? "Gedetailleerde analyse op basis van uw proefexamens. Identificeer uw zwakke punten en bereid u feilloos voor." : lang === 'ar' ? "تحليل دقيق لأدائك بناءً على نتائج الاختبارات التجريبية لمساعدتك في رصد مواطن الضعف والاستعداد التام." : "Detailed analytics based on your exam history. Identify weak topics and perfect your knowledge."}
                </p>
              </div>

              {/* Quick Metrics Circular Ring */}
              <div className="flex gap-4 shrink-0">
                <div className="bg-white/10 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/10 text-center min-w-[100px]">
                  <span className="text-xs text-blue-200 block">{lang === 'nl' ? "Examens" : "Exams"}</span>
                  <span className="text-2xl font-black mt-1 block">{examHistory.length}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/10 text-center min-w-[100px]">
                  <span className="text-xs text-blue-200 block">{lang === 'nl' ? "Slaagkans" : "Pass Rate"}</span>
                  <span className="text-2xl font-black mt-1 block text-green-400">
                    {examHistory.length > 0 
                      ? `${Math.round((examHistory.filter(h => h.isPassed).length / examHistory.length) * 100)}%`
                      : "0%"
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Grid: Left Column for Diagnostics, Right Column for Recommendations & Signs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Columns: Detailed Score Breakdown & Past History */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Category Mastery */}
              <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-xs">
                <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span>{lang === 'nl' ? "Prestaties per Al-Andalos Categorie" : lang === 'ar' ? "الأداء حسب فئات الامتحان" : "Al-Andalos Category Mastery"}</span>
                </h3>

                {(() => {
                  // Calculate average accuracy for each type: hazard, rules, signs
                  let totalH = 0, correctH = 0;
                  let totalR = 0, correctR = 0;
                  let totalS = 0, correctS = 0;

                  examHistory.forEach(h => {
                    totalH += h.hazardTotal || 0;
                    correctH += h.hazardCorrect || 0;
                    totalR += h.rulesTotal || 0;
                    correctR += h.rulesCorrect || 0;
                    totalS += h.signsTotal || 0;
                    correctS += h.signsCorrect || 0;
                  });

                  const hPct = totalH > 0 ? Math.round((correctH / totalH) * 100) : 75;
                  const rPct = totalR > 0 ? Math.round((correctR / totalR) * 100) : 60;
                  const sPct = totalS > 0 ? Math.round((correctS / totalS) * 100) : 65;

                  const categories = [
                    {
                      name: lang === 'nl' ? "Gevaarsherkenning (Hazard Perception)" : "Hazard Perception",
                      pct: hPct,
                      desc: lang === 'nl' ? "Reactiesnelheid & besluitvorming (remmen, gas los, niets doen)" : "Braking, releasing gas, or doing nothing in 8 seconds.",
                      minPass: 52, // 13 out of 25 is 52%
                      color: hPct >= 70 ? 'bg-green-500' : hPct >= 52 ? 'bg-amber-500' : 'bg-red-500'
                    },
                    {
                      name: lang === 'nl' ? "Kennis & Verkeersregels" : "Traffic Rules & Knowledge",
                      pct: rPct,
                      desc: lang === 'nl' ? "RVV regels, snelheden, inhalen, parkeren en milieuzones" : "Speed limits, overtaking, parking, and environmental zones.",
                      minPass: 83, // 10 out of 12 is 83%
                      color: rPct >= 83 ? 'bg-green-500' : rPct >= 70 ? 'bg-amber-500' : 'bg-red-500'
                    },
                    {
                      name: lang === 'nl' ? "Inzicht & Verkeersborden" : "Priority, Intersections & Signs",
                      pct: sPct,
                      desc: lang === 'nl' ? "Voorrangsituaties, rotondes, haaientanden en alle RVV borden" : "Right of way, roundabouts, and all Dutch traffic signs.",
                      minPass: 89, // 25 out of 28 is 89%
                      color: sPct >= 89 ? 'bg-green-500' : sPct >= 75 ? 'bg-amber-500' : 'bg-red-500'
                    }
                  ];

                  return (
                    <div className="space-y-6">
                      {categories.map((cat, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between items-end">
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">{cat.name}</h4>
                              <p className="text-[10px] text-slate-400 dark:text-zinc-500">{cat.desc}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-slate-800 dark:text-white">{cat.pct}%</span>
                              <span className="text-[9px] block text-slate-400 dark:text-zinc-500">
                                {lang === 'nl' ? `Min. vereist: ${cat.minPass}%` : `Required: ${cat.minPass}%`}
                              </span>
                            </div>
                          </div>
                          
                          <div className="w-full h-2.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className={`h-full ${cat.color} rounded-full transition-all duration-500`} style={{ width: `${cat.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* History Timeline */}
              <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-xs">
                <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-indigo-500" />
                  <span>{lang === 'nl' ? "Recente Examenpogingen" : lang === 'ar' ? "سجل الامتحانات الأخيرة" : "Recent Exam Attempts"}</span>
                </h3>

                <div className="space-y-3">
                  {examHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-xs text-slate-400">{lang === 'nl' ? "Nog geen examenpogingen voltooid." : "No exam attempts registered yet."}</p>
                    </div>
                  ) : (
                    examHistory.map((h, i) => (
                      <div key={i} className="p-4 bg-slate-50 dark:bg-zinc-950/40 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                              {h.difficulty === 'cbr' ? "Official Al-Andalos simulation" : `${h.difficulty.charAt(0).toUpperCase()}${h.difficulty.slice(1)} Exam`}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500">{h.timestamp}</span>
                          </div>
                          <div className="flex gap-4 text-[10px] text-slate-400 dark:text-zinc-500">
                            <span>{lang === 'nl' ? `Gevaar: ${h.hazardCorrect}/${h.hazardTotal}` : `Hazard: ${h.hazardCorrect}/${h.hazardTotal}`}</span>
                            <span>{lang === 'nl' ? `Regels: ${h.rulesCorrect}/${h.rulesTotal}` : `Rules: ${h.rulesCorrect}/${h.rulesTotal}`}</span>
                            <span>{lang === 'nl' ? `Borden: ${h.signsCorrect}/${h.signsTotal}` : `Signs: ${h.signsCorrect}/${h.signsTotal}`}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <div className="text-right">
                            <span className="text-sm font-black text-slate-800 dark:text-white block">{h.score} / {h.total}</span>
                            <span className="text-[9px] text-slate-400 dark:text-zinc-500">
                              {Math.round((h.score / h.total) * 100)}%
                            </span>
                          </div>

                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            h.isPassed 
                              ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' 
                              : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                          }`}>
                            {h.isPassed ? (lang === 'nl' ? "GESLAAGD" : "PASSED") : (lang === 'nl' ? "GEZAKT" : "FAILED")}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Right Column: Tailored Recommendations & Specific Signs to Practice */}
            <div className="space-y-6">
              
              {/* Weak Area & Study Recommendations */}
              <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-xs">
                <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 mb-3">
                  <Bookmark className="h-4 w-4 text-amber-500" />
                  <span>{lang === 'nl' ? "Zwakke Punten & Aanbevelingen" : "Tailored Recommendations"}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mb-4">
                  {lang === 'nl' ? "Tackle deze onderwerpen direct in onze theoriebibliotheek om uw slagingspercentage te verhogen." : "Review these specific chapters to optimize your exam readiness."}
                </p>

                {(() => {
                  // Aggregate all weak topics from history
                  const allWeakTopics: string[] = [];
                  examHistory.forEach(h => {
                    if (h.weakTopics && h.weakTopics.length > 0) {
                      allWeakTopics.push(...h.weakTopics);
                    }
                  });

                  // Deduplicate and fallback
                  const uniqueWeak = Array.from(new Set(allWeakTopics));
                  const topicsToRecommend = uniqueWeak.length > 0 ? uniqueWeak : ['Priority & Right-of-Way', 'Roundabout Mastery', 'Highway & Motorway Driving'];

                  return (
                    <div className="space-y-3">
                      {topicsToRecommend.map((topicName, idx) => {
                        // Find matching library module
                        const module = DRIVING_LIBRARY.find(m => m.titleEn === topicName || m.titleNl === topicName);
                        if (!module) return null;

                        return (
                          <div 
                            key={idx} 
                            onClick={() => {
                              setSelectedLibraryModule(module);
                              setActiveSubTab('theory');
                            }}
                            className="p-3 bg-linear-to-r from-slate-50 to-slate-100/50 dark:from-zinc-950/30 dark:to-zinc-950/10 rounded-2xl border border-slate-100 dark:border-zinc-800/80 cursor-pointer hover:border-blue-300 dark:hover:border-blue-900/50 transition duration-150 flex items-center justify-between group"
                          >
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-extrabold block">
                                {module.rvvReference}
                              </span>
                              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                {lang === 'nl' ? module.titleNl : lang === 'ar' ? module.titleAr : module.titleEn}
                              </span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Signs to Study / Practice */}
              <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-xs">
                <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 mb-2">
                  <Compass className="h-4 w-4 text-red-500" />
                  <span>{lang === 'nl' ? "Aanbevolen Verkeersborden" : "Recommended Traffic Signs"}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mb-4">
                  {lang === 'nl' ? "U heeft onlangs fouten gemaakt bij vragen over deze specifieke borden:" : "You recently missed questions relating to these critical signs:"}
                </p>

                {(() => {
                  // Aggregate suggested signs
                  const allSuggestedSigns: string[] = [];
                  examHistory.forEach(h => {
                    if (h.suggestedSigns && h.suggestedSigns.length > 0) {
                      allSuggestedSigns.push(...h.suggestedSigns);
                    }
                  });

                  // Deduplicate and fallback
                  const uniqueSigns = Array.from(new Set(allSuggestedSigns));
                  const signsToDisplay = uniqueSigns.length > 0 ? uniqueSigns.slice(0, 3) : ['B6', 'C15', 'J22'];

                  return (
                    <div className="space-y-3">
                      {signsToDisplay.map((code, idx) => {
                        const signObj = ROAD_SIGNS.find(s => s.code === code);
                        if (!signObj) return null;

                        return (
                          <div 
                            key={idx}
                            onClick={() => {
                              setSelectedDetailedSign(signObj);
                              setActiveSubTab('signs');
                            }}
                            className="p-3 bg-slate-50 dark:bg-zinc-950/30 rounded-2xl border border-slate-100 dark:border-zinc-800/50 flex items-center gap-3 cursor-pointer hover:border-red-300 dark:hover:border-red-900/40 transition"
                          >
                            <TrafficSignDisplay sign={signObj} size="sm" />
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-black text-red-600 dark:text-red-400 font-mono block">{signObj.code}</span>
                              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 line-clamp-1">
                                {lang === 'nl' ? signObj.nameNl : lang === 'ar' ? signObj.nameAr : signObj.nameEn}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-zinc-500 line-clamp-1 block">
                                {lang === 'nl' ? signObj.descriptionNl : lang === 'ar' ? signObj.descriptionAr : signObj.descriptionEn}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

            </div>

          </div>
        </div>
      )}

      {activeSubTab === 'coaching' && (
        <div id="coaching-chatbot-view" className="p-1 bg-linear-to-b from-indigo-500/10 to-blue-500/10 rounded-3xl border border-indigo-500/10 shadow-lg">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden flex flex-col h-[520px]">
            {/* Header */}
            <div className="p-4 bg-linear-to-r from-indigo-900 to-blue-950 text-white flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-xl relative">
                  <Sparkles className="h-5 w-5 text-indigo-400" />
                  <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                </div>
                <div>
                  <h3 className="text-sm font-bold">Al-Andalos AI Co-Pilot</h3>
                  <p className="text-[10px] text-emerald-400 font-semibold">Al-Andalos regulations & IBKI exam engine</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-1 bg-white/10 rounded-full">v2.4 LTS</span>
            </div>

            {/* Warning about real-time capabilities */}
            <div className="bg-blue-50/50 dark:bg-blue-950/20 px-4 py-2 text-[10px] text-slate-400 text-center border-b border-slate-100 dark:border-zinc-900 flex items-center justify-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0"></span>
              <span>Ask questions like "Who has priority at an equivalent roundabout?"</span>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {messages.map(msg => {
                const isAI = msg.sender === 'ai';
                return (
                  <div key={msg.id} className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed space-y-1 ${
                      isAI
                        ? 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 rounded-tl-none'
                        : 'bg-indigo-600 text-white rounded-tr-none shadow-md font-medium'
                    }`}>
                      <p>{msg.text}</p>
                      <span className={`block text-[8px] text-right mt-1.5 opacity-60 ${isAI ? 'text-slate-500' : 'text-slate-100'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3.5 bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <span className="h-2.5 w-2.5 bg-blue-500 rounded-full animate-bounce shrink-0" style={{ animationDelay: '0ms' }}></span>
                    <span className="h-2.5 w-2.5 bg-blue-500 rounded-full animate-bounce shrink-0" style={{ animationDelay: '150ms' }}></span>
                    <span className="h-2.5 w-2.5 bg-blue-500 rounded-full animate-bounce shrink-0" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
              
              <div ref={chatBottomRef}></div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 bg-slate-50 dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-900 flex gap-2">
              <input
                type="text"
                placeholder={t.aiPlaceholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 px-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
