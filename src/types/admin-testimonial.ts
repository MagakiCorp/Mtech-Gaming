export interface AdminTestimonial {
  id: string;
  customerName: string;
  message: string;
  rating: number;
  image: {
    url: string;
    publicId: string;
  } | null;
  approved: boolean;
  active: boolean;
  sortOrder: number;
  createdAt: string | null;
}
