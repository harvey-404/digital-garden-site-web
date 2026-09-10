import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { resolved, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      data-mode={resolved}
      aria-label={resolved === "light" ? "切换到暗色模式" : "切换到亮色模式"}
      className="dg-theme-switch"
    >
      <span className="dg-theme-switch__sky" aria-hidden="true">
        <span className="dg-theme-switch__sun" />
        <span className="dg-theme-switch__moon" />
        <span className="dg-theme-switch__knob" />
      </span>
    </button>
  );
}
