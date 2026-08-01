import { LandingPage } from "@/components/landing-page";

export const metadata = {
  title: "TuPedido360 - Software de Pedidos, Menú QR, Alertas Sonoras y Pagos PSE en Colombia",
  description: "La plataforma integral para restaurantes y comercios en Colombia. Menú digital interactivo, código QR por mesa, alertas sonoras de fondo, control de stock e integración directa con Mercado Pago Colombia (PSE, Nequi).",
};

export default function Home() {
  return <LandingPage />;
}
