
'use client';

import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

export const themes = [
    {
        name: 'Poppy',
        id: 'theme-default',
        colors: ['#FF420E', '#80BD9E', '#F98866']
    },
    {
        name: 'Light',
        id: 'theme-light',
        colors: ['#3b82f6', '#f1f5f9', '#1e293b']
    },
    {
        name: 'Forest',
        id: 'theme-forest',
        colors: ['#16a34a', '#f0fdf4', '#14532d']
    },
    {
        name: 'Candy',
        id: 'theme-candy',
        colors: ['#ec4899', '#fff1f2', '#831843']
    },
    {
        name: 'Ocean',
        id: 'theme-ocean',
        colors: ['#0ea5e9', '#f0f9ff', '#0c4a6e']
    },
    {
        name: 'Sunset',
        id: 'theme-sunset',
        colors: ['#f97316', '#262626', '#fafafa']
    },
    {
        name: 'Aurora',
        id: 'theme-aurora',
        colors: ['#a855f7', '#4c1d95', '#f5f3ff'],
    },
    {
        name: 'Sakura',
        id: 'theme-sakura',
        colors: ['#f472b6', '#fff1f7', '#500724'],
    },
    {
        name: 'Pro',
        id: 'theme-pro',
        colors: ['#111827', '#f3f4f6', '#9ca3af']
    },
    {
        name: 'Mint',
        id: 'theme-mint',
        colors: ['#10b981', '#f0fdfa', '#047857']
    },
    {
        name: 'Dramatic',
        id: 'theme-dramatic',
        colors: ['#AEBD38', '#68829E', '#505160']
    },
    {
        name: 'Tulip',
        id: 'theme-tulip',
        colors: ['#F18D9E', '#5BC8AC', '#E6D72A']
    },
    {
        name: 'Hibiscus',
        id: 'theme-hibiscus',
        colors: ['#F52549', '#9BC01C', '#FFD64D']
    },
    {
        name: 'Alpine',
        id: 'theme-alpine',
        colors: ['#34675C', '#4CB5F5', '#B3C100']
    }
];

interface ThemeSwitcherProps {
    selectedTheme: string;
    onThemeChange: (themeId: string) => void;
}

export function ThemeSwitcher({ selectedTheme, onThemeChange }: ThemeSwitcherProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {themes.map((theme) => (
                <div key={theme.id} onClick={() => onThemeChange(theme.id)} className="cursor-pointer">
                    <div
                        className={cn(
                            'rounded-lg border-2 p-2 transition-all',
                            selectedTheme === theme.id ? 'border-primary' : 'border-transparent hover:border-muted-foreground/50'
                        )}
                    >
                        <div
                            className="h-16 w-full rounded-md flex items-center justify-center"
                            style={{ background: theme.gradient ? theme.gradient : theme.colors[0] }}
                        >
                            <div className="flex -space-x-2">
                                {theme.colors.map((color, index) => (
                                    <div
                                        key={index}
                                        className="h-6 w-6 rounded-full border-2 border-white/50"
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                     <div className="mt-2 flex items-center justify-center gap-2">
                        {selectedTheme === theme.id && <CheckCircle className="h-4 w-4 text-primary" />}
                        <span className="text-sm font-medium">{theme.name}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
