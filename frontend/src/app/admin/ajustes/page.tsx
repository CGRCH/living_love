"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<{ store: Record<string, string> } | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminFetch("/api/admin/settings/").then((r) => r.json()).then(setSettings);
  }, []);

  if (!settings) return null;

  return (
    <div>
      <h1 className="font-serif text-3xl">Ajustes</h1>
      <label className="mt-8 block text-xs uppercase tracking-label text-taupe">
        Texto barra anuncio
        <textarea
          className="mt-2 w-full border border-arena p-3 text-sm normal-case"
          rows={3}
          value={settings.store.announcement_text || ""}
          onChange={(e) =>
            setSettings({ store: { ...settings.store, announcement_text: e.target.value } })
          }
        />
      </label>
      <label className="mt-4 block text-xs uppercase tracking-label text-taupe">
        Política de devoluciones (markdown)
        <textarea
          className="mt-2 w-full border border-arena p-3 text-sm normal-case"
          rows={6}
          value={settings.store.return_policy_md || ""}
          onChange={(e) =>
            setSettings({ store: { ...settings.store, return_policy_md: e.target.value } })
          }
        />
      </label>
      <button
        type="button"
        className="mt-6 bg-onix px-6 py-3 text-xs uppercase tracking-label text-blanco"
        onClick={async () => {
          await adminFetch("/api/admin/settings/", {
            method: "PATCH",
            body: JSON.stringify({ store: settings.store }),
          });
          setSaved(true);
        }}
      >
        Guardar
      </button>
      {saved && <p className="mt-2 text-sm text-champ">Guardado</p>}
    </div>
  );
}
