"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
} from "lucide-react";

interface BusinessHour {
  day: string;
  openingTime: string;
  closingTime: string;
  closed: boolean;
}

interface ContactSettings {
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  location: string;
  businessHours: BusinessHour[];
  socialLinks: {
    facebook: string;
    instagram: string;
    tiktok: string;
    youtube: string;
  };
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const defaultSettings: ContactSettings = {
  phone: "",
  whatsappNumber: "",
  email: "",
  address: "",
  location: "",
  businessHours: DAYS.map((day) => ({
    day,
    openingTime: "08:00",
    closingTime: "18:00",
    closed: day === "Sunday",
  })),
  socialLinks: {
    facebook: "",
    instagram: "",
    tiktok: "",
    youtube: "",
  },
};

export default function ContactSettingsPage() {
  const [settings, setSettings] = useState<ContactSettings>(defaultSettings);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/admin/settings/contact");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load contact settings.");
        }

        if (data.settings) {
          const saved = data.settings;

          setSettings({
            ...defaultSettings,
            ...saved,
            businessHours: DAYS.map((day) => {
              const existing = saved.businessHours?.find(
                (item: BusinessHour) => item.day === day,
              );

              return existing
                ? { ...existing }
                : defaultSettings.businessHours.find(
                    (item) => item.day === day,
                  )!;
            }),
            socialLinks: {
              ...defaultSettings.socialLinks,
              ...saved.socialLinks,
            },
          });
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load contact settings.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  function updateField(
    field: "phone" | "whatsappNumber" | "email" | "address" | "location",
    value: string,
  ) {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateBusinessHour(
    day: string,
    field: keyof BusinessHour,
    value: string | boolean,
  ) {
    setSettings((current) => ({
      ...current,
      businessHours: current.businessHours.map((hour) =>
        hour.day === day ? { ...hour, [field]: value } : hour,
      ),
    }));
  }

  function updateSocialLink(
    platform: keyof ContactSettings["socialLinks"],
    value: string,
  ) {
    setSettings((current) => ({
      ...current,
      socialLinks: {
        ...current.socialLinks,
        [platform]: value,
      },
    }));
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/settings/contact", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save contact settings.");
      }

      setMessage("Contact settings saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save contact settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100";

  const labelClass = "mb-2 block text-sm font-medium text-gray-700";

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

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
            <Phone size={21} />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Contact Settings
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage how customers reach your business.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Contact information */}
        <section className="space-y-6 rounded-xl border border-gray-200 bg-white p-5 sm:p-7">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <Phone size={19} className="text-purple-600" />
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Contact Information
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Your primary business contact details.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className={labelClass}>
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                maxLength={30}
                value={settings.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="+254 7XX XXX XXX"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="whatsapp" className={labelClass}>
                WhatsApp Number
              </label>
              <input
                id="whatsapp"
                type="tel"
                maxLength={30}
                value={settings.whatsappNumber}
                onChange={(event) =>
                  updateField("whatsappNumber", event.target.value)
                }
                placeholder="+254 7XX XXX XXX"
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-gray-400">
                Include the country code.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="email" className={labelClass}>
                Business Email
              </label>
              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  id="email"
                  type="email"
                  maxLength={254}
                  value={settings.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="info@example.com"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="space-y-6 rounded-xl border border-gray-200 bg-white p-5 sm:p-7">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <MapPin size={19} className="text-purple-600" />
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Business Location
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Where customers can find your business.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="address" className={labelClass}>
              Physical Address
            </label>
            <input
              id="address"
              type="text"
              maxLength={300}
              value={settings.address}
              onChange={(event) => updateField("address", event.target.value)}
              placeholder="Street, building, floor or shop number"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="location" className={labelClass}>
              Location Description
            </label>
            <textarea
              id="location"
              rows={3}
              maxLength={300}
              value={settings.location}
              onChange={(event) => updateField("location", event.target.value)}
              placeholder="e.g. Located in Nairobi CBD, near..."
              className={`${inputClass} resize-y`}
            />
            <p className="mt-1.5 text-xs text-gray-400">
              A short description to help customers locate you.
            </p>
          </div>
        </section>

        {/* Business hours */}
        <section className="space-y-6 rounded-xl border border-gray-200 bg-white p-5 sm:p-7">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <Clock size={19} className="text-purple-600" />
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Business Hours
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Set your opening and closing times for each day.
              </p>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {settings.businessHours.map((hour) => (
              <div
                key={hour.day}
                className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center justify-between sm:w-36">
                  <span className="text-sm font-medium text-gray-800">
                    {hour.day}
                  </span>

                  <label className="flex cursor-pointer items-center gap-2 sm:hidden">
                    <input
                      type="checkbox"
                      checked={hour.closed}
                      onChange={(event) =>
                        updateBusinessHour(
                          hour.day,
                          "closed",
                          event.target.checked,
                        )
                      }
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-xs text-gray-500">Closed</span>
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:flex-1 sm:justify-end">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 sm:sr-only">
                      Opens
                    </label>
                    <input
                      type="time"
                      aria-label={`${hour.day} opening time`}
                      value={hour.openingTime}
                      disabled={hour.closed}
                      onChange={(event) =>
                        updateBusinessHour(
                          hour.day,
                          "openingTime",
                          event.target.value,
                        )
                      }
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-purple-500 disabled:bg-gray-50 disabled:text-gray-400"
                    />

                    <span className="text-xs text-gray-400">to</span>

                    <input
                      type="time"
                      aria-label={`${hour.day} closing time`}
                      value={hour.closingTime}
                      disabled={hour.closed}
                      onChange={(event) =>
                        updateBusinessHour(
                          hour.day,
                          "closingTime",
                          event.target.value,
                        )
                      }
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-purple-500 disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>

                  <label className="hidden cursor-pointer items-center gap-2 sm:flex">
                    <input
                      type="checkbox"
                      checked={hour.closed}
                      onChange={(event) =>
                        updateBusinessHour(
                          hour.day,
                          "closed",
                          event.target.checked,
                        )
                      }
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-xs text-gray-500">Closed</span>
                  </label>

                  {hour.closed && (
                    <span className="text-xs font-medium text-gray-400">
                      Closed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Social media */}
        <section className="space-y-6 rounded-xl border border-gray-200 bg-white p-5 sm:p-7">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-base font-semibold text-gray-900">
              Social Media
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Add links to your official social media profiles.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="facebook" className={labelClass}>
                Facebook
              </label>
              <div className="relative">
                
                <input
                  id="facebook"
                  type="url"
                  value={settings.socialLinks.facebook}
                  onChange={(event) =>
                    updateSocialLink("facebook", event.target.value)
                  }
                  placeholder="https://facebook.com/yourpage"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="instagram" className={labelClass}>
                Instagram
              </label>
              <div className="relative">
                
                <input
                  id="instagram"
                  type="url"
                  value={settings.socialLinks.instagram}
                  onChange={(event) =>
                    updateSocialLink("instagram", event.target.value)
                  }
                  placeholder="https://instagram.com/yourprofile"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="tiktok" className={labelClass}>
                TikTok
              </label>
              <input
                id="tiktok"
                type="url"
                value={settings.socialLinks.tiktok}
                onChange={(event) =>
                  updateSocialLink("tiktok", event.target.value)
                }
                placeholder="https://tiktok.com/@yourprofile"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="youtube" className={labelClass}>
                YouTube
              </label>
              <div className="relative">
                <input
                  id="youtube"
                  type="url"
                  value={settings.socialLinks.youtube}
                  onChange={(event) =>
                    updateSocialLink("youtube", event.target.value)
                  }
                  placeholder="https://youtube.com/@yourchannel"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>
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
            disabled={saving}
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
