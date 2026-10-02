import type { Metadata } from "next";
import "./globals.css";
import "./risk.css";
import "./incident.css";
import "./audit.css";
import "./law.css";
import "./inspection.css";
import "./field-access.css";
import "./select.css";

export const metadata: Metadata = {
  title: "OleoQ | EHS workspace concept",
  description: "An OleoQ first-access and workspace navigation concept.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
