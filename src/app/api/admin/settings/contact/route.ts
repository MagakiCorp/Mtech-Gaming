import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { hasAdminSession } from "@/lib/auth/api-session";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const SOCIAL_PLATFORMS = [
  "facebook",
  "instagram",
  "tiktok",
  "youtube",
] as const;

interface BusinessHour {
  day: string;
  openingTime: string;
  closingTime: string;
  closed: boolean;
}

interface ContactSettingsInput {
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

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isValidUrl(value: string): boolean {
  if (!value) return true;

  try {
    const url = new URL(value);

    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function validateContactSettings(
  body: Record<string, unknown>,
): ContactSettingsInput | null {
  const {
    phone,
    whatsappNumber,
    email,
    address,
    location,
    businessHours,
    socialLinks,
  } = body;

  if (
    !isString(phone) ||
    !isString(whatsappNumber) ||
    !isString(email) ||
    !isString(address) ||
    !isString(location)
  ) {
    return null;
  }

  const normalizedEmail = email.trim();

  if (
    phone.length > 30 ||
    whatsappNumber.length > 30 ||
    normalizedEmail.length > 254 ||
    (normalizedEmail !== "" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) ||
    address.length > 300 ||
    location.length > 300
  ) {
    return null;
  }

  if (!Array.isArray(businessHours) || businessHours.length !== 7) {
    return null;
  }

  const normalizedHours: BusinessHour[] = [];

  for (const day of DAYS) {
    const entry = businessHours.find(
      (item) =>
        item &&
        typeof item === "object" &&
        (item as Record<string, unknown>).day === day,
    ) as Record<string, unknown> | undefined;

    if (
      !entry ||
      !isString(entry.openingTime) ||
      !isString(entry.closingTime) ||
      typeof entry.closed !== "boolean"
    ) {
      return null;
    }

    if (
      (!entry.closed &&
        (!isValidTime(entry.openingTime) || !isValidTime(entry.closingTime))) ||
      (entry.closed &&
        entry.openingTime !== "" &&
        !isValidTime(entry.openingTime)) ||
      (entry.closed &&
        entry.closingTime !== "" &&
        !isValidTime(entry.closingTime))
    ) {
      return null;
    }

    normalizedHours.push({
      day,
      openingTime: entry.closed ? "" : entry.openingTime,
      closingTime: entry.closed ? "" : entry.closingTime,
      closed: entry.closed,
    });
  }

  if (
    !socialLinks ||
    typeof socialLinks !== "object" ||
    Array.isArray(socialLinks)
  ) {
    return null;
  }

  const links = socialLinks as Record<string, unknown>;

  const normalizedLinks = {} as ContactSettingsInput["socialLinks"];

  for (const platform of SOCIAL_PLATFORMS) {
    const value = links[platform];

    if (!isString(value) || value.length > 500) {
      return null;
    }

    const trimmed = value.trim();

    if (!isValidUrl(trimmed)) {
      return null;
    }

    normalizedLinks[platform] = trimmed;
  }

  return {
    phone: phone.trim(),
    whatsappNumber: whatsappNumber.trim(),
    email: normalizedEmail,
    address: address.trim(),
    location: location.trim(),
    businessHours: normalizedHours,
    socialLinks: normalizedLinks,
  };
}

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const snapshot = await adminDb.collection("settings").doc("contact").get();

    return NextResponse.json({
      settings: snapshot.exists ? snapshot.data() : null,
    });
  } catch (error) {
    console.error("Failed to fetch contact settings:", error);

    return NextResponse.json(
      { error: "Failed to load contact settings." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;

    const settings = validateContactSettings(body);

    if (!settings) {
      return NextResponse.json(
        {
          error:
            "Please check your contact details, business hours and social links.",
        },
        { status: 400 },
      );
    }

    const settingsRef = adminDb.collection("settings").doc("contact");

    const existingSnapshot = await settingsRef.get();

    await settingsRef.set(
      {
        ...settings,
        updatedAt: FieldValue.serverTimestamp(),
        ...(!existingSnapshot.exists && {
          createdAt: FieldValue.serverTimestamp(),
        }),
      },
      { merge: true },
    );

    return NextResponse.json({
      message: "Contact settings saved successfully.",
      settings,
    });
  } catch (error) {
    console.error("Failed to update contact settings:", error);

    return NextResponse.json(
      { error: "Failed to save contact settings." },
      { status: 500 },
    );
  }
}
