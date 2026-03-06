import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyWebhookSignature(
  secret: string,
  dataId: string,
  xSignature: string,
  xRequestId: string
): boolean {
  const parts = xSignature.split(",");

  let ts: string | undefined;
  let v1Hash: string | undefined;

  for (const part of parts) {
    const [key, value] = part.trim().split("=", 2);
    if (key === "ts") {
      ts = value;
    } else if (key === "v1") {
      v1Hash = value;
    }
  }

  if (!ts || !v1Hash) {
    return false;
  }

  const template = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  const hmac = createHmac("sha256", secret);
  hmac.update(template);
  const computed = hmac.digest("hex");

  try {
    const computedBuffer = Buffer.from(computed, "hex");
    const expectedBuffer = Buffer.from(v1Hash, "hex");

    if (computedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(computedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}
