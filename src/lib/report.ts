import {
  CHECKPOINTS,
  GOAL_SCORE,
  PHASES,
  PLAN_END_LABEL,
  PLAN_START_LABEL,
  RHYTHM_DAYS,
  RHYTHM_HOUR_BLOCKS,
  TIPS,
  TOTAL_WEEKS,
  WEEKLY_PLAN_DAYS,
} from "@/data/plan";
import { formatLong, formatShort, addDays } from "@/lib/date";
import { computeGoalSummary, computePrizeProgress, computeStreak, sumScores } from "@/lib/scoring";
import type { AppData } from "@/lib/types";

const SKILL_LABELS = ["Reading", "Listening", "Speaking", "Writing"] as const;

function todayStamp(): string {
  return new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });
}

function yesNo(value: boolean): string {
  return value ? "Sí" : "No";
}

function scoreTrackerRows(appData: AppData) {
  const goal = computeGoalSummary(appData.baseline);
  return CHECKPOINTS.map((cp) => {
    const entry = appData.tracker[cp.id];
    const total = sumScores(entry);
    const target = goal.checkpointTargets[cp.id];
    return {
      checkpoint: `${cp.name} (${cp.weekLabel})`,
      r: entry.r ?? "—",
      l: entry.l ?? "—",
      s: entry.s ?? "—",
      w: entry.w ?? "—",
      total: total ?? "—",
      target: target !== undefined ? Math.round(target) : "—",
      notes: entry.notes || "",
    };
  });
}

function studyLogRows(appData: AppData) {
  return Object.keys(appData.studyLog)
    .sort()
    .map((iso) => {
      const entry = appData.studyLog[iso];
      return {
        date: iso,
        dateLabel: formatLong(iso),
        studied: entry.studied === null ? "—" : yesNo(entry.studied),
        mood: entry.mood ?? "—",
        note: entry.note || "",
      };
    })
    .filter((row) => row.studied !== "—" || row.mood !== "—" || row.note !== "");
}

function parseISOLocal(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function weeklyPlanRows(appData: AppData) {
  const dayLabel = new Map(WEEKLY_PLAN_DAYS.map((d) => [d.code, d.label]));
  return Object.keys(appData.weeklyPlan)
    .sort()
    .flatMap((mondayISO) => {
      const week = appData.weeklyPlan[mondayISO];
      const monday = parseISOLocal(mondayISO);
      const sunday = addDays(monday, 6);
      const weekLabel = `${formatShort(monday)} – ${formatShort(sunday)}`;
      return WEEKLY_PLAN_DAYS.filter(({ code }) => week[code]?.text || week[code]?.done)
        .map(({ code }) => {
          const day = week[code]!;
          return { weekLabel, day: dayLabel.get(code) ?? code, done: yesNo(day.done), text: day.text || "" };
        });
    });
}

function phaseRows(appData: AppData) {
  return PHASES.flatMap((phase) =>
    phase.weeks.map((w) => ({
      phase: phase.title,
      week: w.week,
      focus: w.focus,
      hours: w.hours,
      done: yesNo(!!appData.weekDone[w.week]),
    }))
  );
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadFullPlanMarkdown(appData: AppData) {
  const goal = computeGoalSummary(appData.baseline);
  const prize = computePrizeProgress(appData.studyLog, appData.baseline, appData.tracker.cp2);
  const streak = computeStreak(appData.studyLog);
  const lines: string[] = [];

  lines.push("# Plan TOEFL iBT — Informe completo");
  lines.push("");
  lines.push(
    `Generado el ${todayStamp()}. Plan del ${PLAN_START_LABEL} al ${PLAN_END_LABEL} (${TOTAL_WEEKS} semanas). Meta: **${GOAL_SCORE}/120**.`
  );

  lines.push("");
  lines.push("## 1. Premio (tablet)");
  lines.push(`- Días de estudio registrados: ${prize.studiedDays}/${prize.threshold} (umbral) de ${prize.expectedDays} esperados`);
  lines.push(`- Constancia cumplida: ${yesNo(prize.consistencyMet)}`);
  lines.push(`- Progreso cumplido (Checkpoint 2 > diagnóstico): ${yesNo(prize.progressMet)}`);
  lines.push(`- Premio desbloqueado: ${yesNo(prize.unlocked)}`);
  lines.push(`- Racha actual de días estudiados: ${streak}`);

  lines.push("");
  lines.push("## 2. Metas");
  lines.push(
    `- Diagnóstico (Reading/Listening/Speaking/Writing): ${appData.baseline.r ?? "—"} / ${appData.baseline.l ?? "—"} / ${
      appData.baseline.s ?? "—"
    } / ${appData.baseline.w ?? "—"}`
  );
  lines.push(`- Diagnóstico total: ${goal.baselineTotal ?? "—"}`);
  lines.push(`- Puntos por subir hasta la meta: ${goal.baselineTotal !== null ? goal.gap : "—"}`);
  lines.push(`- Meta semana 4 (Checkpoint 1): ${goal.checkpointTargets.cp1 ?? "—"}`);
  lines.push(`- Meta semana 8 (Checkpoint 2): ${goal.checkpointTargets.cp2 ?? "—"}`);
  lines.push(`- Meta semana 12 (Checkpoint 3): ${goal.checkpointTargets.cp3 ?? "—"}`);
  lines.push(`- Meta semana 16: ${GOAL_SCORE}`);

  lines.push("");
  lines.push("## 3. Calendario de estudio y ánimo");
  const logRows = studyLogRows(appData);
  if (logRows.length === 0) {
    lines.push("_Sin registros aún._");
  } else {
    lines.push("| Fecha | Estudió | Ánimo (1-5) | Nota |");
    lines.push("|---|---|---|---|");
    for (const row of logRows) {
      lines.push(`| ${row.dateLabel} | ${row.studied} | ${row.mood} | ${row.note.replace(/\|/g, "/")} |`);
    }
  }

  lines.push("");
  lines.push("## 4. Planning semanal");
  const planRows = weeklyPlanRows(appData);
  if (planRows.length === 0) {
    lines.push("_Sin planes semanales registrados aún._");
  } else {
    lines.push("| Semana | Día | Hecho | Plan |");
    lines.push("|---|---|---|---|");
    for (const row of planRows) {
      lines.push(`| ${row.weekLabel} | ${row.day} | ${row.done} | ${row.text.replace(/\|/g, "/")} |`);
    }
  }

  lines.push("");
  lines.push("## 5. Las 17 semanas");
  lines.push("| Semana | Fase | Enfoque | Horas | Completada |");
  lines.push("|---|---|---|---|---|");
  for (const row of phaseRows(appData)) {
    lines.push(`| ${row.week} | ${row.phase} | ${row.focus} | ${row.hours} | ${row.done} |`);
  }

  lines.push("");
  lines.push("## 6. Ritmo semanal (referencia)");
  lines.push(RHYTHM_DAYS.map((d) => `${d.name}: ${d.task}`).join(" · "));
  for (const block of RHYTHM_HOUR_BLOCKS) {
    lines.push(`- **${block.title}**: ${block.items.join("; ")}`);
  }

  lines.push("");
  lines.push("## 7. Registro de progreso (checkpoints)");
  lines.push("| Checkpoint | Reading | Listening | Speaking | Writing | Total | Meta | Notas |");
  lines.push("|---|---|---|---|---|---|---|---|");
  for (const row of scoreTrackerRows(appData)) {
    lines.push(
      `| ${row.checkpoint} | ${row.r} | ${row.l} | ${row.s} | ${row.w} | ${row.total} | ${row.target} | ${row.notes.replace(/\|/g, "/")} |`
    );
  }

  lines.push("");
  lines.push("## 8. Tips para medir Speaking y Writing sin evaluador");
  for (const tip of TIPS) {
    lines.push(`- **${tip.title}** ${tip.body}`);
  }
  lines.push("");

  downloadBlob("plan-toefl-informe-completo.md", lines.join("\n"), "text/markdown;charset=utf-8");
}

export async function downloadFullPlanPdf(appData: AppData) {
  const { jsPDF } = await import("jspdf");
  const { autoTable } = await import("jspdf-autotable");
  const goal = computeGoalSummary(appData.baseline);
  const prize = computePrizeProgress(appData.studyLog, appData.baseline, appData.tracker.cp2);
  const streak = computeStreak(appData.studyLog);

  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 14;
  const contentWidth = pageWidth - marginLeft * 2;
  let y = 18;

  function ensureSpace(needed: number) {
    if (y + needed > pageHeight - 14) {
      doc.addPage();
      y = 18;
    }
  }

  function heading(text: string) {
    ensureSpace(12);
    doc.setFontSize(13);
    doc.setTextColor(20);
    doc.text(text, marginLeft, y);
    y += 6;
    doc.setFontSize(10);
    doc.setTextColor(60);
  }

  function paragraph(text: string) {
    const wrapped = doc.splitTextToSize(text, contentWidth) as string[];
    ensureSpace(wrapped.length * 5);
    doc.text(wrapped, marginLeft, y);
    y += wrapped.length * 5;
  }

  function table(head: string[], body: (string | number)[][]) {
    ensureSpace(16);
    autoTable(doc, {
      startY: y,
      head: [head],
      body,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [40, 40, 40] },
      margin: { left: marginLeft },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  doc.setFontSize(17);
  doc.setTextColor(20);
  doc.text("Plan TOEFL iBT — Informe completo", marginLeft, y);
  y += 7;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generado el ${todayStamp()} · ${PLAN_START_LABEL} al ${PLAN_END_LABEL} (${TOTAL_WEEKS} semanas) · Meta ${GOAL_SCORE}/120`, marginLeft, y);
  y += 10;

  heading("1. Premio (tablet)");
  paragraph(`Días de estudio: ${prize.studiedDays}/${prize.threshold} (umbral) de ${prize.expectedDays} esperados`);
  paragraph(`Constancia cumplida: ${yesNo(prize.consistencyMet)} · Progreso cumplido: ${yesNo(prize.progressMet)}`);
  paragraph(`Premio desbloqueado: ${yesNo(prize.unlocked)} · Racha actual: ${streak} días`);
  y += 3;

  heading("2. Metas");
  paragraph(
    `Diagnóstico R/L/S/W: ${appData.baseline.r ?? "—"} / ${appData.baseline.l ?? "—"} / ${appData.baseline.s ?? "—"} / ${
      appData.baseline.w ?? "—"
    }  ·  Total: ${goal.baselineTotal ?? "—"}  ·  Brecha: ${goal.baselineTotal !== null ? goal.gap : "—"}`
  );
  paragraph(
    `Metas — S4: ${goal.checkpointTargets.cp1 ?? "—"}  ·  S8: ${goal.checkpointTargets.cp2 ?? "—"}  ·  S12: ${
      goal.checkpointTargets.cp3 ?? "—"
    }  ·  S16: ${GOAL_SCORE}`
  );
  y += 3;

  heading("3. Calendario de estudio y ánimo");
  const logRows = studyLogRows(appData);
  if (logRows.length === 0) {
    paragraph("Sin registros aún.");
  } else {
    table(
      ["Fecha", "Estudió", "Ánimo", "Nota"],
      logRows.map((r) => [r.dateLabel, r.studied, String(r.mood), r.note])
    );
  }

  heading("4. Planning semanal");
  const planRows = weeklyPlanRows(appData);
  if (planRows.length === 0) {
    paragraph("Sin planes semanales registrados aún.");
  } else {
    table(
      ["Semana", "Día", "Hecho", "Plan"],
      planRows.map((r) => [r.weekLabel, r.day, r.done, r.text])
    );
  }

  heading("5. Las 17 semanas");
  table(
    ["Semana", "Fase", "Enfoque", "Horas", "Completada"],
    phaseRows(appData).map((r) => [r.week, r.phase, r.focus, r.hours, r.done])
  );

  heading("6. Ritmo semanal (referencia)");
  paragraph(RHYTHM_DAYS.map((d) => `${d.name}: ${d.task}`).join(" · "));
  for (const block of RHYTHM_HOUR_BLOCKS) {
    paragraph(`${block.title}: ${block.items.join("; ")}`);
  }
  y += 3;

  heading("7. Registro de progreso (checkpoints)");
  table(
    ["Checkpoint", ...SKILL_LABELS, "Total", "Meta", "Notas"],
    scoreTrackerRows(appData).map((row) => [row.checkpoint, row.r, row.l, row.s, row.w, row.total, row.target, row.notes])
  );

  heading("8. Tips: medir Speaking y Writing sin evaluador");
  for (const tip of TIPS) {
    paragraph(`${tip.title} ${tip.body}`);
  }

  doc.save("plan-toefl-informe-completo.pdf");
}
