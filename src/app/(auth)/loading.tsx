export default function AuthGroupLoading() {
  return (
    <div className="w-full max-w-lg">
      <div className="animate-pulse rounded-3xl bg-white/70 backdrop-blur-xl border border-gray-100 p-8 shadow-xl shadow-gray-900/5">
        <div className="h-7 w-44 rounded-xl bg-gray-200" />
        <div className="mt-2 h-4 w-72 max-w-full rounded-xl bg-gray-100" />

        <div className="mt-8 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 rounded-full bg-gray-100" />
              <div className="h-11 w-full rounded-2xl bg-gray-100 border border-gray-200" />
            </div>
          ))}
          <div className="mt-2 h-12 w-full rounded-2xl bg-primary-200/60" />
        </div>
      </div>
    </div>
  );
}

