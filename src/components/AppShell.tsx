import { TopBar } from "@/components/TopBar";
import { PrizeCard } from "@/components/PrizeCard";
import { GoalCalculator } from "@/components/GoalCalculator";
import { StudyCalendar } from "@/components/StudyCalendar";
import { WeeklyPlanner } from "@/components/WeeklyPlanner";
import { PhaseSection } from "@/components/PhaseSection";
import { RhythmSection } from "@/components/RhythmSection";
import { ScoreTracker } from "@/components/ScoreTracker";
import { TipsSection } from "@/components/TipsSection";

const LEGEND = [
  { label: "Lectura", className: "bg-reading" },
  { label: "Listening", className: "bg-listening" },
  { label: "Speaking", className: "bg-speaking" },
  { label: "Writing", className: "bg-writing" },
  { label: "Gramática", className: "bg-accent-soft" },
];

export function AppShell() {
  return (
    <div>
      <TopBar />

      <div className="max-w-[1000px] mx-auto px-5 pb-20">
        <header className="pt-8 pb-2">
          <p className="text-ink-soft max-w-[62ch] text-base mt-2">
            Empieza la semana del <strong className="text-ink">3 de agosto de 2026</strong> y termina la semana del{" "}
            <strong className="text-ink">23 de noviembre de 2026</strong>. Todo lo que registres aquí — checkboxes,
            puntajes, calendario de ánimo, planning semanal — se guarda cifrado en este dispositivo.
          </p>
          <div className="flex gap-2.5 flex-wrap mt-4.5">
            {LEGEND.map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-1.5 text-[0.78rem] px-2.5 py-1 rounded-full bg-paper-raised border border-line"
              >
                <span className={`w-2 h-2 rounded-full ${item.className}`} />
                {item.label}
              </span>
            ))}
          </div>
        </header>

        <div className="flex flex-col gap-11">
          <PrizeCard />
          <GoalCalculator />
          <StudyCalendar />
          <WeeklyPlanner />
          <PhaseSection />
          <RhythmSection />
          <ScoreTracker />
          <TipsSection />
        </div>

        <footer className="mt-12 pt-4 border-t border-line text-xs text-ink-soft">
          Plan construido sobre: Curso &quot;New TOEFL iBT 2026 Enhanced: Modular System&quot; · Curso &quot;Emergency
          Course for the TOEFL (2026)&quot; · Libro &quot;TOEFL iBT Preparation Book 2025–2026&quot; ·
          &quot;The Official Guide to the TOEFL iBT Test, 7th Ed.&quot; — Todo se guarda cifrado solo en este
          dispositivo (sin nube todavía).
        </footer>
      </div>
    </div>
  );
}
