import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "On-Call Scheduler",
  description: "Schedule on-call workers and professionals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
