import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TuPedido360 | Crea tu negocio",
  description: "Pedidos y administración para restaurantes y comercios.",
  metadataBase: new URL("https://tupedido360.co"),
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
    >
      <body>{children}</body>
    </html>
  );
}
