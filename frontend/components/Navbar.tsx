"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { Sun, Moon, Languages, Menu } from "lucide-react";

export default function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout, setIsLoginModalOpen } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

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
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-md py-4 px-6 md:px-12 select-none">
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
          {(!user || user.role === "host") && (
            <Link 
              href="/host/new"
              className="hidden sm:inline-block text-sm font-bold hover:bg-muted py-2.5 px-4 rounded-full transition-colors text-foreground/85 hover:text-foreground"
            >
              Become a host
            </Link>
          )}

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

          {/* User Profile Menu widget */}
          <div 
            onClick={() => setShowDropdown(!showDropdown)}
            className={`relative flex items-center gap-3 border hover:shadow-md transition-all py-1.5 pl-3.5 pr-1.5 rounded-full bg-card cursor-pointer select-none ${
              user?.role === "host" 
                ? "border-accent/60 shadow-[0_0_12px_rgba(197,160,89,0.15)] bg-gradient-to-r from-card to-accent/5 hover:border-accent" 
                : "border-border"
            }`}
          >
            <Menu className="w-4 h-4 text-foreground/75" />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border transition-all ${
              user?.role === "host" ? "border-accent ring-2 ring-accent/20" : "border-border"
            }`}>
              {user ? (
                user.role === "host" ? (
                  <div className="w-full h-full bg-purple-600 rounded-full" />
                ) : (
                  <div className="w-full h-full bg-green-500 rounded-full" />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                  <svg className="w-4.5 h-4.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
              )}
            </div>
            {showDropdown && (
              <div className="absolute right-0 top-full mt-2.5 w-48 bg-card border border-border rounded-xl shadow-lg py-2.5 z-50 flex flex-col font-extrabold text-[11px] text-foreground uppercase tracking-wider animate-float-quick">
                {user ? (
                  <>
                    <div className="px-4 py-2 border-b border-border/40 text-[10px] text-muted-foreground normal-case font-semibold tracking-normal flex flex-col">
                      <span className="font-bold text-foreground truncate">{user.name}</span>
                      {user.role === "host" ? (
                        <span className="text-[9px] mt-0.5 font-black text-accent flex items-center gap-1">
                          🏆 Host Admin Pass
                        </span>
                      ) : (
                        <span className="capitalize text-[9px] mt-0.5 font-bold text-primary">
                          Fan / Guest Pass
                        </span>
                      )}
                    </div>
                    <Link href="/dashboard" className="px-4 py-2 hover:bg-muted text-left transition-colors">
                      My Dashboard
                    </Link>
                    {user.role === "host" && (
                      <Link href="/host/new" className="px-4 py-2 hover:bg-muted text-left transition-colors">
                        Create Host Space
                      </Link>
                    )}
                    <button 
                      onClick={() => { logout(); setShowDropdown(false); router.push("/"); }}
                      className="px-4 py-2 hover:bg-muted text-left border-t border-border/40 mt-1 pt-2 transition-colors font-extrabold text-[11px] text-red-500 uppercase tracking-wider"
                    >
                      {t("logout")}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setIsLoginModalOpen(true); setShowDropdown(false); }}
                      className="px-4 py-2 hover:bg-muted text-left transition-colors text-primary text-[11px]"
                    >
                      {t("login")}
                    </button>
                    <Link href="/host/new" className="px-4 py-2 hover:bg-muted text-left transition-colors">
                      Become a Host
                    </Link>
                  </>
                )}
                <Link href="/" className="px-4 py-2 hover:bg-muted text-left border-t border-border/40 mt-1 pt-2 transition-colors">
                  Home Search
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
