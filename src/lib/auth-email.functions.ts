import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Email + password authentication whose confirmation / reset / welcome mails
 * are delivered through Resend with Nirogi branding, instead of the default
 * provider emails.
 */

const EmailPassword = z.object({
  email: z.string().email().max(200),
  password: z.string().min(6).max(200),
  full_name: z.string().max(120).optional().nullable(),
  redirect_to: z.string().url().max(400),
});

/** Creates the account and emails a branded confirmation link. */
export const signUpWithEmail = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => EmailPassword.parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendEmail, brandedEmail } = await import("@/lib/email.server");

    const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email: data.email,
      password: data.password,
      options: { redirectTo: data.redirect_to, data: data.full_name ? { full_name: data.full_name } : undefined },
    });

    if (error) {
      const msg = error.message || "";
      if (/already registered|already been registered|exists/i.test(msg)) throw new Error("ALREADY_REGISTERED");
      throw new Error(msg || "SIGNUP_FAILED");
    }

    const actionLink = link?.properties?.action_link;
    if (!actionLink) throw new Error("SIGNUP_FAILED");

    await sendEmail({
      to: data.email,
      subject: "Confirm your Nirogi account",
      html: brandedEmail({
        heading: "Confirm your email",
        intro: `Welcome to Nirogi${data.full_name ? `, ${data.full_name}` : ""}. Confirm your email address to unlock your AI health tools, personal dashboard and family circle.`,
        ctaLabel: "Confirm my email",
        ctaUrl: actionLink,
        footnote: "This link expires in 24 hours. If you did not create a Nirogi account, you can safely ignore this email.",
      }),
    });

    return { ok: true as const };
  });

/** Emails a branded password reset link. Always reports success (no account enumeration). */
export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ email: z.string().email().max(200), redirect_to: z.string().url().max(400) }).parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendEmail, brandedEmail } = await import("@/lib/email.server");

    const { data: link } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: data.email,
      options: { redirectTo: data.redirect_to },
    });

    const actionLink = link?.properties?.action_link;
    if (actionLink) {
      await sendEmail({
        to: data.email,
        subject: "Reset your Nirogi password",
        html: brandedEmail({
          heading: "Reset your password",
          intro: "We received a request to reset the password for your Nirogi account. Choose a new password using the button below.",
          ctaLabel: "Set a new password",
          ctaUrl: actionLink,
          footnote: "This link expires in 1 hour. If you did not request a reset, ignore this email — your password stays unchanged.",
        }),
      }).catch((e) => console.error("reset email failed", e));
    }

    return { ok: true as const };
  });

/** Re-sends the confirmation email for an unconfirmed account. */
export const resendConfirmationEmail = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ email: z.string().email().max(200), redirect_to: z.string().url().max(400) }).parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendEmail, brandedEmail } = await import("@/lib/email.server");

    const { data: link } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email: data.email,
      password: crypto.randomUUID(),
      options: { redirectTo: data.redirect_to },
    });
    const actionLink = link?.properties?.action_link;
    if (actionLink) {
      await sendEmail({
        to: data.email,
        subject: "Your Nirogi confirmation link",
        html: brandedEmail({
          heading: "Confirm your email",
          intro: "Here is a fresh link to confirm your Nirogi account.",
          ctaLabel: "Confirm my email",
          ctaUrl: actionLink,
        }),
      }).catch((e) => console.error("confirmation email failed", e));
    }
    return { ok: true as const };
  });
