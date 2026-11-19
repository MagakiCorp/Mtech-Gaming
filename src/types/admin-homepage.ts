import type { ProductAvailability, PromotionType } from "./index";

export interface HomepageProductOption {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  availability: ProductAvailability;
  active: boolean;
}

export interface HomepagePromotionOption {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  type: PromotionType;
  active: boolean;
}
