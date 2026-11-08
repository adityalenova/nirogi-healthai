import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cookies")({
  head: () => ({ meta: [{ property: "og:url", content: "https://nirogi-healthai.lovable.app/cookies" }, { title: "Cookie Policy · Nirogi" }, { name: "description", content: "How Nirogi uses cookies." }], links: [{ rel: "canonical", href: "https://nirogi-healthai.lovable.app/cookies" }] }),
  component: () => (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Link to="/" className="text-sm text-primary underline">← Back home</Link>
        <h1 className="mt-4 font-display text-4xl font-bold">Cookie Policy</h1>
        <div className="mt-8 space-y-4 text-muted-foreground [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground">
          <p>Cookies are small files that help Nirogi work and improve.</p>
          <h2>Essential cookies</h2>
          <p>These keep you signed in and keep the site secure. They are always on because the service cannot function without them.</p>
          <h2>Analytics cookies</h2>
          <p>With your consent, these help us understand how the site is used so we can make it better. You can opt out at any time.</p>
          <h2>Manage your choices</h2>
          <p>You can change your preferences whenever you like.</p>
          <Button onClick={() => window.dispatchEvent(new CustomEvent("open-cookie-settings"))} className="mt-2">
            Open cookie settings
          </Button>
        </div>
      </div>
    </SiteLayout>
  ),
});
