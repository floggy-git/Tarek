import { TRANSLATIONS } from '../types';
import { safeSetItem } from './safeStorage';

/**
 * Get a unique, non-localized Student ID from a student's name.
 * Maps both Arabic, Dutch, and English variants of the names to a single stable ID.
 */
export function getStudentId(name: string): string {
  if (!name) return "ST-000000";
  const clean = name.toLowerCase().trim();
  
  if (name.startsWith("ST-") || name.startsWith("st-")) {
    return name.toUpperCase();
  }

  // Map Amir Al-Hassan
  if (
    clean.includes("amir") || 
    clean.includes("alhassan") || 
    clean.includes("أمير") || 
    clean.includes("الحسن") ||
    clean.includes("and-amir-01")
  ) {
    return "ST-000001";
  }
  
  // Map Sanne de Jong
  if (
    clean.includes("sanne") || 
    clean.includes("dejong") || 
    clean.includes("ساني") || 
    clean.includes("يونغ") ||
    clean.includes("and-sanne-02")
  ) {
    return "ST-000002";
  }
  
  // Map Michael van Berg
  if (
    clean.includes("michael") || 
    clean.includes("vanberg") || 
    clean.includes("مايكل") || 
    clean.includes("بيرغ") ||
    clean.includes("and-michael-03")
  ) {
    return "ST-000003";
  }

  // Generate a deterministic stable ST-000xxx ID for dynamic students
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i) * (i + 1);
  }
  const idNum = (sum % 900000) + 100000; // ST-100000 to ST-999999
  return `ST-${idNum}`;
}

let cachedStudentPhotos: Record<string, string> | null = null;
let cachedTrainerPhotos: Record<string, string> | null = null;

function loadStudentPhotos(): Record<string, string> {
  if (cachedStudentPhotos !== null) return cachedStudentPhotos;
  try {
    const photos = localStorage.getItem('drivingschool_student_photos') || localStorage.getItem('al_andalos_student_photos');
    cachedStudentPhotos = photos ? JSON.parse(photos) : {};
  } catch (e) {
    console.error("Failed to read student photos", e);
    cachedStudentPhotos = {};
  }
  return cachedStudentPhotos!;
}

function saveStudentPhotosToStorage(photos: Record<string, string>) {
  safeSetItem('drivingschool_student_photos', JSON.stringify(photos));
}

function loadTrainerPhotos(): Record<string, string> {
  if (cachedTrainerPhotos !== null) return cachedTrainerPhotos;
  try {
    const photos = localStorage.getItem('drivingschool_trainer_photos') || localStorage.getItem('al_andalos_trainer_photos');
    cachedTrainerPhotos = photos ? JSON.parse(photos) : {};
  } catch (e) {
    console.error("Failed to read trainer photos", e);
    cachedTrainerPhotos = {};
  }
  return cachedTrainerPhotos!;
}

function saveTrainerPhotosToStorage(photos: Record<string, string>) {
  cachedTrainerPhotos = photos;
  safeSetItem('drivingschool_trainer_photos', JSON.stringify(photos));
}

/**
 * Get the stored profile photo (Base64 string) for a student by their unique identifier (email, name, or Student ID).
 */
export function getStudentPhoto(identifier: string): string | null {
  if (!identifier) return null;
  const parsed = loadStudentPhotos();
  
  // 1. Direct lookup
  if (parsed[identifier]) return parsed[identifier];
  
  // 2. If it is an email, check if there's a matching name/ID
  if (identifier.includes('@')) {
    try {
      const savedStudents = localStorage.getItem('drivingschool_students_db') || localStorage.getItem('al_andalos_students_db');
      if (savedStudents) {
        const students = JSON.parse(savedStudents);
        if (Array.isArray(students)) {
          const match = students.find(s => s.email?.toLowerCase() === identifier.toLowerCase());
          if (match && match.name) {
            if (parsed[match.name]) return parsed[match.name];
            const id = getStudentId(match.name);
            if (parsed[id]) return parsed[id];
          }
        }
      }
    } catch (e) {}
  } else {
    // 3. If it is a name, check if there's a matching email
    try {
      const savedStudents = localStorage.getItem('drivingschool_students_db') || localStorage.getItem('al_andalos_students_db');
      if (savedStudents) {
        const students = JSON.parse(savedStudents);
        if (Array.isArray(students)) {
          const match = students.find(s => s.name?.toLowerCase() === identifier.toLowerCase());
          if (match && match.email && parsed[match.email]) {
            return parsed[match.email];
          }
        }
      }
    } catch (e) {}
    
    // 4. Try student ID derived from name
    const id = getStudentId(identifier);
    if (parsed[id]) return parsed[id];
  }

  // 5. Case-insensitive lookup
  const clean = (n: string) => n.toLowerCase().trim().replace(/[\s-_]/g, '');
  const targetClean = clean(identifier);
  for (const key of Object.keys(parsed)) {
    if (clean(key) === targetClean) {
      return parsed[key];
    }
  }

  return null;
}

/**
 * Save a profile photo (Base64 string) for a student by their unique identifier.
 */
export function saveStudentPhoto(identifier: string, photoBase64: string): void {
  if (!identifier || !photoBase64) return;
  const parsed = loadStudentPhotos();
  parsed[identifier] = photoBase64;
  
  try {
    const savedStudents = localStorage.getItem('drivingschool_students_db') || localStorage.getItem('al_andalos_students_db');
    if (savedStudents) {
      const students = JSON.parse(savedStudents);
      if (Array.isArray(students)) {
        if (identifier.includes('@')) {
          const match = students.find(s => s.email?.toLowerCase() === identifier.toLowerCase());
          if (match && match.name) {
            parsed[match.name] = photoBase64;
            const id = getStudentId(match.name);
            parsed[id] = photoBase64;
          }
        } else {
          const match = students.find(s => s.name?.toLowerCase() === identifier.toLowerCase());
          if (match && match.email) {
            parsed[match.email] = photoBase64;
          }
          const id = getStudentId(identifier);
          parsed[id] = photoBase64;
        }
      }
    }
  } catch (e) {}

  saveStudentPhotosToStorage(parsed);
}

/**
 * Delete a profile photo for a student by their unique identifier.
 */
export function deleteStudentPhoto(identifier: string): void {
  if (!identifier) return;
  const parsed = loadStudentPhotos();
  delete parsed[identifier];
  
  try {
    const savedStudents = localStorage.getItem('drivingschool_students_db') || localStorage.getItem('al_andalos_students_db');
    if (savedStudents) {
      const students = JSON.parse(savedStudents);
      if (Array.isArray(students)) {
        if (identifier.includes('@')) {
          const match = students.find(s => s.email?.toLowerCase() === identifier.toLowerCase());
          if (match && match.name) {
            delete parsed[match.name];
            const id = getStudentId(match.name);
            delete parsed[id];
          }
        } else {
          const match = students.find(s => s.name?.toLowerCase() === identifier.toLowerCase());
          if (match && match.email) {
            delete parsed[match.email];
          }
        }
      }
    }
  } catch (e) {}

  const id = getStudentId(identifier);
  delete parsed[id];

  const clean = (n: string) => n.toLowerCase().trim().replace(/[\s-_]/g, '');
  const targetClean = clean(identifier);
  for (const key of Object.keys(parsed)) {
    if (clean(key) === targetClean) {
      delete parsed[key];
    }
  }

  saveStudentPhotosToStorage(parsed);
}

/**
 * Get the stored profile photo (Base64 string) for a trainer by their unique email or name.
 * If no specific match is found, falls back to any saved trainer photo for single source of truth.
 */
export function getTrainerPhoto(emailOrName?: string): string | null {
  const parsed = loadTrainerPhotos();
  const keys = Object.keys(parsed);
  if (keys.length === 0) return null;

  if (!emailOrName) {
    return parsed[keys[0]];
  }

  if (parsed[emailOrName]) return parsed[emailOrName];
  
  if (emailOrName.includes('@')) {
    const namePart = emailOrName.split('@')[0];
    if (parsed[namePart]) return parsed[namePart];
  }

  // Case-insensitive clean match
  const clean = (n: string) => n.toLowerCase().trim().replace(/[\s-_]/g, '');
  const targetClean = clean(emailOrName);
  for (const key of keys) {
    if (clean(key) === targetClean) {
      return parsed[key];
    }
  }

  // Fallback to primary stored trainer photo (single source of truth)
  return parsed[keys[0]];
}

/**
 * Save a profile photo (Base64 string) for a trainer by their unique email or name.
 */
export function saveTrainerPhoto(emailOrName: string, photoBase64: string): void {
  if (!photoBase64) return;
  const parsed = loadTrainerPhotos();
  
  if (emailOrName) {
    parsed[emailOrName] = photoBase64;
    if (emailOrName.includes('@')) {
      const namePart = emailOrName.split('@')[0];
      parsed[namePart] = photoBase64;
    }
  }
  parsed['primary_trainer'] = photoBase64;

  saveTrainerPhotosToStorage(parsed);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('trainerPhotoUpdated', { detail: photoBase64 }));
    window.dispatchEvent(new Event('storage'));
  }
}

/**
 * Delete a profile photo for a trainer by their unique email or name.
 */
export function deleteTrainerPhoto(emailOrName?: string): void {
  cachedTrainerPhotos = {};
  saveTrainerPhotosToStorage({});

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('trainerPhotoUpdated', { detail: null }));
    window.dispatchEvent(new Event('storage'));
  }
}

/**
 * Compress a Base64 image using HTML Canvas.
 */
export function compressImage(base64Str: string, callback: (compressed: string) => void): void {
  if (typeof window === 'undefined' || !base64Str || !base64Str.startsWith('data:image')) {
    callback(base64Str);
    return;
  }
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const MAX_WIDTH = 120;
    const MAX_HEIGHT = 120;
    let width = img.width;
    let height = img.height;

    if (width > height) {
      if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
      }
    } else {
      if (height > MAX_HEIGHT) {
        width *= MAX_HEIGHT / height;
        height = MAX_HEIGHT;
      }
    }
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, width, height);
      try {
        const compressed = canvas.toDataURL('image/jpeg', 0.6);
        callback(compressed);
      } catch (e) {
        callback(base64Str);
      }
    } else {
      callback(base64Str);
    }
  };
  img.onerror = () => {
    callback(base64Str);
  };
  img.src = base64Str;
}

/**
 * Get initials of a student's name for the default avatar.
 */
export function getStudentInitials(name: string): string {
  if (!name) return "ST";
  // Filter out non-alphabetic characters if any to get clean letters
  const cleanedName = name.replace(/[^\p{L}\s]/gu, '').trim();
  const parts = cleanedName.split(/\s+/);
  if (parts.length >= 2) {
    const first = parts[0][0] || '';
    const last = parts[parts.length - 1][0] || '';
    return (first + last).toUpperCase();
  }
  return name.substring(0, Math.min(2, name.length)).toUpperCase();
}
