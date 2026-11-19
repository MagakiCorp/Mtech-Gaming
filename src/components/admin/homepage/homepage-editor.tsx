"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Monitor,
  Save,
  Trash2,
  UploadCloud,
} from "lucide-react";
import type { HomepageSettings, ImageAsset } from "@/types";

import ProductSelections from "./product-selections";
import PromotionSelections from "./promotion-selections";
import type {
  HomepageProductOption,
  HomepagePromotionOption,
} from "@/types/admin-homepage";

type HomepageEditorData = Pick<
  HomepageSettings,
  | "hero"
  | "featuredProductIds"
  | "bestSellerProductIds"
  | "newArrivalProductIds"
  | "promotionIds"
  | "sectionVisibility"
  | "sectionOrder"
>;

type SectionKey = keyof HomepageSettings["sectionVisibility"];

interface HomepageEditorProps {
  initialSettings: HomepageEditorData;
  products: HomepageProductOption[];
  promotions: HomepagePromotionOption[];
}

interface CloudinarySignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
}

const sections: { id: SectionKey; label: string; description: string }[] = [
  {
    id: "categories",
    label: "Categories",
    description: "Display product categories on the homepage.",
  },
  {
    id: "featuredProducts",
    label: "Featured products",
    description: "Display products selected as featured.",
  },
  {
    id: "promotions",
    label: "Promotions",
    description: "Display selected promotional campaigns.",
  },
  {
    id: "bestSellers",
    label: "Best sellers",
    description: "Highlight your best-selling products.",
  },
  {
    id: "newArrivals",
    label: "New arrivals",
    description: "Display your latest products.",
  },
  {
    id: "testimonials",
    label: "Testimonials",
    description: "Display approved customer testimonials.",
  },
];

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100";

const sectionClass = "border border-zinc-200 bg-white p-5 sm:p-7";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const HERO_IMAGE_FOLDER = "m-tech/homepage";

async function cleanupUploadedImages(publicIds: string[]) {
  const uniqueIds = [...new Set(publicIds)].filter(Boolean);

  if (uniqueIds.length === 0) return;

  try {
    await fetch("/api/admin/cloudinary/cleanup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publicIds: uniqueIds }),
      keepalive: true,
    });
  } catch (error) {
    console.error("Failed to clean up temporary homepage images:", error);
  }
}

export default function HomepageEditor({
  initialSettings,
  products,
  promotions,
}: HomepageEditorProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingImageIds = useRef<string[]>([]);

  // Clean up uploaded images that were never saved to Firestore.
  useEffect(() => {
    return () => {
      const pendingIds = [...pendingImageIds.current];
      pendingImageIds.current = [];

      void cleanupUploadedImages(pendingIds);
    };
  }, []);

  function updateHero(
    field: "heading" | "subheading" | "ctaText" | "ctaLink",
    value: string,
  ) {
    setSettings((current) => ({
      ...current,
      hero: {
        ...current.hero,
        [field]: value,
      },
    }));

    setSaved(false);
  }

  async function uploadHeroImage(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("The image must be 10 MB or smaller.");
      return;
    }

    setUploadingImage(true);
    setError("");
    setSaved(false);

    try {
      const signatureResponse = await fetch("/api/admin/cloudinary/signature", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folder: HERO_IMAGE_FOLDER }),
      });

      const signatureData = await signatureResponse.json();

      if (!signatureResponse.ok) {
        throw new Error(
          signatureData.error || "Unable to prepare image upload.",
        );
      }

      const signature = signatureData as CloudinarySignature;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signature.apiKey);
      formData.append("timestamp", String(signature.timestamp));
      formData.append("folder", signature.folder);
      formData.append("signature", signature.signature);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error?.message || "Image upload failed.");
      }

      const uploadedImage = uploadData as CloudinaryUploadResponse;

      if (!uploadedImage.secure_url || !uploadedImage.public_id) {
        throw new Error("Cloudinary returned an invalid image response.");
      }

      const imageAsset: ImageAsset = {
        url: uploadedImage.secure_url,
        publicId: uploadedImage.public_id,
      };

      pendingImageIds.current.push(imageAsset.publicId);

      // A previously uploaded but unsaved image can now be discarded.
      const previousImage = settings.hero.image;

      if (
        previousImage?.publicId &&
        pendingImageIds.current.includes(previousImage.publicId)
      ) {
        pendingImageIds.current = pendingImageIds.current.filter(
          (id) => id !== previousImage.publicId,
        );

        void cleanupUploadedImages([previousImage.publicId]);
      }

      setSettings((current) => ({
        ...current,
        hero: {
          ...current.hero,
          image: imageAsset,
        },
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to upload hero image.",
      );
    } finally {
      setUploadingImage(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function removeHeroImage() {
    const currentImage = settings.hero.image;

    if (
      currentImage?.publicId &&
      pendingImageIds.current.includes(currentImage.publicId)
    ) {
      pendingImageIds.current = pendingImageIds.current.filter(
        (id) => id !== currentImage.publicId,
      );

      void cleanupUploadedImages([currentImage.publicId]);
    }

    setSettings((current) => ({
      ...current,
      hero: {
        ...current.hero,
        image: null,
      },
    }));

    setSaved(false);
    setError("");
  }

  function toggleSection(id: SectionKey) {
    setSettings((current) => ({
      ...current,
      sectionVisibility: {
        ...current.sectionVisibility,
        [id]: !current.sectionVisibility[id],
      },
    }));

    setSaved(false);
  }

  function moveSection(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= settings.sectionOrder.length) {
      return;
    }

    setSettings((current) => {
      const nextOrder = [...current.sectionOrder];

      [nextOrder[index], nextOrder[nextIndex]] = [
        nextOrder[nextIndex],
        nextOrder[index],
      ];

      return {
        ...current,
        sectionOrder: nextOrder,
      };
    });

    setSaved(false);
  }

  function updateProductSelection(
    field:
      | "featuredProductIds"
      | "bestSellerProductIds"
      | "newArrivalProductIds",
    ids: string[],
  ) {
    setSettings((current) => ({
      ...current,
      [field]: ids,
    }));

    setSaved(false);
  }

  function updatePromotionSelection(ids: string[]) {
    setSettings((current) => ({
      ...current,
      promotionIds: ids,
    }));

    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const response = await fetch("/api/admin/homepage", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hero: {
            heading: settings.hero.heading,
            subheading: settings.hero.subheading,
            ctaText: settings.hero.ctaText,
            ctaLink: settings.hero.ctaLink,
            image: settings.hero.image,
          },
          sectionVisibility: settings.sectionVisibility,
          sectionOrder: settings.sectionOrder,
          featuredProductIds: settings.featuredProductIds,
          bestSellerProductIds: settings.bestSellerProductIds,
          newArrivalProductIds: settings.newArrivalProductIds,
          promotionIds: settings.promotionIds,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save homepage settings.");
      }

      // The selected uploaded image is now persisted.
      pendingImageIds.current = [];

      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving.",
      );
    } finally {
      setSaving(false);
    }
  }

  const orderedSections = settings.sectionOrder
    .map((id) => sections.find((section) => section.id === id))
    .filter((section): section is (typeof sections)[number] =>
      Boolean(section),
    );

  return (
    <div className="space-y-8 pb-12">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-purple-600">
            Website management
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
            Homepage
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
            Manage your homepage content, control which sections appear and
            arrange their display order.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || uploadingImage}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <Save size={17} />
          )}
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <Check size={17} />
          Homepage settings saved successfully.
        </div>
      )}

      {/* Hero section */}
      <section className={sectionClass}>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              Hero section
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Configure the main introduction visitors see when they visit your
              website.
            </p>
          </div>

          <div className="hidden h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-700 sm:flex">
            <Monitor size={20} />
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Main heading
            </label>

            <input
              type="text"
              maxLength={120}
              value={settings.hero.heading}
              onChange={(event) => updateHero("heading", event.target.value)}
              placeholder="Enter your homepage heading"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Subheading
            </label>

            <textarea
              rows={3}
              maxLength={300}
              value={settings.hero.subheading}
              onChange={(event) => updateHero("subheading", event.target.value)}
              placeholder="Write a short introduction to your store"
              className={`${inputClass} resize-y`}
            />
            <p className="mt-1.5 text-right text-xs text-zinc-400">
              {settings.hero.subheading.length}/300
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Button text
              </label>

              <input
                type="text"
                maxLength={40}
                value={settings.hero.ctaText}
                onChange={(event) => updateHero("ctaText", event.target.value)}
                placeholder="Explore Products"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Button link
              </label>

              <input
                type="text"
                maxLength={500}
                value={settings.hero.ctaLink}
                onChange={(event) => updateHero("ctaLink", event.target.value)}
                placeholder="/products"
                className={inputClass}
              />
            </div>
          </div>

          {/* Hero image management */}
          <div className="border-t border-zinc-100 pt-5">
            <div className="mb-3">
              <p className="text-sm font-medium text-zinc-700">Hero image</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Upload a wide image for your homepage introduction. Maximum file
                size: 10 MB.
              </p>
            </div>

            {settings.hero.image ? (
              <div className="overflow-hidden rounded-lg border border-zinc-200">
                <div className="relative aspect-[16/7] bg-zinc-100">
                  <img
                    src={settings.hero.image.url}
                    alt="Homepage hero preview"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-50 px-4 py-3">
                  <p className="text-xs text-zinc-500">Hero image selected</p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:border-purple-300 hover:text-purple-700 disabled:opacity-50"
                    >
                      <ImagePlus size={15} />
                      Replace image
                    </button>

                    <button
                      type="button"
                      onClick={removeHeroImage}
                      disabled={uploadingImage}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50/70 px-5 py-10 text-center transition hover:border-purple-300 hover:bg-purple-50/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadingImage ? (
                  <Loader2
                    size={25}
                    className="mb-3 animate-spin text-purple-700"
                  />
                ) : (
                  <UploadCloud size={25} className="mb-3 text-zinc-400" />
                )}

                <span className="text-sm font-semibold text-zinc-700">
                  {uploadingImage ? "Uploading image..." : "Upload hero image"}
                </span>

                <span className="mt-1 text-xs text-zinc-400">
                  Choose an image from your device
                </span>
              </button>
            )}

            {uploadingImage && settings.hero.image && (
              <p className="mt-2 flex items-center gap-2 text-xs text-purple-700">
                <Loader2 size={13} className="animate-spin" />
                Uploading replacement image...
              </p>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadHeroImage(file);
              }}
            />
          </div>
        </div>
      </section>

      {/* Product selections */}
      <section className={sectionClass}>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-zinc-900">
            Homepage products
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Choose and arrange the products you want visitors to discover.
          </p>
        </div>

        <ProductSelections
          products={products}
          featuredProductIds={settings.featuredProductIds}
          bestSellerProductIds={settings.bestSellerProductIds}
          newArrivalProductIds={settings.newArrivalProductIds}
          onChange={updateProductSelection}
        />
      </section>

      {/* Promotion selections */}
      <section className={sectionClass}>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-zinc-900">
            Homepage promotions
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Choose and arrange the promotions you want to feature on your
            homepage.
          </p>
        </div>

        <PromotionSelections
          promotions={promotions}
          promotionIds={settings.promotionIds}
          onChange={updatePromotionSelection}
        />
      </section>

      {/* Section visibility */}
      <section className={sectionClass}>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-zinc-900">
            Section visibility
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Choose which sections should appear on your public homepage.
          </p>
        </div>

        <div className="divide-y divide-zinc-100">
          {sections.map((section) => {
            const enabled = settings.sectionVisibility[section.id];

            return (
              <div
                key={section.id}
                className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-800">
                    {section.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    {section.description}
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={`Toggle ${section.label}`}
                  onClick={() => toggleSection(section.id)}
                  className={`relative flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                    enabled ? "bg-purple-700" : "bg-zinc-300"
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section ordering */}
      <section className={sectionClass}>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-zinc-900">
            Homepage section order
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Arrange how sections appear as visitors scroll down your homepage.
          </p>
        </div>

        <div className="space-y-2">
          {orderedSections.map((section, index) => {
            const enabled = settings.sectionVisibility[section.id];

            return (
              <div
                key={section.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50/70 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-xs font-semibold text-zinc-500 ring-1 ring-zinc-200">
                    {index + 1}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-800">
                      {section.label}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {enabled ? "Visible" : "Hidden"}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {enabled ? (
                    <Eye size={15} className="mr-2 text-green-600" />
                  ) : (
                    <EyeOff size={15} className="mr-2 text-zinc-400" />
                  )}

                  <button
                    type="button"
                    onClick={() => moveSection(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${section.label} up`}
                    className="rounded-md p-2 text-zinc-500 transition hover:bg-white hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ArrowUp size={17} />
                  </button>

                  <button
                    type="button"
                    onClick={() => moveSection(index, 1)}
                    disabled={index === orderedSections.length - 1}
                    aria-label={`Move ${section.label} down`}
                    className="rounded-md p-2 text-zinc-500 transition hover:bg-white hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ArrowDown size={17} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom save action */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || uploadingImage}
          className="inline-flex items-center gap-2 rounded-lg bg-purple-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <Save size={17} />
          )}
          {saving ? "Saving..." : "Save homepage"}
        </button>
      </div>
    </div>
  );
}
