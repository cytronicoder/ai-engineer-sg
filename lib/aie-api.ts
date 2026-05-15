import type {Session, Speaker} from "@/types";

export const API_BASE = "https://aie.65labs.org/api/v1";

type ApiFetchOptions = RequestInit & {
    next?: {
        revalidate?: number;
    };
};

const asRecord = (value: unknown): Record<string, unknown> =>
    value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const asString = (value: unknown): string | undefined =>
    typeof value === "string" && value.trim() ? value.trim() : undefined;

const slug = (value: string): string =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

const readArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const arrayStrings = (value: unknown): string[] =>
    readArray(value)
        .map((item) => asString(item))
        .filter((item): item is string => Boolean(item));

async function fetchJson(path: string): Promise<unknown> {
    const response = await fetch(`${API_BASE}${path}`, {
        headers: {accept: "application/json"},
        next: {revalidate: 300},
    } as ApiFetchOptions);

    if (!response.ok) {
        throw new Error(`AIE API ${path} returned ${response.status}`);
    }

    return response.json();
}

function unwrapCollection(payload: unknown, key: "sessions" | "speakers"): unknown[] {
    if (Array.isArray(payload)) return payload;
    const record = asRecord(payload);
    const keyed = record[key];
    if (Array.isArray(keyed)) return keyed;
    const data = record.data;
    if (Array.isArray(data)) return data;
    const nested = asRecord(data)[key];
    if (Array.isArray(nested)) return nested;
    return [];
}

export async function fetchEvent(): Promise<unknown> {
    const payload = await fetchJson("/event");
    return asRecord(payload).event ?? payload;
}

export async function fetchSessions(): Promise<Session[]> {
    const payload = await fetchJson("/sessions?format=talk");
    return unwrapCollection(payload, "sessions").map((item, index) => normalizeSession(item, index));
}

export async function fetchSpeakers(): Promise<Speaker[]> {
    const payload = await fetchJson("/speakers?format=talk&order=name");
    return unwrapCollection(payload, "speakers").map((item, index) => normalizeSpeaker(item, index));
}

export function normalizeSpeaker(raw: unknown, index = 0): Speaker {
    const record = asRecord(raw);
    const name = asString(record.name) ?? asString(record.fullName) ?? asString(record.speakerName) ?? `Speaker ${index + 1}`;
    const company = asString(record.company) ?? asString(record.companyName) ?? asString(record.organization);
    const title = asString(record.title) ?? asString(record.role) ?? asString(record.jobTitle);
    const bio = asString(record.bio) ?? asString(record.description);
    const image = asString(record.imageUrl) ?? asString(record.image) ?? asString(record.avatarUrl);

    return {
        id: asString(record.id) ?? slug(`${name}-${company ?? index}`),
        name,
        title,
        company,
        bio,
        image,
    };
}

export function normalizeSession(raw: unknown, index = 0): Session {
    const record = asRecord(raw);
    const venue = asRecord(record.venue);
    const rawSpeakers = readArray(record.speakers);
    const speakers = rawSpeakers.map((item, speakerIndex) => normalizeSpeaker(item, speakerIndex));
    const tags = [
        ...arrayStrings(record.tags),
        ...arrayStrings(record.topics),
        asString(record.track),
        asString(record.format),
    ].filter((item): item is string => Boolean(item));
    const title = asString(record.title) ?? asString(record.name) ?? `Untitled session ${index + 1}`;
    const companyNames = speakers.map((item) => item.company).filter((item): item is string => Boolean(item));

    return {
        id: asString(record.id) ?? asString(record.sourceId) ?? slug(`${title}-${index}`),
        title,
        description: asString(record.description) ?? asString(record.summary),
        startsAt: asString(record.startsAt) ?? asString(record.start) ?? asString(record.startTime),
        endsAt: asString(record.endsAt) ?? asString(record.end) ?? asString(record.endTime),
        day: asString(record.day) ?? asString(record.date),
        room: asString(venue.room) ?? asString(record.room) ?? asString(venue.name),
        venue: asString(venue.name) ?? asString(record.venue) ?? asString(record.location),
        format: asString(record.format) ?? asString(record.type),
        track: asString(record.track),
        speakers,
        tags: Array.from(new Set(tags)),
        companyNames: Array.from(new Set(companyNames)),
    };
}
