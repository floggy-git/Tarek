import { TRANSLATIONS } from '../types';

/**
 * Get the stored profile photo (Base64 string) for a student by their name.
 * Fallback to localStorage if not found directly in the user object.
 */
export function getStudentPhoto(studentName: string): string | null {
  if (!studentName) return null;
  try {
    // 1. Check in localStorage
    const photos = localStorage.getItem('al_andalos_student_photos');
    if (photos) {
      const parsed = JSON.parse(photos);
      // Try exact name or lowercase trimmed match
      const exactMatch = parsed[studentName];
      if (exactMatch) return exactMatch;

      const clean = (n: string) => n.toLowerCase().trim().replace(/[\s-_]/g, '');
      const targetClean = clean(studentName);
      for (const key of Object.keys(parsed)) {
        if (clean(key) === targetClean) {
          return parsed[key];
        }
      }
    }
  } catch (e) {
    console.error("Failed to read student photos from localStorage", e);
  }
  return null;
}

/**
 * Save a profile photo (Base64 string) for a student by their name.
 */
export function saveStudentPhoto(studentName: string, photoBase64: string): void {
  if (!studentName || !photoBase64) return;
  try {
    const photos = localStorage.getItem('al_andalos_student_photos');
    const parsed = photos ? JSON.parse(photos) : {};
    parsed[studentName] = photoBase64;
    localStorage.setItem('al_andalos_student_photos', JSON.stringify(parsed));
  } catch (e) {
    console.error("Failed to save student photo to localStorage", e);
  }
}

/**
 * Delete a profile photo for a student by their name.
 */
export function deleteStudentPhoto(studentName: string): void {
  if (!studentName) return;
  try {
    const photos = localStorage.getItem('al_andalos_student_photos');
    if (photos) {
      const parsed = JSON.parse(photos);
      // Delete exact match
      delete parsed[studentName];

      // Delete normalized match as well
      const clean = (n: string) => n.toLowerCase().trim().replace(/[\s-_]/g, '');
      const targetClean = clean(studentName);
      for (const key of Object.keys(parsed)) {
        if (clean(key) === targetClean) {
          delete parsed[key];
        }
      }
      localStorage.setItem('al_andalos_student_photos', JSON.stringify(parsed));
    }
  } catch (e) {
    console.error("Failed to delete student photo from localStorage", e);
  }
}

/**
 * Get initials of a student's name for the default avatar.
 */
export function getStudentInitials(name: string): string {
  if (!name) return "ST";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    const first = parts[0][0] || '';
    const last = parts[parts.length - 1][0] || '';
    return (first + last).toUpperCase();
  }
  return name.substring(0, Math.min(2, name.length)).toUpperCase();
}
