import type { Session } from "@/types";

export type SessionStatus = "upcoming" | "live" | "archived" | "unknown";

export function getSessionStatus(session: Session, now = new Date()): SessionStatus {
  if (!session.startsAt || !session.endsAt) return "unknown";
  const start = new Date(session.startsAt);
  const end = new Date(session.endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "unknown";
  const t = now.getTime();
  if (t < start.getTime()) return "upcoming";
  if (t <= end.getTime()) return "live";
  return "archived";
}

export function isSessionLive(session: Session, now = new Date()): boolean {
  return getSessionStatus(session, now) === "live";
}

export function isSessionArchived(session: Session, now = new Date()): boolean {
  return getSessionStatus(session, now) === "archived";
}

export function formatRelativeSessionTime(session: Session, now = new Date()): string {
  if (!session.startsAt) return "Time unknown";
  const start = new Date(session.startsAt);
  if (Number.isNaN(start.getTime())) return "Time unknown";

  const status = getSessionStatus(session, now);

  if (status === "live") return "Live now";

  if (status === "upcoming") {
    const diffMin = Math.round((start.getTime() - now.getTime()) / 60_000);
    if (diffMin <= 60) return `Starts in ${diffMin} min`;
    return `Starts at ${formatHour(start)}`;
  }

  if (status === "archived") {
    if (!session.endsAt) return "Ended";
    const end = new Date(session.endsAt);
    if (Number.isNaN(end.getTime())) return "Ended";
    const diffMin = Math.round((now.getTime() - end.getTime()) / 60_000);
    if (diffMin <= 60) return `Ended ${diffMin} min ago`;
    return "Ended";
  }

  return "Time unknown";
}

function formatHour(date: Date): string {
  return new Intl.DateTimeFormat("en-SG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Singapore",
  }).format(date);
}
