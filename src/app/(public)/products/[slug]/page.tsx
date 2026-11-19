import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";

import ProductDetails, {
  type PublicProductDetail,
} from "@/components/public/products/product-details";

import RelatedProductsSection from "@/components/public/products/related-products-section";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

async function getProductDocument(slug: string) {
  const snapshot = await adminDb
    .collection("products")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  return snapshot.docs[0] ?? null;
}

function toPublicProduct(document: QueryDocumentSnapshot): PublicProductDetail {
  const data = document.data();

  const { createdAt: _createdAt, updatedAt: _updatedAt, ...productData } = data;

  return {
    id: document.id,
    ...productData,
  } as PublicProductDetail;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  await connection();

  const { slug } = await params;
  const document = await getProductDocument(slug);

  if (!document) {
    return {
      title: "Product not found | M Tech",
    };
  }

  const product = document.data();

  if (product.active !== true || product.availability === "discontinued") {
    return {
      title: "Product not found | M Tech",
    };
  }

  const title = product.seo?.title || `${product.name} | M Tech`;
  const description =
    product.seo?.description ||
    product.description ||
    "Explore quality gaming accessories at M Tech.";

  const image = product.images?.main?.url;

  return {
    title,
    description,
    alternates: {
      canonical: `/products/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      ...(image ? { images: [{ url: image, alt: product.name }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  return (
    <Suspense fallback={null}>
      <ProductPageContent params={params} />
    </Suspense>
  );
}

async function ProductPageContent({ params }: ProductPageProps) {
  await connection();

  const { slug } = await params;
  const productDocument = await getProductDocument(slug);

  if (!productDocument) {
    notFound();
  }

  const rawProduct = productDocument.data();

  if (
    rawProduct.active !== true ||
    rawProduct.availability === "discontinued"
  ) {
    notFound();
  }

  const product = toPublicProduct(productDocument);

  const [categorySnapshot, contactSnapshot, relatedSnapshot] =
    await Promise.all([
      adminDb.collection("categories").doc(product.categoryId).get(),
      adminDb.collection("settings").doc("contact").get(),
      adminDb
        .collection("products")
        .where("categoryId", "==", product.categoryId)
        .get(),
    ]);

  const categoryName = categorySnapshot.exists
    ? categorySnapshot.data()?.name || ""
    : "";

  const rawWhatsappNumber = contactSnapshot.data()?.whatsappNumber;

  const whatsappNumber =
    typeof rawWhatsappNumber === "string"
      ? rawWhatsappNumber.replace(/\D/g, "")
      : null;

  const relatedProducts: PublicProductDetail[] = relatedSnapshot.docs
    .filter(
      (document) =>
        document.id !== product.id &&
        document.data().active === true &&
        document.data().availability !== "discontinued",
    )
    .map(toPublicProduct)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-[#08060f]">
      <ProductDetails
        product={product}
        categoryName={categoryName}
        whatsappNumber={whatsappNumber}
      />

      <RelatedProductsSection products={relatedProducts} />
    </div>
  );
}
