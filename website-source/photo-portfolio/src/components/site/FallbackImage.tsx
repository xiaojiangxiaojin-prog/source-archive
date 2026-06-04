"use client";

import { useState } from "react";

export function FallbackImage({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(!src);

  if (failed || !src) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.16),transparent_28%),linear-gradient(135deg,#18181b,#050505)]">
        <div className="max-w-[80%] text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">Live Album</p>
          <p className="mt-3 text-xl font-semibold text-neutral-200">{alt}</p>
        </div>
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}
