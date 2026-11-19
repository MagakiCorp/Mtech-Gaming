"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Building2,
  ImagePlus,
  Loader2,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";

interface ImageAsset {
  url: string;
  publicId: string;
}

interface GeneralSettings {
  businessName: string;
  tagline: string;
  description: string;
  logo: ImageAsset | null;
  favicon: ImageAsset | null;
  currency: "KES";
}

const defaultSettings: GeneralSettings = {
  businessName: "",
  tagline: "",
  description: "",
  logo: null,
  favicon: null,
  currency: "KES",
};

type ImageField = "logo" | "favicon";

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState<GeneralSettings>(defaultSettings);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<ImageField | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/admin/settings/general");

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load settings.");
        }

        if (data.settings) {
          setSettings({
            ...defaultSettings,
            ...data.settings,
          });
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load general settings.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  function updateField<K extends keyof GeneralSettings>(
    field: K,
    value: GeneralSettings[K],
  ) {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function uploadImage(file: File, field: ImageField) {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must not exceed 10MB.");
      return;
    }

    setUploading(field);
    setError("");
    setMessage("");

    try {
      const folder = "m-tech/general";

      // Request a signed upload authorization.
      const signatureResponse = await fetch("/api/admin/cloudinary/signature", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folder }),
      });

      const signatureData = await signatureResponse.json();

      if (!signatureResponse.ok) {
        throw new Error(
          signatureData.error || "Could not authorize image upload.",
        );
      }

      // Upload directly to Cloudinary.
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
        throw new Error(uploadData.error?.message || "Image upload failed.");
      }

      updateField(field, {
        url: uploadData.secure_url,
        publicId: uploadData.public_id,
      });

      setMessage(
        `${field === "logo" ? "Logo" : "Favicon"} uploaded successfully. Save your settings to apply the change.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploading(null);
    }
  }

  function removeImage(field: ImageField) {
    updateField(field, null);

    if (field === "logo" && logoInputRef.current) {
      logoInputRef.current.value = "";
    }

    if (field === "favicon" && faviconInputRef.current) {
      faviconInputRef.current.value = "";
    }

    setMessage("");
    setError("");
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/settings/general", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save settings.");
      }

      setMessage("General settings saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Back to Settings
        </Link>

        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
              <Building2 size={21} />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                General Settings
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your business identity and website branding.
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Business information */}
        <section className="space-y-6 rounded-xl border border-gray-200 bg-white p-5 sm:p-7">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-base font-semibold text-gray-900">
              Business Information
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Basic information about your business.
            </p>
          </div>

          <div className="grid gap-6">
            <div>
              <label
                htmlFor="businessName"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Business Name <span className="text-red-500">*</span>
              </label>

              <input
                id="businessName"
                type="text"
                required
                maxLength={100}
                value={settings.businessName}
                onChange={(event) =>
                  updateField("businessName", event.target.value)
                }
                placeholder="M Tech"
                className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <label
                htmlFor="tagline"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Tagline
              </label>

              <input
                id="tagline"
                type="text"
                maxLength={160}
                value={settings.tagline}
                onChange={(event) => updateField("tagline", event.target.value)}
                placeholder="Your gaming experience, upgraded."
                className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />

              <p className="mt-1.5 text-xs text-gray-400">
                A short phrase that represents your business.
              </p>
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Business Description
              </label>

              <textarea
                id="description"
                rows={4}
                maxLength={1000}
                value={settings.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="Tell customers what your business offers..."
                className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />

              <p className="mt-1.5 text-right text-xs text-gray-400">
                {settings.description.length}/1000
              </p>
            </div>
          </div>
        </section>

        {/* Branding */}
        <section className="space-y-6 rounded-xl border border-gray-200 bg-white p-5 sm:p-7">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-base font-semibold text-gray-900">
              Website Branding
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Upload the images used to identify your website.
            </p>
          </div>

          {/* Logo */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-gray-800">
                Business Logo
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Used in your website header and other branding areas.
              </p>
            </div>

            <div className="flex flex-col gap-4 rounded-lg border border-dashed border-gray-300 p-4 sm:flex-row sm:items-center">
              <div className="flex h-24 w-full items-center justify-center overflow-hidden rounded-lg bg-gray-50 sm:w-40">
                {settings.logo ? (
                  <img
                    src={settings.logo.url}
                    alt="Business logo preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <ImagePlus size={25} />
                    <span className="text-xs">No logo uploaded</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadImage(file, "logo");
                    event.target.value = "";
                  }}
                />

                <button
                  type="button"
                  disabled={uploading !== null}
                  onClick={() => logoInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploading === "logo" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Upload size={16} />
                  )}
                  {settings.logo ? "Replace Logo" : "Upload Logo"}
                </button>

                {settings.logo && (
                  <button
                    type="button"
                    disabled={uploading !== null}
                    onClick={() => removeImage("logo")}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                    Remove
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-400">
              Recommended: transparent PNG or SVG. Maximum file size: 10MB.
            </p>
          </div>

          <div className="border-t border-gray-100" />

          {/* Favicon */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-gray-800">
                Website Favicon
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                The small icon displayed in browser tabs.
              </p>
            </div>

            <div className="flex flex-col gap-4 rounded-lg border border-dashed border-gray-300 p-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                {settings.favicon ? (
                  <img
                    src={settings.favicon.url}
                    alt="Favicon preview"
                    className="h-12 w-12 object-contain"
                  />
                ) : (
                  <ImagePlus size={25} className="text-gray-400" />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={faviconInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadImage(file, "favicon");
                    event.target.value = "";
                  }}
                />

                <button
                  type="button"
                  disabled={uploading !== null}
                  onClick={() => faviconInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploading === "favicon" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Upload size={16} />
                  )}
                  {settings.favicon ? "Replace Favicon" : "Upload Favicon"}
                </button>

                {settings.favicon && (
                  <button
                    type="button"
                    disabled={uploading !== null}
                    onClick={() => removeImage("favicon")}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                    Remove
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-400">
              Recommended: square PNG or ICO, ideally 32 × 32 pixels.
            </p>
          </div>
        </section>

        {/* Currency */}
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 sm:p-7">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Regional Settings
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Currency used when displaying product prices.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Store Currency
            </label>

            <div className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-3 sm:max-w-xs">
              <span className="text-sm font-medium text-gray-800">
                Kenyan Shilling (KES)
              </span>
              <span className="text-xs font-semibold text-gray-500">KES</span>
            </div>

            <p className="mt-2 text-xs text-gray-400">
              Currency is fixed to KES for this store.
            </p>
          </div>
        </section>

        {/* Feedback */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {/* Save */}
        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-end">
          <Link
            href="/admin/settings"
            className="rounded-lg border border-gray-200 px-5 py-2.5 text-center text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving || uploading !== null}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
