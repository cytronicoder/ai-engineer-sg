import type { InterestKey, RankedSession, Session } from "@/types";

export const INTEREST_RULES: Record<InterestKey, { label: string; keywords: string[] }> = {
  agents: { label: "Agents", keywords: ["agent", "agents", "autonomous", "workflow"] },
  coding: { label: "Coding", keywords: ["code", "coding", "developer", "repo", "pull request", "pr", "codex"] },
  evals: { label: "Evals", keywords: ["eval", "benchmark", "measure", "quality", "review", "reliability"] },
  infrastructure: { label: "Infrastructure", keywords: ["infra", "inference", "platform", "sandbox", "security", "runtime"] },
  design: { label: "Design", keywords: ["design", "ux", "interface", "creative", "human"] },
  "open-models": { label: "Open models", keywords: ["open model", "open-source", "model", "inference"] },
  robotics: { label: "Robotics", keywords: ["robot", "robotics", "embodied", "hardware"] },
  "singapore-ai": { label: "Singapore AI", keywords: ["singapore", "govtech", "government", "public service"] },
  research: { label: "Research", keywords: ["research", "search", "science", "evidence", "biology"] },
  "student-builders": { label: "Student builders", keywords: ["student", "builder", "learning", "education"] },
};

const normalize = (value: string): string => value.toLowerCase();

function sessionText(session: Session): string {
  return [
    session.title,
    session.description,
    session.room,
    session.venue,
    session.format,
    session.track,
    session.tags.join(" "),
    session.companyNames.join(" "),
    session.speakers.map((speaker) => [speaker.name, speaker.company, speaker.title, speaker.bio].join(" ")).join(" "),
  ]
    .filter(Boolean)
    .join(" ");
}

export function scoreSession(session: Session, selectedInterests: InterestKey[]): RankedSession {
  const text = normalize(sessionText(session));
  const matchedInterests: string[] = [];
  let score = 0;

  selectedInterests.forEach((interest) => {
    const rule = INTEREST_RULES[interest];
    const hits = rule.keywords.filter((keyword) => text.includes(normalize(keyword))).length;
    if (hits > 0) {
      score += hits;
      matchedInterests.push(rule.label);
    }
  });

  return {
    ...session,
    score,
    matchedInterests,
  };
}

export function rankSessions(sessions: Session[], selectedInterests: InterestKey[]): RankedSession[] {
  return sessions.map((session) => scoreSession(session, selectedInterests)).sort(sortByRecommended);
}

export function sortByTime<T extends Session>(a: T, b: T): number {
  return (a.startsAt ?? "").localeCompare(b.startsAt ?? "") || a.title.localeCompare(b.title);
}

export function sortByRecommended(a: RankedSession, b: RankedSession): number {
  return b.score - a.score || sortByTime(a, b);
}

export function getSessionDay(session: Session): string {
  if (session.day) return session.day.slice(0, 10);
  if (!session.startsAt) return "TBA";
  const date = new Date(session.startsAt);
  if (Number.isNaN(date.getTime())) return "TBA";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function sessionsOverlap(a: Session, b: Session): boolean {
  if (!a.startsAt || !a.endsAt || !b.startsAt || !b.endsAt) return false;
  const aStart = new Date(a.startsAt).getTime();
  const aEnd = new Date(a.endsAt).getTime();
  const bStart = new Date(b.startsAt).getTime();
  const bEnd = new Date(b.endsAt).getTime();
  if ([aStart, aEnd, bStart, bEnd].some(Number.isNaN)) return false;
  return aStart < bEnd && bStart < aEnd;
}
