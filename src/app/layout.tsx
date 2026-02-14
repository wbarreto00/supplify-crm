import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Supplify CRM",
  description: "CRM simples com Google Sheets e API para agentes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
