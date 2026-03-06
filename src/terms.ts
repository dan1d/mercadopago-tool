export const termsHTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Terminos de Servicio — CobroYa</title>
<meta name="description" content="Terminos de servicio de CobroYa, herramienta de cobro con Mercado Pago para Telegram, WhatsApp y agentes AI.">
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
    <h1>Terminos de Servicio</h1>
    <span class="date">Ultima actualizacion: marzo 2026</span>

    <p>Estos terminos de servicio ("Terminos") regulan el uso de CobroYa (<a href="https://cobroya.app">cobroya.app</a>), una herramienta open source desarrollada por <strong>Daniel Alejandro Dominguez Diaz</strong> que permite generar links de pago de Mercado Pago a traves de Telegram, WhatsApp y agentes de inteligencia artificial. Al usar CobroYa, aceptas estos Terminos.</p>

    <h2><span class="section-num">1.</span> Descripcion del servicio</h2>
    <p>CobroYa es una herramienta de codigo abierto (licencia MIT) que actua como intermediario entre el usuario y la API de Mercado Pago. Sus funciones principales incluyen:</p>
    <ul>
      <li>Generacion de links de pago de Mercado Pago</li>
      <li>Consulta de estado de pagos</li>
      <li>Procesamiento de devoluciones</li>
      <li>Notificaciones de pago en tiempo real</li>
    </ul>
    <p>CobroYa <strong>no es un procesador de pagos</strong>. Todos los pagos son procesados directamente por Mercado Pago.</p>

    <h2><span class="section-num">2.</span> Relacion con Mercado Pago</h2>
    <div class="highlight-box">
      <p><strong>CobroYa no esta afiliado, asociado, autorizado, respaldado ni de ninguna manera oficialmente conectado con Mercado Pago o MercadoLibre.</strong> Mercado Pago y sus logos son marcas registradas de sus respectivos propietarios. CobroYa es un proyecto independiente que utiliza la API publica de Mercado Pago.</p>
    </div>

    <h2><span class="section-num">3.</span> Responsabilidades del usuario</h2>
    <p>Al usar CobroYa, te comprometes a:</p>
    <ul>
      <li>Proporcionar credenciales validas de Mercado Pago (access token) obtenidas de forma legitima.</li>
      <li>Cumplir con los <a href="https://www.mercadopago.com.ar/ayuda/terminos-y-condiciones_299" target="_blank" rel="noopener">Terminos y Condiciones de Mercado Pago</a> en todo momento.</li>
      <li>Cumplir con todas las leyes y regulaciones aplicables en tu jurisdiccion, incluyendo obligaciones fiscales y tributarias.</li>
      <li>Mantener la seguridad de tus credenciales y tokens de acceso.</li>
      <li>Usar el servicio unicamente para fines licitos y comerciales legitimos.</li>
    </ul>

    <h2><span class="section-num">4.</span> Uso aceptable</h2>
    <p>Queda estrictamente prohibido usar CobroYa para:</p>
    <ul>
      <li>Fraude, estafas o actividades enganosas</li>
      <li>Lavado de dinero o financiamiento de actividades ilegales</li>
      <li>Venta de productos o servicios ilegales</li>
      <li>Evasion fiscal o cualquier actividad que viole regulaciones financieras</li>
      <li>Spam, abuso o uso excesivo que afecte el servicio para otros usuarios</li>
      <li>Intentos de acceso no autorizado a sistemas o datos de terceros</li>
    </ul>
    <p>Nos reservamos el derecho de suspender o restringir el acceso a cualquier usuario que viole estas condiciones.</p>

    <h2><span class="section-num">5.</span> Sin garantia</h2>
    <p>CobroYa se distribuye bajo la <strong>licencia MIT</strong> y se proporciona <strong>"tal cual" (as-is)</strong>, sin garantias de ningun tipo, expresas o implicitas, incluyendo pero no limitado a garantias de comerciabilidad, idoneidad para un proposito particular o no infraccion.</p>
    <p>No garantizamos que:</p>
    <ul>
      <li>El servicio estara disponible de forma ininterrumpida o libre de errores</li>
      <li>Los resultados obtenidos seran precisos o confiables</li>
      <li>Los defectos seran corregidos en un plazo determinado</li>
    </ul>

    <h2><span class="section-num">6.</span> Limitacion de responsabilidad</h2>
    <p>En la maxima medida permitida por la ley aplicable, <strong>Daniel Alejandro Dominguez Diaz</strong> y los colaboradores de CobroYa no seran responsables por ningun dano directo, indirecto, incidental, especial, consecuente o punitivo, incluyendo pero no limitado a:</p>
    <ul>
      <li>Perdida de ingresos o beneficios</li>
      <li>Perdida de datos</li>
      <li>Interrupcion del negocio</li>
      <li>Errores en el procesamiento de pagos (responsabilidad de Mercado Pago)</li>
      <li>Acceso no autorizado a tus credenciales por negligencia propia</li>
    </ul>
    <p>El uso de CobroYa es bajo tu propio riesgo y responsabilidad.</p>

    <h2><span class="section-num">7.</span> Disponibilidad del servicio</h2>
    <p>CobroYa es un proyecto open source mantenido de forma voluntaria. No asumimos obligacion de mantener, actualizar o dar soporte al servicio. El servicio puede ser modificado, suspendido o descontinuado en cualquier momento sin previo aviso.</p>

    <h2><span class="section-num">8.</span> Propiedad intelectual</h2>
    <p>El codigo fuente de CobroYa esta disponible bajo licencia MIT en <a href="https://github.com/dan1d/mercadopago-tool" target="_blank" rel="noopener">GitHub</a>. El nombre "CobroYa", el logo y la marca son propiedad de <strong>Daniel Alejandro Dominguez Diaz</strong>.</p>

    <h2><span class="section-num">9.</span> Cambios a estos terminos</h2>
    <p>Nos reservamos el derecho de modificar estos Terminos en cualquier momento. La fecha de ultima actualizacion se indica al inicio del documento. El uso continuado del servicio despues de cualquier modificacion constituye la aceptacion de los nuevos Terminos.</p>

    <h2><span class="section-num">10.</span> Ley aplicable</h2>
    <p>Estos Terminos se regiran e interpretaran de acuerdo con las leyes aplicables en la jurisdiccion del usuario. Cualquier disputa que surja en relacion con estos Terminos se resolvera ante los tribunales competentes de dicha jurisdiccion.</p>

    <h2><span class="section-num">11.</span> Contacto</h2>
    <p>Si tenes preguntas sobre estos Terminos de Servicio, podes escribirnos a:</p>
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
