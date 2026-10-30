import { DownloadPage } from "./_components/download-page";
import { LegalSections } from "./_components/legal-sections";
import { HOME, pageMetadata } from "./_content/landings";

export const metadata = pageMetadata(HOME);

export default function Home() {
  return (
    <DownloadPage
      content={HOME}
      title={
        <>
          Baixe vídeos de qualquer rede, <span className="text-primary">num lugar só.</span>
        </>
      }
    >
      <LegalSections />
    </DownloadPage>
  );
}
