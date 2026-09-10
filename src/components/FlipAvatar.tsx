import { useState } from "react";

const FALLBACK_PORTRAIT = "/portraits/studio.jpg";

interface FlipAvatarProps {
  initial: string;
  portraitUrl?: string | null;
  name: string;
}

export default function FlipAvatar({ initial, portraitUrl, name }: FlipAvatarProps) {
  const [flipped, setFlipped] = useState(false);
  const src = portraitUrl?.trim() || FALLBACK_PORTRAIT;

  return (
    <button
      type="button"
      className={`dg-flip mx-auto${flipped ? " is-flipped" : ""}`}
      aria-label={`${name} 的头像，悬停或点击翻转`}
      aria-pressed={flipped}
      onClick={() => {
        if (window.matchMedia("(hover: hover)").matches) return;
        setFlipped((v) => !v);
      }}
    >
      <span className="dg-flip__inner">
        <span className="dg-flip__face dg-flip__front font-serif text-4xl">{initial}</span>
        <span className="dg-flip__face dg-flip__back">
          <img src={src} alt={`${name} 的影棚肖像`} />
        </span>
      </span>
    </button>
  );
}
