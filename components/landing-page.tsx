"use client";

import {
  ArrowRight,
  BarChart3,
  BellRing,
  Boxes,
  CheckCircle2,
  ChefHat,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  Flame,
  Globe,
  LayoutDashboard,
  MessageCircle,
  PackageCheck,
  QrCode,
  Rocket,
  ShieldCheck,
  Sparkles,
  Store,
  Smartphone,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { RegisterForm } from "@/components/register-form";

export function LandingPage() {
  const [activeTab, setActiveTab] = useState<"menu" | "alerts" | "stock" | "payments" | "kitchen">("menu");

  return (
    <div className="landing-root">
      {/* Top Banner */}
      <div className="top-promo-bar">
        <Sparkles size={16} />
        <span>
          <strong>TODO TU NEGOCIO POR $30.000 AL MES</strong> · Prueba gratis durante 30 días
        </span>
        <a href="#registro" className="promo-btn">
          Crear mi negocio <ArrowRight size={14} />
        </a>
      </div>

      {/* Main Navbar */}
      <header className="landing-nav">
        <div className="nav-container">
          <Link href="/" className="landing-logo">
            <span className="logo-icon"><Store size={22} /></span>
            <div className="logo-text">
              <span className="brand-title">TuPedido360</span>
              <small className="brand-tag">Software para Restaurantes</small>
            </div>
          </Link>

          <nav className="nav-links">
            <a href="#caracteristicas">Características</a>
            <a href="#beneficios">Beneficios</a>
            <a href="#incluye">¿Qué incluye?</a>
            <a href="#planes">Planes y Precios</a>
            <a href="https://antojos.tupedido360.co" target="_blank" rel="noreferrer" className="demo-link">
              Ver Menú Demo <ExternalLink size={14} />
            </a>
          </nav>

          <div className="nav-actions">
            <Link href="/ingresar" className="btn-secondary">
              Iniciar Sesión
            </Link>
            <a href="#registro" className="btn-primary">
              Probar Gratis 30 Días <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <Flame size={16} />
              <span>La herramienta completa para pequeños negocios</span>
            </div>

            <h1 className="hero-title">
              Tu página web, tus pedidos y el control de tu negocio, <span className="highlight-text">todo por $30.000 al mes</span>
            </h1>

            <p className="hero-subtitle">
              No pagues por cinco herramientas diferentes. Con TuPedido360 recibes un menú web profesional, pedidos por QR, panel de ventas, control de caja, mini inventario y acceso para tu equipo en una sola plataforma.
            </p>

            <div className="hero-actions">
              <a href="#registro" className="btn-hero-primary">
                <Rocket size={19} /> Quiero mis 30 días gratis
              </a>
              <a href="/TuPedido360.apk" download className="btn-hero-apk">
                <Download size={19} /> Descargar app Android
              </a>
              <a href="https://antojos.tupedido360.co" target="_blank" rel="noreferrer" className="btn-hero-secondary">
                <Globe size={18} /> Ver cómo quedaría mi menú
              </a>
            </div>

            {/* Quick Badges */}
            <div className="hero-trust-badges">
              <span><CheckCircle2 size={16} /> Sin tarjeta para empezar</span>
              <span><CheckCircle2 size={16} /> 0% comisión por pedido</span>
              <span><CheckCircle2 size={16} /> Cancela cuando quieras</span>
            </div>

            {/* Metrics Counter */}
            <div className="hero-metrics">
              <div className="metric-box">
                <strong>$30 mil</strong>
                <small>Todo incluido al mes</small>
              </div>
              <div className="metric-box">
                <strong>6 en 1</strong>
                <small>Herramientas para operar</small>
              </div>
              <div className="metric-box">
                <strong>30 días</strong>
                <small>Para probar sin pagar</small>
              </div>
            </div>
          </div>

          {/* Interactive Mockup Frame */}
          <div className="hero-visual">
            <div className="mockup-frame">
              <div className="mockup-header">
                <div className="mockup-dots">
                  <span className="dot red"></span>
                  <span className="dot yellow"></span>
                  <span className="dot green"></span>
                </div>
                <div className="mockup-title">antojos.tupedido360.co</div>
                <div className="mockup-badge">ENVÍO EN VIVO</div>
              </div>

              <div className="mockup-body">
                <div className="order-notification-card">
                  <div className="notif-header">
                    <BellRing size={20} className="bell-pulse" />
                    <div>
                      <strong>🔔 ¡NUEVO PEDIDO RECIBIDO! #ORD-8492</strong>
                      <small>Aviso push en tiempo real</small>
                    </div>
                  </div>
                  <div className="notif-details">
                    <div className="detail-row">
                      <span>Cliente:</span> <strong>Carlos Mendoza (Mesa 4)</strong>
                    </div>
                    <div className="detail-row">
                      <span>Pedido:</span> <strong>2x Hamburguesa Doble Queso + 2x Cerveza Club Colombia</strong>
                    </div>
                    <div className="detail-row highlight">
                      <span>Total del pedido:</span> <strong>$54.000 COP</strong>
                    </div>
                  </div>
                </div>

                <div className="mockup-features-strip">
                  <div className="strip-item"><QrCode size={18} /> Código QR por Mesa</div>
                  <div className="strip-item"><Smartphone size={18} /> App Android Nativa</div>
                  <div className="strip-item"><CreditCard size={18} /> Suscripción con Mercado Pago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="incluye" className="solution-bundle">
        <div className="container">
          <div className="bundle-heading">
            <span className="section-tag">UN SOLO PAGO, TODO INCLUIDO</span>
            <h2>Esto es lo que recibe tu negocio por solo $30.000 al mes</h2>
            <p>Una solución completa para vender, atender y llevar el control diario sin enredarte con varias aplicaciones.</p>
          </div>
          <div className="bundle-grid">
            <article><Globe size={25} /><strong>Página web y menú digital</strong><span>Tu propio enlace para compartir por WhatsApp, redes sociales y código QR.</span></article>
            <article><QrCode size={25} /><strong>Pedidos por QR</strong><span>Para mesa, domicilio o recoger en el negocio, sin cobrarte comisión.</span></article>
            <article><LayoutDashboard size={25} /><strong>Panel de administración</strong><span>Gestiona productos, precios, pedidos, mesas y personal desde el celular.</span></article>
            <article><BarChart3 size={25} /><strong>Control de ventas y caja</strong><span>Consulta ingresos, historial, productos más vendidos y movimientos diarios.</span></article>
            <article><PackageCheck size={25} /><strong>Mini inventario</strong><span>Controla existencias y deja de ofrecer automáticamente lo que se agotó.</span></article>
            <article><ChefHat size={25} /><strong>Cocina y equipo conectados</strong><span>Roles para dueño, caja, cocina y meseros con pedidos claros en tiempo real.</span></article>
          </div>
          <div className="bundle-close">
            <div><strong>Todo esto vale menos que un café al día.</strong><span>Sin comisión por venta y sin permanencia.</span></div>
            <a href="#registro">Empezar gratis <ArrowRight size={17} /></a>
          </div>
        </div>
      </section>

      <section className="value-comparison">
        <div className="container comparison-layout">
          <div className="comparison-copy">
            <span className="section-tag">NO PAGUES TODO POR SEPARADO</span>
            <h2>Seis herramientas, una sola mensualidad</h2>
            <p>Una página web, un sistema de pedidos y herramientas para administrar tu negocio normalmente implican diferentes proveedores, pagos y contraseñas. Aquí trabajan juntas desde el primer día.</p>
            <div className="daily-price"><strong>≈ $1.000</strong><span>por día para digitalizar y controlar tu negocio</span></div>
            <a href="#registro" className="comparison-cta">Quiero digitalizar mi negocio <ArrowRight size={17} /></a>
          </div>
          <div className="comparison-card">
            <header><span>Lo que necesitas</span><strong>Con TuPedido360</strong></header>
            {[
              "Página web y menú digital",
              "Pedidos por QR, domicilio y recoger",
              "Panel de administración",
              "Control de ventas y caja",
              "Mini inventario",
              "Accesos para cocina y personal",
            ].map(item => <div key={item}><span>{item}</span><b><CheckCircle2 size={17} /> Incluido</b></div>)}
            <footer><span>Todo el sistema</span><strong>$30.000 <small>COP / mes</small></strong></footer>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <div className="container">
          <div className="section-header center">
            <span className="section-tag">ASÍ DE FÁCIL FUNCIONA</span>
            <h2>Del celular de tu cliente al control de tu negocio</h2>
            <p>Sin aplicaciones obligatorias para tus clientes y sin procesos complicados para tu equipo.</p>
          </div>
          <div className="steps-grid">
            <article><b>1</b><QrCode size={28} /><h3>Tu cliente entra</h3><p>Escanea el QR o abre tu enlace y ve el menú con tus productos, precios y fotografías.</p></article>
            <article><b>2</b><BellRing size={28} /><h3>Recibes el pedido</h3><p>El pedido llega al panel del negocio con los productos, datos del cliente y forma de entrega.</p></article>
            <article><b>3</b><BarChart3 size={28} /><h3>Tú mantienes el control</h3><p>Actualizas el estado, controlas existencias y consultas las ventas desde un solo lugar.</p></article>
          </div>
          <p className="guided-setup"><CheckCircle2 size={19} /> Te acompañamos para configurar tu negocio y publicar tu primer menú.</p>
        </div>
      </section>

      {/* Interactive Feature Demo Showcase */}
      <section id="caracteristicas" className="section-features">
        <div className="container">
          <div className="section-header center">
            <span className="section-tag">MIRA CÓMO FUNCIONA</span>
            <h2>Simple para tus clientes. Poderoso para tu negocio.</h2>
            <p>Tus clientes compran fácilmente y tú mantienes el control desde cualquier dispositivo.</p>
          </div>

          <div className="feature-tabs">
            <button className={activeTab === "menu" ? "tab-btn active" : "tab-btn"} onClick={() => setActiveTab("menu")}>
              <QrCode size={18} /> Menú QR & Subdominio
            </button>
            <button className={activeTab === "alerts" ? "tab-btn active" : "tab-btn"} onClick={() => setActiveTab("alerts")}>
              <BellRing size={18} /> Notificaciones Push
            </button>
            <button className={activeTab === "stock" ? "tab-btn active" : "tab-btn"} onClick={() => setActiveTab("stock")}>
              <Boxes size={18} /> Inventario & Stock
            </button>
            <button className={activeTab === "payments" ? "tab-btn active" : "tab-btn"} onClick={() => setActiveTab("payments")}>
              <CreditCard size={18} /> Pago de Suscripción
            </button>
            <button className={activeTab === "kitchen" ? "tab-btn active" : "tab-btn"} onClick={() => setActiveTab("kitchen")}>
              <ChefHat size={18} /> Cocina & Meseros
            </button>
          </div>

          <div className="tab-content-card">
            {activeTab === "menu" && (
              <div className="tab-panel">
                <div className="panel-text">
                  <h3>Menú Digital Interactivo con tu Propio Enlace Web y Código QR</h3>
                  <p>Tus clientes escanean el código QR en sus mesas o ingresan a tu subdominio personalizado (ej: <strong>minegocio.tupedido360.co</strong>) sin necesidad de descargar aplicaciones.</p>
                  <ul>
                    <li><CheckCircle2 size={18} color="#10b981" /> Fotografías en alta resolución que antojan a tus clientes.</li>
                    <li><CheckCircle2 size={18} color="#10b981" /> Códigos QR individuales para cada mesa con envío automático de comanda.</li>
                    <li><CheckCircle2 size={18} color="#10b981" /> Actualizaciones instantáneas de precios y categorías sin reimprimir cartas.</li>
                  </ul>
                </div>
                <div className="panel-media">
                  <div className="qr-preview-box">
                    <QrCode size={96} color="#176b4d" />
                    <strong>Escanea para Pedir</strong>
                    <small>minegocio.tupedido360.co</small>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "alerts" && (
              <div className="tab-panel">
                <div className="panel-text">
                  <h3>Notificaciones instantáneas en tu celular</h3>
                  <p>Recibe una notificación del sistema cuando un cliente ordene, incluso con la aplicación cerrada, según las capacidades y permisos del dispositivo.</p>
                  <ul>
                    <li><CheckCircle2 size={18} color="#10b981" /> Servicio de Notificaciones Push nativas en segundo plano.</li>
                    <li><CheckCircle2 size={18} color="#10b981" /> Aviso visible para abrir rápidamente el panel de pedidos.</li>
                    <li><CheckCircle2 size={18} color="#10b981" /> Funciona simultáneamente en múltiples dispositivos (Cocina, Meseros, Dueño).</li>
                  </ul>
                </div>
                <div className="panel-media">
                  <div className="alert-preview-box">
                    <BellRing size={64} className="bell-shake" color="#d6f35c" />
                    <strong>Notificaciones activas</strong>
                    <p>🔔 Recibe avisos de pedidos en tu dispositivo.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "stock" && (
              <div className="tab-panel">
                <div className="panel-text">
                  <h3>Control de Stock e Inventario en Tiempo Real</h3>
                  <p>Mantén un control riguroso de tus gaseosas, cervezas, bebidas y platos. Evita vender productos agotados y recibe alertas preventivas.</p>
                  <ul>
                    <li><CheckCircle2 size={18} color="#10b981" /> Descuento automático de unidades al confirmar cada pedido.</li>
                    <li><CheckCircle2 size={18} color="#10b981" /> Insignia amarilla de advertencia cuando quedan 3 o menos unidades.</li>
                    <li><CheckCircle2 size={18} color="#10b981" /> Ocultamiento automático del menú cuando el stock llega a 0.</li>
                  </ul>
                </div>
                <div className="panel-media">
                  <div className="stock-preview-box">
                    <div className="stock-badge-demo warning">⚠️ Quedan solo 2 Cervezas Club Colombia</div>
                    <div className="stock-badge-demo out">🚫 Coca-Cola 350ml - Agotado (Oculto del menú)</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "payments" && (
              <div className="tab-panel">
                <div className="panel-text">
                  <h3>Renueva tu plan mediante Mercado Pago Colombia</h3>
                  <p>El propietario puede pagar la suscripción de TuPedido360 desde el panel mediante el checkout de Mercado Pago.</p>
                  <ul>
                    <li><CheckCircle2 size={18} color="#10b981" /> Checkout administrado por Mercado Pago.</li>
                    <li><CheckCircle2 size={18} color="#10b981" /> Validación segura e idempotente de la confirmación del pago.</li>
                    <li><CheckCircle2 size={18} color="#10b981" /> Activación automática del periodo contratado al aprobarse el pago.</li>
                  </ul>
                </div>
                <div className="panel-media">
                  <div className="payment-preview-box">
                    <CreditCard size={56} color="#10b981" />
                    <strong>Mercado Pago Colombia</strong>
                    <span>Renovación segura del plan</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "kitchen" && (
              <div className="tab-panel">
                <div className="panel-text">
                  <h3>Pantalla de Cocina y Panel Especializado para Meseros</h3>
                  <p>Conecta a todo tu equipo de trabajo. Los meseros registran pedidos de mesas desde su celular y la cocina los visualiza instantáneamente en una pantalla limpia.</p>
                  <ul>
                    <li><CheckCircle2 size={18} color="#10b981" /> Vista en vivo de pedidos por preparar, en cocina y despachados.</li>
                    <li><CheckCircle2 size={18} color="#10b981" /> Roles independientes (Dueño, Admin, Cajero, Cocina, Mesero).</li>
                    <li><CheckCircle2 size={18} color="#10b981" /> Asignación de mesas y control de comandas en papel impreso o digital.</li>
                  </ul>
                </div>
                <div className="panel-media">
                  <div className="kitchen-preview-box">
                    <ChefHat size={56} color="#d6f35c" />
                    <strong>Comanda de Cocina #492</strong>
                    <small>Mesa 3 · 2x Picada Familiar (Sin cebolla)</small>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Benefits & ROI Section */}
      <section id="beneficios" className="section-benefits">
        <div className="container">
          <div className="section-header center">
            <span className="section-tag">MENOS GASTOS, MÁS CONTROL</span>
            <h2>Deja de perder tiempo y dinero administrando todo por separado</h2>
            <p>TuPedido360 organiza la operación diaria y te ayuda a vender directamente a tus clientes.</p>
          </div>

          <div className="benefits-grid">
            <article className="benefit-card">
              <div className="card-icon"><TrendingUp size={28} /></div>
              <h3>Una vitrina digital que sí antoja</h3>
              <p>Presenta tus productos con fotos, categorías y precios claros en un enlace profesional que puedes compartir en segundos.</p>
            </article>

            <article className="benefit-card">
              <div className="card-icon"><Clock size={28} /></div>
              <h3>Agiliza la Atención y Reduce Tiempos</h3>
              <p>Tus clientes escanean el código QR en la mesa y realizan sus pedidos de inmediato sin esperar a que el mesero se acerque a tomar nota.</p>
            </article>

            <article className="benefit-card">
              <div className="card-icon"><Rocket size={28} /></div>
              <h3>0% Comisiones por Venta</h3>
              <p>A diferencia de otras plataformas que te cobran hasta el 30% por cada plato vendido, en TuPedido360 toda la ganancia de tu esfuerzo es 100% tuya.</p>
            </article>

            <article className="benefit-card">
              <div className="card-icon"><ShieldCheck size={28} /></div>
              <h3>Pedidos Claros para Cocina</h3>
              <p>Evita notas ilegibles en papel. Las comandas ingresan de forma digital y muestran claramente cada producto y nota especial.</p>
            </article>

            <article className="benefit-card">
              <div className="card-icon"><BarChart3 size={28} /></div>
              <h3>Control de Ventas y Caja</h3>
              <p>Consulta ingresos, historial de pedidos y productos más vendidos para tomar mejores decisiones cada día.</p>
            </article>

            <article className="benefit-card">
              <div className="card-icon"><Smartphone size={28} /></div>
              <h3>Aplicación Android Incluida</h3>
              <p>Descarga la aplicación Android para abrir el panel de TuPedido360 como una app en el celular de tu negocio.</p>
            </article>
          </div>
        </div>
      </section>

      {/* APK Direct Download Callout Section */}
      <section id="app-android" className="section-apk-callout">
        <div className="container">
          <div className="apk-banner-card">
            <div className="apk-banner-content">
              <span className="apk-tag">NUEVO · APK ANDROID NATIVA</span>
              <h2>Descarga la App de TuPedido360 Directamente en tu Celular</h2>
              <p>Recibe notificaciones de pedidos, gestiona tus mesas y controla tu inventario desde la aplicación Android.</p>
              <div className="apk-banner-actions">
                <a href="/TuPedido360.apk" download className="btn-apk-download">
                  <Download size={20} /> Descargar APK Android (15 MB)
                </a>
                <span className="apk-subnote">Compatible con Android 7.0 en adelante · Instalación instantánea</span>
              </div>
            </div>
            <div className="apk-banner-visual">
              <div className="mobile-phone-mockup">
                <Smartphone size={80} color="#d6f35c" />
                <strong>TuPedido360 App</strong>
                <small>Notificaciones push en segundo plano</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planes" className="section-pricing">
        <div className="container">
          <div className="section-header center">
            <span className="section-tag">PRECIOS TRANSPARENTES</span>
            <h2>Empieza por $30.000 al mes. Ahorra si eliges más tiempo.</h2>
            <p>Todos los planes incluyen la plataforma completa y <strong>30 días de prueba gratis</strong>, sin tarjeta para comenzar.</p>
          </div>

          <div className="pricing-grid">
            {/* Plan 1 Mes */}
            <div className="pricing-card">
              <div className="card-header">
                <span className="plan-badge">Estándar</span>
                <h3>Plan 1 Mes</h3>
                <div className="price-tag">
                  <strong>$30.000</strong> <small>COP / mes</small>
                </div>
                <p>Ideal para probar el potencial del sistema en tu restaurante.</p>
              </div>
              <ul className="plan-features">
                <li><CheckCircle2 size={16} color="#10b981" /> Menú QR & Subdominio propio</li>
                <li><CheckCircle2 size={16} color="#10b981" /> Notificaciones Push de pedidos</li>
                <li><CheckCircle2 size={16} color="#10b981" /> Control de Stock & Mini-inventario</li>
                <li><CheckCircle2 size={16} color="#10b981" /> Renovación del plan con Mercado Pago</li>
                <li><CheckCircle2 size={16} color="#10b981" /> Aplicación APK para Android</li>
              </ul>
              <a href="#registro" className="btn-plan-action">Probar 30 Días Gratis</a>
            </div>

            {/* Plan 3 Meses */}
            <div className="pricing-card">
              <div className="card-header">
                <span className="plan-badge popular">Popular</span>
                <h3>Plan 3 Meses</h3>
                <div className="price-tag">
                  <strong>$80.000</strong> <small>COP / trimestre</small>
                </div>
                <span className="savings-pill">Ahorras $10.000 COP</span>
              </div>
              <ul className="plan-features">
                <li><CheckCircle2 size={16} color="#10b981" /> Todo lo del Plan 1 Mes</li>
                <li><CheckCircle2 size={16} color="#10b981" /> Soporte prioritario por WhatsApp</li>
                <li><CheckCircle2 size={16} color="#10b981" /> Roles ilimitados para tu personal</li>
                <li><CheckCircle2 size={16} color="#10b981" /> Reportes de ventas exportables</li>
              </ul>
              <a href="#registro" className="btn-plan-action">Probar 30 Días Gratis</a>
            </div>

            {/* Plan 6 Meses */}
            <div className="pricing-card">
              <div className="card-header">
                <span className="plan-badge">Recomendado</span>
                <h3>Plan 6 Meses</h3>
                <div className="price-tag">
                  <strong>$150.000</strong> <small>COP / semestre</small>
                </div>
                <span className="savings-pill">Ahorras $30.000 COP</span>
              </div>
              <ul className="plan-features">
                <li><CheckCircle2 size={16} color="#10b981" /> Todo lo del Plan 3 Meses</li>
                <li><CheckCircle2 size={16} color="#10b981" /> Asesoría en configuración de menú</li>
                <li><CheckCircle2 size={16} color="#10b981" /> Prioridad en nuevas mejoras del producto</li>
              </ul>
              <a href="#registro" className="btn-plan-action">Probar 30 Días Gratis</a>
            </div>

            {/* Plan 1 Año (Featured) */}
            <div className="pricing-card featured">
              <div className="featured-banner"><Sparkles size={14} /> MEJOR AHORRO</div>
              <div className="card-header">
                <span className="plan-badge star">⭐ Recomendación #1</span>
                <h3>Plan 1 Año</h3>
                <div className="price-tag">
                  <strong>$280.000</strong> <small>COP / año</small>
                </div>
                <span className="savings-pill highlight">¡Ahorras $80.000 · 2 Meses GRATIS!</span>
              </div>
              <ul className="plan-features">
                <li><CheckCircle2 size={16} color="#d6f35c" /> Acceso completo sin restricciones</li>
                <li><CheckCircle2 size={16} color="#d6f35c" /> Dominio y subdominio preferente</li>
                <li><CheckCircle2 size={16} color="#d6f35c" /> Soporte personalizado prioritario</li>
                <li><CheckCircle2 size={16} color="#d6f35c" /> Todas las actualizaciones futuras incluidas</li>
              </ul>
              <a href="#registro" className="btn-plan-action featured">Comenzar Ahora con 30 Días Gratis</a>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Section */}
      <section id="registro" className="section-register-landing">
        <div className="container">
          <div className="register-landing-wrap">
            <div className="register-info">
              <span className="section-tag">REGISTRO INSTANTÁNEO</span>
              <h2>Dale a tu negocio la presencia y el control que merece</h2>
              <p>Crea tu cuenta, publica tu menú y descubre durante 30 días todo lo que TuPedido360 puede hacer por ti.</p>

              <div className="benefits-list-mini">
                <div className="mini-item">
                  <CheckCircle2 size={20} color="#d6f35c" />
                  <div>
                    <strong>Prueba Gratuita de 30 Días</strong>
                    <small>Disfruta de todas las funciones sin pagar un solo peso durante tu primer mes.</small>
                  </div>
                </div>
                <div className="mini-item">
                  <CheckCircle2 size={20} color="#d6f35c" />
                  <div>
                    <strong>Sin Permanencia Mínima</strong>
                    <small>Cancela o renueva cuando lo desees directamente desde tu panel.</small>
                  </div>
                </div>
                <div className="mini-item">
                  <CheckCircle2 size={20} color="#d6f35c" />
                  <div>
                    <strong>Soporte en Colombia</strong>
                    <small>Equipo de soporte dispuesto a ayudarte en la configuración de tu negocio.</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="register-form-container">
              <div className="form-card-header">
                <h3>Crear Cuenta de Negocio</h3>
                <p>30 Días Gratis · Sin tarjeta de crédito</p>
              </div>
              <RegisterForm />
            </div>
          </div>
        </div>
      </section>

      {/* Landing Footer */}
      <footer className="landing-footer">
        <div className="container footer-content">
          <div className="footer-brand">
            <Link href="/" className="landing-logo">
              <span className="logo-icon"><Store size={20} /></span>
              <span className="brand-title">TuPedido360</span>
            </Link>
            <p>La plataforma integral de pedidos y gestión gastronómica para restaurantes y comercios en Colombia.</p>
            <small>© {new Date().getFullYear()} TuPedido360. Todos los derechos reservados.</small>
          </div>

          <div className="footer-links">
            <strong>Navegación</strong>
            <a href="#caracteristicas">Características</a>
            <a href="#beneficios">Beneficios</a>
            <a href="#app-android">App APK Android</a>
            <a href="#planes">Planes y Precios</a>
          </div>

          <div className="footer-links">
            <strong>Acceso</strong>
            <Link href="/ingresar">Iniciar Sesión</Link>
            <a href="#registro">Crear Cuenta Gratis</a>
            <a href="/TuPedido360.apk" download>Descargar APK</a>
          </div>

          <div className="footer-contact">
            <strong>Desarrollado por</strong>
            <p className="company-tag">
              Un producto oficial de <a href="https://imagenplus.co" target="_blank" rel="noreferrer">Imagen Plus</a>
            </p>
            <div className="secure-badge">
              <ShieldCheck size={18} color="#10b981" />
              <span>Conexión Encriptada SSL 256-Bit</span>
            </div>
          </div>
        </div>
      </footer>

      <a
        className="landing-whatsapp"
        href="https://wa.me/573138866453?text=Hola%2C%20quiero%20conocer%20TuPedido360%20para%20mi%20negocio."
        target="_blank"
        rel="noreferrer"
        aria-label="Hablar con TuPedido360 por WhatsApp"
      >
        <MessageCircle size={24} /><span>¿Tienes dudas? Hablemos</span>
      </a>
    </div>
  );
}
