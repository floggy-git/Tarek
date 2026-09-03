import React from 'react';
import { Calendar } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  lang?: string;
  placeholder?: string;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  disabled = false,
  lang = 'en',
  placeholder,
  className = '',
}) => {
  // Format the date based on language to match the active locale
  const getFormattedDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      if (!year || !month || !day) return dateStr;
      const localDate = new Date(year, month - 1, day);
      if (isNaN(localDate.getTime())) return dateStr;

      if (lang === 'ar') {
        return localDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
      } else if (lang === 'nl') {
        return localDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
      } else {
        return localDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch (e) {
      return dateStr;
    }
  };

  const defaultPlaceholder = lang === 'ar' 
    ? 'اختر تاريخاً...' 
    : lang === 'nl' 
    ? 'Kies een datum...' 
    : 'Select a date...';

  const displayPlaceholder = placeholder || defaultPlaceholder;

  return (
    <div className={`relative w-full ${disabled ? 'opacity-50' : ''}`}>
      {/* Visual styled box that matches the existing input styling exactly */}
      <div
        className={`w-full h-8 px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white transition-all duration-150 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 ${className}`}
      >
        <span className={value ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-zinc-500'}>
          {value ? getFormattedDate(value) : displayPlaceholder}
        </span>
        <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
      </div>

      {/* Fully interactive, overlaying hidden native date input */}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed text-xs"
        style={{ colorScheme: 'dark light' }}
      />
    </div>
  );
};
