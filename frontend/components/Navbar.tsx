"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { Sun, Moon, Languages, Calendar, User, Search, PlusCircle } from "lucide-react";

export default function Navbar() {
  const { language, setLanguage, t, isRtl } = useLanguage();
  const pathname = usePathname();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check local storage or system preference
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
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-md glass-panel py-3 px-4 md:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        
        {/* Logo and Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl md:text-3xl animate-pulse-slow">⚽</span>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl md:text-2xl tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent group-hover:opacity-85 transition-opacity">
              {t("logo")}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider hidden sm:inline">
              {t("tagline")}
            </span>
          </div>
        </Link>

        {/* Navigation Actions */}
        <nav className="flex items-center gap-2 md:gap-4">
          <Link 
            href="/"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              pathname === "/" 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "hover:bg-muted text-foreground/80 hover:text-foreground"
            }`}
          >
            <Search className="w-4 h-4" />
            <span className="hidden md:inline">{t("home")}</span>
          </Link>

          <Link 
            href="/host/new"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              pathname === "/host/new" 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "hover:bg-muted text-foreground/80 hover:text-foreground"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden md:inline">{t("host")}</span>
          </Link>

          <Link 
            href="/dashboard"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              pathname === "/dashboard" 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "hover:bg-muted text-foreground/80 hover:text-foreground"
            }`}
          >
            <User className="w-4 h-4" />
            <span className="hidden md:inline">{t("dashboard")}</span>
          </Link>

          <div className="h-6 w-[1px] bg-border mx-1" />

          {/* Theme Toggle */}
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            aria-label="Toggle Theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-accent" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Language Selector */}
          <div className="relative flex items-center gap-1">
            <Languages className="w-4 h-4 text-muted-foreground" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-transparent text-xs md:text-sm font-semibold focus:outline-none cursor-pointer text-foreground pr-1"
            >
              <option value="en" className="dark:bg-card">EN</option>
              <option value="es" className="dark:bg-card">ES</option>
              <option value="pt" className="dark:bg-card">PT</option>
              <option value="fr" className="dark:bg-card">FR</option>
              <option value="ar" className="dark:bg-card">AR</option>
            </select>
          </div>
        </nav>

      </div>
    </header>
  );
}
