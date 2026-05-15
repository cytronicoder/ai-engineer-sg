import type {Session} from "@/types";

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

