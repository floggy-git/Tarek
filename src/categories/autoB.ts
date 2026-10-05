import { DrivingCategoryDefinition } from './types';

export const AUTO_B: DrivingCategoryDefinition = {
  code: 'B',
  slug: 'auto-b',
  name: { en: 'Auto (B)', nl: 'Auto (B)', ar: 'السيارة (B)' },
  vehicleLabel: { en: 'Car', nl: 'Auto', ar: 'سيارة' },
  icon: 'car',
  defaultLessonDuration: 1,
  isBaseCategory: true
};
