import { VacationModeSettings } from '../types';

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if vacation mode is currently enabled and the current date is not past the end date.
 */
export function isVacationModeActive(vacationMode?: VacationModeSettings): boolean {
  if (!vacationMode || !vacationMode.enabled) return false;
  if (!vacationMode.startDate || !vacationMode.endDate) return false;
  
  const today = getTodayDateString();
  return today <= vacationMode.endDate;
}

/**
 * Checks if a specific date (YYYY-MM-DD) falls within the instructor's active vacation period.
 */
export function isDateInVacationRange(dateStr: string, vacationMode?: VacationModeSettings): boolean {
  if (!vacationMode || !vacationMode.enabled) return false;
  if (!vacationMode.startDate || !vacationMode.endDate) return false;
  
  return dateStr >= vacationMode.startDate && dateStr <= vacationMode.endDate;
}

/**
 * Returns a user-friendly error message when booking falls during vacation mode.
 */
export function getVacationBlockedMessage(lang: 'ar' | 'nl' | 'en' = 'en', vacationMode?: VacationModeSettings): string {
  const endDateFormatted = vacationMode?.endDate || '';
  if (lang === 'ar') {
    return `المدرب غير متاح حالياً بسبب الإجازة${vacationMode?.note ? ` (${vacationMode.note})` : ''}. يرجى اختيار تاريخ آخر متاح بعد ${endDateFormatted || 'فترة الإجازة'}.`;
  }
  if (lang === 'nl') {
    return `De instructeur is momenteel niet beschikbaar vanwege vakantie${vacationMode?.note ? ` (${vacationMode.note})` : ''}. Kies een andere beschikbare datum na ${endDateFormatted || 'de vakantieperiode'}.`;
  }
  return `The instructor is currently unavailable due to vacation${vacationMode?.note ? ` (${vacationMode.note})` : ''}. Please choose another available date after ${endDateFormatted || 'the selected vacation period'}.`;
}
