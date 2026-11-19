import { Suspense } from "react";
import { connection } from "next/server";

import { verifyAdminSession } from "@/lib/auth/session";
import LogoutButton from "@/components/admin/logout-button";
import AdminSidebar from "@/components/admin/admin-sidebar";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AuthenticatedAdminLayout>{children}</AuthenticatedAdminLayout>
    </Suspense>
  );
}

async function AuthenticatedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Wait for an actual request before accessing session data.
  await connection();

  // Verify the administrator on every request.
  const admin = await verifyAdminSession();

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-zinc-900">
      {/* Top header */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white">
        <div className="flex h-[68px] items-center justify-between px-5 sm:px-8">
          <div className="lg:ml-64">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
              M Tech / Administration
            </p>

            <p className="mt-0.5 text-sm font-semibold text-zinc-800">
              Management workspace
            </p>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-zinc-800">
                {admin.displayName}
              </p>

              <p className="text-xs text-zinc-500">{admin.email}</p>
            </div>

            <div className="hidden h-8 w-px bg-zinc-200 sm:block" />

            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Dashboard shell */}
      <div className="flex min-h-[calc(100vh-68px)] flex-col lg:flex-row">
        <AdminSidebar />

        <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

function AdminLoading() {
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <header className="flex h-[68px] items-center justify-between border-b border-zinc-200 bg-white px-8">
        <div className="h-4 w-48 animate-pulse rounded bg-zinc-200" />
        <div className="h-8 w-32 animate-pulse rounded bg-zinc-200" />
      </header>

      <div className="flex">
        <aside className="hidden min-h-[calc(100vh-68px)] w-64 border-r border-zinc-200 bg-white p-6 lg:block">
          <div className="h-5 w-28 animate-pulse rounded bg-zinc-200" />

          <div className="mt-10 space-y-5">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-9 animate-pulse rounded-lg bg-zinc-100"
              />
            ))}
          </div>
        </aside>

        <main className="flex-1 p-8">
          <div className="h-8 w-48 animate-pulse rounded bg-zinc-200" />
          <div className="mt-3 h-4 w-72 animate-pulse rounded bg-zinc-100" />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse border border-zinc-200 bg-white"
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
