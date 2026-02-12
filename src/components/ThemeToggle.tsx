import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";

interface ThemeToggleProps {
  variant?: "outline" | "ghost" | "default";
  size?: "sm" | "lg" | "icon";
  className?: string;
  showText?: boolean;
}

export const ThemeToggle = ({ 
  variant = "ghost", 
  size = "icon", 
  className = "",
  showText = false 
}: ThemeToggleProps) => {
  const { preferences, updatePreference, loading } = useUserPreferences();
  const [isDark, setIsDark] = useState(false);

  // Sync local toggle with stored preference
  useEffect(() => {
    if (loading) return;
    const shouldBeDark = preferences.theme_mode === "dark";
    setIsDark(shouldBeDark);
  }, [preferences.theme_mode, loading]);

  const applyThemeClass = (nextIsDark: boolean) => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(nextIsDark ? "dark" : "light");
  };

  const toggleTheme = async () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    applyThemeClass(nextIsDark);
    await updatePreference("theme_mode", nextIsDark ? "dark" : "light");
  };

  return (
    <Button 
      variant={variant} 
      size={size}
      className={`transition-smooth ${showText ? 'gap-2' : ''} ${className}`}
      onClick={toggleTheme}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <>
          <Moon className="h-4 w-4" />
          {showText && <span>Dark Mode</span>}
        </>
      ) : (
        <>
          <Sun className="h-4 w-4" />
          {showText && <span>Light Mode</span>}
        </>
      )}
    </Button>
  );
};
