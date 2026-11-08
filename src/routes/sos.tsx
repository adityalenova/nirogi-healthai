import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Siren, Phone, MapPin, Navigation, Share2, ArrowLeft, HeartPulse, Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/sos")({
  head: () => ({
    meta: [{ property: "og:url", content: "https://nirogi-healthai.lovable.app/sos" }, 
      { title: "Emergency SOS · Nirogi" },
      { name: "description", content: "Fast access to India emergency numbers, nearest hospitals and your medical info for first responders." },
    ], links: [{ rel: "canonical", href: "https://nirogi-healthai.lovable.app/sos" }],
  }),
  component: SosPage,
});

const NUMBERS: { label: string; number: string; tel: string; use: string }[] = [
  { label: "National Ambulance", number: "108", tel: "108", use: "Medical emergency, accident, heart attack" },
  { label: "National Emergency", number: "112", tel: "112", use: "Any emergency — connects to nearest service" },
  { label: "Police Emergency", number: "100", tel: "100", use: "Safety emergency, violence, threat" },
  { label: "Women Helpline", number: "181", tel: "181", use: "Women in medical or safety emergency" },
  { label: "Poison Control", number: "1800-116-117", tel: "1800116117", use: "Medicine overdose, poisoning" },
  { label: "NIMHANS Mental Health", number: "080-46110007", tel: "08046110007", use: "Mental health crisis" },
];

type Profile = {
  full_name: string | null;
  blood_group: string | null;
  health_conditions: string | null;
  allergies: string | null;
  current_medicines: string | null;
  emergency_contact: string | null;
};

function SosPage() {
  const { t } = useI18n();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        if (mounted) setLoadingProfile(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("full_name, blood_group, health_conditions, allergies, current_medicines, emergency_contact")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (mounted) {
        setProfile(data as Profile | null);
        setLoadingProfile(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const locate = (then: (lat: number, lng: number) => void) => {
    if (!navigator.geolocation) {
      window.open("https://www.google.com/maps/search/hospitals+near+me", "_blank");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        then(latitude, longitude);
      },
      () => {
        setLocating(false);
        then(NaN, NaN);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const findHospitals = () =>
    locate((lat, lng) => {
      const url = Number.isFinite(lat)
        ? `https://www.google.com/maps/search/hospitals/@${lat},${lng},14z`
        : "https://www.google.com/maps/search/hospitals+near+me";
      window.open(url, "_blank");
    });

  const shareLocation = () =>
    locate((lat, lng) => {
      const mapLink = Number.isFinite(lat)
        ? `https://maps.google.com/?q=${lat},${lng}`
        : "my location is unavailable";
      const msg = `EMERGENCY — I need help. My location: ${mapLink}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    });

  return (
    <SiteLayout>
      <div className="border-b border-destructive/30 bg-destructive/10">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Back
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-destructive text-destructive-foreground shadow-pulse">
              <Siren className="size-7 animate-heartbeat" />
            </span>
            <div>
              <h1 className="font-display text-3xl font-bold text-destructive">{t("sos.title", "Emergency SOS")}</h1>
              <p className="text-sm text-muted-foreground">{t("sos.subtitle", "Get help fast. Tap a number to call.")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6">
        {/* Emergency numbers */}
        <section>
          <h2 className="font-display text-lg font-semibold">{t("sos.numbers", "Emergency numbers")}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {NUMBERS.map((n) => (
              <a
                key={n.label}
                href={`tel:${n.tel}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-destructive/30 bg-card p-4 shadow-card transition-colors hover:bg-destructive/5"
              >
                <div className="min-w-0">
                  <p className="font-display text-base font-bold">{n.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{n.use}</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-destructive px-3 py-2 text-sm font-bold text-destructive-foreground">
                  <Phone className="size-4" /> {n.number}
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Hospitals + location */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <MapPin className="size-5 text-primary" /> {t("sos.hospitals", "Nearest hospitals")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We use your location to open hospitals near you on the map, or to share your exact position with someone who can help.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={findHospitals} disabled={locating}>
              {locating ? <Loader2 className="size-4 animate-spin" /> : <Navigation className="size-4" />}
              {t("sos.find_hospitals", "Find hospitals near me")}
            </Button>
            <Button variant="outline" onClick={shareLocation} disabled={locating}>
              <Share2 className="size-4" /> {t("sos.share_location", "Share my location")}
            </Button>
          </div>
          {coords && (
            <p className="mt-3 text-xs text-muted-foreground">
              Your location: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </p>
          )}
        </section>

        {/* Medical info */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <HeartPulse className="size-5 text-pulse" /> {t("sos.your_info", "Your medical info for paramedics")}
          </h2>
          {loadingProfile ? (
            <div className="mt-4 flex justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
          ) : profile ? (
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <Info label="Name" value={profile.full_name} />
              <Info label="Blood group" value={profile.blood_group} />
              <Info label="Conditions" value={profile.health_conditions} />
              <Info label="Allergies" value={profile.allergies} />
              <Info label="Current medicines" value={profile.current_medicines} />
              <Info label="Emergency contact" value={profile.emergency_contact} />
            </dl>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              <Link to="/auth" className="text-primary underline">Sign in</Link> and complete your profile so first responders can see your blood group, conditions and allergies here.
            </p>
          )}
        </section>

        <p className="rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
          {t("sos.disclaimer", "Nirogi connects you to public emergency services and is not its own emergency responder.")}
        </p>
      </div>
    </SiteLayout>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground/85">{value?.trim() || "—"}</dd>
    </div>
  );
}
