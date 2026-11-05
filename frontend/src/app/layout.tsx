import type { Metadata } from "next";
import { Bodoni_Moda, Jost } from "next/font/google";
import "./globals.css";

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-bodoni",
  style: ["normal", "italic"],
});

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Living Love — Muebles de autor · Chile",
  description:
    "Sofás y livings a medida, cojines, cortinas PVC, toldos y quitasoles. Fabricación propia en Santiago.",
  openGraph: {
    title: "Living Love",
    description: "Muebles premium hechos a medida en Chile",
    locale: "es_CL",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL">
      <body className={`${bodoni.variable} ${jost.variable} antialiased font-sans`}>
        {children}
      </body>
    </html>
  );
}
