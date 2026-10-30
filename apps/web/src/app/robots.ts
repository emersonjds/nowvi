import type { MetadataRoute } from "next";

import { APP_CONFIG } from "@/config/app-config";

// Source: github.com/ai-robots-txt/ai.robots.txt
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
  "meta-externalagent",
  "Bytespider",
  "CCBot",
  "Amazonbot",
  "DuckAssistBot",
  "MistralAI-User",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: ["*", ...AI_BOTS].map((userAgent) => ({ userAgent, allow: "/" })),
    sitemap: new URL("/sitemap.xml", APP_CONFIG.url).href,
  };
}
