import { AIMessage } from '../types';
import { safeSetItem } from './safeStorage';

const AI_CHAT_STORAGE_PREFIX = 'drivingschool_ai_chat_';
export const RETENTION_PERIOD_MS = 48 * 60 * 60 * 1000; // 48 hours

export interface SavedAiConversation {
  studentId: string;
  lastActiveTimestamp: number; // Unix timestamp in ms
  createdAt: number;
  messages: Array<{
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp: string; // ISO string
    image?: string;
    imageUrl?: string;
    isWarning?: boolean;
    isOffTopic?: boolean;
  }>;
}

/**
 * Normalizes and resolves a stable student identifier.
 */
export function getStableStudentId(student: any): string {
  if (!student) return 'ST-GUEST';
  return (student.studentId || student.id || student.email || 'ST-GUEST').toString().trim();
}

/**
 * Gets the localStorage key for a specific student ID.
 */
function getStorageKey(studentId: string): string {
  const cleanId = (studentId || 'ST-GUEST').toString().trim();
  return `${AI_CHAT_STORAGE_PREFIX}${cleanId}`;
}

/**
 * Loads and restores the active AI Coach conversation for a given student ID.
 * Automatically verifies the 48-hour retention window.
 * Returns null if no conversation exists or if it has expired.
 */
export function loadStudentAiConversation(studentId: string): AIMessage[] | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  const key = getStorageKey(studentId);

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed: SavedAiConversation = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.messages) || parsed.messages.length === 0) {
      localStorage.removeItem(key);
      return null;
    }

    const now = Date.now();
    const lastActive = parsed.lastActiveTimestamp || parsed.createdAt || 0;
    const ageMs = now - lastActive;

    // Check 48-hour retention limit
    if (ageMs > RETENTION_PERIOD_MS || ageMs < 0) {
      // Inactive for more than 48 hours -> expire and clear
      localStorage.removeItem(key);
      return null;
    }

    // Convert stored ISO string timestamps back to Date objects
    const restoredMessages: AIMessage[] = parsed.messages.map(m => ({
      id: m.id || `m-restored-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender: m.sender,
      text: m.text || '',
      timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
      image: m.image,
      imageUrl: m.imageUrl,
      isWarning: m.isWarning,
      isOffTopic: m.isOffTopic
    }));

    return restoredMessages;
  } catch (err) {
    console.warn(`[aiCoachStorage] Failed to load conversation for ${studentId}:`, err);
    return null;
  }
}

/**
 * Saves or updates a student's active AI Coach conversation.
 * Automatically refreshes the 48-hour activity timer.
 */
export function saveStudentAiConversation(studentId: string, messages: AIMessage[]): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  if (!studentId || studentId === 'ST-GUEST') return false;

  // Don't save if there are no messages or if it's only the default initial welcome message
  if (!messages || messages.length === 0) return false;
  if (messages.length === 1 && messages[0].id === 'm-ai-welcome') {
    return false;
  }

  const key = getStorageKey(studentId);
  const now = Date.now();

  try {
    // Sanitize and serialize messages
    const serializedMessages = messages.map(m => {
      // For images, preserve what is needed for visual rendering
      return {
        id: m.id,
        sender: m.sender,
        text: m.text,
        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : new Date(m.timestamp || now).toISOString(),
        image: m.image,
        imageUrl: m.imageUrl,
        isWarning: m.isWarning,
        isOffTopic: m.isOffTopic
      };
    });

    const payload: SavedAiConversation = {
      studentId: studentId,
      lastActiveTimestamp: now, // Refresh 48-hour retention window
      createdAt: now,
      messages: serializedMessages
    };

    const success = safeSetItem(key, JSON.stringify(payload));
    return success;
  } catch (err) {
    console.warn(`[aiCoachStorage] Error saving conversation for ${studentId}:`, err);
    return false;
  }
}

/**
 * Clears the stored conversation for a specific student.
 */
export function clearStudentAiConversation(studentId: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const key = getStorageKey(studentId);
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[aiCoachStorage] Error clearing conversation for ${studentId}:`, err);
  }
}

/**
 * Prunes all expired AI Coach conversations across all students (> 48 hours inactive).
 * Lightweight and safe to run on app startup.
 */
export function pruneExpiredAiConversations(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(AI_CHAT_STORAGE_PREFIX)) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) {
            keysToRemove.push(key);
            continue;
          }
          const parsed: SavedAiConversation = JSON.parse(raw);
          const lastActive = parsed.lastActiveTimestamp || parsed.createdAt || 0;
          if (now - lastActive > RETENTION_PERIOD_MS) {
            keysToRemove.push(key);
          }
        } catch {
          keysToRemove.push(key);
        }
      }
    }

    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch (err) {
    console.warn('[aiCoachStorage] Error pruning expired conversations:', err);
  }
}
