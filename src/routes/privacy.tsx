import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ property: "og:url", content: "https://nirogi-healthai.lovable.app/privacy" }, { title: "Privacy Policy · Nirogi" }, { name: "description", content: "How Nirogi protects your private health data." }], links: [{ rel: "canonical", href: "https://nirogi-healthai.lovable.app/privacy" }] }),
  component: () => (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Link to="/" className="text-sm text-primary underline">← Back home</Link>
        <h1 className="mt-4 font-display text-4xl font-bold">Privacy Policy</h1>
        <div className="mt-8 space-y-4 text-muted-foreground [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground">
          <p>Your health is personal, and so is your data. This policy explains what we store and how we protect it.</p>
          <h2>What we collect</h2>
          <p>The profile details you choose to enter (such as age, weight, conditions and medicines), prescriptions you upload, and the results of tools you run. We use Google sign-in only to create your secure account.</p>
          <h2>How it's protected</h2>
          <p>Your data is stored in our secure cloud database with row-level security, meaning each record is locked to your own account. Prescriptions are kept in a private, per-user storage area. No other user can access your information.</p>
          <h2>How it's used</h2>
          <p>Your profile is used solely to personalize the AI tools you run. We do not sell your data or share it with advertisers.</p>
          <h2>Your control</h2>
          <p>You can update your profile at any time from your dashboard. To delete your account and data, contact us.</p>
        </div>
      </div>
    </SiteLayout>
  ),
});
