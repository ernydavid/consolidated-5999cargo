"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileArchive, FileText, LoaderCircle, Upload } from "lucide-react";

import type { InvoiceUploadState } from "@/modules/invoices/types";

export function InvoiceUploadForm({
  consolidationId,
}: Readonly<{
  consolidationId: string;
}>) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<InvoiceUploadState | undefined>(undefined);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setPending(true);
    setState(undefined);

    try {
      const response = await fetch(
        `/api/customs/consolidados/${consolidationId}/invoices`,
        {
          method: "POST",
          body: formData,
        },
      );

      const nextState = (await response.json()) as InvoiceUploadState;
      setState(nextState);

      if (response.ok && nextState.success) {
        formRef.current?.reset();
        router.refresh();
      }

      if (response.status === 401) {
        router.push("/login");
      }
    } catch {
      setState({
        success: false,
        message: "Upload failed before the server could process the files.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <form ref={formRef} className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-3 md:grid-cols-2">
          <article className="min-h-28 rounded-[1.25rem] border border-slate-200/80 bg-white/90 p-4 shadow-sm">
            <div className="flex size-11 items-center justify-center rounded-[1rem] bg-slate-100 text-slate-700">
              <FileText className="size-5" />
            </div>
            <p className="mt-5 text-sm font-semibold text-slate-950">
              Single or multiple PDFs
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Supported directly in the upload batch.
            </p>
          </article>

          <article className="min-h-28 rounded-[1.25rem] border border-slate-200/80 bg-white/90 p-4 shadow-sm">
            <div className="flex size-11 items-center justify-center rounded-[1rem] bg-slate-100 text-slate-700">
              <FileArchive className="size-5" />
            </div>
            <p className="mt-5 text-sm font-semibold text-slate-950">ZIP packages</p>
            <p className="mt-1 text-sm text-slate-600">
              Only PDF files are accepted inside the ZIP.
            </p>
          </article>
        </div>

        <label className="block rounded-[1.35rem] border border-dashed border-slate-300 bg-white/85 p-5 shadow-sm">
          <span className="text-sm font-medium text-slate-800">
            Upload invoice documents
          </span>
          <p className="mt-1 text-sm text-slate-500">
            PDF or ZIP only. Maximum 8 MB per file.
          </p>
          <input
            accept=".pdf,.zip,application/pdf,application/zip,application/x-zip-compressed"
            className="mt-4 block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
            multiple
            name="documents"
            type="file"
          />
        </label>

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

        {state?.success ? (
          <section className="grid gap-3 md:grid-cols-3">
            <SummaryTile label="Created" value={String(state.summary.created)} />
            <SummaryTile
              label="Duplicates"
              value={String(state.summary.duplicates.length)}
            />
            <SummaryTile
              label="Rejected"
              value={String(state.summary.rejected.length)}
            />
          </section>
        ) : null}

        {state?.success && (state.summary.duplicates.length || state.summary.rejected.length) ? (
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[1.35rem] border border-amber-200 bg-amber-50/80 p-4">
              <p className="text-sm font-semibold text-amber-950">Duplicates</p>
              <div className="mt-3 space-y-2 text-sm text-amber-900">
                {state.summary.duplicates.length ? (
                  state.summary.duplicates.map((item) => <p key={item}>{item}</p>)
                ) : (
                  <p>No duplicate files detected.</p>
                )}
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-rose-200 bg-rose-50/80 p-4">
              <p className="text-sm font-semibold text-rose-950">Rejected</p>
              <div className="mt-3 space-y-2 text-sm text-rose-900">
                {state.summary.rejected.length ? (
                  state.summary.rejected.map((item) => (
                    <p key={`${item.filename}-${item.reason}`}>
                      {item.filename}: {item.reason}
                    </p>
                  ))
                ) : (
                  <p>No rejected files.</p>
                )}
              </div>
            </div>
          </section>
        ) : null}

        <div className="flex justify-end">
          <SubmitButton pending={pending} />
        </div>
      </form>
    </div>
  );
}

function SubmitButton({ pending }: Readonly<{ pending: boolean }>) {
  return (
    <button
      className="inline-flex h-12 items-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}
      {pending ? "Processing upload..." : "Upload invoices"}
    </button>
  );
}

function SummaryTile({
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
