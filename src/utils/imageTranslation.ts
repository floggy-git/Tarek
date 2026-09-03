/**
 * Dynamic Translation Engine for Image Titles and Descriptions.
 * 
 * Strict Architectural Rules:
 * 1. NO fixed phrase dictionaries, hardcoded translation arrays, or regex replacements.
 * 2. Source text is stored as-is without modification.
 * 3. Source language is automatically detected (Arabic, Dutch, or English).
 * 4. If target language === source language, returns original content directly.
 * 5. If target language !== source language, fetches full-sentence dynamic translation from backend AI endpoint.
 * 6. Results are cached in memory and localStorage so repeat renders are instant.
 */

import React, { useState, useEffect } from 'react';
import { safeSetItem } from './safeStorage';

// In-Memory Translation Cache & In-Flight Request Deduplication
type TranslationMap = { ar: string; en: string; nl: string };
const translationCache = new Map<string, TranslationMap>();
const inFlightRequests = new Map<string, Promise<TranslationMap>>();

// Task Queue to space out API requests and strictly prevent 429 quota spikes
type QueueTask = () => Promise<void>;
const requestQueue: QueueTask[] = [];
let isProcessingQueue = false;

async function processQueue() {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const task = requestQueue.shift();
    if (task) {
      try {
        await task();
      } catch (e) {
        // Continue processing queue
      }
      // Pause 200ms between requests to stay well within free tier limits
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  isProcessingQueue = false;
}

// Persistent Storage Key
const CACHE_STORAGE_KEY = 'drivingschool_image_trans_cache_v4';

// Load persistent cache from localStorage
try {
  const saved = localStorage.getItem(CACHE_STORAGE_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    if (typeof parsed === 'object' && parsed !== null) {
      Object.entries(parsed).forEach(([k, v]) => {
        if (v && typeof v === 'object') {
          translationCache.set(k, v as TranslationMap);
        }
      });
    }
  }
} catch (e) {
  console.warn('Failed to load image translation cache from localStorage:', e);
}

function persistCache() {
  try {
    const obj: Record<string, TranslationMap> = {};
    translationCache.forEach((val, key) => {
      obj[key] = val;
    });
    safeSetItem(CACHE_STORAGE_KEY, JSON.stringify(obj));
  } catch (e) {
    console.warn('Failed to save image translation cache to localStorage:', e);
  }
}

/**
 * Validates whether a cached translation map contains a real, non-placeholder translation for targetLang.
 */
export function isValidTranslationForLang(
  cachedMap: TranslationMap | undefined,
  targetLang: 'ar' | 'en' | 'nl',
  cleanText: string,
  srcLang: 'ar' | 'en' | 'nl'
): boolean {
  if (!cachedMap) return false;
  if (srcLang === targetLang) return true; // Source language text is natively valid for target language

  const translatedVal = cachedMap[targetLang];
  if (!translatedVal || typeof translatedVal !== 'string') return false;

  const valClean = translatedVal.trim();
  if (!valClean) return false;

  // Script mismatch sanity checks:
  // If target language is Arabic and source was English/Dutch, translation should contain Arabic characters unless it's pure numbers/punctuation
  if (targetLang === 'ar' && (srcLang === 'en' || srcLang === 'nl') && !/[\u0600-\u06FF]/.test(valClean) && /[a-zA-Z]/.test(cleanText)) {
    return false;
  }

  // If target language is English/Dutch and source was Arabic, translation should NOT be pure Arabic script
  if ((targetLang === 'en' || targetLang === 'nl') && srcLang === 'ar' && /[\u0600-\u06FF]/.test(valClean) && !/[a-zA-Z]/.test(valClean)) {
    return false;
  }

  return true;
}

/**
 * Detects whether the text is Arabic, Dutch, or English.
 */
export function detectSourceLanguage(text: string): 'ar' | 'nl' | 'en' {
  if (!text || typeof text !== 'string') return 'en';
  const clean = text.trim();
  if (!clean) return 'en';

  // 1. Arabic Script Check
  if (/[\u0600-\u06FF]/.test(clean)) {
    return 'ar';
  }

  // 2. Dutch Vocabulary / Structure Check
  const dutchPatterns = /\b(het|de|een|van|op|in|bij|met|voor|voorrang|snelweg|rotonde|kruispunt|parkeren|fileparkeren|inparkeren|rijden|stilstaan|verkeer|geef|richting|let|goed|oprijden|invoegen|volgafstand|bocht|dode|hoek|spiegels|afbeelding|kijktechniek|haaientanden|bestuurder|bestuurders|rechts|voorganger|afstand|instructie|verrichtingen|bijzondere|oefening|theorie|examen)\b/i;
  if (dutchPatterns.test(clean)) {
    return 'nl';
  }

  // 3. English Vocabulary / Structure Check
  const englishPatterns = /\b(the|and|on|at|to|in|for|with|driving|highway|motorway|roundabout|intersection|parking|parallel|reverse|stop|stopping|yield|speed|mirror|mirrors|check|blind|spot|instructional|image|pay|attention|entering|merging|priority|rules|sign|signs|lane|distance|maneuvers|special)\b/i;
  if (englishPatterns.test(clean)) {
    return 'en';
  }

  // Default to Dutch for non-Arabic European input if ambiguous
  return 'nl';
}

/**
 * Fetches dynamic translation for a string from the backend server.
 */
export async function fetchDynamicTranslation(
  text: string,
  isTitle: boolean = true
): Promise<TranslationMap> {
  const cleanText = text.trim();
  if (!cleanText) {
    return { ar: '', en: '', nl: '' };
  }

  const sourceLang = detectSourceLanguage(cleanText);
  const cacheKey = cleanText.toLowerCase();

  // Check cache first for valid entries across all target languages
  if (translationCache.has(cacheKey)) {
    const cached = translationCache.get(cacheKey)!;
    if (
      isValidTranslationForLang(cached, 'ar', cleanText, sourceLang) &&
      isValidTranslationForLang(cached, 'en', cleanText, sourceLang) &&
      isValidTranslationForLang(cached, 'nl', cleanText, sourceLang)
    ) {
      return cached;
    }
  }

  // Deduplicate in-flight requests for the exact same text
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)!;
  }

  const requestPromise = new Promise<TranslationMap>((resolve) => {
    requestQueue.push(async () => {
      const result: TranslationMap = {
        ar: sourceLang === 'ar' ? cleanText : '',
        en: sourceLang === 'en' ? cleanText : '',
        nl: sourceLang === 'nl' ? cleanText : '',
      };

      try {
        const endpoint = isTitle ? '/api/translate-title' : '/api/translate-description';
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleanText, sourceLang }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.translations) {
            result.ar = data.translations.ar || result.ar || cleanText;
            result.en = data.translations.en || result.en || cleanText;
            result.nl = data.translations.nl || result.nl || cleanText;
          }
        }
      } catch (err) {
        console.warn('Dynamic translation request failed:', err);
      }

      // Merge into existing cache
      const existing = translationCache.get(cacheKey) || { ar: '', en: '', nl: '' };
      const merged: TranslationMap = {
        ar: result.ar || existing.ar || (sourceLang === 'ar' ? cleanText : ''),
        en: result.en || existing.en || (sourceLang === 'en' ? cleanText : ''),
        nl: result.nl || existing.nl || (sourceLang === 'nl' ? cleanText : ''),
      };

      translationCache.set(cacheKey, merged);
      persistCache();
      inFlightRequests.delete(cacheKey);

      resolve(merged);
    });

    processQueue();
  });

  inFlightRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

/**
 * Validates whether a pre-translated candidate string on an object is genuine for targetLang,
 * or whether it is just the raw untranslated source string.
 */
export function isValidPreTranslation(
  candidate: string,
  targetLang: 'ar' | 'en' | 'nl',
  cleanText: string
): boolean {
  if (!candidate || typeof candidate !== 'string') return false;
  const candClean = candidate.trim();
  if (!candClean) return false;

  const srcLang = detectSourceLanguage(cleanText);

  if (targetLang === 'ar') {
    if (srcLang === 'ar') return candClean === cleanText || /[\u0600-\u06FF]/.test(candClean);
    return /[\u0600-\u06FF]/.test(candClean);
  }

  if (targetLang === 'en') {
    if (srcLang === 'en') return candClean === cleanText || !/[\u0600-\u06FF]/.test(candClean);
    if (candClean === cleanText) return false;
    if (/[\u0600-\u06FF]/.test(candClean)) return false;
    return true;
  }

  if (targetLang === 'nl') {
    if (srcLang === 'nl') return candClean === cleanText || !/[\u0600-\u06FF]/.test(candClean);
    if (candClean === cleanText) return false;
    if (/[\u0600-\u06FF]/.test(candClean)) return false;
    return true;
  }

  return true;
}

/**
 * React Hook to dynamically translate and localize image or video title or description.
 * Instantly returns cached translation if available, or asynchronously fetches full AI translation.
 */
export function useImageLocalizedText(
  rawTextOrObj: any,
  lang: 'ar' | 'en' | 'nl' = 'en',
  isTitle: boolean = true
): string {
  let objectOverride: string | null = null;
  let cleanText = '';

  if (rawTextOrObj && typeof rawTextOrObj === 'object') {
    const obj = rawTextOrObj;
    if (isTitle) {
      cleanText = (obj.originalTitle || obj.rawTitle || obj.title || obj.titleAr || obj.titleEn || obj.titleNl || '').trim();
      const candAr = typeof obj.titleAr === 'string' ? obj.titleAr.trim() : '';
      const candNl = typeof obj.titleNl === 'string' ? obj.titleNl.trim() : '';
      const candEn = typeof obj.titleEn === 'string' ? obj.titleEn.trim() : '';

      if (lang === 'ar' && candAr && isValidPreTranslation(candAr, 'ar', cleanText)) {
        objectOverride = candAr;
      } else if (lang === 'nl' && candNl && isValidPreTranslation(candNl, 'nl', cleanText)) {
        objectOverride = candNl;
      } else if (lang === 'en' && candEn && isValidPreTranslation(candEn, 'en', cleanText)) {
        objectOverride = candEn;
      }
    } else {
      cleanText = (obj.originalDescription || obj.rawDesc || obj.description || obj.descriptionAr || obj.descriptionEn || obj.descriptionNl || '').trim();
      const candAr = typeof obj.descriptionAr === 'string' ? obj.descriptionAr.trim() : '';
      const candNl = typeof obj.descriptionNl === 'string' ? obj.descriptionNl.trim() : '';
      const candEn = typeof obj.descriptionEn === 'string' ? obj.descriptionEn.trim() : '';

      if (lang === 'ar' && candAr && isValidPreTranslation(candAr, 'ar', cleanText)) {
        objectOverride = candAr;
      } else if (lang === 'nl' && candNl && isValidPreTranslation(candNl, 'nl', cleanText)) {
        objectOverride = candNl;
      } else if (lang === 'en' && candEn && isValidPreTranslation(candEn, 'en', cleanText)) {
        objectOverride = candEn;
      }
    }
  } else {
    cleanText = (rawTextOrObj || '').trim();
  }

  const getSyncValue = (): string => {
    if (objectOverride) return objectOverride;
    if (!cleanText) return '';
    const srcLang = detectSourceLanguage(cleanText);
    if (srcLang === lang) return cleanText;

    const cacheKey = cleanText.toLowerCase();
    const cached = translationCache.get(cacheKey);
    if (isValidTranslationForLang(cached, lang, cleanText, srcLang)) {
      return cached![lang];
    }
    return cleanText;
  };

  const [localized, setLocalized] = useState<string>(() => getSyncValue());

  useEffect(() => {
    setLocalized(getSyncValue());
  }, [cleanText, lang, objectOverride]);

  useEffect(() => {
    if (objectOverride || !cleanText) {
      return;
    }

    let isMounted = true;
    const srcLang = detectSourceLanguage(cleanText);

    if (srcLang === lang) {
      setLocalized(cleanText);
      return;
    }

    const cacheKey = cleanText.toLowerCase();
    const cached = translationCache.get(cacheKey);

    if (isValidTranslationForLang(cached, lang, cleanText, srcLang)) {
      setLocalized(cached![lang]);
      return;
    }

    fetchDynamicTranslation(cleanText, isTitle).then((resMap) => {
      if (isMounted) {
        if (resMap && resMap[lang] && typeof resMap[lang] === 'string' && resMap[lang].trim() !== '') {
          setLocalized(resMap[lang]);
        } else {
          setLocalized(cleanText);
        }
      }
    }).catch(() => {
      if (isMounted) {
        setLocalized(cleanText);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [cleanText, lang, isTitle, objectOverride]);

  return localized || objectOverride || cleanText;
}

/**
 * Synchronous getter that returns cached translation or falls back to raw string.
 * Strictly avoids making synchronous network requests during rendering.
 */
export function getImageLocalizedTitleSync(imageObj: any, lang: 'ar' | 'en' | 'nl' = 'en'): string {
  if (!imageObj) return '';
  if (typeof imageObj === 'string') {
    imageObj = { title: imageObj };
  }

  // 1. Extract original raw source title
  const raw = (imageObj.originalTitle || imageObj.rawTitle || imageObj.title || imageObj.titleAr || imageObj.titleEn || imageObj.titleNl || '').trim();
  if (!raw) return '';

  const candAr = typeof imageObj.titleAr === 'string' ? imageObj.titleAr.trim() : '';
  const candNl = typeof imageObj.titleNl === 'string' ? imageObj.titleNl.trim() : '';
  const candEn = typeof imageObj.titleEn === 'string' ? imageObj.titleEn.trim() : '';

  if (lang === 'ar' && candAr && isValidPreTranslation(candAr, 'ar', raw)) return candAr;
  if (lang === 'nl' && candNl && isValidPreTranslation(candNl, 'nl', raw)) return candNl;
  if (lang === 'en' && candEn && isValidPreTranslation(candEn, 'en', raw)) return candEn;

  const srcLang = detectSourceLanguage(raw);
  if (srcLang === lang) return raw;

  const cacheKey = raw.toLowerCase();
  if (translationCache.has(cacheKey)) {
    const cached = translationCache.get(cacheKey)!;
    if (isValidTranslationForLang(cached, lang, raw, srcLang)) {
      return cached[lang];
    }
  }

  // Trigger background fetch for future renders if missing from cache
  fetchDynamicTranslation(raw, true);

  return raw;
}

export function getImageLocalizedDescriptionSync(imageObj: any, lang: 'ar' | 'en' | 'nl' = 'en'): string {
  if (!imageObj) return '';
  if (typeof imageObj === 'string') {
    imageObj = { description: imageObj };
  }

  // 1. Extract original raw source description
  const raw = (imageObj.originalDescription || imageObj.rawDesc || imageObj.description || imageObj.descriptionAr || imageObj.descriptionEn || imageObj.descriptionNl || '').trim();
  if (!raw) return '';

  const candAr = typeof imageObj.descriptionAr === 'string' ? imageObj.descriptionAr.trim() : '';
  const candNl = typeof imageObj.descriptionNl === 'string' ? imageObj.descriptionNl.trim() : '';
  const candEn = typeof imageObj.descriptionEn === 'string' ? imageObj.descriptionEn.trim() : '';

  if (lang === 'ar' && candAr && isValidPreTranslation(candAr, 'ar', raw)) return candAr;
  if (lang === 'nl' && candNl && isValidPreTranslation(candNl, 'nl', raw)) return candNl;
  if (lang === 'en' && candEn && isValidPreTranslation(candEn, 'en', raw)) return candEn;

  const srcLang = detectSourceLanguage(raw);
  if (srcLang === lang) return raw;

  const cacheKey = raw.toLowerCase();
  if (translationCache.has(cacheKey)) {
    const cached = translationCache.get(cacheKey)!;
    if (isValidTranslationForLang(cached, lang, raw, srcLang)) {
      return cached[lang];
    }
  }

  // Trigger background fetch for future renders if missing from cache
  fetchDynamicTranslation(raw, false);

  return raw;
}

export const getImageLocalizedTitle = getImageLocalizedTitleSync;
export const getImageLocalizedDescription = getImageLocalizedDescriptionSync;
export const translateTextToAllLanguages = fetchDynamicTranslation;
