import React from 'react';
import { DRIVING_CATEGORIES, DrivingCategory } from './index';
import { Car, Motorbike, Truck, Bus, Tractor } from 'lucide-react';
const CATEGORY_ICONS = { B: Car, A: Motorbike, AM: Motorbike, C: Truck, D: Bus, T: Tractor };
export function CategoryIcon({ category }: { category: DrivingCategory }) { const Icon = CATEGORY_ICONS[category]; return <Icon size={20} aria-hidden="true" />; }
import type { Language } from '../types';

export function CategorySelect({ value, onChange, categories, lang, includeAll = false, showSingle = false }: {
  value: DrivingCategory | ''; onChange: (value: DrivingCategory | '') => void;
  categories: DrivingCategory[]; lang: Language; includeAll?: boolean; showSingle?: boolean;
}) {
  if (!showSingle && categories.length <= 1) return null;
  return <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-200">
    {lang === 'ar' ? 'فئة التدريب' : lang === 'nl' ? 'Rijbewijscategorie' : 'Driving category'}
    <span className="relative mt-2 block">
      {value && <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-current"><CategoryIcon category={value} /></span>}
    <select value={value} onChange={e => onChange(e.target.value as DrivingCategory | '')} className="w-full rounded-xl border border-slate-200 bg-white p-3 ps-11 text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white">
      {includeAll && <option value="">{lang === 'ar' ? 'كل الفئات' : lang === 'nl' ? 'Alle categorieën' : 'All categories'}</option>}
      {categories.map(code => <option key={code} value={code}>{DRIVING_CATEGORIES[code].name[lang]}</option>)}
    </select>
    </span>
  </label>;
}
export function CategoryBadge({ category, lang }: { category?: DrivingCategory; lang: Language }) {
  if (!category || category === 'B') return null;
  return <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700 dark:bg-zinc-800 dark:text-zinc-200"><CategoryIcon category={category} />{DRIVING_CATEGORIES[category]?.name[lang]}</span>;
}
