import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { getSettings } from "@/lib/services/settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  "use cache";

  cacheLife("hours");
  cacheTag("site-settings");

  const [seo, general] = await Promise.all([
    getSettings("seo"),
    getSettings("general"),
  ]);

  const siteName = general?.businessName || "M Tech";
  const title = seo?.siteTitle || siteName;
  const description =
    seo?.siteDescription ||
    general?.description ||
    "Discover quality gaming accessories at M Tech.";

  const ogImage = seo?.defaultOgImage?.url;
  const faviconUrl = general?.favicon?.url;

  return {
    title,
    description,
    keywords: seo?.keywords?.length ? seo.keywords : undefined,

    ...(faviconUrl
      ? {
          icons: {
            icon: [{ url: faviconUrl }],
            shortcut: [{ url: faviconUrl }],
            apple: [{ url: faviconUrl }],
          },
        }
      : {}),

    openGraph: {
      title,
      description,
      siteName,
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
