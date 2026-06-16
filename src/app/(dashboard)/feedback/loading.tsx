export default function FeedbackLoading() {
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 bg-gray-200 rounded-lg" />
          <div className="h-4 w-48 bg-gray-200 rounded-lg" />
        </div>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          <div className="h-8 w-24 bg-white rounded-lg shadow-sm" />
          <div className="h-8 w-24 bg-gray-200 rounded-lg" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 space-y-1">
          <div className="h-3 w-16 bg-gray-200 rounded" />
          <div className="h-5 w-32 bg-gray-200 rounded" />
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-200" />
              <div className="h-4 w-28 bg-gray-200 rounded" />
            </div>
            <div className="h-11 w-full bg-gray-100 rounded-xl" />
          </div>
          <div className="border-t border-gray-50" />
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-200" />
                <div className="h-4 w-36 bg-gray-200 rounded" />
              </div>
              <div className="h-20 w-full bg-gray-100 rounded-xl" />
            </div>
          ))}
          <div className="h-10 w-32 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
