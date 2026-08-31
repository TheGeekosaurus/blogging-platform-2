'use client';

import { useState } from 'react';

/** Copies a value to the clipboard, for pasting into the editor. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard access can be refused; the URL is visible either way.
          setCopied(false);
        }
      }}
      className="text-xs underline"
    >
      {copied ? 'Copied' : label}
    </button>
  );
}
