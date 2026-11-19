import type { BaseDocument, ImageAsset } from "./index";

export type PromotionType = "banner" | "offer" | "campaign";

export type PromotionTargetType = "product" | "category" | "none";

export interface Promotion extends BaseDocument {
  title: string;
  description: string;

  image: ImageAsset;

  type: PromotionType;

  targetType: PromotionTargetType;
  targetId: string | null;

  ctaText: string;
  ctaLink: string;

  startDate: import("firebase/firestore").Timestamp | null;
  endDate: import("firebase/firestore").Timestamp | null;

  active: boolean;
  sortOrder: number;
}

export type PromotionInput = Omit<Promotion, "createdAt" | "updatedAt">;
