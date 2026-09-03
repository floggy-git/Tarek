/**
 * IndexedDB persistent storage helper for local video files.
 * Stores local video File/Blob objects in the browser's IndexedDB
 * so local uploaded videos persist across page reloads and sessions.
 */

const DB_NAME = 'drivingschool_video_db';
const STORE_NAME = 'local_videos';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (e) => {
      resolve((e.target as IDBOpenDBRequest).result);
    };

    request.onerror = () => {
      console.warn('IndexedDB video store error:', request.error);
      reject(request.error);
    };
  });

  return dbPromise;
}

/**
 * Save a local video Blob/File into IndexedDB associated with its unique video.id
 */
export async function saveLocalVideoBlob(videoId: string, blob: Blob): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(blob, videoId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Failed to save local video blob to IndexedDB:', e);
  }
}

const activeObjectUrls = new Map<string, string>();

/**
 * Retrieve a persistent local video Blob URL for a given videoId from IndexedDB
 */
export async function getLocalVideoBlobUrl(videoId: string): Promise<string | null> {
  if (activeObjectUrls.has(videoId)) {
    return activeObjectUrls.get(videoId)!;
  }

  try {
    const db = await getDB();
    const blob = await new Promise<Blob | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(videoId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (blob && blob instanceof Blob) {
      const url = URL.createObjectURL(blob);
      activeObjectUrls.set(videoId, url);
      return url;
    }
  } catch (e) {
    console.warn('Failed to retrieve local video blob from IndexedDB:', e);
  }

  return null;
}

import { DEFAULT_VIDEO_THUMBNAIL } from '../data';

/**
 * Formats seconds into M:SS or MM:SS (e.g. 10 -> "0:10", 80 -> "1:20", 180 -> "3:00")
 */
export function formatVideoDuration(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds) || seconds <= 0) return '';
  const totalSecs = Math.round(seconds);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Reads HTML5 video metadata duration from a File/Blob or URL asynchronously.
 */
export function getRealVideoFileDuration(fileOrUrl: File | Blob | string): Promise<string> {
  return new Promise((resolve) => {
    if (!fileOrUrl) return resolve('');
    if (typeof window === 'undefined') return resolve('');

    const video = document.createElement('video');
    video.preload = 'metadata';
    const isString = typeof fileOrUrl === 'string';
    const src = isString ? fileOrUrl : URL.createObjectURL(fileOrUrl);
    video.src = src;

    const cleanup = () => {
      if (!isString) {
        try { URL.revokeObjectURL(src); } catch (_) {}
      }
      video.onloadedmetadata = null;
      video.onerror = null;
    };

    const timeout = setTimeout(() => {
      cleanup();
      resolve('');
    }, 4000);

    video.onloadedmetadata = () => {
      clearTimeout(timeout);
      const formatted = formatVideoDuration(video.duration);
      cleanup();
      resolve(formatted);
    };

    video.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      resolve('');
    };
  });
}

/**
 * Ensures video thumbnail is a valid image URL or falls back to DEFAULT_VIDEO_THUMBNAIL.
 * Prevents video blobs or mp4 files from being used as image sources.
 */
export function getVideoThumbnail(thumbnail: string | undefined): string {
  if (!thumbnail || typeof thumbnail !== 'string' || thumbnail.trim() === '') {
    return DEFAULT_VIDEO_THUMBNAIL;
  }
  const clean = thumbnail.trim();
  if (
    clean.startsWith('blob:') ||
    clean.startsWith('data:video/') ||
    clean.endsWith('.mp4') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.mov') ||
    clean.endsWith('.avi')
  ) {
    return DEFAULT_VIDEO_THUMBNAIL;
  }
  return clean;
}
