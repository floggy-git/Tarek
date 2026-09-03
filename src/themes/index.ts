export interface ThemeDefinition {
  id: 'classic-blue' | 'emerald' | 'graphite' | 'sunset';
  nameEn: string;
  nameNl: string;
  nameAr: string;
  descriptionEn: string;
  descriptionNl: string;
  descriptionAr: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  card: string;
  border: string;
  button: string;
  success: string;
  warning: string;
  error: string;
  textColor: string;
  previewGradient: string;
  badgeBg: string;
  badgeText: string;
}

export const BUILTIN_THEMES: Record<string, ThemeDefinition> = {
  'classic-blue': {
    id: 'classic-blue',
    nameEn: 'Classic Blue',
    nameNl: 'Klassiek Blauw',
    nameAr: 'الأزرق الكلاسيكي',
    descriptionEn: 'Professional blue tone used throughout standard CBR certified schools',
    descriptionNl: 'Professioneel blauw thema, ideaal voor CBR gecertificeerde rijscholen',
    descriptionAr: 'المظهر الأزرق الرسمي والاحترافي المعتمد لمداارس القيادة',
    primary: '#2563eb', // blue-600
    secondary: '#0284c7', // sky-600
    accent: '#f59e0b', // amber-500
    background: '#f8fafc', // slate-50
    card: '#ffffff',
    border: '#e2e8f0', // slate-200
    button: '#2563eb',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    textColor: '#0f172a',
    previewGradient: 'from-blue-600 via-sky-500 to-indigo-600',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/50',
    badgeText: 'text-blue-600 dark:text-blue-400'
  },
  'emerald': {
    id: 'emerald',
    nameEn: 'Emerald Green',
    nameNl: 'Smaragd Groen',
    nameAr: 'الزمردي الأخضر',
    descriptionEn: 'Fresh green accents with clean educational aesthetic',
    descriptionNl: 'Fris groen thema met een heldere educatieve uitstraling',
    descriptionAr: 'لمسات خضراء عصرية تمنح طابعاً تعليمياً متجدداً',
    primary: '#059669', // emerald-600
    secondary: '#0d9488', // teal-600
    accent: '#eab308', // yellow-500
    background: '#f0fdf4', // emerald-50/20
    card: '#ffffff',
    border: '#d1fae5',
    button: '#059669',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    textColor: '#064e3b',
    previewGradient: 'from-emerald-600 via-teal-500 to-green-600',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    badgeText: 'text-emerald-600 dark:text-emerald-400'
  },
  'graphite': {
    id: 'graphite',
    nameEn: 'Graphite Corporate',
    nameNl: 'Grafiet Zakelijk',
    nameAr: 'الجرافيت الفاخر',
    descriptionEn: 'Dark charcoal & mineral grey premium executive theme',
    descriptionNl: 'Donker houtskool & mineraalgrijs zakelijk premium thema',
    descriptionAr: 'طابع فاخر بدرجات الفحم والجرافيت العصري',
    primary: '#374151', // gray-700
    secondary: '#4b5563', // gray-600
    accent: '#6366f1', // indigo-500
    background: '#f9fafb', // gray-50
    card: '#ffffff',
    border: '#e5e7eb',
    button: '#1f2937',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    textColor: '#111827',
    previewGradient: 'from-gray-800 via-slate-700 to-zinc-900',
    badgeBg: 'bg-slate-100 dark:bg-zinc-800',
    badgeText: 'text-slate-700 dark:text-zinc-200'
  },
  'sunset': {
    id: 'sunset',
    nameEn: 'Sunset Orange',
    nameNl: 'Zonsondergang Oranje',
    nameAr: 'البرتقالي الدافئ',
    descriptionEn: 'Warm amber & vibrant orange accents with high contrast',
    descriptionNl: 'Warme amber & dynamische oranje accenten met hoog contrast',
    descriptionAr: 'لمسات برتقالية ودافئة مع تباين عصري قوي',
    primary: '#ea580c', // orange-600
    secondary: '#d97706', // amber-600
    accent: '#8b5cf6', // violet-500
    background: '#fff7ed', // orange-50/20
    card: '#ffffff',
    border: '#ffedd5',
    button: '#ea580c',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    textColor: '#431407',
    previewGradient: 'from-orange-600 via-amber-500 to-red-500',
    badgeBg: 'bg-orange-50 dark:bg-orange-950/50',
    badgeText: 'text-orange-600 dark:text-orange-400'
  }
};

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length !== 6) return null;
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

export function adjustColorBrightness(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const p = percent / 100;
  const r = Math.round(Math.min(255, Math.max(0, rgb.r + (p < 0 ? rgb.r * p : (255 - rgb.r) * p))));
  const g = Math.round(Math.min(255, Math.max(0, rgb.g + (p < 0 ? rgb.g * p : (255 - rgb.g) * p))));
  const b = Math.round(Math.min(255, Math.max(0, rgb.b + (p < 0 ? rgb.b * p : (255 - rgb.b) * p))));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function getTheme(themeId?: string): ThemeDefinition {
  if (themeId && BUILTIN_THEMES[themeId]) {
    return BUILTIN_THEMES[themeId];
  }
  return BUILTIN_THEMES['classic-blue'];
}

/**
 * Dynamically applies theme CSS custom properties to document root.
 * Updates colors instantly across Header, Sidebar, Cards, Buttons, Inputs, etc.
 */
export function applyThemeToDocument(themeId?: string, customPrimary?: string, customSecondary?: string, customAccent?: string) {
  if (typeof document === 'undefined') return;
  const theme = getTheme(themeId);
  const root = document.documentElement;

  const primary = customPrimary || theme.primary;
  const secondary = customSecondary || theme.secondary;
  const accent = customAccent || theme.accent;

  const primaryRgb = hexToRgb(primary) || { r: 37, g: 99, b: 235 };
  const secondaryRgb = hexToRgb(secondary) || { r: 2, g: 132, b: 199 };
  const accentRgb = hexToRgb(accent) || { r: 245, g: 158, b: 11 };

  root.style.setProperty('--color-primary', primary);
  root.style.setProperty('--color-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
  root.style.setProperty('--color-primary-hover', adjustColorBrightness(primary, -15));
  root.style.setProperty('--color-primary-light', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.1)`);
  root.style.setProperty('--color-primary-border', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.25)`);

  root.style.setProperty('--color-secondary', secondary);
  root.style.setProperty('--color-secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);
  root.style.setProperty('--color-secondary-hover', adjustColorBrightness(secondary, -15));

  root.style.setProperty('--color-accent', accent);
  root.style.setProperty('--color-accent-rgb', `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`);

  root.style.setProperty('--color-bg', theme.background);
  root.style.setProperty('--color-card', theme.card);
  root.style.setProperty('--color-border', theme.border);
  root.style.setProperty('--color-button', theme.button || primary);
  root.style.setProperty('--color-success', theme.success);
  root.style.setProperty('--color-warning', theme.warning);
  root.style.setProperty('--color-error', theme.error);
  
  // Also store active theme dataset attribute for CSS selector hooks if needed
  root.dataset.theme = theme.id;
}
