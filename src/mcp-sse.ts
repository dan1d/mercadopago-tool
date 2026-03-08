import type { IncomingMessage, ServerResponse } from "node:http";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Active sessions keyed by sessionId
const sessions = new Map<string, SSEServerTransport>();

export function handleMcpOptions(_req: IncomingMessage, res: ServerResponse): void {
  res.writeHead(204, CORS_HEADERS);
  res.end();
}

export async function handleMcpSse(
  req: IncomingMessage,
  res: ServerResponse,
  mcpServer: McpServer
): Promise<void> {
  // Set CORS headers
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    res.setHeader(key, value);
  }

  const transport = new SSEServerTransport("/mcp/message", res);
  sessions.set(transport.sessionId, transport);

  // Clean up on disconnect
  res.on("close", () => {
    sessions.delete(transport.sessionId);
  });

  await mcpServer.connect(transport);
}

export async function handleMcpMessage(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  // Set CORS headers
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    res.setHeader(key, value);
  }

  const url = new URL(req.url ?? "/", `http://localhost`);
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId || !sessions.has(sessionId)) {
    res.writeHead(400, { "Content-Type": "application/json", ...CORS_HEADERS });
    res.end(JSON.stringify({ error: "Invalid or missing sessionId" }));
    return;
  }

  const transport = sessions.get(sessionId)!;
  await transport.handlePostMessage(req, res);
}

export function getActiveSessionCount(): number {
  return sessions.size;
}
