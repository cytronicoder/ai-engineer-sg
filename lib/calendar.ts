import type {Session} from "@/types";

const TZID = "Asia/Singapore";

function escapeICS(value: string): string {
    return value
        .replace(/\\/g, "\\\\")
        .replace(/\n/g, "\\n")
        .replace(/,/g, "\\,")
        .replace(/;/g, "\\;");
}

function formatICSDate(value?: string): string {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const parts = new Intl.DateTimeFormat("en-SG", {
        timeZone: TZID,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).formatToParts(date);
    const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
    return `${get("year")}${get("month")}${get("day")}T${get("hour")}${get("minute")}${get("second")}`;
}

function eventDescription(session: Session): string {
    const speakers = session.speakers.map((speaker) => speaker.name).join(", ");
    return [session.description, speakers ? `Speakers: ${speakers}` : "", session.companyNames.length ? `Companies: ${session.companyNames.join(", ")}` : ""]
        .filter(Boolean)
        .join("\n");
}

function locationFor(session: Session): string {
    return [session.room, session.venue].filter(Boolean).join(", ");
}

export function generateICS(sessions: Session[]): string {
    const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    const events = sessions.map((session) => {
        const start = formatICSDate(session.startsAt);
        const end = formatICSDate(session.endsAt);
        const uid = `${session.id}@aie-pocket-schedule`;

        return [
            "BEGIN:VEVENT",
            `UID:${escapeICS(uid)}`,
            `DTSTAMP:${now}`,
            start ? `DTSTART;TZID=${TZID}:${start}` : "",
            end ? `DTEND;TZID=${TZID}:${end}` : "",
            `SUMMARY:${escapeICS(session.title)}`,
            `DESCRIPTION:${escapeICS(eventDescription(session))}`,
            `LOCATION:${escapeICS(locationFor(session))}`,
            "END:VEVENT",
        ]
            .filter(Boolean)
            .join("\r\n");
    });

    return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AIE Pocket Schedule//EN", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR"].join("\r\n");
}

export function downloadICS(filename: string, icsContent: string): void {
    const blob = new Blob([icsContent], {type: "text/calendar;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
}
