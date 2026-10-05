import React from 'react';
import { DRIVING_CATEGORIES, DrivingCategory } from './index';
import type { Language } from '../types';

export function CategorySelect({ value, onChange, categories, lang, includeAll = false }: {
  value: DrivingCategory | ''; onChange: (value: DrivingCategory | '') => void;
  categories: DrivingCategory[]; lang: Language; includeAll?: boolean;
}) {
  if (categories.length <= 1) return null;
  return <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-200">
    {lang === 'ar' ? 'فئة التدريب' : lang === 'nl' ? 'Rijbewijscategorie' : 'Driving category'}
    <select value={value} onChange={e => onChange(e.target.value as DrivingCategory | '')} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white">
      {includeAll && <option value="">{lang === 'ar' ? 'كل الفئات' : lang === 'nl' ? 'Alle categorieën' : 'All categories'}</option>}
      {categories.map(code => <option key={code} value={code}>{DRIVING_CATEGORIES[code].name[lang]}</option>)}
    </select>
  </label>;
}
export function CategoryBadge({ category, lang }: { category?: DrivingCategory; lang: Language }) {
  if (!category || category === 'B') return null;
  return <span className="inline-flex rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700 dark:bg-zinc-800 dark:text-zinc-200">{DRIVING_CATEGORIES[category]?.name[lang]}</span>;
}
