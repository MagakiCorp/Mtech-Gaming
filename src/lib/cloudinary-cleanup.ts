import "server-only";
import cloudinary from "@/lib/cloudinary";

const CATEGORY_IMAGE_FOLDER = "m-tech/categories/";

type CleanupResult = "deleted" | "not_found" | "skipped";

export async function deleteCategoryImage(
  publicId: string,
): Promise<CleanupResult> {
  // Only delete assets inside the category image folder.
  // This prevents this helper from deleting product or unrelated images.
  if (!publicId.startsWith(CATEGORY_IMAGE_FOLDER) || publicId.includes("..")) {
    return "skipped";
  }

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });

  if (result.result === "ok") {
    return "deleted";
  }

  if (result.result === "not found") {
    return "not_found";
  }

  throw new Error(`Cloudinary could not delete category image: ${publicId}`);
}

const PRODUCT_IMAGE_FOLDER = "m-tech/products/";

export async function deleteProductImage(
  publicId: string,
): Promise<CleanupResult> {
  if (!publicId.startsWith(PRODUCT_IMAGE_FOLDER) || publicId.includes("..")) {
    return "skipped";
  }

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });

  if (result.result === "ok") return "deleted";
  if (result.result === "not found") return "not_found";

  throw new Error(`Cloudinary could not delete product image: ${publicId}`);
}

const PROMOTION_IMAGE_FOLDER = "m-tech/promotions/";

export async function deletePromotionImage(
  publicId: string,
): Promise<CleanupResult> {
  if (!publicId.startsWith(PROMOTION_IMAGE_FOLDER) || publicId.includes("..")) {
    return "skipped";
  }

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });

  if (result.result === "ok") return "deleted";
  if (result.result === "not found") return "not_found";

  throw new Error(`Cloudinary could not delete promotion image: ${publicId}`);
}

const TESTIMONIAL_IMAGE_FOLDER = "m-tech/testimonials/";

export async function deleteTestimonialImage(
  publicId: string,
): Promise<CleanupResult> {
  if (
    !publicId.startsWith(TESTIMONIAL_IMAGE_FOLDER) ||
    publicId.includes("..")
  ) {
    return "skipped";
  }

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });

  if (result.result === "ok") return "deleted";
  if (result.result === "not found") return "not_found";

  throw new Error(`Cloudinary deletion failed for ${publicId}.`);
}

const HOMEPAGE_IMAGE_FOLDER = "m-tech/homepage/";

export async function deleteHomepageImage(
  publicId: string,
): Promise<CleanupResult> {
  if (
    !publicId.startsWith(HOMEPAGE_IMAGE_FOLDER) ||
    publicId.includes("..") ||
    publicId.includes("\\")
  ) {
    return "skipped";
  }

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });

  if (result.result === "ok") return "deleted";
  if (result.result === "not found") return "not_found";

  throw new Error(`Cloudinary deletion failed for ${publicId}.`);
}


const GENERAL_IMAGE_FOLDER = "m-tech/general/";

export async function deleteGeneralImage(
  publicId: string,
): Promise<CleanupResult> {
  if (
    !publicId.startsWith(GENERAL_IMAGE_FOLDER) ||
    publicId.includes("..") ||
    publicId.includes("\\")
  ) {
    console.error("Invalid General Settings Cloudinary public ID:", publicId);
    return "skipped";
  }

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });

  console.log("General image Cloudinary deletion:", {
    publicId,
    result: result.result,
  });

  if (result.result === "ok") return "deleted";
  if (result.result === "not found") return "not_found";

  throw new Error(
    `Cloudinary could not delete general image: ${publicId}. Result: ${result.result}`,
  );
}
