export default function InfoGroupLoading() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 sm:py-20 lg:py-24">
      <div className="animate-pulse space-y-6">
        <div className="h-9 w-72 max-w-full rounded-xl bg-gray-200" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 w-full rounded-xl bg-gray-100" />
          ))}
          <div className="h-4 w-3/5 rounded-xl bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

