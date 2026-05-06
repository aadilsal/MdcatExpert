export default function AppGroupLoading() {
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 lg:p-12">
      <div className="animate-pulse space-y-8">
        <div className="rounded-2xl bg-gray-100 border border-gray-200 p-6 sm:p-8">
          <div className="h-7 w-72 max-w-full rounded-xl bg-gray-200" />
          <div className="mt-3 h-4 w-lg max-w-full rounded-xl bg-gray-200/70" />
          <div className="mt-6 h-10 w-40 rounded-xl bg-gray-200/80" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-white border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="h-4 w-28 rounded-full bg-gray-100" />
                <div className="h-10 w-10 rounded-xl bg-gray-100" />
              </div>
              <div className="h-8 w-24 rounded-xl bg-gray-100" />
              <div className="mt-2 h-3 w-20 rounded-full bg-gray-50" />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="h-5 w-44 rounded-xl bg-gray-100" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-100 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-40 rounded-full bg-gray-100" />
                  <div className="h-3 w-24 rounded-full bg-gray-50" />
                </div>
                <div className="space-y-2 text-right">
                  <div className="h-5 w-16 rounded-full bg-gray-100" />
                  <div className="h-3 w-20 rounded-full bg-gray-50" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

