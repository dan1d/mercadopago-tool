import { MercadoPagoError } from "../errors.js";

export function statusEmoji(status: string): string {
  switch (status) {
    case "approved": return "\u2705";
    case "pending":
    case "in_process":
    case "in_mediation": return "\u23f3";
    case "rejected":
    case "cancelled": return "\u274c";
    case "refunded":
    case "charged_back": return "\ud83d\udd04";
    default: return "\u2753";
  }
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    approved: "Aprobado",
    pending: "Pendiente",
    in_process: "En proceso",
    in_mediation: "En mediacion",
    rejected: "Rechazado",
    cancelled: "Cancelado",
    refunded: "Devuelto",
    charged_back: "Contracargo",
  };
  return labels[status] ?? status;
}

export function formatMoney(amount: number, currency: string): string {
  return `$${amount.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export function friendlyError(err: unknown): string {
  if (err instanceof MercadoPagoError) {
    if (err.isUnauthorized) return "Error de autenticacion. Verifica el token de Mercado Pago.";
    if (err.isNotFound) return "No se encontro el recurso solicitado. Verifica el ID ingresado.";
    if (err.isRateLimited) return "Demasiadas solicitudes. Intenta de nuevo en unos minutos.";
    return `Error de Mercado Pago (${err.status}): ${err.body}`;
  }
  if (err instanceof Error) return `Error: ${err.message}`;
  return "Ocurrio un error inesperado. Intenta de nuevo.";
}
