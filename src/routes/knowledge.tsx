import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, BookOpen, ExternalLink, ChevronDown } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Input } from "@/components/ui/input";
import { ARTICLES, KNOWLEDGE_CATEGORIES, INSTITUTIONS } from "@/lib/knowledge";

export const Route = createFileRoute("/knowledge")({
  head: () => ({
    meta: [
      { title: "Nirogi Knowledge Library · Skills & Knowledge" },
      { name: "description", content: "Curated health research from the world's top 50 medical institutions — the science behind every Nirogi AI recommendation." },
      { property: "og:title", content: "Nirogi Knowledge Library" },
      { property: "og:description", content: "Search curated health articles from Harvard, WHO, Mayo Clinic, AIIMS, ICMR and more." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: KnowledgePage,
});

function KnowledgePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [openId, setOpenId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ARTICLES.filter(
      (a) =>
        (category === "All" || a.category === category) &&
        (q === "" ||
          a.title.toLowerCase().includes(q) ||
          a.institution.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          a.tools.join(" ").toLowerCase().includes(q)),
    );
  }, [query, category]);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BookOpen className="size-6" />
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Nirogi Knowledge Library</h1>
            <p className="text-sm text-muted-foreground">
              Curated health research from the world&apos;s top {INSTITUTIONS.length} medical institutions. The science behind every Nirogi AI recommendation.
            </p>
          </div>
        </div>

        <div className="relative mt-6">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, institution, topic or tool…"
            className="pl-9"
            aria-label="Search knowledge library"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {KNOWLEDGE_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                category === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">{filtered.length} articles</p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {filtered.map((a) => {
            const open = openId === a.id;
            return (
              <article key={a.id} className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">{a.institution}</span>
                  <span className="text-[11px] font-medium text-muted-foreground">{a.year}</span>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">{a.category}</span>
                </div>
                <h2 className="mt-3 font-display text-base font-semibold leading-snug">{a.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{a.summary}</p>

                {open && (
                  <ul className="mt-3 space-y-1.5 rounded-xl bg-muted/50 p-3 text-sm">
                    {a.findings.map((f) => (
                      <li key={f} className="flex gap-2">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}

                <p className="mt-3 text-[11px] text-muted-foreground">Used by: {a.tools.join(", ")}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => setOpenId(open ? null : a.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                  >
                    {open ? "Hide summary" : "Read summary"}
                    <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                  >
                    Open source <ExternalLink className="size-3.5" />
                  </a>
                </div>
              </article>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p className="mt-10 text-center text-sm text-muted-foreground">No articles match that search.</p>
        )}
      </div>
    </SiteLayout>
  );
}
