"use client";

import { useState } from "react";

/**
 * Referral link with copy and WhatsApp share. WhatsApp sharing is just a
 * prefilled wa.me link -- no bot, no API, per V1 scope.
 */
export function ShareLink({ url, code }: { url: string; code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const message = `Join me on ReferFlow and earn rewards! Sign up with my link: ${url}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <div>
      <label className="text-muted text-sm font-medium" htmlFor="referral-url">
        Your referral link
      </label>
      <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
        <input
          id="referral-url"
          readOnly
          value={url}
          className="border-border bg-canvas w-full rounded-lg border px-3 py-2 font-mono text-sm"
          onFocus={(e) => e.currentTarget.select()}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={copy}
            className="bg-brand hover:bg-brand-hover rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap text-white"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="border-border hover:bg-canvas rounded-lg border px-4 py-2 text-sm font-medium whitespace-nowrap"
          >
            Share
          </a>
        </div>
      </div>
      <p className="text-muted mt-2 text-xs">
        Code: <span className="font-mono">{code}</span>
      </p>
    </div>
  );
}
