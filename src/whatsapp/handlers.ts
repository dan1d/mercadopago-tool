import { WhatsAppClient } from "./client.js";
import type { ParsedCommand } from "./message-parser.js";
import { createMercadoPagoTools } from "../index.js";
import { statusEmoji, statusLabel, friendlyError } from "../shared/formatting.js";
import type { TokenResolver } from "../db/token-resolver.js";
import type { MerchantStore } from "../db/merchant-store.js";

export interface HandlersConfig {
  mpAccessToken: string;
  currency: string;
  successUrl?: string;
  tokenResolver?: TokenResolver;
  merchantStore?: MerchantStore;
}

const ONBOARDING_MSG =
  "No tienes un token de Mercado Pago configurado.\n\n" +
  "Para empezar, envia:\nconfigurar <tu_access_token>\n\n" +
  "Obtene tu Access Token en:\nhttps://www.mercadopago.com.ar/developers/panel/app";

export function createCommandHandlers(config: HandlersConfig) {
  function resolveMpTools(phone: string) {
    const token = config.tokenResolver
      ? config.tokenResolver.resolve(phone)
      : config.mpAccessToken;
    if (!token) return null;
    return createMercadoPagoTools(token);
  }

  async function handleCommand(
    wa: WhatsAppClient,
    phoneNumber: string,
    parsed: ParsedCommand
  ): Promise<void> {
    switch (parsed.command) {
      case "ayuda":
        return handleAyuda(wa, phoneNumber);
      case "configurar":
        return handleConfigurar(wa, phoneNumber, parsed.args);
      case "cobrar":
        return handleCobrar(wa, phoneNumber, parsed.args);
      case "pagos":
        return handlePagos(wa, phoneNumber);
      case "estado":
        return handleEstado(wa, phoneNumber, parsed.args);
      case "devolver":
        return handleDevolver(wa, phoneNumber, parsed.args);
    }
  }

  async function handleAyuda(wa: WhatsAppClient, phone: string): Promise<void> {
    await wa.sendMessage(
      phone,
      "Comandos disponibles:\n\n" +
        "cobrar <monto> <descripcion>\n  Genera un link de pago\n\n" +
        "pagos\n  Lista ultimos pagos\n\n" +
        "estado <payment_id>\n  Consulta estado de un pago\n\n" +
        "devolver <payment_id> [monto]\n  Devuelve un pago\n\n" +
        "configurar <access_token>\n  Registra tu token de Mercado Pago\n\n" +
        "ayuda\n  Muestra este mensaje"
    );
  }

  async function handleConfigurar(wa: WhatsAppClient, phone: string, args: string[]): Promise<void> {
    if (!config.merchantStore) {
      await wa.sendMessage(phone, "La configuracion de tokens no esta disponible en este momento.");
      return;
    }

    if (args.length < 1) {
      await wa.sendMessage(
        phone,
        "Uso: configurar <tu_access_token>\n\n" +
          "Obtene tu Access Token en:\nhttps://www.mercadopago.com.ar/developers/panel/app"
      );
      return;
    }

    const token = args[0];

    try {
      const mp = createMercadoPagoTools(token);
      const info = (await mp.tools.get_merchant_info()) as {
        first_name: string;
        last_name: string;
      };
      const name = `${info.first_name} ${info.last_name}`;
      config.merchantStore.setToken(phone, token, name);
      await wa.sendMessage(
        phone,
        `Token registrado para ${name}.\nYa podes usar los comandos. Envia "ayuda" para verlos.`
      );
    } catch {
      await wa.sendMessage(
        phone,
        "Token invalido. Verifica que sea un Access Token valido de Mercado Pago."
      );
    }
  }

  async function handleCobrar(wa: WhatsAppClient, phone: string, args: string[]): Promise<void> {
    if (args.length < 2) {
      await wa.sendMessage(phone, "Uso: cobrar <monto> <descripcion>\nEjemplo: cobrar 5000 curso python");
      return;
    }

    const amount = Number(args[0]);
    if (isNaN(amount) || amount <= 0) {
      await wa.sendMessage(phone, "El monto debe ser un numero positivo.");
      return;
    }

    const mp = resolveMpTools(phone);
    if (!mp) {
      await wa.sendMessage(phone, ONBOARDING_MSG);
      return;
    }

    const description = args.slice(1).join(" ");

    try {
      const backUrls = config.successUrl ? { success: config.successUrl } : undefined;
      const result = (await mp.tools.create_payment_preference({
        title: description,
        quantity: 1,
        currency: config.currency,
        unit_price: amount,
        back_urls: backUrls,
      })) as { id: string; init_point: string };

      await wa.sendMessage(
        phone,
        `\ud83d\udcb3 Link de pago generado\n\n` +
          `${description}\n` +
          `Monto: $${amount}\n\n` +
          `${result.init_point}`
      );
    } catch (err) {
      await wa.sendMessage(phone, friendlyError(err));
    }
  }

  async function handlePagos(wa: WhatsAppClient, phone: string): Promise<void> {
    const mp = resolveMpTools(phone);
    if (!mp) {
      await wa.sendMessage(phone, ONBOARDING_MSG);
      return;
    }

    try {
      const result = (await mp.tools.search_payments({ limit: 5 })) as {
        results: Array<{
          id: number;
          status: string;
          transaction_amount: number;
          currency_id: string;
          description: string;
        }>;
      };

      if (!result.results || result.results.length === 0) {
        await wa.sendMessage(phone, "No se encontraron pagos recientes.");
        return;
      }

      const lines = result.results.map((p) => {
        const emoji = statusEmoji(p.status);
        const label = statusLabel(p.status);
        return `${emoji} ${label}\n$${p.transaction_amount}\nID: ${p.id}`;
      });

      await wa.sendMessage(phone, `Ultimos pagos:\n\n${lines.join("\n\n")}`);
    } catch (err) {
      await wa.sendMessage(phone, friendlyError(err));
    }
  }

  async function handleEstado(wa: WhatsAppClient, phone: string, args: string[]): Promise<void> {
    if (args.length < 1) {
      await wa.sendMessage(phone, "Uso: estado <payment_id>\nEjemplo: estado 123456789");
      return;
    }

    const mp = resolveMpTools(phone);
    if (!mp) {
      await wa.sendMessage(phone, ONBOARDING_MSG);
      return;
    }

    try {
      const payment = (await mp.tools.get_payment({ payment_id: args[0] })) as {
        id: number;
        status: string;
        transaction_amount: number;
        currency_id: string;
        description: string;
        payer: { email: string };
        date_created: string;
      };

      const emoji = statusEmoji(payment.status);
      const label = statusLabel(payment.status);

      await wa.sendMessage(
        phone,
        `Pago #${payment.id}\n\n` +
          `Estado: ${emoji} ${label}\n` +
          `Monto: $${payment.transaction_amount}\n` +
          `Descripcion: ${payment.description ?? "Sin descripcion"}\n` +
          `Pagador: ${payment.payer?.email ?? "No disponible"}\n` +
          `Fecha: ${payment.date_created ?? "No disponible"}`
      );
    } catch (err) {
      await wa.sendMessage(phone, friendlyError(err));
    }
  }

  async function handleDevolver(wa: WhatsAppClient, phone: string, args: string[]): Promise<void> {
    if (args.length < 1) {
      await wa.sendMessage(phone, "Uso: devolver <payment_id> [monto]\nEjemplo: devolver 123456789");
      return;
    }

    const mp = resolveMpTools(phone);
    if (!mp) {
      await wa.sendMessage(phone, ONBOARDING_MSG);
      return;
    }

    const paymentId = args[0];
    let amount: number | undefined;

    if (args[1]) {
      amount = Number(args[1]);
      if (isNaN(amount) || amount <= 0) {
        await wa.sendMessage(phone, "El monto debe ser un numero positivo.");
        return;
      }
    }

    try {
      const result = (await mp.tools.create_refund({
        payment_id: paymentId,
        amount,
      })) as { id: number; amount: number };

      const tipo = amount ? "parcial" : "total";
      await wa.sendMessage(
        phone,
        `Devolucion ${tipo} realizada\n\n` +
          `ID devolucion: ${result.id}\n` +
          `Pago: #${paymentId}\n` +
          `Monto devuelto: $${result.amount}`
      );
    } catch (err) {
      await wa.sendMessage(phone, friendlyError(err));
    }
  }

  return { handleCommand };
}

export function createPaymentNotifier(wa: WhatsAppClient, notifyPhone: string) {
  return async (payment: unknown): Promise<void> => {
    const p = payment as {
      id: number;
      status: string;
      transaction_amount: number;
      currency_id: string;
      description: string;
    };

    if (p.status !== "approved") return;

    await wa.sendMessage(
      notifyPhone,
      `\u2705 Pago recibido\nMonto: $${p.transaction_amount}\nID: ${p.id}` +
        (p.description ? `\nDescripcion: ${p.description}` : "")
    );
  };
}
