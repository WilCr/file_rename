export default function Hero() {
  return (
    <section className="mx-auto max-w-2xl px-4 pb-2 pt-4 text-center sm:pt-8">
      <p className="font-display text-sm font-semibold uppercase tracking-wide text-violet-700">
        ScanRename
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
        Rename files with AI
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
        Drop PDFs, Word docs, and images. Get names from Claude. Download in one click.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <span className="inline-flex rounded-full bg-violet-100 px-4 py-1.5 text-sm font-medium text-violet-800">
          No API key needed
        </span>
        <span className="inline-flex rounded-full bg-slate-200/80 px-4 py-1.5 text-sm font-medium text-slate-700">
          Runs in your browser
        </span>
        <span className="inline-flex rounded-full bg-slate-200/80 px-4 py-1.5 text-sm font-medium text-slate-700">
          Multiple files
        </span>
      </div>
    </section>
  )
}
