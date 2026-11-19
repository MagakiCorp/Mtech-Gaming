import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { adminDb } from "@/lib/firebase-admin";
import ContactContent from "@/components/public/contact/contact-content";

import type { ContactSettings } from "@/types/settings";

type PublicContactSettings = Pick<
  ContactSettings,
  | "phone"
  | "whatsappNumber"
  | "email"
  | "address"
  | "location"
  | "businessHours"
  | "socialLinks"
>;

async function getPublicContactSettings(): Promise<PublicContactSettings> {
  const snapshot = await adminDb.collection("settings").doc("contact").get();

  if (!snapshot.exists) {
    return {
      phone: "",
      whatsappNumber: "",
      email: "",
      address: "",
      location: "",
      businessHours: [],
      socialLinks: {
        facebook: "",
        instagram: "",
        tiktok: "",
        youtube: "",
      },
    };
  }

  const data = snapshot.data()!;

  return {
    phone: data.phone ?? "",
    whatsappNumber: data.whatsappNumber ?? "",
    email: data.email ?? "",
    address: data.address ?? "",
    location: data.location ?? "",
    businessHours: data.businessHours ?? [],
    socialLinks: {
      facebook: data.socialLinks?.facebook ?? "",
      instagram: data.socialLinks?.instagram ?? "",
      tiktok: data.socialLinks?.tiktok ?? "",
      youtube: data.socialLinks?.youtube ?? "",
    },
  };
}

export async function generateMetadata(): Promise<Metadata> {
  await connection();

  return {
    title: "Contact Us | M Tech",
    description:
      "Get in touch with M Tech for gaming accessories, product enquiries, pricing, and availability.",
    alternates: {
      canonical: "/contact",
    },
  };
}

export default function ContactPage() {
  return (
    <Suspense fallback={null}>
      <ContactPageContent />
    </Suspense>
  );
}

async function ContactPageContent() {
  await connection();

  const settings = await getPublicContactSettings();

  return <ContactContent settings={settings} />;
}
