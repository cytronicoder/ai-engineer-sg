"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { INTEREST_OPTIONS } from "@/lib/fallback-data";
import type { DayFilter, InterestKey, SortMode } from "@/types";

export function FilterBar({
  days,
  dayFilter,
  selectedInterests,
  search,
  sortMode,
  onDayChange,
  onInterestToggle,
  onSearchChange,
  onSortChange,
}: {
  days: string[];
  dayFilter: DayFilter;
  selectedInterests: InterestKey[];
  search: string;
  sortMode: SortMode;
  onDayChange: (day: DayFilter) => void;
  onInterestToggle: (interest: InterestKey) => void;
  onSearchChange: (value: string) => void;
  onSortChange: (sort: SortMode) => void;
}) {
  return (
    <section className="surface rounded-2xl p-4">
      <details className="group" open>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <span>
            <span className="label flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-red-300" />
              Filters
            </span>
          </span>
          <span className="text-xs text-zinc-500 group-open:hidden">Open</span>
        </summary>

        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="label">Search</span>
            <div className="mt-2 flex min-h-12 items-center gap-2 rounded-xl border border-white/10 bg-black/[0.35] px-3">
              <Search className="h-4 w-4 text-zinc-500" />
              <input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search talks, speakers, companies..."
                className="focus-ring h-12 w-full bg-transparent text-sm text-white placeholder:text-zinc-600"
              />
            </div>
          </label>

          <div>
            <p className="label">Day</p>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {["all", ...days].map((day, index) => (
                <button
                  key={day}
                  type="button"
                  className={`focus-ring min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium transition ${
                    dayFilter === day
                      ? "border-red-400/50 bg-red-500/10 text-red-100"
                      : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-red-400/30"
                  }`}
                  onClick={() => onDayChange(day)}
                >
                  {day === "all" ? "All" : `Day ${index}`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="label">Interests</p>
            <p className="mt-1 text-sm text-zinc-400">Pick a few to sort the schedule.</p>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {INTEREST_OPTIONS.map((interest) => {
                const active = selectedInterests.includes(interest.key);
                return (
                  <button
                    key={interest.key}
                    type="button"
                    className={`focus-ring min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium transition ${
                      active
                        ? "border-red-400/50 bg-red-500/10 text-red-100"
                        : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-red-400/30"
                    }`}
                    onClick={() => onInterestToggle(interest.key)}
                  >
                    {interest.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="label">Sort</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[
                ["time", "Time"],
                ["recommended", "Recommended"],
                ["saved", "Saved first"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`focus-ring min-h-11 rounded-xl border px-2 text-sm font-medium transition ${
                    sortMode === value
                      ? "border-red-400/50 bg-red-500/10 text-red-100"
                      : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-red-400/30"
                  }`}
                  onClick={() => onSortChange(value as SortMode)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </details>
    </section>
  );
}
