"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FilterBar } from "@/components/FilterBar";
import { SessionCard } from "@/components/SessionCard";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getSessionDay, rankSessions, sortByRecommended, sortByTime } from "@/lib/ranking";
import { isSessionArchived } from "@/lib/session-time";
import type { AppTab, DayFilter, InterestKey, Session, SortMode } from "@/types";

type ScheduleView = "active" | "archived";

function groupByDay(sessions: Session[]) {
  return sessions.reduce<Record<string, Session[]>>((groups, session) => {
    const day = getSessionDay(session);
    groups[day] = [...(groups[day] ?? []), session];
    return groups;
  }, {});
}

export function ScheduleTab({
  sessions,
  selectedInterests,
  savedIds,
  dayFilter,
  search,
  sortMode,
  onToggleInterest,
  onToggleSaved,
  onDayChange,
  onSearchChange,
  onSortChange,
  onTabChange,
}: {
  sessions: Session[];
  selectedInterests: InterestKey[];
  savedIds: string[];
  dayFilter: DayFilter;
  search: string;
  sortMode: SortMode;
  onToggleInterest: (interest: InterestKey) => void;
  onToggleSaved: (id: string) => void;
  onDayChange: (day: DayFilter) => void;
  onSearchChange: (value: string) => void;
  onSortChange: (sort: SortMode) => void;
  onTabChange: (tab: AppTab) => void;
}) {
  const [now, setNow] = useState(() => new Date());
  const [scheduleView, setScheduleView] = useState<ScheduleView>("active");

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const debouncedSearch = useDebouncedValue(search, 200);
  const debouncedQuery = debouncedSearch.trim().toLowerCase();

  const days = useMemo(
    () => Array.from(new Set(sessions.map(getSessionDay))).sort(),
    [sessions],
  );

  const searchableTextMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const session of sessions) {
      map.set(
        session.id,
        [
          session.title,
          session.description,
          session.room,
          session.venue,
          session.track,
          session.format,
          session.tags.join(" "),
          session.companyNames.join(" "),
          session.speakers
            .map((s) => [s.name, s.company, s.title].join(" "))
            .join(" "),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      );
    }
    return map;
  }, [sessions]);

  const ranked = useMemo(
    () => rankSessions(sessions, selectedInterests),
    [sessions, selectedInterests],
  );

  const filtered = useMemo(
    () =>
      ranked
        .filter((s) => dayFilter === "all" || getSessionDay(s) === dayFilter)
        .filter((s) => !debouncedQuery || (searchableTextMap.get(s.id) ?? "").includes(debouncedQuery))
        .filter((s) =>
          scheduleView === "archived" ? isSessionArchived(s, now) : !isSessionArchived(s, now),
        ),
    [ranked, dayFilter, debouncedQuery, searchableTextMap, scheduleView, now],
  );

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        if (sortMode === "time") return sortByTime(a, b);
        if (sortMode === "saved") {
          const aSaved = savedIds.includes(a.id) ? 1 : 0;
          const bSaved = savedIds.includes(b.id) ? 1 : 0;
          return bSaved - aSaved || sortByTime(a, b);
        }
        return sortByRecommended(a, b);
      }),
    [filtered, sortMode, savedIds],
  );

  const grouped = useMemo(() => groupByDay(sorted), [sorted]);

  const handleToggleSaved = useCallback(
    (id: string) => onToggleSaved(id),
    [onToggleSaved],
  );

  return (
    <section className="space-y-4 pb-24 md:pb-0">
      <div className="surface flex gap-1 rounded-2xl p-1">
        {(["active", "archived"] as ScheduleView[]).map((view) => (
          <button
            key={view}
            type="button"
            className={`focus-ring min-h-11 flex-1 rounded-xl px-4 py-2 text-sm font-medium transition ${
              scheduleView === view
                ? "bg-red-500 text-white shadow-glow"
                : "text-zinc-300 hover:bg-white/[0.08] hover:text-white"
            }`}
            onClick={() => setScheduleView(view)}
          >
            {view === "active" ? "Active" : "Archived"}
          </button>
        ))}
      </div>

      <FilterBar
        days={days}
        dayFilter={dayFilter}
        selectedInterests={selectedInterests}
        search={search}
        sortMode={sortMode}
        onDayChange={onDayChange}
        onInterestToggle={onToggleInterest}
        onSearchChange={onSearchChange}
        onSortChange={onSortChange}
      />

      {scheduleView === "archived" && sorted.length > 0 ? (
        <p className="px-1 text-sm text-zinc-500">These sessions are over.</p>
      ) : null}

      {sorted.length === 0 ? (
        <div className="surface rounded-2xl p-6 text-sm text-zinc-400">
          {scheduleView === "archived"
            ? "No archived sessions yet."
            : "No sessions match. Clear a filter or search again."}
        </div>
      ) : (
        Object.entries(grouped).map(([day, daySessions]) => (
          <div key={day} className="space-y-3">
            <div className="sticky top-[0.5rem] z-10 rounded-xl border border-white/10 bg-zinc-950/95 px-3 py-2 text-sm font-semibold text-zinc-200 backdrop-blur">
              {day === "TBA" ? "Date TBA" : day}
            </div>
            {daySessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                saved={savedIds.includes(session.id)}
                now={now}
                onToggleSaved={handleToggleSaved}
              />
            ))}
          </div>
        ))
      )}

      {savedIds.length > 0 ? (
        <button
          type="button"
          className="focus-ring fixed bottom-24 right-4 z-20 rounded-full bg-red-500 px-4 py-3 text-sm font-semibold text-white shadow-glow md:hidden"
          onClick={() => onTabChange("plan")}
        >
          My Plan ({savedIds.length})
        </button>
      ) : null}
    </section>
  );
}
