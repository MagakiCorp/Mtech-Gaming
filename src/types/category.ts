import type { BaseDocument, ImageAsset, SEO } from "./index";

export interface Category extends BaseDocument {
  name: string;
  slug: string;
  description: string;

  image: ImageAsset | null;

  parentId: string | null;

  active: boolean;
  sortOrder: number;

  seo: SEO;
}

export type CategoryInput = Omit<Category, "createdAt" | "updatedAt">;
