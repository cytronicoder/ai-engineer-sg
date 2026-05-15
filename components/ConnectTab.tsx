"use client";

import {
  Download,
  ExternalLink,
  Link as LinkIcon,
  Pencil,
  QrCode,
  Share2,
  UserRound,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  type ConnectProfile,
  buildShareUrl,
  downloadVCard,
  getDefaultProfile,
  initialsFromName,
  isValidEmail,
  loadProfileFromLocalStorage,
  normalizeUrl,
  parseSharePayload,
  profileByteLength,
  saveProfileToLocalStorage,
} from "@/lib/connect-profile";

const fieldLimits = {
  fullName: 60,
  headline: 80,
  bio: 180,
  location: 60,
};

const formFields = [
  { key: "fullName" as const, label: "Name", limit: fieldLimits.fullName, placeholder: "Your name" },
  { key: "headline" as const, label: "Short intro", limit: fieldLimits.headline, placeholder: "Student builder" },
  { key: "bio" as const, label: "Bio", limit: fieldLimits.bio, placeholder: "A short bio", multiline: true },
  { key: "location" as const, label: "Location", limit: fieldLimits.location, placeholder: "Singapore" },
];

const linkFields = [
  { key: "linkedin" as const, label: "LinkedIn", placeholder: "linkedin.com/in/..." },
  { key: "instagram" as const, label: "Instagram", placeholder: "instagram.com/..." },
  { key: "twitter" as const, label: "X", placeholder: "x.com/..." },
  { key: "github" as const, label: "GitHub", placeholder: "github.com/..." },
  { key: "website" as const, label: "Website", placeholder: "yoursite.com" },
  { key: "research" as const, label: "Research", placeholder: "research page or portfolio" },
  { key: "email" as const, label: "Email", placeholder: "you@example.com" },
];

type ProfileField = keyof ConnectProfile;
type LinkItem = { key: string; label: string; href: string };
type ConnectMode = "public" | "edit";

export function ConnectTab({ onCopied }: { onCopied: (message: string) => void }) {
  const [profile, setProfile] = useState<ConnectProfile>(getDefaultProfile());
  const [draftProfile, setDraftProfile] = useState<ConnectProfile>(getDefaultProfile());
  const [sharedProfile, setSharedProfile] = useState<ConnectProfile | null>(null);
  const [parseError, setParseError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [mode, setMode] = useState<ConnectMode>("public");

  useEffect(() => {
    const savedProfile = loadProfileFromLocalStorage();
    const params = new URLSearchParams(window.location.search);
    const payload = params.get("p");
    const requestedMode = params.get("mode");

    setProfile(savedProfile);
    setDraftProfile(savedProfile);

    if (payload) {
      const parsed = parseSharePayload(payload);
      if (parsed) {
        setSharedProfile(parsed);
        setMode("public");
      } else {
        setParseError("Couldn't read this card. Try again.");
      }
    } else {
      setMode(requestedMode === "edit" ? "edit" : "public");
    }

    setHydrated(true);
  }, []);

  const publicProfile = sharedProfile ?? profile;
  const isSharedPublicView = Boolean(sharedProfile);
  const publicShareUrl = useMemo(() => (hydrated ? buildShareUrl(publicProfile) : ""), [hydrated, publicProfile]);
  const publicPayloadSize = useMemo(() => profileByteLength(publicProfile), [publicProfile]);
  const draftShareUrl = useMemo(() => (hydrated ? buildShareUrl(draftProfile) : ""), [hydrated, draftProfile]);
  const draftPayloadSize = useMemo(() => profileByteLength(draftProfile), [draftProfile]);

  const syncUrlMode = (nextMode: ConnectMode, clearPayload: boolean) => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", "connect");
    if (nextMode === "edit") {
      url.searchParams.set("mode", "edit");
    } else {
      url.searchParams.delete("mode");
    }
    if (clearPayload) url.searchParams.delete("p");
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  };

  const updateProfile = (key: ProfileField, value: string) => {
    setDraftProfile((current) => ({ ...current, [key]: value }));
  };

  const handleLinkBlur = (key: ProfileField) => {
    if (key === "email") return;
    updateProfile(key, normalizeUrl(draftProfile[key]));
  };

  const openEditMode = () => {
    setDraftProfile(profile);
    setMode("edit");
    syncUrlMode("edit", true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetDraft = () => setDraftProfile(getDefaultProfile());

  const clearDraft = () =>
    setDraftProfile({
      fullName: "",
      headline: "",
      bio: "",
      location: "",
      linkedin: "",
      instagram: "",
      twitter: "",
      github: "",
      website: "",
      research: "",
      email: "",
    });

  const saveDraft = () => {
    setProfile(draftProfile);
    saveProfileToLocalStorage(draftProfile);
    setSharedProfile(null);
    setMode("public");
    syncUrlMode("public", true);
    onCopied("Saved.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setDraftProfile(profile);
    setMode("public");
    syncUrlMode("public", true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const createOwnCard = () => {
    setDraftProfile(sharedProfile ?? profile);
    setSharedProfile(null);
    setParseError("");
    setMode("edit");
    syncUrlMode("edit", true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const copyText = async (text: string, message: string) => {
    await navigator.clipboard.writeText(text);
    onCopied(message);
  };

  const shareCard = async (url: string, name: string) => {
    if (navigator.share) {
      await navigator.share({ title: `${name || "My"} contact card`, url });
      return;
    }
    await copyText(url, "Link copied");
  };

  if (!hydrated) {
    return (
      <section className="space-y-4 pb-24 md:pb-0">
        <div className="surface rounded-2xl p-5">
          <p className="label">Connect</p>
          <div className="mt-4 h-64 animate-pulse rounded-2xl bg-white/[0.06]" />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 pb-24 md:pb-0">
      {parseError ? (
        <div className="surface rounded-2xl border border-red-400/30 p-4 text-sm leading-6 text-red-100">
          {parseError}
        </div>
      ) : null}

      {mode === "edit" ? (
        <EditConnectView
          profile={draftProfile}
          shareUrl={draftShareUrl}
          payloadSize={draftPayloadSize}
          onFieldChange={updateProfile}
          onLinkBlur={handleLinkBlur}
          onSave={saveDraft}
          onCancel={cancelEdit}
          onReset={resetDraft}
          onClear={clearDraft}
        />
      ) : (
        <PublicConnectView
          profile={publicProfile}
          shareUrl={publicShareUrl}
          payloadSize={publicPayloadSize}
          scannedView={isSharedPublicView}
          onCopyLink={() => copyText(publicShareUrl, "Link copied")}
          onShare={() => shareCard(publicShareUrl, publicProfile.fullName)}
          onSaveContact={() => downloadVCard(publicProfile)}
          onEdit={openEditMode}
          onCreateOwn={createOwnCard}
        />
      )}
    </section>
  );
}

function PublicConnectView({
  profile,
  shareUrl,
  payloadSize,
  scannedView,
  onCopyLink,
  onShare,
  onSaveContact,
  onEdit,
  onCreateOwn,
}: {
  profile: ConnectProfile;
  shareUrl: string;
  payloadSize: number;
  scannedView: boolean;
  onCopyLink: () => void;
  onShare: () => void;
  onSaveContact: () => void;
  onEdit: () => void;
  onCreateOwn: () => void;
}) {
  return (
    <>
      <div className="surface rounded-2xl p-5 text-center">
        <div className="flex justify-center">
          <Avatar profile={profile} />
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
          {profile.fullName || "New contact"}
        </h1>
        {profile.headline ? <p className="mt-2 text-base text-red-100">{profile.headline}</p> : null}
        {profile.bio ? (
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-zinc-300">{profile.bio}</p>
        ) : null}
        {profile.location ? <p className="mt-3 text-sm text-zinc-500">{profile.location}</p> : null}
      </div>

      <LinksSection profile={profile} />

      <div className="surface rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="label">Scan to connect</p>
          <QrCode className="h-5 w-5 text-red-300" />
        </div>
        <div className="mt-4 flex justify-center">
          <QRCard value={shareUrl} />
        </div>
        {payloadSize > 900 ? (
          <p className="mt-3 text-xs leading-5 text-amber-100">
            This QR may be hard to scan. Shorten your bio or links.
          </p>
        ) : null}
      </div>

      <div className="surface rounded-2xl p-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <ActionButton icon={LinkIcon} label="Copy link" onClick={onCopyLink} />
          <ActionButton icon={Share2} label="Share" onClick={onShare} />
          <ActionButton icon={Download} label="Save contact" onClick={onSaveContact} />
          {scannedView ? (
            <ActionButton
              icon={UserRound}
              label="Create my own card"
              onClick={onCreateOwn}
              className="sm:col-span-2"
            />
          ) : (
            <ActionButton icon={Pencil} label="Edit card" onClick={onEdit} className="sm:col-span-2" />
          )}
        </div>
      </div>
    </>
  );
}

function EditConnectView({
  profile,
  shareUrl,
  payloadSize,
  onFieldChange,
  onLinkBlur,
  onSave,
  onCancel,
  onReset,
  onClear,
}: {
  profile: ConnectProfile;
  shareUrl: string;
  payloadSize: number;
  onFieldChange: (key: ProfileField, value: string) => void;
  onLinkBlur: (key: ProfileField) => void;
  onSave: () => void;
  onCancel: () => void;
  onReset: () => void;
  onClear: () => void;
}) {
  return (
    <>
      <div className="surface rounded-2xl p-4">
        <p className="text-lg font-semibold text-white">Edit card</p>
        <p className="mt-1 text-sm text-zinc-400">Add your details. Your QR updates automatically.</p>
      </div>

      <div
        className="rounded-2xl border p-5"
        style={{ background: "rgba(239, 68, 68, 0.12)", borderColor: "rgba(239, 68, 68, 0.35)" }}
      >
        <div className="space-y-4">
          {formFields.map((field) => (
            <FieldInput
              key={field.key}
              label={field.label}
              value={profile[field.key]}
              placeholder={field.placeholder}
              limit={field.limit}
              multiline={"multiline" in field && field.multiline === true}
              onChange={(value) => onFieldChange(field.key, value)}
            />
          ))}
          {linkFields.map((field) => (
            <FieldInput
              key={field.key}
              label={field.label}
              value={profile[field.key]}
              placeholder={field.placeholder}
              type={field.key === "email" ? "email" : "text"}
              onChange={(value) => onFieldChange(field.key, value)}
              onBlur={() => onLinkBlur(field.key)}
            />
          ))}
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            className="focus-ring min-h-11 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 sm:col-span-2"
            onClick={onSave}
          >
            Save
          </button>
          <button
            type="button"
            className="focus-ring min-h-11 rounded-xl border border-white/10 bg-white/[0.08] px-4 py-2 text-sm font-medium text-white hover:border-red-400/40 hover:bg-red-500/10"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="focus-ring min-h-11 rounded-xl border border-white/10 bg-white/[0.08] px-4 py-2 text-sm font-medium text-white hover:border-red-400/40 hover:bg-red-500/10"
            onClick={onReset}
          >
            Reset
          </button>
          <button
            type="button"
            className="focus-ring min-h-11 rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-medium text-zinc-400 hover:border-red-400/40 sm:col-span-2"
            onClick={onClear}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="surface rounded-2xl p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="label">QR preview</p>
          <QrCode className="h-5 w-5 text-red-300" />
        </div>
        <div className="flex justify-center">
          <QRCard value={shareUrl} />
        </div>
        {payloadSize > 900 ? (
          <p className="mt-3 text-xs leading-5 text-amber-100">
            This QR may be hard to scan. Shorten your bio or links.
          </p>
        ) : null}
      </div>

      <div className="surface rounded-2xl p-5 text-center">
        <p className="label mb-4 text-left">Preview</p>
        <div className="flex justify-center">
          <Avatar profile={profile} />
        </div>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">
          {profile.fullName || "New contact"}
        </h2>
        {profile.headline ? <p className="mt-2 text-sm text-red-100">{profile.headline}</p> : null}
        {profile.bio ? (
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-300">{profile.bio}</p>
        ) : null}
        {profile.location ? <p className="mt-2 text-xs text-zinc-500">{profile.location}</p> : null}
      </div>
    </>
  );
}

function LinksSection({ profile }: { profile: ConnectProfile }) {
  const links = getVisibleLinks(profile);
  if (links.length === 0) return null;

  return (
    <div className="surface rounded-2xl p-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {links.map((link) => (
          <a
            key={link.key}
            href={link.href}
            target={link.href.startsWith("mailto:") ? undefined : "_blank"}
            rel={link.href.startsWith("mailto:") ? undefined : "noreferrer"}
            className="focus-ring inline-flex min-h-11 items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.08] px-4 py-2 text-sm font-medium text-white transition hover:border-red-400/40 hover:bg-red-500/10"
          >
            {link.label}
            <ExternalLink className="h-4 w-4 text-red-300" />
          </a>
        ))}
      </div>
    </div>
  );
}

function QRCard({ value }: { value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white p-4 text-center shadow-glow">
      <QRCodeSVG value={value || " "} size={240} bgColor="#ffffff" fgColor="#050505" level="M" marginSize={4} />
    </div>
  );
}

function Avatar({ profile }: { profile: ConnectProfile }) {
  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-red-300/20 bg-red-500/15 text-2xl font-semibold text-red-100 shadow-glow">
      {initialsFromName(profile.fullName)}
    </div>
  );
}

function FieldInput({
  label,
  value,
  placeholder,
  limit,
  multiline = false,
  type = "text",
  onChange,
  onBlur,
}: {
  label: string;
  value: string;
  placeholder?: string;
  limit?: number;
  multiline?: boolean;
  type?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}) {
  const sharedClasses =
    "focus-ring mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/[0.35] px-3 text-sm text-white placeholder:text-zinc-600";
  const shownValue = limit ? value.slice(0, limit) : value;

  return (
    <label className="block">
      <span className="flex items-center justify-between gap-3">
        <span className="label">{label}</span>
        {limit ? (
          <span className="text-xs text-zinc-500">
            {shownValue.length}/{limit}
          </span>
        ) : null}
      </span>
      {multiline ? (
        <textarea
          value={shownValue}
          {...(limit ? { maxLength: limit } : {})}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`${sharedClasses} min-h-24 py-3 leading-6`}
        />
      ) : (
        <input
          type={type}
          value={shownValue}
          {...(limit ? { maxLength: limit } : {})}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className={sharedClasses}
        />
      )}
    </label>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  className = "",
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.08] px-4 py-2 text-sm font-medium text-white transition hover:border-red-400/40 hover:bg-red-500/10 ${className}`}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function getVisibleLinks(profile: ConnectProfile): LinkItem[] {
  const items: LinkItem[] = [
    { key: "linkedin", label: "LinkedIn", href: normalizeUrl(profile.linkedin) },
    { key: "instagram", label: "Instagram", href: normalizeUrl(profile.instagram) },
    { key: "twitter", label: "X", href: normalizeUrl(profile.twitter) },
    { key: "github", label: "GitHub", href: normalizeUrl(profile.github) },
    { key: "website", label: "Website", href: normalizeUrl(profile.website) },
    { key: "research", label: "Research", href: normalizeUrl(profile.research) },
  ];

  if (isValidEmail(profile.email)) {
    items.push({ key: "email", label: "Email", href: `mailto:${profile.email.trim()}` });
  }

  return items.filter((item) => item.href);
}
