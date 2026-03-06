# CobroYa Social Media Launch Posts

---

## 1. Twitter/X Post (English)

```
Just shipped CobroYa -- an open-source MCP server that lets AI agents create Mercado Pago payment links, search payments, and issue refunds.

If you're building for LATAM, your Claude/Cursor/Windsurf can now handle payments natively.

npx cobroya

5 tools: create payments, search, refund, merchant info.

github.com/dan1d/mercadopago-tool
npmjs.com/package/cobroya

#MCP #AI #Payments #OpenSource #LATAM
```

---

## 2. Twitter/X Post (Spanish)

```
Lanzamos CobroYa -- un servidor MCP open source para cobrar con Mercado Pago desde Claude, Cursor o cualquier agente AI.

Le decis "creame un link de pago de $5000 por un curso de Python" y lo hace.

npx cobroya

Crear links de pago, buscar pagos, hacer reembolsos. Todo desde tu AI.

github.com/dan1d/mercadopago-tool
npmjs.com/package/cobroya

Hecho en Argentina. MIT. Gratis.

#MCP #AI #Payments #OpenSource #LATAM
```

---

## 3. Reddit r/ClaudeAI Post

**Title:** I built an MCP server that lets Claude create Mercado Pago payment links, search payments, and issue refunds

**Body:**

```
Hey everyone,

I built CobroYa, an open-source MCP server for Mercado Pago -- the dominant payment platform in Latin America (Argentina, Brazil, Mexico, Colombia, Chile, etc.).

**What's MCP?**
Model Context Protocol is the open standard that lets AI tools like Claude Desktop, Cursor, and Windsurf call external APIs through "tools." Instead of copy-pasting between your browser and Claude, the AI can directly interact with services.

**What CobroYa does:**
It exposes 5 tools to any MCP-compatible AI client:

- `create_payment_preference` -- Generate a Mercado Pago checkout link (shareable URL)
- `search_payments` -- Search payments by status, date, with pagination
- `get_payment` -- Get full payment details by ID
- `create_refund` -- Full or partial refunds
- `get_merchant_info` -- Your merchant profile

**Setup (Claude Desktop):**

Add this to your `claude_desktop_config.json`:

    {
      "mcpServers": {
        "cobroya": {
          "command": "npx",
          "args": ["-y", "cobroya"],
          "env": {
            "MERCADO_PAGO_ACCESS_TOKEN": "APP_USR-..."
          }
        }
      }
    }

That's it. No cloning, no building. npx pulls the package and runs the server.

**Why this matters:**
If you're a freelancer, small business, or developer in LATAM, you can now tell Claude things like:
- "Create a payment link for $5000 ARS for a design consultation"
- "Show me all approved payments from this week"
- "Refund payment 12345678"

It also works as a Telegram bot and has WhatsApp support.

**Links:**
- GitHub: https://github.com/dan1d/mercadopago-tool
- npm: https://www.npmjs.com/package/cobroya
- Website: https://cobroya.app

MIT licensed, fully open source. Would love feedback from anyone working with MCP servers or building for LATAM markets.
```

---

## 4. Reddit r/argentina or r/programacion Post (Spanish)

**Title:** Hice un tool open source para cobrar con Mercado Pago desde Claude y otros agentes AI

**Body:**

```
Buenas! Queria compartir un proyecto que estuve armando: CobroYa.

Es un servidor MCP (Model Context Protocol) que conecta Mercado Pago con agentes de AI como Claude Desktop, Cursor, Windsurf, etc. Basicamente le hablas a tu AI y el puede crear links de pago, buscar cobros, hacer reembolsos -- todo directo contra la API de Mercado Pago.

**Como se usa:**

Agregas esto a la config de Claude Desktop y listo:

    {
      "mcpServers": {
        "cobroya": {
          "command": "npx",
          "args": ["-y", "cobroya"],
          "env": {
            "MERCADO_PAGO_ACCESS_TOKEN": "APP_USR-..."
          }
        }
      }
    }

Despues le podes decir cosas como:
- "Creame un link de pago de $5000 por un curso de Python"
- "Mostrame los pagos aprobados de hoy"
- "Hacele un reembolso al pago 12345678"

**Que incluye:**
- 5 herramientas: crear pagos, buscar pagos, detalle de pago, reembolsos, info del merchant
- Bot de Telegram incluido (npx cobroya-telegram)
- Soporte WhatsApp Business
- Se puede usar como libreria en tu propio proyecto

**Stack:** TypeScript, Node.js 18+, sin frameworks (fetch nativo), vitest para tests.

Es open source, licencia MIT, y lo pueden usar gratis.

- GitHub: https://github.com/dan1d/mercadopago-tool
- npm: https://www.npmjs.com/package/cobroya
- Web: https://cobroya.app

Si estan laburando con AI agents o necesitan integrar Mercado Pago en algun proyecto, puede servirles. Acepto PRs y feedback.
```

---

## 5. Discord (Anthropic MCP #showcase / #servers)

```
CobroYa -- Mercado Pago MCP Server

Open-source MCP server for Mercado Pago, the leading payment platform in Latin America.

Tools:
- create_payment_preference (checkout links)
- search_payments (filter by status, paginated)
- get_payment (full payment details)
- create_refund (full or partial)
- get_merchant_info (merchant profile)

Install:
npx cobroya

Config:
{
  "mcpServers": {
    "cobroya": {
      "command": "npx",
      "args": ["-y", "cobroya"],
      "env": { "MERCADO_PAGO_ACCESS_TOKEN": "APP_USR-..." }
    }
  }
}

Also includes a Telegram bot and WhatsApp support.

GitHub: https://github.com/dan1d/mercadopago-tool
npm: https://www.npmjs.com/package/cobroya

MIT | by dan1d (https://dan1d.dev)
```

---

## 6. Dev.to / Hashnode Article Outline

**Title:** Building an MCP Server for Mercado Pago: How I Let AI Agents Handle Payments in Latin America

**Sections:**

### Introduction
- The problem: LATAM developers and merchants need payment integrations, Mercado Pago is the dominant platform, and AI agents are becoming the new interface
- What CobroYa is: an open-source bridge between MCP-compatible AI tools and the Mercado Pago API

### What is MCP (Model Context Protocol)?
- Brief explanation of the protocol (link to Anthropic's spec)
- How it differs from function calling -- standardized, transport-agnostic, tool discovery
- The ecosystem: Claude Desktop, Cursor, Windsurf, Claude Code

### The 5 Tools CobroYa Exposes
- Walk through each tool with example prompts and what the AI returns
- Code snippet: the tool definitions from `src/mcp-server.ts`
- Screenshot: Claude Desktop creating a payment link via natural language

### Setup in 60 Seconds
- Claude Desktop config JSON (copy-pasteable)
- Claude Code one-liner: `claude mcp add cobroya -- npx -y cobroya`
- Cursor config
- Screenshot: the config file location on macOS/Windows/Linux

### Architecture Decisions
- Why no web framework (native fetch + Web Standard Request/Response)
- The `(client, params)` action pattern -- dependency injection without a framework
- TypeScript strict mode, Zod schemas for validation
- How the MCP server, Telegram bot, and WhatsApp handler share the same core

### Beyond AI: Telegram and WhatsApp
- The Telegram bot: `npx cobroya-telegram`
- WhatsApp Business Cloud API integration
- Use case: a small business owner who doesn't code but uses Telegram

### Testing Strategy
- 124 tests, no real API calls
- Global fetch mocking pattern with vitest
- Code snippet: example test showing the mock setup

### What's Next
- More Mercado Pago API coverage (subscriptions, QR codes)
- Automation platform packages (n8n, Zapier, Make, Pipedream)
- Community contributions welcome

### Try It
- Links: GitHub, npm, website
- The one command: `npx cobroya`
- Call to action: star the repo, open issues, submit PRs

**Key code snippets to include:**
1. Claude Desktop config JSON
2. `createMercadoPagoTools()` programmatic usage example
3. Example tool call and response (create_payment_preference)
4. Error handling with `MercadoPagoError`

**Screenshots to capture:**
1. Claude Desktop with CobroYa tools visible in the MCP tools list
2. A conversation where Claude creates a payment link
3. The Mercado Pago checkout page that the generated link opens
4. Terminal output of `npx cobroya` starting the MCP server
