export default function AdminLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-violet-600" />
        <span className="text-sm text-neutral-500">Loading...</span>
      </div>
    </div>
  );
}
