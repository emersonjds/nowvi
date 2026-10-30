import type { MetadataRoute } from "next";

import { APP_CONFIG } from "@/config/app-config";

import { HOME, LANDINGS } from "./_content/landings";

export default function sitemap(): MetadataRoute.Sitemap {
  return [HOME, ...LANDINGS].map(({ path }) => ({ url: new URL(path, APP_CONFIG.url).href }));
}
