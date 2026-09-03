/**
 * Safe LocalStorage Utility with automatic quota handling and cleanup.
 * Prevents QuotaExceededError exceptions from breaking React components or background state sync.
 */

export function safeSetItem(key: string, value: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e: any) {
    console.warn(`[safeStorage] Initial setItem failed for key "${key}":`, e);

    // If QuotaExceededError or any storage exception occurs:
    // 1. Try removing non-essential / redundant legacy keys first
    const nonEssentialKeys = [
      'drivingschool_image_trans_cache_v4',
      'image_translation_cache_v1',
      'al_andalos_media_videos',
      'al_andalos_student_photos',
      'al_andalos_trainer_photos',
      'al_andalos_students_db',
      'al_andalos_school_settings',
      'al_andalos_schedule',
      'al_andalos_packages',
      'al_andalos_assessments',
      'al_andalos_deleted_students',
      'al_andalos_lang'
    ];

    for (const k of nonEssentialKeys) {
      if (k !== key) {
        try {
          localStorage.removeItem(k);
        } catch (_) {}
      }
    }

    // Try saving again
    try {
      localStorage.setItem(key, value);
      console.info(`[safeStorage] Successfully saved "${key}" after clearing non-essential caches.`);
      return true;
    } catch (e2: any) {
      console.warn(`[safeStorage] Retry failed for key "${key}". Trimming payload...`, e2);

      // If key is media videos or photos, try saving a compressed / trimmed payload
      if (key === 'drivingschool_media_videos') {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            // Keep items without giant base64 payloads
            const trimmed = parsed.map(v => ({
              ...v,
              videoUrl: (v.videoUrl && v.videoUrl.length > 300000) ? '' : v.videoUrl,
              thumbnailUrl: (v.thumbnailUrl && v.thumbnailUrl.length > 200000) ? '' : v.thumbnailUrl
            }));
            localStorage.setItem(key, JSON.stringify(trimmed));
            return true;
          }
        } catch (_) {}
      } else if (key === 'drivingschool_student_photos' || key === 'drivingschool_trainer_photos') {
        try {
          const parsed = JSON.parse(value);
          if (typeof parsed === 'object' && parsed !== null) {
            const entries = Object.entries(parsed).slice(-10);
            localStorage.setItem(key, JSON.stringify(Object.fromEntries(entries)));
            return true;
          }
        } catch (_) {}
      }

      console.error(`[safeStorage] Could not persist key "${key}" due to storage limits. Operations will continue in-memory.`, e2);
      return false;
    }
  }
}

export function safeGetItem(key: string): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn(`[safeStorage] getItem failed for key "${key}":`, e);
    return null;
  }
}

export function safeRemoveItem(key: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn(`[safeStorage] removeItem failed for key "${key}":`, e);
  }
}
