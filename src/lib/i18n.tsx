import { useCallback, type ReactNode } from "react";

/**
 * Nirogi is English-only. This module keeps the tiny `t(key, fallback)` helper
 * that pages already use so copy stays centralised, but there is no longer a
 * second language or a language switcher.
 */
export type Lang = "en";

const DICT: Record<string, string> = {
  "nav.tools": "Tools",
  "nav.how": "How it works",
  "nav.updates": "Updates",
  "nav.sources": "Data sources",
  "nav.faq": "FAQ",
  "nav.signin": "Sign in",
  "nav.dashboard": "Dashboard",
  "nav.history": "History",
  "nav.signout": "Sign out",
  "common.sos": "SOS",

  "report.copy": "Copy",
  "report.copied": "Report copied to clipboard",
  "report.download": "Download PDF",
  "report.whatsapp": "Share on WhatsApp",
  "report.share_note": "WhatsApp shares the text report. Download the PDF to attach a file.",

  "dash.health_score": "Health Score",
  "dash.family": "Family",
  "dash.reminders": "Medicine Reminders",
  "dash.title": "Your health profile",
  "dash.subtitle": "Keep this updated — every AI tool reads it to personalize results.",
  "dash.basics": "Basics",
  "dash.full_name": "Full name",
  "dash.age": "Age",
  "dash.gender": "Gender",
  "dash.blood_group": "Blood group",
  "dash.weight": "Weight (kg)",
  "dash.height": "Height (cm)",
  "dash.medical_history": "Medical history",
  "dash.conditions": "Health conditions",
  "dash.medicines": "Current medicines",
  "dash.family_history": "Family history",
  "dash.surgeries": "Recent surgeries",
  "dash.allergies": "Allergies",
  "dash.saving": "Saving…",
  "dash.save_profile": "Save profile",
  "dash.your_bmi": "Your BMI",
  "dash.add_wh": "Add weight & height",
  "dash.prescription_reader": "Prescription reader",
  "dash.reading": "Reading…",
  "dash.upload_prescription": "Upload prescription",
  "dash.jump_tool": "Jump into a tool",
  "dash.focus_areas": "Where to focus",
  "dash.add_member": "Add member",
  "dash.edit_member": "Edit member",
  "dash.you": "You",
  "dash.relation": "Relation",
  "dash.taken": "Taken",
  "dash.take": "Take",
  "common.add": "Add",
  "common.save": "Save",

  "sos.title": "Emergency SOS",
  "sos.numbers": "Emergency numbers",
  "sos.hospitals": "Nearest hospitals",
};

/** Kept so existing providers in the tree keep working; renders children only. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useI18n() {
  const t = useCallback((key: string, fallback?: string) => DICT[key] ?? fallback ?? key, []);
  return { lang: "en" as Lang, setLang: () => {}, t };
}
