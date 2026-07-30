import { RHYTHM_DAYS, RHYTHM_HOUR_BLOCKS } from "@/data/plan";
import { ui } from "@/lib/ui";

export function RhythmSection() {
  return (
    <section id="rhythm">
      <div className={ui.sectionHead}>
        <h2 className={ui.sectionTitle}>6. Tu semana repetible</h2>
        <span className="text-ink-soft text-sm">El contenido rota según el mes, la estructura no cambia</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-7 gap-2.5">
        {RHYTHM_DAYS.map((day) => (
          <div
            key={day.name}
            className={`bg-paper-raised border border-line rounded-lg p-3 min-h-[100px] ${day.rest ? "opacity-70" : ""}`}
          >
            <div className="text-[0.66rem] uppercase tracking-wide text-ink-soft">{day.name}</div>
            <div className="text-[0.8rem] font-semibold mt-1.5">{day.task}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3.5 flex-wrap mt-4">
        {RHYTHM_HOUR_BLOCKS.map((block) => (
          <div key={block.title} className="flex-1 min-w-[200px] bg-paper border border-line rounded-lg p-3.5 px-4">
            <h4 className="text-[0.85rem] font-semibold mb-2">{block.title}</h4>
            <ul className="m-0 pl-4.5 text-[0.84rem] text-ink-soft space-y-1">
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
