import { TIPS } from "@/data/plan";
import { ui } from "@/lib/ui";

export function TipsSection() {
  return (
    <section id="tips">
      <div className={ui.sectionHead}>
        <h2 className={ui.sectionTitle}>8. Cómo medir Speaking y Writing sin evaluador</h2>
      </div>
      <ul className="grid gap-2.5 list-none p-0">
        {TIPS.map((tip) => (
          <li key={tip.title} className="bg-paper-raised border border-line rounded-lg px-4 py-3 text-sm text-ink-soft">
            <strong className="text-ink">{tip.title}</strong> {tip.body}
          </li>
        ))}
      </ul>
    </section>
  );
}
