import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WinningWord",
  description: "A word processor that coaches you in real time on Glenn Kramon's Winning Writing.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
