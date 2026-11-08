import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/nirogi-logo.png";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [{ property: "og:url", content: "https://nirogi-healthai.lovable.app/reset-password" }, 
      { title: "Set a new password · Nirogi" },
      { name: "description", content: "Choose a new password for your Nirogi account." },
      { property: "og:title", content: "Set a new password · Nirogi" },
      { property: "og:description", content: "Choose a new password for your Nirogi account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ], links: [{ rel: "canonical", href: "https://nirogi-healthai.lovable.app/reset-password" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Supabase puts the recovery session in the URL hash; it is picked up by
    // the client automatically, we just wait for it to land.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Use at least 8 characters.");
    if (password !== confirm) return toast.error("Both passwords must match.");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. You're signed in.");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update your password. Request a new link.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-mesh px-4">
      <div className="absolute inset-0 bg-gradient-hero" aria-hidden />
      <Link to="/auth" className="absolute left-5 top-5 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Sign in
      </Link>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative w-full max-w-md rounded-3xl border border-border bg-card/90 p-8 shadow-elegant backdrop-blur-xl"
      >
        <div className="flex flex-col items-center text-center">
          <img src={logo} alt="Nirogi" width={56} height={56} className="h-14 w-14" />
          <h1 className="mt-4 font-display text-2xl font-bold">Set a new password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {ready ? "Choose a strong password you don't use anywhere else." : "Opening your secure reset link…"}
          </p>
        </div>

        <form className="mt-6 space-y-3" onSubmit={submit}>
          <Input type="password" autoComplete="new-password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input type="password" autoComplete="new-password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <Button type="submit" size="lg" className="w-full" disabled={busy || !ready}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
            Update password
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
