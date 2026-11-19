export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  brand: string;
  categoryId: string;
  categoryName: string;
  pricing: {
    type: "fixed" | "range" | "on_request";
    min: number | null;
    max: number | null;
    currency: "KES";
  };
  imageUrl: string;
  availability: "in_stock" | "out_of_stock" | "pre_order" | "discontinued";
  active: boolean;
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  createdAt: string | null;
}

export interface AdminProductCategory {
  id: string;
  name: string;
  active: boolean;
}
