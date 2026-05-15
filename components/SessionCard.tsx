"use client";

import {Check, Clipboard, Plus, Trash2} from "lucide-react";
import {memo, useMemo, useState} from "react";
import {getSessionStatus} from "@/lib/session-time";
import type {Session} from "@/types";

const timeFormatter = new Intl.DateTimeFormat("en-SG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Singapore",
});

const formatTime = (value?: string) => {
    if (!value) return "Time TBA";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Time TBA";
    return timeFormatter.format(date);
};

export const SessionCard = memo(function SessionCard({
                                                         session,
                                                         saved,
                                                         onToggleSaved,
                                                         removeMode = false,
                                                         now,
                                                     }: {
        session: Session & { matchedInterests?: string[] };
        saved: boolean;
        onToggleSaved: (id: string) => void;
        removeMode?: boolean;
        now?: Date;
    }) {
        const [detailsOpen, setDetailsOpen] = useState(false);
        const [questionCopied, setQuestionCopied] = useState(false);

        const status = now ? getSessionStatus(session, now) : undefined;
        const isLive = status === "live";
        const isArchived = status === "archived";

        const speakers = useMemo(
            () =>
                session.speakers
                    .map((s) => [s.name, s.company || s.title].filter(Boolean).join(" · "))
                    .join(", ") || "Speaker TBA",
            [session.speakers],
        );

        const location = useMemo(
            () => [session.room, session.venue].filter(Boolean).join(", "),
            [session.room, session.venue],
        );

        const track = useMemo(
            () => [session.track, session.format].filter(Boolean).join(" / "),
            [session.track, session.format],
        );

        const matchedInterests = session.matchedInterests?.slice(0, 2) ?? [];
        const visibleTags = session.tags.slice(0, Math.max(0, 3 - matchedInterests.length));
        const question = `What should I ask about ${session.title}?`;

        const copyQuestion = async () => {
            await navigator.clipboard.writeText(question);
            setQuestionCopied(true);
            window.setTimeout(() => setQuestionCopied(false), 1200);
        };

        const handleToggle = () => onToggleSaved(session.id);

        const cardClass = isLive
            ? "rounded-2xl border border-red-500/40 bg-[rgba(239,68,68,0.10)] p-4"
            : isArchived
                ? "surface rounded-2xl p-4 opacity-60"
                : "surface rounded-2xl p-4";

        return (
            <article className={cardClass} style={{contain: "layout"}}>
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="font-mono text-xs font-semibold text-red-300">
                                {formatTime(session.startsAt)}
                                {session.endsAt ? ` - ${formatTime(session.endsAt)}` : ""}
                            </p>
                            {isLive ? (
                                <span
                                    className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[0.65rem] font-semibold text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white"/>
                Live now
              </span>
                            ) : isArchived ? (
                                <span className="chip text-zinc-500">Ended</span>
                            ) : null}
                        </div>
                        <h3 className="mt-2 text-base font-semibold leading-snug text-white">{session.title}</h3>
                        <p className="mt-2 text-sm leading-5 text-zinc-400">{speakers}</p>
                    </div>

                    {removeMode ? (
                        <button
                            type="button"
                            className="focus-ring inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-red-400/40 bg-red-500/[0.16] px-3 py-2 text-sm font-semibold text-red-50 transition"
                            onClick={handleToggle}
                        >
                            <Trash2 className="h-4 w-4"/>
                            Remove
                        </button>
                    ) : isArchived ? (
                        <button
                            type="button"
                            className="inline-flex min-h-11 shrink-0 cursor-not-allowed items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-zinc-500"
                            disabled
                            aria-disabled="true"
                        >
                            Ended
                        </button>
                    ) : (
                        <button
                            type="button"
                            className={`focus-ring inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                                saved
                                    ? "border border-red-400/40 bg-red-500/[0.16] text-red-50"
                                    : "bg-red-500 text-white hover:bg-red-400"
                            }`}
                            onClick={handleToggle}
                            aria-pressed={saved}
                        >
                            {saved ? <Check className="h-4 w-4"/> : <Plus className="h-4 w-4"/>}
                            {saved ? "Saved" : "Save"}
                        </button>
                    )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                    {matchedInterests.map((interest) => (
                        <span key={interest} className="chip border-red-400/35 bg-red-500/[0.12] text-red-100">
            {interest}
          </span>
                    ))}
                    {visibleTags.map((tag) => (
                        <span key={tag} className="chip">
            {tag}
          </span>
                    ))}
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                    <button
                        type="button"
                        className="focus-ring rounded-lg px-2 py-1 text-xs font-medium text-zinc-300 hover:bg-white/[0.06]"
                        onClick={() => setDetailsOpen((current) => !current)}
                    >
                        {detailsOpen ? "Hide" : "Details"}
                    </button>
                    <button
                        type="button"
                        className="focus-ring rounded-lg px-2 py-1 text-xs font-medium text-red-200 hover:bg-red-500/10"
                        onClick={copyQuestion}
                    >
                        <Clipboard className="mr-1 inline h-3.5 w-3.5"/>
                        {questionCopied ? "Copied" : "Copy question"}
                    </button>
                </div>

                {detailsOpen ? (
                    <div
                        className="mt-3 space-y-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm leading-6 text-zinc-400">
                        <p>
                            <span className="font-medium text-zinc-200">Where:</span> {location || "TBA"}
                        </p>
                        <p>
                            <span className="font-medium text-zinc-200">With:</span> {speakers}
                        </p>
                        <p>
                            <span className="font-medium text-zinc-200">Track:</span> {track || "TBA"}
                        </p>
                        <p>
                            <span
                                className="font-medium text-zinc-200">Why go:</span> {session.description || "Worth a look."}
                        </p>
                        <p>
                            <span className="font-medium text-zinc-200">Question:</span> {question}
                        </p>
                    </div>
                ) : null}
            </article>
        );
    },
);
SessionCard.displayName = "SessionCard";
