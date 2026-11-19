// © 2026 Santiago López García y Oscar Julián Mojica Calderón. Ver el archivo LICENSE.
import type { Metadata } from "next";
import "./globals.css";
import { AUTORES, NOMBRE_PROYECTO } from "@/lib/creditos";

export const metadata: Metadata = {
  title: `${NOMBRE_PROYECTO} | ${AUTORES.join(" y ")}`,
  authors: AUTORES.map((name) => ({ name })),
  creator: AUTORES.join(" y "),
  description: "Análisis léxico, sintáctico y semántico en el navegador",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
