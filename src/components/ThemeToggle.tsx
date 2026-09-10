import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { resolved, toggle } = useTheme();
  const toDark = resolved === "light";

  return (
    <button
      type="button"
      onClick={toggle}
      data-mode={resolved}
      aria-label={toDark ? "切换到暗色模式" : "切换到亮色模式"}
      className="dg-bulb"
    >
      <svg className="dg-bulb__icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          className="dg-bulb__glass"
          d="M12 3.2c-3.2 0-5.8 2.55-5.8 5.7 0 2.05 1.08 3.86 2.7 4.9.42.27.7.74.7 1.24V16.4c0 .55.45 1 1 1h2.8c.55 0 1-.45 1-1v-1.36c0-.5.28-.97.7-1.24 1.62-1.04 2.7-2.85 2.7-4.9 0-3.15-2.6-5.7-5.8-5.7z"
        />
        <path
          className="dg-bulb__filament"
          d="M10.2 11.1c.7.7 1.4.7 1.8.7s1.1 0 1.8-.7"
        />
        <path className="dg-bulb__base" d="M10.2 18.2h3.6M10.6 20.2h2.8" />
        <g className="dg-bulb__rays">
          <path d="M12 1.2v1.1" />
          <path d="M19.3 4.7l-.85.85" />
          <path d="M4.7 4.7l.85.85" />
          <path d="M21.6 11.2h-1.1" />
          <path d="M3.5 11.2H2.4" />
        </g>
      </svg>
    </button>
  );
}
