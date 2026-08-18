import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Match & Tracker",
  description: "Analisi CV / annuncio e monitoraggio candidature",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
