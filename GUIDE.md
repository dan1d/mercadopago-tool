# mercadopago-tool — Guia Completa

Plataforma open-source para cobrar con Mercado Pago desde bots, agentes AI y plataformas de automatizacion.

---

## Tabla de Contenidos

1. [Que es esto](#que-es-esto)
2. [Requisitos previos](#requisitos-previos)
3. [Instalacion](#instalacion)
4. [Configurar Mercado Pago](#configurar-mercado-pago)
5. [Configurar Telegram Bot](#configurar-telegram-bot)
6. [Configurar WhatsApp Business](#configurar-whatsapp-business)
7. [Configurar Webhooks de pago](#configurar-webhooks-de-pago)
8. [Ejecutar el servidor](#ejecutar-el-servidor)
9. [Deploy a produccion](#deploy-a-produccion)
10. [Usar el MCP Server (agentes AI)](#usar-el-mcp-server)
11. [Integraciones: n8n, Zapier, Make, Pipedream](#integraciones)
12. [Uso como libreria (SDK)](#uso-como-libreria)
13. [Tests](#tests)
14. [Troubleshooting](#troubleshooting)
15. [Estructura del proyecto](#estructura-del-proyecto)

---

## Que es esto

Un servidor que corre Telegram bot + WhatsApp bot + webhooks de Mercado Pago en un solo proceso. Permite a merchants:

- Generar links de pago con un mensaje (`cobrar 5000 curso python`)
- Ver pagos recientes
- Recibir notificaciones cuando alguien paga
- Hacer devoluciones
- Conectar con n8n, Zapier, Make, Pipedream
- Exponer herramientas de pago a agentes AI (Claude, GPT)

---

## Requisitos previos

- **Node.js 18+** (o Docker)
- **Cuenta de Mercado Pago** con credenciales de produccion
- **Telegram Bot** (opcional, se crea en 2 minutos)
- **WhatsApp Business API** (opcional, requiere cuenta Meta for Developers)

---

## Instalacion

```bash
git clone https://github.com/YOUR_USER/mercadopago-tool.git
cd mercadopago-tool
npm install
npm run build
```

---

## Configurar Mercado Pago

### Paso 1: Obtener Access Token

1. Ir a https://www.mercadopago.com/developers/panel/app
2. Crear una aplicacion (o usar una existente)
3. Ir a **Credenciales de produccion**
4. Copiar el **Access Token** (empieza con `APP_USR-`)

### Paso 2: Crear archivo .env

```bash
cp .env.example .env
```

Editar `.env`:

```
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-tu-token-real-aqui
```

### Paso 3: Verificar que funciona

```bash
npm run dev:server
```

Abrir http://localhost:3000/health — deberia responder:

```json
{"ok":true,"telegram":false,"whatsapp":false,"mp_webhook":true}
```

---

## Configurar Telegram Bot

### Paso 1: Crear el bot con BotFather

1. Abrir Telegram y buscar **@BotFather**
2. Enviar `/newbot`
3. Elegir un nombre (ej: "Mi Bot de Cobros")
4. Elegir un username (ej: `mi_cobros_bot`)
5. BotFather te dara un token como: `7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Paso 2: Agregar al .env

```
TELEGRAM_BOT_TOKEN=7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Paso 3: Iniciar y probar

```bash
npm run dev:server
```

Deberia mostrar:

```
Telegram: ON
Bot de Telegram iniciado correctamente.
```

Ahora en Telegram, buscar tu bot y enviar:

```
/start
/cobrar 100 Producto de prueba
/pagos
/help
```

### Comandos disponibles

| Comando | Ejemplo | Que hace |
|---------|---------|----------|
| `/start` | `/start` | Mensaje de bienvenida |
| `/cobrar <monto> <desc>` | `/cobrar 5000 Curso Python` | Genera link de pago |
| `/pagos` | `/pagos` | Lista ultimos 5 pagos |
| `/estado <id>` | `/estado 12345678` | Detalle de un pago |
| `/devolver <id> [monto]` | `/devolver 12345678` | Devolucion total |
| `/devolver <id> <monto>` | `/devolver 12345678 2000` | Devolucion parcial |
| `/help` | `/help` | Lista de comandos |

---

## Configurar WhatsApp Business

### Paso 1: Crear app en Meta for Developers

1. Ir a https://developers.facebook.com/
2. Crear una app (tipo: Business)
3. Agregar el producto **WhatsApp**
4. En WhatsApp > API Setup, obtener:
   - **Temporary Access Token** (o generar uno permanente)
   - **Phone Number ID** (aparece debajo del numero de prueba)
5. Definir un **Verify Token** (cualquier string secreto que vos elijas)

### Paso 2: Agregar al .env

```
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=1234567890
WHATSAPP_VERIFY_TOKEN=mi_token_secreto_123
```

### Paso 3: Configurar webhook en Meta

1. Deployar el servidor (ver seccion Deploy)
2. En Meta Dashboard > WhatsApp > Configuration > Webhook
3. URL: `https://tu-dominio.com/whatsapp`
4. Verify Token: el mismo que pusiste en `WHATSAPP_VERIFY_TOKEN`
5. Suscribirse a: `messages`

### Paso 4: Probar

Enviar un mensaje de WhatsApp al numero de prueba:

```
cobrar 1000 servicio web
pagos
estado 12345678
devolver 12345678
ayuda
```

### Notificaciones de pago

Para recibir notificaciones de pagos aprobados por WhatsApp, agregar al .env:

```
WA_NOTIFY_PHONE=5491155551234
```

(tu numero con codigo de pais, sin +)

---

## Configurar Webhooks de pago

Mercado Pago envia notificaciones IPN cuando un pago cambia de estado.

### Paso 1: Configurar URL en Mercado Pago

1. Ir a https://www.mercadopago.com/developers/panel/app
2. Seleccionar tu aplicacion
3. Ir a **Webhooks** (IPN)
4. URL: `https://tu-dominio.com/mp-webhook`
5. Eventos: seleccionar **payment**

### Paso 2 (opcional): Agregar secreto de firma

Para validar que las notificaciones realmente vienen de MP:

```
MERCADO_PAGO_WEBHOOK_SECRET=tu-webhook-secret
```

El secret se encuentra en la configuracion de webhooks de tu app en MP.

### Que pasa cuando alguien paga

```
Comprador paga → MP envia POST /mp-webhook → servidor valida firma
    → fetch payment completo → log en consola
    → si WA_NOTIFY_PHONE esta configurado → envia WhatsApp:
      "Pago recibido - $5000 - ID: 12345678"
```

---

## Ejecutar el servidor

### Desarrollo local

```bash
npm run dev:server
```

### Produccion (despues de build)

```bash
npm run build
npm start
```

### Con Docker

```bash
docker compose up -d
```

### Endpoints del servidor

| Ruta | Metodo | Funcion |
|------|--------|---------|
| `/health` | GET | Health check (JSON) |
| `/mp-webhook` | POST | Recibe IPN de Mercado Pago |
| `/whatsapp` | GET | Verificacion de webhook Meta |
| `/whatsapp` | POST | Recibe mensajes WhatsApp |

---

## Deploy a produccion

### Opcion 1: Railway (recomendado, gratis para empezar)

1. Subir a GitHub:

```bash
git init
git add -A
git commit -m "initial commit"
gh repo create mercadopago-tool --public --push
```

2. Ir a https://railway.com
3. **New Project** > **Deploy from GitHub repo**
4. Seleccionar el repo
5. En **Variables**, agregar:

```
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
TELEGRAM_BOT_TOKEN=712345...
PORT=3000
MP_CURRENCY=ARS
```

6. Railway asigna una URL automatica (ej: `mercadopago-tool-production.up.railway.app`)
7. Usar esa URL para configurar los webhooks de MP y Meta

### Opcion 2: VPS con Docker (DigitalOcean, Hetzner, etc.)

```bash
# En el servidor
git clone https://github.com/YOUR_USER/mercadopago-tool.git
cd mercadopago-tool
cp .env.example .env
nano .env  # completar con tokens reales
docker compose up -d
```

Para exponer con HTTPS, usar Caddy como reverse proxy:

```
# /etc/caddy/Caddyfile
tu-dominio.com {
    reverse_proxy localhost:3000
}
```

### Opcion 3: Fly.io

```bash
fly launch
fly secrets set MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
fly secrets set TELEGRAM_BOT_TOKEN=712345...
fly deploy
```

---

## Usar el MCP Server

El MCP server permite que agentes AI (Claude, GPT) usen las herramientas de pago.

### Configurar en Claude Desktop

Editar `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mercadopago": {
      "command": "node",
      "args": ["/ruta/a/mercadopago-tool/dist/mcp-server.js"],
      "env": {
        "MERCADO_PAGO_ACCESS_TOKEN": "APP_USR-..."
      }
    }
  }
}
```

Reiniciar Claude Desktop. Ahora podes pedirle:

- "Crea un link de pago por $5000 para un curso de Python"
- "Muestrame los ultimos pagos"
- "Haceme un reembolso del pago 12345678"

### Herramientas disponibles

| Tool | Descripcion |
|------|-------------|
| `create_payment_preference` | Crea link de pago |
| `get_payment` | Consulta pago por ID |
| `create_refund` | Reembolso total o parcial |
| `search_payments` | Busca pagos con filtros |
| `get_merchant_info` | Info del merchant |

---

## Integraciones

### n8n

```bash
cd packages/n8n-nodes-mercadopago
npm install
npm run build
# Copiar a ~/.n8n/custom/ o publicar en npm
```

Operaciones: Create Preference, Get Payment, Search Payments, Create Refund, Get Merchant Info.

### Zapier

```bash
cd packages/zapier-mercadopago
npm install
# zapier login
# zapier push
```

Incluye: Creates (preference, refund), Searches (find, search), Triggers (payment updated).

### Pipedream

Copiar los archivos de `packages/pipedream-mercadopago/` a tu workspace de Pipedream.

Componentes: 4 actions + 1 polling source.

### Make.com

```bash
cd packages/make-mercadopago
npm install
npm run build
```

Modulos TypeScript + webhook handler + templates JSON para escenarios.

---

## Uso como libreria

```typescript
import { createMercadoPagoTools } from "mercadopago-tool";

const mp = createMercadoPagoTools("APP_USR-...");

// Crear link de pago
const pref = await mp.tools.create_payment_preference({
  title: "Curso Python",
  quantity: 1,
  currency: "ARS",
  unit_price: 5000,
});
console.log(pref.init_point); // URL de checkout

// Buscar pagos aprobados
const pagos = await mp.tools.search_payments({ status: "approved", limit: 10 });

// Consultar un pago
const pago = await mp.tools.get_payment({ payment_id: "12345678" });

// Reembolsar
const refund = await mp.tools.create_refund({ payment_id: "12345678" });

// Reembolso parcial
const partial = await mp.tools.create_refund({ payment_id: "12345678", amount: 2000 });

// Info del merchant
const me = await mp.tools.get_merchant_info();
```

### Error handling

```typescript
import { MercadoPagoError } from "mercadopago-tool";

try {
  await mp.tools.get_payment({ payment_id: "invalid" });
} catch (err) {
  if (err instanceof MercadoPagoError) {
    err.status;        // 404
    err.isNotFound;     // true
    err.isUnauthorized; // false
    err.isRateLimited;  // false
  }
}
```

---

## Tests

```bash
# Core (146 tests)
npm test

# Make package (43 tests)
cd packages/make-mercadopago && npm test

# Zapier package (14 tests)
cd packages/zapier-mercadopago && npm test

# n8n (type-check)
cd packages/n8n-nodes-mercadopago && npx tsc --noEmit

# Todo junto
npm test && cd packages/make-mercadopago && npm test && cd ../zapier-mercadopago && npm test
```

---

## Troubleshooting

### "MERCADO_PAGO_ACCESS_TOKEN is required"

El token no esta configurado. Verificar:

```bash
echo $MERCADO_PAGO_ACCESS_TOKEN
# o verificar que .env tiene el token
```

### "TELEGRAM_BOT_TOKEN es requerido"

Solo aparece si el token esta definido pero vacio. Si no queres Telegram, borralo del .env.

### Telegram bot no responde

1. Verificar que el token es correcto
2. Solo puede haber UNA instancia del bot corriendo (si tenes otra, matar la anterior)
3. Verificar logs: debe decir "Bot de Telegram iniciado correctamente"

### WhatsApp webhook devuelve 403

El `WHATSAPP_VERIFY_TOKEN` en tu .env no coincide con el que pusiste en Meta Dashboard.

### Mercado Pago webhook devuelve 401

El `MERCADO_PAGO_WEBHOOK_SECRET` no coincide. Verificar en el panel de MP.

### Mercado Pago webhook devuelve 400 "invalid payment ID format"

Proteccion contra path traversal. Solo se aceptan IDs numericos. Esto es normal si alguien envia un payload malicioso.

### El servidor arranca pero health muestra todo OFF

Los canales se activan segun las env vars presentes. Verificar que las variables estan definidas (no vacias).

### Docker: build falla

```bash
docker build --no-cache -t mercadopago-tool .
```

### Pagos en modo sandbox

Mercado Pago tiene un modo sandbox. Tu preference devuelve `sandbox_init_point` ademas de `init_point`. Usar el sandbox para testing.

---

## Estructura del proyecto

```
mercadopago-tool/
├── src/
│   ├── client.ts              # MercadoPagoClient (HTTP + auth)
│   ├── actions.ts             # 5 acciones de la API
│   ├── schemas.ts             # Interfaces + JSON schemas
│   ├── errors.ts              # MercadoPagoError tipado
│   ├── index.ts               # Exports publicos
│   ├── webhook.ts             # MP IPN handler (HMAC-SHA256)
│   ├── server.ts              # Servidor unificado de produccion
│   ├── mcp-server.ts          # MCP para agentes AI
│   ├── telegram-bot.ts        # Bot de Telegram
│   ├── shared/
│   │   └── formatting.ts      # Helpers compartidos
│   └── whatsapp/
│       ├── client.ts          # WhatsApp Cloud API
│       ├── message-parser.ts  # Parser de comandos
│       ├── handlers.ts        # Handlers + notificador
│       └── webhook.ts         # Webhook Meta
├── packages/
│   ├── n8n-nodes-mercadopago/ # n8n community node
│   ├── zapier-mercadopago/    # Zapier integration
│   ├── pipedream-mercadopago/ # Pipedream components
│   └── make-mercadopago/      # Make.com starter
├── tests/                     # 146 tests (vitest)
├── bin/                       # CLI entry points
├── scripts/                   # Integration test + dev servers
├── Dockerfile
├── docker-compose.yml
├── railway.json
└── .env.example
```

---

## Variables de entorno completas

| Variable | Requerida | Descripcion |
|----------|-----------|-------------|
| `MERCADO_PAGO_ACCESS_TOKEN` | Si | Token de produccion de MP |
| `TELEGRAM_BOT_TOKEN` | No | Token de BotFather |
| `WHATSAPP_ACCESS_TOKEN` | No | Token de Meta Graph API |
| `WHATSAPP_PHONE_NUMBER_ID` | No | ID del numero de WhatsApp |
| `WHATSAPP_VERIFY_TOKEN` | No | Token de verificacion del webhook |
| `WA_NOTIFY_PHONE` | No | Numero para notificaciones de pago |
| `MERCADO_PAGO_WEBHOOK_SECRET` | No | Secret para validar firma IPN |
| `MP_CURRENCY` | No | Moneda (default: ARS) |
| `MP_SUCCESS_URL` | No | URL de redireccion post-pago |
| `PORT` | No | Puerto del servidor (default: 3000) |

---

## Licencia

MIT
