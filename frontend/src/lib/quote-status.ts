export const QUOTE_STATUS_LABELS: Record<string, string> = {
  new: "Nueva",
  answered: "Respondida",
  accepted: "Aceptada",
  converted: "Convertida",
  expired: "Expirada",
  cancelled: "Cancelada",
};

export function quoteStatusLabel(status: string) {
  return QUOTE_STATUS_LABELS[status] ?? status;
}
