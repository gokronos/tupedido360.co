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
  Layers,
  Lock,
  MessageCircle,
  PackageCheck,
  PhoneCall,
  QrCode,
  Rocket,
  ShieldCheck,
  Sparkles,
  Store,
  Smartphone,
  TrendingUp,
  Zap,
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
          <strong>¡PRUEBA GRATIS 30 DÍAS!</strong> Sin tarjeta de crédito · Descarga la App APK Nativa para Android
        </span>
        <a href="#registro" className="promo-btn">
          Empieza Hoy <ArrowRight size={14} />
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
            <a href="#app-android">App Android</a>
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
              <Flame size={16} color="#d6f35c" />
              <span>El Software #1 de Pedidos y Menú Digital en Colombia</span>
            </div>

            <h1 className="hero-title">
              La Plataforma Todo en Uno para <span className="highlight-text">Multiplicar tus Ventas</span> y Automatizar tu Restaurante
            </h1>

            <p className="hero-subtitle">
              Gestiona domicilios, pedidos en mesa con código QR y retiro en local desde tu celular. Alertas sonoras de fondo, control de stock inteligente y pagos automáticos por PSE, Nequi y Tarjeta.
            </p>

            <div className="hero-actions">
              <a href="#registro" className="btn-hero-primary">
                <Rocket size={19} /> Crear Mi Restaurante Gratis
              </a>
              <a href="/TuPedido360.apk" download className="btn-hero-apk">
                <Download size={19} /> Descargar App APK Android
              </a>
              <a href="https://antojos.tupedido360.co" target="_blank" rel="noreferrer" className="btn-hero-secondary">
                <Globe size={18} /> Ver Demo En Vivo
              </a>
            </div>

            {/* Quick Badges */}
            <div className="hero-trust-badges">
              <span><CheckCircle2 size={16} color="#d6f35c" /> 30 Días de Prueba Gratis</span>
              <span><CheckCircle2 size={16} color="#d6f35c" /> 0% Comisiones por Pedido</span>
              <span><CheckCircle2 size={16} color="#d6f35c" /> Instalación en 3 Minutos</span>
            </div>

            {/* Metrics Counter */}
            <div className="hero-metrics">
              <div className="metric-box">
                <strong>+35%</strong>
                <small>Aumento Promedio en Ventas</small>
              </div>
              <div className="metric-box">
                <strong>0%</strong>
                <small>Comisiones de Intermediarios</small>
              </div>
              <div className="metric-box">
                <strong>100%</strong>
                <small>Alertas Sonoras en Tiempo Real</small>
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
                      <small>Celular suena y vibra en tiempo real</small>
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
                      <span>Total Ahorrado sin Comisión:</span> <strong>$54.000 COP</strong>
                    </div>
                  </div>
                </div>

                <div className="mockup-features-strip">
                  <div className="strip-item"><QrCode size={18} /> Código QR por Mesa</div>
                  <div className="strip-item"><Smartphone size={18} /> App Android Nativa</div>
                  <div className="strip-item"><CreditCard size={18} /> PSE & Nequi Directo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Feature Demo Showcase */}
      <section id="caracteristicas" className="section-features">
        <div className="container">
          <div className="section-header center">
            <span className="section-tag">TECNOLOGÍA DE AVANCE</span>
            <h2>Todo lo que Tu Restaurante Necesita en un Solo Lugar</h2>
            <p>Diseñado específicamente para el mercado gastronómico y comercial en Colombia.</p>
          </div>

          <div className="feature-tabs">
            <button className={activeTab === "menu" ? "tab-btn active" : "tab-btn"} onClick={() => setActiveTab("menu")}>
              <QrCode size={18} /> Menú QR & Subdominio
            </button>
            <button className={activeTab === "alerts" ? "tab-btn active" : "tab-btn"} onClick={() => setActiveTab("alerts")}>
              <BellRing size={18} /> Alertas Sonoras & Vibración
            </button>
            <button className={activeTab === "stock" ? "tab-btn active" : "tab-btn"} onClick={() => setActiveTab("stock")}>
              <Boxes size={18} /> Inventario & Stock
            </button>
            <button className={activeTab === "payments" ? "tab-btn active" : "tab-btn"} onClick={() => setActiveTab("payments")}>
              <CreditCard size={18} /> Mercado Pago & PSE
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
                  <h3>Alertas Sonoras y Vibración Instantánea en tu Celular</h3>
                  <p>¡No más pedidos perdidos! Tu celular Android o navegador sonará con un timbre fuerte y vibrará al segundo en que un cliente ordene, incluso con la aplicación cerrada o la pantalla bloqueada.</p>
                  <ul>
                    <li><CheckCircle2 size={18} color="#10b981" /> Servicio de Notificaciones Push nativas en segundo plano.</li>
                    <li><CheckCircle2 size={18} color="#10b981" /> Timbre continuo hasta que abras o despaches la orden.</li>
                    <li><CheckCircle2 size={18} color="#10b981" /> Funciona simultáneamente en múltiples dispositivos (Cocina, Meseros, Dueño).</li>
                  </ul>
                </div>
                <div className="panel-media">
                  <div className="alert-preview-box">
                    <BellRing size={64} className="bell-shake" color="#d6f35c" />
                    <strong>Alerta Sonora Activa</strong>
                    <p>🔔 ¡Celular suena y vibra fuerte al recibir un pedido!</p>
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
                  <h3>Integración Directa con Mercado Pago Colombia</h3>
                  <p>Acepta todos los medios de pago en Colombia de forma 100% segura mediante nuestra ventana flotante integrada sin sacar a tus clientes de la plataforma.</p>
                  <ul>
                    <li><CheckCircle2 size={18} color="#10b981" /> Pagos por PSE (Bancolombia, Davivienda, Nequi, Banco de Bogotá, etc.).</li>
                    <li><CheckCircle2 size={18} color="#10b981" /> Nequi, Daviplata y Tarjetas de Crédito/Débito.</li>
                    <li><CheckCircle2 size={18} color="#10b981" /> Renovación e ingresos recibidos directamente en tu cuenta.</li>
                  </ul>
                </div>
                <div className="panel-media">
                  <div className="payment-preview-box">
                    <CreditCard size={56} color="#10b981" />
                    <strong>Mercado Pago Colombia</strong>
                    <span>PSE · Nequi · Daviplata · Tarjetas</span>
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
            <span className="section-tag">BENEFICIOS COMPROBADOS</span>
            <h2>¿Por qué los Mejores Restaurantes de Colombia eligen TuPedido360?</h2>
            <p>Maximiza tus márgenes de ganancia eliminando las altas comisiones de terceros.</p>
          </div>

          <div className="benefits-grid">
            <article className="benefit-card">
              <div className="card-icon"><TrendingUp size={28} /></div>
              <h3>Incrementa tus Ventas un 35%</h3>
              <p>Un menú digital con fotos llamativas e interfaz rápida incita a los clientes a añadir bebidas, acompañamientos y postres adicionales a sus órdenes.</p>
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
              <h3>Sin Errores en Pedidos y Cocina</h3>
              <p>Elimina las notas ilegibles en papel. Las comisiones ingresan de forma digital y clara a la cocina especificado cada ingrediente o nota especial.</p>
            </article>

            <article className="benefit-card">
              <div className="card-icon"><BarChart3 size={28} /></div>
              <h3>Historial de Ventas y Finanzas</h3>
              <p>Conoce tus ingresos del día, métricas de platos más vendidos y desempeño financiero de tu negocio en gráficos estadísticos en tiempo real.</p>
            </article>

            <article className="benefit-card">
              <div className="card-icon"><Smartphone size={28} /></div>
              <h3>App APK Android Nativa Incluida</h3>
              <p>Descarga la aplicación directamente en cualquier celular Android de tu negocio para recibir alertas instantáneas sin depender solo del navegador.</p>
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
              <p>Recibe notificaciones de pedidos con timbre sonoro y vibración fuerte, gestiona tus mesas y controla tu inventario desde una app ultra ligera de solo 4 MB.</p>
              <div className="apk-banner-actions">
                <a href="/TuPedido360.apk" download className="btn-apk-download">
                  <Download size={20} /> Descargar APK Nativa (4.0 MB)
                </a>
                <span className="apk-subnote">Compatible con Android 7.0 en adelante · Instalación instantánea</span>
              </div>
            </div>
            <div className="apk-banner-visual">
              <div className="mobile-phone-mockup">
                <Smartphone size={80} color="#d6f35c" />
                <strong>TuPedido360 App</strong>
                <small>Alertas 24/7 en segundo plano</small>
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
            <h2>Planes Flexibles Adaptados a tu Negocio</h2>
            <p>Todos los planes incluyen <strong>30 DÍAS DE PRUEBA GRATIS</strong>. No requerimos tarjeta de crédito para empezar.</p>
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
                <li><CheckCircle2 size={16} color="#10b981" /> Alertas sonoras & Notificaciones Push</li>
                <li><CheckCircle2 size={16} color="#10b981" /> Control de Stock & Mini-inventario</li>
                <li><CheckCircle2 size={16} color="#10b981" /> Pagos por PSE & Nequi integrados</li>
                <li><CheckCircle2 size={16} color="#10b981" /> App APK Nativa Android</li>
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
                <li><CheckCircle2 size={16} color="#10b981" /> Garantía de uptime 99.9%</li>
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
                <li><CheckCircle2 size={16} color="#d6f35c" /> Soporte personalizado VIP 24/7</li>
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
              <h2>Crea la Cuenta de tu Restaurante en Menos de 2 Minutos</h2>
              <p>Comienza a recibir pedidos hoy mismo. Configuración rápida sin complicaciones técnicas.</p>

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
    </div>
  );
}
