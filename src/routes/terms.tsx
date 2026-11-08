import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ property: "og:url", content: "https://nirogi-healthai.lovable.app/terms" }, { title: "Terms of Service · Nirogi" }, { name: "description", content: "The terms governing your use of Nirogi's AI health tools." }], links: [{ rel: "canonical", href: "https://nirogi-healthai.lovable.app/terms" }] }),
  component: () => (
    <SiteLayout>
      <LegalShell title="Terms of Service">
        <p>By using Nirogi you agree to these terms. Nirogi provides AI-generated health information for educational purposes only.</p>
        <h2>Not medical advice</h2>
        <p>Nirogi is not a doctor, hospital or licensed medical provider. Nothing on this platform constitutes a diagnosis, prescription or treatment. Always consult a qualified professional before making health decisions, and call emergency services in an emergency.</p>
        <h2>Acceptable use</h2>
        <p>You agree to provide accurate information and to use the tools for your own personal, non-commercial health awareness. Do not misuse the service or attempt to access other users' data.</p>
        <h2>No warranty</h2>
        <p>AI outputs may be incomplete or incorrect. Nirogi is provided "as is" without warranties of any kind, and we are not liable for decisions made based on the information provided.</p>
        <h2>Changes</h2>
        <p>We may update these terms over time. Continued use means you accept the updated terms.</p>
      </LegalShell>
    </SiteLayout>
  ),
});

function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link to="/" className="text-sm text-primary underline">← Back home</Link>
      <h1 className="mt-4 font-display text-4xl font-bold">{title}</h1>
      <div className="prose-nirogi mt-8 space-y-4 text-muted-foreground [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground">
        {children}
      </div>
    </div>
  );
}
