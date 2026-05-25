"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <button
      onClick={copy}
      className="group w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] hover:border-[color:var(--color-border-strong)] font-mono text-xs text-left"
    >
      <code className="truncate text-[color:var(--color-fg)]">$ {command}</code>
      {copied ? (
        <Check className="w-3.5 h-3.5 text-[color:var(--color-success)] shrink-0" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-[color:var(--color-fg-subtle)] group-hover:text-[color:var(--color-fg)] shrink-0" />
      )}
    </button>
  );
}
