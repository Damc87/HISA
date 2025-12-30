import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gradnja - stroški",
  description: "Spremljajte stroške gradnje enodružinske hiše",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sl">
      <body>{children}</body>
    </html>
  );
}
