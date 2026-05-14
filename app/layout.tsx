import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WinningWord",
  description: "A word processor that coaches you in real time on the Winning Writing rules.",
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
