import type { PromotionType, PromotionTargetType, ImageAsset } from "./index";

export interface AdminPromotion {
  id: string;
  title: string;
  description: string;
  image: ImageAsset;
  type: PromotionType;
  targetType: PromotionTargetType;
  targetId: string | null;
  targetName: string;
  ctaText: string;
  ctaLink: string;
  startDate: string | null;
  endDate: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string | null;
}
