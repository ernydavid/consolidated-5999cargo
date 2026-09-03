"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle, FileSpreadsheet, LoaderCircle, Upload } from "lucide-react";

import { confirmConsolidationImport, prepareConsolidationImport, type ConsolidationImportActionState } from "@/modules/consolidations/actions";

const initialState = undefined;

export function ConsolidationImportForm() {
  const [state, action] = useActionState<ConsolidationImportActionState | undefined, FormData>(
    prepareConsolidationImport,
    initialState,
  );

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-6">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Field
            label="Consolidado reference"
            name="reference"
            placeholder="e.g. 1331"
            required
          />
          <Field
            label="Carrier"
            name="carrier"
            placeholder="e.g. Amerijet"
            required
          />
          <Field label="Flight date" name="flightDate" type="date" required />
          <label className="space-y-2 rounded-[1.25rem] border border-slate-200/80 bg-white/90 p-4 shadow-sm">
            <span className="text-sm font-medium text-slate-800">Excel file</span>
            <div className="flex min-h-28 flex-col justify-between rounded-[1rem] border border-dashed border-slate-300 bg-slate-50/80 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-[1rem] bg-white text-slate-700 shadow-sm">
                  <FileSpreadsheet className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-950">
                    Upload workbook
                  </p>
                  <p className="text-xs text-slate-500">
                    `.xlsx`, header variations supported
                  </p>
                </div>
              </div>
              <input
                accept=".xlsx,.xlsm,.xltx,.xltm"
                className="mt-4 block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
                name="workbook"
                required
                type="file"
              />
            </div>
          </label>
        </section>

        {state ? (
          <div
            className={`rounded-[1.25rem] px-4 py-3 text-sm ${
              state.success
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {state.message}
          </div>
        ) : null}

        <div className="flex justify-end">
          <PreviewSubmitButton />
        </div>
      </form>

      {state?.success ? <ImportPreview state={state} /> : null}
    </div>
  );
}

function ImportPreview({
  state,
}: Readonly<{
  state: Extract<ConsolidationImportActionState, { success: true }>;
}>) {
  const preview = state.preview;

  return (
    <div className="space-y-6">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <PreviewStat label="Valid rows" value={String(preview.totals.packageCount)} />
        <PreviewStat label="Invalid rows" value={String(preview.totals.invalidRowCount)} />
        <PreviewStat label="Duplicate tracking" value={String(preview.totals.duplicateTrackingCount)} />
        <PreviewStat label="Customers" value={String(preview.totals.customerCount)} />
        <PreviewStat label="Total weight lb" value={preview.totals.totalWeightLb} />
      </section>

      <section className="rounded-[1.6rem] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-700">
              Review before import
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
              {preview.form.reference} · {preview.form.carrier}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {preview.form.originalFilename} · flight date {preview.form.flightDate}
            </p>
          </div>
          <form action={confirmConsolidationImport}>
            <input name="previewToken" type="hidden" value={preview.token} />
            <ConfirmSubmitButton />
          </form>
        </div>
      </section>

      {preview.duplicateTrackingNumbers.length ? (
        <section className="rounded-[1.6rem] border border-amber-200 bg-amber-50/80 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 text-amber-700" />
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-amber-950">
                  Duplicate tracking numbers detected
                </h3>
                <p className="mt-1 text-sm text-amber-800">
                  These rows are excluded from the valid import set until the workbook is corrected.
                </p>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {preview.duplicateTrackingNumbers.map((duplicate) => (
                  <div
                    key={duplicate.trackingNumber}
                    className="rounded-[1rem] border border-amber-200/80 bg-white/70 px-4 py-3 text-sm text-amber-900"
                  >
                    <p className="font-semibold">{duplicate.trackingNumber}</p>
                    <p className="mt-1 text-xs">
                      Rows: {duplicate.rowNumbers.join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <DataCard
          title={`Valid rows (${preview.validRows.length})`}
          description="Every valid Excel row becomes one package record."
        >
          <div className="overflow-x-auto rounded-[1.2rem] border border-slate-200/80">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Row</th>
                  <th className="px-4 py-3">Tracking</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Weight lb</th>
                </tr>
              </thead>
              <tbody>
                {preview.validRows.slice(0, 12).map((row) => (
                  <tr key={`${row.sourceRowNumber}-${row.trackingNumber}`} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-500">{row.sourceRowNumber}</td>
                    <td className="px-4 py-3 font-medium text-slate-950">{row.trackingNumber}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <p>{row.customerNameRaw}</p>
                      <p className="text-xs text-slate-500">{row.customerEmail ?? "No email"}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.weightLb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.validRows.length > 12 ? (
            <p className="mt-3 text-xs text-slate-500">
              Showing the first 12 valid rows in this preview.
            </p>
          ) : null}
        </DataCard>

        <div className="space-y-6">
          <DataCard
            title={`Customer summary (${preview.customerSummaries.length})`}
            description="Derived grouping uses normalized email first, then normalized name when email is absent."
          >
            <div className="space-y-2">
              {preview.customerSummaries.map((customer) => (
                <div
                  key={customer.key}
                  className="rounded-[1rem] border border-slate-200/80 bg-slate-50/80 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {customer.label}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {customer.email ?? "Name-only grouping"}
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p>{customer.packageCount} pkg</p>
                      <p>{customer.totalWeightLb} lb</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DataCard>

          <DataCard
            title={`Invalid rows (${preview.invalidRows.length})`}
            description="Rows below are excluded from final import until the source workbook is corrected."
          >
            <div className="space-y-2">
              {preview.invalidRows.length ? (
                preview.invalidRows.map((row) => (
                  <div
                    key={row.sourceRowNumber}
                    className="rounded-[1rem] border border-rose-200/80 bg-rose-50/70 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-rose-900">
                      Row {row.sourceRowNumber}
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-rose-800">
                      {row.reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-600">No invalid rows detected.</p>
              )}
            </div>
          </DataCard>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
  required = false,
}: Readonly<{
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
}>) {
  return (
    <label className="space-y-2 rounded-[1.25rem] border border-slate-200/80 bg-white/90 p-4 shadow-sm">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <input
        className="h-12 w-full rounded-[1rem] border border-slate-200 bg-white px-4 text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
    </label>
  );
}

function PreviewSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex h-12 items-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}
      {pending ? "Parsing workbook..." : "Preview import"}
    </button>
  );
}

function ConfirmSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex h-12 items-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {pending ? "Finalizing import..." : "Confirm and import"}
    </button>
  );
}

function PreviewStat({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <article className="min-h-28 rounded-[1.25rem] border border-slate-200/80 bg-white/90 p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
    </article>
  );
}

function DataCard({
  title,
  description,
  children,
}: Readonly<{
  title: string;
  description: string;
  children: React.ReactNode;
}>) {
  return (
    <section className="rounded-[1.6rem] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
      <div>
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
