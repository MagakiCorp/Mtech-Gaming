"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";

import type { ImageAsset } from "@/types";

interface ProductImageGalleryProps {
  name: string;
  images: {
    main: ImageAsset;
    gallery: ImageAsset[];
  };
}

const CHAMFER =
  "[clip-path:polygon(0_0,calc(100%-14px)_0,100%_14px,100%_100%,14px_100%,0_calc(100%-14px))]";

export default function ProductImageGallery({
  name,
  images,
}: ProductImageGalleryProps) {
  const productImages = [images?.main, ...(images?.gallery ?? [])].filter(
    (image): image is ImageAsset => Boolean(image?.url),
  );

  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectedImage = productImages[selectedIndex];

  return (
    <div className="min-w-0">
      {/* Main image */}
      <div
        className={`relative aspect-square overflow-hidden border border-white/10 bg-[#110d1c] ${CHAMFER}`}
      >
        {/* Background grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(167,139,250,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.6) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />

        {/* Ambient lighting */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-1/4 left-1/4 h-1/2 w-1/2 rounded-full bg-violet-600/10 blur-[90px]"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-1/4 top-0 h-1/2 w-1/2 rounded-full bg-cyan-500/[0.07] blur-[90px]"
        />

        {selectedImage ? (
          <Image
            key={selectedImage.publicId || selectedImage.url}
            src={selectedImage.url}
            alt={name}
            fill
            priority
            unoptimized
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-contain p-6 sm:p-10"
          />
        ) : (
          <div className="relative flex h-full items-center justify-center">
            <ImageIcon size={28} className="text-white/15" />
          </div>
        )}

        {/* Image overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-violet-950/20 via-transparent to-transparent"
        />

        {/* HUD corners */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 h-8 w-8 border-l border-t border-violet-400/70"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 h-8 w-8 border-r border-t border-cyan-400/50"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 h-8 w-8 border-b border-l border-violet-400/50"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 h-8 w-8 border-b border-r border-cyan-400/70"
        />

        {/* Image counter */}
        {productImages.length > 0 && (
          <div className="absolute bottom-4 right-4 border border-white/10 bg-[#08060f]/80 px-3 py-1.5 font-mono text-[10px] tracking-widest text-white/60">
            {String(selectedIndex + 1).padStart(2, "0")}
            <span className="mx-1.5 text-violet-400">/</span>
            {String(productImages.length).padStart(2, "0")}
          </div>
        )}
      </div>

      {/* Thumbnail gallery */}
      {productImages.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
          {productImages.map((image, index) => {
            const isSelected = selectedIndex === index;

            return (
              <button
                key={`${image.publicId}-${index}`}
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-label={`View product image ${index + 1}`}
                aria-pressed={isSelected}
                className={`group relative aspect-square overflow-hidden border bg-[#110d1c] transition duration-300 ${CHAMFER} ${
                  isSelected
                    ? "border-violet-400/80 ring-1 ring-violet-400/30"
                    : "border-white/10 hover:border-cyan-400/50"
                }`}
              >
                <Image
                  src={image.url}
                  alt={`${name} image ${index + 1}`}
                  fill
                  unoptimized
                  sizes="120px"
                  className={`object-contain p-2 transition duration-300 ${
                    isSelected
                      ? "opacity-100"
                      : "opacity-60 group-hover:opacity-100"
                  }`}
                />

                {/* Thumbnail overlay */}
                <span
                  aria-hidden="true"
                  className={`absolute inset-0 transition ${
                    isSelected
                      ? "bg-violet-500/[0.06]"
                      : "bg-[#08060f]/10 group-hover:bg-transparent"
                  }`}
                />

                {/* Active indicator */}
                {isSelected && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-violet-500 to-cyan-400" />
                )}

                <span className="absolute left-2 top-2 font-mono text-[8px] text-white/40">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
