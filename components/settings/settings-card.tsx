export function SettingsCard({
  title,
  description,
  children,
  footer,
  tone = "default",
}: Readonly<{
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  tone?: "default" | "warning" | "danger";
}>) {
  const toneClassName =
    tone === "danger"
      ? "border-rose-200 bg-rose-50/70"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50/70"
        : "border-slate-200 bg-white/90";

  return (
    <section
      className={`rounded-[1.6rem] border p-5 shadow-sm backdrop-blur sm:p-6 ${toneClassName}`}
    >
      <div className="space-y-1">
        <h2 className="font-heading text-xl font-semibold tracking-tight text-slate-950">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        ) : null}
      </div>

      <div className="mt-5">{children}</div>

      {footer ? (
        <div className="mt-5 border-t border-slate-200/80 pt-4">{footer}</div>
      ) : null}
    </section>
  );
}
