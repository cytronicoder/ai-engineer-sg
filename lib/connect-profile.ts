export type ConnectProfile = {
  fullName: string;
  headline: string;
  bio: string;
  location: string;
  linkedin: string;
  instagram: string;
  twitter: string;
  github: string;
  website: string;
  research: string;
  email: string;
};

type CompactProfile = Partial<{
  n: string;
  h: string;
  b: string;
  l: string;
  li: string;
  ig: string;
  x: string;
  gh: string;
  w: string;
  r: string;
  e: string;
}>;

export const connectProfileStorageKey = "aie-pocket-connect-profile-v2";

const limits = {
  fullName: 60,
  headline: 80,
  bio: 180,
  location: 60,
};

export function getDefaultProfile(): ConnectProfile {
  return {
    fullName: "Peter Yao",
    headline: "Student builder",
    bio: "Computational biology, AI research tooling, and model evaluation.",
    location: "Singapore",
    linkedin: "https://www.linkedin.com/in/zeyuyaoy/",
    instagram: "https://www.instagram.com/zeyuyaoy/",
    twitter: "https://x.com/zeyuyaoy",
    github: "https://github.com/cytronicoder/",
    website: "https://cytronicoder.com/",
    research: "https://research.cytronicoder.com/",
    email: "cytronicoder+aiengineer2026@gmail.com",
  };
}

export function loadProfileFromLocalStorage(): ConnectProfile {
  if (typeof window === "undefined") return getDefaultProfile();

  try {
    const saved = window.localStorage.getItem(connectProfileStorageKey);
    return saved ? coerceProfile(JSON.parse(saved) as Partial<ConnectProfile>) : getDefaultProfile();
  } catch {
    return getDefaultProfile();
  }
}

export function saveProfileToLocalStorage(profile: ConnectProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(connectProfileStorageKey, JSON.stringify(coerceProfile(profile)));
}

export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (url.protocol === "http:" || url.protocol === "https:" || url.protocol === "mailto:") {
      return url.toString();
    }
  } catch {
    return "";
  }

  return "";
}

export function createSharePayload(profile: ConnectProfile): string {
  const normalized = normalizeProfile(profile);
  const compact: CompactProfile = {
    n: normalized.fullName,
    h: normalized.headline,
    b: normalized.bio,
    l: normalized.location,
    li: normalizeUrl(normalized.linkedin),
    ig: normalizeUrl(normalized.instagram),
    x: normalizeUrl(normalized.twitter),
    gh: normalizeUrl(normalized.github),
    w: normalizeUrl(normalized.website),
    r: normalizeUrl(normalized.research),
    e: normalized.email,
  };


  Object.entries(compact).forEach(([key, value]) => {
    if (!value) delete compact[key as keyof CompactProfile];
  });

  return encodeURIComponent(JSON.stringify(compact));
}

export function parseSharePayload(payload: string): ConnectProfile | null {
  try {
    const decoded = decodePayload(payload);
    const parsed = JSON.parse(decoded) as CompactProfile;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;

    return normalizeProfile({
      fullName: stringValue(parsed.n),
      headline: stringValue(parsed.h),
      bio: stringValue(parsed.b),
      location: stringValue(parsed.l),
      linkedin: normalizeUrl(stringValue(parsed.li)),
      instagram: normalizeUrl(stringValue(parsed.ig)),
      twitter: normalizeUrl(stringValue(parsed.x)),
      github: normalizeUrl(stringValue(parsed.gh)),
      website: normalizeUrl(stringValue(parsed.w)),
      research: normalizeUrl(stringValue(parsed.r)),
      email: stringValue(parsed.e),
    });
  } catch {
    return null;
  }
}

export function buildShareUrl(profile: ConnectProfile): string {
  if (typeof window === "undefined") return "";

  const params = new URLSearchParams();
  params.set("tab", "connect");
  params.set("p", createSharePayload(profile));
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

export function initialsFromName(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "?";
  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

export function createVCard(profile: ConnectProfile): string {
  const normalized = normalizeProfile(profile);
  const { firstName, lastName } = splitName(normalized.fullName);
  const urls = [
    normalized.website,
    normalized.github,
    normalized.linkedin,
    normalized.instagram,
    normalized.twitter,
    normalized.research,
  ]
    .map(normalizeUrl)
    .filter(Boolean);
  const noteParts = [normalized.bio, normalized.location ? `Location: ${normalized.location}` : "", ...urls]
    .filter(Boolean)
    .join("\\n");

  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVCard(lastName)};${escapeVCard(firstName)};;;`,
    `FN:${escapeVCard(normalized.fullName)}`,
    normalized.headline ? `TITLE:${escapeVCard(normalized.headline)}` : "",
    isValidEmail(normalized.email) ? `EMAIL:${escapeVCard(normalized.email)}` : "",
    normalizeUrl(normalized.website) ? `URL:${escapeVCard(normalizeUrl(normalized.website))}` : "",
    noteParts ? `NOTE:${escapeVCard(noteParts)}` : "",
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\n");
}

export function downloadVCard(profile: ConnectProfile): void {
  if (typeof document === "undefined") return;

  const blob = new Blob([createVCard(profile)], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${slugify(profile.fullName || "connect-card")}.vcf`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function normalizeProfile(profile: Partial<ConnectProfile>): ConnectProfile {
  return {
    fullName: limitText(stringValue(profile.fullName), limits.fullName),
    headline: limitText(stringValue(profile.headline), limits.headline),
    bio: limitText(stringValue(profile.bio), limits.bio),
    location: limitText(stringValue(profile.location), limits.location),
    linkedin: stringValue(profile.linkedin),
    instagram: stringValue(profile.instagram),
    twitter: stringValue(profile.twitter),
    github: stringValue(profile.github),
    website: stringValue(profile.website),
    research: stringValue(profile.research),
    email: stringValue(profile.email).trim(),
  };
}

function coerceProfile(profile: Partial<ConnectProfile>): ConnectProfile {
  return {
    fullName: rawStringValue(profile.fullName),
    headline: rawStringValue(profile.headline),
    bio: rawStringValue(profile.bio),
    location: rawStringValue(profile.location),
    linkedin: rawStringValue(profile.linkedin),
    instagram: rawStringValue(profile.instagram),
    twitter: rawStringValue(profile.twitter),
    github: rawStringValue(profile.github),
    website: rawStringValue(profile.website),
    research: rawStringValue(profile.research),
    email: rawStringValue(profile.email),
  };
}

export function profileByteLength(profile: ConnectProfile): number {
  return byteLength(buildPayloadJson(profile));
}


function buildPayloadJson(profile: ConnectProfile): string {
  return decodeURIComponent(createSharePayload(profile));
}

function decodePayload(payload: string): string {
  try {
    return decodeURIComponent(payload);
  } catch {
    return payload;
  }
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function rawStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function limitText(value: string, limit: number): string {
  return value.slice(0, limit);
}


function byteLength(value: string): number {
  if (typeof Blob !== "undefined") return new Blob([value]).size;
  return value.length;
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] ?? "", lastName: "" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts[parts.length - 1] };
}

function escapeVCard(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function slugify(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "connect-card"
  );
}
