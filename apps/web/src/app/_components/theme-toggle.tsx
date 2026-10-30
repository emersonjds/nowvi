"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { useDictionary } from "@/i18n/client";

export const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const copy = useDictionary().theme;

  return (
    <Button
      variant="ghost"
      className="size-11"
      aria-label={copy.toggle}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <MoonIcon className="size-5 dark:hidden" />
      <SunIcon className="hidden size-5 dark:block" />
    </Button>
  );
};
