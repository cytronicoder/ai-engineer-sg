import { Shell } from "@/components/Shell";
import { fetchSessions } from "@/lib/aie-api";
import { fallbackSessions } from "@/lib/fallback-data";
import type { ApiMode, Session } from "@/types";

export const dynamic = "force-dynamic";

export default async function Page() {
  let sessions: Session[] = fallbackSessions;
  let apiMode: ApiMode = "fallback";

  try {
    const liveSessions = await fetchSessions();
    if (liveSessions.length > 0) {
      sessions = liveSessions;
      apiMode = "live";
    }
  } catch {
    sessions = fallbackSessions;
  }

  return <Shell sessions={sessions} apiMode={apiMode} />;
}
