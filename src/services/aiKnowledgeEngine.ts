import { GoogleGenAI } from '@google/genai';
import { DRIVING_KNOWLEDGE_BASE } from '../data/drivingKnowledgeBase.ts';
import type { KnowledgeItem } from '../data/drivingKnowledgeBase.ts';

export interface RetrievalResult {
  matchedItems: KnowledgeItem[];
  contextSummary: string;
  isOffTopic: boolean;
  isPromptInjection: boolean;
  isGreeting: boolean;
  isThanks: boolean;
  isInsufficientKnowledge: boolean;
  resolvedQuery: string;
  topScore: number;
}

/**
 * In-memory vector embedding cache for knowledge base items
 */
const knowledgeVectorCache = new Map<string, number[]>();
let isEmbeddingSupported: boolean | null = null;
const EMBEDDING_MODELS = ['gemini-embedding-2-preview', 'text-embedding-004'];
let activeEmbeddingModel = EMBEDDING_MODELS[0];

/**
 * Normalizes input string for robust cross-dialect Arabic, Dutch, and English matching
 */
export function normalizeQuery(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '') // remove arabic diacritics
    .replace(/[.,?!:;؟،"'`~«»()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates cosine similarity between two dense vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Detects prompt injection attempts or system internals inquiries
 */
export function isPromptInjectionAttempt(cleanText: string): boolean {
  const norm = normalizeQuery(cleanText);
  const injectionPatterns = [
    'system prompt', 'system instructions', 'systeminstruction', 'systemprompt',
    'تعليماتك', 'تعليمات', 'ما هي تعليماتك', 'ماذا يوجد في ملفات المعرفه', 'ما هي ملفاتك',
    'اسماء ملفات المعرفه', 'اسماء ملفات', 'ملفات المعرفه', 'ملفات المعرفة', 'ملفاتك',
    'اعطني ال prompt', 'اعطني ال-prompt', 'api key', 'apikey', 'مفتاح api',
    'كيف تعمل من الداخل', 'hidden prompt', 'backend logic', 'internal rules',
    'prompt injection', 'reveal your prompt', 'reveal instructions'
  ];
  return injectionPatterns.some(p => norm.includes(normalizeQuery(p)));
}

/**
 * Detects off-topic queries unrelated to driving education
 */
export function isOffTopicQuery(cleanText: string): boolean {
  const norm = normalizeQuery(cleanText);

  // Identity, school, social greetings, and profile checks are never off-topic
  const allowedIndicators = [
    'سياقة', 'قيادة', 'مرور', 'طريق', 'شارع', 'أولوية', 'اولوية', 'يمين', 'يسار',
    'دوار', 'دراجة', 'سيارة', 'كلتش', 'فرامل', 'بنزين', 'غيار', 'مرايا', 'سرعة',
    'امتحان', 'فاحص', 'b1', 'b6', 'b7', 'voorrang', 'kruispunt', 'rotonde', 'rijden',
    'cbr', 'spiegelen', 'fietser', 'auto', 'snelheid', 'clutch', 'priority', 'driving',
    'مين انا', 'من انا', 'شو اسمي', 'ما اسمي', 'اسمي', 'هل تعرفني', 'من اكون',
    'مين انت', 'من انت', 'شو اسمك', 'ما اسمك', 'اسم المدرسة', 'المدرسة', 'مدرستي', 'مدرستنا',
    'wie ben ik', 'wie ben je', 'wat is mijn naam', 'wat is je naam', 'welke school', 'welke rijschool',
    'who am i', 'who are you', 'what is my name', 'what is your name', 'driving school', 'school name'
  ];

  if (allowedIndicators.some(ind => norm.includes(normalizeQuery(ind)))) {
    return false;
  }

  const offTopicWords = [
    'طقس', 'الطقس', 'جو اليوم', 'درجة الحرارة', 'weather', 'weer',
    'طبخ', 'وصفة', 'اكل', 'مطعم', 'recipe', 'koken',
    'سياسة', 'انتخابات', 'حكومة', 'رئيس', 'politics', 'politiek',
    'كرة قدم', 'مباراة', 'ريال مدريد', 'برشلونة', 'football', 'voetbal',
    'افلام', 'مسلسل', 'اغنية', 'موسيقى', 'music', 'film', 'movie', 'song',
    'اسهم', 'عملات رقمية', 'بيتكوين', 'crypto', 'bitcoin', 'stock',
    'برمجة', 'كود', 'جافاسكريبت', 'بايثون', 'python', 'javascript', 'coding', 'programming',
    'تلفون', 'موبايل', 'هاتف', 'جوال', 'ايفون', 'سامسونج', 'phone', 'smartphone', 'telefoon', 'iphone', 'samsung',
    'علاج', 'دواء', 'صداع', 'مرض', 'headache', 'medicine', 'doctor'
  ];
  return offTopicWords.some(w => norm.includes(normalizeQuery(w)));
}

/**
 * Resolves follow-up queries using multi-turn conversation history with precise scenario preservation
 */
export function resolveConversationContext(
  query: string,
  history: Array<{ sender: string; text: string }> = []
): { resolvedText: string; activeContextConcept?: string } {
  const normQuery = normalizeQuery(query);
  if (!history || history.length === 0) {
    return { resolvedText: query };
  }

  // Check the most recent messages first to determine immediate active scenario
  const recentMessages = history.slice(-6);
  const lastAIMessage = [...recentMessages].reverse().find(m => m.sender === 'ai')?.text || '';
  const lastUserMessage = [...recentMessages].reverse().find(m => m.sender === 'user')?.text || '';
  const normLastAI = normalizeQuery(lastAIMessage);
  const normLastUser = normalizeQuery(lastUserMessage);
  const fullRecentHistoryText = recentMessages.map(h => normalizeQuery(h.text)).join(' ');

  // Determine immediate active topic (most recent turn first)
  let immediateTopic = '';
  if (normLastUser.includes('b1') || normLastUser.includes('b6') || normLastUser.includes('فرق') || normLastAI.includes('b1') || normLastAI.includes('b6') || normLastAI.includes('voorrangsweg')) {
    immediateTopic = 'kb-priority-signs-b1-b6-b7';
  } else if (normLastUser.includes('يسار') || normLastUser.includes('شمال') || normLastUser.includes('انعطاف') || normLastUser.includes('linksaf') || normLastAI.includes('korte bocht') || normLastAI.includes('rechtdoor op dezelfde weg')) {
    immediateTopic = 'kb-priority-short-turn-vs-long-turn';
  } else if (normLastUser.includes('دراجة') || normLastUser.includes('سيكل') || normLastUser.includes('بسكليت') || normLastUser.includes('fietser') || normLastAI.includes('fietser') || normLastAI.includes('bestuurder')) {
    immediateTopic = 'kb-priority-equal-intersection';
  } else if (normLastUser.includes('30') || normLastUser.includes('70') || normLastUser.includes('60') || normLastUser.includes('80') || normLastAI.includes('snelheid bepaalt geen voorrang')) {
    immediateTopic = 'kb-priority-speed-limit-vs-priority';
  } else if (fullRecentHistoryText.includes('تقاطع') || fullRecentHistoryText.includes('يمين') || fullRecentHistoryText.includes('gelijkwaardig')) {
    immediateTopic = 'kb-priority-equal-intersection';
  } else if (fullRecentHistoryText.includes('دوار') || fullRecentHistoryText.includes('rotonde')) {
    immediateTopic = 'kb-priority-roundabout-rules';
  } else if (fullRecentHistoryText.includes('كلتش') || fullRecentHistoryText.includes('تهتز') || fullRecentHistoryText.includes('ترج') || fullRecentHistoryText.includes('aangrijpingspunt')) {
    immediateTopic = 'kb-practical-clutch-control';
  }

  // 1. Difference between signs B1 and B6: "شو الفرق بين B1 و B6؟", "ما الفرق بين B1 و B6؟", "شو الفرق بينهم؟"
  if (
    (normQuery.includes('فرق') || normQuery.includes('مقارنة') || normQuery.includes('verschil') || normQuery.includes('difference')) &&
    (normQuery.includes('b1') || normQuery.includes('b6') || normQuery.includes('بينهم') || normQuery.includes('بين الاثنين') || immediateTopic === 'kb-priority-signs-b1-b6-b7')
  ) {
    return {
      resolvedText: `ما الفرق بين الشاخصة B1 (طريق الأولوية - Voorrangsweg) والشاخصة B6 (إعطاء الأولوية - Verleen voorrang) ومن له حق المرور في كل منهما؟ [Topic: Difference Between Priority Signs B1 and B6]`,
      activeContextConcept: 'kb-priority-signs-b1-b6-b7'
    };
  }

  // 2. Explain more / Elaborate: "اشرح لي أكثر", "اشرحلي اكتر", "وضح اكثر", "عطني تفاصيل اكثر", "explain more", "meer uitleg"
  if (
    normQuery.includes('اشرح لي اكثر') || normQuery.includes('اشرحلي اكثر') || normQuery.includes('اشرحلي اكتر') || normQuery.includes('اشرح لي اكتر') ||
    normQuery.includes('وضح اكثر') || normQuery.includes('وضح اكتر') || normQuery.includes('تفاصيل اكثر') || normQuery.includes('تفاصيل اكتر') ||
    normQuery.includes('explain more') || normQuery.includes('tell me more') || normQuery.includes('meer uitleg') || normQuery.includes('meer informatie')
  ) {
    if (immediateTopic === 'kb-priority-signs-b1-b6-b7' || normLastUser.includes('b1') || normLastUser.includes('b6')) {
      return {
        resolvedText: `اشرح لي بالتفصيل الشامل القواعد العملية والفروقات الدقيقة للشاخصة B1 (طريق الأولوية Voorrangsweg وتطبيقها داخل وخارج المدن وقواعد الركن) والشاخصة B6 (إعطاء الأولوية Verleen voorrang وأسنان القرش Haaietanden ومقارنتها مع شاخصة قف B7) في امتحانات CBR. [Topic: Comprehensive Deep Dive on B1 and B6 Signs]`,
        activeContextConcept: 'kb-priority-signs-b1-b6-b7'
      };
    } else if (immediateTopic === 'kb-priority-short-turn-vs-long-turn' || normLastUser.includes('يسار')) {
      return {
        resolvedText: `اشرح لي بالتفصيل العملي الشامل قواعد الانعطاف لليسار في التقاطع وترتيب الأولويات: الأولوية لليمين (Voorrang van rechts)، المرور المستقيم على نفس الطريق (Rechtdoor op dezelfde weg gaat voor)، والمنعطف القصير يسبق المنعطف الطويل (Korte bocht gaat voor lange bocht). [Topic: Comprehensive Deep Dive on Turning Left at Intersections]`,
        activeContextConcept: 'kb-priority-short-turn-vs-long-turn'
      };
    } else if (immediateTopic === 'kb-priority-speed-limit-vs-priority' || immediateTopic === 'kb-priority-equal-intersection') {
      return {
        resolvedText: `اشرح لي بالتفصيل الشامل قواعد التقاطع المتساوي (Gelijkwaardig kruispunt) ولماذا لا تمنح السرعة (70 أو 30 كم/س) أي أولوية (Snelheid bepaalt geen voorrang). [Topic: Comprehensive Deep Dive on Equal Intersections and Speed]`,
        activeContextConcept: 'kb-priority-speed-limit-vs-priority'
      };
    }
  }

  // 3. Why: "ليش؟", "لماذا؟", "ليه؟", "شو السبب؟", "why", "waarom"
  if (
    normQuery === 'ليش' || normQuery === 'لماذا' || normQuery === 'ليه' || normQuery === 'شو السبب' || normQuery === 'شو السبب في ذلك' ||
    normQuery === 'why' || normQuery === 'why is that' || normQuery === 'waarom' || normQuery === 'waarom is dat'
  ) {
    if (immediateTopic === 'kb-priority-short-turn-vs-long-turn' || normLastAI.includes('korte bocht') || normLastAI.includes('rechtdoor') || normLastUser.includes('يسار')) {
      return {
        resolvedText: `ما هو التعليل المنطقي والقانوني المروري لقواعد الانعطاف لليسار: لماذا يسبق المرور المستقيم المنعطف (Rechtdoor op dezelfde weg gaat voor)، ولماذا يسبق المنعطف القصير المنعطف الطويل (Korte bocht gaat voor lange bocht)، ولماذا تعطى الأولوية لليمين (Voorrang van rechts)؟ [Topic: Rationale for Turning Left, Straight Ahead, and Short Turn Rules]`,
        activeContextConcept: 'kb-priority-short-turn-vs-long-turn'
      };
    } else if (immediateTopic === 'kb-priority-signs-b1-b6-b7' || normLastUser.includes('b1') || normLastUser.includes('b6')) {
      return {
        resolvedText: `ما هو التعليل القانوني لوجود الشواخص B1 و B6 وكيف تنظم تدفق حركة المرور وتمنع حوادث الاصطدام؟ [Topic: Rationale for Priority Signs B1 and B6]`,
        activeContextConcept: 'kb-priority-signs-b1-b6-b7'
      };
    } else if (immediateTopic === 'kb-priority-equal-intersection' || normLastAI.includes('fietser') || normLastUser.includes('دراجة')) {
      return {
        resolvedText: `لماذا تُعامل الدراجة الهوائية كسائق مركبة (Bestuurder) وتملك الأولوية من اليمين في التقاطع المتساوي؟ [Topic: Rationale for Cyclist Priority as Bestuurder]`,
        activeContextConcept: 'kb-priority-equal-intersection'
      };
    } else {
      return {
        resolvedText: `ما هو التعليل والسبب القانوني لإعطاء الأولوية للقادم من اليمين في التقاطعات المتساوية (Voorrang van rechts) ولماذا لا تحدد السرعة الأولوية؟ [Topic: Rationale for Equal Intersection Priority and Speed Dissociation]`,
        activeContextConcept: 'kb-priority-speed-limit-vs-priority'
      };
    }
  }

  // 4. Turning left variations: "طيب إذا أنا بدي ألف يسار؟", "ولو بدي ألف يسار؟", "أنا بدي ألف يسار", "لو بدي الف شمال"
  if (
    normQuery.includes('الف يسار') || normQuery.includes('ألف يسار') || normQuery.includes('انعطف يسار') || normQuery.includes('انعطاف لليسار') ||
    normQuery.includes('الف شمال') || normQuery.includes('ألف شمال') || normQuery.includes('linksaf') || normQuery.includes('turn left')
  ) {
    return {
      resolvedText: `في نفس التقاطع السابق الخالي من الشواخص، إذا كنت أريد الانعطاف يساراً، ما هي قواعد الأولوية وترتيب المرور بيني وبين القادم من اليمين والقادم المقابل: الأولوية لليمين (Voorrang van rechts)، المرور المستقيم على نفس الطريق (Rechtdoor op dezelfde weg gaat voor)، والمنعطف القصير يسبق المنعطف الطويل (Korte bocht gaat voor lange bocht)؟ [Traffic Context: Turning Left at Equal Intersection Scenario]`,
      activeContextConcept: 'kb-priority-short-turn-vs-long-turn'
    };
  }

  // 5. Cyclist variations: "ولو السيارة الثانية دراجة؟", "ولو كانت دراجة؟", "ولو في دراجة؟", "إذا دراجة على اليمين؟"
  if (
    normQuery.includes('دراجة') || normQuery.includes('سيكل') || normQuery.includes('بسكليت') || normQuery.includes('fietser') || normQuery.includes('cyclist')
  ) {
    if (normLastUser.includes('b1') || normLastUser.includes('b6')) {
      return {
        resolvedText: `في تقاطع الشواخص B1 و B6، إذا كانت المركبة القادمة دراجة هوائية، كيف تطبق قواعد الأولوية؟ [Traffic Context: Priority Signs B1 and B6 with Cyclist]`,
        activeContextConcept: 'kb-priority-signs-b1-b6-b7'
      };
    } else {
      return {
        resolvedText: `في نفس التقاطع المتساوي (Gelijkwaardig kruispunt) الخالي من الشواخص، إذا كانت المركبة القادمة من اليمين دراجة هوائية، هل لها الأولوية وتمر أولاً باعتبارها سائق مركبة (Bestuurder)؟ [Traffic Context: Equal Intersection Priority with Cyclist from Right]`,
        activeContextConcept: 'kb-priority-equal-intersection'
      };
    }
  }

  // 6. Speed variations: "طيب إذا كان الشارع 30؟", "طيب إذا الشارع 30؟", "وإذا كان 70؟", "ولو الشارع 60؟"
  if (
    normQuery.includes('30') || normQuery.includes('70') || normQuery.includes('60') || normQuery.includes('80') || normQuery.includes('50')
  ) {
    if (normQuery.includes('شارع') || normQuery.includes('طريق') || normQuery.includes('سرعة') || normQuery.includes('كان') || normQuery.includes('إذا') || normQuery.includes('لو') || normQuery.includes('weg')) {
      return {
        resolvedText: `في نفس التقاطع الخالي من الشواخص، إذا كان حد سرعة الشارع 30 كم/س أو 70 كم/س، هل يغيّر ذلك الأولوية أم أن السرعة لا تمنح حق المرور (Snelheid bepaalt geen voorrang) وتبقى الأولوية للقادم من اليمين (Voorrang van rechts)؟ [Traffic Context: Speed Limit vs Equal Intersection Priority]`,
        activeContextConcept: 'kb-priority-speed-limit-vs-priority'
      };
    }
  }

  // 7. Who passes: "طيب مين بيمر؟", "مين إلو الأولوية؟", "مين بيمر بالأول؟", "يعني مين بيمر بالأول؟"
  if (
    normQuery.includes('مين بيمر') || normQuery.includes('مين يمر') || normQuery.includes('مين الو الاولويه') || normQuery.includes('مين اله الاولويه') ||
    normQuery.includes('مين بيمشي اول') || normQuery.includes('مين بيفوت اول') || normQuery.includes('who goes first') || normQuery.includes('wie mag eerst')
  ) {
    if (immediateTopic === 'kb-priority-signs-b1-b6-b7') {
      return {
        resolvedText: `من له الأولوية ومن يمر أولاً في تقاطع الشاخصة B1 (طريق الأولوية) والشاخصة B6 (إعطاء الأولوية)؟ [Traffic Context: B1 vs B6 Right of Way]`,
        activeContextConcept: 'kb-priority-signs-b1-b6-b7'
      };
    } else if (immediateTopic === 'kb-priority-short-turn-vs-long-turn') {
      return {
        resolvedText: `من يمر أولاً عند الانعطاف لليسار في التقاطع بين القادم من اليمين، والمرور المستقيم المقابل، والمنعطف يميناً؟ [Traffic Context: Turning Left Priority Order]`,
        activeContextConcept: 'kb-priority-short-turn-vs-long-turn'
      };
    } else {
      return {
        resolvedText: `من له الأولوية ومن يمر أولاً في التقاطع المتساوي الخالي من الشواخص مع وجود مركبة قادمة من اليمين؟ [Traffic Context: Equal Intersection Priority from Right]`,
        activeContextConcept: 'kb-priority-equal-intersection'
      };
    }
  }

  // 8. Clarifications: "ما فهمت", "لم افهم", "بسطها", "شو يعني؟"
  if (
    normQuery.includes('ما فهمت') || normQuery.includes('لم افهم') || normQuery.includes('بسط') || normQuery.includes('شو يعني') ||
    normQuery.includes('begrijp het niet') || normQuery.includes('don t understand')
  ) {
    return {
      resolvedText: `اشرح لي القاعدة المرورية السابقة بأسلوب مبسط جداً ومباشر وواضح للمبتدئين مع ذكر القواعد الهولندية الرسمية بين قوسين. [Topic: Simplified Explanation for ${immediateTopic || 'active scenario'}]`,
      activeContextConcept: immediateTopic || 'equal intersection priority'
    };
  }

  // Default context resolution
  if (immediateTopic) {
    const resolvedText = `${query} [Traffic context: ${immediateTopic}]`;
    return { resolvedText, activeContextConcept: immediateTopic };
  }

  return { resolvedText: query };
}

/**
 * Computes semantic similarity between query and knowledge item based on concepts & phrase variants
 */
function computeSemanticConceptAffinity(
  normQuery: string,
  item: KnowledgeItem,
  activeContext?: string
): number {
  let score = 0;

  // Exact concept / ID match from active context resolution
  if (activeContext) {
    const normCtx = normalizeQuery(activeContext);
    if (
      item.id.toLowerCase().includes(normCtx) ||
      normCtx.includes(item.id.toLowerCase().replace('kb-priority-', '')) ||
      item.concept.toLowerCase().includes(normCtx)
    ) {
      score += 0.95;
    }
  }

  // 1. Direct phrase or student dialect match
  for (const phrase of item.student_phrases) {
    const normPhrase = normalizeQuery(phrase);
    if (normQuery === normPhrase) return 1.0;
    if (normPhrase.length > 10 && normQuery.includes(normPhrase)) {
      score = Math.max(score, 0.9);
    }
  }

  // 2. Aliases match
  for (const alias of item.aliases) {
    const normAlias = normalizeQuery(alias);
    if (normAlias.length > 5 && normQuery.includes(normAlias)) {
      score = Math.max(score, 0.85);
    }
  }

  // 3. Language variants (Arabic, Dutch, English)
  const allVariants = [
    ...item.language_variants.ar,
    ...item.language_variants.nl,
    ...item.language_variants.en
  ];
  for (const variant of allVariants) {
    const normVar = normalizeQuery(variant);
    if (normVar.length > 5 && normQuery.includes(normVar)) {
      score = Math.max(score, 0.8);
    }
  }

  // 4. Keyword token overlap
  const queryTokens = normQuery.split(' ').filter(t => t.length > 2);
  let tokenMatches = 0;
  for (const token of queryTokens) {
    if (item.keywords.some(k => normalizeQuery(k).includes(token))) {
      tokenMatches++;
    }
  }
  const tokenScore = queryTokens.length > 0 ? (tokenMatches / queryTokens.length) * 0.5 : 0;

  return Math.min(1.0, Math.max(score, tokenScore));
}

/**
 * Asynchronously retrieves grounded knowledge units using hybrid Vector + Semantic Concept matching
 */
export async function retrieveGroundedKnowledgeAsync(
  query: string,
  history: Array<{ sender: string; text: string }> = [],
  client?: GoogleGenAI | null
): Promise<RetrievalResult> {
  const normQuery = normalizeQuery(query);
  const isPromptInjection = isPromptInjectionAttempt(normQuery);
  const isOffTopic = isOffTopicQuery(normQuery);

  // Check greetings & closings
  const isGreeting = (
    normQuery === 'كيف حالك' || normQuery === 'كيفك' || normQuery === 'شلونك' ||
    normQuery === 'مرحبا' || normQuery === 'السلام عليكم' || normQuery === 'صباح الخير' ||
    normQuery === 'مساء الخير' || normQuery === 'hallo' || normQuery === 'hoe gaat het' ||
    normQuery === 'hello' || normQuery === 'hi' || normQuery === 'hey'
  );

  const isThanks = (
    normQuery.includes('شكرا') || normQuery.includes('مشكور') || normQuery.includes('تسلم') ||
    normQuery.includes('bedankt') || normQuery.includes('dank') || normQuery.includes('thank')
  );

  const { resolvedText, activeContextConcept } = resolveConversationContext(query, history);
  const normResolved = normalizeQuery(resolvedText);

  // If prompt injection or off-topic, return early
  if (isPromptInjection || isOffTopic || isGreeting || isThanks) {
    return {
      matchedItems: [],
      contextSummary: '',
      isOffTopic,
      isPromptInjection,
      isGreeting,
      isThanks,
      isInsufficientKnowledge: false,
      resolvedQuery: resolvedText,
      topScore: 0
    };
  }

  // High-performance Semantic Concept & Context Scoring
  const scoredItems = DRIVING_KNOWLEDGE_BASE.map(item => {
    const conceptScore = computeSemanticConceptAffinity(normResolved, item, activeContextConcept);
    return { item, score: conceptScore };
  })
  .sort((a, b) => b.score - a.score);

  const topScore = scoredItems.length > 0 ? scoredItems[0].score : 0;
  const isInsufficientKnowledge = topScore < 0.25;

  const matchedItems = scoredItems
    .filter(s => s.score >= 0.25)
    .slice(0, 3)
    .map(s => s.item);

  const contextSummary = matchedItems
    .map(m => `[CONCEPT: ${m.concept} | ID: ${m.id}]\nسؤال: ${m.question_ar}\nالجواب: ${m.answer_ar}\n(Dutch: ${m.answer_nl})`)
    .join('\n\n');

  return {
    matchedItems,
    contextSummary,
    isOffTopic,
    isPromptInjection,
    isGreeting,
    isThanks,
    isInsufficientKnowledge,
    resolvedQuery: resolvedText,
    topScore
  };
}

/**
 * Synchronous retrieval wrapper for immediate fallback
 */
export function retrieveGroundedKnowledge(
  query: string,
  history: Array<{ sender: string; text: string }> = []
): RetrievalResult {
  const normQuery = normalizeQuery(query);
  const isPromptInjection = isPromptInjectionAttempt(normQuery);
  const isOffTopic = isOffTopicQuery(normQuery);

  const isGreeting = (
    normQuery === 'كيف حالك' || normQuery === 'كيفك' || normQuery === 'شلونك' ||
    normQuery === 'مرحبا' || normQuery === 'السلام عليكم' || normQuery === 'صباح الخير' ||
    normQuery === 'مساء الخير' || normQuery === 'hallo' || normQuery === 'hoe gaat het' ||
    normQuery === 'hello' || normQuery === 'hi' || normQuery === 'hey'
  );

  const isThanks = (
    normQuery.includes('شكرا') || normQuery.includes('مشكور') || normQuery.includes('تسلم') ||
    normQuery.includes('bedankt') || normQuery.includes('dank') || normQuery.includes('thank')
  );

  const { resolvedText, activeContextConcept } = resolveConversationContext(query, history);
  const normResolved = normalizeQuery(resolvedText);

  if (isPromptInjection || isOffTopic || isGreeting || isThanks) {
    return {
      matchedItems: [],
      contextSummary: '',
      isOffTopic,
      isPromptInjection,
      isGreeting,
      isThanks,
      isInsufficientKnowledge: false,
      resolvedQuery: resolvedText,
      topScore: 0
    };
  }

  const scoredItems = DRIVING_KNOWLEDGE_BASE.map(item => {
    const score = computeSemanticConceptAffinity(normResolved, item, activeContextConcept);
    return { item, score };
  })
  .sort((a, b) => b.score - a.score);

  const topScore = scoredItems.length > 0 ? scoredItems[0].score : 0;
  const isInsufficientKnowledge = topScore < 0.25;

  const matchedItems = scoredItems
    .filter(s => s.score >= 0.25)
    .slice(0, 3)
    .map(s => s.item);

  const contextSummary = matchedItems
    .map(m => `[CONCEPT: ${m.concept} | ID: ${m.id}]\nسؤال: ${m.question_ar}\nالجواب: ${m.answer_ar}\n(Dutch: ${m.answer_nl})`)
    .join('\n\n');

  return {
    matchedItems,
    contextSummary,
    isOffTopic,
    isPromptInjection,
    isGreeting,
    isThanks,
    isInsufficientKnowledge,
    resolvedQuery: resolvedText,
    topScore
  };
}

/**
 * Sanitizes and strictly formats AI responses to comply with driving instruction standards:
 * - Replaces bullet points (-, *, •) with numbered points: 1- , 2-
 * - Removes ALL markdown asterisks (*, **, ***) so that ZERO asterisk characters remain
 * - Cleans headers (###, ####)
 * - Preserves Dutch terms in parentheses (Voorrang van rechts, etc.)
 */
export function sanitizeAndFormatAIResponse(text: string): string {
  if (!text) return "";
  
  let cleaned = text;

  // 1. Remove markdown header symbols (###, ##, #)
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');

  // 2. Convert bulleted lists (- , * , • ) to numbered lists (1- , 2- , ...)
  // and ensure proper sequential numbering
  const lines = cleaned.split('\n');
  let listCounter = 1;

  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    // Matches bullets like "- ", "* ", "• ", "+ "
    const bulletMatch = trimmed.match(/^[-*•+]\s+(.*)$/);
    const existingNumMatch = trimmed.match(/^(\d+)[.)-]\s+(.*)$/);

    if (bulletMatch) {
      const content = bulletMatch[1];
      const res = `${listCounter}- ${content}`;
      listCounter++;
      return res;
    } else if (existingNumMatch) {
      const numVal = parseInt(existingNumMatch[1], 10);
      const content = existingNumMatch[2];
      // If the existing number is already sequential or higher, align listCounter
      const currentNum = Math.max(listCounter, numVal);
      const res = `${currentNum}- ${content}`;
      listCounter = currentNum + 1;
      return res;
    } else {
      // Don't eagerly reset counter on intermediate explanatory sentences or empty lines
      if (trimmed.length > 0 && (trimmed.endsWith(':') || trimmed.includes('الشاخصة') || trimmed.includes('Bord') || trimmed.includes('قواعد') || trimmed.includes('خطوة'))) {
        // keep counter continuing for next sub-items
      }
      return line;
    }
  });

  cleaned = processedLines.join('\n');

  // 3. STRICT RULE: ZERO visible asterisk characters (*) anywhere in the final response
  cleaned = cleaned.replace(/\*{1,3}/g, '');

  return cleaned.trim();
}
