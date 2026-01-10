import { Palette, Leaf, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { name: "utsav", label: "Utsav", icon: Sparkles, color: "text-orange-500" },
    { name: "bhakti", label: "Bhakti", icon: Palette, color: "text-indigo-500" },
    { name: "prakriti", label: "Prakriti", icon: Leaf, color: "text-emerald-500" },
  ];

  const currentTheme = themes.find((t) => t.name === theme) || themes[0];
  const Icon = currentTheme.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="w-10 h-10 rounded-full border-2 border-primary/20 hover:border-primary/50 transition-all bg-background/50 backdrop-blur-sm">
          <Icon className={`h-5 w-5 ${currentTheme.color} transition-all duration-300`} />
          <span className="sr-only">Switch Theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass border-primary/10 w-40">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.name}
            onClick={() => setTheme(t.name as any)}
            className="flex items-center gap-2 cursor-pointer focus:bg-primary/10 focus:text-primary"
          >
            <t.icon className={`h-4 w-4 ${t.color}`} />
            <span className={theme === t.name ? "font-semibold" : ""}>
              {t.label}
            </span>
            {theme === t.name && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
