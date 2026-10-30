import type { ReactNode } from "react";

import { Plus_Jakarta_Sans } from "next/font/google";

import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { APP_CONFIG } from "@/config/app-config";

import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_CONFIG.url),
  applicationName: APP_CONFIG.name,
  authors: [{ name: APP_CONFIG.name }],
  title: APP_CONFIG.meta.title,
  description: APP_CONFIG.meta.description,
  openGraph: {
    type: "website",
    siteName: APP_CONFIG.name,
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" className={jakarta.variable} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
