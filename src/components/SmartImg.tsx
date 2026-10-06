import { useState, useEffect } from "react";

type Props = {
  src: string;
  /** One or more backup sources, tried in order if the primary fails. */
  fallback?: string | string[];
  alt: string;
  className?: string;
  /** Skip the shimmer placeholder (useful for tiny images). */
  bare?: boolean;
};

/** Image that walks a chain of sources until one loads. */
export default function SmartImg({ src, fallback, alt, className, bare }: Props) {
  const chain = [src, ...(Array.isArray(fallback) ? fallback : fallback ? [fallback] : [])].filter(
    Boolean
  );

  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // reset when the primary source changes (e.g. admin uploads a new photo)
  useEffect(() => {
    setIdx(0);
    setLoaded(false);
  }, [src]);

  const dead = idx >= chain.length;

  return (
    <div className="relative w-full h-full overflow-hidden bg-stone-100">
      {!loaded && !bare && (
        <div className="absolute inset-0 bg-gradient-to-br from-stone-200 via-stone-100 to-stone-200 animate-pulse" />
      )}
      {!dead && (
        <img
          src={chain[idx]}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setIdx((i) => i + 1)}
          className={className}
        />
      )}
      {dead && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-emerald-900 to-emerald-950 text-gold-200/60">
          <span className="text-2xl">🌿</span>
          <span className="text-[9px] tracking-[0.25em] uppercase">Vrinda Valley</span>
        </div>
      )}
    </div>
  );
}
