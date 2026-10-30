import { CookieBanner } from "./_components/cookie-banner";
import { Downloader } from "./_components/downloader";
import { Faq } from "./_components/faq";
import { Hero } from "./_components/hero";
import { HowItWorks } from "./_components/how-it-works";
import { SiteFooter } from "./_components/site-footer";
import { SiteHeader } from "./_components/site-header";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-16 px-4 pt-8 pb-16 md:pt-12">
        <Downloader hero={<Hero />} />
        <HowItWorks />
        <Faq />
      </main>
      <SiteFooter />
      <CookieBanner />
    </>
  );
}
