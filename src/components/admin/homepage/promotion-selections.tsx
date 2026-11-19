"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Megaphone, Search, X } from "lucide-react";

import type { HomepagePromotionOption } from "@/types/admin-homepage";

const MAX_PROMOTIONS = 6;

interface PromotionSelectionsProps {
  promotions: HomepagePromotionOption[];
  promotionIds: string[];
  onChange: (ids: string[]) => void;
}

export default function PromotionSelections({
  promotions,
  promotionIds,
  onChange,
}: PromotionSelectionsProps) {
  const [search, setSearch] = useState("");

  const selectedPromotions = useMemo(
    () =>
      promotionIds.map((id) => ({
        id,
        promotion: promotions.find((item) => item.id === id) ?? null,
      })),
    [promotionIds, promotions],
  );

  const availablePromotions = useMemo(() => {
    const selectedIds = new Set(promotionIds);
    const query = search.trim().toLowerCase();

    return promotions.filter(
      (promotion) =>
        promotion.active &&
        !selectedIds.has(promotion.id) &&
        (!query ||
          promotion.title.toLowerCase().includes(query) ||
          promotion.type.toLowerCase().includes(query)),
    );
  }, [promotions, promotionIds, search]);

  function addPromotion(id: string) {
    if (promotionIds.includes(id) || promotionIds.length >= MAX_PROMOTIONS) {
      return;
    }

    onChange([...promotionIds, id]);
    setSearch("");
  }

  function removePromotion(id: string) {
    onChange(promotionIds.filter((item) => item !== id));
  }

  function movePromotion(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= promotionIds.length) return;

    const updated = [...promotionIds];

    [updated[index], updated[nextIndex]] = [updated[nextIndex], updated[index]];

    onChange(updated);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-800">
            Selected promotions
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Arrange promotions in the order they should appear.
          </p>
        </div>

        <span className="shrink-0 text-xs font-medium text-zinc-500">
          {promotionIds.length} / {MAX_PROMOTIONS}
        </span>
      </div>

      {selectedPromotions.length > 0 ? (
        <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
          {selectedPromotions.map(({ id, promotion }, index) => (
            <div key={id} className="flex items-center gap-3 p-3">
              <span className="w-5 shrink-0 text-xs font-medium text-zinc-400">
                {index + 1}
              </span>

              <div className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-100">
                {promotion?.imageUrl ? (
                  <img
                    src={promotion.imageUrl}
                    alt={promotion.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Megaphone className="h-5 w-5 text-zinc-400" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900">
                  {promotion?.title ?? "Unavailable promotion"}
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-xs capitalize text-zinc-500">
                    {promotion?.type ?? "Unknown type"}
                  </span>

                  {promotion && !promotion.active && (
                    <span className="text-xs font-medium text-amber-600">
                      Inactive
                    </span>
                  )}

                  {!promotion && (
                    <span className="text-xs font-medium text-red-600">
                      No longer exists
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => movePromotion(index, -1)}
                  disabled={index === 0}
                  aria-label="Move promotion up"
                  className="rounded-md p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => movePromotion(index, 1)}
                  disabled={index === promotionIds.length - 1}
                  aria-label="Move promotion down"
                  className="rounded-md p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => removePromotion(id)}
                  aria-label="Remove promotion"
                  className="rounded-md p-2 text-zinc-500 transition hover:bg-red-50 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center">
          <Megaphone className="mx-auto h-6 w-6 text-zinc-400" />
          <p className="mt-2 text-sm font-medium text-zinc-700">
            No promotions selected
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Choose promotions below to feature them on your homepage.
          </p>
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-800">
          Add a promotion
        </label>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search active promotions..."
            disabled={promotionIds.length >= MAX_PROMOTIONS}
            className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:bg-zinc-50"
          />
        </div>

        {promotionIds.length >= MAX_PROMOTIONS && (
          <p className="mt-2 text-xs text-amber-600">
            You have reached the maximum of {MAX_PROMOTIONS} promotions.
          </p>
        )}

        {search.trim() && promotionIds.length < MAX_PROMOTIONS && (
          <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-zinc-200 bg-white">
            {availablePromotions.length > 0 ? (
              availablePromotions.slice(0, 20).map((promotion) => (
                <button
                  key={promotion.id}
                  type="button"
                  onClick={() => addPromotion(promotion.id)}
                  className="flex w-full items-center gap-3 border-b border-zinc-100 p-3 text-left last:border-0 hover:bg-zinc-50"
                >
                  <div className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded bg-zinc-100">
                    {promotion.imageUrl ? (
                      <img
                        src={promotion.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Megaphone className="h-4 w-4 text-zinc-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-800">
                      {promotion.title}
                    </p>
                    <p className="mt-0.5 text-xs capitalize text-zinc-500">
                      {promotion.type}
                    </p>
                  </div>

                  <span className="text-xs font-medium text-purple-600">
                    Add
                  </span>
                </button>
              ))
            ) : (
              <p className="px-4 py-5 text-center text-sm text-zinc-500">
                No matching active promotions found.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
