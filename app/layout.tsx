import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vaani Preflight — Agent Launch Readiness",
  description: "Know if your voice agent is ready before your first customer call.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
