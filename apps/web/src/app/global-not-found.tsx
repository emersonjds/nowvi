import { Plus_Jakarta_Sans } from "next/font/google";

import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/config/app-config";
import { en } from "@/i18n/dictionaries/en";

import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

const copy = en.notFound;

export const metadata: Metadata = { metadataBase: new URL(APP_CONFIG.url), title: copy.title };

// Unmatched URLs carry no locale, so this page speaks English, like x-default.
export default function GlobalNotFound() {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="min-h-screen antialiased">
        <main className="flex h-dvh flex-col items-center justify-center gap-2 p-4 text-center">
          <h1 className="text-2xl font-semibold">{copy.title}</h1>
          <p className="text-muted-foreground">{copy.text}</p>
          <Button asChild variant="outline" className="h-11 px-4">
            <a href="/">{copy.back}</a>
          </Button>
        </main>
      </body>
    </html>
  );
}
