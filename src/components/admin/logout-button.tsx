"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/session", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Unable to end your session.");
      }

      router.replace("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:border-purple-500 hover:text-white disabled:opacity-50"
    >
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}
