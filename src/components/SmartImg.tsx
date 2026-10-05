import { useState } from "react";

type Props = {
  src: string;
  fallback?: string;
  alt: string;
  className?: string;
};

/** Image that silently swaps to a fallback if the primary source fails. */
export default function SmartImg({ src, fallback, alt, className }: Props) {
  const [current, setCurrent] = useState(src);
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-300 animate-pulse" />
      )}
      <img
        src={current}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (fallback && current !== fallback) setCurrent(fallback);
          else setLoaded(true);
        }}
        className={className}
      />
    </div>
  );
}
