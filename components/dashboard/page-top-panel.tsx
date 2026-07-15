import { cn } from "@/lib/utils";

export function PageTopPanel({
  eyebrow,
  title,
  description,
  stats,
  actions,
}: Readonly<{
  eyebrow?: string;
  title: string;
  description?: string;
  stats?: ReadonlyArray<{
    label: string;
    value: string;
    tone?: "default" | "emphasis";
  }>;
  actions?: React.ReactNode;
}>) {
  return (
    <section className="rounded-[1.65rem] border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur sm:p-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-700">
              {eyebrow}
            </p>
          ) : null}
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>

      {stats?.length ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className={cn(
                "min-h-28 rounded-[1.25rem] border px-4 py-4 shadow-sm",
                stat.tone === "emphasis"
                  ? "border-cyan-200 bg-cyan-50/80"
                  : "border-slate-200 bg-slate-50/70",
              )}
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                {stat.label}
              </p>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                {stat.value}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
