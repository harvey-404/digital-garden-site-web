import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { resolved, toggle } = useTheme();
  const label = resolved === "light" ? "切换到暗色模式" : "切换到亮色模式";
  return (
    <button type="button" onClick={toggle} aria-label={label} title={label} className="garden-theme-toggle">
      {resolved === "light" ? <Moon size={19} aria-hidden="true" /> : <Sun size={19} aria-hidden="true" />}
    </button>
  );
}
