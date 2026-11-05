export function priceModeLabel(mode: string): string {
  const map: Record<string, string> = {
    show_price: "Precio visible",
    quote_only: "Solo cotización",
    SHOW_PRICE: "Precio visible",
    QUOTE_ONLY: "Solo cotización",
  };
  return map[mode] ?? mode;
}

export function shippingMethodLabel(method: string): string {
  const map: Record<string, string> = {
    delivery: "Despacho a domicilio",
    pickup: "Retiro en taller",
  };
  return map[method] ?? method;
}

export function userRoleLabel(role: string): string {
  const map: Record<string, string> = {
    store: "Tienda",
    admin: "Administración",
    STORE: "Tienda",
    ADMIN: "Administración",
  };
  return map[role] ?? role;
}

export function paymentProviderModeLabel(mode: string): string {
  const map: Record<string, string> = {
    simulated: "Simulado (desarrollo)",
    sandbox: "Sandbox",
    live: "Producción",
  };
  return map[mode] ?? mode;
}

export function paymentKindLabel(kind: string): string {
  const map: Record<string, string> = {
    deposit: "Abono",
    balance: "Saldo",
    full: "Pago total",
  };
  return map[kind] ?? kind;
}

export function paymentStatusLabel(status: string): string {
  const map: Record<string, string> = {
    approved: "Aprobado",
    pending: "Pendiente",
    rejected: "Rechazado",
    APPROVED: "Aprobado",
  };
  return map[status] ?? status;
}

export function paymentProviderLabel(code: string): string {
  const map: Record<string, string> = {
    simulated: "Modo simulado",
    webpay: "Webpay Plus",
    mercadopago: "Mercado Pago",
    flow: "Flow",
    sumup: "SumUp",
  };
  return map[code] ?? code;
}

export function pluralModelos(count: number): string {
  return count === 1 ? "1 modelo" : `${count} modelos`;
}

export function pluralProductos(count: number): string {
  return count === 1 ? "1 producto" : `${count} productos`;
}

export function greetingName(firstName?: string): string {
  const hour = new Date().getHours();
  const saludo = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const name = firstName?.trim();
  return name ? `${saludo}, ${name}` : saludo;
}
