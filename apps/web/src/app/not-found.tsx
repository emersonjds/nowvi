import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ptBr } from "@/i18n/dictionaries/pt-br";

export default function NotFound() {
  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-2 p-4 text-center">
      <h1 className="text-2xl font-semibold">{ptBr.notFound.title}</h1>
      <p className="text-muted-foreground">{ptBr.notFound.text}</p>
      <Button asChild variant="outline" className="h-11 px-4">
        <Link href="/">{ptBr.notFound.back}</Link>
      </Button>
    </main>
  );
}
