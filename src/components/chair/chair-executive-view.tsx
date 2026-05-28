"use client";

import Link from "next/link";
import { useState } from "react";
import type { ExecutiveChairSection } from "@/lib/operational-memory/executive-chair";

export function ChairExecutiveView({
  primary,
  advanced,
}: {
  primary: ExecutiveChairSection[];
  advanced: ExecutiveChairSection[];
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        {primary.map((section) => (
          <section
            key={section.title}
            className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {section.title}
            </h2>
            {section.items.length === 0 ? (
              <p className="text-sm text-slate-500">Clear for now.</p>
            ) : (
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item.href + item.label}>
                    <Link
                      href={item.href}
                      className="text-sm font-medium text-green-700 hover:underline"
                    >
                      {item.label}
                    </Link>
                    {item.meta ? (
                      <p className="text-xs text-slate-500">{item.meta}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <button
        type="button"
        className="text-sm text-slate-600 hover:text-slate-900"
        onClick={() => setShowAdvanced((v) => !v)}
      >
        {showAdvanced ? "Hide" : "Show"} advanced detail
      </button>

      {showAdvanced && (
        <div className="grid gap-4 lg:grid-cols-2">
          {advanced.map((section) => (
            <section
              key={section.title}
              className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4"
            >
              <h2 className="mb-2 text-xs font-semibold uppercase text-slate-400">
                {section.title}
              </h2>
              <ul className="space-y-1 text-sm">
                {section.items.map((item) => (
                  <li key={item.href + item.label}>
                    <Link href={item.href} className="text-green-700 hover:underline">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
