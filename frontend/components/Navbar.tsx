"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { Sun, Moon, Languages, Menu } from "lucide-react";

export default function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark = 
      localStorage.getItem("theme") === "dark" || 
      (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-md py-4 px-6 md:px-12">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        
        {/* Brand Logo - Airbnb style */}
        <Link href="/" className="flex items-center gap-1.5 group select-none">
          <span className="text-2xl font-black tracking-tighter text-primary">fanly</span>
          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-black uppercase tracking-wider">gcp</span>
        </Link>

        {/* Category Tabs - Matches the image */}
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-foreground/70">
          <Link 
            href="/"
            className={`pb-1 border-b-2 hover:text-foreground transition-all flex flex-col items-center gap-0.5 ${
              pathname === "/" 
                ? "border-primary text-foreground font-bold" 
                : "border-transparent text-foreground/70"
            }`}
          >
            <span>Homes</span>
          </Link>
          <div className="relative group flex flex-col items-center cursor-pointer">
            <span className="absolute -top-3.5 bg-primary text-[8px] text-primary-foreground px-1 py-0.2 rounded font-black tracking-wide uppercase scale-90">NEW</span>
            <span className="text-foreground/60 hover:text-foreground transition-all pb-1 border-b-2 border-transparent">Experiences</span>
          </div>
          <div className="relative group flex flex-col items-center cursor-pointer">
            <span className="absolute -top-3.5 bg-primary text-[8px] text-primary-foreground px-1 py-0.2 rounded font-black tracking-wide uppercase scale-90">NEW</span>
            <span className="text-foreground/60 hover:text-foreground transition-all pb-1 border-b-2 border-transparent">Services</span>
          </div>
        </div>

        {/* Right Action Items */}
        <div className="flex items-center gap-4">
          <Link 
            href="/host/new"
            className="hidden sm:inline-block text-sm font-bold hover:bg-muted py-2.5 px-4 rounded-full transition-colors text-foreground/85 hover:text-foreground"
          >
            Become a host
          </Link>

          {/* Language Selector */}
          <div className="flex items-center gap-1 text-foreground/70">
            <Languages className="w-4 h-4" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer text-foreground pr-1"
            >
              <option value="en" className="dark:bg-card">EN</option>
              <option value="es" className="dark:bg-card">ES</option>
              <option value="pt" className="dark:bg-card">PT</option>
              <option value="fr" className="dark:bg-card">FR</option>
              <option value="ar" className="dark:bg-card">AR</option>
            </select>
          </div>

          {/* Theme Toggle */}
          <button 
            onClick={toggleDarkMode}
            className="p-2.5 rounded-full hover:bg-muted text-foreground/70 hover:text-foreground transition-all"
            aria-label="Toggle Theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-accent" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Profile Menu widget - Matches the user picture & layout */}
          <div className="flex items-center gap-3 border hover:shadow-md transition-shadow py-1.5 pl-3.5 pr-1.5 rounded-full bg-card cursor-pointer select-none">
            <Menu className="w-4 h-4 text-foreground/75" />
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden border">
              {/* Premium user avatar mock representing user photo */}
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80" 
                alt="Profile Avatar" 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}
