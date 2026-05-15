"use client";

import { Clipboard } from "lucide-react";

export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  onCopied,
  className = "",
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  onCopied: (message: string) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.08] px-4 py-2 text-sm font-medium text-white transition hover:border-red-400/40 hover:bg-red-500/10 ${className}`}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        onCopied(copiedLabel);
      }}
    >
      <Clipboard className="h-4 w-4" />
      {label}
    </button>
  );
}
