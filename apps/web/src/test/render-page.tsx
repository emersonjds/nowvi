import { render } from "@testing-library/react";

import { DownloadPage } from "@/app/_components/download-page";
import { LegalSections } from "@/app/_components/legal-sections";
import { DictionaryProvider } from "@/i18n/client";
import type { Locale } from "@/i18n/config";
import { getDictionary, type PageKey } from "@/i18n/dictionary";

/** The page as `app/[lang]/page.tsx` and its layout compose it. */
export const renderPage = (locale: Locale = "pt-br", page: PageKey = "home") => {
  const dictionary = getDictionary(locale);
  return render(
    <DictionaryProvider value={dictionary.client}>
      <DownloadPage locale={locale} page={page}>
        <LegalSections legal={dictionary.legal} />
      </DownloadPage>
    </DictionaryProvider>,
  );
};
