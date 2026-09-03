/**
 * AL-ANDALOS DRIVING SCHOOL DESIGN SYSTEM
 * Inspired by Apple Wallet, Revolut, Linear & Stripe.
 *
 * Single Accent Palette: Al-Andalos Light Blue (#2563EB / #3B82F6)
 * Icon Family: Phosphor Icons (@phosphor-icons/react)
 */

export const DESIGN_SYSTEM = {
  colors: {
    brand: {
      primary: '#2563EB', // Light mode primary blue
      darkPrimary: '#3B82F6', // Dark mode primary blue
      lightTint: 'bg-blue-500/8 dark:bg-blue-400/10',
      borderTint: 'border-blue-500/15 dark:border-blue-400/20',
      text: 'text-blue-600 dark:text-blue-400',
    },
    neutral: {
      bgMain: 'bg-slate-50/50 dark:bg-zinc-950',
      cardBg: 'bg-white dark:bg-zinc-900',
      cardSubBg: 'bg-slate-50/80 dark:bg-zinc-950/60',
      border: 'border-slate-200/70 dark:border-zinc-800/80',
      borderHover: 'hover:border-slate-300 dark:hover:border-zinc-700',
      textPrimary: 'text-slate-900 dark:text-white',
      textSecondary: 'text-slate-500 dark:text-zinc-400',
      textMuted: 'text-slate-400 dark:text-zinc-500',
    }
  },
  
  shadows: {
    card: 'shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none',
    cardHover: 'shadow-[0_6px_20px_rgba(0,0,0,0.06)] dark:shadow-none',
    nav: 'shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-none',
    button: 'shadow-sm shadow-blue-600/20',
  },

  radii: {
    squircle: 'rounded-2xl',
    card: 'rounded-2xl sm:rounded-3xl',
    button: 'rounded-xl sm:rounded-2xl',
    pill: 'rounded-full',
  },

  iconContainer: {
    sm: 'w-8 h-8 rounded-xl bg-blue-500/8 dark:bg-blue-400/10 border border-blue-500/15 dark:border-blue-400/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0',
    md: 'w-9 h-9 rounded-xl sm:rounded-2xl bg-blue-500/8 dark:bg-blue-400/10 border border-blue-500/15 dark:border-blue-400/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0',
    lg: 'w-10 h-10 rounded-2xl bg-blue-500/8 dark:bg-blue-400/10 border border-blue-500/15 dark:border-blue-400/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0',
  }
};
