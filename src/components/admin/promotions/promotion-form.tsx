"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Image as ImageIcon,
  LoaderCircle,
  Save,
  Upload,
  X,
} from "lucide-react";

import type { PromotionType, PromotionTargetType, ImageAsset } from "@/types";
import type { AdminPromotion } from "@/types/admin-promotion";

interface TargetOption {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

interface PromotionFormProps {
  promotionId?: string;
  initialData?: AdminPromotion;
  products: TargetOption[];
  categories: TargetOption[];
}

interface PromotionFormValues {
  title: string;
  description: string;
  image: ImageAsset;
  type: PromotionType;
  targetType: PromotionTargetType;
  targetId: string | null;
  ctaText: string;
  ctaLink: string;
  startDate: string;
  endDate: string;
  active: boolean;
  sortOrder: number;
}

function createEmptyPromotion(): PromotionFormValues {
  return {
    title: "",
    description: "",
    image: {
      url: "",
      publicId: "",
    },
    type: "banner",
    targetType: "none",
    targetId: null,
    ctaText: "",
    ctaLink: "",
    startDate: "",
    endDate: "",
    active: true,
    sortOrder: 0,
  };
}

function toDateTimeLocal(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
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
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      folder: "m-tech/promotions",
    }),
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

export default function PromotionForm({
  promotionId,
  initialData,
  products,
  categories,
}: PromotionFormProps) {
  const router = useRouter();

  // Only tracks images uploaded during this editing session.
  const uploadedImageIds = useRef(new Set<string>());

  const [form, setForm] = useState<PromotionFormValues>(() => {
    if (!initialData) return createEmptyPromotion();

    return {
      title: initialData.title,
      description: initialData.description,
      image: initialData.image,
      type: initialData.type,
      targetType: initialData.targetType,
      targetId: initialData.targetId,
      ctaText: initialData.ctaText,
      ctaLink: initialData.ctaLink,
      startDate: toDateTimeLocal(initialData.startDate),
      endDate: toDateTimeLocal(initialData.endDate),
      active: initialData.active,
      sortOrder: initialData.sortOrder,
    };
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEditing = Boolean(promotionId);

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
    } catch (err) {
      console.error("Unable to clean up uploaded images:", err);
    }
  }

  function updateField<K extends keyof PromotionFormValues>(
    field: K,
    value: PromotionFormValues[K],
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleTargetTypeChange(type: PromotionTargetType) {
    setForm((previous) => ({
      ...previous,
      targetType: type,
      targetId: null,
      ctaLink: type === "none" ? "" : previous.ctaLink,
    }));
  }

  function handleTargetChange(id: string) {
    const target =
      form.targetType === "product"
        ? products.find((item) => item.id === id)
        : categories.find((item) => item.id === id);

    const ctaLink = target
      ? form.targetType === "product"
        ? `/products/${target.slug}`
        : `/categories/${target.slug}`
      : "";

    setForm((previous) => ({
      ...previous,
      targetId: id || null,
      ctaLink,
    }));
  }

  async function handleImageUpload(file?: File) {
    if (!file) return;

    setError("");
    setUploading(true);

    try {
      const previousImageId = form.image.publicId;
      const image = await uploadImage(file);

      trackUploadedImage(image);

      setForm((previous) => ({
        ...previous,
        image,
      }));

      if (previousImageId) {
        void cleanupUploadedImages([previousImageId]);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload promotion image.",
      );
    } finally {
      setUploading(false);
    }
  }

  function removeImage() {
    const publicId = form.image.publicId;

    if (publicId) {
      void cleanupUploadedImages([publicId]);
    }

    setForm((previous) => ({
      ...previous,
      image: {
        url: "",
        publicId: "",
      },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("Promotion title is required.");
      return;
    }

    if (form.title.trim().length > 120) {
      setError("Promotion title cannot exceed 120 characters.");
      return;
    }

    if (!form.image.url || !form.image.publicId) {
      setError("Please upload a promotion image.");
      return;
    }

    if (uploading) {
      setError("Please wait for the image upload to finish.");
      return;
    }

    if (form.targetType !== "none" && !form.targetId) {
      setError("Please select a promotion target.");
      return;
    }

    if (form.targetType === "none" && form.targetId) {
      setError("A promotion without a target cannot have a target ID.");
      return;
    }

    if (Boolean(form.ctaText.trim()) !== Boolean(form.ctaLink.trim())) {
      setError("Enter both CTA text and a CTA link, or leave both empty.");
      return;
    }

    if (form.startDate && form.endDate) {
      if (new Date(form.endDate) <= new Date(form.startDate)) {
        setError("The end date must be later than the start date.");
        return;
      }
    }

    setSaving(true);

    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        ctaText: form.ctaText.trim(),
        ctaLink: form.ctaLink.trim(),
        startDate: form.startDate
          ? new Date(form.startDate).toISOString()
          : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      };

      const endpoint = isEditing
        ? `/api/admin/promotions/${promotionId}`
        : "/api/admin/promotions";

      const response = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to save promotion.");
      }

      // Firestore now references these images.
      uploadedImageIds.current.clear();

      router.push("/admin/promotions");
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

  async function handleCancel() {
    await cleanupUploadedImages();
    router.push("/admin/promotions");
  }

  const inputClass =
    "mt-2 h-11 w-full rounded-lg border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100";

  const labelClass = "text-sm font-semibold text-zinc-700";

  const sectionClass = "border border-zinc-200 bg-white p-5 sm:p-7";

  const targetOptions = form.targetType === "product" ? products : categories;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/admin/promotions"
            onClick={(event) => {
              event.preventDefault();
              void handleCancel();
            }}
            className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 transition hover:text-purple-700"
          >
            <ArrowLeft size={15} />
            Back to promotions
          </Link>

          <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-600">
            Marketing management
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">
            {isEditing ? "Edit promotion" : "Add promotion"}
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            {isEditing
              ? "Update your promotion and its display settings."
              : "Create a banner, offer, or campaign for your website."}
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

          {saving
            ? "Saving..."
            : isEditing
              ? "Save changes"
              : "Create promotion"}
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

      {/* Basic information */}
      <section className={sectionClass}>
        <div className="mb-6 border-b border-zinc-100 pb-4">
          <h2 className="text-base font-bold text-zinc-900">
            Promotion information
          </h2>

          <p className="mt-1 text-xs text-zinc-500">
            Add the main details customers will see.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Promotion title *</label>

            <input
              required
              maxLength={120}
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="e.g. Black Friday Gaming Deals"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Promotion type *</label>

            <select
              value={form.type}
              onChange={(event) =>
                updateField("type", event.target.value as PromotionType)
              }
              className={inputClass}
            >
              <option value="banner">Banner</option>
              <option value="offer">Offer</option>
              <option value="campaign">Campaign</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Display order</label>

            <input
              type="number"
              min="0"
              step="1"
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
              rows={4}
              maxLength={1000}
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              placeholder="Describe the promotion..."
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
          </div>
        </div>
      </section>

      {/* Image */}
      <section className={sectionClass}>
        <div className="mb-6 border-b border-zinc-100 pb-4">
          <h2 className="text-base font-bold text-zinc-900">Promotion image</h2>

          <p className="mt-1 text-xs text-zinc-500">
            Upload the image used to display this promotion. Maximum 10 MB.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="relative flex aspect-[16/9] w-full max-w-md items-center justify-center overflow-hidden border border-dashed border-zinc-300 bg-zinc-50">
            {form.image.url ? (
              <>
                <img
                  src={form.image.url}
                  alt="Promotion preview"
                  className="h-full w-full object-cover"
                />

                <button
                  type="button"
                  onClick={removeImage}
                  aria-label="Remove promotion image"
                  className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-zinc-700 shadow transition hover:text-red-600"
                >
                  <X size={15} />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-zinc-400">
                <ImageIcon size={30} />
                <span className="text-xs">No image selected</span>
              </div>
            )}
          </div>

          <div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-purple-300 hover:text-purple-700">
              <Upload size={16} />
              Upload image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(event) => {
                  void handleImageUpload(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </label>

            <p className="mt-2 max-w-xs text-xs leading-5 text-zinc-400">
              Use a high-quality image suitable for your promotion placement.
            </p>

            {uploading && (
              <p className="mt-3 flex items-center gap-2 text-xs font-medium text-purple-700">
                <LoaderCircle size={14} className="animate-spin" />
                Uploading image...
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Target and CTA */}
      <section className={sectionClass}>
        <div className="mb-6 border-b border-zinc-100 pb-4">
          <h2 className="text-base font-bold text-zinc-900">
            Promotion destination
          </h2>

          <p className="mt-1 text-xs text-zinc-500">
            Choose where customers should go when they interact with this
            promotion.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Target type *</label>

            <select
              value={form.targetType}
              onChange={(event) =>
                handleTargetTypeChange(
                  event.target.value as PromotionTargetType,
                )
              }
              className={inputClass}
            >
              <option value="none">No linked target</option>
              <option value="product">Product</option>
              <option value="category">Category</option>
            </select>
          </div>

          {form.targetType !== "none" && (
            <div>
              <label className={labelClass}>
                {form.targetType === "product" ? "Product" : "Category"} *
              </label>

              <select
                required
                value={form.targetId ?? ""}
                onChange={(event) => handleTargetChange(event.target.value)}
                className={inputClass}
              >
                <option value="">Select a target</option>

                {targetOptions.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.name}
                    {!target.active ? " (Inactive)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={labelClass}>CTA button text</label>

            <input
              maxLength={40}
              value={form.ctaText}
              onChange={(event) => updateField("ctaText", event.target.value)}
              placeholder="e.g. Shop now"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>CTA destination link</label>

            <input
              value={form.ctaLink}
              onChange={(event) => updateField("ctaLink", event.target.value)}
              placeholder="/products/gaming-mouse"
              className={inputClass}
            />

            <p className="mt-1.5 text-xs text-zinc-400">
              Selecting a product or category fills this automatically. You can
              edit the link if needed.
            </p>
          </div>
        </div>
      </section>

      {/* Schedule */}
      <section className={sectionClass}>
        <div className="mb-6 border-b border-zinc-100 pb-4">
          <h2 className="text-base font-bold text-zinc-900">
            Promotion schedule
          </h2>

          <p className="mt-1 text-xs text-zinc-500">
            Set optional dates to control when the promotion is intended to run.
            Leave either field empty for no restriction on that boundary.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Start date and time</label>

            <div className="relative">
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(event) =>
                  updateField("startDate", event.target.value)
                }
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>End date and time</label>

            <div className="relative">
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(event) => updateField("endDate", event.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-zinc-500">
          <CalendarDays size={15} className="mt-0.5 shrink-0" />
          Dates are interpreted using your browser's local timezone and stored
          as timestamps.
        </p>
      </section>

      {/* Visibility */}
      <section className={sectionClass}>
        <div className="mb-5 border-b border-zinc-100 pb-4">
          <h2 className="text-base font-bold text-zinc-900">Visibility</h2>

          <p className="mt-1 text-xs text-zinc-500">
            Control whether this promotion is enabled on the website.
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 border border-zinc-200 p-4 transition hover:border-purple-200">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) => updateField("active", event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-purple-600"
          />

          <span>
            <span className="block text-sm font-semibold text-zinc-800">
              Active promotion
            </span>

            <span className="mt-1 block text-xs leading-5 text-zinc-500">
              Allow this promotion to be displayed on the public website.
            </span>
          </span>
        </label>
      </section>

      {/* Bottom actions */}
      <div className="flex flex-col-reverse justify-end gap-3 border-t border-zinc-200 pt-5 sm:flex-row">
        <button
          type="button"
          onClick={() => void handleCancel()}
          disabled={saving}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
        >
          Cancel
        </button>

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

          {saving
            ? "Saving..."
            : isEditing
              ? "Save changes"
              : "Create promotion"}
        </button>
      </div>
    </form>
  );
}
