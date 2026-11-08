import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Newspaper,
  UserPlus,
  MousePointerClick,
  Activity,
  ShieldCheck,
  Globe,
  GraduationCap,
  FlaskConical,
  BookOpen,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Hero } from "@/components/home/Hero";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TOOLS } from "@/lib/tools";
import { getUpdates } from "@/lib/updates.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nirogi — Free AI Healthcare: Catch It Before It's Too Late" },
      {
        name: "description",
        content:
          "Nine free AI health tools: check medicines, scan skin, read meals, assess cancer, diabetes and heart risk, and verify medicines.",
      },
      { property: "og:url", content: "https://nirogi-healthai.lovable.app/" },
      { property: "og:title", content: "Nirogi — Free AI Healthcare" },
      {
        property: "og:description",
        content: "Nine AI tools for free preventive healthcare. Catch it before it's too late.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://nirogi-healthai.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify([
          { "@context": "https://schema.org", "@type": "Organization", name: "Nirogi", url: "https://nirogi-healthai.lovable.app/", description: "Free AI preventive healthcare tools." },
          { "@context": "https://schema.org", "@type": "WebSite", name: "NIROGI.AI", url: "https://nirogi-healthai.lovable.app/" },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          },
        ]),
      },
    ],
  }),
  component: HomePage,
});

const accentRing: Record<string, string> = {
  primary: "text-primary bg-primary/10",
  pulse: "text-pulse bg-pulse/10",
  success: "text-success bg-success/10",
  warning: "text-warning bg-warning/10",
};

const STATS = [
  { value: "9", label: "AI health tools" },
  { value: "24/7", label: "Always available" },
  { value: "₹0", label: "Free to use" },
  { value: "100%", label: "Private to you" },
];

const SOURCES = [
  { name: "World Health Organization", note: "Global disease & prevention guidelines", icon: Globe },
  { name: "Harvard Medical research", note: "Peer-reviewed clinical studies", icon: GraduationCap },
  { name: "CDSCO (India)", note: "Drug standards & recall references", icon: ShieldCheck },
  { name: "Peer-reviewed journals", note: "Oncology, dermatology & nutrition science", icon: FlaskConical },
  { name: "Public health datasets", note: "ICMR & national health surveys", icon: BookOpen },
  { name: "Clinical pharmacology refs", note: "Dosage, interaction & safety data", icon: Activity },
];

const FAQS = [
  {
    q: "Is Nirogi free?",
    a: "Yes. All nine AI tools are free to use. Nirogi was built to make basic preventive healthcare accessible to everyone, especially where doctors are hard to reach.",
  },
  {
    q: "Can Nirogi diagnose my disease?",
    a: "No. Nirogi gives educational guidance and early warnings only. It is not a doctor and cannot diagnose any condition. Always confirm with a qualified medical professional.",
  },
  {
    q: "Is my health data private?",
    a: "Completely. Your profile, prescriptions and tool history are stored privately and are only ever visible to your own account, protected by row-level security.",
  },
  {
    q: "How accurate are the AI tools?",
    a: "They use modern medical AI trained on trusted sources, but estimates — especially from photos — can be wrong. Treat results as a helpful second opinion, not a final answer.",
  },
  {
    q: "Do I need an account?",
    a: "You can browse freely. To run a tool the AI reads your saved health profile, so a quick Google sign-in keeps your results personalized and private.",
  },
];

function HomePage() {
  const { data } = useQuery({
    queryKey: ["updates"],
    queryFn: () => getUpdates(),
  });
  const updates = data?.updates ?? [];

  return (
    <SiteLayout>
      <Hero />

      {/* Trust strip */}
      <section className="border-y border-border/60 bg-card/40">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-4 sm:px-6">
          {STATS.map((s, i) => (
            <Reveal key={s.label} i={i} className="text-center">
              <div className="font-display text-3xl font-extrabold text-gradient-primary sm:text-4xl">
                {s.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Tools */}
      <section id="tools" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Nine AI tools, one mission</h2>
          <p className="mt-3 text-muted-foreground">
            Each tool reads your private health profile to give guidance tailored to you.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <Reveal key={tool.slug} i={i % 3}>
                <Link
                  to="/tools/$tool"
                  params={{ tool: tool.slug }}
                  className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant"
                >
                  <span className={cn("inline-flex size-12 items-center justify-center rounded-xl", accentRing[tool.accent])}>
                    <Icon className="size-6" />
                  </span>
                  <h3 className="mt-4 font-display text-xl font-semibold">{tool.name}</h3>
                  <p className="text-sm font-medium text-primary">{tool.tagline}</p>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{tool.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground">
                    Open tool
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 bg-card/40 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">How Nirogi works</h2>
            <p className="mt-3 text-muted-foreground">Three steps from worry to clarity.</p>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: UserPlus, title: "Build your profile", text: "Add your health details once — weight, conditions, medicines, history. BMI is calculated for you." },
              { icon: MousePointerClick, title: "Choose a tool", text: "Pick from nine tools — type, speak or snap a photo depending on what you need to check." },
              { icon: Activity, title: "Get AI insight", text: "Receive a clear, personalized report with warnings, recommendations and which specialist to see." },
            ].map((step, i) => (
              <Reveal key={step.title} i={i}>
                <div className="relative h-full rounded-2xl border border-border bg-background p-6 shadow-card">
                  <span className="absolute -top-3 left-6 rounded-full bg-gradient-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                    Step {i + 1}
                  </span>
                  <step.icon className="mt-3 size-8 text-primary" />
                  <h3 className="mt-4 font-display text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Latest updates */}
      <section id="updates" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
              <Newspaper className="size-4" /> Latest updates
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">What's new at Nirogi</h2>
          </div>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {updates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No updates yet — check back soon.</p>
          ) : (
            updates.map((u, i) => (
              <Reveal key={u.id} i={i % 2}>
                <article className="h-full rounded-2xl border border-border bg-card p-6 shadow-card">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {u.category && (
                      <span className="rounded-full bg-accent px-2.5 py-0.5 font-medium text-accent-foreground">
                        {u.category}
                      </span>
                    )}
                    <time>{new Date(u.published_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</time>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-semibold">{u.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{u.body}</p>
                </article>
              </Reveal>
            ))
          )}
        </div>
      </section>

      {/* Data sources */}
      <section id="sources" className="scroll-mt-20 bg-card/40 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Built on trusted science</h2>
            <p className="mt-3 text-muted-foreground">
              Nirogi's guidance draws on globally respected medical research and public-health data.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SOURCES.map((s, i) => (
              <Reveal key={s.name} i={i % 3}>
                <div className="flex h-full items-start gap-4 rounded-2xl border border-border bg-background p-6 shadow-card">
                  <span className="rounded-xl bg-primary/10 p-2.5 text-primary">
                    <s.icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-semibold">{s.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{s.note}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6">
        <Reveal className="text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Frequently asked questions</h2>
        </Reveal>
        <Reveal className="mt-10">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left font-medium">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </section>

      {/* Mission band */}
      <section className="px-4 pb-20 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-primary p-10 text-center shadow-elegant sm:p-16"
        >
          <h2 className="font-display text-3xl font-bold text-primary-foreground sm:text-4xl">
            Health that doesn't wait for you to fall sick
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/90">
            Most diseases whisper before they shout. Nirogi helps you hear the whisper — early, free, and
            private. Start with your profile and let prevention do the rest.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-8">
            <Link to="/auth">
              Get started free <ArrowRight className="size-4" />
            </Link>
          </Button>
        </motion.div>
      </section>
    </SiteLayout>
  );
}
