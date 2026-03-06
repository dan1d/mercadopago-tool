export const privacyHTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Politica de Privacidad — CobroYa</title>
<meta name="description" content="Politica de privacidad de CobroYa, herramienta de cobro con Mercado Pago para Telegram, WhatsApp y agentes AI.">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>&#x26A1;</text></svg>">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#09090b;--card:#18181b;--border:#27272a;--text:#fafafa;--muted:#a1a1aa;--accent:#3b82f6;--accent2:#8b5cf6;--green:#22c55e}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--text);line-height:1.8;overflow-x:hidden}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}

.container{max-width:800px;margin:0 auto;padding:0 24px}

nav{padding:20px 0;border-bottom:1px solid var(--border)}
nav .container{display:flex;justify-content:space-between;align-items:center}
.logo{font-size:1.5rem;font-weight:800;background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.nav-back{color:var(--muted);font-size:.9rem;transition:color .2s}
.nav-back:hover{color:var(--text);text-decoration:none}

.content{padding:60px 0 80px}
.content h1{font-size:2rem;font-weight:800;margin-bottom:8px;background:linear-gradient(to bottom,var(--text),var(--muted));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.content .date{color:var(--muted);font-size:.9rem;margin-bottom:40px;display:block}

.content h2{font-size:1.25rem;font-weight:700;margin-top:36px;margin-bottom:12px;color:var(--text)}
.content p,.content li{color:var(--muted);font-size:.95rem;margin-bottom:12px}
.content ul{padding-left:24px;margin-bottom:16px}
.content li{margin-bottom:6px}
.content strong{color:var(--text);font-weight:600}

.section-num{color:var(--accent);font-weight:700;margin-right:6px}

.highlight-box{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px 24px;margin:20px 0}
.highlight-box p{margin-bottom:0}

footer{padding:32px 0;border-top:1px solid var(--border);text-align:center;color:var(--muted);font-size:.85rem}
footer a{color:var(--muted)}
footer a:hover{color:var(--accent)}

@media(max-width:640px){
  .content{padding:40px 0 60px}
  .content h1{font-size:1.5rem}
}
</style>
</head>
<body>

<nav>
  <div class="container">
    <a href="/" class="logo">CobroYa</a>
    <a href="/" class="nav-back">&larr; Volver al inicio</a>
  </div>
</nav>

<section class="content">
  <div class="container">
    <h1>Politica de Privacidad</h1>
    <span class="date">Ultima actualizacion: marzo 2026</span>

    <p>En CobroYa (<a href="https://cobroya.app">cobroya.app</a>) nos tomamos la privacidad en serio. Esta politica explica de forma clara y honesta que datos manejamos, como los usamos y que derechos tenes como usuario. CobroYa es un proyecto open source desarrollado por <strong>Daniel Alejandro Dominguez Diaz</strong>.</p>

    <h2><span class="section-num">1.</span> Datos que recopilamos</h2>
    <p>CobroYa recopila y procesa la minima cantidad de datos necesaria para funcionar:</p>
    <ul>
      <li><strong>Token de acceso de Mercado Pago:</strong> Proporcionado por vos para conectar tu cuenta. Se almacena unicamente en las variables de entorno de tu propia instancia o configuracion.</li>
      <li><strong>Metadatos de pagos:</strong> Cuando creas un link de pago, los datos (monto, descripcion) pasan a traves de CobroYa hacia la API de Mercado Pago. No almacenamos estos datos de forma persistente.</li>
      <li><strong>Identificadores de chat:</strong> Chat IDs de Telegram y/o numeros de telefono de WhatsApp se usan para control de acceso (determinar quien puede usar el bot).</li>
      <li><strong>Datos de notificaciones (webhooks):</strong> Recibimos notificaciones de pago de Mercado Pago para reenviartelas. Estos datos se procesan en memoria y no se almacenan.</li>
    </ul>

    <h2><span class="section-num">2.</span> Datos que NO recopilamos</h2>
    <div class="highlight-box">
      <p><strong>CobroYa NO almacena datos de tarjetas de credito, debito ni informacion financiera de los pagadores.</strong> Todo el procesamiento de pagos lo realiza directamente Mercado Pago. Nunca tenemos acceso a los datos de pago de tus clientes.</p>
    </div>

    <h2><span class="section-num">3.</span> Cookies, rastreo y analitica</h2>
    <p>CobroYa <strong>no utiliza cookies, no implementa rastreo (tracking) y no usa servicios de analitica</strong> de ningun tipo. No usamos Google Analytics, Facebook Pixel, ni ninguna herramienta similar. Este sitio web no coloca ninguna cookie en tu navegador.</p>

    <h2><span class="section-num">4.</span> Almacenamiento y retencion de datos</h2>
    <p>CobroYa no opera una base de datos centralizada con informacion de usuarios:</p>
    <ul>
      <li>Los tokens de acceso de Mercado Pago se almacenan <strong>unicamente en las variables de entorno</strong> configuradas por el usuario (en su servidor, su archivo <code>.env</code> o su plataforma de hosting).</li>
      <li>Los chat IDs autorizados se configuran de la misma manera, como variables de entorno.</li>
      <li>Los datos de pago transitan en memoria durante el procesamiento y no se persisten.</li>
    </ul>
    <p>Si dejas de usar CobroYa, basta con eliminar la configuracion de tu entorno. No hay datos nuestros que borrar porque no almacenamos nada de tu parte.</p>

    <h2><span class="section-num">5.</span> Servicios de terceros</h2>
    <p>CobroYa interactua con los siguientes servicios de terceros, cada uno con sus propias politicas de privacidad:</p>
    <ul>
      <li><strong>Mercado Pago</strong> (<a href="https://www.mercadopago.com.ar/privacidad" target="_blank" rel="noopener">politica de privacidad</a>): Procesa todos los pagos. Los datos de transacciones y pagadores estan sujetos a sus terminos.</li>
      <li><strong>Telegram</strong> (<a href="https://telegram.org/privacy" target="_blank" rel="noopener">politica de privacidad</a>): Si usas el bot de Telegram, tu interaccion esta sujeta a los terminos de Telegram.</li>
      <li><strong>WhatsApp / Meta</strong> (<a href="https://www.whatsapp.com/legal/privacy-policy" target="_blank" rel="noopener">politica de privacidad</a>): Si usas CobroYa por WhatsApp, la comunicacion esta sujeta a los terminos de Meta/WhatsApp.</li>
    </ul>

    <h2><span class="section-num">6.</span> Seguridad</h2>
    <p>Implementamos medidas de seguridad razonables incluyendo:</p>
    <ul>
      <li>Validacion HMAC-SHA256 en webhooks de Mercado Pago</li>
      <li>Control de acceso por chat ID / numero de telefono</li>
      <li>Validacion de firmas en webhooks de WhatsApp</li>
    </ul>
    <p>Al ser un proyecto open source, el codigo fuente esta disponible para auditoria en <a href="https://github.com/dan1d/mercadopago-tool" target="_blank" rel="noopener">GitHub</a>.</p>

    <h2><span class="section-num">7.</span> Derechos del usuario</h2>
    <p>Como CobroYa no almacena datos personales en servidores propios, no hay un perfil de usuario que eliminar. Si tenes alguna consulta sobre tus datos o queres ejercer algun derecho de privacidad, contactanos.</p>

    <h2><span class="section-num">8.</span> Cambios a esta politica</h2>
    <p>Podemos actualizar esta politica ocasionalmente. La fecha de ultima actualizacion se indica al inicio del documento. Los cambios significativos se comunicaran a traves de los canales habituales del proyecto.</p>

    <h2><span class="section-num">9.</span> Contacto</h2>
    <p>Si tenes preguntas sobre esta politica de privacidad, podes escribirnos a:</p>
    <p><strong><a href="mailto:hola@cobroya.app">hola@cobroya.app</a></strong></p>
  </div>
</section>

<footer>
  <div class="container">
    CobroYa &mdash; <a href="/privacy">Privacidad</a> &middot; <a href="/terms">Terminos</a> &middot; <a href="mailto:hola@cobroya.app">hola@cobroya.app</a>
  </div>
</footer>

</body>
</html>`;
