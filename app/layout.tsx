import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoIP Kamailio | Web Client",
  description: "Aplikasi Web VoIP terintegrasi dengan server Kamailio via SIP/UDP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
