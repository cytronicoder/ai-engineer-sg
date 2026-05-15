"use client";

import { CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { ConnectTab } from "@/components/ConnectTab";
import { MyPlanTab } from "@/components/MyPlanTab";
import { ScheduleTab } from "@/components/ScheduleTab";
import { readJson, storageKeys, writeJson } from "@/lib/storage";
import type { AppTab, DayFilter, InterestKey, Session, SortMode } from "@/types";

const defaultInterests: InterestKey[] = ["agents", "coding", "evals", "infrastructure", "research"];
const validTabs = new Set<AppTab>(["schedule", "plan", "connect"]);
const legacyPlanExportSelectionKey = "aie-pocket-export-selected";

function normalizeTab(value: string | null): AppTab | undefined {
  if (value === "export") return "plan";
  if (value && validTabs.has(value as AppTab)) return value as AppTab;
  return undefined;
}

function readInitialTab(): AppTab {
  if (typeof window === "undefined") return "schedule";
  const queryTab = new URLSearchParams(window.location.search).get("tab");
  const normalizedQuery = normalizeTab(queryTab);
  if (normalizedQuery) return normalizedQuery;
  const hash = window.location.hash.replace("#", "");
  const normalizedHash = normalizeTab(hash);
  if (normalizedHash) return normalizedHash;
  return "schedule";
}

export function Shell({ sessions }: { sessions: Session[] }) {
  const [activeTab, setActiveTab] = useState<AppTab>("schedule");
  const [selectedInterests, setSelectedInterests] = useState<InterestKey[]>(defaultInterests);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [exportSelectedIds, setExportSelectedIds] = useState<string[]>([]);
  const [dayFilter, setDayFilter] = useState<DayFilter>("all");
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("time");
  const [copied, setCopied] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setActiveTab(readInitialTab());
    setSelectedInterests(readJson(storageKeys.interests, defaultInterests));
    setSavedIds(readJson(storageKeys.savedSessions, []));
    setExportSelectedIds(readJson(storageKeys.planExportSelection, readJson(legacyPlanExportSelectionKey, [])));
    setDayFilter(readJson(storageKeys.dayFilter, "all"));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const url = new URL(window.location.href);
    const queryTab = url.searchParams.get("tab");
    const normalizedQuery = normalizeTab(queryTab);
    const normalizedStored = normalizeTab(activeTab);

    if (queryTab === "export" || (queryTab && !normalizedQuery)) {
      url.searchParams.set("tab", "plan");
      window.history.replaceState(null, "", `${url.pathname}${url.search}`);
      return;
    }

    if (normalizedStored && queryTab !== normalizedStored) {
      url.searchParams.set("tab", normalizedStored);
      window.history.replaceState(null, "", `${url.pathname}${url.search}`);
    }
  }, [activeTab, hydrated]);

  useEffect(() => {
    if (hydrated) writeJson(storageKeys.interests, selectedInterests);
  }, [hydrated, selectedInterests]);

  useEffect(() => {
    if (hydrated) writeJson(storageKeys.savedSessions, savedIds);
  }, [hydrated, savedIds]);

  useEffect(() => {
    if (hydrated) writeJson(storageKeys.planExportSelection, exportSelectedIds);
  }, [hydrated, exportSelectedIds]);

  useEffect(() => {
    if (hydrated) writeJson(storageKeys.dayFilter, dayFilter);
  }, [hydrated, dayFilter]);

  useEffect(() => {
    if (hydrated) writeJson(storageKeys.tab, activeTab);
  }, [hydrated, activeTab]);

  useEffect(() => {
    setExportSelectedIds((current) => {
      const currentSaved = current.filter((id) => savedIds.includes(id));
      const newlySaved = savedIds.filter((id) => !current.includes(id));
      return [...currentSaved, ...newlySaved];
    });
  }, [savedIds]);

  const savedSessions = useMemo(
    () => sessions.filter((session) => savedIds.includes(session.id)),
    [sessions, savedIds],
  );

   const setTab = useCallback((tab: AppTab) => {
     setActiveTab(tab);
     if (typeof window !== "undefined") {
       const url = new URL(window.location.href);
       url.hash = "";
       url.searchParams.set("tab", tab);
       window.history.replaceState(null, "", `${url.pathname}${url.search}`);
       window.scrollTo({ top: 0, behavior: "smooth" });
     }
   }, []);

   const showCopied = useCallback((message: string) => {
     setCopied(message);
     const timeout = window.setTimeout(() => setCopied(null), 1600);
     return () => clearTimeout(timeout);
   }, []);

   const toggleInterest = useCallback((interest: InterestKey) => {
     setSelectedInterests((current) =>
       current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest],
     );
   }, []);

   const toggleSaved = useCallback((id: string) => {
     setSavedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
   }, []);

   const clearPlan = useCallback(() => {
     setSavedIds([]);
     setExportSelectedIds([]);
   }, []);

   const toggleExportSelected = useCallback((id: string) => {
     setExportSelectedIds((current) =>
       current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
     );
   }, []);

  return (
    <main className="min-h-screen bg-signal-bg">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pb-28 pt-4 md:px-6 md:pb-20 md:pt-6">
        {activeTab === "schedule" ? (
          <section className="rounded-2xl py-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="focus-ring min-h-11 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400"
                onClick={() => setTab("connect")}
              >
                Connect with others
              </button>
              <button
                type="button"
                className="focus-ring min-h-11 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white hover:border-red-400/40 hover:bg-red-500/10"
                onClick={() => setTab("plan")}
              >
                View my plan
              </button>
            </div>
          </section>
        ) : null}

        {activeTab === "schedule" ? (
          <ScheduleTab
            sessions={sessions}
            selectedInterests={selectedInterests}
            savedIds={savedIds}
            dayFilter={dayFilter}
            search={search}
            sortMode={sortMode}
            onToggleInterest={toggleInterest}
            onToggleSaved={toggleSaved}
            onDayChange={setDayFilter}
            onSearchChange={setSearch}
            onSortChange={setSortMode}
            onTabChange={setTab}
          />
        ) : null}

        {activeTab === "plan" ? (
          <MyPlanTab
            savedSessions={savedSessions}
            exportSelectedIds={exportSelectedIds}
            onRemove={toggleSaved}
            onClear={clearPlan}
            onTabChange={setTab}
            onToggleExportSelected={toggleExportSelected}
            onSetExportSelected={setExportSelectedIds}
            onCopied={showCopied}
          />
        ) : null}

        {activeTab === "connect" ? <ConnectTab onCopied={showCopied} /> : null}

        {copied ? (
          <div className="fixed bottom-24 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-red-400/30 bg-zinc-950/95 px-4 py-2 text-sm text-red-50 shadow-glow md:bottom-20">
            <CheckCircle2 className="h-4 w-4 text-red-300" />
            {copied}
          </div>
        ) : null}
      </div>

      <BottomNav activeTab={activeTab} savedCount={savedIds.length} onChange={setTab} />
    </main>
  );
}
