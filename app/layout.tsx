import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Billflow — Invoice Management by BrightLant",
  description: "Manage invoices, clients, payments and business reports in one elegant workspace.",
  applicationName: "Billflow",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
