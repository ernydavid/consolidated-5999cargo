"use client";

import { useActionState } from "react";

import { updateSettings } from "@/modules/settings/actions";

const initialState = undefined;

export function SettingsForm({
  defaults,
}: Readonly<{
  defaults: {
    freightRateUsdPerLb: string;
    usdToXcgRate: string;
    adminCostXcg: string;
    taxRate: string;
  };
}>) {
  const [state, action, pending] = useActionState(updateSettings, initialState);
  const fields = [
    {
      label: "Freight USD per lb",
      name: "freightRateUsdPerLb",
      help: "Base freight rate applied to total package weight.",
      step: "0.01",
      defaultValue: defaults.freightRateUsdPerLb,
    },
    {
      label: "USD to XCG rate",
      name: "usdToXcgRate",
      help: "Currency conversion rate saved into each calculation snapshot.",
      step: "0.01",
      defaultValue: defaults.usdToXcgRate,
    },
    {
      label: "Admin cost XCG",
      name: "adminCostXcg",
      help: "Flat administrative charge added to every calculation.",
      step: "0.01",
      defaultValue: defaults.adminCostXcg,
    },
    {
      label: "Tax rate",
      name: "taxRate",
      help: "Tax percentage applied after freight, duties and admin cost.",
      step: "0.0001",
      defaultValue: defaults.taxRate,
    },
  ] as const;

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <label
            key={field.name}
            className="space-y-2 rounded-[1.25rem] border border-slate-200/80 bg-slate-50/70 p-4 text-sm"
          >
            <span className="font-medium text-slate-800">{field.label}</span>
            <input
              className="h-12 w-full rounded-[1rem] border border-slate-200 bg-white px-4 text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              name={field.name}
              step={field.step}
              defaultValue={field.defaultValue}
              required
            />
            <span className="block text-xs leading-5 text-slate-500">
              {field.help}
            </span>
          </label>
        ))}
      </div>

      {state ? (
        <p
          className={`rounded-[1rem] px-4 py-3 text-sm ${
            state.success
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          className="h-12 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Saving..." : "Save settings"}
        </button>
      </div>
    </form>
  );
}
