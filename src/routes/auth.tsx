import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { signUpWithEmail, requestPasswordReset, resendConfirmationEmail } from "@/lib/auth-email.functions";
import { motion } from "framer-motion";
import { HeartPulse, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import logo from "@/assets/nirogi-logo.png";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in · Nirogi" },
      { name: "description", content: "Sign in to Nirogi to access your private AI health tools and profile." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<"google" | "apple" | "email" | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const signUp = useServerFn(signUpWithEmail);
  const reset = useServerFn(requestPasswordReset);
  const resend = useServerFn(resendConfirmationEmail);

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/dashboard" });
    }
  }, [loading, user, navigate]);

  const signIn = async (provider: "google" | "apple") => {
    setBusy(provider);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result?.error) {
        toast.error("Sign-in failed. Please try again.");
        setBusy(null);
      }
    } catch {
      toast.error("Sign-in failed. Please try again.");
      setBusy(null);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-mesh px-4">
      <div className="absolute inset-0 bg-gradient-hero" aria-hidden />
      <Link
        to="/"
        className="absolute left-5 top-5 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md rounded-3xl border border-border bg-card/90 p-8 shadow-elegant backdrop-blur-xl"
      >
        <div className="flex flex-col items-center text-center">
          <img src={logo} alt="Nirogi" width={56} height={56} className="h-14 w-14" />
          <h1 className="mt-4 font-display text-2xl font-bold">Welcome to Nirogi</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to unlock your nine AI health tools and your private profile.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <Button onClick={() => signIn("google")} disabled={busy !== null} size="lg" className="w-full">
            <GoogleIcon />
            {busy === "google" ? "Connecting…" : "Continue with Google"}
          </Button>

          <Button
            onClick={() => signIn("apple")}
            disabled={busy !== null}
            size="lg"
            className="w-full bg-black text-white hover:bg-black/90"
          >
            <AppleIcon />
            {busy === "apple" ? "Connecting…" : "Continue with Apple"}
          </Button>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or use email <span className="h-px flex-1 bg-border" />
        </div>

        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!email || password.length < 6) {
              toast.error("Enter your email and a password of at least 6 characters.");
              return;
            }
            setBusy("email");
            try {
              if (mode === "signin") {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) {
                  if (/confirm/i.test(error.message)) {
                    await resend({ data: { email, redirect_to: `${window.location.origin}/dashboard` } }).catch(() => undefined);
                    toast.error("Please confirm your email first — we've sent you a fresh link.");
                    return;
                  }
                  throw error;
                }
                toast.success("Welcome back!");
              } else {
                await signUp({
                  data: {
                    email,
                    password,
                    full_name: fullName.trim() || null,
                    redirect_to: `${window.location.origin}/dashboard`,
                  },
                });
                toast.success("Check your inbox — we've emailed you a confirmation link.");
                setMode("signin");
              }
            } catch (err) {
              const msg = err instanceof Error ? err.message : "";
              if (msg.includes("ALREADY_REGISTERED")) toast.error("That email already has an account. Try signing in.");
              else if (msg.includes("EMAIL_NOT_CONFIGURED") || msg.includes("EMAIL_SEND_FAILED"))
                toast.error("We couldn't send the confirmation email. Please try again shortly.");
              else toast.error(msg || "Something went wrong. Please try again.");
            } finally {
              setBusy(null);
            }
          }}
        >
          {mode === "signup" && (
            <Input
              type="text"
              autoComplete="name"
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          )}
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" size="lg" variant="outline" className="w-full" disabled={busy !== null}>
            {busy === "email" ? "Please wait…" : mode === "signin" ? "Sign in with email" : "Create account"}
          </Button>
        </form>

        {mode === "signin" && (
          <p className="mt-3 text-center text-xs">
            <button
              type="button"
              className="text-muted-foreground underline hover:text-foreground"
              disabled={busy !== null}
              onClick={async () => {
                if (!email) return toast.error("Enter your email first, then tap reset.");
                setBusy("email");
                try {
                  await reset({ data: { email, redirect_to: `${window.location.origin}/reset-password` } });
                  toast.success("If that email has an account, a reset link is on its way.");
                } catch {
                  toast.error("Couldn't send the reset email. Please try again.");
                } finally {
                  setBusy(null);
                }
              }}
            >
              Forgot your password?
            </button>
          </p>
        )}

        <p className="mt-3 text-center text-xs text-muted-foreground">
          {mode === "signin" ? "New to Nirogi?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="font-semibold text-primary underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>

        <div className="mt-6 space-y-2 text-xs text-muted-foreground">
          <p className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-success" /> Your health data stays private to your account.
          </p>
          <p className="inline-flex items-center gap-1.5">
            <HeartPulse className="size-3.5 text-pulse" /> Free forever — built for accessible healthcare.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to our{" "}
          <Link to="/terms" className="underline">Terms</Link> and{" "}
          <Link to="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </motion.div>
    </div>
  );
}

/** Monochrome white Google "G" mark for use on a coloured button. */
function GoogleIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0 5.48 0 0 5.48 0 12.24s5.48 12.24 12.24 12.24c7.065 0 11.76-4.965 11.76-11.955 0-.803-.086-1.414-.191-2.024H12.24z" />
    </svg>
  );
}

/** White Apple logo for use on a black button. */
function AppleIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}
