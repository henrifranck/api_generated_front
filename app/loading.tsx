export default function Loading() {
  return (
    <div className="min-h-screen p-4 pb-12 sm:p-6 md:p-8 font-sans flex flex-col items-center gap-8 bg-gray-50">
      <header className="w-full sticky top-0 z-10 bg-white/80 backdrop-blur-sm p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-gray-200" />
            <h1 className="text-2xl font-bold text-gray-800 whitespace-nowrap">
              My Projects
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block h-10 w-60 rounded-lg bg-gray-200 animate-pulse" />
            <div className="h-10 w-24 rounded-lg bg-gray-200 animate-pulse" />
          </div>
        </div>
      </header>

      <main className="w-full ">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[...Array(10)].map((_, index) => (
            <div
              key={index}
              className="h-full flex flex-col border border-gray-200 rounded-lg overflow-hidden animate-pulse"
            >
              <div className="p-4 space-y-2">
                <div className="h-6 w-3/4 rounded bg-gray-200" />
                <div className="h-4 w-1/2 rounded bg-gray-200" />
              </div>
              <div className="aspect-video bg-gray-200" />
              <div className="p-4 flex justify-between">
                <div className="h-8 w-8 rounded-full bg-gray-200" />
                <div className="flex gap-2">
                  <div className="h-8 w-8 rounded-full bg-gray-200" />
                  <div className="h-8 w-8 rounded-full bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
