"use client";

import { Clipboard } from "lucide-react";
import { memo, useCallback } from "react";

export const CopyButton = memo(function CopyButton({
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
   const handleClick = useCallback(async () => {
     await navigator.clipboard.writeText(text);
     onCopied(copiedLabel);
   }, [text, copiedLabel, onCopied]);

   return (
     <button
       type="button"
       className={`focus-ring flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.08] px-4 py-2 text-sm font-medium text-white transition hover:border-red-400/40 hover:bg-red-500/10 ${className}`}
       onClick={handleClick}
     >
       <Clipboard className="h-4 w-4" />
       {label}
     </button>
   );
 });
