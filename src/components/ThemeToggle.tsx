import { Button } from "@heroui/react";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "dark" | "light";

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.className = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    "content",
    theme === "dark" ? "#080b0f" : "#f2f5f3",
  );
  localStorage.setItem("uttt-theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() =>
    localStorage.getItem("uttt-theme") === "light" ? "light" : "dark",
  );

  useEffect(() => applyTheme(theme), [theme]);

  return (
    <Button
      isIconOnly
      variant="ghost"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      onPress={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  );
}
