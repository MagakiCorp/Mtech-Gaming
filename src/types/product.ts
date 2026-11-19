import type { BaseDocument, ImageAsset, SEO } from "./index";

export type PricingType = "fixed" | "range" | "on_request";

export type ProductAvailability =
  | "in_stock"
  | "out_of_stock"
  | "pre_order"
  | "discontinued";

export interface ProductPricing {
  type: PricingType;
  min: number | null;
  max: number | null;
  currency: "KES";
}

export interface Product extends BaseDocument {
  name: string;
  slug: string;
  description: string;

  categoryId: string;
  brand: string;

  pricing: ProductPricing;

  images: {
    main: ImageAsset;
    gallery: ImageAsset[];
  };

  specifications: {
    name: string;
    value: string;
  }[];

  availability: ProductAvailability;

  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;

  active: boolean;
  sortOrder: number;

  seo: SEO;
}

export type ProductInput = Omit<Product, "createdAt" | "updatedAt">;
