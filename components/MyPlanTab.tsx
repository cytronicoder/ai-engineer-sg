"use client";

import { AlertTriangle, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { SessionCard } from "@/components/SessionCard";
import { downloadICS, generateICS } from "@/lib/calendar";
import { getSessionDay, sessionsOverlap, sortByTime } from "@/lib/ranking";
import { getSessionStatus } from "@/lib/session-time";
import type { AppTab, Session } from "@/types";

function groupByDay(sessions: Session[]) {
  return sessions.reduce<Record<string, Session[]>>((groups, session) => {
    const day = getSessionDay(session);
    groups[day] = [...(groups[day] ?? []), session];
    return groups;
  }, {});
}

function conflictPairs(sessions: Session[]): Array<[Session, Session]> {
  const conflicts: Array<[Session, Session]> = [];
  sessions.forEach((session, index) => {
    sessions.slice(index + 1).forEach((other) => {
      if (sessionsOverlap(session, other)) conflicts.push([session, other]);
    });
  });
  return conflicts;
}

function formatTime(value?: string) {
  if (!value) return "Time TBA";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time TBA";
  return new Intl.DateTimeFormat("en-SG", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Singapore",
  }).format(date);
}

function itineraryText(sessions: Session[]): string {
  return sessions
    .map((session) => {
      const speakers = session.speakers.map((speaker) => speaker.name).join(", ");
      const location = [session.room, session.venue].filter(Boolean).join(", ");
      return [`${formatTime(session.startsAt)} - ${session.title}`, speakers, location]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

function googleCalendarUrl(session: Session): string | undefined {
  if (!session.startsAt || !session.endsAt) return undefined;
  const start = new Date(session.startsAt);
  const end = new Date(session.endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return undefined;
  const dates = `${start.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}/${end
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z")}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: session.title,
    dates,
    details: session.description ?? "",
    location: [session.room, session.venue].filter(Boolean).join(", "),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="px-1 text-sm font-semibold text-zinc-300">{children}</h2>;
}

export function MyPlanTab({
  savedSessions,
  exportSelectedIds,
  onRemove,
  onClear,
  onTabChange,
  onToggleExportSelected,
  onSetExportSelected,
  onCopied,
}: {
  savedSessions: Session[];
  exportSelectedIds: string[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onTabChange: (tab: AppTab) => void;
  onToggleExportSelected: (id: string) => void;
  onSetExportSelected: (ids: string[]) => void;
  onCopied: (message: string) => void;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const sorted = [...savedSessions].sort(sortByTime);

  const liveSessions = sorted.filter((s) => getSessionStatus(s, now) === "live");
  const upcomingSessions = sorted.filter((s) => {
    const status = getSessionStatus(s, now);
    return status === "upcoming" || status === "unknown";
  });
  const pastSessions = sorted.filter((s) => getSessionStatus(s, now) === "archived");

  const upcomingGrouped = groupByDay(upcomingSessions);
  const pastGrouped = groupByDay(pastSessions);

  const conflicts = conflictPairs(sorted);
  const conflictLookup = conflicts.reduce<Record<string, string[]>>((acc, [a, b]) => {
    acc[a.id] = [...(acc[a.id] ?? []), b.title];
    acc[b.id] = [...(acc[b.id] ?? []), a.title];
    return acc;
  }, {});

  const pastIds = new Set(pastSessions.map((s) => s.id));
  const exportableSessions = sorted.filter((s) => !pastIds.has(s.id));
  const exportSelectedSessions = exportableSessions.filter((s) => exportSelectedIds.includes(s.id));
  const exportAllSelected =
    exportableSessions.length > 0 && exportableSessions.every((s) => exportSelectedIds.includes(s.id));
  const exportText = itineraryText(exportSelectedSessions);

  function renderSessionWithConflict(session: Session) {
    const overlaps = conflictLookup[session.id] ?? [];
    return (
      <div key={session.id} className="space-y-2">
        <SessionCard
          session={session}
          saved
          removeMode
          now={now}
          onToggleSaved={() => onRemove(session.id)}
        />
        {overlaps.length > 0 ? (
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-100">
            Overlaps with {overlaps.slice(0, 2).join(", ")}
            {overlaps.length > 2 ? ` +${overlaps.length - 2} more` : ""}.
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <section className="space-y-4 pb-24 md:pb-0">
      <div className="surface rounded-2xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="label">AI Engineer Singapore 2026</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">My Schedule</h1>
          </div>
          <span className="chip shrink-0">{savedSessions.length} saved</span>
        </div>

        {savedSessions.length > 0 ? (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className="focus-ring min-h-11 rounded-xl border border-red-400/40 bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400"
              onClick={onClear}
            >
              Clear plan
            </button>
          </div>
        ) : null}
      </div>

      {conflicts.length > 0 ? (
        <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-100">
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="font-semibold">Overlaps with another saved session.</p>
          </div>
        </div>
      ) : null}

      {savedSessions.length === 0 ? (
        <div className="surface rounded-2xl p-6 text-sm text-zinc-400">
          <p>No sessions saved yet.</p>
          <p className="mt-2">Save sessions first, then export them here.</p>
          <button
            type="button"
            className="focus-ring mt-4 min-h-11 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400"
            onClick={() => onTabChange("schedule")}
          >
            Browse schedule
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {liveSessions.length > 0 ? (
            <div className="space-y-3">
              <SectionHeading>Live now</SectionHeading>
              {liveSessions.map(renderSessionWithConflict)}
            </div>
          ) : null}

          {upcomingSessions.length > 0 ? (
            <div className="space-y-3">
              <SectionHeading>Coming up</SectionHeading>
              {Object.entries(upcomingGrouped).map(([day, sessions]) => (
                <div key={day} className="space-y-3">
                  <p className="px-1 text-xs text-zinc-500">{day}</p>
                  {sessions.map(renderSessionWithConflict)}
                </div>
              ))}
            </div>
          ) : null}

          {pastSessions.length > 0 ? (
            <div className="space-y-3">
              <SectionHeading>Past sessions</SectionHeading>
              <p className="px-1 text-sm text-zinc-500">These sessions are over.</p>
              {Object.entries(pastGrouped).map(([day, sessions]) => (
                <div key={day} className="space-y-3">
                  <p className="px-1 text-xs text-zinc-500">{day}</p>
                  {sessions.map(renderSessionWithConflict)}
                </div>
              ))}
            </div>
          ) : null}

          <div className="surface rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="label">Export to calendar</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Export to calendar</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">Choose what to include.</p>
              </div>
              <button
                type="button"
                className="focus-ring rounded-lg px-2 py-1 text-xs font-medium text-red-200 hover:bg-red-500/10"
                onClick={() =>
                  onSetExportSelected(exportAllSelected ? [] : exportableSessions.map((s) => s.id))
                }
              >
                {exportAllSelected ? "Uncheck all" : "Check all"}
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <p className="text-xs text-zinc-500">Only checked sessions will be exported.</p>

              {exportableSessions.length === 0 && savedSessions.length > 0 ? (
                <p className="text-sm text-zinc-400">No upcoming sessions to export.</p>
              ) : null}

              {sorted.map((session) => {
                const isPast = pastIds.has(session.id);
                const checked = !isPast && exportSelectedIds.includes(session.id);
                const googleUrl = !isPast ? googleCalendarUrl(session) : undefined;

                return (
                  <div
                    key={session.id}
                    className={`rounded-2xl border border-white/10 bg-black/25 p-3 ${isPast ? "opacity-50" : ""}`}
                  >
                    <label
                      className={`flex items-start gap-3 ${isPast ? "cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-5 w-5 rounded border-zinc-700 bg-zinc-950 accent-red-500"
                        disabled={isPast}
                        checked={checked}
                        onChange={() => {
                          if (!isPast) onToggleExportSelected(session.id);
                        }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-mono text-xs text-red-300">
                          {formatTime(session.startsAt)}
                        </span>
                        <span className="mt-1 block text-sm font-semibold text-white">{session.title}</span>
                        {isPast ? (
                          <span className="mt-1 block text-xs text-zinc-500">
                            Past sessions can&apos;t be exported.
                          </span>
                        ) : null}
                      </span>
                    </label>
                    {googleUrl ? (
                      <a
                        className="focus-ring mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-zinc-200 hover:border-red-400/40"
                        href={googleUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Google Calendar
                      </a>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={exportSelectedSessions.length === 0}
                onClick={() => downloadICS("aie-pocket-schedule.ics", generateICS(exportSelectedSessions))}
              >
                <Download className="h-4 w-4" />
                Download calendar
              </button>
              <CopyButton
                text={exportText}
                label="Copy itinerary"
                copiedLabel="Itinerary copied"
                onCopied={onCopied}
                className={exportSelectedSessions.length === 0 ? "pointer-events-none opacity-40" : ""}
              />
            </div>

            <p className="mt-3 text-xs leading-5 text-zinc-500">Exports only your selected sessions.</p>
          </div>
        </div>
      )}
    </section>
  );
}
