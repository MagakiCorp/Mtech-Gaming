"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Image as ImageIcon,
  LoaderCircle,
  Save,
  Star,
  Upload,
  X,
} from "lucide-react";

import type { ImageAsset } from "@/types";
import type { AdminTestimonial } from "@/types/admin-testimonial";

interface TestimonialFormProps {
  testimonialId?: string;
  initialData?: AdminTestimonial;
}

interface TestimonialFormValues {
  customerName: string;
  message: string;
  rating: number;
  image: ImageAsset | null;
  approved: boolean;
  active: boolean;
  sortOrder: number;
}

function createEmptyTestimonial(): TestimonialFormValues {
  return {
    customerName: "",
    message: "",
    rating: 5,
    image: null,
    approved: false,
    active: true,
    sortOrder: 0,
  };
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
      folder: "m-tech/testimonials",
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

export default function TestimonialForm({
  testimonialId,
  initialData,
}: TestimonialFormProps) {
  const router = useRouter();

  // Tracks only images uploaded during this editing session.
  const uploadedImageIds = useRef(new Set<string>());

  const [form, setForm] = useState<TestimonialFormValues>(() => {
    if (!initialData) return createEmptyTestimonial();

    return {
      customerName: initialData.customerName,
      message: initialData.message,
      rating: initialData.rating,
      image: initialData.image,
      approved: initialData.approved,
      active: initialData.active,
      sortOrder: initialData.sortOrder,
    };
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEditing = Boolean(testimonialId);

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

  function updateField<K extends keyof TestimonialFormValues>(
    field: K,
    value: TestimonialFormValues[K],
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleImageUpload(file?: File) {
    if (!file) return;

    setError("");
    setUploading(true);

    try {
      const previousImageId = form.image?.publicId;
      const image = await uploadImage(file);

      trackUploadedImage(image);

      setForm((previous) => ({
        ...previous,
        image,
      }));

      // Only removes the previous image if it was uploaded in this session.
      if (previousImageId) {
        void cleanupUploadedImages([previousImageId]);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload testimonial image.",
      );
    } finally {
      setUploading(false);
    }
  }

  function removeImage() {
    const publicId = form.image?.publicId;

    if (publicId) {
      void cleanupUploadedImages([publicId]);
    }

    setForm((previous) => ({
      ...previous,
      image: null,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const customerName = form.customerName.trim();
    const message = form.message.trim();

    if (!customerName) {
      setError("Customer name is required.");
      return;
    }

    if (customerName.length > 100) {
      setError("Customer name cannot exceed 100 characters.");
      return;
    }

    if (!message) {
      setError("Testimonial message is required.");
      return;
    }

    if (message.length > 1000) {
      setError("Testimonial message cannot exceed 1,000 characters.");
      return;
    }

    if (!Number.isInteger(form.rating) || form.rating < 1 || form.rating > 5) {
      setError("Please select a rating between 1 and 5.");
      return;
    }

    if (!Number.isInteger(form.sortOrder) || form.sortOrder < 0) {
      setError("Display order must be a whole number of 0 or higher.");
      return;
    }

    if (uploading) {
      setError("Please wait for the image upload to finish.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        customerName,
        message,
        rating: form.rating,
        image: form.image,
        approved: form.approved,
        active: form.active,
        sortOrder: form.sortOrder,
      };

      const endpoint = isEditing
        ? `/api/admin/testimonials/${testimonialId}`
        : "/api/admin/testimonials";

      const response = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to save testimonial.");
      }

      // Firestore now references the uploaded image.
      uploadedImageIds.current.clear();

      router.push("/admin/testimonials");
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
    router.push("/admin/testimonials");
  }

  const inputClass =
    "mt-2 h-11 w-full rounded-lg border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100";

  const labelClass = "text-sm font-semibold text-zinc-700";

  const sectionClass = "border border-zinc-200 bg-white p-5 sm:p-7";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/admin/testimonials"
            onClick={(event) => {
              event.preventDefault();
              void handleCancel();
            }}
            className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 transition hover:text-purple-700"
          >
            <ArrowLeft size={15} />
            Back to testimonials
          </Link>

          <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-600">
            Marketing management
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">
            {isEditing ? "Edit testimonial" : "Add testimonial"}
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            {isEditing
              ? "Update customer feedback and its display settings."
              : "Add customer feedback to showcase your customer experience."}
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
              : "Create testimonial"}
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

      {/* Testimonial information */}
      <section className={sectionClass}>
        <div className="mb-6 border-b border-zinc-100 pb-4">
          <h2 className="text-base font-bold text-zinc-900">
            Customer feedback
          </h2>

          <p className="mt-1 text-xs text-zinc-500">
            Add the customer's name, feedback, and rating.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Customer name *</label>

            <input
              required
              maxLength={100}
              value={form.customerName}
              onChange={(event) =>
                updateField("customerName", event.target.value)
              }
              placeholder="e.g. John Kamau"
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>Testimonial message *</label>

            <textarea
              required
              rows={5}
              maxLength={1000}
              value={form.message}
              onChange={(event) => updateField("message", event.target.value)}
              placeholder="What did the customer say about their experience?"
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />

            <p className="mt-1.5 text-right text-xs text-zinc-400">
              {form.message.length}/1,000 characters
            </p>
          </div>

          <div>
            <label className={labelClass}>Customer rating *</label>

            <select
              required
              value={form.rating}
              onChange={(event) =>
                updateField("rating", Number(event.target.value))
              }
              className={inputClass}
            >
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>
                  {rating} {rating === 1 ? "star" : "stars"}
                </option>
              ))}
            </select>

            <div className="mt-3 flex items-center gap-1 text-amber-500">
              {Array.from({ length: 5 }, (_, index) => (
                <Star
                  key={index}
                  size={18}
                  fill={index < form.rating ? "currentColor" : "none"}
                />
              ))}

              <span className="ml-2 text-xs text-zinc-500">
                {form.rating} out of 5
              </span>
            </div>
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

            <p className="mt-1.5 text-xs text-zinc-400">
              Lower numbers appear first.
            </p>
          </div>
        </div>
      </section>

      {/* Customer image */}
      <section className={sectionClass}>
        <div className="mb-6 border-b border-zinc-100 pb-4">
          <h2 className="text-base font-bold text-zinc-900">Customer image</h2>

          <p className="mt-1 text-xs text-zinc-500">
            Optionally upload a customer photo. Maximum 10 MB.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-full border border-dashed border-zinc-300 bg-zinc-50">
            {form.image?.url ? (
              <>
                <img
                  src={form.image.url}
                  alt="Customer preview"
                  className="h-full w-full object-cover"
                />

                <button
                  type="button"
                  onClick={removeImage}
                  aria-label="Remove customer image"
                  className="absolute right-1 top-1 rounded-full bg-white p-1.5 text-zinc-700 shadow transition hover:text-red-600"
                >
                  <X size={15} />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-zinc-400">
                <ImageIcon size={27} />
                <span className="text-[11px]">No image</span>
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
              Use a clear customer photo. This image is optional.
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

      {/* Approval and visibility */}
      <section className={sectionClass}>
        <div className="mb-5 border-b border-zinc-100 pb-4">
          <h2 className="text-base font-bold text-zinc-900">
            Approval and visibility
          </h2>

          <p className="mt-1 text-xs text-zinc-500">
            Control whether the testimonial is approved and eligible for public
            display.
          </p>
        </div>

        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-3 border border-zinc-200 p-4 transition hover:border-purple-200">
            <input
              type="checkbox"
              checked={form.approved}
              onChange={(event) =>
                updateField("approved", event.target.checked)
              }
              className="mt-0.5 h-4 w-4 accent-purple-600"
            />

            <span>
              <span className="block text-sm font-semibold text-zinc-800">
                Approved testimonial
              </span>

              <span className="mt-1 block text-xs leading-5 text-zinc-500">
                Mark this feedback as reviewed and approved for use.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 border border-zinc-200 p-4 transition hover:border-purple-200">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => updateField("active", event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-purple-600"
            />

            <span>
              <span className="block text-sm font-semibold text-zinc-800">
                Active testimonial
              </span>

              <span className="mt-1 block text-xs leading-5 text-zinc-500">
                Enable this testimonial for public display. It will only appear
                when it is also approved.
              </span>
            </span>
          </label>
        </div>
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
              : "Create testimonial"}
        </button>
      </div>
    </form>
  );
}
