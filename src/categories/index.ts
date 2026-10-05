import { AUTO_B } from './autoB';
import { MOTOR_A } from './motorA';
import { BROMFIETS_AM } from './bromfietsAM';
import { VRACHTAUTO_C } from './vrachtautoC';
import { BUS_D } from './busD';
import { TRACTOR_T } from './tractorT';
import { DrivingCategory, DrivingCategoryDefinition } from './types';

export * from './types';
export { AUTO_B, MOTOR_A, BROMFIETS_AM, VRACHTAUTO_C, BUS_D, TRACTOR_T };

export const DRIVING_CATEGORIES: Record<DrivingCategory, DrivingCategoryDefinition> = {
  B: AUTO_B,
  A: MOTOR_A,
  AM: BROMFIETS_AM,
  C: VRACHTAUTO_C,
  D: BUS_D,
  T: TRACTOR_T,
};

export const DRIVING_CATEGORY_ORDER: DrivingCategory[] = ['B', 'A', 'AM', 'C', 'D', 'T'];
