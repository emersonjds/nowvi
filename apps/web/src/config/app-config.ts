export const APP_CONFIG: { name: string; url: string; profiles: string[] } = {
  name: "Nowvi",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  // Organization.sameAs: add a profile URL only once the profile is live (SEO-22).
  profiles: [],
};
