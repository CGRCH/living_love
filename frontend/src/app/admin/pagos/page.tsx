"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";

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
          <li key={p.code} className="flex items-center justify-between bg-blanco px-4 py-4">
            <div>
              <p className="font-medium">{p.display_name}</p>
              <p className="text-xs text-taupe">Modo: {p.mode}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={p.is_enabled}
              aria-label={`${p.display_name} ${p.is_enabled ? "activo" : "inactivo"}`}
              className={`h-6 w-12 rounded-sm ${p.is_enabled ? "bg-champ" : "bg-arena"}`}
              onClick={() => toggle(p.code, !p.is_enabled)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
