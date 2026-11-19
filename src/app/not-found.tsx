"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NotFound() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f7] px-6 text-center">
        <div className="max-w-md">
          <p className="admin-error-code">404</p>

          <h1 className="admin-error-heading">Page not found</h1>

          <p className="admin-error-description">
            The admin page you're looking for doesn't exist or is no longer
            available.
          </p>

          <Link href="/admin" className="admin-error-link">
            Return to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="public-state-screen">
      <div className="public-state-grid" />
      <div className="public-state-glow" />

      <div className="public-state-content">
        <div className="public-error-code">404</div>

        <h1 className="public-error-heading">Signal Lost</h1>

        <p className="public-error-description">
          The page you're looking for doesn't exist or may have been moved.
        </p>

        <div className="public-error-actions">
          <Link href="/" className="public-error-primary">
            Back to Home
          </Link>

          <Link href="/products" className="public-error-secondary">
            Browse Products
          </Link>
        </div>
      </div>
    </main>
  );
}
