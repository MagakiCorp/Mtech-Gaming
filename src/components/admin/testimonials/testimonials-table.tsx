"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Edit2,
  ExternalLink,
  MessageSquareQuote,
  Plus,
  Search,
  Star,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from "lucide-react";

import type { AdminTestimonial } from "@/types/admin-testimonial";

interface TestimonialsTableProps {
  testimonials: AdminTestimonial[];
}

type StatusFilter = "all" | "pending" | "approved" | "active" | "inactive";

function formatDate(date: string | null) {
  if (!date) return "Unknown";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "Unknown";

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

export default function TestimonialsTable({
  testimonials,
}: TestimonialsTableProps) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  const filteredTestimonials = useMemo(() => {
    const query = search.trim().toLowerCase();

    return testimonials.filter((testimonial) => {
      const matchesSearch =
        !query ||
        testimonial.customerName.toLowerCase().includes(query) ||
        testimonial.message.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" && !testimonial.approved) ||
        (statusFilter === "approved" && testimonial.approved) ||
        (statusFilter === "active" && testimonial.active) ||
        (statusFilter === "inactive" && !testimonial.active);

      return matchesSearch && matchesStatus;
    });
  }, [testimonials, search, statusFilter]);

  const approvedCount = testimonials.filter(
    (testimonial) => testimonial.approved,
  ).length;

  const pendingCount = testimonials.length - approvedCount;

  const activeCount = testimonials.filter(
    (testimonial) => testimonial.active,
  ).length;

  async function updateStatus(
    testimonial: AdminTestimonial,
    field: "approved" | "active",
  ) {
    const key = `${testimonial.id}-${field}`;

    setError("");
    setPendingKey(key);

    try {
      const response = await fetch(
        `/api/admin/testimonials/${testimonial.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            [field]: !testimonial[field],
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not update testimonial status.");
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while updating the testimonial.",
      );
    } finally {
      setPendingKey(null);
    }
  }

  async function deleteTestimonial(testimonial: AdminTestimonial) {
    const confirmed = window.confirm(
      `Are you sure you want to delete the testimonial from "${testimonial.customerName}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setError("");
    setPendingKey(`${testimonial.id}-delete`);

    try {
      const response = await fetch(
        `/api/admin/testimonials/${testimonial.id}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not delete testimonial.");
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while deleting the testimonial.",
      );
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-purple-600">Marketing</p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            Testimonials
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Manage customer feedback, approvals, and public visibility.
          </p>
        </div>

        <Link
          href="/admin/testimonials/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 text-sm font-medium text-white transition hover:bg-purple-700"
        >
          <Plus size={17} />
          Add testimonial
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-500">Total testimonials</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">
            {testimonials.length}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-500">Approved</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">
            {approvedCount}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-500">Pending approval</p>
          <p className="mt-2 text-2xl font-semibold text-amber-600">
            {pendingCount}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-500">Active</p>
          <p className="mt-2 text-2xl font-semibold text-purple-600">
            {activeCount}
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
              placeholder="Search by customer or message..."
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
            <option value="all">All testimonials</option>
            <option value="pending">Pending approval</option>
            <option value="approved">Approved</option>
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
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Message</th>
                <th className="px-5 py-3">Rating</th>
                <th className="px-5 py-3">Date added</th>
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Approval</th>
                <th className="px-5 py-3">Visibility</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100">
              {filteredTestimonials.length > 0 ? (
                filteredTestimonials.map((testimonial) => {
                  const isDeleting = pendingKey === `${testimonial.id}-delete`;

                  const isUpdating = pendingKey?.startsWith(
                    `${testimonial.id}-`,
                  );

                  return (
                    <tr
                      key={testimonial.id}
                      className="transition hover:bg-zinc-50/70"
                    >
                      {/* Customer */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 text-sm font-semibold text-zinc-500">
                            {testimonial.image?.url ? (
                              <img
                                src={testimonial.image.url}
                                alt={testimonial.customerName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              testimonial.customerName
                                .trim()
                                .charAt(0)
                                .toUpperCase() || "?"
                            )}
                          </div>

                          <div className="font-medium text-zinc-900">
                            {testimonial.customerName || "Unnamed customer"}
                          </div>
                        </div>
                      </td>

                      {/* Message */}
                      <td className="px-5 py-4">
                        <p
                          className="max-w-xs truncate text-zinc-600"
                          title={testimonial.message}
                        >
                          {testimonial.message || "No message"}
                        </p>
                      </td>

                      {/* Rating */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-0.5 text-amber-500">
                            {Array.from({ length: 5 }, (_, index) => (
                              <Star
                                key={index}
                                size={13}
                                fill={
                                  index < testimonial.rating
                                    ? "currentColor"
                                    : "none"
                                }
                              />
                            ))}
                          </div>

                          <span className="text-xs tabular-nums text-zinc-500">
                            {testimonial.rating}/5
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-xs text-zinc-500">
                        {formatDate(testimonial.createdAt)}
                      </td>

                      {/* Order */}
                      <td className="px-5 py-4 tabular-nums text-zinc-600">
                        {testimonial.sortOrder}
                      </td>

                      {/* Approval */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                            testimonial.approved
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              testimonial.approved
                                ? "bg-emerald-500"
                                : "bg-amber-500"
                            }`}
                          />
                          {testimonial.approved ? "Approved" : "Pending"}
                        </span>
                      </td>

                      {/* Visibility */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                            testimonial.active
                              ? "bg-purple-50 text-purple-700"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              testimonial.active
                                ? "bg-purple-500"
                                : "bg-zinc-400"
                            }`}
                          />
                          {testimonial.active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              updateStatus(testimonial, "approved")
                            }
                            disabled={!!isUpdating}
                            title={
                              testimonial.approved
                                ? "Unapprove testimonial"
                                : "Approve testimonial"
                            }
                            className="rounded-md p-2 text-zinc-500 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {pendingKey === `${testimonial.id}-approved` ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : testimonial.approved ? (
                              <ToggleRight size={18} />
                            ) : (
                              <ToggleLeft size={18} />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => updateStatus(testimonial, "active")}
                            disabled={!!isUpdating}
                            title={
                              testimonial.active
                                ? "Deactivate testimonial"
                                : "Activate testimonial"
                            }
                            className="rounded-md p-2 text-zinc-500 transition hover:bg-purple-50 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {pendingKey === `${testimonial.id}-active` ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : testimonial.active ? (
                              <ToggleRight size={18} />
                            ) : (
                              <ToggleLeft size={18} />
                            )}
                          </button>

                          <Link
                            href={`/admin/testimonials/${testimonial.id}/edit`}
                            title="Edit testimonial"
                            className="rounded-md p-2 text-zinc-500 transition hover:bg-purple-50 hover:text-purple-700"
                          >
                            <Edit2 size={16} />
                          </Link>

                          <button
                            type="button"
                            onClick={() => deleteTestimonial(testimonial)}
                            disabled={!!isUpdating}
                            title="Delete testimonial"
                            className="rounded-md p-2 text-zinc-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isDeleting ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                        <MessageSquareQuote size={20} />
                      </div>

                      <p className="mt-3 font-medium text-zinc-900">
                        {testimonials.length === 0
                          ? "No testimonials yet"
                          : "No matching testimonials"}
                      </p>

                      <p className="mt-1 text-sm text-zinc-500">
                        {testimonials.length === 0
                          ? "Add your first customer testimonial to get started."
                          : "Try adjusting your search or status filter."}
                      </p>

                      {testimonials.length === 0 && (
                        <Link
                          href="/admin/testimonials/new"
                          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700"
                        >
                          <Plus size={16} />
                          Add your first testimonial
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
            Showing {filteredTestimonials.length} of {testimonials.length}{" "}
            {testimonials.length === 1 ? "testimonial" : "testimonials"}
          </p>
        </div>
      </div>
    </div>
  );
}
