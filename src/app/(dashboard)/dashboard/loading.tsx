function Bone({ className }: { className?: string }) {
  return <div className={`bg-gray-200 rounded-lg animate-pulse ${className ?? ''}`} />
}

export default function DashboardLoading() {
  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-5">
      <div className="space-y-1.5">
        <Bone className="h-8 w-56" />
        <Bone className="h-4 w-72" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <Bone className="w-10 h-10 rounded-xl" />
              <Bone className="w-2 h-2 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <Bone className="h-8 w-16" />
              <Bone className="h-3 w-28" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {[0, 1].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <Bone className="h-4 w-32" />
              <Bone className="h-4 w-16" />
            </div>
            <div className="p-4 space-y-2">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <Bone className="w-1 h-10 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Bone className="h-4 w-28" />
                    <Bone className="h-3 w-20" />
                  </div>
                  <Bone className="h-7 w-20 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <Bone className="h-4 w-32" />
          <Bone className="h-4 w-16" />
        </div>
        <div className="px-5 py-3 divide-y divide-gray-50">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3.5">
              <Bone className="w-9 h-9 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Bone className="h-4 w-32" />
                  <Bone className="h-3 w-10" />
                </div>
                <Bone className="h-1.5 w-full rounded-full" />
              </div>
              <Bone className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
