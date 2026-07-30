"use client";

import dynamic from "next/dynamic";

// The whole app reads/writes localStorage and Web Crypto in the browser, so it's
// mounted client-only — there is nothing meaningful to server-render here.
const PlanApp = dynamic(() => import("@/components/PlanApp").then((m) => m.PlanApp), {
  ssr: false,
});

export default function Home() {
  return <PlanApp />;
}
