"use client";

import { RadioTower } from "lucide-react";
import type { ApiMode } from "@/types";

export function ApiStatus({ mode }: { mode: ApiMode }) {
  const live = mode === "live";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
        live
          ? "border-red-400/[0.35] bg-red-500/10 text-red-100"
          : "border-amber-400/25 bg-amber-500/10 text-amber-100"
      }`}
      aria-label={live ? "Live" : "Offline"}
    >
      <RadioTower className="h-3.5 w-3.5" />
      {live ? "Live" : "Offline"}
    </div>
  );
}
