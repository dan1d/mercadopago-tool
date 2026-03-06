import TelegramBot from "node-telegram-bot-api";
import { createMercadoPagoTools } from "./index.js";
import { statusEmoji, statusLabel, formatMoney, friendlyError } from "./shared/formatting.js";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN ?? "";
const MP_CURRENCY = process.env.MP_CURRENCY ?? "ARS";
const MP_SUCCESS_URL = process.env.MP_SUCCESS_URL ?? "";

export function startBot(): TelegramBot {
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN es requerido. Configuralo en las variables de entorno.");
  }
  if (!MP_ACCESS_TOKEN) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN es requerido. Configuralo en las variables de entorno.");
  }

  const mp = createMercadoPagoTools(MP_ACCESS_TOKEN);
  const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

  bot.onText(/\/start(?:\s|$)/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(
      chatId,
      "Hola! Soy tu bot de cobros con Mercado Pago.\n\n" +
        "Puedo generar links de pago, consultar pagos y hacer devoluciones.\n\n" +
        "Usa /help para ver los comandos disponibles."
    );
  });

  bot.onText(/\/help(?:\s|$)/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(
      chatId,
      "Comandos disponibles:\n\n" +
        "/cobrar <monto> <descripcion> - Genera un link de pago\n" +
        "  Ejemplo: /cobrar 5000 Servicio de diseno\n\n" +
        "/pagos - Lista los ultimos 5 pagos\n\n" +
        "/estado <payment_id> - Consulta el estado de un pago\n\n" +
        "/devolver <payment_id> [monto] - Devuelve un pago (total o parcial)\n\n" +
        "/help - Muestra este mensaje"
    );
  });

  bot.onText(/\/cobrar(?:\s+(.*))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const args = match?.[1]?.trim();

    if (!args) {
      bot.sendMessage(
        chatId,
        "Uso: /cobrar <monto> <descripcion>\nEjemplo: /cobrar 5000 Servicio de diseno"
      );
      return;
    }

    const spaceIndex = args.indexOf(" ");
    if (spaceIndex === -1) {
      bot.sendMessage(
        chatId,
        "Debes incluir un monto y una descripcion.\nEjemplo: /cobrar 5000 Servicio de diseno"
      );
      return;
    }

    const amountStr = args.substring(0, spaceIndex);
    const description = args.substring(spaceIndex + 1).trim();
    const amount = Number(amountStr);

    if (isNaN(amount) || amount <= 0) {
      bot.sendMessage(chatId, "El monto debe ser un numero positivo.\nEjemplo: /cobrar 5000 Servicio de diseno");
      return;
    }

    if (!description) {
      bot.sendMessage(chatId, "Debes incluir una descripcion.\nEjemplo: /cobrar 5000 Servicio de diseno");
      return;
    }

    try {
      const backUrls = MP_SUCCESS_URL
        ? { success: MP_SUCCESS_URL }
        : undefined;

      const result = (await mp.tools.create_payment_preference({
        title: description,
        quantity: 1,
        currency: MP_CURRENCY,
        unit_price: amount,
        back_urls: backUrls,
      })) as { id: string; init_point: string; sandbox_init_point: string };

      bot.sendMessage(
        chatId,
        `Link de pago creado!\n\n` +
          `Descripcion: ${description}\n` +
          `Monto: ${formatMoney(amount, MP_CURRENCY)}\n\n` +
          `Link de pago:\n${result.init_point}`
      );
    } catch (err) {
      bot.sendMessage(chatId, friendlyError(err));
    }
  });

  bot.onText(/\/pagos(?:\s|$)/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const result = (await mp.tools.search_payments({ limit: 5 })) as {
        results: Array<{
          id: number;
          status: string;
          transaction_amount: number;
          currency_id: string;
          description: string;
          date_created: string;
        }>;
      };

      if (!result.results || result.results.length === 0) {
        bot.sendMessage(chatId, "No se encontraron pagos recientes.");
        return;
      }

      const lines = result.results.map((p) => {
        const emoji = statusEmoji(p.status);
        const label = statusLabel(p.status);
        const money = formatMoney(p.transaction_amount, p.currency_id ?? MP_CURRENCY);
        const desc = p.description ?? "Sin descripcion";
        return `${emoji} #${p.id} - ${label}\n   ${money} - ${desc}`;
      });

      bot.sendMessage(
        chatId,
        `Ultimos pagos:\n\n${lines.join("\n\n")}`
      );
    } catch (err) {
      bot.sendMessage(chatId, friendlyError(err));
    }
  });

  bot.onText(/\/estado(?:\s+(\S+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const paymentId = match?.[1]?.trim();

    if (!paymentId) {
      bot.sendMessage(chatId, "Uso: /estado <payment_id>\nEjemplo: /estado 123456789");
      return;
    }

    try {
      const payment = (await mp.tools.get_payment({ payment_id: paymentId })) as {
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
      const money = formatMoney(payment.transaction_amount, payment.currency_id ?? MP_CURRENCY);
      const payerEmail = payment.payer?.email ?? "No disponible";

      bot.sendMessage(
        chatId,
        `Pago #${payment.id}\n\n` +
          `Estado: ${emoji} ${label}\n` +
          `Monto: ${money}\n` +
          `Descripcion: ${payment.description ?? "Sin descripcion"}\n` +
          `Pagador: ${payerEmail}\n` +
          `Fecha: ${payment.date_created ?? "No disponible"}`
      );
    } catch (err) {
      bot.sendMessage(chatId, friendlyError(err));
    }
  });

  bot.onText(/\/devolver(?:\s+(\S+)(?:\s+(\S+))?)?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const paymentId = match?.[1]?.trim();

    if (!paymentId) {
      bot.sendMessage(
        chatId,
        "Uso: /devolver <payment_id> [monto]\n" +
          "Ejemplo devolucion total: /devolver 123456789\n" +
          "Ejemplo devolucion parcial: /devolver 123456789 1500"
      );
      return;
    }

    const amountStr = match?.[2]?.trim();
    let amount: number | undefined;

    if (amountStr) {
      amount = Number(amountStr);
      if (isNaN(amount) || amount <= 0) {
        bot.sendMessage(chatId, "El monto de devolucion debe ser un numero positivo.");
        return;
      }
    }

    try {
      const result = (await mp.tools.create_refund({
        payment_id: paymentId,
        amount,
      })) as { id: number; amount: number };

      const refundType = amount ? "parcial" : "total";
      bot.sendMessage(
        chatId,
        `Devolucion ${refundType} realizada!\n\n` +
          `ID de devolucion: ${result.id}\n` +
          `Pago: #${paymentId}\n` +
          `Monto devuelto: $${result.amount}`
      );
    } catch (err) {
      bot.sendMessage(chatId, friendlyError(err));
    }
  });

  console.log("Bot de Telegram iniciado correctamente.");
  return bot;
}

// Auto-start when run directly
const isMain =
  typeof require !== "undefined"
    ? require.main === module
    : process.argv[1]?.includes("telegram-bot");

if (isMain) {
  startBot();
}
