import { ptBr } from "@/i18n/dictionaries/pt-br";

import { DownloadPage } from "./_components/download-page";
import { LegalSections } from "./_components/legal-sections";
import { pageMetadata } from "./_content/landings";

export const metadata = pageMetadata(ptBr, "home");

export default function Home() {
  return (
    <DownloadPage dictionary={ptBr} page="home">
      <LegalSections legal={ptBr.legal} />
    </DownloadPage>
  );
}
