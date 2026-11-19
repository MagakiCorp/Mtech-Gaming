export interface ImageAsset {
  url: string;
  publicId: string;
}

export interface HomepageHero {
  heading?: string;
  subheading?: string;
  image?: ImageAsset | null;
  ctaText?: string;
  ctaLink?: string;
}

export interface HomepageSectionVisibility {
  categories?: boolean;
  featuredProducts?: boolean;
  promotions?: boolean;
  bestSellers?: boolean;
  newArrivals?: boolean;
  testimonials?: boolean;
}

export interface HomepageData {
  hero?: HomepageHero;
  featuredProductIds?: string[];
  bestSellerProductIds?: string[];
  newArrivalProductIds?: string[];
  promotionIds?: string[];
  sectionVisibility?: HomepageSectionVisibility;
  sectionOrder?: string[];
}

export interface GeneralData {
  businessName?: string;
  tagline?: string;
  description?: string;
}

export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image: ImageAsset | null;
  sortOrder: number;
}

export interface PublicProduct {
  id: string;
  name: string;
  slug: string;
  description: string;

  categoryId: string;
  brand?: string;

  pricing?: {
    type: "fixed" | "range" | "on_request";
    min: number | null;
    max: number | null;
    currency: "KES";
  };

  images: {
    main: ImageAsset;
    gallery: ImageAsset[];
  };

  availability: "in_stock" | "out_of_stock" | "pre_order" | "discontinued";

  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  active: boolean;
  sortOrder: number;
}

export interface PublicPromotion {
  id: string;
  title: string;
  description: string;
  image: ImageAsset;
  type: "banner" | "offer" | "campaign";
  ctaText: string;
  ctaLink: string;
  active: boolean;
  sortOrder: number;
}

export interface PublicTestimonial {
  id: string;
  customerName: string;
  message: string;
  rating: number;
  image: ImageAsset | null;
  approved: boolean;
  active: boolean;
  sortOrder: number;
}

export interface PublicContact {
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  location: string;
  businessHours: {
    day: string;
    openingTime: string;
    closingTime: string;
    closed: boolean;
  }[];
}