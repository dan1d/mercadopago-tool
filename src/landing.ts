export const landingHTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CobroYa — Cobra por Telegram y WhatsApp con Mercado Pago</title>
<meta name="description" content="Genera links de pago de Mercado Pago desde Telegram y WhatsApp. Sin codigo, sin web, sin complicaciones. Cobra en 10 segundos.">
<meta property="og:title" content="CobroYa — Cobra con Mercado Pago en 10 segundos">
<meta property="og:description" content="Genera links de pago desde Telegram y WhatsApp. Sin web, sin codigo, sin complicaciones.">
<meta property="og:image" content="https://cobroya.app/og.svg">
<meta property="og:url" content="https://cobroya.app">
<meta property="og:type" content="website">
<meta property="og:site_name" content="CobroYa">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="CobroYa — Cobra con Mercado Pago en 10 segundos">
<meta name="twitter:description" content="Genera links de pago desde Telegram y WhatsApp. Sin web, sin codigo.">
<meta name="twitter:image" content="https://cobroya.app/og.svg">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>&#x26A1;</text></svg>">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#09090b;--card:#18181b;--border:#27272a;--text:#fafafa;--muted:#a1a1aa;--accent:#3b82f6;--accent2:#8b5cf6;--green:#22c55e}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--text);line-height:1.6;overflow-x:hidden}
a{color:var(--accent);text-decoration:none}

.container{max-width:1080px;margin:0 auto;padding:0 24px}

/* Nav */
nav{padding:20px 0;border-bottom:1px solid var(--border)}
nav .container{display:flex;justify-content:space-between;align-items:center}
.logo{font-size:1.5rem;font-weight:800;background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.nav-cta{background:var(--accent);color:#fff;padding:10px 24px;border-radius:8px;font-weight:600;font-size:.9rem;transition:opacity .2s}
.nav-cta:hover{opacity:.85}

/* Hero */
.hero{padding:100px 0 80px;text-align:center}
.badge{display:inline-block;padding:6px 16px;border:1px solid var(--border);border-radius:99px;font-size:.8rem;color:var(--muted);margin-bottom:24px}
.badge span{color:var(--green)}
h1{font-size:clamp(2.5rem,6vw,4rem);font-weight:800;line-height:1.1;margin-bottom:24px;background:linear-gradient(to bottom,var(--text),var(--muted));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.subtitle{font-size:1.25rem;color:var(--muted);max-width:600px;margin:0 auto 40px}
.hero-ctas{display:flex;gap:16px;justify-content:center;flex-wrap:wrap}
.btn-primary{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;padding:14px 32px;border-radius:10px;font-weight:700;font-size:1rem;transition:transform .2s,box-shadow .2s}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(59,130,246,.3)}
.btn-secondary{background:var(--card);color:var(--text);padding:14px 32px;border-radius:10px;font-weight:600;font-size:1rem;border:1px solid var(--border);transition:border-color .2s}
.btn-secondary:hover{border-color:var(--muted)}

/* Demo */
.demo{padding:60px 0;text-align:center}
.demo-box{background:var(--card);border:1px solid var(--border);border-radius:16px;max-width:480px;margin:0 auto;padding:32px;text-align:left;font-family:'SF Mono',Monaco,'Cascadia Code',monospace;font-size:.95rem}
.demo-line{padding:6px 0;display:flex;gap:8px}
.demo-user{color:var(--accent)}
.demo-bot{color:var(--green)}
.demo-link{color:var(--accent2);text-decoration:underline}
.demo-label{color:var(--muted);font-size:.75rem;margin-bottom:12px;font-family:-apple-system,sans-serif}

/* Features */
.features{padding:80px 0}
.features h2{text-align:center;font-size:2rem;margin-bottom:12px}
.features .sub{text-align:center;color:var(--muted);margin-bottom:48px;font-size:1.1rem}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px}
.card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:28px}
.card-icon{font-size:2rem;margin-bottom:12px}
.card h3{font-size:1.1rem;margin-bottom:8px}
.card p{color:var(--muted);font-size:.95rem}

/* How */
.how{padding:80px 0}
.how h2{text-align:center;font-size:2rem;margin-bottom:48px}
.steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:24px;counter-reset:step}
.step{text-align:center;padding:24px}
.step::before{counter-increment:step;content:counter(step);display:inline-flex;width:48px;height:48px;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border-radius:50%;font-weight:800;font-size:1.2rem;margin-bottom:16px}
.step h3{margin-bottom:8px}
.step p{color:var(--muted);font-size:.9rem}

/* Pricing */
.pricing{padding:80px 0}
.pricing h2{text-align:center;font-size:2rem;margin-bottom:12px}
.pricing .sub{text-align:center;color:var(--muted);margin-bottom:48px;font-size:1.1rem}
.price-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;max-width:700px;margin:0 auto}
.price-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:32px;text-align:center}
.price-card.featured{border-color:var(--accent);position:relative}
.price-card.featured::before{content:"Popular";position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;padding:4px 16px;border-radius:99px;font-size:.75rem;font-weight:700}
.price{font-size:2.5rem;font-weight:800;margin:16px 0 4px}
.price span{font-size:1rem;color:var(--muted);font-weight:400}
.price-desc{color:var(--muted);font-size:.9rem;margin-bottom:24px}
.price-features{list-style:none;text-align:left;margin-bottom:24px}
.price-features li{padding:8px 0;font-size:.9rem;color:var(--muted);display:flex;align-items:center;gap:8px}
.price-features li::before{content:"\\2713";color:var(--green);font-weight:700}
.price-btn{display:block;width:100%;padding:12px;border-radius:10px;font-weight:600;font-size:.95rem;text-align:center;transition:opacity .2s}
.price-btn.primary{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff}
.price-btn.secondary{background:var(--bg);color:var(--text);border:1px solid var(--border)}

/* CTA */
.final-cta{padding:80px 0;text-align:center}
.final-cta h2{font-size:2.2rem;margin-bottom:16px}
.final-cta p{color:var(--muted);font-size:1.1rem;margin-bottom:32px}

/* Footer */
footer{padding:32px 0;border-top:1px solid var(--border);text-align:center;color:var(--muted);font-size:.85rem}

@media(max-width:640px){
  .hero{padding:60px 0 40px}
  .grid,.steps,.price-cards{grid-template-columns:1fr}
}
</style>
</head>
<body>

<nav>
  <div class="container">
    <div class="logo">CobroYa</div>
    <a href="https://wa.me/5493815767647?text=ayuda" class="nav-cta" style="background:var(--green);margin-right:8px">WhatsApp</a>
    <a href="https://t.me/CobroYa_bot" class="nav-cta">Telegram</a>
  </div>
</nav>

<section class="hero">
  <div class="container">
    <div class="badge"><span>&#9679;</span> Ya disponible en Telegram y WhatsApp</div>
    <h1>Cobra con Mercado Pago<br>en 10 segundos</h1>
    <p class="subtitle">Genera links de pago desde Telegram o WhatsApp. Sin web, sin codigo, sin complicaciones. Escribi un mensaje y listo.</p>
    <div class="hero-ctas">
      <a href="https://wa.me/5493815767647?text=ayuda" class="btn-primary" style="background:linear-gradient(135deg,#22c55e,#16a34a)">Empezar por WhatsApp</a>
      <a href="https://t.me/CobroYa_bot" class="btn-primary">Empezar por Telegram</a>
      <a href="#como-funciona" class="btn-secondary">Ver como funciona</a>
    </div>
  </div>
</section>

<section class="demo">
  <div class="container">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;max-width:960px;margin:0 auto">
      <div class="demo-box">
        <div class="demo-label" style="color:#22c55e">WhatsApp - +54 9 381 576 7647</div>
        <div class="demo-line"><span class="demo-user">Tu:</span> cobrar 5000 Clase de guitarra</div>
        <div class="demo-line"><span class="demo-bot">CobroYa:</span> Link de pago creado!</div>
        <div class="demo-line" style="padding-left:24px"><span class="demo-link">mercadopago.com.ar/checkout/...</span></div>
        <div style="border-top:1px solid #27272a;margin:16px 0"></div>
        <div class="demo-line"><span class="demo-bot">CobroYa:</span> Pago recibido - $5.000</div>
      </div>
      <div class="demo-box">
        <div class="demo-label" style="color:#3b82f6">Telegram - @CobroYa_bot</div>
        <div class="demo-line"><span class="demo-user">Tu:</span> /cobrar 5000 Clase de guitarra</div>
        <div class="demo-line"><span class="demo-bot">CobroYa:</span> Link de pago creado!</div>
        <div class="demo-line" style="padding-left:24px"><span class="demo-link">mercadopago.com.ar/checkout/...</span></div>
        <div style="border-top:1px solid #27272a;margin:16px 0"></div>
        <div class="demo-line"><span class="demo-bot">CobroYa:</span> Pago recibido - $5.000</div>
      </div>
    </div>
  </div>
</section>

<section class="features" id="features">
  <div class="container">
    <h2>Todo lo que necesitas para cobrar</h2>
    <p class="sub">Sin instalar nada. Sin saber programar. Sin crear una web.</p>
    <div class="grid">
      <div class="card">
        <div class="card-icon">&#9889;</div>
        <h3>Links de pago al instante</h3>
        <p>Escribi el monto y la descripcion. En 2 segundos tenes un link de Mercado Pago listo para enviar a tu cliente.</p>
      </div>
      <div class="card">
        <div class="card-icon">&#128276;</div>
        <h3>Notificaciones de pago</h3>
        <p>Te avisamos al instante cuando tu cliente paga. Por Telegram o WhatsApp, donde vos quieras.</p>
      </div>
      <div class="card">
        <div class="card-icon">&#128200;</div>
        <h3>Historial de pagos</h3>
        <p>Consulta tus ultimos pagos, el estado de cada uno, y los datos del pagador. Todo desde el chat.</p>
      </div>
      <div class="card">
        <div class="card-icon">&#8617;</div>
        <h3>Devoluciones faciles</h3>
        <p>Devolucion total o parcial con un solo comando. Sin entrar al panel de Mercado Pago.</p>
      </div>
      <div class="card">
        <div class="card-icon">&#128274;</div>
        <h3>Seguro</h3>
        <p>Validacion HMAC-SHA256 en webhooks. Control de acceso por chat ID. Tu cuenta protegida.</p>
      </div>
      <div class="card">
        <div class="card-icon">&#129302;</div>
        <h3>Compatible con AI</h3>
        <p>Conecta con Claude, ChatGPT u otros agentes AI via MCP. Automatiza cobros con inteligencia artificial.</p>
      </div>
    </div>
  </div>
</section>

<section class="how" id="como-funciona">
  <div class="container">
    <h2>Como funciona</h2>
    <div class="steps">
      <div class="step">
        <h3>Abri el bot</h3>
        <p>Escribi al +54 9 381 576 7647 por WhatsApp o busca @CobroYa_bot en Telegram</p>
      </div>
      <div class="step">
        <h3>Genera tu link</h3>
        <p>Escribi: /cobrar 5000 Clase de guitarra</p>
      </div>
      <div class="step">
        <h3>Envialo a tu cliente</h3>
        <p>Copia el link y compartilo por donde quieras</p>
      </div>
      <div class="step">
        <h3>Recibe tu plata</h3>
        <p>El pago va directo a tu cuenta de Mercado Pago</p>
      </div>
    </div>
  </div>
</section>

<section class="pricing" id="precios">
  <div class="container">
    <h2>Simple y transparente</h2>
    <p class="sub">Sin sorpresas. Sin comisiones ocultas.</p>
    <div class="price-cards">
      <div class="price-card">
        <h3>Gratis</h3>
        <div class="price">$0 <span>/ mes</span></div>
        <p class="price-desc">Para probar y empezar</p>
        <ul class="price-features">
          <li>Hasta 20 links por mes</li>
          <li>Telegram + WhatsApp</li>
          <li>Notificaciones de pago</li>
          <li>Historial de pagos</li>
        </ul>
        <a href="https://wa.me/5493815767647?text=ayuda" class="price-btn secondary">Empezar gratis</a>
      </div>
      <div class="price-card featured">
        <h3>Pro</h3>
        <div class="price">$4.990 <span>ARS / mes</span></div>
        <p class="price-desc">Para profesionales y negocios</p>
        <ul class="price-features">
          <li>Links ilimitados</li>
          <li>Telegram + WhatsApp</li>
          <li>Notificaciones de pago</li>
          <li>Devoluciones desde el chat</li>
          <li>Soporte prioritario</li>
        </ul>
        <a href="https://wa.me/5493815767647?text=ayuda" class="price-btn primary">Comenzar ahora</a>
      </div>
    </div>
  </div>
</section>

<section class="final-cta">
  <div class="container">
    <h2>Empeza a cobrar hoy</h2>
    <p>No necesitas web, no necesitas saber programar.<br>Solo WhatsApp (o Telegram) y tu cuenta de Mercado Pago.</p>
    <div class="hero-ctas">
      <a href="https://wa.me/5493815767647?text=ayuda" class="btn-primary" style="background:linear-gradient(135deg,#22c55e,#16a34a)">Abrir en WhatsApp</a>
      <a href="https://t.me/CobroYa_bot" class="btn-primary">Abrir en Telegram</a>
    </div>
  </div>
</section>

<footer>
  <div class="container">
    &copy; ${new Date().getFullYear()} Daniel Alejandro Dominguez Diaz &mdash; CobroYa &middot; <a href="/privacy">Privacidad</a> &middot; <a href="/terms">Terminos</a> &middot; <a href="mailto:hola@cobroya.app">hola@cobroya.app</a> &middot; <a href="https://dan1d.dev" target="_blank" rel="noopener">dan1d.dev</a>
  </div>
</footer>

</body>
</html>`;
