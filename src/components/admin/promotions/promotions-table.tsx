"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Edit2,
  ExternalLink,
  ImageIcon,
  Loader2,
  Plus,
  Search,
  Tag,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

import type { AdminPromotion } from "@/types/admin-promotion";

interface PromotionsTableProps {
  promotions: AdminPromotion[];
}

type StatusFilter = "all" | "active" | "inactive";

const promotionTypeLabels: Record<AdminPromotion["type"], string> = {
  banner: "Banner",
  offer: "Offer",
  campaign: "Campaign",
};

function formatDate(date: string | null) {
  if (!date) return "Not set";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

function getScheduleLabel(promotion: AdminPromotion) {
  if (promotion.startDate && promotion.endDate) {
    return `${formatDate(promotion.startDate)} – ${formatDate(promotion.endDate)}`;
  }

  if (promotion.startDate) {
    return `From ${formatDate(promotion.startDate)}`;
  }

  if (promotion.endDate) {
    return `Until ${formatDate(promotion.endDate)}`;
  }

  return "No date restrictions";
}

export default function PromotionsTable({ promotions }: PromotionsTableProps) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const filteredPromotions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return promotions.filter((promotion) => {
      const matchesSearch =
        !query ||
        promotion.title.toLowerCase().includes(query) ||
        promotion.description.toLowerCase().includes(query) ||
        promotion.type.toLowerCase().includes(query) ||
        promotion.targetName.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && promotion.active) ||
        (statusFilter === "inactive" && !promotion.active);

      return matchesSearch && matchesStatus;
    });
  }, [promotions, search, statusFilter]);

  const activeCount = promotions.filter((promotion) => promotion.active).length;

  const inactiveCount = promotions.length - activeCount;

  async function toggleStatus(promotion: AdminPromotion) {
    setError("");
    setPendingId(promotion.id);

    try {
      const response = await fetch(
        `/api/admin/promotions/${promotion.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            active: !promotion.active,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not update promotion status.");
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while updating the promotion.",
      );
    } finally {
      setPendingId(null);
    }
  }

  async function deletePromotion(promotion: AdminPromotion) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${promotion.title}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setError("");
    setPendingId(promotion.id);

    try {
      const response = await fetch(`/api/admin/promotions/${promotion.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not delete promotion.");
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while deleting the promotion.",
      );
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-purple-600">Marketing</p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            Promotions
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Manage banners, special offers, and promotional campaigns.
          </p>
        </div>

        <Link
          href="/admin/promotions/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 text-sm font-medium text-white transition hover:bg-purple-700"
        >
          <Plus size={17} />
          Add promotion
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-500">Total promotions</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">
            {promotions.length}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-500">Active</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">
            {activeCount}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-500">Inactive</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-500">
            {inactiveCount}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search promotions..."
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
            className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {error && (
          <div
            role="alert"
            className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-3">Promotion</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Target</th>
                <th className="px-5 py-3">Schedule</th>
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100">
              {filteredPromotions.length > 0 ? (
                filteredPromotions.map((promotion) => {
                  const isPending = pendingId === promotion.id;

                  return (
                    <tr
                      key={promotion.id}
                      className="transition hover:bg-zinc-50/70"
                    >
                      {/* Promotion */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100">
                            {promotion.image?.url ? (
                              <img
                                src={promotion.image.url}
                                alt={promotion.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-zinc-400">
                                <ImageIcon size={19} />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="font-medium text-zinc-900">
                              {promotion.title}
                            </p>

                            <p className="mt-0.5 max-w-xs truncate text-xs text-zinc-500">
                              {promotion.description || "No description"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                          <Tag size={12} />
                          {promotionTypeLabels[promotion.type]}
                        </span>
                      </td>

                      {/* Target */}
                      <td className="px-5 py-4">
                        <p className="text-zinc-700">
                          {promotion.targetType === "none"
                            ? "No target"
                            : promotion.targetName || "Unknown target"}
                        </p>

                        {promotion.targetType !== "none" && (
                          <p className="mt-0.5 text-xs capitalize text-zinc-400">
                            {promotion.targetType}
                          </p>
                        )}
                      </td>

                      {/* Schedule */}
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2 text-zinc-600">
                          <CalendarDays
                            size={15}
                            className="mt-0.5 shrink-0 text-zinc-400"
                          />

                          <span className="text-xs">
                            {getScheduleLabel(promotion)}
                          </span>
                        </div>
                      </td>

                      {/* Order */}
                      <td className="px-5 py-4 tabular-nums text-zinc-600">
                        {promotion.sortOrder}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                            promotion.active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              promotion.active
                                ? "bg-emerald-500"
                                : "bg-zinc-400"
                            }`}
                          />
                          {promotion.active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => toggleStatus(promotion)}
                            disabled={isPending}
                            title={
                              promotion.active
                                ? "Deactivate promotion"
                                : "Activate promotion"
                            }
                            className="rounded-md p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isPending ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : promotion.active ? (
                              <ToggleRight size={18} />
                            ) : (
                              <ToggleLeft size={18} />
                            )}
                          </button>

                          <Link
                            href={`/admin/promotions/${promotion.id}/edit`}
                            title="Edit promotion"
                            className="rounded-md p-2 text-zinc-500 transition hover:bg-purple-50 hover:text-purple-700"
                          >
                            <Edit2 size={16} />
                          </Link>

                          <button
                            type="button"
                            onClick={() => deletePromotion(promotion)}
                            disabled={isPending}
                            title="Delete promotion"
                            className="rounded-md p-2 text-zinc-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                        <ImageIcon size={20} />
                      </div>

                      <p className="mt-3 font-medium text-zinc-900">
                        {promotions.length === 0
                          ? "No promotions yet"
                          : "No matching promotions"}
                      </p>

                      <p className="mt-1 text-sm text-zinc-500">
                        {promotions.length === 0
                          ? "Create your first promotion to get started."
                          : "Try adjusting your search or status filter."}
                      </p>

                      {promotions.length === 0 && (
                        <Link
                          href="/admin/promotions/new"
                          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700"
                        >
                          <Plus size={16} />
                          Add your first promotion
                          <ExternalLink size={13} />
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 px-5 py-3">
          <p className="text-xs text-zinc-500">
            Showing {filteredPromotions.length} of {promotions.length}{" "}
            {promotions.length === 1 ? "promotion" : "promotions"}
          </p>
        </div>
      </div>
    </div>
  );
}
