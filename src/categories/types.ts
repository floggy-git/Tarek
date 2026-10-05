export type DrivingCategory = 'B' | 'A' | 'AM' | 'C' | 'D' | 'T';

export type CategorySubscriptionStatus = 'active' | 'inactive' | 'pending' | 'expired';

export interface CategorySubscription {
  category: DrivingCategory;
  status: CategorySubscriptionStatus;
  startsAt?: string;
  endsAt?: string;
  planId?: string;
  invoiceId?: string;
  notes?: string;
  lessonPricePerHour?: number;
}

export interface DrivingCategoryDefinition {
  code: DrivingCategory;
  slug: string;
  name: { en: string; nl: string; ar: string };
  vehicleLabel: { en: string; nl: string; ar: string };
  icon: string;
  defaultLessonDuration: number;
  isBaseCategory?: boolean;
}
