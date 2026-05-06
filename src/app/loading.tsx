export default function RootLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 rounded-xl bg-gray-200" />
          <div className="h-4 w-96 max-w-full rounded-xl bg-gray-100" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-gray-100 border border-gray-200" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

