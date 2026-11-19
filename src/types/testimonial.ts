import type { BaseDocument, ImageAsset } from "./index";

export interface Testimonial extends BaseDocument {
  customerName: string;
  message: string;

  rating: number;

  image: ImageAsset | null;

  approved: boolean;
  active: boolean;

  sortOrder: number;
}

export type TestimonialInput = Omit<Testimonial, "createdAt" | "updatedAt">;
