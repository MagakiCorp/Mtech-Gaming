import type { BaseDocument, ImageAsset } from "./index";

export interface GeneralSettings extends BaseDocument {
  businessName: string;
  tagline: string;
  description: string;

  logo: ImageAsset | null;
  favicon: ImageAsset | null;

  currency: "KES";
}

export interface ContactSettings extends BaseDocument {
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

  socialLinks: {
    facebook: string;
    instagram: string;
    tiktok: string;
    youtube: string;
  };
}

export interface HomepageSettings extends BaseDocument {
  hero: {
    heading: string;
    subheading: string;
    image: ImageAsset | null;
    ctaText: string;
    ctaLink: string;
  };

  featuredProductIds: string[];
  bestSellerProductIds: string[];
  newArrivalProductIds: string[];

  promotionIds: string[];

  sectionVisibility: {
    categories: boolean;
    featuredProducts: boolean;
    promotions: boolean;
    bestSellers: boolean;
    newArrivals: boolean;
    testimonials: boolean;
  };

  sectionOrder: string[];
}

export interface SeoSettings extends BaseDocument {
  siteTitle: string;
  siteDescription: string;
  keywords: string[];

  defaultOgImage: ImageAsset | null;
}

export type SettingsMap = {
  general: GeneralSettings;
  contact: ContactSettings;
  homepage: HomepageSettings;
  seo: SeoSettings;
};
