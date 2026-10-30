import type { MetadataRoute } from "next";

import { APP_CONFIG } from "@/config/app-config";
import { ptBr } from "@/i18n/dictionaries/pt-br";

import { LANDING_IDS, pagePath } from "./_content/landings";

export default function sitemap(): MetadataRoute.Sitemap {
  return (["home", ...LANDING_IDS] as const).map((page) => ({
    url: new URL(pagePath(ptBr, page), APP_CONFIG.url).href,
  }));
}
