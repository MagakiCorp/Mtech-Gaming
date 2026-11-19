"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  AlertCircle,
  Check,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import type { ImageAsset, SeoSettings } from "@/types";

const TITLE_LIMIT = 60;
const DESCRIPTION_LIMIT = 160;
const IMAGE_FOLDER = "m-tech/seo";

interface SeoFormData {
  siteTitle: string;
  siteDescription: string;
  keywords: string[];
  defaultOgImage: ImageAsset | null;
}

const initialFormData: SeoFormData = {
  siteTitle: "",
  siteDescription: "",
  keywords: [],
  defaultOgImage: null,
};

export default function SeoSettingsPage() {
  const [formData, setFormData] = useState<SeoFormData>(initialFormData);
  const [keywordInput, setKeywordInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/settings/seo");

      if (!response.ok) {
        throw new Error("Failed to load SEO settings.");
      }

      const result = await response.json();
      const settings = result.settings as SeoSettings | null;

      if (settings) {
        setFormData({
          siteTitle: settings.siteTitle ?? "",
          siteDescription: settings.siteDescription ?? "",
          keywords: settings.keywords ?? [],
          defaultOgImage: settings.defaultOgImage ?? null,
        });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading settings.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  function updateField<K extends keyof SeoFormData>(
    field: K,
    value: SeoFormData[K],
  ) {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    setSuccess("");
  }

  function addKeyword() {
    const keyword = keywordInput.trim().replace(/,+$/, "").trim();

    if (!keyword) return;

    const exists = formData.keywords.some(
      (item) => item.toLowerCase() === keyword.toLowerCase(),
    );

    if (exists) {
      setKeywordInput("");
      return;
    }

    updateField("keywords", [...formData.keywords, keyword]);
    setKeywordInput("");
  }

  function handleKeywordKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addKeyword();
    }

    if (
      event.key === "Backspace" &&
      !keywordInput &&
      formData.keywords.length
    ) {
      updateField("keywords", formData.keywords.slice(0, -1));
    }
  }

  function removeKeyword(keyword: string) {
    updateField(
      "keywords",
      formData.keywords.filter((item) => item !== keyword),
    );
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    event.target.value = "";

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("The Open Graph image must be smaller than 5 MB.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      // Request a signed Cloudinary upload.
      const signatureResponse = await fetch("/api/admin/cloudinary/signature", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folder: IMAGE_FOLDER,
        }),
      });

      if (!signatureResponse.ok) {
        throw new Error("Could not prepare the image upload.");
      }

      const signatureData = await signatureResponse.json();

      const uploadData = new FormData();

      uploadData.append("file", file);
      uploadData.append("api_key", signatureData.apiKey);
      uploadData.append("timestamp", String(signatureData.timestamp));
      uploadData.append("signature", signatureData.signature);
      uploadData.append("folder", signatureData.folder);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
        {
          method: "POST",
          body: uploadData,
        },
      );

      if (!uploadResponse.ok) {
        throw new Error("Image upload failed. Please try again.");
      }

      const uploadedImage = await uploadResponse.json();

      updateField("defaultOgImage", {
        url: uploadedImage.secure_url,
        publicId: uploadedImage.public_id,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while uploading the image.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const siteTitle = formData.siteTitle.trim();
    const siteDescription = formData.siteDescription.trim();

    if (!siteTitle) {
      setError("Please enter an SEO title.");
      return;
    }

    if (!siteDescription) {
      setError("Please enter an SEO description.");
      return;
    }

    if (siteTitle.length > TITLE_LIMIT) {
      setError(`The SEO title cannot exceed ${TITLE_LIMIT} characters.`);
      return;
    }

    if (siteDescription.length > DESCRIPTION_LIMIT) {
      setError(
        `The SEO description cannot exceed ${DESCRIPTION_LIMIT} characters.`,
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/admin/settings/seo", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          siteTitle,
          siteDescription,
          keywords: formData.keywords,
          defaultOgImage: formData.defaultOgImage,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save SEO settings.");
      }

      setSuccess("SEO settings saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-purple-700">
          <Search size={16} />
          Settings
          <span className="text-gray-400">/</span>
          <span className="text-gray-600">SEO</span>
        </div>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            SEO Settings
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage how your website appears in search engines and when shared on
            social platforms.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setError("")}
            className="ml-auto"
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <Check size={17} />
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-7">
        {/* Search engine metadata */}
        <section className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
            <h2 className="font-semibold text-gray-900">
              Search engine appearance
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Set the default title and description used by search engines.
            </p>
          </div>

          <div className="space-y-6 p-5 sm:p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="siteTitle"
                  className="text-sm font-medium text-gray-700"
                >
                  SEO title
                </label>
                <span
                  className={`text-xs tabular-nums ${
                    formData.siteTitle.length > TITLE_LIMIT
                      ? "text-red-600"
                      : "text-gray-400"
                  }`}
                >
                  {formData.siteTitle.length}/{TITLE_LIMIT}
                </span>
              </div>

              <input
                id="siteTitle"
                type="text"
                maxLength={TITLE_LIMIT}
                value={formData.siteTitle}
                onChange={(event) =>
                  updateField("siteTitle", event.target.value)
                }
                placeholder="M Tech | Gaming Accessories"
                className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />

              <p className="text-xs text-gray-400">
                Keep your title concise and include your brand name.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="siteDescription"
                  className="text-sm font-medium text-gray-700"
                >
                  Meta description
                </label>
                <span
                  className={`text-xs tabular-nums ${
                    formData.siteDescription.length > DESCRIPTION_LIMIT
                      ? "text-red-600"
                      : "text-gray-400"
                  }`}
                >
                  {formData.siteDescription.length}/{DESCRIPTION_LIMIT}
                </span>
              </div>

              <textarea
                id="siteDescription"
                rows={4}
                maxLength={DESCRIPTION_LIMIT}
                value={formData.siteDescription}
                onChange={(event) =>
                  updateField("siteDescription", event.target.value)
                }
                placeholder="Discover quality gaming accessories, controllers, headsets and more at M Tech."
                className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />

              <p className="text-xs text-gray-400">
                Write a clear summary that explains what your website offers.
              </p>
            </div>
          </div>
        </section>

        {/* Keywords */}
        <section className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
            <h2 className="font-semibold text-gray-900">Search keywords</h2>
            <p className="mt-1 text-sm text-gray-500">
              Add relevant terms that describe your business and products.
            </p>
          </div>

          <div className="space-y-4 p-5 sm:p-6">
            <div className="flex flex-wrap gap-2">
              {formData.keywords.length === 0 ? (
                <p className="text-sm text-gray-400">No keywords added yet.</p>
              ) : (
                formData.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex items-center gap-2 rounded-md border border-purple-100 bg-purple-50 px-3 py-1.5 text-sm text-purple-800"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      className="rounded text-purple-500 transition hover:text-red-600"
                      aria-label={`Remove ${keyword}`}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                onKeyDown={handleKeywordKeyDown}
                placeholder="Enter a keyword"
                className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />

              <button
                type="button"
                onClick={addKeyword}
                disabled={!keywordInput.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={16} />
                Add keyword
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Press Enter or comma to add a keyword. Duplicate keywords are
              ignored.
            </p>
          </div>
        </section>

        {/* Open Graph image */}
        <section className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
            <h2 className="font-semibold text-gray-900">
              Social sharing image
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Default Open Graph image displayed when your website is shared.
            </p>
          </div>

          <div className="p-5 sm:p-6">
            {formData.defaultOgImage ? (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                  <img
                    src={formData.defaultOgImage.url}
                    alt="Open Graph preview"
                    className="aspect-[1200/630] w-full object-cover"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Open Graph image
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      Recommended dimensions: 1200 × 630 pixels.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Upload size={15} />
                      Replace
                    </button>

                    <button
                      type="button"
                      onClick={() => updateField("defaultOgImage", null)}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
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
                disabled={uploading}
                className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 px-5 py-12 text-center transition hover:border-purple-300 hover:bg-purple-50/30 disabled:cursor-wait"
              >
                {uploading ? (
                  <Loader2 className="mb-3 h-8 w-8 animate-spin text-purple-600" />
                ) : (
                  <ImagePlus className="mb-3 h-8 w-8 text-gray-400" />
                )}

                <span className="text-sm font-medium text-gray-800">
                  {uploading ? "Uploading image..." : "Upload Open Graph image"}
                </span>

                <span className="mt-1 text-xs text-gray-400">
                  PNG, JPG or WebP · Maximum 5 MB
                </span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />

            <p className="mt-4 text-xs leading-5 text-gray-400">
              Use a 1200 × 630 pixel image for best compatibility with social
              platforms. The image is uploaded to your Cloudinary SEO folder.
            </p>
          </div>
        </section>

        {/* Save */}
        <div className="flex flex-col-reverse justify-end gap-3 border-t border-gray-200 pt-5 sm:flex-row">
          <button
            type="button"
            onClick={() => void loadSettings()}
            disabled={saving || uploading}
            className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Reset changes
          </button>

          <button
            type="submit"
            disabled={saving || uploading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving ? "Saving..." : "Save SEO settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
