export const ui = {
  btn: "text-sm px-3 py-1.5 rounded-md border border-line bg-paper-raised text-ink hover:border-accent transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
  btnSmall:
    "text-xs px-2.5 py-1 rounded-md border border-line bg-paper-raised text-ink hover:border-accent transition-colors cursor-pointer",
  btnPrimary:
    "text-sm px-4 py-2 rounded-md border border-accent bg-accent text-accent-contrast hover:opacity-90 transition-opacity cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed",
  linkDanger: "text-sm text-speaking underline decoration-speaking/40 hover:decoration-speaking cursor-pointer",
  linkAccent: "text-sm text-accent underline decoration-accent/40 hover:decoration-accent cursor-pointer",
  card: "bg-paper-raised border border-line rounded-xl p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_14px_rgba(0,0,0,0.05)]",
  input:
    "rounded-md border border-line bg-paper text-ink px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-accent",
  label: "text-xs uppercase tracking-wide text-ink-soft",
  sectionHead: "flex items-baseline justify-between gap-3 flex-wrap mb-3.5",
  sectionTitle: "text-xl font-semibold",
} as const;

const SKILL_TEXT_CLASS: Record<string, string> = {
  r: "text-reading",
  l: "text-listening",
  s: "text-speaking",
  w: "text-writing",
  g: "text-accent-soft",
};

const SKILL_BORDER_CLASS: Record<string, string> = {
  r: "border-l-reading",
  l: "border-l-listening",
  s: "border-l-speaking",
  w: "border-l-writing",
  g: "border-l-accent-soft",
  mix: "border-l-ink-soft",
};

export function skillTextClass(skill: string): string {
  return SKILL_TEXT_CLASS[skill] ?? "text-ink-soft";
}

export function skillBorderClass(skill: string): string {
  return SKILL_BORDER_CLASS[skill] ?? "border-l-ink-soft";
}
