"use client";

import { CalendarDays, QrCode, Star } from "lucide-react";
import type { ComponentType } from "react";
import type { AppTab } from "@/types";

const tabs: Array<{
  key: AppTab;
  label: string;
  mobileLabel?: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { key: "schedule", label: "Schedule", icon: CalendarDays },
  { key: "plan", label: "My Plan", mobileLabel: "Plan", icon: Star },
  { key: "connect", label: "Connect", icon: QrCode },
];

export function BottomNav({
  activeTab,
  savedCount,
  onChange,
}: {
  activeTab: AppTab;
  savedCount: number;
  onChange: (tab: AppTab) => void;
}) {
  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 hidden border-t border-white/10 bg-zinc-950/95 px-4 py-2 backdrop-blur md:block">
        <div className="mx-auto grid max-w-5xl grid-cols-3 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                className={`focus-ring relative flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-red-500 text-white shadow-glow" : "text-zinc-300 hover:bg-white/[0.08] hover:text-white"
                }`}
                onClick={() => onChange(tab.key)}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.key === "plan" && savedCount > 0 ? <Badge count={savedCount} /> : null}
              </button>
            );
          })}
        </div>
      </nav>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-zinc-950/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-3 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            const label = tab.mobileLabel ?? tab.label;
            return (
              <button
                key={tab.key}
                type="button"
                className={`focus-ring relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[0.7rem] font-medium transition ${
                  active ? "bg-red-500 text-white" : "text-zinc-400 hover:bg-white/[0.08] hover:text-white"
                }`}
                onClick={() => onChange(tab.key)}
              >
                <Icon className="h-5 w-5" />
                {label}
                {tab.key === "plan" && savedCount > 0 ? <Badge count={savedCount} /> : null}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

function Badge({ count }: { count: number }) {
  return (
    <span className="absolute right-1 top-1 min-w-5 rounded-full bg-white px-1.5 py-0.5 text-center text-[0.65rem] font-bold text-red-600">
      {count}
    </span>
  );
}
