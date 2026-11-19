import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { hasAdminSession } from "@/lib/auth/api-session";

const ALLOWED_FOLDERS = ["m-tech/products", "m-tech/categories", "m-tech/promotions", "m-tech/testimonials", "m-tech/homepage", "m-tech/general", "m-tech/seo"] as const;

export async function POST(request: NextRequest) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Cloudinary configuration is incomplete." },
      { status: 500 },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));

    const folder = ALLOWED_FOLDERS.includes(body.folder)
      ? body.folder
      : "m-tech/products";

    const timestamp = Math.round(Date.now() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      apiSecret,
    );

    return NextResponse.json({
      cloudName,
      apiKey,
      timestamp,
      folder,
      signature,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to generate upload signature." },
      { status: 500 },
    );
  }
}
