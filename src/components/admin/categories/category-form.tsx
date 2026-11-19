"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import type { CategoryInput, ImageAsset } from "@/types";

interface CategoryOption {
  id: string;
  name: string;
}

interface CategoryFormProps {
  categories: CategoryOption[];
  initialData?: CategoryInput;
  categoryId?: string;
}

const defaultValues: CategoryInput = {
  name: "",
  slug: "",
  description: "",
  image: null,
  parentId: null,
  active: true,
  sortOrder: 0,
  seo: {
    title: "",
    description: "",
  },
};

const inputClass =
  "mt-2 h-11 w-full rounded-lg border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100";

const labelClass = "text-sm font-semibold text-zinc-800";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function CategoryForm({
  categories,
  initialData,
  categoryId,
}: CategoryFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<CategoryInput>(
    initialData ?? defaultValues,
  );

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(
    Boolean(initialData?.slug),
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateField<K extends keyof CategoryInput>(
    field: K,
    value: CategoryInput[K],
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleNameChange(value: string) {
    setFormData((current) => ({
      ...current,
      name: value,
      ...(!slugManuallyEdited ? { slug: slugify(value) } : {}),
    }));
  }

  async function uploadImage(file: File): Promise<ImageAsset> {
    if (!file.type.startsWith("image/")) {
      throw new Error("Please select a valid image.");
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error("Image must be smaller than 10 MB.");
    }

    const signatureResponse = await fetch("/api/admin/cloudinary/signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: "m-tech/categories" }),
    });

    const signatureData = await signatureResponse.json();

    if (!signatureResponse.ok) {
      throw new Error(signatureData.error || "Unable to prepare image upload.");
    }

    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("api_key", signatureData.apiKey);
    uploadData.append("timestamp", String(signatureData.timestamp));
    uploadData.append("folder", signatureData.folder);
    uploadData.append("signature", signatureData.signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
      {
        method: "POST",
        body: uploadData,
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || "Image upload failed.");
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  async function handleImageUpload(file?: File) {
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const image = await uploadImage(file);
      updateField("image", image);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Category name is required.");
      return;
    }

    if (!formData.slug.trim()) {
      setError("Category slug is required.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        categoryId
          ? `/api/admin/categories/${categoryId}`
          : "/api/admin/categories",
        {
          method: categoryId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to save category.");
      }

      router.push("/admin/categories");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div>
        <Link
          href="/admin/categories"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-purple-700"
        >
          <ArrowLeft size={16} />
          Back to categories
        </Link>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-purple-600">
          Catalogue
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">
          {categoryId ? "Edit category" : "Create category"}
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Organise your gaming accessories into clear product categories.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic information */}
        <section className="space-y-5 border border-zinc-200 bg-white p-5 sm:p-6">
          <div>
            <h2 className="text-base font-bold text-zinc-900">
              Basic information
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              The name and description customers will see.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Category name *</label>
              <input
                required
                maxLength={100}
                value={formData.name}
                onChange={(event) => handleNameChange(event.target.value)}
                placeholder="e.g. Gaming keyboards"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>URL slug *</label>
              <input
                required
                value={formData.slug}
                onChange={(event) => {
                  setSlugManuallyEdited(true);
                  updateField("slug", slugify(event.target.value));
                }}
                placeholder="gaming-keyboards"
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-zinc-400">
                Used in category page URLs.
              </p>
            </div>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              rows={4}
              maxLength={1000}
              value={formData.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              placeholder="Describe the products in this category..."
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
          </div>
        </section>

        {/* Category image */}
        <section className="space-y-5 border border-zinc-200 bg-white p-5 sm:p-6">
          <div>
            <h2 className="text-base font-bold text-zinc-900">
              Category image
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              An optional image used when displaying this category.
            </p>
          </div>

          {formData.image ? (
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative h-36 w-full overflow-hidden border border-zinc-200 bg-zinc-100 sm:w-52">
                <img
                  src={formData.image.url}
                  alt="Category preview"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex flex-col items-start justify-center gap-3">
                <p className="text-sm font-medium text-zinc-700">
                  Image uploaded
                </p>

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50">
                  <Upload size={14} />
                  Replace image
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

                <button
                  type="button"
                  onClick={() => updateField("image", null)}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Remove image
                </button>
              </div>
            </div>
          ) : (
            <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center border border-dashed border-zinc-300 bg-zinc-50 px-5 text-center transition hover:border-purple-300 hover:bg-purple-50/40">
              {uploading ? (
                <Loader2 size={25} className="animate-spin text-purple-600" />
              ) : (
                <ImagePlus size={25} className="text-zinc-400" />
              )}

              <span className="mt-3 text-sm font-semibold text-zinc-700">
                {uploading ? "Uploading image..." : "Choose category image"}
              </span>

              <span className="mt-1 text-xs text-zinc-400">
                Image files up to 10 MB
              </span>

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
          )}
        </section>

        {/* Organisation */}
        <section className="space-y-5 border border-zinc-200 bg-white p-5 sm:p-6">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Organisation</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Control the category hierarchy and display order.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Parent category</label>
              <select
                value={formData.parentId ?? ""}
                onChange={(event) =>
                  updateField("parentId", event.target.value || null)
                }
                className={inputClass}
              >
                <option value="">No parent category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Sort order</label>
              <input
                type="number"
                min={0}
                step={1}
                value={formData.sortOrder}
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

          <label className="flex items-center gap-3 border-t border-zinc-100 pt-5">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(event) => updateField("active", event.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 accent-purple-600"
            />
            <span>
              <span className="block text-sm font-semibold text-zinc-800">
                Active category
              </span>
              <span className="mt-0.5 block text-xs text-zinc-500">
                Allow this category to appear in the public catalogue.
              </span>
            </span>
          </label>
        </section>

        {/* SEO */}
        <section className="space-y-5 border border-zinc-200 bg-white p-5 sm:p-6">
          <div>
            <h2 className="text-base font-bold text-zinc-900">
              Search engine optimisation
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Optional metadata for search engines.
            </p>
          </div>

          <div>
            <label className={labelClass}>SEO title</label>
            <input
              maxLength={160}
              value={formData.seo.title}
              onChange={(event) =>
                updateField("seo", {
                  ...formData.seo,
                  title: event.target.value,
                })
              }
              placeholder="Gaming keyboards | M Tech"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>SEO description</label>
            <textarea
              rows={3}
              maxLength={320}
              value={formData.seo.description}
              onChange={(event) =>
                updateField("seo", {
                  ...formData.seo,
                  description: event.target.value,
                })
              }
              placeholder="Explore our range of gaming keyboards..."
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Link
            href="/admin/categories"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-200 px-5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving || uploading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving
              ? "Saving..."
              : categoryId
                ? "Save changes"
                : "Create category"}
          </button>
        </div>
      </form>
    </div>
  );
}
