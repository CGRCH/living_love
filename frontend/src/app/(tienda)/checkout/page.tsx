"use client";

import { useEffect, useMemo, useState } from "react";
import { API_URL, fetchCommunes, fetchPublicSettings, fetchRegions, formatCLP } from "@/lib/api";
import { Button } from "@/components/ui/Button";

type CartLine = {
  id: number;
  product: { name: string; slug: string; requires_deposit?: boolean; images?: { image: string }[] };
  qty: number;
  line_total: number;
  options_summary?: string[];
};

type CartPayload = {
  items: CartLine[];
  subtotal: number;
  requires_deposit: boolean;
};

const DEPOSIT_PERCENT = 50;

export default function CheckoutPage() {
  const [settings, setSettings] = useState<Awaited<ReturnType<typeof fetchPublicSettings>> | null>(
    null,
  );
  const [cart, setCart] = useState<CartPayload | null>(null);
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponValid, setCouponValid] = useState<boolean | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const reloadCart = () => {
    const session = localStorage.getItem("ll_cart_session") || "";
    return fetch(`${API_URL}/api/cart/`, { headers: { "X-Cart-Session": session } })
      .then((r) => r.json())
      .then((data) => {
        setCart({
          items: data.items || [],
          subtotal: data.subtotal ?? 0,
          requires_deposit: Boolean(data.requires_deposit),
        });
        if (data.session_key) {
          localStorage.setItem("ll_cart_session", data.session_key);
        }
      });
  };

  useEffect(() => {
    fetchPublicSettings().then(setSettings);
    reloadCart();
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

  const totals = useMemo(() => {
    const subtotal = cart?.subtotal ?? 0;
    const ship =
      form.shipping_method === "delivery" && !shipping.pending_coordination ? shipping.price : 0;
    const total = Math.max(subtotal - couponDiscount + ship, 0);
    const requiresDeposit = cart?.requires_deposit ?? false;
    const amountDueNow = requiresDeposit ? Math.round((total * DEPOSIT_PERCENT) / 100) : total;
    const balanceDue = requiresDeposit ? total - amountDueNow : 0;
    return { subtotal, ship, total, amountDueNow, balanceDue, requiresDeposit, discount: couponDiscount };
  }, [cart, form.shipping_method, shipping, couponDiscount]);

  const applyCoupon = async () => {
    setApplyingCoupon(true);
    setCouponMessage("");
    const session = localStorage.getItem("ll_cart_session") || "";
    const res = await fetch(`${API_URL}/api/cart/apply-coupon/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Cart-Session": session },
      body: JSON.stringify({ coupon_code: form.coupon_code.trim() }),
    });
    const data = await res.json();
    setApplyingCoupon(false);
    if (data.valid) {
      setCouponDiscount(data.discount);
      setCouponValid(true);
      setCouponMessage(data.message || "Cupón aplicado.");
    } else {
      setCouponDiscount(0);
      setCouponValid(false);
      setCouponMessage(data.message || "Cupón no válido.");
    }
  };

  const validateClient = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Ingresa tu nombre.";
    if (!form.phone.trim()) errs.phone = "Ingresa tu teléfono.";
    if (!form.email.trim()) errs.email = "Ingresa tu email.";
    if (!form.street.trim()) errs.street = "Ingresa la dirección.";
    if (!form.commune_id) errs.commune_id = "Selecciona una comuna.";
    if (form.doc_type === "factura") {
      if (!form.rut.trim()) errs.rut = "Ingresa el RUT.";
      if (!form.razon_social.trim()) errs.razon_social = "Ingresa la razón social.";
      if (!form.giro.trim()) errs.giro = "Ingresa el giro.";
    }
    setFieldErrors(errs);
    if (Object.keys(errs).length) {
      setFormError("Revisa los campos marcados.");
      return false;
    }
    setFormError("");
    return true;
  };

  const submit = async () => {
    if (!validateClient()) return;
    const session = localStorage.getItem("ll_cart_session") || "";
    const body: Record<string, unknown> = {
      ...form,
      coupon_code: form.coupon_code.trim(),
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
      const errs: Record<string, string> = {};
      if (typeof data.detail === "string") {
        setFormError(data.detail);
      } else {
        Object.entries(data).forEach(([k, v]) => {
          const msg = Array.isArray(v) ? v.join(" ") : String(v);
          errs[k] = msg;
        });
        setFieldErrors(errs);
        setFormError("Revisa los datos del formulario.");
      }
      return;
    }
    window.location.href = data.payment_redirect;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <nav
        aria-label="Pasos de compra"
        className="mb-10 flex flex-wrap items-center justify-center gap-2 md:gap-0"
      >
        {[
          { n: 1, label: "Carro", active: false },
          { n: 2, label: "Despacho y pago", active: true },
          { n: 3, label: "Confirmación", active: false },
        ].map((step, i) => (
          <div key={step.n} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-2 md:px-4 ${step.active ? "text-onix" : "text-taupe"}`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  step.active ? "bg-onix text-blanco" : "border border-arena bg-blanco"
                }`}
              >
                {step.n}
              </span>
              <span
                className={`text-[10px] uppercase tracking-label ${step.active ? "border-b-2 border-onix pb-1 font-semibold" : ""}`}
              >
                {step.label}
              </span>
            </div>
            {i < 2 ? <span className="mx-2 hidden h-px w-10 bg-arena md:mx-4 md:block md:w-16" /> : null}
          </div>
        ))}
      </nav>
      <h1 className="font-serif text-4xl">Finalizar compra</h1>
      {formError && (
        <p className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {formError}
        </p>
      )}
      <div className="mt-10 grid gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-10">
          <section>
            <p className="text-[10px] uppercase tracking-label">Datos de despacho</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {(
                [
                  ["name", "Nombre"],
                  ["phone", "Teléfono"],
                  ["email", "Email"],
                  ["street", "Dirección"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="text-xs uppercase tracking-label text-taupe">
                  {label}
                  <input
                    className={`mt-1 w-full border px-3 py-2 text-sm normal-case ${fieldErrors[key] ? "border-red-500" : "border-arena"}`}
                    value={form[key]}
                    onChange={(e) => {
                      setForm({ ...form, [key]: e.target.value });
                      setFieldErrors((fe) => ({ ...fe, [key]: "" }));
                    }}
                  />
                  {fieldErrors[key] && (
                    <span className="mt-1 block text-[11px] normal-case text-red-700">{fieldErrors[key]}</span>
                  )}
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
                  className={`mt-1 w-full border px-3 py-2 text-sm ${fieldErrors.commune_id ? "border-red-500" : "border-arena"}`}
                  value={form.commune_id}
                  onChange={(e) => {
                    setForm({ ...form, commune_id: e.target.value });
                    setFieldErrors((fe) => ({ ...fe, commune_id: "" }));
                  }}
                >
                  <option value="">Seleccionar</option>
                  {communes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.commune_id && (
                  <span className="mt-1 block text-[11px] normal-case text-red-700">{fieldErrors.commune_id}</span>
                )}
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
                  {(
                    [
                      ["rut", "RUT"],
                      ["razon_social", "Razón social"],
                      ["giro", "Giro"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="text-xs uppercase tracking-label text-taupe">
                      {label}
                      <input
                        className={`mt-1 w-full border px-3 py-2 text-sm normal-case ${fieldErrors[key] ? "border-red-500" : "border-arena"}`}
                        value={form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      />
                      {fieldErrors[key] && (
                        <span className="mt-1 block text-[11px] normal-case text-red-700">{fieldErrors[key]}</span>
                      )}
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
          <ul className="mt-4 space-y-3 border-b border-arena/40 pb-4 text-sm">
            {(cart?.items ?? []).map((item) => (
              <li key={item.id} className="flex justify-between gap-4">
                <span>
                  {item.product.name} × {item.qty}
                  {item.options_summary?.length ? (
                    <span className="mt-1 block text-xs text-taupe">{item.options_summary.join(" · ")}</span>
                  ) : null}
                </span>
                <span>{formatCLP(item.line_total)}</span>
              </li>
            ))}
            {!cart?.items?.length && (
              <li className="text-taupe">Tu carro está vacío. Agrega productos antes de pagar.</li>
            )}
          </ul>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatCLP(totals.subtotal)}</dd>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-champ">
                <dt>Descuento</dt>
                <dd>−{formatCLP(totals.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Despacho</dt>
              <dd>{totals.ship ? formatCLP(totals.ship) : "Gratis"}</dd>
            </div>
            <div className="flex justify-between border-t border-arena/40 pt-2 font-serif text-lg">
              <dt>Total</dt>
              <dd>{formatCLP(totals.total)}</dd>
            </div>
            {totals.requiresDeposit && (
              <>
                <div className="flex justify-between text-champ">
                  <dt>Abono a pagar ahora ({DEPOSIT_PERCENT}%)</dt>
                  <dd>{formatCLP(totals.amountDueNow)}</dd>
                </div>
                <div className="flex justify-between text-taupe">
                  <dt>Saldo en taller</dt>
                  <dd>{formatCLP(totals.balanceDue)}</dd>
                </div>
              </>
            )}
          </dl>
          <div className="mt-4">
            <label className="block text-xs text-taupe">
              Cupón
              <div className="mt-1 flex gap-2">
                <input
                  className="min-w-0 flex-1 border border-arena px-3 py-2 text-sm"
                  value={form.coupon_code}
                  onChange={(e) => {
                    setForm({ ...form, coupon_code: e.target.value });
                    setCouponValid(null);
                    setCouponMessage("");
                  }}
                  placeholder="BIENVENIDA"
                />
                <Button type="button" variant="outline" onClick={applyCoupon} disabled={applyingCoupon}>
                  Aplicar
                </Button>
              </div>
            </label>
            {couponMessage && (
              <p
                className={`mt-2 text-xs ${couponValid ? "text-green-800" : "text-red-700"}`}
                role="status"
              >
                {couponMessage}
              </p>
            )}
          </div>
          <Button full className="mt-8" onClick={submit} disabled={!cart?.items?.length}>
            Pagar {formatCLP(totals.amountDueNow)}
          </Button>
          <p className="mt-4 text-center text-xs text-taupe">{settings?.fabrication_notice}</p>
        </aside>
      </div>
    </div>
  );
}
