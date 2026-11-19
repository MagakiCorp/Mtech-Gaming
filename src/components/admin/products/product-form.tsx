"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  X,
  Plus,
  Image as ImageIcon,
  LoaderCircle,
  Save,
} from "lucide-react";
import Link from "next/link";

import type { ProductInput } from "@/types";
import type { AdminProductCategory } from "@/types/admin-products";
import type { ImageAsset } from "@/types";

interface ProductFormProps {
  categories: AdminProductCategory[];
  productId?: string;
  initialData?: ProductInput;
}

function createEmptyProduct(): ProductInput {
  return {
    name: "",
    slug: "",
    description: "",
    categoryId: "",
    brand: "",
    pricing: {
      type: "fixed",
      min: 0,
      max: null,
      currency: "KES",
    },
    images: {
      main: {
        url: "",
        publicId: "",
      },
      gallery: [],
    },
    specifications: [],
    availability: "in_stock",
    featured: false,
    bestSeller: false,
    newArrival: false,
    active: true,
    sortOrder: 0,
    seo: {
      title: "",
      description: "",
    },
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uploadImage(file: File): Promise<ImageAsset> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select an image file.");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Images must be smaller than 10 MB.");
  }

  const signatureResponse = await fetch("/api/admin/cloudinary/signature", {
    method: "POST",
  });

  const signatureData = await signatureResponse.json();

  if (!signatureResponse.ok) {
    throw new Error(signatureData.error ?? "Unable to authorize image upload.");
  }

  const formData = new FormData();

  formData.append("file", file);
  formData.append("api_key", signatureData.apiKey);
  formData.append("timestamp", String(signatureData.timestamp));
  formData.append("folder", signatureData.folder);
  formData.append("signature", signatureData.signature);

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  const uploadData = await uploadResponse.json();

  if (!uploadResponse.ok) {
    throw new Error(uploadData.error?.message ?? "Image upload failed.");
  }

  return {
    url: uploadData.secure_url,
    publicId: uploadData.public_id,
  };
}

export default function ProductForm({
  categories,
  productId,
  initialData,
}: ProductFormProps) {
  const router = useRouter();
  // Tracks only images uploaded during this editing session.
  // Existing images already saved in Firestore are never added here.
  const uploadedImageIds = useRef(new Set<string>());

  function trackUploadedImage(image: ImageAsset) {
    uploadedImageIds.current.add(image.publicId);
  }

  async function cleanupUploadedImages(publicIds?: string[]) {
    const ids = publicIds
      ? publicIds.filter((id) => uploadedImageIds.current.has(id))
      : [...uploadedImageIds.current];

    if (ids.length === 0) return;

    try {
      const response = await fetch("/api/admin/cloudinary/cleanup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ publicIds: ids }),
      });

      if (!response.ok) {
        throw new Error("Cloudinary cleanup failed.");
      }

      ids.forEach((id) => uploadedImageIds.current.delete(id));
    } catch (error) {
      console.error("Unable to clean up uploaded images:", error);
    }
  }

  const [form, setForm] = useState<ProductInput>(
    initialData ?? createEmptyProduct(),
  );

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(
    Boolean(initialData?.slug),
  );

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isEditing = Boolean(productId);

  function updateField<K extends keyof ProductInput>(
    field: K,
    value: ProductInput[K],
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleNameChange(value: string) {
    setForm((previous) => ({
      ...previous,
      name: value,
      slug: slugManuallyEdited ? previous.slug : slugify(value),
    }));
  }

  function handlePricingTypeChange(type: ProductInput["pricing"]["type"]) {
    setForm((previous) => ({
      ...previous,
      pricing: {
        ...previous.pricing,
        type,
        min: type === "on_request" ? null : (previous.pricing.min ?? 0),
        max: type === "range" ? (previous.pricing.max ?? 0) : null,
      },
    }));
  }

async function handleMainImageUpload(file?: File) {
  if (!file) return;

  setError("");
  setUploading(true);

  try {
    const previousImageId = form.images.main.publicId;
    const image = await uploadImage(file);

    trackUploadedImage(image);

    setForm((previous) => ({
      ...previous,
      images: {
        ...previous.images,
        main: image,
      },
    }));

    if (previousImageId) {
      void cleanupUploadedImages([previousImageId]);
    }
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Unable to upload the main image.",
    );
  } finally {
    setUploading(false);
  }
}
  
async function handleGalleryUpload(files: FileList | null) {
  if (!files?.length) return;

  const selectedFiles = Array.from(files);

  if (form.images.gallery.length + selectedFiles.length > 10) {
    setError("You can upload a maximum of 10 gallery images.");
    return;
  }

  setError("");
  setUploading(true);

  try {
    const results = await Promise.allSettled(
      selectedFiles.map(async (file) => {
        const image = await uploadImage(file);
        trackUploadedImage(image);
        return image;
      }),
    );

    const uploadedImages = results.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : [],
    );

    const failedCount = results.filter(
      (result) => result.status === "rejected",
    ).length;

    if (uploadedImages.length > 0) {
      setForm((previous) => ({
        ...previous,
        images: {
          ...previous.images,
          gallery: [...previous.images.gallery, ...uploadedImages],
        },
      }));
    }

    if (failedCount > 0) {
      setError(
        `${uploadedImages.length} image(s) uploaded successfully. ${failedCount} image(s) failed to upload.`,
      );
    }
  } catch {
    setError("Unable to upload gallery images.");
  } finally {
    setUploading(false);
  }
}


  function removeGalleryImage(index: number) {
    const image = form.images.gallery[index];

    if (image) {
      void cleanupUploadedImages([image.publicId]);
    }

    setForm((previous) => ({
      ...previous,
      images: {
        ...previous.images,
        gallery: previous.images.gallery.filter(
          (_, imageIndex) => imageIndex !== index,
        ),
      },
    }));
  }

  function addSpecification() {
    setForm((previous) => ({
      ...previous,
      specifications: [...previous.specifications, { name: "", value: "" }],
    }));
  }

  function updateSpecification(
    index: number,
    field: "name" | "value",
    value: string,
  ) {
    setForm((previous) => ({
      ...previous,
      specifications: previous.specifications.map(
        (specification, specificationIndex) =>
          specificationIndex === index
            ? { ...specification, [field]: value }
            : specification,
      ),
    }));
  }

  function removeSpecification(index: number) {
    setForm((previous) => ({
      ...previous,
      specifications: previous.specifications.filter(
        (_, specificationIndex) => specificationIndex !== index,
      ),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (!form.categoryId) {
      setError("Please select a product category.");
      return;
    }

    if (!form.images.main.url || !form.images.main.publicId) {
      setError("Please upload a main product image.");
      return;
    }

    if (uploading) {
      setError("Please wait for image uploads to finish.");
      return;
    }

    if (
      form.pricing.type === "range" &&
      (form.pricing.min === null ||
        form.pricing.max === null ||
        form.pricing.max < form.pricing.min)
    ) {
      setError("Please enter a valid price range.");
      return;
    }

    if (
      form.pricing.type === "fixed" &&
      (form.pricing.min === null || form.pricing.min < 0)
    ) {
      setError("Please enter a valid product price.");
      return;
    }

    setSaving(true);

    try {
      const endpoint = isEditing
        ? `/api/admin/products/${productId}`
        : "/api/admin/products";

      const response = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to save product.");
      }

      setSuccess(result.message ?? "Product saved successfully.");

      // The product now references these images in Firestore.
      // They must no longer be treated as temporary uploads.
      uploadedImageIds.current.clear();

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");

      setSaving(false);
    }
  }

  useEffect(() => {
    function handlePageExit() {
      const ids = [...uploadedImageIds.current];

      if (ids.length === 0) return;

      const sent = navigator.sendBeacon(
        "/api/admin/cloudinary/cleanup",
        new Blob([JSON.stringify({ publicIds: ids })], {
          type: "application/json",
        }),
      );

      if (sent) {
        ids.forEach((id) => uploadedImageIds.current.delete(id));
      }
    }

    window.addEventListener("pagehide", handlePageExit);

    return () => {
      window.removeEventListener("pagehide", handlePageExit);

      // Best-effort cleanup when navigating away within the application.
      const ids = [...uploadedImageIds.current];

      if (ids.length > 0) {
        void fetch("/api/admin/cloudinary/cleanup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ publicIds: ids }),
          keepalive: true,
        });
      }
    };
  }, []);

  const inputClass =
    "mt-2 h-11 w-full rounded-lg border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100";

  const labelClass = "text-sm font-semibold text-zinc-700";

  const sectionClass = "border border-zinc-200 bg-white p-5 sm:p-7";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            onClick={(event) => {
              event.preventDefault();

              void cleanupUploadedImages().finally(() => {
                router.push("/admin/products");
              });
            }}
            href="/admin/products"
            className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 transition hover:text-purple-700"
          >
            <ArrowLeft size={15} />
            Back to products
          </Link>

          <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-600">
            Catalogue management
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">
            {isEditing ? "Edit product" : "Add product"}
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            {isEditing
              ? "Update your product information and catalogue settings."
              : "Add a new product to your gaming accessories catalogue."}
          </p>
        </div>

        <button
          type="submit"
          disabled={saving || uploading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <Save size={17} />
          )}

          {saving ? "Saving..." : isEditing ? "Save changes" : "Create product"}
        </button>
      </div>

      {/* Feedback */}
      {error && (
        <div
          role="alert"
          className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* Basic information */}
      <section className={sectionClass}>
        <div className="mb-6 border-b border-zinc-100 pb-4">
          <h2 className="text-base font-bold text-zinc-900">
            Basic information
          </h2>

          <p className="mt-1 text-xs text-zinc-500">
            The main details customers will see when browsing products.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Product name *</label>

            <input
              required
              value={form.name}
              onChange={(event) => handleNameChange(event.target.value)}
              placeholder="e.g. Logitech G502 HERO Gaming Mouse"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Product slug *</label>

            <input
              required
              value={form.slug}
              onChange={(event) => {
                setSlugManuallyEdited(true);

                updateField("slug", slugify(event.target.value));
              }}
              placeholder="logitech-g502-hero"
              className={inputClass}
            />

            <p className="mt-1.5 text-xs text-zinc-400">
              Used in the product URL.
            </p>
          </div>

          <div>
            <label className={labelClass}>Brand</label>

            <input
              value={form.brand}
              onChange={(event) => updateField("brand", event.target.value)}
              placeholder="e.g. Logitech"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Category *</label>

            <select
              required
              value={form.categoryId}
              onChange={(event) =>
                updateField("categoryId", event.target.value)
              }
              className={inputClass}
            >
              <option value="">Select category</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {!category.active ? " (Inactive — current category)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Display order</label>

            <input
              type="number"
              min="0"
              value={form.sortOrder}
              onChange={(event) =>
                updateField(
                  "sortOrder",
                  Math.max(0, Number(event.target.value)),
                )
              }
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>Description</label>

            <textarea
              rows={5}
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              placeholder="Describe the product, its features and benefits..."
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className={sectionClass}>
        <div className="mb-6 border-b border-zinc-100 pb-4">
          <h2 className="text-base font-bold text-zinc-900">Pricing</h2>

          <p className="mt-1 text-xs text-zinc-500">
            Choose how this product's price should be displayed.
          </p>
        </div>

        <div className="max-w-xl">
          <label className={labelClass}>Pricing type</label>

          <select
            value={form.pricing.type}
            onChange={(event) =>
              handlePricingTypeChange(
                event.target.value as ProductInput["pricing"]["type"],
              )
            }
            className={inputClass}
          >
            <option value="fixed">Fixed price</option>
            <option value="range">Price range</option>
            <option value="on_request">Price on request</option>
          </select>

          {form.pricing.type === "fixed" && (
            <div className="mt-5">
              <label className={labelClass}>Price (KES) *</label>

              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.pricing.min ?? ""}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    pricing: {
                      ...previous.pricing,
                      min:
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                    },
                  }))
                }
                className={inputClass}
              />
            </div>
          )}

          {form.pricing.type === "range" && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Minimum price (KES) *</label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.pricing.min ?? ""}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      pricing: {
                        ...previous.pricing,
                        min:
                          event.target.value === ""
                            ? null
                            : Number(event.target.value),
                      },
                    }))
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Maximum price (KES) *</label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.pricing.max ?? ""}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      pricing: {
                        ...previous.pricing,
                        max:
                          event.target.value === ""
                            ? null
                            : Number(event.target.value),
                      },
                    }))
                  }
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {form.pricing.type === "on_request" && (
            <p className="mt-4 border border-purple-100 bg-purple-50 px-4 py-3 text-xs text-purple-800">
              Customers will see "Price on request" instead of a numeric price.
            </p>
          )}
        </div>
      </section>

      {/* Images */}
      <section className={sectionClass}>
        <div className="mb-6 border-b border-zinc-100 pb-4">
          <h2 className="text-base font-bold text-zinc-900">Product images</h2>

          <p className="mt-1 text-xs text-zinc-500">
            Upload a main image and additional gallery images. Maximum 10 MB per
            image.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className={labelClass}>Main product image *</label>

            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="relative flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden border border-dashed border-zinc-300 bg-zinc-50">
                {form.images.main.url ? (
                  <>
                    <img
                      src={form.images.main.url}
                      alt="Main product"
                      className="h-full w-full object-contain"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        void cleanupUploadedImages([form.images.main.publicId]);

                        setForm((previous) => ({
                          ...previous,
                          images: {
                            ...previous.images,
                            main: { url: "", publicId: "" },
                          },
                        }));
                      }}
                      className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-zinc-700 shadow hover:text-red-600"
                      aria-label="Remove main image"
                    >
                      <X size={15} />
                    </button>
                  </>
                ) : (
                  <ImageIcon size={30} className="text-zinc-300" />
                )}
              </div>

              <div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-purple-300 hover:text-purple-700">
                  <Upload size={16} />
                  Upload main image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(event) => {
                      void handleMainImageUpload(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </label>

                <p className="mt-2 text-xs text-zinc-400">
                  Recommended: square or 4:3 product image.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-800">
                  Gallery images
                </h3>

                <p className="mt-1 text-xs text-zinc-500">
                  {form.images.gallery.length} of 10 images
                </p>
              </div>

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 transition hover:border-purple-300 hover:text-purple-700">
                <Plus size={15} />
                Add images
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploading || form.images.gallery.length >= 10}
                  className="hidden"
                  onChange={(event) => {
                    void handleGalleryUpload(event.target.files);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>

            {form.images.gallery.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                {form.images.gallery.map((image, index) => (
                  <div
                    key={`${image.publicId}-${index}`}
                    className="group relative aspect-square overflow-hidden border border-zinc-200 bg-zinc-50"
                  >
                    <img
                      src={image.url}
                      alt={`Gallery image ${index + 1}`}
                      className="h-full w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => removeGalleryImage(index)}
                      aria-label={`Remove gallery image ${index + 1}`}
                      className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-zinc-700 shadow transition hover:text-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {uploading && (
            <div className="flex items-center gap-2 text-xs font-medium text-purple-700">
              <LoaderCircle size={15} className="animate-spin" />
              Uploading images to Cloudinary...
            </div>
          )}
        </div>
      </section>

      {/* Specifications */}
      <section className={sectionClass}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900">
              Specifications
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Add product specifications such as connectivity, dimensions or
              compatibility.
            </p>
          </div>

          <button
            type="button"
            onClick={addSpecification}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900"
          >
            <Plus size={15} />
            Add specification
          </button>
        </div>

        {form.specifications.length === 0 ? (
          <p className="py-4 text-sm text-zinc-400">No specifications added.</p>
        ) : (
          <div className="space-y-3">
            {form.specifications.map((specification, index) => (
              <div key={index} className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={specification.name}
                  onChange={(event) =>
                    updateSpecification(index, "name", event.target.value)
                  }
                  placeholder="Specification name"
                  className={inputClass.replace("mt-2 ", "")}
                />

                <input
                  value={specification.value}
                  onChange={(event) =>
                    updateSpecification(index, "value", event.target.value)
                  }
                  placeholder="Value"
                  className={inputClass.replace("mt-2 ", "")}
                />

                <button
                  type="button"
                  onClick={() => removeSpecification(index)}
                  aria-label="Remove specification"
                  className="flex h-11 w-11 shrink-0 items-center justify-center border border-zinc-200 text-zinc-400 transition hover:border-red-200 hover:text-red-600"
                >
                  <X size={17} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Availability and visibility */}
      <section className={sectionClass}>
        <div className="mb-6 border-b border-zinc-100 pb-4">
          <h2 className="text-base font-bold text-zinc-900">
            Availability and visibility
          </h2>

          <p className="mt-1 text-xs text-zinc-500">
            Control product availability and how it appears in your catalogue.
          </p>
        </div>

        <div className="max-w-xl">
          <label className={labelClass}>Availability</label>

          <select
            value={form.availability}
            onChange={(event) =>
              updateField(
                "availability",
                event.target.value as ProductInput["availability"],
              )
            }
            className={inputClass}
          >
            <option value="in_stock">In stock</option>
            <option value="out_of_stock">Out of stock</option>
            <option value="pre_order">Pre-order</option>
            <option value="discontinued">Discontinued</option>
          </select>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            {
              key: "active",
              label: "Active product",
              description: "Make this product visible on the public website.",
            },
            {
              key: "featured",
              label: "Featured product",
              description: "Include this product in featured sections.",
            },
            {
              key: "bestSeller",
              label: "Best seller",
              description: "Mark this product as a best seller.",
            },
            {
              key: "newArrival",
              label: "New arrival",
              description: "Highlight this product as a new arrival.",
            },
          ].map((item) => {
            const key = item.key as
              | "active"
              | "featured"
              | "bestSeller"
              | "newArrival";

            return (
              <label
                key={item.key}
                className="flex cursor-pointer items-start gap-3 border border-zinc-200 p-4 transition hover:border-purple-200"
              >
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(event) => updateField(key, event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-purple-600"
                />

                <span>
                  <span className="block text-sm font-semibold text-zinc-800">
                    {item.label}
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-zinc-500">
                    {item.description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* SEO */}
      <section className={sectionClass}>
        <div className="mb-6 border-b border-zinc-100 pb-4">
          <h2 className="text-base font-bold text-zinc-900">
            Search engine optimisation
          </h2>

          <p className="mt-1 text-xs text-zinc-500">
            Optional metadata for search engines and product pages.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className={labelClass}>SEO title</label>

            <input
              value={form.seo.title}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  seo: {
                    ...previous.seo,
                    title: event.target.value,
                  },
                }))
              }
              placeholder="Product page title"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>SEO description</label>

            <textarea
              rows={3}
              value={form.seo.description}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  seo: {
                    ...previous.seo,
                    description: event.target.value,
                  },
                }))
              }
              placeholder="A short description for search engine results..."
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
          </div>
        </div>
      </section>

      {/* Bottom actions */}
      <div className="flex flex-col-reverse justify-end gap-3 border-t border-zinc-200 pt-5 sm:flex-row">
        <Link
          onClick={(event) => {
            event.preventDefault();

            void cleanupUploadedImages().finally(() => {
              router.push("/admin/products");
            });
          }}
          href="/admin/products"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={saving || uploading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <Save size={17} />
          )}

          {saving ? "Saving..." : isEditing ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}
