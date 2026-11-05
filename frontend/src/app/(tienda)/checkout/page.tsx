"use client";

import { useEffect, useState } from "react";
import { API_URL, fetchCommunes, fetchPublicSettings, fetchRegions, formatCLP } from "@/lib/api";
import { Button } from "@/components/ui/Button";

export default function CheckoutPage() {
  const [settings, setSettings] = useState<Awaited<ReturnType<typeof fetchPublicSettings>> | null>(
    null,
  );
  const [regions, setRegions] = useState<{ id: number; name: string }[]>([]);
  const [communes, setCommunes] = useState<{ id: number; name: string }[]>([]);
  const [shipping, setShipping] = useState({ price: 0, label: "", pending_coordination: false });
  const [form, setForm] = useState({
    email: "",
    phone: "",
    name: "",
    street: "",
    region_id: "",
    commune_id: "",
    doc_type: "boleta",
    rut: "",
    razon_social: "",
    giro: "",
    payment_provider: "simulated",
    coupon_code: "",
    shipping_method: "delivery",
  });

  useEffect(() => {
    fetchPublicSettings().then(setSettings);
    fetchRegions().then((r) => {
      setRegions(r.results ?? r);
      const rm = (r.results ?? r).find((x: { code: string }) => x.code === "RM");
      if (rm) {
        setForm((f) => ({ ...f, region_id: String(rm.id) }));
        fetchCommunes(rm.id).then((c) => setCommunes(c.results ?? c));
      }
    });
  }, []);

  useEffect(() => {
    if (!form.commune_id) return;
    fetch(
      `${API_URL}/api/shipping/quote/?commune=${form.commune_id}&method=${form.shipping_method}`,
    )
      .then((r) => r.json())
      .then(setShipping);
  }, [form.commune_id, form.shipping_method]);

  const submit = async () => {
    const session = localStorage.getItem("ll_cart_session") || "";
    const body: Record<string, unknown> = {
      ...form,
      region_id: form.region_id ? Number(form.region_id) : undefined,
      commune_id: form.commune_id ? Number(form.commune_id) : undefined,
      session_key: session,
      shipping_address: {
        name: form.name,
        street: form.street,
      },
    };
    if (form.doc_type === "factura") {
      body.billing = {
        rut: form.rut,
        razon_social: form.razon_social,
        giro: form.giro,
      };
    }
    const res = await fetch(`${API_URL}/api/checkout/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Cart-Session": session },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.detail || "Error en checkout");
      return;
    }
    window.location.href = data.payment_redirect;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex items-center justify-center gap-8 text-[10px] uppercase tracking-label">
        <span>1 Carro</span>
        <span className="border-b-2 border-onix pb-1 font-semibold">2 Despacho y pago</span>
        <span>3 Confirmación</span>
      </div>
      <h1 className="font-serif text-4xl">Finalizar compra</h1>
      <div className="mt-10 grid gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-10">
          <section>
            <p className="text-[10px] uppercase tracking-label">Datos de despacho</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {[
                ["name", "Nombre"],
                ["phone", "Teléfono"],
                ["email", "Email"],
                ["street", "Dirección"],
              ].map(([key, label]) => (
                <label key={key} className="text-xs uppercase tracking-label text-taupe">
                  {label}
                  <input
                    className="mt-1 w-full border border-arena px-3 py-2 text-sm normal-case"
                    value={(form as Record<string, string>)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </label>
              ))}
              <label className="text-xs uppercase tracking-label text-taupe">
                Región
                <select
                  className="mt-1 w-full border border-arena px-3 py-2 text-sm"
                  value={form.region_id}
                  onChange={(e) => {
                    setForm({ ...form, region_id: e.target.value, commune_id: "" });
                    fetchCommunes(Number(e.target.value)).then((c) =>
                      setCommunes(c.results ?? c),
                    );
                  }}
                >
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs uppercase tracking-label text-taupe">
                Comuna
                <select
                  className="mt-1 w-full border border-arena px-3 py-2 text-sm"
                  value={form.commune_id}
                  onChange={(e) => setForm({ ...form, commune_id: e.target.value })}
                >
                  <option value="">Seleccionar</option>
                  {communes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-4 flex gap-4">
              <button
                type="button"
                className={`border px-4 py-2 text-xs uppercase ${form.shipping_method === "delivery" ? "bg-onix text-blanco" : ""}`}
                onClick={() => setForm({ ...form, shipping_method: "delivery" })}
              >
                Despacho
              </button>
              <button
                type="button"
                className={`border px-4 py-2 text-xs uppercase ${form.shipping_method === "pickup" ? "bg-onix text-blanco" : ""}`}
                onClick={() => setForm({ ...form, shipping_method: "pickup" })}
              >
                Retiro en taller
              </button>
            </div>
            {form.commune_id && (
              <div className="mt-4 flex justify-between bg-marfil px-4 py-3 text-sm">
                <span>Despacho {shipping.pending_coordination ? "a coordinar" : ""}</span>
                <strong>{shipping.price ? formatCLP(shipping.price) : "Gratis"}</strong>
              </div>
            )}
          </section>

          {settings?.boleta_enabled && settings?.factura_enabled && (
            <section>
              <p className="text-[10px] uppercase tracking-label">Documento tributario</p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                {(["boleta", "factura"] as const).map((doc) => (
                  <button
                    key={doc}
                    type="button"
                    className={`border py-4 text-xs uppercase ${form.doc_type === doc ? "bg-onix text-blanco" : ""}`}
                    onClick={() => setForm({ ...form, doc_type: doc })}
                  >
                    {doc}
                  </button>
                ))}
              </div>
              {form.doc_type === "factura" && (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {[
                    ["rut", "RUT"],
                    ["razon_social", "Razón social"],
                    ["giro", "Giro"],
                  ].map(([key, label]) => (
                    <label key={key} className="text-xs uppercase tracking-label text-taupe">
                      {label}
                      <input
                        className="mt-1 w-full border border-arena px-3 py-2 text-sm normal-case"
                        value={(form as Record<string, string>)[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      />
                    </label>
                  ))}
                </div>
              )}
            </section>
          )}

          <section>
            <p className="text-[10px] uppercase tracking-label">Medio de pago</p>
            <div className="mt-4 space-y-2">
              {settings?.payment_providers.map((p) => (
                <label
                  key={p.code}
                  className={`flex cursor-pointer items-center gap-3 border px-4 py-3 ${form.payment_provider === p.code ? "border-onix" : "border-arena"}`}
                >
                  <input
                    type="radio"
                    name="pay"
                    checked={form.payment_provider === p.code}
                    onChange={() => setForm({ ...form, payment_provider: p.code })}
                  />
                  <span className="text-sm">{p.display_name}</span>
                </label>
              ))}
            </div>
          </section>
        </div>
        <aside className="h-fit bg-marfil p-6">
          <p className="text-[10px] uppercase tracking-label">Tu pedido</p>
          <label className="mt-4 block text-xs text-taupe">
            Cupón
            <input
              className="mt-1 w-full border border-arena px-3 py-2 text-sm"
              value={form.coupon_code}
              onChange={(e) => setForm({ ...form, coupon_code: e.target.value })}
              placeholder="BIENVENIDA"
            />
          </label>
          <Button full className="mt-8" onClick={submit}>
            Pagar
          </Button>
          <p className="mt-4 text-center text-xs text-taupe">
            {settings?.fabrication_notice}
          </p>
        </aside>
      </div>
    </div>
  );
}
