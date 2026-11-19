import LoginForm from "@/components/admin/login-form";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090b] px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-semibold tracking-[0.35em] text-purple-400">
            M TECH
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-white">
            Admin Portal
          </h1>

          <p className="mt-3 text-sm text-zinc-400">
            Sign in to manage your gaming accessories store.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111114] p-7 shadow-2xl">
          <h2 className="mb-6 text-lg font-semibold text-white">
            Welcome back
          </h2>

          <LoginForm />
        </div>

        <p className="mt-8 text-center text-xs text-zinc-600">
          M Tech Store Administration
        </p>
      </div>
    </main>
  );
}
