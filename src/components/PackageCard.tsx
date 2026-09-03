import React from 'react';
import { DrivePackage, Language } from '../types';
import { Check, Clock } from 'lucide-react';

interface PackageCardProps {
  pkg: DrivePackage;
  isSelected?: boolean;
  onSelect?: () => void;
  lang?: Language;
  isNoPackage?: boolean;
  hourlyRate?: number;
  actionButtons?: React.ReactNode; // For admin edit/delete controls
}

export const PackageCard: React.FC<PackageCardProps> = ({
  pkg,
  isSelected = false,
  onSelect,
  lang = 'en',
  isNoPackage = false,
  hourlyRate = 65,
  actionButtons
}) => {
  const isArabic = lang === 'ar';
  const isDutch = lang === 'nl';

  // Highlight badge determination
  const isPopular = pkg.popular || pkg.badge?.toLowerCase().includes('popular') || pkg.badge?.includes('الأكثر');
  const isRecommended = pkg.recommended || pkg.badge?.toLowerCase().includes('recommended') || pkg.badge?.toLowerCase().includes('best value') || pkg.badge?.includes('موصى');

  // Dynamic feature determination: respect trainer configuration 100%
  const getFeatures = (): string[] => {
    if (Array.isArray(pkg.features)) {
      return pkg.features;
    }

    if (isNoPackage) {
      if (isArabic) {
        return [
          `الدفع حسب الاستخدام (€${hourlyRate}/ساعة)`,
          'جدولة مرنة بدون التزام بحزمة كاملة',
          'مدرب معتمد وتدريب فردي 1-على-1',
          'تتبع مباشر لمستوى الجاهزية والتقدم'
        ];
      } else if (isDutch) {
        return [
          `Betaal per losse les (€${hourlyRate}/uur)`,
          'Flexibel inplannen zonder pakketverplichting',
          'Gecertificeerde instructeur (1-op-1)',
          'Digitale voortgangs- & paraatheidstracker'
        ];
      }
      return [
        `Pay-as-you-go rate (€${hourlyRate}/hour)`,
        'Flexible scheduling without upfront commitment',
        'Certified 1-on-1 driving instructor',
        'Digital progress & readiness tracking'
      ];
    }

    return [];
  };

  const features = getFeatures();

  // Price calculations
  const perHourPrice = isNoPackage ? hourlyRate : Math.round(pkg.price / (pkg.hours || 1));

  // Determine standard 6 curated themes
  const getThemeClasses = () => {
    const t = (pkg.colorTheme || 'classic-blue').toLowerCase();

    let baseTheme = {
      card: 'bg-gradient-to-b from-slate-900 via-sky-950 to-slate-950 text-white border-2 border-sky-500/60 shadow-xl shadow-sky-950/40 hover:border-sky-400 hover:shadow-sky-500/20 hover:-translate-y-1.5',
      badge: 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 text-white font-black shadow-lg shadow-sky-500/30',
      priceTag: 'text-sky-400',
      checkBg: 'bg-sky-500/20 border border-sky-400/40 text-sky-300',
      gradientOverlay: 'from-sky-500/15 via-blue-500/5 to-transparent',
      ringColor: 'ring-sky-400 shadow-sky-500/40'
    };

    // 1. Classic Blue
    if (t === 'classic-blue' || t === 'blue') {
      baseTheme = {
        card: 'bg-gradient-to-b from-slate-900 via-sky-950 to-slate-950 text-white border-2 border-sky-500/60 shadow-xl shadow-sky-950/40 hover:border-sky-400 hover:shadow-sky-500/20 hover:-translate-y-1.5',
        badge: 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 text-white font-black shadow-lg shadow-sky-500/30',
        priceTag: 'text-sky-400',
        checkBg: 'bg-sky-500/20 border border-sky-400/40 text-sky-300',
        gradientOverlay: 'from-sky-500/15 via-blue-500/5 to-transparent',
        ringColor: 'ring-sky-400 shadow-sky-500/40'
      };
    } else if (t === 'premium-gold' || t === 'amber' || t === 'gold') {
      // 2. Premium Gold
      baseTheme = {
        card: 'bg-gradient-to-b from-slate-950 via-amber-950/90 to-slate-950 text-white border-2 border-amber-500/70 shadow-2xl shadow-amber-950/50 hover:border-amber-400 hover:shadow-amber-500/25 hover:-translate-y-1.5',
        badge: 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-slate-950 font-black shadow-lg shadow-amber-500/30',
        priceTag: 'text-amber-400',
        checkBg: 'bg-amber-500/20 border border-amber-400/40 text-amber-300',
        gradientOverlay: 'from-amber-500/20 via-yellow-500/5 to-transparent',
        ringColor: 'ring-amber-400 shadow-amber-500/40'
      };
    } else if (t === 'emerald-green' || t === 'emerald' || t === 'green') {
      // 3. Emerald Green
      baseTheme = {
        card: 'bg-gradient-to-b from-slate-950 via-emerald-950/90 to-slate-950 text-white border-2 border-emerald-500/60 shadow-xl shadow-emerald-950/40 hover:border-emerald-400 hover:shadow-emerald-500/20 hover:-translate-y-1.5',
        badge: 'bg-gradient-to-r from-emerald-400 via-teal-500 to-green-600 text-slate-950 font-black shadow-lg shadow-emerald-500/30',
        priceTag: 'text-emerald-400',
        checkBg: 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300',
        gradientOverlay: 'from-emerald-500/15 via-teal-500/5 to-transparent',
        ringColor: 'ring-emerald-400 shadow-emerald-500/40'
      };
    } else if (t === 'royal-purple' || t === 'violet' || t === 'purple' || t === 'indigo') {
      // 4. Royal Purple
      baseTheme = {
        card: 'bg-gradient-to-b from-slate-950 via-purple-950/90 to-slate-950 text-white border-2 border-purple-500/60 shadow-xl shadow-purple-950/40 hover:border-purple-400 hover:shadow-purple-500/20 hover:-translate-y-1.5',
        badge: 'bg-gradient-to-r from-violet-400 via-purple-500 to-indigo-600 text-white font-black shadow-lg shadow-purple-500/30',
        priceTag: 'text-purple-300',
        checkBg: 'bg-purple-500/20 border border-purple-400/40 text-purple-300',
        gradientOverlay: 'from-purple-500/15 via-indigo-500/5 to-transparent',
        ringColor: 'ring-purple-400 shadow-purple-500/40'
      };
    } else if (t === 'carbon-black' || t === 'carbon' || t === 'black') {
      // 5. Carbon Black
      baseTheme = {
        card: 'bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-white border-2 border-zinc-700/80 shadow-xl shadow-black/60 hover:border-zinc-500 hover:shadow-2xl hover:-translate-y-1.5',
        badge: 'bg-gradient-to-r from-zinc-200 via-zinc-400 to-slate-300 text-zinc-950 font-black shadow-lg shadow-zinc-400/20',
        priceTag: 'text-zinc-100',
        checkBg: 'bg-zinc-800 border border-zinc-700 text-zinc-300',
        gradientOverlay: 'from-zinc-500/10 via-zinc-800/10 to-transparent',
        ringColor: 'ring-zinc-400 shadow-zinc-500/40'
      };
    } else {
      // 6. Modern Silver (Default Light/Dark Card)
      baseTheme = {
        card: 'bg-white dark:bg-zinc-900/95 text-slate-900 dark:text-slate-100 border-2 border-slate-300 dark:border-zinc-700 shadow-xl hover:shadow-2xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:-translate-y-1.5',
        badge: 'bg-gradient-to-r from-slate-200 to-slate-300 dark:from-zinc-800 dark:to-zinc-700 text-slate-800 dark:text-slate-200 font-extrabold border border-slate-300 dark:border-zinc-600',
        priceTag: 'text-slate-900 dark:text-white',
        checkBg: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300',
        gradientOverlay: 'from-slate-400/10 via-transparent to-transparent',
        ringColor: 'ring-indigo-500 shadow-indigo-500/40'
      };
    }

    if (isSelected) {
      baseTheme.card += ` ring-4 ${baseTheme.ringColor} scale-[1.02] -translate-y-1`;
    }

    return baseTheme;
  };

  const theme = getThemeClasses();
  const themeKey = (pkg.colorTheme || 'classic-blue').toLowerCase();
  const isDarkCard = !isSelected && (themeKey !== 'modern-silver' && themeKey !== 'silver' && themeKey !== 'slate');

  // Localized badge title fallback
  const getBadgeText = () => {
    if (pkg.badge && pkg.badge.trim()) return pkg.badge;
    if (isNoPackage) {
      return isArabic ? 'خيارات مرنة' : isDutch ? 'Losse Lessen' : 'Pay As You Go';
    }
    if (isPopular) {
      return isArabic ? 'الأكثر شعبية' : isDutch ? 'Meest Populair' : 'Most Popular';
    }
    if (isRecommended) {
      return isArabic ? 'موصى به' : isDutch ? 'Aanbevolen' : 'Recommended';
    }
    return '';
  };

  const badgeText = getBadgeText();

  return (
    <div
      onClick={onSelect}
      className={`relative rounded-3xl transition-all duration-300 select-none flex flex-col justify-between overflow-hidden group p-6 ${
        onSelect ? 'cursor-pointer' : ''
      } ${theme.card}`}
    >
      {/* Background Subtle Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradientOverlay} pointer-events-none`} />

      {/* Top Banner / Selection Badge */}
      <div className="relative z-10 flex items-start justify-between gap-3 mb-4">
        <div className="space-y-1 pr-2">
          {/* Badge Tag */}
          {badgeText && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${theme.badge}`}>
                {badgeText}
              </span>
            </div>
          )}

          {/* Title */}
          <h4 className={`text-xl font-black tracking-tight mt-2 ${isDarkCard ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
            {pkg.name}
          </h4>
        </div>

        {/* Selection Indicator Checkmark */}
        {onSelect && (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${theme.checkBg}`}>
            {isSelected ? (
              <Check className="w-5 h-5 stroke-[3]" />
            ) : (
              <div className="w-3 h-3 rounded-full border-2 border-current opacity-40 group-hover:opacity-100" />
            )}
          </div>
        )}
      </div>

      {/* Description */}
      <p className={`relative z-10 text-xs mb-5 leading-relaxed line-clamp-2 ${
        isDarkCard ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
      }`}>
        {pkg.description}
      </p>

      {/* Main Price & Lesson Metric Display */}
      <div className={`relative z-10 p-4 rounded-2xl mb-5 transition-colors ${
        isDarkCard 
          ? 'bg-slate-800/80 border border-slate-700/60' 
          : 'bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800/80'
      }`}>
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-3xl font-black tracking-tight font-sans ${theme.priceTag}`}>
                €{pkg.price}
              </span>
              {pkg.discountPrice && (
                <span className="text-xs text-slate-400 line-through font-medium">
                  €{pkg.discountPrice}
                </span>
              )}
            </div>

            <p className={`text-[10px] font-semibold mt-0.5 ${
              isDarkCard ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'
            }`}>
              {isNoPackage 
                ? (isArabic ? 'السعر لكل ساعة تدريبية' : isDutch ? 'per lesuur' : 'per hour rate')
                : (isArabic ? `حوالي €${perHourPrice} / الساعة` : isDutch ? `ca. €${perHourPrice} / uur` : `approx. €${perHourPrice} / hour`)}
            </p>
          </div>

          {/* Hours Counter Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black font-mono border ${
            isDarkCard 
              ? 'bg-indigo-950/70 border-indigo-500/40 text-indigo-300' 
              : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200'
          }`}>
            <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>
              {isNoPackage 
                ? (isArabic ? 'ساعة واحدة' : isDutch ? '1 Uur' : '1 Hour') 
                : `${pkg.hours} ${isArabic ? 'ساعة' : isDutch ? 'uur' : 'Hours'}`}
            </span>
          </div>
        </div>
      </div>

      {/* Included Features List */}
      <div className="relative z-10 space-y-2.5 mb-6 flex-1">
        <p className={`text-[11px] font-extrabold uppercase tracking-wider ${
          isDarkCard ? 'text-indigo-300/90' : 'text-slate-400 dark:text-zinc-500'
        }`}>
          {isArabic ? 'المنافع المشمولة بالباقة:' : isDutch ? 'Inbegrepen pakketvoordelen:' : 'Included Package Benefits:'}
        </p>

        {features.length === 0 ? (
          <p className="text-xs text-slate-400 italic">
            {isArabic ? 'لا توجد مميزات مخصصة مدونة' : isDutch ? 'Geen specifieke voordelen vermeld' : 'No custom features specified'}
          </p>
        ) : (
          <ul className="space-y-2">
            {features.map((feat, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs">
                <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                  isDarkCard ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                }`}>
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span className={`leading-snug ${
                  isDarkCard ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {feat}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Optional Action Controls (e.g. for Trainer Edit or Select button) */}
      {actionButtons && (
        <div className="relative z-10 pt-4 border-t border-slate-200/60 dark:border-zinc-800/60 mt-auto flex items-center gap-2">
          {actionButtons}
        </div>
      )}
    </div>
  );
};

