import type { Metadata } from "next";
import "./globals.css";
import { EntregasProvider } from "@/contexts/EntregasContext";
import { ClientesProvider } from "@/contexts/ClientesContext";
import { UsersProvider } from "@/contexts/UsersContext";

export const metadata: Metadata = {
  title: "Aplicativo ADM",
  description: "Sistema de administração",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body>
        <EntregasProvider>
          <ClientesProvider>
            <UsersProvider>{children}</UsersProvider>
          </ClientesProvider>
        </EntregasProvider>
      </body>
    </html>
  );
}
