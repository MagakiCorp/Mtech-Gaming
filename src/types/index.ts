import type { Timestamp } from "firebase/firestore";

export interface BaseDocument {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ImageAsset {
  url: string;
  publicId: string;
}

export interface SEO {
  title: string;
  description: string;
}

export type Currency = "KES";

export type DocumentWithId<T> = T & {
  id: string;
};

export * from "./product";
export * from "./category";
export * from "./promotion";
export * from "./testimonial";
export * from "./settings";
export * from "./admin";