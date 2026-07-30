"use client";

import { PlanStoreProvider, usePlanStore } from "@/context/PlanStore";
import { LockScreen } from "@/components/LockScreen";
import { AppShell } from "@/components/AppShell";

function Screen() {
  const { status } = usePlanStore();
  if (status === "checking") return null;
  return status === "unlocked" ? <AppShell /> : <LockScreen />;
}

export function PlanApp() {
  return (
    <PlanStoreProvider>
      <Screen />
    </PlanStoreProvider>
  );
}
