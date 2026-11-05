"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { paymentProviderModeLabel } from "@/lib/labels";

export default function AdminPaymentsPage() {
  const [providers, setProviders] = useState<
    { code: string; display_name: string; is_enabled: boolean; mode: string }[]
  >([]);

  useEffect(() => {
    adminFetch("/api/admin/payment-providers/").then((r) => r.json()).then(setProviders);
  }, []);

  const toggle = async (code: string, nextEnabled: boolean) => {
    await adminFetch("/api/admin/payment-providers/", {
      method: "PATCH",
      body: JSON.stringify({ code, is_enabled: nextEnabled }),
    });
    setProviders((prev) =>
      prev.map((p) => (p.code === code ? { ...p, is_enabled: nextEnabled } : p)),
    );
  };

  return (
    <div>
      <h1 className="font-serif text-3xl">Pagos</h1>
      <ul className="mt-8 space-y-4">
        {providers.map((p) => (
          <li key={p.code} className="flex flex-wrap items-center justify-between gap-4 bg-blanco px-4 py-4">
            <div>
              <p className="font-medium">{p.display_name}</p>
              <p className="text-xs text-taupe">Modo: {paymentProviderModeLabel(p.mode)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-label text-taupe">
                {p.is_enabled ? "Activo" : "Inactivo"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={p.is_enabled}
                aria-label={`${p.display_name} ${p.is_enabled ? "activo" : "inactivo"}`}
                className={`relative h-7 w-14 rounded-full border border-arena transition-colors ${p.is_enabled ? "bg-champ" : "bg-arena/60"}`}
                onClick={() => toggle(p.code, !p.is_enabled)}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-blanco shadow transition-transform ${p.is_enabled ? "left-7" : "left-0.5"}`}
                />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
